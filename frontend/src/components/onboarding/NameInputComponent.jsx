import React, {useRef, useEffect} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {Text} from '../base/Text';
import {Input} from '../base/Input';
import {ProfileIcon} from '../../assets/icons';
import {colors, fonts, moderateScale} from '../../theme';

const NameInputComponent = ({isVisible, onNext, name, setName}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

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

  const handleNext = () => {
    if (name.trim()) {
      onNext();
    }
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{translateY: slideAnim}],
        },
      ]}>
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
            <ProfileIcon width={24} height={24} fillColor={colors.primary} />
          </View>
        </View>
      </View>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text fs="XXXL" color="grey800" style={styles.title}>
          What's your
          <Text color="primary"> name?</Text>
        </Text>
        <Text fs="M" color="grey800" style={styles.subtitle}>
          This will be visible on your profile
        </Text>
      </View>

      {/* Name Input */}
      <View style={styles.inputSection}>
        <Input
          placeholder="Enter name"
          value={name}
          onChangeText={setName}
          style={styles.nameInput}
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
          spellCheck={false}
        />
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
  },
  progressContainer: {
    marginTop: moderateScale(20),
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

export default NameInputComponent;
