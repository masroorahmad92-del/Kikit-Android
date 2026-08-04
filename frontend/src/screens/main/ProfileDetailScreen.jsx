import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  DeviceEventEmitter,
  Animated as RNAnimated,
} from 'react-native';
import Popover from 'react-native-popover-view';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import FastImage from 'react-native-fast-image';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../theme';
import {
  ArrowBack,
  HeartFilledIcon,
  ChevronRight,
  ThreeDots,
  ReportIcon,
  BlockIcon,
} from '../../assets/icons';
import { SHIMMER_COLORS } from '../../constants/shimmer';
import { matchesService } from '../../api/services/matchesService';
import Toast from 'react-native-toast-message';
import ReportModal from '../../components/ReportModal';
import ConfirmationModal from '../../components/ConfirmationModal';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Helper function to calculate age from DOB
const calculateAge = dob => {
  if (!dob) {
    return null;
  }
  const [day, month, year] = dob.split('-');
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

// Helper function to format height
const formatHeight = height => {
  if (!height) {
    return 'N/A';
  }

  // Convert to number if it's a string
  const heightNum =
    typeof height === 'string' ? parseFloat(height) : Number(height);

  // Check if it's a valid number
  if (isNaN(heightNum) || heightNum <= 0) {
    return 'N/A';
  }

  // Assuming height is in cm, convert to feet and inches
  const totalInches = heightNum / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);

  // Return formatted string
  return `${Math.round(heightNum)}cm (${feet}'${inches}")`;
};

