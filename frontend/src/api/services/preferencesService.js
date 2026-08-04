import {api} from '../interceptor';

export const preferencesService = {
  // Get all interests with categories
  getInterests: () => api.get('interests/'),

  // Get all hobbies with categories
  getHobbies: () => api.get('hobbies/'),

  // Get user preferences
  getPreferences: () => api.get('preferences/me'),

  // Update user preferences
  updatePreferences: (data) => api.put('preferences/me', data),

  // Delete user preferences (reset to defaults)
  deletePreferences: () => api.delete('preferences/me'),
};

