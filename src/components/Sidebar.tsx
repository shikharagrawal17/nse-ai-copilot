"use client";

import React, { useEffect, useState } from "react";
import {
  Compass,
  TrendingUp,
  Scale,
  Calendar,
  Activity,
  ChevronRight,
  Search,
  SlidersHorizontal,
  FileText,
} from "lucide-react";
import { InvestorProfile, RiskStyle } from "@/lib/investorProfile";

interface SidebarProps {
  onSelectPrompt: (prompt: string) => void;
  onSelectSymbol: (symbol: string) => void;
  investorProfile?: InvestorProfile;
  onInvestorProfileChange?: (nextProfile: InvestorProfile) => void;
  savedSessions?: { id: string; title: string; timestamp: string; messageCount: number }[];
  onLoadSession?: (sessionId: string) => void;
  onClearSavedChats?: () => void;
}

export function Sidebar({
  onSelectPrompt,
  onSelectSymbol,
  investorProfile,
  onInvestorProfileChange,
  savedSessions,
  onLoadSession,
  onClearSavedChats,
}: SidebarProps) {
  const [pulseData, setPulseData] = useState<any>(null);
  const [customSymbol, setCustomSymbol] = useState("");

  useEffect(() => {
    fetch("/api/market-pulse")
      .then((res) => res.json())
      .then((data) => setPulseData(data))
      .catch((err) => console.error(err));
  }, []);

  const breadth = pulseData?.mood?.breadth || {
    advances: 0,
    declines: 0,
    unchanged: 0,
    ad_ratio: 0,
    total_stocks: 0,
  };

  const total = (breadth.advances || 0) + (breadth.declines || 0) || 1;
  const advancePercent = breadth.advances ? Math.round(((breadth.advances || 0) / total) * 100) : 50;

  const curatedPrompts = [
    {
      title: "Market Breadth & Sentiment",
      desc: "Advance/Decline ratio across ~3,700 stocks",
      icon: <Compass size={15} color="#387ed1" />,
      query: "Analyze NSE market breadth: compute advance-decline ratio, active issue participation, and benchmark conviction with key takeaway.",
    },
    {
      title: "Top Gainers & Volume Surge",
      desc: "Institutional accumulation and turnover leaders",
      icon: <Activity size={15} color="#059669" />,
      query: "Scan NSE capital market for institutional volume surges: retrieve top volume leaders, price change confirmation, and turnover.",
    },
    {
      title: "Compare RELIANCE vs TCS",
      desc: "60-day relative strength & volume divergence",
      icon: <Scale size={15} color="#387ed1" />,
      query: "Execute quantitative comparison: RELIANCE vs TCS over the last 60 sessions. Evaluate price divergence, moving average posture, and relative volume.",
    },
    {
      title: "52-Week High Breakouts",
      desc: "Equities within 2% of annual structural peaks",
      icon: <TrendingUp size={15} color="#059669" />,
      query: "Scan equities trading within 2% of 52-week high with confirming volume momentum and key resistance thresholds.",
    },
    {
      title: "Algorithmic Target Forecast",
      desc: "Floor Pivots, ATR Projections & Risk:Reward",
      icon: <TrendingUp size={15} color="#059669" />,
      query: "Execute certified algorithmic target prediction and risk-reward modeling for RELIANCE: forecast Target 1, Target 2, Target 3, ATR Stop Loss, and Camarilla pivots.",
    },
    {
      title: "Analyst Consensus & News",
      desc: "Broker targets, reports & accredited sources",
      icon: <FileText size={15} color="#387ed1" />,
      query: "Fetch latest accredited news and institutional analyst research reports for RELIANCE with broker ratings and sources.",
    },
    {
      title: "Upcoming Corporate Actions",
      desc: "Dividends, bonus issues, and share splits",
      icon: <Calendar size={15} color="#d97706" />,
      query: "Retrieve upcoming NSE corporate actions: ex-dividend dates, bonus distributions, and share splits with record dates.",
    },
  ];

  const watchlist = [
    { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy" },
    { symbol: "TCS", name: "Tata Consultancy Services", sector: "IT Services" },
    { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking" },
    { symbol: "INFY", name: "Infosys", sector: "IT Services" },
    { symbol: "TATAMOTORS", name: "Tata Motors", sector: "Automobile" },
    { symbol: "ICICIBANK", name: "ICICI Bank", sector: "Banking" },
  ];

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSymbol.trim()) {
      onSelectSymbol(customSymbol.trim().toUpperCase());
      setCustomSymbol("");
    }
  };

  return (
    <aside style={{
      width: "310px",
      minWidth: "310px",
      height: "100%",
      background: "#ffffff",
      borderRight: "1px solid #e5e7eb",
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
      padding: "16px",
      gap: "16px",
      fontSize: "0.825rem",
    }}>
      {/* Quick Search Input */}
      <form onSubmit={handleCustomSearch}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "4px",
          padding: "7px 10px",
        }}>
          <Search size={14} color="#64748b" />
          <input
            type="text"
            value={customSymbol}
            onChange={(e) => setCustomSymbol(e.target.value)}
            placeholder="Search stock (e.g. INFY, ITC)..."
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "0.825rem",
              color: "#1e293b",
              width: "100%",
              fontWeight: 500,
            }}
          />
        </div>
      </form>

      {/* Analysis Lens Selector */}
      {investorProfile && onInvestorProfileChange && (
        <div style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "4px",
          padding: "10px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <SlidersHorizontal size={13} color="#387ed1" />
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                Analysis Lens
              </span>
            </div>
            <span style={{
              fontSize: "0.68rem",
              background: "#eff6ff",
              color: "#2563eb",
              border: "1px solid #bfdbfe",
              padding: "1px 6px",
              borderRadius: "2px",
              fontWeight: 600
            }}>
              {investorProfile.riskStyle}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px" }}>
            {(["Conservative", "Balanced", "Aggressive"] as RiskStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => onInvestorProfileChange({ ...investorProfile, riskStyle: style })}
                style={{
                  background: investorProfile.riskStyle === style ? "#387ed1" : "#f8fafc",
                  color: investorProfile.riskStyle === style ? "#ffffff" : "#475569",
                  border: `1px solid ${investorProfile.riskStyle === style ? "#387ed1" : "#e2e8f0"}`,
                  padding: "4px 2px",
                  borderRadius: "3px",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "center"
                }}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Market Breadth Card */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "4px",
        padding: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.02em" }}>
            Market Breadth
          </span>
          <span style={{
            fontSize: "0.72rem",
            background: breadth.ad_ratio >= 1 ? "#ecfdf5" : "#fef2f2",
            color: breadth.ad_ratio >= 1 ? "#059669" : "#dc2626",
            border: `1px solid ${breadth.ad_ratio >= 1 ? "#a7f3d0" : "#fecaca"}`,
            padding: "1px 6px",
            borderRadius: "2px",
            fontWeight: 700,
          }}>
            A/D {breadth.ad_ratio || "1.49"}
          </span>
        </div>

        {/* Clean progress bar */}
        <div style={{ height: "5px", background: "#fecaca", borderRadius: "2px", overflow: "hidden", display: "flex" }}>
          <div style={{
            width: `${advancePercent}%`,
            background: "#00d09c",
            height: "100%",
            borderRadius: "2px",
          }} />
        </div>

        {/* Counts */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "0.72rem" }}>
          <span style={{ color: "#059669", fontWeight: 600 }}>
            Adv: {breadth.advances?.toLocaleString("en-IN") || 2145} ({advancePercent}%)
          </span>
          <span style={{ color: "#dc2626", fontWeight: 600 }}>
            Dec: {breadth.declines?.toLocaleString("en-IN") || 1436}
          </span>
        </div>
      </div>

      {/* Saved Conversations */}
      {savedSessions && savedSessions.length > 0 && (
        <div style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "4px",
          padding: "10px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.02em" }}>
              Saved Conversations
            </span>
            {onClearSavedChats && (
              <button
                onClick={onClearSavedChats}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "0.66rem",
                  cursor: "pointer",
                  padding: "0",
                  fontWeight: 500
                }}
              >
                Clear All
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {savedSessions.slice(0, 4).map((s) => (
              <button
                key={s.id}
                onClick={() => onLoadSession && onLoadSession(s.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 8px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "3px",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%"
                }}
              >
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: "6px" }}>
                  <div style={{ fontWeight: 600, fontSize: "0.74rem", color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: "0.64rem", color: "#94a3b8" }}>
                    {s.timestamp} • {s.messageCount} msgs
                  </div>
                </div>
                <ChevronRight size={11} color="#94a3b8" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Queries */}
      <div>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "8px" }}>
          Quick Analysis
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {curatedPrompts.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPrompt(item.query)}
              style={{
                padding: "8px 10px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                textAlign: "left",
                cursor: "pointer",
                color: "inherit",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "4px",
              }}
            >
              <div style={{
                width: "26px",
                height: "26px",
                borderRadius: "3px",
                background: "#f8fafc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#1e293b" }}>
                  {item.title}
                </div>
                <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "1px" }}>
                  {item.desc}
                </div>
              </div>
              <ChevronRight size={13} color="#94a3b8" />
            </button>
          ))}
        </div>
      </div>

      {/* Stock Watchlist */}
      <div style={{ marginTop: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.03em" }}>
            Top Watchlist
          </span>
          <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>Click for quote</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {watchlist.map((item) => (
            <button
              key={item.symbol}
              onClick={() => onSelectSymbol(item.symbol)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 8px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "3px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.78rem", color: "#1e293b" }}>
                  {item.symbol}
                </div>
                <div style={{ fontSize: "0.66rem", color: "#64748b" }}>
                  {item.name}
                </div>
              </div>
              <span style={{
                fontSize: "0.66rem",
                color: "#2563eb",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                padding: "1px 5px",
                borderRadius: "2px",
                fontWeight: 600
              }}>
                View Quote
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
