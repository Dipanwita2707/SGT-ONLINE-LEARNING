const axios = require('axios');

async function testBackendConnection() {
  try {
    console.log('🌐 Testing backend connection...\n');
    
    // Test basic connectivity
    try {
      const healthRes = await axios.get('http://localhost:5000/api/health');
      console.log('✅ Health check:', healthRes.data);
    } catch (healthError) {
      console.log('❌ No health endpoint, trying root...');
      try {
        const rootRes = await axios.get('http://localhost:5000/');
        console.log('✅ Root endpoint working');
      } catch (rootError) {
        console.log('❌ Backend might be down:', rootError.message);
        return;
      }
    }
    
    // Test sections endpoint without auth
    console.log('\n📋 Testing sections endpoint...');
    try {
      const sectionsRes = await axios.get('http://localhost:5000/api/sections');
      console.log(`✅ Found ${sectionsRes.data.length} sections`);
      if (sectionsRes.data.length > 0) {
        console.log('First section:', {
          name: sectionsRes.data[0].sectionName,
          id: sectionsRes.data[0]._id,
          studentCount: sectionsRes.data[0].students?.length || 0
        });
      }
    } catch (sectionsError) {
      console.log('❌ Sections endpoint error:', {
        status: sectionsError.response?.status,
        message: sectionsError.response?.data?.message || sectionsError.message
      });
    }
    
    console.log('\n🔍 Backend is running. The issue might be with authentication or student assignment.');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

testBackendConnection();