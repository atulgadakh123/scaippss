import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import redis from "../config/redis.js"
// import { json } from "body-parser";

// ✅ Create Achievement
export const createAchievement = async (req, res) => {
  try {
    const { title, description, date, tag, studentId } = req.body;

    const achievement = await prisma.student_achivements.create({
      data: {
        title,
        description,
        date: new Date(date),
        tag,
        students: {
          connect: { id: studentId }, // ✅ Correct way to link an existing student
        },
      },
    });
           //redis 
     await redis.del("achievements:all")

    res.status(201).json(achievement);
  } catch (error) {
    console.error("Error creating achievement:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Get all Achievements
export const getAchievements = async (req, res) => {
  try {
        //redis
    const cashed=await redis.get("achievements:all")

    if(cashed){
      return res.json(JSON.parse(cashed))
    }

    const achievements = await prisma.student_achivements.findMany({
      orderBy: { createdAt: "desc" },
    });
         //redis
    await redis.set(
     "achievements:all",
      JSON.stringify(achievements),
      "EX",
      300 // 5 minites
    )
    res.json(achievements);
  } catch (error) {
    console.error("Error fetching achievements:", error);
    res.status(500).json({ error: "Error fetching achievements" });
  }
};

// ✅ Update Achievement
export const updateAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, tag } = req.body;
    const updatedAchievement = await prisma.student_achivements.update({
      where: { id: Number(id) },
      data: { title, description, date: new Date(date), tag },
    });
      //redis connected
    await redis.del("achievements:all")
    res.json(updatedAchievement);
  } catch (error) {
    console.error("Error updating achievement:", error);
    res.status(500).json({ error: "Error updating achievement" });
  }
};

// ✅ Delete Achievement
export const deleteAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.student_achivements.delete({ where: { id: Number(id) } });

    //redis
    await redis.del("achievements:all")
    res.json({ message: "Achievement deleted successfully" });
  } catch (error) {
    console.error("Error deleting achievement:", error);
    res.status(500).json({ error: "Error deleting achievement" });
  }
};





// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();

// // ✅ Create Achievement
//  const createAchievement = async (req, res) => {
//   try {
//     const { title, description, date, tag, studentId } = req.body;

//     const achievement = await prisma.student_achivements.create({
//       data: {
//         title,
//         description,
//         date: new Date(date),
//         tag,
//         students: {
//           connect: { id: studentId }, // ✅ Correct way to link an existing student
//         },
//       },
//     });

//     res.status(201).json(achievement);
//   } catch (error) {
//     console.error("Error creating achievement:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// // ✅ Get all Achievements
//  const getAchievements = async (req, res) => {
//   try {
//     const achievements = await prisma.student_achivements.findMany({
//       orderBy: { createdAt: "desc" },
//     });
//     res.json(achievements);
//   } catch (error) {
//     console.error("Error fetching achievements:", error);
//     res.status(500).json({ error: "Error fetching achievements" });
//   }
// };

// // ✅ Update Achievement
// const updateAchievement = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { title, description, date, tag } = req.body;
//     const updatedAchievement = await prisma.student_achivements.update({
//       where: { id: Number(id) },
//       data: { title, description, date: new Date(date), tag },
//     });
//     res.json(updatedAchievement);
//   } catch (error) {
//     console.error("Error updating achievement:", error);
//     res.status(500).json({ error: "Error updating achievement" });
//   }
// };

// // ✅ Delete Achievement
//  const deleteAchievement = async (req, res) => {
//   try {
//     const { id } = req.params;
//     await prisma.student_achivements.delete({ where: { id: Number(id) } });
//     res.json({ message: "Achievement deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting achievement:", error);
//     res.status(500).json({ error: "Error deleting achievement" });
//   }
// };

// module.exports={createAchievement,deleteAchievement,updateAchievement,getAchievements}