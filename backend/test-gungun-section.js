// Test script to check authentication and student section
const axios = require('axios');

async function testAuth() {
  try {
    console.log('Testing student authentication and section access...\n');
    
    // Check if we can access the students endpoint without auth
    try {
      const response = await axios.get('http://localhost:5000/api/admin/students');
      console.log(`✅ Found ${response.data.length} students (no auth required)`);
      
      // Find a student named Gungun or similar
      const gungunStudent = response.data.find(s => 
        s.name?.toLowerCase().includes('gungun') || 
        s.email?.toLowerCase().includes('gungun')
      );
      
      if (gungunStudent) {
        console.log(`\n🎯 Found Gungun: ${gungunStudent.name} (${gungunStudent._id})`);
        
        // Try to get their section
        try {
          const sectionResponse = await axios.get(`http://localhost:5000/api/sections/student/${gungunStudent._id}`);
          console.log('✅ Section found:', sectionResponse.data.sectionName);
        } catch (sectionError) {
          console.log('❌ No section assigned to Gungun');
          console.log('Error:', sectionError.response?.data?.message || sectionError.message);
          
          // Let's check all sections and assign Gungun to the first one
          const sectionsResponse = await axios.get('http://localhost:5000/api/sections');
          if (sectionsResponse.data.length > 0) {
            const firstSection = sectionsResponse.data[0];
            console.log(`\n🔧 Assigning Gungun to section: ${firstSection.sectionName}`);
            
            try {
              await axios.post('http://localhost:5000/api/sections/assign-student', {
                sectionId: firstSection._id,
                studentId: gungunStudent._id
              });
              console.log('✅ Successfully assigned Gungun to section!');
            } catch (assignError) {
              console.log('❌ Assignment failed:', assignError.response?.data?.message);
            }
          }
        }
      } else {
        console.log('❌ Could not find student "Gungun"');
        console.log('Available students:', response.data.map(s => s.name).slice(0, 5));
      }
      
    } catch (error) {
      console.log('❌ Error accessing students:', error.message);
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testAuth();