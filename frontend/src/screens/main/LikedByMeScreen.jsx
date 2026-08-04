import React, {useState, useEffect, useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {View, StyleSheet, SafeAreaView, FlatList, TouchableWithoutFeedback, TouchableOpacity, Keyboard, RefreshControl, ScrollView, Image} from 'react-native';
import {colors, moderateScale} from '../../theme';
import {Text} from '../../components/base/Text';
import SearchBar from '../../components/SearchBar';
import LikeProfileCard from '../../components/LikeProfileCard';
import ItsAMatch from '../../components/ItsAMatch';
import {Search, ThreeHearts} from '../../assets/icons';
import {matchesService} from '../../api/services/matchesService';
import {useKitkitStore} from '../../store/kitkitStore';
import Toast from 'react-native-toast-message';
import {createShimmerPlaceholder} from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  FadeInDown,
  withSpring,
} from 'react-native-reanimated';
import {getPrimaryPhoto} from '../../utils/helpers';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

// Helper function to calculate age from DOB
const calculateAge = dob => {
  if (!dob) {
    return null;
  }
  const [day, month, year] = dob.includes('/') ? dob.split('/') : dob.split('-');
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Helper function to calculate distance (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) {
    return null;
  }
  const R = 3959; // Radius of the Earth in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance.toFixed(1);
};

// Transform API response to match component format
const transformMyLikesData = (profiles, userProfile) => {
  if (!profiles || !Array.isArray(profiles)) {
    return [];
  }

  const userLat = userProfile?.latitude;
  const userLon = userProfile?.longitude;

  return profiles.map(profile => {
    const age = calculateAge(profile.dob);

    // Use distance_km from API if available (convert to miles), otherwise calculate
    let distance = null;
    if (profile.distance_km !== undefined && profile.distance_km !== null) {
      distance = `${(parseFloat(profile.distance_km) * 0.621371).toFixed(1)} miles away`;
    } else if (userLat && userLon && profile.latitude && profile.longitude) {
      distance = `${calculateDistance(userLat, userLon, profile.latitude, profile.longitude)} miles away`;
    } else {
      distance = '';
    }

    // Get first photo URL or use placeholder
    const imageUrl = profile.photos && profile.photos.length > 0 && profile.photos[0].url
      ? {uri: profile.photos[0].url}
      : require('../../assets/images/image-placegolder.png');

    return {
      id: profile.id,
      name: profile.name || 'Unknown',
      age: age || 'N/A',
      distance,
      image: imageUrl,
      incomingSpark: profile.incoming_spark,
      // Keep original data for reference
      originalData: profile,
    };
  });
};

