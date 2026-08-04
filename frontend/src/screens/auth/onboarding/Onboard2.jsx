import {Animated, Platform, StyleSheet, View} from 'react-native';
import React, {useRef, useEffect} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useMutation} from '@tanstack/react-query';
import GradientBackground from '../../../components/GradientBackground';
import {Text} from '../../../components/base/Text';
import {colors, moderateScale} from '../../../theme';
import {Button} from '../../../components/base/Button';
import {AppleSignInButton} from '../../../components/base/AppleSignInButton';
import {GoogleSignInButton} from '../../../components/base/GoogleSignInButton';
import Toast from 'react-native-toast-message';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {appleAuth} from '@invertase/react-native-apple-authentication';
import {GOOGLE_CLIENT_ID, GOOGLE_CLIENT_ID_IOS} from '../../../utils/constants';
import {onboardingService} from '../../../api/services/onboardingService';
import {userService} from '../../../api/services/userService';
import {useKitkitStore} from '../../../store/kitkitStore';
import notificationService from '../../../services/NotificationService';
import {revenueCatLogin} from '../../../utils/revenueCatHelper';
import {
  buildSsoProfile,
  formatAppleFullName,
  formatGoogleFullName,
} from '../../../utils/ssoProfileHelper';
import {navigateToProfileSetup} from '../../../utils/onboardingNavigation';
GoogleSignin.configure({
  webClientId: GOOGLE_CLIENT_ID,
  iosClientId: GOOGLE_CLIENT_ID_IOS,
  scopes: ['email', 'profile'],
});

