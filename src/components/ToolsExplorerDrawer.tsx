"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Layers,
  Play,
  Database,
  Radio,
  ArrowRight,
} from "lucide-react";
import { ToolDefinition, getAvailableTools, executeTool } from "@/lib/mcpClient";

interface ToolsExplorerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSendQueryToChat: (query: string) => void;
}

export function ToolsExplorerDrawer({
  isOpen,
  onClose,
  onSendQueryToChat,
}: ToolsExplorerDrawerProps) {
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "cm-market" | "nse-bhavcopy">("all");
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);
  const [toolArgs, setToolArgs] = useState<Record<string, any>>({});
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [executing, setExecuting] = useState(false);
  const [durationMs, setDurationMs] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && tools.length === 0) {
      const loadTools = async () => {
        try {
          const res = await fetch("/api/mcp/tools");
          if (res.ok) {
            const data = await res.json();
            if (data.tools && data.tools.length > 0) {
              setTools(data.tools);
              setSelectedTool(data.tools[0]);
              return;
            }
          }
        } catch {
          // Continue to client-side fallback
        }

        try {
          const fallback = await getAvailableTools();
          if (fallback && fallback.length > 0) {
            setTools(fallback);
            setSelectedTool(fallback[0]);
          }
        } catch (err) {
          console.error("Failed to load tools", err);
        }
      };
      loadTools();
    }
  }, [isOpen, tools.length]);

  useEffect(() => {
    if (selectedTool) {
      const defaults: Record<string, any> = {};
      const props = selectedTool.inputSchema?.properties || {};
      for (const [key, prop] of Object.entries(props as Record<string, any>)) {
        if (key.toLowerCase().includes("symbol")) defaults[key] = "RELIANCE";
        else if (key.toLowerCase().includes("group")) defaults[key] = "broad";
        else if (key.toLowerCase().includes("date")) defaults[key] = "2026-10-09";
        else if (key.toLowerCase().includes("n") || key.toLowerCase().includes("limit")) defaults[key] = 10;
        else if (key.toLowerCase().includes("period") || key.toLowerCase().includes("window")) defaults[key] = 20;
        else defaults[key] = prop.default || "";
      }
      setToolArgs(defaults);
      setExecutionResult(null);
      setDurationMs(null);
    }
  }, [selectedTool]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredTools = tools.filter((t) => {
    const matchesTab = activeTab === "all" || t.server === activeTab;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleExecute = async () => {
    if (!selectedTool) return;
    setExecuting(true);
    setExecutionResult(null);
    const start = Date.now();
    try {
      let executed = false;
      try {
        const res = await fetch("/api/mcp/call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toolName: selectedTool.name,
            args: toolArgs,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.result !== undefined || data.error) {
            setExecutionResult(data.result || data.error);
            setDurationMs(data.durationMs || (Date.now() - start));
            executed = true;
          }
        }
      } catch {
        // Fallback for static deployment / network errors
      }

      if (!executed) {
        // Direct client-side execution for GitHub Pages or static deployment
        const result = await executeTool(selectedTool.name, toolArgs);
        setExecutionResult(result);
        setDurationMs(Date.now() - start);
      }
    } catch (err: any) {
      setExecutionResult({ error: err.message || "Failed to execute tool" });
      setDurationMs(Date.now() - start);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.35)",
          zIndex: 49,
        }}
      />
      <div style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: "680px",
        maxWidth: "95vw",
        background: "var(--bg-surface)",
        borderLeft: "1px solid var(--border-light)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        boxShadow: "var(--shadow-dropdown)"
      }}>
      {/* Header */}
      <div style={{
        height: "56px",
        padding: "0 20px",
        borderBottom: "1px solid var(--border-light)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--bg-surface)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Layers size={18} color="var(--kite-blue)" />
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
            NSE MCP Tools Registry (36)
          </h3>
        </div>

        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "4px"
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Filter Search & Tabs */}
      <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border-light)", display: "flex", gap: "10px", alignItems: "center", background: "var(--bg-subtle)" }}>
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "#ffffff",
          border: "1px solid var(--border-light)",
          padding: "6px 12px",
          borderRadius: "var(--radius-md)"
        }}>
          <Search size={14} color="var(--text-muted)" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools (e.g. quote, indices)..."
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: "0.825rem",
              width: "100%",
              fontWeight: 500
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "4px" }}>
          {(["all", "cm-market", "nse-bhavcopy"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? "var(--kite-blue)" : "#ffffff",
                border: activeTab === tab ? "1px solid var(--kite-blue)" : "1px solid var(--border-light)",
                color: activeTab === tab ? "#ffffff" : "var(--text-secondary)",
                padding: "6px 10px",
                borderRadius: "var(--radius-md)",
                fontSize: "0.75rem",
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              {tab === "cm-market" ? "Live (15)" : tab === "nse-bhavcopy" ? "Bhavcopy (21)" : "All (36)"}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Layout: Tool List vs Inspector */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Tool List */}
        <div style={{
          width: "250px",
          borderRight: "1px solid var(--border-light)",
          overflowY: "auto",
          background: "var(--bg-subtle)"
        }}>
          {filteredTools.map((t) => {
            const isSelected = selectedTool?.name === t.name;
            return (
              <button
                key={t.name}
                onClick={() => setSelectedTool(t)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 14px",
                  borderBottom: "1px solid var(--border-light)",
                  background: isSelected ? "#ffffff" : "transparent",
                  borderLeft: isSelected ? "3px solid var(--kite-blue)" : "3px solid transparent",
                  borderTop: "none",
                  borderRight: "none",
                  cursor: "pointer",
                  color: "inherit",
                  transition: "background 0.15s ease"
                }}
              >
                <div style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: isSelected ? "var(--kite-blue)" : "var(--text-primary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}>
                  {t.name}
                </div>
                <div style={{
                  fontSize: "0.68rem",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  marginTop: "3px"
                }}>
                  {t.server === "cm-market" ? <Radio size={10} color="var(--groww-green-text)" /> : <Database size={10} color="var(--kite-blue)" />}
                  <span>{t.server}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Tool Form & Runner */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {selectedTool ? (
            <>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h4 style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 700 }}>
                    {selectedTool.name}
                  </h4>
                  <span style={{
                    fontSize: "0.72rem",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-sm)",
                    background: selectedTool.server === "cm-market" ? "var(--groww-green-light)" : "var(--kite-blue-light)",
                    color: selectedTool.server === "cm-market" ? "var(--groww-green-text)" : "var(--kite-blue)",
                    fontWeight: 600,
                    border: `1px solid ${selectedTool.server === "cm-market" ? "var(--groww-green-border)" : "#bfdbfe"}`
                  }}>
                    {selectedTool.server}
                  </span>
                </div>
                <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginTop: "6px", lineHeight: 1.5, whiteSpace: "pre-line" }}>
                  {selectedTool.description || "No description provided."}
                </p>
              </div>

              {/* Argument Inputs */}
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Parameters
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                  {Object.entries(selectedTool.inputSchema?.properties || {}).length === 0 ? (
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                      Zero parameters required.
                    </span>
                  ) : (
                    Object.entries(selectedTool.inputSchema?.properties || {}).map(([key, prop]: [string, any]) => (
                      <div key={key}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "3px" }}>
                          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                            {key} {selectedTool.inputSchema?.required?.includes(key) && <span style={{ color: "var(--kite-red-text)" }}>*</span>}
                          </span>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                            {prop.type || "string"}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={toolArgs[key] ?? ""}
                          onChange={(e) => setToolArgs({ ...toolArgs, [key]: e.target.value })}
                          placeholder={prop.description || key}
                          style={{
                            width: "100%",
                            background: "var(--bg-subtle)",
                            border: "1px solid var(--border-light)",
                            borderRadius: "var(--radius-md)",
                            padding: "8px 12px",
                            fontSize: "0.825rem",
                            color: "var(--text-primary)",
                            outline: "none",
                            transition: "border-color 0.15s ease"
                          }}
                          onFocus={(e) => (e.target.style.borderColor = "var(--kite-blue)")}
                          onBlur={(e) => (e.target.style.borderColor = "var(--border-light)")}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={handleExecute}
                  disabled={executing}
                  style={{
                    flex: 1,
                    background: "var(--kite-blue)",
                    border: "none",
                    color: "#ffffff",
                    padding: "9px 16px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.825rem",
                    fontWeight: 600,
                    cursor: executing ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    boxShadow: "0 2px 4px rgba(56, 126, 209, 0.2)"
                  }}
                >
                  <Play size={13} />
                  <span>{executing ? "Querying..." : "Execute Tool"}</span>
                </button>

                <button
                  onClick={() => {
                    const query = `Analyze results of ${selectedTool.name} with parameters ${JSON.stringify(toolArgs)}`;
                    onSendQueryToChat(query);
                    onClose();
                  }}
                  style={{
                    background: "#ffffff",
                    border: "1px solid var(--border-light)",
                    color: "var(--text-primary)",
                    padding: "9px 14px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.825rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 500
                  }}
                >
                  <span>Ask in Chat</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* Execution Result */}
              {executionResult && (
                <div style={{ marginTop: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                      Output {durationMs && <span style={{ color: "var(--groww-green-text)", fontWeight: 500 }}>({durationMs}ms)</span>}
                    </span>
                  </div>
                  <pre style={{
                    background: "var(--bg-subtle)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "var(--radius-md)",
                    padding: "12px",
                    fontSize: "0.75rem",
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-secondary)",
                    maxHeight: "260px",
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all"
                  }}>
                    {typeof executionResult === "object" ? JSON.stringify(executionResult, null, 2) : String(executionResult)}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div style={{ margin: "auto", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Select a tool on the left to inspect and run directly.
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
