const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const Section = require('../models/Section');
const Course = require('../models/Course');
const User = require('../models/User');

// Simple in-memory rate limiting (per user)
// windowMs: 30s, maxMessages: 15
const MESSAGE_WINDOW_MS = 30 * 1000;
const MESSAGE_MAX_IN_WINDOW = 15;
// Map<userId, { count, windowStart }>
const messageCounters = new Map();

function incrementAndCheckRate(userId) {
  const now = Date.now();
  let entry = messageCounters.get(userId);
  if (!entry || (now - entry.windowStart) > MESSAGE_WINDOW_MS) {
    entry = { count: 0, windowStart: now };
  }
  entry.count += 1;
  messageCounters.set(userId, entry);
  return entry.count <= MESSAGE_MAX_IN_WINDOW;
}

// Basic sanitization: strip HTML tags & excessive whitespace
function sanitizeBody(text) {
  return text
    .replace(/<[^>]*>/g, '') // remove HTML tags
    .replace(/[\u0000-\u001F\u007F]/g, '') // control chars
    .trim();
}

// Helper: ensure room exists for (course, section)
async function ensureRoom(courseId, sectionId, userId) {
  let room = await ChatRoom.findOne({ course: courseId, section: sectionId });
  if (!room) {
    room = await ChatRoom.create({ course: courseId, section: sectionId, createdBy: userId, lastMessageAt: new Date() });
  }
  return room;
}

// Access control logic
function canDelete(role) {
  return ['admin', 'hod', 'dean'].includes(role);
}

function canSend(role) {
  return ['admin', 'hod', 'dean', 'teacher', 'student'].includes(role);
}

// Validate user participation based on role.
async function userHasAccess(user, courseId, sectionId) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  // dean: must match school
  if (user.role === 'dean') {
    const section = await Section.findById(sectionId).populate('school');
    return section && String(section.school?._id) === String(user.school);
  }
  // hod: must match department
  if (user.role === 'hod') {
    const section = await Section.findById(sectionId).populate('department').populate('courses');
    if (!section) {
      console.debug('[CHAT][ACCESS] HOD no section found', { sectionId });
      return false;
    }
    console.debug('[CHAT][ACCESS] HOD section found:', { 
      sectionId, 
      sectionDept: section.department?._id, 
      userDept: user.department, 
      courses: section.courses?.length 
    });
    // Direct department match
    if (section.department && String(section.department._id) === String(user.department)) {
      console.debug('[CHAT][ACCESS] HOD approved via department match');
      return true;
    }
    // Fallback: if section has no department, verify course's department
    if (!section.department) {
      console.debug('[CHAT][ACCESS] HOD checking course department fallback');
      const course = await Course.findById(courseId).populate('department');
      if (course && course.department && String(course.department._id) === String(user.department)) {
        // Ensure course actually belongs to the section's course list (safety)
        const inSection = section.courses?.some(c => String(c) === String(courseId) || String(c._id) === String(courseId));
        if (inSection) {
          console.debug('[CHAT][ACCESS] HOD approved via course department match');
          return true;
        }
      }
    }
    console.debug('[CHAT][ACCESS] HOD denied', { userDept: user.department, sectionDept: section.department?._id, courseId });
    return false;
  }
  // teacher: assigned to section or teaches course in that section
  if (user.role === 'teacher') {
    // Assuming section has teachers array or mapping
    const section = await Section.findById(sectionId).populate('courses');
    if (!section) return false;
    let teachesSection = false;
    // Legacy/multi-teacher support
    if (Array.isArray(section.teachers) && section.teachers.some(t => String(t) === String(user._id))) {
      teachesSection = true;
    }
    // Current schema singular teacher
    if (section.teacher && String(section.teacher) === String(user._id)) {
      teachesSection = true;
    }
    if (!teachesSection) {
      console.debug('[CHAT][ACCESS] teacher denied not assigned to section', { sectionId, userId: user._id, sectionTeacher: section.teacher });
      return false;
    }
    // If section has multiple courses, ensure courseId is part of section.courses
    const courseInSection = section.courses?.some(c => {
      const cId = c._id || c;
      return String(cId) === String(courseId);
    });
    if (!courseInSection) {
      console.debug('[CHAT][ACCESS] teacher denied course not in section', { sectionId, courseId, sectionCourses: section.courses?.map(c => c._id || c) });
    }
    return courseInSection;
  }
  // student: enrolled in section + course
  if (user.role === 'student') {
    // Assuming user has sections array
    const enrolledSection = user.sections?.some(s => String(s) === String(sectionId));
    if (!enrolledSection) return false;
    // Optionally verify course belongs to section
    const section = await Section.findById(sectionId).populate('courses');
    const courseInSection = section && section.courses?.some(c => {
      const cId = c._id || c;
      return String(cId) === String(courseId);
    });
    if (!courseInSection) {
      console.debug('[CHAT][ACCESS] student denied course not in section', { sectionId, courseId, sectionCourses: section.courses?.map(c => c._id || c) });
    }
    return courseInSection;
  }
  return false;
}

