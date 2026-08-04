import React, {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Toast from 'react-native-toast-message';
import {colors, moderateScale} from '../theme';
import {Text} from './base/Text';
import {Button} from './base/Button';
import {Info} from '../assets/icons';
import {FadeModal} from './base/FadeModal';
import {giftsService} from '../api/services/giftsService';
import GiftConfirmModal from './GiftConfirmModal';
import GiftDetailsModal from './GiftDetailsModal';
import {useNavigation} from '@react-navigation/native';
import {useKitkitStore} from '../store/kitkitStore';

/**
 * GiftBottomSheet - Reusable component for displaying and sending gifts
 *
 * Usage Example:
 *
 * import { useRef } from 'react';
 * import GiftBottomSheet from '../components/GiftBottomSheet';
 *
 * const YourComponent = () => {
 *   const giftSheetRef = useRef();
 *   const recipientUserId = 'user-id-here';
 *
 *   const handleOpenGifts = () => {
 *     giftSheetRef.current?.open();
 *   };
 *
 *   const handleGiftSent = (giftId) => {
 *     console.log('Gift sent:', giftId);
 *     // Optional: Add any post-send logic here
 *   };
 *
 *   return (
 *     <>
 *       <Button onPress={handleOpenGifts} title="Send Gift" />
 *       <GiftBottomSheet
 *         ref={giftSheetRef}
 *         recipientId={recipientUserId}
 *         onGiftSent={handleGiftSent}
 *       />
 *     </>
 *   );
 * };
 *
 * Props:
 * @param {string} recipientId - Required. The ID of the user receiving the gift
 * @param {function} onGiftSent - Optional. Callback function called after gift is successfully sent
 *
 * Exposed Methods (via ref):
 * - open() - Opens the gift bottom sheet
 * - close() - Closes the gift bottom sheet
 */

const GiftBottomSheet = forwardRef(({recipientId, liveRoomId, onGiftSent}, ref) => {
  const {userProfile, setUserProfile} = useKitkitStore();
  const navigation = useNavigation();
  const giftSheetRef = useRef();

  const [selectedGift, setSelectedGift] = useState(null);
  const [gifts, setGifts] = useState([]);
  const [isLoadingGifts, setIsLoadingGifts] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [giftDetails, setGiftDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // User balance
  const userBalance = userProfile?.user?.coin_balance || 0;
  const diamondBalance = userProfile?.user?.diamond_balance || 0;

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    open: () => {
      giftSheetRef.current?.open();
      fetchGifts();
    },
    close: () => {
      giftSheetRef.current?.close();
    },
  }));

  const fetchGifts = async () => {
    try {
      setIsLoadingGifts(true);
      const response = await giftsService.getGifts();
      const giftsData = response?.data?.data?.items || response?.data?.items || [];

      // Map API response to component format
      const formattedGifts = giftsData
        .filter(gift => gift.is_active)
        .map(gift => ({
          id: gift.id,
          name: gift.name,
          price: gift.coin_cost
            ? `${gift.coin_cost} coins`
            : gift.diamond_cost
            ? `${gift.diamond_cost} diamonds`
            : 'Free',
          image: gift.icon,
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
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setIsLoadingGifts(false);
    }
  };

  const handleSendGift = () => {
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

    // Verify the gift object exists before showing modal
    const giftObject = gifts.find(gift => gift.id === selectedGift);

    if (!giftObject) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Gift not found. Please try again.',
        position: 'top',
        visibilityTime: 2000,
      });
      return;
    }

    // Close the bottom sheet first, then show confirm modal after a delay
    // This prevents z-index conflicts between RBSheet and Modal
    giftSheetRef.current?.close();
    setTimeout(() => {
      setShowConfirmModal(true);
    }, 350);
  };

  const handleConfirmSend = async () => {
    if (!recipientId || !selectedGift) {
      setShowConfirmModal(false);
      setTimeout(() => {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Missing information',
          position: 'top',
          visibilityTime: 3000,
        });
        // Reopen the gift selection bottom sheet
        giftSheetRef.current?.open();
      }, 600);
      return;
    }

    try {
      setIsSending(true);
      const response = await giftsService.sendGift(
        recipientId,
        selectedGift,
        liveRoomId,
      );
      const responseData = response?.data?.data || response?.data;
      const newCoinBalance = responseData?.new_coin_balance;
      const newDiamondBalance = responseData?.new_diamond_balance;

      // Update user profile with new balances
      if (userProfile && (newCoinBalance !== undefined || newDiamondBalance !== undefined)) {
        const updatedUserProfile = {
          ...userProfile,
          user: {
            ...userProfile.user,
            ...(newCoinBalance !== undefined && {coin_balance: newCoinBalance}),
            ...(newDiamondBalance !== undefined && {diamond_balance: newDiamondBalance}),
          },
        };
        setUserProfile(updatedUserProfile);
      }

      setShowConfirmModal(false);
      giftSheetRef.current?.close();

      setTimeout(() => {
        Toast.show({
          type: 'success',
          text2: 'Gift Sent!',
          text1: response?.data?.message || 'Your gift was sent successfully.',
          position: 'top',
          visibilityTime: 3000,
        });
      }, 600);

      // Call callback if provided
      if (onGiftSent) {
        onGiftSent(selectedGift);
      }
    } catch (err) {
      console.error('Error sending gift:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to send gift';
      setShowConfirmModal(false);
      setTimeout(() => {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMessage,
          position: 'top',
          visibilityTime: 3000,
        });
        // Reopen the gift selection bottom sheet on error
        giftSheetRef.current?.open();
      }, 600);
    } finally {
      setIsSending(false);
    }
  };

  const handleBuyCoins = () => {
    setShowConfirmModal(false);
    navigation.navigate('MyPoints');
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

  return (
    <>
      {/* Gift Bottom Sheet */}
      <FadeModal
        refRBSheet={giftSheetRef}
        height={moderateScale(600)}
        header={true}
        headerTitle="Send a Gift"
        type={1}
        closeOnDragDown={true}
        closeOnPressMask={true}
        setIsVisible={() => giftSheetRef.current?.close()}>
        {isLoadingGifts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text fs="M" color="grey600" style={styles.loadingText}>
              Loading gifts...
            </Text>
          </View>
        ) : gifts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text fs="L" color="grey600" style={styles.emptyText}>
              No gifts available at the moment
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.noteContainer}>
              <Text ff="c-Regular" fs="M" color="grey800" style={styles.noteText}>
                User will receive 60% of the amount
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}>
              <View style={styles.gridContainer}>
                {gifts.map((gift, index) => renderGiftCard(gift, index))}
              </View>
            </ScrollView>

            <View style={styles.buttonContainer}>
              <Button title="Send" onPress={handleSendGift} />
            </View>
          </>
        )}
      </FadeModal>

      {/* Gift Confirmation Modal */}
      <GiftConfirmModal
        visible={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          // Reopen the gift selection bottom sheet when user cancels
          setTimeout(() => {
            giftSheetRef.current?.open();
          }, 350);
        }}
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
        onClose={() => setShowDetailsModal(false)}
        giftDetails={giftDetails}
        isLoading={isLoadingDetails}
      />
    </>
  );
});

GiftBottomSheet.displayName = 'GiftBottomSheet';

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(40),
  },
  loadingText: {
    marginTop: moderateScale(12),
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
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    backgroundColor: '#E3F2FD',
    borderRadius: moderateScale(10),
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
  scrollContent: {
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
    paddingTop: moderateScale(16),
    alignItems: 'center',
  },
});

export default GiftBottomSheet;
