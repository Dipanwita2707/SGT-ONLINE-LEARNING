const axios = require('axios');

async function findStudentCredentials() {
  try {
    console.log('🔍 Finding the correct student credentials...\n');
    
    // Get all students to see the structure
    const studentsRes = await axios.get('http://localhost:5000/api/admin/students');
    console.log(`Found ${studentsRes.data.length} students\n`);
    
    // Look for S999998 or similar
    const targetStudent = studentsRes.data.find(s => 
      s.regNo === 'S999998' || 
      s.uid === 'S999998' || 
      s.email?.includes('S999998') ||
      s.name?.toLowerCase().includes('gungun')
    );
    
    if (targetStudent) {
      console.log('🎯 Found target student:', {
        _id: targetStudent._id,
        name: targetStudent.name,
        email: targetStudent.email,
        regNo: targetStudent.regNo,
        uid: targetStudent.uid,
        role: targetStudent.role
      });
      
      // Try logging in with email if available
      if (targetStudent.email) {
        console.log('\n🔐 Trying login with email...');
        try {
          const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: targetStudent.email,
            password: '123456'
          });
          console.log('✅ Login successful with email!');
          return { token: loginRes.data.token, user: loginRes.data.user };
        } catch (emailError) {
          console.log('❌ Email login failed:', emailError.response?.data?.message);
        }
      }
      
      // Try with regNo
      if (targetStudent.regNo) {
        console.log('\n🔐 Trying login with regNo...');
        try {
          const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            regNo: targetStudent.regNo,
            password: '123456'
          });
          console.log('✅ Login successful with regNo!');
          return { token: loginRes.data.token, user: loginRes.data.user };
        } catch (regError) {
          console.log('❌ RegNo login failed:', regError.response?.data?.message);
        }
      }
      
      // Try with uid
      if (targetStudent.uid) {
        console.log('\n🔐 Trying login with uid...');
        try {
          const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            uid: targetStudent.uid,
            password: '123456'
          });
          console.log('✅ Login successful with uid!');
          return { token: loginRes.data.token, user: loginRes.data.user };
        } catch (uidError) {
          console.log('❌ UID login failed:', uidError.response?.data?.message);
        }
      }
      
    } else {
      console.log('❌ Could not find student S999998');
      console.log('Available students:', studentsRes.data.slice(0, 3).map(s => ({
        name: s.name,
        regNo: s.regNo,
        email: s.email,
        uid: s.uid
      })));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findStudentCredentials();