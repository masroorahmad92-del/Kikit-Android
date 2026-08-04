import React, {useRef, useEffect, useState, forwardRef, useImperativeHandle} from 'react';
import {Animated, StyleSheet, View, TouchableOpacity} from 'react-native';
import {Text} from '../base/Text';
import {Input} from '../base/Input';
import {GlassIcon} from '../../assets/icons';
import {colors, fonts, moderateScale} from '../../theme';

const BirthdayInputComponent = forwardRef(({isVisible, onNext, onBack, birthday, setBirthday}, ref) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const errorShakeAnim = useRef(new Animated.Value(0)).current;
  const errorOpacityAnim = useRef(new Animated.Value(0)).current;
  const inputShakeAnim = useRef(new Animated.Value(0)).current;
  const [birthdayError, setBirthdayError] = useState('');

  useEffect(() => {
    if (isVisible) {
      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // Exit animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -30,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, fadeAnim, slideAnim, progressAnim]);

  const triggerErrorAnimation = () => {
    // Shake animation for error text
    Animated.sequence([
      Animated.timing(errorShakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(errorShakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(errorShakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(errorShakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Shake animation for input field
    Animated.sequence([
      Animated.timing(inputShakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(inputShakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(inputShakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(inputShakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Fade in error message
    Animated.timing(errorOpacityAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Expose validation method to parent
  useImperativeHandle(ref, () => ({
    validate: () => {
      if (!birthday || birthday.trim().length === 0) {
        setBirthdayError('Birthday is required');
        triggerErrorAnimation();
        return false;
      }
      // Basic date format validation (DD/MM/YYYY)
      const datePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      if (!datePattern.test(birthday)) {
        setBirthdayError('Please enter a valid date (DD/MM/YYYY)');
        triggerErrorAnimation();
        return false;
      }
      setBirthdayError('');
      return true;
    },
  }));

  const handleBirthdayChange = text => {
    setBirthday(text);

    // Clear error when user starts typing
    if (birthdayError) {
      Animated.timing(errorOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setBirthdayError('');
      });
    }
  };

  const handleNext = () => {
    if (birthday.trim()) {
      onNext();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{translateY: slideAnim}],
        },
      ]}>
      {/* Back Button */}
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text fs="L" color="grey800">
          ←
        </Text>
      </TouchableOpacity>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
          <View style={styles.progressIcon}>
            <GlassIcon width={24} height={24} fill={colors.primary} />
          </View>
        </View>
      </View>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text fs="XXXL" color="grey800" style={styles.title}>
          When's your
          <Text color="primary"> birthday?</Text>
        </Text>
        <Text fs="M" color="grey800" style={styles.subtitle}>
          We use age to keep community recommendations age-appropriate.
        </Text>
      </View>

      {/* Birthday Input */}
      <View style={styles.inputSection}>
        <Animated.View
          style={[
            styles.inputContainer,
            {
              transform: [{translateX: inputShakeAnim}],
            },
          ]}>
          <Input
            placeholder="DD/MM/YYYY"
            value={birthday}
            onChangeText={handleBirthdayChange}
            style={[
              styles.birthdayInput,
              birthdayError && styles.birthdayInputError,
            ]}
            keyboardType="numeric"
          />
          <View style={styles.calendarIcon}>
            <Text fs="M" color="grey400">
              📅
            </Text>
          </View>
        </Animated.View>
        {birthdayError ? (
          <Animated.Text
            style={[
              styles.errorText,
              {
                opacity: errorOpacityAnim,
                transform: [{translateX: errorShakeAnim}],
              },
            ]}>
            {birthdayError}
          </Animated.Text>
        ) : null}
      </View>

      {/* Next Button */}
      <View style={styles.buttonSection}>
        <Text
          fs="L"
          color="primary"
          style={styles.nextButton}
          onPress={handleNext}>
          Next
        </Text>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
  },
  backButton: {
    position: 'absolute',
    top: moderateScale(10),
    left: moderateScale(20),
    zIndex: 1,
    padding: moderateScale(8),
  },
  progressContainer: {
    marginTop: moderateScale(60),
    marginBottom: moderateScale(40),
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.white,
    borderRadius: 2,
    position: 'relative',
    marginHorizontal: moderateScale(20),
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressIcon: {
    position: 'absolute',
    right: -12,
    top: -10,
    width: 24,
    height: 24,
    backgroundColor: colors.white,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: moderateScale(40),
  },
  title: {
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: moderateScale(12),
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: moderateScale(40),
  },
  inputContainer: {
    position: 'relative',
  },
  birthdayInput: {
    backgroundColor: colors.white,
    borderColor: colors.white,
    borderWidth: 1,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    paddingRight: moderateScale(50),
    fontSize: moderateScale(16),
    fontFamily: fonts.CabinetRegular,
  },
  birthdayInputError: {
    borderColor: colors.error || '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    marginTop: moderateScale(8),
    marginLeft: moderateScale(4),
    color: colors.error || '#EF4444',
    fontSize: moderateScale(14),
    fontFamily: fonts.CabinetMedium,
  },
  calendarIcon: {
    position: 'absolute',
    right: moderateScale(16),
    top: '50%',
    transform: [{translateY: -10}],
  },
  buttonSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: moderateScale(40),
    alignItems: 'center',
  },
  nextButton: {
    fontFamily: fonts.CabinetBold,
    textDecorationLine: 'underline',
  },
});

export default BirthdayInputComponent;
