const axios = require('axios');

async function testCourseVideosAPI() {
  try {
    console.log('🔍 TESTING COURSE VIDEOS API DIRECTLY\n');
    
    const baseURL = 'http://localhost:5000/api';
    
    // Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${baseURL}/admin/login`, {
      email: 'sourav11092002@gmail.com',
      password: 'Admin@1234'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');
    
    // Test the specific course that was failing
    const courseId = '68cbcc904eb37fd405cae0c2'; // AstroChemistry
    console.log(`2. Fetching videos for course: ${courseId}`);
    console.log(`   URL: ${baseURL}/admin/course/${courseId}/videos\n`);
    
    const response = await axios.get(`${baseURL}/admin/course/${courseId}/videos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ API Response received successfully!');
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Videos found: ${response.data.length}\n`);
    
    if (response.data.length > 0) {
      console.log('🎬 VIDEO DETAILS:');
      response.data.forEach((video, index) => {
        console.log(`\n${index + 1}. "${video.title}"`);
        console.log(`   ID: ${video._id}`);
        console.log(`   Type: ${video.videoType || 'not set'}`);
        console.log(`   VideoURL: ${video.videoUrl ? 'Present' : 'Missing'}`);
        console.log(`   VideoLink: ${video.videoLink || 'None'}`);
        console.log(`   Teacher: ${video.teacherName}`);
        console.log(`   Course: ${video.course || 'No course field'}`);
        console.log(`   Warned: ${video.warned ? 'Yes' : 'No'}`);
        console.log(`   Upload Date: ${video.uploadDate}`);
        console.log(`   Views: ${video.views || 0}`);
        console.log(`   Completion Rate: ${video.completionRate || 0}%`);
      });
      
      console.log('\n🎉 API IS WORKING CORRECTLY!');
      console.log('💡 The issue is likely in the frontend display logic.');
      
    } else {
      console.log('❌ API returned empty array');
      console.log('💡 This suggests an issue with the getCourseVideos function.');
    }
    
  } catch (error) {
    console.error('❌ API Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('\n💡 500 Error suggests backend processing issue');
      console.log('📋 Error details:', error.response.data);
    } else if (error.response?.status === 401) {
      console.log('\n💡 Authentication issue - check admin credentials');
    }
  }
}

testCourseVideosAPI();