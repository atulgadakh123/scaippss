const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");

// Import consolidated controller
const studentProfileController = require("../controllers/studentController");

// About routes
router.get("/about", auth, studentProfileController.getAbout);
router.put("/about", auth, studentProfileController.updateAbout);

// Experience routes
router.get("/experience", auth, studentProfileController.getExperiences);
router.post("/experience", auth, studentProfileController.createExperience);
router.put("/experience/:id", auth, studentProfileController.updateExperience);
router.delete(
  "/experience/:id",
  auth,
  studentProfileController.deleteExperience
);

// Education routes
router.get("/education", auth, studentProfileController.getEducation);
router.post("/education", auth, studentProfileController.createEducation);
router.put("/education/:id", auth, studentProfileController.updateEducation);
router.delete("/education/:id", auth, studentProfileController.deleteEducation);

// Skills routes
router.get("/skills", auth, studentProfileController.getSkills);
router.post("/skills", auth, studentProfileController.createSkill);
router.post("/skills/batch", auth, studentProfileController.createSkills);
router.put("/skills/:id", auth, studentProfileController.updateSkill);
router.delete("/skills/:id", auth, studentProfileController.deleteSkill);

// Projects routes
router.get("/projects", auth, studentProfileController.getProjects);
router.get("/all/projects", studentProfileController.getAllProjects);
router.post("/projects", auth, studentProfileController.createProject);
router.put("/projects/:id", auth, studentProfileController.updateProject);
router.delete("/projects/:id", auth, studentProfileController.deleteProject);

// Courses routes
router.get("/courses", auth, studentProfileController.getCourses);
router.post("/courses", auth, studentProfileController.createCourse);
router.put("/courses/:id", auth, studentProfileController.updateCourse);
router.delete("/courses/:id", auth, studentProfileController.deleteCourse);

// Certifications routes
router.get("/certifications", auth, studentProfileController.getCertifications);
router.post(
  "/certifications",
  auth,
  studentProfileController.createCertification
);
router.put(
  "/certifications/:id",
  auth,
  studentProfileController.updateCertification
);
router.delete(
  "/certifications/:id",
  auth,
  studentProfileController.deleteCertification
);

// Recommendations routes
router.get(
  "/recommendations",
  auth,
  studentProfileController.getRecommendations
);
router.post(
  "/recommendations",
  auth,
  studentProfileController.createRecommendation
);
router.put(
  "/recommendations/:id",
  auth,
  studentProfileController.updateRecommendation
);
router.delete(
  "/recommendations/:id",
  auth,
  studentProfileController.deleteRecommendation
);

// Complete profile routes
router.get("/complete", auth, studentProfileController.getCompleteProfile);
router.get("/summary", auth, studentProfileController.getProfileSummary);

module.exports = router;
