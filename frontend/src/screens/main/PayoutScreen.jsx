import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import WebView from 'react-native-webview';
import {colors, moderateScale} from '../../theme';
import {Text} from '../../components/base/Text';
import {ArrowBack, Close, CloseIcon} from '../../assets/icons';
import {useKitkitStore} from '../../store/kitkitStore';
import {userService} from '../../api/services/userService';
import Toast from 'react-native-toast-message';

const PayoutScreen = ({navigation}) => {
  const {userProfile, setUserProfile} = useKitkitStore();

  // Recipient state
  const [isCheckingRecipient, setIsCheckingRecipient] = useState(true);
  const [complianceState, setComplianceState] = useState(null); // null | 'incomplete' | 'pending_payout_method' | 'pending_tax_review' | 'active'

  // Widget state
  const [widgetUrl, setWidgetUrl] = useState(null);
  const [showWebView, setShowWebView] = useState(false);
  const [isCreatingRecipient, setIsCreatingRecipient] = useState(false);

  // Payout request state
  const [diamonds, setDiamonds] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  // Diamond-to-USD conversion state
  const [conversionData, setConversionData] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const conversionTimer = useRef(null);
  const conversionRequestId = useRef(0);

  // Payout history state
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false);

  const diamondBalance = userProfile?.user?.diamond_balance || 0;

  const DIAMOND_RATE_USD = 0.01;
  const MIN_WITHDRAWAL_DIAMONDS = 10000;
  const MAX_WITHDRAWAL_DIAMONDS = 100000;

  // Debounced diamond-to-USD conversion
  useEffect(() => {
    const amount = parseInt(diamonds, 10);
    if (!diamonds || !amount || amount <= 0) {
      setConversionData(null);
      setIsConverting(false);
      if (conversionTimer.current) { clearTimeout(conversionTimer.current); }
      return;
    }

    // Show instant local estimate while API call is in flight
    setConversionData({
      diamonds: amount,
      usd_value: amount * DIAMOND_RATE_USD,
      diamond_price_usd: DIAMOND_RATE_USD,
    });
    setIsConverting(true);
    if (conversionTimer.current) { clearTimeout(conversionTimer.current); }

    conversionTimer.current = setTimeout(async () => {
      const requestId = ++conversionRequestId.current;
      try {
        const resp = await userService.convertDiamonds(amount);
        if (requestId !== conversionRequestId.current) { return; }
        const apiData = resp?.data?.data;
        if (apiData && apiData.usd_value != null) {
          setConversionData({
            diamonds: apiData.diamonds ?? amount,
            usd_value: Number(apiData.usd_value),
            diamond_price_usd: Number(apiData.diamond_price_usd ?? DIAMOND_RATE_USD),
          });
        }
      } catch {
        if (requestId !== conversionRequestId.current) { return; }
      } finally {
        if (requestId === conversionRequestId.current) {
          setIsConverting(false);
        }
      }
    }, 400);

    return () => { clearTimeout(conversionTimer.current); };
  }, [diamonds]);

  // Check recipient status and fetch history on focus
  useFocusEffect(
    useCallback(() => {
      checkRecipientStatus();
      fetchPayoutHistory(1);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const checkRecipientStatus = async () => {
    try {
      setIsCheckingRecipient(true);
      const response = await userService.getPayoutRecipient();
      const data = response?.data?.data;
      setComplianceState(data?.compliance_state || null);
    } catch (error) {
      console.log('Failed to check payout recipient:', error);
      setComplianceState(null);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to check payout account status.',
      });
    } finally {
      setIsCheckingRecipient(false);
    }
  };

  const handleSetupAccount = async () => {
    try {
      setIsCreatingRecipient(true);
      const response = await userService.createPayoutRecipient();
      const data = response?.data?.data;
      if (data?.widget_url) {
        setWidgetUrl(data.widget_url);
        setShowWebView(true);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to get payout setup link.',
        });
      }
    } catch (error) {
      console.log('Failed to create payout recipient:', error);
      Toast.show({
        type: 'error',
        text1: 'Setup Failed',
        text2: error?.message || 'Could not set up payout account. Please try again.',
      });
    } finally {
      setIsCreatingRecipient(false);
    }
  };

  const handleUpdateAccount = async () => {
    // Same flow as setup — backend returns a fresh widget_url
    await handleSetupAccount();
  };

  const handleCloseWebView = () => {
    setShowWebView(false);
    setWidgetUrl(null);
    // Re-check recipient status after widget interaction
    checkRecipientStatus();
  };

  const fetchPayoutHistory = async (page = 1) => {
    try {
      if (page === 1) {
        setIsLoadingHistory(true);
      } else {
        setIsLoadingMoreHistory(true);
      }
      const response = await userService.getPayoutHistory(page, 10);
      const data = response?.data?.data;
      if (data) {
        if (page === 1) {
          setPayoutHistory(data.items || []);
        } else {
          setPayoutHistory(prev => [...prev, ...(data.items || [])]);
        }
        setHistoryPage(data.page || 1);
        setHistoryTotalPages(data.pages || 1);
      }
    } catch (error) {
      console.log('Failed to fetch payout history:', error);
    } finally {
      setIsLoadingHistory(false);
      setIsLoadingMoreHistory(false);
    }
  };

  const loadMoreHistory = () => {
    if (!isLoadingMoreHistory && historyPage < historyTotalPages) {
      fetchPayoutHistory(historyPage + 1);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing':
        return colors.warning || '#F59E0B';
      case 'completed':
      case 'paid':
        return colors.success;
      case 'failed':
        return colors.danger || '#EF4444';
      default:
        return colors.grey400;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'processing':
        return 'Processing';
      case 'completed':
      case 'paid':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleRequestPayout = async () => {
    const amount = parseInt(diamonds, 10);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid number of diamonds.');
      return;
    }
    if (amount > diamondBalance) {
      Alert.alert(
        'Insufficient Diamonds',
        `You only have ${diamondBalance} diamonds. Please enter a smaller amount.`,
      );
      return;
    }

    const usdDisplay = conversionData?.usd_value != null ? ` (~$${conversionData.usd_value.toFixed(2)} USD)` : '';
    Alert.alert(
      'Confirm Payout',
      `Are you sure you want to cash out ${amount} diamonds${usdDisplay}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setIsRequesting(true);
              await userService.requestPayout(amount);
              Toast.show({
                type: 'success',
                text1: 'Payout Requested',
                text2: `Your payout of ${amount} diamonds has been submitted.`,
              });
              setDiamonds('');
              // Refresh profile to update diamond balance
              try {
                const profileResp = await userService.getMyProfile();
                const profileData = profileResp?.data?.data;
                if (profileData) {
                  setUserProfile(profileData);
                }
              } catch (profileErr) {
                console.log('Failed to refresh profile after payout:', profileErr);
              }
              // Refresh payout history
              fetchPayoutHistory(1);
            } catch (error) {
              console.log('Payout request failed:', error);
              let errorMessage = 'Something went wrong. Please try again.';
              if (error?.errors && Array.isArray(error.errors)) {
                const messages = error.errors.map(item => Object.values(item).join('')).join('\n');
                if (messages) {
                  errorMessage = messages;
                }
              } else if (error?.message) {
                errorMessage = error.message;
              }
              Toast.show({
                type: 'error',
                text2: 'Payout Failed',
                text1: errorMessage,
              });
            } finally {
              setIsRequesting(false);
            }
          },
        },
      ],
    );
  };

  const handleDiamondInput = (value) => {
    // Allow only digits
    const cleaned = value.replace(/[^0-9]/g, '');
    setDiamonds(cleaned);
  };

  const handleMaxPress = () => {
    setDiamonds(String(diamondBalance));
  };

  // Loading state
  if (isCheckingRecipient) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <ArrowBack width={24} height={24} stroke={colors.grey800} />
          </TouchableOpacity>
          <Text ff="c-Regular" fs="XL" color="grey800" style={styles.headerTitle}>
            Payout
          </Text>
          <View style={{width: 24}} />
        </View>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text ff="i-regular" fs="S" color="grey400" style={styles.loadingText}>
            Checking payout account...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <ArrowBack width={24} height={24} stroke={colors.grey800} />
        </TouchableOpacity>
        <Text ff="c-Regular" fs="XL" color="grey800" style={styles.headerTitle}>
          Payout
        </Text>
        <View style={{width: 24}} />
      </View>

      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">

        {/* Diamond Balance Card */}
        <View style={styles.balanceCard}>
          <Image
            source={require('../../assets/images/diamond.png')}
            style={styles.diamondIcon}
            resizeMode="contain"
          />
          <View style={styles.balanceInfo}>
            <Text ff="c-Regular" fs="XXL" color="grey800" style={styles.balanceAmount}>
              {diamondBalance}
            </Text>
            <Text ff="i-regular" fs="S" color="grey400">
              Available Diamonds
            </Text>
          </View>
        </View>

        {/* Account Status Section */}
        <View style={styles.section}>
          <Text ff="c-Regular" fs="L" color="grey800" style={styles.sectionTitle}>
            Payout Account
          </Text>

          {complianceState === null && (
            <View style={styles.accountCard}>
              <View style={styles.accountStatusRow}>
                <View style={[styles.statusDot, styles.statusInactive]} />
                <Text ff="i-regular" fs="S" color="grey400">
                  No payout account linked
                </Text>
              </View>
              <Text ff="i-regular" fs="XS" color="grey400" style={styles.accountDescription}>
                Set up your payout account to start withdrawing your earnings. You will be redirected to our secure payment partner.
              </Text>
              <TouchableOpacity
                style={styles.setupButton}
                onPress={handleSetupAccount}
                disabled={isCreatingRecipient}
                activeOpacity={0.8}>
                {isCreatingRecipient ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text ff="c-Regular" fs="M" color="white" style={styles.buttonText}>
                    Set Up Payout Account
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {complianceState === 'incomplete' && (
            <View style={styles.accountCard}>
              <View style={styles.accountStatusRow}>
                <View style={[styles.statusDot, {backgroundColor: colors.warning || '#F59E0B'}]} />
                <Text ff="i-regular" fs="S" color="grey800">
                  Setup incomplete
                </Text>
              </View>
              <Text ff="i-regular" fs="XS" color="grey400" style={styles.accountDescription}>
                Your payout setup has been started but is not finished. Please complete the setup to start receiving payouts.
              </Text>
              <TouchableOpacity
                style={styles.setupButton}
                onPress={handleSetupAccount}
                disabled={isCreatingRecipient}
                activeOpacity={0.8}>
                {isCreatingRecipient ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text ff="c-Regular" fs="M" color="white" style={styles.buttonText}>
                    Complete Your Payout Setup
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {complianceState === 'pending_payout_method' && (
            <View style={styles.accountCard}>
              <View style={styles.accountStatusRow}>
                <View style={[styles.statusDot, {backgroundColor: colors.warning || '#F59E0B'}]} />
                <Text ff="i-regular" fs="S" color="grey800">
                  Payout method required
                </Text>
              </View>
              <Text ff="i-regular" fs="XS" color="grey400" style={styles.accountDescription}>
                Your compliance has been approved but you still need to link a bank account or PayPal to receive payouts.
              </Text>
              <TouchableOpacity
                style={styles.setupButton}
                onPress={handleSetupAccount}
                disabled={isCreatingRecipient}
                activeOpacity={0.8}>
                {isCreatingRecipient ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text ff="c-Regular" fs="M" color="white" style={styles.buttonText}>
                    Add Payout Method
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {complianceState === 'pending_tax_review' && (
            <View style={styles.accountCard}>
              <View style={styles.accountStatusRow}>
                <View style={[styles.statusDot, {backgroundColor: colors.warning || '#F59E0B'}]} />
                <Text ff="i-regular" fs="S" color="grey800">
                  Under review
                </Text>
              </View>
              <Text ff="i-regular" fs="XS" color="grey400" style={styles.accountDescription}>
                Your tax form has been submitted and is waiting for admin approval. You will be able to request payouts once the review is complete.
              </Text>
            </View>
          )}

          {complianceState === 'active' && (
            <View style={styles.accountCard}>
              <View style={styles.accountStatusRow}>
                <View style={[styles.statusDot, styles.statusActive]} />
                <Text ff="i-regular" fs="S" color="grey800">
                  Payout account active
                </Text>
              </View>
              <Text ff="i-regular" fs="XS" color="grey400" style={styles.accountDescription}>
                Your payout account is fully set up. You can update your payment details or request a payout below.
              </Text>
              <TouchableOpacity
                style={styles.updateButton}
                onPress={handleUpdateAccount}
                disabled={isCreatingRecipient}
                activeOpacity={0.8}>
                {isCreatingRecipient ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text ff="c-Regular" fs="S" color="primary" style={styles.buttonText}>
                    Update Payment Details
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Request Payout Section */}
        {complianceState === 'active' && (
          <View style={styles.section}>
            <Text ff="c-Regular" fs="L" color="grey800" style={styles.sectionTitle}>
              Request Payout
            </Text>

            <View style={styles.payoutCard}>
              <Text ff="i-regular" fs="S" color="grey400" style={styles.inputLabel}>
                Diamonds to cash out
              </Text>

              <View style={styles.limitsInfo}>
                <Text ff="i-regular" fs="XS" color="grey400">
                  Min: {MIN_WITHDRAWAL_DIAMONDS.toLocaleString()} 💎 ($
                  {(MIN_WITHDRAWAL_DIAMONDS * DIAMOND_RATE_USD).toFixed(0)})
                </Text>
                <Text ff="i-regular" fs="XS" color="grey400">
                  Max: {MAX_WITHDRAWAL_DIAMONDS.toLocaleString()} 💎 ($
                  {(MAX_WITHDRAWAL_DIAMONDS * DIAMOND_RATE_USD).toLocaleString()})
                </Text>
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputWrapper}>
                  <Image
                    source={require('../../assets/images/diamond.png')}
                    style={styles.inputIcon}
                    resizeMode="contain"
                  />
                  <TextInput
                    style={styles.diamondInput}
                    value={diamonds}
                    onChangeText={handleDiamondInput}
                    placeholder="0"
                    placeholderTextColor={colors.grey300}
                    keyboardType="number-pad"
                    maxLength={10}
                    returnKeyType="done"
                  />
                </View>
                <TouchableOpacity
                  style={styles.maxButton}
                  onPress={handleMaxPress}
                  activeOpacity={0.7}>
                  <Text ff="c-Regular" fs="XS" color="primary" style={styles.maxText}>
                    MAX
                  </Text>
                </TouchableOpacity>
              </View>

              {diamonds !== '' && parseInt(diamonds, 10) > diamondBalance && (
                <Text ff="i-regular" fs="XS" color="danger" style={styles.errorText}>
                  You don't have enough diamonds
                </Text>
              )}
              {diamonds !== '' && parseInt(diamonds, 10) > 0 && parseInt(diamonds, 10) < MIN_WITHDRAWAL_DIAMONDS && (
                <Text ff="i-regular" fs="XS" color="danger" style={styles.errorText}>
                  Minimum withdrawal is {MIN_WITHDRAWAL_DIAMONDS.toLocaleString()} diamonds (${(MIN_WITHDRAWAL_DIAMONDS * DIAMOND_RATE_USD).toFixed(0)})
                </Text>
              )}
              {diamonds !== '' && parseInt(diamonds, 10) > MAX_WITHDRAWAL_DIAMONDS && (
                <Text ff="i-regular" fs="XS" color="danger" style={styles.errorText}>
                  Maximum withdrawal is {MAX_WITHDRAWAL_DIAMONDS.toLocaleString()} diamonds (${(MAX_WITHDRAWAL_DIAMONDS * DIAMOND_RATE_USD).toLocaleString()})
                </Text>
              )}

              {/* Real-time USD conversion display */}
              {diamonds !== '' && parseInt(diamonds, 10) > 0 && conversionData != null && (
                <View style={styles.conversionRow}>
                  <Text ff="i-regular" fs="XS" color="grey400" style={styles.conversionLabel}>
                    Estimated payout
                  </Text>
                  <View style={styles.conversionAmountRow}>
                    <Text ff="c-Regular" fs="XXL" color="grey800" style={styles.conversionAmount}>
                      ${conversionData.usd_value.toFixed(2)}
                    </Text>
                    <Text ff="c-Regular" fs="S" color="grey400" style={styles.conversionCurrency}>
                      {' '}USD
                    </Text>
                    {isConverting && (
                      <ActivityIndicator size="small" color={colors.primary} style={styles.conversionSpinner} />
                    )}
                  </View>
                  <View style={styles.conversionBreakdown}>
                    <Text ff="i-regular" fs="XS" color="grey400">
                      {conversionData.diamonds} 💎 × ${conversionData.diamond_price_usd.toFixed(2)} per diamond
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.payoutButton,
                  (!diamonds || parseInt(diamonds, 10) < MIN_WITHDRAWAL_DIAMONDS || parseInt(diamonds, 10) > MAX_WITHDRAWAL_DIAMONDS || parseInt(diamonds, 10) > diamondBalance || isRequesting) &&
                    styles.payoutButtonDisabled,
                ]}
                onPress={handleRequestPayout}
                disabled={!diamonds || parseInt(diamonds, 10) < MIN_WITHDRAWAL_DIAMONDS || parseInt(diamonds, 10) > MAX_WITHDRAWAL_DIAMONDS || parseInt(diamonds, 10) > diamondBalance || isRequesting}
                activeOpacity={0.8}>
                {isRequesting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text ff="c-Regular" fs="M" color="white" style={styles.buttonText}>
                    Request Payout
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Payout History Section */}
        <View style={styles.section}>
          <Text ff="c-Regular" fs="L" color="grey800" style={styles.sectionTitle}>
            Payout History
          </Text>

          {isLoadingHistory ? (
            <View style={styles.historyLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : payoutHistory.length === 0 ? (
            <View style={styles.historyEmpty}>
              <Text ff="i-regular" fs="S" color="grey300">
                No payout history yet
              </Text>
            </View>
          ) : (
            <>
              {payoutHistory.map((item) => (
                <View key={item.id} style={styles.historyItem}>
                  <View style={styles.historyItemLeft}>
                    <View style={styles.historyDiamondRow}>
                      <Image
                        source={require('../../assets/images/diamond.png')}
                        style={styles.historyDiamondIcon}
                        resizeMode="contain"
                      />
                      <Text ff="c-Regular" fs="M" color="grey800" style={styles.historyDiamonds}>
                        {item.diamonds_redeemed}
                      </Text>
                    </View>
                    <Text ff="i-regular" fs="XS" color="grey400">
                      {formatDate(item.created_at)}
                    </Text>
                    {item.failure_reason && (
                      <Text ff="i-regular" fs="XS" color="danger" style={styles.failureReason}>
                        {item.failure_reason}
                      </Text>
                    )}
                  </View>
                  <View style={styles.historyItemRight}>
                    <Text ff="c-Regular" fs="S" color="grey800" style={styles.historyAmount}>
                      ${item.amount_usd}
                    </Text>
                    <View style={[styles.historyStatusBadge, {backgroundColor: getStatusColor(item.status) + '20'}]}>
                      <View style={[styles.historyStatusDot, {backgroundColor: getStatusColor(item.status)}]} />
                      <Text ff="i-regular" fs="XS" style={{color: getStatusColor(item.status)}}>
                        {getStatusLabel(item.status)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
              {historyPage < historyTotalPages && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={loadMoreHistory}
                  disabled={isLoadingMoreHistory}
                  activeOpacity={0.7}>
                  {isLoadingMoreHistory ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text ff="c-Regular" fs="S" color="primary">
                      Load More
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={{height: 40}} />
      </ScrollView>
      </KeyboardAvoidingView>

      {/* WebView Modal for Trolley Widget */}
      <Modal
        visible={showWebView}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseWebView}>
        <SafeAreaView style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <Text ff="c-Regular" fs="L" color="grey800" style={styles.webViewTitle}>
              Payout Setup
            </Text>
            <TouchableOpacity
              onPress={handleCloseWebView}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              {/* <Close width={24} height={24} stroke={colors.grey800} /> */}
                     <CloseIcon
                                    width={moderateScale(18)}
                                    height={moderateScale(18)}
                                    fill={colors.grey800}
                                  />

            </TouchableOpacity>
          </View>
          {widgetUrl && (
            <WebView
              source={{uri: widgetUrl}}
              style={styles.webView}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text ff="i-regular" fs="S" color="grey400" style={styles.loadingText}>
                    Loading payment setup...
                  </Text>
                </View>
              )}
              onError={(syntheticEvent) => {
                const {nativeEvent} = syntheticEvent;
                console.log('WebView error:', nativeEvent);
                Toast.show({
                  type: 'error',
                  text1: 'Loading Error',
                  text2: 'Failed to load payment setup. Please try again.',
                });
              }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(14),
  },
  headerTitle: {
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: moderateScale(20),
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: moderateScale(12),
    textAlign: 'center',
  },

  // Balance Card
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.selectedItembgCOlor,
    marginHorizontal: moderateScale(20),
    marginBottom: moderateScale(24),
    paddingVertical: moderateScale(20),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  diamondIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
  },
  balanceInfo: {
    marginLeft: moderateScale(14),
  },
  balanceAmount: {
    fontWeight: '700',
    marginBottom: moderateScale(2),
  },

  // Sections
  section: {
    paddingHorizontal: moderateScale(20),
    marginBottom: moderateScale(24),
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: moderateScale(12),
  },

  // Account Card
  accountCard: {
    backgroundColor: colors.grey50 || '#F6F7F8',
    borderRadius: moderateScale(14),
    padding: moderateScale(18),
    borderWidth: 1,
    borderColor: colors.grey100,
  },
  accountStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  statusDot: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    marginRight: moderateScale(8),
  },
  statusActive: {
    backgroundColor: colors.success,
  },
  statusInactive: {
    backgroundColor: colors.grey300,
  },
  accountDescription: {
    lineHeight: moderateScale(20),
    marginBottom: moderateScale(16),
  },
  setupButton: {
    backgroundColor: colors.primary,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButton: {
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '600',
  },

  // Payout Card
  payoutCard: {
    backgroundColor: colors.grey50 || '#F6F7F8',
    borderRadius: moderateScale(14),
    padding: moderateScale(18),
    borderWidth: 1,
    borderColor: colors.grey100,
  },
  inputLabel: {
    marginBottom: moderateScale(6),
  },
  limitsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(10),
    paddingHorizontal: moderateScale(2),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: colors.grey200,
    paddingHorizontal: moderateScale(12),
    height: moderateScale(48),
  },
  inputIcon: {
    width: moderateScale(22),
    height: moderateScale(22),
    marginRight: moderateScale(8),
  },
  diamondInput: {
    flex: 1,
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: colors.grey800,
    padding: 0,
  },
  maxButton: {
    marginLeft: moderateScale(10),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(10),
    backgroundColor: colors.selectedItembgCOlor,
  },
  maxText: {
    fontWeight: '700',
  },
  errorText: {
    marginBottom: moderateScale(8),
  },
  conversionRow: {
    marginBottom: moderateScale(14),
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(16),
    backgroundColor: colors.white,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: colors.grey100,
    alignItems: 'center',
  },
  conversionLabel: {
    marginBottom: moderateScale(4),
  },
  conversionAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  conversionAmount: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  conversionCurrency: {
    fontWeight: '500',
  },
  conversionSpinner: {
    marginLeft: moderateScale(8),
  },
  conversionBreakdown: {
    marginTop: moderateScale(6),
    paddingTop: moderateScale(6),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.grey100,
    width: '100%',
    alignItems: 'center',
  },
  payoutButton: {
    backgroundColor: colors.secondary,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutButtonDisabled: {
    opacity: 0.5,
  },

  // WebView Modal
  webViewContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(14),
    borderBottomWidth: 1,
    borderBottomColor: colors.grey100,
  },
  webViewTitle: {
    fontWeight: '600',
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },

  // Payout History
  historyLoading: {
    paddingVertical: moderateScale(24),
    alignItems: 'center',
  },
  historyEmpty: {
    paddingVertical: moderateScale(24),
    alignItems: 'center',
    backgroundColor: colors.grey50 || '#F6F7F8',
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: colors.grey100,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.grey50 || '#F6F7F8',
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    marginBottom: moderateScale(10),
    borderWidth: 1,
    borderColor: colors.grey100,
  },
  historyItemLeft: {
    flex: 1,
    marginRight: moderateScale(12),
  },
  historyDiamondRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  historyDiamondIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
    marginRight: moderateScale(6),
  },
  historyDiamonds: {
    fontWeight: '700',
  },
  failureReason: {
    marginTop: moderateScale(4),
  },
  historyItemRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontWeight: '700',
    marginBottom: moderateScale(4),
  },
  historyStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
  },
  historyStatusDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    marginRight: moderateScale(5),
  },
  loadMoreButton: {
    alignItems: 'center',
    paddingVertical: moderateScale(12),
  },
});

export default PayoutScreen;
