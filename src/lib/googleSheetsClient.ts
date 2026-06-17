import { auth } from "@/lib/auth";
import { google } from "googleapis";
import type { sheets_v4 } from "googleapis";

export async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  const session = await auth();
  // A RefreshTokenError means the access token expired and couldn't be renewed —
  // treat it the same as no session so callers fail loudly instead of using a stale token.
  if (!session?.accessToken || session.error) {
    throw new Error("Not authenticated — sign in first");
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: session.accessToken });

  return google.sheets({ version: "v4", auth: oauth2Client });
}
