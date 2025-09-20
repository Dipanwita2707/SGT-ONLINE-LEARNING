import axios from '../utils/axiosConfig';

const BASE = '/api/chat';

export async function ensureRoom(courseId, sectionId) {
  const { data } = await axios.post(`${BASE}/room`, { courseId, sectionId });
  return data;
}

export async function fetchMessages(roomId, before, limit = 50) {
  const params = {};
  if (before) params.before = before;
  if (limit) params.limit = limit;
  const { data } = await axios.get(`${BASE}/rooms/${roomId}/messages`, { params });
  return data.messages;
}

export async function sendMessage(roomId, body) {
  const { data } = await axios.post(`${BASE}/rooms/${roomId}/messages`, { body });
  return data;
}

export async function deleteMessage(messageId) {
  const { data } = await axios.delete(`${BASE}/messages/${messageId}`);
  return data;
}

export async function listRooms() {
  const { data } = await axios.get(`${BASE}/rooms`);
  return data.rooms;
}
