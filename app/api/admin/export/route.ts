import { NextResponse } from "next/server";
import { authenticateRequest, createAuthErrorResponse } from "@/lib/auth/guard";
import { exportSanctuaryData } from "@/lib/data/memories";

export async function GET(request: Request) {
  try {
    // 1. Authenticate session & enforce Admin role
    const { user } = await authenticateRequest(request);
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Admin authorization required for data export",
          },
        },
        {
          status: 403,
          headers: {
            "Cache-Control": "no-store, private",
          },
        }
      );
    }

    // 2. Generate export payload
    const exportData = await exportSanctuaryData(user);

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store, private",
        "Content-Disposition": `attachment; filename="aethelgard-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    return createAuthErrorResponse(error);
  }
}
