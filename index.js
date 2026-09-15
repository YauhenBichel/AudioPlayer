/**
 * @format
 */
import { AppRegistry } from 'react-native';
import TrackPlayer from 'react-native-track-player';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

// Registered here, at start-up, rather than inside a component: Android starts
// this service for the media notification and lock-screen buttons, possibly
// while no screen is showing at all.
TrackPlayer.registerPlaybackService(() => require('./src/services/playbackService').default);
