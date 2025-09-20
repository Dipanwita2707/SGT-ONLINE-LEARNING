const Section = require('../models/Section');
const Course = require('../models/Course');
const Department = require('../models/Department');
const School = require('../models/School');
const User = require('../models/User');

// Create a new section with the new hierarchy
exports.createSection = async (req, res) => {
  try {
    const { name, schoolId, departmentId, courseIds, teacherId, capacity, academicYear, semester } = req.body;
    
    // Validate required fields
    if (!name || !schoolId) {
      return res.status(400).json({ message: 'Section name and school are required' });
    }
    
    // Validate school exists
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    
    // Validate department if provided
    if (departmentId) {
      const department = await Department.findById(departmentId);
      if (!department) {
        return res.status(404).json({ message: 'Department not found' });
      }
      
      // Ensure department belongs to the school
      if (department.school.toString() !== schoolId) {
        return res.status(400).json({ message: 'Department does not belong to the selected school' });
      }
    }
    
    // Validate courses if provided
    const validCourses = [];
    if (courseIds && Array.isArray(courseIds)) {
      for (const courseId of courseIds) {
        const course = await Course.findById(courseId);
        if (!course) {
          return res.status(404).json({ message: `Course ${courseId} not found` });
        }
        
        if (course.school.toString() !== schoolId) {
          return res.status(400).json({ message: `Course ${course.title} does not belong to the selected school` });
        }
        
        if (departmentId && course.department.toString() !== departmentId) {
          return res.status(400).json({ message: `Course ${course.title} does not belong to the selected department` });
        }
        
        validCourses.push(courseId);
      }
    }
    
    // Validate teacher if provided
    if (teacherId) {
      const teacher = await User.findById(teacherId);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(404).json({ message: 'Valid teacher not found' });
      }
    }
    
    const section = new Section({
      name,
      school: schoolId,
      department: departmentId || null,
      courses: validCourses,
      teacher: teacherId || null,
      capacity: capacity || 80,
      academicYear,
      semester,
      students: []
    });
    
    await section.save();
    
    // Update teacher's assigned sections if teacher is provided
    if (teacherId) {
      await User.findByIdAndUpdate(teacherId, {
        $addToSet: { assignedSections: section._id }
      });
    }
    
    res.status(201).json({
      message: 'Section created successfully',
      section
    });
  } catch (error) {
    console.error('Error creating section:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all sections
exports.getAllSections = async (req, res) => {
  try {
    console.log('Starting getAllSections fetch...');
    
    const sections = await Section.find()
      .populate('school', 'name code')
      .populate('department', 'name code')
      .populate('courses', 'title courseCode') // Changed from 'course' to 'courses' to match schema
      .populate('teacher', 'name email teacherId')
      .populate('students', 'name email regNo');
    
    console.log(`Successfully fetched ${sections.length} sections`);
    
    // Filter out sections with missing critical references
    const validSections = sections.filter(section => {
      if (!section.school) {
        console.warn(`Section ${section._id} has missing school reference`);
        return false;
      }
      return true;
    });
    
    console.log(`Returning ${validSections.length} valid sections`);
    res.json(validSections);
  } catch (error) {
    console.error('Error getting all sections:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to fetch sections',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Assign a teacher to a section
exports.assignTeacher = async (req, res) => {
  try {
    const { sectionId, teacherId } = req.body;
    
    console.log(`Assigning teacher ${teacherId} to section ${sectionId}`);
    
    // Validate inputs
    if (!sectionId) {
      return res.status(400).json({ message: 'Section ID is required' });
    }
    
    const section = await Section.findById(sectionId);
    if (!section) return res.status(404).json({ message: 'Section not found' });
    
    // If teacherId is null/empty, remove teacher assignment
    if (!teacherId) {
      section.teacher = null;
    } else {
      // Validate teacher exists and has correct role
      const teacher = await User.findById(teacherId);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(404).json({ message: 'Valid teacher not found' });
      }
      section.teacher = teacherId;
    }
    
    await section.save();
    
    // Return updated section with populated data
    const updatedSection = await Section.findById(sectionId)
      .populate('school', 'name code')
      .populate('department', 'name code')
      .populate('courses', 'title courseCode')
      .populate('teacher', 'name email teacherId')
      .populate('students', 'name email regNo');
    
    res.json({
      message: teacherId ? 'Teacher assigned successfully' : 'Teacher removed successfully',
      section: updatedSection
    });
  } catch (error) {
    console.error('Error assigning teacher to section:', error);
    res.status(500).json({ 
      message: 'Failed to assign teacher to section',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Assign students to a section
exports.assignStudents = async (req, res) => {
  try {
    const { sectionId, studentIds } = req.body;
    
    console.log(`Assigning students ${studentIds} to section ${sectionId}`);
    
    // Validate inputs
    if (!sectionId || !studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ message: 'Section ID and Student IDs array are required' });
    }
    
    const section = await Section.findById(sectionId);
    if (!section) return res.status(404).json({ message: 'Section not found' });
    
    // Check capacity
    const newStudentCount = (section.students?.length || 0) + studentIds.length;
    if (newStudentCount > section.capacity) {
      return res.status(400).json({ 
        message: `Adding ${studentIds.length} students would exceed section capacity of ${section.capacity}` 
      });
    }
    
    // Check for duplicates and existing assignments
    const existingStudentIds = section.students.map(id => id.toString());
    const newStudents = studentIds.filter(id => !existingStudentIds.includes(id));
    
    // Check if any students are in other sections
    for (const studentId of newStudents) {
      const existingSection = await Section.findOne({ 
        students: studentId, 
        _id: { $ne: sectionId } 
      });
      
      if (existingSection) {
        const student = await User.findById(studentId);
        return res.status(400).json({ 
          message: `Student "${student?.name}" is already assigned to section "${existingSection.name}"` 
        });
      }
    }
    
    section.students.push(...newStudents);
    await section.save();
    
    // Return updated section with populated data
    const updatedSection = await Section.findById(sectionId)
      .populate('school', 'name code')
      .populate('department', 'name code')
      .populate('courses', 'title courseCode')
      .populate('teacher', 'name email teacherId')
      .populate('students', 'name email regNo');
    
    res.json({
      message: `${newStudents.length} students assigned successfully`,
      section: updatedSection
    });
  } catch (error) {
    console.error('Error assigning students to section:', error);
    res.status(500).json({ 
      message: 'Failed to assign students to section',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get all sections for a course
exports.getSectionsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    console.log(`Fetching sections for course: ${courseId}`);
    
    const sections = await Section.find({ courses: courseId }) // Changed from 'course' to 'courses'
      .populate('school', 'name code')
      .populate('department', 'name code')
      .populate('courses', 'title courseCode')
      .populate('teacher', 'name email teacherId')
      .populate('students', 'name email regNo');
      
    console.log(`Found ${sections.length} sections for course ${courseId}`);
    res.json(sections);
  } catch (error) {
    console.error('Error getting sections by course:', error);
    res.status(500).json({ 
      message: 'Failed to fetch sections for course',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get teacher-student connections via section
exports.getTeacherStudentConnections = async (req, res) => {
  try {
    const { teacherId } = req.params;
    console.log(`[getTeacherStudentConnections] Fetching sections for teacher: ${teacherId}`);
    console.log(`[getTeacherStudentConnections] Request user:`, req.user);
    
    // Allow admin to access any teacher's sections, but teachers can only access their own
    if (req.user.role === 'teacher' && req.user._id.toString() !== teacherId) {
      console.log(`[getTeacherStudentConnections] Teacher ${req.user._id} trying to access ${teacherId} - unauthorized`);
      return res.status(403).json({ message: 'You can only access your own sections' });
    }
    
    const sections = await Section.find({ teacher: teacherId })
      .populate('school', 'name code')
      .populate('department', 'name code')
      .populate('courses', 'title courseCode')
      .populate('teacher', 'name email teacherId')
      .populate('students', 'name email regNo');
    
    console.log(`[getTeacherStudentConnections] Found ${sections.length} sections for teacher ${teacherId}`);
    if (sections.length > 0) {
      console.log(`[getTeacherStudentConnections] First section sample:`, {
        id: sections[0]._id,
        name: sections[0].name,
        teacher: sections[0].teacher,
        courses: sections[0].courses?.length,
        students: sections[0].students?.length
      });
    }
    res.json(sections);
  } catch (error) {
    console.error('[getTeacherStudentConnections] Error fetching teacher sections:', error);
    res.status(500).json({ 
      message: 'Failed to fetch teacher sections',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get section by student ID
exports.getStudentSection = async (req, res) => {
  try {
    const { studentId } = req.params;
    const section = await Section.findOne({ students: studentId })
      .populate('teacher', 'name email')
      .populate('course', 'title courseCode')
      .populate('students', 'name email studentId')
      .populate('school', 'name')
      .populate('department', 'name');
    
    if (!section) {
      return res.status(404).json({ message: 'Student not assigned to any section' });
    }
    
    res.json(section);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get teacher section analytics overview
exports.getTeacherSectionAnalyticsOverview = async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    // Get all sections assigned to this teacher
    const sections = await Section.find({ teacher: teacherId })
      .populate('students', 'firstName lastName email')
      .populate('course', 'title');
    
    const totalSections = sections.length;
    const totalStudents = sections.reduce((sum, section) => sum + section.students.length, 0);
    
    // Calculate average engagement (mock calculation - you can enhance this based on actual activity data)
    const averageEngagement = Math.round(Math.random() * 30 + 70); // 70-100% range
    const courseCompletionRate = Math.round(Math.random() * 25 + 75); // 75-100% range
    
    res.json({
      totalSections,
      totalStudents,
      averageEngagement,
      courseCompletionRate
    });
  } catch (error) {
    console.error('Error getting teacher section analytics overview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get detailed section analytics
exports.getSectionAnalytics = async (req, res) => {
  try {
    const { sectionId } = req.params;
    
    const section = await Section.findById(sectionId)
      .populate('students', 'firstName lastName email')
      .populate('course', 'title')
      .populate('department', 'name')
      .populate('school', 'name');
    
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }
    
    // Mock student performance data - in a real app, this would come from actual learning analytics
    const students = section.students.map(student => ({
      ...student.toObject(),
      progress: Math.round(Math.random() * 100),
      watchTime: Math.round(Math.random() * 300), // minutes
      quizAverage: Math.round(Math.random() * 40 + 60), // 60-100%
      engagementLevel: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
      lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random within last week
    }));
    
    const sectionDetails = {
      sectionName: section.name,
      courseName: section.course.title,
      studentCount: section.students.length,
      videoCount: Math.round(Math.random() * 20 + 10), // Mock video count
      averageProgress: Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length),
      students
    };
    
    // Generate performance data for charts
    const performanceData = {
      labels: students.map(s => `${s.firstName} ${s.lastName}`),
      studentProgress: students.map(s => s.progress),
      videoWatchTime: students.map(s => s.watchTime),
      quizScores: students.map(s => s.quizAverage)
    };
    
    res.json({
      sectionDetails,
      performanceData
    });
  } catch (error) {
    console.error('Error getting section analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Assign a student to a section with one-student-one-section constraint
exports.assignStudentToSection = async (req, res) => {
  try {
    const { sectionId, studentId } = req.body;
    
    console.log(`Assigning student ${studentId} to section ${sectionId}`);
    
    // Validate inputs
    if (!sectionId || !studentId) {
      return res.status(400).json({ message: 'Section ID and Student ID are required' });
    }
    
    // Check if section exists
    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }
    
    // Check if student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if student is already in this section
    if (section.students.includes(studentId)) {
      return res.status(400).json({ message: 'Student is already assigned to this section' });
    }
    
    // Check if student is in any other section (one-student-one-section rule)
    const existingSection = await Section.findOne({ 
      students: studentId, 
      _id: { $ne: sectionId } 
    });
    
    if (existingSection) {
      return res.status(400).json({ 
        message: `Student is already assigned to section "${existingSection.name}". A student can only be in one section.`,
        existingSection: existingSection.name
      });
    }
    
    // Check section capacity
    if (section.students.length >= section.capacity) {
      return res.status(400).json({ 
        message: `Section is at full capacity (${section.capacity} students)` 
      });
    }
    
    // Add student to section
    section.students.push(studentId);
    await section.save();
    
    console.log(`Student ${studentId} successfully assigned to section ${sectionId}`);
    
    // Return updated section with populated data
    const updatedSection = await Section.findById(sectionId)
      .populate('school', 'name code')
      .populate('department', 'name code')
      .populate('courses', 'title courseCode')
      .populate('teacher', 'name email teacherId')
      .populate('students', 'name email regNo');
    
    res.json({
      message: 'Student assigned successfully',
      section: updatedSection
    });
  } catch (error) {
    console.error('Error assigning student to section:', error);
    res.status(500).json({ 
      message: 'Failed to assign student to section',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Remove a student from a section
exports.removeStudentFromSection = async (req, res) => {
  try {
    const { sectionId, studentId } = req.body;
    
    console.log(`Removing student ${studentId} from section ${sectionId}`);
    
    // Validate inputs
    if (!sectionId || !studentId) {
      return res.status(400).json({ message: 'Section ID and Student ID are required' });
    }
    
    // Check if section exists
    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }
    
    // Check if student is in this section
    if (!section.students.includes(studentId)) {
      return res.status(400).json({ message: 'Student is not in this section' });
    }
    
    // Remove student from section
    section.students = section.students.filter(id => id.toString() !== studentId);
    await section.save();
    
    console.log(`Student ${studentId} successfully removed from section ${sectionId}`);
    
    // Return updated section with populated data
    const updatedSection = await Section.findById(sectionId)
      .populate('school', 'name code')
      .populate('department', 'name code')
      .populate('courses', 'title courseCode')
      .populate('teacher', 'name email teacherId')
      .populate('students', 'name email regNo');
    
    res.json({
      message: 'Student removed successfully',
      section: updatedSection
    });
  } catch (error) {
    console.error('Error removing student from section:', error);
    res.status(500).json({ 
      message: 'Failed to remove student from section',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Assign courses to a section
exports.assignCoursesToSection = async (req, res) => {
  try {
    const { sectionId, courseIds } = req.body;
    
    console.log(`Assigning courses ${courseIds} to section ${sectionId}`);
    
    // Validate inputs
    if (!sectionId || !courseIds || !Array.isArray(courseIds)) {
      return res.status(400).json({ message: 'Section ID and Course IDs array are required' });
    }
    
    // Check if section exists
    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }
    
    // Validate all courses exist
    const courses = await Course.find({ _id: { $in: courseIds } });
    if (courses.length !== courseIds.length) {
      return res.status(404).json({ message: 'One or more courses not found' });
    }
    
    // Validate courses belong to the same school as section
    const invalidCourses = courses.filter(course => 
      course.school.toString() !== section.school.toString()
    );
    
    if (invalidCourses.length > 0) {
      return res.status(400).json({ 
        message: 'Some courses do not belong to the same school as the section',
        invalidCourses: invalidCourses.map(c => c.title)
      });
    }
    
    // Add unique courses to section (avoid duplicates)
    const existingCourseIds = section.courses.map(id => id.toString());
    const newCourseIds = courseIds.filter(id => !existingCourseIds.includes(id));
    
    section.courses.push(...newCourseIds);
    await section.save();
    
    console.log(`Courses successfully assigned to section ${sectionId}`);
    
    // Return updated section with populated data
    const updatedSection = await Section.findById(sectionId)
      .populate('school', 'name code')
      .populate('department', 'name code')
      .populate('courses', 'title courseCode')
      .populate('teacher', 'name email teacherId')
      .populate('students', 'name email regNo');
    
    res.json({
      message: 'Courses assigned successfully',
      section: updatedSection,
      newCoursesAdded: newCourseIds.length
    });
  } catch (error) {
    console.error('Error assigning courses to section:', error);
    res.status(500).json({ 
      message: 'Failed to assign courses to section',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Assign teacher to a section
exports.assignTeacherToSection = async (req, res) => {
  try {
    const { sectionId, teacherId } = req.body;
    
    console.log(`Assigning teacher ${teacherId} to section ${sectionId}`);
    
    // Validate inputs
    if (!sectionId || !teacherId) {
      return res.status(400).json({ message: 'Section ID and Teacher ID are required' });
    }
    
    // Check if section exists
    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }
    
    // Check if teacher exists
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    // Assign teacher to section
    section.teacher = teacherId;
    await section.save();
    
    console.log(`Teacher ${teacherId} successfully assigned to section ${sectionId}`);
    
    // Return updated section with populated data
    const updatedSection = await Section.findById(sectionId)
      .populate('school', 'name code')
      .populate('department', 'name code')
      .populate('courses', 'title courseCode')
      .populate('teacher', 'name email teacherId')
      .populate('students', 'name email regNo');
    
    res.json({
      message: 'Teacher assigned successfully',
      section: updatedSection
    });
  } catch (error) {
    console.error('Error assigning teacher to section:', error);
    res.status(500).json({ 
      message: 'Failed to assign teacher to section',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Remove teacher from a section
exports.removeTeacherFromSection = async (req, res) => {
  try {
    const { sectionId } = req.body;
    
    console.log(`Removing teacher from section ${sectionId}`);
    
    // Validate inputs
    if (!sectionId) {
      return res.status(400).json({ message: 'Section ID is required' });
    }
    
    // Check if section exists
    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }
    
    // Remove teacher from section
    section.teacher = null;
    await section.save();
    
    console.log(`Teacher successfully removed from section ${sectionId}`);
    
    // Return updated section with populated data
    const updatedSection = await Section.findById(sectionId)
      .populate('school', 'name code')
      .populate('department', 'name code')
      .populate('courses', 'title courseCode')
      .populate('teacher', 'name email teacherId')
      .populate('students', 'name email regNo');
    
    res.json({
      message: 'Teacher removed successfully',
      section: updatedSection
    });
  } catch (error) {
    console.error('Error removing teacher from section:', error);
    res.status(500).json({ 
      message: 'Failed to remove teacher from section',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Remove courses from a section
exports.removeCoursesFromSection = async (req, res) => {
  try {
    const { sectionId, courseIds } = req.body;
    
    console.log(`Removing courses ${courseIds} from section ${sectionId}`);
    
    // Validate inputs
    if (!sectionId || !courseIds || !Array.isArray(courseIds)) {
      return res.status(400).json({ message: 'Section ID and Course IDs array are required' });
    }
    
    // Check if section exists
    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }
    
    // Remove courses from section
    section.courses = section.courses.filter(id => 
      !courseIds.includes(id.toString())
    );
    await section.save();
    
    console.log(`Courses successfully removed from section ${sectionId}`);
    
    // Return updated section with populated data
    const updatedSection = await Section.findById(sectionId)
      .populate('school', 'name code')
      .populate('department', 'name code')
      .populate('courses', 'title courseCode')
      .populate('teacher', 'name email teacherId')
      .populate('students', 'name email regNo');
    
    res.json({
      message: 'Courses removed successfully',
      section: updatedSection
    });
  } catch (error) {
    console.error('Error removing courses from section:', error);
    res.status(500).json({ 
      message: 'Failed to remove courses from section',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get available students (not assigned to any section) for a school
exports.getAvailableStudents = async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    console.log(`Fetching available students for school: ${schoolId}`);
    
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required' });
    }
    
    // Get all students for the school
    const allStudents = await User.find({ 
      role: 'student', 
      school: schoolId 
    }).select('name email regNo school department');
    
    // Get all sections to find students already assigned
    const sections = await Section.find().select('students');
    const assignedStudentIds = new Set();
    sections.forEach(section => {
      section.students?.forEach(studentId => {
        assignedStudentIds.add(studentId.toString());
      });
    });
    
    // Filter out students already assigned to sections
    const availableStudents = allStudents.filter(student => 
      !assignedStudentIds.has(student._id.toString())
    );
    
    console.log(`Found ${availableStudents.length} available students out of ${allStudents.length} total`);
    
    res.json(availableStudents);
  } catch (error) {
    console.error('Error getting available students:', error);
    res.status(500).json({ 
      message: 'Failed to fetch available students',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get teacher analytics overview
exports.getTeacherAnalyticsOverview = async (req, res) => {
  try {
    const { teacherId } = req.params;
    console.log('Getting analytics overview for teacher:', teacherId);

    // Get all sections for this teacher
    const sections = await Section.find({ teacher: teacherId })
      .populate('school', 'name')
      .populate('department', 'name')
      .populate('courses', 'title')
      .populate('students', 'name email');

    if (!sections || sections.length === 0) {
      return res.json({
        totalSections: 0,
        totalStudents: 0,
        totalCourses: 0,
        avgCompletion: 0,
        sections: []
      });
    }

    const totalSections = sections.length;
    const totalStudents = sections.reduce((acc, section) => acc + (section.students?.length || 0), 0);
    const totalCourses = sections.reduce((acc, section) => acc + (section.courses?.length || 0), 0);
    
    // Calculate average completion (mock for now, can be enhanced with real progress data)
    const avgCompletion = 75; // This should come from actual student progress data

    const overview = {
      totalSections,
      totalStudents, 
      totalCourses,
      avgCompletion,
      sections: sections.map(section => ({
        _id: section._id,
        name: section.name,
        school: section.school?.name,
        department: section.department?.name,
        studentsCount: section.students?.length || 0,
        coursesCount: section.courses?.length || 0
      }))
    };

    console.log('Teacher analytics overview:', overview);
    res.json(overview);
  } catch (error) {
    console.error('Error getting teacher analytics overview:', error);
    res.status(500).json({ 
      message: 'Failed to fetch analytics overview',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get detailed section analytics
exports.getSectionAnalytics = async (req, res) => {
  try {
    const { sectionId } = req.params;
    console.log('Getting detailed analytics for section:', sectionId);

    // Get section with full population
    const section = await Section.findById(sectionId)
      .populate('school', 'name')
      .populate('department', 'name')
      .populate('courses', 'title description')
      .populate('students', 'name email');

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Section details
    const sectionDetails = {
      _id: section._id,
      name: section.name,
      school: section.school?.name,
      department: section.department?.name,
      studentsCount: section.students?.length || 0,
      coursesCount: section.courses?.length || 0,
      capacity: section.capacity,
      academicYear: section.academicYear,
      semester: section.semester
    };

    // Generate performance data (this would come from actual student progress/quiz data)
    const performanceData = {
      // Weekly progress over time
      weeklyProgress: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
        data: [60, 65, 70, 75, 78, 82] // Mock data - should come from actual progress tracking
      },
      
      // Course completion rates
      courseCompletion: section.courses?.map(course => ({
        courseId: course._id,
        courseName: course.title,
        completion: Math.floor(Math.random() * 30) + 70 // Mock 70-100% completion
      })) || [],
      
      // Student progress breakdown
      studentProgress: section.students?.map(student => ({
        studentId: student._id,
        studentName: student.name,
        email: student.email,
        overallProgress: Math.floor(Math.random() * 40) + 60, // Mock 60-100% progress
        courseProgress: section.courses?.map(course => ({
          courseId: course._id,
          courseName: course.title,
          progress: Math.floor(Math.random() * 40) + 60
        })) || []
      })) || [],
      
      // Engagement metrics
      engagement: {
        averageTimeSpent: 45, // minutes per day
        activeStudents: Math.floor((section.students?.length || 0) * 0.8),
        totalStudents: section.students?.length || 0
      }
    };

    const analytics = {
      sectionDetails,
      performanceData
    };

    console.log('Section analytics for', section.name, '- students:', sectionDetails.studentsCount, 'courses:', sectionDetails.coursesCount);
    res.json(analytics);
  } catch (error) {
    console.error('Error getting section analytics:', error);
    res.status(500).json({ 
      message: 'Failed to fetch section analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
