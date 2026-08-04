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
  Platform,
  Modal,
} from 'react-native';
import {colors, moderateScale} from '../../theme';
import {Text} from '../../components/base/Text';
import {
  ArrowBack,
  ThreeHearts,
  HeartFilledIcon,
  User,
  GiftIcon,
  CheckDouble,
} from '../../assets/icons';
import {notificationService} from '../../api/services/notificationService';
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

// Helper function to format timestamp
const formatTimestamp = timestamp => {
  if (!timestamp) return '';

  const now = new Date();
  const notificationDate = new Date(timestamp);
  const diffInMs = now - notificationDate;
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return notificationDate.toLocaleDateString();
};

// Helper function to get notification icon based on type
const getNotificationIcon = (notificationType, profilePhoto) => {
  // If there's a profile photo, use it
  if (profilePhoto) {
    return {type: 'photo', source: {uri: profilePhoto}};
  }

  // Otherwise, return icon based on notification type
  switch (notificationType) {
    case 'profile_like':
    case 'match':
      return {type: 'icon', component: HeartFilledIcon, color: colors.secondary};
    case 'new_profiles':
      return {type: 'icon', component: User, color: colors.primary};
    case 'gift':
    case 'gift_received':
      return {type: 'icon', component: GiftIcon, color: colors.secondary};
    default:
      return {type: 'icon', component: ThreeHearts, color: colors.secondary};
  }
};

