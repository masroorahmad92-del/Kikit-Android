/**
 * Extract display name from Apple Authentication Services response.
 * Apple only provides fullName on the user's first authorization.
 */
export const formatAppleFullName = fullName => {
  if (!fullName) {
    return '';
  }
  const parts = [fullName.givenName, fullName.familyName].filter(Boolean);
  return parts.join(' ').trim();
};

/**
 * Extract display name from Google Sign-In userInfo response.
 */
export const formatGoogleFullName = userInfo => {
  const user = userInfo?.data?.user || userInfo?.user;
  if (!user) {
    return '';
  }
  if (user.name) {
    return String(user.name).trim();
  }
  const parts = [user.givenName, user.familyName].filter(Boolean);
  return parts.join(' ').trim();
};

export const buildSsoProfile = ({provider, fullName, email}) => ({
  provider,
  name: fullName || '',
  email: email || '',
});

export const hasValidPrefillName = name =>
  typeof name === 'string' && name.trim().length >= 3;
