import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | DalalDesk",
  description: "Privacy policy and data governance practices for DalalDesk.",
};

export default function PrivacyPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-page)",
      color: "var(--text-primary)",
      padding: "40px 24px 80px 24px",
      display: "flex",
      justifyContent: "center",
    }}>
      <div style={{
        maxWidth: "760px",
        width: "100%",
        background: "#ffffff",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--radius-lg)",
        padding: "36px",
        boxShadow: "var(--shadow-sm)"
      }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--kite-blue)",
            fontSize: "0.825rem",
            fontWeight: 600,
            textDecoration: "none",
            marginBottom: "20px",
          }}
        >
          <ArrowLeft size={14} />
          <span>Back to DalalDesk</span>
        </Link>

        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "28px" }}>
          Effective Date: October 11, 2026 • Version 1.0
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px", fontSize: "0.9rem", lineHeight: 1.7, color: "var(--text-secondary)" }}>
          <section>
            <h2 style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "8px" }}>
              1. Data Governance Overview
            </h2>
            <p>
              DalalDesk operates on a client-side architecture. We do not maintain centralized user accounts, identity stores, or activity tracking databases. Your session queries, API keys, and analysis history remain strictly within your local environment.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "8px" }}>
              2. API Key Storage & Transmission
            </h2>
            <p>
              When an optional Gemini API key is configured, it is saved exclusively in your browser local storage under client custody. It is never logged or persisted in remote application logs. The key is passed directly to the Model Context Protocol execution pipeline solely for authenticating your requests.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "8px" }}>
              3. Market Data Transmission
            </h2>
            <p>
              All market feeds, stock quotes, and historical Bhavcopy records are retrieved directly from the official National Stock Exchange of India (NSE) Model Context Protocol endpoints. No trading accounts or personal brokerage accounts are ever accessed or managed.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "8px" }}>
              4. Cookies & Analytics
            </h2>
            <p>
              This application does not use tracking cookies, advertising beacons, third-party pixel trackers, or persistent marketing identifiers.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
