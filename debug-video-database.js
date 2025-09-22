const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

// Video Schema (simplified version for debugging)
const videoSchema = new mongoose.Schema({
  title: String,
  description: String,
  videoUrl: String,
  videoLink: String,
  videoType: String,
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  warned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Course Schema (simplified)
const courseSchema = new mongoose.Schema({
  title: String,
  courseCode: String,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

// User Schema (simplified for teacher data)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  teacherId: String,
  role: String
});

const Video = mongoose.model('Video', videoSchema);
const Course = mongoose.model('Course', courseSchema);
const User = mongoose.model('User', userSchema);

async function debugVideoIssues() {
  await connectDB();
  
  console.log('🔍 DEBUGGING VIDEO DISPLAY ISSUES\n');
  
  try {
    // 1. Check if any videos exist at all
    console.log('1. Checking if videos exist in database...');
    const totalVideos = await Video.countDocuments();
    console.log(`   Total videos in database: ${totalVideos}\n`);
    
    if (totalVideos === 0) {
      console.log('❌ NO VIDEOS FOUND IN DATABASE!');
      console.log('💡 This explains why "video not found" appears everywhere.');
      console.log('💡 You need to upload some videos first.\n');
    } else {
      console.log('2. Listing all videos with their course associations...');
      const allVideos = await Video.find()
        .populate('course', 'title courseCode')
        .populate('teacher', 'name email')
        .lean();
      
      console.log(`   Found ${allVideos.length} videos:`);
      allVideos.forEach((video, index) => {
        console.log(`   ${index + 1}. "${video.title}"`);
        console.log(`      Course: ${video.course ? video.course.title : 'NO COURSE ASSIGNED'} (ID: ${video.course?._id || 'null'})`);
        console.log(`      Teacher: ${video.teacher ? video.teacher.name : 'NO TEACHER'}`);
        console.log(`      Type: ${video.videoType || 'not set'}`);
        console.log(`      URL: ${video.videoUrl ? 'Has URL' : 'No URL'}`);
        console.log(`      Link: ${video.videoLink ? video.videoLink : 'No link'}`);
        console.log(`      Warned: ${video.warned ? 'Yes' : 'No'}`);
        console.log('      ---');
      });
    }
    
    // 3. Check courses
    console.log('\n3. Checking courses in database...');
    const totalCourses = await Course.countDocuments();
    console.log(`   Total courses: ${totalCourses}`);
    
    if (totalCourses > 0) {
      const courses = await Course.find().lean();
      console.log('   Courses:');
      courses.forEach((course, index) => {
        console.log(`   ${index + 1}. "${course.title}" (Code: ${course.courseCode}) - ID: ${course._id}`);
      });
      
      // 4. Test the specific course ID from the error
      const testCourseId = '68cbcc904eb37fd405cae0c2';
      console.log(`\n4. Testing specific course ID: ${testCourseId}`);
      
      const testCourse = await Course.findById(testCourseId);
      if (testCourse) {
        console.log(`   ✅ Course exists: "${testCourse.title}"`);
        
        const videosForCourse = await Video.find({ course: testCourseId })
          .populate('teacher', 'name email')
          .lean();
        
        console.log(`   Videos for this course: ${videosForCourse.length}`);
        if (videosForCourse.length > 0) {
          videosForCourse.forEach((video, index) => {
            console.log(`   ${index + 1}. "${video.title}"`);
            console.log(`      Has videoUrl: ${!!video.videoUrl}`);
            console.log(`      Has videoLink: ${!!video.videoLink}`);
            console.log(`      videoType: ${video.videoType || 'not set'}`);
          });
        } else {
          console.log('   ❌ NO VIDEOS found for this specific course!');
        }
      } else {
        console.log(`   ❌ Course with ID ${testCourseId} does not exist!`);
      }
    }
    
    console.log('\n🎯 DIAGNOSIS COMPLETE');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugVideoIssues();