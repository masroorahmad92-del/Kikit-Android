import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Modal,
  Animated,
  Linking,
} from 'react-native';
import {colors, moderateScale} from '../../theme';
import {Text} from '../../components/base/Text';
import GradientBackground from '../../components/GradientBackground';
import {ArrowBack} from '../../assets/icons';

const COIN_VALUE = 0.10;

const ConfirmWithdrawScreen = ({navigation, route}) => {
  const {coins} = route.params;
  const usdValue = (coins * COIN_VALUE).toFixed(2);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const handleConfirm = () => {
    setShowSuccessModal(true);
  };

  useEffect(() => {
    if (showSuccessModal) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [showSuccessModal, scaleAnim, opacityAnim]);

  const handleClose = () => {
    setShowSuccessModal(false);
    navigation.popToTop();
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <ArrowBack width={24} height={24} stroke={colors.grey800} />
          </TouchableOpacity>
          <Text ff="c-Bold" fs="XXL" color="grey800" style={styles.headerTitle}>
            Confirm Withdraw
          </Text>
          <View style={{width: 24}} />
        </View>

        {/* Withdraw Amount */}
        <View style={styles.amountSection}>
          <Text ff="c-Regular" fs="M" color="grey400">
            Withdraw amount
          </Text>
          <Text ff="c-Bold" fs="XXXL" color="grey800" style={styles.amountText}>
            ${usdValue} USD
          </Text>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text ff="c-Regular" fs="M" color="grey800">
              Coins to Withdraw
            </Text>
            <Text ff="c-Bold" fs="M" color="grey800">
              {coins}
            </Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text ff="c-Regular" fs="M" color="grey800">
              Total
            </Text>
            <Text ff="c-Bold" fs="M" color="grey800">
              ${usdValue} USD
            </Text>
          </View>
        </View>

        <View style={styles.spacer} />

        {/* Confirm Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.confirmButton}
            activeOpacity={0.8}
            onPress={handleConfirm}>
            <Text ff="c-Bold" fs="L" color="white">
              Confirm
            </Text>
          </TouchableOpacity>

          <Text ff="c-Regular" fs="XS" color="grey400" style={styles.termsText}>
            By purchase, you are agree to our{' '}
            <Text
              ff="c-Bold"
              fs="XS"
              color="primary"
              style={styles.termsLink}
              onPress={() => Linking.openURL('https://www.letskikit.com/terms')}>
              Terms and Conditions
            </Text>
            .
          </Text>
        </View>

        {/* Success Modal */}
        <Modal
          visible={showSuccessModal}
          transparent
          animationType="none"
          onRequestClose={handleClose}>
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.modalContent,
                {
                  opacity: opacityAnim,
                  transform: [{scale: scaleAnim}],
                },
              ]}>
              <Image
                source={require('../../assets/images/success.png')}
                style={styles.successIcon}
                resizeMode="contain"
              />
              <Text
                ff="c-Bold"
                fs="XXL"
                color="grey800"
                style={styles.successTitle}>
                Withdrawal Successful!
              </Text>
              <Text
                ff="c-Regular"
                fs="S"
                color="grey400"
                style={styles.successMessage}>
                Your withdrawal request has been submitted successfully.
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                activeOpacity={0.8}
                onPress={handleClose}>
                <Text ff="c-Bold" fs="M" color="white">
                  Close
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(12),
  },
  headerTitle: {
    fontWeight: '700',
  },
  amountSection: {
    alignItems: 'center',
    marginTop: moderateScale(20),
    marginBottom: moderateScale(30),
  },
  amountText: {
    fontWeight: '700',
    marginTop: moderateScale(6),
  },
  detailsCard: {
    backgroundColor: colors.white,
    marginHorizontal: moderateScale(20),
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(4),
    paddingHorizontal: moderateScale(20),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(16),
  },
  detailDivider: {
    height: 1,
    borderStyle: 'dotted',
    borderWidth: 1,
    borderColor: colors.grey200,
  },
  spacer: {
    flex: 1,
  },
  bottomContainer: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(20),
  },
  confirmButton: {
    backgroundColor: colors.secondary,
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(30),
    alignItems: 'center',
    marginBottom: moderateScale(14),
  },
  termsText: {
    textAlign: 'center',
  },
  termsLink: {
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(30),
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(24),
    paddingVertical: moderateScale(36),
    paddingHorizontal: moderateScale(28),
    alignItems: 'center',
    width: '100%',
  },
  successIcon: {
    width: moderateScale(80),
    height: moderateScale(80),
    marginBottom: moderateScale(20),
  },
  successTitle: {
    fontWeight: '700',
    marginBottom: moderateScale(10),
    textAlign: 'center',
  },
  successMessage: {
    textAlign: 'center',
    lineHeight: moderateScale(20),
    marginBottom: moderateScale(24),
  },
  closeButton: {
    backgroundColor: colors.secondary,
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(50),
    borderRadius: moderateScale(30),
  },
});

export default ConfirmWithdrawScreen;
