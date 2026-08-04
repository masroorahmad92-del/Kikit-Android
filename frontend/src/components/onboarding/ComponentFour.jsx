import React, {useRef, useEffect, useState, useImperativeHandle, forwardRef} from 'react';
import {Animated, StyleSheet, View, TouchableOpacity, Image} from 'react-native';
import {Text} from '../base/Text';
import {colors, fonts, moderateScale} from '../../theme';

const ComponentFour = forwardRef(({isVisible, gender, setGender}, ref) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const errorShakeAnim = useRef(new Animated.Value(0)).current;
  const errorOpacityAnim = useRef(new Animated.Value(0)).current;
  const imagesShakeAnim = useRef(new Animated.Value(0)).current;
  const [selectedGender, setSelectedGender] = useState(gender);
  const [genderError, setGenderError] = useState('');

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

    // Shake animation for images
    Animated.sequence([
      Animated.timing(imagesShakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(imagesShakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(imagesShakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(imagesShakeAnim, {
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
      if (!gender || gender.trim().length === 0) {
        setGenderError('Please select your gender');
        triggerErrorAnimation();
        return false;
      }
      setGenderError('');
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

  const handleGenderSelect = (genderValue) => {
    setSelectedGender(genderValue);
    setGender(genderValue);
    // Clear error when gender is selected
    if (genderError) {
      Animated.timing(errorOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setGenderError('');
      });
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
      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text fs="XXXL" color="grey800" style={styles.title}>
          What's your
          <Text color="primary"> gender?</Text>
        </Text>
        <Text fs="M" ff="c-medium" color="grey800" style={styles.subtitle}>
          Select your gender to help personalize your community experience.
        </Text>
      </View>

      {/* Gender Selection Options */}
      <Animated.View
        style={[
          styles.genderSection,
          {
            transform: [{translateX: imagesShakeAnim}],
          },
        ]}>
        {/* Men Option */}
        <TouchableOpacity
          style={[
            styles.genderOption,
            selectedGender === 'men' && styles.genderOptionSelected,
          ]}
          onPress={() => handleGenderSelect('men')}
          activeOpacity={0.7}>
          <View style={[
            styles.genderCircle,
            selectedGender === 'men' && styles.genderCircleSelected,
            genderError && styles.genderCircleError,
          ]}>
            <Image
              source={require('../../assets/images/men.png')}
              style={styles.genderImage}
              resizeMode="contain"
            />
          </View>
          <Text fs="L" color="grey800" style={styles.genderLabel}>
            Men
          </Text>
        </TouchableOpacity>

        {/* Women Option */}
        <TouchableOpacity
          style={[
            styles.genderOption,
            selectedGender === 'women' && styles.genderOptionSelected,
          ]}
          onPress={() => handleGenderSelect('women')}
          activeOpacity={0.7}>
          <View style={[
            styles.genderCircle,
            selectedGender === 'women' && styles.genderCircleSelected,
            genderError && styles.genderCircleError,
          ]}>
            <Image
              source={require('../../assets/images/women.png')}
              style={styles.genderImage}
              resizeMode="contain"
            />
          </View>
          <Text fs="L" color="grey800" style={styles.genderLabel}>
            Women
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Error Display */}
      {genderError ? (
        <Animated.Text
          style={[
            styles.errorText,
            {
              opacity: errorOpacityAnim,
              transform: [{translateX: errorShakeAnim}],
            },
          ]}>
          {genderError}
        </Animated.Text>
      ) : null}
    </Animated.View>
  );
});

ComponentFour.displayName = 'ComponentFour';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
    paddingHorizontal: moderateScale(20),
  },
  titleSection: {
    // alignItems: 'center',
    marginBottom: moderateScale(60),
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
  genderSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    // alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  genderOption: {
    alignItems: 'center',
    flex: 1,
  },
  genderOptionSelected: {
    // Add selection styling if needed
  },
  genderCircle: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.grey100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(16),
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  genderCircleSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.selectedItembgCOlor,
    borderWidth: 1,
  },
  genderCircleError: {
    borderColor: colors.error || '#EF4444',
    borderWidth: 2,
  },
  genderImage: {
    width: moderateScale(80),
    height: moderateScale(80),
  },
  genderLabel: {
    fontFamily: fonts.CabinetRegular,
    textAlign: 'center',
  },
  errorText: {
    marginTop: moderateScale(30),
    textAlign: 'center',
    color: colors.error || '#EF4444',
    fontSize: moderateScale(14),
    fontFamily: fonts.CabinetMedium,
  },
});

export default ComponentFour;
