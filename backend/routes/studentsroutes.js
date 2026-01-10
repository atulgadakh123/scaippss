import express from "express";

import prisma from "../config/prisma.js";
import { auth } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();
import cloudinary from "cloudinary";
import fs from "fs";
import path from "path";

import {
  createAchievement,
  getAchievements,
  updateAchievement,
  deleteAchievement,
} from "../controllers/achievementController.js";
import {
  getStudentAbout,
  updateStudentAbout,
  getStudentCertifications,
  createCertification,
  updateCertification,
  deleteCertification,
  getStudentCourses,
  createStudentCourse,
  updateStudentCourse,
  deleteStudentCourse,
  createEducation,
  getEducationByStudent,
  updateEducation,
  deleteEducation,
  createExperience,
  getExperienceByStudent,
  updateExperience,
  deleteExperience,
  createProject,
  getProjects,
  updateProject,
  deleteProject,
  getStudentSkills,
  createStudentSkill,
  deleteStudentSkill,
  checkGoogleUser,
  saveStudentAbout,
} from "../controllers/studentController2.js";

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post("/experience", createExperience);
router.get("/experience/:studentId", getExperienceByStudent);
router.put("/experience/:id", updateExperience);
router.delete("/experience/:id", deleteExperience);

router.post("/education", createEducation);
router.get("/education/:studentId", getEducationByStudent);
router.put("/education/:id", updateEducation);
router.delete("/education/:id", deleteEducation);

router.get("/skills/:studentId", getStudentSkills);
router.post("/skills", createStudentSkill);
router.delete("/skills/:id", deleteStudentSkill);

router.post("/projects", createProject);
router.get("/projects/:studentId", getProjects);
router.put("/projects/:id", updateProject);
router.delete("/projects/:id", deleteProject);

router.post("/achievements", createAchievement);
router.get("/achievements", getAchievements);
router.put("/achievements/:id", updateAchievement);
router.delete("/achievements/:id", deleteAchievement);

router.get("/about/:studentId", getStudentAbout);
router.put("/about/:studentId", updateStudentAbout);
router.post("/about/:studentId", saveStudentAbout);

// CERTIFICATIONS
router.get("/certifications", getStudentCertifications);
router.post("/certifications", createCertification);
router.put("/certifications/:id", updateCertification);
router.delete("/certifications/:id", deleteCertification);

router.get("/courses", getStudentCourses);
router.post("/courses", createStudentCourse);
router.put("/courses/:id", updateStudentCourse);
router.delete("/courses/:id", deleteStudentCourse);

//notifications for allow
router.put("/:id/notification", async (req, res) => {
  try {
    const { notification, deniedAt } = req.body;

    const updated = await prisma.student.update({
      where: { id: Number(req.params.id) },
      data: { notification, deniedAt },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/notification", async (req, res) => {
  try {
    // Convert URL param to number
    const studentId = parseInt(req.params.id, 10);

    // Validate ID
    if (isNaN(studentId)) {
      return res.status(400).json({ error: "Invalid student ID" });
    }

    // Fetch student
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        notification: true,
        deniedAt: true,
      },
    });

    // If not found
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Success
    res.json(student);
  } catch (error) {
    console.error("Error fetching student notification:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//student profile
router.get("/portfolio/:username", async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const student = await prisma.student.findUnique({
      where: { username },
      include: {
        skills: true,
        about: true,
        projects: true,
        education: true,
        experience: true,
        certifications: true,
        courses: true,
        recommendations: true,
        achivements: true,
      },
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({ success: true, data: student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/check-username", async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const existingUser = await prisma.student.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.json({ available: false, message: "Username already taken" });
    }

    res.json({ available: true, message: "Username is available" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// GET /api/students/me - Get current student profile (Prisma-based)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = Number(req.user?.id); // ensure it's a number

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is missing" });
    }

    const student = await prisma.student.findUnique({
      where: { id: userId },
      select: studentSelectFields(),
    });

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student profile not found" });
    }

    res.json({ success: true, data: student });
  } catch (error) {
    console.error("Fetch student profile error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch student profile" });
  }
});

// PUT /api/students/me - Update current student profile (Prisma-based)
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const {
      firstName,
      username,
      lastName,
      contactNo,
      collegeName,
      interestedField,
      otherField,
      githubUrl,
      linkedinUrl,
      location,
      headline,
      profilePicture,
    } = req.body;

    const updatedStudent = await prisma.student.update({
      where: { id: req.user.id },
      data: {
        firstName,
        username,
        lastName,
        contactNo,
        collegeName,
        interestedField,
        otherField,
        githubUrl,
        linkedinUrl,
        location,
        headline,
        profilePicture,
        role: "student",
        updatedAt: new Date(),
      },
      select: studentSelectFields(),
    });

    res.json({ success: true, data: updatedStudent });
  } catch (error) {
    console.error("Error updating student profile:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update student profile" });
  }
});

