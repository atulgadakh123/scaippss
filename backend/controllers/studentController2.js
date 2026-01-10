import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import redis from "../config/redis.js";

// POST /api/auth/check-google-user
export const checkGoogleUser = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.student.findUnique({ where: { email } });
    res.json({ exists: !!user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Experience
export const createExperience = async (req, res) => {
  try {
    const experience = await prisma.student_experience.create({
      data: {
        student_id: parseInt(req.body.student_id),
        title: req.body.title,
        company: req.body.company,
        employment_type: req.body.employment_type,
        currently_working: req.body.currently_working,
        start_date: req.body.start_date ? new Date(req.body.start_date) : null,
        end_date: req.body.end_date ? new Date(req.body.end_date) : null,
        location: req.body.location,
        description: req.body.description,
      },
    });
    res.json(experience);
  } catch (error) {
    console.error("Error creating experience:", error);
    res.status(500).json({ error: "Server error while creating experience" });
  }
};

export const getExperienceByStudent = async (req, res) => {
  try {
     const studentId = req.params.studentId;
    const key = `experience:${studentId}`;

    const cached = await redis.get(key);
    if (cached) return res.json(JSON.parse(cached));

    const experiences = await prisma.student_experience.findMany({
      where: { student_id: parseInt(req.params.studentId) },
      orderBy: { id: "desc" },
    });
    
    await redis.set(key, JSON.stringify(experiences), "EX", 300);
    res.json(experiences);
  } catch (error) {
    console.error("Error fetching experience:", error);
    res.status(500).json({ error: "Server error while fetching experience" });
  }
};

export const updateExperience = async (req, res) => {
  try {
    const experience = await prisma.student_experience.update({
      where: { id: parseInt(req.params.id) },
      data: {
        title: req.body.title,
        company: req.body.company,
        employment_type: req.body.employment_type,
        currently_working: req.body.currently_working,
        start_date: req.body.start_date ? new Date(req.body.start_date) : null,
        end_date: req.body.end_date ? new Date(req.body.end_date) : null,
        location: req.body.location,
        description: req.body.description,
      },
    });
    await redis.del(`experience:${experience.student_id}`);
    res.json(experience);
  } catch (error) {
    console.error("Error updating experience:", error);
    res.status(500).json({ error: "Server error while updating experience" });
  }
};

export const deleteExperience = async (req, res) => {
  try {
    await prisma.student_experience.delete({
      where: { id: parseInt(req.params.id) },
    });
    await redis.del(`experience:${experience.student_id}`);
    res.json({ message: "Experience deleted successfully" });
  } catch (error) {
    console.error("Error deleting experience:", error);
    res.status(500).json({ error: "Server error while deleting experience" });
  }
};

// Education
export const createEducation = async (req, res) => {
  try {
    const {
      institution,
      degree,
      field_of_study,
      start_year,
      end_year,
      grade,
      student_id,
    } = req.body;

    const newEducation = await prisma.student_education.create({
      data: {
        student_id: parseInt(student_id),
        institution,
        degree,
        field_of_study,
        start_year: start_year ? parseInt(start_year) : null,
        end_year: end_year ? parseInt(end_year) : null,
        grade,
      },
    });
     await redis.del(`education:${edu.student_id}`);
    res.status(201).json(newEducation);
  } catch (error) {
    console.error("❌ Error creating education:", error);
    res.status(500).json({ error: "Failed to create education record" });
  }
};

export const getEducationByStudent = async (req, res) => {
  try {
    //  const { studentId } = req.params;
    const studentId = req.params.studentId;
    const key = `education:${studentId}`;

    const cached = await redis.get(key);
    if (cached) return res.json(JSON.parse(cached));
    const educationList = await prisma.student_education.findMany({
      where: { student_id: parseInt(studentId) },
      orderBy: { start_year: "desc" },
    });
     await redis.set(key, JSON.stringify(educationList), "EX", 300);
    res.json(educationList);
  } catch (error) {
    console.error("❌ Error fetching education:", error);
    res.status(500).json({ error: "Failed to fetch education records" });
  }
};

export const updateEducation = async (req, res) => {
  try {
    const { id } = req.params;
    const { institution, degree, field_of_study, start_year, end_year, grade } =
      req.body;

    const updatedEducation = await prisma.student_education.update({
      where: { id: parseInt(id) },
      data: {
        institution,
        degree,
        field_of_study,
        start_year: start_year ? parseInt(start_year) : null,
        end_year: end_year ? parseInt(end_year) : null,
        grade,
      },
    });
     await redis.del(`education:${updateEducation.student_id}`);

    res.json(updatedEducation);
  } catch (error) {
    console.error("❌ Error updating education:", error);
    res.status(500).json({ error: "Failed to update education record" });
  }
};

export const deleteEducation = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.student_education.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Education record deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting education:", error);
    res.status(500).json({ error: "Failed to delete education record" });
  }
};

