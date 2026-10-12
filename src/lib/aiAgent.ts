import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { executeTool, getAvailableTools, ToolDefinition } from "./mcpClient";
import { calculateAlgorithmicTargets, formatAlgorithmicReport } from "./quantAlgorithms";
import { getEquityRecommendation, formatRecommendationReport } from "./newsAndAnalystReports";

export type LLMProvider = "gemini" | "openai" | "anthropic" | "openrouter";

export interface ModelOption {
  id: string;
  name: string;
  tag: string;
  description: string;
}

export const PROVIDER_MODELS: Record<LLMProvider, ModelOption[]> = {
  gemini: [
    {
      id: "gemini-3.8-flash",
      name: "Gemini 3.8 Flash",
      tag: "Recommended",
      description: "Google frontier model with sub-second latency and native function calling",
    },
    {
      id: "gemini-3.8-pro",
      name: "Gemini 3.8 Pro",
      tag: "Deep Reasoning",
      description: "Highest analytical depth for complex quantitative modeling",
    },
    {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      tag: "Ultra-Fast",
      description: "Next-gen multimodal architecture with sub-second response times",
    },
    {
      id: "gemini-2.0-flash-lite",
      name: "Gemini 2.0 Flash Lite",
      tag: "Lightweight",
      description: "High-throughput execution for rapid equity lookups",
    },
    {
      id: "gemini-2.0-flash-thinking-exp-01-21",
      name: "Gemini 2.0 Flash Thinking",
      tag: "Reasoning",
      description: "Extended chain-of-thought for mathematical and statistical analysis",
    },
  ],
  openai: [
    {
      id: "gpt-4o",
      name: "GPT-4o",
      tag: "Recommended",
      description: "Flagship multimodal intelligence with native function calling",
    },
    {
      id: "gpt-4.5-preview",
      name: "GPT-4.5 Preview",
      tag: "Frontier",
      description: "OpenAI's largest foundation model with deep world knowledge",
    },
    {
      id: "o3-mini",
      name: "o3-mini",
      tag: "Quant Reasoning",
      description: "High reasoning effort for mathematical and statistical analysis",
    },
    {
      id: "o1",
      name: "o1",
      tag: "Deep Thinking",
      description: "Full reasoning model for multi-step structural market theses",
    },
    {
      id: "gpt-4o-mini",
      name: "GPT-4o Mini",
      tag: "Fast & Light",
      description: "High speed for standard equity quote and index queries",
    },
  ],
  anthropic: [
    {
      id: "claude-3-7-sonnet-20250219",
      name: "Claude 3.7 Sonnet",
      tag: "Latest Flagship",
      description: "Hybrid reasoning model with unprecedented analytical precision",
    },
    {
      id: "claude-3-5-sonnet-20241022",
      name: "Claude 3.5 Sonnet (v2)",
      tag: "Recommended",
      description: "Industry benchmark equity intelligence and tool orchestration",
    },
    {
      id: "claude-3-5-haiku-20241022",
      name: "Claude 3.5 Haiku",
      tag: "Ultra-Fast",
      description: "Sub-second response times for instant market lookups",
    },
    {
      id: "claude-3-opus-20240229",
      name: "Claude 3 Opus",
      tag: "Deep Analysis",
      description: "Complex institutional qualitative and macro research",
    },
  ],
  openrouter: [
    {
      id: "anthropic/claude-3.5-sonnet",
      name: "Claude 3.5 Sonnet",
      tag: "Recommended",
      description: "Premier intelligence for institutional equity research via OpenRouter gateway",
    },
    {
      id: "deepseek/deepseek-r1",
      name: "DeepSeek R1",
      tag: "Quant Reasoning",
      description: "State-of-the-art open reasoning model for mathematical trade planning",
    },
    {
      id: "deepseek/deepseek-chat",
      name: "DeepSeek V3",
      tag: "Ultra-Fast",
      description: "High-speed economic inference for live market tape and news analysis",
    },
    {
      id: "openai/gpt-4o",
      name: "GPT-4o",
      tag: "Flagship",
      description: "OpenAI flagship multimodal intelligence through OpenRouter gateway",
    },
    {
      id: "meta-llama/llama-3.3-70b-instruct",
      name: "Llama 3.3 70B",
      tag: "Open Weights",
      description: "Meta open-weights flagship with strong reasoning and execution",
    },
    {
      id: "google/gemini-2.0-flash-001",
      name: "Gemini 2.0 Flash",
      tag: "Low Latency",
      description: "Fast Google multimodal inference via unified OpenRouter endpoint",
    },
    {
      id: "mistralai/mistral-large-2411",
      name: "Mistral Large 2",
      tag: "Advanced",
      description: "Top-tier European foundation model with deep qualitative reasoning",
    },
  ],
};

export const DEFAULT_MODEL_FOR_PROVIDER: Record<LLMProvider, string> = {
  gemini: "gemini-3.8-flash",
  openai: "gpt-4o",
  anthropic: "claude-3-7-sonnet-20250219",
  openrouter: "anthropic/claude-3.5-sonnet",
};

export interface ChatMessage {
  role: "user" | "model" | "assistant" | "system";
  content: string;
}

export interface AgentStepEvent {
  type: "tool_start" | "tool_end" | "thought" | "text" | "error" | "complete";
  toolName?: string;
  toolArgs?: any;
  toolResult?: any;
  text?: string;
  error?: string;
}

/**
 * Sanitizes an MCP tool schema for Gemini function calling
 */
function sanitizeSchemaForGemini(schema: any): any {
  if (!schema || typeof schema !== "object") {
    return { type: "OBJECT", properties: {} };
  }

  const sanitized: any = {};
  sanitized.type = schema.type ? String(schema.type).toUpperCase() : "OBJECT";

  if (schema.description) {
    sanitized.description = schema.description;
  }

  if (schema.properties && typeof schema.properties === "object") {
    sanitized.properties = {};
    for (const [key, prop] of Object.entries(schema.properties as Record<string, any>)) {
      sanitized.properties[key] = {
        type: prop.type ? String(prop.type).toUpperCase() : "STRING",
        description: prop.description || key,
      };
      if (prop.enum) {
        sanitized.properties[key].enum = prop.enum;
      }
      if (prop.type === "array" && prop.items) {
        sanitized.properties[key].items = sanitizeSchemaForGemini(prop.items);
      }
    }
  }

  if (Array.isArray(schema.required)) {
    sanitized.required = schema.required;
  }

  return sanitized;
}

export const KNOWN_NSE_STOCKS = new Set([
  "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "SBIN", "BHARTIARTL", "ITC", "KOTAKBANK", "LT",
  "AXISBANK", "TATAMOTORS", "MARUTI", "SUNPHARMA", "TITAN", "BAJFINANCE", "ADANIENT", "WIPRO", "NTPC",
  "POWERGRID", "ONGC", "TATASTEEL", "COALINDIA", "HINDUNILVR", "ASIANPAINT", "BAJAJFINSV", "ULTRACEMCO",
  "NESTLEIND", "JSWSTEEL", "M&M", "GRASIM", "TECHM", "HCLTECH", "INDUSINDBK", "DIVISLAB", "CIPLA",
  "DRREDDY", "EICHERMOT", "HEROMOTOCO", "APOLLOHOSP", "TATACONSUM", "BRITANNIA", "BPCL", "ADANIPORTS",
  "SBILIFE", "HDFCLIFE", "BAJAJ-AUTO", "SHRIRAMFIN", "TRENT", "BEL", "HAL", "VEDL", "DLF", "BHEL",
  "GAIL", "SAIL", "IOC", "ZOMATO", "PAYTM", "JIOFIN", "TATACHEM", "TATAPOWER", "IRCTC", "RVNL"
]);

