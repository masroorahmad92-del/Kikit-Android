import {api} from '../interceptor';

export const liveRoomsService = {
  getRooms: params => api.get('live-rooms', params),
  createRoom: data => api.post('live-rooms', data),
  startRoom: roomId => api.post(`live-rooms/${roomId}/start`),
  joinRoom: roomId => api.post(`live-rooms/${roomId}/join`),
  leaveRoom: roomId => api.post(`live-rooms/${roomId}/leave`),
  endRoom: roomId => api.post(`live-rooms/${roomId}/end`),
};