const Onboard2 = () => {
  const navigation = useNavigation();
  const {setUser, setToken, setUserProfile, setSsoProfile} = useKitkitStore();

  const continueAfterAuth = async profileData => {
    if (profileData?.is_profile_complete === true) {
      const accessToken = useKitkitStore.getState().user?.access_token;
      if (accessToken) {
        const userId = useKitkitStore.getState().user?.user?.id;
        if (userId) {
          await revenueCatLogin(userId);
        }

        try {
          await notificationService.sendFCMTokenToBackend();
          console.log('FCM token sent to backend successfully');
        } catch (error) {
          console.error('Failed to send FCM token:', error);
        }

        setToken(accessToken);
      }
      return;
    }

    navigateToProfileSetup(navigation, {
      ssoProfile: useKitkitStore.getState().ssoProfile,
      profileData,
    });
  };

  // Get My Profile mutation - same logic as OTPVerification
  const getMyProfileMutation = useMutation({
    mutationFn: () => userService.getMyProfile(),
    onSuccess: async resp => {
      console.log('Profile fetched successfully:', resp);

      const profileData = resp?.data?.data;

      if (profileData) {
        setUserProfile(profileData);
        await continueAfterAuth(profileData);
      }
    },
    onError: error => {
      console.error('Failed to fetch profile:', error);
      navigateToProfileSetup(navigation, {
        ssoProfile: useKitkitStore.getState().ssoProfile,
      });
    },
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Google Auth mutation
  const googleAuthMutation = useMutation({
    mutationFn: payload => onboardingService.googleAuth(payload),
    onSuccess: resp => {
      console.log('Google auth successful:', resp);

      const userData = resp?.data?.data;
      if (userData && userData.access_token) {
        console.log('Setting user with access_token:', userData.access_token);

        // Set user in store
        setUser(userData);

        Toast.show({
          type: 'success',
          text2: 'Success!',
          text1: 'Google authentication successful',
        });

        // Call getMyProfile mutation - same logic as OTPVerification
        getMyProfileMutation.mutate();
      } else {
        console.error('No access_token found in Google auth response');
        Toast.show({
          type: 'error',
          text1: 'Authentication Error',
          text2: 'No access token received. Please try again.',
        });
      }
    },
    onError: error => {
      console.error('Google authentication failed:', error);

      const errorMessage =
        error?.message || 'Google authentication failed. Please try again.';

      Toast.show({
        type: 'error',
        text1: 'Authentication Failed',
        text2: errorMessage,
      });
    },
  });

  // Apple Auth mutation
  const appleAuthMutation = useMutation({
    mutationFn: payload => onboardingService.appleAuth(payload),
    onSuccess: resp => {
      console.log('Apple auth successful:', resp);

      const userData = resp?.data?.data;
      if (userData && userData.access_token) {
        console.log('Setting user with access_token:', userData.access_token);

        // Set user in store
        setUser(userData);

        Toast.show({
          type: 'success',
          text2: 'Success!',
          text1: 'Apple authentication successful',
        });

        // Call getMyProfile mutation - same logic as OTPVerification
        getMyProfileMutation.mutate();
      } else {
        console.error('No access_token found in Apple auth response');
        Toast.show({
          type: 'error',
          text1: 'Authentication Error',
          text2: 'No access token received. Please try again.',
        });
      }
    },
    onError: error => {
      console.error('Apple authentication failed:', error);

      const errorMessage =
        error?.message || 'Apple authentication failed. Please try again.';

      Toast.show({
        type: 'error',
        text1: 'Authentication Failed',
        text2: errorMessage,
      });
    },
  });

  const onAppleButtonPress = async () => {
    // performs login request
    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });
      return appleAuthRequestResponse;
    } catch (error) {
      console.log('error', error);
      return null;
    }
  };

  // Sign-in handlers
  const handleAppleSignIn = async () => {
    const appleAuthRequestResponse = await onAppleButtonPress();
    console.log('appleAuthRequestResponse', appleAuthRequestResponse);
    if (appleAuthRequestResponse === null) {
      return;
    }
    if (appleAuthRequestResponse?.identityToken) {
      const fullName = formatAppleFullName(appleAuthRequestResponse.fullName);
      const email =
        appleAuthRequestResponse.email ||
        useKitkitStore.getState().user?.user?.email ||
        '';
      setSsoProfile(
        buildSsoProfile({
          provider: 'apple',
          fullName,
          email,
        }),
      );

      appleAuthMutation.mutate({
        id_token: appleAuthRequestResponse.identityToken,
        full_name: fullName || undefined,
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
        text2: 'Failed to get Apple identity token. Please try again.',
      });
    }
  };
  const googleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      return userInfo;
    } catch (error) {
      console.log('error', error);
      return null;
    }
  };

  const handleGoogleSignIn = async () => {
    const response = await googleLogin();
    if (response?.type === 'cancelled') {
      return;
    }
    if (!response) {
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
        text2: 'Failed to sign in with Google. Please try again.',
      });
      return;
    }

    const {idToken} = response;
    const extractedIdToken = idToken || response?.data?.idToken;

    if (extractedIdToken) {
      const fullName = formatGoogleFullName(response);
      setSsoProfile(
        buildSsoProfile({
          provider: 'google',
          fullName,
          email: response?.data?.user?.email || response?.user?.email || '',
        }),
      );

      googleAuthMutation.mutate({
        id_token: extractedIdToken,
        full_name: fullName || undefined,
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
        text2: 'Failed to get Google identity token. Please try again.',
      });
    }
  };

  useEffect(() => {
    // Animate component appearance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, slideAnim]);

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{scale: scaleAnim}, {translateY: slideAnim}],
            },
          ]}>
          {/* Profile Images Section */}
          <View style={styles.profileSection}>
            {/* Left Profile Image */}
            <View style={styles.leftProfileContainer}>
              <View style={styles.profileImageContainer}>
                <Animated.Image
                  source={require('../../../assets/images/o8.png')}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              </View>
            </View>

            {/* Heart Icon */}
            <View style={styles.heartContainer}>
              <Animated.Image
                source={require('../../../assets/images/o7.png')}
                style={styles.heartIcon}
                resizeMode="contain"
              />
            </View>

            {/* Right Profile Image */}
            <View style={styles.rightProfileContainer}>
              <View style={styles.profileImageContainer}>
                <Animated.Image
                  source={require('../../../assets/images/o9.png')}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              </View>
            </View>
          </View>

          {/* Text Content Section */}
          <View style={styles.textSection}>
            <Text
              fs="XXXL"
              ff="c-medium"
              color="grey800"
              style={styles.mainHeading}>
              Your Journey{'\n'}Starts Here
            </Text>

            <Text
              fs="S"
              ff="i-medium"
              color="grey400"
              style={styles.subHeading}>
              Sign in and explore endless possibilities
            </Text>
          </View>

          {/* Button Section */}
          <View style={styles.buttonSection}>
            {Platform.OS === 'ios' && (
              <AppleSignInButton
                onPress={handleAppleSignIn}
                disabled={
                  appleAuthMutation.isPending || getMyProfileMutation.isPending
                }
              />
            )}
            {/* Google Sign-In Button (Both platforms) */}
            <GoogleSignInButton
              onPress={handleGoogleSignIn}
              disabled={
                googleAuthMutation.isPending || getMyProfileMutation.isPending
              }
            />

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email Login Button */}
            <Button
              title="Continue with Email"
              onPress={() => {
                navigation.navigate('email-input');
              }}
            />
          </View>
        </Animated.View>
      </SafeAreaView>
    </GradientBackground>
  );
};

export default Onboard2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: moderateScale(20),
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(40),
    position: 'relative',
  },
  leftProfileContainer: {
    marginRight: moderateScale(20),
  },
  rightProfileContainer: {
    marginLeft: moderateScale(20),
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  heartContainer: {
    position: 'absolute',
    top: -10,
    zIndex: 10,
  },
  heartIcon: {
    width: 30,
    height: 30,
  },
  textSection: {
    alignItems: 'center',
    marginBottom: moderateScale(40),
  },
  mainHeading: {
    textAlign: 'center',
    marginBottom: moderateScale(16),
    lineHeight: 40,
  },
  subHeading: {
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.14,
  },
  buttonSection: {
    width: '100%',
    alignItems: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: moderateScale(16),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.grey100,
  },
  dividerText: {
    marginHorizontal: moderateScale(16),
    color: colors.grey400,
    fontSize: moderateScale(14),
    fontFamily: 'System',
  },
});
