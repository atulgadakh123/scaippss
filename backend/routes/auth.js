import express from "express";
import {
  register,
  login,
  logout,
  googleRedirect,
  googleCallback,
  getMe,
  updateProfile,
  changePassword,
  studentOnly
} from "../controllers/authController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/auth.js";

const router = express.Router();

// AUTH
router.post("/register", register);
router.post("/login", login);

// GOOGLE LOGIN
router.get("/google", googleRedirect);
router.get("/google/callback", googleCallback);

// AUTH CHECK (Protected)
router.get("/me", authMiddleware, getMe);
router.put("/profile", authMiddleware, updateProfile);
router.put("/change-password", authMiddleware, changePassword);
router.get("/students", authorize("student"), studentOnly);

// LOGOUT
router.post("/logout", logout);
router.get("/check", authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Token is valid",
    user: req.user, // decoded JWT payload
  });
});


export default router;
