// Insert demo users, courses and lectures for local demos. Non-destructive:
// existing users/courses with the same email/title are left untouched.
//
// Usage: npm run seed:demo   (uses MONGO_URI from server/.env or the shell)
// Demo logins (all share DEMO_PASSWORD, default "demo1234"):
//   instructor@demo.test, student@demo.test
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/userModel.js';
import Course from '../models/courseModel.js';
import Lecture from '../models/lectureModel.js';

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

// Public-domain (CC0) sample clip, so demo lectures play on any host without uploads
const demoVideo = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

// Repair lectures from earlier seeds that pointed at a local placeholder file
await Lecture.updateMany({ videoUrl: 'video-demo-placeholder.mp4' }, { videoUrl: demoVideo });

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