const getStudentProfile = async (req, res) => {
  try {
    console.log("Fetching complete profile for student ID:", req.user.id);

    const student = await prisma.student.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        firstName: true,
        username: true,
        lastName: true,
        email: true,
        contactNo: true,
        collegeName: true,
        interestedField: true,
        otherField: true,
        githubUrl: true,
        linkedinUrl: true,
        profilePicture: true,
        coverPicture: true,
        headline: true,
        location: true,
        isActive: true,
        isEmailVerified: true,
        lastLogin: true,
        loginCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const [
      about,
      experiences,
      education,
      skills,
      courses,
      certifications,
      projects,
      recommendations,
    ] = await Promise.all([
      prisma.student_about.findFirst({ where: { student_id: req.user.id } }),
      prisma.student_experience.findMany({
        where: { student_id: req.user.id },
        orderBy: { start_date: "desc" },
      }),
      prisma.student_education.findMany({
        where: { student_id: req.user.id },
        orderBy: { end_year: "desc" },
      }),
      prisma.student_skills.findMany({
        where: { student_id: req.user.id },
        orderBy: { skill_name: "asc" },
      }),
      prisma.student_courses.findMany({
        where: { student_id: req.user.id },
        orderBy: { completion_date: "desc" },
      }),
      prisma.student_certifications.findMany({
        where: { student_id: req.user.id },
        orderBy: { issue_date: "desc" },
      }),
      prisma.student_projects.findMany({
        where: { student_id: req.user.id },
        orderBy: { start_date: "desc" },
      }),
      prisma.student_recommendations.findMany({
        where: { student_id: req.user.id },
        orderBy: { id: "desc" },
      }),
    ]);

    res.json({
      success: true,
      data: {
        id: student.id,
        firstName: student.firstName,
        username: student.username,
        lastName: student.lastName,
        email: student.email,
        contactNo: student.contactNo,
        collegeName: student.collegeName,
        interestedField: student.interestedField,
        otherField: student.otherField,
        githubUrl: student.githubUrl,
        linkedinUrl: student.linkedinUrl,
        profilePicture: student.profilePicture,
        coverPicture: student.coverPicture,
        headline: student.headline,
        location: student.location,
        about: about?.summary || "",
        experiences: experiences || [],
        education: education || [],
        skills: skills || [],
        courses: courses || [],
        certifications: certifications || [],
        projects: projects || [],
        recommendations: recommendations || [],
        createdAt: student.createdAt,
      },
    });
  } catch (error) {
    console.error("Get student profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
};

const updateBasicInfo = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      contact_no,
      username,
      college_name,
      interested_field,
      other_field,
    } = req.body;

    const student = await prisma.student.findUnique({
      where: { id: req.user.id },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const updatedStudent = await prisma.student.update({
      where: { id: req.user.id },
      data: {
        firstName: first_name,
        username: username,
        lastName: last_name,
        contactNo: contact_no,
        collegeName: college_name,
        interestedField: interested_field,
        otherField: interested_field === "Other" ? other_field : null,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Basic info updated successfully",
      data: {
        id: updatedStudent.id,
        firstName: updatedStudent.firstName,
        username: updatedStudent.username,
        lastName: updatedStudent.lastName,
        contactNo: updatedStudent.contactNo,
        collegeName: updatedStudent.collegeName,
        interestedField: updatedStudent.interestedField,
        otherField: updatedStudent.otherField,
      },
    });
  } catch (error) {
    console.error("Update basic info error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating basic info",
    });
  }
};

const updateAbout = async (req, res) => {
  try {
    const { summary } = req.body;

    const about = await prisma.student_about.upsert({
      where: { student_id: req.user.id },
      update: { summary },
      create: {
        student_id: req.user.id,
        summary,
      },
    });

    res.json({
      success: true,
      message: "About section updated successfully",
      data: about,
    });
  } catch (error) {
    console.error("Update about error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating about section",
    });
  }
};

