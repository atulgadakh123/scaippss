import v8 from "v8";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import puppeteer from "puppeteer";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import prisma from "./config/prisma.js";
import notificationsRouter from "./routes/notifications.js";

// Load environment variables FIRST
dotenv.config();

// ✅ Debug: Log environment variables
console.log('=================================');
console.log('📋 Environment Variables Check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- MEDIA_STORAGE_PATH:', process.env.MEDIA_STORAGE_PATH);
console.log('- API_BASE_URL:', process.env.API_BASE_URL);
console.log('=================================');

// 🧠 Memory management (only in production)
if (process.env.NODE_ENV === "production") {
  v8.setFlagsFromString("--max_old_space_size=1024");

  process.on("SIGINT", async () => {
    console.log("Received SIGINT, shutting down gracefully...");
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("Received SIGTERM, shutting down gracefully...");
    await prisma.$disconnect();
    process.exit(0);
  });
}

const app = express();
app.set("trust proxy", 1);

// ================== Import Routes ==================
import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";
import admin from "./routes/admin.js";
import networkRoutes from "./routes/networkRoutes.js";
import studentRoutes from "./routes/studentsroutes.js";
import customRoutes from "./routes/customRoutes.js";
import searchRoutes from "./routes/search.js";
import simpleUploadRoutes from "./routes/simpleUploadRoutes.js";

// ================== Import Middleware ==================
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

import multer from "multer";
import { checkImageModeration } from "./services/imageModeration.js";
import { checkTextModeration } from "./services/contentModeration.js";
import { fetchLatestNews } from "./services/newsService.js";

// ================== Security Middleware ==================
app.use(helmet());

// ================== Preflight CORS ==================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://scaipsfrontend.vercel.app",
  "https://www.scaips.in",
  process.env.FRONTEND_URL,
].filter(Boolean);

// ================== Preflight OPTIONS for all routes ==================
app.options(
  "*",
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// ================== Global CORS ==================
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (/^https:\/\/scaips.*\.vercel\.app$/.test(origin))
        return callback(null, true);

      console.log("❌ CORS blocked origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ================== Logging & Parsing ==================
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ================== Rate Limiting ==================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.method === "OPTIONS" || process.env.NODE_ENV === "development",
});

const apiLimiter = rateLimit({
  windowMs:
    parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 1000,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const isGoogleAuth =
      req.path.includes("/auth/google") ||
      req.path.includes("/auth/registerWithGoogle") ||
      req.path.includes("/auth/loginWithGoogle");
    return (
      req.method === "OPTIONS" ||
      process.env.NODE_ENV === "development" ||
      isGoogleAuth ||
      req.path.startsWith("/api/uploads") ||
      req.path.startsWith("/api/simple") ||
      req.path.startsWith("/media") // ✅ Skip rate limit for media files
    );
  },
});

const moderationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

app.post(
  "/api/moderate/content",
  moderationLimiter,
  upload.single("image"),
  async (req, res) => {
    try {
      const { text } = req.body;
      const image = req.file;

      let textResult = { isSafe: true };
      if (text?.trim()) {
        textResult = await checkTextModeration(text);
      }

      let imageResult = { isSafe: true };
      if (image) {
        imageResult = await checkImageModeration(image);
      }

      if (!textResult.isSafe) {
        return res.status(400).json({
          success: false,
          isSafe: false,
          reason: textResult.reason || "Unsafe text detected",
          text: textResult,
        });
      }

      if (!imageResult.isSafe) {
        return res.status(400).json({
          success: false,
          isSafe: false,
          reason: imageResult.reason,
          image: imageResult,
        });
      }

      res.json({
        success: true,
        isSafe: true,
        text: textResult,
        image: imageResult,
      });
    } catch (err) {
      console.error("Moderation error:", err);
      res.status(500).json({
        success: false,
        isSafe: false,
        reason: "Moderation service error",
      });
    }
  }
);

// ================== Media Storage Configuration ==================
// ✅ Configure media storage path from environment or default
// ================== Media Storage Configuration ==================
// ================== Media Storage Configuration ==================
const MEDIA_STORAGE_PATH = process.env.MEDIA_STORAGE_PATH || 
  path.join(process.env.HOME || process.cwd(), 'media_uploads');

