// const fs = require("fs");
// const path = require("path");
// const multer = require("multer");
// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();

// const UPLOAD_DIR = process.env.UPLOAD_PATH_CERTIFICATE;

// // Check upload directory
// if (!UPLOAD_DIR) {
//   console.error("❌ UPLOAD_PATH is not defined in .env");
//   process.exit(1);
// }

// if (!fs.existsSync(UPLOAD_DIR)) {
//   fs.mkdirSync(UPLOAD_DIR, { recursive: true });
//   console.log("✅ Created upload directory:", UPLOAD_DIR);
// }

// // Multer configuration
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, UPLOAD_DIR);
//   },
//   filename: (req, file, cb) => {
//     const cleanName = file.originalname.replace(/\s+/g, "_");
//     cb(null, Date.now() + "-" + cleanName);
//   },
// });

// const upload_certificate = multer({ storage });

// // ==========================
// // 📦 Controller Function
// // ==========================
// const uploadCoverPicture = async (req, res) => {
//   try {
//     const { studentId } = req.body;

//     if (!studentId) {
//       return res.status(400).json({ message: "Student ID is required" });
//     }

//     if (!req.file) {
//       return res.status(400).json({ message: "No file uploaded" });
//     }

//     // 🔹 Find student
//     const student = await prisma.student.findUnique({
//       where: { id: parseInt(studentId) },
//     });

//     if (!student) {
//       return res.status(404).json({
//         success: false,
//         message: "Student not found",
//       });
//     }

//     // 🔹 Update student with new file
//     const filename = req.file.filename;
//     const filePath = path.join(UPLOAD_DIR, filename);

//     await prisma.student_certifications.update({
//       where: { studentId: parseInt(studentId) },
//       data: { credential_url: filename },
//     });

//     res.status(200).json({
//       success: true,
//       message: "Cover picture uploaded and updated successfully",
//       data: {
//         filename,
//         fullPath: filePath,
//         url: `${process.env.API_BASE_URL}/uploads/cover/${filename}`,
//       },
//     });
//   } catch (error) {
//     console.error("File upload error:", error);
//     res.status(500).json({ message: "File upload failed" });
//   }
// };

// module.exports = {
//   uploadCoverPicture,
//   upload_certificate,
// };
