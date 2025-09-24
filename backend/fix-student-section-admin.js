const axios = require('axios');

async function fixStudentSectionWithAdmin() {
  try {
    console.log('🔑 Logging in as admin to fix student section assignment...\n');
    
    // Try different admin credentials
    const adminCredentials = [
      { email: 'sourav11092002@gmail.com', password: 'Admin@1234' },
      { email: 'admin@gmail.com', password: 'admin123' },
      { email: 'admin@sgt.com', password: 'admin123' }
    ];
    
    let adminToken = null;
    let adminUser = null;
    
    for (const creds of adminCredentials) {
      try {
        console.log(`Trying admin login: ${creds.email}`);
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', creds);
        adminToken = loginRes.data.token;
        adminUser = loginRes.data.user;
        console.log(`✅ Admin login successful: ${adminUser.name}`);
        break;
      } catch (loginError) {
        console.log(`❌ Failed: ${loginError.response?.data?.message || loginError.message}`);
      }
    }
    
    if (!adminToken) {
      console.log('❌ Could not login as admin with any credentials');
      return;
    }
    
    // Get all students
    console.log('\n2. Getting all students...');
    const studentsRes = await axios.get('http://localhost:5000/api/admin/students', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const targetStudent = studentsRes.data.find(s => 
      s.regNo === 'S999998' || 
      s.uid === 'S999998' ||
      s.email?.includes('S999998') ||
      s.name?.toLowerCase().includes('gungun')
    );
    
    if (!targetStudent) {
      console.log('❌ Student S999998/Gungun not found');
      console.log('Available students:', studentsRes.data.slice(0, 3).map(s => ({
        name: s.name,
        regNo: s.regNo,
        uid: s.uid
      })));
      return;
    }
    
    console.log(`✅ Found student: ${targetStudent.name} (${targetStudent._id})`);
    
    // Get all sections
    console.log('\n3. Getting sections...');
    const sectionsRes = await axios.get('http://localhost:5000/api/sections', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log(`Found ${sectionsRes.data.length} sections`);
    
    if (sectionsRes.data.length === 0) {
      console.log('Creating a test section...');
      const newSectionRes = await axios.post('http://localhost:5000/api/sections', {
        sectionName: 'Test Section A',
        department: 'Computer Science',
        year: 2024
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Created section:', newSectionRes.data.sectionName);
      sectionsRes.data.push(newSectionRes.data);
    }
    
    const firstSection = sectionsRes.data[0];
    console.log(`Using section: ${firstSection.sectionName}`);
    
    // Check if student is already assigned
    console.log('\n4. Checking current assignment...');
    try {
      const currentSectionRes = await axios.get(`http://localhost:5000/api/sections/student/${targetStudent._id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Student already assigned to:', currentSectionRes.data.sectionName);
      console.log('🎉 Student section is working! The frontend should load now.');
      return;
    } catch (checkError) {
      console.log('Student not assigned to any section, proceeding with assignment...');
    }
    
    // Assign student to section
    console.log('\n5. Assigning student to section...');
    const assignRes = await axios.post('http://localhost:5000/api/sections/assign-student', {
      sectionId: firstSection._id,
      studentId: targetStudent._id
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Assignment successful!');
    
    // Verify
    const verifyRes = await axios.get(`http://localhost:5000/api/sections/student/${targetStudent._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Verification successful!', {
      sectionName: verifyRes.data.sectionName,
      students: verifyRes.data.students?.length,
      courses: verifyRes.data.courses?.length
    });
    
    console.log('\n🎉 SUCCESS! Student S999998 is now assigned to a section.');
    console.log('📱 Please refresh the frontend page to see the section information.');
    
  } catch (error) {
    console.error('❌ Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

fixStudentSectionWithAdmin();