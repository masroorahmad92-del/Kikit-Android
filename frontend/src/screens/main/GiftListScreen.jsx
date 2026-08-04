import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Toast from 'react-native-toast-message';
import {colors, moderateScale} from '../../theme';
import {Text} from '../../components/base/Text';
import {Button} from '../../components/base/Button';
import {ArrowBack, Info} from '../../assets/icons';
import {giftsService} from '../../api/services/giftsService';
import GiftListShimmer from '../../components/GiftListShimmer';
import GiftConfirmModal from '../../components/GiftConfirmModal';
import GiftDetailsModal from '../../components/GiftDetailsModal';
import {useKitkitStore} from '../../store/kitkitStore';

const GiftListScreen = ({navigation, route}) => {
  const {userProfile, setUserProfile} = useKitkitStore();
  const recipientId = route?.params?.recipientId;

  const [selectedGift, setSelectedGift] = useState(null);
  const [gifts, setGifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Gift details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [giftDetails, setGiftDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Sending gift state
  const [isSending, setIsSending] = useState(false);

  // User balance
  const userBalance = userProfile?.user?.coin_balance || 0;
  const diamondBalance = userProfile?.user?.diamond_balance || 0;
  console.log(userProfile, 'userProfile in GiftListScreen');
  useEffect(() => {
    fetchGifts();
  }, []);

  const fetchGifts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await giftsService.getGifts();
      const giftsData = response?.data?.data?.items || response?.data?.items || [];

      // Map API response to component format
      const formattedGifts = giftsData
        .filter(gift => gift.is_active) // Only show active gifts
        .map(gift => ({
          id: gift.id,
          name: gift.name,
          price: gift.coin_cost
            ? `${gift.coin_cost} coins`
            : gift.diamond_cost
            ? `${gift.diamond_cost} diamonds`
            : 'Free',
          image: gift.icon, // URL from API
          backgroundColor: colors.white,
        }));

      setGifts(formattedGifts);

      // Auto-select first gift if available
      if (formattedGifts.length > 0) {
        setSelectedGift(formattedGifts[0].id);
      }
    } catch (err) {
      console.error('Error fetching gifts:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to load gifts';
      setError(errorMessage);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSend = () => {
    if (!selectedGift) {
      Toast.show({
        type: 'info',
        text1: 'Info',
        text2: 'Please select a gift to send',
        position: 'top',
        visibilityTime: 2000,
      });
      return;
    }
    setShowConfirmModal(true);
  };

  const handleRetry = () => {
    fetchGifts();
  };

  const handleConfirmSend = async () => {
    if (!recipientId) {
      // Close modal first
      setShowConfirmModal(false);

      // Show error toast after modal closes
      setTimeout(() => {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Recipient information is missing',
          position: 'top',
          visibilityTime: 3000,
        });
      }, 600);
      return;
    }

    if (!selectedGift) {
      // Close modal first
      setShowConfirmModal(false);

      // Show error toast after modal closes
      setTimeout(() => {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please select a gift',
          position: 'top',
          visibilityTime: 3000,
        });
      }, 600);
      return;
    }

    try {
      setIsSending(true);

      // Call the send gift API
      const response = await giftsService.sendGift(recipientId, selectedGift);

      // Extract the new balances from the response
      const responseData = response?.data?.data || response?.data;
      const newCoinBalance = responseData?.new_coin_balance;
      const newDiamondBalance = responseData?.new_diamond_balance;

      // Update the user profile with new balances
      if (userProfile && (newCoinBalance !== undefined || newDiamondBalance !== undefined)) {
        const updatedUserProfile = {
          ...userProfile,
          user: {
            ...userProfile.user,
            ...(newCoinBalance !== undefined && { coin_balance: newCoinBalance }),
            ...(newDiamondBalance !== undefined && { diamond_balance: newDiamondBalance }),
          },
        };
        setUserProfile(updatedUserProfile);
      }

      // Close modal first
      setShowConfirmModal(false);

      // Show success toast after modal closes
      setTimeout(() => {
        Toast.show({
          type: 'success',
          text2: 'Gift Sent!',
          text1: response?.data?.message || 'Your gift was sent successfully.',
          position: 'top',
          visibilityTime: 3000,
        });
      }, 600);

      // Navigate back after successful send
      setTimeout(() => {
        navigation.goBack();
      }, 1600);
    } catch (err) {
      console.error('Error sending gift:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to send gift';

      // Close modal first
      setShowConfirmModal(false);

      // Show error toast after modal closes
      setTimeout(() => {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMessage,
          position: 'top',
          visibilityTime: 3000,
        });
      }, 600);
    } finally {
      setIsSending(false);
    }
  };

  const handleBuyCoins = () => {

    setShowConfirmModal(false);
    navigation.navigate('MyPoints');
    // TODO: Navigate to buy coins screen
    // Toast.show({
    //   type: 'info',
    //   text1: 'Coming Soon',
    //   text2: 'Buy coins feature will be available soon',
    //   position: 'top',
    //   visibilityTime: 2000,
    // });
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
  };

  const handleLongPress = async giftId => {
    try {
      setShowDetailsModal(true);
      setIsLoadingDetails(true);
      setGiftDetails(null);

      const response = await giftsService.getGiftById(giftId);
      const data = response?.data?.data || response?.data || response;
      setGiftDetails(data);
    } catch (err) {
      console.error('Error fetching gift details:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err?.response?.data?.message || 'Failed to load gift details',
        position: 'top',
        visibilityTime: 3000,
      });
      setShowDetailsModal(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setGiftDetails(null);
  };

  const renderGiftCard = (gift, index) => {
    const isSelected = selectedGift === gift.id;
    const isLeftColumn = index % 2 === 0;

    return (
      <TouchableOpacity
        key={gift.id}
        style={[
          styles.giftCard,
          {backgroundColor: isSelected ? colors.selectedItembgCOlor || '#E8F4FD' : gift.backgroundColor},
          isLeftColumn ? styles.cardLeft : styles.cardRight,
        ]}
        onPress={() => setSelectedGift(gift.id)}
        onLongPress={() => handleLongPress(gift.id)}
        activeOpacity={0.7}>
        {/* Info Icon Button */}
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => handleLongPress(gift.id)}
          activeOpacity={0.7}>
          <Info width={18} height={18} fill={colors.grey500 || '#6B7280'} />
        </TouchableOpacity>

        <FastImage
          source={{uri: gift.image}}
          style={styles.giftImage}
          resizeMode={FastImage.resizeMode.contain}
        />
        <Text ff="c-Regular" fs="L" color="grey800" style={styles.giftName}>
          {gift.name}
        </Text>
        <Text ff="c-Regular" fs="M" color="grey400" style={styles.giftPrice}>
          {gift.price}
        </Text>
      </TouchableOpacity>
    );
  };

  // Show shimmer loading state
  if (isLoading) {
    return <GiftListShimmer />;
  }

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
          <Text ff="c-Regular" fs="XXXL" color="grey800" style={styles.title}>
            Gifts
          </Text>
        </View>
        <View style={styles.noteContainer}>
          <Text ff="c-Regular" fs="M" color="grey800" style={styles.noteText}>
            User will receive 60% of the amount
          </Text>
        </View>
        <View style={styles.errorContainer}>
          <Text ff="c-Regular" fs="XL" color="grey800" style={styles.errorText}>
            {error}
          </Text>
          <Button title="Retry" onPress={handleRetry} style={styles.retryButton} />
        </View>
      </SafeAreaView>
    );
  }

  // Show empty state
  if (gifts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}>
            <ArrowBack width={24} height={24} stroke={colors.grey800} />
          </TouchableOpacity>
          <Text ff="c-Regular" fs="XXXL" color="grey800" style={styles.title}>
            Gifts
          </Text>
        </View>
        <View style={styles.noteContainer}>
          <Text ff="c-Regular" fs="M" color="grey800" style={styles.noteText}>
            User will receive 60% of the amount
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text ff="c-Regular" fs="XL" color="grey600" style={styles.emptyText}>
            No gifts available at the moment
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text ff="c-Regular" fs="XXXL" color="grey800" style={styles.title}>
          Gifts
        </Text>
      </View>

      {/* Note */}
      <View style={styles.noteContainer}>
        <Text ff="c-Regular" fs="M" color="grey800" style={styles.noteText}>
          User will receive 60% of the amount
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Gift Grid */}
        <View style={styles.gridContainer}>
          {gifts.map((gift, index) => renderGiftCard(gift, index))}
        </View>
      </ScrollView>

      {/* Send Button */}
      <View style={styles.buttonContainer}>
        <Button title="Send" onPress={handleSend} />
      </View>

      {/* Gift Confirmation Modal */}
      <GiftConfirmModal
        visible={showConfirmModal}
        onClose={handleCloseModal}
        selectedGift={gifts.find(gift => gift.id === selectedGift)}
        userBalance={userBalance}
        diamondBalance={diamondBalance}
        onSendGift={handleConfirmSend}
        onBuyCoins={handleBuyCoins}
        isSending={isSending}
      />

      {/* Gift Details Modal */}
      <GiftDetailsModal
        visible={showDetailsModal}
        onClose={handleCloseDetailsModal}
        giftDetails={giftDetails}
        isLoading={isLoadingDetails}
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
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(20),
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  giftCard: {
    width: '48%',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    marginBottom: moderateScale(16),
    alignItems: 'center',
    position: 'relative',
  },
  infoButton: {
    position: 'absolute',
    top: moderateScale(8),
    right: moderateScale(8),
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cardLeft: {
    marginRight: moderateScale(4),
  },
  cardRight: {
    marginLeft: moderateScale(4),
  },
  giftImage: {
    width: moderateScale(40),
    height: moderateScale(40),
    marginBottom: moderateScale(12),
  },
  giftName: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: moderateScale(4),
  },
  giftPrice: {
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(16),
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(32),
  },
  errorText: {
    textAlign: 'center',
    marginBottom: moderateScale(20),
  },
  retryButton: {
    minWidth: moderateScale(120),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(32),
  },
  emptyText: {
    textAlign: 'center',
  },
  noteContainer: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(12),
    backgroundColor: '#E3F2FD',
    borderRadius: moderateScale(10),
    marginHorizontal: moderateScale(16),
    marginBottom: moderateScale(16),
    borderWidth: 1,
    borderColor: '#90CAF9',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  noteText: {
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: moderateScale(20),
  },
});

export default GiftListScreen;
