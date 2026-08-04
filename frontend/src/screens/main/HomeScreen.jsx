import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import { colors, moderateScale } from '../../theme';
import { Text } from '../../components/base/Text';
import { Header } from '../../components/base/Header';
import { FadeModal } from '../../components/base/FadeModal';
import FilterSheet from '../../components/FilterSheet';
import RotatingBanner from '../../components/RotatingBanner';
import ItsAMatch from '../../components/ItsAMatch';
import VerificationModal from '../../components/base/VerificationModal';
import { useKitkitStore } from '../../store/kitkitStore';
import { userService } from '../../api/services/userService';
import { matchesService } from '../../api/services/matchesService';
import { preferencesService } from '../../api/services/preferencesService';
import { notificationService } from '../../api/services/notificationService';
import { announcementService } from '../../api/services/announcementService';
import { Close, HeartFilledIcon, LocationIcon, ThreeHearts, VerificationIcon } from '../../assets/icons';
import { getPrimaryPhoto } from '../../utils/helpers';

const SPARK_PROMPTS = [
  'What would make this interest more fun with someone new?',
  'What is your favorite way to spend time around this?',
  'What small story would you share to start a conversation?',
  'What is one thing you would love to explore together?',
];

const DISCOVER_PAGE_SIZE = 20;

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

const getImageSource = profile => {
  const primaryPhoto = getPrimaryPhoto(profile?.photos);
  if (primaryPhoto?.url) {
    return { uri: primaryPhoto.url };
  }
  const firstPhoto = profile?.photos?.[0]?.url;
  return firstPhoto
    ? { uri: firstPhoto }
    : require('../../assets/images/image-placegolder.png');
};

const formatDistance = profile => {
  if (profile?.distance_km !== undefined && profile?.distance_km !== null) {
    return `${(parseFloat(profile.distance_km) * 0.621371).toFixed(1)} miles away`;
  }
  return '';
};

const buildDiscoverItem = profile => ({
  id: profile.id,
  name: profile.name || 'Unknown',
  age: calculateAge(profile.dob) || 'N/A',
  distance: formatDistance(profile),
  image: getImageSource(profile),
  description: profile.about || 'A verified Kikit member ready to connect.',
  sharedInterests: profile.shared_interests || [],
  reason: profile.discover_reason || 'A verified member to discover',
  originalData: profile,
});

const mergeProfilesById = (currentProfiles, nextProfiles) => {
  const ids = new Set(currentProfiles.map(profile => String(profile.id)));
  const merged = [...currentProfiles];
  nextProfiles.forEach(profile => {
    if (!ids.has(String(profile.id))) {
      ids.add(String(profile.id));
      merged.push(profile);
    }
  });
  return merged;
};

const getDiscoverProfileId = item => item?.originalData?.id || item?.id;

