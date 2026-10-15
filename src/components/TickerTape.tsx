"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

interface IndexItem {
  indexName: string;
  last: number;
  change: number;
  percChange: number;
}

export function TickerTape() {
  const [indices, setIndices] = useState<IndexItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchIndices = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/market-pulse");
      const data = await res.json();
      if (data?.indices?.indices?.broad) {
        setIndices(data.indices.indices.broad);
      } else if (data?.mood?.benchmarks) {
        const items: IndexItem[] = Object.entries(data.mood.benchmarks).map(
          ([name, info]: [string, any]) => ({
            indexName: name,
            last: info.close,
            change: 0,
            percChange: info.change_pct,
          })
        );
        setIndices(items);
      }
    } catch (e) {
      console.error("Ticker fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndices();
    const interval = setInterval(fetchIndices, 60000);
    return () => clearInterval(interval);
  }, []);

  const displayList = indices;

  return (
    <div style={{
      height: "40px",
      background: "#ffffff",
      borderBottom: "1px solid #e5e7eb",
      display: "flex",
      alignItems: "center",
      fontSize: "0.8rem",
      overflow: "hidden",
      padding: "0 16px"
    }}>
      {/* Category Label */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginRight: "14px",
        color: "#64748b",
        fontWeight: 600,
        fontSize: "0.72rem",
        textTransform: "uppercase",
        letterSpacing: "0.03em"
      }}>
        <span>Indices</span>
        <button
          onClick={fetchIndices}
          title="Refresh prices"
          style={{
            background: "transparent",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: "2px",
          }}
        >
          <RefreshCw size={11} />
        </button>
      </div>

      {/* Rectangular Index Items (Zerodha Kite marketwatch style) */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        overflowX: "auto",
        scrollbarWidth: "none",
        flex: 1,
      }}>
        {displayList.length === 0 ? (
          <div style={{ color: "#94a3b8", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "6px" }}>
            <RefreshCw size={11} className="animate-spin" />
            <span>Connecting to live NSE benchmark feed...</span>
          </div>
        ) : (
          displayList.map((item, idx) => {
            const isUp = (item.percChange ?? 0) >= 0;
            return (
              <div
                key={`${item.indexName}-${idx}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "3px 10px",
                  background: "#f8fafc",
                  borderRadius: "3px",
                  border: "1px solid #e2e8f0",
                  whiteSpace: "nowrap"
                }}
              >
                <span style={{ fontWeight: 600, color: "#475569", fontSize: "0.75rem" }}>
                  {item.indexName}
                </span>
                <span style={{ fontWeight: 700, color: "#1e293b" }}>
                  {item.last?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                    fontWeight: 600,
                    fontSize: "0.72rem",
                    color: isUp ? "#059669" : "#dc2626",
                    background: isUp ? "#ecfdf5" : "#fef2f2",
                    padding: "1px 5px",
                    borderRadius: "2px"
                  }}
                >
                  {isUp ? <TrendingUp size={10} strokeWidth={2.5} /> : <TrendingDown size={10} strokeWidth={2.5} />}
                  {isUp ? "+" : ""}{item.percChange}%
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
