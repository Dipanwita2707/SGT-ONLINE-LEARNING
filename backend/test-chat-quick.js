// Quick manual test script for chat API & socket events
// Usage: node test-chat-quick.js <JWT_TOKEN> <COURSE_ID> <SECTION_ID>
// Ensure server running on localhost:5000

const axios = require('axios');
const io = require('socket.io-client');

(async () => {
  const [,, token, courseId, sectionId] = process.argv;
  if (!token || !courseId || !sectionId) {
    console.log('Usage: node test-chat-quick.js <JWT_TOKEN> <COURSE_ID> <SECTION_ID>');
    process.exit(1);
  }
  const client = axios.create({ baseURL: 'http://localhost:5000', headers: { Authorization: `Bearer ${token}` }});
  try {
    console.log('Ensuring room...');
    const roomRes = await client.post('/api/chat/room', { courseId, sectionId });
    const room = roomRes.data;
    console.log('Room:', room._id);
    console.log('Listing messages...');
    const msgs = await client.get(`/api/chat/rooms/${room._id}/messages`);
    console.log('Initial messages:', msgs.data.messages.length);

    console.log('Connecting socket...');
    const socket = io('http://localhost:5000', { auth: { token } });
    socket.on('connect', () => {
      console.log('Socket connected');
      socket.emit('join_room', { roomId: room._id });
    });
    socket.on('message_new', (m) => console.log('Realtime new:', m.body));

    console.log('Sending message via REST...');
    const sendRes = await client.post(`/api/chat/rooms/${room._id}/messages`, { body: 'Hello from test ' + Date.now() });
    console.log('Sent message id:', sendRes.data._id);

    setTimeout(() => {
      console.log('Done. Press Ctrl+C to exit.');
    }, 3000);
  } catch (e) {
    console.error('Test failed', e.response?.data || e.message);
  }
})();
