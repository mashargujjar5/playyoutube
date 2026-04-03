import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure temp directory exists
const tempDir = './public/temp';
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir); // Temporary storage directory
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to allow only certain types (e.g., videos and images)
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'video/avi', 'video/mkv', 'video/mov'];
  const allowedExts = ['.jpeg', '.jpg', '.png', '.mp4', '.avi', '.mkv', '.mov'];

  const extname = allowedExts.includes(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimes.includes(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type!'), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit per file
  fileFilter: fileFilter
});

// Export for multiple files (e.g., avatar and coverimage)
export const uploadFiles = upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'coverimage', maxCount: 1 }
]);

// Export for single file upload (e.g., product image)
export const uploadSingle = upload.single('image');

// For multiple files of same type
export const uploadArray = upload.array('files', 10); // Up to 10 files

export default upload;