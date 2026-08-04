import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {SafeAreaView} from 'react-native-safe-area-context';
import GradientBackground from '../../../components/GradientBackground';
import {Text} from '../../../components/base/Text';
import {Button} from '../../../components/base/Button';
import {FadeModal} from '../../../components/base/FadeModal';
import ComponentOne from '../../../components/onboarding/ComponentOne';
import ComponentTwo from '../../../components/onboarding/ComponentTwo';
import ComponentThree from '../../../components/onboarding/ComponentThree';
import ComponentFour from '../../../components/onboarding/ComponentFour';
import ComponentFive from '../../../components/onboarding/ComponentFive';
import ComponentSix from '../../../components/onboarding/ComponentSix';
import ComponentSeven from '../../../components/onboarding/ComponentSeven';
import RelationshipStatusComponent from '../../../components/onboarding/RelationshipStatusComponent';
import EthnicityComponent from '../../../components/onboarding/EthnicityComponent';
import InterestsComponent from '../../../components/onboarding/InterestsComponent';
import HobbiesComponent from '../../../components/onboarding/HobbiesComponent';
import BioInputComponent from '../../../components/onboarding/BioInputComponent';
import PhotoUploadComponent from '../../../components/onboarding/PhotoUploadComponent';
import {
  ProfileIcon,
  GlassIcon,
  LocationIcon,
  HeartFilledIcon,
  ScaleIcon,
  ArrowBack,
  HeartIcon,
} from '../../../assets/icons';
import {colors, fonts, moderateScale} from '../../../theme';
import {useKitkitStore} from '../../../store/kitkitStore';
import Toast from 'react-native-toast-message';
import {useMutation} from '@tanstack/react-query';
import {userService} from '../../../api/services/userService';
import {preferencesService} from '../../../api/services/preferencesService';
import {Country} from 'country-state-city';
import {useNavigation} from '@react-navigation/native';
import notificationService from '../../../services/NotificationService';
import {revenueCatLogin} from '../../../utils/revenueCatHelper';
import {hasValidPrefillName} from '../../../utils/ssoProfileHelper';