if (!fs.existsSync(MEDIA_STORAGE_PATH)) {
  console.log('📁 Creating media storage directory:', MEDIA_STORAGE_PATH);
  fs.mkdirSync(MEDIA_STORAGE_PATH, { recursive: true });
  console.log('✅ Media storage directory created');
}

console.log('📁 Media Storage Path:', MEDIA_STORAGE_PATH);

// ✅ Custom middleware to add CORS headers before static middleware
const addCorsHeaders = (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
  
  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  
  next();
};

// ✅ Serve NEW media files at /media route with CORS
app.use("/media", addCorsHeaders, express.static(MEDIA_STORAGE_PATH, {
  maxAge: "30d",
  etag: true,
  index: false,
  dotfiles: "ignore",
}));

// ✅ BACKWARD COMPATIBILITY: Serve old /uploads/posts URLs with CORS
app.use("/uploads/posts", addCorsHeaders, express.static(
  path.join(MEDIA_STORAGE_PATH, "posts"), 
  {
    maxAge: "30d",
    etag: true,
    index: false,
    dotfiles: "ignore",
  }
));

console.log('✅ Serving media files from /media and /uploads/posts routes');

//============check health nginx==========
app.get("/", (req, res) => {
  res.json({
    message: "Backend working",
    container: process.env.HOSTNAME
  });
});

// ================== Legacy Upload Directory ==================
app.use(
  "/uploads",
  express.static("uploads", {
    maxAge: "1d",
    etag: false,
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    },
  })
);

app.get("/api/news", async (req, res) => {
  try {
    const data = await fetchLatestNews();
    res.json(data);
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// ================== Health Check ==================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "SCAIPS Backend API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mediaStoragePath: MEDIA_STORAGE_PATH,
  });
});

// ================== File Upload Static Path ==================
const UPLOAD_DIR =
  process.env.PUBLIC_UPLOAD_DIR ||
  path.join(process.env.HOME || process.cwd(), "scaips-uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log("✅ Created upload directory:", UPLOAD_DIR);
}

console.log("📁 Serving static files from:", UPLOAD_DIR);

app.use(
  "/api/uploads",
  express.static(UPLOAD_DIR, {
    maxAge: "1d",
    etag: false,
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    },
  })
);

// ================== Apply Rate Limiters ==================
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/", apiLimiter);

// ================== Apply Routes ==================
app.use("/uploads", express.static("uploads"));
app.use("/api/search-users", searchRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/custom", customRoutes);
app.use("/api/simple", simpleUploadRoutes);
app.use("/api/notifications", notificationsRouter);
app.use("/api/network", networkRoutes);
app.use("/api/admin", admin);

// ================== Puppeteer PDF ==================
app.get("/api/generate-pdf", async (req, res) => {
  const { url, theme = "light" } = req.query;
  if (!url) return res.status(400).send("URL is required");

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.evaluate((theme) => {
      localStorage.setItem("theme", theme);
    }, theme);
    await page.reload({ waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=portfolio.pdf");
    res.end(pdf);
  } catch (err) {
    console.error("PDF Error:", err);
    res.status(500).send("Error creating PDF: " + err.message);
  }
});

// ================== Debug Route ==================
app.get("/api/debug/routes", (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods).join(", "),
      });
    } else if (middleware.name === "router") {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods).join(", "),
          });
        }
      });
    }
  });
  res.json({ totalRoutes: routes.length, routes });
});

// ================== Default Welcome ==================
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to SCAIPS Backend API",
    version: "1.0.0",
    documentation: "/api/docs",
    health: "/health",
  });
});

// ================== Error Handling ==================
app.use(notFound);
app.use(errorHandler);

// ================== Database Connection ==================
const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("🐘 Prisma Connected to PostgreSQL Successfully");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

// ================== Start Server ==================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log('=================================');
      console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
      console.log(`📁 Media files: http://localhost:${PORT}/media/`);
      console.log('=================================');
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// ================== Error & Exit Handling ==================
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  prisma.$disconnect().then(() => {
    console.log("Database connection closed");
    process.exit(0);
  });
});

startServer();

export default app;
