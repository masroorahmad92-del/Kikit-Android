import 'react-native-url-polyfill/auto';
import {StreamChat} from 'stream-chat';
import {STREAM_API_KEY} from '../../config/streamConfig';
import {useEffect, useState} from 'react';
import {ActivityIndicator, View} from 'react-native';
import {colors} from '../../theme';
import {Chat, OverlayProvider} from 'stream-chat-react-native';
import {useKitkitStore} from '../../store/kitkitStore';
import {storageUtil} from '../../store/storage';
import Toast from 'react-native-toast-message';
import {revenueCatLogout} from '../../utils/revenueCatHelper';
import {getPrimaryPhoto} from '../../utils/helpers';

const client = StreamChat.getInstance(STREAM_API_KEY);

export default function ChatProvider({children}) {
  const {user, userProfile} = useKitkitStore();
  const [isReady, setIsReady] = useState(false);
  const [chatClient, setChatClient] = useState(client);

  useEffect(() => {
    const userId = user?.user?.id;
    const streamToken = user?.stream_chat_token;
    if (!userId || !streamToken) {
      setIsReady(false);
      return undefined;
    }

    let cancelled = false;

    const connect = async () => {
      try {
        if (client.userID && client.userID !== String(userId)) {
          await client.disconnectUser();
        }

        const displayName = userProfile?.name?.trim() || 'Kikit Member';
        const displayImage = getPrimaryPhoto(userProfile?.photos)?.url || null;

        await client.connectUser(
          {
            id: String(userId),
            name: displayName,
            image: displayImage,
          },
          streamToken,
        );

        if (!cancelled) {
          setChatClient(client);
          setIsReady(true);
        }
      } catch (error) {
        console.log('connect user error->', error);

        const errorMsg = error?.message || '';
        let toastTitle = 'Connection Failed';
        let toastMessage = 'Something went wrong. Please sign in again.';

        if (errorMsg.includes('deleted')) {
          toastTitle = 'Account Deleted';
          toastMessage =
            'Your account has been deleted. Please contact support or create a new account.';
        } else if (error?.StatusCode === 401 || errorMsg.includes('token')) {
          toastTitle = 'Session Expired';
          toastMessage = 'Your session has expired. Please sign in again.';
        } else if (errorMsg.includes('network') || errorMsg.includes('timeout')) {
          toastTitle = 'Network Error';
          toastMessage = 'Unable to connect. Please check your internet and try again.';
        }

        Toast.show({
          type: 'error',
          text1: toastMessage,
          visibilityTime: 4000,
        });

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

    connect();

    return () => {
      cancelled = true;
      client.disconnectUser().catch(err => {
        console.log('disconnect error->', err);
      });
      setIsReady(false);
    };
  }, [user?.user?.id, user?.stream_chat_token, userProfile?.name, userProfile?.photos]);

  if (!isReady) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  return (
    <OverlayProvider>
      <Chat client={chatClient}>{children}</Chat>
    </OverlayProvider>
  );
}
