import React, {useRef, useEffect, useState} from 'react';
import {
  Animated,
  StyleSheet,
  View,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useMutation} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import GradientBackground from '../../../components/GradientBackground';
import {Text} from '../../../components/base/Text';
import {Button} from '../../../components/base/Button';
import OTPInput from '../../../components/base/OTPInput';
import {ArrowBack, EditPencil} from '../../../assets/icons';
import {colors, fonts, moderateScale} from '../../../theme';
import {onboardingService} from '../../../api/services/onboardingService';
import {useKitkitStore} from '../../../store/kitkitStore';

const Onboard4 = ({route}) => {
  const navigation = useNavigation();
  const {setUser} = useKitkitStore();
  const phoneNumber = route?.params?.phoneNumber || '+1 2267862597';
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const titleAnim = useRef(new Animated.Value(30)).current;
  const otpAnim = useRef(new Animated.Value(30)).current;
  const buttonAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered animations for content
    setTimeout(() => {
      Animated.timing(titleAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 200);

    setTimeout(() => {
      Animated.timing(otpAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 400);

    setTimeout(() => {
      Animated.timing(buttonAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 600);

    // Start resend timer
    const timer = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fadeAnim, slideAnim, titleAnim, otpAnim, buttonAnim]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleOTPChange = value => {
    setOtp(value);
  };

  // Verify phone OTP mutation
  const verifyPhoneOTPMutation = useMutation({
    mutationFn: payload => onboardingService.verifyPhoneOTP(payload),
    onSuccess: resp => {
      console.log('Phone OTP verified successfully:', resp);

      // Store user data
      if (resp?.data?.data) {
        setUser(resp.data.data);
      }

      Toast.show({
        type: 'success',
        text1: 'Success!',
        text2: 'Your phone number has been verified successfully',
      });

      // Navigate to profile customization screen
      navigation.navigate('onboard5');
    },
    onError: error => {
      console.error('Phone OTP verification failed:', error);

      const errorMessage =
        error?.message || 'Invalid OTP. Please try again.';

      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: errorMessage,
      });

      // Clear OTP input on error
      setOtp('');
    },
  });

  // Resend phone OTP mutation
  const resendPhoneOTPMutation = useMutation({
    mutationFn: payload => onboardingService.resendOTP(payload),
    onSuccess: resp => {
      console.log('Phone OTP resent successfully:', resp);

      Toast.show({
        type: 'success',
        text1: 'OTP Resent',
        text2: 'A new code has been sent to your phone number',
      });

      // Reset timer and OTP input
      setResendTimer(30);
      setCanResend(false);
      setOtp('');
    },
    onError: error => {
      console.error('Resend phone OTP failed:', error);

      const errorMessage =
        error?.message || 'Failed to resend OTP. Please try again.';

      Toast.show({
        type: 'error',
        text1: 'Resend Failed',
        text2: errorMessage,
      });
    },
  });

  const handleVerify = () => {
    if (otp.length === 4) {
      // Call the verify phone OTP mutation
      verifyPhoneOTPMutation.mutate({
        recipient: phoneNumber,
        otp: otp,
        service: 'phone',
      });
    }
  };

  const handleResend = () => {
    if (canResend && !resendPhoneOTPMutation.isPending) {
      // Resend phone OTP
      resendPhoneOTPMutation.mutate({
        recipient: phoneNumber,
        service: 'phone',
      });
    }
  };

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{translateY: slideAnim}],
              },
            ]}>
            {/* Header with back button */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                <ArrowBack width={24} height={24} fill={colors.grey800} />
              </TouchableOpacity>
            </View>

          {/* Title Section */}
          <Animated.View
            style={[
              styles.titleSection,
              {
                transform: [{translateY: titleAnim}],
              },
            ]}>
            <Text fs="XXXL" color="grey800" style={styles.title}>
              Verify Your
              <Text color="primary"> Number</Text>
            </Text>
            <Text fs="M" color="grey800" style={styles.subtitle}>
              Enter the 4-digit code we sent you
            </Text>
          </Animated.View>

          {/* Phone Number Display */}
          <View style={styles.phoneSection}>
            <Text fs="S" color="grey800" style={styles.phoneLabel}>
              Code sent to:
            </Text>
            <View style={styles.phoneContainer}>
              <Text fs="M" color="grey800" style={styles.phoneNumber}>
                {phoneNumber}
              </Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.goBack()}>
                <EditPencil width={20} height={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* OTP Input */}
          <Animated.View
            style={[
              styles.otpSection,
              {
                transform: [{translateY: otpAnim}],
              },
            ]}>
            <OTPInput
              value={otp}
              onChangeText={handleOTPChange}
              length={4}
            />
          </Animated.View>

          {/* Resend Section */}
          <View style={styles.resendSection}>
            <Text fs="S" color="grey800">
              Didn't Get OTP?
            </Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={!canResend || resendPhoneOTPMutation.isPending}>
              <Text
                fs="S"
                color={
                  canResend && !resendPhoneOTPMutation.isPending
                    ? 'primary'
                    : 'grey400'
                }
                style={styles.resendText}>
                {resendPhoneOTPMutation.isPending
                  ? 'Sending...'
                  : canResend
                  ? 'Resend OTP'
                  : `Resend in ${formatTime(resendTimer)}`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Verify Button */}
          <Animated.View
            style={[
              styles.buttonSection,
              {
                transform: [{translateY: buttonAnim}],
              },
            ]}>
            <Button
              title={
                verifyPhoneOTPMutation.isPending
                  ? 'Verifying...'
                  : 'Verify & Continue'
              }
              onPress={handleVerify}
              disabled={
                otp.length !== 4 || verifyPhoneOTPMutation.isPending
              }
              type={
                otp.length !== 4 || verifyPhoneOTPMutation.isPending
                  ? 'disabled'
                  : 'default'
              }
              style={styles.verifyButton}
            />
          </Animated.View>
        </Animated.View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </GradientBackground>
  );
};

export default Onboard4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
  },
  header: {
    flexDirection: 'row',
//     alignItems: 'center',
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(20),
  },
  backButton: {
    padding: moderateScale(8),
  },
  titleSection: {
//     alignItems: 'center',
    marginBottom: moderateScale(40),
  },
  title: {
//     textAlign: 'center',
    lineHeight: 40,
    marginBottom: moderateScale(12),
  },
  subtitle: {
//     textAlign: 'center',
    lineHeight: 22,
  },
  phoneSection: {
    marginBottom: moderateScale(40),
  },
  phoneLabel: {
    marginBottom: moderateScale(8),
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: moderateScale(8),
    alignItems: 'center',
  },
  phoneNumber: {
    fontFamily: fonts.CabinetBold,
  },
  editButton: {
    padding: moderateScale(3),
  },
  otpSection: {
    marginBottom: moderateScale(40),
  },
  resendSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginBottom: moderateScale(40),
  },
  resendText: {
    fontFamily: fonts.CabinetRegular,
  },
  buttonSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: moderateScale(40),
  },
  verifyButton: {
    width: '100%',
    borderRadius: moderateScale(12),
  },
});
