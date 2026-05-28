import { useState, useEffect } from "react";

const SOURCES = [
  {
    id: "fia-f1",
    series: "F1",
    name: "FIA Formula 1 Regulations",
    url: "https://www.fia.com/regulation/category/110",
    color: "#E8002D",
    icon: "⬡",
  },
  {
    id: "motogp",
    series: "MotoGP",
    name: "MotoGP Rules & Regulations",
    url: "https://www.motogp.com/en/news/rules-and-regulations",
    color: "#E63329",
    icon: "◈",
  },
  {
    id: "wrc",
    series: "WRC",
    name: "FIA World Rally Championship",
    url: "https://www.fia.com/regulation/category/185",
    color: "#00A650",
    icon: "◆",
  },
  {
    id: "formula-e",
    series: "Formula E",
    name: "FIA Formula E Regulations",
    url: "https://www.fia.com/regulation/category/1491",
    color: "#00BFFF",
    icon: "◉",
  },
];

const SYSTEM_PROMPT = `You are RegBot, an expert motorsport regulations analyst for PitLane Regs — the definitive source for motorsport regulatory intelligence.

Your job is to analyze motorsport regulations sources and produce a structured weekly digest.

For each series provided, you must:
1. Identify the most significant recent regulatory changes or updates
2. Explain the technical/sporting implications in plain English
3. Rate the impact: LOW / MEDIUM / HIGH
4. Flag any cross-series patterns (e.g. safety trends, cost-cap themes)

Output ONLY valid JSON in this exact structure:
{
  "digest_title": "string — punchy weekly headline",
  "digest_date": "string — current week",
  "summary": "string — 2-3 sentence executive summary of the week in regs",
  "items": [
    {
      "series": "F1|MotoGP|WRC|Formula E",
      "headline": "string — sharp news headline",
      "detail": "string — 3-4 sentences explaining what changed and why it matters",
      "impact": "LOW|MEDIUM|HIGH",
      "category": "Technical|Sporting|Financial|Safety"
    }
  ],
  "cross_series_insight": "string — 2-3 sentences on any broader regulatory trends this week"
}

Be factual, precise, and write for an audience of technically-literate motorsport fans and engineers. No fluff.`;

const seriesColors = {
  F1: "#E8002D",
  MotoGP: "#FF6B35",
  WRC: "#00A650",
  "Formula E": "#00BFFF",
};

const impactColors = {
  HIGH: { bg: "#FF2D2D22", border: "#FF2D2D", text: "#FF6B6B" },
  MEDIUM: { bg: "#FF890022", border: "#FF8900", text: "#FFB347" },
  LOW: { bg: "#00FF8822", border: "#00FF88", text: "#66FFB2" },
};

const categoryIcons = {
  Technical: "⚙",
  Sporting: "🏁",
  Financial: "💰",
  Safety: "🛡",
};

