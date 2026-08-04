import React, {useState, useRef, useEffect, useCallback} from 'react';
import {View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Animated, ActivityIndicator, Image} from 'react-native';
import {useQuery, useMutation} from '@tanstack/react-query';
import {colors, moderateScale, fonts, SCREEN_WIDTH} from '../../theme';
import {Text} from '../../components/base/Text';
import InfoCard from '../../components/InfoCard';
import ProfileInfoItem from '../../components/ProfileInfoItem';
import AboutSection from '../../components/AboutSection';
import ProfileDetailItem from '../../components/ProfileDetailItem';
import InterestTags from '../../components/InterestTags';
import LinearGradient from 'react-native-linear-gradient';
import {userService} from '../../api/services/userService';
import {UseMedia} from '../../hooks/UseMedia';
import Toast from 'react-native-toast-message';
import {useKitkitStore} from '../../store/kitkitStore';
import {
  EditTextModal,
  EditSelectionModal,
  EditMultiSelectionModal,
  EditLocationModal,
  EditHeightModal,
} from '../../components/EditProfileModals';
import EditPreferencesModal from '../../components/EditPreferencesModal';
import EditProfileShimmer from '../../components/EditProfileShimmer';
import ConfirmationModal from '../../components/ConfirmationModal';
import {FadeModal} from '../../components/base/FadeModal';
import {
  ArrowBack,
  FaceIcon,
  HeartFilledIcon,
  ScaleIcon,
  StarIcon,
  FriendsIcon,
  Music,
  CloseIcon,
  AddImage,
  Info,
} from '../../assets/icons';

