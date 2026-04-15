import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set Storage Engine for Videos
const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/videos'));
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// Set Storage Engine for Course Materials
const materialStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/materials'));
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// Check File Type
const checkFileType = (file, cb, filetypes) => {
  // Allowed extensions
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Allowed mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Invalid file type!'));
  }
};

// Video Upload Middleware
export const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 100000000 }, // 100MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb, /mp4|mov|avi|wmv|flv|mkv/);
  },
}).single('video');

// Course Material Upload Middleware
export const uploadMaterial = multer({
  storage: materialStorage,
  limits: { fileSize: 50000000 }, // 50MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb, /pdf|doc|docx|ppt|pptx|xls|xlsx|zip|rar/);
  },
}).single('material');

// Profile Picture Upload Middleware
export const uploadProfilePic = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../uploads/profile'));
    },
    filename: function (req, file, cb) {
      cb(
        null,
        `profile-${req.user._id}${path.extname(file.originalname)}`
      );
    },
  }),
  limits: { fileSize: 5000000 }, // 5MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb, /jpeg|jpg|png|gif/);
  },
}).single('profilePic');

// Course Thumbnail Upload Middleware
export const uploadThumbnail = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../uploads/thumbnails'));
    },
    filename: function (req, file, cb) {
      cb(
        null,
        `thumbnail-${Date.now()}${path.extname(file.originalname)}`
      );
    },
  }),
  limits: { fileSize: 5000000 }, // 5MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb, /jpeg|jpg|png/);
  },
}).single('thumbnail');