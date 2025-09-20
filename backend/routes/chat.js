const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

// All chat endpoints require auth
router.use(auth);

router.post('/room', chatController.getOrCreateRoom); // body: { courseId, sectionId }
router.get('/rooms', chatController.listUserRooms);
router.get('/rooms/:roomId/messages', chatController.listMessages);
router.post('/rooms/:roomId/messages', chatController.sendMessage);
router.delete('/messages/:messageId', chatController.deleteMessage);
router.post('/rooms/:roomId/purge', chatController.purgeRoom);

module.exports = router;
