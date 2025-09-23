const Video = require('../models/Video');
const Course = require('../models/Course');
const User = require('../models/User');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const util = require('util');
const mongoose = require('mongoose');
const execPromise = util.promisify(exec);

// Get video duration using ffprobe
const getVideoDuration = async (filePath) => {
  try {
    // Check if ffprobe is available
    const { stdout, stderr } = await execPromise(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    );

    if (stderr) {
      // Only log actual errors, not just missing ffprobe
      if (!stderr.includes('is not recognized') && !stderr.includes('command not found')) {
        console.error('Error getting video duration:', stderr);
      }
      return null;
    }

    const duration = parseFloat(stdout.trim());
    return isNaN(duration) ? null : Math.round(duration);
  } catch (error) {
    // Don't log errors for missing ffprobe, just return null
    if (!error.message.includes('is not recognized') && !error.message.includes('command not found')) {
      console.error('Failed to get video duration:', error.message);
    }
    return null;
  }
};

// Upload video - Enhanced with video link support
exports.uploadVideo = async (req, res) => {
  try {
    const { title, description, courseId, unitId, videoLink, videoType } = req.body;
    
    // Validate required fields
    if (!title || !courseId) {
      return res.status(400).json({ message: 'Title and course ID are required' });
    }
    
    // Validate that either file or videoLink is provided based on videoType
    if (videoType === 'link') {
      if (!videoLink) {
        return res.status(400).json({ message: 'Video link is required for link uploads' });
      }
    } else {
      // Default to file upload if videoType not specified
      if (!req.file) {
        return res.status(400).json({ message: 'Video file is required for file uploads' });
      }
    }
    
    // Validate that we don't have both file and link
    if (req.file && videoLink) {
      return res.status(400).json({ message: 'Provide either video file OR video link, not both' });
    }
    
    // Find the course to validate it exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if course has units and unitId is required
    const Unit = require('../models/Unit');
    const unitCount = await Unit.countDocuments({ course: courseId });
    
    if (unitCount > 0 && (!unitId || !mongoose.Types.ObjectId.isValid(unitId))) {
      return res.status(400).json({ message: 'Unit selection is required for this course' });
    }
    
    // Get the first teacher from the course if available
    let teacherId = null;
    if (course.teachers && course.teachers.length > 0) {
      teacherId = course.teachers[0];
    }
    
    // Create video document - handle both file upload and video link
    const videoData = { 
      title, 
      description, 
      course: courseId, 
      teacher: teacherId
    };
    
    if (videoType === 'link' || (!req.file && videoLink)) {
      // Video link provided
      videoData.videoLink = videoLink;
      videoData.videoType = 'link';
    } else {
      // File uploaded
      const videoUrl = req.file.path.replace(/\\/g, '/');
      videoData.videoUrl = videoUrl;
      videoData.videoType = 'upload';
      
      // Try to get video duration for uploaded files
      try {
        const duration = await getVideoDuration(videoUrl);
        if (duration) videoData.duration = duration;
      } catch (err) {
        console.error('Error getting video duration:', err);
        // Continue without duration
      }
      
      // If ffprobe failed but frontend provided duration, use that
      if (!videoData.duration && req.body.duration) {
        videoData.duration = parseInt(req.body.duration, 10);
        console.log('Using duration from frontend:', videoData.duration, 'seconds');
      }
    }
    
    // If unitId is provided, associate the video with that unit
    if (unitId && mongoose.Types.ObjectId.isValid(unitId)) {
      // Check if the unit exists and belongs to this course
      const Unit = require('../models/Unit');
      const unit = await Unit.findOne({ _id: unitId, course: courseId });
      
      if (unit) {
        videoData.unit = unitId;
        videoData.sequence = unit.videos ? unit.videos.length + 1 : 1;
      }
    }
    
    const video = new Video(videoData);
    await video.save();
    
    // Add video to course
    await Course.findByIdAndUpdate(courseId, { $push: { videos: video._id } });
    
    // If video is associated with a unit, add it to that unit as well
    let unit = null;
    if (video.unit) {
      const Unit = require('../models/Unit');
      unit = await Unit.findByIdAndUpdate(video.unit, 
        { $push: { videos: video._id } },
        { new: true }
      );
      
      // If this is the first video, also set the hasUnits flag on the course
      await Course.findByIdAndUpdate(courseId, { $set: { hasUnits: true } });
    }

    // Unlock this video for all students assigned to this course
    const User = require('../models/User');
    const StudentProgress = require('../models/StudentProgress');
    
    // Find all students assigned to this course
    const students = await User.find({
      coursesAssigned: courseId,
      role: 'student'
    }).select('_id');
    
    // Unlock the video for each student and update unit progress
    for (const student of students) {
      try {
        // Update or create student progress
        let progress = await StudentProgress.findOne({
          student: student._id,
          course: courseId
        });

        if (!progress) {
          progress = new StudentProgress({
            student: student._id,
            course: courseId,
            videosUnlocked: [video._id],
            lastVideoUnlocked: video._id
          });
        } else {
          // Add to unlocked videos if not already present
          if (!progress.videosUnlocked.includes(video._id)) {
            progress.videosUnlocked.push(video._id);
            progress.lastVideoUnlocked = video._id;
          }
        }

        // If video is part of a unit, also update unit progress
        if (video.unit) {
          if (!progress.unitsAccessed) {
            progress.unitsAccessed = [];
          }
          if (!progress.unitsAccessed.includes(video.unit)) {
            progress.unitsAccessed.push(video.unit);
          }
        }

        await progress.save();
      } catch (err) {
        console.error(`Error updating progress for student ${student._id}:`, err);
        // Continue with next student
      }
    }
    
    // Populate course information for response
    const populatedVideo = await Video.findById(video._id)
      .populate('course', 'name')
      .populate('unit', 'title sequence')
      .populate('teacher', 'name');
    
    res.status(201).json({ 
      message: 'Video uploaded successfully', 
      video: populatedVideo,
      unit: unit
    });
  } catch (err) {
    console.error('Upload video error:', err);
    // Clean up uploaded file if there was an error and it exists
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error('Error deleting file after upload error:', unlinkErr);
      }
    }
    res.status(500).json({ message: err.message });
  }
};

