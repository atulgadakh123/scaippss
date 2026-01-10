// backend/routes/notifications.js
import { Router } from "express";
import {
  subscribe,
  unsubscribe,
  listSubscriptions,
  sendNotification,
} from "../controllers/notificationsController.js";

const router = Router();

router.post("/subscribe", subscribe);
router.post("/unsubscribe", unsubscribe);

// Public send (no authentication as requested)
router.post("/send", sendNotification);

// Optional: list subscribers (also public — be careful in prod)
router.get("/list", listSubscriptions);

export default router;
