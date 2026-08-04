import React, {useRef, useEffect, useState} from 'react';
import {
  Animated,
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import GradientBackground from '../../../components/GradientBackground';
import {Text} from '../../../components/base/Text';
import {colors, fonts, moderateScale} from '../../../theme';
import {ArrowBack, MapLocationIcon} from '../../../assets/icons';
import {Button} from '../../../components/base/Button';
import Geolocation from '@react-native-community/geolocation';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

const LocationPermissionScreen = ({navigation}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const iconScaleAnim = useRef(new Animated.Value(0.8)).current;
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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
      Animated.spring(iconScaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, iconScaleAnim]);

  const currentProfileData = navigation
    .getState()
    ?.routes?.find(r => r.name === 'location-screen')?.params?.currentProfileData;

  const proceedWithoutLocation = () => {
    navigation.navigate('onboard5', {
      currentStep: 13,
      location: {
        ...currentProfileData?.location,
        latitude: null,
        longitude: null,
      },
      currentProfileData,
    });
  };

  const proceedWithCoordinates = (latitude, longitude) => {
    navigation.navigate('onboard5', {
      currentStep: 13,
      location: {
        ...currentProfileData?.location,
        latitude,
        longitude,
      },
      currentProfileData,
    });
  };

  const getCurrentLocation = () => {
    setIsLoading(true);
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        setIsLoading(false);
        proceedWithCoordinates(latitude, longitude);
      },
      error => {
        setIsLoading(false);
        console.error('Error getting location:', error);
        proceedWithoutLocation();
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  };

  const requestLocationPermission = async () => {
    try {
      const permission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      const result = await check(permission);

      if (result === RESULTS.GRANTED) {
        getCurrentLocation();
        return;
      }

      if (result === RESULTS.DENIED) {
        const requestResult = await request(permission);
        if (requestResult === RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          proceedWithoutLocation();
        }
        return;
      }

      proceedWithoutLocation();
    } catch (error) {
      console.error('Error requesting location permission:', error);
      proceedWithoutLocation();
    }
  };

  const handleContinue = () => {
    requestLocationPermission();
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
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
          <View style={styles.titleSection}>
            <Text fs="XXXL" color="grey800" style={styles.title}>
              Nearby <Text color="primary">Rooms</Text>
            </Text>
            <Text fs="M" color="grey800" style={styles.subtitle}>
              Location helps personalize nearby live rooms and regional
              recommendations. You can use Kikit without sharing your location.
            </Text>
          </View>

          <View style={styles.iconSection}>
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{scale: iconScaleAnim}],
                },
              ]}>
              <MapLocationIcon width={180} height={180} />
            </Animated.View>
          </View>

          <View style={styles.buttonSection}>
            <Button
              title={isLoading ? 'Getting Location...' : 'Continue'}
              onPress={handleContinue}
              disabled={isLoading}
              type={isLoading ? 'disabled' : 'default'}
            />
            <TouchableOpacity
              style={styles.skipButton}
              onPress={proceedWithoutLocation}
              disabled={isLoading}>
              <Text ff="i-semibold" fs="M" color="primary">
                Not now
              </Text>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(10),
  },
  backButton: {
    padding: moderateScale(8),
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(20),
  },
  titleSection: {
    alignItems: 'flex-start',
    marginBottom: moderateScale(40),
  },
  title: {
    lineHeight: 48,
    marginBottom: moderateScale(16),
    fontFamily: fonts.CabinetBold,
  },
  subtitle: {
    lineHeight: 24,
    fontFamily: fonts.CabinetMedium,
  },
  iconSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(60),
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSection: {
    paddingBottom: moderateScale(20),
  },
  skipButton: {
    alignItems: 'center',
    marginTop: moderateScale(16),
    paddingVertical: moderateScale(8),
  },
});

export default LocationPermissionScreen;
