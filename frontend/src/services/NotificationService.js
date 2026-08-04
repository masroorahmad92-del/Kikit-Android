import notifee, {AndroidImportance, EventType} from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import {DeviceEventEmitter} from 'react-native';

// Handle notification press with navigation logic
const handleNotificationPress = notification => {
  const data = notification?.data;

  if (data) {
    console.log('Notification data:', data);
    // Add your navigation logic here based on notification data
    // Example: navigationRef.current?.navigate('ScreenName', { params })
  }
};

// Handle notification press events
const setupNotificationHandlers = () => {
  // Foreground event handler
  notifee.onForegroundEvent(({type, detail}) => {
    switch (type) {
      case EventType.DISMISSED:
        console.log('Notification dismissed', detail.notification);
        break;
      case EventType.PRESS:
        console.log('Notification pressed', detail.notification);
        // Handle navigation or actions based on notification data
        handleNotificationPress(detail.notification);
        break;
    }
  });

  // Background event handler
  notifee.onBackgroundEvent(async ({type, detail}) => {
    const {notification} = detail;

    switch (type) {
      case EventType.PRESS:
        console.log('Background notification pressed', notification);
        await handleNotificationPress(notification);
        break;
    }
  });
};

// Initialize notification handlers
setupNotificationHandlers();

// Request notification permissions
const requestPermissions = async () => {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= 1;
};

// Create a notification channel for Android
const createChannel = async () => {
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
  return channelId;
};

// Display notification on screen
const displayNotification = async remoteMessage => {
  try {
    const channelId = await createChannel();

    await notifee.displayNotification({
      title: remoteMessage.notification?.title || 'New Message',
      body: remoteMessage.notification?.body || 'You have a new notification',
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
        },
        sound: 'default',
        smallIcon: 'ic_notification',
        largeIcon: remoteMessage.notification?.android?.imageUrl,
        vibrationPattern: [300, 500],
      },
      ios: {
        sound: 'default',
        foregroundPresentationOptions: {
          badge: true,
          sound: true,
          banner: true,
          list: true,
        },
        attachments: remoteMessage.notification?.ios?.imageUrl
          ? [
              {
                url: remoteMessage.notification.ios.imageUrl,
              },
            ]
          : [],
      },
      data: remoteMessage.data,
    });
  } catch (error) {
    console.error('Error displaying notification:', error);
  }
};

// Handle foreground messages
const setupForegroundHandler = () => {
  return messaging().onMessage(async remoteMessage => {
    console.log('Foreground message received:', remoteMessage);
    await displayNotification(remoteMessage);

    // Emit event to update notification count in the app
    DeviceEventEmitter.emit('onNotificationReceived', remoteMessage);
  });
};

// Handle background messages
const setupBackgroundHandler = () => {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background message received:', remoteMessage);
    await displayNotification(remoteMessage);
  });
};

// Get FCM token
const getFCMToken = async () => {
  try {
    await messaging().registerDeviceForRemoteMessages();
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Send FCM token to backend (for authorized users only)
const sendFCMTokenToBackend = async () => {
  try {
    const {userService} = await import('../api/services/userService');
    const token = await getFCMToken();

    if (token) {
      const response = await userService.sendFCMToken(token);
      console.log('FCM token sent to backend successfully:', response?.data);
      return response?.data;
    } else {
      console.log('No FCM token available to send');
      return null;
    }
  } catch (error) {
    console.error('Error sending FCM token to backend:', error);
    return null;
  }
};

// Delete FCM token (unregisters device from receiving push notifications)
const deleteFCMToken = async () => {
  try {
    await messaging().deleteToken();
    console.log('FCM token deleted successfully');
  } catch (error) {
    console.error('Error deleting FCM token:', error);
  }
};

// Cancel a notification
const cancelNotification = async notificationId => {
  await notifee.cancelNotification(notificationId);
};

// Cancel all notifications
const cancelAllNotifications = async () => {
  await notifee.cancelAllNotifications();
};

// Get badge count
const getBadgeCount = async () => {
  return await notifee.getBadgeCount();
};

// Set badge count
const setBadgeCount = async count => {
  await notifee.setBadgeCount(count);
};

// Increment badge count
const incrementBadge = async () => {
  const count = await getBadgeCount();
  await setBadgeCount(count + 1);
};

// Decrement badge count
const decrementBadge = async () => {
  const count = await getBadgeCount();
  if (count > 0) {
    await setBadgeCount(count - 1);
  }
};

export default {
  requestPermissions,
  createChannel,
  displayNotification,
  setupForegroundHandler,
  setupBackgroundHandler,
  handleNotificationPress,
  getFCMToken,
  sendFCMTokenToBackend,
  deleteFCMToken,
  cancelNotification,
  cancelAllNotifications,
  getBadgeCount,
  setBadgeCount,
  incrementBadge,
  decrementBadge,
};
