import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSheetsClient } from "@/lib/googleSheetsClient";

// GET /api/sheets/verify
// Creates a test spreadsheet to confirm the Sheets API is reachable.
// Safe to delete the resulting sheet from Google Drive.
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const sheets = await getSheetsClient();
    const result = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: "Finnish Learner — auth test (safe to delete)" },
      },
    });

    return NextResponse.json({
      ok: true,
      user: session.user?.email,
      spreadsheetId: result.data.spreadsheetId,
      spreadsheetUrl: result.data.spreadsheetUrl,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
