import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

// Create axios instance with interceptor for auth
const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Dean Management APIs
export const assignDeanToSchool = async (schoolId, deanId) => {
  try {
    const response = await api.post('/api/hierarchy/assign-dean', {
      schoolId,
      deanId
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const removeDeanFromSchool = async (schoolId) => {
  try {
    const response = await api.post('/api/hierarchy/remove-dean', {
      schoolId
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// HOD Management APIs
export const assignHODToDepartment = async (departmentId, hodId) => {
  try {
    const response = await api.post('/api/hierarchy/assign-hod', {
      departmentId,
      hodId
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const removeHODFromDepartment = async (departmentId) => {
  try {
    const response = await api.post('/api/hierarchy/remove-hod', {
      departmentId
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Teacher Department Assignment APIs
export const assignTeacherToDepartment = async (teacherId, departmentId) => {
  try {
    const response = await api.post('/api/hierarchy/assign-teacher-department', {
      teacherId,
      departmentId
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Section Management APIs
export const createSectionWithCourses = async (sectionData) => {
  try {
    const response = await api.post('/api/hierarchy/create-section', sectionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const assignStudentsToSection = async (sectionId, studentIds) => {
  try {
    const response = await api.post('/api/hierarchy/assign-students-section', {
      sectionId,
      studentIds
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const assignTeacherToSection = async (sectionId, teacherId) => {
  try {
    const response = await api.post('/api/hierarchy/assign-teacher-section', {
      sectionId,
      teacherId
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Hierarchy Overview APIs
export const getHierarchyOverview = async (schoolId = null) => {
  try {
    const url = schoolId 
      ? `/api/hierarchy/overview?schoolId=${schoolId}`
      : '/api/hierarchy/overview';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getSchoolHierarchy = async (schoolId) => {
  try {
    const response = await api.get(`/api/hierarchy/school/${schoolId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Academic Path APIs
export const getStudentAcademicPath = async (studentId) => {
  try {
    const response = await api.get(`/api/hierarchy/student-path/${studentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getTeacherTeachingLoad = async (teacherId) => {
  try {
    const response = await api.get(`/api/hierarchy/teacher-load/${teacherId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Utility APIs for dropdowns
export const getAvailableDeansForSchool = async (schoolId) => {
  try {
    const response = await api.get(`/api/hierarchy/available-deans/${schoolId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAvailableHODsForDepartment = async (departmentId) => {
  try {
    const response = await api.get(`/api/hierarchy/available-hods/${departmentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getTeachersByDepartment = async (departmentId) => {
  try {
    const response = await api.get(`/api/hierarchy/teachers-by-department/${departmentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getStudentsBySchool = async (schoolId) => {
  try {
    const response = await api.get(`/api/hierarchy/students-by-school/${schoolId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getCoursesByDepartment = async (departmentId) => {
  try {
    const response = await api.get(`/api/hierarchy/courses-by-department/${departmentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Schools and Departments APIs (for dropdown population)
export const getAllSchools = async () => {
  try {
    const response = await api.get('/api/schools');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getDepartmentsBySchool = async (schoolId) => {
  try {
    const response = await api.get(`/api/departments/school/${schoolId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get Dean assignments (placeholder function)
export const getDeanAssignments = async (deanId) => {
  try {
    const response = await api.get(`/api/dean/assignments/${deanId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get User assignments (placeholder function) 
export const getUserAssignments = async (userId) => {
  try {
    const response = await api.get(`/api/admin/user-assignments/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get My teaching assignments (placeholder function)
export const getMyTeachingAssignments = async () => {
  try {
    const response = await api.get('/api/teacher/my-assignments');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default {
  assignDeanToSchool,
  removeDeanFromSchool,
  assignHODToDepartment,
  removeHODFromDepartment,
  assignTeacherToDepartment,
  createSectionWithCourses,
  assignStudentsToSection,
  assignTeacherToSection,
  getHierarchyOverview,
  getSchoolHierarchy,
  getStudentAcademicPath,
  getTeacherTeachingLoad,
  getAvailableDeansForSchool,
  getAvailableHODsForDepartment,
  getTeachersByDepartment,
  getStudentsBySchool,
  getCoursesByDepartment,
  getAllSchools,
  getDepartmentsBySchool,
  getDeanAssignments,
  getUserAssignments,
  getMyTeachingAssignments,
};