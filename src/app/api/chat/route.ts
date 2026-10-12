import { NextRequest } from "next/server";
import { runAgentConversation, ChatMessage, LLMProvider } from "@/lib/aiAgent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, apiKey, provider = "gemini", model } = body as {
      messages: ChatMessage[];
      apiKey?: string;
      provider?: LLMProvider;
      model?: string;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Resolve key from body, headers, or environment
    let effectiveApiKey = apiKey?.trim();

    if (!effectiveApiKey) {
      if (provider === "openai") {
        effectiveApiKey =
          req.headers.get("x-openai-api-key")?.trim() ||
          req.headers.get("x-api-key")?.trim() ||
          process.env.OPENAI_API_KEY;
      } else if (provider === "anthropic") {
        effectiveApiKey =
          req.headers.get("x-anthropic-api-key")?.trim() ||
          req.headers.get("x-api-key")?.trim() ||
          process.env.ANTHROPIC_API_KEY;
      } else if (provider === "openrouter") {
        effectiveApiKey =
          req.headers.get("x-openrouter-api-key")?.trim() ||
          req.headers.get("x-api-key")?.trim() ||
          process.env.OPENROUTER_API_KEY;
      } else {
        effectiveApiKey =
          req.headers.get("x-gemini-api-key")?.trim() ||
          req.headers.get("x-api-key")?.trim() ||
          process.env.GEMINI_API_KEY;
      }
    }

    // Stream SSE back to client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };

        try {
          await runAgentConversation(
            messages,
            effectiveApiKey,
            (event) => {
              sendEvent(event);
            },
            provider,
            model
          );
          sendEvent({ type: "complete" });
        } catch (err: any) {
          sendEvent({ type: "error", error: err.message || "An error occurred" });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