const NotificationsScreen = ({navigation}) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);

  // Animation values for empty state
  const emptyStateScale = useSharedValue(1);
  const emptyStateOpacity = useSharedValue(1);
  const iconPulse = useSharedValue(1);
  const cardScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);

  // Fetch notifications
  const fetchNotifications = async (isRefreshing = false) => {
    if (!isRefreshing) {
      setIsLoading(true);
    }

    try {
      const response = await notificationService.getNotifications();
      const notificationsData =
        response?.data?.data?.notifications || response?.data?.notifications || [];
      setNotifications(notificationsData);

      // Animate empty state if no notifications
      if (notificationsData.length === 0) {
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
      console.error('Failed to fetch notifications:', error);
      Toast.show({
        type: 'error',
        text2: 'Failed to load notifications',
        text1:
          error?.response?.data?.message ||
          error?.message ||
          'Please try again later',
      });
      setNotifications([]);
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
    await fetchNotifications(true);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Handle marking a single notification as read
  const handleMarkAsRead = async (notificationId, isRead) => {
    if (isRead) return; // Already read, no need to mark again

    try {
      await notificationService.markAsRead(notificationId);

      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notif =>
          notif.id === notificationId ? {...notif, is_read: true} : notif,
        ),
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    setMarkingAllAsRead(true);
    setMenuVisible(false);

    try {
      await notificationService.markAllAsRead();

      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notif => ({...notif, is_read: true})),
      );

      Toast.show({
        type: 'success',
        text2: 'Success',
        text1: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      Toast.show({
        type: 'error',
        text2: 'Error',
        text1:
          error?.response?.data?.message ||
          error?.message ||
          'Failed to mark all as read',
      });
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  // Handle notification press
  const handleNotificationPress = async notification => {
    // Mark as read
    await handleMarkAsRead(notification.id, notification.is_read);

    const {data, notification_type} = notification;

    // Gift received — navigate to sender's profile
    if (
      notification_type === 'gift_received' ||
      notification_type === 'gift'
    ) {
      console.log('Notification data:', data);
      if (data?.sender_id) {
        const item = {
          fromChatPage:true,
          id: data.sender_id,
          name: data.sender_name || 'Unknown',
          age: 'N/A',
          distance: '',
          location: '',
          image: data.sender_photo ? {uri: data.sender_photo} : null,
          description: '',
          interests: [],
          hobbies: [],
          originalData: {
            id: data.sender_id,
            user_id: data.sender_id,
          },
        };
        navigation.navigate('ProfileDetail', {item});
      }
      return;
    }

    // Navigate to ProfileDetail if the notification has profile data
    if (data?.from_profile_id) {
      const item = {
        id: data.from_profile_id,
        name: data.from_profile_name || 'Unknown',
        age: 'N/A',
        distance: '',
        location: '',
        image: data.from_profile_photo ? {uri: data.from_profile_photo} : null,
        description: '',
        interests: [],
        hobbies: [],
        originalData: {
          id: data.from_profile_id,
          user_id: data.from_user_id,
        },
      };
      navigation.navigate('ProfileDetail', {item});
    }
  };

  const renderShimmerItem = () => (
    <View style={styles.shimmerCard}>
      <ShimmerPlaceholder
        style={styles.shimmerIcon}
        shimmerColors={SHIMMER_COLORS}
      />
      <View style={styles.shimmerContent}>
        <ShimmerPlaceholder
          style={styles.shimmerTitle}
          shimmerColors={SHIMMER_COLORS}
        />
        <ShimmerPlaceholder
          style={styles.shimmerBody}
          shimmerColors={SHIMMER_COLORS}
        />
      </View>
    </View>
  );

  const renderEmptyState = () => {
    return (
      <View style={styles.emptyContainer}>
        <Animated.View style={[styles.emptyStateCard, cardAnimatedStyle]}>
          {/* Card Header with Gradient Background */}
          <View style={styles.emptyCardHeader}>
            <LinearGradient
              colors={[
                colors.secondary || '#FF4D8C',
                colors.primary || '#4D9FFF',
              ]}
              style={styles.emptyCardGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
            />
            <Animated.View
              style={[styles.emptyCardIconContainer, iconAnimatedStyle]}>
              <ThreeHearts width={80} height={80} fill={colors.white} />
            </Animated.View>
          </View>

          {/* Card Content */}
          <Animated.View
            style={[styles.emptyCardContent, emptyStateAnimatedStyle]}>
            <Text
              ff="c-Regular"
              fs="XXL"
              color="grey800"
              style={styles.emptyStateTitle}>
              No Notifications
            </Text>
            <Text
              ff="c-Regular"
              fs="M"
              color="grey400"
              style={styles.emptyStateSubtitle}>
              You don't have any notifications yet.{'\n'}
              When something happens, you'll see it here!
            </Text>
          </Animated.View>
        </Animated.View>
      </View>
    );
  };

  const renderNotificationItem = ({item, index}) => {
    const profilePhoto =
      item.data?.sender_photo || item.data?.from_profile_photo;
    const iconData = getNotificationIcon(item.notification_type, profilePhoto);
    const timestamp = formatTimestamp(item.created_at || item.timestamp);

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100)
          .duration(500)
          .springify()}>
        <TouchableOpacity
          style={[
            styles.notificationCard,
            !item.is_read && styles.notificationCardUnread,
          ]}
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.7}>
          {/* Icon or Avatar */}
          <View style={styles.iconContainer}>
            {iconData.type === 'photo' ? (
              <FastImage
                source={iconData.source}
                style={styles.avatar}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : (
              <View
                style={[
                  styles.iconBackground,
                  {backgroundColor: `${iconData.color}15`},
                ]}>
                {React.createElement(iconData.component, {
                  width: 24,
                  height: 24,
                  fill: iconData.color,
                })}
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text
                ff="c-Regular"
                fs="L"
                color="grey800"
                style={styles.notificationTitle}>
                {item.title}
              </Text>
              <Text
                ff="c-Regular"
                fs="XS"
                color="grey500"
                style={styles.timestamp}>
                {timestamp}
              </Text>
            </View>
            <Text
              ff="c-Regular"
              fs="S"
              color="grey600"
              style={styles.notificationBody}
              numberOfLines={2}>
              {item.body}
            </Text>
          </View>

          {/* Unread Indicator */}
          {!item.is_read && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}>
            <ArrowBack width={24} height={24} stroke={colors.grey800} />
          </TouchableOpacity>
          <Text ff="c-Regular" fs="XXXL" color="grey800" style={styles.title}>
            Notifications
          </Text>
        </View>

        {/* Menu Button */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.7}>
          <View style={styles.menuDots}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Custom Dropdown Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}>
          <View style={styles.menuDropdown}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleMarkAllAsRead}
              disabled={markingAllAsRead}
              activeOpacity={0.7}>
              {markingAllAsRead ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <CheckDouble width={20} height={20} stroke={colors.grey800} />
              )}
              <Text
                ff="c-Regular"
                fs="M"
                color="grey800"
                style={styles.menuItemText}>
                Mark all as read
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Notification List or Empty State */}
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
      ) : notifications.length === 0 ? (
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
          data={notifications}
          renderItem={renderNotificationItem}
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
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(20),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: moderateScale(16),
    padding: moderateScale(4),
  },
  title: {
    fontWeight: '700',
    flex: 1,
  },
  menuButton: {
    padding: moderateScale(8),
  },
  menuDots: {
    flexDirection: 'column',
    gap: moderateScale(4),
  },
  dot: {
    width: moderateScale(4),
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    backgroundColor: colors.grey800,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? moderateScale(100) : moderateScale(80),
    paddingRight: moderateScale(20),
  },
  menuDropdown: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(12),
    minWidth: moderateScale(180),
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    gap: moderateScale(12),
  },
  menuItemText: {
    fontWeight: '400',
  },
  listContent: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(20),
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationCardUnread: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  iconContainer: {
    marginRight: moderateScale(12),
  },
  avatar: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: colors.grey100,
  },
  iconBackground: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(4),
  },
  notificationTitle: {
    fontWeight: '600',
    flex: 1,
    marginRight: moderateScale(8),
  },
  timestamp: {
    fontWeight: '400',
  },
  notificationBody: {
    fontWeight: '400',
    lineHeight: 20,
  },
  unreadDot: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: colors.secondary,
    marginLeft: moderateScale(8),
    marginTop: moderateScale(4),
  },
  shimmerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
  },
  shimmerIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    marginRight: moderateScale(12),
  },
  shimmerContent: {
    flex: 1,
  },
  shimmerTitle: {
    width: '60%',
    height: moderateScale(16),
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(8),
  },
  shimmerBody: {
    width: '90%',
    height: moderateScale(14),
    borderRadius: moderateScale(8),
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

export default NotificationsScreen;
