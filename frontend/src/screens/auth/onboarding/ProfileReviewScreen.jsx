import React, {useRef, useEffect, useState} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import GradientBackground from '../../../components/GradientBackground';
import {Text} from '../../../components/base/Text';
import {Button} from '../../../components/base/Button';
import {HeartBreak, VerificationIcon} from '../../../assets/icons';
import {colors, fonts, moderateScale} from '../../../theme';
import VerificationModal from '../../../components/base/VerificationModal';

const ProfileReviewScreen = ({navigation}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [modalVisible, setModalVisible] = useState(false);

  const handleShowModal = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleVerifyNow = () => {
    console.log('Verify Now pressed');
    setModalVisible(false);
    // Navigate to verification screen
    navigation.navigate('verify-profile-screen');
  };

  const handleMaybeLater = () => {
    console.log('Maybe Later pressed');
    setModalVisible(false);
  };

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  const handleContinue = () => {
     setModalVisible(true)
    // Navigate to next screen
    console.log('Continue to next screen');
    // navigation.navigate('NextScreen');
  };

  return (
    <GradientBackground>
      <VerificationModal
        visible={modalVisible}
        onClose={handleCloseModal}
        onPrimaryPress={handleVerifyNow}
        onSecondaryPress={handleMaybeLater}
        icon={<VerificationIcon width={60} height={60} />}
        title="Get Verified"
        description="Verify your profile with a quick selfie. Once approved, you'll get a verified badge. Your selfie stays private with us"
        primaryButtonText="Verify Now"
        secondaryButtonText="Maybe Later"
      />
      <SafeAreaView style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{translateY: slideAnim}],
            },
          ]}>
          {/* Heart Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{scale: scaleAnim}],
              },
            ]}>
            <HeartBreak width={moderateScale(80)} height={moderateScale(80)} />
          </Animated.View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text fs="XXXL" color="grey800" style={styles.title}>
              We're Reviewing Your Profile
            </Text>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text fs="M" color="grey800" style={styles.description}>
              Thanks for completing your setup. Our team is reviewing your
              profile, and once approved, it will be visible to others.
            </Text>
          </View>

          {/* Continue Button */}
          <View style={styles.buttonContainer}>
            <Button
              title="Continue"
              onPress={handleContinue}
              buttonStyle={styles.continueButton}
              textStyle={styles.continueButtonText}
            />
          </View>
        </Animated.View>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  iconContainer: {
    marginBottom: moderateScale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    marginBottom: moderateScale(24),
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.CabinetBold,
    textAlign: 'center',
    lineHeight: 40,
  },
  descriptionContainer: {
    marginBottom: moderateScale(60),
    alignItems: 'center',
  },
  description: {
    fontFamily: fonts.CabinetRegular,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  continueButton: {
    //     width: '100%',
    height: moderateScale(56),
    //     borderRadius: moderateScale(28),
    marginVertical: moderateScale(8),
  },
  continueButtonText: {
    fontFamily: fonts.CabinetBold,
    fontSize: moderateScale(16),
    color: colors.white,
  },
});

export default ProfileReviewScreen;
