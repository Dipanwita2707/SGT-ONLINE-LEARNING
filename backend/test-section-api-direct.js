const axios = require('axios');

async function testStudentSectionAPI() {
  try {
    console.log('🧪 Testing Student Section API directly...\n');
    
    // First get all students
    console.log('1. Getting all students...');
    const studentsRes = await axios.get('http://localhost:5000/api/admin/students');
    console.log(`Found ${studentsRes.data.length} students`);
    
    if (studentsRes.data.length > 0) {
      const testStudent = studentsRes.data[0];
      console.log(`\n2. Testing with: ${testStudent.name} (${testStudent._id})`);
      
      // Try the student section endpoint
      console.log('\n3. Calling student section API...');
      try {
        const sectionRes = await axios.get(`http://localhost:5000/api/sections/student/${testStudent._id}`);
        console.log('✅ Success! Section data:', {
          sectionName: sectionRes.data.sectionName || sectionRes.data.name,
          hasStudents: !!sectionRes.data.students,
          studentCount: sectionRes.data.students?.length || 0,
          hasCourses: !!sectionRes.data.courses,
          courseCount: sectionRes.data.courses?.length || 0
        });
      } catch (sectionError) {
        console.log('❌ Section API failed:', {
          status: sectionError.response?.status,
          message: sectionError.response?.data?.message || sectionError.message,
          data: sectionError.response?.data
        });
        
        // If 404, let's try to assign the student to a section
        if (sectionError.response?.status === 404) {
          console.log('\n4. Student not in any section. Checking available sections...');
          try {
            const sectionsRes = await axios.get('http://localhost:5000/api/sections');
            console.log(`Found ${sectionsRes.data.length} sections`);
            
            if (sectionsRes.data.length > 0) {
              const firstSection = sectionsRes.data[0];
              console.log(`\n5. Assigning student to section: ${firstSection.sectionName}`);
              
              const assignRes = await axios.post('http://localhost:5000/api/sections/assign-student', {
                sectionId: firstSection._id,
                studentId: testStudent._id
              });
              console.log('✅ Assignment successful!');
              
              // Try getting section again
              console.log('\n6. Trying section API again...');
              const newSectionRes = await axios.get(`http://localhost:5000/api/sections/student/${testStudent._id}`);
              console.log('✅ Now working! Section:', newSectionRes.data.sectionName);
            } else {
              console.log('❌ No sections available to assign to');
            }
          } catch (assignError) {
            console.log('❌ Assignment error:', assignError.response?.data || assignError.message);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testStudentSectionAPI();