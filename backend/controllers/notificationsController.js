
import webpush from "web-push";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:graminpoly123@gmail.com";

webpush.setVapidDetails(subject, publicKey, privateKey);

// Save subscription
export const subscribe = async (req, res) => {
  try {
    const { subscription, studentId } = req.body;

    if (!subscription?.endpoint) {
      return res.status(400).json({ error: "Invalid subscription payload" });
    }

    const p256dh = subscription.keys?.p256dh || null;
    const auth = subscription.keys?.auth || null;

    // Check if user already has a subscription
    const existing = await prisma.pushSubscription.findFirst({
      where: { userId: Number(studentId) },
    });

    let saved;

    if (existing) {
      // UPDATE existing row
      saved = await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: {
          endpoint: subscription.endpoint,
          p256dh,
          auth,
          updatedAt: new Date(),
        },
      });
    } else {
      // CREATE a new row
      saved = await prisma.pushSubscription.create({
        data: {
          endpoint: subscription.endpoint,
          p256dh,
          auth,
          userId: Number(studentId),
        },
      });
    }

    return res.json({ success: true, saved });
  } catch (err) {
    console.error("subscribe error", err);
    return res.status(500).json({ error: "Failed to save subscription" });
  }
};

// Remove subscription
export const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ error: "Missing endpoint" });
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    res.json({ success: true });
  } catch (err) {
    console.error("unsubscribe error", err);
    res.status(500).json({ error: "Failed to remove subscription" });
  }
};

// List all subscriptions (useful for debugging)
export const listSubscriptions = async (req, res) => {
  try {
    const subs = await prisma.pushSubscription.findMany();
    res.json(subs);
  } catch (err) {
    console.error("listSubscriptions error", err);
    res.status(500).json({ error: "Failed to list subscriptions" });
  }
};

// Send notification to ALL subscribers (customizable title/body/url/data)
export const sendNotification = async (req, res) => {
  try {
    const { title, body, url, data } = req.body;

    const payload = JSON.stringify({
      title: title || "Update",
      body: body || "We have an update for you.",
      url: url || "/",
      data: data || {},
    });

    const subs = await prisma.pushSubscription.findMany();

    const results = await Promise.allSettled(
      subs.map(async (s) => {
        const subscription = {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        };

        try {
          await webpush.sendNotification(subscription, payload);
          return { endpoint: s.endpoint, status: "ok" };
        } catch (err) {
          // cleanup stale subscriptions
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            await prisma.pushSubscription.deleteMany({
              where: { endpoint: s.endpoint },
            });
          }
          return {
            endpoint: s.endpoint,
            status: "failed",
            error: err?.body || err?.message,
          };
        }
      })
    );

    res.json({ total: subs.length, results });
  } catch (err) {
    console.error("sendNotification error", err);
    res.status(500).json({ error: "Failed to send notifications" });
  }
};
