import {storageUtil} from '../../store/storage';
import {api} from '../interceptor';
export const userService = {
  // GET example
  getUsers: () => api.get('/users'),

  getUserById: id => api.get(`/users/${id}`),

  // POST example
  createUser: userData => api.post('/users', userData),

  // PUT example
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),

  // DELETE example
  deleteUser: id => api.delete(`/users/${id}`),

  // Get my profile
  getMyProfile: () => api.get('profiles/me'),

  // Profile creation/completion
  createProfile: profileData => api.post('profiles/', profileData),

  // Complete/update profile (PATCH request)
  completeProfile: profileData => api.patch('profiles/', profileData),

  // Profile verification with image upload
  verifyProfile: formData =>
    api.post('profiles/verify', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  // Media upload
  uploadMedia: formData =>
    api.post('media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  // Media delete
  deleteMedia: publicId => api.delete(`media/delete/${publicId}`),

  // Update user location
  updateLocation: locationData => api.patch('profiles/', locationData),

  // Delete current user account
  deleteMyAccount: () => api.delete('users/me'),

  // Send FCM token to backend
  sendFCMToken: fcmToken => api.post('fcm-token', {fcm_token: fcmToken}),

  // Logout current device (removes this device's FCM token, invalidates session)
  logout: () => api.post('logout'),

  // Logout all devices (removes all FCM tokens, invalidates all sessions)
  logoutAll: () => api.post('logout-all'),

  // Update coin balance after purchase
  updateBalance: coins => api.patch('users/me/balance', {coins}),

  // Update subscription after successful purchase
  updateSubscription: subscriptionType =>
    api.post('profiles/subscription', {subscription_type: subscriptionType}),

  // Record a call (backend handles priority: purchased_calls drain first, then calls_taken)
  recordCall: () => api.post('profiles/subscription/call'),

  // Purchase extra calls (called after RevenueCat purchase succeeds)
  purchaseCalls: (callsCount) => api.post('profiles/calls/purchase', {calls_count: callsCount}),

  // Payout: check if user has a payout recipient account
  getPayoutRecipient: () => api.get('payouts/recipient'),

  // Payout: register user as payout recipient (returns widget_url)
  createPayoutRecipient: () => api.post('payouts/recipient'),

  // Payout: request a diamond payout
  requestPayout: (diamonds) => api.post('payouts/request', {diamonds}),

  // Payout: get payout history
  getPayoutHistory: (page = 1, size = 10) => api.get(`payouts/history?page=${page}&size=${size}`),

  // Payout: convert diamonds to USD
  convertDiamonds: (diamonds) => api.get(`payouts/convert?diamonds=${diamonds}`),
};