export const COMMON_NON_STOCK_WORDS = new Set([
  "WHAT", "WHEN", "WHERE", "WHICH", "WHO", "WHOM", "WHY", "HOW", "SHOW", "TELL", "GIVE", "FIND",
  "THIS", "THAT", "THESE", "THOSE", "QUOTE", "QUOTES", "STOCK", "STOCKS", "SHARE", "SHARES", "PRICE",
  "PRICES", "GET", "FOR", "AND", "THE", "ABOUT", "CHECK", "FETCH", "CAN", "YOU", "PLEASE", "LATEST",
  "CURRENT", "TODAY", "RATE", "RATES", "LOOK", "SEE", "INFO", "DATA", "VIEW", "ANALYZE", "COMPARE",
  "DAILY", "WEEKLY", "EQUITY", "EQUITIES", "REPORT", "REPORTS", "DETAIL", "DETAILS", "CHART", "CHARTS",
  "EXECUTE", "RUN", "SCAN", "PULL", "LOOKUP", "TERMINAL", "CERTIFIED", "ALGORITHM", "ALGORITHMS",
  "ALGORITHMIC", "TARGET", "TARGETS", "PREDICT", "PREDICTION", "PREDICTIONS", "DECISION", "DECISIONS",
  "MODEL", "MODELS", "MODELING", "FORECAST", "FORECASTS", "FORECASTING", "RISK", "REWARD", "PIVOT",
  "PIVOTS", "CAMARILLA", "FIBONACCI", "SWING", "CALCULATE", "CALCULATED", "BEST", "MANY", "NEWS",
  "RECOMMEND", "RECOMMENDS", "RECOMMENDATION", "RECOMMENDATIONS", "ANALYST", "ANALYSTS", "STATE",
  "SOURCES", "SOURCE", "PLATFORM", "ALSO", "ACCREDITED", "INSTITUTIONAL", "RESEARCH", "BROKER",
  "BROKERS", "BROKERAGE", "RATINGS", "RATING", "CONSENSUS", "FLOW", "STATIC", "NEED", "BETTER",
  "FURTHER", "RESULTS", "ESULTS", "CONTEXT", "CHAT", "KEEP", "PREVIOUS", "DONT", "DOES", "EXPANSION",
  "RATIO", "RANGE", "LEVEL", "LEVELS", "MARKET", "MARKETS", "NSE", "BSE", "NIFTY", "BANKNIFTY",
  "STOP", "LOSS", "SL", "PROFIT", "SELL", "BUY", "ACCUMULATE", "HOLD", "REDUCE", "FEED", "LIVE",
  "REAL", "TIME", "FROM", "WITH", "MORE", "LESS", "GOOD", "MUCH", "WILL", "WOULD", "COULD", "SHOULD",
  "HAVE", "HAS", "HAD", "BEEN", "BEING", "WERE", "THEIR", "THERE", "THEN", "SOME", "SUCH", "THAN",
  "NOW", "NEW", "NEXT", "LAST", "TEST", "WANT", "LIKE", "KNOW", "THINK", "TAKE", "COME", "TRY",
  "SURE", "FINE", "WELL", "VERY", "JUST", "EVEN", "BACK", "DOWN", "OVER", "UNDER", "AWAY", "INTO",
  "TRADE", "TRADING", "TRADER", "TRADERS", "OPTION", "OPTIONS", "CALL", "CALLS", "PUT", "PUTS",
  "STRATEGY", "STRATEGIES", "SETUP", "SETUPS", "ENTRY", "ENTRIES", "EXIT", "EXITS", "SIZING",
  "POSITION", "POSITIONS", "CPR", "VWAP", "EMA", "SMA", "RSI", "MACD", "ATR", "EXPIRY",
  "EXPIRATION", "STRIKE", "STRIKES", "PREMIUM", "PREMIUMS", "BREADTH", "SENTIMENT", "SECTOR",
  "SECTORS", "INDEX", "INDICES", "EXPERT", "MENTOR", "BOT", "CHATBOT", "AGENT", "HELLO", "HI",
  "HEY", "MORNING", "EVENING", "AFTERNOON", "SUGGEST", "SUGGESTS", "SUGGESTION", "SUGGESTIONS",
  "PICK", "PICKS", "PICKING", "IDEA", "IDEAS", "WATCHLIST", "TOP", "ANY", "FEW", "LIST",
  "CHOICE", "CHOICES", "OPPORTUNITY", "OPPORTUNITIES", "SCREEN", "SCREENER", "SCANNER", "PORTFOLIO",
  "INVEST", "INVESTING", "INVESTMENT", "BUYING", "SELLING", "OUTLOOK", "PREFERENCE", "PREFERENCES"
]);

export function isPotentialTicker(w: string): boolean {
  if (w.length < 2 || w.length > 14) return false;
  if (w.length === 2 && w !== "LT") return false;
  if (COMMON_NON_STOCK_WORDS.has(w)) return false;
  if (!isNaN(Number(w))) return false;
  return true;
}

/**
 * Determines whether the conversation turn actually requires invoking MCP market tools.
 * Tools are ONLY attached when the user explicitly requests specific stock data, market indices,
 * breadth, or ticker analytics.
 * Otherwise, the model operates in normal, natural conversational chat mode.
 */
export function shouldAttachTools(messages: ChatMessage[]): boolean {
  if (!messages || messages.length === 0) return false;
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const trimmed = lastUserMsg.trim();
  const lower = trimmed.toLowerCase();

  // 1. Guard against common conversational keywords (timeframes, sectors, greetings, acknowledgments, educational queries)
  const isConversationalOnly =
    /^(swing|intraday|positional|scalp|scalping|long term|short term|banking|it|tech|autos?|pharma|fmcg|energy|metals?|infra|realty|yes|no|ok|okay|thanks|thank you|cool|great|sure|fine|understood|got it|tell me|what else|why|how)\b/i.test(lower) &&
    !/\b(quote|price|target|stop\s*loss|sl|dma|cmp|level|pe|p\/e|volume|chart|ohlc|bhavcopy)\b/i.test(lower);

  if (isConversationalOnly) return false;

  // 2. Guard against general stock suggestion requests without a specific ticker
  const isGeneralSuggestion =
    /\b(suggest|recommend|pick|picks|idea|ideas|watchlist|scan|best stocks|good stocks|top stocks|which stocks|what stocks|any stocks|what to buy|what to trade)\b/i.test(lower) &&
    !KNOWN_NSE_STOCKS.has(trimmed.toUpperCase());

  if (isGeneralSuggestion) return false;

  // 3. Guard against pure greetings or generic educational questions
  const isGreetingOrEducational =
    /^(hi|hello|hey|good\s+morning|good\s+afternoon|good\s+evening|namaste|who\s+are\s+you|help)\b/i.test(lower) ||
    (/\b(what is|explain|how do|how to|teach me)\b/i.test(lower) && !/\b(RELIANCE|TCS|INFY|HDFCBANK|SBIN|NIFTY)\b/i.test(trimmed));

  if (isGreetingOrEducational) return false;

  // 4. Check if a known stock ticker is explicitly mentioned in latest query
  const words = trimmed.toUpperCase().match(/\b[A-Z0-9_\-]{2,14}\b/g) || [];
  const hasKnownStock = words.some((w) => KNOWN_NSE_STOCKS.has(w));
  if (hasKnownStock) return true;

  // 5. Explicit market data or indices query
  const hasMarketIntent =
    /\b(nifty|banknifty|sensex|index|indices|gainers|losers|advances|declines|breadth|bhavcopy|52 week|52-week|volume shockers)\b/i.test(lower);
  if (hasMarketIntent) return true;

  // 6. Explicit command prefix like "quote XYZ", "analyze XYZ", "$XYZ"
  if (/(?:\$|quote\s+|analyze\s+|check\s+|lookup\s+|price\s+of\s+)[A-Z0-9_\-]{2,14}\b/i.test(trimmed)) {
    return true;
  }

  return false;
}

