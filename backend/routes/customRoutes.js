import express from "express";
import { checkEmail, forgotPassword, getOtpExpiry, login, register, resendOTP, resetPassword, verifyOTP } from "../controllers/customController.js";


const router = express.Router();

router.post("/login", login);
router.post("/verify-otp", verifyOTP);
router.post("/register", register);
router.post("/resend-otp", resendOTP);
router.post("/get-otp-expiry", getOtpExpiry);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/check-email", checkEmail);
export default router;
