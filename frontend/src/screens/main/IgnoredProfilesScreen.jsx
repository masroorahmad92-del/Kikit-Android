import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {colors, moderateScale} from '../../theme';
import {Text} from '../../components/base/Text';
import {ArrowBack, User, ThreeHearts} from '../../assets/icons';
import {matchesService} from '../../api/services/matchesService';
import {useKitkitStore} from '../../store/kitkitStore';
import Toast from 'react-native-toast-message';
import FastImage from 'react-native-fast-image';
import {createShimmerPlaceholder} from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import {SHIMMER_COLORS} from '../../constants/shimmer';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

// Helper function to calculate age from DOB
const calculateAge = dob => {
  if (!dob) {
    return null;
  }
  const [day, month, year] = dob.split('/');
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Transform API response to match component format
const transformIgnoredData = profiles => {
  if (!profiles || !Array.isArray(profiles)) {
    return [];
  }

  return profiles.map(profile => {
    const age = calculateAge(profile.dob);

    // Get first photo URL or use placeholder
    const imageUrl =
      profile.photos && profile.photos.length > 0 && profile.photos[0].url
        ? {uri: profile.photos[0].url}
        : require('../../assets/images/image-placegolder.png');

    return {
      id: profile.id,
      name: profile.name || 'Unknown',
      age: age || 'N/A',
      image: imageUrl,
      // Keep original data for reference
      originalData: profile,
    };
  });
};

const IgnoredProfilesScreen = ({navigation}) => {
  const {userProfile} = useKitkitStore();
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingProfileId, setProcessingProfileId] = useState(null);

  // Animation values for empty state
  const emptyStateScale = useSharedValue(1);
  const emptyStateOpacity = useSharedValue(1);
  const iconPulse = useSharedValue(1);
  const cardScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);

  // Fetch ignored profiles
  const fetchIgnoredProfiles = async (isRefreshing = false) => {
    if (!isRefreshing) {
      setIsLoading(true);
    }

    try {
      const response = await matchesService.getIgnoredProfiles();
      // Handle both direct array response and wrapped response
      const ignoredProfiles = Array.isArray(response?.data)
        ? response.data
        : response?.data?.data?.profiles || response?.data?.data || [];
      const transformedData = transformIgnoredData(ignoredProfiles);
      setProfiles(transformedData);

      // Animate empty state if no profiles
      if (transformedData.length === 0) {
        cardScale.value = withSpring(1, {
          damping: 15,
          stiffness: 150,
        });
        cardOpacity.value = withTiming(1, {duration: 600});
        emptyStateScale.value = withTiming(1, {duration: 500});
        emptyStateOpacity.value = withTiming(1, {duration: 500});
        iconPulse.value = withRepeat(
          withSequence(
            withTiming(1.15, {duration: 1000}),
            withTiming(1, {duration: 1000}),
          ),
          -1,
          true,
        );
      } else {
        emptyStateScale.value = 0;
        emptyStateOpacity.value = 0;
        iconPulse.value = 1;
        cardScale.value = 0.8;
        cardOpacity.value = 0;
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text2: 'Failed to load ignored profiles',
        text1: error?.response?.data?.message || error?.message || 'Please try again later',
      });
      setProfiles([]);
      // Trigger empty state animation on error
      cardScale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
      cardOpacity.value = withTiming(1, {duration: 600});
      emptyStateScale.value = withTiming(1, {duration: 500});
      emptyStateOpacity.value = withTiming(1, {duration: 500});
      iconPulse.value = withRepeat(
        withSequence(
          withTiming(1.15, {duration: 1000}),
          withTiming(1, {duration: 1000}),
        ),
        -1,
        true,
      );
    } finally {
      if (!isRefreshing) {
        setIsLoading(false);
      }
    }
  };

  // Handle pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchIgnoredProfiles(true);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchIgnoredProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trigger animations when profiles become empty
  useEffect(() => {
    if (!isLoading && (!profiles || profiles.length === 0)) {
      cardScale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
      cardOpacity.value = withTiming(1, {duration: 600});
      emptyStateScale.value = withTiming(1, {duration: 500});
      emptyStateOpacity.value = withTiming(1, {duration: 500});
      iconPulse.value = withRepeat(
        withSequence(
          withTiming(1.15, {duration: 1000}),
          withTiming(1, {duration: 1000}),
        ),
        -1,
        true,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles, isLoading]);

  // Animated styles
  const emptyStateAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: emptyStateScale.value}],
      opacity: emptyStateOpacity.value,
    };
  });

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: iconPulse.value}],
    };
  });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: cardScale.value}],
      opacity: cardOpacity.value,
    };
  });

  const handleUnignore = async item => {
    const profileId = item.originalData?.id || item.id;

    if (!profileId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Invalid profile ID',
      });
      return;
    }

    // Prevent multiple simultaneous requests
    if (processingProfileId) {
      return;
    }

    try {
      // Set loading state
      setProcessingProfileId(profileId);

      // Call API to unignore profile
      const response = await matchesService.unignoreProfile(profileId);

      // Remove from UI only after successful API call
      setProfiles(prevProfiles =>
        prevProfiles.filter(profile => profile.id !== item.id),
      );

      Toast.show({
        type: 'success',
        text2: 'Success',
        text1: response?.data?.message || `${item.name} has been unignored`,
      });
    } catch (error) {
      console.error('Failed to unignore profile:', error);
      Toast.show({
        type: 'error',
        text2: 'Error',
        text1:
          error?.response?.data?.message ||
          error?.message ||
          'Failed to unignore profile. Please try again',
      });
    } finally {
      // Clear loading state
      setProcessingProfileId(null);
    }
  };

  const renderShimmerItem = () => (
    <View style={styles.shimmerItem}>
      <ShimmerPlaceholder
        style={styles.shimmerAvatar}
        shimmerColors={SHIMMER_COLORS}
      />
      <ShimmerPlaceholder
        style={styles.shimmerName}
        shimmerColors={SHIMMER_COLORS}
      />
      <ShimmerPlaceholder
        style={styles.shimmerButton}
        shimmerColors={SHIMMER_COLORS}
      />
    </View>
  );

  const renderEmptyState = () => {
    return (
      <View style={styles.emptyContainer}>
        <Animated.View style={[styles.emptyStateCard, cardAnimatedStyle]}>
          {/* Card Header with Gradient Background */}
          <View style={styles.emptyCardHeader}>
            <LinearGradient
              colors={[colors.secondary || '#FF4D8C', colors.primary || '#4D9FFF']}
              style={styles.emptyCardGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
            />
            <Animated.View style={[styles.emptyCardIconContainer, iconAnimatedStyle]}>
              <ThreeHearts width={80} height={80} fill={colors.white} />
            </Animated.View>
          </View>

          {/* Card Content */}
          <Animated.View style={[styles.emptyCardContent, emptyStateAnimatedStyle]}>
            <Text ff="c-Regular" fs="XXL" color="grey800" style={styles.emptyStateTitle}>
              No Ignored Profiles
            </Text>
            <Text ff="c-Regular" fs="M" color="grey400" style={styles.emptyStateSubtitle}>
              You haven't ignored anyone yet.{'\n'}
              Ignored profiles will appear here.
            </Text>
          </Animated.View>
        </Animated.View>
      </View>
    );
  };

  const renderProfileItem = ({item, index}) => {
    const isProcessing = processingProfileId === (item.originalData?.id || item.id);
    const isRemoteImage = item.image && typeof item.image === 'object' && item.image.uri;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).duration(500).springify()}
        style={styles.profileItem}>
        {/* Profile Picture */}
        <View style={styles.avatarContainer}>
          {isRemoteImage ? (
            <FastImage
              source={item.image}
              style={styles.avatar}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : (
            <FastImage
              source={item.image}
              style={styles.avatar}
              resizeMode={FastImage.resizeMode.cover}
            />
          )}
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <Text ff="c-Regular" fs="L" color="grey800" style={styles.profileName}>
            {item.name}
          </Text>
          {item.age && (
            <Text ff="c-Regular" fs="S" color="grey500" style={styles.profileAge}>
              {item.age} years old
            </Text>
          )}
        </View>

        {/* Unignore Button */}
        <TouchableOpacity
          style={[styles.unignoreButton, isProcessing && styles.buttonDisabled]}
          onPress={() => handleUnignore(item)}
          disabled={isProcessing}
          activeOpacity={0.7}>
          <LinearGradient
            colors={[colors.secondary, colors.primary]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.unignoreButtonGradient}>
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text ff="c-Regular" fs="M" color="white" style={styles.unignoreButtonText}>
                unblock
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <ArrowBack width={24} height={24} stroke={colors.grey800} />
        </TouchableOpacity>
        <Text ff="c-Regular" fs="XXXL" color="grey800" style={styles.title}>
          Blocked Profiles
        </Text>
      </View>

      {/* Profile List or Empty State */}
      {isLoading ? (
        <FlatList
          data={[1, 2, 3, 4, 5]}
          renderItem={renderShimmerItem}
          keyExtractor={item => item.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      ) : profiles.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyStateWrapper}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }>
          {renderEmptyState()}
        </ScrollView>
      ) : (
        <FlatList
          data={profiles}
          renderItem={renderProfileItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
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
    marginRight: moderateScale(16),
    padding: moderateScale(4),
  },
  title: {
    fontWeight: '700',
    flex: 1,
  },
  listContent: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(20),
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    marginBottom: moderateScale(12),
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: moderateScale(12),
  },
  avatar: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: colors.grey100,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontWeight: '600',
    marginBottom: moderateScale(4),
  },
  profileAge: {
    fontWeight: '400',
  },
  unignoreButton: {
    borderRadius: moderateScale(20),
    overflow: 'hidden',
    minWidth: moderateScale(100),
  },
  unignoreButtonGradient: {
    height:30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unignoreButtonText: {
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  shimmerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(12),
    marginBottom: moderateScale(12),
  },
  shimmerAvatar: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    marginRight: moderateScale(12),
  },
  shimmerName: {
    flex: 1,
    height: moderateScale(16),
    borderRadius: moderateScale(8),
  },
  shimmerButton: {
    width: moderateScale(100),
    height: moderateScale(36),
    borderRadius: moderateScale(20),
  },
  emptyStateWrapper: {
    flexGrow: 1,
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(40),
  },
  emptyStateCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: moderateScale(20),
    backgroundColor: colors.white,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  emptyCardHeader: {
    height: moderateScale(200),
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  emptyCardIconContainer: {
    zIndex: 1,
  },
  emptyCardContent: {
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(32),
    alignItems: 'center',
  },
  emptyStateTitle: {
    textAlign: 'center',
    marginBottom: moderateScale(12),
    fontWeight: '700',
  },
  emptyStateSubtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default IgnoredProfilesScreen;
