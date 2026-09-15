import {
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  pick,
  types,
} from '@react-native-documents/picker';
import { DocumentDirectoryPath, exists, mkdir, moveFile, unlink } from '@dr.pogodin/react-native-fs';

export const PLAYLIST_DIR = `${DocumentDirectoryPath}/records`;

export async function resetPlaylistDir() {
  try {
    if (await exists(PLAYLIST_DIR)) {
      await unlink(PLAYLIST_DIR);
    }
    await mkdir(PLAYLIST_DIR);
  } catch (e) {
    console.warn('resetPlaylistDir error:', e);
  }
}

export async function pickAudioFiles() {
  try {
    const response = await pick({
      allowMultiSelection: true,
      type: [types.audio],
    });

    if (!response || response.length === 0) {
      // User cancelled or no selection
      return { records: [], failed: 0 };
    }

    const records = [];
    let failed = 0;
    // keepLocalCopy puts every file from one pick in the SAME random folder, so
    // it can only be removed once all of them have been moved out. Removing it
    // after the first move deleted the rest of the pick.
    const copyDirs = new Set();

    // Step 1: Keep local copies (converts content:// URIs to local files)
    const filesToCopy = response.map((item) => ({
      uri: item.uri,
      fileName: item.name || 'Audio.mp3',
    }));

    const copyResults = await keepLocalCopy({
      files: filesToCopy,
      destination: 'documentDirectory',
    });

    // Step 2: Process each copy result and match to original picked item
    for (const result of copyResults) {
      if (result.status !== 'success') {
        failed++;
        continue;
      }

      const { localUri, sourceUri } = result;
      // Find the original picked item that produced this copy result
      const originalItem = response.find(item => item.uri === sourceUri);
      const name = originalItem?.name || 'Audio.mp3';
      const title = name ? name.replace(/\.[^/.]+$/, '') : 'Audio';
      const ext = (name?.match(/\.([^.]+)$/) || [])[1] || 'mp3';

      // Decode localUri (may be percent-encoded) and strip 'file://'
      const decodedPath = decodeURIComponent(localUri.replace(/^file:\/\//, ''));

      // Generate unique filename for playlist
      // Unique per file even within one multi-select, which can land in the same millisecond.
      const newFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
      const destPath = `${PLAYLIST_DIR}/${newFileName}`;

      try {
        // Move file to playlist directory
        await moveFile(decodedPath, destPath);

        const parentDir = decodedPath.substring(0, decodedPath.lastIndexOf('/'));
        if (parentDir !== DocumentDirectoryPath && parentDir !== PLAYLIST_DIR) {
          copyDirs.add(parentDir);
        }

        records.push({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          title,
          url: `file://${destPath}`,
        });
      } catch (e) {
        failed++;
        console.warn('moveFile error:', e);
      }
    }

    for (const dir of copyDirs) {
      try {
        await unlink(dir);
      } catch (e) {
        // A leftover empty folder is harmless; never fail the pick over it.
      }
    }

    return { records, failed };
  } catch (e) {
    // Handle cancellation silently
    if (isErrorWithCode(e) && e.code === errorCodes.OPERATION_CANCELED) {
      return { records: [], failed: 0 };
    }
    console.warn('pickAudioFiles error:', e);
    return { records: [], failed: 1 };
  }
}

export async function deleteRecordFile(url) {
  try {
    if (!url || !url.startsWith('file://')) return;
    const path = url.slice(7); // strip 'file://'
    if (await exists(path)) {
      await unlink(path);
    }
  } catch (e) {
    console.warn('deleteRecordFile error:', e);
  }
}

export async function deleteAllRecordFiles() {
  await resetPlaylistDir();
}
