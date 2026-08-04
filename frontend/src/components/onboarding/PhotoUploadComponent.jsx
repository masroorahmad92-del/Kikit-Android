import React, {useRef, useState, useCallback, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {useMutation} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {Text} from '../base/Text';
import {AddImage, CloseIcon, StarIcon} from '../../assets/icons';
import {FadeModal} from '../base/FadeModal';
import {UseMedia} from '../../hooks/UseMedia';
import {userService} from '../../api/services/userService';
import {
  colors,
  moderateScale,
  verticalScale,
  SCREEN_WIDTH,
} from '../../theme';

const PhotoUploadComponent = ({isVisible, photos, setPhotos}) => {
  const refRBSheet = useRef();
  const {fromGallery, fromCamera} = UseMedia();
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [primaryIndex, setPrimaryIndex] = useState(null);
  const primaryBadgeAnim = useRef(new Animated.Value(0)).current;

  // Auto-set first photo as primary when user reaches 4 photos
  useEffect(() => {
    if (photos.length >= 4 && primaryIndex === null) {
      setPrimaryIndex(0);
      setPhotos(prev =>
        prev.map((photo, i) => ({
          ...photo,
          is_primary: i === 0,
        })),
      );
      Animated.spring(primaryBadgeAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }
    // If photos drop below 4, reset primary
    if (photos.length < 4) {
      setPrimaryIndex(null);
      setPhotos(prev =>
        prev.map(photo => ({
          ...photo,
          is_primary: false,
        })),
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length]);

  const handleSetPrimary = useCallback(
    index => {
      if (photos.length < 4) {
        return;
      }
      setPrimaryIndex(index);
      setPhotos(prev =>
        prev.map((photo, i) => ({
          ...photo,
          is_primary: i === index,
        })),
      );
      // Animate the badge
      primaryBadgeAnim.setValue(0);
      Animated.spring(primaryBadgeAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }).start();
      Toast.show({
        type: 'success',
        text1: 'Primary photo updated!',
        text2: 'This photo will be shown as your profile picture.',
        visibilityTime: 2000,
      });
    },
    [photos.length, setPhotos, primaryBadgeAnim],
  );

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: ({formData}) => userService.uploadMedia(formData),
    onSuccess: (response, variables) => {
      console.log('Photo uploaded successfully:', response);
      
      const uploadedPhoto = {
        uri: variables.tempUri,
        filename: response.data.filename,
        url: response.data.url,
        public_id: response.data.public_id,
        resource_type: response.data.resource_type,
      };
      
      setPhotos(prev => [...prev, uploadedPhoto]);

      // Remove uploaded URI from queue
      setUploadQueue(prev => {
        const remaining = prev.filter(uri => uri !== variables.tempUri);
        if (remaining.length === 0) {
          setUploadingIndex(null);
        }
        return remaining;
      });
      
      Toast.show({
        type: 'success',
        text1: 'Photo uploaded successfully!',
      });
    },
    onError: (error, variables) => {
      console.error('Failed to upload photo:', error);

      // Remove failed URI from queue
      setUploadQueue(prev => {
        const remaining = prev.filter(uri => uri !== variables?.tempUri);
        if (remaining.length === 0) {
          setUploadingIndex(null);
        }
        return remaining;
      });
      
      const errorMessage =
        error?.message || 'Failed to upload photo. Please try again.';
      
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: errorMessage,
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: publicId => userService.deleteMedia(publicId),
    onSuccess: (response, variables) => {
      console.log('Photo deleted successfully:', response);
      
      setPhotos(prev => prev.filter(photo => photo.public_id !== variables));
      setDeletingIndex(null);
      
      Toast.show({
        type: 'success',
        text1: 'Photo deleted successfully!',
      });
    },
    onError: error => {
      console.error('Failed to delete photo:', error);
      setDeletingIndex(null);
      
      const errorMessage =
        error?.message || 'Failed to delete photo. Please try again.';
      
      Toast.show({
        type: 'error',
        text1: 'Delete Failed',
        text2: errorMessage,
      });
    },
  });

  const handleRemovePhoto = (index, photo) => {
    // Adjust primaryIndex when a photo is removed
    if (primaryIndex !== null) {
      if (index === primaryIndex) {
        // Removed the primary photo — reset to first photo (if enough remain)
        const remainingCount = photos.length - 1;
        if (remainingCount >= 4) {
          const newPrimary = index === 0 ? 0 : 0;
          setPrimaryIndex(newPrimary);
          // is_primary will be set via useEffect or below
        } else {
          setPrimaryIndex(null);
        }
      } else if (index < primaryIndex) {
        setPrimaryIndex(prev => prev - 1);
      }
    }

    if (photo.public_id) {
      setDeletingIndex(index);
      deleteMutation.mutate(photo.public_id);
    } else {
      // If photo doesn't have public_id, just remove it locally
      setPhotos(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleAddPhotoFromSource = async (source) => {
    try {
      let result;
      const remainingSlots = 6 - photos.length;

      if (remainingSlots <= 0) {
        Toast.show({
          type: 'info',
          text1: 'Maximum photos reached',
          text2: 'You can upload a maximum of 6 photos.',
        });
        refRBSheet.current?.close();
        return;
      }

      if (source === 'gallery') {
        // Allow multi-select up to remaining slots
        result = await fromGallery(remainingSlots);
        console.log('Gallery result:', result);
      } else {
        result = await fromCamera();
      }

      if (result && result[0]?.assets?.length > 0) {
        const assets = result[0].assets;
        const assetsToUpload = assets.slice(0, remainingSlots);

        if (assets.length > remainingSlots) {
          Toast.show({
            type: 'info',
            text1: 'Some photos skipped',
            text2: `Only ${remainingSlots} photo${remainingSlots > 1 ? 's' : ''} can be added. Maximum is 6.`,
          });
        }

        // Set uploading state
        setUploadingIndex(photos.length);
        setUploadQueue(assetsToUpload.map(a => a.uri));

        // Upload all selected photos sequentially
        for (const asset of assetsToUpload) {
          const formData = new FormData();
          formData.append('file', {
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || `photo_${Date.now()}.jpg`,
          });

          // Upload to API
          uploadMutation.mutate({
            formData,
            tempUri: asset.uri,
          });
        }
      }
    } catch (error) {
      console.log('Error selecting photo:', error);
      setUploadingIndex(null);
      setUploadQueue([]);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to select photo',
      });
    }
    refRBSheet.current?.close();
  };

  const handlePlaceholderPress = () => {
    const totalPhotos = photos.length + uploadQueue.length;
    if (totalPhotos < 6 && uploadingIndex === null) {
      refRBSheet.current?.open();
    }
  };

  const handleGalleryPress = () => {
    handleAddPhotoFromSource('gallery');
  };

  const handleCameraPress = () => {
    handleAddPhotoFromSource('camera');
  };

  if (!isVisible) {
    return null;
  }


  return (
    <View style={styles.container}>
      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text fs="XXXL" color="grey800" style={styles.title}>
          Add Your Best
          <Text color="primary"> Photos</Text>
        </Text>
        <Text fs="M" ff="c-medium" color="grey800" style={styles.subtitle}>
          Upload at least 4 photos to complete your profile. Maximum 6 photos allowed.
        </Text>
      </View>

      {/* Primary Photo Prompt */}
      {photos.length >= 4 && (
        <View style={styles.primaryPrompt}>
          <View style={styles.primaryPromptIcon}>
            <StarIcon width={14} height={14} fill={colors.primary} />
          </View>
          <Text fs="S" ff="c-medium" color="grey500" style={styles.primaryPromptText}>
            Tap any photo to set it as your profile picture
          </Text>
        </View>
      )}

      {/* Photo Grid */}
      <View style={styles.photoGrid}>
        {/* Render uploaded photos */}
        {photos.map((photo, index) => {
          const isPrimary = primaryIndex === index;
          return (
            <View key={`photo-${index}`} style={styles.photoContainer}>
              <View
                style={[
                  styles.photoWrapper,
                  isPrimary && styles.primaryPhotoWrapper,
                ]}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleSetPrimary(index)}>
                  <Image
                    source={{uri: photo.uri || photo.url}}
                    style={[
                      styles.photo,
                      isPrimary && styles.primaryPhoto,
                    ]}
                  />
                </TouchableOpacity>

                {/* Primary badge / tap target */}
                {photos.length >= 4 && (
                  <TouchableOpacity
                    style={[
                      styles.primaryBadge,
                      isPrimary && styles.primaryBadgeActive,
                    ]}
                    onPress={() => handleSetPrimary(index)}
                    activeOpacity={0.7}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                    {isPrimary ? (
                      <Animated.View
                        style={{
                          transform: [
                            {
                              scale: primaryBadgeAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.5, 1],
                              }),
                            },
                          ],
                        }}>
                        <StarIcon
                          width={13}
                          height={13}
                          fill={colors.white}
                        />
                      </Animated.View>
                    ) : (
                      <StarIcon
                        width={13}
                        height={13}
                        fill={'rgba(255, 255, 255, 0.85)'}
                      />
                    )}
                  </TouchableOpacity>
                )}

                {/* Primary label */}
                {isPrimary && (
                  <View style={styles.primaryLabel}>
                    <StarIcon width={8} height={8} fill={colors.white} />
                    <Text fs="XXS" ff="c-bold" color="white" style={styles.primaryLabelText}>
                      PROFILE
                    </Text>
                  </View>
                )}

                {/* Show loader overlay if deleting */}
                {deletingIndex === index && (
                  <View style={styles.loaderOverlay}>
                    <ActivityIndicator size="small" color={colors.white} />
                  </View>
                )}

                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemovePhoto(index, photo)}
                  activeOpacity={0.7}
                  disabled={deletingIndex === index}>
                  <CloseIcon width={12} height={12} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Show uploading placeholder */}
        {uploadingIndex !== null && uploadQueue.length > 0 && (
          <View style={styles.photoContainer}>
            <View style={styles.uploadingPhoto}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text fs="XS" color="grey400" style={styles.uploadingText}>
                Uploading {uploadQueue.length} photo{uploadQueue.length > 1 ? 's' : ''}...
              </Text>
            </View>
          </View>
        )}

        {/* Render placeholder for adding more photos (only if less than 6) */}
        {photos.length + uploadQueue.length < 6 && uploadingIndex === null && (
          <View style={styles.photoContainer}>
            <TouchableOpacity
              style={styles.placeholderPhoto}
              onPress={handlePlaceholderPress}
              activeOpacity={0.7}>
              <AddImage width={40} height={40} />
              <Text fs="XS" color="grey400" style={styles.addText}>
                Add Photo
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Validation Message */}
      {photos.length > 0 && photos.length < 4 && (
        <Text fs="S" color="danger" style={styles.validationText}>
          Please add at least {4 - photos.length} more photo{4 - photos.length > 1 ? 's' : ''} ({photos.length}/4 minimum)
        </Text>
      )}

  

      {/* Bottom Sheet Modal */}
      <FadeModal
        refRBSheet={refRBSheet}
        height={moderateScale(280)}
        header={false}
        closeOnDragDown={true}
        closeOnPressMask={true}>
        <View style={styles.bottomSheetContent}>
          <Text fs="L" ff="c-bold" color="grey800" style={styles.sheetTitle}>
            Choose Photo Source
          </Text>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleCameraPress}
              activeOpacity={0.7}>
              <View style={styles.iconContainer}>
                <Image
                  source={require('../../assets/images/Camera.png')}
                  style={styles.optionIcon}
                  resizeMode="contain"
                />
              </View>
              <Text fs="M" ff="c-medium" color="grey800" style={styles.optionText}>
                Camera
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleGalleryPress}
              activeOpacity={0.7}>
              <View style={styles.iconContainer}>
                <Image
                  source={require('../../assets/images/Gallery.png')}
                  style={styles.optionIcon}
                  resizeMode="contain"
                />
              </View>
              <Text fs="M" ff="c-medium" color="grey800" style={styles.optionText}>
                Gallery
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </FadeModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
  },
  titleSection: {
    marginBottom: verticalScale(40),
  },
  title: {
    lineHeight: 40,
    marginBottom: moderateScale(12),
  },
  subtitle: {
    lineHeight: 22,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: verticalScale(20),
    gap: moderateScale(12),
  },
  photoContainer: {
    width: (SCREEN_WIDTH - 70) / 3,
    height: (SCREEN_WIDTH - 70) / 3,
  },
  photoWrapper: {
    flex: 1,
    position: 'relative',
    borderRadius: moderateScale(12),
    overflow: 'hidden',
  },
  primaryPhotoWrapper: {
    borderWidth: 2.5,
    borderColor: colors.primary,
    borderRadius: moderateScale(14),
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(12),
  },
  primaryPhoto: {
    borderRadius: moderateScale(11),
  },
  primaryBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  primaryBadgeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  primaryLabelText: {
    letterSpacing: 1,
  },
  primaryPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.selectedItembgCOlor,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: '#E8D0FF',
  },
  primaryPromptIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  primaryPromptText: {
    marginLeft: moderateScale(10),
    flex: 1,
    lineHeight: 18,
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    backgroundColor: colors.grey800,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingPhoto: {
    flex: 1,
    backgroundColor: colors.grey50,
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  uploadingText: {
    marginTop: moderateScale(8),
    textAlign: 'center',
  },
  placeholderPhoto: {
    flex: 1,
    backgroundColor: colors.grey50,
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.grey200,
    borderStyle: 'dashed',
  },
  addText: {
    marginTop: moderateScale(8),
    textAlign: 'center',
  },
  validationText: {
    textAlign: 'center',
    marginBottom: moderateScale(20),
  },
  bottomSheetContent: {
    flex: 1,
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(10),
  },
  sheetTitle: {
    textAlign: 'center',
    marginBottom: moderateScale(30),
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  optionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(20),
    paddingHorizontal: moderateScale(25),
    borderRadius: moderateScale(16),
    backgroundColor: colors.grey50,
    minWidth: moderateScale(140),
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIcon: {
    width: moderateScale(50),
    height: moderateScale(50),
  },
  optionText: {
    textAlign: 'center',
  },
});

export default PhotoUploadComponent;
