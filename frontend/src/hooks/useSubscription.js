import {useState, useEffect, useCallback} from 'react';
import Purchases, {PRODUCT_CATEGORY} from 'react-native-purchases';
import {useKitkitStore} from '../store/kitkitStore';
import {syncPremiumStatus} from '../utils/revenueCatHelper';
import {userService} from '../api/services/userService';

const SUBSCRIPTION_IDS = [
  'com.kikit.subscription.monthly',
  'com.kikit.subscription.annual',
];

const EXTRA_CALL_PRODUCT_ID = 'com.kikit.call_1pack';

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
      const fetchedProducts = await Purchases.getProducts(
        SUBSCRIPTION_IDS,
        PRODUCT_CATEGORY.SUBSCRIPTION,
      );

      // Fetch extra call consumable product
      try {
        const consumableProducts = await Purchases.getProducts(
          [EXTRA_CALL_PRODUCT_ID],
          PRODUCT_CATEGORY.NON_SUBSCRIPTION,
        );
        if (consumableProducts && consumableProducts.length > 0) {
          setExtraCallProduct(consumableProducts[0]);
        }
      } catch (err) {
        console.log('Error fetching extra call product:', err);
      }

      if ((!fetchedProducts || fetchedProducts.length === 0) && retryCount < 3) {
        // RevenueCat may not be fully configured yet — retry after a short delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        return fetchSubscriptions(retryCount + 1);
      }

      setProducts(fetchedProducts || []);
      if (!fetchedProducts || fetchedProducts.length === 0) {
        setError('No subscription plans available. Please try again later.');
      }
      return fetchedProducts;
    } catch (err) {
      console.log('Error fetching subscriptions:', err);
      if (retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return fetchSubscriptions(retryCount + 1);
      }
      setError('Unable to load subscription options. Please try again.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      console.log('Customer info on status check:', customerInfo);
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

          // Notify backend about the subscription
          const subscriptionType = product.identifier?.includes('annual')
            ? 'yearly'
            : 'monthly';
          try {
            await userService.updateSubscription(subscriptionType);
            console.log('Subscription synced to backend:', subscriptionType);
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
      // Validation: annual users have unlimited calls
      if (isPremium && activePlan === 'annual') {
        return {
          success: false,
          warning: true,
          message: 'You have unlimited calls with your Annual plan. No need to purchase extra calls.',
        };
      }

      // Validation: monthly user with unused subscription call
      if (isPremium && activePlan === 'monthly') {
        const callsTaken = userProfile?.calls_taken || 0;
        if (callsTaken < 1) {
          return {
            success: false,
            warning: true,
            message: 'You already have 1 available call from your Monthly plan. Use that call first before purchasing an extra one.',
          };
        }
      }

      // Validation: user already has purchased calls available
      const purchasedCalls = userProfile?.purchased_calls || 0;
      if (purchasedCalls > 0) {
        return {
          success: false,
          warning: true,
          message: 'You already have an extra call available. Use it before purchasing another one.',
        };
      }

      if (!extraCallProduct) {
        return {success: false, error: 'Extra call product not available.'};
      }

      try {
        setIsPurchasing(true);
        setError(null);
        await Purchases.purchaseStoreProduct(extraCallProduct);

        // Notify backend about the purchased call
        try {
          const purchaseResp = await userService.purchaseCalls(1);
          const purchaseData = purchaseResp?.data?.data;
          if (purchaseData) {
            setUserProfile({...userProfile, ...purchaseData});
            console.log('Extra call purchase synced to backend:', purchaseData);
          }
        } catch (syncErr) {
          console.log('Failed to sync extra call purchase to backend:', syncErr);
          // Fallback: refetch profile to get updated purchased_calls
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
