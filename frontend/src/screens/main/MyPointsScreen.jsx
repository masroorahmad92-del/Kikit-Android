import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {colors, moderateScale} from '../../theme';
import {Text} from '../../components/base/Text';
import GradientBackground from '../../components/GradientBackground';
import {ArrowBack} from '../../assets/icons';
import {Coin} from '../../assets/icons';
import Purchases, {PRODUCT_CATEGORY} from 'react-native-purchases';
import {userService} from '../../api/services/userService';
import {useKitkitStore} from '../../store/kitkitStore';
import Toast from 'react-native-toast-message';

const PRODUCT_IDS = [
  'com.kikit.coins.500',
  'com.kikit.coins.1000',
  'com.kikit.coins.5000',
  'com.kikit.coins.10000',
];


const extractCoins = productId => {
  const parts = productId.split('.');
  return parseInt(parts[parts.length - 1], 10);
};

const MyPointsScreen = ({navigation}) => {
  const {userProfile, setUserProfile} = useKitkitStore();
  const [bundles, setBundles] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      const products = await Purchases.getProducts(
        PRODUCT_IDS,
        PRODUCT_CATEGORY.NON_SUBSCRIPTION,
      );
      console.log('Fetched products:', products);
      const sortedProducts = products.sort(
        (a, b) => extractCoins(a.identifier) - extractCoins(b.identifier),
      );
      setBundles(sortedProducts);
      if (sortedProducts.length > 1) {
        setSelectedProductId(sortedProducts[1].identifier);
      } else if (sortedProducts.length > 0) {
        setSelectedProductId(sortedProducts[0].identifier);
      }
    } catch (error) {
      console.log('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load store products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handlePurchase = useCallback(async () => {
    const selected = bundles.find(b => b.identifier === selectedProductId);
    if (!selected) {
      return;
    }
    try {
      setPurchasing(true);
      const purchaseResult = await Purchases.purchaseStoreProduct(selected);
      console.log('Purchase successful:', purchaseResult);

      const coins = extractCoins(selected.identifier);

      // Refresh profile from server (coins credited via RevenueCat webhook)
      try {
        const profileResp = await userService.getMyProfile();
        const profileData = profileResp?.data?.data;
        if (profileData) {
          setUserProfile(profileData);
        }
      } catch (profileErr) {
        console.log('Failed to refresh profile after purchase:', profileErr);
      }

      Toast.show({
        type: 'success',
        text1: 'Coins purchased successfully!',
        text2: `${coins.toLocaleString()} coins have been added to your balance`,
      });

      // Navigate back to the screen that initiated the purchase
      navigation.goBack();
    } catch (error) {
      if (!error.userCancelled) {
        console.log('Purchase error:', error);
        Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
      }
    } finally {
      setPurchasing(false);
    }
  }, [bundles, selectedProductId, userProfile, setUserProfile, navigation]);

  const formatPerCoin = (price, coins) => {
    const perCoin = price / coins;
    return `$${perCoin.toFixed(3)}/coins`;
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
            Store
          </Text>
          <View style={{width: 24}} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {/* Gift Image */}
          <View style={styles.imageContainer}>
            <Image
              source={require('../../assets/images/gift-img.png')}
              style={styles.giftImage}
              resizeMode="contain"
            />
          </View>

          {/* Title & Description */}
          <Text ff="c-Bold" fs="XXL" color="grey800" style={styles.title}>
            Send Exclusive Gifts
          </Text>
          <Text ff="c-medium" fs="S" color="grey800" style={styles.subtitle}>
            Use coins to send unique and premium gifts to catch the attention of
            people you connect with.
          </Text>

          {/* Bundles */}
          <View style={styles.bundlesContainer}>
            {loading ? (
              <ActivityIndicator
                size="large"
                color={colors.secondary}
                style={styles.loader}
              />
            ) : (
              bundles.map(product => {
                const coins = extractCoins(product.identifier);
                const isSelected = selectedProductId === product.identifier;
                return (
                  <TouchableOpacity
                    key={product.identifier}
                    style={[
                      styles.bundleCard,
                      isSelected && styles.bundleCardSelected,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => setSelectedProductId(product.identifier)}>
                    <View style={styles.bundleLeft}>
                      <View style={styles.bundlePointsRow}>
                        <Text
                          ff="c-Bold"
                          fs="XL"
                          color="grey800"
                          style={styles.bundleCoins}>
                          {coins.toLocaleString()}
                        </Text>
                        <Coin
                          width={moderateScale(20)}
                          height={moderateScale(20)}
                        />
                        <Text ff="c-Regular" fs="S" color="grey800">
                          Coins
                        </Text>
                      </View>
                      <View style={styles.bundlePriceRow}>
                        <Text
                          ff="c-Bold"
                          fs="L"
                          color="secondary"
                          style={styles.bundlePrice}>
                          {product.priceString}
                        </Text>
                        <Text
                          ff="c-Regular"
                          fs="XS"
                          color="grey800"
                          style={styles.perCoinText}>
                          {formatPerCoin(product.price, coins)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.bundleRight}>
                      <View
                        style={[
                          styles.radioOuter,
                          isSelected && styles.radioOuterSelected,
                        ]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (purchasing || loading || !selectedProductId) &&
                styles.continueButtonDisabled,
            ]}
            activeOpacity={0.8}
            disabled={purchasing || loading || !selectedProductId}
            onPress={handlePurchase}>
            {purchasing ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text ff="c-Bold" fs="L" color="white">
                Continue
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
  scrollContent: {
    paddingBottom: moderateScale(20),
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: moderateScale(10),
    marginBottom: moderateScale(16),
  },
  giftImage: {
    width: moderateScale(120),
    height: moderateScale(120),
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: moderateScale(8),
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: moderateScale(40),
    marginBottom: moderateScale(24),
    lineHeight: moderateScale(20),
  },
  bundlesContainer: {
    paddingHorizontal: moderateScale(20),
  },
  bundleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(20),
    marginBottom: moderateScale(12),
    borderWidth: 1.5,
    borderColor: colors.grey100,
  },
  bundleCardSelected: {
    backgroundColor: colors.selectedItembgCOlor,
    borderColor: colors.secondary,
    borderWidth: 2,
  },
  bundleLeft: {
    flex: 1,
  },
  bundlePointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    marginBottom: moderateScale(4),
  },
  bundleCoins: {
    fontWeight: '700',
  },
  bundlePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  bundlePrice: {
    fontWeight: '700',
  },
  perCoinText: {
    fontWeight: '400',
  },
  bundleRight: {
    marginLeft: moderateScale(12),
  },
  radioOuter: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: colors.grey200,
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
  bottomContainer: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(20),
    paddingTop: moderateScale(10),
  },
  continueButton: {
    backgroundColor: colors.secondary,
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(30),
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  loader: {
    marginVertical: moderateScale(40),
  },
});

export default MyPointsScreen;
