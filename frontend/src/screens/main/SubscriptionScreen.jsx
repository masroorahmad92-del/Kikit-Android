import React, {useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import {colors, moderateScale} from '../../theme';
import {Text} from '../../components/base/Text';
import {ArrowBack, StarIcon, CheckDouble, PhoneIcon} from '../../assets/icons';
import useSubscription from '../../hooks/useSubscription';
import {useKitkitStore} from '../../store/kitkitStore';
import Toast from 'react-native-toast-message';

const PRIVACY_POLICY_URL = 'https://www.letskikit.com/privacy';
const TERMS_URL = 'https://www.letskikit.com/terms';

// Apple requires link to manage subscriptions
const MANAGE_SUBSCRIPTIONS_URL = Platform.select({
  ios: 'https://apps.apple.com/account/subscriptions',
  android:
    'https://play.google.com/store/account/subscriptions',
});

const MONTHLY_FEATURES = [
  '1 call per month',
  'Max 10 minutes per call',
];

const ANNUAL_FEATURES = [
  'Unlimited calls',
  'No time limit on calls',
  'Best value',
];

const EXTRA_CALL_FEATURES = [
  '1 extra call',
  'Max 10 minutes per call',
  'One-time purchase',
];

const SubscriptionScreen = ({navigation}) => {
  const {
    products,
    extraCallProduct,
    isLoading,
    isPurchasing,
    isPremium,
    activePlan,
    error,
    handleSubscribe,
    handlePurchaseExtraCall,
    restorePurchases,
    fetchSubscriptions,
  } = useSubscription();

  const {userProfile} = useKitkitStore();
  const purchasedCalls = userProfile?.purchased_calls || 0;

  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Auto-select annual plan as best value (or first available)
  React.useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      const annual = products.find(p =>
        p.identifier.includes('annual'),
      );
      setSelectedProductId(annual?.identifier || products[0]?.identifier);
    }
  }, [products, selectedProductId]);

  const selectedProduct = products.find(
    p => p.identifier === selectedProductId,
  );

  const getSubscriptionTitle = identifier => {
    if (identifier?.includes('annual')) return 'Kikit Premium — Annual';
    if (identifier?.includes('monthly')) return 'Kikit Premium — Monthly';
    return 'Kikit Premium';
  };

  const getSubscriptionPeriod = identifier => {
    if (identifier?.includes('annual')) return 'year';
    if (identifier?.includes('monthly')) return 'month';
    return '';
  };

  const getSubscriptionLengthLabel = identifier => {
    if (identifier?.includes('annual')) return '1 year';
    if (identifier?.includes('monthly')) return '1 month';
    return '';
  };

  const getSubscriptionLabel = identifier => {
    if (identifier?.includes('annual')) return 'Annual';
    if (identifier?.includes('monthly')) return 'Monthly';
    return '';
  };

  const getMonthlyCost = product => {
    if (!product?.price) return '';
    if (product.identifier?.includes('annual')) {
      return `${product.currencyCode} ${(product.price / 12).toFixed(2)}/mo`;
    }
    return `${product.currencyCode} ${product.price.toFixed(2)}/mo`;
  };

  const getSavingsText = () => {
    const monthly = products.find(p => p.identifier.includes('monthly'));
    const annual = products.find(p => p.identifier.includes('annual'));
    if (!monthly?.price || !annual?.price) return null;
    const monthlyCostPerYear = monthly.price * 12;
    const savings = Math.round(
      ((monthlyCostPerYear - annual.price) / monthlyCostPerYear) * 100,
    );
    if (savings > 0) return `Save ${savings}%`;
    return null;
  };

  const onPurchase = useCallback(async () => {
    if (!selectedProduct) return;
    const result = await handleSubscribe(selectedProduct);
    if (result.success) {
      Toast.show({
        type: 'success',
        text1: 'Welcome to Premium!',
        text2: 'You now have access to all premium features.',
      });
      navigation.goBack();
    } else if (result.cancelled) {
      // User cancelled — do nothing
    } else {
      Toast.show({
        type: 'error',
        text1: 'Purchase Failed',
        text2: 'Something went wrong. Please try again.',
      });
    }
  }, [selectedProduct, handleSubscribe, navigation]);

  const onRestore = useCallback(async () => {
    setIsRestoring(true);
    const restored = await restorePurchases();
    setIsRestoring(false);
    if (restored) {
      Toast.show({
        type: 'success',
        text1: 'Purchases Restored',
        text2: 'Your premium subscription has been restored.',
      });
      navigation.goBack();
    } else {
      Alert.alert(
        'No Active Subscription',
        'We could not find an active subscription for your account. If you believe this is an error, please contact support.',
        [{text: 'OK'}],
      );
    }
  }, [restorePurchases, navigation]);

  const handleRetry = useCallback(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const onPurchaseExtraCall = useCallback(async () => {
    const result = await handlePurchaseExtraCall();
    if (result.success) {
      Toast.show({
        type: 'success',
        text1: 'Extra Call Purchased!',
        text2: 'You now have 1 extra call available (10 min max).',
      });
    } else if (result.warning) {
      Alert.alert('Cannot Purchase', result.message, [{text: 'OK'}]);
    } else if (result.cancelled) {
      // User cancelled — do nothing
    } else if (result.error) {
      Toast.show({
        type: 'error',
        text1: 'Purchase Failed',
        text2: typeof result.error === 'string' ? result.error : 'Something went wrong. Please try again.',
      });
    }
  }, [handlePurchaseExtraCall]);

  const isSelectedPlanDifferent =
    isPremium &&
    selectedProductId &&
    ((activePlan === 'annual' && selectedProductId.includes('monthly')) ||
      (activePlan === 'monthly' && selectedProductId.includes('annual')));

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
          {isPremium ? 'Premium' : 'Go Premium'}
        </Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Hero section */}
        <View style={styles.heroSection}>
          {isPremium ? (
            <>
              <View style={styles.premiumBadge}>
                <StarIcon width={48} height={48} fill={colors.primary} />
              </View>
              <Text ff="c-Regular" fs="XXL" color="grey800" style={styles.heroTitle}>
                You're Premium!
              </Text>
              <Text ff="i-regular" fs="M" color="grey400" style={styles.heroSubtitle}>
                Current Plan:{' '}
                {activePlan === 'annual'
                  ? 'Annual'
                  : activePlan === 'monthly'
                  ? 'Monthly'
                  : 'Premium'}
              </Text>
            </>
          ) : (
            <>
              <StarIcon width={56} height={56} fill={colors.primary} />
              <Text ff="c-Regular" fs="XXL" color="grey800" style={styles.heroTitle}>
                Unlock Premium
              </Text>
              <Text ff="i-regular" fs="M" color="grey400" style={styles.heroSubtitle}>
                Get the full kikit experience with premium features
              </Text>
            </>
          )}
        </View>

        {/* Features comparison */}
        <View style={styles.featuresSection}>
          <Text ff="c-Regular" fs="L" color="grey800" style={styles.sectionTitle}>
            Compare plans
          </Text>

          {/* Monthly plan features */}
          <View style={styles.planFeaturesCard}>
            <View style={styles.planFeaturesHeader}>
              <PhoneIcon width={18} height={18} stroke={colors.secondary} />
              <Text ff="c-Regular" fs="M" color="grey800" style={styles.planFeaturesTitle}>
                Monthly
              </Text>
            </View>
            {MONTHLY_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <CheckDouble width={18} height={18} stroke={colors.secondary} />
                <Text ff="i-regular" fs="S" color="grey800" style={styles.featureText}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {/* Annual plan features */}
          <View style={[styles.planFeaturesCard, styles.planFeaturesCardHighlighted]}>
            <View style={styles.recommendedTag}>
              <Text ff="i-bold" fs="XXS" color="white">
                RECOMMENDED
              </Text>
            </View>
            <View style={styles.planFeaturesHeader}>
              <StarIcon width={18} height={18} fill={colors.primary} />
              <Text ff="c-Regular" fs="M" color="grey800" style={styles.planFeaturesTitle}>
                Annual
              </Text>
            </View>
            {ANNUAL_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <CheckDouble width={18} height={18} stroke={colors.primary} />
                <Text ff="i-regular" fs="S" color="grey800" style={styles.featureText}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {/* Extra Call option */}
          <View style={styles.planFeaturesCard}>
            <View style={styles.planFeaturesHeader}>
              <PhoneIcon width={18} height={18} stroke={colors.secondary} />
              <Text ff="c-Regular" fs="M" color="grey800" style={styles.planFeaturesTitle}>
                Extra Call
              </Text>
            </View>
            {EXTRA_CALL_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <CheckDouble width={18} height={18} stroke={colors.secondary} />
                <Text ff="i-regular" fs="S" color="grey800" style={styles.featureText}>
                  {feature}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Loading state */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text ff="i-regular" fs="S" color="grey400" style={styles.loadingText}>
              Loading subscription options...
            </Text>
          </View>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <View style={styles.errorContainer}>
            <Text ff="i-regular" fs="S" color="danger" style={styles.errorText}>
              {error}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text ff="c-Regular" fs="S" color="primary">
                Retry
              </Text>
            </TouchableOpacity>
            {Platform.OS === 'android' && error.includes('Android subscriptions') && (
              <Text ff="i-regular" fs="XXS" color="grey400" style={styles.configHint}>
                Purchases on Android require the Play Store billing setup and RevenueCat Android key.
              </Text>
            )}
          </View>
        )}

        {/* Plan cards */}
        {!isLoading && products.length > 0 && (
          <View style={styles.plansSection}>
            <Text
              ff="c-Regular"
              fs="L"
              color="grey800"
              style={styles.sectionTitle}>
              Choose your plan
            </Text>

            {products.map(product => {
              const isSelected = selectedProductId === product.identifier;
              const isAnnual = product.identifier.includes('annual');
              const isCurrentPlan =
                isPremium &&
                ((activePlan === 'annual' && isAnnual) ||
                  (activePlan === 'monthly' && !isAnnual));
              const savings = isAnnual ? getSavingsText() : null;

              return (
                <TouchableOpacity
                  key={product.identifier}
                  style={[
                    styles.planCard,
                    isSelected && styles.planCardSelected,
                  ]}
                  onPress={() => setSelectedProductId(product.identifier)}
                  activeOpacity={0.7}>
                  {isCurrentPlan && (
                    <View style={styles.currentPlanBadge}>
                      <Text ff="i-bold" fs="XXS" color="white">
                        Current Plan
                      </Text>
                    </View>
                  )}
                  {!isCurrentPlan && savings && (
                    <View style={styles.savingsBadge}>
                      <Text ff="i-bold" fs="XXS" color="white">
                        {savings}
                      </Text>
                    </View>
                  )}

                  <View style={styles.planRadio}>
                    <View
                      style={[
                        styles.radioOuter,
                        isSelected && styles.radioOuterSelected,
                      ]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </View>

                  <View style={styles.planInfo}>
                    <Text
                      ff="c-Regular"
                      fs="L"
                      color="grey800"
                      style={styles.planName}>
                      {getSubscriptionLabel(product.identifier)}
                    </Text>
                    <Text ff="i-regular" fs="XS" color="grey400">
                      {getMonthlyCost(product)}
                    </Text>
                    {isAnnual ? (
                      <Text ff="i-regular" fs="XXS" color="primary" style={styles.planPerk}>
                        Unlimited calls
                      </Text>
                    ) : (
                      <Text ff="i-regular" fs="XXS" color="secondary" style={styles.planPerk}>
                        1 call/mo • 10 min max
                      </Text>
                    )}
                  </View>

                  <View style={styles.planPrice}>
                    <Text ff="c-Regular" fs="L" color="grey800">
                      {product.priceString}
                    </Text>
                    <Text ff="i-regular" fs="XS" color="grey400">
                      /{getSubscriptionPeriod(product.identifier)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Extra Call Purchase Section */}
        {extraCallProduct && (
          <View style={styles.plansSection}>
            <Text
              ff="c-Regular"
              fs="L"
              color="grey800"
              style={styles.sectionTitle}>
              Or buy a single call
            </Text>

            <View style={[styles.planCard, styles.extraCallCard]}>
              <View style={styles.planInfo}>
                <Text
                  ff="c-Regular"
                  fs="L"
                  color="grey800"
                  style={styles.planName}>
                  Extra Call (1 Call)
                </Text>
                <Text ff="i-regular" fs="XS" color="grey400">
                  One-time purchase
                </Text>
                <Text ff="i-regular" fs="XXS" color="secondary" style={styles.planPerk}>
                  10 min max • No subscription needed
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.extraCallBuyButton,
                  isPurchasing && styles.subscribeButtonDisabled,
                ]}
                onPress={onPurchaseExtraCall}
                disabled={isPurchasing}
                activeOpacity={0.8}>
                {isPurchasing ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text ff="c-Regular" fs="S" color="white">
                    {extraCallProduct.priceString}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {purchasedCalls > 0 && (
              <Text ff="i-regular" fs="XS" color="secondary" style={styles.extraCallNote}>
                You have {purchasedCalls} extra call{purchasedCalls > 1 ? 's' : ''} available
              </Text>
            )}
          </View>
        )}

        {/* Apple-required subscription details */}
        <View style={styles.legalSection}>
          {selectedProduct && (
            <Text
              ff="i-regular"
              fs="XXS"
              color="grey400"
              style={styles.legalText}>
              {`Subscription automatically renews every ${getSubscriptionPeriod(
                selectedProduct.identifier,
              )} at ${
                selectedProduct.priceString
              } unless cancelled at least 24 hours before the end of the current period. Your Apple ID account will be charged for renewal within 24 hours prior to the end of the current period. You can manage and cancel your subscriptions by going to your App Store account settings after purchase.`}
            </Text>
          )}

          {/* Apple requires these links */}
          <View style={styles.legalLinks}>
            <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
              <Text ff="i-regular" fs="XXS" color="primary">
                Terms of Use
              </Text>
            </TouchableOpacity>
            <Text ff="i-regular" fs="XXS" color="grey300">
              {' '}
              |{' '}
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
              <Text ff="i-regular" fs="XXS" color="primary">
                Privacy Policy
              </Text>
            </TouchableOpacity>
            <Text ff="i-regular" fs="XXS" color="grey300">
              {' '}
              |{' '}
            </Text>
            <TouchableOpacity
              onPress={() =>
                Linking.openURL('https://www.letskikit.com/contact')
              }>
              <Text ff="i-regular" fs="XXS" color="primary">
                Contact Us
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Manage Subscription link for premium users */}
        {isPremium && (
          <View style={styles.manageSection}>
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => Linking.openURL(MANAGE_SUBSCRIPTIONS_URL)}>
              <Text ff="c-Regular" fs="M" color="primary">
                Manage Subscription
              </Text>
            </TouchableOpacity>
            <Text
              ff="i-regular"
              fs="XXS"
              color="grey400"
              style={styles.manageHint}>
              Upgrade, downgrade, or cancel your plan via{' '}
              {Platform.OS === 'ios' ? 'App Store' : 'Google Play'} settings.
            </Text>
          </View>
        )}

        {/* Extra spacing for bottom button */}
        <View style={{height: 140}} />
      </ScrollView>

      {/* Bottom action area */}
      {!isLoading && products.length > 0 && (
        <View style={styles.bottomContainer}>
          {selectedProduct && (
            <View style={styles.purchaseSummary}>
              <Text ff="c-Regular" fs="S" color="grey800" style={styles.purchaseSummaryTitle}>
                {getSubscriptionTitle(selectedProduct.identifier)}
              </Text>
              <Text ff="i-regular" fs="XS" color="grey400" style={styles.purchaseSummaryMeta}>
                {getSubscriptionLengthLabel(selectedProduct.identifier)} subscription ·{' '}
                {selectedProduct.priceString}
              </Text>
              <View style={styles.purchaseLegalLinks}>
                <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
                  <Text ff="i-regular" fs="XXS" color="primary">
                    Terms of Use (EULA)
                  </Text>
                </TouchableOpacity>
                <Text ff="i-regular" fs="XXS" color="grey300">
                  {' '}
                  ·{' '}
                </Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
                  <Text ff="i-regular" fs="XXS" color="primary">
                    Privacy Policy
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.subscribeButton,
              (isPurchasing || !selectedProduct || (isPremium && !isSelectedPlanDifferent)) &&
                styles.subscribeButtonDisabled,
            ]}
            onPress={onPurchase}
            disabled={isPurchasing || !selectedProduct || (isPremium && !isSelectedPlanDifferent)}
            activeOpacity={0.8}>
            {isPurchasing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text ff="c-Regular" fs="L" color="white">
                {isPremium ? 'Change Plan' : 'Subscribe Now'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Apple requires restore button */}
          {!isPremium && (
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={onRestore}
              disabled={isRestoring}>
              {isRestoring ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text ff="i-regular" fs="S" color="primary">
                  Restore Purchases
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
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
  heroSection: {
    marginHorizontal: moderateScale(20),
    borderRadius: moderateScale(20),
    paddingVertical: moderateScale(32),
    paddingHorizontal: moderateScale(24),
    alignItems: 'center',
    marginBottom: moderateScale(24),
  },
  heroTitle: {
    fontWeight: 'bold',
    marginTop: moderateScale(12),
    textAlign: 'center',
  },
  heroSubtitle: {
    marginTop: moderateScale(8),
    textAlign: 'center',
    opacity: 0.9,
  },
  featuresSection: {
    paddingHorizontal: moderateScale(20),
    marginBottom: moderateScale(24),
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: moderateScale(14),
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  featureText: {
    marginLeft: moderateScale(10),
    flex: 1,
  },
  planFeaturesCard: {
    backgroundColor: colors.grey50 || '#F6F7F8',
    borderRadius: moderateScale(14),
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
    borderWidth: 1,
    borderColor: colors.grey100,
    position: 'relative',
    overflow: 'visible',
  },
  planFeaturesCardHighlighted: {
    borderColor: colors.primary,
    backgroundColor: colors.selectedItembgCOlor,
  },
  planFeaturesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(10),
    gap: moderateScale(8),
  },
  planFeaturesTitle: {
    fontWeight: '700',
  },
  recommendedTag: {
    position: 'absolute',
    top: moderateScale(-10),
    right: moderateScale(16),
    backgroundColor: colors.primary,
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(10),
  },
  planPerk: {
    marginTop: moderateScale(2),
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: moderateScale(40),
  },
  loadingText: {
    marginTop: moderateScale(12),
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: moderateScale(20),
    paddingHorizontal: moderateScale(20),
  },
  errorText: {
    textAlign: 'center',
    marginBottom: moderateScale(12),
  },
  retryButton: {
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: colors.primary,
  },
  configHint: {
    marginTop: moderateScale(10),
    textAlign: 'center',
    lineHeight: moderateScale(16),
    paddingHorizontal: moderateScale(12),
  },
  plansSection: {
    paddingHorizontal: moderateScale(20),
    marginBottom: moderateScale(16),
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.grey100,
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateScale(12),
    backgroundColor: colors.white,
    position: 'relative',
    overflow: 'visible',
  },
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.selectedItembgCOlor,
  },
  savingsBadge: {
    position: 'absolute',
    top: moderateScale(-10),
    right: moderateScale(16),
    backgroundColor: colors.secondary,
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(10),
  },
  currentPlanBadge: {
    position: 'absolute',
    top: moderateScale(-10),
    right: moderateScale(16),
    backgroundColor: colors.primary,
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(10),
  },
  planRadio: {
    marginRight: moderateScale(14),
  },
  radioOuter: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    borderWidth: 2,
    borderColor: colors.grey300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: colors.primary,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontWeight: '600',
    marginBottom: moderateScale(2),
  },
  planPrice: {
    alignItems: 'flex-end',
  },
  legalSection: {
    paddingHorizontal: moderateScale(20),
    marginTop: moderateScale(8),
  },
  legalText: {
    lineHeight: moderateScale(18),
    textAlign: 'center',
    marginBottom: moderateScale(12),
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(36),
    borderTopWidth: 1,
    borderTopColor: colors.grey100,
  },
  purchaseSummary: {
    marginBottom: moderateScale(12),
    alignItems: 'center',
  },
  purchaseSummaryTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  purchaseSummaryMeta: {
    marginTop: moderateScale(4),
    textAlign: 'center',
  },
  purchaseLegalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScale(8),
    flexWrap: 'wrap',
  },
  subscribeButton: {
    backgroundColor: colors.primary,
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: moderateScale(12),
  },
  premiumActiveContainer: {
    alignItems: 'center',
    paddingHorizontal: moderateScale(40),
    marginBottom: moderateScale(24),
  },
  premiumScrollContent: {
    paddingBottom: moderateScale(40),
  },
  currentPlanCard: {
    marginHorizontal: moderateScale(20),
    backgroundColor: colors.selectedItembgCOlor,
    borderRadius: moderateScale(16),
    borderWidth: 1.5,
    borderColor: colors.primary,
    padding: moderateScale(20),
    marginBottom: moderateScale(24),
  },
  currentPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginBottom: moderateScale(14),
  },
  currentPlanTitle: {
    fontWeight: '700',
  },
  manageSection: {
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  manageHint: {
    textAlign: 'center',
    marginTop: moderateScale(8),
    lineHeight: moderateScale(16),
  },
  premiumLegalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScale(24),
  },
  premiumBadge: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    backgroundColor: colors.selectedItembgCOlor,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(20),
  },
  premiumTitle: {
    fontWeight: 'bold',
    marginBottom: moderateScale(8),
  },
  premiumSubtitle: {
    textAlign: 'center',
    marginBottom: moderateScale(24),
  },
  manageButton: {
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: colors.primary,
  },
  extraCallCard: {
    borderColor: colors.secondary,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  extraCallBuyButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraCallNote: {
    textAlign: 'center',
    marginTop: moderateScale(4),
  },
});

export default SubscriptionScreen;
