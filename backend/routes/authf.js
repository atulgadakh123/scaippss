const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

// Public routes
router.get("/health", (req, res) => {
  res.json({ success: true, message: "Auth routes are working" });
});
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/google/register", authController.registerWithGoogle);
router.post("/google/login", authController.loginWithGoogle);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout); // Logout should work even with invalid token
router.post("/check-google-account", authController.checkGoogleAccount);

// Legacy compatibility routes for backward compatibility
router.post("/college/login", authController.login); // College login uses same controller
router.post("/college/register", authController.register); // College register uses same controller
router.post("/college/google/login", authController.loginWithGoogle);
router.post("/college/google/register", authController.registerWithGoogle);
router.post("/refresh", authController.refreshToken); // Legacy refresh endpoint

// Protected routes
router.use(authMiddleware); // Apply auth middleware to all routes below

router.get("/me", authController.getCurrentUser);
router.put("/profile", authController.updateProfile);
router.put("/change-password", authController.changePassword);

// Role-specific routes (examples)
router.get("/students", authorize("student"), (req, res) => {
  res.json({ message: "Student-only route", user: req.user });
});

router.get("/colleges", authorize("college"), (req, res) => {
  res.json({ message: "College-only route", user: req.user });
});

router.get("/startups", authorize("startup"), (req, res) => {
  res.json({ message: "Startup-only route", user: req.user });
});

router.get("/industries", authorize("industry"), (req, res) => {
  res.json({ message: "Industry-only route", user: req.user });
});

// Admin routes (multiple roles)
router.get("/admin", authorize("college", "industry"), (req, res) => {
  res.json({
    message: "Admin route for colleges and industries",
    user: req.user,
  });
});

module.exports = router;
