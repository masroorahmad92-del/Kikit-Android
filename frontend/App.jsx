import React, {useEffect, useCallback} from 'react';
import RootNavigator from './src/navigation/RootNavigator';

import {PermissionsAndroid, Platform, StatusBar} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notificationService from './src/services/NotificationService';
import Purchases from 'react-native-purchases';
import {useKitkitStore} from './src/store/kitkitStore';
import {
  REVENUECAT_API_KEY_ANDROID,
  REVENUECAT_API_KEY_IOS,
} from './src/utils/constants';
import {revenueCatLogin, syncPremiumStatus} from './src/utils/revenueCatHelper';

function App() {
  const user = useKitkitStore(state => state.user);
  const getFCMToken = useCallback(async () => {
    try {
      const token = await notificationService.getFCMToken();
      if (token) {
        console.log('FCM Token:', token);
        // Send this token to your backend
      }
    } catch (error) {
      console.log('Error getting FCM token:', error);
    }
  }, []);

  const requestAndroidPermissions = useCallback(async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Notification permission granted');
        await notificationService.requestPermissions();
        await getFCMToken();
      } else {
        console.log('Notification permission denied');
      }
    } catch (error) {
      console.log('error', error);
    }
  }, [getFCMToken]);

  const requestIOSPermissions = useCallback(async () => {
    try {
      const authStatus = await messaging().requestPermission();

      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
        await notificationService.requestPermissions();
        setTimeout(async () => {
          await getFCMToken();
        }, 2000); // 2 second delay
      }
    } catch (error) {
      console.log('error', error);
    }
  }, [getFCMToken]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      requestAndroidPermissions();
    } else {
      requestIOSPermissions();
    }
  }, [requestAndroidPermissions, requestIOSPermissions]);

  useEffect(() => {
    const initPurchases = async () => {
      const apiKey =
        Platform.OS === 'ios'
          ? REVENUECAT_API_KEY_IOS
          : REVENUECAT_API_KEY_ANDROID;

      if (!apiKey || apiKey.includes('REPLACE')) {
        console.log('RevenueCat not configured for', Platform.OS);
        return;
      }

      try {
        if (__DEV__) {
          Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
        }
        await Purchases.configure({apiKey});

        const userId = user?.user?.id;
        if (userId) {
          await revenueCatLogin(userId);
        } else {
          try {
            const customerInfo = await Purchases.getCustomerInfo();
            console.log('Customer info on launch:', customerInfo);
            syncPremiumStatus(customerInfo);
          } catch (err) {
            console.log('Error checking subscription on launch:', err);
          }
        }
      } catch (err) {
        console.log('RevenueCat init error:', err);
      }
    };
    initPurchases();
  }, [user?.user?.id]);

  useEffect(() => {
    // Setup foreground notification handler with notifee
    const unsubscribe = notificationService.setupForegroundHandler();

    // Initialize notification channel
    notificationService.createChannel();

    return unsubscribe;
  }, []);

  return (
    <>
      <StatusBar translucent={false} barStyle={'dark-content'} />
      <RootNavigator />
    </>
  );
}

export default App;
