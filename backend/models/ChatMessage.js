const mongoose = require('mongoose');
const { Schema } = mongoose;

const chatMessageSchema = new Schema({
  room: { type: Schema.Types.ObjectId, ref: 'ChatRoom', required: true, index: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, required: true },
  body: { type: String, required: true, maxlength: 500 },
  deleted: { type: Boolean, default: false },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date },
}, { timestamps: true });

chatMessageSchema.index({ room: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
