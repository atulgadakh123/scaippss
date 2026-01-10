import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/authMiddleware.js";
// JWT or session middleware

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/network/requests
 * Fetch pending network requests for logged-in user
 */


router.get("/requests", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role; // e.g., 'student', 'college', etc.

    const requests = await prisma.ping_networks.findMany({
      where: {
        receiver_profile_id: userId,
        receiver_profile_type: userType,
        status: "pending",
      },
      orderBy: { created_at: "desc" },
    });

    res.json({ success: true, requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch requests" });
  }
});

/**
 * POST /api/network/requests/:id/accept
 * Accept a network request
 */
router.post("/requests/:id/accept", authMiddleware, async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);

    const updated = await prisma.ping_networks.update({
      where: { id: requestId },
      data: {
        status: "accepted",
        accepted_at: new Date(),
        updated_at: new Date(),
      },
    });

    res.json({ success: true, request: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to accept request" });
  }
});

/**
 * POST /api/network/requests/:id/ignore
 * Ignore a network request
 */
router.post("/requests/:id/ignore", authMiddleware, async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);

    const updated = await prisma.ping_networks.update({
      where: { id: requestId },
      data: {
        status: "ignored",
        ignored_at: new Date(),
        updated_at: new Date(),
      },
    });

    res.json({ success: true, request: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to ignore request" });
  }
});

export default router;
