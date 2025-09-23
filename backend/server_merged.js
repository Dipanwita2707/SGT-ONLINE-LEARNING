const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const ChatRoom = require('./models/ChatRoom');
const ChatMessage = require('./models/ChatMessage');
const UserModel = require('./models/User');
const app = express();
require('dotenv').config();

app.use(cors());

// Security headers (lightweight defaults)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Gzip compression for JSON/text responses
app.use(compression());

app.use(express.json({ limit: '1mb' }));

// Serve static files from the public directory with cache headers
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '7d',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      // Do not cache HTML to avoid stale shells
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const roleRoutes = require('./routes/role');
const notificationRoutes = require('./routes/notification');
const studentRoutes = require('./routes/student');
const teacherRoutes = require('./routes/teacher');
const hodRoutes = require('./routes/hod');
const deanRoutes = require('./routes/dean');
const hodAnnouncementHistoryRoutes = require('./routes/hodAnnouncementHistory');
const quizRoutes = require('./routes/quiz');
const quizPoolRoutes = require('./routes/quizPool');
const unitRoutes = require('./routes/unit');
const teacherRequestRoutes = require('./routes/teacherRequest');
const studentQuizAttemptRoutes = require('./routes/studentQuizAttempt');
const unitQuizRoutes = require('./routes/unitQuiz');
const announcementRoutes = require('./routes/announcement');
const schoolRoutes = require('./routes/school');
const departmentRoutes = require('./routes/department');
const courseRoutes = require('./routes/course');
const sectionRoutes = require('./routes/section');
const hierarchyRoutes = require('./routes/hierarchy');
const quizSecurityRoutes = require('./routes/quizSecurity');
const secureQuizRoutes = require('./routes/secureQuiz');
// Keep your existing routes
const ccRoutes = require('./routes/cc');
const quizUnlockRoutes = require('./routes/quizUnlock');
const liveClassRoutes = require('./routes/liveClass');
// Add new chat routes from pawansing
const chatRoutes = require('./routes/chat');

app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', roleRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/dean', deanRoutes);
app.use('/api/hod/announcements', hodAnnouncementHistoryRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/quiz-pools', quizPoolRoutes);
app.use('/api/unit', unitRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/teacher-requests', teacherRequestRoutes);
app.use('/api/student', studentQuizAttemptRoutes);
app.use('/api/student', unitQuizRoutes);
app.use('/api/announcement', announcementRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/hierarchy', hierarchyRoutes);
app.use('/api/quiz', quizSecurityRoutes);
app.use('/api/student/quiz', quizRoutes);
app.use('/api/student', secureQuizRoutes);
// Keep your existing routes
app.use('/api/cc', ccRoutes);
app.use('/api/quiz-unlock', quizUnlockRoutes);
app.use('/api/live-classes', liveClassRoutes);
app.use('/api/video-unlock', require('./routes/videoUnlock'));
// Add new chat routes from pawansing
app.use('/api/chat', chatRoutes);

// Connect to MongoDB using only the .env file configuration
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully');
    
    // Run migrations after successful connection
    const generateTeacherIds = require('./migrations/generateTeacherIds');
    generateTeacherIds();
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    console.log('Please check your MONGO_URI in .env file and ensure MongoDB is running');
    process.exit(1);
  });

const db = mongoose.connection;
db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  console.log('Please check your MONGO_URI in .env file and ensure MongoDB is running');
});
db.once('open', () => {
  console.log('Connected to MongoDB');
});

app.get('/', (req, res) => {
  res.send('SGT Project Backend Running');
});

// Add a database status check endpoint for debugging
app.get('/api/db-status', (req, res) => {
  const status = {
    isConnected: mongoose.connection.readyState === 1,
    connectionState: mongoose.connection.readyState,
    stateDescription: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState]
  };
  res.json(status);
});

// Auto-create single admin if not exists
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || 'Admin';
    if (!email || !password) {
      console.warn('Admin credentials not set in .env');
      return;
    }
    let user = await User.findOne({ email, role: 'admin' });
    if (!user) {
      const hashed = await bcrypt.hash(password, 10);
      user = new User({
        name,
        email,
        password: hashed,
        role: 'admin',
        permissions: ['*'],
        isActive: true,
        emailVerified: true
      });
      await user.save();
      console.log('Admin created:', email);
    } else {
      console.log('Admin already exists:', email);
    }
  } catch (err) {
    console.error('Error creating admin:', err.message);
  }
}

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Socket.IO setup for chat functionality
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET','POST'] }
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('unauthorized'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded.id);
    if (!user) return next(new Error('unauthorized'));
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('unauthorized'));
  }
});

function canDelete(role){ return ['admin','hod','dean'].includes(role); }
function canSend(role){ return ['admin','hod','dean','teacher','student'].includes(role); }

io.on('connection', (socket) => {
  socket.on('join_room', async ({ roomId }) => {
    if (!roomId) return;
    const room = await ChatRoom.findById(roomId);
    if (!room) return;
    socket.join(roomId);
  });

  socket.on('send_message', async ({ roomId, body }) => {
    try {
      if (!roomId || !body || !body.trim()) return;
      if (body.length > 500) return;
      if (!canSend(socket.user.role)) return;
      const room = await ChatRoom.findById(roomId);
      if (!room) return;
      const msg = await ChatMessage.create({ room: room._id, sender: socket.user._id, senderRole: socket.user.role, body: body.trim() });
      await ChatRoom.findByIdAndUpdate(room._id, { lastMessageAt: new Date() });
      io.to(roomId).emit('message_new', msg);
    } catch (e) {}
  });

  socket.on('delete_message', async ({ messageId }) => {
    try {
      if (!messageId) return;
      const msg = await ChatMessage.findById(messageId).populate('room');
      if (!msg) return;
      if (!canDelete(socket.user.role)) return;
      msg.deleted = true; msg.deletedAt = new Date(); msg.deletedBy = socket.user._id; await msg.save();
      io.to(String(msg.room._id)).emit('message_deleted', { messageId });
    } catch (e) {}
  });
});

// Error handling middleware for multer and file uploads
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File too large. Maximum size is 100MB.' 
      });
    }
    return res.status(400).json({ message: err.message });
  } else if (err.message === 'Only video files are allowed') {
    return res.status(400).json({ message: err.message });
  }
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Initialize Socket.IO for live classes
const initializeLiveClassSocket = require('./socket/liveClassSocket');
initializeLiveClassSocket(server);
console.log('✅ Live Class Socket.IO server initialized');

server.listen(PORT, '0.0.0.0', async () => {
  await createAdmin();
  
  // Run migrations
  const generateTeacherIds = require('./migrations/generateTeacherIds');
  await generateTeacherIds();
  
  console.log(`Server running on port ${PORT}`);
});