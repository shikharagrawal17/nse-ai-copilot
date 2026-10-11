// MCP Client for NSE Live Market & Bhavcopy Endpoints
import { fetchLiveEquityNews, getEquityRecommendation } from "./newsAndAnalystReports";

export interface ToolDefinition {
  name: string;
  description?: string;
  inputSchema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
    [key: string]: any;
  };
  server: "cm-market" | "nse-bhavcopy";
}

interface ServerConfig {
  name: "cm-market" | "nse-bhavcopy";
  url: string;
  sessionId: string | null;
  lastInit: number;
}

const SERVERS: Record<"cm-market" | "nse-bhavcopy", ServerConfig> = {
  "cm-market": {
    name: "cm-market",
    url: "https://mcp.nseindia.in/cmmkt/mcp",
    sessionId: null,
    lastInit: 0,
  },
  "nse-bhavcopy": {
    name: "nse-bhavcopy",
    url: "https://mcp.nseindia.in/bhavcopy/cm/mcp",
    sessionId: null,
    lastInit: 0,
  },
};

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

let cachedTools: ToolDefinition[] | null = null;
let lastToolsFetch = 0;

/**
 * Initializes or refreshes a session with an MCP endpoint
 */
async function ensureSession(serverKey: "cm-market" | "nse-bhavcopy"): Promise<string> {
  const server = SERVERS[serverKey];
  const now = Date.now();

  // Reuse session if initialized within last 15 minutes
  if (server.sessionId && now - server.lastInit < 15 * 60 * 1000) {
    return server.sessionId;
  }

  const res = await fetch(server.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "nse-ai-copilot", version: "1.0.0" },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to initialize ${serverKey}: HTTP ${res.status}`);
  }

  const sessionId = res.headers.get("mcp-session-id");
  if (!sessionId) {
    throw new Error(`No mcp-session-id header returned by ${serverKey}`);
  }

  server.sessionId = sessionId;
  server.lastInit = now;
  return sessionId;
}

/**
 * Parses SSE data stream from MCP server response
 */
function parseMcpSseResponse(text: string): any {
  const lines = text.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("data:")) {
      const jsonStr = trimmed.slice(5).trim();
      try {
        return JSON.parse(jsonStr);
      } catch {
        // continue
      }
    }
  }

  // Fallback direct JSON parse
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Failed to parse MCP response: ${text.slice(0, 200)}`);
  }
}

/**
 * Lists all tools from both NSE MCP servers
 */
export async function getAvailableTools(forceRefresh = false): Promise<ToolDefinition[]> {
  const now = Date.now();
  if (!forceRefresh && cachedTools && now - lastToolsFetch < 60 * 60 * 1000) {
    return cachedTools;
  }

  const allTools: ToolDefinition[] = [];

  for (const serverKey of ["cm-market", "nse-bhavcopy"] as const) {
    try {
      const sessionId = await ensureSession(serverKey);
      const res = await fetch(SERVERS[serverKey].url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "User-Agent": USER_AGENT,
          "mcp-session-id": sessionId,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/list",
          params: {},
        }),
      });

      const text = await res.text();
      const rpcData = parseMcpSseResponse(text);
      if (rpcData?.result?.tools) {
        for (const tool of rpcData.result.tools) {
          allTools.push({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema || { type: "object", properties: {} },
            server: serverKey,
          });
        }
      }
    } catch (err) {
      console.error(`Error fetching tools for ${serverKey}:`, err);
    }
  }

  // Accredited real-time intelligence tools
  allTools.push({
    name: "get_live_equity_news",
    description: "Fetches accredited real-time financial news, media dispatches, and quarterly earnings updates for any NSE equity symbol with verified publisher sources, links, and timestamps.",
    inputSchema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "NSE equity ticker symbol (e.g. RELIANCE, TCS, INFY, HDFCBANK)",
        },
      },
      required: ["symbol"],
    },
    server: "cm-market",
  });

  allTools.push({
    name: "get_institutional_recommendations",
    description: "Fetches accredited institutional brokerage research ratings, consensus 12M target prices, conviction scores, and analyst upside revisions for any NSE equity.",
    inputSchema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "NSE equity ticker symbol (e.g. RELIANCE, TCS, INFY, HDFCBANK)",
        },
      },
      required: ["symbol"],
    },
    server: "cm-market",
  });

  cachedTools = allTools;
  lastToolsFetch = now;
  return allTools;
}

/**
 * Executes a tool by name on the appropriate MCP server
 */
export async function executeTool(rawToolName: string, args: Record<string, any> = {}): Promise<any> {
  const toolName = rawToolName.includes(":") ? rawToolName.split(":").pop()! : rawToolName;

  // Handle local real-time intelligence tools
  if (toolName === "get_live_equity_news") {
    const sym = args.symbol || args.ticker || "RELIANCE";
    return await fetchLiveEquityNews(sym);
  }

  if (toolName === "get_institutional_recommendations") {
    const sym = args.symbol || args.ticker || "RELIANCE";
    return await getEquityRecommendation(sym, args.ltp);
  }

  const tools = await getAvailableTools();
  const toolDef = tools.find((t) => t.name === toolName);

  // If not found in cache, default to checking tool name prefix or fallback to bhavcopy
  const serverKey: "cm-market" | "nse-bhavcopy" = toolDef
    ? toolDef.server
    : toolName.startsWith("cm_") || toolName.startsWith("nse_get_")
    ? "cm-market"
    : "nse-bhavcopy";

  const sessionId = await ensureSession(serverKey);

  const res = await fetch(SERVERS[serverKey].url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "User-Agent": USER_AGENT,
      "mcp-session-id": sessionId,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args,
      },
    }),
  });

  const text = await res.text();
  const rpcData = parseMcpSseResponse(text);

  if (rpcData.error) {
    throw new Error(`MCP Tool Error: ${rpcData.error.message || JSON.stringify(rpcData.error)}`);
  }

  const contentList = rpcData.result?.content || [];
  const textContent = contentList.find((c: any) => c.type === "text")?.text;

  if (!textContent) {
    return rpcData.result;
  }

  try {
    return JSON.parse(textContent);
  } catch {
    return textContent;
  }
}

/**
 * Returns rapid market heartbeat (indices + market mood)
 */
export async function getMarketPulse() {
  try {
    const [indices, mood] = await Promise.allSettled([
      executeTool("cm_get_live_indices", { group: "broad" }),
      executeTool("get_market_mood", {}),
    ]);

    return {
      indices: indices.status === "fulfilled" ? indices.value : null,
      mood: mood.status === "fulfilled" ? mood.value : null,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    return { error: err.message, timestamp: new Date().toISOString() };
  }
}
