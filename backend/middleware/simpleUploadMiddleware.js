import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Use environment variable or default to /var/www/scaips_uploads
const uploadDir = process.env.PUBLIC_UPLOAD_DIR || 
                  path.join(__dirname, "..", "uploads");

// ✅ Correct base URL with /api/uploads
const baseUrl = process.env.PUBLIC_UPLOAD_URL || 
                (process.env.API_BASE_URL ? 
                  `${process.env.API_BASE_URL}/api/uploads` : 
                  "http://localhost:5000/api/uploads");

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 Created uploads directory at:", uploadDir);
}

console.log("📁 Upload Directory:", uploadDir);
console.log("🌐 Upload Base URL:", baseUrl);

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = file.originalname.replace(ext, "").replace(/[^a-zA-Z0-9]/g, "_");
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG are allowed."
      )
    );
  }
};

// Create multer upload instance
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// ✅ Helper function to generate file URL (FIXED)
export const getFileUrl = (filename) => {
  return `${baseUrl}/${filename}`;
};

// Helper to delete file
export const deleteFile = (filename) => {
  try {
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("🗑️ Deleted file:", filename);
      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ Error deleting file:", error);
    return false;
  }
};

// Export upload directory for static serving
export const UPLOAD_DIR = uploadDir;
export const UPLOAD_URL = baseUrl;
