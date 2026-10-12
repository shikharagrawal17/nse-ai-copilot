"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Code2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { marked } from "marked";
import { InvestorProfile } from "@/lib/investorProfile";

export interface ToolCallItem {
  id: string;
  name: string;
  args?: any;
  result?: any;
  status: "running" | "completed" | "error";
  error?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCallItem[];
  timestamp: string;
}

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onResetChat: () => void;
  investorProfile?: InvestorProfile;
}

export function ChatArea({
  messages,
  isLoading,
  onSendMessage,
  onResetChat,
  investorProfile,
}: ChatAreaProps) {
  const [inputText, setInputText] = useState("");
  const [expandedToolId, setExpandedToolId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText.trim();
    setInputText("");
    onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleExpandTool = (toolId: string) => {
    setExpandedToolId(expandedToolId === toolId ? null : toolId);
  };

  return (
    <div style={{
      flex: 1,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "#f9fafb",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Top Utility Bar */}
      <div style={{
        height: "40px",
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #e5e7eb",
        background: "#ffffff",
        fontSize: "0.75rem",
        color: "#64748b",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "1px", background: "#00d09c" }} />
          <span style={{ fontWeight: 600, color: "#334155" }}>
            DalalDesk Terminal
          </span>
          <span>• 36 Connected MCP Tools</span>
          {messages.length > 0 && (
            <span style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "#059669",
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              padding: "1px 6px",
              borderRadius: "2px",
              fontSize: "0.68rem",
              fontWeight: 600
            }}>
              <CheckCircle2 size={10} color="#059669" />
              Chat Saved
            </span>
          )}
        </div>
        {messages.length > 0 && (
          <button
            onClick={onResetChat}
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#475569",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
              fontSize: "0.72rem",
              padding: "3px 8px",
              borderRadius: "3px",
              fontWeight: 500
            }}
          >
            <RotateCcw size={10} />
            <span>New Chat</span>
          </button>
        )}
      </div>

      {/* Messages / Dashboard View */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}>
        {messages.length === 0 ? (
          <div style={{
            margin: "auto",
            maxWidth: "600px",
            textAlign: "center",
            padding: "40px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "18px"
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#387ed1"
            }}>
              <TrendingUp size={24} />
            </div>

            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", margin: "0 0 6px 0" }}>
                DalalDesk Trading Desk
              </h2>
              <p style={{ fontSize: "0.825rem", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                Senior Prop Trading Copilot with 36 live NSE market tools. Chat freely about trading setups, sector outlooks, risk management, or dissect any equity ticker.
              </p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginTop: "4px" }}>
              {[
                { label: "Swing Trade Setup", query: "Swing setup criteria" },
                { label: "Intraday Game Plan", query: "Intraday execution rules" },
                { label: "Market Breadth & Mood", query: "How is market breadth today?" },
                { label: "Analyze RELIANCE", query: "Analyze RELIANCE trade plan" },
                { label: "Analyze TATAMOTORS", query: "Analyze TATAMOTORS trade plan" },
                { label: "Risk Management Masterclass", query: "Explain risk management and position sizing" },
              ].map((starter, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(starter.query)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "18px",
                    padding: "6px 14px",
                    fontSize: "0.78rem",
                    fontWeight: 500,
                    color: "#334155",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#387ed1";
                    e.currentTarget.style.color = "#1e40af";
                    e.currentTarget.style.background = "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.color = "#334155";
                    e.currentTarget.style.background = "#ffffff";
                  }}
                >
                  {starter.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "5px",
                maxWidth: msg.role === "user" ? "78%" : "94%",
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              {/* Header */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                fontSize: "0.7rem",
                color: "#64748b",
              }}>
                {msg.role === "assistant" ? (
                  <>
                    <span style={{ fontWeight: 600, color: "#0f172a" }}>DalalDesk Analyst</span>
                    <span>• {msg.timestamp}</span>
                  </>
                ) : (
                  <>
                    <span>{msg.timestamp} •</span>
                    <span style={{ fontWeight: 600, color: "#0f172a" }}>User</span>
                  </>
                )}
              </div>

              {/* Tool Execution Tags (Sleek minimalist badges) */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "2px 0 4px 0" }}>
                  {msg.toolCalls.map((tc) => {
                    const isExpanded = expandedToolId === tc.id;
                    return (
                      <div
                        key={tc.id}
                        style={{
                          display: "inline-flex",
                          flexDirection: "column",
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          fontSize: "0.72rem",
                          padding: "4px 8px",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {tc.status === "running" ? (
                            <span style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: "#f59e0b",
                              display: "inline-block"
                            }} />
                          ) : tc.status === "completed" ? (
                            <CheckCircle2 size={11} color="#059669" />
                          ) : (
                            <AlertCircle size={11} color="#dc2626" />
                          )}
                          <span style={{ color: "#334155", fontWeight: 500 }}>
                            {tc.status === "running" ? `Fetching ${tc.name}...` : tc.name}
                          </span>
                          {tc.args?.symbol && (
                            <span style={{ color: "#387ed1", fontWeight: 600, fontSize: "0.68rem" }}>
                              {tc.args.symbol}
                            </span>
                          )}

                          {tc.result && (
                            <button
                              onClick={() => toggleExpandTool(tc.id)}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "#64748b",
                                padding: "0 2px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "2px",
                                fontSize: "0.66rem",
                                fontWeight: 500
                              }}
                              title={isExpanded ? "Collapse raw JSON" : "Inspect raw data"}
                            >
                              <span>{isExpanded ? "Hide" : "Data"}</span>
                              {isExpanded ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                            </button>
                          )}
                        </div>

                        {isExpanded && tc.result && (
                          <pre style={{
                            marginTop: "6px",
                            padding: "6px 8px",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "4px",
                            maxHeight: "180px",
                            overflowY: "auto",
                            fontSize: "0.68rem",
                            fontFamily: "var(--font-mono)",
                            color: "#334155"
                          }}>
                            {JSON.stringify(tc.result, null, 2)}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Message Content Bubble */}
              <div
                style={{
                  background: msg.role === "user" ? "#387ed1" : "#ffffff",
                  color: msg.role === "user" ? "#ffffff" : "#1e293b",
                  border: msg.role === "user" ? "none" : "1px solid #e2e8f0",
                  borderRadius: msg.role === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                  padding: msg.role === "user" ? "10px 14px" : "16px 20px",
                  boxShadow: msg.role === "user"
                    ? "0 1px 3px rgba(56, 126, 209, 0.18)"
                    : "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                {msg.role === "user" ? (
                  <div style={{ whiteSpace: "pre-wrap", fontSize: "0.875rem", fontWeight: 500, lineHeight: 1.5 }}>
                    {msg.content}
                  </div>
                ) : (
                  <div
                    className="prose-custom"
                    dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }}
                  />
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "4px",
            alignSelf: "flex-start",
            fontSize: "0.78rem",
            color: "#475569"
          }}>
            <Sparkles size={14} color="#387ed1" />
            <span>Querying NSE Capital Market and Bhavcopy feeds...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Footer */}
      <div style={{
        padding: "12px 18px",
        background: "#ffffff",
        borderTop: "1px solid #e5e7eb",
      }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about stock quotes, market breadth, top gainers, or 52-week highs (e.g. 'Compare RELIANCE and TCS over 60 days')..."
              rows={2}
              style={{
                width: "100%",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "4px",
                padding: "10px 12px",
                color: "#1e293b",
                fontSize: "0.85rem",
                fontFamily: "var(--font-sans)",
                resize: "none",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#387ed1";
                e.target.style.background = "#ffffff";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.background = "#f8fafc";
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            style={{
              height: "44px",
              padding: "0 18px",
              borderRadius: "4px",
              background: !inputText.trim() || isLoading
                ? "#e2e8f0"
                : "#387ed1",
              border: "none",
              color: !inputText.trim() || isLoading ? "#94a3b8" : "#ffffff",
              fontWeight: 600,
              fontSize: "0.825rem",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              cursor: !inputText.trim() || isLoading ? "not-allowed" : "pointer",
            }}
          >
            <span>Ask</span>
            <Send size={13} />
          </button>
        </form>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "0.68rem", color: "#64748b" }}>
          <span>Enter to send | Shift+Enter for newline</span>
          <span>NSE Data: For informational and research purposes only. Not investment advice.</span>
        </div>
      </div>
    </div>
  );
}
