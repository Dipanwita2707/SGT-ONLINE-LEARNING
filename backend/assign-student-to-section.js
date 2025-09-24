const axios = require('axios');

async function assignStudentToSection() {
  try {
    console.log('🔧 Assigning student S999998 to a section...\n');
    
    // First, let's get all sections (without auth to see if any exist)
    console.log('1. Checking available sections...');
    try {
      const sectionsRes = await axios.get('http://localhost:5000/api/sections');
      console.log(`✅ Found ${sectionsRes.data.length} sections`);
      
      if (sectionsRes.data.length === 0) {
        console.log('❌ No sections available. Creating a test section...');
        
        // Create a test section
        const newSection = await axios.post('http://localhost:5000/api/sections', {
          sectionName: 'Test Section A',
          department: 'Computer Science',
          year: 2024
        });
        console.log('✅ Created test section:', newSection.data.sectionName);
      }
      
      // Get sections again
      const updatedSectionsRes = await axios.get('http://localhost:5000/api/sections');
      const firstSection = updatedSectionsRes.data[0];
      
      console.log(`\n2. Using section: ${firstSection.sectionName} (${firstSection._id})`);
      
      // Now get all students to find S999998
      console.log('\n3. Finding student S999998...');
      const studentsRes = await axios.get('http://localhost:5000/api/admin/students');
      const targetStudent = studentsRes.data.find(s => 
        s.regNo === 'S999998' || 
        s.uid === 'S999998' ||
        s.email?.includes('S999998') ||
        s.name?.toLowerCase().includes('gungun')
      );
      
      if (!targetStudent) {
        console.log('❌ Student S999998 not found. Available students:');
        studentsRes.data.slice(0, 3).forEach(s => {
          console.log(`  - ${s.name} (${s.regNo || s.uid})`);
        });
        return;
      }
      
      console.log(`✅ Found student: ${targetStudent.name} (${targetStudent._id})`);
      
      // Assign student to section
      console.log('\n4. Assigning student to section...');
      try {
        const assignRes = await axios.post('http://localhost:5000/api/sections/assign-student', {
          sectionId: firstSection._id,
          studentId: targetStudent._id
        });
        console.log('✅ Student assigned successfully!');
        
        // Verify the assignment
        console.log('\n5. Verifying assignment...');
        const verifyRes = await axios.get(`http://localhost:5000/api/sections/student/${targetStudent._id}`);
        console.log('✅ Assignment verified! Student section:', {
          sectionName: verifyRes.data.sectionName,
          studentCount: verifyRes.data.students?.length,
          courseCount: verifyRes.data.courses?.length
        });
        
        console.log('\n🎉 Student S999998 is now assigned to a section! Try refreshing the frontend.');
        
      } catch (assignError) {
        console.log('❌ Assignment failed:', {
          status: assignError.response?.status,
          message: assignError.response?.data?.message || assignError.message
        });
      }
      
    } catch (sectionsError) {
      console.log('❌ Cannot access sections:', {
        status: sectionsError.response?.status,
        message: sectionsError.response?.data?.message || sectionsError.message
      });
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

assignStudentToSection();