import React, {useState, useCallback} from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {StyleSheet} from 'react-native';
import {
  HomeTabIcon,
  LikedTabIcon,
  GiftTabIcon,
  ChatTabIcon,
  ProfileTabIcon,
} from '../assets/icons';
import {colors} from '../theme/colors';
import LiveRoomsScreen from '../screens/main/LiveRoomsScreen';
import HomeScreen from '../screens/main/HomeScreen';
import GiftsScreen from '../screens/main/GiftsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import Chats from '../screens/stream/Chats';
import {useKitkitStore} from '../store/kitkitStore';
import VerificationModal from '../components/base/VerificationModal';
import {useNavigation} from '@react-navigation/native';

const Tab = createBottomTabNavigator();

function BottomTabs() {
  const {userProfile} = useKitkitStore();
  // console.log('userProfile in BottomTabs', userProfile?.is_profile_verified);
  const navigation = useNavigation();
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const handleVerifyNow = () => {
    setShowVerificationModal(false);
    navigation.navigate('ProfileVerification');
  };

  const screenListeners = useCallback(
    () => ({
      tabPress: e => {
        if (userProfile?.is_profile_verified === false) {
          // Prevent default navigation
          e.preventDefault();
          // Show verification modal
          setShowVerificationModal(true);
        }
      },
    }),
    [userProfile?.is_profile_verified],
  );

  return (
    <>
    <Tab.Navigator
    initialRouteName="Live"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.grey,
      }}
      screenListeners={screenListeners}>
      <Tab.Screen
        name="Live"
        component={LiveRoomsScreen}
        options={{
          tabBarLabel: 'Live',
          tabBarIcon: ({focused, color}) => (
            <HomeTabIcon
              width={25}
              height={24}
              fill={focused ? colors.primary : colors.grey}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Community"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Community',
          tabBarIcon: ({focused, color}) => (
            <LikedTabIcon
              width={25}
              height={24}
              fill={focused ? colors.primary : colors.grey}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Gifts"
        component={GiftsScreen}
        options={{
          tabBarIcon: ({focused, color}) => (
            <GiftTabIcon
              width={24}
              height={24}
              fill={focused ? colors.primary : colors.grey}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={Chats}
        options={{
          tabBarIcon: ({focused, color}) => (
            <ChatTabIcon
              width={25}
              height={24}
              fill={focused ? colors.primary : colors.grey}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({focused, color}) => (
            <ProfileTabIcon
              width={25}
              height={24}
              fill={focused ? colors.primary : colors.grey}
            />
          ),
        }}
      />
    </Tab.Navigator>

      {/* Verification Modal for unverified users */}
      <VerificationModal
        visible={showVerificationModal}
        onPrimaryPress={handleVerifyNow}
        title="Get Verified"
        description="Verify your profile with a quick selfie. Once approved, you'll get a verified badge. Your selfie stays private with us."
        primaryButtonText="Verify Now"
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 80,
    paddingBottom: 20,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 5,
  },
});

export default BottomTabs;
