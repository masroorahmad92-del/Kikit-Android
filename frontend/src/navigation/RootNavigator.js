import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import AuthStackNavigator from './AuthStackNavigator';
import BootSplash from 'react-native-bootsplash';
import MainStackNavigator from './MainStackNavigator';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '../api/queryClient';
import Toast from 'react-native-toast-message';
import {ToastCard} from '../components/base/Toast';
import {useKitkitStore} from '../store/kitkitStore';
import notificationService from '../services/NotificationService';
import {userService} from '../api/services/userService';
import WelcomeAgreementScreen from '../screens/auth/onboarding/WelcomeAgreementScreen';
import {Text} from '../components/base/Text';
import {colors, fonts, moderateScale} from '../theme';

const GateStatus = ({error, loading, onRetry}) => (
  <View style={styles.gateContainer}>
    {loading ? (
      <>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text fs="M" color="grey700" style={styles.gateText}>
          Loading your profile...
        </Text>
      </>
    ) : (
      <>
        <Text fs="XL" color="grey800" style={styles.gateTitle}>
          We could not load your profile
        </Text>
        <Text fs="S" color="grey600" style={styles.gateText}>
          {error || 'Please check your connection and try again.'}
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onRetry}
          style={styles.retryButton}>
          <Text fs="M" color="white" style={styles.retryText}>
            Retry
          </Text>
        </TouchableOpacity>
      </>
    )}
  </View>
);

const RootNavigator = () => {
  const {apiToken, setUserProfile, user, userProfile} = useKitkitStore();
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState(null);
  console.log('user', user);
  console.log('apiToken', apiToken);
  console.log('userProfile', userProfile);

  //   const redux = useSelector(state => state?.appReducer);

  useEffect(() => {
    const hideSplashScreen = async () => {
      await BootSplash.hide({fade: true});
    };

    hideSplashScreen();
  }, []);

  const loadAuthenticatedProfile = useCallback(async () => {
    if (!apiToken || isLoadingProfile) {
      return;
    }

    try {
      setIsLoadingProfile(true);
      setProfileLoadError(null);
      const response = await userService.getMyProfile();
      const profileData = response?.data?.data;

      if (profileData) {
        setUserProfile(profileData);
      } else {
        setProfileLoadError('Profile data was not returned by the server.');
      }
    } catch (error) {
      setProfileLoadError(
        error?.message || 'Please check your connection and try again.',
      );
    } finally {
      setIsLoadingProfile(false);
    }
  }, [apiToken, isLoadingProfile, setUserProfile]);

  useEffect(() => {
    if (!apiToken || userProfile) {
      setProfileLoadError(null);
      return;
    }

    if (!isLoadingProfile && !profileLoadError) {
      loadAuthenticatedProfile();
    }
  }, [
    apiToken,
    isLoadingProfile,
    loadAuthenticatedProfile,
    profileLoadError,
    userProfile,
  ]);

  // Send FCM token when user is authenticated
  useEffect(() => {
    const sendTokenToBackend = async () => {
      if (apiToken && user) {
        try {
          await notificationService.sendFCMTokenToBackend();
          console.log('FCM token sent to backend on app launch');
        } catch (error) {
          console.error('Failed to send FCM token on app launch:', error);
        }
      }
    };

    sendTokenToBackend();
  }, [apiToken, user]);
  // Toast configuration
  const toastConfig = {
    success: ({text1}) => <ToastCard text={text1} red={false} />,
    error: ({text1}) => <ToastCard text={text1} red={true} />,
  };

  const renderNavigator = () => {
    if (!apiToken) {
      return <AuthStackNavigator />;
    }

    if (!userProfile) {
      return (
        <GateStatus
          error={profileLoadError}
          loading={isLoadingProfile || !profileLoadError}
          onRetry={loadAuthenticatedProfile}
        />
      );
    }

    if (userProfile.acknowledged_terms !== true) {
      return <WelcomeAgreementScreen />;
    }

    return <MainStackNavigator />;
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <NavigationContainer>
        <QueryClientProvider client={queryClient}>
          {renderNavigator()}
          {/* <AuthStackNavigator /> */}
          {/* <MainStackNavigator /> */}
        </QueryClientProvider>
      </NavigationContainer>
      <Toast
        config={toastConfig}
        position="top"
        topOffset={50}
        visibilityTime={3000}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  gateContainer: {
    alignItems: 'center',
    backgroundColor: colors.white,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: moderateScale(24),
  },
  gateText: {
    fontFamily: fonts.CabinetRegular,
    lineHeight: 22,
    marginTop: moderateScale(12),
    textAlign: 'center',
  },
  gateTitle: {
    fontFamily: fonts.CabinetBold,
    marginBottom: moderateScale(4),
    textAlign: 'center',
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: moderateScale(24),
    marginTop: moderateScale(20),
    paddingHorizontal: moderateScale(28),
    paddingVertical: moderateScale(12),
  },
  retryText: {
    fontFamily: fonts.CabinetBold,
  },
  root: {
    flex: 1,
  },
});

export default RootNavigator;
