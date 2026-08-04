import 'react-native-url-polyfill/auto';
import {useEffect, useState} from 'react';
import {ActivityIndicator, View} from 'react-native';
import {StreamChat} from 'stream-chat';
import {
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-native-sdk';

import {colors} from '../../theme';
import {STREAM_API_KEY} from '../../config/streamConfig';
import {useKitkitStore} from '../../store/kitkitStore';
import {storageUtil} from '../../store/storage';
import Toast from 'react-native-toast-message';
import {revenueCatLogout} from '../../utils/revenueCatHelper';
import {getPrimaryPhoto} from '../../utils/helpers';

const chatClient = StreamChat.getInstance(STREAM_API_KEY);

export default function VideoProvider({children}) {
  const [videoClient, setVideoClient] = useState(null);
  const {user,userProfile} = useKitkitStore();

  useEffect(() => {
    let isMounted = true;
    let streamVideoClient;

    const initVideoClient = async () => {
      try {
        console.log('loggedINuser-----in video provider', userProfile);

        const _user = {
          id: user?.user?.id,
          name: userProfile?.name,
          image: getPrimaryPhoto(userProfile?.photos)?.url || null,
        };

        streamVideoClient = new StreamVideoClient({apiKey: STREAM_API_KEY});
        await streamVideoClient.connectUser(_user, user?.stream_chat_token);

        if (isMounted) {
          setVideoClient(streamVideoClient);
        }
      } catch (error) {
        console.error('Failed to initialize Stream Video client', error);

        // Build a meaningful message based on the error
        const errorMsg = error?.message || '';
        let toastTitle = 'Connection Failed';
        let toastMessage = 'Something went wrong. Please sign in again.';

        if (errorMsg.includes('deleted')) {
          toastTitle = 'Account Deleted';
          toastMessage = 'Your account has been deleted. Please contact support or create a new account.';
        } else if (error?.StatusCode === 401 || errorMsg.includes('token')) {
          toastTitle = 'Session Expired';
          toastMessage = 'Your session has expired. Please sign in again.';
        } else if (errorMsg.includes('network') || errorMsg.includes('timeout')) {
          toastTitle = 'Network Error';
          toastMessage = 'Unable to connect. Please check your internet and try again.';
        }

        // Show toast first, then delay logout so the toast is visible
        Toast.show({
          type: 'error',
          text1: toastMessage,
          visibilityTime: 4000,
        });

        // Delay logout so the toast renders before navigation unmounts
        setTimeout(async () => {
          await revenueCatLogout();
          try {
            const notificationService = (await import('../../services/NotificationService')).default;
            await notificationService.deleteFCMToken();
            await notificationService.cancelAllNotifications();
          } catch (_) {}
          await storageUtil.clear();
          useKitkitStore.getState().removeUser();
        }, 500);
      }
    };

    initVideoClient();

    return () => {
      isMounted = false;
      if (streamVideoClient) {
        streamVideoClient.disconnectUser().catch(() => {});
      }
    };
  }, []);

  if (!videoClient) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
}
