/**
 * @format
 */

import {AppRegistry} from 'react-native';
import {name as appName} from './app.json';
import App from './App';
import NotificationService from './src/services/NotificationService';

// Setup background message handler with notifee
NotificationService.setupBackgroundHandler();

AppRegistry.registerComponent(appName, () => App);
