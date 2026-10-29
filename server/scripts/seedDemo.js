// Insert demo users, courses and lectures for local demos. Non-destructive:
// existing users/courses with the same email/title are left untouched.
//
// Usage: npm run seed:demo   (uses MONGO_URI from server/.env or the shell)
// Demo logins (all share DEMO_PASSWORD, default "demo1234"):
//   instructor@demo.test, student@demo.test
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import User from '../models/userModel.js';
import Course from '../models/courseModel.js';
import Lecture from '../models/lectureModel.js';
import { uploadDirs } from '../middleware/uploadMiddleware.js';

dotenv.config();

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed demo accounts in production');
  process.exit(1);
}

const password = process.env.DEMO_PASSWORD || 'demo1234';

await mongoose.connect(process.env.MONGO_URI);

const ensureUser = async (name, email, role) =>
  (await User.findOne({ email })) || User.create({ name, email, password, role });

const instructor = await ensureUser('Demo Instructor', 'instructor@demo.test', 'instructor');
await ensureUser('Demo Student', 'student@demo.test', 'student');

// Placeholder "video" so lecture records point at a real file (it is not a playable video)
const demoVideo = 'video-demo-placeholder.mp4';
const demoVideoPath = path.join(uploadDirs.videos, demoVideo);
if (!fs.existsSync(demoVideoPath)) fs.writeFileSync(demoVideoPath, 'demo');

const courses = [
  {
    title: 'JavaScript Fundamentals',
    description: 'Variables, functions, arrays and the DOM - a free starter course.',
    price: 0,
    category: 'Web Development',
    level: 'Beginner',
    duration: '3 weeks',
  },
  {
    title: 'Full-Stack MERN Bootcamp',
    description: 'Build and deploy a complete MongoDB, Express, React and Node application.',
    price: 1499,
    category: 'Web Development',
    level: 'Intermediate',
    duration: '8 weeks',
  },
];

for (const data of courses) {
  if (await Course.findOne({ title: data.title })) continue;

  const course = await Course.create({ ...data, instructor: instructor._id, published: true });
  await Lecture.create([
    { title: 'Welcome & overview', description: 'What you will learn.', duration: 5, order: 1, isPreview: true },
    { title: 'Core concepts', description: 'The main lesson.', duration: 25, order: 2, isPreview: false },
  ].map((lecture) => ({ ...lecture, course: course._id, videoUrl: demoVideo })));
  console.log(`Created course "${data.title}"`);
}

console.log('Demo data ready');
await mongoose.disconnect();
