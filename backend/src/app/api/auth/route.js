// File: app/api/auth/route.js
import { google } from "googleapis";
import { NextResponse } from "next/server";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const code = searchParams.get("code");

  if (!code) {
    // Step 1: redirect to Google login
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/gmail.readonly"],
      prompt: "consent",
    });
    return NextResponse.redirect(url);
  }

  try {
    // Step 2: exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    console.log("Refresh Token:", tokens.refresh_token);
    console.log("Access Token:", tokens.access_token);

    // You can save tokens.refresh_token in a database or env file
    return NextResponse.json({
      message: "Tokens received successfully",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
