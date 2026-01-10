// import { PrismaClient } from "@prisma/client";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// const prisma = new PrismaClient();

// // export const loginAdmin = async (req, res) => {
// //   try {
// //     const { email, password } = req.body;

// //     // Hash password
// //     const hashedPassword = await bcrypt.hash(password, 10);

// //     // Directly create admin
// //     const admin = await prisma.admin.create({
// //       data: {
// //         name: "Admin User",
// //         email,
// //         password: hashedPassword,
// //         role: "admin",
// //       },
// //     });

// //     // Generate token
// //     const token = jwt.sign(
// //       { id: admin.id, role: admin.role },
// //       "SECRET_KEY",
// //       { expiresIn: "1d" }
// //     );

// //     res.json({
// //       message: "Admin created & logged in",
// //       token,
// //       admin: {
// //         id: admin.id,
// //         name: admin.name,
// //         email: admin.email,
// //         role: admin.role,
// //       },
// //     });

// //   } catch (error) {
// //     res.status(500).json({ error: error.message });
// //   }
// // };

// export const loginAdmin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const admin = await prisma.admin.findUnique({ where: { email } });
//     if (!admin) return res.status(400).json({ message: "Admin not found" });

//     const isMatch = await bcrypt.compare(password, admin.password);
//     if (!isMatch) return res.status(400).json({ message: "Invalid password" });

//     const token = jwt.sign(
//       { id: admin.id, role: admin.role },
//      process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     // 👉 Set token in cookie
//     res.cookie("adminToken", token, {
//       httpOnly: true,   // cannot be accessed by JS
//       secure: false,    // true if using HTTPS
//       sameSite: "lax",
//       maxAge: 24 * 60 * 60 * 1000, // 1 day
//     });

//     res.json({
//       message: "Login successful",
//       token, // optional
//       admin: {
//         id: admin.id,
//         name: admin.name,
//         email: admin.email,
//         role: admin.role,
//       },
//     });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };





import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import redis from "../config/redis.js";

const prisma = new PrismaClient();

// ---------------------- ADMIN REGISTER ----------------------
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check existing admin
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "admin",
      },
    });

    res.json({
      message: "Admin registered successfully",
      admin: {
        id: admin.id,
       
      },
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ---------------------- ADMIN LOGIN ----------------------
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Save token in cookie
    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: false,   // Set true in production with HTTPS
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    await redis.set(
      `admin:session:${admin.id}`, // 🔴 UNIQUE ADMIN SESSION KEY
      "logged_in",
      "EX",
      24 * 60 * 60 // 1 day
    );

    res.json({
      message: "Login successful",
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      token,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
