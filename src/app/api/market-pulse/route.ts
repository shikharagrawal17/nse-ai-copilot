import { NextResponse } from "next/server";
import { getMarketPulse } from "@/lib/mcpClient";

export const dynamic = "force-dynamic";


export async function GET() {
  try {
    const pulse = await getMarketPulse();
    return NextResponse.json({
      success: true,
      ...pulse,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