exports.getOrCreateRoom = async (req, res) => {
  try {
    const { courseId, sectionId } = req.body;
    console.debug('[CHAT][ROOM] Room request:', { courseId, sectionId, user: req.user.role, userId: req.user._id });
    if (!courseId || !sectionId) return res.status(400).json({ message: 'courseId and sectionId required' });
    const hasAccess = await userHasAccess(req.user, courseId, sectionId);
    console.debug('[CHAT][ROOM] Access check result:', hasAccess);
    if (!hasAccess) return res.status(403).json({ message: 'Forbidden' });
    const room = await ensureRoom(courseId, sectionId, req.user._id);
    res.json(room);
  } catch (err) {
    console.error('getOrCreateRoom error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.listMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { before, limit = 50 } = req.query;
    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    const hasAccess = await userHasAccess(req.user, room.course, room.section);
    if (!hasAccess) return res.status(403).json({ message: 'Forbidden' });

    const query = { room: room._id };
    if (before) query.createdAt = { $lt: new Date(before) };
    const messages = await ChatMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit), 100))
      .lean();
    res.json({ messages: messages.reverse() });
  } catch (err) {
    console.error('listMessages error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    let { body } = req.body;
    if (!body || !body.trim()) return res.status(400).json({ message: 'Message body required' });
    body = sanitizeBody(body);
    if (!body) return res.status(400).json({ message: 'Empty after sanitization' });
    if (body.length > 500) return res.status(400).json({ message: 'Message too long' });

    // Rate limiting
    if (!incrementAndCheckRate(String(req.user._id))) {
      return res.status(429).json({ message: 'Rate limit exceeded. Please wait a bit.' });
    }

    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (!canSend(req.user.role)) return res.status(403).json({ message: 'Cannot send messages' });
    const hasAccess = await userHasAccess(req.user, room.course, room.section);
    if (!hasAccess) return res.status(403).json({ message: 'Forbidden' });

    const msg = await ChatMessage.create({
      room: room._id,
      sender: req.user._id,
      senderRole: req.user.role,
      body
    });
    await ChatRoom.findByIdAndUpdate(room._id, { lastMessageAt: new Date() });
    res.status(201).json(msg);
  } catch (err) {
    console.error('sendMessage error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await ChatMessage.findById(messageId).populate({ path: 'room' });
    if (!message) return res.status(404).json({ message: 'Message not found' });
    const hasAccess = await userHasAccess(req.user, message.room.course, message.room.section);
    if (!hasAccess) return res.status(403).json({ message: 'Forbidden' });
    if (!canDelete(req.user.role)) return res.status(403).json({ message: 'No delete permission' });

    message.deleted = true;
    message.deletedAt = new Date();
    message.deletedBy = req.user._id;
    await message.save();
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('deleteMessage error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.purgeRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admin can purge' });
    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    await ChatMessage.updateMany({ room: room._id }, { deleted: true, deletedAt: new Date(), deletedBy: req.user._id });
    res.json({ message: 'Room purged' });
  } catch (err) {
    console.error('purgeRoom error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.listUserRooms = async (req, res) => {
  try {
    // Efficient approach: filter rooms by role scope.
    const role = req.user.role;
    let roomsQuery = {};

    if (role === 'student') {
      // rooms whose section is in user.sections
      roomsQuery.section = { $in: req.user.sections || [] };
    } else if (role === 'teacher') {
      // sections where user is a teacher
      roomsQuery.section = { $in: req.user.sectionsTeaching || [] };
    } else if (role === 'hod') {
      // sections in department
      roomsQuery = { };// optionally narrow by department via aggregate (skipped MVP)
    } else if (role === 'dean') {
      roomsQuery = { };// similarly for school scope
    } // admin sees all

    const rooms = await ChatRoom.find(roomsQuery)
      .sort({ lastMessageAt: -1 })
      .limit(100)
      .lean();
    res.json({ rooms });
  } catch (err) {
    console.error('listUserRooms error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
