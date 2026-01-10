const express = require("express");
const { auth } = require("../middleware/auth");
const router = express.Router();

// @desc    Get job listings
// @route   GET /api/jobs
// @access  Private
router.get("/", auth, (req, res) => {
  res.json({
    success: true,
    message: "Jobs feature coming soon",
    data: {
      jobs: [],
    },
  });
});

// @desc    Create job listing
// @route   POST /api/jobs
// @access  Private (Industry/Startup only)
router.post("/", auth, (req, res) => {
  res.json({
    success: true,
    message: "Job creation feature coming soon",
  });
});

module.exports = router;
