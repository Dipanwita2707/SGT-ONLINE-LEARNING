
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Alert, 
  FormGroup, 
  FormControlLabel, 
  Checkbox, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel,
  Chip,
  OutlinedInput,
  ListItemText
} from '@mui/material';
import axios from 'axios';

const PERMISSIONS = [
  { key: 'manage_teachers', label: 'Manage Teachers' },
  { key: 'manage_students', label: 'Manage Students' },
  { key: 'manage_courses', label: 'Manage Courses' },
  { key: 'manage_videos', label: 'Manage Videos' },
  { key: 'view_analytics', label: 'View Analytics' },
  // Add more as needed
];

const AddTeacherForm = ({ onAdd }) => {

  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    permissions: [],
    school: '',
    department: '',
    coursesAssigned: [],
    sectionsAssigned: []
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [touched, setTouched] = useState({});
  const [schools, setSchools] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);

  const token = localStorage.getItem('token');

  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  // Fetch schools, departments, courses, and sections on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching teacher form data...');
        console.log('Making API calls to fetch schools, departments, courses, sections...');
        
        const schoolsPromise = axios.get('/api/schools', { headers: { Authorization: `Bearer ${token}` } });
        const departmentsPromise = axios.get('/api/departments', { headers: { Authorization: `Bearer ${token}` } });
        const coursesPromise = axios.get('/api/courses', { headers: { Authorization: `Bearer ${token}` } });
        const sectionsPromise = axios.get('/api/sections', { headers: { Authorization: `Bearer ${token}` } });

        const [schoolsRes, departmentsRes, coursesRes, sectionsRes] = await Promise.all([
          schoolsPromise.catch(err => {
            console.error('Schools API failed:', err);
            return { data: [] };
          }),
          departmentsPromise.catch(err => {
            console.error('Departments API failed:', err);
            return { data: [] };
          }),
          coursesPromise.catch(err => {
            console.error('Courses API failed:', err);
            return { data: [] };
          }),
          sectionsPromise.catch(err => {
            console.error('Sections API failed:', err);
            return { data: [] };
          })
        ]);
        
        console.log('Schools data:', schoolsRes.data);
        console.log('First school structure:', schoolsRes.data[0]);
        console.log('Departments data:', departmentsRes.data);
        console.log('Courses data:', coursesRes.data);
        console.log('Sections data:', sectionsRes.data);
        setSchools(schoolsRes.data);
        setDepartments(departmentsRes.data);
        setCourses(coursesRes.data);
        setSections(sectionsRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        console.error('Error details:', err.response?.data);
      }
    };
    fetchData();
  }, [token]);

  // Filter departments, courses, and sections when school/department changes
  useEffect(() => {
    if (form.school) {
      const filtered = departments.filter(dept => dept.school._id === form.school);
      setFilteredDepartments(filtered);
      const schoolCourses = courses.filter(course => course.school === form.school);
      console.log('Filtering courses for school:', form.school);
      console.log('All courses:', courses);
      console.log('Filtered school courses:', schoolCourses);
      setFilteredCourses(schoolCourses);
      // Reset department, courses, and sections if they don't belong to selected school
      if (form.department && !filtered.find(d => d._id === form.department)) {
        setForm(prev => ({ ...prev, department: '', coursesAssigned: [], sectionsAssigned: [] }));
      }
    } else {
      setFilteredDepartments([]);
      setFilteredCourses([]);
      setFilteredSections([]);
      setForm(prev => ({ ...prev, department: '', coursesAssigned: [], sectionsAssigned: [] }));
    }
  }, [form.school, departments, courses]);

  // Filter sections when department changes
  useEffect(() => {
    if (form.department) {
      console.log('Department selected:', form.department);
      console.log('Filtering courses for department...');
      
      // Filter courses by department (handle both string ID and populated object)
      const departmentCourses = courses.filter(course => {
        const courseDepId = typeof course.department === 'string' ? course.department : course.department._id;
        return courseDepId === form.department;
      });
      console.log('Courses for this department:', departmentCourses);
      setFilteredCourses(departmentCourses);
      
      // Filter sections by department (handle both string ID and populated object)
      const filtered = sections.filter(section => {
        const sectionDepId = typeof section.department === 'string' ? section.department : section.department._id;
        return sectionDepId === form.department;
      });
      console.log('Sections for this department:', filtered);
      setFilteredSections(filtered);
      // Reset sections if they don't belong to selected department
      if (form.sectionsAssigned.length > 0) {
        const validSections = form.sectionsAssigned.filter(sectionId => 
          filtered.find(s => s._id === sectionId)
        );
        if (validSections.length !== form.sectionsAssigned.length) {
          setForm(prev => ({ ...prev, sectionsAssigned: validSections }));
        }
      }
    } else {
      setFilteredSections([]);
      setForm(prev => ({ ...prev, sectionsAssigned: [] }));
    }
  }, [form.department, sections]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setTouched({ ...touched, [e.target.name]: true });
  };
  const handlePermissionChange = key => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter(p => p !== key)
        : [...f.permissions, key]
    }));
  };

  const validate = () => {
    if (!form.name.trim()) return 'Name is required';
    if (!form.email.trim()) return 'Email is required';
    if (!emailRegex.test(form.email)) return 'Invalid email address';
    if (!form.password || form.password.length < 6) return 'Password must be at least 6 characters';
    if (!form.school) return 'School is required';
    // Department, courses, and sections are optional
    return '';
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      await onAdd(form);
      setSuccess('Teacher added successfully');
      setForm({ name: '', email: '', password: '', permissions: [], school: '', department: '', coursesAssigned: [], sectionsAssigned: [] });
      setTouched({});
    } catch (err) {
      setError(err.message || 'Failed to add teacher');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mb: 2 }}>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      <Alert severity="info" sx={{ mb: 2 }}>
        A unique Teacher ID (format: T####) will be automatically generated upon creation.
        Department, courses, and sections are optional and can be assigned later.
      </Alert>
      <TextField
        label="Name"
        name="name"
        value={form.name}
        onChange={handleChange}
        fullWidth
        margin="normal"
        required
        error={!!touched.name && !form.name.trim()}
        helperText={touched.name && !form.name.trim() ? 'Name is required' : ''}
        inputProps={{ title: 'Enter the full name of the teacher' }}
      />
      <TextField
        label="Email"
        name="email"
        value={form.email}
        onChange={handleChange}
        fullWidth
        margin="normal"
        required
        error={!!touched.email && (!form.email.trim() || !emailRegex.test(form.email))}
        helperText={touched.email && !form.email.trim() ? 'Email is required' : (touched.email && !emailRegex.test(form.email) ? 'Invalid email address' : '')}
        inputProps={{ title: 'Enter a valid email address' }}
      />
      <TextField
        label="Password"
        name="password"
        value={form.password}
        onChange={handleChange}
        type="password"
        fullWidth
        margin="normal"
        required
        error={!!touched.password && (!form.password || form.password.length < 6)}
        helperText={touched.password && (!form.password || form.password.length < 6) ? 'Password must be at least 6 characters' : ''}
        inputProps={{ title: 'Password must be at least 6 characters' }}
      />
      
      <FormControl fullWidth margin="normal" required error={!!touched.school && !form.school}>
        <InputLabel>School</InputLabel>
        <Select
          name="school"
          value={form.school}
          onChange={handleChange}
          label="School"
        >
          {schools.length === 0 ? (
            <MenuItem disabled>
              <em>No schools available</em>
            </MenuItem>
          ) : (
            schools.map(school => (
              <MenuItem key={school._id} value={school._id}>
                {school.name} ({school.code})
              </MenuItem>
            ))
          )}
        </Select>
        {touched.school && !form.school && <Alert severity="error" sx={{ mt: 1 }}>School is required</Alert>}
      </FormControl>

      <FormControl fullWidth margin="normal" error={!!touched.department && !form.department} disabled={!form.school}>
        <InputLabel>Department (Optional)</InputLabel>
        <Select
          name="department"
          value={form.department}
          onChange={handleChange}
          label="Department (Optional)"
        >
          <MenuItem value="">
            <em>No Department</em>
          </MenuItem>
          {filteredDepartments.map(dept => (
            <MenuItem key={dept._id} value={dept._id}>
              {dept.name} ({dept.code})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal" disabled={!form.school}>
        <InputLabel>Courses (Optional)</InputLabel>
        <Select
          multiple
          value={form.coursesAssigned}
          onChange={(e) => setForm(prev => ({ ...prev, coursesAssigned: e.target.value }))}
          input={<OutlinedInput label="Courses (Optional)" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => {
                const course = filteredCourses.find(c => c._id === value);
                return (
                  <Chip key={value} label={course ? `${course.title} (${course.courseCode})` : value} size="small" />
                );
              })}
            </Box>
          )}
        >
          {filteredCourses.map(course => (
            <MenuItem key={course._id} value={course._id}>
              <Checkbox checked={form.coursesAssigned.indexOf(course._id) > -1} />
              <ListItemText primary={`${course.title} (${course.courseCode})`} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal" disabled={!form.department}>
        <InputLabel>Sections (Optional)</InputLabel>
        <Select
          multiple
          value={form.sectionsAssigned}
          onChange={(e) => setForm(prev => ({ ...prev, sectionsAssigned: e.target.value }))}
          input={<OutlinedInput label="Sections (Optional)" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => {
                const section = filteredSections.find(s => s._id === value);
                return (
                  <Chip 
                    key={value} 
                    label={section ? `${section.name} - ${section.course?.title || 'No Course'}` : value} 
                    size="small" 
                  />
                );
              })}
            </Box>
          )}
        >
          {filteredSections.map(section => (
            <MenuItem key={section._id} value={section._id}>
              <Checkbox checked={form.sectionsAssigned.indexOf(section._id) > -1} />
              <ListItemText primary={`${section.name} - ${section.course?.title || 'No Course'}`} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormGroup row sx={{ mt: 2 }}>
        {PERMISSIONS.map(p => (
          <FormControlLabel
            key={p.key}
            control={<Checkbox checked={form.permissions.includes(p.key)} onChange={() => handlePermissionChange(p.key)} />}
            label={p.label}
          />
        ))}
      </FormGroup>
      <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>Add Teacher</Button>
    </Box>
  );
};

export default AddTeacherForm;
