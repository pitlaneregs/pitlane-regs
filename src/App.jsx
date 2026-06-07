import { useState, useEffect } from "react";

const SOURCE_LINKS = {
  "F1": "https://www.fia.com/regulation/category/110",
  "Formula 1": "https://www.fia.com/regulation/category/110",
  "MotoGP": "https://www.motogp.com/en/news/rules-and-regulations",
  "WRC": "https://www.fia.com/regulation/category/185",
  "Formula E": "https://www.fia.com/regulation/category/1491",
  "NASCAR": "https://www.nascar.com/rules-and-regulations",
  "IndyCar": "https://www.indycar.com/Info/Rules",
};

const SERIES_COLORS = {
  "F1": "#E8002D",
  "Formula 1": "#E8002D",
  "MotoGP": "#FF6B35",
  "WRC": "#00A650",
  "Formula E": "#00BFFF",
  "NASCAR": "#FFD700",
  "IndyCar": "#0066CC",
};

const IMPACT_COLORS = {
  HIGH: { bg: "#FF2D2D18", border: "#E8002D", text: "#FF6B6B" },
  MEDIUM: { bg: "#FF890018", border: "#FF8900", text: "#FFB347" },
  LOW: { bg: "#00FF8818", border: "#00A650", text: "#66FFB2" },
};

const CATEGORY_ICONS = {
  Technical: "⚙",
  Sporting: "🏁",
  Financial: "💰",
  Safety: "🛡",
};

const ALL_SERIES = ["F1", "MotoGP", "WRC", "Formula E", "NASCAR", "IndyCar"];

function PLRLogo() {
  return (
    <svg viewBox="0 0 200 80" width="160" height="64" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="80" fill="transparent"/>
      <rect x="0" y="0" width="200" height="2" fill="#E8002D"/>
      <text x="16" y="54" fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif" fontWeight="900" fontSize="48" letterSpacing="-1" fill="#FFFFFF">PL</text>
      <text x="96" y="54" fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif" fontWeight="900" fontSize="48" letterSpacing="-1" fill="#E8002D">R</text>
      <rect x="16" y="60" width="152" height="1" fill="#333"/>
      <text x="16" y="75" fontFamily="'Arial', Helvetica, sans-serif" fontWeight="700" fontSize="10" letterSpacing="4" fill="#AAAAAA">PITLANE REGS</text>
    </svg>
  );
}

