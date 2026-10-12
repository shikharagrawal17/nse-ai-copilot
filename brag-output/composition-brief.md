# Hyperframes Composition Brief: DalalDesk

## Objective
Create a short, polished launch video for DalalDesk, the Indian equity research terminal connected directly to official NSE Live Market MCP feeds.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape - 1920x1080
- Duration: 18.0 seconds

## Source Material
- Project root: `/Users/shikhar/.gemini/antigravity-ide/scratch/nse-ai-copilot`
- Primary files read: `README.md`, `src/app/globals.css`, `src/components/TickerTape.tsx`, `src/components/ChatArea.tsx`, `src/components/ToolsExplorerDrawer.tsx`
- Product name: DalalDesk
- Tagline / strongest claim: "Connected directly to official NSE Capital Market Live Feeds with 36 algorithmic MCP tools and zero AI hype."
- Key UI or visual moment to recreate:
  - Live Indices Ticker Tape with NIFTY 50 and NIFTY 500 cards
  - DalalDesk Institutional Trade Plan Card with ATR targets and Camarilla pivots
  - 36 MCP Endpoints Explorer drawer with real-time latency indicator
- Copy that must appear verbatim:
  - "Direct Official NSE Live Market Feeds"
  - "RELIANCE: Institutional Trade Plan"
  - "36 Capital Market & Bhavcopy Endpoints"
  - "Official NSE MCP Intelligence. Zero AI Hype."

## Creative Direction
- Tone preset: polished
- Creative direction: Institutional fintech terminal launch, sharp typography, authoritative execution, zero noise.
- Interpretation: Fast, precise cuts with steady, readable hold periods. Clear visual contrast using Groww Teal (#00d09c) and Kite Blue (#387ed1) accents over clean white surfaces (#ffffff) and light paper backgrounds (#f9fafb).
- Angle: DalalDesk delivers zero-hype quantitative intelligence for Dalal Street, computing Camarilla pivots, ATR volatility bands, and institutional trade plans in milliseconds.
- Hook: Live NSE stream connects with 18ms latency and flashes active benchmark market gains.
- Outro / punchline: "DalalDesk: Official NSE MCP Intelligence. Zero AI Hype."
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals or unrelated gradients
  - Flashy AI hype animations or emoji decorations

## Visual Identity
- Background: #f9fafb (Page surface), #ffffff (Card surface)
- Text: #1f2937 (Primary dark), #4b5563 (Secondary slate)
- Accent: #00d09c (Groww Green), #387ed1 (Kite Blue), #eb5b3c (Kite Red for downside boundaries)
- Display font: 'Inter', -apple-system, sans-serif
- Body font: 'JetBrains Mono', monospace
- Visual references from the project:
  - Crisp rectangular cards with 8px border-radius and 1px borders (#e5e7eb)
  - Groww green badges (#ecfdf5 background, #059669 text, #a7f3d0 border)
  - Kite blue action chips (#eff6ff background, #387ed1 text)

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Terminal Connection & Live Tape (0.0s - 3.5s) - Official NSE connection status and live NIFTY indices ticker tape.
2. Quantitative Trade Plan Engine (3.5s - 10.0s) - RELIANCE institutional plan with ATR volatility, Floor & Camarilla pivots, Target 1/2/3 breakdown, and 88/100 conviction score.
3. 36 Official NSE MCP Tools (10.0s - 14.5s) - Direct streaming execution of live quotes, market movers, and bhavcopy breadth with 14ms latency timer.
4. Outro & Launch Lockup (14.5s - 18.0s) - DalalDesk logo mark, tagline, and GitHub release badge.

## Audio
- Audio role: Polished electronic bed with clean UI micro-haptics
- Audio arc: Begins with steady 110 BPM groove, builds momentum through quantitative calculations and MCP endpoint reveals, resolves cleanly on the logo settle.
- Music: `happy-beats-business-moves-vol-10-by-ende-dot-app.mp3`
- Music treatment: Starts at 0.0s at -6dB, crisp high-hat and synth progression, gentle ducking on reveal text, tight finish at 18.0s
- Music cue guidance: Preset cues loaded from `happy-beats-business-moves-vol-10-by-ende-dot-app.music-cues.md`; tempo 109.96 BPM; beat markers at 1.90s, 3.55s, 5.74s, 8.22s, 11.47s, 14.20s, 16.38s
- Audio-reactive treatment: Subtle card shadow depth and border glow pulsing gently to the beat
- SFX selection guidance:
  - 0.4s: `assets/sfx/interface/switch_001.ogg` (Terminal connected)
  - 3.6s: `assets/sfx/interface/drop_001.ogg` (Trade plan card entrance)
  - 10.4s: `assets/sfx/ui/click1.ogg` (MCP tools active)
  - 14.8s: `assets/sfx/interface/bong_001.ogg` (Logo lockup hit)
- Exact SFX choice: Synchronized to CSS/GSAP keyframes in `composition/index.html`.

## Hyperframes Instructions
- Implement as a standalone Hyperframes HTML composition inside `brag-output/composition/`.
- Ensure `npx -y hyperframes check` passes with 0 errors.
- Render locally to `brag-output/brag.mp4`.
- Pick the best poster frame at a settled beat and save to `brag-output/brag.jpg`.
- Bake the poster frame into frame 0 using ffmpeg so video thumbnails look sharp across all platforms.
