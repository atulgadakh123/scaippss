import express from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { loginAdmin, registerAdmin } from "../controllers/adminController.js";

const router = express.Router();
const prisma = new PrismaClient();

// Login admin
router.post("/login", loginAdmin);
router.post("/register", registerAdmin);

// GET /api/admin/profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const adminId = req.user.id; // <-- use req.user.id from middleware
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    res.json(admin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/admin/profile
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const adminId = req.user.id;
    const { name, email, role } = req.body;

    const updatedAdmin = await prisma.admin.update({
      where: { id: adminId },
      data: { name, email, role },
      select: { id: true, name: true, email: true,  role: true, updatedAt: true },
    });

    res.json(updatedAdmin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// PUT /api/admin/change-password
router.put("/change-password", authMiddleware, async (req, res) => {
  try {
    const adminId = req.user.id; // <-- fixed
    const { oldPassword, newPassword } = req.body;

    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch)
      return res.status(400).json({ message: "Old password incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({
      where: { id: adminId },
      data: { password: hashedPassword },
    });

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// router.get("/students", authMiddleware, async (req, res) => {
//   try {
//     const students = await prisma.student.findMany({
//       select: {
//         id: true,
//         firstName: true,
//         lastName: true,
//         email: true,
//         collegeName: true,
//         interestedField: true,
//         isActive: true,
//         profilePicture:true,
//       },
//       orderBy: { createdAt: "desc" },
//     });
//     res.json(students);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });
// router.get("/students/:id", authMiddleware, async (req, res) => {
//   try {
//     const studentId = parseInt(req.params.id);
//     const student = await prisma.student.findUnique({
//       where: { id: studentId },
//     });
//     if (!student) return res.status(404).json({ message: "Student not found" });

//     res.json(student);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

router.get("/dashboard-counts", authMiddleware, async (req, res) => {
  try {
    const usersCount = await prisma.student.count();
    const adminsCount = await prisma.admin.count();

    res.json({
      users: usersCount,
      notify: "∞",
      admins: adminsCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const adminId = req.user.id; // set by authMiddleware
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!admin) return res.status(404).json({ message: "User not found" });

    res.json(admin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;


/// student

router.get("/students", authMiddleware, async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        collegeName: true,
        contactNo: true,    // ✅ Added
        isActive: true,
        profilePicture: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ====================== GET SINGLE STUDENT ======================
router.get("/students/:id", authMiddleware, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ====================== DELETE STUDENT ======================
router.delete("/students/:id", authMiddleware, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);

    const existing = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!existing)
      return res.status(404).json({ message: "Student not found" });

    await prisma.student.delete({
      where: { id: studentId },
    });

    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ====================== UPDATE STUDENT ======================
router.put("/students/:id", authMiddleware, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);

    const existing = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!existing)
      return res.status(404).json({ message: "Student not found" });

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        collegeName: req.body.collegeName,
        contactNo: req.body.contactNo,   // ✅ Added
        isActive: req.body.isActive,
        profilePicture: req.body.profilePicture,
      },
    });

    res.json({
      message: "Student updated successfully",
      student: updatedStudent,
    });
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
