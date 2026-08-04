import Purchases from 'react-native-purchases';
import {useKitkitStore} from '../store/kitkitStore';

/**
 * Extract the active plan name from a RevenueCat customerInfo object.
 * Returns 'monthly', 'annual', or null.
 */
export const getActivePlanFromCustomerInfo = customerInfo => {
  const premiumEntitlement = customerInfo?.entitlements?.active?.premium;
  if (!premiumEntitlement) {
    return null;
  }
  const productId = premiumEntitlement.productIdentifier || '';
  if (productId.includes('annual')) {
    return 'annual';
  }
  if (productId.includes('monthly')) {
    return 'monthly';
  }
  return 'premium';
};

/**
 * Sync premium status and active plan from customerInfo into the store.
 */
export const syncPremiumStatus = customerInfo => {
  const store = useKitkitStore.getState();
  const isPremium =
    customerInfo?.entitlements?.active?.premium !== undefined;
  const activePlan = getActivePlanFromCustomerInfo(customerInfo);
  store.setIsPremium(isPremium);
  store.setActivePlan(activePlan);
  return {isPremium, activePlan};
};

/**
 * Log in the current user to RevenueCat so subscriptions are tied to their account.
 * @param {string} userId - The backend user ID (user.user.id)
 */
export const revenueCatLogin = async userId => {
    console.log('Attempting RevenueCat login for userId:', userId);
  try {
    if (!userId) {
      console.log('RevenueCat login skipped: no userId provided');
      return false;
    }
    const {customerInfo} = await Purchases.logIn(String(userId));
    console.log("customerInfo after login:", customerInfo);
    const {isPremium} = syncPremiumStatus(customerInfo);
    console.log('RevenueCat logIn success, isPremium:', isPremium);
    return isPremium;
  } catch (error) {
    console.log('RevenueCat login error:', error);
    return false;
  }
};

/**
 * Log out the current user from RevenueCat (resets to anonymous).
 */
export const revenueCatLogout = async () => {
  try {
    await Purchases.logOut();
    console.log('RevenueCat logOut success');
  } catch (error) {
    console.log('RevenueCat logout error:', error);
  }
};
