const User = require('../models/User');
const School = require('../models/School');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Section = require('../models/Section');

// Assign Dean to School
exports.assignDeanToSchool = async (req, res) => {
  try {
    const { schoolId, deanId } = req.body;
    
    // Validate inputs
    if (!schoolId || !deanId) {
      return res.status(400).json({ message: 'School ID and Dean ID are required' });
    }
    
    // Check if school exists
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    
    // Check if user exists and has dean role
    const dean = await User.findById(deanId);
    if (!dean) {
      return res.status(404).json({ message: 'Dean not found' });
    }
    
    if (dean.role !== 'dean') {
      return res.status(400).json({ message: 'User must have dean role' });
    }
    
    // Check if dean is already assigned to another school
    const existingAssignment = await School.findOne({ dean: deanId });
    if (existingAssignment && existingAssignment._id.toString() !== schoolId) {
      return res.status(400).json({ 
        message: `Dean is already assigned to ${existingAssignment.name}` 
      });
    }
    
    // Assign dean to school
    school.dean = deanId;
    await school.save();
    
    // Update dean's school assignment
    dean.school = schoolId;
    await dean.save();
    
    await school.populate('dean', 'name email');
    
    res.json({
      message: 'Dean assigned to school successfully',
      school: {
        _id: school._id,
        name: school.name,
        dean: school.dean
      }
    });
  } catch (error) {
    console.error('Error assigning dean to school:', error);
    res.status(500).json({ message: error.message });
  }
};

// Remove Dean from School
exports.removeDeanFromSchool = async (req, res) => {
  try {
    const { schoolId } = req.body;
    
    // Validate input
    if (!schoolId) {
      return res.status(400).json({ message: 'School ID is required' });
    }
    
    // Check if school exists
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    
    // Remove dean from school
    const previousDeanId = school.dean;
    school.dean = null;
    await school.save();
    
    // Update dean's school assignment
    if (previousDeanId) {
      await User.findByIdAndUpdate(previousDeanId, {
        $unset: { school: 1 }
      });
    }
    
    res.json({
      message: 'Dean removed from school successfully',
      school: {
        _id: school._id,
        name: school.name,
        dean: null
      }
    });
  } catch (error) {
    console.error('Error removing dean from school:', error);
    res.status(500).json({ message: error.message });
  }
};

// Assign HOD to Department
exports.assignHODToDepartment = async (req, res) => {
  try {
    const { departmentId, hodId } = req.body;
    
    // Validate inputs
    if (!departmentId || !hodId) {
      return res.status(400).json({ message: 'Department ID and HOD ID are required' });
    }
    
    // Check if department exists
    const department = await Department.findById(departmentId).populate('school');
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    // Check if user exists and has hod role
    const hod = await User.findById(hodId);
    if (!hod) {
      return res.status(404).json({ message: 'HOD not found' });
    }
    
    if (hod.role !== 'hod') {
      return res.status(400).json({ message: 'User must have HOD role' });
    }
    
    // Check if HOD is already assigned to another department
    const existingAssignment = await Department.findOne({ hod: hodId });
    if (existingAssignment && existingAssignment._id.toString() !== departmentId) {
      return res.status(400).json({ 
        message: `HOD is already assigned to ${existingAssignment.name}` 
      });
    }
    
    // Assign HOD to department
    department.hod = hodId;
    await department.save();
    
    // Update HOD's school and department assignment
    hod.school = department.school._id;
    hod.department = departmentId;
    await hod.save();
    
    await department.populate('hod', 'name email');
    
    res.json({
      message: 'HOD assigned to department successfully',
      department: {
        _id: department._id,
        name: department.name,
        hod: department.hod,
        school: department.school
      }
    });
  } catch (error) {
    console.error('Error assigning HOD to department:', error);
    res.status(500).json({ message: error.message });
  }
};