const addExperience = async (req, res) => {
  try {
    const { title, company, start_date, end_date, description } = req.body;

    const experience = await StudentExperience.create({
      student_id: req.user.id,
      title,
      company,
      start_date,
      end_date,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Experience added successfully",
      data: experience,
    });
  } catch (error) {
    console.error("Add experience error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding experience",
    });
  }
};

const addProject = async (req, res) => {
  try {
    const {
      title,
      description,
      technologies,
      start_date,
      end_date,
      project_link,
    } = req.body;

    const project = await StudentProjects.create({
      student_id: req.user.id,
      title,
      description,
      technologies,
      start_date,
      end_date,
      project_link,
    });

    res.status(201).json({
      success: true,
      message: "Project added successfully",
      data: project,
    });
  } catch (error) {
    console.error("Add project error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding project",
    });
  }
};

const addEducation = async (req, res) => {
  try {
    const {
      institution,
      degree,
      field_of_study,
      start_year,
      end_year,
      grade,
    } = req.body;

    const education = await StudentEducation.create({
      student_id: req.user.id,
      institution,
      degree,
      field_of_study,
      start_year,
      end_year,
      grade,
    });

    res.status(201).json({
      success: true,
      message: "Education added successfully",
      data: education,
    });
  } catch (error) {
    console.error("Add education error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding education",
    });
  }
};

const addSkill = async (req, res) => {
  try {
    const { skill_name, proficiency } = req.body;

    const skill = await StudentSkills.create({
      student_id: req.user.id,
      skill_name,
      proficiency,
    });

    res.status(201).json({
      success: true,
      message: "Skill added successfully",
      data: skill,
    });
  } catch (error) {
    console.error("Add skill error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding skill",
    });
  }
};

const updateSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const { skill_name, proficiency } = req.body;

    const skill = await StudentSkills.findOne({
      where: { id, student_id: req.user.id },
    });

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Skill not found",
      });
    }

    await skill.update({
      skill_name,
      proficiency,
    });

    res.json({
      success: true,
      message: "Skill updated successfully",
      data: skill,
    });
  } catch (error) {
    console.error("Update skill error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating skill",
    });
  }
};

const deleteSkill = async (req, res) => {
  try {
    const { id } = req.params;

    const skill = await StudentSkills.findOne({
      where: { id, student_id: req.user.id },
    });

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: "Skill not found",
      });
    }

    await skill.destroy();

    res.json({
      success: true,
      message: "Skill deleted successfully",
    });
  } catch (error) {
    console.error("Delete skill error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting skill",
    });
  }
};

const addCourse = async (req, res) => {
  try {
    const { course_name, provider, completion_date } = req.body;

    const course = await StudentCourses.create({
      student_id: req.user.id,
      course_name,
      provider,
      completion_date,
    });

    res.status(201).json({
      success: true,
      message: "Course added successfully",
      data: course,
    });
  } catch (error) {
    console.error("Add course error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding course",
    });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await StudentCourses.findOne({
      where: { id, student_id: req.user.id },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    await course.destroy();

    res.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Delete course error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting course",
    });
  }
};

const addCertification = async (req, res) => {
  try {
    const {
      certificate_name,
      issuing_organization,
      issue_date,
      expiry_date,
      credential_id,
      credential_url,
    } = req.body;

    const certification = await StudentCertifications.create({
      student_id: req.user.id,
      certificate_name,
      issuing_organization,
      issue_date,
      expiry_date,
      credential_id,
      credential_url,
    });

    res.status(201).json({
      success: true,
      message: "Certification added successfully",
      data: certification,
    });
  } catch (error) {
    console.error("Add certification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding certification",
    });
  }
};

const addRecommendation = async (req, res) => {
  try {
    const {
      recommender_name,
      position,
      relationship,
      message,
      date,
      customFields,
    } = req.body;

    console.log("📩 Received Recommendation Data:", req.body);

    const recommendation = await StudentRecommendations.create({
      student_id: req.user.id,
      recommender_name,
      position,
      relationship,
      message,
      date: date || new Date(),
      customFields: customFields || [],
    });

    res.status(201).json({
      success: true,
      message: "Recommendation added successfully",
      data: recommendation,
    });
  } catch (error) {
    console.error("❌ Add recommendation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding recommendation",
    });
  }
};

const updateRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    const { recommender_name, relationship, position, message } = req.body;

    const recommendation = await StudentRecommendations.findOne({
      where: { id, student_id: req.user.id },
    });

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: "Recommendation not found",
      });
    }

    await recommendation.update({
      recommender_name,
      relationship,
      message,
      position,
    });

    res.json({
      success: true,
      message: "Recommendation updated successfully",
      data: recommendation,
    });
  } catch (error) {
    console.error("Update recommendation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating recommendation",
    });
  }
};

const deleteRecommendation = async (req, res) => {
  try {
    const { id } = req.params;

    const recommendation = await StudentRecommendations.findOne({
      where: { id, student_id: req.user.id },
    });

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: "Recommendation not found",
      });
    }

    await recommendation.destroy();

    res.json({
      success: true,
      message: "Recommendation deleted successfully",
    });
  } catch (error) {
    console.error("Delete recommendation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting recommendation",
    });
  }
};

// const uploadProfileImage = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "No file uploaded",
//       });
//     }

//     const uploadResult = await new Promise((resolve, reject) => {
//       const uploadStream = cloudinary.v2.uploader.upload_stream(
//         { folder: "profile_pictures" },
//         (error, result) => {
//           if (error) reject(error);
//           else resolve(result);
//         }
//       );
//       streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
//     });

//     const profile_picture = uploadResult.secure_url;

//     const student = await prisma.student.findUnique({
//       where: { id: req.user.id },
//     });

//     if (!student) {
//       return res.status(404).json({
//         success: false,
//         message: "Student not found",
//       });
//     }

//     await prisma.student.update({
//       where: { id: req.user.id },
//       data: { profilePicture: profile_picture },
//     });

//     res.json({
//       success: true,
//       message: "Profile image updated successfully",
//       data: { profile_picture },
//     });
//   } catch (error) {
//     console.error("Upload profile image error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while uploading profile image",
//     });
//   }
// };

// const uploadCoverImage = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "No file uploaded",
//       });
//     }

//     const uploadResult = await new Promise((resolve, reject) => {
//       const uploadStream = cloudinary.v2.uploader.upload_stream(
//         { folder: "cover_pictures" },
//         (error, result) => {
//           if (error) reject(error);
//           else resolve(result);
//         }
//       );
//       streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
//     });

//     const cover_picture = uploadResult.secure_url;

//     const student = await prisma.student.findUnique({
//       where: { id: req.user.id },
//     });

//     if (!student) {
//       return res.status(404).json({
//         success: false,
//         message: "Student not found",
//       });
//     }

//     await prisma.student.update({
//       where: { id: req.user.id },
//       data: { coverPicture: cover_picture },
//     });

//     res.json({
//       success: true,
//       message: "Cover image updated successfully",
//       data: { cover_picture },
//     });
//   } catch (error) {
//     console.error("Upload cover image error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while uploading cover image",
//     });
//   }
// };

// router.delete("/cover-image", authMiddleware, async (req, res) => {
//   try {
//     const studentId = req.user.id;

//     await prisma.student.update({
//       where: { id: studentId },
//       data: { coverPicture: "" },
//     });

//     res.json({ message: "Cover image removed successfully" });
//   } catch (error) {
//     console.error("❌ Error removing cover image:", error);
//     res.status(500).json({ message: "Failed to remove cover image" });
//   }
// });

const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const studentId = parseInt(id);
    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const student = await prisma.student.findUnique({
      where: {
        id: studentId,
      },
      select: {
        id: true,
        firstName: true,
        username: true,
        lastName: true,
        email: true,
        contactNo: true,
        collegeName: true,
        interestedField: true,
        otherField: true,
        profilePicture: true,
        coverPicture: true,
        headline: true,
        location: true,
        isActive: true,
        isEmailVerified: true,
        lastLogin: true,
        loginCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const [
      about,
      experiences,
      education,
      skills,
      courses,
      certifications,
      projects,
      recommendations,
    ] = await Promise.all([
      prisma.student_about.findFirst({
        where: { student_id: studentId },
      }),
      prisma.student_experience.findMany({
        where: { student_id: studentId },
        orderBy: { start_date: "desc" },
      }),
      prisma.student_education.findMany({
        where: { student_id: studentId },
        orderBy: { end_year: "desc" },
      }),
      prisma.student_skills.findMany({
        where: { student_id: studentId },
        orderBy: { skill_name: "asc" },
      }),
      prisma.student_courses.findMany({
        where: { student_id: studentId },
        orderBy: { completion_date: "desc" },
      }),
      prisma.student_certifications.findMany({
        where: { student_id: studentId },
        orderBy: { issue_date: "desc" },
      }),
      prisma.student_projects.findMany({
        where: { student_id: studentId },
        orderBy: { start_date: "desc" },
      }),
      prisma.student_recommendations.findMany({
        where: { student_id: studentId },
        orderBy: { id: "desc" },
      }),
    ]);

    res.json({
      success: true,
      data: {
        id: student.id,
        firstName: student.firstName,
        username: student.username,
        lastName: student.lastName,
        email: student.email,
        contactNo: student.contactNo,
        collegeName: student.collegeName,
        interestedField: student.interestedField,
        otherField: student.otherField,
        profilePicture: student.profilePicture,
        coverPicture: student.coverPicture,
        headline: student.headline,
        location: student.location,
        about: about?.summary || "",
        experiences: experiences || [],
        education: education || [],
        skills: skills || [],
        courses: courses || [],
        certifications: certifications || [],
        projects: projects || [],
        recommendations: recommendations || [],
        createdAt: student.createdAt,
      },
    });
  } catch (error) {
    console.error("Get student by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching student profile",
    });
  }
};

