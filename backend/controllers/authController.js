import axios from "axios";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import redis from "../config/redis.js";
 
// ======================================
// TOKEN CREATION + COOKIE
// ======================================
// const setTokenCookie = (res, student) => {
//   const token = jwt.sign(
//     { id: student.id, email: student.email },
//     process.env.JWT_SECRET,
//     { expiresIn: "7d" }
//   );

//   const isProd = process.env.NODE_ENV === "production";

//   res.cookie("token", token, {
//     httpOnly: true,
//     secure: isProd,                     // true in production
//     sameSite: isProd ? "none" : "lax",  // none for vercel
//     path: "/",
//   });

//   console.log("🍪 Token Set:", token);
//   return token;
// };

const setTokenCookie = (res, student) => {
  const token = jwt.sign(
    { id: student.id, email: student.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  const isProd = process.env.NODE_ENV === "production";

  // ✅ Updated cookie settings
  res.cookie("token", token, {
    httpOnly: true,
    secure: false, // ✅ Set to false in development
    sameSite: "lax", // ✅ Use "lax" for localhost
    path: "/",
    maxAge: 10 * 24 * 60 * 60 * 1000, // 7 days
  });

  console.log("🍪 Cookie set with token:", token);
  console.log("🍪 Cookie settings:", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  return token;
};

// ======================================
// REGISTER
// ======================================
// ======================================
// REGISTER
// ======================================
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, username } = req.body;

    // Check if user already exists
    const existingStudent = await prisma.student.findUnique({
      where: { email },
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const student = await prisma.student.create({
      data: {
        firstName,
        lastName: lastName || null,
        username: username || null, // ✅ Optional
        email,
        isEmailVerified: true,
        password: hashed,
      },
    });

    console.log("🆕 Registered User:", student);

    setTokenCookie(res, student);

    return res.json({
      success: true,
      message: "Registered successfully",
      student,
    });
  } catch (err) {
    console.error("❌ Register Error:", err);
    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: err.message,
    });
  }
};

// ======================================
// LOGIN
// ======================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const student = await prisma.student.findUnique({ where: { email } });

    if (!student) {
      console.log("❌ Login failed: Email not found");
      return res.status(400).json({ message: "User not found" });
    }

    // Check if user registered via Google (no password)
    if (!student.password) {
      return res.status(400).json({
        message: "Please login with Google",
      });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      console.log("❌ Login failed: Incorrect password");
      return res.status(400).json({ message: "Incorrect password" });
    }

    console.log("🔐 Login success:", student);
    
    setTokenCookie(res, student);
          
      redis.set(
  `auth:user:${student.id}`,
  "logged_in",
  "EX",
  7 * 24 * 60 * 60 // 7 days
    ).catch(console.error);

       prisma.student.update({
      where: { id: student.id },
      data: {
        lastLogin: new Date(),
        loginCount: { increment: 1 },
      },
    });

    

   
    return res.json({ message: "Logged in", student });
  } catch (err) {
    console.error("❌ Login Error:", err);
    return res
      .status(500)
      .json({ message: "Login failed", error: err.message });
  }
      
};

// ======================================
// GOOGLE REDIRECT
// ======================================
const googleRedirect = (req, res) => {
  const redirectUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_REDIRECT_URL,
      response_type: "code",
      scope: "profile email",
    });

  console.log("➡️ Redirecting to Google OAuth...");

  res.redirect(redirectUrl);
};

// ======================================
// GOOGLE CALLBACK
// ======================================

