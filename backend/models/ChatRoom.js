const mongoose = require('mongoose');
const { Schema } = mongoose;

// A chat room is uniquely identified by course + section.
// We do not embed messages here for scalability; they live in ChatMessage.
const chatRoomSchema = new Schema({
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  section: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
  // For quick listing / filtering
  lastMessageAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

chatRoomSchema.index({ course: 1, section: 1 }, { unique: true });
chatRoomSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
