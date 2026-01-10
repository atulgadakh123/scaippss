// const jwt = require("jsonwebtoken");
// const prisma = require("../config/prisma");

// // ---------------- AUTH ---------------- //
// const auth = async (req, res, next) => {
//   try {
//     const token = req.cookies?.token;

//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         message: "No token provided, authorization denied",
//       });
//     }

//     let decoded;

//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET);
//     } catch (err) {
//       return res.status(401).json({ success: false, message: "Invalid token" });
//     }

//     let user = null;
//     let role = null;

//     // Check Student
//     user = await prisma.student.findUnique({
//       where: { id: decoded.id },
//       select: {
//         id: true,
//         firstName: true,
//         lastName: true,
//         email: true,
//         profilePicture: true,
//         isActive: true,
//       },
//     });

//     if (user) role = "student";

//     // Check College
//     if (!user) {
//       user = await prisma.college.findUnique({
//         where: { id: decoded.id },
//         select: {
//           id: true,
//           name: true,
//           email: true,
//           logoUrl: true,
//           isActive: true,
//         },
//       });

//       if (user) role = "college";
//     }

//     if (!user) {
//       return res.status(401).json({ success: false, message: "User not found" });
//     }

//     if (user.isActive === false) {
//       return res.status(403).json({ success: false, message: "Account deactivated" });
//     }

//     req.user = { ...user, role };
//     next();
//   } catch (err) {
//     console.error("Auth error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// // ---------------- ROLE AUTHORIZATION ---------------- //
// const authorize = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied: insufficient permissions",
//       });
//     }
//     next();
//   };
// };

// // ---------------- OPTIONAL AUTH ---------------- //
// const optionalAuth = async (req, res, next) => {
//   try {
//     const token = req.cookies?.token;
//     if (!token) return next(); // No user → continue

//     let decoded;

//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET);
//     } catch (err) {
//       return next(); // Token invalid but not required
//     }

//     let user = await prisma.student.findUnique({ where: { id: decoded.id } });
//     if (!user) user = await prisma.college.findUnique({ where: { id: decoded.id } });

//     if (user) req.user = user;
//     next();
//   } catch (err) {
//     next();
//   }
// };

// module.exports = {
//   auth,
//   authorize,
//   optionalAuth,
// };

import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";

// ---------------- AUTH ---------------- //
export const auth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided, authorization denied",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    let user = null;
    let role = null;

    // Check Student
    user = await prisma.student.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profilePicture: true,
        isActive: true,
      },
    });

    if (user) role = "student";

    // Check College
    if (!user) {
      user = await prisma.college.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          name: true,
          email: true,
          logoUrl: true,
          isActive: true,
        },
      });

      if (user) role = "college";
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Account deactivated",
      });
    }

    req.user = { ...user, role };
    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---------------- ROLE AUTHORIZATION ---------------- //
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: insufficient permissions",
      });
    }
    next();
  };
};

// ---------------- OPTIONAL AUTH ---------------- //
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return next(); // Not logged in

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(); // Token invalid but optional
    }

    let user =
      (await prisma.student.findUnique({ where: { id: decoded.id } })) ||
      (await prisma.college.findUnique({ where: { id: decoded.id } }));

    if (user) req.user = user;

    next();
  } catch (err) {
    next();
  }
};
