import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms and Conditions | DalalDesk",
  description: "Terms and conditions of service and regulatory disclosures for DalalDesk.",
};

export default function TermsPage() {
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
          Terms and Conditions
        </h1>
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "28px" }}>
          Effective Date: October 11, 2026 • Version 1.0
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px", fontSize: "0.9rem", lineHeight: 1.7, color: "var(--text-secondary)" }}>
          <section>
            <h2 style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "8px" }}>
              1. Regulatory Compliance & SEBI Disclaimer
            </h2>
            <p>
              DalalDesk is strictly an analytical research interface engineered for informational, computational, and educational purposes. The application and its creators do not provide investment advice, equity tips, portfolio management, or solicit trades. Always consult a certified financial advisor registered with the Securities and Exchange Board of India (SEBI) before making capital investments.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "8px" }}>
              2. Data Integrity & Transmission
            </h2>
            <p>
              Market feeds and historical Bhavcopy records are delivered via public Model Context Protocol endpoints provided by the National Stock Exchange of India. While data is fetched directly from exchange endpoints, transmissions may reflect market hours caching or exchange latency. The software provides no warranty regarding tick-by-tick real-time execution guarantees.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "8px" }}>
              3. Limitation of Liability
            </h2>
            <p>
              In no event shall the authors or distributors of this application be held liable for any investment losses, portfolio variations, or decision outcomes resulting from the use of this interface.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "8px" }}>
              4. Fair Usage
            </h2>
            <p>
              Users agree not to subject exchange endpoints to automated stress, scraping loops, or denial-of-service traffic exceeding standard interactive research parameters.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