const EditProfileScreen = ({navigation}) => {
  const {setUserProfile} = useKitkitStore();
  const [errorMessage, setErrorMessage] = useState('');
  const [profileData, setProfileData] = useState(null);
  const errorShakeAnim = useRef(new Animated.Value(0)).current;
  const errorOpacityAnim = useRef(new Animated.Value(0)).current;
  const saveButtonShakeAnim = useRef(new Animated.Value(0)).current;
  const isSaved = useRef(false);

  // Modal states
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [lookingForModalVisible, setLookingForModalVisible] = useState(false);
  const [interestedInModalVisible, setInterestedInModalVisible] = useState(false);
  const [heightModalVisible, setHeightModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [ethnicityModalVisible, setEthnicityModalVisible] = useState(false);
  const [interestsModalVisible, setInterestsModalVisible] = useState(false);
  const [hobbiesModalVisible, setHobbiesModalVisible] = useState(false);
  const [discardModalVisible, setDiscardModalVisible] = useState(false);
  const pendingNavAction = useRef(null);

  // Photo management state
  const [editPhotos, setEditPhotos] = useState([]);
  const [primaryPhotoIndex, setPrimaryPhotoIndex] = useState(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhotoIndex, setDeletingPhotoIndex] = useState(null);
  const [loadedPhotos, setLoadedPhotos] = useState({});
  const primaryBadgeAnim = useRef(new Animated.Value(1)).current;
  const refRBSheet = useRef();
  const {fromGallery, fromCamera} = UseMedia();

  // Upload mutation for photos
  const uploadPhotoMutation = useMutation({
    mutationFn: ({formData}) => userService.uploadMedia(formData),
    onSuccess: (response, variables) => {
      const uploadedPhoto = {
        uri: variables.tempUri,
        filename: response.data.filename,
        url: response.data.url,
        public_id: response.data.public_id,
        resource_type: response.data.resource_type,
        is_primary: false,
      };
      setEditPhotos(prev => [...prev, uploadedPhoto]);
      setUploadingPhoto(false);
      Toast.show({type: 'success', text1: 'Photo uploaded successfully!'});
    },
    onError: error => {
      setUploadingPhoto(false);
      Toast.show({type: 'error', text1: 'Upload Failed', text2: error?.message || 'Please try again.'});
    },
  });

  // Delete mutation for photos
  const deletePhotoMutation = useMutation({
    mutationFn: publicId => userService.deleteMedia(publicId),
    onSuccess: (response, variables) => {
      setEditPhotos(prev => {
        const filtered = prev.filter(p => p.public_id !== variables);
        // If we deleted the primary, reset to first
        const hadPrimary = filtered.some(p => p.is_primary);
        if (!hadPrimary && filtered.length > 0) {
          filtered[0].is_primary = true;
          setPrimaryPhotoIndex(0);
        }
        return filtered;
      });
      setDeletingPhotoIndex(null);
      Toast.show({type: 'success', text1: 'Photo deleted successfully!'});
    },
    onError: error => {
      setDeletingPhotoIndex(null);
      Toast.show({type: 'error', text1: 'Delete Failed', text2: error?.message || 'Please try again.'});
    },
  });

  const handleDeletePhoto = useCallback((index, photo) => {
    if (editPhotos.length <= 4) {
      Toast.show({type: 'error', text1: 'Minimum 4 photos required', text2: 'Upload a new photo before removing this one.'});
      return;
    }
    if (photo.public_id) {
      setDeletingPhotoIndex(index);
      deletePhotoMutation.mutate(photo.public_id);
    } else {
      setEditPhotos(prev => prev.filter((_, i) => i !== index));
    }
  }, [editPhotos.length, deletePhotoMutation]);

  const handleSetPrimaryPhoto = useCallback((index) => {
    setPrimaryPhotoIndex(index);
    setEditPhotos(prev =>
      prev.map((photo, i) => ({...photo, is_primary: i === index})),
    );
    primaryBadgeAnim.setValue(0);
    Animated.spring(primaryBadgeAnim, {
      toValue: 1,
      friction: 4,
      tension: 80,
      useNativeDriver: true,
    }).start();
    // Toast.show({
    //   type: 'success',
    //   text1: 'Profile picture updated!',
    //   visibilityTime: 1500,
    // });
  }, [primaryBadgeAnim]);

  const handleAddPhotoFromSource = useCallback(async (source) => {
    try {
      let result;
      if (source === 'gallery') {
        result = await fromGallery();
      } else {
        result = await fromCamera();
      }
      if (result && result[0]?.assets?.[0]) {
        const asset = result[0].assets[0];
        const formData = new FormData();
        formData.append('file', {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `photo_${Date.now()}.jpg`,
        });
        setUploadingPhoto(true);
        uploadPhotoMutation.mutate({formData, tempUri: asset.uri});
      }
    } catch (e) {
      Toast.show({type: 'error', text1: 'Error', text2: 'Failed to select photo'});
    }
    refRBSheet.current?.close();
  }, [fromGallery, fromCamera, uploadPhotoMutation]);

  // Fetch profile data
  const {data, isLoading, error, refetch} = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await userService.getMyProfile();
      return response.data.data;
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData) => {
      const response = await userService.completeProfile(updatedData);
      return response.data;
    },
    onSuccess: (response) => {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: response.message || 'Profile updated successfully',
      });
      isSaved.current = true;

      // Update Zustand store so ProfileScreen reflects changes immediately
      const updatedProfile = {
        ...data,
        ...profileData,
        photos: editPhotos,
      };
      setUserProfile(updatedProfile);

      refetch();
      navigation.goBack();
    },
    onError: (mutationError) => {
      const errorMsg = mutationError.message || 'Failed to update profile';
      triggerErrorAnimation(errorMsg);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMsg,
      });
    },
  });

  // Set profile data when fetched
  useEffect(() => {
    if (data) {
      const normalizedData = {
        ...data,
        looking_for: Array.isArray(data.looking_for)
          ? data.looking_for
          : data.looking_for ? [data.looking_for] : [],
      };
      setProfileData(normalizedData);
      // Initialize photo editing state
      if (data.photos && data.photos.length > 0) {
        setEditPhotos(data.photos.map(p => ({...p})));
        const pIdx = data.photos.findIndex(p => p.is_primary);
        setPrimaryPhotoIndex(pIdx >= 0 ? pIdx : 0);
      }
    }
  }, [data]);

  // Track whether there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    if (!data || !profileData) {
      return false;
    }

    // Compare basic text/string fields
    const fieldsToCheck = [
      'name', 'about', 'gender', 'interested_in',
      'height', 'current_status', 'ethnicity', 'country', 'state', 'city',
    ];
    for (const field of fieldsToCheck) {
      if ((profileData[field] || '') !== (data[field] || '')) {
        return true;
      }
    }

    // Compare looking_for (both are arrays)
    const origLookingFor = (Array.isArray(data.looking_for) ? data.looking_for : []).sort().join(',');
    const currLookingFor = (Array.isArray(profileData.looking_for) ? profileData.looking_for : []).sort().join(',');
    if (origLookingFor !== currLookingFor) {
      return true;
    }

    // Compare interests
    const origInterestIds = (data.interests || []).map(i => i?.id || i?.name).sort().join(',');
    const currInterestIds = (profileData.interests || []).map(i => i?.id || i?.name).sort().join(',');
    if (origInterestIds !== currInterestIds) {
      return true;
    }

    // Compare hobbies
    const origHobbyIds = (data.hobbies || []).map(h => h?.id || h?.name).sort().join(',');
    const currHobbyIds = (profileData.hobbies || []).map(h => h?.id || h?.name).sort().join(',');
    if (origHobbyIds !== currHobbyIds) {
      return true;
    }

    // Compare photos (count, order, primary)
    const origPhotos = data.photos || [];
    if (editPhotos.length !== origPhotos.length) {
      return true;
    }
    for (let i = 0; i < editPhotos.length; i++) {
      if (editPhotos[i].public_id !== origPhotos[i]?.public_id) {
        return true;
      }
      if (Boolean(editPhotos[i].is_primary) !== Boolean(origPhotos[i]?.is_primary)) {
        return true;
      }
    }

    return false;
  }, [data, profileData, editPhotos]);

  const handleBack = () => {
    if (hasUnsavedChanges()) {
      pendingNavAction.current = null;
      setDiscardModalVisible(true);
    } else {
      navigation.goBack();
    }
  };

  const handleDiscardChanges = () => {
    setDiscardModalVisible(false);
    if (pendingNavAction.current) {
      // Dispatch the original blocked navigation action
      navigation.dispatch(pendingNavAction.current);
    } else {
      navigation.goBack();
    }
  };

  // Intercept Android hardware back button & swipe-back gesture
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Allow navigation if save was already completed
      if (isSaved.current) {
        return;
      }

      // Allow navigation if no unsaved changes
      if (!hasUnsavedChanges()) {
        return;
      }

      // Prevent default back behavior
      e.preventDefault();

      // Store the blocked action so we can replay it on confirm
      pendingNavAction.current = e.data.action;

      // Show the discard modal
      setDiscardModalVisible(true);
    });

    return unsubscribe;
  }, [navigation, hasUnsavedChanges]);



  // Update handlers for each field
  const handleNameSave = (name) => {
    setProfileData(prev => ({...prev, name}));
    setNameModalVisible(false);
  };

  const handleAboutSave = (about) => {
    setProfileData(prev => ({...prev, about}));
    setAboutModalVisible(false);
  };

  const handleLocationSave = ({country, state, city}) => {
    setProfileData(prev => ({
      ...prev,
      country,
      state,
      city,
    }));
    setLocationModalVisible(false);
  };

  const handleGenderSave = (gender) => {
    setProfileData(prev => ({...prev, gender: gender.toLowerCase()}));
    setGenderModalVisible(false);
  };

  const handleLookingForSave = (lookingFor) => {
    setProfileData(prev => ({...prev, looking_for: lookingFor}));
    setLookingForModalVisible(false);
  };

  const handleInterestedInSave = (interestedIn) => {
    setProfileData(prev => ({...prev, interested_in: interestedIn.toLowerCase()}));
    setInterestedInModalVisible(false);
  };

  const handleHeightSave = (height) => {
    setProfileData(prev => ({...prev, height}));
    setHeightModalVisible(false);
  };

  const handleStatusSave = (status) => {
    // The modal already provides the correct API format (e.g., 'in_a_relationship', 'prefer_not_to_say')
    setProfileData(prev => ({...prev, current_status: status}));
    setStatusModalVisible(false);
  };

  const handleEthnicitySave = (ethnicity) => {
    // The modal already provides the correct API format (e.g., 'south_asian', 'white_caucasian')
    setProfileData(prev => ({...prev, ethnicity: ethnicity}));
    setEthnicityModalVisible(false);
  };

  const handleInterestsSave = (interests) => {
    setProfileData(prev => ({...prev, interests}));
    setInterestsModalVisible(false);
  };

  const handleHobbiesSave = (hobbies) => {
    setProfileData(prev => ({...prev, hobbies}));
    setHobbiesModalVisible(false);
  };

  const triggerErrorAnimation = (message) => {
    setErrorMessage(message);

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

    // Shake animation for save button
    Animated.sequence([
      Animated.timing(saveButtonShakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(saveButtonShakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(saveButtonShakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(saveButtonShakeAnim, {
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

    // Auto-hide error after 3 seconds
    setTimeout(() => {
      Animated.timing(errorOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setErrorMessage('');
      });
    }, 3000);
  };

  const handleSave = () => {
    if (!profileData || !data) {
      triggerErrorAnimation('Profile data not loaded');
      return;
    }

    // Build a delta payload — only include fields that actually changed
    const payload = {};

    // Compare simple string fields
    const simpleFields = [
      'name', 'about', 'gender', 'interested_in',
      'height', 'current_status', 'ethnicity',
    ];
    for (const field of simpleFields) {
      if ((profileData[field] || '') !== (data[field] || '')) {
        payload[field] = profileData[field];
      }
    }

    // Compare looking_for (both are arrays)
    const origLF = (Array.isArray(data.looking_for) ? data.looking_for : []).sort().join(',');
    const currLF = (Array.isArray(profileData.looking_for) ? profileData.looking_for : []).sort().join(',');
    if (origLF !== currLF) {
      payload.looking_for = profileData.looking_for;
    }

    // Compare location fields (send all three together if any changed)
    const locationFields = ['country', 'state', 'city'];
    const locationChanged = locationFields.some(
      f => (profileData[f] || '') !== (data[f] || ''),
    );
    if (locationChanged) {
      payload.country = profileData.country;
      payload.state = profileData.state;
      payload.city = profileData.city;
      payload.latitude = profileData.latitude;
      payload.longitude = profileData.longitude;
    }

    // Compare interests
    const origInterestIds = (data.interests || []).map(i => i?.id || i?.name).sort().join(',');
    const currInterestIds = (profileData.interests || []).map(i => i?.id || i?.name).sort().join(',');
    if (origInterestIds !== currInterestIds) {
      payload.interests = [
        ...new Set(profileData.interests.map(interest => interest?.id || interest?.name).filter(Boolean)),
      ];
    }

    // Compare hobbies
    const origHobbyIds = (data.hobbies || []).map(h => h?.id || h?.name).sort().join(',');
    const currHobbyIds = (profileData.hobbies || []).map(h => h?.id || h?.name).sort().join(',');
    if (origHobbyIds !== currHobbyIds) {
      payload.hobbies = [
        ...new Set(profileData.hobbies.map(hobby => hobby?.id || hobby?.name).filter(Boolean)),
      ];
    }

    // Compare photos (count, order, or primary changed)
    const origPhotos = data.photos || [];
    let photosChanged = editPhotos.length !== origPhotos.length;
    if (!photosChanged) {
      for (let i = 0; i < editPhotos.length; i++) {
        if (editPhotos[i].public_id !== origPhotos[i]?.public_id) {
          photosChanged = true;
          break;
        }
        if (Boolean(editPhotos[i].is_primary) !== Boolean(origPhotos[i]?.is_primary)) {
          photosChanged = true;
          break;
        }
      }
    }
    if (photosChanged) {
      payload.photos = editPhotos.map(photo => ({
        url: photo.url,
        public_id: photo.public_id,
        filename: photo.filename,
        is_primary: photo.is_primary || false,
      }));
    }

    // If nothing changed, just go back
    if (Object.keys(payload).length === 0) {
      navigation.goBack();
      return;
    }

    // Validate required fields (only validate the ones being sent)
    if (payload.name !== undefined && (!payload.name || payload.name.trim().length === 0)) {
      triggerErrorAnimation('Please enter your name');
      return;
    }

    if (payload.looking_for !== undefined && (!Array.isArray(payload.looking_for) || payload.looking_for.length === 0)) {
      triggerErrorAnimation('Please specify who you are looking for');
      return;
    }

    if (payload.ethnicity !== undefined && (!payload.ethnicity || payload.ethnicity === 'Not Specified')) {
      triggerErrorAnimation('Please add your ethnicity');
      return;
    }

    if (payload.hobbies !== undefined && payload.hobbies.length === 0) {
      triggerErrorAnimation('Please add at least one hobby');
      return;
    }

    if (payload.interests !== undefined && payload.interests.length === 0) {
      triggerErrorAnimation('Please add at least one interest');
      return;
    }

    console.log('Sending only changed fields:', Object.keys(payload));
    // Submit only the changed data
    updateProfileMutation.mutate(payload);
  };

  // Selection options
  const genderOptions = [
    {label: 'Male', value: 'male'},
    {label: 'Female', value: 'female'},
    {label: 'Non-Binary', value: 'non-binary'},
    {label: 'Other', value: 'other'},
  ];

  const lookingForOptions = [
    {label: 'Live rooms', value: 'dating'},
    {label: 'Friendship', value: 'friendship'},
    {label: 'Creator support', value: 'marriage'},
  ];

  const interestedInOptions = [
    {label: 'All members', value: 'men'},
    {label: 'Women', value: 'women'},
  ];

  const statusOptions = [
    {label: 'Single', value: 'single'},
    {label: 'In a Relationship', value: 'in_a_relationship'},
    {label: 'Married', value: 'married'},
    {label: 'Divorced', value: 'divorced'},
    {label: 'Widowed', value: 'widowed'},
    {label: 'It\'s Complicated', value: 'complicated'},
    {label: 'Prefer not to say', value: 'prefer_not_to_say'},
  ];

  const ethnicityOptions = [
    {label: 'Asian', value: 'asian'},
    {label: 'Pakistani', value: 'pakistani'},
    {label: 'Latin', value: 'latin'},
    {label: 'European', value: 'european'},
    {label: 'South Asian', value: 'south_asian'},
    {label: 'Middle Eastern', value: 'middle_eastern'},
    {label: 'White Caucasian', value: 'white_caucasian'},
    {label: 'Hispanic Latino', value: 'hispanic_latino'},
    {label: 'Mixed Race', value: 'mixed_race'},
    {label: 'Other', value: 'other'},
  ];

  // Show loading state
  // Show error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}>
            <ArrowBack width={24} height={24} stroke={colors.grey800} />
          </TouchableOpacity>
          <Text ff="c-Regular" fs="XXL" color="grey800" style={styles.title}>
            Edit Profile
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text ff="c-Regular" fs="L" color="grey800" style={styles.errorTitle}>
            Failed to load profile
          </Text>
          <Text ff="c-Regular" fs="M" color="grey600" style={styles.loadingText}>
            {error.message || 'Something went wrong'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
            activeOpacity={0.7}>
            <LinearGradient
              colors={[colors.secondary, colors.primary]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.retryButtonGradient}>
              <Text ff="c-Regular" fs="L" color="white">
                Retry
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading || !profileData) {
    return (
      <SafeAreaView style={styles.container}>
        <EditProfileShimmer onBack={handleBack} />
      </SafeAreaView>
    );
  }

  const interestNames = profileData.interests?.map(interest => interest.name) || [];
  const hobbyNames = profileData.hobbies?.map(hobby => hobby.name) || [];
  console.log(profileData);
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}>
          <ArrowBack width={24} height={24} stroke={colors.grey800} />
        </TouchableOpacity>
        <Text ff="c-Regular" fs="XXL" color="grey800" style={styles.title}>
          Edit Profile
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {/* ===== Photo Management Section ===== */}
        <View style={styles.photoSection}>
          <View style={styles.photoSectionHeader}>
            <Text ff="c-Regular" fs="L" color="grey800" style={styles.photoSectionTitle}>
              Your Photos
            </Text>
            <Text fs="S" ff="c-medium" color="grey400">
              {editPhotos.length}/6
            </Text>
          </View>

          {/* Primary photo tip */}
          {editPhotos.length >= 4 && (
            <View style={styles.primaryTip}>
              <View style={styles.primaryTipIcon}>
                <StarIcon width={12} height={12} fill={colors.primary} />
              </View>
              <Text fs="XS" ff="c-medium" color="grey500" style={styles.primaryTipText}>
                Tap any photo to set it as your profile picture
              </Text>
            </View>
          )}

          {/* Photo Grid */}
          <View style={styles.photoGrid}>
            {editPhotos.map((photo, index) => {
              const isPrimary = index === primaryPhotoIndex;
              return (
                <View key={`edit-photo-${photo.public_id || index}`} style={styles.photoCard}>
                  <View style={[
                    styles.photoCardInner,
                    isPrimary && styles.photoCardPrimary,
                  ]}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleSetPrimaryPhoto(index)}>
                      <View style={[styles.photoImage, isPrimary && styles.photoImagePrimary]}>
                        {!loadedPhotos[photo.public_id || index] && (
                          <View style={styles.photoPlaceholder}>
                            <ActivityIndicator size="small" color={colors.primary} />
                          </View>
                        )}
                        <Image
                          source={{uri: photo.url || photo.uri}}
                          style={[
                            StyleSheet.absoluteFill,
                            {borderRadius: isPrimary ? moderateScale(11) : moderateScale(12)},
                            !loadedPhotos[photo.public_id || index] && {opacity: 0},
                          ]}
                          onLoad={() => setLoadedPhotos(prev => ({...prev, [photo.public_id || index]: true}))}
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Delete button */}
                    <TouchableOpacity
                      style={styles.photoDeleteBtn}
                      onPress={() => handleDeletePhoto(index, photo)}
                      activeOpacity={0.7}
                      disabled={deletingPhotoIndex === index}>
                      <CloseIcon width={10} height={10} />
                    </TouchableOpacity>

                    {/* Primary star badge */}
                    <TouchableOpacity
                      style={[
                        styles.photoStarBadge,
                        isPrimary && styles.photoStarBadgeActive,
                      ]}
                      onPress={() => handleSetPrimaryPhoto(index)}
                      activeOpacity={0.7}
                      hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                      {isPrimary ? (
                        <Animated.View
                          style={{
                            transform: [{
                              scale: primaryBadgeAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.5, 1],
                              }),
                            }],
                          }}>
                          <StarIcon width={12} height={12} fill={colors.white} />
                        </Animated.View>
                      ) : (
                        <StarIcon width={12} height={12} fill={'rgba(255,255,255,0.8)'} />
                      )}
                    </TouchableOpacity>

                    {/* Primary label ribbon */}
                    {isPrimary && (
                      <View style={styles.photoPrimaryLabel}>
                        <StarIcon width={7} height={7} fill={colors.white} />
                        <Text fs="XXS" ff="c-bold" color="white" style={styles.photoPrimaryLabelText}>
                          PROFILE
                        </Text>
                      </View>
                    )}

                    {/* Deleting overlay */}
                    {deletingPhotoIndex === index && (
                      <View style={styles.photoOverlay}>
                        <ActivityIndicator size="small" color={colors.white} />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {/* Uploading placeholder */}
            {uploadingPhoto && (
              <View style={styles.photoCard}>
                <View style={styles.photoUploadingCard}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text fs="XXS" color="grey400" style={styles.uploadingLabel}>Uploading...</Text>
                </View>
              </View>
            )}

            {/* Add photo button */}
            {editPhotos.length < 6 && !uploadingPhoto && (
              <View style={styles.photoCard}>
                <TouchableOpacity
                  style={styles.photoAddCard}
                  onPress={() => refRBSheet.current?.open()}
                  activeOpacity={0.7}>
                  <AddImage width={32} height={32} />
                  <Text fs="XXS" ff="c-medium" color="grey400" style={styles.addPhotoLabel}>
                    Add Photo
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Basic Info Card */}
        <InfoCard>
          <ProfileInfoItem
            label="Name"
            value={profileData.name || 'Not specified'}
            onPress={() => setNameModalVisible(true)}
          />
          {/* <ProfileInfoItem
            label="Age"
            value={age ? `${age} year${age !== 1 ? 's' : ''}` : 'Not specified'}
            onPress={() => {
              Toast.show({
                type: 'info',
                text1: 'Cannot Edit Age',
                text2: 'Age is calculated from your date of birth',
              });
            }}
          /> */}
          <ProfileInfoItem
            label="Gender"
            value={profileData.gender ? profileData.gender.charAt(0).toUpperCase() + profileData.gender.slice(1) : 'Not specified'}
            onPress={() => setGenderModalVisible(true)}
          />
          <ProfileInfoItem
            label="Location"
            value={`${profileData.city || ''}, ${profileData.state || ''}, ${profileData.country || ''}`.replace(/(^,\s*)|(,\s*$)|(,\s*,)/g, ',').trim().replace(/^,|,$/g, '') || 'Not specified'}
            onPress={() => setLocationModalVisible(true)}
          />
        </InfoCard>

        {/* About Yourself */}
        <AboutSection
          title="About Yourself"
          content={profileData.about || 'No description added yet'}
          onEditPress={() => setAboutModalVisible(true)}
        />

        {/* About Title */}
        <Text
          ff="c-Regular"
          fs="L"
          color="grey800"
          style={styles.sectionTitle}>
          About
        </Text>

        {/* About Details Card */}
        <InfoCard>
          <ProfileDetailItem
            icon={<FaceIcon width={24} height={24} />}
            label="Community filter"
            value={
              profileData.interested_in === 'women'
                ? 'Women'
                : profileData.interested_in === 'men'
                  ? 'All members'
                  : 'Not specified'
            }
            showAddButton={!profileData.interested_in}
            showChevron={!!profileData.interested_in}
            onPress={() => setInterestedInModalVisible(true)}
          />

          <ProfileDetailItem
            icon={<HeartFilledIcon width={24} height={24} fill={colors.secondary} />}
            label="What are you here for?"
            value={
              Array.isArray(profileData.looking_for) && profileData.looking_for.length > 0
                ? profileData.looking_for
                    .map(v => lookingForOptions.find(o => o.value === v)?.label || v)
                    .join(', ')
                : 'Not specified'
            }
            showChevron={true}
            onPress={() => setLookingForModalVisible(true)}
          />

          <ProfileDetailItem
            icon={<ScaleIcon width={24} height={24} />}
            label="Height"
            value={profileData.height || 'Not Specified'}
            showChevron={true}
            onPress={() => setHeightModalVisible(true)}
          />

          {/* Current Status hidden — not relevant for community platform review */}

          <ProfileDetailItem
            icon={<StarIcon width={24} height={24} />}
            label="Ethnicity"
            value={profileData.ethnicity ? profileData.ethnicity.charAt(0).toUpperCase() + profileData.ethnicity.slice(1) : 'Not Specified'}
            showAddButton={!profileData.ethnicity}
            showChevron={!!profileData.ethnicity}
            onPress={() => setEthnicityModalVisible(true)}
          />

          {/* Interest */}
          <View>
            <View style={styles.interestHeader}>
              <View style={styles.iconContainer}>
                <FriendsIcon width={24} height={24} />
              </View>
              <Text ff="c-Regular" fs="M" color="grey800" style={styles.interestLabel}>
                Interest
              </Text>
              <View style={styles.flexOne} />
              <TouchableOpacity onPress={() => setInterestsModalVisible(true)}>
                <Text ff="c-Regular" fs="S" color="primary">
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
            {interestNames.length > 0 ? (
              <InterestTags
                tags={interestNames}
                onPress={() => setInterestsModalVisible(true)}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text ff="c-Regular" fs="S" color="grey500">
                  No interests added yet
                </Text>
              </View>
            )}
          </View>

          {/* Hobby */}
          <View>
            <View style={styles.interestHeader}>
              <View style={styles.iconContainer}>
                <Music width={24} height={24} />
              </View>
              <Text ff="c-Regular" fs="M" color="grey800" style={styles.interestLabel}>
                Hobby
              </Text>
              <View style={styles.flexOne} />
              <TouchableOpacity onPress={() => setHobbiesModalVisible(true)}>
                <Text ff="c-Regular" fs="S" color="primary">
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
            {hobbyNames.length > 0 ? (
              <InterestTags
                tags={hobbyNames}
                onPress={() => setHobbiesModalVisible(true)}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text ff="c-Regular" fs="S" color="grey500">
                  No hobbies added yet
                </Text>
              </View>
            )}
          </View>
        </InfoCard>

        {/* Error Message */}
        {errorMessage ? (
          <Animated.View
            style={[
              styles.errorContainer,
              {
                opacity: errorOpacityAnim,
                transform: [{translateX: errorShakeAnim}],
              },
            ]}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </Animated.View>
        ) : null}
      </ScrollView>

      {/* Fixed Save Button */}
      <Animated.View
        style={[
          styles.saveButtonFixed,
          {transform: [{translateX: saveButtonShakeAnim}]},
        ]}>
        <TouchableOpacity
          style={styles.saveButtonWrapper}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={updateProfileMutation.isPending}>
          <LinearGradient
            colors={[colors.secondary, colors.primary]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.saveButton}>
            {updateProfileMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text ff="c-Regular" fs="XL" color="white" style={styles.saveText}>
                Save
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Edit Modals */}
      <EditTextModal
        visible={nameModalVisible}
        onClose={() => setNameModalVisible(false)}
        title="Edit Name"
        value={profileData?.name || ''}
        onSave={handleNameSave}
        placeholder="Enter your name"
        maxLength={50}
        validation={(text) => {
          if (text.length < 2) {
            return 'Name must be at least 2 characters';
          }
          if (!/^[a-zA-Z\s]+$/.test(text)) {
            return 'Name can only contain letters and spaces';
          }
          return null;
        }}
      />

      <EditTextModal
        visible={aboutModalVisible}
        onClose={() => setAboutModalVisible(false)}
        title="About Yourself"
        value={profileData?.about || ''}
        onSave={handleAboutSave}
        placeholder="Tell us about yourself"
        multiline={true}
        maxLength={500}
        validation={(text) => {
          if (text.length < 10) {
            return 'About must be at least 10 characters';
          }
          return null;
        }}
      />

      <EditLocationModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        country={profileData?.country || ''}
        state={profileData?.state || ''}
        city={profileData?.city || ''}
        onSave={handleLocationSave}
      />

      <EditSelectionModal
        visible={genderModalVisible}
        onClose={() => setGenderModalVisible(false)}
        title="Select Gender"
        value={profileData?.gender || ''}
        options={genderOptions}
        onSave={handleGenderSave}
      />

      <EditMultiSelectionModal
        visible={lookingForModalVisible}
        onClose={() => setLookingForModalVisible(false)}
        title="What are you here for?"
        values={profileData?.looking_for || []}
        options={lookingForOptions}
        onSave={handleLookingForSave}
      />

      <EditSelectionModal
        visible={interestedInModalVisible}
        onClose={() => setInterestedInModalVisible(false)}
        title="Community filter"
        value={profileData?.interested_in || ''}
        options={interestedInOptions}
        onSave={handleInterestedInSave}
      />

      <EditHeightModal
        visible={heightModalVisible}
        onClose={() => setHeightModalVisible(false)}
        value={profileData?.height || ''}
        onSave={handleHeightSave}
      />

      <EditSelectionModal
        visible={statusModalVisible}
        onClose={() => setStatusModalVisible(false)}
        title="Current Status"
        value={profileData?.current_status || ''}
        options={statusOptions}
        onSave={handleStatusSave}
      />

      <EditSelectionModal
        visible={ethnicityModalVisible}
        onClose={() => setEthnicityModalVisible(false)}
        title="Ethnicity"
        value={profileData?.ethnicity || ''}
        options={ethnicityOptions}
        onSave={handleEthnicitySave}
      />

      <EditPreferencesModal
        visible={interestsModalVisible}
        onClose={() => setInterestsModalVisible(false)}
        title="Select Interests"
        mode="interests"
        selectedItems={profileData?.interests || []}
        onSave={handleInterestsSave}
        minimumSelection={1}
      />

      <EditPreferencesModal
        visible={hobbiesModalVisible}
        onClose={() => setHobbiesModalVisible(false)}
        title="Select Hobbies"
        mode="hobbies"
        selectedItems={profileData?.hobbies || []}
        onSave={handleHobbiesSave}
        minimumSelection={1}
      />

      {/* Photo Source Bottom Sheet */}
      <FadeModal
        refRBSheet={refRBSheet}
        height={moderateScale(280)}
        header={false}
        closeOnDragDown={true}
        closeOnPressMask={true}>
        <View style={styles.sheetContent}>
          <Text fs="L" ff="c-bold" color="grey800" style={styles.sheetTitle}>
            Choose Photo Source
          </Text>
          <View style={styles.sheetOptions}>
            <TouchableOpacity
              style={styles.sheetOptionBtn}
              onPress={() => handleAddPhotoFromSource('camera')}
              activeOpacity={0.7}>
              <View style={styles.sheetOptionIcon}>
                <Image
                  source={require('../../assets/images/Camera.png')}
                  style={styles.sheetOptionImage}
                  resizeMode="contain"
                />
              </View>
              <Text fs="M" ff="c-medium" color="grey800">Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sheetOptionBtn}
              onPress={() => handleAddPhotoFromSource('gallery')}
              activeOpacity={0.7}>
              <View style={styles.sheetOptionIcon}>
                <Image
                  source={require('../../assets/images/Gallery.png')}
                  style={styles.sheetOptionImage}
                  resizeMode="contain"
                />
              </View>
              <Text fs="M" ff="c-medium" color="grey800">Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </FadeModal>

      {/* Discard Changes Modal */}
      <ConfirmationModal
        visible={discardModalVisible}
        onClose={() => setDiscardModalVisible(false)}
        icon={<Info width={60} height={60} fill={colors.primary} />}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to go back? All changes will be lost."
        confirmText="Discard"
        cancelText="Keep Editing"
        onConfirm={handleDiscardChanges}
        onCancel={() => setDiscardModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gradientBG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(20),
  },
  backButton: {
    marginRight: moderateScale(12),
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: moderateScale(100),
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: moderateScale(12),
    paddingHorizontal: moderateScale(20),
  },
  interestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(14),
    paddingBottom: moderateScale(8),
  },
  iconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  interestLabel: {
    fontWeight: '600',
  },
  flexOne: {
    flex: 1,
  },
  errorContainer: {
    marginHorizontal: moderateScale(20),
    marginTop: moderateScale(20),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    backgroundColor: '#FEE2E2',
    borderRadius: moderateScale(8),
    borderLeftWidth: 3,
    borderLeftColor: colors.error || '#EF4444',
  },
  errorText: {
    color: colors.error || '#EF4444',
    fontSize: moderateScale(14),
    fontFamily: fonts.CabinetMedium,
    textAlign: 'left',
  },
  saveButtonFixed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(30),
    backgroundColor: 'rgba(98, 189, 250, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  saveButtonWrapper: {
    borderRadius: moderateScale(25),
    overflow: 'hidden',
  },
  saveButton: {
    // paddingVertical: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    height: moderateScale(50),
  },
  saveText: {
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  loadingText: {
    marginTop: moderateScale(16),
    textAlign: 'center',
  },
  errorTitle: {
    marginBottom: moderateScale(8),
    textAlign: 'center',
    fontWeight: '600',
  },
  retryButton: {
    marginTop: moderateScale(24),
    borderRadius: moderateScale(25),
    overflow: 'hidden',
    minWidth: moderateScale(120),
  },
  retryButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataContainer: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(12),
    alignItems: 'center',
  },
  // ===== Photo Management Styles =====
  photoSection: {
    paddingHorizontal: moderateScale(20),
    marginBottom: moderateScale(20),
  },
  photoSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  photoSectionTitle: {
    fontWeight: '700',
  },
  primaryTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.selectedItembgCOlor,
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(7),
    borderRadius: moderateScale(10),
    marginBottom: moderateScale(12),
    borderWidth: 1,
    borderColor: '#E8D0FF',
  },
  primaryTipIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryTipText: {
    marginLeft: moderateScale(8),
    flex: 1,
    lineHeight: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(10),
  },
  photoCard: {
    width: (SCREEN_WIDTH - moderateScale(40) - moderateScale(20)) / 3,
    height: (SCREEN_WIDTH - moderateScale(40) - moderateScale(20)) / 3,
  },
  photoCardInner: {
    flex: 1,
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    position: 'relative',
  },
  photoCardPrimary: {
    borderWidth: 2.5,
    borderColor: colors.primary,
    borderRadius: moderateScale(14),
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(12),
    overflow: 'hidden',
  },
  photoImagePrimary: {
    borderRadius: moderateScale(11),
  },
  photoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.grey100,
    borderRadius: moderateScale(12),
  },
  photoDeleteBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    backgroundColor: 'rgba(12, 17, 28, 0.75)',
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoStarBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  photoStarBadgeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  photoPrimaryLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  photoPrimaryLabelText: {
    letterSpacing: 0.8,
    fontSize: 8,
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoUploadingCard: {
    flex: 1,
    backgroundColor: colors.grey50,
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  photoAddCard: {
    flex: 1,
    backgroundColor: colors.grey50,
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.grey200,
    borderStyle: 'dashed',
  },
  uploadingLabel: {
    marginTop: 6,
  },
  addPhotoLabel: {
    marginTop: 6,
  },
  // Bottom sheet styles
  sheetContent: {
    flex: 1,
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(10),
  },
  sheetTitle: {
    textAlign: 'center',
    marginBottom: moderateScale(30),
  },
  sheetOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  sheetOptionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(20),
    paddingHorizontal: moderateScale(25),
    borderRadius: moderateScale(16),
    backgroundColor: colors.grey50,
    minWidth: moderateScale(130),
    shadowColor: colors.grey800,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  sheetOptionIcon: {
    marginBottom: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetOptionImage: {
    width: moderateScale(48),
    height: moderateScale(48),
  },
});

export default EditProfileScreen;

