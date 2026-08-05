import {Platform} from 'react-native';
import {
  REVENUECAT_API_KEY_ANDROID,
  REVENUECAT_API_KEY_IOS,
} from './constants';

export const getRevenueCatApiKey = () =>
  Platform.OS === 'ios'
    ? REVENUECAT_API_KEY_IOS
    : REVENUECAT_API_KEY_ANDROID;

export const isRevenueCatConfigured = () => {
  const apiKey = getRevenueCatApiKey();
  return Boolean(apiKey && !apiKey.includes('REPLACE'));
};

export const getRevenueCatConfigError = () => {
  if (isRevenueCatConfigured()) {
    return null;
  }
  if (Platform.OS === 'android') {
    return 'Android subscriptions are still being set up. In-app purchases will work once the Play Store release and RevenueCat Android key are configured.';
  }
  return 'Subscriptions are temporarily unavailable. Please try again in a moment.';
};
