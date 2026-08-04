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
// const chatTheme = {
//   channelPrimary: {
//     container: {backgroundColor: colors.primary},
//   },
// };
export default function ChatProvider({children}) {
  const {user, userProfile} = useKitkitStore();
  const [isReady, setIsReady] = useState(false);
  const [chatClient, setChatClient] = useState(client);
  useEffect(() => {
    //if user is authenticated we will connect user else do early return
    //     setChatClient(client);
    //
    // console.log('loggedINuser in chat provider', user);
    const connect = async () => {
      try {
        // Disconnect any existing user before connecting a new one
        if (client.userID) {
          await client.disconnectUser();
        }

        await client.connectUser(
          {
            id: user?.user?.id, //logged in user
            name: userProfile?.name,
            image: getPrimaryPhoto(userProfile?.photos)?.url || null,
          },
          user?.stream_chat_token,
        );
        setIsReady(true);
      } catch (error) {
        console.log('connect user error->', error);

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

    connect();

    return () => {
      // Always disconnect on cleanup
      client.disconnectUser().catch(err => {
        console.log('disconnect error->', err);
      });
      setIsReady(false);
    };
  }, []);
  console.log('isReady', isReady);
  if (!isReady) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  return (
    //     theme={chatTheme}
    <OverlayProvider>
      <Chat client={chatClient}>{children}</Chat>
    </OverlayProvider>
  );
}