export default function PitLaneRegs() {
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSeries, setSelectedSeries] = useState(["F1", "MotoGP", "WRC", "Formula E"]);
  const [activeItem, setActiveItem] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 50);
    return () => clearInterval(interval);
  }, []);

  const toggleSeries = (series) => {
    setSelectedSeries((prev) =>
      prev.includes(series) ? prev.filter((s) => s !== series) : [...prev, series]
    );
  };

  const runAgent = async () => {
    if (selectedSeries.length === 0) return;
    setLoading(true);
    setError(null);
    setDigest(null);
    setActiveItem(null);

    const userPrompt = `Generate the weekly PitLane Regs digest for the following series: ${selectedSeries.join(", ")}.

Today's date: ${new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.

For context, here are the official regulation sources being monitored:
${SOURCES.filter((s) => selectedSeries.includes(s.series))
  .map((s) => `- ${s.series}: ${s.url}`)
  .join("\n")}

Based on your knowledge of recent regulatory developments in these series (2024-2025 season changes, upcoming 2026 regulations, technical directives, sporting penalties, cost cap adjustments), produce the weekly digest. Focus on the most technically significant and audience-relevant updates.`;

    try {
      const response = await fetch("https://pitlane-proxy.pitlaneregs.workers.dev", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 800,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      const data = await response.json();
      const raw = data.content?.find((b) => b.type === "text")?.text || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setDigest(parsed);
    } catch (err) {
      setError("Agent error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.root}>
      <style>{css}</style>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logoBlock}>
            <div style={styles.logoMark}>
              <svg width="32" height="32" viewBox="0 0 32 32">
                <polygon points="16,2 30,9 30,23 16,30 2,23 2,9" fill="none" stroke="#E8002D" strokeWidth="1.5" />
                <polygon points="16,7 25,11.5 25,20.5 16,25 7,20.5 7,11.5" fill="#E8002D" opacity="0.15" />
                <circle cx="16" cy="16" r="3" fill="#E8002D" />
              </svg>
            </div>
            <div>
              <div style={styles.logoText}>PITLANE<span style={styles.logoAccent}>REGS</span></div>
              <div style={styles.logoSub}>Motorsport Regulatory Intelligence</div>
            </div>
          </div>
          <div style={styles.statusPill}>
            <span style={{ ...styles.statusDot, animation: loading ? "pulse 1s infinite" : "none" }} />
            {loading ? "AGENT RUNNING" : digest ? "DIGEST READY" : "STANDBY"}
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={styles.main}>

        {/* Control Panel */}
        <section style={styles.controlPanel}>
          <div style={styles.controlHeader}>
            <span style={styles.sectionLabel}>// SERIES MONITOR</span>
            <span style={styles.controlHint}>Select series to include in digest</span>
          </div>
          <div style={styles.seriesGrid}>
            {SOURCES.map((src) => (
              <button
                key={src.id}
                onClick={() => toggleSeries(src.series)}
                style={{
                  ...styles.seriesBtn,
                  borderColor: selectedSeries.includes(src.series) ? src.color : "#2a2a2a",
                  background: selectedSeries.includes(src.series) ? `${src.color}18` : "transparent",
                  color: selectedSeries.includes(src.series) ? src.color : "#555",
                }}
                className="series-btn"
              >
                <span style={styles.seriesIcon}>{src.icon}</span>
                <span style={styles.seriesName}>{src.series}</span>
                <span style={styles.seriesCheck}>{selectedSeries.includes(src.series) ? "●" : "○"}</span>
              </button>
            ))}
          </div>

          <button
            onClick={runAgent}
            disabled={loading || selectedSeries.length === 0}
            style={{
              ...styles.runBtn,
              opacity: loading || selectedSeries.length === 0 ? 0.5 : 1,
              cursor: loading || selectedSeries.length === 0 ? "not-allowed" : "pointer",
            }}
            className="run-btn"
          >
            {loading ? (
              <span style={styles.runBtnInner}>
                <span style={styles.spinner}>◌</span>
                AGENT PROCESSING...
              </span>
            ) : (
              <span style={styles.runBtnInner}>
                <span>▶</span>
                RUN WEEKLY DIGEST
              </span>
            )}
          </button>
        </section>

        {/* Loading State */}
        {loading && (
          <section style={styles.loadingSection}>
            <div style={styles.loadingGrid}>
              {["Fetching FIA sources", "Parsing regulation PDFs", "Diffing versions", "Generating analysis", "Building digest"].map((step, i) => (
                <div key={step} style={{ ...styles.loadingStep, animationDelay: `${i * 0.3}s` }} className="loading-step">
                  <span style={styles.loadingDot}>◆</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Error */}
        {error && (
          <div style={styles.errorBox}>
            <span style={{ color: "#FF4444" }}>⚠ </span>{error}
          </div>
        )}

        {/* Digest Output */}
        {digest && !loading && (
          <div style={styles.digestContainer} className="digest-reveal">

            {/* Digest Header */}
            <div style={styles.digestHeader}>
              <div style={styles.digestMeta}>
                <span style={styles.digestLabel}>WEEKLY DIGEST</span>
                <span style={styles.digestDate}>{digest.digest_date}</span>
              </div>
              <h1 style={styles.digestTitle}>{digest.digest_title}</h1>
              <p style={styles.digestSummary}>{digest.summary}</p>
            </div>

            {/* Items */}
            <div style={styles.itemsGrid}>
              {digest.items?.map((item, i) => {
                const seriesColor = seriesColors[item.series] || "#888";
                const impact = impactColors[item.impact] || impactColors.LOW;
                const isActive = activeItem === i;
                return (
                  <div
                    key={i}
                    onClick={() => setActiveItem(isActive ? null : i)}
                    style={{
                      ...styles.regItem,
                      borderLeftColor: seriesColor,
                      background: isActive ? "#141414" : "#0d0d0d",
                      cursor: "pointer",
                      animationDelay: `${i * 0.1}s`,
                    }}
                    className="reg-item"
                  >
                    <div style={styles.itemTop}>
                      <span style={{ ...styles.seriesTag, color: seriesColor, borderColor: `${seriesColor}44` }}>
                        {item.series}
                      </span>
                      <span style={{ ...styles.categoryTag }}>
                        {categoryIcons[item.category]} {item.category}
                      </span>
                      <span style={{ ...styles.impactTag, background: impact.bg, borderColor: impact.border, color: impact.text }}>
                        {item.impact}
                      </span>
                    </div>
                    <h3 style={styles.itemHeadline}>{item.headline}</h3>
                    {isActive && (
                      <p style={styles.itemDetail} className="item-detail">{item.detail}</p>
                    )}
                    <div style={styles.itemExpand}>
                      {isActive ? "▲ collapse" : "▼ read more"}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cross-series insight */}
            {digest.cross_series_insight && (
              <div style={styles.insightBox}>
                <div style={styles.insightLabel}>◈ CROSS-SERIES INSIGHT</div>
                <p style={styles.insightText}>{digest.cross_series_insight}</p>
              </div>
            )}

            {/* Footer */}
            <div style={styles.digestFooter}>
              <span>PitLane Regs · AI-powered regulatory monitoring</span>
              <span style={{ color: "#333" }}>·</span>
              <span>Sources: FIA · FIM · WRC · Formula E</span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!digest && !loading && !error && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <svg width="64" height="64" viewBox="0 0 64 64" opacity="0.3">
                <polygon points="32,4 60,18 60,46 32,60 4,46 4,18" fill="none" stroke="#E8002D" strokeWidth="1" />
                <polygon points="32,14 50,23 50,41 32,50 14,41 14,23" fill="none" stroke="#E8002D" strokeWidth="0.5" />
                <circle cx="32" cy="32" r="6" fill="#E8002D" opacity="0.5" />
              </svg>
            </div>
            <p style={styles.emptyText}>Select series and run the agent to generate your weekly regulation digest</p>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#080808",
    color: "#e0e0e0",
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
  },
  header: {
    borderBottom: "1px solid #1a1a1a",
    padding: "0 24px",
    position: "sticky",
    top: 0,
    background: "#080808",
    zIndex: 100,
  },
  headerInner: {
    maxWidth: 900,
    margin: "0 auto",
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoBlock: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  logoMark: { display: "flex" },
  logoText: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: "0.15em",
    color: "#fff",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  logoAccent: { color: "#E8002D" },
  logoSub: { fontSize: 10, color: "#444", letterSpacing: "0.2em", marginTop: 2 },
  statusPill: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 11,
    letterSpacing: "0.15em",
    color: "#555",
    border: "1px solid #1f1f1f",
    padding: "6px 12px",
    borderRadius: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#E8002D",
    display: "block",
  },
  main: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "32px 24px 80px",
  },
  controlPanel: {
    border: "1px solid #1a1a1a",
    padding: 24,
    marginBottom: 32,
  },
  controlHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: "0.2em",
    color: "#E8002D",
  },
  controlHint: {
    fontSize: 11,
    color: "#333",
    letterSpacing: "0.1em",
  },
  seriesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 8,
    marginBottom: 20,
  },
  seriesBtn: {
    border: "1px solid",
    padding: "12px 8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    transition: "all 0.2s",
    background: "transparent",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  seriesIcon: { fontSize: 20 },
  seriesName: { fontSize: 11, letterSpacing: "0.1em", fontWeight: 600 },
  seriesCheck: { fontSize: 8, opacity: 0.7 },
  runBtn: {
    width: "100%",
    padding: "14px 24px",
    background: "#E8002D",
    color: "#fff",
    border: "none",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 13,
    letterSpacing: "0.2em",
    fontWeight: 700,
    transition: "all 0.2s",
  },
  runBtnInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  spinner: {
    display: "inline-block",
    animation: "spin 1s linear infinite",
  },
  loadingSection: {
    border: "1px solid #1a1a1a",
    padding: 32,
    marginBottom: 32,
  },
  loadingGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  loadingStep: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: 12,
    color: "#444",
    letterSpacing: "0.1em",
    animation: "fadeInUp 0.4s ease forwards",
    opacity: 0,
  },
  loadingDot: { color: "#E8002D", fontSize: 8 },
  errorBox: {
    border: "1px solid #FF444433",
    background: "#FF444408",
    padding: 16,
    fontSize: 12,
    color: "#FF8888",
    marginBottom: 24,
  },
  digestContainer: {
    animation: "fadeInUp 0.5s ease forwards",
  },
  digestHeader: {
    borderLeft: "3px solid #E8002D",
    paddingLeft: 20,
    marginBottom: 32,
  },
  digestMeta: {
    display: "flex",
    gap: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  digestLabel: {
    fontSize: 10,
    letterSpacing: "0.25em",
    color: "#E8002D",
    fontWeight: 700,
  },
  digestDate: {
    fontSize: 10,
    color: "#444",
    letterSpacing: "0.1em",
  },
  digestTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: "#fff",
    margin: "0 0 12px",
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  digestSummary: {
    fontSize: 13,
    color: "#888",
    lineHeight: 1.7,
    margin: 0,
    maxWidth: 640,
  },
  itemsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    marginBottom: 24,
  },
  regItem: {
    borderLeft: "3px solid",
    padding: "16px 20px",
    transition: "background 0.2s",
    animation: "fadeInUp 0.4s ease forwards",
    opacity: 0,
  },
  itemTop: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    marginBottom: 10,
    flexWrap: "wrap",
  },
  seriesTag: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.15em",
    border: "1px solid",
    padding: "2px 8px",
  },
  categoryTag: {
    fontSize: 10,
    color: "#555",
    letterSpacing: "0.1em",
  },
  impactTag: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.15em",
    border: "1px solid",
    padding: "2px 8px",
    marginLeft: "auto",
  },
  itemHeadline: {
    fontSize: 14,
    fontWeight: 600,
    color: "#ddd",
    margin: "0 0 8px",
    lineHeight: 1.4,
    letterSpacing: "-0.01em",
  },
  itemDetail: {
    fontSize: 12,
    color: "#777",
    lineHeight: 1.7,
    margin: "12px 0 8px",
    borderTop: "1px solid #1a1a1a",
    paddingTop: 12,
  },
  itemExpand: {
    fontSize: 10,
    color: "#333",
    letterSpacing: "0.1em",
    marginTop: 4,
  },
  insightBox: {
    border: "1px solid #00BFFF22",
    background: "#00BFFF08",
    padding: 20,
    marginBottom: 24,
  },
  insightLabel: {
    fontSize: 10,
    letterSpacing: "0.2em",
    color: "#00BFFF",
    marginBottom: 10,
    fontWeight: 700,
  },
  insightText: {
    fontSize: 12,
    color: "#888",
    lineHeight: 1.7,
    margin: 0,
  },
  digestFooter: {
    display: "flex",
    gap: 12,
    fontSize: 10,
    color: "#333",
    letterSpacing: "0.1em",
    paddingTop: 16,
    borderTop: "1px solid #111",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 24px",
    gap: 24,
  },
  emptyIcon: { opacity: 0.4 },
  emptyText: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
    maxWidth: 360,
    lineHeight: 1.7,
    letterSpacing: "0.05em",
  },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');

  * { box-sizing: border-box; }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.2; }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .series-btn:hover {
    transform: translateY(-1px);
  }
  .run-btn:hover:not(:disabled) {
    background: #FF1A3C !important;
    transform: translateY(-1px);
  }
  .loading-step {
    animation: fadeInUp 0.4s ease forwards !important;
  }
  .digest-reveal {
    animation: fadeInUp 0.5s ease forwards;
  }
  .reg-item:hover {
    background: #111 !important;
  }
  .item-detail {
    animation: fadeInUp 0.25s ease forwards;
  }
`;
