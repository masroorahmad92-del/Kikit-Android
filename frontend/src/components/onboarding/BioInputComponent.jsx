import React, {useState, useRef, useEffect, forwardRef, useImperativeHandle} from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {Text} from '../base/Text';
import {Input} from '../base/Input';
import {colors, fonts, moderateScale, verticalScale} from '../../theme';

const MIN_BIO_LENGTH = 10;
const MAX_BIO_LENGTH = 500;

const BioInputComponent = forwardRef(({isVisible, bio, setBio}, ref) => {
  const [error, setError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const errorShakeAnim = useRef(new Animated.Value(0)).current;
  const errorOpacityAnim = useRef(new Animated.Value(0)).current;
  const inputShakeAnim = useRef(new Animated.Value(0)).current;

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

  const handleBioChange = (text) => {
    setBio(text);
    // Clear error when user starts typing
    if (error) {
      Animated.timing(errorOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setError('');
      });
    }
  };

  // Expose validate method to parent component
  useImperativeHandle(ref, () => ({
    validate: () => {
      if (!bio || bio.trim().length === 0) {
        setError('Please write something about yourself to continue');
        triggerErrorAnimation();
        return false;
      }
      if (bio.trim().length < MIN_BIO_LENGTH) {
        setError(`Please write at least ${MIN_BIO_LENGTH} characters about yourself`);
        triggerErrorAnimation();
        return false;
      }
      return true;
    },
  }));

  if (!isVisible) {
    return null;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
            Write about
            <Text color="primary"> yourself...</Text>
          </Text>
          <Text fs="M" ff="c-medium" color="grey800" style={styles.subtitle}>
            Write a short bio to help people with shared interests get to know you.
          </Text>
        </View>

        {/* Bio Input */}
        <Animated.View
          style={[
            styles.inputContainer,
            {
              transform: [{translateX: inputShakeAnim}],
            },
          ]}>
          <Input
            type="textarea"
            placeholder="Enter a few words about yourself..."
            value={bio}
            onChangeText={handleBioChange}
            inputStyle={styles.bioInput}
            inputWrapperStyle={[
              styles.bioInputWrapper,
              error && styles.bioInputWrapperError,
            ]}
            placeholderColor={colors.grey800}
            maxLength={MAX_BIO_LENGTH}
          />

          {/* Character Counter */}
          <View style={styles.characterCountContainer}>
            <Text
              fs="S"
              ff="c-medium"
              style={[
                styles.characterCount,
                {
                  color:
                    bio.trim().length >= MIN_BIO_LENGTH
                      ? colors.success || '#10B981'
                      : bio.trim().length > 0
                      ? colors.grey500
                      : colors.grey400,
                },
              ]}>
              {bio.trim().length}/{MIN_BIO_LENGTH} characters (minimum)
            </Text>
            {bio.trim().length >= MIN_BIO_LENGTH && (
              <Text fs="XXS" style={styles.checkmark}>
                ✓
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Animated Error Message */}
        {error ? (
          <Animated.Text
            style={[
              styles.errorText,
              {
                opacity: errorOpacityAnim,
                transform: [{translateX: errorShakeAnim}],
              },
            ]}>
            {error}
          </Animated.Text>
        ) : null}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: moderateScale(20),
  },
  titleSection: {
    marginBottom: verticalScale(40),
  },
  title: {
    textAlign: 'left',
    lineHeight: 40,
    marginBottom: moderateScale(12),
  },
  subtitle: {
    textAlign: 'left',
    lineHeight: 22,
  },
  inputContainer: {
    flex: 1,
  },
  bioInputWrapper: {
    borderColor: colors.white,
    borderWidth: 1,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(16),
    minHeight: verticalScale(180),
  },
  bioInput: {
    fontSize: moderateScale(16),
    fontFamily: fonts.CabinetRegular,
    color: colors.grey800,
    textAlignVertical: 'top',
    minHeight: verticalScale(150),
  },
  bioInputWrapperError: {
    borderColor: colors.error || '#EF4444',
    borderWidth: 1,
  },
  characterCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: moderateScale(8),
    paddingHorizontal: moderateScale(4),
    gap: moderateScale(6),
  },
  characterCount: {
    fontSize: moderateScale(13),
    fontFamily: fonts.CabinetMedium,
  },
  checkmark: {
    fontSize: moderateScale(16),
    color: colors.success || '#10B981',
    fontWeight: 'bold',
  },
  errorText: {
    marginTop: moderateScale(10),
    marginBottom: moderateScale(10),
    textAlign: 'center',
    color: colors.error || '#EF4444',
    fontSize: moderateScale(14),
    fontFamily: fonts.CabinetMedium,
  },
});

export default BioInputComponent;