const SparkInboxCard = ({
  item,
  onPressCard,
  onPressSparkBack,
  onPressReject,
  isProcessing,
}) => {
  const spark = item.incomingSpark;
  const source = spark?.category_name || spark?.interest_name;

  return (
    <TouchableOpacity
      style={styles.sparkInboxCard}
      onPress={onPressCard}
      activeOpacity={0.92}>
      <Image source={item.image} style={styles.sparkInboxImage} />
      <View style={styles.sparkInboxContent}>
        <View style={styles.sparkInboxHeader}>
          <View style={styles.sparkInboxNameWrap}>
            <Text ff="c-Bold" fs="L" color="grey800" numberOfLines={1}>
              {item.name}, {item.age}
            </Text>
            {!!item.distance && (
              <Text ff="c-Regular" fs="XS" color="grey400" numberOfLines={1}>
                {item.distance}
              </Text>
            )}
          </View>
          <View style={styles.sparkInboxPill}>
            <Text ff="c-Bold" fs="XXS" color="secondary">
              Spark
            </Text>
          </View>
        </View>

        <Text ff="c-Regular" fs="S" color="grey800" style={styles.sparkSource}>
          {source ? `Sent you a Spark through ${source}` : 'Sent you a Spark'}
        </Text>

        {!!spark?.question && (
          <Text ff="c-Bold" fs="S" color="grey800" style={styles.sparkQuestion}>
            {spark.question}
          </Text>
        )}
        {!!spark?.answer && (
          <Text
            ff="c-Regular"
            fs="S"
            color="grey400"
            style={styles.sparkAnswer}
            numberOfLines={3}>
            {spark.answer}
          </Text>
        )}

        <View style={styles.sparkActions}>
          <TouchableOpacity
            style={[styles.sparkPassButton, isProcessing && styles.disabledAction]}
            disabled={isProcessing}
            onPress={event => {
              event.stopPropagation();
              onPressReject();
            }}>
            <Text ff="c-Bold" fs="S" color="grey800">
              Pass
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sparkViewButton, isProcessing && styles.disabledAction]}
            disabled={isProcessing}
            onPress={event => {
              event.stopPropagation();
              onPressCard();
            }}>
            <Text ff="c-Bold" fs="S" color="grey800">
              View
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sparkBackButton, isProcessing && styles.disabledAction]}
            disabled={isProcessing}
            onPress={event => {
              event.stopPropagation();
              onPressSparkBack();
            }}>
            <Text ff="c-Bold" fs="S" color="white">
              {isProcessing ? 'Sending...' : 'Spark Back'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const LikedByMeScreen = ({navigation}) => {
  const {userProfile} = useKitkitStore();
  const [activeSegment, setActiveSegment] = useState('liked_by_me');
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [likedYouProfiles, setLikedYouProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingProfileId, setProcessingProfileId] = useState(null);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);
  const [matchSparkContext, setMatchSparkContext] = useState(null);

  // Animation values for empty state
  const emptyStateScale = useSharedValue(1);
  const emptyStateOpacity = useSharedValue(1);
  const iconPulse = useSharedValue(1);
  const cardScale = useSharedValue(1);
  const cardOpacity = useSharedValue(1);

  // Fetch Sparks sent by the current user.
  const fetchMyLikes = async (isRefreshing = false) => {
    if (!isRefreshing) {
      setIsLoading(true);
    }

    try {
      const response = await matchesService.getMyLikes();
      // Handle both direct array response and wrapped response
      const likedProfiles = Array.isArray(response?.data)
        ? response.data
        : response?.data?.data || [];
      console.log('myLikedProfiles', likedProfiles);
      const transformedData = transformMyLikesData(likedProfiles, userProfile);
      setProfiles(transformedData);

      // Animate empty state if no profiles
      if (transformedData.length === 0) {
        // Animate card entrance
        cardScale.value = withSpring(1, {
          damping: 15,
          stiffness: 150,
        });
        cardOpacity.value = withTiming(1, {duration: 600});

        // Animate icon and content
        emptyStateScale.value = withTiming(1, {duration: 500});
        emptyStateOpacity.value = withTiming(1, {duration: 500});
        iconPulse.value = withRepeat(
          withSequence(
            withTiming(1.15, {duration: 1000}),
            withTiming(1, {duration: 1000})
          ),
          -1,
          true
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
        text2: 'Failed to load profiles',
        text1: error?.message || 'Profiles Not Found',
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
          withTiming(1, {duration: 1000})
        ),
        -1,
        true
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
    if (activeSegment === 'liked_by_me') {
      await fetchMyLikes(true);
    } else {
      await fetchLikedYou(true);
    }
    setRefreshing(false);
  };

  // Fetch profiles who liked me
  const fetchLikedYou = async (isRefreshing = false) => {
    if (!isRefreshing) {
      setIsLoading(true);
    }

    try {
      const response = await matchesService.getLikedMe();
      const likedMeProfiles = Array.isArray(response?.data)
        ? response.data
        : response?.data?.data || [];
      console.log('likedYouProfiles', likedMeProfiles);
      const transformedData = transformMyLikesData(likedMeProfiles, userProfile);
      setLikedYouProfiles(transformedData);

      if (transformedData.length === 0) {
        cardScale.value = withSpring(1, { damping: 15, stiffness: 150 });
        cardOpacity.value = withTiming(1, {duration: 600});
        emptyStateScale.value = withTiming(1, {duration: 500});
        emptyStateOpacity.value = withTiming(1, {duration: 500});
        iconPulse.value = withRepeat(
          withSequence(
            withTiming(1.15, {duration: 1000}),
            withTiming(1, {duration: 1000})
          ),
          -1,
          true
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
        text2: 'Failed to load profiles',
        text1: error?.message || 'Profiles Not Found',
      });
      setLikedYouProfiles([]);
      cardScale.value = withSpring(1, { damping: 15, stiffness: 150 });
      cardOpacity.value = withTiming(1, {duration: 600});
      emptyStateScale.value = withTiming(1, {duration: 500});
      emptyStateOpacity.value = withTiming(1, {duration: 500});
      iconPulse.value = withRepeat(
        withSequence(
          withTiming(1.15, {duration: 1000}),
          withTiming(1, {duration: 1000})
        ),
        -1,
        true
      );
    } finally {
      if (!isRefreshing) {
        setIsLoading(false);
      }
    }
  };

  // Always fetch fresh data when the screen is focused (e.g. tab is tapped)
  useFocusEffect(
    useCallback(() => {
      if (activeSegment === 'liked_by_me') {
        fetchMyLikes();
      } else {
        fetchLikedYou();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSegment]),
  );

  // Fetch data when segment changes
  const handleSegmentChange = segment => {
    if (segment === activeSegment) {
      return;
    }
    setActiveSegment(segment);
    setSearchQuery('');
  };

  // Trigger animations when profiles become empty
  useEffect(() => {
    const currentProfiles = activeSegment === 'liked_by_me' ? profiles : likedYouProfiles;
    if (!isLoading && (!currentProfiles || currentProfiles.length === 0)) {
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
          withTiming(1, {duration: 1000})
        ),
        -1,
        true
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles, likedYouProfiles, isLoading, activeSegment]);

  // Animated styles for empty state
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

  const handleCardPress = item => {
    console.log('liked by me profile', item);
    navigation.navigate('ProfileDetail', {item});
  };

  const handleLike = async item => {
    // Already liked, so unlike
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

      // Call API to unlike
      const response = await matchesService.likeProfile(profileId);
      // Check if it's a match
      if (response?.data?.data?.is_matched) {
        setMatchedUser(item);
        setMatchSparkContext(response?.data?.data?.match?.spark_context || item.incomingSpark || null);
        setShowMatch(true);
      }

      // Remove from UI after successful API call
      if (activeSegment === 'liked_by_me') {
        setProfiles(prevProfiles => prevProfiles.filter(profile => profile.id !== item.id));
      } else {
        setLikedYouProfiles(prevProfiles => prevProfiles.filter(profile => profile.id !== item.id));
      }

      if (!response?.data?.data?.is_matched) {
        Toast.show({
          type: 'success',
          text2: 'Success',
          text1: response?.data?.message || `You unliked ${item.name}`,
        });
      }
    } catch (error) {
      console.error('Failed to unlike profile:', error);
      Toast.show({
        type: 'error',
        text2: 'Error',
        text1: error?.response?.data?.message || error?.message || 'Failed to unlike profile. Please try again',
      });
    } finally {
      // Clear loading state
      setProcessingProfileId(null);
    }
  };

  const handleReject = async item => {
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

      // Call API to ignore profile
      const response = await matchesService.deleteProfileLike(profileId);

      // Remove from UI only after successful API call
      if (activeSegment === 'liked_by_me') {
        setProfiles(prevProfiles => prevProfiles.filter(profile => profile.id !== item.id));
      } else {
        setLikedYouProfiles(prevProfiles => prevProfiles.filter(profile => profile.id !== item.id));
      }

      Toast.show({
        type: 'success',
        text2: 'Success',
        text1: response?.data?.message || `You won't see ${item.name} anymore`,
      });
    } catch (error) {
      console.error('Failed to ignore profile:', error);
      Toast.show({
        type: 'error',
        text2: 'Error',
        text1: error?.response?.data?.message || error?.message || 'Failed to ignore profile. Please try again',
      });
    } finally {
      // Clear loading state
      setProcessingProfileId(null);
    }
  };

  const activeProfiles = activeSegment === 'liked_by_me' ? profiles : likedYouProfiles;
  const filteredProfiles = (activeProfiles || []).filter(profile =>
    profile?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderShimmerItem = () => (
    <View style={styles.shimmerCard}>
      <ShimmerPlaceholder
        style={styles.shimmerImage}
        shimmerColors={[colors.grey50, colors.grey100, colors.grey50]}
      />
    </View>
  );

  const renderNoSearchResults = () => {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.noResultsContainer}>
          <Search width={60} height={60} stroke={colors.grey300} />
          <Text ff="c-Regular" fs="XXL" color="grey800" style={styles.noResultsTitle}>
            No Profile Found
          </Text>
          <Text ff="c-Regular" fs="M" color="grey400" style={styles.noResultsSubtitle}>
            We couldn't find any profiles matching "{searchQuery}"
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    return (
      <View style={styles.emptyContainer}>
        <Animated.View
          style={[styles.emptyStateCard, cardAnimatedStyle]}>
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
        <Animated.View
          style={[styles.emptyCardContent, emptyStateAnimatedStyle]}>
          <Text ff="c-Regular" fs="XXL" color="grey800" style={styles.emptyStateTitle}>
            {activeSegment === 'liked_by_me' ? 'Start with a Spark' : 'No Sparks Yet'}
          </Text>
          <Text ff="c-Regular" fs="M" color="grey400" style={styles.emptyStateSubtitle}>
            {activeSegment === 'liked_by_me'
              ? 'You have not sent any Sparks yet.\nDiscover people through shared interests.'
              : 'When someone starts with a shared interest, they will appear here.'}
          </Text>
          <View style={styles.encouragementContainer}>
            <Text style={styles.encouragementText}>
              {activeSegment === 'liked_by_me'
                ? 'Sparks you send will appear here.'
                : 'Incoming Sparks will appear here.'}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text ff="c-Regular" fs="XXXL" color="grey800" style={styles.title}>
              Sparks
            </Text>
            <Text ff="c-Regular" fs="M" color="grey500" style={styles.subtitle}>
              Track Sparks you sent and people who sparked you.
            </Text>
          </View>

          {/* Segment Tabs */}
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                activeSegment === 'liked_by_me' && styles.segmentButtonActive,
              ]}
              onPress={() => handleSegmentChange('liked_by_me')}
              activeOpacity={0.7}>
              <Text
                ff="c-Regular"
                fs="M"
                color={activeSegment === 'liked_by_me' ? 'white' : 'grey600'}
                style={styles.segmentText}>
                Sent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                activeSegment === 'liked_you' && styles.segmentButtonActive,
              ]}
              onPress={() => handleSegmentChange('liked_you')}
              activeOpacity={0.7}>
              <Text
                ff="c-Regular"
                fs="M"
                color={activeSegment === 'liked_you' ? 'white' : 'grey600'}
                style={styles.segmentText}>
                Received
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <SearchBar
            placeholder="Search Sparks"
            value={searchQuery}
            onChangeText={setSearchQuery}
            icon={<Search width={20} height={20} stroke={colors.grey400} />}
            containerStyle={styles.searchBar}
          />

          {/* Sparks Badge */}
          {!isLoading && (
            <View style={styles.badgeContainer}>
              <Text ff="c-Regular" fs="XL" color="grey800" style={styles.badgeText}>
                {activeSegment === 'liked_by_me' ? 'Sent' : 'Received'}
              </Text>
              <View style={styles.badge}>
                <Text ff="c-Regular" fs="M" color="grey800" style={styles.badgeCount}>
                  {filteredProfiles?.length || 0}
                </Text>
              </View>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* Profile Grid or Empty State */}
      {isLoading ? (
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          renderItem={renderShimmerItem}
          keyExtractor={item => item.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      ) : (!filteredProfiles || filteredProfiles.length === 0) ? (
        <ScrollView
          contentContainerStyle={styles.emptyStateWrapper}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              {searchQuery.trim() !== '' && activeProfiles.length > 0 ? renderNoSearchResults() : renderEmptyState()}
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      ) : (
        <FlatList
          key={activeSegment}
          data={filteredProfiles}
          renderItem={({item, index}) => (
            <Animated.View
              entering={FadeInDown.delay(index * 100).duration(500).springify()}
              style={activeSegment === 'liked_by_me' ? styles.cardWrapper : styles.sparkInboxWrapper}>
              {activeSegment === 'liked_by_me' ? (
                <LikeProfileCard
                  item={item}
                  onPressCard={() => handleCardPress(item)}
                  onPressLike={() => handleLike(item)}
                  onPressReject={() => handleReject(item)}
                  isProcessing={processingProfileId === (item.originalData?.id || item.id)}
                />
              ) : (
                <SparkInboxCard
                  item={item}
                  onPressCard={() => handleCardPress(item)}
                  onPressSparkBack={() => handleLike(item)}
                  onPressReject={() => handleReject(item)}
                  isProcessing={processingProfileId === (item.originalData?.id || item.id)}
                />
              )}
            </Animated.View>
          )}
          keyExtractor={item => item.id.toString()}
          numColumns={activeSegment === 'liked_by_me' ? 2 : 1}
          columnWrapperStyle={activeSegment === 'liked_by_me' ? styles.row : undefined}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
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

      {/* It's a Match Overlay */}
      <ItsAMatch
        visible={showMatch}
        // currentUserImage={
        //   userProfile?.photos?.[0]?.url
        //     ? {uri: userProfile.photos[0].url}
        //     : require('../../assets/images/image-placegolder.png')
        // }
        currentUserImage={
                      getPrimaryPhoto(userProfile?.photos)?.url
                        ? {uri: getPrimaryPhoto(userProfile?.photos).url}
                        : require('../../assets/images/image-placegolder.png')
                    }
        matchedUserImage={matchedUser?.image}
        matchedUserName={matchedUser?.name}
        sparkContext={matchSparkContext}
        onStartChatting={() => {
          setShowMatch(false);
          setMatchedUser(null);
          setMatchSparkContext(null);
          // Navigate to chat with matched user
          navigation.navigate('Chat');
        }}
        onKeepSwiping={() => {
          setShowMatch(false);
          setMatchedUser(null);
          setMatchSparkContext(null);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gradientBG,
    paddingTop: moderateScale(10),
  },
  contentContainer: {
    zIndex: 1,
  },
  header: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(15),
  },
  title: {
    marginBottom: moderateScale(5),
    fontWeight: '700',
  },
  subtitle: {
    fontWeight: '400',
  },
  searchBar: {
    marginHorizontal: moderateScale(20),
    marginBottom: moderateScale(20),
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: moderateScale(20),
    marginBottom: moderateScale(16),
    backgroundColor: colors.grey100 || '#F0F0F0',
    borderRadius: moderateScale(12),
    padding: moderateScale(4),
  },
  segmentButton: {
    flex: 1,
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  segmentText: {
    fontWeight: '600',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    marginBottom: moderateScale(15),
  },
  badgeText: {
    fontWeight: '600',
    marginRight: moderateScale(10),
  },
  badge: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(4),
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeCount: {
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(20),
  },
  row: {
    justifyContent: 'space-between',
    gap: moderateScale(12),
  },
  cardWrapper: {
    width: '48%',
    marginBottom: moderateScale(16),
  },
  sparkInboxWrapper: {
    width: '100%',
    marginBottom: moderateScale(14),
  },
  sparkInboxCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    shadowColor: colors.grey800,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  sparkInboxImage: {
    width: moderateScale(92),
    height: moderateScale(116),
    borderRadius: moderateScale(8),
    backgroundColor: colors.grey100,
  },
  sparkInboxContent: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  sparkInboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(8),
  },
  sparkInboxNameWrap: {
    flex: 1,
  },
  sparkInboxPill: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(14),
    backgroundColor: colors.grey50,
    alignSelf: 'flex-start',
  },
  sparkSource: {
    marginTop: moderateScale(8),
  },
  sparkQuestion: {
    marginTop: moderateScale(8),
  },
  sparkAnswer: {
    marginTop: moderateScale(4),
    lineHeight: moderateScale(18),
  },
  sparkActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginTop: moderateScale(12),
  },
  sparkPassButton: {
    paddingHorizontal: moderateScale(12),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: colors.grey50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkViewButton: {
    paddingHorizontal: moderateScale(12),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: colors.grey50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkBackButton: {
    flex: 1,
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledAction: {
    opacity: 0.55,
  },
  shimmerCard: {
    width: '48%',
    height: moderateScale(200),
    borderRadius: moderateScale(20),
    marginBottom: moderateScale(16),
    overflow: 'hidden',
  },
  shimmerImage: {
    width: '100%',
    height: '100%',
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
  listContainer: {
    flex: 1,
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
    marginBottom: moderateScale(16),
  },
  encouragementContainer: {
    marginTop: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    backgroundColor: colors.grey50 || '#F5F5F5',
    borderRadius: moderateScale(12),
  },
  encouragementText: {
    fontWeight: '600',
    color: colors.secondary || '#FF4D8C',
    fontSize: moderateScale(14),
    textAlign: 'center',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(40),
  },
  noResultsTitle: {
    marginTop: moderateScale(20),
    marginBottom: moderateScale(8),
    fontWeight: '700',
    textAlign: 'center',
  },
  noResultsSubtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default LikedByMeScreen;
