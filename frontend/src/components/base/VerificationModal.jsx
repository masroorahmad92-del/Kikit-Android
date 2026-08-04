import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {Text} from './Text';
import {colors, fonts, moderateScale} from '../../theme';

const {width, height} = Dimensions.get('window');

const VerificationModal = ({
  visible = false,
  onClose,
  onPrimaryPress,
  onSecondaryPress,
  icon = null,
  title = 'Get Verified',
  description = 'Verify your profile with a quick selfie. Once approved, you will get a verified badge. Your selfie stays private with us',
  primaryButtonText = 'Verify Now',
  secondaryButtonText = '',
  primaryButtonStyle = {},
  secondaryButtonStyle = {},
  primaryTextStyle = {},
  secondaryTextStyle = {},
  modalStyle = {},
  iconStyle = {},
  titleStyle = {},
  descriptionStyle = {},
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, modalStyle]}>
          {/* Icon */}
          {icon && (
            <View style={[styles.iconContainer, iconStyle]}>
              {icon}
            </View>
          )}

          {/* Title */}
          <Text fs="XXL" color="grey800" style={[styles.title, titleStyle]}>
            {title}
          </Text>

          {/* Description */}
          <Text fs="M" color="grey400" style={[styles.description, descriptionStyle]}>
            {description}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {/* Secondary Button - Only show if text is provided */}
            {secondaryButtonText && (
              <TouchableOpacity
                style={[styles.secondaryButton, secondaryButtonStyle]}
                onPress={onSecondaryPress}
                activeOpacity={0.7}>
                <Text fs="L" color="grey800" style={[styles.secondaryText, secondaryTextStyle]}>
                  {secondaryButtonText}
                </Text>
              </TouchableOpacity>
            )}

            {/* Primary Button */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                !secondaryButtonText && styles.primaryButtonFull,
                primaryButtonStyle,
              ]}
              onPress={onPrimaryPress}
              activeOpacity={0.7}>
              <LinearGradient
                colors={['#FF2C79', '#BD00FF']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.primaryGradient}>
                <Text fs="L" color="white" style={[styles.primaryText, primaryTextStyle]}>
                  {primaryButtonText}
                </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(32),
    width: '100%',
    maxWidth: moderateScale(340),
    alignItems: 'center',
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.CabinetBold,
    textAlign: 'center',
    marginBottom: moderateScale(16),
    lineHeight: 32,
  },
  description: {
    fontFamily: fonts.CabinetRegular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: moderateScale(32),
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: moderateScale(12),
  },
  secondaryButton: {
    flex: 1,
    height: moderateScale(48),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grey100,
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryText: {
    fontFamily: fonts.CabinetMedium,
    textAlign: 'center',
  },
  primaryButton: {
    flex: 1,
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    overflow: 'hidden',
  },
  primaryButtonFull: {
    width: '100%',
  },
  primaryGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryText: {
    fontFamily: fonts.CabinetBold,
    textAlign: 'center',
  },
});

export default VerificationModal;
