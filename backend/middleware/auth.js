const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Populate minimal fields first
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ message: 'User not found' });

    // Augment with sections / teaching sections for chat access logic
    // We do lightweight queries only when needed based on role
    const Section = require('../models/Section');
    try {
      if (req.user.role === 'student') {
        // Sections where this student is enrolled
        const studentSections = await Section.find({ students: req.user._id }).select('_id');
        req.user.sections = studentSections.map(s => s._id);
      } else if (req.user.role === 'teacher') {
        // Sections where teacher is assigned (field 'teacher')
        const teacherSections = await Section.find({ teacher: req.user._id }).select('_id');
        req.user.sectionsTeaching = teacherSections.map(s => s._id);
      } else if (req.user.role === 'hod') {
        // Optionally limit later by department; no prefetch needed now
      } else if (req.user.role === 'dean') {
        // Optionally limit later by school; no prefetch needed now
      }
    } catch (e) {
      // Don't block auth on enrichment failure; just log
      console.error('Auth enrichment error (non-fatal):', e.message);
    }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Role-based access
const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role === 'admin') return next(); // Admin has full access
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// Permission-based access
const authorizePermissions = (...permissions) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role === 'admin') return next(); // Admin has full access
  if (!req.user.permissions || !permissions.some(p => req.user.permissions.includes(p))) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  next();
};

module.exports = { auth, authorizeRoles, authorizePermissions };
