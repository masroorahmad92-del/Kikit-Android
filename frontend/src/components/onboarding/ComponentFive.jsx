import React, {useRef, useEffect, useState, useImperativeHandle, forwardRef} from 'react';
import {Animated, StyleSheet, View, TouchableOpacity} from 'react-native';
import {Text} from '../base/Text';
import {FriendsIcon, GiftIcon, VideoIcon} from '../../assets/icons';
import {colors, fonts, moderateScale} from '../../theme';

const ComponentFive = forwardRef(({isVisible, purpose, setPurpose}, ref) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [selectedPurposes, setSelectedPurposes] = useState(
    Array.isArray(purpose) ? purpose : [],
  );
  const [purposeError, setPurposeError] = useState('');

  // Expose validation method to parent
  useImperativeHandle(ref, () => ({
    validate: () => {
      if (!purpose || !Array.isArray(purpose) || purpose.length === 0) {
        setPurposeError('Please select at least one purpose');
        return false;
      }
      setPurposeError('');
      return true;
    },
  }));

  useEffect(() => {
    setSelectedPurposes(Array.isArray(purpose) ? purpose : []);
  }, [purpose]);

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

  const handlePurposeSelect = purposeValue => {
    const updated = selectedPurposes.includes(purposeValue)
      ? selectedPurposes.filter(p => p !== purposeValue)
      : [...selectedPurposes, purposeValue];
    setSelectedPurposes(updated);
    setPurpose(updated);
    if (purposeError) {
      setPurposeError('');
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
          What are you
          <Text color="primary"> here for?</Text>
        </Text>
        <Text fs="M" ff="c-medium" color="grey800" style={styles.subtitle}>
          Let us know what kind of community experience you want on Kikit.
        </Text>
      </View>

      {/* Purpose Selection Cards */}
      <View style={styles.cardsSection}>
        {/* Live rooms card */}
        <TouchableOpacity
          style={[
            styles.purposeCard,
            selectedPurposes.includes('dating') && styles.purposeCardSelected,
          ]}
          onPress={() => handlePurposeSelect('dating')}
          activeOpacity={0.7}>
          <View style={styles.cardContent}>
            <View style={styles.cardLeft}>
              <View style={styles.iconContainer}>
                <VideoIcon width={24} height={24} fill={colors.primary} />
              </View>
              <View style={styles.textContainer}>
                <Text fs="L" color="grey800" style={styles.cardTitle}>
                  Live rooms
                </Text>
                <Text fs="M" color="grey400" style={styles.cardSubtitle}>
                  Join public conversations by interest
                </Text>
              </View>
            </View>
            <View style={styles.radioContainer}>
              <View
                style={[
                  styles.radioButton,
                  selectedPurposes.includes('dating') && styles.radioButtonSelected,
                ]}>
                {selectedPurposes.includes('dating') && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Friendship Card */}
        <TouchableOpacity
          style={[
            styles.purposeCard,
            selectedPurposes.includes('friendship') && styles.purposeCardSelected,
          ]}
          onPress={() => handlePurposeSelect('friendship')}
          activeOpacity={0.7}>
          <View style={styles.cardContent}>
            <View style={styles.cardLeft}>
              <View style={styles.iconContainer}>
                <FriendsIcon width={24} height={24} fill="#4682B4" />
              </View>
              <View style={styles.textContainer}>
                <Text fs="L" color="grey800" style={styles.cardTitle}>
                  Community
                </Text>
                <Text fs="M" color="grey400" style={styles.cardSubtitle}>
                  Build safe verified spaces
                </Text>
              </View>
            </View>
            <View style={styles.radioContainer}>
              <View
                style={[
                  styles.radioButton,
                  selectedPurposes.includes('friendship') && styles.radioButtonSelected,
                ]}>
                {selectedPurposes.includes('friendship') && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Gifting card */}
        <TouchableOpacity
          style={[
            styles.purposeCard,
            selectedPurposes.includes('marriage') && styles.purposeCardSelected,
          ]}
          onPress={() => handlePurposeSelect('marriage')}
          activeOpacity={0.7}>
          <View style={styles.cardContent}>
            <View style={styles.cardLeft}>
              <View style={styles.iconContainer}>
                <GiftIcon width={24} height={24} fill={colors.primary} />
              </View>
              <View style={styles.textContainer}>
                <Text fs="L" color="grey800" style={styles.cardTitle}>
                  Creator support
                </Text>
                <Text fs="M" color="grey400" style={styles.cardSubtitle}>
                  Support hosts with gifts
                </Text>
              </View>
            </View>
            <View style={styles.radioContainer}>
              <View
                style={[
                  styles.radioButton,
                  selectedPurposes.includes('marriage') && styles.radioButtonSelected,
                ]}>
                {selectedPurposes.includes('marriage') && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Error Display */}
      {purposeError ? (
        <View style={styles.errorContainer}>
          <Text fs="S" color="danger" style={styles.errorText}>
            {purposeError}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
});

ComponentFive.displayName = 'ComponentFive';

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
    textAlign: 'center',
    lineHeight: 22,
  },
  cardsSection: {
    gap: moderateScale(16),
  },
  purposeCard: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: colors.grey100,
    padding: moderateScale(16),
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  purposeCardSelected: {
    backgroundColor: '#F8F0FC',
    borderColor: colors.primary,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: moderateScale(12),
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: fonts.CabinetBold,
    marginBottom: moderateScale(4),
  },
  cardSubtitle: {
    fontFamily: fonts.CabinetRegular,
  },
  radioContainer: {
    marginLeft: moderateScale(12),
  },
  radioButton: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: 2,
    borderColor: colors.grey100,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  radioButtonInner: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: colors.white,
  },
  errorContainer: {
    marginTop: moderateScale(30),
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
  },
});

export default ComponentFive;
