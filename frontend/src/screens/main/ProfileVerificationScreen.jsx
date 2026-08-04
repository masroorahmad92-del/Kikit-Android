import React, {useRef, useEffect} from 'react';
import {
  Animated,
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ProfileVerificationCamera from '../../components/ProfileVerificationCamera';
import GradientBackground from '../../components/GradientBackground';
import {Text} from '../../components/base/Text';
import {ArrowBack} from '../../assets/icons';
import {colors, fonts, moderateScale} from '../../theme';
import {useKitkitStore} from '../../store/kitkitStore';

const ProfileVerificationScreen = ({navigation}) => {
  const {setUserProfile, userProfile} = useKitkitStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleVerificationSuccess = updatedProfile => {
    // Update the user profile in the store
    setUserProfile({
      ...userProfile,
      is_profile_verified: true,
      ...updatedProfile,
    });

    // Show success message
    Alert.alert(
      'Verification Complete!',
      'Your profile has been verified successfully.',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ],
    );
  };

  const renderInstructions = () => {
    return (
      <View style={styles.instructionsContainer}>
        <View style={styles.instructionItem}>
          <View style={styles.checkIcon}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
          <Text fs="M" color="grey800" style={styles.instructionText}>
            Ensure your face is well-lit and clearly visible.
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <View style={styles.checkIcon}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
          <Text fs="M" color="grey800" style={styles.instructionText}>
            Hold your phone at eye level and make sure your entire face is within the frame.
          </Text>
        </View>
      </View>
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowBack width={24} height={24} fill={colors.grey800} />
          </TouchableOpacity>
        </View>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{translateY: slideAnim}],
            },
          ]}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text fs="XXXL" color="grey800" style={styles.title}>
              Verify <Text color="primary">Your Profile</Text>
            </Text>
            <Text fs="M" color="grey800" style={styles.subtitle}>
              Take a selfie to verify your profile
            </Text>
          </View>

          {/* Camera Container */}
          <View style={styles.cameraContainer}>
            <ProfileVerificationCamera
              onVerificationSuccess={handleVerificationSuccess}
              navigation={navigation}
            />
          </View>

          {/* Instructions */}
          {renderInstructions()}
        </Animated.View>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(10),
  },
  backButton: {
    padding: moderateScale(8),
  },
  content: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
  },
  titleContainer: {
    marginBottom: moderateScale(24),
  },
  title: {
    fontFamily: fonts.CabinetBold,
    lineHeight: 30,
    marginBottom: moderateScale(1),
  },
  subtitle: {
    fontFamily: fonts.CabinetRegular,
    lineHeight: 22,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: moderateScale(20),
    overflow: 'hidden',
    marginBottom: moderateScale(16),
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  instructionsContainer: {
    marginBottom: moderateScale(20),
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(16),
  },
  checkIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    backgroundColor: colors.normal,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
    marginTop: moderateScale(2),
  },
  checkMark: {
    color: colors.white,
    fontSize: moderateScale(12),
    fontFamily: fonts.CabinetBold,
  },
  instructionText: {
    flex: 1,
    fontFamily: fonts.CabinetRegular,
    lineHeight: 22,
  },
});

export default ProfileVerificationScreen;

