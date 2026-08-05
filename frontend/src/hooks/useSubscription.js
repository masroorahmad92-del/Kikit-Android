import {useState, useEffect, useCallback} from 'react';
import {Platform} from 'react-native';
import Purchases, {PRODUCT_CATEGORY} from 'react-native-purchases';
import {useKitkitStore} from '../store/kitkitStore';
import {syncPremiumStatus} from '../utils/revenueCatHelper';
import {
  getRevenueCatConfigError,
  isRevenueCatConfigured,
} from '../utils/revenueCatConfig';
import {userService} from '../api/services/userService';

const SUBSCRIPTION_IDS = [
  'com.kikit.subscription.monthly',
  'com.kikit.subscription.annual',
];

const EXTRA_CALL_PRODUCT_ID = 'com.kikit.call_1pack';

const sortSubscriptionProducts = products =>
  [...products].sort((a, b) => {
    const aAnnual = a.identifier?.includes('annual') ? 0 : 1;
    const bAnnual = b.identifier?.includes('annual') ? 0 : 1;
    return aAnnual - bAnnual;
  });

const useSubscription = () => {
  const [products, setProducts] = useState([]);
  const [extraCallProduct, setExtraCallProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState(null);
  const {isPremium, activePlan, userProfile, setUserProfile} = useKitkitStore();

  const fetchSubscriptions = useCallback(async (retryCount = 0) => {
    try {
      setIsLoading(true);
      setError(null);

      const configError = getRevenueCatConfigError();
      if (configError) {
        setProducts([]);
        setExtraCallProduct(null);
        setError(configError);
        return [];
      }

      let fetchedProducts = [];

      try {
        const offerings = await Purchases.getOfferings();
        const packages = offerings.current?.availablePackages || [];
        if (packages.length > 0) {
          fetchedProducts = packages.map(pkg => pkg.product);
        }
      } catch (offeringsErr) {
        console.log('Offerings fetch failed, falling back to products:', offeringsErr);
      }

      if (fetchedProducts.length === 0) {
        fetchedProducts = await Purchases.getProducts(
          SUBSCRIPTION_IDS,
          PRODUCT_CATEGORY.SUBSCRIPTION,
        );
      }

      try {
        const consumableProducts = await Purchases.getProducts(
          [EXTRA_CALL_PRODUCT_ID],
          PRODUCT_CATEGORY.NON_SUBSCRIPTION,
        );
        if (consumableProducts?.length > 0) {
          setExtraCallProduct(consumableProducts[0]);
        } else {
          setExtraCallProduct(null);
        }
      } catch (err) {
        console.log('Error fetching extra call product:', err);
        setExtraCallProduct(null);
      }

      if ((!fetchedProducts || fetchedProducts.length === 0) && retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return fetchSubscriptions(retryCount + 1);
      }

      const sortedProducts = sortSubscriptionProducts(fetchedProducts || []);
      setProducts(sortedProducts);

      if (sortedProducts.length === 0) {
        setError(
          Platform.OS === 'ios'
            ? 'No subscription plans available. Confirm App Store products are approved in RevenueCat, then try again.'
            : 'No subscription plans available yet. Play Store billing must be linked in RevenueCat before Android purchases work.',
        );
      }

      return sortedProducts;
    } catch (err) {
      console.log('Error fetching subscriptions:', err);
      if (retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return fetchSubscriptions(retryCount + 1);
      }
      setError(
        isRevenueCatConfigured()
          ? 'Unable to load subscription options. Please check your connection and try again.'
          : getRevenueCatConfigError(),
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkSubscriptionStatus = useCallback(async () => {
    if (!isRevenueCatConfigured()) {
      return false;
    }
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const {isPremium: hasPremium} = syncPremiumStatus(customerInfo);
      return hasPremium;
    } catch (err) {
      console.log('Error checking subscription:', err);
      return false;
    }
  }, []);

  const handleSubscribe = useCallback(
    async product => {
      try {
        setIsPurchasing(true);
        setError(null);
        const {customerInfo} = await Purchases.purchaseStoreProduct(product);

        if (customerInfo.entitlements.active.premium) {
          syncPremiumStatus(customerInfo);

          const subscriptionType = product.identifier?.includes('annual')
            ? 'yearly'
            : 'monthly';
          try {
            await userService.updateSubscription(subscriptionType);
          } catch (syncErr) {
            console.log('Failed to sync subscription to backend:', syncErr);
          }

          return {success: true};
        }
        return {success: false};
      } catch (err) {
        if (err.userCancelled) {
          return {success: false, cancelled: true};
        }
        console.log('Purchase error:', err);
        setError('Purchase failed. Please try again.');
        return {success: false, error: err};
      } finally {
        setIsPurchasing(false);
      }
    },
    [],
  );

  const handlePurchaseExtraCall = useCallback(
    async () => {
      if (isPremium && activePlan === 'annual') {
        return {
          success: false,
          warning: true,
          message:
            'You have unlimited calls with your Annual plan. No need to purchase extra calls.',
        };
      }

      if (isPremium && activePlan === 'monthly') {
        const callsTaken = userProfile?.calls_taken || 0;
        if (callsTaken < 1) {
          return {
            success: false,
            warning: true,
            message:
              'You already have 1 available call from your Monthly plan. Use that call first before purchasing an extra one.',
          };
        }
      }

      const purchasedCalls = userProfile?.purchased_calls || 0;
      if (purchasedCalls > 0) {
        return {
          success: false,
          warning: true,
          message:
            'You already have an extra call available. Use it before purchasing another one.',
        };
      }

      if (!extraCallProduct) {
        return {success: false, error: 'Extra call product not available.'};
      }

      try {
        setIsPurchasing(true);
        setError(null);
        await Purchases.purchaseStoreProduct(extraCallProduct);

        try {
          const purchaseResp = await userService.purchaseCalls(1);
          const purchaseData = purchaseResp?.data?.data;
          if (purchaseData) {
            setUserProfile({...userProfile, ...purchaseData});
          }
        } catch (syncErr) {
          console.log('Failed to sync extra call purchase to backend:', syncErr);
          try {
            const profileResp = await userService.getMyProfile();
            const profileData = profileResp?.data?.data;
            if (profileData) {
              setUserProfile(profileData);
            }
          } catch (profileErr) {
            console.log('Failed to refetch profile:', profileErr);
          }
        }

        return {success: true};
      } catch (err) {
        if (err.userCancelled) {
          return {success: false, cancelled: true};
        }
        console.log('Extra call purchase error:', err);
        setError('Purchase failed. Please try again.');
        return {success: false, error: err};
      } finally {
        setIsPurchasing(false);
      }
    },
    [extraCallProduct, isPremium, activePlan, userProfile, setUserProfile],
  );

  const restorePurchases = useCallback(async () => {
    if (!isRevenueCatConfigured()) {
      setError(getRevenueCatConfigError());
      return false;
    }
    try {
      setIsLoading(true);
      setError(null);
      const customerInfo = await Purchases.restorePurchases();
      const {isPremium: hasPremium} = syncPremiumStatus(customerInfo);
      return hasPremium;
    } catch (err) {
      console.log('Error restoring purchases:', err);
      setError('Unable to restore purchases. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
    checkSubscriptionStatus();
  }, [fetchSubscriptions, checkSubscriptionStatus]);

  return {
    products,
    extraCallProduct,
    isLoading,
    isPurchasing,
    isPremium,
    activePlan,
    error,
    fetchSubscriptions,
    handleSubscribe,
    handlePurchaseExtraCall,
    checkSubscriptionStatus,
    restorePurchases,
  };
};

export default useSubscription;
