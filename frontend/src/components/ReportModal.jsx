import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { colors, moderateScale } from '../theme';
import { Text } from './base/Text';
import { matchesService } from '../api/services/matchesService';
import Toast from 'react-native-toast-message';

const ReportModal = ({ visible, onClose, onSubmit, isSubmitting = false }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [selectedReasonLabel, setSelectedReasonLabel] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);
  const [reasons, setReasons] = useState([]);
  const [isLoadingReasons, setIsLoadingReasons] = useState(false);
  const [reasonsError, setReasonsError] = useState(null);

  // Fetch report reasons when modal becomes visible
  useEffect(() => {
    if (visible) {
      fetchReportReasons();
    }
  }, [visible]);

  const fetchReportReasons = async () => {
    try {
      setIsLoadingReasons(true);
      setReasonsError(null);
      const response = await matchesService.getReportReasons();
      const fetchedReasons = response?.data?.data?.reasons || [];
      setReasons(fetchedReasons);
    } catch (err) {
      console.error('Error fetching report reasons:', err);
      const errorMessage = err?.response?.data?.message || 'Failed to load report reasons';
      setReasonsError(errorMessage);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setIsLoadingReasons(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedReason) {
      return;
    }
    onSubmit({
      reason: selectedReason,
      description: customReason.trim(),
    });
    setSelectedReasonLabel('');
    setCustomReason('');
  };

  const handleReasonSelect = (reasonId, reasonLabel) => {
    setSelectedReason(reasonId);
    setSelectedReasonLabel(reasonLabel);
    setShowReasonDropdown(false);
  };

  const handleClose = () => {
    setSelectedReason('');
    setSelectedReasonLabel('');
    setCustomReason('');
    setShowReasonDropdown(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            {/* Title and Description */}
            <View style={styles.header}>
              <Text ff="c-SemiBold" fs="XL" color="grey900" style={styles.title}>
                Please select a reason for reporting this user.
              </Text>
              <Text ff="c-Regular" fs="M" color="grey500" style={styles.subtitle}>
                We take reports seriously to ensure a safe community.
              </Text>
            </View>

            {/* Reason Dropdown */}
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowReasonDropdown(!showReasonDropdown)}
              activeOpacity={0.7}
              disabled={isLoadingReasons}>
              {isLoadingReasons ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Text
                    ff="c-Regular"
                    fs="M"
                    color={selectedReasonLabel ? 'grey900' : 'grey400'}
                    style={styles.dropdownText}>
                    {selectedReasonLabel || 'Select Reason'}
                  </Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Dropdown Options */}
            {showReasonDropdown && (
              <View style={styles.dropdownList}>
                <ScrollView
                  style={styles.dropdownScrollView}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}>
                  {reasons.map((reason) => (
                    <TouchableOpacity
                      key={reason.id}
                      style={[
                        styles.dropdownItem,
                        selectedReason === reason.id && styles.dropdownItemSelected,
                      ]}
                      onPress={() => handleReasonSelect(reason.id, reason.label)}
                      activeOpacity={0.7}>
                      <Text
                        ff="c-Regular"
                        fs="M"
                        color={selectedReason === reason.id ? 'primary' : 'grey800'}>
                        {reason.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Custom Reason Input */}
            <TextInput
              style={styles.textInput}
              placeholder="Type reason..."
              placeholderTextColor={colors.grey400}
              value={customReason}
              onChangeText={setCustomReason}
              multiline
              maxLength={500}
              textAlignVertical="top"
              returnKeyType="done"
              blurOnSubmit={true}
              onSubmitEditing={Keyboard.dismiss}
            />

            {/* Action Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                activeOpacity={0.7}
                disabled={isSubmitting}>
                <Text ff="c-SemiBold" fs="L" color="grey900">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!selectedReason || isSubmitting) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                activeOpacity={0.7}
                disabled={!selectedReason || isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text ff="c-SemiBold" fs="L" color="white">
                    Submit
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
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
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(24),
    paddingTop: moderateScale(24),
    paddingBottom: moderateScale(24),
    width: '100%',
    maxWidth: moderateScale(400),
  },
  header: {
    marginBottom: moderateScale(24),
  },
  title: {
    fontWeight: '600',
    marginBottom: moderateScale(8),
    lineHeight: moderateScale(26),
  },
  subtitle: {
    fontWeight: '400',
    lineHeight: moderateScale(20),
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grey200 || '#E5E7EB',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    marginBottom: moderateScale(16),
  },
  dropdownText: {
    flex: 1,
    fontWeight: '400',
  },
  dropdownIcon: {
    fontSize: moderateScale(12),
    color: colors.grey400,
    marginLeft: moderateScale(8),
  },
  dropdownList: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grey200 || '#E5E7EB',
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(16),
    maxHeight: moderateScale(200),
  },
  dropdownScrollView: {
    maxHeight: moderateScale(200),
  },
  dropdownItem: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.grey100 || '#F3F4F6',
  },
  dropdownItemSelected: {
    backgroundColor: colors.selectedItembgCOlor || '#F3E5F5',
  },
  textInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grey200 || '#E5E7EB',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    fontSize: moderateScale(15),
    color: colors.grey900,
    height: moderateScale(120),
    marginBottom: moderateScale(24),
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: moderateScale(12),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.grey100 || '#F3F4F6',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
});

export default ReportModal;
