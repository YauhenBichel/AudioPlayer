import TrackPlayer, { Event } from 'react-native-track-player';
import { skipWrapped } from './player';

export default async function PlaybackService() {
  // Set up event listeners for remote control events
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
  TrackPlayer.addEventListener(Event.RemoteNext, () => skipWrapped(+1));
  TrackPlayer.addEventListener(Event.RemotePrevious, () => skipWrapped(-1));
}
