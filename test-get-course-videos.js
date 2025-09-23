const axios = require('axios');

async function testGetCourseVideos() {
    try {
        console.log('🔍 Testing getCourseVideos API endpoint...\n');
        
        const baseURL = 'http://localhost:5000/api';
        
        // Use the admin credentials from the .env file
        const adminLogin = {
            email: 'sourav11092002@gmail.com',
            password: 'Admin@1234'
        };
        
        console.log('1. Logging in as admin...');
        const loginResponse = await axios.post(`${baseURL}/admin/login`, adminLogin);
        const token = loginResponse.data.token;
        console.log('✅ Admin login successful\n');
        
        console.log('2. Getting list of courses...');
        const coursesResponse = await axios.get(`${baseURL}/admin/courses`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const courses = coursesResponse.data;
        console.log(`✅ Found ${courses.length} courses\n`);
        
        if (courses.length > 0) {
            const testCourseId = '68cbcc904eb37fd405cae0c2'; // The course ID from the error
            console.log(`3. Testing getCourseVideos for course ID: ${testCourseId}`);
            
            try {
                const videosResponse = await axios.get(`${baseURL}/admin/course/${testCourseId}/videos`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                const videos = videosResponse.data;
                console.log(`✅ Successfully fetched ${videos.length} videos`);
                
                if (videos.length > 0) {
                    console.log('\n📹 Video details:');
                    videos.forEach((video, index) => {
                        console.log(`${index + 1}. ${video.title}`);
                        console.log(`   Type: ${video.videoType || 'unknown'}`);
                        console.log(`   URL: ${video.videoUrl ? 'Present' : 'Missing'}`);
                        console.log(`   Link: ${video.videoLink ? video.videoLink : 'N/A'}`);
                        console.log(`   Teacher: ${video.teacherName}`);
                        console.log(`   Warned: ${video.warned ? 'Yes' : 'No'}`);
                        console.log('');
                    });
                } else {
                    console.log('📹 No videos found for this course');
                }
                
                console.log('\n🎉 getCourseVideos API is working correctly!');
                
            } catch (videoError) {
                console.error('❌ Error fetching course videos:', videoError.response?.data?.message || videoError.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
        console.log('\n💡 Make sure the backend server is running on port 5000');
    }
}

testGetCourseVideos();