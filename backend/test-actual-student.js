const axios = require('axios');

async function testWithActualCredentials() {
  try {
    console.log('🔐 Testing with actual student credentials: S999998\n');
    
    // First, let's login as the student to get a token
    console.log('1. Logging in as student S999998...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      uid: 'S999998',
      password: '123456'
    });
    
    const token = loginRes.data.token;
    const user = loginRes.data.user;
    console.log('✅ Login successful!', {
      userId: user._id,
      name: user.name,
      role: user.role,
      tokenLength: token.length
    });
    
    // Now try to get the section with the proper token
    console.log('\n2. Fetching section with authentication...');
    try {
      const sectionRes = await axios.get(`http://localhost:5000/api/sections/student/${user._id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('✅ Section found!', {
        sectionName: sectionRes.data.sectionName || sectionRes.data.name,
        studentCount: sectionRes.data.students?.length || 0,
        courseCount: sectionRes.data.courses?.length || 0,
        teacher: sectionRes.data.teacher?.name || 'Not assigned'
      });
      
    } catch (sectionError) {
      console.log('❌ Section fetch failed:', {
        status: sectionError.response?.status,
        message: sectionError.response?.data?.message || sectionError.message
      });
      
      if (sectionError.response?.status === 404) {
        console.log('\n3. Student not assigned to any section. Let\'s fix this...');
        
        // Get all sections
        const sectionsRes = await axios.get('http://localhost:5000/api/sections', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`Found ${sectionsRes.data.length} available sections`);
        
        if (sectionsRes.data.length > 0) {
          const firstSection = sectionsRes.data[0];
          console.log(`\n4. Assigning student to section: ${firstSection.sectionName}`);
          
          try {
            await axios.post('http://localhost:5000/api/sections/assign-student', {
              sectionId: firstSection._id,
              studentId: user._id
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('✅ Student assigned successfully!');
            
            // Try fetching section again
            console.log('\n5. Fetching section again...');
            const newSectionRes = await axios.get(`http://localhost:5000/api/sections/student/${user._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('✅ Section now available!', {
              sectionName: newSectionRes.data.sectionName || newSectionRes.data.name,
              studentCount: newSectionRes.data.students?.length,
              courseCount: newSectionRes.data.courses?.length
            });
            
          } catch (assignError) {
            console.log('❌ Assignment failed:', assignError.response?.data || assignError.message);
          }
        } else {
          console.log('❌ No sections available in the system');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

testWithActualCredentials();