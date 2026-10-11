# DalalDesk

> Indian equity research terminal connected to official **NSE Capital Market Live Feeds** and **Historical Bhavcopy Databases** via the Model Context Protocol (MCP).

---

## Overview

DalalDesk provides unified institutional intelligence for the National Stock Exchange of India (NSE). It connects directly to two official MCP endpoints:
- **15 Live Capital Market Tools (`cm-market`)**: Live stock quotes, sector indices, gainers/losers, market movers, SME equities, bonds, and call auctions.
- **21 Historical Bhavcopy & Analytics Tools (`nse-bhavcopy`)**: Historical OHLCV, market breadth, market mood benchmarks, moving averages, volume surge analysis, stock-vs-index comparisons, 52-week high/low breakouts, and corporate actions.

---

## Architecture & Features

- **Fintech Light Interface**: Designed with a clean Groww and Zerodha (Kite) light theme. Clean rectangular inputs and chips, zero pill buttons, zero purple gradients, and zero AI hype copy.
- **Multi-LLM Quantitative Engine**:
  - Autonomous Gemini 3.8 Flash agent for multi-step algorithmic target calculations (ATR, Floor & Camarilla pivots, Fibonacci extensions).
  - Live financial news dispatches, broker research reports, and accredited source citation.
  - Deterministic proxy engine allowing direct tool execution and instant stock quote queries without requiring an API key.
- **Persistent Analysis Sessions**: Full local conversation history archive with session restoration and Kite/Groww visual state indicator.
- **Interactive Tools Explorer**: Direct runner for all 36 MCP tools with input parameter forms and millisecond latency timers.
- **Live Indices Ticker Bar**: Real-time snapshot of benchmark indices (NIFTY 50, NIFTY 100, NIFTY 500, MIDCAP 100).
- **Market Breadth Gauge**: Advance-Decline metrics across ~3,700 NSE-listed equities.
- **Compliance Ready**: Integrated Privacy Policy (`/privacy`) and Terms and Conditions (`/terms`) with SEBI educational disclosures.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Vanilla CSS Design System (Inter typography, Groww Teal & Zerodha Blue accents)
- **MCP Client**: Official Streamable-HTTP SSE MCP client with session pooling
- **Endpoints**:
  - Live Market: `https://mcp.nseindia.in/cmmkt/mcp`
  - Bhavcopy: `https://mcp.nseindia.in/bhavcopy/cm/mcp`

---

## Live Deployment & GitHub Actions

- **Live URL**: [https://shikharagrawal17.github.io/nse-ai-copilot/](https://shikharagrawal17.github.io/nse-ai-copilot/)
- **Automated Deployment**: GitHub Actions workflow (`deploy-pages.yml`) builds and deploys static artifacts directly to GitHub Pages on every push to `main`.
- **Continuous Integration**: GitHub Actions workflow (`ci.yml`) validates production builds and static exports on every pull request and push.

---

## Local Development

```bash
npm install
npm run dev
```

Server runs on `http://localhost:3000`.

To run the static export locally:
```bash
npm run export
```

---

## Regulatory Notice
Information provided by DalalDesk is for informational and educational research purposes only. It does not constitute investment advice or trading recommendations. Consult a SEBI-registered financial advisor before investing.
