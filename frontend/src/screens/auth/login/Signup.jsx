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
import Toast from 'react-native-toast-message';
import {PasswordRequirements} from '../../../components/base/PasswordRequirements';

// Yup validation schema
const signupValidationSchema = Yup.object().shape({
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
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

// Helper function to check if form values are valid
const isFormValid = (email, password, confirmPassword) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  return (
    email.trim() !== '' &&
    emailRegex.test(email) &&
    password.trim() !== '' &&
    passwordRegex.test(password) &&
    confirmPassword.trim() !== '' &&
    password === confirmPassword
  );
};

const Signup = () => {
  const navigation = useNavigation();
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
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

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: payload => onboardingService.createUser(payload),
    onSuccess: (resp, variables) => {
      console.log('Signup successful:', resp);

      Toast.show({
        type: 'success',
        text1: 'Account created successfully!',
        text2: `Welcome ${variables?.email}`,
      });

      // Navigate to EmailInput screen
      navigation.navigate('email-input');
    },
    onError: error => {
      console.error('Signup failed:', error);

      const errorMessage =
        error?.message || 'Failed to create account. Please try again.';

      Toast.show({
        type: 'error',
        text2: 'Signup Failed',
        text1: errorMessage,
      });
    },
  });

  const handleSignup = values => {
    // Call the signup mutation with email and password
    signupMutation.mutate({
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
                  Create your{' '}
                </Text>
                <Text fs="XXXL" ff="c-medium" color="primary">
                  account
                </Text>
              </Text>

              <Text fs="M" ff="i-medium" color="grey800">
                Sign up to get started with your journey
              </Text>
            </View>

            <Formik
              initialValues={{email: '', password: '', confirmPassword: ''}}
              validationSchema={signupValidationSchema}
              validateOnChange={false}
              validateOnBlur={true}
              onSubmit={handleSignup}>
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

                  {/* Confirm Password Input Section */}
                  <View style={styles.inputSection}>
                    <Input
                      placeholder="Confirm your password"
                      placeholderColor={colors.grey400}
                      value={values.confirmPassword}
                      onChangeText={handleChange('confirmPassword')}
                      onBlur={e => {
                        handleBlur('confirmPassword')(e);
                        setIsConfirmPasswordFocused(false);
                      }}
                      onFocus={() => setIsConfirmPasswordFocused(true)}
                      secureTextEntry={true}
                      autoCapitalize="none"
                      autoCorrect={false}
                      error={
                        touched.confirmPassword && errors.confirmPassword
                          ? errors.confirmPassword
                          : ''
                      }
                      inputWrapperStyle={[
                        styles.inputWrapper,
                        !isConfirmPasswordFocused && styles.inputWrapperUnfocused,
                      ]}
                      inputStyle={styles.input}
                    />
                  </View>

                  {/* Sign Up Button */}
                  <View style={styles.buttonSection}>
                    <Button
                      title={
                        signupMutation.isPending
                          ? 'Creating Account...'
                          : 'Sign Up'
                      }
                      onPress={handleSubmit}
                      disabled={
                        !isFormValid(values.email, values.password, values.confirmPassword) ||
                        signupMutation.isPending
                      }
                      type={
                        !isFormValid(values.email, values.password, values.confirmPassword) ||
                        signupMutation.isPending
                          ? 'disabled'
                          : 'default'
                      }
                    />
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

export default Signup;

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
});