const getStudentAdditionalInfo = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own profile.",
      });
    }

    const student = await prisma.student.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        firstName: true,
        username: true,
        lastName: true,
        email: true,
        contactNo: true,
        collegeName: true,
        interestedField: true,
        otherField: true,
        profilePicture: true,
        coverPicture: true,
        createdAt: true,
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      data: {
        id: student.id,
        firstName: student.firstName,
        username: student.username,
        lastName: student.lastName,
        email: student.email,
        contactNo: student.contactNo,
        collegeName: student.collegeName,
        interestedField: student.interestedField,
        otherField: student.otherField,
        profilePicture: student.profilePicture,
        coverPicture: student.coverPicture,
        createdAt: student.createdAt,
      },
    });
  } catch (error) {
    console.error("Get student additional info error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching additional information",
    });
  }
};

const updateStudentAdditionalInfo = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only update your own profile.",
      });
    }

    const {
      first_name,
      last_name,
      contact_no,
      username,
      college_name,
      interested_field,
      other_field,
    } = req.body;

    const student = await prisma.student.findUnique({
      where: { id: parseInt(id) },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const updatedStudent = await prisma.student.update({
      where: { id: parseInt(id) },
      data: {
        firstName: first_name,
        username: username,
        lastName: last_name,
        contactNo: contact_no,
        collegeName: college_name,
        interestedField: interested_field,
        otherField: interested_field === "Other" ? other_field : null,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Additional info updated successfully",
      data: {
        id: updatedStudent.id,
        firstName: updatedStudent.firstName,
        username: updatedStudent.username,
        lastName: updatedStudent.lastName,
        contactNo: updatedStudent.contactNo,
        collegeName: updatedStudent.collegeName,
        interestedField: updatedStudent.interestedField,
        otherField: updatedStudent.otherField,
      },
    });
  } catch (error) {
    console.error("Update student additional info error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating additional information",
    });
  }
};

// ------------------ CREATE PING ------------------
router.post("/ping/:studentId", authMiddleware, async (req, res) => {
  try {
    const receiverId = parseInt(req.params.studentId);
    const senderId = req.user.id;
    const senderType = req.user.role;

    if (senderId === receiverId) {
      return res.status(400).json({
        success: false,
        message: "You cannot connect with yourself",
      });
    }

    const existingPing = await prisma.ping_networks.findFirst({
      where: {
        OR: [
          {
            sender_profile_id: senderId,
            sender_profile_type: senderType,
            receiver_profile_id: receiverId,
            receiver_profile_type: "student",
          },
          {
            sender_profile_id: receiverId,
            sender_profile_type: "student",
            receiver_profile_id: senderId,
            receiver_profile_type: senderType,
          },
        ],
      },
    });

    if (existingPing) {
      return res.status(400).json({
        success: false,
        message: "Connection already exists or request pending",
      });
    }

    const ping = await prisma.ping_networks.create({
      data: {
        sender_profile_id: senderId,
        sender_profile_type: senderType,
        receiver_profile_id: receiverId,
        receiver_profile_type: "student",
        status: "pending",
      },
    });

    res.status(201).json({
      success: true,
      message: "Ping sent successfully",
      data: ping,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to send ping",
    });
  }
});