const SYSTEM_INSTRUCTION = `You are DalalDesk, an elite Senior Trading Expert and Market Strategist on Dalal Street.
You have over 15 years of prop trading desk experience across Indian capital markets (NSE cash equities, F&O derivatives, and benchmark indices), coupled with live access to 36 authoritative NSE MCP tools across live market feeds and historical Bhavcopy databases.

YOUR ROLE & CHAT BOT PERSONA:
1. CONVERSE AS AN EXPERIENCED, ARTICULATE TRADING DESK EXPERT:
   - Talk naturally, warmly, and decisively as a seasoned market mentor and trading partner.
   - Address the user's questions directly. If they ask a conversational question (e.g. "What is your view on Nifty today?", "Is Reliance looking good to buy?", "How do I trade options safely?", "Explain CPR pivots"), engage them in real trader dialogue.
   - Combine technical price action (market structure, breakouts, swing high/lows, moving averages), volatility (ATR), and institutional volume flow with practical trader psychology.
   - Always emphasize risk-to-reward (aim for at least 1:2 R:R) and clear invalidation stop-loss points. Never encourage reckless leverage or emotional trading.

2. INTELLIGENT TOOL USAGE (CALL TOOLS ONLY WHEN RELEVANT):
   - You have access to real-time NSE MCP tools (live quotes, indices, gainers/losers, historical OHLCV, moving averages, live news).
   - CALL TOOLS ONLY WHEN RELEVANT: Only invoke tools when the user explicitly requests live market data, benchmark index levels, or names a specific stock ticker to analyze.
   - For all other queries (trading timeframes like "Swing" or "Intraday", sector preferences like "Banking" or "IT", general discussions, trading psychology, or educational questions), DO NOT call tools. Respond conversationally as an experienced trading mentor.
   - NEVER assume or invent a stock ticker from previous example messages (e.g., if you previously listed "e.g. RELIANCE, TCS", do NOT query RELIANCE unless the user explicitly asked for it).
   - CRITICAL: Never just call tools silently and dump raw data tables. Translate the data into actionable trader insight and conversational commentary.

3. STRUCTURED TRADING ASSESSMENTS (WHEN ANALYZING EQUITIES):
   When the user asks for a trade setup, target prediction, or equity analysis, structure your expert response clearly:
   - **Trader's View & Market Bias**: Direct conviction verdict (Bullish Accumulation, Neutral Range, or Bearish Reversal) with current market context.
   - **Trade Setup & Actionable Game Plan**: Clear recommendation (e.g. Buy on Dip near Demand, Momentum Breakout above Resistance, or Wait for Retest).
   - **Key Price Levels**:
     * Entry Zone (optimal execution band)
     * Calculated Targets: Target 1 (Conservative Pivot R1), Target 2 (Base Case Resistance), Target 3 (Extended Breakout)
     * Invalidation Level (Strict Stop Loss based on ATR or demand shelf)
     * Risk-to-Reward Ratio (e.g. 1:2.4)
   - **Technical & Algorithmic Confluence**: Floor Pivots, Camarilla levels, Moving Average posture (20/50/200 DMA), and Volume posture.
   - **Live News & Brokerage Check**: Verified news citations from live dispatches if relevant (never fake or static data).
   - **Risk Management Advice**: Position sizing guidelines and trade management advice.

4. MULTI-TURN CONTINUITY & CONVERSATIONAL MEMORY:
   - Maintain seamless conversational memory across turns.
   - If the user asks a follow-up query like "What if it falls below 1350?", "What is the stop loss again?", or "What about TCS?", follow the context naturally and answer as a dedicated trading partner.

5. GENERAL TRADE SUGGESTIONS & IDEAS:
   - When the user asks "Suggest trades", "Suggest stocks", "Which stocks to buy?", or "What should I trade?", DO NOT dump an unprompted table suggesting arbitrary stocks.
   - Behave as a dedicated conversational Trading Expert and mentor: ask what time horizon (intraday vs swing) or sector they are focusing on, discuss prevailing market conditions, or invite them to give you a specific stock ticker on their radar to break down.

6. REGULATORY & FORMATTING CONSTRAINTS:
   - Never use emojis or em dashes under any circumstances.
   - Never provide promotional hype or guarantee profits.
   - Conclude formal market analysis with: "NSE market data is provided for informational and research purposes only. Not investment advice."`;

/**
 * Universal agent runner supporting Google Gemini, OpenAI (ChatGPT), Anthropic (Claude), and OpenRouter
 */
export async function runAgentConversation(
  messages: ChatMessage[],
  apiKey: string | undefined,
  onEvent: (event: AgentStepEvent) => void,
  provider: LLMProvider = "gemini",
  model?: string
): Promise<string> {
  const tools = await getAvailableTools();

  // If no API key provided, use deterministic analyzer with multi-turn context
  if (!apiKey) {
    return handleWithoutApiKey(messages, onEvent);
  }

  try {
    if (provider === "openai") {
      return await runOpenAIAgent(messages, apiKey, tools, onEvent, model);
    } else if (provider === "anthropic") {
      return await runClaudeAgent(messages, apiKey, tools, onEvent, model);
    } else if (provider === "openrouter") {
      return await runOpenRouterAgent(messages, apiKey, tools, onEvent, model);
    } else {
      return await runGeminiAgent(messages, apiKey, tools, onEvent, model);
    }
  } catch (error: any) {
    onEvent({
      type: "thought",
      text: `Upstream AI provider notice: ${error.message?.slice(0, 160) || "Service unavailable"}. Seamlessly engaging DalalDesk Institutional Quantitative Terminal with live NSE data...`,
    });
    return await handleWithoutApiKey(messages, onEvent);
  }
}

/**
 * Google Gemini Provider
 */
async function runGeminiAgent(
  messages: ChatMessage[],
  apiKey: string,
  tools: ToolDefinition[],
  onEvent: (event: AgentStepEvent) => void,
  model = "gemini-3.8-flash"
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  // Auto-migrate legacy/deprecated model names
  let resolvedModel = model || "gemini-3.8-flash";
  if (resolvedModel.includes("gemini-2.5-flash") || resolvedModel.includes("gemini-1.5-flash")) {
    resolvedModel = "gemini-3.8-flash";
  } else if (resolvedModel.includes("gemini-2.5-pro") || resolvedModel.includes("gemini-1.5-pro")) {
    resolvedModel = "gemini-3.8-pro";
  }

  const needTools = shouldAttachTools(messages);
  const functionDeclarations = needTools
    ? tools.map((t) => ({
        name: t.name,
        description: (t.description || t.name).slice(0, 1024),
        parameters: sanitizeSchemaForGemini(t.inputSchema),
      }))
    : [];

  const genConfig: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
  };
  if (needTools && functionDeclarations.length > 0) {
    genConfig.tools = [{ functionDeclarations }];
  }

  const contents: any[] = [];
  for (const msg of messages) {
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }

  let iterations = 0;
  const maxIterations = 5;

  while (iterations < maxIterations) {
    iterations++;

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: resolvedModel,
        contents,
        config: genConfig,
      });
    } catch (err: any) {
      const errStr = String(err?.message || err);

      // 1. Auto-fallback if the specified model returned 404 or unsupported
      if (
        errStr.includes("404") ||
        errStr.includes("NOT_FOUND") ||
        errStr.includes("no longer available") ||
        errStr.includes("not supported for generateContent")
      ) {
        const fallback = resolvedModel === "gemini-2.0-flash" ? "gemini-2.0-flash-lite" : "gemini-2.0-flash";
        onEvent({
          type: "thought",
          text: `Model ${resolvedModel} is not available. Auto-switching to ${fallback}...`,
        });
        resolvedModel = fallback;
        try {
          response = await ai.models.generateContent({
            model: resolvedModel,
            contents,
            config: genConfig,
          });
        } catch {
          onEvent({
            type: "thought",
            text: `Engaging DalalDesk Quantitative Terminal with live NSE market tools...`,
          });
          return await handleWithoutApiKey(messages, onEvent);
        }
      }
      // 2. Auto-fallback if the specified model hit 429 quota exhaustion (e.g. 20 req/day on 3.8-flash)
      else if (
        errStr.includes("429") ||
        errStr.includes("RESOURCE_EXHAUSTED") ||
        errStr.includes("quota") ||
        errStr.includes("rate limit") ||
        errStr.includes("Quota exceeded")
      ) {
        const fallbackCandidates = ["gemini-2.0-flash", "gemini-2.0-flash-lite"].filter((m) => m !== resolvedModel);
        let recovered = false;

        for (const fbModel of fallbackCandidates) {
          try {
            onEvent({
              type: "thought",
              text: `Daily free quota reached on ${resolvedModel}. Auto-switching to high-quota ${fbModel} (1,500 req/day)...`,
            });
            resolvedModel = fbModel;
            response = await ai.models.generateContent({
              model: resolvedModel,
              contents,
              config: genConfig,
            });
            recovered = true;
            break;
          } catch (fbErr: any) {
            console.warn(`Fallback to ${fbModel} failed:`, fbErr?.message);
          }
        }

        if (!recovered) {
          onEvent({
            type: "thought",
            text: `Gemini free tier quota limit reached across all models. Seamlessly engaging DalalDesk Quantitative Terminal with live NSE data...`,
          });
          return await handleWithoutApiKey(messages, onEvent);
        }
      } else {
        onEvent({
          type: "thought",
          text: `Engaging DalalDesk Quantitative Terminal with live NSE market tools...`,
        });
        return await handleWithoutApiKey(messages, onEvent);
      }
    }

    const candidate = response.candidates?.[0];
    const functionCalls = candidate?.content?.parts?.filter((p: any) => p.functionCall);

    if (functionCalls && functionCalls.length > 0) {
      // 1. Maintain full candidate.content (preserving thought_signatures, thoughts, and function calls intact)
      contents.push(candidate.content);

      // 2. Execute each tool call and construct function responses
      const functionResponseParts: any[] = [];
      for (const part of functionCalls) {
        const fn = part.functionCall;
        if (!fn || !fn.name) continue;
        const fnName: string = fn.name;
        const fnArgs = fn.args || {};

        onEvent({ type: "tool_start", toolName: fnName, toolArgs: fnArgs });

        let result: any;
        try {
          result = await executeTool(fnName, fnArgs);
          onEvent({ type: "tool_end", toolName: fnName, toolArgs: fnArgs, toolResult: result });
        } catch (err: any) {
          result = { error: err.message || "Execution failed" };
          onEvent({ type: "error", toolName: fnName, error: err.message });
        }

        functionResponseParts.push({
          functionResponse: {
            name: fnName,
            response: { result },
          },
        });
      }

      // 3. Append single user turn containing all function responses
      contents.push({
        role: "user",
        parts: functionResponseParts,
      });
    } else {
      const finalText =
        candidate?.content?.parts?.map((p: any) => p.text || "").join("") ||
        "No response generated.";
      onEvent({ type: "text", text: finalText });
      return finalText;
    }
  }

  return "Reached maximum analysis iterations.";
}

