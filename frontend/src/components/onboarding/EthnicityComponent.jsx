import React, {useState, useRef, useEffect, forwardRef, useImperativeHandle} from 'react';
import {View, StyleSheet, TouchableOpacity, Animated} from 'react-native';
import {Text} from '../base/Text';
import {
  colors,
  fonts,
  moderateScale,
  verticalScale,
} from '../../theme';

const EthnicityComponent = forwardRef(({isVisible, ethnicity, setEthnicity}, ref) => {
  const [error, setError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const errorShakeAnim = useRef(new Animated.Value(0)).current;
  const errorOpacityAnim = useRef(new Animated.Value(0)).current;
  const optionsShakeAnim = useRef(new Animated.Value(0)).current;

  const ethnicityOptions = [
    'Asian',
    'Pakistani',
    'Latin',
    'European',
    'South Asian',
    'Middle Eastern',
    'White Caucasian',
    'Hispanic Latino',
    'Mixed Race',
    'Other',
  ];

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

    // Shake animation for options
    Animated.sequence([
      Animated.timing(optionsShakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(optionsShakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(optionsShakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(optionsShakeAnim, {
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

  const handleEthnicitySelect = selectedEthnicity => {
    setEthnicity(selectedEthnicity);
    // Clear error when user makes a selection
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
      if (!ethnicity) {
        setError('Please select your ethnicity to continue');
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
          <Text color="primary"> Ethnicity?</Text>
        </Text>
        <Text fs="M" color="grey800" style={styles.subtitle}>
          Add your religion to find meaningful connections.
        </Text>
      </View>

      {/* Ethnicity Options Grid */}
      <View style={styles.optionsContainer}>
        <Animated.View
          style={[
            styles.optionsGrid,
            {
              transform: [{translateX: optionsShakeAnim}],
            },
          ]}>
          {ethnicityOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                ethnicity === option && styles.selectedOption,
              ]}
              onPress={() => handleEthnicitySelect(option)}
              activeOpacity={0.7}>
              <Text
                fs="M"
                ff="c-medium"
                color={ethnicity === option ? 'grey800' : 'grey800'}
                style={[ethnicity === option && styles.selectedOptionText]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>

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
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: moderateScale(20),
  },
  titleSection: {
    marginBottom: verticalScale(30),
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
  optionsContainer: {
    flex: 1,
    // justifyContent: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // justifyContent: 'space-between',
    gap: moderateScale(13),
  },
  optionButton: {
    // width: (SCREEN_WIDTH - 64) / 3,
    padding: moderateScale(16),
    // backgroundColor: colors.white,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: colors.grey100,
    alignItems: 'center',
    justifyContent: 'center',
    // marginBottom: moderateScale(12),
  },
  selectedOption: {
    backgroundColor: '#F8F0FC',
    borderColor: colors.primary,
    borderWidth: 1,
  },

  selectedOptionText: {
    fontFamily: fonts.CabinetBold,
  },
  errorText: {
    marginTop: moderateScale(20),
    textAlign: 'center',
    color: colors.error || '#EF4444',
    fontSize: moderateScale(14),
    fontFamily: fonts.CabinetMedium,
  },
});

export default EthnicityComponent;
