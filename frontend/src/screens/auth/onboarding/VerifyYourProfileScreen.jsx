import React, {useRef, useEffect} from 'react';
import {Animated, StyleSheet, View, TouchableOpacity, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import ProfileVerificationCamera from '../../../components/ProfileVerificationCamera';
import GradientBackground from '../../../components/GradientBackground';
import {Text} from '../../../components/base/Text';
import {ArrowBack} from '../../../assets/icons';
import {colors, fonts, moderateScale} from '../../../theme';
import {useKitkitStore} from '../../../store/kitkitStore';

const VerifyYourProfileScreen = ({navigation}) => {
  const {setUserProfile, userProfile} = useKitkitStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {toValue: 1, duration: 600, useNativeDriver: true}),
      Animated.timing(slideAnim, {toValue: 0, duration: 600, useNativeDriver: true}),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleVerificationSuccess = updatedProfile => {
    setUserProfile({
      ...userProfile,
      is_profile_verified: true,
      ...updatedProfile,
    });
    Alert.alert(
      'Verification Complete',
      'Your profile has been verified successfully.',
      [{text: 'Continue', onPress: () => navigation.goBack()}],
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowBack width={24} height={24} fill={colors.grey800} />
          </TouchableOpacity>
        </View>
        <Animated.View
          style={[styles.content, {opacity: fadeAnim, transform: [{translateY: slideAnim}]}]}>
          <View style={styles.titleContainer}>
            <Text fs="XXXL" color="grey800" style={styles.title}>
              Verify <Text color="primary">Your Profile</Text>
            </Text>
            <Text fs="M" color="grey800" style={styles.subtitle}>
              Take a selfie to verify your profile with our secure face match
            </Text>
          </View>
          <View style={styles.cameraContainer}>
            <ProfileVerificationCamera
              onVerificationSuccess={handleVerificationSuccess}
              navigation={navigation}
            />
          </View>
        </Animated.View>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  backButton: {padding: moderateScale(8)},
  cameraContainer: {flex: 1, marginTop: moderateScale(16)},
  container: {flex: 1},
  content: {flex: 1, paddingHorizontal: moderateScale(24)},
  header: {paddingHorizontal: moderateScale(16), paddingTop: moderateScale(8)},
  subtitle: {fontFamily: fonts.CabinetRegular, marginTop: moderateScale(8), textAlign: 'center'},
  title: {fontFamily: fonts.CabinetBold, textAlign: 'center'},
  titleContainer: {marginBottom: moderateScale(16), marginTop: moderateScale(8)},
});

export default VerifyYourProfileScreen;
