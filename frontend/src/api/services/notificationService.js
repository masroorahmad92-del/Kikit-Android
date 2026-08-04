import {api} from '../interceptor';

export const notificationService = {
  // Get all notifications
  getNotifications: () => api.get('notifications'),

  // Get unread notification count
  getUnreadCount: () => api.get('notifications/unread-count'),

  // Mark a specific notification as read
  markAsRead: notificationId => api.post(`notifications/${notificationId}/read`),

  // Mark all notifications as read
  markAllAsRead: () => api.post('notifications/read-all'),
};
