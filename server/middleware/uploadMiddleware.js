import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');

export const uploadDirs = {
  videos: path.join(UPLOAD_ROOT, 'videos'),
  materials: path.join(UPLOAD_ROOT, 'materials'),
  profile: path.join(UPLOAD_ROOT, 'profile'),
  thumbnails: path.join(UPLOAD_ROOT, 'thumbnails'),
};

// Multer does not create directories when `destination` is a function
Object.values(uploadDirs).forEach((dir) => fs.mkdirSync(dir, { recursive: true }));

// Random, unguessable file names; only the (validated) extension is kept
const storageFor = (dir, prefix) =>
  multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      cb(
        null,
        `${prefix}-${crypto.randomBytes(16).toString('hex')}${path.extname(file.originalname).toLowerCase()}`
      );
    },
  });

// Check File Type against an allow-list of extensions and mime types
const checkFileType = (file, cb, extensions, mimetypes) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');

  if (extensions.includes(ext) && mimetypes.test(file.mimetype)) {
    return cb(null, true);
  }
  const error = new Error('Invalid file type');
  error.statusCode = 400;
  cb(error);
};

// Video Upload Middleware
export const uploadVideo = multer({
  storage: storageFor(uploadDirs.videos, 'video'),
  limits: { fileSize: 100000000 }, // 100MB
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb, ['mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'webm'], /^video\//);
  },
}).single('video');

// Course Material Upload Middleware
export const uploadMaterial = multer({
  storage: storageFor(uploadDirs.materials, 'material'),
  limits: { fileSize: 50000000 }, // 50MB
  fileFilter: (req, file, cb) => {
    checkFileType(
      file,
      cb,
      ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'rar'],
      /^application\/(pdf|msword|zip|x-zip-compressed|vnd\.rar|x-rar-compressed|octet-stream|vnd\.ms-|vnd\.openxmlformats-officedocument\.)/
    );
  },
}).single('material');

// Profile Picture Upload Middleware
export const uploadProfilePic = multer({
  storage: storageFor(uploadDirs.profile, 'profile'),
  limits: { fileSize: 5000000 }, // 5MB
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb, ['jpeg', 'jpg', 'png', 'gif'], /^image\/(jpeg|png|gif)$/);
  },
}).single('profilePic');

// Course Thumbnail Upload Middleware
export const uploadThumbnail = multer({
  storage: storageFor(uploadDirs.thumbnails, 'thumbnail'),
  limits: { fileSize: 5000000 }, // 5MB
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb, ['jpeg', 'jpg', 'png'], /^image\/(jpeg|png)$/);
  },
}).single('thumbnail');

// Remove an uploaded file that was not kept (e.g. the request was rejected)
export const removeUploadedFile = (file) => {
  if (file?.path) {
    fs.promises.unlink(file.path).catch(() => {});
  }
};

// Delete a previously stored file by name, staying inside its directory
export const removeStoredFile = (dir, filename) => {
  if (!filename || filename.startsWith('default-')) return;
  fs.promises.unlink(path.join(dir, path.basename(filename))).catch(() => {});
};
