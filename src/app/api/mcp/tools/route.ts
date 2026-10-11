import { NextResponse } from "next/server";
import { getAvailableTools } from "@/lib/mcpClient";

export const dynamic = "force-dynamic";


export async function GET() {
  try {
    const tools = await getAvailableTools();
    const liveTools = tools.filter((t) => t.server === "cm-market");
    const bhavcopyTools = tools.filter((t) => t.server === "nse-bhavcopy");

    return NextResponse.json({
      success: true,
      totalCount: tools.length,
      liveCount: liveTools.length,
      bhavcopyCount: bhavcopyTools.length,
      tools,
      grouped: {
        "cm-market": liveTools,
        "nse-bhavcopy": bhavcopyTools,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