//Skill
export const getStudentSkills = async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const skills = await prisma.student_skills.findMany({
      where: { student_id: studentId },
      orderBy: { id: "desc" },
    });
    res.json(skills);
  } catch (error) {
    console.error("Error fetching skills:", error);
    res.status(500).json({ message: "Error fetching skills" });
  }
};

export const createStudentSkill = async (req, res) => {
  try {
    const { student_id, skill_name } = req.body;

    const newSkill = await prisma.student_skills.create({
      data: {
        student_id: parseInt(student_id),
        skill_name,
      },
    });
    res.status(201).json(newSkill);
  } catch (error) {
    console.error("Error creating skill:", error);
    res.status(500).json({ message: "Error creating skill" });
  }
};

export const deleteStudentSkill = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.student_skills.delete({ where: { id } });
    res.json({ message: "Skill deleted successfully" });
  } catch (error) {
    console.error("Error deleting skill:", error);
    res.status(500).json({ message: "Error deleting skill" });
  }
};

// Project
export const createProject = async (req, res) => {
  try {
    const {
      student_id,
      title,
      description,
      technologies,
      project_link,
      start_date,
      end_date,
    } = req.body;

    const project = await prisma.student_projects.create({
      data: {
        student_id: Number(student_id),
        title,
        description,
        technologies,
        project_link,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
      },
    });

    res.status(201).json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
};

export const getProjects = async (req, res) => {
  try {
    const { studentId } = req.params;
    //get redis
    const key = `projects:${studentId}`;

    const cached = await redis.get(key);
    if (cached) return res.json(JSON.parse(cached));

    const projects = await prisma.student_projects.findMany({
      where: { student_id: Number(studentId) },
      orderBy: { start_date: "desc" },
    });
    await redis.set(key, JSON.stringify(projects), "EX", 300);
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      technologies,
      project_link,
      start_date,
      end_date,
    } = req.body;

    const updatedProject = await prisma.student_projects.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        technologies,
        project_link,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
      },
    });
await redis.del(`projects:${project.student_id}`);
    res.status(200).json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.student_projects.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    await redis.del(`projects:${project.student_id}`);
    res.status(500).json({ error: "Failed to delete project" });
  }
};

