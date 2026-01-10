const express = require("express");
const { body, validationResult } = require("express-validator");
const { User } = require("../config/database");
const { auth, authorize } = require("../middleware/auth");
const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: {
        exclude: ["password", "passwordResetToken", "passwordResetExpires"],
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userResponse = {
      ...user.toJSON(),
      profileCompletion: user.getProfileCompletion(),
    };

    res.json({
      success: true,
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Fields that can be updated
    const allowedFields = [
      "fullName",
      "bio",
      "location",
      "phone",
      "website",
      "linkedinUrl",
      "twitterUrl",
      "collegeName",
      "course",
      "year",
      "graduationYear",
      "cgpa",
      "skills",
      "deanName",
      "establishedYear",
      "accreditation",
      "departments",
      "studentCount",
      "facultyCount",
      "companyName",
      "sector",
      "contactPerson",
      "employeeCount",
      "headquarters",
      "companyDescription",
      "startupName",
      "domain",
      "founderName",
      "foundedYear",
      "stage",
      "fundingStatus",
      "teamSize",
      "startupDescription",
      "emailNotifications",
      "pushNotifications",
      "profileVisibility",
    ];

    // Update only allowed fields
    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    await user.update(updateData);

    // Return updated user data
    const updatedUser = await User.findByPk(user.id, {
      attributes: {
        exclude: ["password", "passwordResetToken", "passwordResetExpires"],
      },
    });

    const userResponse = {
      ...updatedUser.toJSON(),
      profileCompletion: updatedUser.getProfileCompletion(),
    };

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during profile update",
    });
  }
};

// @desc    Get all users (with role-based filtering)
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      isActive: true,
    };

    if (role) {
      whereClause.role = role;
    }

    if (search) {
      const { Op } = require("sequelize");
      whereClause[Op.or] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { bio: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: {
        exclude: ["password", "passwordResetToken", "passwordResetExpires"],
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    // Add profile completion to each user
    const usersWithCompletion = users.map((user) => ({
      ...user.toJSON(),
      profileCompletion: user.getProfileCompletion(),
    }));

    res.json({
      success: true,
      data: {
        users: usersWithCompletion,
        pagination: {
          total: count,
          pages: Math.ceil(count / limit),
          page: parseInt(page),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: {
        exclude: ["password", "passwordResetToken", "passwordResetExpires"],
      },
    });

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userResponse = {
      ...user.toJSON(),
      profileCompletion: user.getProfileCompletion(),
    };

    res.json({
      success: true,
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Upload avatar
// @route   POST /api/users/avatar
// @access  Private
const uploadAvatar = async (req, res) => {
  try {
    // This would be implemented with multer or similar file upload middleware
    // For now, we'll just accept a URL
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return res.status(400).json({
        success: false,
        message: "Avatar URL is required",
      });
    }

    const user = await User.findByPk(req.user.id);
    await user.update({ avatar: avatarUrl });

    res.json({
      success: true,
      message: "Avatar updated successfully",
      data: {
        avatar: avatarUrl,
      },
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during avatar upload",
    });
  }
};

// Validation middleware
const updateProfileValidation = [
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Full name must be at least 2 characters long"),
  body("bio")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Bio must not exceed 500 characters"),
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Please provide a valid phone number"),
  body("website")
    .optional()
    .isURL()
    .withMessage("Please provide a valid website URL"),
  body("linkedinUrl")
    .optional()
    .isURL()
    .withMessage("Please provide a valid LinkedIn URL"),
  body("twitterUrl")
    .optional()
    .isURL()
    .withMessage("Please provide a valid Twitter URL"),
];

// Routes
router.get("/profile", auth, getProfile);
router.put("/profile", auth, updateProfileValidation, updateProfile);
router.get("/", auth, getUsers);
router.get("/:id", auth, getUserById);
router.post("/avatar", auth, uploadAvatar);

module.exports = router;
