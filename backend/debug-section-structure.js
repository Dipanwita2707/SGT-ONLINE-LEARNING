const axios = require('axios');

async function debugSectionStructure() {
  try {
    console.log('🔍 Debugging section data structure...\n');
    
    // Login as admin
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'sourav11092002@gmail.com',
      password: 'Admin@1234'
    });
    
    const adminToken = loginRes.data.token;
    console.log('✅ Admin logged in');
    
    // Get student Gungun
    const studentsRes = await axios.get('http://localhost:5000/api/admin/students', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const gungun = studentsRes.data.find(s => s.name?.toLowerCase().includes('gungun'));
    console.log('Student found:', {
      name: gungun.name,
      id: gungun._id
    });
    
    // Get their section with full data
    const sectionRes = await axios.get(`http://localhost:5000/api/sections/student/${gungun._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('\n📋 Full section data structure:');
    console.log(JSON.stringify(sectionRes.data, null, 2));
    
    console.log('\n🔑 Key fields:');
    console.log('- sectionName:', sectionRes.data.sectionName);
    console.log('- name:', sectionRes.data.name);
    console.log('- _id:', sectionRes.data._id);
    console.log('- students count:', sectionRes.data.students?.length);
    console.log('- courses count:', sectionRes.data.courses?.length);
    console.log('- teacher:', sectionRes.data.teacher?.name);
    
  } catch (error) {
    console.error('❌ Debug error:', error.response?.data || error.message);
  }
}

debugSectionStructure();