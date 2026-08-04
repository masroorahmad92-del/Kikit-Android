import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import {colors, moderateScale} from '../theme';
import {Text} from './base/Text';
import {Button} from './base/Button';
import {Close, CloseIcon} from '../assets/icons';
import {Coin} from '../assets/icons';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const GiftConfirmModal = ({
  visible,
  onClose,
  selectedGift,
  userBalance,
  diamondBalance,
  onSendGift,
  onBuyCoins,
  isSending = false,
}) => {
  // Don't render if no gift is selected
  if (!selectedGift) {
    return null;
  }

  // Convert balance to USD (assuming 1 coin = $0.10)
  const balanceInUSD = (userBalance * 0.1).toFixed(2);
  const diamondBalanceInUSD = (diamondBalance * 0.5).toFixed(2); // Assuming 1 diamond = $0.50

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}>
            <CloseIcon width={24} height={24} fill={colors.grey800} />
          </TouchableOpacity>
<View style={{height: moderateScale(30)}}/>
          {/* Title */}
          <Text
            ff="c-Bold"
            fs="XXXL"
            color="grey900"
            style={styles.title}>
            Confirm Gift Send
          </Text>

          {/* Subtitle */}
          <Text
            ff="c-Regular"
            fs="L"
            color="grey500"
            style={styles.subtitle}>
            You're about to send the following gift...
          </Text>

          {/* Gift Card */}
          <View style={styles.giftCard}>
            <FastImage
              source={{uri: selectedGift.image}}
              style={styles.giftIcon}
              resizeMode={FastImage.resizeMode.contain}
            />
            <Text
              ff="c-SemiBold"
              fs="XL"
              color="grey900"
              style={styles.giftName}>
              {selectedGift.name}
            </Text>
            <Text
              ff="c-Regular"
              fs="L"
              color="grey500"
              style={styles.giftPrice}>
              {selectedGift.price}
            </Text>
          </View>

          {/* Balance Section */}
          <View style={styles.balanceContainer}>
            <Text
              ff="c-SemiBold"
              fs="XL"
              color="grey900"
              style={styles.balanceTitle}>
              Your Balance
            </Text>

            {/* Coins Balance */}
            <View style={styles.balanceRow}>
              <View style={styles.balanceContent}>
                <View style={styles.coinIconWrapper}>
                  <Coin width={36} height={36} />
                </View>
                <View style={styles.balanceTextContainer}>
                  <Text ff="c-Bold" fs="XL" color="grey900">
                    {userBalance || 0} Coins
                  </Text>
                  <Text ff="c-Regular" fs="M" color="grey500">
                    ${balanceInUSD} USD
                  </Text>
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.balanceDivider} />

            {/* Diamonds Balance */}
            <View style={styles.balanceRow}>
              <View style={styles.balanceContent}>
                <View style={styles.diamondIconWrapper}>
                  <Image
                    source={require('../assets/images/diamond.png')}
                    style={styles.diamondIcon}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.balanceTextContainer}>
                  <Text ff="c-Bold" fs="XL" color="grey900">
                    {diamondBalance || 0} Diamonds
                  </Text>
                  <Text ff="c-Regular" fs="M" color="grey500">
                    ${diamondBalanceInUSD} USD
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.buyCoinsButton}
              onPress={onBuyCoins}
              activeOpacity={0.7}>
              <Text ff="c-SemiBold" fs="L" color="grey900">
                Buy Coins
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sendGiftButtonWrapper}
              onPress={onSendGift}
              activeOpacity={0.9}
              disabled={isSending}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={[
                  styles.sendGiftButton,
                  isSending && styles.sendGiftButtonDisabled,
                ]}>
                {isSending ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text ff="c-SemiBold" fs="L" color="white">
                    Send Gift
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(24),
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(24),
    paddingBottom: moderateScale(32),
    width: '100%',
    maxWidth: moderateScale(400),
  },
  closeButton: {
    position: 'absolute',
    top: moderateScale(16),
    right: moderateScale(16),
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: colors.grey100 || '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 5,
  },
  title: {
    textAlign: 'center',
    marginBottom: moderateScale(8),
    fontWeight: '700',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: moderateScale(24),
  },
  giftCard: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: colors.grey200 || '#E5E7EB',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  giftIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    marginRight: moderateScale(12),
  },
  giftName: {
    flex: 1,
    fontWeight: '600',
  },
  giftPrice: {
    fontWeight: '400',
    marginLeft: moderateScale(8),
  },
  balanceContainer: {
    backgroundColor: colors.selectedItembgCOlor || '#F3E5F5',
    borderRadius: moderateScale(16),
    borderWidth: 2,
    borderColor: colors.primary,
    padding: moderateScale(20),
    marginBottom: moderateScale(24),
  },
  balanceTitle: {
    marginBottom: moderateScale(16),
    fontWeight: '600',
  },
  balanceRow: {
    marginBottom: moderateScale(12),
  },
  balanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIconWrapper: {
    marginRight: moderateScale(12),
  },
  diamondIconWrapper: {
    width: moderateScale(36),
    height: moderateScale(36),
    marginRight: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondIcon: {
    width: moderateScale(32),
    height: moderateScale(32),
  },
  balanceTextContainer: {
    flex: 1,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: colors.primary,
    opacity: 0.3,
    marginVertical: moderateScale(12),
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: moderateScale(12),
  },
  buyCoinsButton: {
    flex: 1,
    backgroundColor: colors.grey100,
    borderRadius: moderateScale(28),
    paddingVertical: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendGiftButtonWrapper: {
    flex: 1.2,
    borderRadius: moderateScale(28),
    overflow: 'hidden',
  },
  sendGiftButton: {
    // paddingVertical: moderateScale(16),
    alignItems: 'center',
    height: moderateScale(55),
    justifyContent: 'center',
  },
  sendGiftButtonDisabled: {
    opacity: 0.7,
  },
});

export default GiftConfirmModal;
