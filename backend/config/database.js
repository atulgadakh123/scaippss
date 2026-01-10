// This file is deprecated - we now use Prisma instead of Sequelize
// Keeping for compatibility until all routes are migrated

import { prisma } from "./prisma.js";

// Legacy compatibility - redirect to Prisma
const db = {
  // For any legacy code that still references these models
  User: null, // Use prisma.student, prisma.college, etc. instead
  Student: null,
  College: null,
  sequelize: null, // Use prisma instead
  Sequelize: null,

  // Connection test function using Prisma
  testConnection: async () => {
    try {
      await prisma.$connect();
      console.log("✅ Database connection successful");
      return true;
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      return false;
    }
  },
};

// Test the connection (legacy placeholder)
const testConnection = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connection established successfully");
    return true;
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error.message);
    return false;
  }
};

// Sync database (legacy placeholder)
const syncDatabase = async (force = false) => {
  try {
    console.log(
      force
        ? "🔄 Database tables recreated successfully (simulated)"
        : "📊 Database tables synchronized successfully (simulated)"
    );
    return true;
  } catch (error) {
    console.error("❌ Database sync failed:", error.message);
    return false;
  }
};

export { db, testConnection, syncDatabase };

// // This file is deprecated - we now use Prisma instead of Sequelize
// // Keeping for compatibility until all routes are migrated

// const { prisma } = require("./prisma");

// // Legacy compatibility - redirect to Prisma
// const db = {
//   // For any legacy code that still references these models
//   User: null, // Use prisma.student, prisma.college, etc. instead
//   Student: null,
//   College: null,
//   sequelize: null, // Use prisma instead
//   Sequelize: null,

//   // Connection test function
//   testConnection: async () => {
//     try {
//       await prisma.$connect();
//       console.log("✅ Database connection successful");
//       return true;
//     } catch (error) {
//       console.error("❌ Database connection failed:", error);
//       return false;
//     }
//   },
// };

// // Test the connection
// const testConnection = async () => {
//   try {
//     await sequelize.authenticate();
//     console.log("✅ Database connection established successfully");
//     return true;
//   } catch (error) {
//     console.error("❌ Unable to connect to the database:", error.message);
//     return false;
//   }
// };

// // Sync database (create tables if they don't exist)
// const syncDatabase = async (force = false) => {
//   try {
//     await sequelize.sync({ force });
//     if (force) {
//       console.log("🔄 Database tables recreated successfully");
//     } else {
//       console.log("📊 Database tables synchronized successfully");
//     }
//     return true;
//   } catch (error) {
//     console.error("❌ Database sync failed:", error.message);
//     return false;
//   }
// };

// module.exports = {
//   ...db,
//   testConnection,
//   syncDatabase,
// };
