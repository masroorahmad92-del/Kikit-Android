import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Toast from 'react-native-toast-message';
import {colors, moderateScale} from '../../theme';
import {Text} from '../../components/base/Text';
import {Search} from '../../assets/icons';
import Info from '../../assets/icons/Info';
import {giftsService} from '../../api/services/giftsService';
import GiftDetailsModal from '../../components/GiftDetailsModal';

const GiftsScreen = ({navigation}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gifts, setGifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  const [isGiftModalVisible, setIsGiftModalVisible] = useState(false);
  const [selectedGiftDetails, setSelectedGiftDetails] = useState(null);
  const [isLoadingGiftDetails, setIsLoadingGiftDetails] = useState(false);

  useEffect(() => {
    fetchReceivedGifts(1, false);
  }, []);

  const fetchReceivedGifts = async (page = 1, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else if (page === 1) {
        setIsLoading(true);
      }
      setError(null);

      const response = await giftsService.getReceivedGifts(page, 50);
      const data = response?.data?.data || response?.data;

      const newGifts = data?.items || [];
      const totalItems = data?.total || 0;
      const totalPagesCount = data?.pages || 1;

      if (isLoadMore) {
        setGifts(prevGifts => [...prevGifts, ...newGifts]);
      } else {
        setGifts(newGifts);
      }

      setTotal(totalItems);
      setCurrentPage(page);
      setTotalPages(totalPagesCount);
    } catch (err) {
      console.error('Error fetching received gifts:', err);
      const errorMessage =
        err?.response?.data?.message || err?.message || 'Failed to load gifts';
      setError(errorMessage);

      if (!isLoadMore) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMessage,
          position: 'top',
          visibilityTime: 3000,
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setCurrentPage(1);
    fetchReceivedGifts(1, false);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && currentPage < totalPages) {
      fetchReceivedGifts(currentPage + 1, true);
    }
  };

  const handleRetry = () => {
    fetchReceivedGifts(1, false);
  };

  const handleSenderPress = sender => {
    console.log('Sender pressed:', sender);
    if (sender?.profile_id) {
      const item = {
        id: sender.profile_id,
        name: sender.name,
        image: sender.profile_image ? {uri: sender.profile_image} : null,
      };
      navigation.navigate('ProfileDetail', {item});
    }
  };

  const handleGiftDetailsPress = async giftId => {
    try {
      setIsGiftModalVisible(true);
      setIsLoadingGiftDetails(true);
      setSelectedGiftDetails(null);

      const response = await giftsService.getGiftById(giftId);
      const giftData = response?.data?.data?.data || response?.data?.data;

      setSelectedGiftDetails(giftData);
    } catch (err) {
      console.error('Error fetching gift details:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err?.response?.data?.message || 'Failed to load gift details',
        position: 'top',
        visibilityTime: 3000,
      });
      setIsGiftModalVisible(false);
    } finally {
      setIsLoadingGiftDetails(false);
    }
  };

  const handleCloseGiftModal = () => {
    setIsGiftModalVisible(false);
    setSelectedGiftDetails(null);
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const filteredGifts = gifts.filter(
    gift =>
      gift.sender?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      gift.gift?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderGiftItem = ({item}) => {
    return (
      <TouchableOpacity
        style={styles.giftCard}
        onPress={() => handleSenderPress(item.sender)}
        onLongPress={() => handleGiftDetailsPress(item.gift?.id)}
        activeOpacity={0.7}>
        {/* Sender Profile Image */}
        <TouchableOpacity
          style={styles.senderImageContainer}
          onPress={() => handleSenderPress(item.sender)}
          activeOpacity={0.7}>
          {item.sender?.profile_image ? (
            <FastImage
              source={{uri: item.sender.profile_image}}
              style={styles.senderImage}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : (
            <View style={[styles.senderImage, styles.senderImagePlaceholder]}>
              <Text style={styles.senderInitial}>
                {item.sender?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Gift Content */}
        <View style={styles.giftContent}>
          {/* Sender Name and Info Icon */}
          <View style={styles.giftHeader}>
            <Text
              ff="c-SemiBold"
              fs="L"
              color="grey900"
              style={styles.senderName}
              numberOfLines={1}>
              {item.sender?.name || 'Unknown'}
            </Text>
            <TouchableOpacity
              onPress={() => handleGiftDetailsPress(item.gift?.id)}
              activeOpacity={0.7}
              style={styles.infoIconHeader}>
              <Info width={20} height={20} fill={colors.grey500} />
            </TouchableOpacity>
          </View>

          {/* Gift Info */}
          <View style={styles.giftInfo}>
            <FastImage
              source={{uri: item.gift?.icon}}
              style={styles.giftIcon}
              resizeMode={FastImage.resizeMode.contain}
            />
            <View style={styles.giftDetails}>
              <Text ff="c-Regular" fs="M" color="grey800" numberOfLines={1}>
                {item.gift?.name}
              </Text>
              <View style={styles.costContainer}>
                {item.coin_cost > 0 && (
                  <Text ff="c-Regular" fs="XS" color="grey500">
                    {item.coin_cost} coins
                  </Text>
                )}
                {item.diamond_cost > 0 && (
                  <Text ff="c-Regular" fs="XS" color="grey500">
                    {item.coin_cost > 0 ? ' · ' : ''}
                    {item.diamond_cost} diamonds
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Time */}
        <Text ff="c-Regular" fs="XS" color="grey400" style={styles.timeBottom}>
          {formatDate(item.created_at)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) {
      return null;
    }
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            ff="c-Regular"
            fs="M"
            color="grey500"
            style={styles.emptyText}>
            Loading gifts...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text ff="c-SemiBold" fs="XL" color="grey800" style={styles.emptyTitle}>
            Failed to load gifts
          </Text>
          <Text
            ff="c-Regular"
            fs="M"
            color="grey500"
            style={styles.emptyText}>
            {error}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            activeOpacity={0.7}>
            <Text ff="c-SemiBold" fs="M" color="white">
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🎁</Text>
        <Text ff="c-SemiBold" fs="XL" color="grey800" style={styles.emptyTitle}>
          {searchQuery ? 'No gifts found' : 'No gifts yet'}
        </Text>
        <Text
          ff="c-Regular"
          fs="M"
          color="grey500"
          style={styles.emptyText}>
          {searchQuery
            ? 'Try adjusting your search'
            : 'When someone sends you a gift, it will appear here'}
        </Text>
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
              Gifts
            </Text>
            <Text ff="c-Regular" fs="M" color="grey500" style={styles.subtitle}>
              See who sent you gifts.
            </Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Search
              width={20}
              height={20}
              stroke={colors.grey400}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or gift"
              placeholderTextColor={colors.grey400}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Gifts Label with Count */}
          <View style={styles.giftsLabelContainer}>
            <Text ff="c-Regular" fs="XL" color="grey800" style={styles.giftsLabel}>
              Received Gifts
            </Text>
            {!isLoading && (
              <View style={styles.countBadge}>
                <Text ff="c-Regular" fs="S" color="white" style={styles.countText}>
                  {total}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* Gifts List */}
      <FlatList
        data={filteredGifts}
        renderItem={renderGiftItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />

      {/* Gift Details Modal */}
      <GiftDetailsModal
        visible={isGiftModalVisible}
        onClose={handleCloseGiftModal}
        giftDetails={selectedGiftDetails}
        isLoading={isLoadingGiftDetails}
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
    paddingBottom: moderateScale(16),
  },
  title: {
    fontWeight: '700',
    marginBottom: moderateScale(8),
  },
  subtitle: {
    lineHeight: moderateScale(20),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: moderateScale(50),
    marginHorizontal: moderateScale(20),
    marginBottom: moderateScale(24),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(14),
  },
  searchIcon: {
    marginRight: moderateScale(12),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(16),
    color: colors.grey800,
    padding: 0,
  },
  giftsLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    marginBottom: moderateScale(16),
  },
  giftsLabel: {
    fontWeight: '700',
    marginRight: moderateScale(8),
  },
  countBadge: {
    backgroundColor: '#6B7FE8',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    minWidth: moderateScale(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(20),
  },
  giftCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  senderImageContainer: {
    marginRight: moderateScale(12),
  },
  senderImage: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: colors.grey200,
  },
  senderImagePlaceholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  senderInitial: {
    fontSize: moderateScale(22),
    fontWeight: '700',
    color: colors.white,
  },
  giftContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  giftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  senderName: {
    flex: 1,
    fontWeight: '600',
    marginRight: moderateScale(8),
  },
  time: {
    fontWeight: '400',
  },
  infoIconHeader: {
    padding: moderateScale(6),
  },
  timeBottom: {
    position: 'absolute',
    bottom: moderateScale(16),
    right: moderateScale(16),
    fontWeight: '400',
  },
  giftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  giftIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    marginRight: moderateScale(12),
  },
  giftDetails: {
    flex: 1,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(2),
  },
  footerLoader: {
    paddingVertical: moderateScale(20),
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(40),
    paddingTop: moderateScale(60),
  },
  emptyIcon: {
    fontSize: moderateScale(64),
    marginBottom: moderateScale(16),
  },
  emptyTitle: {
    fontWeight: '700',
    marginBottom: moderateScale(8),
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: moderateScale(22),
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(25),
    marginTop: moderateScale(16),
  },
});

export default GiftsScreen;
