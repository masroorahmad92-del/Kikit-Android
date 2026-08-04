import React, {useRef, useEffect, useState, useImperativeHandle, forwardRef} from 'react';
import {
  Animated,
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {Text} from '../base/Text';
import {Input} from '../base/Input';
import {colors, fonts, moderateScale} from '../../theme';

const ComponentOne = forwardRef(({isVisible, name, setName}, ref) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const errorShakeAnim = useRef(new Animated.Value(0)).current;
  const errorOpacityAnim = useRef(new Animated.Value(0)).current;
  const inputShakeAnim = useRef(new Animated.Value(0)).current;
  const [nameError, setNameError] = useState('');

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
      if (!name || name.trim().length === 0) {
        setNameError('Name is required');
        triggerErrorAnimation();
        return false;
      }
      if (name.trim().length < 3) {
        setNameError('Name must be at least 3 characters');
        triggerErrorAnimation();
        return false;
      }
      setNameError('');
      return true;
    },
  }));

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
  }, [isVisible, fadeAnim, slideAnim]);

  const handleNameChange = text => {
    setName(text);

    // Clear error when user starts typing
    if (nameError) {
      Animated.timing(errorOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setNameError('');
      });
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{translateY: slideAnim}],
          },
        ]}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text fs="XXXL" color="grey800" style={styles.title}>
            What's your
            <Text color="primary"> name?</Text>
          </Text>
          <Text fs="M" ff="c-medium" color="grey800" style={styles.subtitle}>
            This will be visible on your profile
          </Text>
        </View>

        {/* Name Input */}
        <View style={styles.inputSection}>
          <Animated.View
            style={{
              transform: [{translateX: inputShakeAnim}],
            }}>
            <Input
              placeholder="Enter name"
              value={name}
              onChangeText={handleNameChange}
              style={[
                styles.nameInput,
                nameError && styles.nameInputError,
              ]}
            />
          </Animated.View>
          {nameError ? (
            <Animated.Text
              style={[
                styles.errorText,
                {
                  opacity: errorOpacityAnim,
                  transform: [{translateX: errorShakeAnim}],
                },
              ]}>
              {nameError}
            </Animated.Text>
          ) : null}
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
});

ComponentOne.displayName = 'ComponentOne';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
    paddingHorizontal: moderateScale(20),
  },
  titleSection: {
    // alignItems: 'center',
    marginBottom: moderateScale(40),
  },
  title: {
    // textAlign: 'center',
    lineHeight: 40,
    marginBottom: moderateScale(12),
  },
  subtitle: {
    // textAlign: 'center',
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: moderateScale(40),
  },
  nameInput: {
    backgroundColor: colors.white,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    fontSize: moderateScale(16),
    fontFamily: fonts.CabinetRegular,
  },
  nameInputError: {
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
});

export default ComponentOne;
