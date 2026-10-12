"use client";

import React, { useState, useEffect } from "react";
import { Key, X, ExternalLink, ShieldCheck, Check } from "lucide-react";
import { LLMProvider, PROVIDER_MODELS, DEFAULT_MODEL_FOR_PROVIDER } from "@/lib/aiAgent";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProvider: LLMProvider;
  onSelectProvider: (provider: LLMProvider) => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  apiKeys: Record<LLMProvider, string>;
  onSaveKey: (provider: LLMProvider, key: string) => void;
}

export function ApiKeyModal({
  isOpen,
  onClose,
  activeProvider,
  onSelectProvider,
  selectedModel,
  onSelectModel,
  apiKeys,
  onSaveKey,
}: ApiKeyModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>(activeProvider);
  const [currentKey, setCurrentKey] = useState<string>(apiKeys[activeProvider] || "");
  const [currentModel, setCurrentModel] = useState<string>(
    selectedModel || DEFAULT_MODEL_FOR_PROVIDER[activeProvider]
  );

  useEffect(() => {
    setSelectedProvider(activeProvider);
    setCurrentKey(apiKeys[activeProvider] || "");
    // Ensure selected model belongs to provider
    const validModels = PROVIDER_MODELS[activeProvider]?.map((m) => m.id) || [];
    if (selectedModel && validModels.includes(selectedModel)) {
      setCurrentModel(selectedModel);
    } else {
      setCurrentModel(DEFAULT_MODEL_FOR_PROVIDER[activeProvider]);
    }
  }, [activeProvider, apiKeys, isOpen, selectedModel]);

  const handleProviderTab = (prov: LLMProvider) => {
    setSelectedProvider(prov);
    setCurrentKey(apiKeys[prov] || "");
    const provModels = PROVIDER_MODELS[prov]?.map((m) => m.id) || [];
    if (!provModels.includes(currentModel)) {
      setCurrentModel(DEFAULT_MODEL_FOR_PROVIDER[prov]);
    }
  };

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

  const handleSave = () => {
    onSaveKey(selectedProvider, currentKey.trim());
    onSelectProvider(selectedProvider);
    onSelectModel(currentModel);
    onClose();
  };

  const handleClear = () => {
    setCurrentKey("");
    onSaveKey(selectedProvider, "");
  };

  const providerDetails = {
    gemini: {
      name: "Google Gemini",
      model: "gemini-3.8-flash",
      placeholder: "AIzaSy...",
      link: "https://aistudio.google.com/apikey",
      linkLabel: "Google AI Studio",
    },
    openai: {
      name: "ChatGPT (OpenAI)",
      model: "gpt-4o",
      placeholder: "sk-proj-...",
      link: "https://platform.openai.com/api-keys",
      linkLabel: "OpenAI API Keys",
    },
    anthropic: {
      name: "Claude (Anthropic)",
      model: "claude-3-7-sonnet-20250219",
      placeholder: "sk-ant-...",
      link: "https://console.anthropic.com/settings/keys",
      linkLabel: "Anthropic Console",
    },
    openrouter: {
      name: "OpenRouter",
      model: "anthropic/claude-3.5-sonnet",
      placeholder: "sk-or-v1-...",
      link: "https://openrouter.ai/keys",
      linkLabel: "OpenRouter Keys",
    },
  };

  const currentDetails = providerDetails[selectedProvider];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.45)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "520px",
          maxWidth: "100%",
          borderRadius: "4px",
          padding: "24px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "4px",
              background: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Key size={16} color="#387ed1" />
            </div>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                AI Model & API Key Settings
              </h3>
              <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0 }}>
                Choose your preferred LLM provider for NSE quantitative analysis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "4px"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Provider Tabs */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "18px" }}>
          {(["gemini", "openai", "anthropic", "openrouter"] as LLMProvider[]).map((prov) => {
            const isTabActive = selectedProvider === prov;
            const hasKey = Boolean(apiKeys[prov]);
            return (
              <button
                key={prov}
                onClick={() => handleProviderTab(prov)}
                style={{
                  flex: 1,
                  padding: "8px 6px",
                  borderRadius: "4px",
                  background: isTabActive ? "#387ed1" : "#f8fafc",
                  color: isTabActive ? "#ffffff" : "#475569",
                  border: isTabActive ? "1px solid #387ed1" : "1px solid #e2e8f0",
                  cursor: "pointer",
                  fontSize: "0.76rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                  transition: "all 0.15s ease"
                }}
              >
                <span>
                  {prov === "gemini" ? "Gemini" : prov === "openai" ? "ChatGPT" : prov === "anthropic" ? "Claude" : "OpenRouter"}
                </span>
                {hasKey && (
                  <span style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: isTabActive ? "#ffffff" : "#00d09c"
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Provider Form */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#1e293b" }}>
              {currentDetails.name} API Key
            </label>
            <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
              Default Model: <strong>{currentDetails.model}</strong>
            </span>
          </div>

          <input
            type="password"
            value={currentKey}
            onChange={(e) => setCurrentKey(e.target.value)}
            placeholder={currentDetails.placeholder}
            style={{
              width: "100%",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "4px",
              padding: "9px 12px",
              color: "#1e293b",
              fontSize: "0.85rem",
              fontFamily: "var(--font-mono)",
              outline: "none",
              transition: "border-color 0.15s ease"
            }}
            onFocus={(e) => (e.target.style.borderColor = "#387ed1")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          />
        </div>

        {/* Model Architecture Dropdown */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#1e293b" }}>
              Active Model Architecture
            </label>
            <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
              {PROVIDER_MODELS[selectedProvider]?.length || 0} Models Available
            </span>
          </div>

          <select
            value={currentModel}
            onChange={(e) => setCurrentModel(e.target.value)}
            style={{
              width: "100%",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "4px",
              padding: "9px 12px",
              color: "#0f172a",
              fontSize: "0.825rem",
              fontWeight: 500,
              outline: "none",
              cursor: "pointer",
              transition: "border-color 0.15s ease"
            }}
            onFocus={(e) => (e.target.style.borderColor = "#387ed1")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          >
            {(PROVIDER_MODELS[selectedProvider] || []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} [{m.tag}] - {m.description}
              </option>
            ))}
          </select>
        </div>

        {/* Security Note */}
        <div style={{
          background: "#ecfdf5",
          border: "1px solid #a7f3d0",
          padding: "10px 12px",
          borderRadius: "4px",
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
          marginBottom: "18px"
        }}>
          <ShieldCheck size={16} color="#059669" style={{ marginTop: "1px" }} />
          <div style={{ fontSize: "0.75rem", color: "#065f46", lineHeight: 1.4 }}>
            Keys are saved in your local browser storage. Direct quote queries and manual 36 MCP tool runs work out-of-the-box even without an API key.
          </div>
        </div>

        {/* Footer Links & Buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <a
            href={currentDetails.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.78rem",
              color: "#387ed1",
              textDecoration: "none",
              fontWeight: 500
            }}
          >
            <span>Get key from {currentDetails.linkLabel}</span>
            <ExternalLink size={12} />
          </a>

          <div style={{ display: "flex", gap: "6px" }}>
            {apiKeys[selectedProvider] && (
              <button
                onClick={handleClear}
                style={{
                  background: "transparent",
                  border: "1px solid #e2e8f0",
                  color: "#dc2626",
                  padding: "7px 12px",
                  borderRadius: "4px",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                Clear Key
              </button>
            )}
            <button
              onClick={handleSave}
              style={{
                background: "#387ed1",
                border: "none",
                color: "#ffffff",
                padding: "7px 16px",
                borderRadius: "4px",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Set Active Provider
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