const ProfileDetailScreen = ({ route, navigation }) => {
  const { item } = route.params;
  const translateY = useSharedValue(0);
  const scrollOffset = useSharedValue(0);

  const [imageLoading, setImageLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPopover, setShowPopover] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const menuButtonRef = useRef(null);

  // In-screen success banner (avoids modal z-index toast issue)
  const [bannerMessage, setBannerMessage] = useState('');
  const bannerAnim = useRef(new RNAnimated.Value(-100)).current;

  const showBanner = (message) => {
    setBannerMessage(message);
    RNAnimated.sequence([
      RNAnimated.timing(bannerAnim, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }),
      RNAnimated.delay(2800),
      RNAnimated.timing(bannerAnim, {
        toValue: -100,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start(() => setBannerMessage(''));
  };

  // Use originalData if available, otherwise use item directly
  const originalData = profileData || item?.originalData || item;
  const isFromChatPage = Boolean(
    route?.params?.fromChatPage ||
    route?.params?.item?.fromChatPage ||
    item?.fromChatPage,
  );
  const targetUserId =
    originalData?.user?.id ||
    item?.originalData?.user?.id ||
    (isFromChatPage ? item?.id : null);
  const targetProfileId =
    originalData?.id || item?.originalData?.id || (!isFromChatPage ? item?.id : null);
  // Fetch profile details
  useEffect(() => {
    const fetchProfileDetails = async () => {
      if (!item?.id) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        let response = null;
        if (isFromChatPage) {
          response = await matchesService.getProfileByUserId(item.id);
        } else {
          response = await matchesService.getProfileById(item.id);
        }

        // Handle response data - check if it's wrapped in a data property
        const data = response?.data?.data || response?.data || response;
        setProfileData(data);
      } catch (err) {
        console.error('Error fetching profile details:', err);
        setError(
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load profile',
        );
        Toast.show({
          type: 'error',
          text2: 'Error',
          text1:
            err?.response?.data?.message || 'Failed to load profile details',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileDetails();
  }, [item?.id, isFromChatPage]);

  // Get all photos
  const photos = useMemo(() => {
    if (
      originalData?.photos &&
      Array.isArray(originalData.photos) &&
      originalData.photos.length > 0
    ) {
      // Sort so the primary photo comes first
      const sorted = [...originalData.photos].sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return 0;
      });
      return sorted.map(photo => ({ uri: photo.url }));
    }
    // Fallback to single image if available
    if (item?.image) {
      return [item.image];
    }
    // Default placeholder
    return [require('../../assets/images/image-placegolder.png')];
  }, [originalData?.photos, item?.image]);

  const totalImages = photos.length;

  const handleClose = () => {
    navigation.goBack();
  };

  // Report handlers
  const handleReportPress = () => {
    setShowPopover(false);
    setTimeout(() => {
      setShowReportModal(true);
    }, 500);
  };

  // Block handler
  const handleBlockPress = () => {
    setShowPopover(false);
    setTimeout(() => {
      setShowBlockModal(true);
    }, 500);
  };

  const handleConfirmBlock = async () => {
    if (!targetUserId) {
      Toast.show({
        type: 'error',
        text1: 'Unable to block',
        text2: 'User information not available.',
      });
      return;
    }
    try {
      setIsBlocking(true);
      await matchesService.blockUser(targetUserId);
      DeviceEventEmitter.emit('userBlocked', {
        userId: targetUserId,
        profileId: targetProfileId,
      });
      Toast.show({
        type: 'success',
        text1: 'User Blocked',
        text2: `${name} has been blocked.`,
        position: 'top',
        visibilityTime: 3000,
      });
      setShowBlockModal(false);
      if (isFromChatPage && navigation.pop) {
        navigation.pop(2);
      } else {
        navigation.goBack();
      }
    } catch (err) {
      console.error('Error blocking user:', err);
      Toast.show({
        type: 'error',
        text1: 'Block Failed',
        text2:
          err?.response?.data?.message ||
          'Failed to block user. Please try again.',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setIsBlocking(false);
    }
  };

  const handleReportSubmit = async reportData => {
    if (!targetUserId) {
      Toast.show({
        type: 'error',
        text1: 'Unable to report',
        text2: 'User information not available.',
      });
      setShowReportModal(false);
      return;
    }

    try {
      setIsReporting(true);

      // Prepare payload with correct structure
      const payload = {
        reported_user_id: targetUserId,
        reason: reportData.reason,
        description: reportData.description,
      };

      const response = await matchesService.reportProfile(payload);
      console.log(response, "test")
      const successMessage = response?.data?.message || 'Report Submitted';

      // Close modal and show in-screen banner (stays on this screen)
      setShowReportModal(false);
      showBanner(successMessage);
    } catch (err) {
      console.error('Error reporting profile:', err);

      // Close modal first
      setShowReportModal(false);

      // Show error toast after modal closes
      setTimeout(() => {
        Toast.show({
          type: 'error',
          text1: 'Report Failed',
          text2:
            err?.response?.data?.message ||
            'Failed to submit report. Please try again.',
          position: 'top',
          visibilityTime: 3000,
        });
      }, 600);
    } finally {
      setIsReporting(false);
    }
  };

  // Navigation functions for images
  const handlePreviousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
      setImageLoading(true);
    }
  };

  const handleNextImage = () => {
    if (currentImageIndex < totalImages - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      setImageLoading(true);
    }
  };

  // Get current image
  const currentImage = photos[currentImageIndex] || photos[0];
  const isRemoteImage = typeof currentImage === 'object' && currentImage.uri;

  // Track scroll position
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollOffset.value = event.contentOffset.y;
    },
  });

  // Pan gesture to swipe down and close
  const panGesture = Gesture.Pan()
    .onUpdate(e => {
      if (scrollOffset.value <= 0 && e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd(e => {
      if (
        scrollOffset.value <= 0 &&
        (e.translationY > 100 || e.velocityY > 500)
      ) {
        translateY.value = withTiming(
          SCREEN_HEIGHT,
          { duration: 300 },
          finished => {
            if (finished) {
              runOnJS(handleClose)();
            }
          },
        );
      } else {
        translateY.value = withTiming(0, { duration: 300 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Prepare data for display from item and originalData
  const name = item?.name || originalData?.name || 'Unknown';
  const age =
    item?.age || (originalData?.dob ? calculateAge(originalData.dob) : 'N/A');
  const distance = item?.distance || '';
  const description =
    item?.description || originalData?.about || 'No description available.';
  const location =
    item?.location ||
    [originalData?.city, originalData?.state, originalData?.country]
      .filter(Boolean)
      .join(', ') ||
    '';

  // Get interests and hobbies
  const interests =
    item?.interests ||
    originalData?.interests?.map(interest => interest?.name || interest) ||
    [];
  const hobbies =
    item?.hobbies ||
    originalData?.hobbies?.map(hobby => hobby?.name || hobby) ||
    [];
  const lookingForArr = Array.isArray(originalData?.looking_for)
    ? originalData.looking_for
    : originalData?.looking_for ? [originalData.looking_for] : [];
  const lookingForLabels = {
    dating: 'Live rooms',
    friendship: 'Friendship',
    marriage: 'Creator support',
  };
  const gender = originalData?.gender || 'Not specified';
  const currentStatus = originalData?.current_status || 'Not specified';
  const ethnicity = originalData?.ethnicity || 'Not specified';
  const height = originalData?.height
    ? formatHeight(originalData.height)
    : 'Not specified';

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !profileData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setIsLoading(true);
              // Re-fetch will happen via useEffect dependency
            }}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* In-screen success banner */}
      {bannerMessage ? (
        <RNAnimated.View
          style={[
            styles.successBanner,
            { transform: [{ translateY: bannerAnim }] },
          ]}>
          <Text style={styles.successBannerIcon}>✓</Text>
          <View style={styles.successBannerTextWrap}>
            <Text style={styles.successBannerTitle}>{bannerMessage}</Text>
            <Text style={styles.successBannerSub}>
              Thank you for helping keep our community safe.
            </Text>
          </View>
        </RNAnimated.View>
      ) : null}

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.content, animatedStyle]}>
          <Animated.ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            bounces={true}
            onScroll={scrollHandler}
            scrollEventThrottle={16}>
            {/* Hero image with overlay header and actions */}
            <View style={styles.heroWrapper}>
              <View style={styles.imageContainer}>
                {/* Shimmer for image loading */}
                <ShimmerPlaceholder
                  visible={!imageLoading}
                  style={styles.profileImage}
                  shimmerColors={SHIMMER_COLORS}>
                  {isRemoteImage ? (
                    <FastImage
                      source={currentImage}
                      style={styles.profileImage}
                      resizeMode={FastImage.resizeMode.cover}
                      priority={FastImage.priority.high}
                      cache={FastImage.cacheControl.immutable}
                      onLoadStart={() => setImageLoading(true)}
                      onLoadEnd={() => setImageLoading(false)}
                      onError={() => setImageLoading(false)}
                    />
                  ) : (
                    <FastImage
                      source={currentImage}
                      style={styles.profileImage}
                      resizeMode={FastImage.resizeMode.cover}
                      priority={FastImage.priority.high}
                      cache={FastImage.cacheControl.immutable}
                      onLoadEnd={() => setImageLoading(false)}
                    />
                  )}
                </ShimmerPlaceholder>

                {/* Gradient overlay */}
                <LinearGradient
                  colors={[
                    'rgba(0,0,0,0)',
                    'rgba(0,0,0,0.3)',
                    'rgba(0,0,0,0.6)',
                  ]}
                  style={styles.gradientOverlay}
                />

                {/* Top progress bars */}
                {totalImages > 1 && (
                  <View style={styles.progressBarsContainer}>
                    {photos.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.progressBar,
                          index === currentImageIndex &&
                          styles.progressBarActive,
                        ]}
                      />
                    ))}
                  </View>
                )}

                {/* Top overlay header */}
                <View style={styles.topOverlay}>
                  <TouchableOpacity
                    onPress={handleClose}
                    activeOpacity={0.8}
                    style={styles.backBtn}>
                    <ArrowBack />
                  </TouchableOpacity>
                  <TouchableOpacity
                    ref={menuButtonRef}
                    onPress={() => {
                      setShowPopover(true);
                    }}
                    activeOpacity={0.8}
                    style={styles.menuBtn}>
                    <ThreeDots width={24} height={24} fill="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Left navigation button */}
                {totalImages > 1 && currentImageIndex > 0 && (
                  <TouchableOpacity
                    onPress={handlePreviousImage}
                    activeOpacity={0.8}
                    style={styles.navButtonLeft}>
                    <View style={styles.navButtonCircle}>
                      <ArrowBack width={20} height={20} fill="#fff" />
                    </View>
                  </TouchableOpacity>
                )}

                {/* Right navigation button */}
                {totalImages > 1 && currentImageIndex < totalImages - 1 && (
                  <TouchableOpacity
                    onPress={handleNextImage}
                    activeOpacity={0.8}
                    style={styles.navButtonRight}>
                    <View style={styles.navButtonCircle}>
                      <ChevronRight width={20} height={20} stroke="#fff" />
                    </View>
                  </TouchableOpacity>
                )}

                {/* Name and distance centered at bottom */}
                <View style={styles.imageInfoRow}>
                  <Text style={styles.imageName}>
                    {name}, {age}
                  </Text>
                  <View style={styles.distanceRow}>
                    {/* <MapLocationIcon width={14} height={14} fill="#fff" /> */}
                    <Text style={styles.imageDistance}>{distance}</Text>
                  </View>
                </View>

                {/* Floating action buttons */}
                {/* <View style={styles.fabRow}>
                  <TouchableOpacity style={[styles.fab, styles.nopeFab]} onPress={handleClose} activeOpacity={0.8}>
                    <Close width={24} height={24} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.fab, styles.likeFab]} activeOpacity={0.8}>
                    <HeartFilledIcon width={40} height={40} fill={'#fff'} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.fab, styles.giftFab]} activeOpacity={0.8}>
                    <GiftIcon width={24} height={24} />
                  </TouchableOpacity>
                </View> */}
              </View>
            </View>

            {/* Who I Am */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeader}>Who I Am</Text>
              <Text style={styles.paragraph}>{description}</Text>
            </View>

            {/* Looking For */}
            {lookingForArr.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeader}>Looking For</Text>
                <View style={styles.pillsRow}>
                  {lookingForArr.map((lf, idx) => (
                    <View key={idx} style={[styles.pill, styles.pillDating]}>
                      <HeartFilledIcon
                        width={16}
                        height={16}
                        fill={colors.secondary || '#FF4D8C'}
                      />
                      <Text style={styles.pillDatingText}>
                        {lookingForLabels[lf] || lf.charAt(0).toUpperCase() + lf.slice(1)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* About Me badges */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeader}>About Me</Text>
              <View style={styles.aboutMeGrid}>
                {gender && gender !== 'Not Specified' && (
                  <View style={styles.aboutMeItem}>
                    <View
                      style={[styles.iconCircle, { backgroundColor: '#FFE8F5' }]}>
                      <Text style={styles.iconText}>👤</Text>
                    </View>
                    <Text style={styles.aboutMeText}>{gender}</Text>
                  </View>
                )}
                {currentStatus && currentStatus !== 'Not Specified' && (
                  <View style={styles.aboutMeItem}>
                    <View
                      style={[styles.iconCircle, { backgroundColor: '#FFE8F5' }]}>
                      <Text style={styles.iconText}>💝</Text>
                    </View>
                    <Text style={styles.aboutMeText}>{currentStatus}</Text>
                  </View>
                )}
                {ethnicity && ethnicity !== 'Not Specified' && (
                  <View style={styles.aboutMeItem}>
                    <View
                      style={[styles.iconCircle, { backgroundColor: '#E8F5FF' }]}>
                      <Text style={styles.iconText}>😊</Text>
                    </View>
                    <Text style={styles.aboutMeText}>{ethnicity}</Text>
                  </View>
                )}
                {height && height !== 'Not specified' && (
                  <View style={styles.aboutMeItem}>
                    <View
                      style={[styles.iconCircle, { backgroundColor: '#FFF3E8' }]}>
                      <Text style={styles.iconText}>📏</Text>
                    </View>
                    <Text style={styles.aboutMeText}>{height}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Location */}
            {location && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeader}>Location</Text>
                <View style={styles.locationRow}>
                  {/* <MapLocationIcon width={18} height={18} /> */}
                  <Text style={styles.locationText}>{location}</Text>
                </View>
              </View>
            )}

            {/* Interests */}
            {interests && interests.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeader}>Interest</Text>
                <View style={styles.pillsWrap}>
                  {interests.map((interest, idx) => (
                    <View key={idx} style={styles.pillOutline}>
                      <Text style={styles.pillOutlineText}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Hobby */}
            {hobbies && hobbies.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeader}>Hobby</Text>
                <View style={styles.pillsWrap}>
                  {hobbies.map((hobby, idx) => (
                    <View key={idx} style={styles.pillOutline}>
                      <Text style={styles.pillOutlineText}>{hobby}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Block & Report actions */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleBlockPress}
                activeOpacity={0.7}
                disabled={isBlocking}>
                <View style={styles.actionIconCircleBlock}>
                  <BlockIcon width={22} height={22} color="#FF2B1F" />
                </View>
                <Text style={styles.actionButtonTextBlock}>
                  {isBlocking ? 'Blocking...' : 'Block User'}
                </Text>
              </TouchableOpacity>

              <View style={styles.actionDivider} />

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleReportPress}
                activeOpacity={0.7}>
                <View style={styles.actionIconCircleReport}>
                  <ReportIcon width={22} height={22} />
                </View>
                <Text style={styles.actionButtonTextReport}>Report User</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomSpacer} />
          </Animated.ScrollView>
        </Animated.View>
      </GestureDetector>

      {/* Popover menu */}
      <Popover
        isVisible={showPopover}
        onRequestClose={() => setShowPopover(false)}
        from={menuButtonRef}
        placement="bottom"
        popoverShift={{ x: 0, y: 18 }}
        displayArea={{ x: 0, y: 20, width: Dimensions.get('window').width, height: Dimensions.get('window').height }}
        popoverStyle={styles.popover}>
        <TouchableOpacity
          style={styles.popoverItem}
          onPress={handleReportPress}
          activeOpacity={0.7}>
          <View style={styles.reportIconContainer}>
            <ReportIcon />
          </View>
          <Text style={styles.popoverText}>Report</Text>
        </TouchableOpacity>
        <View style={styles.popoverDivider} />
        <TouchableOpacity
          style={styles.popoverItem}
          onPress={handleBlockPress}
          activeOpacity={0.7}>
          <View style={styles.blockIconContainer}>
            <BlockIcon width={20} height={20} color="#FF2B1F" />
          </View>
          <Text style={styles.popoverText}>Block</Text>
        </TouchableOpacity>
      </Popover>

      {/* Report Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReportSubmit}
        isSubmitting={isReporting}
      />
      <ConfirmationModal
        visible={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        icon={<BlockIcon width={60} height={60} color={colors.danger} />}
        title="Block User"
        message={`Block ${name}? You will not see each other in live rooms, chat, or gifts.`}
        confirmText="Block"
        cancelText="Cancel"
        loading={isBlocking}
        onConfirm={handleConfirmBlock}
        onCancel={() => setShowBlockModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white || '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: colors.white || '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  heroWrapper: {
    marginBottom: 20,
  },
  imageContainer: {
    width: '100%',
    height: 440,
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  progressBarsContainer: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 16,
    zIndex: 15,
    paddingTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    maxWidth: 40,
  },
  progressBarActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  topOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 30,
    paddingTop: 32,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  imageInfoRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 80,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  imageName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  imageDistance: {
    fontSize: 15,
    color: '#fff',
    opacity: 0.95,
  },
  fabRow: {
    position: 'absolute',
    width: '100%',
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 60,
    zIndex: 10,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nopeFab: {
    backgroundColor: '#FF4D67',
  },
  likeFab: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF4D8C',
  },
  giftFab: {
    backgroundColor: '#4D9FFF',
  },
  sectionBlock: {
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.grey800 || '#1A1A1A',
    marginBottom: 12,
  },
  sectionHeaderShimmer: {
    width: 150,
    height: 20,
    borderRadius: 8,
    marginBottom: 12,
  },
  sectionContentShimmer: {
    width: '100%',
    height: 60,
    borderRadius: 8,
  },
  paragraph: {
    fontSize: 15,
    color: colors.grey400 || '#666666',
    lineHeight: 22,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  pillDating: {
    backgroundColor: '#FFE8F5',
  },
  pillDatingText: {
    fontSize: 14,
    color: '#FF4D8C',
    fontWeight: '600',
  },
  aboutMeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  aboutMeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 14,
  },
  aboutMeText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  pillOutline: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    backgroundColor: colors.white || '#FFFFFF',
  },
  pillOutlineText: {
    fontSize: 14,
    color: colors.grey800 || '#1A1A1A',
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 15,
    color: colors.grey800 || '#1A1A1A',
    flex: 1,
  },
  bottomSpacer: {
    marginBottom: 40,
  },
  navButtonLeft: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 20,
  },
  navButtonRight: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 20,
  },
  navButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(97, 88, 88, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.grey400,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: colors.white,
  },
  errorText: {
    fontSize: 18,
    color: colors.grey800,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 12,
  },
  retryButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  closeButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  closeButtonText: {
    fontSize: 16,
    color: colors.grey400,
    fontWeight: '600',
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(84, 80, 80, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  popover: {
    backgroundColor: colors.white || '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  popoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  reportIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF3E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF0EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popoverDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 12,
  },
  reportIcon: {
    fontSize: 18,
  },
  popoverText: {
    left: -6,
    fontSize: 16,
    color: colors.danger,
    fontWeight: '500',
  },
  actionButtonsContainer: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 14,
  },
  actionDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  actionIconCircleBlock: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF0EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconCircleReport: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonTextBlock: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF2B1F',
  },
  actionButtonTextReport: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF7A00',
  },
  successBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1DB954',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 48,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 16,
  },
  successBannerIcon: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
    width: 28,
    height: 28,
    textAlign: 'center',
    lineHeight: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  successBannerTextWrap: {
    flex: 1,
  },
  successBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  successBannerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
});

export default ProfileDetailScreen;
