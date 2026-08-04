import {api} from '../interceptor';

export const announcementService = {
  // GET announcements
  getAnnouncements: () => api.get('announcements/'),
};