const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      console.log("❌ No authorization code received");
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=auth_failed`
      );
    }

    console.log("🔄 Google callback received, code:", code);

    // Exchange code for access token
    const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URL,
      grant_type: "authorization_code",
      code,
    });

    const accessToken = tokenRes.data.access_token;

    // Get user profile from Google
    const profileRes = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const { id, email, name, picture } = profileRes.data;

    console.log("📥 Google Profile:", profileRes.data);

    // Check if student already exists
    let student = await prisma.student.findUnique({ where: { email } });

    if (!student) {
      // Create new student from Google profile
      const [firstName, ...lastNameParts] = name?.split(" ") ?? ["User"];
      const lastName = lastNameParts.join(" ") || null;

      student = await prisma.student.create({
        data: {
          firstName,
          lastName,
          email,
          isEmailVerified: true,
          googleId: id,
          profilePicture: picture,
        },
      });

      console.log("🆕 Google User Created:", student);
    } else {
      // Update existing student with Google info if not set
      if (!student.googleId) {
        student = await prisma.student.update({
          where: { id: student.id },
          data: {
            googleId: id,
            profilePicture: picture || student.profilePicture,
            isEmailVerified: true,
          },
        });
        console.log("🔄 Linked Google account to existing user");
      }
    }

    // Update last login
    await prisma.student.update({
      where: { id: student.id },
      data: {
        lastLogin: new Date(),
        loginCount: { increment: 1 },
      },
    });

    setTokenCookie(res, student);

    res.redirect(process.env.FRONTEND_URL);
  } catch (err) {
    console.error("❌ Google Login Error:", err);
    console.error("Error details:", err.response?.data || err.message);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
  }
};

// ======================================
// GET ME
// ======================================
// ======================================
// GET ME
// ======================================
const getMe = async (req, res) => {
  try {
      //get redis
    const cachedUser = await redis.get(`user:${req.user.id}`);

    if (cachedUser) {
      console.log("⚡ User from Redis");
        return res.json({
             success: true,
           user: JSON.parse(cachedUser),
       });
       }
    console.log("📥 getMe called");
    console.log("📥 req.user:", req.user);

    if (!req.user || !req.user.id) {
      console.log("❌ No user in request");
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const student = await prisma.student.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        profilePicture: true,
        isEmailVerified: true,
        createdAt: true,
        lastLogin: true,
        loginCount: true,
      },
    });
           //redis set 
           await redis.set(
           `user:${req.user.id}`,
           JSON.stringify(student),
             "EX",
  300 // 5 minutes
);

    if (!student) {
      console.log("❌ getMe: User not found in database");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // console.log("📤 getMe result:", student);

    res.json({
      success: true,
      user: student,
    });
  } catch (error) {
    console.error("❌ getMe error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student profile",
      error: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    console.log("✏️ updateProfile for user:", req.user.id);

    const { firstName, lastName } = req.body;

    const updated = await prisma.student.update({
      where: { id: req.user.id },
      data: {
        firstName,
        lastName: lastName || null,
      },
    });

    console.log("📤 Profile updated:", updated);

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updated,
    });
  } catch (error) {
    console.error("❌ updateProfile error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ======================================
// CHANGE PASSWORD
// ======================================
const changePassword = async (req, res) => {
  try {
    console.log("🔐 changePassword for:", req.user.id);

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "Both old and new passwords are required",
      });
    }
    await redis.del(`user:${req.user.id}`);
await redis.del(`auth:user:${req.user.id}`);


    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters",
      });
    }

    const student = await prisma.student.findUnique({
      where: { id: req.user.id },
    });

    if (!student) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has a password (might be Google-only user)
    if (!student.password) {
      return res.status(400).json({
        message: "Cannot change password for Google-authenticated accounts",
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, student.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.student.update({
      where: { id: req.user.id }, // ✅ Fixed: was req.user.userId
      data: {
        password: hashed,
        updatedAt: new Date(),
      },
    });

    console.log("✅ Password updated");

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("❌ changePassword error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ======================================
// LOGOUT
// ======================================
const logout = (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
     
  //redis delete
   redis.del(`auth:user:${req.user.id}`);
 redis.del(`user:${req.user.id}`);

  res.clearCookie("token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });
      
      
  console.log("🚪 Logged out");
  res.json({ message: "Logged out successfully" });
};

// ======================================
// STUDENT ONLY ROUTE
// ======================================
const studentOnly = (req, res) => {
  res.json({
    message: "Student-only route accessed successfully",
    user: req.user,
  });
};

export {
  register,
  login,
  googleRedirect,
  googleCallback,
  logout,
  getMe,
  updateProfile,
  changePassword,
  studentOnly,
};
