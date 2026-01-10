// import jwt from "jsonwebtoken";

// // Middleware to authenticate user
// export const authMiddleware = (req, res, next) => {
//   // 1️⃣ Get token from cookie
//   let token = req.cookies?.token;

//   // 2️⃣ Fallback: get token from Authorization header
//   if (!token && req.headers.authorization?.startsWith("Bearer ")) {
//     token = req.headers.authorization.split(" ")[1];
//   }

//   if (!token) {
//     console.log("❌ No token found");
//     return res.status(401).json({ message: "Not authenticated" });
//   }

//   try {
//     // 3️⃣ Verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     console.log("✅ Decoded JWT:", decoded);

//     // 4️⃣ Attach user to request
//     req.user = {
//       id: decoded.id,
//       email: decoded.email,
//       role: decoded.role || "student", // optional
//     };
//     console.log("➡️ req.user:", req.user);

//     next();
//   } catch (err) {
//     console.error("❌ JWT Error:", err.message);
//     return res.status(403).json({ message: "Invalid or expired token" });
//   }
// };

// import jwt from "jsonwebtoken";

// export const authMiddleware = (req, res, next) => {
//   try {
//     console.log("🔍 Auth Middleware called");
//     console.log("🔍 All cookies:", req.cookies);

//     const token = req.cookies.token;

//     console.log("🔍 Token:", token ? "Found ✅" : "Not Found ❌");

//     if (!token) {
//       console.log("❌ No token found in cookies");
//       return res.status(401).json({
//         success: false,
//         message: "No token found - Please login"
//       });
//     }

//     // Verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     console.log("✅ Token verified, decoded:", decoded);

//     // Attach user info to request
//     req.user = {
//       id: decoded.id,
//       email: decoded.email,
//     };

//     console.log("✅ req.user set:", req.user);

//     next();
//   } catch (error) {
//     console.error("❌ Auth Middleware Error:", error.message);

//     if (error.name === "JsonWebTokenError") {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid token"
//       });
//     }

//     if (error.name === "TokenExpiredError") {
//       return res.status(401).json({
//         success: false,
//         message: "Token expired - Please login again"
//       });
//     }

//     return res.status(401).json({
//       success: false,
//       message: "Authentication failed"
//     });
//   }
// };
import jwt from "jsonwebtoken";
import redis from "../config/redis.js";
export const authMiddleware = async(req, res, next) => {
  try {
    const token = req.cookies.token || req.cookies.adminToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token found - Please login",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET_KEY");
      //redis session verify
      const session = await redis.get(`auth:user:${decoded.id}`);

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session expired - Please login again",
      });
    }
    // Attach admin info to request
    req.user = {
      id: decoded.id,
      role: decoded.role || 'student', // ✅ Just added this fallback
    };
    console.log("✅ req.user set:", req.user);

    next();
  } catch (error) {
    console.error("❌ Auth Middleware Error:", error.message);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired" });
    }
    return res
      .status(401)
      .json({ success: false, message: "Authentication failed" });
  }
};