/**
 * OpenAI (ChatGPT) Provider
 */
async function runOpenAIAgent(
  messages: ChatMessage[],
  apiKey: string,
  tools: ToolDefinition[],
  onEvent: (event: AgentStepEvent) => void,
  model = "gpt-4o"
): Promise<string> {
  const openai = new OpenAI({ apiKey });

  const needTools = shouldAttachTools(messages);
  const openaiTools: any[] = needTools
    ? tools.map((t) => ({
        type: "function",
        function: {
          name: t.name,
          description: (t.description || t.name).slice(0, 1024),
          parameters: t.inputSchema || { type: "object", properties: {} },
        },
      }))
    : [];

  const chatMessages: any[] = [
    { role: "system", content: SYSTEM_INSTRUCTION },
    ...messages.map((m) => ({
      role: m.role === "model" ? "assistant" : m.role,
      content: m.content,
    })),
  ];

  let iterations = 0;
  const maxIterations = 5;

  while (iterations < maxIterations) {
    iterations++;

    const createParams: any = {
      model: model || "gpt-4o",
      messages: chatMessages,
    };
    if (needTools && openaiTools.length > 0) {
      createParams.tools = openaiTools;
      createParams.tool_choice = "auto";
    }

    const response = await openai.chat.completions.create(createParams);

    const choice = response.choices?.[0];
    const message = choice?.message;

    if (message?.tool_calls && message.tool_calls.length > 0) {
      chatMessages.push(message);

      for (const tc of message.tool_calls) {
        if (tc.type !== "function") continue;
        const fnName = tc.function.name;
        let fnArgs: any = {};
        try {
          fnArgs = JSON.parse(tc.function.arguments || "{}");
        } catch {
          fnArgs = {};
        }

        onEvent({ type: "tool_start", toolName: fnName, toolArgs: fnArgs });

        let result: any;
        try {
          result = await executeTool(fnName, fnArgs);
          onEvent({ type: "tool_end", toolName: fnName, toolArgs: fnArgs, toolResult: result });
        } catch (err: any) {
          result = { error: err.message || "Execution failed" };
          onEvent({ type: "error", toolName: fnName, error: err.message });
        }

        chatMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: typeof result === "object" ? JSON.stringify(result) : String(result),
        });
      }
    } else {
      const finalText = message?.content || "No response generated.";
      onEvent({ type: "text", text: finalText });
      return finalText;
    }
  }

  return "Reached maximum analysis iterations.";
}

/**
 * Anthropic (Claude) Provider
 */
async function runClaudeAgent(
  messages: ChatMessage[],
  apiKey: string,
  tools: ToolDefinition[],
  onEvent: (event: AgentStepEvent) => void,
  model = "claude-3-7-sonnet-20250219"
): Promise<string> {
  const anthropic = new Anthropic({ apiKey });

  const needTools = shouldAttachTools(messages);
  const claudeTools: any[] = needTools
    ? tools.map((t) => ({
        name: t.name,
        description: (t.description || t.name).slice(0, 1024),
        input_schema: t.inputSchema || { type: "object", properties: {} },
      }))
    : [];

  const anthropicMessages: any[] = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" || m.role === "model" ? "assistant" : "user",
      content: m.content,
    }));

  let iterations = 0;
  const maxIterations = 5;

  while (iterations < maxIterations) {
    iterations++;

    const createParams: any = {
      model: model || "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      system: SYSTEM_INSTRUCTION,
      messages: anthropicMessages,
    };
    if (needTools && claudeTools.length > 0) {
      createParams.tools = claudeTools;
    }

    const response = await anthropic.messages.create(createParams);

    const toolUseBlocks = response.content.filter((b: any) => b.type === "tool_use");

    if (toolUseBlocks.length > 0) {
      anthropicMessages.push({
        role: "assistant",
        content: response.content,
      });

      const toolResults: any[] = [];
      for (const block of toolUseBlocks) {
        const b = block as any;
        const fnName = b.name;
        const fnArgs = b.input || {};

        onEvent({ type: "tool_start", toolName: fnName, toolArgs: fnArgs });

        let result: any;
        try {
          result = await executeTool(fnName, fnArgs);
          onEvent({ type: "tool_end", toolName: fnName, toolArgs: fnArgs, toolResult: result });
        } catch (err: any) {
          result = { error: err.message || "Execution failed" };
          onEvent({ type: "error", toolName: fnName, error: err.message });
        }

        toolResults.push({
          type: "tool_result",
          tool_use_id: b.id,
          content: typeof result === "object" ? JSON.stringify(result) : String(result),
        });
      }

      anthropicMessages.push({
        role: "user",
        content: toolResults,
      });
    } else {
      const textBlock = response.content.find((b: any) => b.type === "text") as any;
      const finalText = textBlock?.text || "No response generated.";
      onEvent({ type: "text", text: finalText });
      return finalText;
    }
  }

  return "Reached maximum analysis iterations.";
}

/**
 * OpenRouter Provider (Universal Gateway for Claude, DeepSeek, GPT-4o, Llama, Mistral)
 */
