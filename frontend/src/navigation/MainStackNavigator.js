import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import BottomTabs from './BottomTabs';
import ProfileDetailScreen from '../screens/main/ProfileDetailScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import ProfileVerificationScreen from '../screens/main/ProfileVerificationScreen';
import DocumentScreen from '../screens/main/DocumentScreen';
import BlockedProfilesScreen from '../screens/main/BlockedProfilesScreen';
import IgnoredProfilesScreen from '../screens/main/IgnoredProfilesScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import GiftListScreen from '../screens/main/GiftListScreen';
import MyPointsScreen from '../screens/main/MyPointsScreen';
import WalletScreen from '../screens/main/WalletScreen';
import WithdrawScreen from '../screens/main/WithdrawScreen';
import ConfirmWithdrawScreen from '../screens/main/ConfirmWithdrawScreen';
import SubscriptionScreen from '../screens/main/SubscriptionScreen';
import PayoutScreen from '../screens/main/PayoutScreen';
import LiveRoomScreen from '../screens/main/LiveRoomScreen';
import ChatProvider from '../screens/stream/ChatProvider';
import CreateChat from '../screens/stream/CreateChat';
import Chats from '../screens/stream/Chats';
import Chat from '../screens/stream/Chat';
import ThreadScreen from '../screens/stream/ThreadScreen';
import VideoProvider from '../screens/stream/VideoProvider';
import VideoCall from '../screens/stream/VideoCall';
import Call from '../screens/stream/Call';
import CallProvider from '../screens/stream/CallProvider';

const Stack = createNativeStackNavigator();

const MainStackNavigator = ({navigation}) => {
  return (
    <ChatProvider>
      <VideoProvider>
        <CallProvider>
          <Stack.Navigator
            screenOptions={{headerShown: false}}
            initialRouteName={'main-tabs'}>
            <Stack.Screen
              name="create-chat"
              component={CreateChat}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="chats"
              component={Chats}
              options={{
                headerShown: true,
              }}
            />
            <Stack.Screen name="chat" component={Chat} />
            <Stack.Screen name="thread-screen" component={ThreadScreen} />
            <Stack.Screen name="video-call" component={VideoCall} />
            <Stack.Screen name="call" component={Call} />
            <Stack.Screen name="LiveRoom" component={LiveRoomScreen} />
            <Stack.Screen component={BottomTabs} name={'main-tabs'} />
            <Stack.Screen
              name="ProfileDetail"
              component={ProfileDetailScreen}
              options={{
                animation: 'slide_from_bottom',
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{
                animation: 'slide_from_right',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="ProfileVerification"
              component={ProfileVerificationScreen}
              options={{
                animation: 'slide_from_bottom',
                presentation: 'fullScreenModal',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Document"
              component={DocumentScreen}
              options={{
                animation: 'slide_from_right',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="BlockedProfiles"
              component={BlockedProfilesScreen}
              options={{
                animation: 'slide_from_right',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="IgnoredProfiles"
              component={IgnoredProfilesScreen}
              options={{
                animation: 'slide_from_right',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{
                animation: 'slide_from_right',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="GiftList"
              component={GiftListScreen}
              options={{
                animation: 'slide_from_right',
                // presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="MyPoints"
              component={MyPointsScreen}
              options={{
                animation: 'slide_from_right',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Wallet"
              component={WalletScreen}
              options={{
                animation: 'slide_from_right',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Withdraw"
              component={WithdrawScreen}
              options={{
                animation: 'slide_from_right',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="ConfirmWithdraw"
              component={ConfirmWithdrawScreen}
              options={{
                animation: 'slide_from_right',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Subscription"
              component={SubscriptionScreen}
              options={{
                animation: 'slide_from_right',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Payout"
              component={PayoutScreen}
              options={{
                animation: 'slide_from_right',
                headerShown: false,
              }}
            />
          </Stack.Navigator>
        </CallProvider>
      </VideoProvider>
    </ChatProvider>
  );
};

export default MainStackNavigator;