const Onboard5 = ({route}) => {
  const navigation = useNavigation();
  const {setToken, user, onboardingPhotos, setOnboardingPhotos, ssoProfile, userProfile} =
    useKitkitStore();
  const phoneNumberFromRoute = route?.params?.phoneNumber || '';
  const currentStepFromRoute = route?.params?.currentStep || 1;
  const locationFromRoute = route?.params?.location || null;
  const prefillNameFromRoute = route?.params?.prefillName || '';
  const skipNameStepFromRoute = route?.params?.skipNameStep === true;

  const resolvedPrefillName =
    prefillNameFromRoute ||
    ssoProfile?.name ||
    userProfile?.name ||
    '';

  const initialStep =
    currentStepFromRoute > 1
      ? currentStepFromRoute
      : skipNameStepFromRoute || hasValidPrefillName(resolvedPrefillName)
      ? 2
      : 1;

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [name, setName] = useState(resolvedPrefillName);
  const [birthday, setBirthday] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(phoneNumberFromRoute);
  const defaultLocation = {
    country: '',
    city: null,
    state: '',
    country_code: '',
    latitude: null,
    longitude: null,
    preferredCountryIsoCodes: [],
  };
  const [location, setLocation] = useState(() =>
    locationFromRoute ? {...defaultLocation, ...locationFromRoute} : defaultLocation,
  );
  const [gender, setGender] = useState('');
  const [purpose, setPurpose] = useState([]);
  const [genderPreference, setGenderPreference] = useState('');
  const [height, setHeight] = useState('');
  const [relationshipStatus, setRelationshipStatus] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [interests, setInterests] = useState([]);
  const [hobbies, setHobbies] = useState([]);
  const [bio, setBio] = useState('');
  const [photos, setPhotosState] = useState(onboardingPhotos || []);
  const setPhotos = useCallback((updater) => {
    setPhotosState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setOnboardingPhotos(next);
      return next;
    });
  }, [setOnboardingPhotos]);
  const [isLoading, setIsLoading] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const iconPositionAnim = useRef(new Animated.Value(0)).current;
  const modalRef = useRef(null);
  const componentOneRef = useRef(null);
  const componentTwoRef = useRef(null);
  const componentThreeRef = useRef(null);
  const componentFourRef = useRef(null);
  const componentFiveRef = useRef(null);
  const componentSixRef = useRef(null);
  const componentSevenRef = useRef(null);
  const relationshipStatusRef = useRef(null);
  const ethnicityRef = useRef(null);
  const interestsRef = useRef(null);
  const hobbiesRef = useRef(null);
  const bioRef = useRef(null);

  // Map API ethnicity values to EthnicityComponent display labels
  const apiEthnicityToDisplay = useCallback(value => {
    const key = String(value || '')
      .toLowerCase()
      .trim();
    const map = {
      asian: 'Asian',
      pakistani: 'Pakistani',
      latin: 'Latin',
      european: 'European',
      south_asian: 'South Asian',
      middle_eastern: 'Middle Eastern',
      white_caucasian: 'White Caucasian',
      hispanic_latino: 'Hispanic Latino',
      mixed_race: 'Mixed Race',
      other: 'Other',
    };
    return map[key] || '';
  }, []);

  // Restore profile data when returning from location screen
  useEffect(() => {
    if (route?.params?.currentProfileData) {
      const data = route.params.currentProfileData;
      setName(data.name || '');
      setBirthday(data.birthday || '');
      setPhoneNumber(data.phoneNumber || phoneNumberFromRoute);
      setGender(data.gender || '');
      setPurpose(data.purpose || []);
      setGenderPreference(data.genderPreference || '');
      setHeight(data.height || '');
      setRelationshipStatus(data.relationshipStatus || '');
      setEthnicity(data.ethnicity || '');
      setInterests(data.interests || []);
      setHobbies(data.hobbies || []);
      setBio(data.bio || '');

      // Update location if returned from location screen
      if (route.params.location) {
        setLocation(route.params.location);
      }
    }
  }, [route?.params]);

  // Prefill onboarding from saved preferences (GET preferences/me)
  useEffect(() => {
    if (route?.params?.currentProfileData) {
      return;
    }

    let cancelled = false;

    const loadPreferences = async () => {
      try {
        const response = await preferencesService.getPreferences();
        if (cancelled) {
          return;
        }

        const body = response?.data;
        let prefs = body?.data;
        if (
          !prefs &&
          body &&
          typeof body === 'object' &&
          Array.isArray(body.looking_for)
        ) {
          prefs = body;
        }

        if (!prefs || typeof prefs !== 'object') {
          return;
        }

        if (Array.isArray(prefs.looking_for) && prefs.looking_for.length > 0) {
          setPurpose(
            prefs.looking_for.map(v => String(v).toLowerCase()).filter(Boolean),
          );
        }

        const interestedRaw = prefs.interested_in;
        if (interestedRaw) {
          const raw = Array.isArray(interestedRaw)
            ? interestedRaw[0]
            : interestedRaw;
          const v = String(raw || '')
            .toLowerCase()
            .trim();
          if (v === 'men' || v === 'male' || v === 'man') {
            setGenderPreference('men');
          } else if (v === 'women' || v === 'female' || v === 'woman') {
            setGenderPreference('women');
          }
        }

        if (Array.isArray(prefs.ethnicity) && prefs.ethnicity.length > 0) {
          for (const item of prefs.ethnicity) {
            const label = apiEthnicityToDisplay(item);
            if (label) {
              setEthnicity(label);
              break;
            }
          }
        }

        if (Array.isArray(prefs.interests) && prefs.interests.length > 0) {
          setInterests(prefs.interests);
        }

        if (Array.isArray(prefs.hobbies)) {
          setHobbies(prefs.hobbies);
        }

        if (Array.isArray(prefs.country) && prefs.country.length > 0) {
          const codes = prefs.country.map(x => String(x).toUpperCase());
          const c = Country.getAllCountries().find(
            x => x.isoCode === codes[0],
          );
          setLocation(prev => ({
            ...prev,
            preferredCountryIsoCodes: codes,
            ...(c && {
              country: prev.country || c.name,
              country_code: prev.country_code || c.phonecode,
              latitude:
                prev.latitude != null
                  ? prev.latitude
                  : c.latitude
                  ? parseFloat(c.latitude)
                  : null,
              longitude:
                prev.longitude != null
                  ? prev.longitude
                  : c.longitude
                  ? parseFloat(c.longitude)
                  : null,
            }),
          }));
        }
      } catch (e) {
        console.log('Onboard5: preferences/me not loaded', e?.message);
      }
    };

    loadPreferences();

    return () => {
      cancelled = true;
    };
  }, [route?.params?.currentProfileData, apiEthnicityToDisplay]);

  // Complete profile mutation (PATCH request)
  const createProfileMutation = useMutation({
    mutationFn: profileData => userService.completeProfile(profileData),
    onSuccess: async resp => {
      console.log('Profile created successfully:', resp);

      setIsLoading(false);

      // Update user data if returned
      // if (resp?.data?.data) {
      //   // setUser(resp.data.data);
      //   // Set apiToken to trigger navigation to Main app
      //   if (resp.data.data.access_token) {
      // Log in to RevenueCat BEFORE setToken (setToken triggers navigation)
      const userId = user?.user?.id;
      if (userId) {
        await revenueCatLogin(userId);
      }

      // Send FCM token to backend after profile completion
      try {
        await notificationService.sendFCMTokenToBackend();
        console.log('FCM token sent to backend after profile completion');
      } catch (error) {
        console.error('Failed to send FCM token:', error);
        // Don't block user flow if FCM token fails
      }

      // Set token last — this triggers navigation to main app
      setToken(user.access_token);
      //   }
      // } else if (user?.access_token) {
      //   // Use existing token if response doesn't include it
      //   setToken(user.access_token);
      // }

      Toast.show({
        type: 'success',
        text1: 'Profile created successfully! 🎉',
      });

      // The RootNavigator will automatically switch to MainStackNavigator
      // when apiToken is set, so no manual navigation needed
    },
    onError: error => {
      console.error('Failed to create profile:', error);

      setIsLoading(false);

      const errorMessage =
        error?.message || 'Failed to create profile. Please try again.';

      Toast.show({
        type: 'error',
        text1: 'Profile Creation Failed',
        text2: errorMessage,
      });
    },
  });

  // Mapping of steps to left positions for the progress icon
  const getIconPosition = step => {
    const positions = {
      1: 0,
      2: 30,
      3: 60,
      4: 90,
      5: 120,
      6: 150,
      7: 180,
      8: 210,
      9: 240,
      10: 268,
      11: Dimensions.get('window').width>390? 310 : 290,
      12: Dimensions.get('window').width>390? 330 : 290,
      13: Dimensions.get('window').width>390? 360 : 330,
    };
    return positions[step] || 0;
  };

  useEffect(() => {
    
    // Animate progress bar based on current step
    let progressValue = 0;
    if (currentStep === 1) {
      progressValue = 0.08;
    } else if (currentStep === 2) {
      progressValue = 0.15;
    } else if (currentStep === 3) {
      progressValue = 0.23;
    } else if (currentStep === 4) {
      progressValue = 0.31;
    } else if (currentStep === 5) {
      progressValue = 0.38;
    } else if (currentStep === 6) {
      progressValue = 0.46;
    } else if (currentStep === 7) {
      progressValue = 0.54;
    } else if (currentStep === 8) {
      progressValue = 0.62;
    } else if (currentStep === 9) {
      progressValue = 0.69;
    } else if (currentStep === 10) {
      progressValue = 0.77;
    } else if (currentStep === 11) {
      progressValue = 0.87;
    } else if (currentStep === 12) {
      progressValue = 0.92;
    } else if (currentStep === 13) {
      progressValue = 1;
    }
    console.log('progressValue step:', progressValue);
    console.log('Current step:', currentStep);

    // Animate both progress bar and icon position
    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: progressValue,
        duration: 500,
        useNativeDriver: false,
      }),
      Animated.timing(iconPositionAnim, {
        toValue: getIconPosition(currentStep),
        duration: 500,
        useNativeDriver: false,
      }),
    ]).start();
  }, [currentStep, progressAnim, iconPositionAnim]);

  const normalizeGender = value => {
    const lower = (value || '').toLowerCase();
    if (['male', 'man', 'men'].includes(lower)) {
      return 'male';
    }
    if (['female', 'woman', 'women'].includes(lower)) {
      return 'female';
    }
    return lower || null;
  };

  // Map ethnicity display names to API values
  const normalizeEthnicity = value => {
    const ethnicityMap = {
      Asian: 'asian',
      Pakistani: 'pakistani',
      Latin: 'latin',
      European: 'european',
      'South Asian': 'south_asian',
      'Middle Eastern': 'middle_eastern',
      'White Caucasian': 'white_caucasian',
      'Hispanic Latino': 'hispanic_latino',
      'Mixed Race': 'mixed_race',
      Other: 'other',
    };
    return (
      ethnicityMap[value] || (value || '').toLowerCase().replace(/\s+/g, '_')
    );
  };

  // Map relationship status display names to API values
  const normalizeRelationshipStatus = value => {
    const statusMap = {
      Single: 'single',
      Married: 'married',
      'In a Relationship': 'in_a_relationship',
      Divorced: 'divorced',
      Widowed: 'widowed',
      "It's Complicated": 'complicated',
      'Prefer not to say': 'prefer_not_to_say',
    };
    return (
      statusMap[value] ||
      (value || '').toLowerCase().replace(/\s+/g, '_').replace(/[\']/g, '')
    );
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate name with ComponentOne's validation
      if (componentOneRef.current?.validate()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      // Validate birthday with ComponentTwo's validation
      if (componentTwoRef.current?.validate()) {
        // Open birthday confirmation modal
        modalRef.current?.open();
      }
    } else if (currentStep === 3) {
      // Validate location with ComponentThree's validation
      if (componentThreeRef.current?.validate()) {
        setCurrentStep(4);
      }
    } else if (currentStep === 4) {
      // Validate gender with ComponentFour's validation
      if (componentFourRef.current?.validate()) {
        setCurrentStep(5);
      }
    } else if (currentStep === 5) {
      // Validate purpose with ComponentFive's validation
      if (componentFiveRef.current?.validate()) {
        setCurrentStep(6);
      }
    } else if (currentStep === 6) {
      // Validate gender preference with ComponentSix's validation
      if (componentSixRef.current?.validate()) {
        setCurrentStep(7);
      }
    } else if (currentStep === 7) {
      // Validate height with ComponentSeven's validation
      if (componentSevenRef.current?.validate()) {
        setCurrentStep(8);
      }
    } else if (currentStep === 8) {
      // Validate relationship status with RelationshipStatusComponent's validation
      if (relationshipStatusRef.current?.validate()) {
        setCurrentStep(9);
      }
    } else if (currentStep === 9) {
      // Validate ethnicity with EthnicityComponent's validation
      if (ethnicityRef.current?.validate()) {
        setCurrentStep(10);
      }
    } else if (currentStep === 10) {
      // Validate interests with InterestsComponent's validation
      if (interestsRef.current?.validate()) {
        setCurrentStep(11);
      }
    } else if (currentStep === 11) {
      // Validate hobbies with HobbiesComponent's validation
      if (hobbiesRef.current?.validate()) {
        setCurrentStep(12);
      }
    } else if (currentStep === 12) {
      if (bioRef.current?.validate()) {
        setCurrentStep(13);
      }
    } else if (currentStep === 13) {
      if (photos.length >= 4) {
        // Extract unique interest IDs
        const interestIds = [
          ...new Set(
            interests
              .map(interest => interest?.id || interest?.name)
              .filter(Boolean),
          ),
        ];

        // Extract unique hobby IDs
        const hobbyIds = [
          ...new Set(
            hobbies.map(hobby => hobby?.id || hobby?.name).filter(Boolean),
          ),
        ];

        // Map gender to male/female
        const mappedGender = normalizeGender(gender);

        // Map gender preference to lowercase
        const mappedGenderPreference = genderPreference.toLowerCase(); // "Men" -> "men", "Women" -> "women"

        // Helper function to lowercase string values
        const toLowerCase = value => {
          if (typeof value === 'string') {
            return value.toLowerCase();
          }
          return value;
        };

        // Handle final submission - call API to create profile
        const profileData = {
          name: toLowerCase(name),
          dob: birthday ? birthday.replace(/\//g, '-') : birthday,
          ...(phoneNumber ? {phone_number: phoneNumber} : {}),
          country_code: location.country_code
            ? `+${location.country_code}`
            : null,
          country: toLowerCase(location.country),
          city: toLowerCase(location.city),
          state: toLowerCase(location.state),
          latitude: location.latitude ? parseFloat(location.latitude) : null,
          longitude: location.longitude ? parseFloat(location.longitude) : null,
          location_enabled: Boolean(location.latitude && location.longitude),
          gender: mappedGender,
          looking_for: purpose.map(toLowerCase),
          interested_in: mappedGenderPreference,
          height: toLowerCase(height),
          current_status: normalizeRelationshipStatus(relationshipStatus),
          ethnicity: normalizeEthnicity(ethnicity),
          interests: interestIds,
          hobbies: hobbyIds,
          about: toLowerCase(bio),
          is_profile_complete: true,
          photos: photos.map(photo => ({
            url: photo.url || photo.uri,
            public_id: photo.public_id,
            filename: photo.filename,
            is_primary: photo.is_primary || false,
          })),
        };

        console.log('Submitting profile data:', profileData);
        setIsLoading(true);
        createProfileMutation.mutate(profileData);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Please upload at least 4 photos',
        });
      }
    }
  };

  const calculateAge = birthDate => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      return age - 1;
    }
    return age;
  };

  const handleBirthdayConfirm = () => {
    // Close modal first, then move to next step after animation completes
    modalRef.current?.close();
    // Use setTimeout to defer state update until after modal close animation
    // This prevents blocking the modal animation with heavy ComponentThree initialization
    setTimeout(() => {
      setCurrentStep(3);
    }, 200); // Slightly longer than modal close animation (300ms)
  };

  const handleBirthdayEdit = () => {
    modalRef.current?.close();
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Check if current step has valid data
  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 1:
        return name && name.trim().length >= 3;
      case 2:
        return birthday && birthday.length > 0;
      case 3:
        return location.country && location.state;
      case 4:
        return gender && gender.length > 0;
      case 5:
        return Array.isArray(purpose) && purpose.length > 0;
      case 6:
        return genderPreference && genderPreference.length > 0;
      case 7:
        return height && height.length > 0;
      case 8:
        return relationshipStatus && relationshipStatus.length > 0;
      case 9:
        return ethnicity && ethnicity.length > 0;
      case 10:
        return interests && Array.isArray(interests) && interests.length >= 6;
      case 11:
        return hobbies && Array.isArray(hobbies) && hobbies.length >= 6;
      case 12:
        return bio && bio.trim().length >= 10;
      case 13:
        return photos && photos.length >= 4;
      default:
        return false;
    }
  };

  const getProgressIcon = () => {
    if (currentStep === 1) {
      return <ProfileIcon width={24} height={24} />;
    } else if (currentStep === 2) {
      return <GlassIcon width={24} height={24} />;
    } else if (currentStep === 3) {
      return <LocationIcon width={24} height={24} />;
    } else if (currentStep === 4) {
      return <ProfileIcon width={24} height={24} />;
    } else if (currentStep === 5) {
      return <HeartFilledIcon width={24} height={24} />;
    } else if (currentStep === 6) {
      return <ProfileIcon width={24} height={24} />;
    } else if (currentStep === 7) {
      return <ScaleIcon width={24} height={24} />;
    } else if (currentStep === 8) {
      return <HeartIcon width={24} height={24} />;
    } else if (currentStep === 9) {
      return <ScaleIcon width={24} height={24} />;
    } else if (currentStep === 10) {
      return <ProfileIcon width={24} height={24} />;
    } else if (currentStep === 11) {
      return <ProfileIcon width={24} height={24} />;
    } else if (currentStep === 12) {
      return <ProfileIcon width={24} height={24} />;
    } else {
      return <ProfileIcon width={24} height={24} />;
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        {/* Fixed Header */}
        {currentStep > 1 && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowBack width={26} height={26} fill={colors.grey800} />
          </TouchableOpacity>
        )}
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressIcon,
                  {
                    left: iconPositionAnim,
                  },
                ]}>
                {getProgressIcon()}
              </Animated.View>
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
            </View>
          </View>
        </View>

        {/* Content Area */}
        <View style={styles.content}>
          {/* Component One: Name Input */}
          {currentStep === 1 && (
            <ComponentOne
              ref={componentOneRef}
              isVisible={true}
              name={name}
              setName={setName}
            />
          )}

          {/* Component Two: Birthday Input */}
          {currentStep === 2 && (
            <ComponentTwo
              ref={componentTwoRef}
              isVisible={true}
              birthday={birthday}
              setBirthday={setBirthday}
            />
          )}

          {/* Component Three: Location Selection */}
          {currentStep === 3 && (
            <ComponentThree
              ref={componentThreeRef}
              isVisible={true}
              location={location}
              setLocation={setLocation}
            />
          )}

          {/* Component Four: Gender Selection */}
          {currentStep === 4 && (
            <ComponentFour
              ref={componentFourRef}
              isVisible={true}
              gender={gender}
              setGender={setGender}
            />
          )}

          {/* Component Five: Purpose Selection */}
          {currentStep === 5 && (
            <ComponentFive
              ref={componentFiveRef}
              isVisible={true}
              purpose={purpose}
              setPurpose={setPurpose}
            />
          )}

          {/* Component Six: Gender Preference Selection */}
          {currentStep === 6 && (
            <ComponentSix
              ref={componentSixRef}
              isVisible={true}
              genderPreference={genderPreference}
              setGenderPreference={setGenderPreference}
            />
          )}

          {/* Component Seven: Height Selection */}
          {currentStep === 7 && (
            <ComponentSeven
              ref={componentSevenRef}
              isVisible={true}
              height={height}
              setHeight={setHeight}
            />
          )}

          {/* Relationship Status Component */}
          {currentStep === 8 && (
            <RelationshipStatusComponent
              ref={relationshipStatusRef}
              isVisible={true}
              relationshipStatus={relationshipStatus}
              setRelationshipStatus={setRelationshipStatus}
            />
          )}

          {/* Ethnicity Component */}
          {currentStep === 9 && (
            <EthnicityComponent
              ref={ethnicityRef}
              isVisible={true}
              ethnicity={ethnicity}
              setEthnicity={setEthnicity}
            />
          )}

          {/* Interests Component */}
          {currentStep === 10 && (
            <InterestsComponent
              ref={interestsRef}
              isVisible={true}
              interests={interests}
              setInterests={setInterests}
            />
          )}

          {/* Hobbies Component */}
          {currentStep === 11 && (
            <HobbiesComponent
              ref={hobbiesRef}
              isVisible={true}
              hobbies={hobbies}
              setHobbies={setHobbies}
            />
          )}

          {/* Bio Input Component */}
          {currentStep === 12 && (
            <BioInputComponent
              ref={bioRef}
              isVisible={true}
              bio={bio}
              setBio={setBio}
            />
          )}

          {/* Photo Upload Component */}
          {currentStep === 13 && (
            <PhotoUploadComponent
              isVisible={true}
              photos={photos}
              setPhotos={setPhotos}
            />
          )}
        </View>

        {/* Fixed Footer */}
        <View style={styles.footer}>
          <Button
            title={
              currentStep === 13
                ? createProfileMutation.isPending
                  ? 'Creating Profile...'
                  : 'Complete Profile'
                : 'Next'
            }
            onPress={handleNext}
            style={styles.nextButton}
            disabled={
              !isCurrentStepValid() ||
              isLoading ||
              createProfileMutation.isPending
            }
            type={
              !isCurrentStepValid() ||
              isLoading ||
              createProfileMutation.isPending
                ? 'disabled'
                : 'default'
            }
          />
        </View>

        {/* Birthday Confirmation Modal */}
        <FadeModal
          refRBSheet={modalRef}
          height={moderateScale(350)}
          header={false}
          isButtonAdded={true}
          dualButton={true}
          dualButton1Text="Edit"
          dualButton2Text="Confirm"
          dualButton1Press={handleBirthdayEdit}
          dualButton2Press={handleBirthdayConfirm}
          closeOnDragDown={true}
          closeOnPressMask={true}>
          <View style={styles.modalContent}>
            {/* Birthday Cake Icon */}
            <View style={styles.cakeContainer}>
              <FastImage
                source={require('../../../assets/images/cake.gif')}
                style={styles.cakeIcon}
                resizeMode={FastImage.resizeMode.contain}
                priority={FastImage.priority.high}
                cache={FastImage.cacheControl.immutable}
              />
            </View>

            {/* Age Confirmation Text */}
            <Text fs="XL" color="grey800" style={styles.ageText}>
              Are you{' '}
              {calculateAge(new Date(birthday.split('/').reverse().join('-')))}{' '}
              year old?
            </Text>

            {/* Instruction Text */}
            <Text fs="M" color="grey400" style={styles.instructionText}>
              Confirm your age to proceed.
            </Text>
          </View>
        </FadeModal>

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text fs="L" color="grey800" style={styles.loadingText}>
              Setting up your profile...
            </Text>
          </View>
        )}
      </SafeAreaView>
    </GradientBackground>
  );
};