const DiscoverCard = ({ item, onView, onPass, onSpark, processing }) => {
  const sharedInterests = item.sharedInterests?.slice(0, 3) || [];
  const isVerified = item.originalData?.is_profile_verified === true;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.92} onPress={onView}>
      <View style={styles.cardImageWrap}>
        <FastImage
          source={item.image}
          style={styles.cardImage}
          resizeMode={FastImage.resizeMode.cover}
        />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardTitleWrap}>
            <Text ff="c-Bold" fs="XXL" color="grey800" style={styles.cardTitle} numberOfLines={1}>
              {item.name}, {item.age}
            </Text>
            {!!item.distance && (
              <View style={styles.distanceRow}>
                <LocationIcon width={12} height={12} fill={colors.grey400} />
                <Text ff="c-Regular" fs="XS" color="grey400" numberOfLines={1}>
                  {item.distance}
                </Text>
              </View>
            )}
          </View>
          {isVerified && (
            <VerificationIcon width={26} height={26} />
          )}
        </View>

        {/* <Text ff="c-Regular" fs="S" color="grey400" style={styles.description} numberOfLines={2}>
          {item.description}
        </Text> */}
        {sharedInterests.length > 0 && (
          <View style={styles.interestPillsRow}>
            <Text ff="c-Bold" fs="XXS" color="grey400" style={styles.inCommonLabel}>
              IN COMMON
            </Text>
            {sharedInterests.map((interest, idx) => (
              <View key={interest.id || idx} style={styles.interestPill}>
                <Text ff="c-Bold" fs="S" color="white" style={styles.interestPillText}>
                  {interest.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.iconButton, styles.passButton]}
            disabled={processing}
            onPress={onPass}>
            <Close width={18} height={18} stroke={colors.grey800} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.viewButton}
            disabled={processing}
            onPress={onView}>
            <Text ff="c-Bold" fs="S" color="grey800">View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sparkButton, processing && styles.disabledButton]}
            disabled={processing}
            onPress={onSpark}>
            {processing ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <HeartFilledIcon width={18} height={18} fill={colors.white} />
                <Text ff="c-Bold" fs="S" color="white">Send Spark</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const HomeScreen = ({ navigation }) => {
  const { userProfile, setUserProfile } = useKitkitStore();
  const filterSheetRef = useRef();
  const filterComponentRef = useRef();
  const [profiles, setProfiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedInterest, setSelectedInterest] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingDiscover, setIsLoadingDiscover] = useState(false);
  const [isLoadingMoreDiscover, setIsLoadingMoreDiscover] = useState(false);
  const [discoverOffset, setDiscoverOffset] = useState(0);
  const [hasMoreDiscover, setHasMoreDiscover] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [isFilterValid, setIsFilterValid] = useState(false);
  const [isSavingFilter, setIsSavingFilter] = useState(false);
  const [isResettingFilter, setIsResettingFilter] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [processingProfileId, setProcessingProfileId] = useState(null);
  const [sparkTarget, setSparkTarget] = useState(null);
  const [sparkAnswer, setSparkAnswer] = useState('');
  const [showMatch, setShowMatch] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);
  const [matchSparkContext, setMatchSparkContext] = useState(null);
  const seenProfileIdsRef = useRef(new Set());
  const discoverRequestRef = useRef(0);

  const discoverScopeKey = useMemo(
    () => `${selectedCategory?.id || 'for-you'}:${selectedInterest?.id || 'all'}`,
    [selectedCategory?.id, selectedInterest?.id],
  );

  const selectedPrompt = useMemo(() => {
    const seed = selectedInterest?.name || selectedCategory?.name || 'Kikit';
    return SPARK_PROMPTS[seed.length % SPARK_PROMPTS.length];
  }, [selectedCategory?.name, selectedInterest?.name]);

  const requireVerified = useCallback(() => {
    if (userProfile?.is_profile_verified === false) {
      setShowVerificationModal(true);
      return false;
    }
    return true;
  }, [userProfile?.is_profile_verified]);

  const markProfileSeen = useCallback(profileId => {
    if (profileId) {
      seenProfileIdsRef.current.add(String(profileId));
    }
  }, []);

  const fetchProfileIfNeeded = useCallback(async () => {
    if (userProfile) {
      return;
    }
    setIsLoadingProfile(true);
    try {
      const response = await userService.getMyProfile();
      const profileData = response?.data?.data;
      if (profileData) {
        setUserProfile(profileData);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to load profile',
        text2: error?.message || 'Please try again later',
      });
    } finally {
      setIsLoadingProfile(false);
    }
  }, [setUserProfile, userProfile]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await preferencesService.getInterests();
      setCategories(Array.isArray(response?.data) ? response.data : response?.data?.data || []);
    } catch (error) {
      console.log('Failed to load interest categories:', error);
      setCategories([]);
    }
  }, []);

  const fetchDiscover = useCallback(async ({
    offsetValue = 0,
    mode = 'replace',
    resetSeen = false,
  } = {}) => {
    const isAppending = mode === 'append';
    const requestId = discoverRequestRef.current + 1;
    discoverRequestRef.current = requestId;

    if (resetSeen) {
      seenProfileIdsRef.current = new Set();
      setProfiles([]);
      setDiscoverOffset(0);
      setHasMoreDiscover(false);
    }

    if (isAppending) {
      setIsLoadingMoreDiscover(true);
    } else {
      setIsLoadingDiscover(true);
    }

    try {
      const response = await matchesService.getDiscover({
        category_id: selectedCategory?.id,
        interest_id: selectedInterest?.id,
        limit: DISCOVER_PAGE_SIZE,
        offset: offsetValue,
      });

      if (requestId !== discoverRequestRef.current) {
        return;
      }

      const responseData = response?.data?.data || {};
      const discoverProfiles = responseData.profiles || [];
      const unseenProfiles = discoverProfiles.filter(
        profile => !seenProfileIdsRef.current.has(String(profile.id)),
      );
      const nextProfiles = unseenProfiles.map(buildDiscoverItem);

      setProfiles(prevProfiles =>
        isAppending ? mergeProfilesById(prevProfiles, nextProfiles) : nextProfiles,
      );
      setDiscoverOffset(offsetValue + discoverProfiles.length);
      setHasMoreDiscover(Boolean(responseData.has_more));
    } catch (error) {
      if (requestId !== discoverRequestRef.current) {
        return;
      }
      console.log('Failed to fetch discover profiles:', error);
      Toast.show({
        type: 'error',
        text1: 'Discover unavailable',
        text2: error?.response?.data?.message || 'Please try again.',
      });
      if (!isAppending) {
        setProfiles([]);
      }
    } finally {
      if (requestId === discoverRequestRef.current) {
        if (isAppending) {
          setIsLoadingMoreDiscover(false);
        } else {
          setIsLoadingDiscover(false);
        }
      }
    }
  }, [selectedCategory?.id, selectedInterest?.id]);

  const checkActiveFilters = useCallback(async () => {
    try {
      const response = await preferencesService.getPreferences();
      const preferences = response?.data?.data || response?.data;
      const active = preferences && Object.entries(preferences).some(([key, value]) => {
        if (['id', 'user', 'created_at', 'updated_at'].includes(key)) {
          return false;
        }
        if (value === null || value === undefined || value === '') {
          return false;
        }
        return !Array.isArray(value) || value.length > 0;
      });
      setHasActiveFilters(Boolean(active));
    } catch {
      setHasActiveFilters(false);
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await announcementService.getAnnouncements();
      const data = Array.isArray(response?.data)
        ? response.data
        : response?.data?.data || [];
      const messages = data.map(item => item.message).filter(Boolean);
      setAnnouncements(messages);
    } catch (error) {
      console.log('Failed to fetch announcements:', error);
    }
  }, []);

  const fetchNotificationCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      const count = response?.data?.data?.unread_count || response?.data?.unread_count || 0;
      setNotificationCount(count);
    } catch {
      setNotificationCount(0);
    }
  }, []);

  useEffect(() => {
    fetchProfileIfNeeded();
    fetchCategories();
  }, [fetchCategories, fetchProfileIfNeeded]);

  useEffect(() => {
    if (!isLoadingProfile) {
      fetchDiscover({ offsetValue: 0, mode: 'replace', resetSeen: true });
      checkActiveFilters();
    }
  }, [checkActiveFilters, discoverScopeKey, fetchDiscover, isLoadingProfile]);

  useFocusEffect(
    useCallback(() => {
      fetchAnnouncements();
      fetchNotificationCount();
    }, [fetchAnnouncements, fetchNotificationCount]),
  );

  useEffect(() => {
    const notificationListener = DeviceEventEmitter.addListener(
      'onNotificationReceived',
      () => setNotificationCount(prev => prev + 1),
    );
    const blockedListener = DeviceEventEmitter.addListener(
      'userBlocked',
      ({ userId, profileId }) => {
        markProfileSeen(profileId);
        setProfiles(prev =>
          prev.filter(item => {
            const cardUserId = item.originalData?.user?.id;
            const cardProfileId = item.originalData?.id || item.id;
            const shouldKeep =
              String(cardUserId) !== String(userId) &&
              String(cardProfileId) !== String(profileId);
            if (!shouldKeep) {
              markProfileSeen(cardProfileId);
            }
            return shouldKeep;
          }),
        );
      },
    );
    return () => {
      notificationListener.remove();
      blockedListener.remove();
    };
  }, [markProfileSeen]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDiscover({ offsetValue: 0, mode: 'replace' });
    setRefreshing(false);
  };

  const handleFilterPress = () => {
    if (!requireVerified()) {
      return;
    }
    filterSheetRef.current?.open();
    setTimeout(() => {
      if (filterComponentRef.current) {
        setIsFilterValid(filterComponentRef.current.isValid);
      }
    }, 100);
  };

  const handleSaveFilters = async () => {
    if (!filterComponentRef.current?.isValid) {
      return;
    }
    setIsSavingFilter(true);
    const saved = await filterComponentRef.current?.save();
    setIsSavingFilter(false);
    if (saved === false) {
      return;
    }
    filterSheetRef.current?.close();
    setHasActiveFilters(true);
    fetchDiscover({ offsetValue: 0, mode: 'replace', resetSeen: true });
  };

  const handleResetFilters = async () => {
    setIsResettingFilter(true);
    try {
      await preferencesService.deletePreferences();
      filterComponentRef.current?.reset();
      filterSheetRef.current?.close();
      setHasActiveFilters(false);
      fetchDiscover({ offsetValue: 0, mode: 'replace', resetSeen: true });
      Toast.show({ type: 'success', text1: 'Filters reset' });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Reset failed',
        text2: error?.response?.data?.message || 'Please try again.',
      });
    } finally {
      setIsResettingFilter(false);
    }
  };

  const handleView = item => {
    if (!requireVerified()) {
      return;
    }
    navigation.navigate('ProfileDetail', { item });
  };

  const handlePass = async item => {
    if (!requireVerified()) {
      return;
    }
    const profileId = getDiscoverProfileId(item);
    setProcessingProfileId(profileId);
    try {
      await matchesService.unlikeProfile(profileId);
      markProfileSeen(profileId);
      setProfiles(prev => prev.filter(profile => profile.id !== item.id));
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Could not pass',
        text2: error?.response?.data?.message || 'Please try again.',
      });
    } finally {
      setProcessingProfileId(null);
    }
  };

  const openSparkComposer = item => {
    if (!requireVerified()) {
      return;
    }
    setSparkTarget(item);
    setSparkAnswer('');
  };

  const sendSpark = async () => {
    if (!sparkTarget || !sparkAnswer.trim()) {
      Toast.show({ type: 'error', text1: 'Add a short Spark first' });
      return;
    }
    const profileId = getDiscoverProfileId(sparkTarget);
    setProcessingProfileId(profileId);
    try {
      const sparkInterestId =
        selectedInterest?.id ||
        (!selectedCategory ? sparkTarget.sharedInterests?.[0]?.id : undefined);
      const response = await matchesService.sendSpark(profileId, {
        spark_interest_id: sparkInterestId,
        spark_category_id: selectedCategory?.id,
        spark_question: selectedPrompt,
        spark_answer: sparkAnswer.trim(),
        spark_created_from: 'discover',
      });
      markProfileSeen(profileId);
      setProfiles(prev => prev.filter(profile => profile.id !== sparkTarget.id));
      const responseData = response?.data?.data;
      if (responseData?.is_matched) {
        setMatchedUser(sparkTarget);
        setMatchSparkContext(responseData?.match?.spark_context || null);
        setShowMatch(true);
      } else {
        Toast.show({
          type: 'success',
          text1: 'Spark sent',
          text2: `${sparkTarget.name} will see it in Sparks.`,
        });
      }
      setSparkTarget(null);
      setSparkAnswer('');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Spark failed',
        text2: error?.response?.data?.message || 'Please try again.',
      });
    } finally {
      setProcessingProfileId(null);
    }
  };

  const handleLoadMoreDiscover = useCallback(() => {
    if (!hasMoreDiscover || isLoadingDiscover || isLoadingMoreDiscover) {
      return;
    }
    fetchDiscover({ offsetValue: discoverOffset, mode: 'append' });
  }, [
    discoverOffset,
    fetchDiscover,
    hasMoreDiscover,
    isLoadingDiscover,
    isLoadingMoreDiscover,
  ]);

  const renderCategoryRail = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryRailScroll}
      contentContainerStyle={styles.categoryRail}>
      <TouchableOpacity
        style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
        onPress={() => {
          setSelectedCategory(null);
          setSelectedInterest(null);
        }}>
        <Text ff="c-Bold" fs="S" color={!selectedCategory ? 'white' : 'grey800'}>
          For You
        </Text>
      </TouchableOpacity>
      {categories.map(category => (
        <TouchableOpacity
          key={category.id}
          style={[styles.categoryChip, selectedCategory?.id === category.id && styles.categoryChipActive]}
          onPress={() => {
            setSelectedCategory(category);
            setSelectedInterest(null);
          }}>
          <Text
            ff="c-Bold"
            fs="S"
            color={selectedCategory?.id === category.id ? 'white' : 'grey800'}>
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const activeInterests = selectedCategory?.interests || [];

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Community"
        subTitle="Find verified members who share your interests."
        onFilterPress={handleFilterPress}
        onCoinPress={() => requireVerified()}
        onBellPress={() => requireVerified() && navigation.navigate('Notifications')}
        coinCount={userProfile?.user?.coin_balance}
        notificationCount={notificationCount}
        hasActiveFilters={hasActiveFilters}
      />
      <RotatingBanner newsItems={announcements} />
      {renderCategoryRail()}

      {activeInterests.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.interestRailScroll}
          contentContainerStyle={styles.interestRail}>
          {activeInterests.map(interest => (
            <TouchableOpacity
              key={interest.id}
              style={[
                styles.interestChip,
                selectedInterest?.id === interest.id && styles.interestChipActive,
              ]}
              onPress={() =>
                setSelectedInterest(prev => (prev?.id === interest.id ? null : interest))
              }>
              <Text
                ff="c-Regular"
                fs="XS"
                color={selectedInterest?.id === interest.id ? 'white' : 'grey800'}>
                {interest.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.sectionHeader}>
        <Text ff="c-Bold" fs="XXL" color="grey800">Start with a Spark</Text>
        <Text ff="c-Regular" fs="S" color="grey400">
          Browse verified people by shared interests and open with context.
        </Text>
      </View>

      {isLoadingProfile || isLoadingDiscover ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.secondary} size="large" />
          <Text ff="c-Regular" fs="S" color="grey400" style={styles.loadingText}>
            Finding people to discover...
          </Text>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <DiscoverCard
              item={item}
              onView={() => handleView(item)}
              onPass={() => handlePass(item)}
              onSpark={() => openSparkComposer(item)}
              processing={processingProfileId === getDiscoverProfileId(item)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            profiles.length === 0 && styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={handleLoadMoreDiscover}
          onEndReachedThreshold={0.45}
          ListFooterComponent={
            isLoadingMoreDiscover ? (
              <View style={styles.listFooter}>
                <ActivityIndicator color={colors.secondary} size="small" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ThreeHearts width={76} height={76} fill={colors.secondary} />
              <Text ff="c-Bold" fs="XXL" color="grey800" style={styles.emptyTitle}>
                No one here yet
              </Text>
              <Text ff="c-Regular" fs="S" color="grey400" style={styles.emptyText}>
                Try another interest or adjust your filters to discover more people.
              </Text>
            </View>
          }
        />
      )}

      <FadeModal
        refRBSheet={filterSheetRef}
        height={moderateScale(760)}
        header
        headerTitle="Filter"
        isButtonAdded
        dualButton
        dualButton1Text="Reset All"
        dualButton2Text="Save"
        dualButton1Press={handleResetFilters}
        dualButton2Press={handleSaveFilters}
        dualButton1Disabled={isResettingFilter}
        dualButton1Loading={isResettingFilter}
        dualButton2Disabled={!isFilterValid}
        dualButton2Loading={isSavingFilter}
        closeOnDragDown
        closeOnPressMask>
        <FilterSheet ref={filterComponentRef} onValidityChange={setIsFilterValid} />
      </FadeModal>

      <VerificationModal
        visible={showVerificationModal}
        onPrimaryPress={() => {
          setShowVerificationModal(false);
          navigation.navigate('ProfileVerification');
        }}
        title="Get Verified"
        description="Verify your profile with a quick selfie before discovering and connecting with people."
        primaryButtonText="Verify Now"
      />

      <Modal visible={!!sparkTarget} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalDismissArea} />
          </TouchableWithoutFeedback>
          <View style={styles.sparkModal}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}>
              <Text ff="c-Bold" fs="XXL" color="grey800">Send a Spark</Text>
              <Text ff="c-Regular" fs="S" color="grey400" style={styles.modalSubcopy}>
                Start with something real from a shared interest.
              </Text>
              <View style={styles.promptBox}>
                <Text ff="c-Bold" fs="S" color="secondary">Prompt</Text>
                <Text ff="c-Regular" fs="M" color="grey800" style={styles.promptText}>
                  {selectedPrompt}
                </Text>
              </View>
              <TextInput
                value={sparkAnswer}
                onChangeText={text => setSparkAnswer(text.slice(0, 280))}
                placeholder="Write a short, friendly answer..."
                placeholderTextColor={colors.grey300}
                multiline
                style={styles.sparkInput}
                maxLength={280}
              />
              <Text ff="c-Regular" fs="XS" color="grey400" style={styles.counter}>
                {sparkAnswer.length}/280
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    Keyboard.dismiss();
                    setSparkTarget(null);
                  }}>
                  <Text ff="c-Bold" fs="S" color="grey800">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sendButton, !sparkAnswer.trim() && styles.disabledButton]}
                  disabled={!sparkAnswer.trim() || !!processingProfileId}
                  onPress={sendSpark}>
                  <Text ff="c-Bold" fs="S" color="white">Send Spark</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ItsAMatch
        visible={showMatch}
        currentUserImage={
          getPrimaryPhoto(userProfile?.photos)?.url
            ? { uri: getPrimaryPhoto(userProfile?.photos).url }
            : require('../../assets/images/image-placegolder.png')
        }
        matchedUserImage={matchedUser?.image}
        matchedUserName={matchedUser?.name}
        sparkContext={matchSparkContext}
        onStartChatting={() => {
          setShowMatch(false);
          setMatchedUser(null);
          setMatchSparkContext(null);
          navigation.navigate('chat');
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
  },
  categoryRailScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  categoryRail: {
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(10),
    gap: moderateScale(10),
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(9),
    borderRadius: moderateScale(22),
    backgroundColor: colors.white,
  },
  categoryChipActive: {
    backgroundColor: colors.secondary,
  },
  interestRailScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  interestRail: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(8),
    gap: moderateScale(8),
    alignItems: 'center',
  },
  interestChip: {
    paddingHorizontal: moderateScale(13),
    paddingVertical: moderateScale(7),
    borderRadius: moderateScale(18),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grey100,
  },
  interestChipActive: {
    backgroundColor: colors.grey800,
    borderColor: colors.grey800,
  },
  sectionHeader: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
  },
  listContent: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(28),
    gap: moderateScale(16),
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    shadowColor: colors.grey800,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  cardImageWrap: {
    height: moderateScale(270),
    backgroundColor: colors.grey100,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardBody: {
    padding: moderateScale(14),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: moderateScale(10),
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    marginBottom: moderateScale(4),
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
  },
  description: {
    marginTop: moderateScale(6),
    lineHeight: moderateScale(19),
  },
  interestLine: {
    marginTop: moderateScale(10),
  },
  interestPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: moderateScale(6),
    marginTop: moderateScale(12),
  },
  inCommonLabel: {
    letterSpacing: 0.6,
    marginRight: moderateScale(2),
  },
  interestPill: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(20),
    backgroundColor: colors.grey500,
  },
  interestPillText: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    marginTop: moderateScale(14),
  },
  iconButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  passButton: {
    backgroundColor: colors.grey50,
  },
  viewButton: {
    height: moderateScale(44),
    paddingHorizontal: moderateScale(18),
    borderRadius: moderateScale(22),
    backgroundColor: colors.grey50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkButton: {
    flex: 1,
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
  },
  disabledButton: {
    opacity: 0.55,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: moderateScale(12),
  },
  emptyListContent: {
    flexGrow: 1,
  },
  listFooter: {
    paddingVertical: moderateScale(18),
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(24),
  },
  emptyTitle: {
    marginTop: moderateScale(18),
    textAlign: 'center',
  },
  emptyText: {
    marginTop: moderateScale(8),
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  sparkModal: {
    backgroundColor: colors.white,
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(22),
    paddingBottom: moderateScale(28),
    borderTopLeftRadius: moderateScale(8),
    borderTopRightRadius: moderateScale(8),
  },
  modalSubcopy: {
    marginTop: moderateScale(6),
    marginBottom: moderateScale(16),
  },
  promptBox: {
    backgroundColor: colors.grey50,
    borderRadius: moderateScale(8),
    padding: moderateScale(14),
  },
  promptText: {
    marginTop: moderateScale(5),
    lineHeight: moderateScale(21),
  },
  sparkInput: {
    minHeight: moderateScale(120),
    marginTop: moderateScale(14),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: colors.grey100,
    borderRadius: moderateScale(8),
    color: colors.grey800,
    textAlignVertical: 'top',
  },
  counter: {
    alignSelf: 'flex-end',
    marginTop: moderateScale(6),
  },
  modalActions: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginTop: moderateScale(18),
  },
  cancelButton: {
    flex: 1,
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.grey50,
  },
  sendButton: {
    flex: 1,
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
  },
});

export default HomeScreen;
