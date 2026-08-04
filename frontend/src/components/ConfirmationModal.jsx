import React from 'react';
import {Modal, View, StyleSheet, TouchableOpacity, Pressable} from 'react-native';
import {Text} from './base/Text';
import {colors, moderateScale} from '../theme';
import LinearGradient from 'react-native-linear-gradient';

const ConfirmationModal = ({
  visible,
  onClose,
  icon,
  title,
  message,
  confirmText = 'Yes',
  cancelText = 'No',
  onConfirm,
  onCancel,
  loading = false,
  emphasizeCancel = false,
}) => {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={e => e.stopPropagation()}>
          {/* Icon */}
          {icon && (
            <View style={styles.iconContainer}>
              {icon}
            </View>
          )}

          {/* Title */}
          <Text ff="c-Regular" fs="XXL" color="grey800" style={styles.title}>
            {title}
          </Text>

          {/* Message */}
          {message && (
            <Text ff="c-Regular" fs="S" color="grey400" style={styles.message}>
              {message}
            </Text>
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {emphasizeCancel ? (
              <>
                {/* Confirm (destructive) on left, de-emphasized */}
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleConfirm}
                  activeOpacity={0.8}
                  disabled={loading}>
                  <Text ff="c-Regular" fs="M" color="grey800" style={styles.cancelText}>
                    {loading ? 'Loading...' : confirmText}
                  </Text>
                </TouchableOpacity>

                {/* Cancel (safe) on right, emphasized */}
                <TouchableOpacity
                  style={styles.confirmButtonWrapper}
                  onPress={handleCancel}
                  activeOpacity={0.8}>
                  <LinearGradient
                    colors={[colors.secondary, colors.primary]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.confirmButton}>
                    <Text ff="c-Regular" fs="M" style={styles.confirmText}>
                      {cancelText}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Cancel Button */}
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  activeOpacity={0.8}>
                  <Text ff="c-Regular" fs="M" color="grey800" style={styles.cancelText}>
                    {cancelText}
                  </Text>
                </TouchableOpacity>

                {/* Confirm Button */}
                <TouchableOpacity
                  style={styles.confirmButtonWrapper}
                  onPress={handleConfirm}
                  activeOpacity={0.8}
                  disabled={loading}>
                  <LinearGradient
                    colors={[colors.secondary, colors.primary]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.confirmButton}>
                    <Text ff="c-Regular" fs="M" style={styles.confirmText}>
                      {loading ? 'Loading...' : confirmText}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(24),
    paddingVertical: moderateScale(32),
    paddingHorizontal: moderateScale(24),
    width: '85%',
    maxWidth: moderateScale(340),
    alignItems: 'center',
    shadowColor: colors.grey800,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: moderateScale(20),
  },
  title: {
    fontWeight: '700',
    marginBottom: moderateScale(12),
    textAlign: 'center',
  },
  message: {
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: moderateScale(20),
    marginBottom: moderateScale(24),
    paddingHorizontal: moderateScale(8),
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: moderateScale(3),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.grey100,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(25),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontWeight: '600',
  },
  confirmButtonWrapper: {
    flex: 1,
  },
  confirmButton: {
    height: moderateScale(50),
    borderRadius: moderateScale(35),
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontWeight: '700',
    color: colors.white,
  },
});

export default ConfirmationModal;

