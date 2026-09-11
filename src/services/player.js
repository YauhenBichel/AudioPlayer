import TrackPlayer, {
  Capability,
  RepeatMode,
  State,
  AppKilledPlaybackBehavior
} from 'react-native-track-player';

// Idempotent setup: treat "already initialized" as success
export async function setupPlayer() {
  try {
    await TrackPlayer.setupPlayer();
  } catch (e) {
    // "already initialized" is acceptable
    if (e?.code !== 'player_already_initialized') {
      throw e;
    }
  }

  await TrackPlayer.updateOptions({
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

  return true;
}

// Map repeat configuration to TrackPlayer RepeatMode
export async function applyRepeatMode({ currentRepeats, repeatAll }) {
  if (currentRepeats) {
    await TrackPlayer.setRepeatMode(RepeatMode.Track);
  } else if (repeatAll) {
    await TrackPlayer.setRepeatMode(RepeatMode.Queue);
  } else {
    await TrackPlayer.setRepeatMode(RepeatMode.Off);
  }
}

// Move to next/previous track with wrap-around
export async function skipWrapped(direction) {
  const { state } = await TrackPlayer.getPlaybackState();
  const queue = await TrackPlayer.getQueue();
  
  if (!queue.length) {
    return undefined;
  }

  // Nothing has played yet: treat Next as landing on the first track and
  // Previous as landing on the last, rather than doing arithmetic on undefined.
  const active = await TrackPlayer.getActiveTrackIndex();
  const currentIndex = active ?? (direction > 0 ? -1 : 0);
  let newIndex = currentIndex + direction;
  // Wrap around
  if (newIndex < 0) {
    newIndex = queue.length - 1;
  } else if (newIndex >= queue.length) {
    newIndex = 0;
  }

  await TrackPlayer.skip(newIndex);
  if (state === State.Playing) {
    await TrackPlayer.play();
  }

  return newIndex;
}
