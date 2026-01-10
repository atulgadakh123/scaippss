// // routes/search.js
// const express = require('express');
// const router = express.Router();

// // Import the search controller
// const { searchUsers } = require('../controllers/searchController');

// // Uncomment this line if you have authentication middleware
// // const authMiddleware = require('../middleware/auth');

// // Search users route
// // If you have auth middleware, use: router.get('/users', authMiddleware, searchUsers);
// router.get('/users', searchUsers);

// // Test route to verify the route is working
// router.get('/test', (req, res) => {
//   res.json({ message: 'Search route is working!' });
// });

// module.exports = router;

// routes/search.js
import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/search-users?query=...
router.get("/", async (req, res) => {
  try {
    const query = req.query.query?.trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query is required",
        data: [],
      });
    }

    // Search across multiple tables: student, college, startup, industry
    const [students, colleges, startups, industries] = await Promise.all([
      prisma.student.findMany({
        where: {
          OR: [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { username: { contains: query, mode: "insensitive" } },
          ],
        },
        select: { id: true, firstName: true, lastName: true, username: true, profilePicture: true },
      }),
      prisma.college.findMany({
        where: { name: { contains: query, mode: "insensitive" } },
        select: { id: true, name: true, profilePicture: true },
      }),
      prisma.startup.findMany({
        where: { startupName: { contains: query, mode: "insensitive" } },
        select: { id: true, startupName: true, profilePicture: true },
      }),
      prisma.industry.findMany({
        where: { companyName: { contains: query, mode: "insensitive" } }, // corrected field
        select: { id: true, companyName: true, profilePicture: true },
      }),
    ]);

    // Map results to common structure
    const mappedResults = [
      ...students.map((s) => ({
        id: s.id,
        name:
          s.firstName || s.lastName
            ? `${s.firstName || ""} ${s.lastName || ""}`.trim()
            : s.username,
        type: "student",
        profilePicture: s.profilePicture,
      })),
      ...colleges.map((c) => ({
        id: c.id,
        name: c.name,
        type: "college",
        profilePicture: c.profilePicture,
      })),
      ...startups.map((s) => ({
        id: s.id,
        name: s.startupName,
        type: "startup",
        profilePicture: s.profilePicture,
      })),
      ...industries.map((i) => ({
        id: i.id,
        name: i.companyName, // corrected
        type: "industry",
        profilePicture: i.profilePicture,
      })),
    ];

    res.json({ success: true, data: mappedResults });
  } catch (err) {
    console.error("Search API error:", err);
    res.status(500).json({ success: false, message: "Server error", data: [] });
  }
});

export default router;