export default function App() {
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [activeSeries, setActiveSeries] = useState(null);

  useEffect(() => {
    loadDigest();
  }, []);

  const loadDigest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/get-digest");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDigest(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getSeriesColor = (series) => SERIES_COLORS[series] || "#888";
  const getSourceLink = (series) => SOURCE_LINKS[series] || "https://www.fia.com";

  const filteredItems = activeSeries
    ? digest?.items?.filter(i => i.series === activeSeries)
    : digest?.items;

  return (
    <div style={s.root}>
      <style>{css}</style>

      <header style={s.header}>
        <div style={s.headerInner}>
          <PLRLogo />
          <nav style={s.nav}>
            <a href="https://pitlaneregs.beehiiv.com/subscribe" target="_blank" rel="noopener noreferrer" style={s.navBtn}>
              ✉ Subscribe
            </a>
          </nav>
        </div>
      </header>

      <div style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.heroLabel}>MOTORSPORT REGULATORY INTELLIGENCE</div>
          <h1 style={s.heroTitle}>The definitive source for<br /><span style={s.heroAccent}>motorsport regulation updates</span></h1>
          <p style={s.heroSub}>Weekly analysis of F1, MotoGP, WRC, Formula E, NASCAR and IndyCar regulatory changes — explained in plain English.</p>
        </div>
      </div>

      <main style={s.main}>
        {loading && (
          <div style={s.loadingState}>
            <div style={s.loadingDot} className="pulse" />
            <span style={s.loadingText}>Loading latest digest...</span>
          </div>
        )}

        {error && (
          <div style={s.errorBox}>
            <span style={{ color: "#FF4444" }}>⚠ </span>
            No digest available yet. Check back soon.
          </div>
        )}

        {digest && !loading && (
          <>
            <div style={s.digestMeta}>
              <span style={s.digestWeek}>WEEKLY DIGEST</span>
              <span style={s.digestDate}>{digest.digest_date}</span>
              <span style={s.digestDivider}>·</span>
              <span style={s.digestCount}>{digest.items?.length || 0} updates</span>
            </div>

            <h2 style={s.digestTitle}>{digest.digest_title}</h2>
            <p style={s.digestSummary}>{digest.summary}</p>

            {/* Series pills */}
            <div style={s.seriesPills}>
              <button
                onClick={() => setActiveSeries(null)}
                style={{
                  ...s.seriesPill,
                  borderColor: !activeSeries ? "#E8002D" : "#222",
                  color: !activeSeries ? "#E8002D" : "#444",
                  background: "transparent",
                  cursor: "pointer",
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                ALL
              </button>
              {ALL_SERIES.map(series => {
                const color = getSeriesColor(series);
                const hasItems = digest.items?.some(i => i.series === series || i.series === "Formula 1");
                const isActive = activeSeries === series;
                return (
                  <button
                    key={series}
                    onClick={() => setActiveSeries(isActive ? null : series)}
                    style={{
                      ...s.seriesPill,
                      borderColor: isActive ? color : hasItems ? `${color}66` : "#222",
                      color: isActive ? color : hasItems ? `${color}99` : "#333",
                      opacity: hasItems ? 1 : 0.3,
                      background: "transparent",
                      cursor: hasItems ? "pointer" : "default",
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >
                    {series}
                  </button>
                );
              })}
            </div>

            {/* Official sources row */}
            <div style={s.sourcesRow}>
              <span style={s.sourcesLabel}>Official sources:</span>
              {ALL_SERIES.map(series => (
                <a
                  key={series}
                  href={getSourceLink(series)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...s.sourceChip, color: getSeriesColor(series) }}
                >
                  {series} ↗
                </a>
              ))}
            </div>

            {/* News grid */}
            <div style={s.newsGrid}>
              {filteredItems?.map((item, i) => {
                const color = getSeriesColor(item.series);
                const impact = IMPACT_COLORS[item.impact] || IMPACT_COLORS.LOW;
                const isActive = activeItem === i;

                return (
                  <article
                    key={i}
                    style={{
                      ...s.newsCard,
                      borderTopColor: color,
                      animationDelay: `${i * 0.08}s`,
                    }}
                    className="news-card"
                  >
                    <div style={s.cardHeader}>
                      <span style={{ ...s.seriesTag, color, borderColor: `${color}33` }}>
                        {item.series}
                      </span>
                      <span style={s.categoryTag}>
                        {CATEGORY_ICONS[item.category]} {item.category}
                      </span>
                      <span style={{ ...s.impactTag, background: impact.bg, borderColor: impact.border, color: impact.text }}>
                        {item.impact}
                      </span>
                    </div>

                    <h3 style={s.cardHeadline}>{item.headline}</h3>

                    {isActive && (
                      <p style={s.cardDetail} className="card-detail">{item.detail}</p>
                    )}

                    <div style={s.cardFooter}>
                      <button
                        onClick={() => setActiveItem(isActive ? null : i)}
                        style={s.expandBtn}
                      >
                        {isActive ? "▲ Less" : "▼ Read more"}
                      </button>
                      <a
                        href={getSourceLink(item.series)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ ...s.sourceLink, color }}
                      >
                        Official source ↗
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>

            {digest.cross_series_insight && (
              <div style={s.insightBox}>
                <div style={s.insightHeader}>
                  <span style={s.insightIcon}>◈</span>
                  <span style={s.insightLabel}>CROSS-SERIES INSIGHT</span>
                </div>
                <p style={s.insightText}>{digest.cross_series_insight}</p>
              </div>
            )}

            {/* Subscribe CTA */}
            <div style={s.subscribeCta}>
              <p style={s.subscribeText}>Get the full analysis — technical deep-dives, historical context and source documents — every Monday in your inbox.</p>
              <a
                href="https://pitlaneregs.beehiiv.com/subscribe"
                target="_blank"
                rel="noopener noreferrer"
                style={s.subscribeBtn}
              >
                ✉ Subscribe to newsletter →
              </a>
            </div>
          </>
        )}
      </main>

      <footer style={s.footer}>
        <div style={s.footerInner}>
          <PLRLogo />
          <div style={s.footerLinks}>
            <a href="https://pitlaneregs.beehiiv.com/subscribe" target="_blank" rel="noopener noreferrer" style={s.footerLink}>Subscribe</a>
            <span style={s.footerDot}>·</span>
            <a href="https://www.fia.com" target="_blank" rel="noopener noreferrer" style={s.footerLink}>FIA</a>
            <span style={s.footerDot}>·</span>
            <a href="https://www.fim-moto.com" target="_blank" rel="noopener noreferrer" style={s.footerLink}>FIM</a>
            <span style={s.footerDot}>·</span>
            <a href="https://www.wrc.com" target="_blank" rel="noopener noreferrer" style={s.footerLink}>WRC</a>
            <span style={s.footerDot}>·</span>
            <a href="https://www.nascar.com" target="_blank" rel="noopener noreferrer" style={s.footerLink}>NASCAR</a>
            <span style={s.footerDot}>·</span>
            <a href="https://www.indycar.com" target="_blank" rel="noopener noreferrer" style={s.footerLink}>IndyCar</a>
          </div>
          <p style={s.footerCopy}>© 2026 PitLane Regs · Motorsport Regulatory Intelligence</p>
        </div>
      </footer>
    </div>
  );
}

const s = {
  root: { minHeight: "100vh", background: "#080808", color: "#e0e0e0", fontFamily: "'IBM Plex Mono', 'Courier New', monospace" },
  header: { borderBottom: "1px solid #141414", padding: "0 32px", position: "sticky", top: 0, background: "rgba(8,8,8,0.95)", backdropFilter: "blur(8px)", zIndex: 100 },
  headerInner: { maxWidth: 1100, margin: "0 auto", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between" },
  nav: { display: "flex", alignItems: "center", gap: 16 },
  navBtn: { padding: "8px 20px", border: "1px solid #E8002D", color: "#E8002D", textDecoration: "none", fontSize: 11, letterSpacing: "0.15em", fontFamily: "'IBM Plex Mono', monospace", transition: "all 0.2s" },
  hero: { borderBottom: "1px solid #141414", padding: "64px 32px 48px", background: "linear-gradient(180deg, #0d0d0d 0%, #080808 100%)" },
  heroInner: { maxWidth: 1100, margin: "0 auto" },
  heroLabel: { fontSize: 10, letterSpacing: "0.3em", color: "#E8002D", marginBottom: 16, fontWeight: 700 },
  heroTitle: { fontSize: 42, fontWeight: 900, color: "#fff", margin: "0 0 16px", lineHeight: 1.15, fontFamily: "'Arial Black', sans-serif", letterSpacing: "-0.02em" },
  heroAccent: { color: "#E8002D" },
  heroSub: { fontSize: 14, color: "#666", lineHeight: 1.7, maxWidth: 620, margin: 0 },
  main: { maxWidth: 1100, margin: "0 auto", padding: "48px 32px 80px" },
  loadingState: { display: "flex", alignItems: "center", gap: 12, padding: "48px 0", justifyContent: "center" },
  loadingDot: { width: 8, height: 8, borderRadius: "50%", background: "#E8002D" },
  loadingText: { fontSize: 12, color: "#444", letterSpacing: "0.1em" },
  errorBox: { padding: 24, border: "1px solid #FF444433", background: "#FF444408", fontSize: 12, color: "#FF8888" },
  digestMeta: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  digestWeek: { fontSize: 10, letterSpacing: "0.25em", color: "#E8002D", fontWeight: 700 },
  digestDate: { fontSize: 10, color: "#444", letterSpacing: "0.1em" },
  digestDivider: { color: "#222" },
  digestCount: { fontSize: 10, color: "#444", letterSpacing: "0.1em" },
  digestTitle: { fontSize: 32, fontWeight: 900, color: "#fff", margin: "0 0 12px", fontFamily: "'Arial Black', sans-serif", letterSpacing: "-0.02em" },
  digestSummary: { fontSize: 13, color: "#666", lineHeight: 1.7, margin: "0 0 32px", maxWidth: 720 },
  seriesPills: { display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" },
  seriesPill: { padding: "5px 12px", border: "1px solid", fontSize: 10, letterSpacing: "0.15em", fontWeight: 700, transition: "all 0.2s" },
  sourcesRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 40, flexWrap: "wrap" },
  sourcesLabel: { fontSize: 10, color: "#333", letterSpacing: "0.1em" },
  sourceChip: { fontSize: 10, letterSpacing: "0.1em", textDecoration: "none", fontWeight: 700, opacity: 0.7 },
  newsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 2, marginBottom: 48 },
  newsCard: { background: "#0d0d0d", borderTop: "2px solid", padding: "20px", animation: "fadeInUp 0.4s ease forwards", opacity: 0, transition: "background 0.2s" },
  cardHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  seriesTag: { fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", border: "1px solid", padding: "2px 8px" },
  categoryTag: { fontSize: 10, color: "#555", letterSpacing: "0.1em" },
  impactTag: { fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", border: "1px solid", padding: "2px 8px", marginLeft: "auto" },
  cardHeadline: { fontSize: 15, fontWeight: 700, color: "#ddd", margin: "0 0 12px", lineHeight: 1.4, fontFamily: "'Arial Black', sans-serif", letterSpacing: "-0.01em" },
  cardDetail: { fontSize: 12, color: "#777", lineHeight: 1.8, margin: "0 0 12px", borderTop: "1px solid #141414", paddingTop: 12 },
  cardFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  expandBtn: { background: "none", border: "none", color: "#333", fontSize: 10, letterSpacing: "0.1em", cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", padding: 0 },
  sourceLink: { fontSize: 10, letterSpacing: "0.1em", textDecoration: "none", fontWeight: 700 },
  insightBox: { border: "1px solid #00BFFF22", background: "#00BFFF06", padding: 28, marginBottom: 40 },
  insightHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 },
  insightIcon: { color: "#00BFFF", fontSize: 14 },
  insightLabel: { fontSize: 10, letterSpacing: "0.2em", color: "#00BFFF", fontWeight: 700 },
  insightText: { fontSize: 13, color: "#777", lineHeight: 1.8, margin: 0 },
  subscribeCta: { border: "1px solid #E8002D22", background: "#E8002D08", padding: 28, textAlign: "center", marginBottom: 40 },
  subscribeText: { fontSize: 13, color: "#888", lineHeight: 1.7, margin: "0 0 16px", maxWidth: 500, marginLeft: "auto", marginRight: "auto" },
  subscribeBtn: { display: "inline-block", padding: "12px 28px", border: "1px solid #E8002D", color: "#E8002D", textDecoration: "none", fontSize: 12, letterSpacing: "0.15em", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700 },
  footer: { borderTop: "1px solid #141414", padding: "48px 32px", background: "#050505", marginTop: 40 },
  footerInner: { maxWidth: 1100, margin: "0 auto" },
  footerLinks: { display: "flex", gap: 16, alignItems: "center", margin: "24px 0 16px", flexWrap: "wrap" },
  footerLink: { fontSize: 11, color: "#444", textDecoration: "none", letterSpacing: "0.1em" },
  footerDot: { color: "#222" },
  footerCopy: { fontSize: 10, color: "#222", letterSpacing: "0.1em", margin: 0 },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.8); } }
  .pulse { animation: pulse 1.5s ease infinite; }
  .news-card:hover { background: #111 !important; }
  .card-detail { animation: fadeInUp 0.2s ease forwards; }
`;
