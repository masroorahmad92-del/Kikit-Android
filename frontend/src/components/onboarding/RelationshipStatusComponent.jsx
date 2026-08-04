import React, {useState, useRef, useEffect, useImperativeHandle, forwardRef} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {Text} from '../base/Text';
import {colors, fonts, moderateScale, verticalScale} from '../../theme';

const RelationshipStatusComponent = forwardRef(({isVisible, relationshipStatus, setRelationshipStatus}, ref) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const errorShakeAnim = useRef(new Animated.Value(0)).current;
  const errorOpacityAnim = useRef(new Animated.Value(0)).current;
  const optionsShakeAnim = useRef(new Animated.Value(0)).current;
  const [statusError, setStatusError] = useState('');

  const relationshipOptions = [
    'Single',
    'Married',
    'In a Relationship',
    'Divorced',
    'Widowed',
    'It\'s Complicated',
    'Prefer not to say',
  ];

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

  // Expose validation method to parent
  useImperativeHandle(ref, () => ({
    validate: () => {
      if (!relationshipStatus || relationshipStatus.trim().length === 0) {
        setStatusError('Please select your relationship status');
        triggerErrorAnimation();
        return false;
      }
      setStatusError('');
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

  const handleStatusSelect = (status) => {
    setRelationshipStatus(status);
    // Clear error when status is selected
    if (statusError) {
      Animated.timing(errorOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setStatusError('');
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
          Profile
          <Text color="primary"> visibility</Text>
        </Text>
        <Text ff="c-medium" fs="M" color="grey800" style={styles.subtitle}>
          Optional. Choose prefer not to say if you'd rather not share.
        </Text>
      </View>

      {/* Status Options Grid */}
      <View style={styles.optionsContainer}>
        <Animated.View
          style={[
            styles.optionsGrid,
            {
              transform: [{translateX: optionsShakeAnim}],
            },
          ]}>
          {relationshipOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                relationshipStatus === option && styles.selectedOption,
              ]}
              onPress={() => handleStatusSelect(option)}
              activeOpacity={0.7}>
              <Text
                fs="M"
                color={relationshipStatus === option ? 'grey800' : 'grey800'}
                style={[
                  styles.optionText,
                  relationshipStatus === option && styles.selectedOptionText,
                ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>

      {/* Error Display */}
      {statusError ? (
        <Animated.Text
          style={[
            styles.errorText,
            {
              opacity: errorOpacityAnim,
              transform: [{translateX: errorShakeAnim}],
            },
          ]}>
          {statusError}
        </Animated.Text>
      ) : null}
    </Animated.View>
  );
});

RelationshipStatusComponent.displayName = 'RelationshipStatusComponent';

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
    justifyContent: 'space-between',
    // gap: moderateScale(12),
  },
  optionButton: {
    // width: (SCREEN_WIDTH - 64) / 3,
    padding:moderateScale(16),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: colors.grey100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(12),
  },
  selectedOption: {
    backgroundColor: '#F8F0FC',
    borderColor: colors.primary,
    borderWidth: 1,
  },
  optionText: {
    // textAlign: 'center',
    fontFamily: fonts.CabinetMedium,
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

export default RelationshipStatusComponent;