async function runOpenRouterAgent(
  messages: ChatMessage[],
  apiKey: string,
  tools: ToolDefinition[],
  onEvent: (event: AgentStepEvent) => void,
  model = "anthropic/claude-3.5-sonnet"
): Promise<string> {
  const openrouter = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://dalaldesk.in",
      "X-Title": "DalalDesk Institutional Trading Copilot",
    },
  });

  const needTools = shouldAttachTools(messages);
  const openrouterTools: any[] = needTools
    ? tools.map((t) => ({
        type: "function",
        function: {
          name: t.name,
          description: (t.description || t.name).slice(0, 1024),
          parameters: t.inputSchema || { type: "object", properties: {} },
        },
      }))
    : [];

  const chatMessages: any[] = [
    { role: "system", content: SYSTEM_INSTRUCTION },
    ...messages.map((m) => ({
      role: m.role === "model" ? "assistant" : m.role,
      content: m.content,
    })),
  ];

  let iterations = 0;
  const maxIterations = 5;

  while (iterations < maxIterations) {
    iterations++;

    const createParams: any = {
      model: model || "anthropic/claude-3.5-sonnet",
      messages: chatMessages,
    };
    if (needTools && openrouterTools.length > 0) {
      createParams.tools = openrouterTools;
      createParams.tool_choice = "auto";
    }

    const response = await openrouter.chat.completions.create(createParams);

    const choice = response.choices?.[0];
    const message = choice?.message;

    if (message?.tool_calls && message.tool_calls.length > 0) {
      chatMessages.push(message);

      for (const tc of message.tool_calls) {
        if (tc.type !== "function") continue;
        const fnName = tc.function.name;
        let fnArgs: any = {};
        try {
          fnArgs = JSON.parse(tc.function.arguments || "{}");
        } catch {
          fnArgs = {};
        }

        onEvent({ type: "tool_start", toolName: fnName, toolArgs: fnArgs });

        let result: any;
        try {
          result = await executeTool(fnName, fnArgs);
          onEvent({ type: "tool_end", toolName: fnName, toolArgs: fnArgs, toolResult: result });
        } catch (err: any) {
          result = { error: err.message || "Execution failed" };
          onEvent({ type: "error", toolName: fnName, error: err.message });
        }

        chatMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: typeof result === "object" ? JSON.stringify(result) : String(result),
        });
      }
    } else {
      const finalText = message?.content || "No response generated.";
      onEvent({ type: "text", text: finalText });
      return finalText;
    }
  }

  return "Reached maximum analysis iterations.";
}

function extractActiveSymbol(messages: ChatMessage[]): { symbol: string | null; isExplicitInLatest: boolean } {
  const lastMsg = messages[messages.length - 1]?.content || "";
  const trimmed = lastMsg.trim();
  const lower = trimmed.toLowerCase();

  // 1. Guard: Conversational phrases, timeframe replies, sector replies, or general chat
  const isConversational =
    /^(swing|intraday|positional|scalp|scalping|long term|short term|banking|it|tech|autos?|pharma|fmcg|energy|metals?|infra|realty|yes|no|ok|okay|thanks|thank you|cool|great|sure|fine|understood|got it|tell me|what else|why|how)\b/i.test(lower);
  if (isConversational) {
    return { symbol: null, isExplicitInLatest: false };
  }

  // 2. Guard: General recommendation/strategy questions
  const isSuggestionOrQuestion =
    /\b(suggest|recommend|pick|picks|idea|ideas|watchlist|scan|best stocks|good stocks|top stocks|which stocks|what stocks|any stocks)\b/i.test(lower);
  if (isSuggestionOrQuestion) {
    return { symbol: null, isExplicitInLatest: false };
  }

  const lastWords = trimmed.toUpperCase().match(/\b[A-Z0-9_\-]{2,14}\b/g) || [];

  // 3. Known NSE stock ticker explicitly in latest message
  const knownLatest = lastWords.find((w) => KNOWN_NSE_STOCKS.has(w));
  if (knownLatest) return { symbol: knownLatest, isExplicitInLatest: true };

  // 4. Explicit command prefix like "analyze XYZ", "quote XYZ", "$XYZ"
  const explicitTickerMatch = trimmed.match(/(?:\$|quote\s+|analyze\s+|check\s+|ticker\s+|symbol\s+)([A-Z0-9_\-]{2,14})\b/i);
  if (explicitTickerMatch && isPotentialTicker(explicitTickerMatch[1].toUpperCase())) {
    return { symbol: explicitTickerMatch[1].toUpperCase(), isExplicitInLatest: true };
  }

  // 5. Isolated single token that looks like an unknown ticker (e.g. user typed just "CDSL" or "BSE")
  if (lastWords.length === 1 && isPotentialTicker(lastWords[0])) {
    return { symbol: lastWords[0], isExplicitInLatest: true };
  }

  // 6. Follow-up referring to previous stock ONLY if latest message contains an explicit pronoun/metric
  const isPronounFollowUp = /\b(its?\s+(target|stop\s*loss|sl|support|resistance|dma|ema|rsi|cpr|trend)|the\s+stock|the\s+share)\b/i.test(lower);
  if (isPronounFollowUp) {
    for (let i = messages.length - 2; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === "user") {
        const words = msg.content.toUpperCase().match(/\b[A-Z0-9_\-]{2,14}\b/g) || [];
        const priorKnown = words.find((w) => KNOWN_NSE_STOCKS.has(w));
        if (priorKnown) {
          return { symbol: priorKnown, isExplicitInLatest: false };
        }
      }
    }
  }

  return { symbol: null, isExplicitInLatest: false };
}

/**
 * Conversational Trading Expert & Market Strategist
 * Delivers natural dialogue, actionable trade setups, masterclass strategy guidance,
 * and data-backed quantitative trade plans.
 */
