const express = require('express');
const router = express.Router();
const ccController = require('../controllers/ccController');
const { auth, authorizeRoles } = require('../middleware/auth');

// All CC routes require auth; allow teacher/hod/admin to view assigned CC courses
router.get('/courses', auth, authorizeRoles('teacher', 'cc', 'hod', 'admin'), ccController.getAssignedCourses);

// Review queue and actions for CC (teachers who are course coordinators are allowed)
router.get('/reviews/pending', auth, authorizeRoles('teacher', 'cc', 'hod', 'admin'), ccController.getPendingReviews);
router.post('/reviews/:reviewId/approve', auth, authorizeRoles('teacher', 'cc', 'hod', 'admin'), ccController.approveQuestion);
router.post('/reviews/:reviewId/flag', auth, authorizeRoles('teacher', 'cc', 'hod', 'admin'), ccController.flagQuestion);

module.exports = router;
