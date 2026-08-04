import {api} from '../interceptor';

export const matchesService = {
  // Get matches
  getMatches: () => api.get('matches/'),
  getDiscover: params => api.get('matches/discover', {params}),

  // Get profile details by ID
  getProfileById: profileId => api.get(`profiles/${profileId}`),
  getProfileByUserId: userId => api.get(`profiles/user/${userId}`),

  // Like a profile
  likeProfile: profileId => api.post(`profile-likes/${profileId}/like`),
  sendSpark: (profileId, sparkData) =>
    api.post(`profile-likes/${profileId}/spark`, sparkData),

  // Unlike a profile
  unlikeProfile: profileId => api.post(`profile-skip/${profileId}`),

  // Delete profile like
  deleteProfileLike: profileId => api.delete(`profile-likes/${profileId}/like`),

  // Ignore a profile
  ignoreProfile: profileId => api.post(`profile-likes/${profileId}/ignore`),

  // Get profiles who liked me
  getLikedMe: profileId => api.get('profile-likes/liked-me'),

  // Get ignored profiles
  getIgnoredProfiles: () => api.get('profile-likes/ignored'),

  // Unignore a profile
  unignoreProfile: profileId => api.post(`profile-likes/${profileId}/unignore`),

  // Get profiles that I liked
  getMyLikes: () => api.get('profile-likes/mine'),

  // Get report reasons
  getReportReasons: () => api.get('report/reasons'),

  // Report a profile
  reportProfile: reportData => api.post('report', reportData),

  // Block a user
  blockUser: userId => api.post(`blocks/${userId}`),

  // Unblock a user
  unblockUser: userId => api.delete(`blocks/${userId}`),

  // Get blocked users
  getBlockedUsers: () => api.get('blocks'),

  // Report a message
  reportMessage: reportData => api.post('report/message', reportData),
};

