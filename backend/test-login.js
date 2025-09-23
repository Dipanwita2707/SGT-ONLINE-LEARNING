const axios = require('axios');

const testLogin = async () => {
  const baseURL = 'http://localhost:5000';
  
  console.log('Testing login with Email and UID functionality...\n');
  
  // Test 1: Login with email
  try {
    console.log('Test 1: Attempting login with email...');
    const emailResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'sourav11092002@gmail.com', // Admin email from server logs
      password: 'admin123' // Assuming default password
    });
    
    if (emailResponse.data.token) {
      console.log('✅ Email login successful');
      console.log(`   User: ${emailResponse.data.user.name}`);
      console.log(`   Role: ${emailResponse.data.user.role}`);
      console.log(`   Email: ${emailResponse.data.user.email}`);
    }
  } catch (error) {
    console.log('❌ Email login failed:', error.response?.data?.message || error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Login with UID (we'll need to get a UID from the database first)
  try {
    console.log('Test 2: Attempting login with UID...');
    // For this test, we'll try with a common teacher ID or student ID format
    const uidResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'TCHR001', // Common teacher ID format
      password: 'password123'
    });
    
    if (uidResponse.data.token) {
      console.log('✅ UID login successful');
      console.log(`   User: ${uidResponse.data.user.name}`);
      console.log(`   Role: ${uidResponse.data.user.role}`);
      console.log(`   UID: ${uidResponse.data.user.teacherId || uidResponse.data.user.regNo || uidResponse.data.user.studentId}`);
    }
  } catch (error) {
    console.log('❌ UID login failed:', error.response?.data?.message || error.message);
    console.log('   This is expected if no user with UID "TCHR001" exists');
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 3: Invalid credentials
  try {
    console.log('Test 3: Testing invalid credentials...');
    const invalidResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    });
  } catch (error) {
    console.log('✅ Invalid credentials properly rejected:', error.response?.data?.message || error.message);
  }
  
  console.log('\nLogin testing completed!');
};

// Run the test
testLogin().catch(console.error);