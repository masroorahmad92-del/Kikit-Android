import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
  Clipboard,
  KeyboardAvoidingView,
} from 'react-native';
import {Text} from './base/Text';
import {BlockIcon, ReportIcon} from '../assets/icons';
import {colors, moderateScale} from '../theme';
import {matchesService} from '../api/services/matchesService';
import Toast from 'react-native-toast-message';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

// Step constants
const STEP_ACTIONS = 'actions';
const STEP_REPORT_FORM = 'report_form';

const MessageActionSheet = ({
  visible,
  onClose,
  message,
  currentUserId,
  channelId,
  onBlockUser,
  initialStep = STEP_ACTIONS,
}) => {
  const [step, setStep] = useState(STEP_ACTIONS);
  const [selectedReason, setSelectedReason] = useState('');
  const [selectedReasonLabel, setSelectedReasonLabel] = useState('');
  const [description, setDescription] = useState('');
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);
  const [reasons, setReasons] = useState([]);
  const [isLoadingReasons, setIsLoadingReasons] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  // Animation
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      const nextStep =
        initialStep === STEP_REPORT_FORM ? STEP_REPORT_FORM : STEP_ACTIONS;
      setStep(nextStep);
      setSelectedReason('');
      setSelectedReasonLabel('');
      setDescription('');
      setShowReasonDropdown(false);
      if (nextStep === STEP_REPORT_FORM) {
        fetchReportReasons();
      }
      // Slide in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideOut();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initialStep]);

  const slideOut = (callback) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  const handleClose = () => {
    slideOut(() => onClose());
  };

  const fetchReportReasons = async () => {
    try {
      setIsLoadingReasons(true);
      const response = await matchesService.getReportReasons();
      const fetchedReasons = response?.data?.data?.reasons || [];
      setReasons(fetchedReasons);
    } catch (err) {
      console.error('Failed to fetch report reasons:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load report reasons',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setIsLoadingReasons(false);
    }
  };

  const handleCopyText = () => {
    const text = message?.text || '';
    if (text) {
      Clipboard.setString(text);
      Toast.show({
        type: 'success',
        text1: 'Copied',
        text2: 'Message copied to clipboard',
        position: 'top',
        visibilityTime: 2000,
      });
    }
    handleClose();
  };

  const handleReportPress = () => {
    setStep(STEP_REPORT_FORM);
    fetchReportReasons();
  };

  const handleBlockSenderPress = async () => {
    if (!message?.user?.id || isBlocking) {
      return;
    }

    try {
      setIsBlocking(true);
      if (onBlockUser) {
        await onBlockUser(message.user);
      } else {
        await matchesService.blockUser(message.user.id);
      }
      handleClose();
    } catch (err) {
      console.error('Error blocking message sender:', err);
      Toast.show({
        type: 'error',
        text1: 'Block Failed',
        text2:
          err?.response?.data?.message ||
          'Failed to block user. Please try again.',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setIsBlocking(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!selectedReason) {
      Toast.show({
        type: 'error',
        text1: 'Select a reason',
        text2: 'Please select a reason before submitting.',
        position: 'top',
        visibilityTime: 2500,
      });
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = {
        message_id: message?.id,
        channel_id: channelId || message?.cid,
        reported_user_id: message?.user?.id,
        reason: selectedReason,
        description: description.trim(),
        message_text: message?.text || '',
      };
      await matchesService.reportMessage(payload);
      handleClose();
      setTimeout(() => {
        Toast.show({
          type: 'success',
          text1: 'Report Submitted',
          text2: 'Thank you for helping keep our community safe.',
          position: 'top',
          visibilityTime: 3000,
        });
      }, 400);
    } catch (err) {
      console.error('Error reporting message:', err);
      Toast.show({
        type: 'error',
        text1: 'Report Failed',
        text2:
          err?.response?.data?.message ||
          'Failed to submit report. Please try again.',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Truncate long messages for preview
  const messagePreview = (message?.text || '').length > 120
    ? (message?.text || '').substring(0, 120) + '...'
    : (message?.text || '');

  const isOwnMessage = message?.user?.id === currentUserId;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View
          style={[
            styles.backdrop,
            {opacity: backdropAnim},
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none">
        <Animated.View
          style={[
            styles.sheet,
            {transform: [{translateY: slideAnim}]},
          ]}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* ── STEP 1: Action menu ── */}
          {step === STEP_ACTIONS && (
            <>
              {/* Message preview bubble */}
              {messagePreview ? (
                <View style={styles.previewContainer}>
                  <View
                    style={[
                      styles.previewBubble,
                      isOwnMessage
                        ? styles.previewBubbleMine
                        : styles.previewBubbleOther,
                    ]}>
                    <Text style={isOwnMessage ? styles.previewTextMine : styles.previewTextOther}>
                      {messagePreview}
                    </Text>
                  </View>
                  <Text style={styles.previewSender}>
                    {isOwnMessage ? 'Your message' : message?.user?.name || 'Message'}
                  </Text>
                </View>
              ) : null}

              <View style={styles.divider} />

              {/* Actions */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={handleCopyText}
                  activeOpacity={0.7}>
                  <View style={styles.actionIconWrap}>
                    <Text style={styles.actionEmoji}>📋</Text>
                  </View>
                  <View style={styles.actionTextWrap}>
                    <Text style={styles.actionTitle}>Copy Text</Text>
                    <Text style={styles.actionSubtitle}>Copy message to clipboard</Text>
                  </View>
                </TouchableOpacity>

                {!isOwnMessage && (
                  <>
                    <View style={styles.actionSeparator} />
                    <TouchableOpacity
                      style={styles.actionRow}
                      onPress={handleReportPress}
                      activeOpacity={0.7}>
                      <View style={[styles.actionIconWrap, styles.actionIconWrapRed]}>
                        <ReportIcon width={20} height={20} />
                      </View>
                      <View style={styles.actionTextWrap}>
                        <Text style={[styles.actionTitle, styles.actionTitleRed]}>
                          Report Message
                        </Text>
                        <Text style={styles.actionSubtitle}>
                          Flag this message for review
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <View style={styles.actionSeparator} />
                    <TouchableOpacity
                      style={styles.actionRow}
                      onPress={handleBlockSenderPress}
                      disabled={isBlocking}
                      activeOpacity={0.7}>
                      <View style={[styles.actionIconWrap, styles.actionIconWrapRed]}>
                        <BlockIcon width={20} height={20} color="#FF2B1F" />
                      </View>
                      <View style={styles.actionTextWrap}>
                        <Text style={[styles.actionTitle, styles.actionTitleRed]}>
                          {isBlocking ? 'Blocking...' : 'Block Sender'}
                        </Text>
                        <Text style={styles.actionSubtitle}>
                          Stop chat and profile interactions
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Cancel */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                activeOpacity={0.7}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── STEP 2: Report form ── */}
          {step === STEP_REPORT_FORM && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {/* Header */}
              <View style={styles.formHeader}>
                <TouchableOpacity
                  style={styles.backChevron}
                  onPress={
                    initialStep === STEP_REPORT_FORM
                      ? handleClose
                      : () => setStep(STEP_ACTIONS)
                  }
                  activeOpacity={0.7}>
                  <Text style={styles.backChevronText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.formTitle}>Report Message</Text>
                <View style={styles.backChevron} />
              </View>

              {/* Message preview in form */}
              {messagePreview ? (
                <View style={styles.formPreview}>
                  <Text style={styles.formPreviewLabel}>Reporting:</Text>
                  <Text style={styles.formPreviewText} numberOfLines={3}>
                    "{messagePreview}"
                  </Text>
                </View>
              ) : null}

              {/* Reason selector */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Reason *</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowReasonDropdown(v => !v)}
                  activeOpacity={0.8}>
                  {isLoadingReasons ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text
                      style={
                        selectedReasonLabel
                          ? styles.dropdownValueSelected
                          : styles.dropdownPlaceholder
                      }>
                      {selectedReasonLabel || 'Select a reason...'}
                    </Text>
                  )}
                  <Text style={styles.dropdownChevron}>
                    {showReasonDropdown ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                {showReasonDropdown && reasons.length > 0 && (
                  <View style={styles.dropdownList}>
                    <ScrollView
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}
                      style={styles.dropdownScroll}>
                      {reasons.map((reason, idx) => (
                        <TouchableOpacity
                          key={reason.id || idx}
                          style={[
                            styles.dropdownOption,
                            selectedReason === (reason.id || reason.value) &&
                              styles.dropdownOptionSelected,
                          ]}
                          onPress={() => {
                            setSelectedReason(reason.id || reason.value);
                            setSelectedReasonLabel(reason.label || reason.name || reason.value);
                            setShowReasonDropdown(false);
                          }}
                          activeOpacity={0.7}>
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              selectedReason === (reason.id || reason.value) &&
                                styles.dropdownOptionTextSelected,
                            ]}>
                            {reason.label || reason.name || reason.value}
                          </Text>
                          {selectedReason === (reason.id || reason.value) && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Additional details */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Additional details (optional)</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Describe the issue..."
                  placeholderTextColor={colors.grey400 || '#999'}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>{description.length}/500</Text>
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!selectedReason || isSubmitting) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitReport}
                disabled={!selectedReason || isSubmitting}
                activeOpacity={0.8}>
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Report</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                activeOpacity={0.7}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <View style={styles.bottomPad} />
            </ScrollView>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default MessageActionSheet;

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingTop: moderateScale(10),
    paddingHorizontal: moderateScale(16),
    maxHeight: SCREEN_HEIGHT * 0.85,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -4},
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {elevation: 24},
    }),
  },
  handleBar: {
    width: moderateScale(40),
    height: moderateScale(4),
    backgroundColor: '#E0E0E0',
    borderRadius: moderateScale(2),
    alignSelf: 'center',
    marginBottom: moderateScale(16),
  },
  // ── Preview ──
  previewContainer: {
    marginBottom: moderateScale(12),
    paddingHorizontal: moderateScale(4),
  },
  previewBubble: {
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
    maxWidth: '80%',
  },
  previewBubbleMine: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: moderateScale(4),
  },
  previewBubbleOther: {
    backgroundColor: '#F0F0F5',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: moderateScale(4),
  },
  previewTextMine: {
    fontSize: moderateScale(14),
    color: '#fff',
    lineHeight: moderateScale(20),
  },
  previewTextOther: {
    fontSize: moderateScale(14),
    color: '#1A1A1A',
    lineHeight: moderateScale(20),
  },
  previewSender: {
    fontSize: moderateScale(11),
    color: colors.grey400 || '#999',
    marginTop: moderateScale(6),
    paddingHorizontal: moderateScale(4),
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: moderateScale(8),
  },
  // ── Actions ──
  actionsContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    marginBottom: moderateScale(12),
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(16),
    gap: moderateScale(14),
  },
  actionSeparator: {
    height: 1,
    backgroundColor: '#EFEFEF',
    marginHorizontal: moderateScale(16),
  },
  actionIconWrap: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#F0F0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconWrapRed: {
    backgroundColor: '#FFF0EF',
  },
  actionEmoji: {
    fontSize: moderateScale(18),
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: moderateScale(2),
  },
  actionTitleRed: {
    color: '#FF2B1F',
  },
  actionSubtitle: {
    fontSize: moderateScale(12),
    color: colors.grey400 || '#999',
  },
  // ── Cancel ──
  cancelButton: {
    alignItems: 'center',
    paddingVertical: moderateScale(16),
    backgroundColor: '#F5F5F5',
    borderRadius: moderateScale(14),
    marginBottom: moderateScale(12),
  },
  cancelText: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: colors.grey600 || '#555',
  },
  // ── Report form ──
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(20),
  },
  backChevron: {
    width: moderateScale(32),
    height: moderateScale(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevronText: {
    fontSize: moderateScale(28),
    color: colors.grey600 || '#555',
    lineHeight: moderateScale(32),
    fontWeight: '300',
  },
  formTitle: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    color: '#1A1A1A',
  },
  formPreview: {
    backgroundColor: '#F8F8FA',
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    marginBottom: moderateScale(20),
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  formPreviewLabel: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: colors.grey400 || '#999',
    marginBottom: moderateScale(4),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formPreviewText: {
    fontSize: moderateScale(14),
    color: '#555',
    fontStyle: 'italic',
    lineHeight: moderateScale(20),
  },
  fieldContainer: {
    marginBottom: moderateScale(20),
  },
  fieldLabel: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#444',
    marginBottom: moderateScale(8),
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(13),
    backgroundColor: '#FAFAFA',
    minHeight: moderateScale(50),
  },
  dropdownPlaceholder: {
    fontSize: moderateScale(14),
    color: colors.grey400 || '#999',
    flex: 1,
  },
  dropdownValueSelected: {
    fontSize: moderateScale(14),
    color: '#1A1A1A',
    fontWeight: '500',
    flex: 1,
  },
  dropdownChevron: {
    fontSize: moderateScale(10),
    color: colors.grey400 || '#999',
    marginLeft: moderateScale(8),
  },
  dropdownList: {
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: moderateScale(12),
    marginTop: moderateScale(4),
    backgroundColor: '#fff',
    overflow: 'hidden',
    maxHeight: moderateScale(180),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {elevation: 4},
    }),
  },
  dropdownScroll: {
    maxHeight: moderateScale(180),
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dropdownOptionSelected: {
    backgroundColor: colors.primary + '10',
  },
  dropdownOptionText: {
    fontSize: moderateScale(14),
    color: '#333',
    flex: 1,
  },
  dropdownOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: moderateScale(14),
    color: colors.primary,
    fontWeight: '700',
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    fontSize: moderateScale(14),
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
    minHeight: moderateScale(100),
    lineHeight: moderateScale(20),
  },
  charCount: {
    fontSize: moderateScale(11),
    color: colors.grey400 || '#999',
    textAlign: 'right',
    marginTop: moderateScale(4),
  },
  submitButton: {
    backgroundColor: '#FF2B1F',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(15),
    alignItems: 'center',
    marginBottom: moderateScale(12),
    ...Platform.select({
      ios: {
        shadowColor: '#FF2B1F',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {elevation: 4},
    }),
  },
  submitButtonDisabled: {
    backgroundColor: '#FFAAA6',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  bottomPad: {
    height: moderateScale(20),
  },
});