// Remove HOD from Department
exports.removeHODFromDepartment = async (req, res) => {
  try {
    const { departmentId } = req.body;
    
    // Validate input
    if (!departmentId) {
      return res.status(400).json({ message: 'Department ID is required' });
    }
    
    // Check if department exists
    const department = await Department.findById(departmentId).populate('school');
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    // Remove HOD from department
    const previousHODId = department.hod;
    department.hod = null;
    await department.save();
    
    // Update HOD's department and school assignment
    if (previousHODId) {
      await User.findByIdAndUpdate(previousHODId, {
        $unset: { department: 1, school: 1 }
      });
    }
    
    res.json({
      message: 'HOD removed from department successfully',
      department: {
        _id: department._id,
        name: department.name,
        hod: null,
        school: department.school
      }
    });
  } catch (error) {
    console.error('Error removing HOD from department:', error);
    res.status(500).json({ message: error.message });
  }
};

// Assign Teacher to Department
exports.assignTeacherToDepartment = async (req, res) => {
  try {
    const { departmentId, teacherId } = req.body;
    
    // Validate inputs
    if (!departmentId || !teacherId) {
      return res.status(400).json({ message: 'Department ID and Teacher ID are required' });
    }
    
    // Check if department exists
    const department = await Department.findById(departmentId).populate('school');
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    // Check if user exists and has teacher role
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    if (teacher.role !== 'teacher') {
      return res.status(400).json({ message: 'User must have teacher role' });
    }
    
    // Check if teacher is already in this department
    if (department.teachers.includes(teacherId)) {
      return res.status(400).json({ message: 'Teacher is already assigned to this department' });
    }
    
    // Add teacher to department
    department.teachers.push(teacherId);
    await department.save();
    
    // Update teacher's school and department assignment
    teacher.school = department.school._id;
    teacher.department = departmentId;
    await teacher.save();
    
    res.json({
      message: 'Teacher assigned to department successfully',
      department: {
        _id: department._id,
        name: department.name,
        teacherCount: department.teachers.length
      }
    });
  } catch (error) {
    console.error('Error assigning teacher to department:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create Section and Assign Courses
exports.createSectionWithCourses = async (req, res) => {
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
    let department = null;
    if (departmentId) {
      department = await Department.findById(departmentId);
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
    if (courseIds && courseIds.length > 0) {
      for (const courseId of courseIds) {
        const course = await Course.findById(courseId);
        if (!course) {
          return res.status(404).json({ message: `Course ${courseId} not found` });
        }
        
        // Ensure course belongs to the school (and department if specified)
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
      
      // Ensure teacher belongs to the school (and department if specified)
      if (teacher.school && teacher.school.toString() !== schoolId) {
        return res.status(400).json({ message: 'Teacher does not belong to the selected school' });
      }
      
      if (departmentId && teacher.department && teacher.department.toString() !== departmentId) {
        return res.status(400).json({ message: 'Teacher does not belong to the selected department' });
      }
    }
    
    // Create section
    const section = new Section({
      name,
      school: schoolId,
      department: departmentId,
      courses: validCourses,
      teacher: teacherId,
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
    
    await section.populate([
      { path: 'school', select: 'name code' },
      { path: 'department', select: 'name code' },
      { path: 'courses', select: 'title courseCode' },
      { path: 'teacher', select: 'name email teacherId' }
    ]);
    
    res.status(201).json({
      message: 'Section created successfully',
      section
    });
  } catch (error) {
    console.error('Error creating section:', error);
    res.status(500).json({ message: error.message });
  }
};

// Assign Students to Section
exports.assignStudentsToSection = async (req, res) => {
  try {
    const { sectionId, studentIds } = req.body;
    
    // Validate inputs
    if (!sectionId || !studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ message: 'Section ID and student IDs array are required' });
    }
    
    // Check if section exists
    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }
    
    // Check capacity
    const currentStudents = section.students.length;
    const newStudentsCount = studentIds.length;
    if (currentStudents + newStudentsCount > section.capacity) {
      return res.status(400).json({ 
        message: `Section capacity exceeded. Current: ${currentStudents}, Adding: ${newStudentsCount}, Capacity: ${section.capacity}` 
      });
    }
    
    // Validate students
    const validStudents = [];
    for (const studentId of studentIds) {
      const student = await User.findById(studentId);
      if (!student || student.role !== 'student') {
        return res.status(404).json({ message: `Valid student ${studentId} not found` });
      }
      
      // Check if student is already in this section
      if (section.students.includes(studentId)) {
        continue; // Skip if already enrolled
      }
      
      // Ensure student belongs to the same school
      if (student.school && student.school.toString() !== section.school.toString()) {
        return res.status(400).json({ 
          message: `Student ${student.name} does not belong to the same school as the section` 
        });
      }
      
      validStudents.push(studentId);
    }
    
    // Add students to section
    section.students.push(...validStudents);
    await section.save();
    
    // Update students' assigned sections and courses
    for (const studentId of validStudents) {
      await User.findByIdAndUpdate(studentId, {
        $addToSet: { 
          assignedSections: sectionId,
          coursesAssigned: { $each: section.courses }
        }
      });
    }
    
    res.json({
      message: `${validStudents.length} students assigned to section successfully`,
      section: {
        _id: section._id,
        name: section.name,
        currentEnrollment: section.students.length,
        capacity: section.capacity
      }
    });
  } catch (error) {
    console.error('Error assigning students to section:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get Hierarchy Overview
exports.getHierarchyOverview = async (req, res) => {
  try {
    // Get summary statistics
    const [schoolsCount, departmentsCount, coursesCount, sectionsCount, usersCount] = await Promise.all([
      School.countDocuments({ isActive: true }),
      Department.countDocuments({ isActive: true }),
      Course.countDocuments({ isActive: true }),
      Section.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true })
    ]);
    
    // Get role-wise user counts
    const usersByRole = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    // Get schools with their structure
    const schools = await School.find({ isActive: true })
      .populate('dean', 'name email')
      .select('name code dean')
      .lean();
    
    // Get departments for each school
    for (const school of schools) {
      school.departments = await Department.find({ school: school._id, isActive: true })
        .populate('hod', 'name email')
        .select('name code hod')
        .lean();
      
      // Get courses and sections for each department
      for (const department of school.departments) {
        department.courses = await Course.countDocuments({ 
          department: department._id, 
          isActive: true 
        });
        
        department.teachers = await User.countDocuments({ 
          department: department._id, 
          role: 'teacher',
          isActive: true 
        });
      }
      
      // Get school-wide sections
      school.sections = await Section.countDocuments({ 
        school: school._id,
        isActive: true 
      });
      
      school.students = await User.countDocuments({ 
        school: school._id, 
        role: 'student',
        isActive: true 
      });
    }
    
    res.json({
      overview: {
        schools: schoolsCount,
        departments: departmentsCount,
        courses: coursesCount,
        sections: sectionsCount,
        totalUsers: usersCount,
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      hierarchy: schools
    });
  } catch (error) {
    console.error('Error getting hierarchy overview:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get Student's Academic Path
exports.getStudentAcademicPath = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await User.findById(studentId)
      .populate('school', 'name code')
      .populate('assignedSections')
      .populate('coursesAssigned', 'title courseCode credits');
    
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Get sections with courses and teachers
    const sections = await Section.find({ students: studentId })
      .populate('school', 'name code')
      .populate('department', 'name code')
      .populate('courses', 'title courseCode credits')
      .populate('teacher', 'name email teacherId');
    
    res.json({
      student: {
        _id: student._id,
        name: student.name,
        regNo: student.regNo,
        email: student.email,
        school: student.school
      },
      sections,
      totalCourses: student.coursesAssigned.length,
      totalCredits: student.coursesAssigned.reduce((sum, course) => sum + (course.credits || 0), 0)
    });
  } catch (error) {
    console.error('Error getting student academic path:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get Teacher's Teaching Load
exports.getTeacherTeachingLoad = async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    const teacher = await User.findById(teacherId)
      .populate('school', 'name code')
      .populate('department', 'name code');
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    // Get sections assigned to teacher
    const sections = await Section.find({ teacher: teacherId })
      .populate('school', 'name code')
      .populate('department', 'name code')
      .populate('courses', 'title courseCode credits');
    
    // Calculate teaching load
    const uniqueCourses = new Set();
    let totalStudents = 0;
    let totalCredits = 0;
    
    sections.forEach(section => {
      totalStudents += section.students.length;
      section.courses.forEach(course => {
        uniqueCourses.add(course._id.toString());
        totalCredits += course.credits || 0;
      });
    });
    
    res.json({
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        teacherId: teacher.teacherId,
        email: teacher.email,
        school: teacher.school,
        department: teacher.department
      },
      sections,
      summary: {
        totalSections: sections.length,
        uniqueCourses: uniqueCourses.size,
        totalStudents,
        totalCredits
      }
    });
  } catch (error) {
    console.error('Error getting teacher teaching load:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get Available Deans for School Assignment
exports.getAvailableDeansForSchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    // Find deans who are not assigned to any school or are assigned to this specific school
    const availableDeans = await User.find({
      role: 'dean',
      isActive: true,
      $or: [
        { school: { $exists: false } },
        { school: null },
        { school: schoolId }
      ]
    }).select('name email _id');
    
    // Also exclude deans who are already assigned to other schools
    const schoolsWithDeans = await School.find({ dean: { $exists: true, $ne: null } }).select('dean');
    const assignedDeanIds = schoolsWithDeans
      .map(school => school.dean?.toString())
      .filter(deanId => deanId);
    
    const unassignedDeans = availableDeans.filter(dean => {
      const deanId = dean._id.toString();
      return !assignedDeanIds.includes(deanId) || 
             (dean.school && dean.school.toString() === schoolId);
    });
    
    res.json(unassignedDeans);
  } catch (error) {
    console.error('Error getting available deans:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get Available HODs for Department Assignment
exports.getAvailableHODsForDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    
    // First, get the department to know which school it belongs to
    const department = await Department.findById(departmentId).populate('school');
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    // Find HODs who are not assigned to any department or are assigned to this specific department
    const availableHODs = await User.find({
      role: 'hod',
      isActive: true,
      $or: [
        { department: { $exists: false } },
        { department: null },
        { department: departmentId }
      ]
    }).select('name email _id');
    
    // Also exclude HODs who are already assigned to other departments
    const departmentsWithHODs = await Department.find({ hod: { $exists: true, $ne: null } }).select('hod');
    const assignedHODIds = departmentsWithHODs
      .map(dept => dept.hod?.toString())
      .filter(hodId => hodId);
    
    const unassignedHODs = availableHODs.filter(hod => {
      const hodId = hod._id.toString();
      return !assignedHODIds.includes(hodId) || 
             (hod.department && hod.department.toString() === departmentId);
    });
    
    res.json(unassignedHODs);
  } catch (error) {
    console.error('Error getting available HODs:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get Students by School
exports.getStudentsBySchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    const students = await User.find({
      role: 'student',
      school: schoolId,
      isActive: true
    }).select('name email regNo _id');
    
    res.json(students);
  } catch (error) {
    console.error('Error getting students by school:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get Courses by Department
exports.getCoursesByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    
    const courses = await Course.find({
      department: departmentId,
      isActive: true
    }).select('title courseCode credits _id');
    
    res.json(courses);
  } catch (error) {
    console.error('Error getting courses by department:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get Teachers by Department
exports.getTeachersByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    
    const teachers = await User.find({
      role: 'teacher',
      department: departmentId,
      isActive: true
    }).select('name email teacherId _id');
    
    res.json(teachers);
  } catch (error) {
    console.error('Error getting teachers by department:', error);
    res.status(500).json({ message: error.message });
  }
};