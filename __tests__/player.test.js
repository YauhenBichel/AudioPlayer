import TrackPlayer, {
  Capability,
  RepeatMode,
  State,
  AppKilledPlaybackBehavior
} from 'react-native-track-player';

jest.mock('react-native-track-player', () => ({
  __esModule: true,
  default: {
    setupPlayer: jest.fn(),
    updateOptions: jest.fn(),
    setRepeatMode: jest.fn(),
    getPlaybackState: jest.fn(),
    getQueue: jest.fn(),
    getActiveTrackIndex: jest.fn(),
    skip: jest.fn(),
    play: jest.fn()
  },
  Capability: {
    Play: 0,
    Pause: 1,
    Stop: 2,
    SkipToNext: 3,
    SkipToPrevious: 4
  },
  RepeatMode: {
    Off: 0,
    Track: 1,
    Queue: 2
  },
  State: {
    Playing: 'playing',
    Paused: 'paused'
  },
  AppKilledPlaybackBehavior: {
    StopPlaybackAndRemoveNotification: 'stop'
  }
}));

import { setupPlayer, applyRepeatMode, skipWrapped } from '../src/services/player';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('setupPlayer', () => {
  test('resolves true when setupPlayer succeeds', async () => {
    TrackPlayer.setupPlayer.mockResolvedValue(undefined);
    
    const result = await setupPlayer();
    
    expect(result).toBe(true);
    expect(TrackPlayer.setupPlayer).toHaveBeenCalledTimes(1);
    expect(TrackPlayer.updateOptions).toHaveBeenCalledWith({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
        Capability.SkipToNext,
        Capability.SkipToPrevious
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext
      ],
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification
      }
    });
  });

  test('resolves true when setupPlayer rejects with "player_already_initialized"', async () => {
    TrackPlayer.setupPlayer.mockRejectedValue({ code: 'player_already_initialized' });
    
    const result = await setupPlayer();
    
    expect(result).toBe(true);
    expect(TrackPlayer.setupPlayer).toHaveBeenCalledTimes(1);
    // Options are re-applied even when the player already existed, so the
    // notification buttons are always configured.
    expect(TrackPlayer.updateOptions).toHaveBeenCalledTimes(1);
  });

  test('rejects when setupPlayer fails with other error', async () => {
    TrackPlayer.setupPlayer.mockRejectedValue({ code: 'other_error' });
    
    await expect(setupPlayer()).rejects.toEqual({ code: 'other_error' });
    expect(TrackPlayer.setupPlayer).toHaveBeenCalledTimes(1);
    expect(TrackPlayer.updateOptions).not.toHaveBeenCalled();
  });
});

describe('applyRepeatMode', () => {
  test('currentRepeats true sets RepeatMode.Track regardless of repeatAll', async () => {
    await applyRepeatMode({ currentRepeats: true, repeatAll: true });
    expect(TrackPlayer.setRepeatMode).toHaveBeenCalledWith(RepeatMode.Track);
    
    await applyRepeatMode({ currentRepeats: true, repeatAll: false });
    expect(TrackPlayer.setRepeatMode).toHaveBeenCalledWith(RepeatMode.Track);
  });

  test('repeatAll true without currentRepeats sets RepeatMode.Queue', async () => {
    await applyRepeatMode({ currentRepeats: false, repeatAll: true });
    expect(TrackPlayer.setRepeatMode).toHaveBeenCalledWith(RepeatMode.Queue);
  });

  test('neither currentRepeats nor repeatAll sets RepeatMode.Off', async () => {
    await applyRepeatMode({ currentRepeats: false, repeatAll: false });
    expect(TrackPlayer.setRepeatMode).toHaveBeenCalledWith(RepeatMode.Off);
  });
});

describe('skipWrapped', () => {
  test('skips to index 0 when moving forward from last track (wraps)', async () => {
    TrackPlayer.getPlaybackState.mockResolvedValue({ state: State.Playing });
    TrackPlayer.getQueue.mockResolvedValue([{}, {}, {}]);
    TrackPlayer.getActiveTrackIndex.mockResolvedValue(2);
    
    const newIndex = await skipWrapped(1);
    
    expect(newIndex).toBe(0);
    expect(TrackPlayer.skip).toHaveBeenCalledWith(0);
    expect(TrackPlayer.play).toHaveBeenCalledTimes(1);
  });

  test('skips to last index when moving backward from first track (wraps)', async () => {
    TrackPlayer.getPlaybackState.mockResolvedValue({ state: State.Playing });
    TrackPlayer.getQueue.mockResolvedValue([{}, {}, {}]);
    TrackPlayer.getActiveTrackIndex.mockResolvedValue(0);
    
    const newIndex = await skipWrapped(-1);
    
    expect(newIndex).toBe(2);
    expect(TrackPlayer.skip).toHaveBeenCalledWith(2);
    expect(TrackPlayer.play).toHaveBeenCalledTimes(1);
  });

  test('handles undefined active track index correctly', async () => {
    // When no track has been played yet (active track index is undefined)
    TrackPlayer.getPlaybackState.mockResolvedValue({ state: State.Playing });
    TrackPlayer.getQueue.mockResolvedValue([{}, {}, {}]);
    TrackPlayer.getActiveTrackIndex.mockResolvedValue(undefined);
    
    // Next from nothing should go to first track
    let newIndex = await skipWrapped(1);
    expect(newIndex).toBe(0);
    expect(TrackPlayer.skip).toHaveBeenCalledWith(0);
    
    // Reset mocks for previous test
    jest.clearAllMocks();
    TrackPlayer.getPlaybackState.mockResolvedValue({ state: State.Playing });
    TrackPlayer.getQueue.mockResolvedValue([{}, {}, {}]);
    TrackPlayer.getActiveTrackIndex.mockResolvedValue(undefined);
    
    // Previous from nothing should go to last track
    newIndex = await skipWrapped(-1);
    expect(newIndex).toBe(2);
    expect(TrackPlayer.skip).toHaveBeenCalledWith(2);
  });

  test('returns undefined and does not call skip when queue is empty', async () => {
    TrackPlayer.getPlaybackState.mockResolvedValue({ state: State.Paused });
    TrackPlayer.getQueue.mockResolvedValue([]);
    
    const result = await skipWrapped(1);
    
    expect(result).toBeUndefined();
    expect(TrackPlayer.skip).not.toHaveBeenCalled();
    expect(TrackPlayer.play).not.toHaveBeenCalled();
  });

  test('calls play() only when state was Playing', async () => {
    // Playing state
    TrackPlayer.getPlaybackState.mockResolvedValue({ state: State.Playing });
    TrackPlayer.getQueue.mockResolvedValue([{}, {}]);
    TrackPlayer.getActiveTrackIndex.mockResolvedValue(0);
    
    await skipWrapped(1);
    expect(TrackPlayer.play).toHaveBeenCalledTimes(1);
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Paused state
    TrackPlayer.getPlaybackState.mockResolvedValue({ state: State.Paused });
    TrackPlayer.getQueue.mockResolvedValue([{}, {}]);
    TrackPlayer.getActiveTrackIndex.mockResolvedValue(0);
    
    await skipWrapped(1);
    expect(TrackPlayer.play).not.toHaveBeenCalled();
  });
});
