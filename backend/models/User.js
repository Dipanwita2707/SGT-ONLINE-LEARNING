const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  regNo: { type: String, unique: true, sparse: true, index: true }, // Only for students - unique and sparse to allow null values
  teacherId: { type: String, unique: true, sparse: true, index: true }, // Only for teachers - unique and sparse
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true,
    set: v => v.toLowerCase() // Convert email to lowercase before saving
  },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'teacher', 'student', 'dean', 'hod'], required: true },
  permissions: [{ type: String }], // e.g., ['manage_teachers', 'manage_students']
  
  // Hierarchy fields
  school: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'School',
    required: function() {
      // School is required for all roles except admin
      return this.role !== 'admin';
    },
    index: true
  },
  department: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Department',
    required: function() {
      // Department is required for teachers and HODs
      return this.role === 'teacher' || this.role === 'hod';
    },
    index: true
  },
  
  // Legacy field - courses are now assigned through sections
  coursesAssigned: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true }],
  
  // Section assignments (students and teachers get courses through sections)
  assignedSections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section', index: true }],
  
  watchHistory: [{
    video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
    timeSpent: { type: Number, default: 0 }, // in seconds
    lastWatched: { type: Date },
    currentPosition: { type: Number, default: 0 }, // Current playback position in seconds
    playbackRate: { type: Number, default: 1 } // Playback speed (1x, 1.5x, 2x, etc.)
  }],
  isActive: { type: Boolean, default: true },
  canAnnounce: { type: Boolean, default: false }, // Allow teacher to post announcements
  emailVerified: { type: Boolean, default: false },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
}, {
  timestamps: true
});

// Compound index for fast search by regNo and email
userSchema.index({ regNo: 1, email: 1 });
userSchema.index({ role: 1, school: 1 });
userSchema.index({ role: 1, department: 1 });

// Virtual to get courses through sections
userSchema.virtual('coursesFromSections', {
  ref: 'Section',
  localField: 'assignedSections',
  foreignField: '_id',
  justOne: false
});

// Ensure email is always lowercase before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  
  // Generate teacherId for new teacher accounts
  if (this.isNew && this.role === 'teacher' && !this.teacherId) {
    try {
      // Find the highest existing teacherId
      const highestTeacher = await this.constructor.findOne(
        { teacherId: { $regex: /^T\d{4}$/ } },
        { teacherId: 1 },
        { sort: { teacherId: -1 } }
      );

      let nextNumber = 1;
      if (highestTeacher && highestTeacher.teacherId) {
        // Extract the number from existing ID and increment
        const currentNumber = parseInt(highestTeacher.teacherId.substring(1), 10);
        nextNumber = currentNumber + 1;
      }

      // Format with leading zeros to ensure 4 digits
      this.teacherId = 'T' + nextNumber.toString().padStart(4, '0');
    } catch (err) {
      return next(err);
    }
  }
  
  next();
});

module.exports = mongoose.model('User', userSchema);
