import multer from "multer";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

// Read environment variable with fallback
const MEDIA_STORAGE_PATH = process.env.MEDIA_STORAGE_PATH || path.join(process.cwd(), 'media_uploads');

// Debug log to verify
console.log('📁 Media Storage Path:', MEDIA_STORAGE_PATH);

// Ensure base directory exists on startup
if (!fs.existsSync(MEDIA_STORAGE_PATH)) {
  console.log('Creating base media directory:', MEDIA_STORAGE_PATH);
  fs.mkdirSync(MEDIA_STORAGE_PATH, { recursive: true });
}

/* ================================
   MULTER STORAGE CONFIG
================================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const userId = req.user?.id || req.body.userId;

      if (!userId) {
        return cb(new Error("User ID not found"), null);
      }

      // Use the configured path
      const uploadDir = path.join(MEDIA_STORAGE_PATH, "posts", userId.toString());

      console.log('📂 Upload directory:', uploadDir);

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      cb(null, uploadDir);
    } catch (error) {
      console.error('❌ Directory creation error:', error);
      cb(error, null);
    }
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

/* ================================
   MULTER INSTANCE
================================ */
const uploadPostMedia = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/mpeg",
      "video/quicktime",
      "video/webm",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, MPEG, MOV, WebM) are allowed"
        ),
        false
      );
    }
  },
});

/* ================================
   CONTROLLER
================================ */
const uploadPostMediaController = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!postId || isNaN(postId)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Store relative URL path
    const fileUrl = `/media/posts/${userId}/${req.file.filename}`;

    const mediaType = req.file.mimetype.startsWith("image") ? "image" : "video";

    const media = await prisma.post_media.create({
      data: {
        post_id: Number(postId),
        media_url: fileUrl,
        media_type: mediaType,
      },
    });

    return res.status(201).json({
      success: true,
      media: {
        ...media,
        media_url: `${process.env.API_BASE_URL}${fileUrl}`,
      },
    });
  } catch (error) {
    console.error("Media upload error:", error);
    return res.status(500).json({
      message: "Media upload failed",
      error: error.message,
    });
  }
};

/* ================================
   DELETE MEDIA HELPER
================================ */
const deleteMediaFile = async (mediaUrl) => {
  try {
    const relativePath = mediaUrl.replace("/media/", "");
    const filePath = path.join(MEDIA_STORAGE_PATH, relativePath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Delete media file error:", error);
    return false;
  }
};

export { uploadPostMedia, uploadPostMediaController, deleteMediaFile, MEDIA_STORAGE_PATH };
