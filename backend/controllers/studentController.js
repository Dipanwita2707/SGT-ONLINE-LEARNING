const User = require('../models/User');
const Video = require('../models/Video');
const Course = require('../models/Course');
const Section = require('../models/Section');
const QuizAttempt = require('../models/QuizAttempt');
const StudentProgress = require('../models/StudentProgress');
const mongoose = require('mongoose');

// Helper function to get student's courses via sections
const getStudentCoursesViaSections = async (studentId) => {
  const sections = await Section.find({ students: studentId })
    .populate('courses', '_id title courseCode description')
    .populate('teacher', 'name email');
  
  const courseMap = new Map();
  sections.forEach(section => {
    section.courses.forEach(course => {
      if (!courseMap.has(course._id.toString())) {
        courseMap.set(course._id.toString(), course._id);
      }
    });
  });
  
  return Array.from(courseMap.values());
};

// Helper function to check if student has access to course via sections
const studentHasAccessToCourse = async (studentId, courseId) => {
  const section = await Section.findOne({ 
    students: studentId, 
    courses: courseId 
  });
  return !!section;
};

// Get all courses assigned to student with progress info via sections
exports.getStudentCourses = async (req, res) => {
  console.log('🚀 [STUDENT CONTROLLER] getStudentCourses called!');
  console.log('🚀 [STUDENT CONTROLLER] Request URL:', req.originalUrl);
  console.log('🚀 [STUDENT CONTROLLER] Request method:', req.method);
  
  try {
    console.log('[Student Controller] Getting courses for student ID:', req.user._id);
    console.log('[Student Controller] Student email from token:', req.user.email);
    console.log('[Student Controller] Student role from token:', req.user.role);
    
    // Find sections where this student is assigned
    const sections = await Section.find({ students: req.user._id })
      .populate('courses', 'title courseCode description')
      .populate('teacher', 'name email')
      .populate('school', 'name')
      .populate('department', 'name');
    
    console.log(`[Student Controller] Found ${sections ? sections.length : 0} sections for student ${req.user._id}`);
    
    if (sections && sections.length > 0) {
      console.log('[Student Controller] Section details:');
      sections.forEach((section, index) => {
        console.log(`  Section ${index + 1}: ${section.name} (ID: ${section._id})`);
        console.log(`    Courses: ${section.courses ? section.courses.length : 0}`);
        console.log(`    Students: ${section.students ? section.students.length : 0}`);
        console.log(`    Teacher: ${section.teacher ? section.teacher.name : 'None'}`);
      });
    }
    
    if (!sections || sections.length === 0) {
      console.log('[Student Controller] No sections found for student:', req.user._id);
      
      // Let's also check if this student exists in the User collection
      const studentExists = await User.findById(req.user._id);
      console.log('[Student Controller] Student exists in database:', !!studentExists);
      if (studentExists) {
        console.log('[Student Controller] Student details:', {
          name: studentExists.name,
          email: studentExists.email,
          role: studentExists.role
        });
      }
      
      return res.json([]);
    }
    
    console.log(`Found ${sections.length} sections for student`);
    
    // Extract all unique courses from all sections
    const allCourses = [];
    const courseMap = new Map();
    
    sections.forEach(section => {
      section.courses.forEach(course => {
        if (!courseMap.has(course._id.toString())) {
          courseMap.set(course._id.toString(), {
            ...course.toObject(),
            section: {
              _id: section._id,
              name: section.name,
              school: section.school?.name,
              department: section.department?.name
            },
            teacher: section.teacher
          });
        }
      });
    });
    
    const student = await User.findById(req.user._id).select('watchHistory');
    
    // For each course, get videos and calculate progress
    const coursesWithProgress = await Promise.all(Array.from(courseMap.values()).map(async (course) => {
      // Get all videos for this course
      const courseWithVideos = await Course.findById(course._id)
        .populate('videos', 'title duration');
      
      if (!courseWithVideos || !courseWithVideos.videos) {
          return {
            _id: course._id,
            title: course.title,
            courseCode: course.courseCode,
            description: course.description,
            section: course.section,
            sectionId: course.section?._id, // Added for chat context
            teacher: course.teacher?.name || 'Not assigned',
            teacherName: course.teacher?.name || 'Not assigned', // Frontend expects this field
            totalVideos: 0,
            videoCount: 0, // Frontend expects this field
            videosCompleted: 0,
            progress: 0,
            totalDuration: 0
          };
      }
      
      // Calculate progress
      const totalVideos = courseWithVideos.videos.length;
      
      // Calculate total duration
      let totalDuration = 0;
      courseWithVideos.videos.forEach(video => {
        if (video.duration && video.duration > 0) {
          totalDuration += video.duration;
        }
      });
      
      let videosCompleted = 0;
      let videosStarted = 0;
      
      courseWithVideos.videos.forEach(video => {
        const watchRecord = student.watchHistory.find(
          record => record.video && record.video.toString() === video._id.toString()
        );
        
        if (watchRecord && watchRecord.timeSpent > 0) {
          videosStarted++;
          
          // If video has duration, check if it's completed (90% watched)
          if (video.duration && video.duration > 0) {
            const percentageWatched = (watchRecord.timeSpent / video.duration) * 100;
            if (percentageWatched >= 90) {
              videosCompleted++;
            }
          }
        }
      });
      
      const progress = totalVideos > 0
        ? Math.round((videosCompleted / totalVideos) * 100)
        : 0;
      
        return {
          _id: course._id,
          title: course.title,
          courseCode: course.courseCode,
          description: course.description,
            section: course.section,
            sectionId: course.section?._id, // Added for chat context
          teacher: course.teacher?.name || 'Not assigned',
          teacherName: course.teacher?.name || 'Not assigned', // Frontend expects this field
          totalVideos,
          videoCount: totalVideos, // Frontend expects this field  
          videosStarted,
          videosCompleted,
          progress,
          totalDuration
        };
    }));
    
    res.json(coursesWithProgress);
  } catch (err) {
    console.error('Error getting student courses:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get videos for a course (grouped by units if available)
exports.getCourseVideos = async (req, res) => {
  try {
    const { courseId } = req.params;
    console.log('Student getCourseVideos called for course:', courseId, 'by user:', req.user._id);
    
    // Check if student has access to this course via sections
    const hasAccess = await studentHasAccessToCourse(req.user._id, courseId);
    if (!hasAccess) {
      console.log('Student does not have access to course:', courseId);
      return res.status(403).json({ message: 'You do not have access to this course' });
    }
    
    // Get student data with watch history
    const student = await User.findById(req.user._id).select('watchHistory');
    if (!student) {
      console.log('Student not found:', req.user._id);
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const course = await Course.findById(courseId)
      .populate('units');

    if (!course) {
      console.log('Course not found:', courseId);
      return res.status(404).json({ message: 'Course not found' });
    }

    console.log('Student has section-based access to course:', courseId);
    
    // Get student progress for this course
    const progress = await StudentProgress.findOne({ student: req.user._id, course: courseId });
    let unlockedVideoIds = progress ? progress.unlockedVideos.map(id => id.toString()) : [];
    
    console.log('Student progress found:', !!progress);
    console.log('Unlocked videos:', unlockedVideoIds.length);

    // If no progress exists, create initial progress with only first video unlocked
    if (!progress) {
      console.log('No progress found, creating initial progress for course');
      
      // Get first video from first unit to unlock it
      const Unit = require('../models/Unit');
      const firstUnit = await Unit.findOne({ course: courseId })
        .sort('order')
        .populate('videos');
      
      let firstVideoId = null;
      if (firstUnit && firstUnit.videos && firstUnit.videos.length > 0) {
        // Sort videos by sequence and get the first one
        const sortedVideos = firstUnit.videos.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
        firstVideoId = sortedVideos[0]._id.toString();
      } else {
        // Fallback: get first video from course (non-unit based)
        const Video = require('../models/Video');
        const firstVideo = await Video.findOne({ course: courseId }).sort('createdAt');
        if (firstVideo) {
          firstVideoId = firstVideo._id.toString();
        }
      }
      
      // Create new progress record with only first video unlocked
      const initialUnlockedVideos = firstVideoId ? [firstVideoId] : [];
      
      const initialUnits = [];
      if (firstUnit) {
        initialUnits.push({
          unitId: firstUnit._id,
          status: 'in-progress',
          unlocked: true,
          unlockedAt: new Date(),
          videosWatched: [],
          quizAttempts: [],
          unitQuizCompleted: false,
          unitQuizPassed: false,
          allVideosWatched: false
        });
      }
      
      await StudentProgress.create({
        student: req.user._id,
        course: courseId,
        unlockedVideos: initialUnlockedVideos,
        units: initialUnits,
        overallProgress: 0,
        lastActivity: new Date()
      });
      
      unlockedVideoIds = initialUnlockedVideos;
      console.log('Created initial progress with first video unlocked:', firstVideoId);
    } else if (unlockedVideoIds.length === 0) {
      // If progress exists but no videos unlocked, unlock first video
      const Unit = require('../models/Unit');
      const firstUnit = await Unit.findOne({ course: courseId })
        .sort('order')
        .populate('videos');
      
      let firstVideoId = null;
      if (firstUnit && firstUnit.videos && firstUnit.videos.length > 0) {
        const sortedVideos = firstUnit.videos.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
        firstVideoId = sortedVideos[0]._id.toString();
        
        // Also ensure first unit is marked as unlocked
        const firstUnitIndex = progress.units.findIndex(
          u => u.unitId.toString() === firstUnit._id.toString()
        );
        
        if (firstUnitIndex === -1) {
          progress.units.push({
            unitId: firstUnit._id,
            status: 'in-progress',
            unlocked: true,
            unlockedAt: new Date(),
            videosWatched: [],
            quizAttempts: [],
            unitQuizCompleted: false,
            unitQuizPassed: false,
            allVideosWatched: false
          });
        } else {
          progress.units[firstUnitIndex].unlocked = true;
          progress.units[firstUnitIndex].status = 'in-progress';
        }
      }
      
      if (firstVideoId) {
        progress.unlockedVideos = [firstVideoId];
        await progress.save();
        unlockedVideoIds = [firstVideoId];
        console.log('Unlocked first video for existing progress:', firstVideoId);
      }
    }

    // Check for newly added videos that should be unlocked
    // This handles the case where admin uploads new videos to existing courses
    if (progress) {
      let hasNewVideos = false;
      
      // Get all videos in the course
      const Video = require('../models/Video');
      const allCourseVideos = await Video.find({ course: courseId }).sort('sequence');
      
      // For each unlocked unit, ensure all videos in sequence are unlocked
      for (const video of allCourseVideos) {
        if (video.unit) {
          // Check if this video's unit is unlocked
          const unitProgress = progress.units?.find(
            u => u.unitId.toString() === video.unit.toString()
          );
          
          if (unitProgress && unitProgress.unlocked) {
            // Get all videos in this unit sorted by sequence
            const unitVideos = allCourseVideos
              .filter(v => v.unit && v.unit.toString() === video.unit.toString())
              .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
            
            // Find which videos should be unlocked based on completion
            let shouldUnlockIndex = 0; // At least first video should be unlocked
            
            // Check completion of videos to determine how many should be unlocked
            for (let i = 0; i < unitVideos.length; i++) {
              const videoInUnit = unitVideos[i];
              const watchRecord = student.watchHistory.find(
                record => record.video && record.video.toString() === videoInUnit._id.toString()
              );
              
              const isCompleted = watchRecord && (
                (videoInUnit.duration && videoInUnit.duration > 0 && watchRecord.timeSpent >= videoInUnit.duration * 0.9) ||
                ((!videoInUnit.duration || videoInUnit.duration < 1) && watchRecord.timeSpent >= 5)
              );
              
              if (isCompleted && i < unitVideos.length - 1) {
                shouldUnlockIndex = i + 1; // Unlock next video
              }
            }
            
            // Unlock videos up to the determined index
            for (let i = 0; i <= shouldUnlockIndex && i < unitVideos.length; i++) {
              const videoToUnlock = unitVideos[i];
              if (!unlockedVideoIds.includes(videoToUnlock._id.toString())) {
                progress.unlockedVideos.push(videoToUnlock._id);
                unlockedVideoIds.push(videoToUnlock._id.toString());
                hasNewVideos = true;
                console.log('Auto-unlocked new video in unit:', videoToUnlock.title);
              }
            }
          }
        } else {
          // For videos not in units, check if they should be unlocked based on sequence
          const nonUnitVideos = allCourseVideos
            .filter(v => !v.unit)
            .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
          
          // At least the first non-unit video should be unlocked
          if (nonUnitVideos.length > 0 && !unlockedVideoIds.includes(nonUnitVideos[0]._id.toString())) {
            progress.unlockedVideos.push(nonUnitVideos[0]._id);
            unlockedVideoIds.push(nonUnitVideos[0]._id.toString());
            hasNewVideos = true;
            console.log('Auto-unlocked first non-unit video:', nonUnitVideos[0].title);
          }
        }
      }
      
      // Save progress if we unlocked new videos
      if (hasNewVideos) {
        await progress.save();
        console.log('Updated progress with newly unlocked videos');
      }
    }

    // Return unit-based organization if course has units
    if (course.hasUnits && course.units && course.units.length > 0) {
      // Get units with videos and progress info
      const Unit = require('../models/Unit');
      const units = await Unit.find({ course: courseId })
        .sort('order')
        .populate({
          path: 'videos',
          select: 'title description videoUrl teacher duration sequence unit',
          populate: {
            path: 'teacher',
            select: 'name'
          },
          options: { sort: { sequence: 1 } }
        });

      // Process units with video watch history
      const unitsWithProgress = units.map(unit => {
        // Check if unit is unlocked for this student
        const unitProgress = progress?.units?.find(
          u => u.unitId.toString() === unit._id.toString()
        );
        
        const isUnitUnlocked = unitProgress ? unitProgress.unlocked : 
          // First unit is always unlocked by default
          unit.order === 0;
        
        // Only include videos that are unlocked and part of this unit
        const videosWithWatchInfo = unit.videos
          .filter(video => unlockedVideoIds.includes(video._id.toString()))
          .map(video => {
            const watchRecord = student.watchHistory.find(
              record => record.video && record.video.toString() === video._id.toString()
            );
            const timeSpent = watchRecord ? watchRecord.timeSpent : 0;
            const lastWatched = watchRecord ? watchRecord.lastWatched : null;
            const watched = (video.duration && video.duration > 0 && timeSpent >= video.duration * 0.9) ||
                    ((!video.duration || video.duration < 1) && timeSpent >= 5);
            return {
              _id: video._id,
              title: video.title,
              description: video.description,
              videoUrl: video.videoUrl && video.videoUrl.startsWith('http') ? video.videoUrl : `${req.protocol}://${req.get('host')}/${(video.videoUrl || '').replace(/\\/g, '/')}`,
              duration: video.duration || 0,
              teacher: video.teacher,
              sequence: video.sequence,
              timeSpent,
              lastWatched,
              watched
            };
          });
        
        // Derive latest quiz attempt if available
        let latestQuizAttempt = null;
        if (unitProgress && Array.isArray(unitProgress.quizAttempts) && unitProgress.quizAttempts.length > 0) {
          latestQuizAttempt = [...unitProgress.quizAttempts]
            .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0))[0];
        }

        return {
          _id: unit._id,
          title: unit.title,
          description: unit.description,
          order: unit.order,
          unlocked: isUnitUnlocked,
          progress: unitProgress ? {
            status: unitProgress.status,
            videosCompleted: unitProgress.videosWatched.filter(v => v.completed).length,
            totalVideos: unit.videos.length,
            unitQuizCompleted: !!unitProgress.unitQuizCompleted,
            unitQuizPassed: !!unitProgress.unitQuizPassed,
            latestQuizAttempt: latestQuizAttempt ? {
              percentage: latestQuizAttempt.percentage || latestQuizAttempt.score || 0,
              passed: !!latestQuizAttempt.passed,
              completedAt: latestQuizAttempt.completedAt || null
            } : null
          } : {
            status: isUnitUnlocked ? 'in-progress' : 'locked',
            videosCompleted: 0,
            totalVideos: unit.videos.length,
            unitQuizCompleted: false,
            unitQuizPassed: false,
            latestQuizAttempt: null
          },
          videos: videosWithWatchInfo
        };
      });

      // Find a section that links this student + course to expose sectionId for chat
      const sectionForCourse = await Section.findOne({ students: req.user._id, courses: courseId }).select('_id');
      return res.json({
        course: {
          _id: course._id,
          title: course.title,
          courseCode: course.courseCode,
          description: course.description,
          hasUnits: true,
          sectionId: sectionForCourse?._id
        },
        units: unitsWithProgress
      });
    } else {
      // Fall back to non-unit behavior for courses without units
      // Fetch all videos for this course
      const videos = await Video.find({ course: courseId })
        .populate('teacher', 'name')
        .sort('createdAt');

      // Add watch history info only for unlocked videos
      const videosWithWatchInfo = videos
        .filter(video => unlockedVideoIds.includes(video._id.toString()))
        .map(video => {
          const watchRecord = student.watchHistory.find(
            record => record.video && record.video.toString() === video._id.toString()
          );
          const timeSpent = watchRecord ? watchRecord.timeSpent : 0;
          const lastWatched = watchRecord ? watchRecord.lastWatched : null;
          const watched = (video.duration && video.duration > 0 && timeSpent >= video.duration * 0.9) ||
                  ((!video.duration || video.duration < 1) && timeSpent >= 5);
          return {
            _id: video._id,
            title: video.title,
            description: video.description,
            videoUrl: video.videoUrl && video.videoUrl.startsWith('http') ? video.videoUrl : `${req.protocol}://${req.get('host')}/${(video.videoUrl || '').replace(/\\/g, '/')}`,
            duration: video.duration || 0,
            teacher: video.teacher,
            timeSpent,
            lastWatched,
            watched
          };
        });

      const sectionForCourse = await Section.findOne({ students: req.user._id, courses: courseId }).select('_id');
      return res.json({
        course: {
          _id: course._id,
          title: course.title,
          courseCode: course.courseCode,
          description: course.description,
          hasUnits: false,
          sectionId: sectionForCourse?._id
        },
        videos: videosWithWatchInfo
      });
    }
  } catch (err) {
    console.error('Error getting course videos:', err);
    res.status(500).json({ message: err.message });
  }
};

// Update watch history for a video
exports.updateWatchHistory = async (req, res) => {
  console.log('🎬 updateWatchHistory called:', {
    videoId: req.params.videoId,
    userId: req.user?._id,
    userRole: req.user?.role,
    bodyKeys: Object.keys(req.body || {}),
    body: req.body
  });
  
  try {
    const { videoId } = req.params;
    const { 
      timeSpent, 
      sessionTime, 
      segmentTime, 
      currentTime, 
      duration, 
      isCompleted, 
      sessionCount, 
      segmentsWatched, 
      totalSegments,
      completionPercentage,
      averageSessionLength 
    } = req.body;
    
    // Validate input - accept either timeSpent or segmentTime
    const primaryTimeValue = segmentTime || timeSpent;
    if (!primaryTimeValue || isNaN(primaryTimeValue)) {
      return res.status(400).json({ message: 'Valid timeSpent or segmentTime is required' });
    }
    
    // Find video to get course info and unit info if available
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Validate user exists
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User authentication required' });
    }
    
    // Check if student is assigned to this course
    const student = await User.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if student has access to this course via sections
    const hasAccess = await studentHasAccessToCourse(req.user._id, video.course.toString());
    if (!hasAccess) {
      return res.status(403).json({ message: 'You are not assigned to this course' });
    }
    
    // Check if video is unlocked for this student
    const progress = await StudentProgress.findOne({ 
      student: req.user._id, 
      course: video.course 
    });
    
    if (!progress) {
      return res.status(403).json({ message: 'Course progress not found' });
    }
    
    // Initialize unlockedVideos if it doesn't exist
    if (!progress.unlockedVideos) {
      progress.unlockedVideos = [];
    }
    
    if (!progress.unlockedVideos.includes(videoId)) {
      return res.status(403).json({ message: 'This video is not unlocked for you yet' });
    }
    
    // Initialize watchHistory if it doesn't exist
    if (!student.watchHistory) {
      student.watchHistory = [];
    }
    
    // Find existing watch record for this video
    const existingRecord = student.watchHistory.find(
      record => record.video && record.video.toString() === videoId
    );
    
    let actualTimeSpent;
    const videoDuration = video.duration || duration || 600; // Use video duration, or provided duration, or default
    const maxAllowedTime = Math.max(videoDuration * 1.2, 600); // Allow 20% buffer for seeking/rewatching

    if (existingRecord) {
      // For existing records, use the more accurate tracking method
      // Prefer segmentTime for rewatching scenarios, sessionTime for linear viewing
      let newTimeSpent;
      
      if (segmentTime !== undefined && segmentTime > 0) {
        // Segment-based tracking is more accurate for rewatching
        newTimeSpent = Math.min(segmentTime, videoDuration);
      } else if (sessionTime !== undefined) {
        // Session-based tracking, accumulate carefully
        newTimeSpent = Math.min(existingRecord.timeSpent + (sessionTime * 0.8), maxAllowedTime);
      } else {
        // Fallback to basic timeSpent logic
        newTimeSpent = Math.max(existingRecord.timeSpent, Math.min(timeSpent, maxAllowedTime));
      }
      
      // Only update if the new time is reasonable
      if (newTimeSpent >= existingRecord.timeSpent * 0.9) { // Allow small decreases due to better accuracy
        existingRecord.timeSpent = newTimeSpent;
      }
      
      // Update position and enhanced metadata
      if (currentTime !== undefined) {
        existingRecord.currentPosition = currentTime;
      }
      
      // Store enhanced analytics metadata (only basic fields supported by schema)
      existingRecord.lastWatched = new Date();
      actualTimeSpent = existingRecord.timeSpent;
      
      console.log(`📊 Updated watch record for ${videoId}:`);
      console.log(`   Time: ${actualTimeSpent.toFixed(2)}s (${Math.floor(actualTimeSpent/60)}m ${Math.floor(actualTimeSpent%60)}s)`);
      console.log(`   Position: ${existingRecord.currentPosition || 0}s`);
    } else {
      // Add new record with enhanced validation
      const validatedTimeSpent = Math.min(Math.max(primaryTimeValue, 0), maxAllowedTime);
      
      const newRecord = {
        video: videoId,
        timeSpent: validatedTimeSpent,
        currentPosition: currentTime || 0,
        lastWatched: new Date()
      };
      
      // Note: Enhanced analytics metadata not stored in User schema
      // Only basic watchHistory fields are supported
      
      student.watchHistory.push(newRecord);
      actualTimeSpent = validatedTimeSpent;
      
      console.log(`📊 Created new watch record for ${videoId}:`);
      console.log(`   Time: ${actualTimeSpent.toFixed(2)}s (${Math.floor(actualTimeSpent/60)}m ${Math.floor(actualTimeSpent%60)}s)`);
      console.log(`   Position: ${currentTime || 0}s`);
      
      if (validatedTimeSpent !== timeSpent) {
        console.warn(`Adjusted new record timeSpent from ${timeSpent} to ${validatedTimeSpent} for video ${videoId} (duration: ${videoDuration})`);
      }
    }
    
    await student.save();
    
    // Update StudentProgress
    if (progress) {
      // Check if video is completed based on multiple criteria
      const timeBasedCompletion = actualTimeSpent >= videoDuration * 0.9;
      const positionBasedCompletion = currentTime && currentTime >= videoDuration * 0.95;
      const explicitCompletion = isCompleted === true;
      
      const videoIsCompleted = timeBasedCompletion || positionBasedCompletion || explicitCompletion;
        
      console.log(`📊 Completion check for ${videoId}:`);
      console.log(`   Time: ${actualTimeSpent.toFixed(2)}s / ${videoDuration.toFixed(2)}s (${(actualTimeSpent/videoDuration*100).toFixed(1)}%)`);
      console.log(`   Position: ${(currentTime || 0).toFixed(2)}s (${(((currentTime || 0)/videoDuration)*100).toFixed(1)}%)`);
      console.log(`   Completed: ${videoIsCompleted} (time: ${timeBasedCompletion}, position: ${positionBasedCompletion}, explicit: ${explicitCompletion})`);
      
      // Add to completed videos if not already there and it's completed
      if (videoIsCompleted && !progress.completedVideos?.includes(videoId)) {
        // Ensure completedVideos array exists
        if (!progress.completedVideos) {
          progress.completedVideos = [];
        }
        progress.completedVideos.push(videoId);
        console.log(`✅ Video ${videoId} marked as completed`);
        
        // When a video is completed, unlock the next video in sequence
        try {
          await unlockNextVideoInSequence(progress, video);
        } catch (unlockError) {
          console.error('Error unlocking next video:', unlockError);
          // Don't fail the entire request, just log the error
        }
      }
      
      // If video is part of a unit, update unit progress as well
      if (video.unit) {
        try {
          // Initialize units array if it doesn't exist
          if (!progress.units) {
            progress.units = [];
          }
          
          // Find the unit in the student's progress
          const unitIndex = progress.units.findIndex(
            u => u.unitId && u.unitId.toString() === video.unit.toString()
          );
          
          if (unitIndex !== -1) {
            // Initialize videosWatched array if it doesn't exist
            if (!progress.units[unitIndex].videosWatched) {
              progress.units[unitIndex].videosWatched = [];
            }
            
            // Unit found, check if this video is already tracked
            const videoWatchIndex = progress.units[unitIndex].videosWatched.findIndex(
              v => v.videoId && v.videoId.toString() === videoId
            );
            
            if (videoWatchIndex !== -1) {
              // Update existing record
              progress.units[unitIndex].videosWatched[videoWatchIndex].timeSpent = 
                Math.max(progress.units[unitIndex].videosWatched[videoWatchIndex].timeSpent || 0, timeSpent || 0);
              progress.units[unitIndex].videosWatched[videoWatchIndex].lastWatched = new Date();
              progress.units[unitIndex].videosWatched[videoWatchIndex].completed = isCompleted;
              console.log(`[updateWatchHistory] Updated unit video: ${videoId}, completed: ${isCompleted}`);
            } else {
              // Add new record
              progress.units[unitIndex].videosWatched.push({
                videoId,
                timeSpent: timeSpent || 0,
                lastWatched: new Date(),
                completed: isCompleted
              });
              console.log(`[updateWatchHistory] Added unit video: ${videoId}, completed: ${isCompleted}`);
            }
            
            // Check if all videos in this unit are completed to update unit status
            try {
              const Unit = require('../models/Unit');
              const unit = await Unit.findById(video.unit);
              
              if (unit && unit.videos && Array.isArray(unit.videos)) {
                const unitVideosCompleted = progress.units[unitIndex].videosWatched.filter(v => v.completed).length;
                const totalUnitVideos = unit.videos.length;
                
                // Update the videosCompleted counter to match
                progress.units[unitIndex].videosCompleted = unitVideosCompleted;
                
                console.log(`[updateWatchHistory] Unit ${unit.title}: ${unitVideosCompleted}/${totalUnitVideos} videos completed`);
                
                // If all videos in unit are completed, mark unit videos as completed
                if (unitVideosCompleted === totalUnitVideos && totalUnitVideos > 0) {
                  progress.units[unitIndex].allVideosWatched = true;
                  
                  console.log(`[updateWatchHistory] All videos completed in unit ${unit.title}. Quiz is now available.`);
                  
                  // Note: We don't automatically unlock the next unit here.
                  // The next unit should only be unlocked after passing the unit quiz.
                  // If there's no quiz requirement, it will be handled by the quiz system.
                }
              }
            } catch (unitError) {
              console.error('Error updating unit progress:', unitError);
              // Don't fail the entire request, just log the error
            }
          } else {
            // Unit not found in progress, add it
            if (isCompleted) {
              progress.units.push({
                unitId: video.unit,
                status: 'in-progress',
                unlocked: true,
                unlockedAt: new Date(),
                videosWatched: [{
                  videoId,
                  timeSpent: timeSpent || 0,
                  lastWatched: new Date(),
                  completed: isCompleted
                }],
                quizAttempts: [],
                unitQuizCompleted: false,
                unitQuizPassed: false,
                allVideosWatched: false,
                videosCompleted: 1
              });
              console.log(`[updateWatchHistory] Added new unit progress for unit: ${video.unit}, video: ${videoId}, completed: ${isCompleted}`);
            }
          }
        } catch (unitError) {
          console.error('Error in unit progress section:', unitError);
          // Don't fail the entire request, just log the error
        }
      }
      
      // Update last activity timestamp
      progress.lastActivity = new Date();
      
      // Calculate overall course progress
      try {
        const Course = require('../models/Course');
        const course = await Course.findById(video.course).populate('videos');
        
        if (course && course.videos) {
          const totalVideos = course.videos.length;
          const completedVideos = progress.completedVideos ? progress.completedVideos.length : 0;
          
          progress.overallProgress = totalVideos > 0
            ? Math.round((completedVideos / totalVideos) * 100)
            : 0;
        }
      } catch (courseError) {
        console.error('Error calculating course progress:', courseError);
        // Don't fail the entire request, just log the error
      }
      
      await progress.save();
    }
    
    // Debug: print unit progress after update
    if (video.unit && progress) {
      const unitIndex = progress.units.findIndex(u => u.unitId && u.unitId.toString() === video.unit.toString());
      if (unitIndex !== -1) {
        console.log('[updateWatchHistory] Unit progress after update:', JSON.stringify(progress.units[unitIndex], null, 2));
      }
    }
    res.json({ 
      message: 'Watch history updated',
      timeSpent: actualTimeSpent || timeSpent,
      lastWatched: new Date()
    });
  } catch (err) {
    console.error('Error updating watch history:', err);
    console.error('Stack trace:', err.stack);
    console.error('Request body:', req.body);
    console.error('Video ID:', req.params.videoId);
    console.error('User ID:', req.user?._id);
    
    // Return a more specific error message based on the error type
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error: ' + err.message,
        details: err.errors 
      });
    } else if (err.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid ID format: ' + err.message 
      });
    } else if (err.code === 11000) {
      return res.status(409).json({ 
        message: 'Duplicate entry error: ' + err.message 
      });
    } else {
      return res.status(500).json({ 
        message: 'Internal server error while updating watch history',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    }
  }
};