// ------------------ FETCH PING REQUESTS ------------------
router.get("/ping-requests", authMiddleware, async (req, res) => {
  try {
    const requests = await prisma.ping_networks.findMany({
      where: {
        receiver_profile_id: req.user.id,
        receiver_profile_type: "student",
        status: "pending",
      },
      orderBy: { created_at: "desc" },
    });

    const enriched = await Promise.all(
      requests.map(async (req) => {
        const sender = await prisma.student.findUnique({
          where: { id: req.sender_profile_id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        });
        return { ...req, sender };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

router.get("/connections", authMiddleware, async (req, res) => {
  try {
    const studentId = req.user.id;

    const connections = await prisma.ping_networks.findMany({
      where: {
        status: "accepted",
        OR: [
          { sender_profile_id: studentId },
          { receiver_profile_id: studentId },
        ],
      },
      orderBy: { accepted_at: "desc" },
    });

    const map = new Map();

    for (const conn of connections) {
      const otherId =
        conn.sender_profile_id === studentId
          ? conn.receiver_profile_id
          : conn.sender_profile_id;

      if (map.has(otherId)) continue;

      const user = await prisma.student.findUnique({
        where: { id: otherId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
          headline: true,
        },
      });

      if (user) {
        map.set(otherId, {
          ...conn,
          user,
        });
      }
    }

    res.json({
      success: true,
      data: Array.from(map.values()),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

router.get("/sent-pings", authMiddleware, async (req, res) => {
  try {
    const sent = await prisma.ping_networks.findMany({
      where: {
        sender_profile_id: req.user.id,
        status: "pending",
      },
      orderBy: { created_at: "desc" },
    });

    const enriched = await Promise.all(
      sent.map(async (p) => {
        const receiver = await prisma.student.findUnique({
          where: { id: p.receiver_profile_id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        });
        return { ...p, receiver };
      })
    );

    res.json({ success: true, data: enriched });
  } catch {
    res.status(500).json({ success: false });
  }
});

// ------------------ ACCEPT PING ------------------
router.put("/ping/:requestId/accept", authMiddleware, async (req, res) => {
  try {
    const requestId = parseInt(req.params.requestId);
    const userId = req.user.id;

    const ping = await prisma.ping_networks.findUnique({
      where: { id: requestId },
    });

    if (!ping || ping.receiver_profile_id !== userId) {
      return res.status(403).json({ success: false });
    }

    await prisma.ping_networks.update({
      where: { id: requestId },
      data: {
        status: "accepted",
        accepted_at: new Date(),
      },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// ------------------ DECLINE PING ------------------
router.put("/ping/:requestId/decline", authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const studentId = req.user.id;

    const pingRequest = await prisma.ping_networks.findUnique({
      where: { id: parseInt(requestId) },
    });

    if (!pingRequest)
      return res
        .status(404)
        .json({ success: false, message: "Ping request not found" });
    if (
      pingRequest.receiver_profile_id !== studentId ||
      pingRequest.receiver_profile_type !== "student"
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only decline ping requests sent to you",
      });
    }

    const updatedPing = await prisma.ping_networks.update({
      where: { id: parseInt(requestId) },
      data: { status: "declined", ignored_at: new Date() },
    });

    res.json({
      success: true,
      message: "Ping request declined successfully",
      data: updatedPing,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to decline ping request",
      error: error.message,
    });
  }
});

// ------------------ CHECK PING STATUS ------------------
router.get("/ping-status/:studentId", authMiddleware, async (req, res) => {
  try {
    const { studentId } = req.params;
    const currentUserId = req.user.id;
    const currentUserType = req.user.role;

    const ping = await prisma.ping_networks.findFirst({
      where: {
        OR: [
          {
            sender_profile_id: currentUserId,
            sender_profile_type: currentUserType,
            receiver_profile_id: parseInt(studentId),
            receiver_profile_type: "student",
          },
          {
            sender_profile_id: parseInt(studentId),
            sender_profile_type: "student",
            receiver_profile_id: currentUserId,
            receiver_profile_type: currentUserType,
          },
        ],
      },
    });

    res.json({ success: true, status: ping?.status || "none" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to check ping status",
      error: error.message,
    });
  }
});

router.get("/connected", authMiddleware, async (req, res) => {
  try {
    const studentId = req.user.id;

    // Fetch all accepted connections where the user is sender or receiver
    const connections = await prisma.ping_networks.findMany({
      where: {
        status: "accepted",
        OR: [
          { sender_profile_id: studentId },
          { receiver_profile_id: studentId },
        ],
      },
      orderBy: { accepted_at: "desc" },
    });

    const map = new Map();

    for (const conn of connections) {
      // Get the "other" user's id in the connection
      const otherId =
        conn.sender_profile_id === studentId
          ? conn.receiver_profile_id
          : conn.sender_profile_id;

      if (map.has(otherId)) continue;

      // Fetch the other user's profile info
      const user = await prisma.student.findUnique({
        where: { id: otherId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
          headline: true,
        },
      });

      if (user) {
        map.set(otherId, {
          ...conn,
          user,
        });
      }
    }

    // Convert Map to array and return
    res.json({
      success: true,
      data: Array.from(map.values()),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get(
  "/connection-count/:studentId?",
  authMiddleware,
  async (req, res) => {
    try {
      const studentId = req.params.studentId
        ? parseInt(req.params.studentId)
        : req.user.id;

      if (!studentId || isNaN(studentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid student ID",
        });
      }

      // 1️⃣ Fetch accepted connections
      const connections = await prisma.ping_networks.findMany({
        where: {
          status: "accepted",
          OR: [
            {
              sender_profile_id: studentId,
              sender_profile_type: "student",
            },
            {
              receiver_profile_id: studentId,
              receiver_profile_type: "student",
            },
          ],
        },
        select: {
          sender_profile_id: true,
          receiver_profile_id: true,
        },
      });

      // 2️⃣ Deduplicate by OTHER USER
      const uniqueConnections = new Set();

      for (const conn of connections) {
        const otherUserId =
          conn.sender_profile_id === studentId
            ? conn.receiver_profile_id
            : conn.sender_profile_id;

        uniqueConnections.add(otherUserId);
      }

      res.json({
        success: true,
        count: uniqueConnections.size,
      });
    } catch (error) {
      console.error("Error fetching connection count:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch connection count",
      });
    }
  }
);

// //notification
router.get("/notifications", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch accepted notifications
    const notifications = await prisma.ping_networks.findMany({
      where: { receiver_profile_id: userId, status: "accepted" },
      select: {
        id: true,
        sender_profile_id: true,
        sender_profile_type: true,
        accepted_at: true,
        read: true,
      },
      orderBy: { accepted_at: "desc" },
    });

    // Fetch sender names based on type
    const data = await Promise.all(
      notifications.map(async (n) => {
        let senderName = "Unknown";

        switch (n.sender_profile_type) {
          case "student":
            const student = await prisma.student.findUnique({
              where: { id: n.sender_profile_id },
            });
            if (student)
              senderName = `${student.firstName} ${student.lastName}`;
            break;
          case "college":
            const college = await prisma.college.findUnique({
              where: { id: n.sender_profile_id },
            });
            if (college) senderName = college.name;
            break;
          case "startup":
            const startup = await prisma.startup.findUnique({
              where: { id: n.sender_profile_id },
            });
            if (startup) senderName = startup.name;
            break;
          case "industry":
            const industry = await prisma.industry.findUnique({
              where: { id: n.sender_profile_id },
            });
            if (industry) senderName = industry.name;
            break;
        }

        return {
          id: n.id,
          sender_name: senderName,
          sender_profile_type: n.sender_profile_type,
          accepted_at: n.accepted_at,
          read: n.read,
        };
      })
    );

    res.json({ success: true, data });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch notifications" });
  }
});

router.post("/notifications/mark-read", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.ping_networks.updateMany({
      where: { receiver_profile_id: userId, status: "accepted", read: false },
      data: { read: true },
    });

    res.json({ success: true, message: "Notifications marked as read" });
  } catch (error) {
    console.error("Failed to mark notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read",
    });
  }
});

router.post("/notifications/mark-read", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: { receiver_id: userId, read: false },
      data: { read: true },
    });

    res.json({ success: true, message: "Notifications marked as read" });
  } catch (error) {
    console.error("Failed to mark notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read",
    });
  }
});

// Routes
router.get("/profile", auth, getStudentProfile);
router.get("/:id", auth, getStudentById);
router.get("/:id/additional-info", auth, getStudentAdditionalInfo);
router.put("/:id/additional-info", auth, updateStudentAdditionalInfo);
router.put("/basic-info", auth, updateBasicInfo);
router.put("/about", auth, updateAbout);
router.post("/experience", auth, addExperience);
router.post("/projects", auth, addProject);
router.post("/education", auth, addEducation);
router.post("/skills", auth, addSkill);
router.put("/skills/:id", auth, updateSkill);
router.delete("/skills/:id", auth, deleteSkill);
router.post("/courses", auth, addCourse);
router.delete("/courses/:id", auth, deleteCourse);
router.post("/certifications", auth, addCertification);
router.post("/recommendations", auth, addRecommendation);
router.put("/recommendations/:id", auth, updateRecommendation);
router.delete("/recommendations/:id", auth, deleteRecommendation);

//profileimage

router.post("/update-cover-pic", authMiddleware, async (req, res) => {
  try {
    console.log("💾 Updating cover picture");

    const { coverPicture } = req.body;
    const studentId = req.user.id;

    if (!coverPicture) {
      return res.status(400).json({
        success: false,
        message: "No URL provided",
      });
    }

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: { coverPicture },
    });

    console.log("✅ Cover picture updated");

    res.json({
      success: true,
      data: { coverPicture: updated.coverPicture },
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post("/update-profile-pic", authMiddleware, async (req, res) => {
  try {
    console.log("💾 Updating profile picture");

    const { profilePicture } = req.body;
    const studentId = req.user.id;

    if (!profilePicture) {
      return res.status(400).json({
        success: false,
        message: "No URL provided",
      });
    }

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: { profilePicture },
    });

    console.log("✅ Profile picture updated");

    res.json({
      success: true,
      data: { profilePicture: updated.profilePicture },
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

const removeProfileImage = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.user.id },
      select: { id: true, profilePicture: true },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (!student.profilePicture) {
      return res.status(400).json({
        success: false,
        message: "No profile image to remove",
      });
    }

    // Extract filename from URL
    const filename = student.profilePicture.split("/").pop();
    const filePath = path.join(
      process.env.PUBLIC_UPLOAD_DIR || "/var/www/scaips_uploads",
      filename
    );

    // Delete file from disk if exists
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log("✅ File deleted from disk:", filename);
      } catch (fileError) {
        console.warn("⚠️ Could not delete file:", fileError.message);
        // Continue even if file deletion fails
      }
    }

    // Update DB record
    await prisma.student.update({
      where: { id: req.user.id },
      data: { profilePicture: null },
    });

    res.json({
      success: true,
      message: "Profile image removed successfully",
    });
  } catch (error) {
    console.error("Remove profile image error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while removing profile image",
    });
  }
};
const removeCoverImage = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.user.id },
      select: { id: true, coverPicture: true },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (!student.coverPicture) {
      return res.status(400).json({
        success: false,
        message: "No cover image to remove",
      });
    }

    // Extract filename from URL
    const filename = student.coverPicture.split("/").pop();
    const filePath = path.join(
      process.env.PUBLIC_UPLOAD_DIR || "/var/www/scaips_uploads",
      filename
    );

    // Delete file from disk if exists
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log("✅ File deleted from disk:", filename);
      } catch (fileError) {
        console.warn("⚠️ Could not delete file:", fileError.message);
        // Continue even if file deletion fails
      }
    }

    // Update DB record
    await prisma.student.update({
      where: { id: req.user.id },
      data: { coverPicture: null },
    });

    res.json({
      success: true,
      message: "Cover image removed successfully",
    });
  } catch (error) {
    console.error("Remove cover image error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while removing cover image",
    });
  }
};

// // Register routes
// router.delete("/profile-image", authMiddleware, removeProfileImage);
// router.delete("/cover-image", authMiddleware, removeCoverImage);

// OR use POST if you prefer (as your frontend uses POST)
router.post("/remove-profile-pic", authMiddleware, removeProfileImage);
router.post("/remove-cover-pic", authMiddleware, removeCoverImage);

router.post("/check-google-user", checkGoogleUser);
function studentSelectFields() {
  return {
    id: true,
    firstName: true,
    username: true,
    lastName: true,
    email: true,
    contactNo: true,
    collegeName: true,
    interestedField: true,
    location: true,
    headline: true,
    otherField: true,
    profilePicture: true,
    coverPicture: true,
    isActive: true,
    isEmailVerified: true,
    lastLogin: true,
    loginCount: true,
    createdAt: true,
    updatedAt: true,
    githubUrl: true,
    linkedinUrl: true,
  };
}

// router.post(
//   "/profile-image",
//   auth,
//   upload.single("profile_picture"),
//   uploadProfileImage
// );
// router.post(
//   "/cover-image",
//   auth,
//   upload.single("cover_picture"),
//   uploadCoverImage
// );

export default router;