// Get all videos with optional filtering
exports.getVideos = async (req, res) => {
  try {
    const { courseId, unitId, teacherId } = req.query;
    let filter = {};
    
    if (courseId) filter.course = courseId;
    if (unitId) filter.unit = unitId;
    if (teacherId) filter.teacher = teacherId;
    
    const videos = await Video.find(filter)
      .populate('course', 'name')
      .populate('unit', 'title sequence')
      .populate('teacher', 'name')
      .sort({ createdAt: -1 });
    
    res.json(videos);
  } catch (err) {
    console.error('Get videos error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get video by ID with progress tracking
exports.getVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('course', 'name')
      .populate('unit', 'title sequence')
      .populate('teacher', 'name');
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // If user is logged in and is a student, check their progress
    let progress = null;
    if (req.user && req.user.role === 'student') {
      const StudentProgress = require('../models/StudentProgress');
      progress = await StudentProgress.findOne({
        student: req.user._id || req.user.id,
        course: video.course._id
      });
    }
    
    res.json({ 
      video,
      progress: progress ? {
        isUnlocked: progress.videosUnlocked.includes(video._id),
        watchTime: progress.videoProgress ? progress.videoProgress.get(video._id.toString()) : 0
      } : null
    });
  } catch (err) {
    console.error('Get video error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Update video
exports.updateVideo = async (req, res) => {
  try {
    const { title, description, videoLink, videoType } = req.body;
    const videoId = req.params.id;
    
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Update basic fields
    if (title) video.title = title;
    if (description) video.description = description;
    
    // Handle video type changes
    if (videoType && videoType !== video.videoType) {
      if (videoType === 'link') {
        // Converting to link
        if (!videoLink) {
          return res.status(400).json({ message: 'Video link is required when changing to link type' });
        }
        
        // Clean up old file if it exists
        if (video.videoUrl && fs.existsSync(video.videoUrl)) {
          fs.unlinkSync(video.videoUrl);
        }
        
        video.videoUrl = undefined;
        video.videoLink = videoLink;
        video.videoType = 'link';
        video.duration = undefined; // Links don't have duration from server
      } else if (videoType === 'upload') {
        // Converting to upload - would need new file upload
        return res.status(400).json({ 
          message: 'To change to upload type, please delete this video and upload a new file' 
        });
      }
    } else if (videoType === 'link' && videoLink && videoLink !== video.videoLink) {
      // Just updating the link
      video.videoLink = videoLink;
    }
    
    await video.save();
    
    const updatedVideo = await Video.findById(videoId)
      .populate('course', 'name')
      .populate('unit', 'title sequence')
      .populate('teacher', 'name');
    
    res.json({ message: 'Video updated successfully', video: updatedVideo });
  } catch (err) {
    console.error('Update video error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Delete video
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Delete video file if it exists (only for uploaded files)
    if (video.videoUrl && video.videoType === 'upload') {
      const filePath = video.videoUrl;
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log('Video file deleted:', filePath);
        } catch (err) {
          console.error('Error deleting video file:', err);
        }
      }
    }
    
    // Remove video from course
    await Course.findByIdAndUpdate(video.course, { $pull: { videos: video._id } });
    
    // Remove video from unit if it was associated with one
    if (video.unit) {
      const Unit = require('../models/Unit');
      await Unit.findByIdAndUpdate(video.unit, { $pull: { videos: video._id } });
    }
    
    // Remove video from student progress
    const StudentProgress = require('../models/StudentProgress');
    await StudentProgress.updateMany(
      { course: video.course },
      { 
        $pull: { 
          videosUnlocked: video._id,
          videosWatched: video._id
        },
        $unset: { [`videoProgress.${video._id}`]: "" }
      }
    );
    
    await Video.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Video deleted successfully' });
  } catch (err) {
    console.error('Delete video error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Track video progress (for students)
exports.trackProgress = async (req, res) => {
  try {
    const { videoId, watchTime, completed } = req.body;
    const studentId = req.user._id || req.user.id;
    
    if (!videoId || watchTime === undefined) {
      return res.status(400).json({ message: 'Video ID and watch time are required' });
    }
    
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    const StudentProgress = require('../models/StudentProgress');
    let progress = await StudentProgress.findOne({
      student: studentId,
      course: video.course
    });
    
    if (!progress) {
      progress = new StudentProgress({
        student: studentId,
        course: video.course,
        videosUnlocked: [video._id],
        videoProgress: new Map([[videoId, watchTime]])
      });
    } else {
      // Update watch time
      progress.videoProgress.set(videoId, watchTime);
      
      // Mark as watched if completed
      if (completed && !progress.videosWatched.includes(video._id)) {
        progress.videosWatched.push(video._id);
      }
    }
    
    await progress.save();
    
    res.json({ message: 'Progress tracked successfully' });
  } catch (err) {
    console.error('Track progress error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get student's course videos with progress
exports.getStudentCourseVideos = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id || req.user.id;
    
    // Check if student has access to this course
    const student = await User.findById(studentId);
    if (!student.coursesAssigned.includes(courseId)) {
      return res.status(403).json({ message: 'Access denied to this course' });
    }
    
    // Get student progress
    const StudentProgress = require('../models/StudentProgress');
    const progress = await StudentProgress.findOne({
      student: studentId,
      course: courseId
    });
    
    // Get videos for the course
    const videos = await Video.find({ course: courseId })
      .populate('unit', 'title sequence')
      .sort({ 'unit.sequence': 1, sequence: 1, createdAt: 1 });
    
    // Add progress information to each video
    const videosWithProgress = videos.map(video => ({
      ...video.toObject(),
      isUnlocked: progress ? progress.videosUnlocked.includes(video._id) : false,
      isWatched: progress ? progress.videosWatched.includes(video._id) : false,
      watchTime: progress && progress.videoProgress ? 
        progress.videoProgress.get(video._id.toString()) || 0 : 0
    }));
    
    res.json(videosWithProgress);
  } catch (err) {
    console.error('Get student videos error:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = exports;