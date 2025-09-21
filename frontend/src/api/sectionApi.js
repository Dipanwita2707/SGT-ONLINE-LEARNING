import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://10.20.58.236:5000';
const API_URL = `${API_BASE_URL}/api`;

// Create a new section
export const createSection = async (sectionData, token) => {
  const response = await axios.post(`${API_URL}/sections/create`, sectionData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Assign teacher to section
export const assignTeacher = async (sectionId, teacherId, token) => {
  const response = await axios.post(`${API_URL}/sections/assign-teacher`, 
    { sectionId, teacherId }, 
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

// Assign teacher to section (new method)
export const assignTeacherToSection = async (sectionId, teacherId, token) => {
  const response = await axios.post(`${API_URL}/sections/assign-teacher-to-section`, 
    { sectionId, teacherId }, 
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

// Remove teacher from section
export const removeTeacherFromSection = async (sectionId, token) => {
  const response = await axios.post(`${API_URL}/sections/remove-teacher`, 
    { sectionId }, 
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

// Assign students to section
export const assignStudents = async (sectionId, studentIds, token) => {
  const response = await axios.post(`${API_URL}/sections/assign-students`, 
    { sectionId, studentIds }, 
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

// Get sections by course
export const getSectionsByCourse = async (courseId, token) => {
  const response = await axios.get(`${API_URL}/sections/course/${courseId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Get teacher-student connections via section
export const getTeacherStudentConnections = async (teacherId, token) => {
  const response = await axios.get(`${API_URL}/sections/teacher/${teacherId}/connections`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Get student's section
export const getStudentSection = async (studentId, token) => {
  const response = await axios.get(`${API_URL}/sections/student/${studentId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Assign a student to a section (with one-student-one-section constraint)
export const assignStudentToSection = async (sectionId, studentId, token) => {
  const response = await axios.post(`${API_URL}/sections/assign-student`, 
    { sectionId, studentId }, 
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

// Remove a student from a section
export const removeStudentFromSection = async (sectionId, studentId, token) => {
  const response = await axios.post(`${API_URL}/sections/remove-student`, 
    { sectionId, studentId }, 
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

// Assign courses to a section
export const assignCoursesToSection = async (sectionId, courseIds, token) => {
  const response = await axios.post(`${API_URL}/sections/assign-courses`, 
    { sectionId, courseIds }, 
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

// Remove courses from a section
export const removeCoursesFromSection = async (sectionId, courseIds, token) => {
  const response = await axios.post(`${API_URL}/sections/remove-courses`, 
    { sectionId, courseIds }, 
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

// Get all sections
export const getAllSections = async (token) => {
  const response = await axios.get(`${API_URL}/sections`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Get available students for assignment (not in any section)
export const getAvailableStudents = async (schoolId, token) => {
  const response = await axios.get(`${API_URL}/sections/available-students/${schoolId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ============ COURSE-TEACHER ASSIGNMENT API FUNCTIONS ============

// Get unassigned courses for a section
export const getUnassignedCourses = async (sectionId, token) => {
  const response = await axios.get(`${API_URL}/sections/${sectionId}/unassigned-courses`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Assign teacher to a course in a section
export const assignCourseTeacher = async (sectionId, courseId, teacherId, token) => {
  const response = await axios.post(`${API_URL}/sections/${sectionId}/assign-course-teacher`, 
    { courseId, teacherId }, 
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

// Get all course-teacher assignments for a section
export const getSectionCourseTeachers = async (sectionId, token) => {
  const response = await axios.get(`${API_URL}/sections/${sectionId}/course-teachers`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Remove teacher assignment from a course
export const removeCourseTeacher = async (sectionId, courseId, token) => {
  const response = await axios.delete(`${API_URL}/sections/${sectionId}/course/${courseId}/teacher`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Get teacher's course assignments
export const getTeacherCourseAssignments = async (teacherId, token) => {
  const response = await axios.get(`${API_URL}/sections/teacher/${teacherId}/course-assignments`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
