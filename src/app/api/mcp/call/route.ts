import { NextRequest, NextResponse } from "next/server";
import { executeTool } from "@/lib/mcpClient";


export async function POST(req: NextRequest) {
  try {
    const { toolName, args } = await req.json();
    if (!toolName) {
      return NextResponse.json({ error: "toolName is required" }, { status: 400 });
    }

    const startTime = Date.now();
    const result = await executeTool(toolName, args || {});
    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      toolName,
      durationMs,
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to execute tool",
      },
      { status: 500 }
    );
  }
}
