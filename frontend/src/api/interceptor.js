import axios from 'axios';
import {storageUtil} from '../store/storage';
import {useKitkitStore} from '../store/kitkitStore';
import Toast from 'react-native-toast-message';
import {revenueCatLogout} from '../utils/revenueCatHelper';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: 'https://kikit-app.onrender.com/api/v1/',
  // timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  async config => {
    // Add auth token if available
    // const token = await storageUtil.getItem('apiToken');
    const token = useKitkitStore.getState().user?.access_token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ⭐ Better logging
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullURL: config.baseURL + config.url,
      headers: config.headers,
      data: config.data, // ⭐ See what you're sending
      params: config.params,
    });

    return config;
  },
  error => {
    console.log(' Request Error:', error);
    return Promise.reject(error);
  },
);

// Response Interceptor
apiClient.interceptors.response.use(
  response => {
    console.log(' API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  async error => {
    console.log(' API Error:', error);
    if (error.response) {
      // Server responded with error status
      console.log(' API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        requestData: error.config?.data, // What you sent
        responseData: error.response.data, // Server's error message
        headers: error.config?.headers,
      });
    } else if (error.request) {
      // Request made but no response
      console.log(' No Response Error:', {
        url: error.config?.url,
        method: error.config?.method,
        message: 'No response received from server',
      });
    } else {
      // Error in setting up request
      console.log(' Request Setup Error:', error.message);
    }

    // Handle specific error codes
    if (error.response?.status === 401) {
      console.log(' Unauthorized - Logging out');
      await logoutUser();
    }

    return Promise.reject({
      status: error.response?.status,
      message: error.response?.data?.message,
      errors: error.response?.data?.data,
    });
  },
);
const logoutUser = async () => {
  await revenueCatLogout();
  try {
    const notificationService = (await import('../services/NotificationService')).default;
    await notificationService.deleteFCMToken();
    await notificationService.cancelAllNotifications();
  } catch (e) {
    console.log('Failed to cleanup notifications on auto-logout:', e);
  }
  await storageUtil.clear();
  useKitkitStore.getState().removeUser();
  Toast.show({
    type: 'error',
    text1: 'Session Expired, Please login again',
  });
};

// API Methods
export const api = {
  // GET request
  get: (url, params = {}) => {
    return apiClient.get(url, {params});
  },

  // POST request
  post: (url, data = {}, config = {}) => {
    return apiClient.post(url, data, config);
  },

  // PUT request
  put: (url, data = {}, config = {}) => {
    return apiClient.put(url, data, config);
  },

  // DELETE request
  delete: (url, config = {}) => {
    return apiClient.delete(url, config);
  },

  // PATCH request
  patch: (url, data = {}, config = {}) => {
    return apiClient.patch(url, data, config);
  },
};

export default apiClient;
