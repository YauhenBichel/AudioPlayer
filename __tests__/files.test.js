import { pick, keepLocalCopy, errorCodes } from '@react-native-documents/picker';
import { exists, moveFile, unlink } from '@dr.pogodin/react-native-fs';
import { deleteRecordFile, pickAudioFiles } from '../src/services/files';

jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn(),
  keepLocalCopy: jest.fn(),
  isErrorWithCode: (e) => !!(e && e.code),
  types: { audio: 'audio/*' },
  errorCodes: { OPERATION_CANCELED: 'OPERATION_CANCELED' },
}));

jest.mock('@dr.pogodin/react-native-fs', () => ({
  DocumentDirectoryPath: '/docs',
  exists: jest.fn(),
  mkdir: jest.fn(),
  moveFile: jest.fn(),
  unlink: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('files', () => {
  describe('pickAudioFiles', () => {
    it('handles two files from one pick sharing one copy folder correctly', async () => {
      const mockResponse = [
        { uri: 'content://media/audio%3A1', name: 'First Song.wav' },
        { uri: 'content://media/audio%3A2', name: 'Second Song.m4a' },
      ];

      const mockKeepLocalCopyResponse = [
        { sourceUri: 'content://media/audio%3A1', localUri: 'file:///docs/uuid-1/First%20Song.wav', status: 'success' },
        { sourceUri: 'content://media/audio%3A2', localUri: 'file:///docs/uuid-1/Second%20Song.m4a', status: 'success' },
      ];

      pick.mockResolvedValue(mockResponse);
      keepLocalCopy.mockResolvedValue(mockKeepLocalCopyResponse);
      exists.mockResolvedValue(true);
      moveFile.mockResolvedValue();

      const result = await pickAudioFiles();

      expect(pick).toHaveBeenCalledWith({ type: ['audio/*'], allowMultiSelection: true });
      expect(keepLocalCopy).toHaveBeenCalledWith({
        files: expect.any(Array),
        destination: 'documentDirectory',
      });

      // Check moveFile calls in correct order
      const moveFileCalls = moveFile.mock.calls;
      expect(moveFileCalls.length).toBe(2);

      // First move: from decoded path of first file
      expect(moveFileCalls[0][0]).toBe('/docs/uuid-1/First Song.wav');
      // Second move: from decoded path of second file
      expect(moveFileCalls[1][0]).toBe('/docs/uuid-1/Second Song.m4a');

      // Check unlink is called exactly once for the shared UUID folder
      expect(unlink).toHaveBeenCalledTimes(1);
      expect(unlink).toHaveBeenCalledWith('/docs/uuid-1');

      // Verify call order: both moveFile calls must happen before unlink
      const moveFileCallOrder1 = moveFile.mock.invocationCallOrder[0];
      const moveFileCallOrder2 = moveFile.mock.invocationCallOrder[1];
      const unlinkCallOrder = unlink.mock.invocationCallOrder[0];

      expect(moveFileCallOrder1).toBeLessThan(unlinkCallOrder);
      expect(moveFileCallOrder2).toBeLessThan(unlinkCallOrder);

      expect(result.records.length).toBe(2);
      expect(result.records[0].title).toBe('First Song');
      expect(result.records[1].title).toBe('Second Song');
      expect(result.failed).toBe(0);
    });

    it('extracts title and extension from picked name, not sourceUri', async () => {
      const mockResponse = [{ uri: 'content://media/audio%3A1', name: 'My Song.m4a' }];
      const mockKeepLocalCopyResponse = [
        { sourceUri: 'content://media/audio%3A1', localUri: 'file:///docs/uuid-2/My%20Song.m4a', status: 'success' },
      ];

      pick.mockResolvedValue(mockResponse);
      keepLocalCopy.mockResolvedValue(mockKeepLocalCopyResponse);
      exists.mockResolvedValue(true);
      moveFile.mockResolvedValue();

      const result = await pickAudioFiles();

      expect(result.records.length).toBe(1);
      expect(result.records[0].title).toBe('My Song');
      expect(result.records[0].url).toMatch(/\.m4a$/);
    });

    it('handles cancellation gracefully', async () => {
      pick.mockRejectedValue({ code: errorCodes.OPERATION_CANCELED });

      const result = await pickAudioFiles();

      expect(result).toEqual({ records: [], failed: 0 });
      expect(pick).toHaveBeenCalled();
    });

    it('counts failed copies in failed count', async () => {
      const mockResponse = [
        { uri: 'content://media/audio%3A1', name: 'Good Song.mp3' },
        { uri: 'content://media/audio%3A2', name: 'Bad Song.mp3' },
      ];

      const mockKeepLocalCopyResponse = [
        { sourceUri: 'content://media/audio%3A1', localUri: 'file:///docs/uuid-3/Good%20Song.mp3', status: 'success' },
        { sourceUri: 'content://media/audio%3A2', localUri: 'file:///media/audio%3A2', status: 'error', copyError: 'Permission denied' },
      ];

      pick.mockResolvedValue(mockResponse);
      keepLocalCopy.mockResolvedValue(mockKeepLocalCopyResponse);
      exists.mockResolvedValue(true);
      moveFile.mockResolvedValue();

      const result = await pickAudioFiles();

      expect(result.records.length).toBe(1);
      expect(result.records[0].title).toBe('Good Song');
      expect(result.failed).toBe(1);
    });
  });

  describe('deleteRecordFile', () => {
    it('unlinks the file when it exists', async () => {
      exists.mockResolvedValue(true);
      unlink.mockResolvedValue();

      await deleteRecordFile('file:///docs/records/a.wav');

      expect(exists).toHaveBeenCalledWith('/docs/records/a.wav');
      expect(unlink).toHaveBeenCalledWith('/docs/records/a.wav');
    });

    it('does not throw when unlink fails', async () => {
      exists.mockResolvedValue(true);
      unlink.mockRejectedValue(new Error('unlink failed'));

      await expect(deleteRecordFile('file:///docs/records/a.wav')).resolves.not.toThrow();
    });

    it('does nothing for non-file:// URLs', async () => {
      await deleteRecordFile('https://example.com/audio.mp3');

      expect(exists).not.toHaveBeenCalled();
      expect(unlink).not.toHaveBeenCalled();
    });
  });
});