export default Onboard5;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: moderateScale(90),
    paddingBottom: moderateScale(20),
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: moderateScale(16),
    top: moderateScale(60),
    zIndex: 2,
    padding: moderateScale(8),
  },
  progressContainer: {
    marginHorizontal: moderateScale(20),
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.white,
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressIcon: {
    position: 'absolute',
    // right: -12,
    left: 0,
    zIndex: 999,
    top: -15,
    width: 24,
    height: 24,
    backgroundColor: colors.progressbarIconBG,
    borderRadius: 50,
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
    padding: moderateScale(18),
  },
  content: {
    flex: 1,
    marginTop: moderateScale(30),
  },
  footer: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(40),
  },
  nextButton: {
    width: '100%',
    borderRadius: moderateScale(12),
  },
  modalContent: {
    alignItems: 'center',
    paddingVertical: moderateScale(20),
  },
  cakeContainer: {
    marginBottom: moderateScale(20),
  },
  cakeIcon: {
    width: moderateScale(80),
    height: moderateScale(80),
  },
  ageText: {
    textAlign: 'center',
    marginBottom: moderateScale(8),
    fontFamily: fonts.CabinetBold,
  },
  instructionText: {
    textAlign: 'center',
    fontFamily: fonts.CabinetRegular,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: moderateScale(20),
    fontFamily: fonts.CabinetMedium,
    textAlign: 'center',
  },
});
