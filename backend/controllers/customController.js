// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import { prisma } from "../config/prisma.js";
// import { sendOTP } from "../utils/mailer.js";

// /* LOGIN CONTROLLER */
// export const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await prisma.student.findUnique({ where: { email } });

//     /* ============================
//        CASE 1 → NEW EMAIL → SEND OTP
//        ============================ */
//     if (!user) {
//       const otp = Math.floor(100000 + Math.random() * 900000).toString();

//       await prisma.student.create({
//         data: {
//           email,
//           otp,
//           otpExpires: new Date(Date.now() + 10 * 60 * 1000),
//         },
//       });

//       await sendOTP(email, otp);

//       return res.status(200).json({
//         otpRequired: true,
//         newUser: true,
//         message: "Email not found. OTP sent. Please verify.",
//       });
//     }

//     /* ========================================
//        CASE 2 → USER EXISTS BUT NO PASSWORD SET
//        ======================================== */
//     if (!user.password) {
//       const otp = Math.floor(100000 + Math.random() * 900000).toString();

//       await prisma.student.update({
//         where: { email },
//         data: {
//           otp,
//           otpExpires: new Date(Date.now() + 10 * 60 * 1000),
//         },
//       });

//       await sendOTP(email, otp);

//       return res.status(200).json({
//         otpRequired: true,
//         message: "OTP sent. Please verify your email.",
//       });
//     }

//     /* ============================
//        CASE 3 → NORMAL LOGIN
//        ============================ */
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch)
//       return res.status(401).json({ message: "Invalid credentials" });

//     const token = jwt.sign(
//       { id: user.id, email: user.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "10d" }
//     );

//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: true,
//       sameSite: "none",
//     });

//     return res.json({
//       success: true,
//       message: "Login successful",
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };
// export const verifyOTP = async (req, res) => {
//   try {
//     const { email, otp, password } = req.body;

//     const user = await prisma.student.findUnique({ where: { email } });

//     if (!user)
//       return res.status(404).json({ message: "User not found" });

//     if (user.otp !== otp)
//       return res.status(400).json({ message: "Invalid OTP" });

//     if (user.otpExpires < new Date())
//       return res.status(400).json({ message: "OTP expired" });

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const updatedUser = await prisma.student.update({
//       where: { email },
//       data: {
//        password: hashedPassword,
//     otp: null,
//     otpExpires: null,
//     isEmailVerified: true,
//     loginCount: { increment: 1 },
//       },
//     });

//     const token = jwt.sign(
//       { id: updatedUser.id, email: updatedUser.email },
//       process.env.JWT_SECRET,
//       { expiresIn: "10d" }
//     );

//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: true,
//       sameSite: "none",
//     });

//     return res.json({
//       success: true,
//       message: "OTP verified successfully",
//       autoLogin: true,
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import redis from "../config/redis.js";
import { sendOTP } from "../utils/mailer.js";
/* ============================================================
   REGISTER CONTROLLER
   ============================================================ */
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, username } = req.body;

    // 1. Check email
    const existingEmail = await prisma.student.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // 2. Check username
    const existingUsername = await prisma.student.findUnique({
      where: { username },
    });

    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "Username already taken",
      });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    // 5. Create user
    await prisma.student.create({
      data: {
        email,
        username,
        firstName,
        lastName,
        password: hashedPassword,
        otp,
        otpExpires,
        isEmailVerified: false,
      },
    });

    // 6. Send OTP
    await sendOTP(email, otp);

    return res.json({
      success: true,
      message: "Registration successful. OTP sent to email.",
      expiresAt: otpExpires,
    });
  } catch (err) {
    console.error(err);

    // Prisma unique constraint fallback
    if (err.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "Email or username already exists",
      });
    }

    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   LOGIN CONTROLLER
   ============================================================ */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const user = await prisma.student.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // 3. Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: "student" },
      process.env.JWT_SECRET,
      { expiresIn: "10d" }
    );

    // 4. Send cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    //redis
    await redis.set(
     `auth:user:${user.id}`,
    "logged_in",
     "EX",
     10 * 24 * 60 * 60 // 10 days
    );

    return res.json({
      success: true,
      message: "Login successful",
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};


export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await prisma.student.findUnique({ where: { email } });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    if (user.otpExpires < new Date())
      return res.status(400).json({ message: "OTP expired" });

    // ✅ Update only verification fields — NO TOKEN HERE
    await prisma.student.update({
      where: { email },
      data: {
        otp: null,
        otpExpires: null,
        isEmailVerified: true,
        loginCount: { increment: 1 },
      },
    });

    return res.json({
      success: true,
      message: "OTP verified successfully",
      autoLogin: false, // now user must login separately
    });
  } catch (err) {
    console.error("OTP Verify Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await prisma.student.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Update OTP + expiry
    await prisma.student.update({
      where: { email },
      data: {
        otp: newOtp,
        otpExpires: new Date(Date.now() + 5 * 60 * 1000), // expires in 5 mins
      },
    });

    // 🔥 Use your existing sendOTP function
    await sendOTP(email, newOtp);

    return res.json({
      success: true,
      message: "OTP resent successfully",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getOtpExpiry = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.student.findUnique({
      where: { email },
      select: { otpExpires: true },
    });

    if (!user || !user.otpExpires) {
      return res.status(404).json({ message: "OTP not found" });
    }

    return res.json({
      success: true,
      expiresAt: user.otpExpires,
    });
  } catch (err) {
    console.error("Get OTP Expiry Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // check if user exists
    const user = await prisma.student.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "Email not found" });

    // generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // save OTP and expiry in DB
    await prisma.student.update({
      where: { email },
      data: { otp, otpExpires: new Date(Date.now() + 10 * 60 * 1000) },
    });

    // send OTP via email
    await sendOTP(email, otp);

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 2️⃣ Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    const user = await prisma.student.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    // verify OTP
    if (user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });
    if (user.otpExpires < new Date())
      return res.status(400).json({ message: "OTP expired" });

    // hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // update user
    await prisma.student.update({
      where: { email },
      data: { password: hashedPassword, otp: null, otpExpires: null },
    });
         
    //redis set
    await redis.del(`auth:user:${user.id}`);
await redis.del(`user:${user.id}`);

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await prisma.student.findUnique({ where: { email } });
    if (!user) return res.json({ exists: false });

    return res.json({ exists: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
