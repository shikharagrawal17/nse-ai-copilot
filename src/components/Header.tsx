"use client";

import React from "react";
import Link from "next/link";
import { Key, Layers, Shield, FileText } from "lucide-react";

import { LLMProvider, PROVIDER_MODELS } from "@/lib/aiAgent";

interface HeaderProps {
  apiKey: string;
  provider: LLMProvider;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  onOpenApiKeyModal: () => void;
  onToggleToolsExplorer: () => void;
  toolsCount: { live: number; bhavcopy: number };
}

export function Header({
  apiKey,
  provider,
  selectedModel,
  onSelectModel,
  onOpenApiKeyModal,
  onToggleToolsExplorer,
  toolsCount,
}: HeaderProps) {
  return (
    <header style={{
      height: "54px",
      background: "#ffffff",
      borderBottom: "1px solid #e5e7eb",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      zIndex: 20,
      position: "relative"
    }}>
      {/* Brand & Market Feeds */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          {/* Geometric Fintech Emblem: No arrows, crisp dual-feed mark */}
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="6" fill="#0f172a"/>
            <rect x="8" y="7" width="6" height="18" rx="1.5" fill="#00d09c"/>
            <rect x="16" y="9" width="8" height="6" rx="1.5" fill="#387ed1"/>
            <rect x="16" y="17" width="8" height="8" rx="1.5" fill="#387ed1" fillOpacity="0.8"/>
          </svg>

          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a", letterSpacing: "-0.02em" }}>
              DalalDesk
            </span>
            <span style={{
              background: "#ecfdf5",
              color: "#059669",
              border: "1px solid #a7f3d0",
              padding: "1px 5px",
              fontSize: "0.68rem",
              fontWeight: 600,
              borderRadius: "3px"
            }}>
              NSE Live & Bhavcopy
            </span>
          </div>
        </Link>

        {/* Server Status Indicators (Clean Rectangular) */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "6px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            padding: "3px 8px",
            borderRadius: "3px",
            fontSize: "0.72rem",
            color: "#475569"
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "1px", background: "#00d09c" }} />
            <span>Live Feed: {toolsCount.live || 15} tools</span>
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            padding: "3px 8px",
            borderRadius: "3px",
            fontSize: "0.72rem",
            color: "#475569"
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "1px", background: "#387ed1" }} />
            <span>Bhavcopy: {toolsCount.bhavcopy || 21} tools</span>
          </div>
        </div>
      </div>

      {/* Navigation & Action Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Link
          href="/privacy"
          style={{
            color: "#64748b",
            fontSize: "0.78rem",
            fontWeight: 500,
            padding: "4px 8px",
            borderRadius: "3px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            textDecoration: "none"
          }}
        >
          <Shield size={13} />
          <span>Privacy</span>
        </Link>

        <Link
          href="/terms"
          style={{
            color: "#64748b",
            fontSize: "0.78rem",
            fontWeight: 500,
            padding: "4px 8px",
            borderRadius: "3px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            textDecoration: "none"
          }}
        >
          <FileText size={13} />
          <span>Terms</span>
        </Link>

        <div style={{ width: "1px", height: "18px", background: "#e2e8f0" }} />

        {/* Tools Explorer Button */}
        <button
          onClick={onToggleToolsExplorer}
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            color: "#1e293b",
            padding: "5px 12px",
            borderRadius: "4px",
            fontSize: "0.78rem",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          <Layers size={13} color="#387ed1" />
          <span>Explore Tools (36)</span>
        </button>

        {/* Model Architecture Dropdown Selector */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <select
            value={selectedModel}
            onChange={(e) => onSelectModel(e.target.value)}
            title="Switch Active AI Model"
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#0f172a",
              padding: "5px 10px",
              borderRadius: "4px",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: "pointer",
              outline: "none",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)"
            }}
          >
            {(PROVIDER_MODELS[provider] || []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} [{m.tag}]
              </option>
            ))}
          </select>
        </div>

        {/* API Key Modal Button */}
        <button
          onClick={onOpenApiKeyModal}
          style={{
            background: apiKey ? "#ecfdf5" : "#eff6ff",
            border: apiKey ? "1px solid #a7f3d0" : "1px solid #bfdbfe",
            color: apiKey ? "#059669" : "#2563eb",
            padding: "5px 12px",
            borderRadius: "4px",
            fontSize: "0.78rem",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          <Key size={12} />
          <span>
            {apiKey
              ? `${provider === "openai" ? "ChatGPT" : provider === "anthropic" ? "Claude" : "Gemini"} Active`
              : "AI Key Settings"}
          </span>
        </button>
      </div>
    </header>
  );
}
