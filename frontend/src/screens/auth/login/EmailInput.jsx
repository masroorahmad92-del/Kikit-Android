import {
  Animated,
  StyleSheet,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import React, {useRef, useEffect, useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {Formik} from 'formik';
import * as Yup from 'yup';
import GradientBackground from '../../../components/GradientBackground';
import {Text} from '../../../components/base/Text';
import {Input} from '../../../components/base/Input';
import {Button} from '../../../components/base/Button';
import {colors, moderateScale} from '../../../theme';
import {ArrowBack} from '../../../assets/icons';
import {useMutation} from '@tanstack/react-query';
import {onboardingService} from '../../../api/services/onboardingService';
import {userService} from '../../../api/services/userService';
import Toast from 'react-native-toast-message';
import {PasswordRequirements} from '../../../components/base/PasswordRequirements';
import {useKitkitStore} from '../../../store/kitkitStore';
import notificationService from '../../../services/NotificationService';
import {revenueCatLogin} from '../../../utils/revenueCatHelper';
import {navigateToProfileSetup} from '../../../utils/onboardingNavigation';

// Yup validation schema
const emailValidationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email address is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    )
    .required('Password is required'),
});

// Helper function to check if form values are valid
const isFormValid = (email, password) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  return (
    email.trim() !== '' &&
    emailRegex.test(email) &&
    password.trim() !== '' &&
    passwordRegex.test(password)
  );
};

const EmailInput = () => {
  const navigation = useNavigation();
  const {setUser, setToken, setUserProfile} = useKitkitStore();
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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
  }, [fadeAnim, slideAnim]);
  // Profile fetch mutation (used when otp_bypass is true)
  const getMyProfileMutation = useMutation({
    mutationFn: () => userService.getMyProfile(),
    onSuccess: async resp => {
      const profileData = resp?.data?.data;

      if (profileData) {
        setUserProfile(profileData);

        if (profileData.is_profile_complete === true) {
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

  // Login mutation: Send OTP
  const loginUserMutation = useMutation({
    mutationFn: payload => onboardingService.loginUser(payload),
    onSuccess: (resp, variables) => {
      console.log('Login successful:', resp);

      const userData = resp?.data?.data;

      // If otp_bypass is true, handle login directly
      if (userData?.otp_bypass === true && userData?.access_token) {
        setUser(userData);
        getMyProfileMutation.mutate();
        return;
      }

      // Otherwise, navigate to OTP verification screen
      Toast.show({
        type: 'success',
        text1: `OTP sent successfully to ${variables?.email}`,
      });

      navigation.navigate('otp-verification', {
        email: variables?.email,
        isEmail: true,
      });
    },
    onError: error => {
      console.error('Login failed:', error);

      const errorMessage =
        error?.message || 'Login failed. Please check your credentials.';

      Toast.show({
        type: 'error',
        text2: 'Login Failed',
        text1: errorMessage,
      });
    },
  });

  const handleSendOTP = values => {
    // Call the login mutation with email and password to send OTP
    loginUserMutation.mutate({
      email: values.email,
      password: values.password,
    });
  };

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
              <ArrowBack />
            </TouchableOpacity>

            {/* Header Section */}
            <View style={styles.headerSection}>
              <Text fs="XXXL" ff="c-medium" style={styles.mainHeading}>
                <Text fs="XXXL" ff="c-medium" color="grey800">
                  What's your{' '}
                </Text>
                <Text fs="XXXL" ff="c-medium" color="primary">
                  email address?
                </Text>
              </Text>

              <Text fs="M" ff="i-medium" color="grey800">
                We will email you a code to verify your identity
              </Text>
            </View>

            <Formik
              initialValues={{email: '', password: ''}}
              validationSchema={emailValidationSchema}
              validateOnChange={false}
              validateOnBlur={true}
              onSubmit={handleSendOTP}>
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
                isValid,
              }) => (
                <>
                  {/* Email Input Section */}
                  <View style={styles.inputSection}>
                    <Input
                      placeholder="Enter your email address"
                      placeholderColor={colors.grey400}
                      value={values.email}
                      onChangeText={handleChange('email')}
                      onBlur={e => {
                        handleBlur('email')(e);
                        setIsEmailFocused(false);
                      }}
                      onFocus={() => setIsEmailFocused(true)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      error={touched.email && errors.email ? errors.email : ''}
                      inputWrapperStyle={[
                        styles.inputWrapper,
                        !isEmailFocused && styles.inputWrapperUnfocused,
                      ]}
                      inputStyle={styles.input}
                    />
                  </View>

                  {/* Password Input Section */}
                  <View style={styles.inputSection}>
                    <Input
                      placeholder="Enter your password"
                      placeholderColor={colors.grey400}
                      value={values.password}
                      onChangeText={handleChange('password')}
                      onBlur={e => {
                        handleBlur('password')(e);
                        setIsPasswordFocused(false);
                      }}
                      onFocus={() => setIsPasswordFocused(true)}
                      secureTextEntry={true}
                      autoCapitalize="none"
                      autoCorrect={false}
                      error={
                        touched.password && errors.password
                          ? errors.password
                          : ''
                      }
                      inputWrapperStyle={[
                        styles.inputWrapper,
                        !isPasswordFocused && styles.inputWrapperUnfocused,
                      ]}
                      inputStyle={styles.input}
                    />
                    <PasswordRequirements
                      password={values.password}
                      show={isPasswordFocused || values.password.length > 0}
                    />
                  </View>

                  {/* Send OTP Button */}
                  <View style={styles.buttonSection}>
                    <Button
                      title={
                        loginUserMutation.isPending
                          ? 'Sending...'
                          : 'Send OTP'
                      }
                      onPress={handleSubmit}
                      disabled={
                        !isFormValid(values.email, values.password) ||
                        loginUserMutation.isPending
                      }
                      type={
                        !isFormValid(values.email, values.password) ||
                        loginUserMutation.isPending
                          ? 'disabled'
                          : 'default'
                      }
                    />

                    {/* Sign Up Link */}
                    <TouchableOpacity
                      style={styles.signupButton}
                      onPress={() => navigation.navigate('signup')}
                      disabled={loginUserMutation.isPending}>
                      <Text fs="M" ff="i-medium" color="grey800">
                        Don't have an account?{' '}
                        <Text fs="M" ff="i-semibold" color="primary">
                          Sign up
                        </Text>
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </Formik>
          </Animated.View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </GradientBackground>
  );
};

export default EmailInput;

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
    width: moderateScale(40),
  },
  headerSection: {
    marginBottom: moderateScale(40),
  },
  mainHeading: {
    marginBottom: moderateScale(16),
    lineHeight: 50,
  },
  subHeading: {
    lineHeight: 24,
  },
  inputSection: {
    marginBottom: moderateScale(10),
  },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 2,
  },
  inputWrapperUnfocused: {
    borderColor: colors.white,
  },
  input: {
    fontSize: moderateScale(16),
    color: colors.grey800,
  },
  buttonSection: {
    marginTop: 'auto',
    marginBottom: moderateScale(30),
  },
  signupButton: {
    marginTop: moderateScale(20),
    alignItems: 'center',
  },
});
