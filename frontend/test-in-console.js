// Simple test to check if the frontend can connect to backend
// Paste this in browser console to test

console.log('🔍 Testing frontend-backend connection...');

// Check localStorage
const token = localStorage.getItem('token');
const user = localStorage.getItem('user');

console.log('Storage check:', {
  hasToken: !!token,
  tokenLength: token?.length,
  hasUser: !!user,
  userPreview: user ? JSON.parse(user).name : 'No user'
});

// Test direct API call
if (token && user) {
  const userData = JSON.parse(user);
  console.log('Making test API call for user:', userData.name);
  
  fetch(`/api/sections/student/${userData._id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => {
    console.log('API Response status:', response.status);
    if (response.ok) {
      return response.json();
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  })
  .then(data => {
    console.log('✅ API SUCCESS:', {
      sectionName: data.section?.name,
      hasStudents: !!data.section?.students,
      studentCount: data.section?.students?.length,
      teacher: data.section?.teacher?.name
    });
  })
  .catch(error => {
    console.log('❌ API ERROR:', error.message);
  });
} else {
  console.log('❌ Missing authentication data');
}