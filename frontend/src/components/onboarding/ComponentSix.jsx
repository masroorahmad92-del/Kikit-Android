import React, {useRef, useEffect, useState, useImperativeHandle, forwardRef} from 'react';
import {Animated, StyleSheet, View, TouchableOpacity, Image} from 'react-native';
import {Text} from '../base/Text';
import {colors, fonts, moderateScale} from '../../theme';

const ComponentSix = forwardRef(({isVisible, genderPreference, setGenderPreference}, ref) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const errorShakeAnim = useRef(new Animated.Value(0)).current;
  const errorOpacityAnim = useRef(new Animated.Value(0)).current;
  const imagesShakeAnim = useRef(new Animated.Value(0)).current;
  const [selectedGender, setSelectedGender] = useState(genderPreference);
  const [genderPreferenceError, setGenderPreferenceError] = useState('');

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
      if (!genderPreference || genderPreference.trim().length === 0) {
        setGenderPreferenceError('Please select your gender preference');
        triggerErrorAnimation();
        return false;
      }
      setGenderPreferenceError('');
      return true;
    },
  }));

  useEffect(() => {
    setSelectedGender(genderPreference);
  }, [genderPreference]);

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

  const handleGenderSelect = (gender) => {
    setSelectedGender(gender);
    setGenderPreference(gender);
    // Clear error when gender preference is selected
    if (genderPreferenceError) {
      Animated.timing(errorOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setGenderPreferenceError('');
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
          Who should appear in your
          <Text color="primary"> community?</Text>
        </Text>
        <Text fs="M" ff="c-medium" color="grey800" style={styles.subtitle}>
          Select the members you prefer to see in public rooms and recommendations.
        </Text>
      </View>

      {/* Gender Selection Options */}
      <Animated.View
        style={[
          styles.selectionSection,
          {
            transform: [{translateX: imagesShakeAnim}],
          },
        ]}>
        {/* Men Option */}
        <TouchableOpacity
          style={[
            styles.genderCard,
            selectedGender === 'men' && styles.genderCardSelected,
          ]}
          onPress={() => handleGenderSelect('men')}
          activeOpacity={0.7}>
          <View style={styles.cardContent}>
            <View style={[
              styles.imageContainer,
              selectedGender === 'men' && styles.imageContainerSelected,
              genderPreferenceError && styles.imageContainerError,
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
          </View>
        </TouchableOpacity>

        {/* Women Option */}
        <TouchableOpacity
          style={[
            styles.genderCard,
            selectedGender === 'women' && styles.genderCardSelected,
          ]}
          onPress={() => handleGenderSelect('women')}
          activeOpacity={0.7}>
          <View style={styles.cardContent}>
            <View style={[
              styles.imageContainer,
              selectedGender === 'women' && styles.imageContainerSelected,
              genderPreferenceError && styles.imageContainerError,
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
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Error Display */}
      {genderPreferenceError ? (
        <Animated.Text
          style={[
            styles.errorText,
            {
              opacity: errorOpacityAnim,
              transform: [{translateX: errorShakeAnim}],
            },
          ]}>
          {genderPreferenceError}
        </Animated.Text>
      ) : null}
    </Animated.View>
  );
});

ComponentSix.displayName = 'ComponentSix';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
    paddingHorizontal: moderateScale(20),
  },
  titleSection: {
    // alignItems: 'center',
    marginBottom: moderateScale(50),
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
  selectionSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  genderCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderCardSelected: {
    // Selection is handled by border color
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    borderWidth: 2,
    borderColor: colors.grey100,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(12),
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainerSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.selectedItembgCOlor,
    borderWidth: 1,
  },
  imageContainerError: {
    borderColor: colors.error || '#EF4444',
    borderWidth: 2,
  },
  genderImage: {
    width: moderateScale(80),
    height: moderateScale(80),
  },
  genderLabel: {
    fontFamily: fonts.CabinetBold,
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

export default ComponentSix;
