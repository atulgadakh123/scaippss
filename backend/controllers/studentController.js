import { PrismaClient } from "@prisma/client";
import redis from "../config/redis.js";

const prisma = new PrismaClient();

/* ================= GOOGLE USER ================= */

export const checkGoogleUser = async (req, res) => {
  const { email } = req.body;
  try {
    const cached = await redis.get(`google_user:${email}`);
    if (cached) return res.json({ exists: JSON.parse(cached) });

    const user = await prisma.student.findUnique({ where: { email } });

    await redis.set(
      `google_user:${email}`,
      JSON.stringify(!!user),
      "EX",
      300
    );

    res.json({ exists: !!user });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
};

/* ================= EXPERIENCE ================= */

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

    await redis.del(`experience:${experience.student_id}`);
    res.json(experience);
  } catch {
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
      where: { student_id: parseInt(studentId) },
      orderBy: { id: "desc" },
    });

    await redis.set(key, JSON.stringify(experiences), "EX", 300);
    res.json(experiences);
  } catch {
    res.status(500).json({ error: "Server error while fetching experience" });
  }
};

export const updateExperience = async (req, res) => {
  try {
    const experience = await prisma.student_experience.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });

    await redis.del(`experience:${experience.student_id}`);
    res.json(experience);
  } catch {
    res.status(500).json({ error: "Server error while updating experience" });
  }
};

export const deleteExperience = async (req, res) => {
  try {
    const exp = await prisma.student_experience.delete({
      where: { id: parseInt(req.params.id) },
    });

    await redis.del(`experience:${exp.student_id}`);
    res.json({ message: "Experience deleted successfully" });
  } catch {
    res.status(500).json({ error: "Server error while deleting experience" });
  }
};

/* ================= EDUCATION ================= */

export const createEducation = async (req, res) => {
  try {
    const edu = await prisma.student_education.create({
      data: {
        student_id: parseInt(req.body.student_id),
        institution: req.body.institution,
        degree: req.body.degree,
        field_of_study: req.body.field_of_study,
        start_year: req.body.start_year
          ? parseInt(req.body.start_year)
          : null,
        end_year: req.body.end_year
          ? parseInt(req.body.end_year)
          : null,
        grade: req.body.grade,
      },
    });

    await redis.del(`education:${edu.student_id}`);
    res.json(edu);
  } catch {
    res.status(500).json({ error: "Failed to create education" });
  }
};

export const getEducationByStudent = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const key = `education:${studentId}`;

    const cached = await redis.get(key);
    if (cached) return res.json(JSON.parse(cached));

    const list = await prisma.student_education.findMany({
      where: { student_id: parseInt(studentId) },
      orderBy: { start_year: "desc" },
    });

    await redis.set(key, JSON.stringify(list), "EX", 300);
    res.json(list);
  } catch {
    res.status(500).json({ error: "Failed to fetch education" });
  }
};

export const updateEducation = async (req, res) => {
  try {
    const edu = await prisma.student_education.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });

    await redis.del(`education:${edu.student_id}`);
    res.json(edu);
  } catch {
    res.status(500).json({ error: "Failed to update education" });
  }
};

export const deleteEducation = async (req, res) => {
  try {
    const edu = await prisma.student_education.delete({
      where: { id: parseInt(req.params.id) },
    });

    await redis.del(`education:${edu.student_id}`);
    res.json({ message: "Education deleted successfully" });
  } catch {
    res.status(500).json({ error: "Failed to delete education" });
  }
};

/* ================= ABOUT (KEEP BOTH FUNCTIONS) ================= */

export const saveStudentAbout = async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);

    const about = await prisma.student_about.upsert({
      where: { student_id: studentId },
      update: { summary: req.body.about },
      create: { student_id: studentId, summary: req.body.about },
    });

    await redis.del(`about:${studentId}`);
    res.json(about);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateStudentAbout = async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);

    const about = await prisma.student_about.update({
      where: { student_id: studentId },
      data: { summary: req.body.summary },
    });

    await redis.del(`about:${studentId}`);
    res.json(about);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

export const getStudentAbout = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const key = `about:${studentId}`;

    const cached = await redis.get(key);
    if (cached) return res.json(JSON.parse(cached));

    const about = await prisma.student_about.findFirst({
      where: { student_id: parseInt(studentId) },
    });

    await redis.set(key, JSON.stringify(about || {}), "EX", 300);
    res.json(about || {});
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};
  