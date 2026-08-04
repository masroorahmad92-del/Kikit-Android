import React, {useRef, useEffect, useState} from 'react';
import {Animated, StyleSheet, View, ImageBackground, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useMutation} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {Text} from '../../../components/base/Text';
import {moderateScale, colors} from '../../../theme';
import {Button} from '../../../components/base/Button';
import CustomCountryPhonePicker from '../../../components/PhoneComponent';
import {useKitkitStore} from '../../../store/kitkitStore';
import {onboardingService} from '../../../api/services/onboardingService';
import {navigateToProfileSetup} from '../../../utils/onboardingNavigation';

const Onboard3 = () => {
  const {user} = useKitkitStore();
  console.log('user', user);
  const navigation = useNavigation();
  const phoneRef = useRef(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  // Initialize with default US country data
  const [selectedCountry, setSelectedCountry] = useState({
    cca2: 'US',
    callingCode: ['1'],
    name: 'United States',
  });
  const [isCountryPickerVisible, setIsCountryPickerVisible] = useState(false);

  const checkPhoneMutation = useMutation({
    mutationFn: payload => onboardingService.checkPhoneNumber(payload),
    onSuccess: (resp, variables) => {
      const exists = resp?.data?.data?.exists;

      if (exists === true) {
        Toast.show({
          type: 'error',
          text1: 'Phone number already in use',
          text2:
            resp?.data?.message ||
            'This number is already registered. Please use a different number.',
        });
        return;
      }

      navigation.navigate('onboard5', {
        phoneNumber: variables.phone_number,
      });
    },
    onError: error => {
      Toast.show({
        type: 'error',
        text1: 'Unable to verify number',
        text2: error?.message || 'Something went wrong. Please try again.',
      });
    },
  });

  // Animation values
  const titleAnim = useRef(new Animated.Value(50)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const inputAnim = useRef(new Animated.Value(30)).current;
  const inputOpacity = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(30)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate title from bottom to top
    Animated.parallel([
      Animated.timing(titleAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate inputs with delay
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(inputAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(inputOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);

    // Animate button with delay
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(buttonAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, 400);
  }, [
    titleAnim,
    titleOpacity,
    inputAnim,
    inputOpacity,
    buttonAnim,
    buttonOpacity,
  ]);

  const handleContinue = () => {
    if (!phoneNumber || !selectedCountry) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Phone Number',
        text2: 'Please enter a valid phone number',
      });
      return;
    }

    // Format phone number with country code
    // callingCode is an array, so take the first element
    const callingCode = Array.isArray(selectedCountry.callingCode)
      ? selectedCountry.callingCode[0]
      : selectedCountry.callingCode;
    const fullPhoneNumber = `+${callingCode}${phoneNumber}`;

    checkPhoneMutation.mutate({phone_number: fullPhoneNumber});
  };

  const handleCountryChange = country => {
    console.log('Country changed in Onboard3:', country); // Debug log
    setSelectedCountry(country);
    setIsCountryPickerVisible(false);
  };
  const handlePhoneChange = (number, country) => {
    setPhoneNumber(number);
    setSelectedCountry(country);
    console.log('Phone:', number);
    console.log('Country:', country?.name, country?.callingCode);
  };
  const getPhoneMask = countryCode => {
    // Return appropriate mask based on country
    switch (countryCode) {
      case 'US':
        return '(XXX) XXX-XXXX';
      case 'GB':
        return 'XXXX XXX XXXX';
      case 'IN':
        return 'XXXXX XXXXX';
      default:
        return 'XXXX-XXXXXXX';
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/images/bg.png')}
      style={styles.container}
      resizeMode="cover">
      <SafeAreaView style={styles.container}>
        {/* Background Hearts */}

        <View style={styles.content}>
          {/* Title */}
          <Animated.View
            style={[
              styles.titleContainer,
              {
                transform: [{translateY: titleAnim}],
                opacity: titleOpacity,
              },
            ]}>
            <Text fs="XXXL" color="grey800" style={styles.title}>
              Add your
              <Text color="primary"> phone number</Text>
              <Text color="grey800"> (optional)</Text>
            </Text>
            <Text fs="S" ff="i-medium" color="grey400" style={styles.subtitle}>
              Verify your number for account recovery. You can skip and add it later in Settings.
            </Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.inputContainer,
              {
                transform: [{translateY: inputAnim}],
                opacity: inputOpacity,
              },
            ]}>
            <CustomCountryPhonePicker
              value={phoneNumber}
              onChangePhoneNumber={handlePhoneChange}
              defaultCountry="US"
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.buttonContainer,
              {
                transform: [{translateY: buttonAnim}],
                opacity: buttonOpacity,
              },
            ]}>
            <Button
              title={
                checkPhoneMutation.isPending ? 'Checking...' : 'Continue'
              }
              onPress={handleContinue}
              disabled={!phoneNumber || checkPhoneMutation.isPending}
              type={
                !phoneNumber || checkPhoneMutation.isPending
                  ? 'disabled'
                  : 'default'
              }
              style={styles.sendOTPButton}
            />
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => navigateToProfileSetup(navigation)}
              disabled={checkPhoneMutation.isPending}>
              <Text fs="M" ff="i-semibold" color="primary">
                Skip for now
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default Onboard3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(60),
    zIndex: 2,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(40),
  },
  title: {
    // textAlign: 'center',
    lineHeight: 40,
  },
  inputContainer: {
    marginBottom: moderateScale(16),
  },
  countrySelector: {
    backgroundColor: '#62bdfa',
    borderRadius: moderateScale(25),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.grey100,
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flagIcon: {
    fontSize: 20,
    marginRight: moderateScale(12),
  },
  countryText: {
    fontSize: moderateScale(16),
    fontFamily: 'CabinetGrotesk-Regular',
    color: colors.grey800,
  },
  chevron: {
    fontSize: moderateScale(12),
    color: colors.grey500,
  },
  buttonContainer: {
    marginTop: moderateScale(40),
    // alignItems: 'center',
  },
  sendOTPButton: {
    width: '100%',
    borderRadius: moderateScale(12),
  },
  skipButton: {
    marginTop: moderateScale(16),
    alignItems: 'center',
    paddingVertical: moderateScale(8),
  },
  subtitle: {
    marginTop: moderateScale(8),
    lineHeight: 22,
  },
});
