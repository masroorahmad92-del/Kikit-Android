import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {colors, moderateScale} from '../theme';
import {Text} from './base/Text';
import {Close, CloseIcon} from '../assets/icons';

const GiftDetailsModal = ({visible, onClose, giftDetails, isLoading}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
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

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                ff="c-Regular"
                fs="M"
                color="grey500"
                style={styles.loadingText}>
                Loading gift details...
              </Text>
            </View>
          ) : giftDetails ? (
            <>
              {/* Gift Icon */}
              <View style={styles.iconContainer}>
                <FastImage
                  source={{uri: giftDetails.icon}}
                  style={styles.giftIcon}
                  resizeMode={FastImage.resizeMode.contain}
                />
              </View>

              {/* Gift Name */}
              <Text
                ff="c-Bold"
                fs="XXXL"
                color="grey900"
                style={styles.giftName}>
                {giftDetails.name}
              </Text>

              {/* Gift Details */}
              <View style={styles.detailsContainer}>
                {/* Coin Cost */}
                {giftDetails.coin_cost && (
                  <View style={styles.detailRow}>
                    <Text ff="c-SemiBold" fs="L" color="grey600">
                      Coin Cost:
                    </Text>
                    <Text ff="c-Bold" fs="L" color="grey900">
                      {giftDetails.coin_cost} coins
                    </Text>
                  </View>
                )}

                {/* Diamond Cost */}
                {giftDetails.diamond_cost && (
                  <View style={styles.detailRow}>
                    <Text ff="c-SemiBold" fs="L" color="grey600">
                      Diamond Cost:
                    </Text>
                    <Text ff="c-Bold" fs="L" color="grey900">
                      {giftDetails.diamond_cost} diamonds
                    </Text>
                  </View>
                )}

                {/* Status */}
                <View style={styles.detailRow}>
                  <Text ff="c-SemiBold" fs="L" color="grey600">
                    Status:
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: giftDetails.is_active
                          ? colors.success || '#10B981'
                          : colors.grey300,
                      },
                    ]}>
                    <Text
                      ff="c-SemiBold"
                      fs="M"
                      color="white"
                      style={styles.statusText}>
                      {giftDetails.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          ) : null}
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
    paddingHorizontal: moderateScale(24),
    paddingTop: moderateScale(24),
    paddingBottom: moderateScale(32),
    width: '100%',
    maxWidth: moderateScale(400),
    alignItems: 'center',
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
  loadingContainer: {
    paddingVertical: moderateScale(40),
    alignItems: 'center',
  },
  loadingText: {
    marginTop: moderateScale(16),
  },
  iconContainer: {
    width: moderateScale(100),
    height: moderateScale(100),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(20),
    backgroundColor: colors.grey50,
    borderRadius: moderateScale(20),
  },
  giftIcon: {
    width: moderateScale(80),
    height: moderateScale(80),
  },
  giftName: {
    textAlign: 'center',
    marginBottom: moderateScale(24),
    fontWeight: '700',
  },
  detailsContainer: {
    width: '100%',
    gap: moderateScale(16),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    backgroundColor: colors.grey50,
    borderRadius: moderateScale(12),
  },
  statusBadge: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(12),
  },
  statusText: {
    fontWeight: '600',
  },
});

export default GiftDetailsModal;
