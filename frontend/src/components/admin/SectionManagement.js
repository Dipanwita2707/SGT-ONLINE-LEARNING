import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import { 
  Add as AddIcon, 
  People as PeopleIcon, 
  School as SchoolIcon,
  Info as InfoIcon,
  PersonAdd as PersonAddIcon,
  LibraryBooks as LibraryBooksIcon,
  Close as CloseIcon
} from '@mui/icons-material';
// Group Chat components
import GroupChatButton from '../../components/chat/GroupChatButton';
import GroupChatPanel from '../../components/chat/GroupChatPanel';
import * as sectionApi from '../../api/sectionApi';
import { 
  getAllSchools,
  getDepartmentsBySchool,
  getCoursesByDepartment,
  getTeachersByDepartment,
  getStudentsBySchool,
  createSectionWithCourses
} from '../../api/hierarchyApi';

const SectionManagement = ({ user, token }) => {
  const [sections, setSections] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [schools, setSchools] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openStudentAssignDialog, setOpenStudentAssignDialog] = useState(false);
  const [openCourseAssignDialog, setOpenCourseAssignDialog] = useState(false);
  const [openTeacherAssignDialog, setOpenTeacherAssignDialog] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [detailsTab, setDetailsTab] = useState(0);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [selectedStudentsToAssign, setSelectedStudentsToAssign] = useState([]);
  const [selectedCoursesToAssign, setSelectedCoursesToAssign] = useState([]);
  const [selectedTeacherToAssign, setSelectedTeacherToAssign] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState(null); // { courseId, sectionId, courseTitle }
  
  // New state for school-wise filtering
  const [selectedSchoolForView, setSelectedSchoolForView] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    schoolId: '',
    departmentId: '',
    courseId: '', // Changed from courseIds to courseId to match the form
    teacherId: '',
    studentIds: [],
    capacity: 80,
    semester: 'Fall',
    year: new Date().getFullYear()
  });

  // Fetch initial data
  useEffect(() => {
    fetchSchools();
    fetchAllSections();
  }, []);

  // Filter sections when selected school changes
  useEffect(() => {
    if (selectedSchoolForView) {
      const filtered = allSections.filter(section => section.school?._id === selectedSchoolForView);
      setSections(filtered);
    } else {
      setSections(allSections);
    }
  }, [selectedSchoolForView, allSections]);

  // Fetch students when school changes
  useEffect(() => {
    if (formData.schoolId) {
      fetchStudents();
    }
  }, [formData.schoolId]);

  const fetchSchools = async () => {
    try {
      const data = await getAllSchools();
      setSchools(data);
    } catch (err) {
      setError('Failed to fetch schools');
    }
  };

  const fetchAllSections = async () => {
    try {
      console.log('Fetching sections...');
      const currentToken = token || localStorage.getItem('token');
      console.log('Using token:', currentToken ? 'Token exists' : 'No token');
      const data = await sectionApi.getAllSections(currentToken);
      console.log('Sections received:', data);
      setAllSections(data);
      setSections(data);
    } catch (err) {
      console.error('Error fetching sections:', err);
      setError('Failed to fetch sections: ' + (err.response?.data?.message || err.message));
    }
  };

  const fetchStudents = async () => {
    try {
      if (formData.schoolId) {
        const data = await getStudentsBySchool(formData.schoolId);
        setStudents(data);
      }
    } catch (err) {
      setError('Failed to fetch students');
    }
  };

  // Fetch available students for assignment (not already in any section)
  const fetchAvailableStudents = async (schoolId) => {
    try {
      if (!schoolId) return;
      
      const available = await sectionApi.getAvailableStudents(schoolId, token);
      setAvailableStudents(available);
    } catch (err) {
      console.error('Error fetching available students:', err);
      setError('Failed to fetch available students: ' + (err.response?.data?.message || err.message));
    }
  };

  // Fetch available courses for assignment
  const fetchAvailableCourses = async (schoolId, departmentId) => {
    try {
      if (!schoolId) return;
      
      let courses = [];
      if (departmentId) {
        courses = await getCoursesByDepartment(departmentId);
      } else {
        // Get all courses for the school
        const schools = await getAllSchools();
        const school = schools.find(s => s._id === schoolId);
        if (school && school.departments) {
          for (const dept of school.departments) {
            const deptCourses = await getCoursesByDepartment(dept._id);
            courses.push(...deptCourses);
          }
        }
      }
      
      setAvailableCourses(courses);
    } catch (err) {
      setError('Failed to fetch available courses');
    }
  };

  // Fetch available teachers for assignment
  const fetchAvailableTeachers = async (departmentId) => {
    try {
      if (!departmentId) return;
      
      const teachers = await getTeachersByDepartment(departmentId);
      setAvailableTeachers(teachers);
    } catch (err) {
      console.error('Error fetching available teachers:', err);
      setError('Failed to fetch available teachers: ' + (err.response?.data?.message || err.message));
    }
  };

  const fetchDepartmentsBySchool = async (schoolId) => {
    try {
      const data = await getDepartmentsBySchool(schoolId);
      setDepartments(data);
    } catch (err) {
      setError('Failed to fetch departments');
    }
  };

  const fetchCoursesByDepartment = async (departmentId) => {
    try {
      const data = await getCoursesByDepartment(departmentId);
      setCourses(data);
    } catch (err) {
      setError('Failed to fetch courses');
    }
  };

  const fetchTeachersByDepartment = async (departmentId) => {
    try {
      const data = await getTeachersByDepartment(departmentId);
      setTeachers(data);
    } catch (err) {
      setError('Failed to fetch teachers');
    }
  };

  const fetchSectionsByCourse = async (courseId) => {
    try {
      const data = await sectionApi.getSectionsByCourse(courseId, token);
      setSections(data);
    } catch (err) {
      setError('Failed to fetch sections');
    }
  };

  const handleSchoolChange = (schoolId) => {
    setFormData({ ...formData, schoolId, departmentId: '', courseId: '', teacherId: '', studentIds: [] });
    setDepartments([]);
    setCourses([]);
    setTeachers([]);
    setStudents([]);
    if (schoolId) {
      fetchDepartmentsBySchool(schoolId);
      fetchStudents(); // Fetch students when school is selected
    }
  };

  const handleDepartmentChange = (departmentId) => {
    setFormData({ ...formData, departmentId, courseId: '', teacherId: '' });
    setCourses([]);
    setTeachers([]);
    if (departmentId) {
      fetchCoursesByDepartment(departmentId);
      fetchTeachersByDepartment(departmentId);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      
      const sectionData = {
        name: formData.name,
        schoolId: formData.schoolId,
        departmentId: formData.departmentId,
        courseIds: formData.courseId ? [formData.courseId] : [], // Convert single course to array
        teacherId: formData.teacherId,
        studentIds: formData.studentIds,
        capacity: formData.capacity,
        semester: formData.semester,
        year: formData.year
      };
      
      // Use section API for section creation
      await sectionApi.createSection(sectionData, token);
      setSuccess('Section created successfully!');
      
      // Reset form
      setFormData({
        name: '',
        schoolId: '',
        departmentId: '',
        courseId: '',
        teacherId: '',
        studentIds: [],
        capacity: 80,
        semester: 'Fall',
        year: new Date().getFullYear()
      });
      setOpenDialog(false);
      
      // Refresh sections list
      fetchAllSections();
    } catch (err) {
      setError(err.message || 'Failed to create section');
    } finally {
      setLoading(false);
    }
  };

  // Assignment handlers for section details
  const handleAssignStudent = async (studentId) => {
    try {
      setLoading(true);
      setError('');
      
      await sectionApi.assignStudentToSection(selectedSection._id, studentId, token);
      setSuccess('Student assigned successfully!');
      
      // Refresh sections and update selected section
      await fetchAllSections();
      const updatedSection = await sectionApi.getAllSections(token);
      const updated = updatedSection.find(s => s._id === selectedSection._id);
      setSelectedSection(updated);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to assign student');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    try {
      setLoading(true);
      setError('');
      
      await sectionApi.removeStudentFromSection(selectedSection._id, studentId, token);
      setSuccess('Student removed successfully!');
      
      // Refresh sections and update selected section
      await fetchAllSections();
      const updatedSections = await sectionApi.getAllSections(token);
      const updated = updatedSections.find(s => s._id === selectedSection._id);
      setSelectedSection(updated);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to remove student');
    } finally {
      setLoading(false);
    }
  };

  // Handle remove teacher
  const handleRemoveTeacher = async () => {
    try {
      setLoading(true);
      setError('');
      
      await sectionApi.removeTeacherFromSection(selectedSection._id, token);
      setSuccess('Teacher removed successfully!');
      
      // Refresh sections and update selected section
      await fetchAllSections();
      const updatedSections = await sectionApi.getAllSections(token);
      const updated = updatedSections.find(s => s._id === selectedSection._id);
      setSelectedSection(updated);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to remove teacher');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCourses = async (courseIds) => {
    try {
      setLoading(true);
      setError('');
      
      await sectionApi.assignCoursesToSection(selectedSection._id, courseIds, token);
      setSuccess('Courses assigned successfully!');
      
      // Refresh sections and update selected section
      await fetchAllSections();
      const updatedSections = await sectionApi.getAllSections(token);
      const updated = updatedSections.find(s => s._id === selectedSection._id);
      setSelectedSection(updated);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to assign courses');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCourse = async (courseId) => {
    try {
      setLoading(true);
      setError('');
      
      await sectionApi.removeCoursesFromSection(selectedSection._id, [courseId], token);
      setSuccess('Course removed successfully!');
      
      // Refresh sections and update selected section
      await fetchAllSections();
      const updatedSections = await sectionApi.getAllSections(token);
      const updated = updatedSections.find(s => s._id === selectedSection._id);
      setSelectedSection(updated);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to remove course');
    } finally {
      setLoading(false);
    }
  };

  // Open student assignment dialog
  const openStudentAssignment = async () => {
    if (!selectedSection) return;
    
    await fetchAvailableStudents(selectedSection.school._id);
    setSelectedStudentsToAssign([]);
    setOpenStudentAssignDialog(true);
  };

  // Open course assignment dialog
  const openCourseAssignment = async () => {
    if (!selectedSection) return;
    
    await fetchAvailableCourses(selectedSection.school._id, selectedSection.department?._id);
    setSelectedCoursesToAssign([]);
    setOpenCourseAssignDialog(true);
  };

  // Open teacher assignment dialog
  const openTeacherAssignment = async () => {
    if (!selectedSection) return;
    
    await fetchAvailableTeachers(selectedSection.department?._id);
    setSelectedTeacherToAssign('');
    setOpenTeacherAssignDialog(true);
  };

  // Handle bulk student assignment
  const handleBulkStudentAssignment = async () => {
    try {
      setLoading(true);
      setError('');
      
      for (const studentId of selectedStudentsToAssign) {
        await sectionApi.assignStudentToSection(selectedSection._id, studentId, token);
      }
      
      setSuccess(`${selectedStudentsToAssign.length} students assigned successfully!`);
      setOpenStudentAssignDialog(false);
      
      // Refresh sections and update selected section
      await fetchAllSections();
      const updatedSections = await sectionApi.getAllSections(token);
      const updated = updatedSections.find(s => s._id === selectedSection._id);
      setSelectedSection(updated);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to assign students');
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk course assignment
  const handleBulkCourseAssignment = async () => {
    try {
      setLoading(true);
      setError('');
      
      await sectionApi.assignCoursesToSection(selectedSection._id, selectedCoursesToAssign, token);
      setSuccess(`${selectedCoursesToAssign.length} courses assigned successfully!`);
      setOpenCourseAssignDialog(false);
      
      // Refresh sections and update selected section
      await fetchAllSections();
      const updatedSections = await sectionApi.getAllSections(token);
      const updated = updatedSections.find(s => s._id === selectedSection._id);
      setSelectedSection(updated);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to assign courses');
    } finally {
      setLoading(false);
    }
  };

  // Handle teacher assignment
  const handleTeacherAssignment = async () => {
    try {
      setLoading(true);
      setError('');
      
      await sectionApi.assignTeacherToSection(selectedSection._id, selectedTeacherToAssign, token);
      setSuccess('Teacher assigned successfully!');
      setOpenTeacherAssignDialog(false);
      
      // Refresh sections and update selected section
      await fetchAllSections();
      const updatedSections = await sectionApi.getAllSections(token);
      const updated = updatedSections.find(s => s._id === selectedSection._id);
      setSelectedSection(updated);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to assign teacher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Section Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Manage school sections, assign teachers and students to create organized learning groups.
        </Typography>

        {/* Debug Info */}
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Debug: {sections.length} sections loaded, {allSections.length} total sections
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Create Section
          </Button>
          <Button
            variant="outlined"
            onClick={fetchAllSections}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {/* School-wise Section Filter */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              View Sections by School
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Filter by School</InputLabel>
                  <Select
                    value={selectedSchoolForView}
                    onChange={(e) => setSelectedSchoolForView(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>All Schools</em>
                    </MenuItem>
                    {schools.map((school) => (
                      <MenuItem key={school._id} value={school._id}>
                        {school.name} ({school.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  {selectedSchoolForView 
                    ? `Showing ${sections.length} sections from ${schools.find(s => s._id === selectedSchoolForView)?.name || 'selected school'}`
                    : `Showing all ${sections.length} sections`
                  }
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Sections Display */}
        <Grid container spacing={3}>
          {sections.length === 0 ? (
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <SchoolIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No sections found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedSchoolForView 
                      ? 'No sections created for the selected school yet.'
                      : 'No sections have been created yet. Click "Create Section" to get started.'
                    }
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            sections.map((section) => (
              <Grid item xs={12} md={6} lg={4} key={section._id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      {section.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      School: {section.school?.name || 'Not specified'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Department: {section.department?.name || 'School-wide'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Teacher: {section.teacher?.name || 'Not assigned'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PeopleIcon sx={{ mr: 1, fontSize: 16 }} />
                      <Typography variant="body2">
                        {section.students?.length || 0}/{section.capacity || 80} students
                      </Typography>
                    </Box>
                    {section.courses?.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Courses:
                        </Typography>
                        {section.courses.slice(0, 2).map((course) => (
                          <Chip
                            key={course._id}
                            label={course.title || course.courseCode}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                        {section.courses.length > 2 && (
                          <Chip
                            label={`+${section.courses.length - 2} more`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    )}
                    {section.students?.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Students:
                        </Typography>
                        {section.students.slice(0, 3).map((student) => (
                          <Chip
                            key={student._id}
                            label={student.name}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                        {section.students.length > 3 && (
                          <Chip
                            label={`+${section.students.length - 3} more`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<InfoIcon />}
                      onClick={() => {
                        console.log('Details button clicked for section:', section);
                        setSelectedSection(section);
                        setOpenDetailsDialog(true);
                      }}
                    >
                      Details
                    </Button>
                    {section.courses && section.courses.length > 0 && (
                      <GroupChatButton
                        onClick={() => {
                          // For admin, if multiple courses, open first by default; could be extended to chooser
                          const c = section.courses[0];
                          setChatContext({ courseId: c._id, sectionId: section._id, courseTitle: c.title || c.courseCode });
                          setChatOpen(true);
                        }}
                        size="small"
                      />
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>

        {/* Section Details Dialog */}
        <Dialog 
          open={openDetailsDialog} 
          onClose={() => setOpenDetailsDialog(false)} 
          maxWidth="lg" 
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Section Details: {selectedSection?.name}
              </Typography>
              <IconButton onClick={() => setOpenDetailsDialog(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedSection && (
              <Box>
                <Tabs value={detailsTab} onChange={(e, newValue) => setDetailsTab(newValue)}>
                  <Tab label="Overview" />
                  <Tab label="Students" />
                  <Tab label="Courses" />
                  <Tab label="Management" />
                </Tabs>
                
                {/* Overview Tab */}
                {detailsTab === 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="h6" gutterBottom>Basic Information</Typography>
                          <Typography><strong>Name:</strong> {selectedSection.name}</Typography>
                          <Typography><strong>School:</strong> {selectedSection.school?.name || 'Not specified'}</Typography>
                          <Typography><strong>Department:</strong> {selectedSection.department?.name || 'School-wide'}</Typography>
                          <Typography><strong>Academic Year:</strong> {selectedSection.academicYear || 'Not specified'}</Typography>
                          <Typography><strong>Semester:</strong> {selectedSection.semester || 'Not specified'}</Typography>
                          <Typography><strong>Capacity:</strong> {selectedSection.capacity || 80}</Typography>
                          <Typography><strong>Status:</strong> {selectedSection.isActive ? 'Active' : 'Inactive'}</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="h6" gutterBottom>Statistics</Typography>
                          <Box display="flex" alignItems="center" mb={1}>
                            <PeopleIcon sx={{ mr: 1 }} />
                            <Typography>
                              <strong>Students:</strong> {selectedSection.students?.length || 0}/{selectedSection.capacity || 80}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" mb={1}>
                            <LibraryBooksIcon sx={{ mr: 1 }} />
                            <Typography>
                              <strong>Courses:</strong> {selectedSection.courses?.length || 0}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" mb={1}>
                            <SchoolIcon sx={{ mr: 1 }} />
                            <Typography>
                              <strong>Teacher:</strong> {selectedSection.teacher?.name || 'Not assigned'}
                              {selectedSection.teacher && (
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleRemoveTeacher()}
                                  color="error"
                                  sx={{ ml: 1 }}
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* Students Tab */}
                {detailsTab === 1 && (
                  <Box sx={{ mt: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        Students ({selectedSection.students?.length || 0}/{selectedSection.capacity || 80})
                      </Typography>
                      <Box>
                        <Button
                          startIcon={<PersonAddIcon />}
                          variant="outlined"
                          size="small"
                          sx={{ mr: 1 }}
                          onClick={openStudentAssignment}
                        >
                          Assign Students
                        </Button>
                      </Box>
                    </Box>
                    <List>
                      {selectedSection.students?.length > 0 ? (
                        selectedSection.students.map((student) => (
                          <ListItem key={student._id}>
                            <ListItemText
                              primary={student.name}
                              secondary={`${student.email} • Reg No: ${student.regNo || 'N/A'}`}
                            />
                            <ListItemSecondaryAction>
                              <IconButton 
                                edge="end" 
                                aria-label="remove"
                                onClick={() => handleRemoveStudent(student._id)}
                                color="error"
                                size="small"
                              >
                                <CloseIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))
                      ) : (
                        <Typography color="text.secondary">No students assigned to this section</Typography>
                      )}
                    </List>
                  </Box>
                )}

                {/* Courses Tab */}
                {detailsTab === 2 && (
                  <Box sx={{ mt: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        Courses ({selectedSection.courses?.length || 0})
                      </Typography>
                      <Button
                        startIcon={<LibraryBooksIcon />}
                        variant="outlined"
                        size="small"
                        onClick={openCourseAssignment}
                      >
                        Assign Courses
                      </Button>
                    </Box>
                    <List>
                      {selectedSection.courses?.length > 0 ? (
                        selectedSection.courses.map((course) => (
                          <ListItem key={course._id}>
                            <ListItemText
                              primary={course.title}
                              secondary={`Course Code: ${course.courseCode || 'N/A'}`}
                            />
                            <ListItemSecondaryAction>
                              <IconButton 
                                edge="end" 
                                aria-label="remove"
                                onClick={() => handleRemoveCourse(course._id)}
                                color="error"
                                size="small"
                              >
                                <CloseIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))
                      ) : (
                        <Typography color="text.secondary">No courses assigned to this section</Typography>
                      )}
                    </List>
                  </Box>
                )}

                {/* Management Tab */}
                {detailsTab === 3 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>Section Management</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<PersonAddIcon />}
                          sx={{ mb: 1 }}
                          onClick={() => {
                            console.log('Assign Teacher clicked');
                            openTeacherAssignment();
                          }}
                        >
                          Assign Teacher
                        </Button>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<PeopleIcon />}
                          sx={{ mb: 1 }}
                          onClick={() => {
                            console.log('Manage Students clicked');
                            openStudentAssignment();
                          }}
                        >
                          Manage Students
                        </Button>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<LibraryBooksIcon />}
                          sx={{ mb: 1 }}
                          onClick={() => {
                            console.log('Manage Courses clicked');
                            openCourseAssignment();
                          }}
                        >
                          Manage Courses
                        </Button>
                      </Grid>
                    </Grid>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Section Rules:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Each student can only be assigned to one section
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Section capacity is limited to {selectedSection.capacity || 80} students
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Multiple courses can be assigned to a section
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
        </Dialog>
        <GroupChatPanel
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          courseId={chatContext?.courseId}
          sectionId={chatContext?.sectionId}
          title={chatContext ? `Group Chat • ${chatContext.courseTitle}` : 'Group Chat'}
        />

        {/* Student Assignment Dialog */}
        <Dialog 
          open={openStudentAssignDialog} 
          onClose={() => setOpenStudentAssignDialog(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>Assign Students to {selectedSection?.name}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select students to assign to this section. Available capacity: {selectedSection ? (selectedSection.capacity - (selectedSection.students?.length || 0)) : 0} students
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Available Students</InputLabel>
              <Select
                multiple
                value={selectedStudentsToAssign}
                onChange={(e) => {
                  const selected = e.target.value;
                  const remainingCapacity = selectedSection ? (selectedSection.capacity - (selectedSection.students?.length || 0)) : 0;
                  if (selected.length <= remainingCapacity) {
                    setSelectedStudentsToAssign(selected);
                  }
                }}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const student = availableStudents.find(s => s._id === value);
                      return (
                        <Chip key={value} label={student?.name || value} size="small" />
                      );
                    })}
                  </Box>
                )}
              >
                {availableStudents.map((student) => (
                  <MenuItem key={student._id} value={student._id}>
                    {student.name} ({student.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {availableStudents.length === 0 && (
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                No available students. All students are already assigned to sections.
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenStudentAssignDialog(false)}>Cancel</Button>
            <Button
              onClick={handleBulkStudentAssignment}
              variant="contained"
              disabled={loading || selectedStudentsToAssign.length === 0}
            >
              {loading ? 'Assigning...' : `Assign ${selectedStudentsToAssign.length} Students`}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Course Assignment Dialog */}
        <Dialog 
          open={openCourseAssignDialog} 
          onClose={() => setOpenCourseAssignDialog(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>Assign Courses to {selectedSection?.name}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select courses to assign to this section. Multiple courses can be assigned.
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Available Courses</InputLabel>
              <Select
                multiple
                value={selectedCoursesToAssign}
                onChange={(e) => setSelectedCoursesToAssign(e.target.value)}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const course = availableCourses.find(c => c._id === value);
                      return (
                        <Chip key={value} label={course?.title || value} size="small" />
                      );
                    })}
                  </Box>
                )}
              >
                {availableCourses.map((course) => (
                  <MenuItem key={course._id} value={course._id}>
                    {course.title} ({course.courseCode})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {availableCourses.length === 0 && (
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                No available courses found for this school/department.
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCourseAssignDialog(false)}>Cancel</Button>
            <Button
              onClick={handleBulkCourseAssignment}
              variant="contained"
              disabled={loading || selectedCoursesToAssign.length === 0}
            >
              {loading ? 'Assigning...' : `Assign ${selectedCoursesToAssign.length} Courses`}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Teacher Assignment Dialog */}
        <Dialog 
          open={openTeacherAssignDialog} 
          onClose={() => setOpenTeacherAssignDialog(false)} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>Assign Teacher to {selectedSection?.name}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select a teacher to assign to this section.
            </Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Available Teachers</InputLabel>
              <Select
                value={selectedTeacherToAssign}
                onChange={(e) => setSelectedTeacherToAssign(e.target.value)}
              >
                {availableTeachers.map((teacher) => (
                  <MenuItem key={teacher._id} value={teacher._id}>
                    {teacher.name} ({teacher.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {availableTeachers.length === 0 && (
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                No available teachers in this department.
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenTeacherAssignDialog(false)}>Cancel</Button>
            <Button
              onClick={handleTeacherAssignment}
              variant="contained"
              disabled={loading || !selectedTeacherToAssign}
            >
              {loading ? 'Assigning...' : 'Assign Teacher'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Section Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create New Section</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Section Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Section A, Morning Batch, etc."
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>School *</InputLabel>
                  <Select
                    value={formData.schoolId}
                    onChange={(e) => handleSchoolChange(e.target.value)}
                    required
                  >
                    {schools.map((school) => (
                      <MenuItem key={school._id} value={school._id}>
                        {school.name} ({school.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Department (Optional)</InputLabel>
                  <Select
                    value={formData.departmentId}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    disabled={!formData.schoolId}
                  >
                    <MenuItem value="">
                      <em>School-wide Section</em>
                    </MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Course (Optional)</InputLabel>
                  <Select
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    disabled={!formData.departmentId}
                  >
                    <MenuItem value="">
                      <em>No Course Assigned</em>
                    </MenuItem>
                    {courses.map((course) => (
                      <MenuItem key={course._id} value={course._id}>
                        {course.title} ({course.courseCode})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Teacher (Optional)</InputLabel>
                  <Select
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    disabled={!formData.departmentId}
                  >
                    <MenuItem value="">
                      <em>No Teacher Assigned</em>
                    </MenuItem>
                    {teachers.map((teacher) => (
                      <MenuItem key={teacher._id} value={teacher._id}>
                        {teacher.name} ({teacher.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 80 })}
                  InputProps={{ inputProps: { min: 1, max: 100 } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Semester</InputLabel>
                  <Select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  >
                    <MenuItem value="Fall">Fall</MenuItem>
                    <MenuItem value="Spring">Spring</MenuItem>
                    <MenuItem value="Summer">Summer</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Academic Year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                  InputProps={{ inputProps: { min: 2020, max: 2030 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Students (Optional - Select up to {formData.capacity})</InputLabel>
                  <Select
                    multiple
                    value={formData.studentIds}
                    onChange={(e) => {
                      const selected = e.target.value;
                      if (selected.length <= formData.capacity) {
                        setFormData({ ...formData, studentIds: selected });
                      }
                    }}
                    disabled={!formData.schoolId}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.slice(0, 5).map((value) => {
                          const student = students.find(s => s._id === value);
                          return (
                            <Chip key={value} label={student?.name || value} size="small" />
                          );
                        })}
                        {selected.length > 5 && (
                          <Chip label={`+${selected.length - 5} more`} size="small" variant="outlined" />
                        )}
                      </Box>
                    )}
                  >
                    {students.map((student) => (
                      <MenuItem key={student._id} value={student._id}>
                        {student.name} ({student.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary">
                  Selected: {formData.studentIds.length}/{formData.capacity} students
                </Typography>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading || !formData.name || !formData.schoolId}
            >
              {loading ? 'Creating...' : 'Create Section'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default SectionManagement;
