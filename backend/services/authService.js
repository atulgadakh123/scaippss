import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import redis from "../config/redis.js";

class AuthService {
  // Generate JWT tokens
  generateTokens(userId, role) {
    const accessToken = jwt.sign({ userId, role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    });

    const refreshToken = jwt.sign(
      { userId, role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || "30d" }
    );

    return { accessToken, refreshToken };
  }

  // Hash password
  async hashPassword(password) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    return await bcrypt.hash(password, rounds);
  }

  // Verify password
  async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Get user model based on role
  getUserModel(role) {
    const models = {
      student: prisma.student,
      college: prisma.college,
      startup: prisma.startup,
      industry: prisma.industry,
    };
    return models[role.toLowerCase()];
  }

  // Register user
  async register(userData, role) {
    try {
      const model = this.getUserModel(role);
      if (!model) {
        throw new Error("Invalid role specified");
      }

      // Check if user already exists
      const existingUser = await model.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new Error("User already exists with this email");
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);

      // Prepare user data based on role
      const userToCreate = {
        email: userData.email,
        password: hashedPassword,
        googleId: userData.googleId || userData.google_id,
        githubId: userData.githubId || userData.github_id,
        profilePicture: userData.profilePicture || userData.profile_picture,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add role-specific fields
      if (role === "student") {
        userToCreate.firstName = userData.firstName || userData.first_name;
        userToCreate.lastName = userData.lastName || userData.last_name;
        userToCreate.username = userData.username || userData.username;
        userToCreate.contactNo = userData.contactNo || userData.contact_no;
        userToCreate.collegeName =
          userData.collegeName ||
          userData.student_college_name ||
          userData.college_name;
        userToCreate.interestedField =
          userData.interestedField || userData.interested_field;
        userToCreate.otherField = userData.otherField || userData.other_field;
      } else if (role === "college") {
        userToCreate.name = userData.name || userData.college_name;
        userToCreate.description = userData.description;
        userToCreate.location = userData.location || userData.college_address;
        userToCreate.established =
          userData.established || userData.establishment_year;
        // Convert to Int or null
        userToCreate.established = userToCreate.established
          ? parseInt(userToCreate.established)
          : null;

        userToCreate.website = userData.website;

        userToCreate.campusArea = userData.campusArea || userData.campus_area;
        // Convert to Decimal or null
        userToCreate.campusArea = userToCreate.campusArea
          ? parseFloat(userToCreate.campusArea)
          : null;

        userToCreate.nirfRank = userData.nirfRank || userData.nirf_rank;
        // Convert to Int or null
        userToCreate.nirfRank = userToCreate.nirfRank
          ? parseInt(userToCreate.nirfRank)
          : null;

        userToCreate.accreditation = userData.accreditation;

        userToCreate.totalStudents =
          userData.totalStudents || userData.total_students;
        // Convert to Int or null
        userToCreate.totalStudents = userToCreate.totalStudents
          ? parseInt(userToCreate.totalStudents)
          : null;

        userToCreate.totalFaculty =
          userData.totalFaculty || userData.total_faculty;
        // Convert to Int or null
        userToCreate.totalFaculty = userToCreate.totalFaculty
          ? parseInt(userToCreate.totalFaculty)
          : null;
      } else if (role === "startup") {
        userToCreate.firstName = userData.firstName || userData.first_name;
        userToCreate.lastName = userData.lastName || userData.last_name;
        userToCreate.startupName =
          userData.startupName || userData.startup_name;
        userToCreate.startupStage =
          userData.startupStage || userData.startup_stage;
        userToCreate.fundingStatus =
          userData.fundingStatus || userData.funding_status;
        userToCreate.teamSize = userData.teamSize || userData.team_size;
        userToCreate.description = userData.description;
        userToCreate.location = userData.location;
        userToCreate.website = userData.website;
        userToCreate.contactNo = userData.contactNo || userData.contact_no;
      } else if (role === "industry") {
        userToCreate.firstName = userData.firstName || userData.first_name;
        userToCreate.lastName = userData.lastName || userData.last_name;
        userToCreate.companyName =
          userData.companyName || userData.company_name;
        userToCreate.industryType =
          userData.industryType || userData.industry_type;
        userToCreate.companySize =
          userData.companySize || userData.company_size;
        userToCreate.designation = userData.designation;
        userToCreate.description = userData.description;
        userToCreate.location = userData.location;
        userToCreate.website = userData.website;
        userToCreate.contactNo = userData.contactNo || userData.contact_no;
      }

      // Create user
      const user = await model.create({
        data: userToCreate,
      });

      // Generate tokens
      const tokens = this.generateTokens(user.id, role);

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      return {
        success: true,
        user: { ...userWithoutPassword, role },
        tokens,
      };
    } catch (error) {
      console.error("Registration error:", error);
      throw new Error(error.message || "Registration failed");
    }
  }

  // Login user
  async login(email, password, role) {
    try {

      
      //  REDIS GET (block check)
    const cachedBlock = await redis.get(`login:block:${email}`);
    if (cachedBlock) {
      throw new Error("Too many failed attempts. Try later.");
    }

      const model = this.getUserModel(role);
      if (!model) {
        throw new Error("Invalid role specified");
      }

      // Find user
      const user = await model.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error("Invalid credentials");
      }

      // Check if this is a Google OAuth user (has googleId but empty/null password)
      if (user.googleId && (!user.password || user.password === "")) {
        throw new Error(
          "This account was created with Google. Please use 'Sign in with Google' to login."
        );
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error("Account is deactivated");
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(
        password,
        user.password
      );     //redis set 
      if (!isPasswordValid) {
         await redis.set(
        `login:block:${email}`,
        "blocked",
        "EX",
        900
      );

        throw new Error("Invalid credentials");
      }
      
    
      // Update login info
      await model.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
          loginCount: { increment: 1 },
        },
      });

      // Generate tokens
      const tokens = this.generateTokens(user.id, role);
       // 🔴 REDIS DEL (remove block)
    await redis.del(`login:block:${email}`);

    // 🔴 REDIS SET (cache user)
    await redis.set(
      `user:${role}:${user.id}`,
      JSON.stringify(user),
      "EX",
      3600
    );
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        user: { ...userWithoutPassword, role },
        tokens,
      };
    } catch (error) {
      console.error("Login error:", error);
      throw new Error(error.message || "Login failed");
    }
  }

  // Google OAuth login
  async loginWithGoogle(userData) {
    try {
      const { email, googleId, id } = userData;
      const finalGoogleId = googleId || id;

      if (!email || !finalGoogleId) {
        throw new Error("Email and Google ID are required");
      }

      // Try to find user in all role tables
      const roles = ["student", "college", "startup", "industry"];
      let user = null;
      let userRole = null;

      for (const role of roles) {
        const model = this.getUserModel(role);
        if (model) {
          const foundUser = await model.findFirst({
            where: {
              OR: [{ email: email }, { googleId: finalGoogleId }],
            },
          });

          if (foundUser) {
            user = foundUser;
            userRole = role;
            break;
          }
        }
      }

      if (!user) {
        // Auto-register the user as a student (default role) if they don't exist
        console.log("User not found, auto-registering as student...");
        const registrationResult = await this.registerWithGoogle(
          userData,
          "student"
        );
        return registrationResult;
      }

      // Check if this is actually a Google OAuth user
      if (!user.googleId) {
        throw new Error(
          "This account was not created with Google. Please use email/password login."
        );
      }

      // Update user's last login and login count
      const model = this.getUserModel(userRole);
      const updatedUser = await model.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
          loginCount: { increment: 1 },
          // Update profile picture if provided
          // profilePicture:
          //   userData.imageUrl ||
          //   userData.profilePicture ||
          //   userData.profile_picture ||
          //   user.profilePicture,
        },
      });

      const tokens = this.generateTokens(updatedUser.id, userRole);
      const { password, ...userWithoutPassword } = updatedUser;

      return {
        success: true,
        user: { ...userWithoutPassword, role: userRole },
        tokens,
      };
    } catch (error) {
      console.error("Google login error:", error);
      throw new Error(error.message || "Google login failed");
    }
  }

  // Get user by ID
  async getUserById(userId, role) {
    try {
       // 🔴 REDIS GET (CACHE READ)
    const cached = await redis.get(`user:${role}:${userId}`);
    if (cached) {
      return {
        success: true,
        user: { ...JSON.parse(cached), role },
      };
    }
      const model = this.getUserModel(role);
      if (!model) {
        throw new Error("Invalid role specified");
      }

      const user = await model.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
     
      await redis.set(
      `user:${role}:${userId}`,
      JSON.stringify(userWithoutPassword),
      "EX",
      3600
    );
      return {
        success: true,
        user: { ...userWithoutPassword, role },
      };
    } catch (error) {
      console.error("Get user error:", error);
      throw new Error(error.message || "Failed to get user");
    }
  }

  // Update user profile
  async updateProfile(userId, role, updateData) {
    try {
      const model = this.getUserModel(role);
      if (!model) {
        throw new Error("Invalid role specified");
      }

      // Remove sensitive fields from update data
      const { password, id, createdAt, ...safeUpdateData } = updateData;

      const user = await model.update({
        where: { id: userId },
        data: {
          ...safeUpdateData,
          updatedAt: new Date(),
        },
      }); 
      await redis.del(`user:${role}:${userId}`);


      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        user: { ...userWithoutPassword, role },
      };
    } catch (error) {
      console.error("Update profile error:", error);
      throw new Error(error.message || "Failed to update profile");
    }
  }

  // Change password
  async changePassword(userId, role, currentPassword, newPassword) {
    try {
      const model = this.getUserModel(role);
      if (!model) {
        throw new Error("Invalid role specified");
      }

      // Get current user
      const user = await model.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Verify current password
      const isCurrentPasswordValid = await this.verifyPassword(
        currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        throw new Error("Current password is incorrect");
      }

      // Hash new password
      const hashedNewPassword = await this.hashPassword(newPassword);

      // Update password
      await model.update({
        where: { id: userId },
        data: {
          password: hashedNewPassword,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        message: "Password changed successfully",
      };
    } catch (error) {
      console.error("Change password error:", error);
      throw new Error(error.message || "Failed to change password");
    }
  }

  // Google OAuth registration
  async registerWithGoogle(userData, role) {
    try {
      const model = this.getUserModel(role);
      if (!model) {
        throw new Error("Invalid role specified");
      }

      const { email, googleId, id } = userData;
      const finalGoogleId = googleId || id;

      if (!email || !finalGoogleId) {
        throw new Error(
          "Email and Google ID are required for Google registration"
        );
      }

      // Check if user already exists
      const existingUser = await model.findFirst({
        where: {
          OR: [{ email: userData.email }, { googleId: finalGoogleId }],
        },
      });

      if (existingUser) {
        // Update existing user with Google info
        const updatedUser = await model.update({
          where: { id: existingUser.id },
          data: {
            googleId: finalGoogleId,
            profilePicture:
              userData.imageUrl ||
              userData.profilePicture ||
              userData.profile_picture,
            lastLogin: new Date(),
            loginCount: { increment: 1 },
          },
        });

        const tokens = this.generateTokens(updatedUser.id, role);
        const { password, ...userWithoutPassword } = updatedUser;

        return {
          success: true,
          user: { ...userWithoutPassword, role },
          tokens,
        };
      }

      // Create new user without password (Google OAuth)
      const userToCreate = {
        email: userData.email,
        password: "", // Empty password for OAuth users
        googleId: finalGoogleId,
        profilePicture:
          userData.imageUrl ||
          userData.profilePicture ||
          userData.profile_picture,
        isEmailVerified: true, // Google emails are verified
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add role-specific fields
      if (role === "student") {
        userToCreate.firstName =
          userData.firstName ||
          userData.first_name ||
          userData.name?.split(" ")[0];
        userToCreate.lastName =
          userData.lastName ||
          userData.last_name ||
          userData.name?.split(" ").slice(1).join(" ");
        userToCreate.contactNo = userData.contactNo || userData.contact_no;
        userToCreate.username = userData.username || userData.username;
        userToCreate.collegeName =
          userData.collegeName ||
          userData.student_college_name ||
          userData.college_name;
        userToCreate.interestedField =
          userData.interestedField || userData.interested_field;
        userToCreate.otherField = userData.otherField || userData.other_field;
      } else if (role === "college") {
        userToCreate.name = userData.name || userData.college_name;
        userToCreate.description = userData.description;
        userToCreate.location = userData.location || userData.college_address;
        userToCreate.established =
          userData.established || userData.establishment_year;
        // Convert to Int or null
        userToCreate.established = userToCreate.established
          ? parseInt(userToCreate.established)
          : null;

        userToCreate.website = userData.website;

        userToCreate.campusArea = userData.campusArea || userData.campus_area;
        // Convert to Decimal or null
        userToCreate.campusArea = userToCreate.campusArea
          ? parseFloat(userToCreate.campusArea)
          : null;

        userToCreate.nirfRank = userData.nirfRank || userData.nirf_rank;
        // Convert to Int or null
        userToCreate.nirfRank = userToCreate.nirfRank
          ? parseInt(userToCreate.nirfRank)
          : null;

        userToCreate.accreditation = userData.accreditation;

        userToCreate.totalStudents =
          userData.totalStudents || userData.total_students;
        // Convert to Int or null
        userToCreate.totalStudents = userToCreate.totalStudents
          ? parseInt(userToCreate.totalStudents)
          : null;

        userToCreate.totalFaculty =
          userData.totalFaculty || userData.total_faculty;
        // Convert to Int or null
        userToCreate.totalFaculty = userToCreate.totalFaculty
          ? parseInt(userToCreate.totalFaculty)
          : null;
      } else if (role === "startup") {
        userToCreate.firstName =
          userData.firstName ||
          userData.first_name ||
          userData.name?.split(" ")[0];
        userToCreate.username =
          userData.username ||
          userData.username ||
          userData.username?.split(" ")[0];
        userToCreate.lastName =
          userData.lastName ||
          userData.last_name ||
          userData.name?.split(" ").slice(1).join(" ");
        userToCreate.startupName =
          userData.startupName || userData.startup_name;
        userToCreate.startupStage =
          userData.startupStage || userData.startup_stage;
        userToCreate.fundingStatus =
          userData.fundingStatus || userData.funding_status;
        userToCreate.teamSize = userData.teamSize || userData.team_size;
        userToCreate.description = userData.description;
        userToCreate.location = userData.location;
        userToCreate.website = userData.website;
        userToCreate.contactNo = userData.contactNo || userData.contact_no;
      } else if (role === "industry") {
        userToCreate.firstName =
          userData.firstName ||
          userData.first_name ||
          userData.name?.split(" ")[0];
        userToCreate.lastName =
          userData.lastName ||
          userData.last_name ||
          userData.name?.split(" ").slice(1).join(" ");
        userToCreate.companyName =
          userData.companyName || userData.company_name;
        userToCreate.industryType =
          userData.industryType || userData.industry_type;
        userToCreate.companySize =
          userData.companySize || userData.company_size;
        userToCreate.designation = userData.designation;
        userToCreate.description = userData.description;
        userToCreate.location = userData.location;
        userToCreate.website = userData.website;
        userToCreate.contactNo = userData.contactNo || userData.contact_no;
      }

      console.log(
        "userToCreate before model.create:",
        JSON.stringify(userToCreate, null, 2)
      );

      const user = await model.create({
        data: userToCreate,
      });

      const tokens = this.generateTokens(user.id, role);
      const { password, ...userWithoutPassword } = user;

      return {
        success: true,
        user: { ...userWithoutPassword, role },
        tokens,
      };
    } catch (error) {
      console.error("Google registration error:", error);
      throw new Error(error.message || "Google registration failed");
    }
  }

  // Check if email is associated with Google OAuth
  async isGoogleAccount(email, role) {
    try {
      const model = this.getUserModel(role);
      if (!model) {
        return false;
      }

      const user = await model.findUnique({
        where: { email },
        select: { googleId: true, password: true },
      });

      return !!(
        user &&
        user.googleId &&
        (!user.password || user.password === "")
      );
    } catch (error) {
      console.error("Check Google account error:", error);
      return false;
    }
  }
}

export default new AuthService();

// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const prisma = require("../config/prisma");

// class AuthService {
//   // Generate JWT tokens
//   generateTokens(userId, role) {
//     const accessToken = jwt.sign({ userId, role }, process.env.JWT_SECRET, {
//       expiresIn: process.env.JWT_EXPIRE || "7d",
//     });

//     const refreshToken = jwt.sign(
//       { userId, role },
//       process.env.JWT_REFRESH_SECRET,
//       { expiresIn: process.env.JWT_REFRESH_EXPIRE || "30d" }
//     );

//     return { accessToken, refreshToken };
//   }

//   // Hash password
//   async hashPassword(password) {
//     const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
//     return await bcrypt.hash(password, rounds);
//   }

//   // Verify password
//   async verifyPassword(password, hashedPassword) {
//     return await bcrypt.compare(password, hashedPassword);
//   }

//   // Get user model based on role
//   getUserModel(role) {
//     const models = {
//       student: prisma.student,
//       college: prisma.college,
//       startup: prisma.startup,
//       industry: prisma.industry,
//     };
//     return models[role.toLowerCase()];
//   }

//   // Register user
//   async register(userData, role) {
//     try {
//       const model = this.getUserModel(role);
//       if (!model) {
//         throw new Error("Invalid role specified");
//       }

//       // Check if user already exists
//       const existingUser = await model.findUnique({
//         where: { email: userData.email },
//       });

//       if (existingUser) {
//         throw new Error("User already exists with this email");
//       }

//       // Hash password
//       const hashedPassword = await this.hashPassword(userData.password);

//       // Prepare user data based on role
//       const userToCreate = {
//         email: userData.email,
//         password: hashedPassword,
//         googleId: userData.googleId || userData.google_id,
//         githubId: userData.githubId || userData.github_id,
//         profilePicture: userData.profilePicture || userData.profile_picture,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       };

//       // Add role-specific fields
//       if (role === "student") {
//         userToCreate.firstName = userData.firstName || userData.first_name;
//         userToCreate.lastName = userData.lastName || userData.last_name;
//         userToCreate.username = userData.username || userData.username;
//         userToCreate.contactNo = userData.contactNo || userData.contact_no;
//         userToCreate.collegeName =
//           userData.collegeName ||
//           userData.student_college_name ||
//           userData.college_name;
//         userToCreate.interestedField =
//           userData.interestedField || userData.interested_field;
//         userToCreate.otherField = userData.otherField || userData.other_field;
//       } else if (role === "college") {
//         userToCreate.name = userData.name || userData.college_name;
//         userToCreate.description = userData.description;
//         userToCreate.location = userData.location || userData.college_address;
//         userToCreate.established =
//           userData.established || userData.establishment_year;
//         // Convert to Int or null
//         userToCreate.established = userToCreate.established
//           ? parseInt(userToCreate.established)
//           : null;

//         userToCreate.website = userData.website;

//         userToCreate.campusArea = userData.campusArea || userData.campus_area;
//         // Convert to Decimal or null
//         userToCreate.campusArea = userToCreate.campusArea
//           ? parseFloat(userToCreate.campusArea)
//           : null;

//         userToCreate.nirfRank = userData.nirfRank || userData.nirf_rank;
//         // Convert to Int or null
//         userToCreate.nirfRank = userToCreate.nirfRank
//           ? parseInt(userToCreate.nirfRank)
//           : null;

//         userToCreate.accreditation = userData.accreditation;

//         userToCreate.totalStudents =
//           userData.totalStudents || userData.total_students;
//         // Convert to Int or null
//         userToCreate.totalStudents = userToCreate.totalStudents
//           ? parseInt(userToCreate.totalStudents)
//           : null;

//         userToCreate.totalFaculty =
//           userData.totalFaculty || userData.total_faculty;
//         // Convert to Int or null
//         userToCreate.totalFaculty = userToCreate.totalFaculty
//           ? parseInt(userToCreate.totalFaculty)
//           : null;
//       } else if (role === "startup") {
//         userToCreate.firstName = userData.firstName || userData.first_name;
//         userToCreate.lastName = userData.lastName || userData.last_name;
//         userToCreate.startupName =
//           userData.startupName || userData.startup_name;
//         userToCreate.startupStage =
//           userData.startupStage || userData.startup_stage;
//         userToCreate.fundingStatus =
//           userData.fundingStatus || userData.funding_status;
//         userToCreate.teamSize = userData.teamSize || userData.team_size;
//         userToCreate.description = userData.description;
//         userToCreate.location = userData.location;
//         userToCreate.website = userData.website;
//         userToCreate.contactNo = userData.contactNo || userData.contact_no;
//       } else if (role === "industry") {
//         userToCreate.firstName = userData.firstName || userData.first_name;
//         userToCreate.lastName = userData.lastName || userData.last_name;
//         userToCreate.companyName =
//           userData.companyName || userData.company_name;
//         userToCreate.industryType =
//           userData.industryType || userData.industry_type;
//         userToCreate.companySize =
//           userData.companySize || userData.company_size;
//         userToCreate.designation = userData.designation;
//         userToCreate.description = userData.description;
//         userToCreate.location = userData.location;
//         userToCreate.website = userData.website;
//         userToCreate.contactNo = userData.contactNo || userData.contact_no;
//       }

//       // Create user
//       const user = await model.create({
//         data: userToCreate,
//       });

//       // Generate tokens
//       const tokens = this.generateTokens(user.id, role);

//       // Remove password from response
//       const { password, ...userWithoutPassword } = user;

//       return {
//         success: true,
//         user: { ...userWithoutPassword, role },
//         tokens,
//       };
//     } catch (error) {
//       console.error("Registration error:", error);
//       throw new Error(error.message || "Registration failed");
//     }
//   }

//   // Login user
//   async login(email, password, role) {
//     try {
//       const model = this.getUserModel(role);
//       if (!model) {
//         throw new Error("Invalid role specified");
//       }

//       // Find user
//       const user = await model.findUnique({
//         where: { email },
//       });

//       if (!user) {
//         throw new Error("Invalid credentials");
//       }

//       // Check if this is a Google OAuth user (has googleId but empty/null password)
//       if (user.googleId && (!user.password || user.password === "")) {
//         throw new Error(
//           "This account was created with Google. Please use 'Sign in with Google' to login."
//         );
//       }

//       // Check if user is active
//       if (!user.isActive) {
//         throw new Error("Account is deactivated");
//       }

//       // Verify password
//       const isPasswordValid = await this.verifyPassword(
//         password,
//         user.password
//       );
//       if (!isPasswordValid) {
//         throw new Error("Invalid credentials");
//       }

//       // Update login info
//       await model.update({
//         where: { id: user.id },
//         data: {
//           lastLogin: new Date(),
//           loginCount: { increment: 1 },
//         },
//       });

//       // Generate tokens
//       const tokens = this.generateTokens(user.id, role);

//       // Remove password from response
//       const { password: _, ...userWithoutPassword } = user;

//       return {
//         success: true,
//         user: { ...userWithoutPassword, role },
//         tokens,
//       };
//     } catch (error) {
//       console.error("Login error:", error);
//       throw new Error(error.message || "Login failed");
//     }
//   }

//   // Google OAuth login
//   async loginWithGoogle(userData) {
//     try {
//       const { email, googleId, id } = userData;
//       const finalGoogleId = googleId || id;

//       if (!email || !finalGoogleId) {
//         throw new Error("Email and Google ID are required");
//       }

//       // Try to find user in all role tables
//       const roles = ["student", "college", "startup", "industry"];
//       let user = null;
//       let userRole = null;

//       for (const role of roles) {
//         const model = this.getUserModel(role);
//         if (model) {
//           const foundUser = await model.findFirst({
//             where: {
//               OR: [{ email: email }, { googleId: finalGoogleId }],
//             },
//           });

//           if (foundUser) {
//             user = foundUser;
//             userRole = role;
//             break;
//           }
//         }
//       }

//       if (!user) {
//         // Auto-register the user as a student (default role) if they don't exist
//         console.log("User not found, auto-registering as student...");
//         const registrationResult = await this.registerWithGoogle(
//           userData,
//           "student"
//         );
//         return registrationResult;
//       }

//       // Check if this is actually a Google OAuth user
//       if (!user.googleId) {
//         throw new Error(
//           "This account was not created with Google. Please use email/password login."
//         );
//       }

//       // Update user's last login and login count
//       const model = this.getUserModel(userRole);
//       const updatedUser = await model.update({
//         where: { id: user.id },
//         data: {
//           lastLogin: new Date(),
//           loginCount: { increment: 1 },
//           // Update profile picture if provided
//           // profilePicture:
//           //   userData.imageUrl ||
//           //   userData.profilePicture ||
//           //   userData.profile_picture ||
//           //   user.profilePicture,
//         },
//       });

//       const tokens = this.generateTokens(updatedUser.id, userRole);
//       const { password, ...userWithoutPassword } = updatedUser;

//       return {
//         success: true,
//         user: { ...userWithoutPassword, role: userRole },
//         tokens,
//       };
//     } catch (error) {
//       console.error("Google login error:", error);
//       throw new Error(error.message || "Google login failed");
//     }
//   }

//   // Get user by ID
//   async getUserById(userId, role) {
//     try {
//       const model = this.getUserModel(role);
//       if (!model) {
//         throw new Error("Invalid role specified");
//       }

//       const user = await model.findUnique({
//         where: { id: userId },
//       });

//       if (!user) {
//         throw new Error("User not found");
//       }

//       // Remove password from response
//       const { password, ...userWithoutPassword } = user;

//       return {
//         success: true,
//         user: { ...userWithoutPassword, role },
//       };
//     } catch (error) {
//       console.error("Get user error:", error);
//       throw new Error(error.message || "Failed to get user");
//     }
//   }

//   // Update user profile
//   async updateProfile(userId, role, updateData) {
//     try {
//       const model = this.getUserModel(role);
//       if (!model) {
//         throw new Error("Invalid role specified");
//       }

//       // Remove sensitive fields from update data
//       const { password, id, createdAt, ...safeUpdateData } = updateData;

//       const user = await model.update({
//         where: { id: userId },
//         data: {
//           ...safeUpdateData,
//           updatedAt: new Date(),
//         },
//       });

//       // Remove password from response
//       const { password: _, ...userWithoutPassword } = user;

//       return {
//         success: true,
//         user: { ...userWithoutPassword, role },
//       };
//     } catch (error) {
//       console.error("Update profile error:", error);
//       throw new Error(error.message || "Failed to update profile");
//     }
//   }

//   // Change password
//   async changePassword(userId, role, currentPassword, newPassword) {
//     try {
//       const model = this.getUserModel(role);
//       if (!model) {
//         throw new Error("Invalid role specified");
//       }

//       // Get current user
//       const user = await model.findUnique({
//         where: { id: userId },
//       });

//       if (!user) {
//         throw new Error("User not found");
//       }

//       // Verify current password
//       const isCurrentPasswordValid = await this.verifyPassword(
//         currentPassword,
//         user.password
//       );
//       if (!isCurrentPasswordValid) {
//         throw new Error("Current password is incorrect");
//       }

//       // Hash new password
//       const hashedNewPassword = await this.hashPassword(newPassword);

//       // Update password
//       await model.update({
//         where: { id: userId },
//         data: {
//           password: hashedNewPassword,
//           updatedAt: new Date(),
//         },
//       });

//       return {
//         success: true,
//         message: "Password changed successfully",
//       };
//     } catch (error) {
//       console.error("Change password error:", error);
//       throw new Error(error.message || "Failed to change password");
//     }
//   }

//   // Google OAuth registration
//   async registerWithGoogle(userData, role) {
//     try {
//       const model = this.getUserModel(role);
//       if (!model) {
//         throw new Error("Invalid role specified");
//       }

//       const { email, googleId, id } = userData;
//       const finalGoogleId = googleId || id;

//       if (!email || !finalGoogleId) {
//         throw new Error(
//           "Email and Google ID are required for Google registration"
//         );
//       }

//       // Check if user already exists
//       const existingUser = await model.findFirst({
//         where: {
//           OR: [{ email: userData.email }, { googleId: finalGoogleId }],
//         },
//       });

//       if (existingUser) {
//         // Update existing user with Google info
//         const updatedUser = await model.update({
//           where: { id: existingUser.id },
//           data: {
//             googleId: finalGoogleId,
//             profilePicture:
//               userData.imageUrl ||
//               userData.profilePicture ||
//               userData.profile_picture,
//             lastLogin: new Date(),
//             loginCount: { increment: 1 },
//           },
//         });

//         const tokens = this.generateTokens(updatedUser.id, role);
//         const { password, ...userWithoutPassword } = updatedUser;

//         return {
//           success: true,
//           user: { ...userWithoutPassword, role },
//           tokens,
//         };
//       }

//       // Create new user without password (Google OAuth)
//       const userToCreate = {
//         email: userData.email,
//         password: "", // Empty password for OAuth users
//         googleId: finalGoogleId,
//         profilePicture:
//           userData.imageUrl ||
//           userData.profilePicture ||
//           userData.profile_picture,
//         isEmailVerified: true, // Google emails are verified
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       };

//       // Add role-specific fields
//       if (role === "student") {
//         userToCreate.firstName =
//           userData.firstName ||
//           userData.first_name ||
//           userData.name?.split(" ")[0];
//         userToCreate.lastName =
//           userData.lastName ||
//           userData.last_name ||
//           userData.name?.split(" ").slice(1).join(" ");
//         userToCreate.contactNo = userData.contactNo || userData.contact_no;
//         userToCreate.username = userData.username || userData.username;
//         userToCreate.collegeName =
//           userData.collegeName ||
//           userData.student_college_name ||
//           userData.college_name;
//         userToCreate.interestedField =
//           userData.interestedField || userData.interested_field;
//         userToCreate.otherField = userData.otherField || userData.other_field;
//       } else if (role === "college") {
//         userToCreate.name = userData.name || userData.college_name;
//         userToCreate.description = userData.description;
//         userToCreate.location = userData.location || userData.college_address;
//         userToCreate.established =
//           userData.established || userData.establishment_year;
//         // Convert to Int or null
//         userToCreate.established = userToCreate.established
//           ? parseInt(userToCreate.established)
//           : null;

//         userToCreate.website = userData.website;

//         userToCreate.campusArea = userData.campusArea || userData.campus_area;
//         // Convert to Decimal or null
//         userToCreate.campusArea = userToCreate.campusArea
//           ? parseFloat(userToCreate.campusArea)
//           : null;

//         userToCreate.nirfRank = userData.nirfRank || userData.nirf_rank;
//         // Convert to Int or null
//         userToCreate.nirfRank = userToCreate.nirfRank
//           ? parseInt(userToCreate.nirfRank)
//           : null;

//         userToCreate.accreditation = userData.accreditation;

//         userToCreate.totalStudents =
//           userData.totalStudents || userData.total_students;
//         // Convert to Int or null
//         userToCreate.totalStudents = userToCreate.totalStudents
//           ? parseInt(userToCreate.totalStudents)
//           : null;

//         userToCreate.totalFaculty =
//           userData.totalFaculty || userData.total_faculty;
//         // Convert to Int or null
//         userToCreate.totalFaculty = userToCreate.totalFaculty
//           ? parseInt(userToCreate.totalFaculty)
//           : null;
//       } else if (role === "startup") {
//         userToCreate.firstName =
//           userData.firstName ||
//           userData.first_name ||
//           userData.name?.split(" ")[0];
//         userToCreate.username =
//           userData.username ||
//           userData.username ||
//           userData.username?.split(" ")[0];
//         userToCreate.lastName =
//           userData.lastName ||
//           userData.last_name ||
//           userData.name?.split(" ").slice(1).join(" ");
//         userToCreate.startupName =
//           userData.startupName || userData.startup_name;
//         userToCreate.startupStage =
//           userData.startupStage || userData.startup_stage;
//         userToCreate.fundingStatus =
//           userData.fundingStatus || userData.funding_status;
//         userToCreate.teamSize = userData.teamSize || userData.team_size;
//         userToCreate.description = userData.description;
//         userToCreate.location = userData.location;
//         userToCreate.website = userData.website;
//         userToCreate.contactNo = userData.contactNo || userData.contact_no;
//       } else if (role === "industry") {
//         userToCreate.firstName =
//           userData.firstName ||
//           userData.first_name ||
//           userData.name?.split(" ")[0];
//         userToCreate.lastName =
//           userData.lastName ||
//           userData.last_name ||
//           userData.name?.split(" ").slice(1).join(" ");
//         userToCreate.companyName =
//           userData.companyName || userData.company_name;
//         userToCreate.industryType =
//           userData.industryType || userData.industry_type;
//         userToCreate.companySize =
//           userData.companySize || userData.company_size;
//         userToCreate.designation = userData.designation;
//         userToCreate.description = userData.description;
//         userToCreate.location = userData.location;
//         userToCreate.website = userData.website;
//         userToCreate.contactNo = userData.contactNo || userData.contact_no;
//       }

//       console.log(
//         "userToCreate before model.create:",
//         JSON.stringify(userToCreate, null, 2)
//       );

//       const user = await model.create({
//         data: userToCreate,
//       });

//       const tokens = this.generateTokens(user.id, role);
//       const { password, ...userWithoutPassword } = user;

//       return {
//         success: true,
//         user: { ...userWithoutPassword, role },
//         tokens,
//       };
//     } catch (error) {
//       console.error("Google registration error:", error);
//       throw new Error(error.message || "Google registration failed");
//     }
//   }

//   // Check if email is associated with Google OAuth
//   async isGoogleAccount(email, role) {
//     try {
//       const model = this.getUserModel(role);
//       if (!model) {
//         return false;
//       }

//       const user = await model.findUnique({
//         where: { email },
//         select: { googleId: true, password: true },
//       });

//       return !!(
//         user &&
//         user.googleId &&
//         (!user.password || user.password === "")
//       );
//     } catch (error) {
//       console.error("Check Google account error:", error);
//       return false;
//     }
//   }
// }

// module.exports = new AuthService();
