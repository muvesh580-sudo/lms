import dotenv from 'dotenv';

dotenv.config();

// Fail fast instead of signing tokens with an undefined secret
const missing = ['MONGO_URI', 'JWT_SECRET'].filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const { default: connectDB } = await import('./config/db.js');
const { default: app } = await import('./app.js');

// Connect to MongoDB
await connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
