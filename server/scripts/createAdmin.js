// Create (or promote) an admin account. There is no way to become an admin
// through the API, so the first one has to be bootstrapped from the server.
//
// Usage: set ADMIN_EMAIL and ADMIN_PASSWORD (and optionally ADMIN_NAME) in
// server/.env or the shell, then run `npm run create-admin`.
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/userModel.js';

dotenv.config();

const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'Admin' } = process.env;

if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD must be set');
  process.exit(1);
}

await mongoose.connect(MONGO_URI);

const email = ADMIN_EMAIL.trim().toLowerCase();
const existing = await User.findOne({ email });

if (existing) {
  existing.role = 'admin';
  await existing.save();
  console.log(`Promoted existing user ${email} to admin (password unchanged)`);
} else {
  await User.create({ name: ADMIN_NAME, email, password: ADMIN_PASSWORD, role: 'admin' });
  console.log(`Created admin user ${email}`);
}

await mongoose.disconnect();
