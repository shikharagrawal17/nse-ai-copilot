"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { TickerTape } from "@/components/TickerTape";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea, Message, ToolCallItem } from "@/components/ChatArea";
import { ToolsExplorerDrawer } from "@/components/ToolsExplorerDrawer";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { DEFAULT_INVESTOR_PROFILE, InvestorProfile } from "@/lib/investorProfile";
import { LLMProvider, PROVIDER_MODELS, DEFAULT_MODEL_FOR_PROVIDER } from "@/lib/aiAgent";

interface SavedSession {
  id: string;
  title: string;
  timestamp: string;
  messageCount: number;
  messages: Message[];
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => `session-${Date.now()}`);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState<LLMProvider>("gemini");
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.8-flash");
  const [apiKeys, setApiKeys] = useState<Record<LLMProvider, string>>({
    gemini: "",
    openai: "",
    anthropic: "",
  });
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isToolsExplorerOpen, setIsToolsExplorerOpen] = useState(false);
  const [toolsCount, setToolsCount] = useState<{ live: number; bhavcopy: number }>({
    live: 15,
    bhavcopy: 21,
  });
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile>(DEFAULT_INVESTOR_PROFILE);

  // Load API keys, active provider, model, saved sessions & active chat on mount
  useEffect(() => {
    // 1. Restore active conversation if available
    try {
      const activeChat = localStorage.getItem("dalaldesk_active_chat");
      const activeSessionId = localStorage.getItem("dalaldesk_active_session_id");
      if (activeChat) {
        const parsed = JSON.parse(activeChat);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
      if (activeSessionId) {
        setCurrentSessionId(activeSessionId);
      }
    } catch (e) {
      console.error("Failed to restore active chat", e);
    }

    // 2. Restore saved session archives
    try {
      const saved = localStorage.getItem("dalaldesk_saved_sessions");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSavedSessions(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to restore saved sessions", e);
    }

    const savedProvider = localStorage.getItem("active_ai_provider") as LLMProvider;
    let currentProv: LLMProvider = "gemini";
    if (savedProvider && ["gemini", "openai", "anthropic"].includes(savedProvider)) {
      setActiveProvider(savedProvider);
      currentProv = savedProvider;
    }

    let savedModel = localStorage.getItem("active_ai_model");
    // Auto-migrate legacy/deprecated Gemini model strings to gemini-3.8-flash
    if (savedModel === "gemini-2.5-flash" || savedModel === "gemini-1.5-flash") {
      savedModel = "gemini-3.8-flash";
      localStorage.setItem("active_ai_model", savedModel);
    } else if (savedModel === "gemini-2.5-pro") {
      savedModel = "gemini-3.8-pro";
      localStorage.setItem("active_ai_model", savedModel);
    }

    const validModels = PROVIDER_MODELS[currentProv]?.map((m) => m.id) || [];
    if (savedModel && validModels.includes(savedModel)) {
      setSelectedModel(savedModel);
    } else {
      setSelectedModel(DEFAULT_MODEL_FOR_PROVIDER[currentProv]);
    }

    const geminiKey = localStorage.getItem("gemini_api_key") || "";
    const openaiKey = localStorage.getItem("openai_api_key") || "";
    const anthropicKey = localStorage.getItem("anthropic_api_key") || "";

    setApiKeys({
      gemini: geminiKey,
      openai: openaiKey,
      anthropic: anthropicKey,
    });

    const savedProfile = localStorage.getItem("investor_profile");
    if (savedProfile) {
      try {
        setInvestorProfile({ ...DEFAULT_INVESTOR_PROFILE, ...JSON.parse(savedProfile) });
      } catch (err) {
        console.error("Failed to load investor profile", err);
      }
    }

    // Fetch tool counts
    fetch("/api/mcp/tools")
      .then((res) => res.json())
      .then((data) => {
        if (data.liveCount && data.bhavcopyCount) {
          setToolsCount({ live: data.liveCount, bhavcopy: data.bhavcopyCount });
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Auto-persist active messages to localStorage and sync saved sessions
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      try {
        localStorage.setItem("dalaldesk_active_chat", JSON.stringify(messages));
        localStorage.setItem("dalaldesk_active_session_id", currentSessionId);

        setSavedSessions((prev) => {
          const firstUserMsg = messages.find((m) => m.role === "user");
          const title = firstUserMsg
            ? firstUserMsg.content.slice(0, 36) + (firstUserMsg.content.length > 36 ? "..." : "")
            : "Analysis Session";
          const now =
            new Date().toLocaleDateString([], { month: "short", day: "numeric" }) +
            " " +
            new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

          const existingIndex = prev.findIndex((s) => s.id === currentSessionId);
          let updated: SavedSession[];
          if (existingIndex >= 0) {
            updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              title: prev[existingIndex].title || title,
              timestamp: now,
              messageCount: messages.length,
              messages: messages,
            };
          } else {
            const newSession: SavedSession = {
              id: currentSessionId,
              title,
              timestamp: now,
              messageCount: messages.length,
              messages: messages,
            };
            updated = [newSession, ...prev].slice(0, 10);
          }
          localStorage.setItem("dalaldesk_saved_sessions", JSON.stringify(updated));
          return updated;
        });
      } catch (e) {
        console.error("Failed to save chat to localStorage", e);
      }
    }
  }, [messages, isLoading, currentSessionId]);

  const handleSaveKey = (provider: LLMProvider, key: string) => {
    setApiKeys((prev) => ({ ...prev, [provider]: key }));
    const storageKey = `${provider}_api_key`;
    if (key) {
      localStorage.setItem(storageKey, key);
    } else {
      localStorage.removeItem(storageKey);
    }
  };

  const handleSelectProvider = (provider: LLMProvider) => {
    setActiveProvider(provider);
    localStorage.setItem("active_ai_provider", provider);

    const validModels = PROVIDER_MODELS[provider]?.map((m) => m.id) || [];
    if (!validModels.includes(selectedModel)) {
      const nextModel = DEFAULT_MODEL_FOR_PROVIDER[provider];
      setSelectedModel(nextModel);
      localStorage.setItem("active_ai_model", nextModel);
    }
  };

  const handleSelectModel = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem("active_ai_model", model);
  };

  const handleInvestorProfileChange = (nextProfile: InvestorProfile) => {
    setInvestorProfile(nextProfile);
    localStorage.setItem("investor_profile", JSON.stringify(nextProfile));
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const currentKey = apiKeys[activeProvider];

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const assistantMsgId = `assistant-${Date.now()}`;
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      toolCalls: [],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages([...newMessages, initialAssistantMsg]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(currentKey ? { "x-api-key": currentKey } : {}),
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          investorProfile,
          apiKey: currentKey || undefined,
          provider: activeProvider,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      let currentText = "";
      const currentToolCalls: ToolCallItem[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === "tool_start") {
              const existing = currentToolCalls.find((t) => t.id === `${event.toolName}`);
              if (!existing) {
                currentToolCalls.push({
                  id: `${event.toolName}-${Date.now()}`,
                  name: event.toolName,
                  args: event.toolArgs,
                  status: "running",
                });
              }
            } else if (event.type === "tool_end") {
              const tool = currentToolCalls.find((t) => t.name === event.toolName && t.status === "running");
              if (tool) {
                tool.status = "completed";
                tool.result = event.toolResult;
              }
            } else if (event.type === "text") {
              currentText += event.text;
            } else if (event.type === "error") {
              currentText += `\n\n> [!WARNING]\n> Error: ${event.error}`;
            }

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? {
                      ...msg,
                      content: currentText,
                      toolCalls: [...currentToolCalls],
                    }
                  : msg
              )
            );
          } catch (e) {
            console.error("SSE parse error", e);
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: `Error: Failed to execute research query: ${err.message}`,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSymbol = (symbol: string) => {
    handleSendMessage(`Provide a comprehensive live quote and recent volume analysis for ${symbol}`);
  };

  const handleResetChat = () => {
    // Generate fresh session ID for new conversation
    const newSessionId = `session-${Date.now()}`;
    setCurrentSessionId(newSessionId);
    setMessages([]);
    localStorage.removeItem("dalaldesk_active_chat");
    localStorage.setItem("dalaldesk_active_session_id", newSessionId);
  };

  const handleLoadSession = (sessionId: string) => {
    const targetSession = savedSessions.find((s) => s.id === sessionId);
    if (targetSession && Array.isArray(targetSession.messages)) {
      setCurrentSessionId(sessionId);
      setMessages(targetSession.messages);
      localStorage.setItem("dalaldesk_active_chat", JSON.stringify(targetSession.messages));
      localStorage.setItem("dalaldesk_active_session_id", sessionId);
    }
  };

  const handleClearSavedChats = () => {
    setSavedSessions([]);
    localStorage.removeItem("dalaldesk_saved_sessions");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", overflow: "hidden" }}>
      {/* Top Header */}
      <Header
        apiKey={apiKeys[activeProvider]}
        provider={activeProvider}
        selectedModel={selectedModel}
        onSelectModel={handleSelectModel}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onToggleToolsExplorer={() => setIsToolsExplorerOpen(!isToolsExplorerOpen)}
        toolsCount={toolsCount}
      />

      {/* Live Indices Ticker Tape */}
      <TickerTape />

      {/* Main Workspace Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Sidebar */}
        <Sidebar
          onSelectPrompt={handleSendMessage}
          onSelectSymbol={handleSelectSymbol}
          investorProfile={investorProfile}
          onInvestorProfileChange={handleInvestorProfileChange}
          savedSessions={savedSessions}
          onLoadSession={handleLoadSession}
          onClearSavedChats={handleClearSavedChats}
        />

        {/* Center Chat Area */}
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onResetChat={handleResetChat}
          investorProfile={investorProfile}
        />
      </div>

      {/* Tools Explorer Drawer */}
      <ToolsExplorerDrawer
        isOpen={isToolsExplorerOpen}
        onClose={() => setIsToolsExplorerOpen(false)}
        onSendQueryToChat={handleSendMessage}
      />

      {/* Multi-Provider API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        activeProvider={activeProvider}
        onSelectProvider={handleSelectProvider}
        selectedModel={selectedModel}
        onSelectModel={handleSelectModel}
        apiKeys={apiKeys}
        onSaveKey={handleSaveKey}
      />
    </div>
  );
}
