import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
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
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Toast from 'react-native-toast-message';

import {Text} from '../../components/base/Text';
import VerificationModal from '../../components/base/VerificationModal';
import {Bell, ThreeDots, VerificationIcon, VideoIcon} from '../../assets/icons';
import {liveRoomsService} from '../../api/services/liveRoomsService';
import {notificationService} from '../../api/services/notificationService';
import {preferencesService} from '../../api/services/preferencesService';
import {useKitkitStore} from '../../store/kitkitStore';
import {colors, moderateScale} from '../../theme';

const PAGE_SIZE = 20;
const FALLBACK_CATEGORIES = [
  {id: 'music', name: 'Music'},
  {id: 'travel', name: 'Travel'},
  {id: 'fitness', name: 'Fitness'},
  {id: 'business', name: 'Business'},
  {id: 'food', name: 'Food'},
  {id: 'gaming', name: 'Gaming'},
];

const CATEGORY_COLORS = {
  music: '#7C3AED',
  travel: '#0891B2',
  fitness: '#059669',
  business: '#111827',
  food: '#EA580C',
  gaming: '#9333EA',
  sports: '#2563EB',
  default: '#374151',
};

const getCategoryColor = room => {
  const key = (room?.category_name || '').toLowerCase();
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.default;
};

const getRoomImage = room => {
  // Use a neutral placeholder — profile photos often contain caption text baked in.
  return require('../../assets/images/image-placegolder.png');
};

const formatViewerCount = count => {
  const value = Number(count) || 0;
  return `${value} viewer${value === 1 ? '' : 's'}`;
};

const formatGiftCount = count => {
  const value = Number(count) || 0;
  return `${value} gift${value === 1 ? '' : 's'}`;
};

const isUuid = value =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const statusLabel = room => {
  if (room.status === 'live') {
    return 'LIVE';
  }
  return 'SOON';
};