// Get watch history for a student across all courses
exports.getStudentWatchHistory = async (req, res) => {
  try {
    const student = await User.findById(req.user._id)
      .populate('watchHistory.video', 'title course');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Get student's courses via sections
    const studentCourseIds = await getStudentCoursesViaSections(req.user._id);
    const courses = await Course.find({ _id: { $in: studentCourseIds } })
      .select('title courseCode');
    
    // Group watch history by course
    const watchHistoryByCourse = {};
    
    for (const record of student.watchHistory) {
      if (!record.video) continue;
      
      const courseId = record.video.course ? record.video.course.toString() : 'unknown';
      
      if (!watchHistoryByCourse[courseId]) {
        const course = courses.find(c => c._id.toString() === courseId);
        watchHistoryByCourse[courseId] = {
          courseId,
          courseTitle: course ? course.title : 'Unknown Course',
          courseCode: course ? course.courseCode : 'N/A',
          totalTimeSpent: 0,
          videos: []
        };
      }
      
      watchHistoryByCourse[courseId].totalTimeSpent += record.timeSpent;
      watchHistoryByCourse[courseId].videos.push({
        videoId: record.video._id,
        videoTitle: record.video.title,
        timeSpent: record.timeSpent,
        lastWatched: record.lastWatched
      });
    }
    
    // Convert to array and sort by most watched
    const sortedWatchHistory = Object.values(watchHistoryByCourse)
      .sort((a, b) => b.totalTimeSpent - a.totalTimeSpent);
    
    res.json(sortedWatchHistory);
  } catch (err) {
    console.error('Error getting student watch history:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get detailed progress for a specific course
exports.getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Find course with videos
    const course = await Course.findById(courseId)
      .populate('videos', 'title duration');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Get student with watch history
    const student = await User.findById(req.user._id)
      .select('watchHistory');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Calculate progress for each video
    const videoProgress = course.videos.map(video => {
      const watchRecord = student.watchHistory.find(
        record => record.video && record.video.toString() === video._id.toString()
      );
      
      const timeSpent = watchRecord ? watchRecord.timeSpent : 0;
      const lastWatched = watchRecord ? watchRecord.lastWatched : null;
      
      // Calculate percentage if duration is available
      let percentageCompleted = 0;
      if (video.duration && video.duration > 0) {
        percentageCompleted = Math.min(100, Math.round((timeSpent / video.duration) * 100));
      }
      
      return {
        videoId: video._id,
        title: video.title,
        timeSpent,
        lastWatched,
        percentageCompleted
      };
    });
    
    // Calculate overall course progress
    const totalVideos = course.videos.length;
    const videosStarted = videoProgress.filter(v => v.timeSpent > 0).length;
    const videosCompleted = videoProgress.filter(v => v.percentageCompleted >= 90).length;
    
    const overallPercentage = totalVideos > 0
      ? Math.round((videosCompleted / totalVideos) * 100)
      : 0;
    
    res.json({
      courseId: course._id,
      courseTitle: course.title,
      courseCode: course.courseCode,
      totalVideos,
      videosStarted,
      videosCompleted,
      overallPercentage,
      videoProgress
    });
  } catch (err) {
    console.error('Error getting course progress:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get student's quiz pool attempts for a course
exports.getStudentQuizPoolAttempts = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if student has access to this course via sections
    const hasAccess = await studentHasAccessToCourse(req.user._id, courseId);
    if (!hasAccess) {
      return res.status(403).json({ message: 'You are not assigned to this course' });
    }
    
    // Get all quiz pool attempts for this student in this course
    const attempts = await QuizAttempt.find({
      student: req.user._id,
      course: courseId,
      quizPool: { $exists: true }
    })
    .populate('quizPool', 'title description questionsPerAttempt passingScore')
    .populate('unit', 'title sequence')
    .populate('video', 'title')
    .sort({ completedAt: -1 });
    
    // Format the response
    const formattedAttempts = attempts.map(attempt => ({
      _id: attempt._id,
      quizPool: {
        _id: attempt.quizPool._id,
        title: attempt.quizPool.title,
        description: attempt.quizPool.description,
        questionsPerAttempt: attempt.quizPool.questionsPerAttempt,
        passingScore: attempt.quizPool.passingScore
      },
      unit: attempt.unit ? {
        _id: attempt.unit._id,
        title: attempt.unit.title,
        sequence: attempt.unit.sequence
      } : null,
      video: attempt.video ? {
        _id: attempt.video._id,
        title: attempt.video.title
      } : null,
      score: attempt.score,
      maxScore: attempt.maxScore,
      percentage: attempt.percentage,
      passed: attempt.passed,
      timeSpent: attempt.timeSpent,
      completedAt: attempt.completedAt,
      questionCount: attempt.questions.length
    }));
    
    res.json(formattedAttempts);
  } catch (err) {
    console.error('Error getting student quiz pool attempts:', err);
    res.status(500).json({ message: err.message });
  }
};

// Helper function to unlock next unit after completion
async function unlockNextUnitAfterCompletion(progress, courseId, currentUnitOrder) {
  try {
    const Unit = require('../models/Unit');
    
    // Find next unit by order
    const nextUnit = await Unit.findOne({
      course: courseId,
      order: currentUnitOrder + 1
    });
    
    if (nextUnit) {
      // Check if next unit is already in progress record
      const nextUnitIndex = progress.units.findIndex(
        u => u.unitId && u.unitId.toString() === nextUnit._id.toString()
      );
      
      if (nextUnitIndex !== -1) {
        // Update existing unit record
        progress.units[nextUnitIndex].unlocked = true;
        progress.units[nextUnitIndex].status = 'in-progress';
        progress.units[nextUnitIndex].unlockedAt = new Date();
      } else {
        // Add new unit record
        progress.units.push({
          unitId: nextUnit._id,
          status: 'in-progress',
          unlocked: true,
          unlockedAt: new Date(),
          videosWatched: [],
          quizAttempts: [],
          unitQuizCompleted: false,
          unitQuizPassed: false,
          allVideosWatched: false
        });
      }
      
      // Unlock only the first video in the next unit
      if (nextUnit.videos && nextUnit.videos.length > 0) {
        const firstVideoId = nextUnit.videos[0];
        if (!progress.unlockedVideos.includes(firstVideoId)) {
          progress.unlockedVideos.push(firstVideoId);
        }
      }
    }
  } catch (err) {
    console.error('Error unlocking next unit:', err);
  }
}

// Helper function to unlock next video in sequence within the same unit
async function unlockNextVideoInSequence(progress, currentVideo) {
  try {
    if (!currentVideo.unit) {
      // For non-unit based videos, unlock next video by creation date
      const Video = require('../models/Video');
      const allVideos = await Video.find({ course: currentVideo.course })
        .sort('createdAt');
      
      const currentIndex = allVideos.findIndex(v => v._id.toString() === currentVideo._id.toString());
      if (currentIndex !== -1 && currentIndex < allVideos.length - 1) {
        const nextVideo = allVideos[currentIndex + 1];
        if (!progress.unlockedVideos.includes(nextVideo._id.toString())) {
          progress.unlockedVideos.push(nextVideo._id.toString());
          console.log('Unlocked next video in course:', nextVideo.title);
        }
      }
      return;
    }
    
    // For unit-based videos, unlock next video in the same unit
    const Unit = require('../models/Unit');
    const unit = await Unit.findById(currentVideo.unit)
      .populate('videos');
    
    if (unit && unit.videos) {
      // Sort videos by sequence
      const sortedVideos = unit.videos.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
      
      // Find current video index
      const currentIndex = sortedVideos.findIndex(v => v._id.toString() === currentVideo._id.toString());
      
      if (currentIndex !== -1 && currentIndex < sortedVideos.length - 1) {
        // Unlock next video in the unit
        const nextVideo = sortedVideos[currentIndex + 1];
        if (!progress.unlockedVideos.includes(nextVideo._id.toString())) {
          progress.unlockedVideos.push(nextVideo._id.toString());
          console.log('Unlocked next video in unit:', nextVideo.title);
        }
      } else if (currentIndex === sortedVideos.length - 1) {
        // This was the last video in the unit
        console.log('Completed last video in unit. All unit videos are now unlocked. Quiz should be available.');
      }
    }
  } catch (err) {
    console.error('Error unlocking next video in sequence:', err);
  }
}

// Get all quiz results for a student (both individual quizzes and quiz pools)
exports.getStudentQuizResults = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;
    
    // Build query filter
    // Include attempts that are submitted OR completed (backward compatibility for older records)
    const filter = { 
      student: studentId,
      $or: [
        { isSubmitted: true },
        { isComplete: true },
        { completedAt: { $ne: null } }
      ]
    };
    
    // If courseId is provided, filter by course and check access
    if (courseId) {
      // Check if course exists
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      // Check if student has access to this course via sections
      const hasAccess = await studentHasAccessToCourse(studentId, courseId);
      if (!hasAccess) {
        return res.status(403).json({ message: 'You are not assigned to this course' });
      }
      
      filter.course = courseId;
    } else {
      // If no courseId provided, only get results from courses the student has access to
      const sections = await Section.find({ students: studentId }).select('courses');
      const accessibleCourses = sections.flatMap(section => section.courses);
      if (accessibleCourses.length === 0) {
        return res.json({ summary: { totalAttempts: 0, passedAttempts: 0, failedAttempts: 0, passRate: 0, averageScore: 0 }, attempts: [] });
      }
      filter.course = { $in: accessibleCourses };
    }
    
    // Get all quiz attempts for this student
    const attempts = await QuizAttempt.find(filter)
      .populate('quiz', 'title description timeLimit passingScore')
      .populate('quizPool', 'title description questionsPerAttempt timeLimit passingScore')
      .populate('course', 'title courseCode')
      .populate('unit', 'title sequence')
      .populate('video', 'title')
      .sort({ completedAt: -1 });
    
    // Format the response
    const formattedAttempts = attempts.map(attempt => ({
      _id: attempt._id,
      type: attempt.quiz ? 'individual' : 'pool',
      quiz: attempt.quiz ? {
        _id: attempt.quiz._id,
        title: attempt.quiz.title,
        description: attempt.quiz.description,
        timeLimit: attempt.quiz.timeLimit,
        passingScore: attempt.quiz.passingScore
      } : null,
      quizPool: attempt.quizPool ? {
        _id: attempt.quizPool._id,
        title: attempt.quizPool.title,
        description: attempt.quizPool.description,
        questionsPerAttempt: attempt.quizPool.questionsPerAttempt,
        timeLimit: attempt.quizPool.timeLimit,
        passingScore: attempt.quizPool.passingScore
      } : null,
      course: {
        _id: attempt.course._id,
        title: attempt.course.title,
        courseCode: attempt.course.courseCode
      },
      unit: attempt.unit ? {
        _id: attempt.unit._id,
        title: attempt.unit.title,
        sequence: attempt.unit.sequence
      } : null,
      video: attempt.video ? {
        _id: attempt.video._id,
        title: attempt.video.title
      } : null,
      score: attempt.score,
      maxScore: attempt.maxScore,
      percentage: attempt.percentage,
      passed: attempt.passed,
      timeSpent: attempt.timeSpent,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      securityViolations: attempt.securityViolations || 0
    }));
    
    // Calculate summary statistics
    const totalAttempts = formattedAttempts.length;
    const passedAttempts = formattedAttempts.filter(a => a.passed).length;
    const averageScore = totalAttempts > 0 
      ? formattedAttempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts 
      : 0;
    
    res.json({
      summary: {
        totalAttempts,
        passedAttempts,
        failedAttempts: totalAttempts - passedAttempts,
        passRate: totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0,
        averageScore: Math.round(averageScore * 100) / 100
      },
      attempts: formattedAttempts
    });
  } catch (error) {
    console.error('Error getting student quiz results:', error);
    res.status(500).json({ message: error.message });
  }
};