// About
export const saveStudentAbout = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { about } = req.body;

    if (!about) {
      return res.status(400).json({
        success: false,
        message: "About field is required",
      });
    }

    const student_id = parseInt(studentId);

    const existing = await prisma.student_about.findFirst({
      where: { student_id },
    });

    let savedData;

    if (existing) {
      savedData = await prisma.student_about.update({
        where: { id: existing.id },
        data: {
          summary: about, // ✅ FIXED
        },
      });
    } else {
      savedData = await prisma.student_about.create({
        data: {
          student_id,
          summary: about, // ✅ FIXED
        },
      });
    }

    res.json({
      success: true,
      message: "About info saved successfully",
      data: savedData,
    });
  } catch (error) {
    console.error("Error saving about info:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getStudentAbout = async (req, res) => {
  try {
    const { studentId } = req.params;
   const key = `about:${studentId}`;

    const cached = await redis.get(key);
    if (cached) return res.json(JSON.parse(cached));

    const about = await prisma.student_about.findFirst({
      where: { student_id: parseInt(studentId) },
    });
  await redis.set(key, JSON.stringify(about || {}), "EX", 300);
    res.json({ success: true, data: about || {} });
  } catch (error) {
    console.error("Error fetching about info:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateStudentAbout = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { summary } = req.body;

    const existingAbout = await prisma.student_about.findFirst({
      where: { student_id: parseInt(studentId) },
    });

    let result;
    if (existingAbout) {
      // Update existing about
      result = await prisma.student_about.update({
        where: { id: existingAbout.id },
        data: { summary },
      });
    } else {
      // Create new about record
      result = await prisma.student_about.create({
        data: {
          student_id: parseInt(studentId),
          summary,
        },
      });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error updating about info:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getStudentCourses = async (req, res) => {
  try {
    const { studentId } = req.query;
    //get redis
    const key = `courses:${studentId}`;

    const cached = await redis.get(key);
    if (cached) return res.json(JSON.parse(cached));
    const courses = await prisma.student_courses.findMany({
      where: { student_id: parseInt(studentId) },
    });
     await redis.set(key, JSON.stringify(courses), "EX", 300);
    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
};

// course
export const createStudentCourse = async (req, res) => {
  try {
    const { studentId, course_name, provider, completion_date } = req.body;
    const parsedDate = completion_date ? new Date(completion_date) : null;
    const course = await prisma.student_courses.create({
      data: {
        student_id: parseInt(studentId),
        course_name,
        provider,
        completion_date: parsedDate,
      },
    });
    res.json(course);
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ error: "Failed to create course" });
  }
};

export const updateStudentCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { course_name, provider, completion_date } = req.body;

    const course = await prisma.student_courses.update({
      where: { id: parseInt(id) },
      data: {
        course_name,
        provider,
        completion_date,
      },
    });

    res.json(course);
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ error: "Failed to update course" });
  }
};

export const deleteStudentCourse = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.student_courses.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ error: "Failed to delete course" });
  }
};

// ===================== Certifications =====================

export const getStudentCertifications = async (req, res) => {
  const { studentId } = req.query;
  try {
    //get redis
    const key = `certification:${studentId}`;

    const cached = await redis.get(key);
    if (cached) return res.json(JSON.parse(cached));
    const certifications = await prisma.student_certifications.findMany({
      where: { student_id: parseInt(studentId) },
      orderBy: { issue_date: "desc" },
    });
     await redis.set(key, JSON.stringify(certifications), "EX", 300);
    res.json(certifications);
  } catch (error) {
    console.error("Error fetching certifications:", error);
    res
      .status(500)
      .json({ error: "Server error while fetching certifications" });
  }
};

export const createCertification = async (req, res) => {
  const {
    studentId,
    certificate_name,
    issuing_organization,
    issue_date,

    credential_id,
    credential_url,
  } = req.body;
  try {
    const certification = await prisma.student_certifications.create({
      data: {
        student_id: parseInt(studentId),
        certificate_name,
        issuing_organization,
        issue_date: issue_date ? new Date(issue_date) : null,

        credential_id,
        credential_url,
      },
    });
    res.json(certification);
  } catch (error) {
    console.error("Error creating certification:", error);
    res
      .status(500)
      .json({ error: "Server error while creating certification" });
  }
};

export const updateCertification = async (req, res) => {
  const { id } = req.params;
  const {
    certificate_name,
    issuing_organization,
    issue_date,

    credential_id,
    credential_url,
  } = req.body;

  try {
    const updatedCertification = await prisma.student_certifications.update({
      where: { id: parseInt(id) },
      data: {
        certificate_name,
        issuing_organization,
        issue_date: issue_date ? new Date(issue_date) : null,

        credential_id,
        credential_url,
      },
    });
    res.json(updatedCertification);
  } catch (error) {
    console.error("Error updating certification:", error);
    res
      .status(500)
      .json({ error: "Server error while updating certification" });
  }
};

export const deleteCertification = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.student_certifications.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Certification deleted successfully" });
  } catch (error) {
    console.error("Error deleting certification:", error);
    res
      .status(500)
      .json({ error: "Server error while deleting certification" });
  }
};