const RoomCard = ({room, featured, onJoin, onMenu}) => {
  const isLive = room.status === 'live';
  const categoryColor = getCategoryColor(room);
  return (
    <TouchableOpacity
      activeOpacity={0.92}
      style={[styles.roomCard, featured && styles.featuredCard]}
      onPress={() => onJoin(room)}>
      <View style={styles.roomMedia}>
        <View style={[styles.roomImageFallback, {backgroundColor: categoryColor}]}>
          <FastImage
            source={getRoomImage(room)}
            style={styles.roomImage}
            resizeMode={FastImage.resizeMode.cover}
          />
        </View>
        <View style={[styles.statusBadge, isLive ? styles.liveBadge : styles.soonBadge]}>
          <Text ff="c-Bold" fs="XXS" color="white">
            {statusLabel(room)}
          </Text>
        </View>
        <TouchableOpacity style={styles.menuButton} onPress={() => onMenu(room)}>
          <ThreeDots width={18} height={18} fill={colors.white} />
        </TouchableOpacity>
      </View>
      <View style={styles.roomBody}>
        <View style={styles.roomTitleRow}>
          <View style={styles.roomTitleWrap}>
            <Text ff="c-Bold" fs={featured ? 'XXL' : 'L'} color="grey800" numberOfLines={1}>
              {room.title}
            </Text>
            <View style={styles.hostRow}>
              <Text ff="c-Regular" fs="XS" color="grey400" numberOfLines={1}>
                Hosted by {room.host_name || 'Verified host'}
              </Text>
              {room.host_verified && <VerificationIcon width={16} height={16} />}
            </View>
          </View>
          <View style={styles.categoryPill}>
            <Text ff="c-Bold" fs="XXS" color="grey800" numberOfLines={1}>
              {room.category_name || 'Community'}
            </Text>
          </View>
        </View>
        {!!room.description && (
          <Text ff="c-Regular" fs="S" color="grey400" style={styles.roomDescription} numberOfLines={2}>
            {room.description}
          </Text>
        )}
        <View style={styles.roomStatsRow}>
          <Text ff="c-Regular" fs="XS" color="grey500">
            {formatViewerCount(room.viewer_count)}
          </Text>
          <Text ff="c-Regular" fs="XS" color="grey500">
            {formatGiftCount(room.gift_count)}
          </Text>
          <TouchableOpacity
            style={[styles.joinButton, !isLive && styles.scheduleButton]}
            onPress={() => onJoin(room)}>
            <Text ff="c-Bold" fs="S" color={isLive ? 'white' : 'grey800'}>
              {isLive ? 'Join' : 'View'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const LiveRoomsScreen = ({navigation}) => {
  const {userProfile} = useKitkitStore();
  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [createCategory, setCreateCategory] = useState(null);

  const isVerified = userProfile?.is_profile_verified === true;
  const liveRooms = useMemo(() => rooms.filter(room => room.status === 'live'), [rooms]);
  const upcomingRooms = useMemo(() => rooms.filter(room => room.status !== 'live'), [rooms]);
  const featuredLiveRoom = liveRooms[0] || null;
  const listRooms = useMemo(() => {
    const additionalLive = featuredLiveRoom ? liveRooms.slice(1) : liveRooms;
    return [...additionalLive, ...upcomingRooms];
  }, [featuredLiveRoom, liveRooms, upcomingRooms]);

  const requireVerified = useCallback(() => {
    if (!isVerified) {
      setShowVerificationModal(true);
      return false;
    }
    return true;
  }, [isVerified]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await preferencesService.getInterests();
      const data = Array.isArray(response?.data)
        ? response.data
        : response?.data?.data || [];
      setCategories(data.length ? data : FALLBACK_CATEGORIES);
    } catch {
      setCategories(FALLBACK_CATEGORIES);
    }
  }, []);

  const fetchRooms = useCallback(async (refreshing = false) => {
    if (!isVerified) {
      setRooms([]);
      setIsLoading(false);
      return;
    }
    refreshing ? setIsRefreshing(true) : setIsLoading(true);
    try {
      const response = await liveRoomsService.getRooms({
        ...(isUuid(selectedCategory?.id) ? {category_id: selectedCategory.id} : {}),
        limit: PAGE_SIZE,
        offset: 0,
      });
      const roomData = response?.data?.data?.rooms || [];
      setRooms(roomData);
    } catch (error) {
      setRooms([]);
      Toast.show({
        type: 'error',
        text1: 'Live rooms unavailable',
        text2: error?.message || 'Please try again in a moment.',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isVerified, selectedCategory?.id]);

  const fetchNotificationCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setNotificationCount(
        response?.data?.data?.unread_count || response?.data?.unread_count || 0,
      );
    } catch {
      setNotificationCount(0);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchNotificationCount();
  }, [fetchCategories, fetchNotificationCount]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleJoin = async room => {
    if (!requireVerified()) {
      return;
    }
    try {
      const response = room.status === 'live'
        ? await liveRoomsService.joinRoom(room.id)
        : await liveRoomsService.startRoom(room.id);
      navigation.navigate('LiveRoom', {room: response?.data?.data || room});
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Could not open room',
        text2: error?.message || 'Please try again.',
      });
    }
  };

  const handleCreateRoom = async () => {
    if (!title.trim()) {
      Toast.show({type: 'error', text1: 'Add a room title'});
      return;
    }
    if (!requireVerified()) {
      return;
    }
    try {
      setIsCreating(true);
      const response = await liveRoomsService.createRoom({
        title: title.trim(),
        description: description.trim(),
        ...(isUuid(createCategory?.id) ? {category_id: createCategory.id} : {}),
        start_now: true,
      });
      const room = response?.data?.data;
      setShowCreate(false);
      setTitle('');
      setDescription('');
      setCreateCategory(null);
      await fetchRooms(true);
      navigation.navigate('LiveRoom', {room});
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Could not start room',
        text2: error?.message || 'Please try again.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const renderCategoryRail = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryRail}>
      <TouchableOpacity
        style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
        onPress={() => setSelectedCategory(null)}>
        <Text ff="c-Bold" fs="S" color={!selectedCategory ? 'white' : 'grey800'}>
          For You
        </Text>
      </TouchableOpacity>
      {categories.map(category => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryChip,
            selectedCategory?.id === category.id && styles.categoryChipActive,
          ]}
          onPress={() => setSelectedCategory(category)}>
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

  if (!isVerified) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.lockedHero}>
          <View style={styles.liveMark}>
            <VideoIcon width={34} height={34} fill={colors.white} />
          </View>
          <Text ff="c-Bold" fs="XXXL" color="grey800" style={styles.lockedTitle}>
            Verified Live Rooms
          </Text>
          <Text ff="c-Regular" fs="M" color="grey400" style={styles.lockedCopy}>
            Kikit live rooms are open to verified members only. Complete a quick selfie check before joining community conversations.
          </Text>
          <TouchableOpacity
            style={styles.primaryCta}
            onPress={() => navigation.navigate('ProfileVerification')}>
            <Text ff="c-Bold" fs="M" color="white">Verify Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text ff="c-Bold" fs="XXXL" color="grey800">Verified Live Rooms</Text>
          <Text ff="c-Regular" fs="S" color="grey400" style={styles.headerSubcopy}>
            Join live conversations through shared interests.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notifications')}>
          <Bell />
          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text ff="c-Bold" fs="XXS" color="white">
                {notificationCount > 9 ? '9+' : notificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.heroBand}>
        <View style={styles.heroCopy}>
          <Text ff="c-Bold" fs="XXL" color="white">Interest-based conversations</Text>
          <Text ff="c-Regular" fs="S" color="white" style={styles.heroText}>
            Meet verified members in public live rooms and support hosts with gifts.
          </Text>
        </View>
        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.heroPrimary} onPress={() => setShowCreate(true)}>
            <Text ff="c-Bold" fs="S" color="grey800">Start Room</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroSecondary} onPress={() => fetchRooms(true)}>
            <Text ff="c-Bold" fs="S" color="white">Browse Rooms</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.secondary} size="large" />
          <Text ff="c-Regular" fs="S" color="grey400" style={styles.loadingText}>
            Loading live rooms...
          </Text>
        </View>
      ) : (
        <FlatList
          data={listRooms}
          keyExtractor={item => item.id.toString()}
          style={styles.roomList}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchRooms(true)} />
          }
          ListHeaderComponent={
            <>
              {renderCategoryRail()}
              {featuredLiveRoom && (
                <View style={styles.sectionBlock}>
                  <Text ff="c-Bold" fs="XL" color="grey800" style={styles.sectionHeading}>
                    Live Now
                  </Text>
                  <RoomCard
                    room={featuredLiveRoom}
                    featured
                    onJoin={handleJoin}
                    onMenu={() => Toast.show({type: 'info', text1: 'Report or block anytime inside a room'})}
                  />
                </View>
              )}
              {upcomingRooms.length > 0 && (
                <Text ff="c-Bold" fs="XL" color="grey800" style={styles.sectionTitle}>
                  Starting Soon
                </Text>
              )}
            </>
          }
          renderItem={({item}) => (
            <RoomCard
              room={item}
              onJoin={handleJoin}
              onMenu={() => Toast.show({type: 'info', text1: 'Report or block anytime inside a room'})}
            />
          )}
          ListFooterComponent={
            <View style={styles.footerBlock}>
              <Text ff="c-Bold" fs="XL" color="grey800">Explore by Interest</Text>
              <Text ff="c-Regular" fs="S" color="grey400" style={styles.footerCopy}>
                Choose a topic above to find verified rooms around music, travel, fitness, business, food, and more.
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text ff="c-Bold" fs="XXL" color="grey800">No rooms live right now</Text>
              <Text ff="c-Regular" fs="S" color="grey400" style={styles.emptyCopy}>
                Start one or check upcoming rooms.
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal visible={showCreate} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.createSheet}>
            <Text ff="c-Bold" fs="XXL" color="grey800">Create Room</Text>
            <Text ff="c-Regular" fs="S" color="grey400" style={styles.createHelp}>
              Rooms are public to verified Kikit members.
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Room title"
              placeholderTextColor={colors.grey300}
              style={styles.input}
              maxLength={120}
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Short description"
              placeholderTextColor={colors.grey300}
              style={[styles.input, styles.textArea]}
              multiline
              maxLength={500}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.createCategories}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.createCategoryChip,
                    createCategory?.id === category.id && styles.createCategoryChipActive,
                  ]}
                  onPress={() => setCreateCategory(category)}>
                  <Text
                    ff="c-Bold"
                    fs="S"
                    color={createCategory?.id === category.id ? 'white' : 'grey800'}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCreate(false)}
                disabled={isCreating}>
                <Text ff="c-Bold" fs="S" color="grey800">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.goLiveButton, (!title.trim() || isCreating) && styles.disabledButton]}
                onPress={handleCreateRoom}
                disabled={!title.trim() || isCreating}>
                {isCreating ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text ff="c-Bold" fs="S" color="white">Go Live</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <VerificationModal
        visible={showVerificationModal}
        title="Verified Members Only"
        description="Complete a quick selfie verification before joining live rooms."
        primaryButtonText="Verify Now"
        onPrimaryPress={() => {
          setShowVerificationModal(false);
          navigation.navigate('ProfileVerification');
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F7F8FA'},
  header: {
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSubcopy: {marginTop: moderateScale(4)},
  notificationButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBand: {
    marginHorizontal: moderateScale(20),
    borderRadius: moderateScale(8),
    backgroundColor: '#111827',
    padding: moderateScale(18),
  },
  heroCopy: {maxWidth: '92%'},
  heroText: {marginTop: moderateScale(6), opacity: 0.82, lineHeight: moderateScale(20)},
  heroActions: {flexDirection: 'row', gap: moderateScale(10), marginTop: moderateScale(18)},
  heroPrimary: {
    height: moderateScale(42),
    paddingHorizontal: moderateScale(18),
    borderRadius: moderateScale(21),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSecondary: {
    height: moderateScale(42),
    paddingHorizontal: moderateScale(18),
    borderRadius: moderateScale(21),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryRail: {
    paddingTop: moderateScale(4),
    paddingBottom: moderateScale(12),
    gap: moderateScale(10),
  },
  categoryChip: {
    paddingHorizontal: moderateScale(15),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipActive: {backgroundColor: '#111827'},
  roomList: {flex: 1},
  listContent: {paddingHorizontal: moderateScale(20), paddingBottom: moderateScale(28), paddingTop: moderateScale(4)},
  sectionBlock: {marginBottom: moderateScale(18), zIndex: 1},
  sectionHeading: {marginBottom: moderateScale(10)},
  sectionTitle: {marginBottom: moderateScale(10), marginTop: moderateScale(4)},
  roomCard: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(14),
    overflow: 'hidden',
    shadowColor: '#111827',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  featuredCard: {marginTop: moderateScale(4)},
  roomMedia: {
    height: moderateScale(150),
    backgroundColor: colors.grey100,
    overflow: 'hidden',
    position: 'relative',
  },
  roomImageFallback: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.92,
  },
  roomImage: {
    width: '100%',
    height: '100%',
    opacity: 0.35,
  },
  statusBadge: {
    position: 'absolute',
    left: moderateScale(12),
    top: moderateScale(12),
    paddingHorizontal: moderateScale(10),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  liveBadge: {backgroundColor: colors.danger},
  soonBadge: {backgroundColor: '#111827'},
  menuButton: {
    position: 'absolute',
    right: moderateScale(10),
    top: moderateScale(10),
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    backgroundColor: 'rgba(17,24,39,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  roomBody: {padding: moderateScale(14)},
  roomTitleRow: {flexDirection: 'row', gap: moderateScale(10), alignItems: 'flex-start'},
  roomTitleWrap: {flex: 1},
  hostRow: {flexDirection: 'row', alignItems: 'center', gap: moderateScale(4), marginTop: moderateScale(4)},
  categoryPill: {
    paddingHorizontal: moderateScale(10),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    backgroundColor: colors.grey50,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: moderateScale(110),
  },
  roomDescription: {marginTop: moderateScale(10), lineHeight: moderateScale(19)},
  roomStatsRow: {flexDirection: 'row', alignItems: 'center', gap: moderateScale(14), marginTop: moderateScale(14)},
  joinButton: {
    marginLeft: 'auto',
    height: moderateScale(36),
    minWidth: moderateScale(78),
    borderRadius: moderateScale(18),
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleButton: {backgroundColor: colors.grey50},
  footerBlock: {
    marginTop: moderateScale(6),
    padding: moderateScale(16),
    borderRadius: moderateScale(8),
    backgroundColor: colors.white,
  },
  footerCopy: {marginTop: moderateScale(6), lineHeight: moderateScale(19)},
  emptyState: {
    padding: moderateScale(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCopy: {marginTop: moderateScale(8), textAlign: 'center'},
  loadingState: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  loadingText: {marginTop: moderateScale(10)},
  modalBackdrop: {flex: 1, backgroundColor: 'rgba(17,24,39,0.45)', justifyContent: 'flex-end'},
  createSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: moderateScale(8),
    borderTopRightRadius: moderateScale(8),
    padding: moderateScale(20),
  },
  createHelp: {marginTop: moderateScale(6), marginBottom: moderateScale(14)},
  input: {
    minHeight: moderateScale(48),
    borderWidth: 1,
    borderColor: colors.grey100,
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(14),
    color: colors.grey800,
    marginBottom: moderateScale(12),
  },
  textArea: {height: moderateScale(92), paddingTop: moderateScale(12), textAlignVertical: 'top'},
  createCategories: {gap: moderateScale(8), paddingBottom: moderateScale(16)},
  createCategoryChip: {
    paddingHorizontal: moderateScale(14),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: colors.grey50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createCategoryChipActive: {backgroundColor: '#111827'},
  modalActions: {flexDirection: 'row', gap: moderateScale(10)},
  cancelButton: {
    flex: 1,
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: colors.grey50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goLiveButton: {
    flex: 1,
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {opacity: 0.55},
  lockedHero: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: moderateScale(28)},
  liveMark: {
    width: moderateScale(76),
    height: moderateScale(76),
    borderRadius: moderateScale(38),
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(18),
  },
  lockedTitle: {textAlign: 'center'},
  lockedCopy: {textAlign: 'center', marginTop: moderateScale(10), lineHeight: moderateScale(21)},
  primaryCta: {
    marginTop: moderateScale(22),
    height: moderateScale(48),
    paddingHorizontal: moderateScale(28),
    borderRadius: moderateScale(24),
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LiveRoomsScreen;