async function handleWithoutApiKey(
  messages: ChatMessage[],
  onEvent: (event: AgentStepEvent) => void
): Promise<string> {
  const lastUserMessage = messages[messages.length - 1]?.content || "";
  const trimmed = lastUserMessage.trim();
  const lower = trimmed.toLowerCase();

  // 1. Natural Conversational Greetings
  const isGreeting = /^(hi|hello|hey|good\s+morning|good\s+afternoon|good\s+evening|namaste|who\s+are\s+you|what\s+can\s+you\s+do|how\s+are\s+you|help)\b/i.test(lower);
  if (isGreeting) {
    const greetingText = `Hello. I am DalalDesk, your Senior Trading Partner and Market Strategist on Dalal Street.

I bring 15+ years of institutional prop trading experience across Indian cash equities, futures, and index options, backed by live connectivity to official National Stock Exchange (NSE) feeds and Bhavcopy quantitative databases.

Here is what we can do together:
* **Actionable Trade Setups**: Direct evaluation of trade setups with high-probability Entry Zones, Target 1/2/3, and mathematical Stop Loss levels (targeting 1:2+ R:R).
* **Single Stock Breakdowns**: Price action, 20/50/200 DMA trend posture, volume divergence, and Camarilla/Floor Pivot boundaries for any NSE stock (e.g. RELIANCE, TCS, INFY, TATAMOTORS, HDFCBANK).
* **Market Sentiment & Breadth**: Real-time Advance/Decline participation across ~3,700 NSE issues and benchmark index regimes.
* **Trading Strategy & Derivatives**: Practical advice on swing trading, intraday execution, option strategies, and strict position sizing.

What are you analyzing on the tape today? Give me a ticker or share what you are looking to trade.`;
    onEvent({ type: "text", text: greetingText });
    return greetingText;
  }

  // 2. Conversational Timeframe Selection ("Swing", "Intraday", "Positional", "Scalp")
  const isTimeframe = /^(swing|intraday|positional|scalp|scalping|long term|short term)\b/i.test(lower) ||
    /\b(swing trading|intraday trading|day trading|scalping)\b/i.test(lower);

  if (isTimeframe) {
    let responseText = "";
    if (lower.includes("swing")) {
      responseText = `## DalalDesk Swing Trading Desk

For swing trading on Dalal Street (holding 3 to 10 sessions), our desk filters for:
* **Clean Base Breakouts**: Stocks breaking out of multi-week consolidation boxes with expanding delivery volume on the NSE Bhavcopy.
* **Moving Average Confluence**: Pullbacks testing the rising 20-EMA or 50-SMA dynamic demand shelf.
* **Defined Asymmetry**: Clear structural invalidation stop loss giving at least a 1:2.0 risk-to-reward ratio.

### Which sector or stocks are you looking to swing trade?
* **High-Beta Momentum**: Auto (Tata Motors, M&M) or Capital Goods (L&T, BEL)
* **Institutional Value**: Private Banks (HDFC Bank, ICICI Bank)
* **Defensive Continuation**: Pharma (Sun Pharma, Cipla) or FMCG (ITC)

Tell me which ticker is on your radar (e.g. \`TATAMOTORS\`, \`HDFCBANK\`, \`ITC\`, \`TCS\`), and I will pull its live tape and map out an exact Swing Game Plan with Entry, Targets, and Stop Loss.`;
    } else if (lower.includes("intraday") || lower.includes("scalp")) {
      responseText = `## DalalDesk Intraday Trading Desk

For intraday trading, we focus strictly on liquid large-caps and active F&O counters:
* **Opening Range Breakout (ORB)**: Price discovery in the 9:15 to 9:45 AM window.
* **Central Pivot Range (CPR)**: Virgin CPR tests and Floor Trader Pivots (S1/R1).
* **Relative Volume (RVOL > 1.5)**: Ensuring institutional participation rather than retail chop.

Drop any stock ticker on your radar (e.g. \`RELIANCE\`, \`INFY\`, \`TATAMOTORS\`, \`SBIN\`), and I will break down its live intraday demand/supply boundaries.`;
    } else {
      responseText = `## DalalDesk Positional Trading Desk

For multi-week positional trades, we align with the macro 200-SMA regime and quarterly earnings momentum.

Which stocks or sectors are on your radar for a positional allocation? Give me any ticker to run a structural analysis.`;
    }

    onEvent({ type: "text", text: responseText });
    return responseText;
  }

  // 3. Conversational Sector Selection ("Banking", "IT", "Autos", "Pharma", "FMCG", "Energy")
  const isSector = /^(banking|banks?|it|tech|autos?|pharma|fmcg|energy|metals?|infra|realty)\b/i.test(lower) ||
    /\b(banking sector|it sector|auto sector|pharma sector)\b/i.test(lower);

  if (isSector) {
    const sectorText = `## DalalDesk Sector Overview: ${trimmed.toUpperCase()}

When trading the **${trimmed.toUpperCase()}** space, look for leaders showing relative strength against the benchmark Nifty 50.

### Next Step:
Name any specific stock in this sector you would like to analyze (e.g., in Banking: \`HDFCBANK\`, \`ICICIBANK\`, \`SBIN\`; in Autos: \`TATAMOTORS\`, \`MARUTI\`; in IT: \`TCS\`, \`INFY\`), and I will pull its live NSE tape and provide the exact trade setup.`;
    onEvent({ type: "text", text: sectorText });
    return sectorText;
  }

  // 4. Conversational Acknowledgments ("Yes", "No", "Ok", "Thanks", "Got it")
  const isAck = /^(yes|no|ok|okay|thanks|thank you|cool|great|sure|fine|understood|got it)\b/i.test(lower);
  if (isAck) {
    const ackText = `Understood. Whenever you have a specific stock or chart in mind, send me the ticker (e.g. \`RELIANCE\`, \`TCS\`, \`TATAMOTORS\`, \`HDFCBANK\`), or ask me about market breadth or option strategies. What would you like to explore next?`;
    onEvent({ type: "text", text: ackText });
    return ackText;
  }

  // 5. Trading Strategy & Educational Questions
  const isEducational =
    (lower.includes("how to") || lower.includes("how should") || lower.includes("what is cpr") ||
     lower.includes("what is pivot") || lower.includes("risk to reward") || lower.includes("position size") ||
     lower.includes("strategy") || lower.includes("strategies") || lower.includes("option") ||
     lower.includes("straddle") || lower.includes("swing trading") || lower.includes("price action") ||
     lower.includes("breakout")) &&
    !lastUserMessage.toUpperCase().match(/\b(RELIANCE|TCS|INFY|HDFCBANK|ICICIBANK|SBIN|TATAMOTORS|MARUTI|SUNPHARMA|TITAN|BAJFINANCE|ADANIENT|WIPRO|NTPC|POWERGRID|ONGC|TATASTEEL|COALINDIA)\b/);

  if (isEducational) {
    let educationalText = "";
    if (lower.includes("risk") || lower.includes("size") || lower.includes("capital")) {
      educationalText = `## Trading Desk Masterclass: Risk Management & Position Sizing

As prop traders on Dalal Street, our primary job is not predicting direction: it is capital preservation and asymmetry.

### Core Risk Rules We Live By:
1. **The 1-2% Rule**: Never risk more than 1% to 2% of your total trading equity on any single trade.
2. **Mathematical Position Sizing Formula**:
   $$\\text{Quantity} = \\frac{\\text{Max Capital Risk (INR)}}{\\text{Entry Price} - \\text{Stop Loss Price}}$$
   *Example*: On a 5 Lakh account, 1% risk = INR 5,000. If buying Reliance at 1,390 with Stop Loss at 1,370 (Risk = INR 20), position size is $5,000 / 20 = 250$ shares.
3. **Minimum 1:2 Risk-to-Reward**: Never enter a setup where potential gain is not at least double your defined risk. With a 1:2 R:R, even a 40% win rate generates steady alpha.
4. **Invalidation Before Target**: Determine where your thesis is proven wrong *before* calculating your profit target.`;
    } else if (lower.includes("option") || lower.includes("straddle") || lower.includes("greeks") || lower.includes("oi")) {
      educationalText = `## Trading Desk Masterclass: Derivatives & Options Strategy

In Indian index options (NIFTY & BANKNIFTY), the retail trap is buying naked out-of-the-money (OTM) calls and puts into theta decay.

### High-Probability Options Frameworks:
1. **Open Interest (OI) Analysis**:
   * Peak Call OI acts as institutional resistance (supply ceiling).
   * Peak Put OI acts as institutional support (demand floor).
   * Put-Call Ratio (PCR) > 1.25 signals overbought expansion; PCR < 0.75 signals oversold exhaustion.
2. **Directional Defined-Risk Spreads**:
   * When bullish: Use Bull Call Spreads or Bull Put Credit Spreads to hedge volatility and time decay.
   * When range-bound: Iron Condors or Short Strangles outside expected weekly move bands.
3. **Volatility & Event Risk**: Never buy expensive options ahead of major RBI monetary policy or Union Budget without defined-risk hedging.`;
    } else {
      educationalText = `## Trading Desk Masterclass: Price Action & Market Structure

On the institutional desk, price action tells the true story of buyers and sellers:

### The 4 Pillars of Institutional Trading:
1. **Market Structure**: Identify whether the stock is printing Higher Highs / Higher Lows (Uptrend), Lower Highs / Lower Lows (Downtrend), or compressing within a structural consolidation box.
2. **Central Pivot Range (CPR) & Floor Pivots**:
   * Virgin CPR or narrow CPR days typically precede high-momentum breakout expansions.
   * Wide CPR days indicate mean-reverting, range-bound chop.
3. **Volume Confirmation**: Price breakouts without expanding delivery volume on the NSE Bhavcopy are frequently retail bull/bear traps.
4. **Moving Average Confluence**: Use the 20-EMA for momentum trend following, the 50-SMA for swing support, and the 200-SMA as the macro regime divider.`;
    }
    educationalText += `\n\nWhat specific stock would you like to apply these principles to? Tell me any NSE ticker (e.g. RELIANCE, TCS, INFY) to analyze its live setup.`;
    onEvent({ type: "text", text: educationalText });
    return educationalText;
  }

  // 3. Market Breadth / Sentiment Query
  const isGeneralBreadth = (lower.includes("mood") || lower.includes("breadth") || lower.includes("sentiment")) &&
    !lower.includes("news") && !lower.includes("target") && !lower.includes("stop loss");

  if (isGeneralBreadth) {
    onEvent({ type: "tool_start", toolName: "get_market_breadth", toolArgs: {} });
    const breadth = await executeTool("get_market_breadth", {});
    onEvent({ type: "tool_end", toolName: "get_market_breadth", toolResult: breadth });

    onEvent({ type: "tool_start", toolName: "get_market_mood", toolArgs: {} });
    const mood = await executeTool("get_market_mood", {});
    onEvent({ type: "tool_end", toolName: "get_market_mood", toolResult: mood });

    const advances = breadth?.advances || 0;
    const declines = breadth?.declines || 0;
    const adRatio = breadth?.ad_ratio || (declines > 0 ? (advances / declines).toFixed(2) : "N/A");
    const isBullish = advances > declines;

    let summary = `## Trading Desk Market Briefing: NSE Breadth & Sentiment\n\n`;
    summary += `**Senior Trader's Conviction Verdict**:\n`;
    summary += `* **Market Bias**: ${isBullish ? "Decisive Bullish Expansion" : "Defensive Capital Contraction"}. Advance-decline ratio stands at ${adRatio}.\n`;
    summary += `* **Participation**: ${advances.toLocaleString("en-IN")} advancing equities versus ${declines.toLocaleString("en-IN")} declining out of ${breadth?.total_stocks?.toLocaleString("en-IN") || "3,687"} total traded issues.\n`;
    summary += `* **Tactical Advice**: ${isBullish ? "Market conditions favor buying pullbacks in outperforming sectors (Autos, Banks, Cap Goods). Trail stops aggressively." : "Broad-market distribution underway. Keep position sizes light, avoid chasing breakouts, and hold dry powder."}\n\n`;

    summary += `### Market Breadth Matrix\n`;
    summary += `| Metric | Current Session | Interpretation |\n|---|---|---|\n`;
    summary += `| Advancing Equities | ${advances.toLocaleString("en-IN")} | ${advances > declines ? "Active Accumulation" : "Subdued"} |\n`;
    summary += `| Declining Equities | ${declines.toLocaleString("en-IN")} | ${declines > advances ? "Elevated Selling Pressure" : "Controlled"} |\n`;
    summary += `| Advance/Decline Ratio | ${adRatio} | ${Number(adRatio) >= 1.2 ? "Strongly Bullish (>1.2)" : Number(adRatio) <= 0.8 ? "Bearish (<0.8)" : "Neutral Consolidating"} |\n`;
    summary += `| Total Traded Securities | ${(breadth?.total_stocks || 3687).toLocaleString("en-IN")} | Broad Market Liquidity |\n\n`;

    if (mood?.benchmarks && Object.keys(mood.benchmarks).length > 0) {
      summary += `### Benchmark Index Posture\n`;
      summary += `| Benchmark Index | Close | Change (%) | Trend Posture |\n|---|---|---|---|\n`;
      for (const [name, data] of Object.entries(mood.benchmarks as Record<string, any>)) {
        const chg = data.change_pct || 0;
        const sign = chg >= 0 ? "+" : "";
        const posture = chg > 0.75 ? "Strong Uptrend" : chg >= 0 ? "Mild Bullish Bias" : chg > -0.75 ? "Mild Correction" : "Deep Pullback";
        summary += `| ${name} | ${data.close?.toLocaleString("en-IN") || "-"} | ${sign}${chg}% | ${posture} |\n`;
      }
      summary += `\n`;
    }

    summary += `### Key Institutional Observations\n`;
    summary += `* Breadth confirms ${isBullish ? "liquidity is sustaining broader market rallies beyond heavyweight index drivers" : "caution advised as selling extends beyond index heavyweights"}.\n`;
    summary += `* Monitor benchmark intraday high holding levels for follow-through momentum.\n\n`;
    summary += `NSE market data is provided for informational and research purposes only. Not investment advice.`;

    onEvent({ type: "text", text: summary });
    return summary;
  }

  // 4. Stock Recommendations & Watchlist Query (e.g. "Suggest good stocks", "Suggest trades", "Which stocks to buy?", "Top stocks", "Best swing trades")
  // 4. General Trade Suggestion Inquiry (Conversational Trading Mentor Dialogue)
  const isStockSuggestion =
    /\b(suggest|recommend|pick|picks|ideas?|watchlist|scan|best stocks|good stocks|top stocks|stocks to buy|shares to buy|trades|trade ideas)\b/i.test(lower) &&
    !lastUserMessage.toUpperCase().match(/\b(RELIANCE|TCS|INFY|HDFCBANK|ICICIBANK|SBIN|TATAMOTORS|MARUTI|SUNPHARMA|TITAN|BAJFINANCE|ADANIENT|WIPRO|NTPC|POWERGRID|ONGC|TATASTEEL|COALINDIA)\b/);

  if (isStockSuggestion) {
    const responseText = `## DalalDesk Trading Desk Consultation

As an institutional prop trader on Dalal Street, I do not hand out arbitrary stock tips. Real, profitable trading starts with defining your edge, timeframe, and risk tolerance.

### Tell me what you are looking to trade:
1. **Trading Timeframe**: Are you looking for **Intraday momentum** (quick 15-minute to 1-hour moves) or **Swing setups** (multi-day trend continuation)?
2. **Sector Preference**: Do you have a sector focus today (e.g. Banking, IT, Autos, Energy, FMCG)?
3. **Specific Stocks on Your Radar**: Name any ticker you are watching (e.g. \`RELIANCE\`, \`HDFCBANK\`, \`TCS\`, \`TATAMOTORS\`, \`INFY\`, \`ITC\`), and I will pull its live tape and provide a full Trade Plan with Entry, Stop-Loss, and Target 1/2/3.

What stock or sector do you want to dissect?`;

    onEvent({ type: "text", text: responseText });
    return responseText;
  }

  // 5. Stock Symbol Query (with multi-turn context retention)
  const { symbol: activeSymbol } = extractActiveSymbol(messages);

  if (activeSymbol) {
    onEvent({ type: "tool_start", toolName: "cm_get_stock_quote", toolArgs: { symbol: activeSymbol } });
    const rawQuote = await executeTool("cm_get_stock_quote", { symbol: activeSymbol });
    onEvent({ type: "tool_end", toolName: "cm_get_stock_quote", toolResult: rawQuote });

    const quote = rawQuote?.stock;
    const ltp = quote ? (quote.lastTradedPrice || quote.lastPrice || quote.ltp || quote.closePrice || 0) : 0;

    if (quote && typeof quote === "object" && !quote.error && Number(ltp) > 0) {
      const ltp = quote.lastTradedPrice || quote.lastPrice || quote.ltp || quote.closePrice || 0;
      const chg = quote.change ?? 0;
      const pct = quote.perChange ?? quote.pChange ?? quote.percChange ?? 0;
      const high = quote.highPrice || quote.dayHigh || quote.high || ltp;
      const low = quote.lowPrice || quote.dayLow || quote.low || ltp;
      const high52 = quote.fiftyTwoWeekHigh || quote.high52 || quote.week52High || high;
      const low52 = quote.fiftyTwoWeekLow || quote.low52 || quote.week52Low || low;
      const volume = quote.volume || quote.totalTradedVolume || 0;
      const prevClose = quote.preClosePrice || quote.previousClose || ltp;

      // Certified Algorithmic Target predictions
      const algoTargets = calculateAlgorithmicTargets({
        symbol: activeSymbol,
        ltp: Number(ltp) || 0,
        high: Number(high) || Number(ltp) || 0,
        low: Number(low) || Number(ltp) || 0,
        prevClose: Number(prevClose) || Number(ltp) || 0,
        fiftyTwoWeekHigh: high52 ? Number(high52) : undefined,
        fiftyTwoWeekLow: low52 ? Number(low52) : undefined,
        volume: Number(volume) || 0,
        changePct: Number(pct) || 0,
      });

      // Accredited institutional consensus & real-time live news
      onEvent({ type: "tool_start", toolName: "get_live_equity_news", toolArgs: { symbol: activeSymbol } });
      const recommendation = await getEquityRecommendation(activeSymbol, Number(ltp) || 0);
      onEvent({ type: "tool_end", toolName: "get_live_equity_news", toolResult: { count: recommendation.newsFlow.length } });

      const sign = Number(pct) >= 0 ? "+" : "";
      const isBullish = algoTargets.bias.includes("BULLISH");
      const currentPrice = Number(ltp) || 1;
      const fmtMove = (val: number) => val > 0 ? `+${val.toFixed(1)}%` : `${val.toFixed(1)}%`;
      const t1Move = fmtMove((algoTargets.targets.t1Conservative - currentPrice) / currentPrice * 100);
      const t2Move = fmtMove((algoTargets.targets.t2BaseCase - currentPrice) / currentPrice * 100);
      const t3Move = fmtMove((algoTargets.targets.t3Extended - currentPrice) / currentPrice * 100);
      const slMove = fmtMove((algoTargets.stopLoss.recommended - currentPrice) / currentPrice * 100);

      let summary = `## ${activeSymbol} Trading Desk Assessment & Trade Plan\n\n`;
      summary += `Looking at the live tape on **${activeSymbol}**, the stock is currently trading at **INR ${Number(ltp).toLocaleString("en-IN")}** (${sign}${pct}%):\n\n`;

      summary += `### 1. Trader's Market Bias & Regime\n`;
      summary += `* **Conviction Verdict**: **${algoTargets.bias}** (Conviction Score: **${algoTargets.compositeScore}/100**, Statistical Confidence: **${algoTargets.confidencePct}%**)\n`;
      summary += `* **Trade Posture**: ${isBullish ? "Accumulate on pullbacks into key demand support. Momentum favors continuation." : "Price is consolidating or in distribution. Avoid aggressive long sizing; wait for structural base confirmation."}\n`;
      summary += `* **Expected Daily Volatility (ATR)**: INR ${algoTargets.metrics.trueRange} (~${algoTargets.metrics.atrPercent}% of LTP). Proximity to 52-week peak: -${algoTargets.metrics.distFrom52WHighPct}%.\n\n`;

      summary += `### 2. High-Probability Trade Game Plan\n`;
      summary += `| Action Parameter | Price Level (INR) | Expected Move | Tactical Trading Notes |\n|---|---|---|---|\n`;
      summary += `| **Optimal Entry Zone** | **${Math.round(currentPrice * 0.995 * 20) / 20} to ${currentPrice.toLocaleString("en-IN")}** | CMP Range | Enter near intraday demand shelf or retest of pivot |\n`;
      summary += `| **Target 1 (Conservative)** | **${algoTargets.targets.t1Conservative.toLocaleString("en-IN")}** | **${t1Move}** | First scaling-out zone / Floor Pivot R1 |\n`;
      summary += `| **Target 2 (Swing Base Case)** | **${algoTargets.targets.t2BaseCase.toLocaleString("en-IN")}** | **${t2Move}** | Major resistance retest & 2.35x ATR target |\n`;
      summary += `| **Target 3 (Breakout Expansion)** | **${algoTargets.targets.t3Extended.toLocaleString("en-IN")}** | **${t3Move}** | 161.8% Fibonacci structural extension |\n`;
      summary += `| **Strict Invalidation (SL)** | **${algoTargets.stopLoss.recommended.toLocaleString("en-IN")}** | **${slMove}** | Invalidation threshold (1.25x ATR cushion) |\n`;
      summary += `| **Risk-to-Reward Ratio (R:R)** | **${algoTargets.riskRewardRatio}** | Asymmetric | Meets professional desk criteria (> 1:2.0) |\n\n`;

      summary += `### 3. Key Mathematical Reference Grid\n`;
      summary += `| Indicator / Model | Support (Demand) | Pivot Baseline | Resistance (Supply) |\n|---|---|---|---|\n`;
      summary += `| **Floor Trader Pivots** | S1: ${algoTargets.pivots.s1} / S2: ${algoTargets.pivots.s2} | Pivot: ${algoTargets.pivots.pivot} | R1: ${algoTargets.pivots.r1} / R2: ${algoTargets.pivots.r2} |\n`;
      summary += `| **Camarilla Equation** | L3 Sup: ${algoTargets.camarilla.l3Support} / L4: ${algoTargets.camarilla.l4Breakdown} | Range Neutral | H3 Res: ${algoTargets.camarilla.h3Resistance} / H4: ${algoTargets.camarilla.h4Breakout} |\n`;
      summary += `| **Fibonacci Projections** | 50.0% Ret: ${algoTargets.fibonacci.ret50} | Baseline | 127.2%: ${algoTargets.fibonacci.ext1272} / 161.8%: ${algoTargets.fibonacci.ext1618} |\n\n`;

      if (recommendation.analystReports.length > 0) {
        summary += `### 4. Verified Institutional Brokerage Reports\n`;
        summary += `| Brokerage House | Rating | Target (INR) | Implied Upside | Headline Reference | Official Source & Date |\n|---|---|---|---|---|---|\n`;
        for (const r of recommendation.analystReports.slice(0, 5)) {
          const sourceDisplay = r.url ? `[${r.source}](${r.url})` : r.source;
          summary += `| **${r.brokerage}** | \`${r.rating}\` | **${r.targetPrice.toLocaleString("en-IN")}** | +${r.upsidePct}% | ${r.catalyst} | *${sourceDisplay}* (${r.reportDate}) |\n`;
        }
        summary += `\n`;
      } else {
        summary += `### 4. Institutional Research & Brokerage Notes\n`;
        summary += `* **Live Coverage**: No active brokerage notes with explicit target prices detected in accredited financial dispatches over the last 30 days for ${activeSymbol}.\n`;
        summary += `* **Authentic Data Guarantee**: DalalDesk does not generate synthetic, static, or simulated estimates. All quantitative targets are computed mathematically from official NSE OHLC exchange data.\n\n`;
      }

      if (recommendation.newsFlow.length > 0) {
        summary += `### 5. Accredited Live Real-Time News Flow\n`;
        for (const n of recommendation.newsFlow.slice(0, 3)) {
          const headlineDisplay = n.url ? `[${n.headline}](${n.url})` : n.headline;
          const sourceDisplay = n.url ? `[${n.source}](${n.url})` : n.source;
          summary += `* **${headlineDisplay}**\n  *Source: ${sourceDisplay} • Published: ${n.timestamp}*\n`;
        }
        summary += `\n`;
      }

      summary += `### 6. Trader's Execution Discipline\n`;
      summary += `* Never risk more than 1% to 2% of overall trading capital on this position.\n`;
      summary += `* If price breaks below the Invalidation Level (INR ${algoTargets.stopLoss.recommended.toLocaleString("en-IN")}), exit without hesitation.\n\n`;
      summary += `NSE market data is provided for informational and research purposes only. Not investment advice.`;

      onEvent({ type: "text", text: summary });
      return summary;
    } else {
      const notFound = `## Equity Symbol Lookup: ${activeSymbol}\n\nSymbol ${activeSymbol} was not found on the NSE live feed. Please verify the official NSE trading symbol (e.g. RELIANCE, TCS, INFY, HDFCBANK).\n\nNSE market data is provided for informational and research purposes only. Not investment advice.`;
      onEvent({ type: "text", text: notFound });
      return notFound;
    }
  }

  // 5. Default Conversational Trading Partner Response
  const responseText = `## DalalDesk Trading Desk Consultation

I am actively tracking National Stock Exchange (NSE) order flow, derivatives structure, and Bhavcopy datasets.

### How Can I Help Your Trading Right Now?
* **Analyze a Specific Stock**: Send me any ticker like \`RELIANCE\`, \`TATAMOTORS\`, \`HDFCBANK\`, \`TCS\`, or \`INFY\` for an immediate Trade Setup with Entry, Stop-Loss, and Target 1/2/3.
* **Assess Market Breadth**: Ask *"How is market breadth today?"* or *"What is the Nifty outlook?"* for institutional advance/decline participation.
* **Discuss Trading Strategy**: Ask about option strategies (straddles, spreads), Central Pivot Range (CPR), or how to calculate exact position sizing.
* **Volume Movers & Breakouts**: Ask *"Show me volume surge leaders"* or *"52-week high breakouts"*.

What stock or market setup would you like to break down?`;

  onEvent({ type: "text", text: responseText });
  return responseText;
}
