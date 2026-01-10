const express = require("express");
const router = express.Router();
const axios = require("axios");
const { User, Student, College } = require("../config/database");
const jwt = require("jsonwebtoken");

// GitHub OAuth credentials
const GITHUB_CLIENT_ID = "Ov23liJDM6B9xuTvVtBa";
const GITHUB_CLIENT_SECRET = "01a1b0a5245ae5962397676c5b178193246513fe";
const BACKEND_URL =
  process.env.BACKEND_URL || "https://scaips-backend.onrender.com";
const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://electrosoft-alumni.vercel.app";

// IMPORTANT: This must EXACTLY match the URL registered in your GitHub OAuth app settings
// Don't use string interpolation here to avoid any unexpected characters
const REDIRECT_URI =
  "https://scaips-backend.onrender.com/api/auth/github/callback";

// Generate JWT Token (reusing from auth.js)
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// Generate Refresh Token (reusing from auth.js)
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "30d",
  });
};

// Initiate GitHub OAuth flow
router.get("/github", (req, res) => {
  console.log("GitHub OAuth initialization requested");
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=user:email`;
  console.log("Redirecting to GitHub:", githubAuthUrl);
  res.redirect(githubAuthUrl);
});

// GitHub OAuth callback
router.get("/github/callback", async (req, res) => {
  const { code } = req.query;
  console.log(
    "GitHub OAuth callback received with code:",
    code ? code.substring(0, 10) + "..." : "none"
  );

  if (!code) {
    console.error("No code provided in GitHub callback");
    return res.redirect(
      `${
        process.env.FRONTEND_URL || FRONTEND_URL
      }/auth/login?error=GitHub authentication failed`
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const { access_token } = tokenResponse.data;

    if (!access_token) {
      return res.redirect(
        `${FRONTEND_URL}/auth/login?error=Failed to get GitHub access token`
      );
    }

    // Get user data from GitHub
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `token ${access_token}`,
      },
    });

    // Get user emails (includes primary email)
    const emailsResponse = await axios.get(
      "https://api.github.com/user/emails",
      {
        headers: {
          Authorization: `token ${access_token}`,
        },
      }
    );

    const primaryEmail =
      emailsResponse.data.find((email) => email.primary)?.email ||
      emailsResponse.data[0]?.email;

    if (!primaryEmail) {
      return res.redirect(
        `${FRONTEND_URL}/auth/login?error=Could not retrieve GitHub email`
      );
    }

    const githubUser = {
      github_id: userResponse.data.id.toString(),
      email: primaryEmail,
      firstName: userResponse.data.name
        ? userResponse.data.name.split(" ")[0]
        : "",
      lastName: userResponse.data.name
        ? userResponse.data.name.split(" ").slice(1).join(" ")
        : "",
      username: userResponse.data.login,
      profile_picture: userResponse.data.avatar_url,
    };

    // Check if user exists in our database
    let existingUser = await Student.findOne({
      where: { email: primaryEmail },
    });
    let userType = "student";

    if (!existingUser) {
      existingUser = await College.findOne({ where: { email: primaryEmail } });
      userType = "college";
    }

    if (existingUser) {
      // User exists - login flow
      // Update GitHub info if not already set
      if (!existingUser.github_id) {
        existingUser.github_id = githubUser.github_id;
        existingUser.profile_picture =
          existingUser.profile_picture || githubUser.profile_picture;
        if (userType === "student") {
          if (!existingUser.first_name)
            existingUser.first_name = githubUser.firstName;
          if (!existingUser.last_name)
            existingUser.last_name = githubUser.lastName;
        }
        await existingUser.save();
      }

      // Generate tokens
      const token = generateToken(existingUser.id);
      const refreshToken = generateRefreshToken(existingUser.id);

      // Set refresh token cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      // Prepare user data to send with token
      let userData;
      if (userType === "student") {
        userData = {
          id: existingUser.id,
          email: existingUser.email,
          first_name: existingUser.first_name,
          last_name: existingUser.last_name,
          fullName: `${existingUser.first_name || ""} ${
            existingUser.last_name || ""
          }`.trim(),
          contact_no: existingUser.contact_no,
          student_college_name: existingUser.student_college_name,
          interested_field: existingUser.interested_field,
          other_field: existingUser.other_field,
          role: "student",
          github_id: existingUser.github_id,
          profile_picture: existingUser.profile_picture,
        };
      } else {
        userData = {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: "college",
          github_id: existingUser.github_id,
          profile_picture: existingUser.profile_picture,
        };
      }

      // Encode user data to include in redirect URL
      const encodedUserData = Buffer.from(JSON.stringify(userData)).toString(
        "base64"
      );

      // Redirect with token and user data
      return res.redirect(
        `${FRONTEND_URL}/auth/github/success?token=${token}&userData=${encodedUserData}`
      );
    } else {
      // User doesn't exist - redirect to signup completion
      // Store GitHub data temporarily
      const githubData = Buffer.from(JSON.stringify(githubUser)).toString(
        "base64"
      );
      return res.redirect(
        `${FRONTEND_URL}/auth/complete-github-signup?data=${githubData}`
      );
    }
  } catch (error) {
    console.error("GitHub auth error:", error);
    return res.redirect(
      `${FRONTEND_URL}/auth/login?error=GitHub authentication failed`
    );
  }
});

// GitHub login API endpoint (called from frontend)
router.post("/github/login", async (req, res) => {
  try {
    console.log("=== GITHUB LOGIN ===");
    console.log("Request body:", req.body);

    const { email, github_id, firstName, lastName, username, profile_picture } =
      req.body;

    // Check if user exists in Student or College tables
    let existingUser = await Student.findOne({ where: { email } });
    let userType = "student";

    if (!existingUser) {
      existingUser = await College.findOne({ where: { email } });
      userType = "college";
    }

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please register first.",
      });
    }

    // Update user with GitHub information if not already set
    if (!existingUser.github_id) {
      existingUser.github_id = github_id;
      existingUser.profile_picture =
        existingUser.profile_picture || profile_picture;
      if (userType === "student") {
        if (!existingUser.first_name) existingUser.first_name = firstName;
        if (!existingUser.last_name) existingUser.last_name = lastName;
      }
      await existingUser.save();
    }

    // Generate tokens
    const token = generateToken(existingUser.id);
    const refreshToken = generateRefreshToken(existingUser.id);

    // Set refresh token cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    console.log("GitHub login successful for:", existingUser.email);

    // Return user data based on type
    let userResponse;
    if (userType === "student") {
      userResponse = {
        id: existingUser.id,
        email: existingUser.email,
        first_name: existingUser.first_name,
        last_name: existingUser.last_name,
        fullName: `${existingUser.first_name} ${existingUser.last_name}`,
        contact_no: existingUser.contact_no,
        student_college_name: existingUser.student_college_name,
        interested_field: existingUser.interested_field,
        other_field: existingUser.other_field,
        role: "student",
        github_id: existingUser.github_id,
        profile_picture: existingUser.profile_picture,
      };
    } else {
      userResponse = {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role: "college",
        github_id: existingUser.github_id,
        profile_picture: existingUser.profile_picture,
      };
    }

    res.json({
      success: true,
      message: "GitHub login successful",
      data: {
        token,
        user: userResponse,
      },
    });
  } catch (error) {
    console.error("GitHub login error:", error);
    res.status(500).json({
      success: false,
      message: "GitHub login failed",
      error: error.message,
    });
  }
});

// GitHub registration API endpoint
router.post("/github/register", async (req, res) => {
  try {
    console.log("=== GITHUB REGISTRATION ===");
    console.log("Request body:", req.body);

    const {
      email,
      github_id,
      firstName,
      lastName,
      username,
      profile_picture,
      // Additional registration fields
      contact_no,
      student_college_name,
      interested_field,
      other_field,
      userType,
    } = req.body;

    // Check if user already exists
    let existingStudent = await Student.findOne({ where: { email } });
    let existingCollege = await College.findOne({ where: { email } });

    if (existingStudent || existingCollege) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists.",
      });
    }

    // Create new user based on userType
    let newUser;

    if (userType === "student") {
      newUser = await Student.create({
        email,
        github_id,
        first_name: firstName,
        last_name: lastName,
        contact_no,
        student_college_name,
        interested_field,
        other_field,
        profile_picture,
      });
    } else if (userType === "college") {
      newUser = await College.create({
        email,
        name: `${firstName} ${lastName}`,
        github_id,
        profile_picture,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid user type specified.",
      });
    }

    // Generate tokens
    const token = generateToken(newUser.id);
    const refreshToken = generateRefreshToken(newUser.id);

    // Set refresh token cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Return appropriate user data
    let userResponse;
    if (userType === "student") {
      userResponse = {
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        fullName: `${newUser.first_name} ${newUser.last_name}`,
        contact_no: newUser.contact_no,
        student_college_name: newUser.student_college_name,
        interested_field: newUser.interested_field,
        other_field: newUser.other_field,
        role: "student",
        github_id: newUser.github_id,
        profile_picture: newUser.profile_picture,
      };
    } else {
      userResponse = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: "college",
        github_id: newUser.github_id,
        profile_picture: newUser.profile_picture,
      };
    }

    res.status(201).json({
      success: true,
      message: "GitHub registration successful",
      data: {
        token,
        user: userResponse,
      },
    });
  } catch (error) {
    console.error("GitHub registration error:", error);
    res.status(500).json({
      success: false,
      message: "GitHub registration failed",
      error: error.message,
    });
  }
});

module.exports = router;
