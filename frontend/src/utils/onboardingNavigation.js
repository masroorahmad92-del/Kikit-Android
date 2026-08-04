import {hasValidPrefillName} from './ssoProfileHelper';

/**
 * Navigate to profile setup (Onboard5), skipping optional phone verification.
 */
export const navigateToProfileSetup = (navigation, {ssoProfile, profileData} = {}) => {
  const prefillName =
    ssoProfile?.name ||
    profileData?.name ||
    '';

  navigation.navigate('onboard5', {
    prefillName: prefillName.trim(),
    skipNameStep: hasValidPrefillName(prefillName),
    phoneNumber: profileData?.phone_number || '',
  });
};
