import {
  Animated,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import React, {useRef, useEffect, useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useMutation} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import GradientBackground from '../../../components/GradientBackground';
import {Text} from '../../../components/base/Text';
import {colors, moderateScale} from '../../../theme';
import {Button} from '../../../components/base/Button';
import {ArrowBack, EditPencil} from '../../../assets/icons';
import {onboardingService} from '../../../api/services/onboardingService';
import {userService} from '../../../api/services/userService';
import {useKitkitStore} from '../../../store/kitkitStore';
import notificationService from '../../../services/NotificationService';
import {revenueCatLogin} from '../../../utils/revenueCatHelper';
import {navigateToProfileSetup} from '../../../utils/onboardingNavigation';

const OTPVerification = ({route}) => {
  const navigation = useNavigation();
  const {setUser, setToken, setUserProfile} = useKitkitStore();
  const isEmail = route?.params?.isEmail || false;
  const email = route?.params?.email || '';
  const phoneNumber = route?.params?.phoneNumber || '+92 3005676567';

  const displayText = isEmail ? email : phoneNumber;

  // OTP input refs
  const inputRefs = useRef([]);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [resendTimer, setResendTimer] = useState(300);
  const hasAutoSubmitted = useRef(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Get My Profile mutation
  const getMyProfileMutation = useMutation({
    mutationFn: () => userService.getMyProfile(),
    onSuccess: async resp => {
      console.log('Profile fetched successfully:', resp);

      const profileData = resp?.data?.data;

      if (profileData) {
        // Always set the user profile in store
        setUserProfile(profileData);

        // Check if profile is complete
        if (profileData.is_profile_complete === true) {
          // If profile is complete, set the token
          const accessToken = useKitkitStore.getState().user?.access_token;
          if (accessToken) {
            // Log in to RevenueCat BEFORE setToken (setToken triggers navigation)
            const userId = useKitkitStore.getState().user?.user?.id;
            if (userId) {
              await revenueCatLogin(userId);
            }

            // Send FCM token to backend after successful sign-in
            try {
              await notificationService.sendFCMTokenToBackend();
              console.log('FCM token sent to backend successfully');
            } catch (error) {
              console.error('Failed to send FCM token:', error);
              // Don't block user flow if FCM token fails
            }

            // Set token last — this triggers navigation to main app
            setToken(accessToken);
          }
        } else {
          Toast.show({
            type: 'success',
            text2: 'Success!',
            text1: 'Your email has been verified successfully',
          });

          navigateToProfileSetup(navigation, {profileData});
        }
      }
    },
    onError: error => {
      console.error('Failed to fetch profile:', error);
      navigateToProfileSetup(navigation);
    },
  });

  // Verify OTP mutation
  const verifyOTPMutation = useMutation({
    mutationFn: payload => onboardingService.verifyEmailOTP(payload),
    onSuccess: resp => {
      const userData = resp?.data?.data;
      if (userData && userData.access_token) {
        console.log('Setting user with access_token:', userData.access_token);
        setUser(userData);
        getMyProfileMutation.mutate();
      } else {
        console.error('No access_token found in OTP response');
        Toast.show({
          type: 'error',
          text1: 'Authentication Error',
          text2: 'No access token received. Please try again.',
        });
      }
    },
    onError: error => {
      console.error('OTP verification failed:', error);

      const errorMessage = error?.message || 'Invalid OTP. Please try again.';

      Toast.show({
        type: 'error',
        text2: 'Verification Failed',
        text1: errorMessage,
      });

      // Clear OTP inputs on error
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
    },
  });

  // Resend OTP mutation
  const resendOTPMutation = useMutation({
    mutationFn: payload => onboardingService.resendOTP(payload),
    onSuccess: resp => {
      console.log('OTP resent successfully:', resp);

      Toast.show({
        type: 'success',
        text1: 'OTP Resent',
        text2: `A new code has been sent to ${email}`,
      });

      // Reset timer and OTP inputs
      setResendTimer(300);
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
    },
    onError: error => {
      console.error('Resend OTP failed:', error);

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to resend OTP. Please try again.';

      Toast.show({
        type: 'error',
        text1: 'Resend Failed',
        text2: errorMessage,
      });
    },
  });

  useEffect(() => {
    // Animate component appearance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Focus first input
    inputRefs.current[0]?.focus();
  }, [fadeAnim, slideAnim]);

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Auto-submit when OTP is complete
  useEffect(() => {
    const isComplete = otp.every(digit => digit !== '');
    const otpCode = otp.join('');

    if (
      isComplete &&
      !hasAutoSubmitted.current &&
      !verifyOTPMutation.isPending &&
      !getMyProfileMutation.isPending
    ) {
      // Mark as auto-submitted to prevent duplicate calls
      hasAutoSubmitted.current = true;

      // Dismiss keyboard
      Keyboard.dismiss();

      // Small delay to ensure keyboard is dismissed before API call
      const timer = setTimeout(() => {
        verifyOTPMutation.mutate({
          recipient: email,
          code: otpCode,
        });
      }, 300);

      return () => clearTimeout(timer);
    }

    // Reset auto-submit flag when OTP is cleared (e.g., on error)
    if (!isComplete) {
      hasAutoSubmitted.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, email, verifyOTPMutation.isPending, getMyProfileMutation.isPending]);

  const handleOtpChange = (value, index) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const otpCode = otp.join('');
    if (otpCode.length === 4) {
      // Call the verify OTP mutation with email and OTP code
      verifyOTPMutation.mutate({
        recipient: email,
        code: otpCode,
      });
    }
  };

  const handleResend = () => {
    if (resendTimer === 0 && !resendOTPMutation.isPending) {
      // Resend OTP
      resendOTPMutation.mutate({recipient: email, service: 'email'});
    }
  };

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Animated.View
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                transform: [{translateY: slideAnim}],
              },
            ]}>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Text fs="L" ff="i-semibold" color="grey800">
                <ArrowBack />
              </Text>
            </TouchableOpacity>

            {/* Header Section */}
            <View style={styles.headerSection}>
              <Text fs="XXXL" ff="c-medium" style={styles.mainHeading}>
                <Text fs="XXXL" ff="c-medium" color="grey800">
                  Verify Your{' '}
                </Text>
                <Text fs="XXXL" ff="c-medium" color="primary">
                  {isEmail ? 'Email' : 'Number'}
                </Text>
              </Text>

              <Text
                fs="M"
                ff="i-medium"
                color="grey800"
                style={styles.subHeading}>
                Enter the 4-digit code we sent you
              </Text>

              {/* Contact Info Section */}
              <View style={styles.phoneNumberSection}>
                <Text fs="M" ff="i-medium" color="grey800">
                  Code sent to:
                </Text>
                <View style={styles.phoneNumberContainer}>
                  <Text fs="L" ff="i-semibold" color="grey800">
                    {displayText}
                  </Text>
                  <TouchableOpacity onPress={() => navigation.goBack()}>
                    <EditPencil />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* OTP Input Section */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => (inputRefs.current[index] = ref)}
                  style={[styles.otpInput, digit && styles.otpInputFilled]}
                  value={digit}
                  onChangeText={value => handleOtpChange(value, index)}
                  onKeyPress={e => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* Resend Section */}
            <View style={styles.resendSection}>
              <Text fs="M" ff="i-medium" color="grey800">
                Didn't Get OTP?{' '}
              </Text>
              <TouchableOpacity
                onPress={handleResend}
                disabled={resendTimer > 0 || resendOTPMutation.isPending}>
                <Text
                  fs="M"
                  ff="i-semibold"
                  color={
                    resendTimer > 0 || resendOTPMutation.isPending
                      ? 'grey400'
                      : 'primary'
                  }>
                  {resendOTPMutation.isPending
                    ? 'Sending...'
                    : resendTimer > 0
                    ? `Resend in ${formatTime(resendTimer)}`
                    : 'Resend'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Verify Button */}
            <View style={styles.buttonSection}>
              <Button
                title={
                  verifyOTPMutation.isPending || getMyProfileMutation.isPending
                    ? 'Verifying...'
                    : 'Verify & Continue'
                }
                onPress={handleVerify}
                disabled={
                  !isOtpComplete ||
                  verifyOTPMutation.isPending ||
                  getMyProfileMutation.isPending
                }
                type={
                  !isOtpComplete ||
                  verifyOTPMutation.isPending ||
                  getMyProfileMutation.isPending
                    ? 'disabled'
                    : 'default'
                }
              />
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </GradientBackground>
  );
};

export default OTPVerification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(20),
  },
  backButton: {
    marginBottom: moderateScale(30),
  },
  headerSection: {
    marginBottom: moderateScale(50),
  },
  mainHeading: {
    marginBottom: moderateScale(12),
    lineHeight: 50,
  },
  subHeading: {
    marginBottom: moderateScale(20),
    lineHeight: 24,
  },
  phoneNumberSection: {
    marginTop: moderateScale(20),
  },
  phoneNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(8),
  },
  editIcon: {
    marginLeft: moderateScale(8),
    fontSize: moderateScale(20),
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: moderateScale(15),
    marginBottom: moderateScale(40),
    paddingHorizontal: moderateScale(20),
  },
  otpInput: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
    fontSize: moderateScale(32),
    fontWeight: '600',
    color: colors.grey800,
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  resendSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(60),
  },
  buttonSection: {
    marginTop: 'auto',
    marginBottom: moderateScale(30),
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
