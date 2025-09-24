const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function debugStudentSection() {
  try {
    console.log('🔍 Debugging Student Section Loading Issue...\n');
    
    // First, let's check if there are any students
    console.log('1. Checking all students...');
    const studentsResponse = await axios.get(`${BASE_URL}/api/admin/students`);
    const students = studentsResponse.data;
    console.log(`Found ${students.length} students`);
    
    if (students.length === 0) {
      console.log('❌ No students found in database');
      return;
    }
    
    // Let's check the first student
    const testStudent = students[0];
    console.log(`\n2. Testing with student: ${testStudent.name} (ID: ${testStudent._id})`);
    
    // Try to get their section
    console.log(`\n3. Checking section for student ${testStudent._id}...`);
    try {
      const sectionResponse = await axios.get(`${BASE_URL}/api/sections/student/${testStudent._id}`);
      console.log('✅ Section found:', {
        sectionName: sectionResponse.data.sectionName,
        courses: sectionResponse.data.courses?.length || 0,
        students: sectionResponse.data.students?.length || 0
      });
    } catch (sectionError) {
      console.log('❌ Section error:', sectionError.response?.data || sectionError.message);
      
      // Check if there are any sections at all
      console.log('\n4. Checking all sections...');
      const sectionsResponse = await axios.get(`${BASE_URL}/api/sections`);
      console.log(`Found ${sectionsResponse.data.length} sections`);
      
      if (sectionsResponse.data.length > 0) {
        console.log('\n5. Assigning student to first section...');
        const firstSection = sectionsResponse.data[0];
        try {
          await axios.post(`${BASE_URL}/api/sections/assign-student`, {
            sectionId: firstSection._id,
            studentId: testStudent._id
          });
          console.log('✅ Student assigned to section successfully');
          
          // Try getting section again
          const newSectionResponse = await axios.get(`${BASE_URL}/api/sections/student/${testStudent._id}`);
          console.log('✅ Section now found:', {
            sectionName: newSectionResponse.data.sectionName,
            courses: newSectionResponse.data.courses?.length || 0,
            students: newSectionResponse.data.students?.length || 0
          });
        } catch (assignError) {
          console.log('❌ Assignment error:', assignError.response?.data || assignError.message);
        }
      }
    }
    
  } catch (error) {
    console.error('Debug error:', error.response?.data || error.message);
  }
}

debugStudentSection();