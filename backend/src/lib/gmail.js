import { google } from "googleapis";

export function getGmailClient() {
  const auth = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET
  );

  auth.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN,
  });

  return google.gmail({ version: "v1", auth });
}
