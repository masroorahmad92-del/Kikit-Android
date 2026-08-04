import {api} from '../interceptor';

export const giftsService = {
  // Get all available gifts
  getGifts: () => api.get('gifts'),

  // Get gift details by ID
  getGiftById: giftId => api.get(`gifts/${giftId}`),

  // Send a gift to a user
  sendGift: (receiverId, giftId, liveRoomId) =>
    api.post('gifts/send', {
      receiver_id: receiverId,
      gift_id: giftId,
      ...(liveRoomId ? {live_room_id: liveRoomId} : {}),
    }),

  // Get received gifts history with pagination
  getReceivedGifts: (page = 1, size = 50) =>
    api.get('gifts/history/received', {
      params: {page, size},
    }),
};
