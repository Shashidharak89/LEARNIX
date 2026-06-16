import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
  try {
    await mongoose.connection.collection('dailyquizzes').dropIndex('dateStr_1');
    console.log("Successfully dropped dateStr_1 index");
  } catch (e) {
    console.log("Index drop failed or index didn't exist:", e.message);
  }
  
  try {
    await mongoose.connection.collection('dailyquizenrollments').dropIndex('userId_1_dateStr_1');
    console.log("Successfully dropped userId_1_dateStr_1 index from enrollments");
  } catch (e) {
    console.log("Index drop failed or index didn't exist:", e.message);
  }
  
  process.exit(0);
}
run();
