const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const UPLOAD_DIR = process.env.UPLOAD_PATH_PROFILE;

if (!UPLOAD_DIR) {
  console.error("❌ UPLOAD_PATH is not defined in .env");
  process.exit(1);
}

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log("✅ Created upload directory:", UPLOAD_DIR);
}

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "-" + cleanName);
  },
});

const upload_profile = multer({ storage });

// ==========================
// 📦 Controller Function
// ==========================
const uploadProfilePicture = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // 🔹 Find student
    const student = await prisma.student.findUnique({
      where: { id: parseInt(studentId) },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // 🔹 Update student with new file
    const filename = req.file.filename;
    const fileUrl = `${process.env.API_BASE_URL}/uploads/${filename}`;

    await prisma.student.update({
      where: { id: parseInt(studentId) },
      data: { profilePicture: fileUrl }, // ✅ store HTTP URL, not local path
    });

    res.status(200).json({
      success: true,
      message: "Profile picture uploaded successfully",
      data: {
        filename,
        url: fileUrl,
      },
    });
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({ message: "File upload failed" });
  }
};

module.exports = {
  uploadProfilePicture,
  upload_profile,
};
