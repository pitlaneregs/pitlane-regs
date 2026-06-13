import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useParams } from "react-router-dom";

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

const BLOG_POSTS = [
  {
    slug: "f1-2026-technical-reset",
    title: "F1 2026: The Most Radical Technical Reset Since Ground Effect — And What It Means for the Grid",
    date: "2026-06-13",
    series: "F1",
    category: "Technical",
    excerpt: "Formula 1's 2026 technical regulations represent the most structurally significant overhaul since the 2022 ground-effect reset. Active aero, 50% hybrid power, 30kg weight reduction — here's what actually changes and why it reshapes the competitive order.",
    content: `
      <p>Formula 1's 2026 technical regulations represent the most structurally significant overhaul since the 2022 ground-effect reset, and in several respects they go considerably further.</p>
      <h2>Active Aerodynamics: The End of DRS</h2>
      <p>The headline change is the introduction of full-time active aerodynamics. Both front and rear wings now continuously vary their angle of attack under direct control of the car's onboard systems, replacing the previous DRS — a binary, driver-actuated mechanism — with a genuinely dynamic aerodynamic platform.</p>
      <p>The objective is to allow cars to run high-downforce configurations in corners while shedding drag on straights with far greater precision than DRS ever permitted. Theoretically this improves both lap times and overtaking opportunities without the artificial push-to-pass character of the outgoing system.</p>
      <h2>The Power Unit Revolution: MGU-H Gone, Electrical Power Doubled</h2>
      <p>On the power unit side, the elimination of the MGU-H is the most consequential architectural change. The Motor Generator Unit-Heat, which recovered energy from exhaust gases via the turbocharger shaft, was an extraordinarily complex and expensive component — a significant barrier to new manufacturers entering the sport.</p>
      <p>Its removal simplifies the hybrid system substantially, concentrating energy recovery through the MGU-K and battery architecture. The trade-off — recovering less energy from waste heat — is offset by the dramatic upscaling of electrical deployment: hybrid systems now contribute approximately <strong>350 kW, representing roughly 50% of total power output</strong>.</p>
      <p>That figure fundamentally alters the balance of the power unit, making electrical management, battery thermal performance, and deployment strategy as critical as combustion efficiency.</p>
      <h2>30kg Weight Reduction: Ripple Effects Across Every Department</h2>
      <p>The 30kg reduction in minimum weight is a direct consequence of the MGU-H's elimination and revised structural targets. Its implications ripple through every department: suspension geometry must be re-optimised, ballast strategies are completely revised, and driver weight becomes politically sensitive again.</p>
      <p>For aerodynamicists, the interaction between front and rear wing states under braking, acceleration, and cornering loads creates a coupled optimisation problem unlike anything seen in F1 before. The control algorithms governing wing angle adjustment must be tuned circuit by circuit.</p>
      <h2>Who Benefits — And Who Doesn't</h2>
      <p>The teams that stand to benefit most immediately are those who invested early in electrical systems development and software control capability. The shift to 50% hybrid contribution rewards organisations with deep competence in power electronics, battery cell management, and energy deployment mapping.</p>
      <p>Manufacturers with road-car electrification programmes carry a genuine structural advantage here. Conversely, <strong>teams relying on customer power units</strong> face a period of dependency on their suppliers' ability to optimise MGU-K and battery performance — a dynamic that could widen the midfield gap to the top in the early part of the season.</p>
      <h2>The Bottom Line</h2>
      <p>This is not an incremental update. The 2026 regulations reshape the competitive hierarchy from first principles. The question is not which team has the best car from 2025 — it is which organisation built the right capabilities for a fundamentally different technical challenge.</p>
    `
  }
];

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

function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);

  const handleSubmit = () => {
    if (!email || !email.includes("@")) {
      setStatus("invalid");
      return;
    }
    const url = `https://pitlaneregs.beehiiv.com/subscribe?email=${encodeURIComponent(email)}`;
    window.open(url, "_blank");
    setStatus("redirected");
  };

  return (
    <div style={sf.wrap}>
      {status === "redirected" ? (
        <p style={sf.success}>✓ Redirecting to confirm your subscription...</p>
      ) : (
        <div style={sf.row}>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={{ ...sf.input, borderColor: status === "invalid" ? "#E8002D" : "#222" }}
          />
          <button onClick={handleSubmit} style={sf.btn}>Subscribe free →</button>
        </div>
      )}
      {status === "invalid" && <p style={sf.error}>Please enter a valid email address.</p>}
      <p style={sf.note}>Free. No spam. Unsubscribe anytime.</p>
    </div>
  );
}

function Header() {
  return (
    <header style={s.header}>
      <div style={s.headerInner}>
        <Link to="/" style={{ textDecoration: "none" }}>
          <PLRLogo />
        </Link>
        <nav style={s.nav}>
          <Link to="/blog" style={s.navLink}>Analysis</Link>
          <Link to="/subscribe" style={s.navBtn}>✉ Subscribe</Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer style={s.footer}>
      <div style={s.footerInner}>
        <PLRLogo />
        <div style={s.footerLinks}>
          <Link to="/subscribe" style={s.footerLink}>Subscribe</Link>
          <span style={s.footerDot}>·</span>
          <Link to="/blog" style={s.footerLink}>Analysis</Link>
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
  );
}

function SubscribePage() {
  return (
    <div style={s.root}>
      <style>{css}</style>
      <Header />
      <div style={sp.hero}>
        <div style={sp.heroInner}>
          <div style={s.heroLabel}>FREE NEWSLETTER</div>
          <h1 style={sp.title}>Motorsport regulations,<br /><span style={s.heroAccent}>decoded every Monday.</span></h1>
          <p style={sp.sub}>Join engineers, journalists and racing professionals who rely on PitLane Regs to track what's changing — and why it matters.</p>
          <div style={{ marginTop: 40 }}>
            <SubscribeForm />
          </div>
        </div>
      </div>
      <div style={sp.features}>
        <div style={sp.featuresInner}>
          {[
            { icon: "⚙", title: "Technical deep-dives", text: "Not just what changed — but how it affects car design, strategy and performance." },
            { icon: "🏁", title: "All major series", text: "F1, MotoGP, WRC, Formula E, NASCAR and IndyCar in one place." },
            { icon: "📄", title: "Direct to source", text: "Every update links to the official regulation document so you can verify yourself." },
            { icon: "🎯", title: "Who benefits", text: "Each change is analysed for which teams, manufacturers or competitors gain an edge." },
          ].map((f, i) => (
            <div key={i} style={sp.featureCard}>
              <div style={sp.featureIcon}>{f.icon}</div>
              <div style={sp.featureTitle}>{f.title}</div>
              <div style={sp.featureText}>{f.text}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={sp.ctaBottom}>
        <div style={sp.ctaInner}>
          <p style={sp.ctaTitle}>Every Monday. Always free.</p>
          <SubscribeForm />
        </div>
      </div>
      <Footer />
    </div>
  );
}

function BlogListPage() {
  return (
    <div style={s.root}>
      <style>{css}</style>
      <Header />
      <div style={bl.hero}>
        <div style={bl.heroInner}>
          <div style={s.heroLabel}>REGULATORY ANALYSIS</div>
          <h1 style={bl.title}>Deep dives into <span style={s.heroAccent}>motorsport regulations</span></h1>
          <p style={bl.sub}>Technical analysis for engineers, team managers and serious enthusiasts.</p>
        </div>
      </div>
      <main style={s.main}>
        <div style={bl.grid}>
          {BLOG_POSTS.map(post => (
            <Link key={post.slug} to={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
              <article style={bl.card} className="news-card">
                <div style={bl.cardMeta}>
                  <span style={{ ...s.seriesTag, color: SERIES_COLORS[post.series], borderColor: `${SERIES_COLORS[post.series]}33` }}>
                    {post.series}
                  </span>
                  <span style={s.categoryTag}>{CATEGORY_ICONS[post.category]} {post.category}</span>
                  <span style={bl.cardDate}>{post.date}</span>
                </div>
                <h2 style={bl.cardTitle}>{post.title}</h2>
                <p style={bl.cardExcerpt}>{post.excerpt}</p>
                <div style={bl.cardCta}>Read analysis →</div>
              </article>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function BlogPostPage() {
  const { slug } = useParams();
  const post = BLOG_POSTS.find(p => p.slug === slug);

  if (!post) {
    return (
      <div style={s.root}>
        <style>{css}</style>
        <Header />
        <main style={s.main}>
          <p style={{ color: "#666", fontSize: 14 }}>Article not found.</p>
          <Link to="/blog" style={{ color: "#E8002D", fontSize: 12 }}>← Back to Analysis</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={s.root}>
      <style>{css}</style>
      <Header />
      <div style={bp.hero}>
        <div style={bp.heroInner}>
          <Link to="/blog" style={bp.backLink}>← Analysis</Link>
          <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "16px 0" }}>
            <span style={{ ...s.seriesTag, color: SERIES_COLORS[post.series], borderColor: `${SERIES_COLORS[post.series]}33` }}>
              {post.series}
            </span>
            <span style={s.categoryTag}>{CATEGORY_ICONS[post.category]} {post.category}</span>
            <span style={bp.date}>{post.date}</span>
          </div>
          <h1 style={bp.title}>{post.title}</h1>
          <p style={bp.excerpt}>{post.excerpt}</p>
        </div>
      </div>
      <main style={bp.main}>
        <div style={bp.content} dangerouslySetInnerHTML={{ __html: post.content }} />
        <div style={bp.ctaBox}>
          <p style={bp.ctaTitle}>Want more regulation analysis every Monday?</p>
          <p style={bp.ctaText}>Subscribe to PitLane Regs — free weekly newsletter covering F1, MotoGP, WRC, Formula E, NASCAR and IndyCar.</p>
          <div style={{ marginTop: 20 }}>
            <SubscribeForm />
          </div>
        </div>
        <Link to="/blog" style={bp.backLink2}>← Back to Analysis</Link>
      </main>
      <Footer />
    </div>
  );
}

function HomePage() {
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [activeSeries, setActiveSeries] = useState(null);

  useEffect(() => { loadDigest(); }, []);

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
  const filteredItems = activeSeries ? digest?.items?.filter(i => i.series === activeSeries) : digest?.items;

  return (
    <div style={s.root}>
      <style>{css}</style>
      <Header />
      <div style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.heroLabel}>MOTORSPORT REGULATORY INTELLIGENCE</div>
          <h1 style={s.heroTitle}>The definitive source for<br /><span style={s.heroAccent}>motorsport regulation updates</span></h1>
          <p style={s.heroSub}>Weekly analysis of F1, MotoGP, WRC, Formula E, NASCAR and IndyCar regulatory changes — explained in plain English.</p>
          <div style={{ marginTop: 32 }}>
            <SubscribeForm />
          </div>
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
            <div style={s.seriesPills}>
              <button onClick={() => setActiveSeries(null)} style={{ ...s.seriesPill, borderColor: !activeSeries ? "#E8002D" : "#222", color: !activeSeries ? "#E8002D" : "#444", background: "transparent", cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" }}>ALL</button>
              {ALL_SERIES.map(series => {
                const color = getSeriesColor(series);
                const hasItems = digest.items?.some(i => i.series === series);
                const isActive = activeSeries === series;
                return (
                  <button key={series} onClick={() => hasItems && setActiveSeries(isActive ? null : series)} style={{ ...s.seriesPill, borderColor: isActive ? color : hasItems ? `${color}66` : "#1a1a1a", color: isActive ? color : hasItems ? `${color}99` : "#2a2a2a", background: "transparent", cursor: hasItems ? "pointer" : "default", fontFamily: "'IBM Plex Mono', monospace" }}>
                    {series}
                  </button>
                );
              })}
            </div>
            <div style={s.sourcesRow}>
              <span style={s.sourcesLabel}>Official sources →</span>
              {ALL_SERIES.map(series => (
                <a key={series} href={getSourceLink(series)} target="_blank" rel="noopener noreferrer" style={{ ...s.sourceChip, color: getSeriesColor(series) }}>{series} ↗</a>
              ))}
            </div>
            <div style={s.newsGrid}>
              {filteredItems?.map((item, i) => {
                const color = getSeriesColor(item.series);
                const impact = IMPACT_COLORS[item.impact] || IMPACT_COLORS.LOW;
                const isActive = activeItem === i;
                return (
                  <article key={i} style={{ ...s.newsCard, borderTopColor: color, animationDelay: `${i * 0.08}s` }} className="news-card">
                    <div style={s.cardHeader}>
                      <span style={{ ...s.seriesTag, color, borderColor: `${color}33` }}>{item.series}</span>
                      <span style={s.categoryTag}>{CATEGORY_ICONS[item.category]} {item.category}</span>
                      <span style={{ ...s.impactTag, background: impact.bg, borderColor: impact.border, color: impact.text }}>{item.impact}</span>
                    </div>
                    <h3 style={s.cardHeadline}>{item.headline}</h3>
                    {isActive && <p style={s.cardDetail} className="card-detail">{item.detail}</p>}
                    <div style={s.cardFooter}>
                      <button onClick={() => setActiveItem(isActive ? null : i)} style={s.expandBtn}>{isActive ? "▲ Less" : "▼ Read more"}</button>
                      <a href={getSourceLink(item.series)} target="_blank" rel="noopener noreferrer" style={{ ...s.sourceLink, color }}>Official source ↗</a>
                    </div>
                  </article>
                );
              })}
            </div>
            <div style={s.analysisTease}>
              <div style={s.analysisTeaseLabel}>LATEST ANALYSIS</div>
              <h3 style={s.analysisTeaseTitle}>{BLOG_POSTS[0].title}</h3>
              <p style={s.analysisTeaseExcerpt}>{BLOG_POSTS[0].excerpt}</p>
              <Link to={`/blog/${BLOG_POSTS[0].slug}`} style={s.analysisTeaseLink}>Read full analysis →</Link>
            </div>
            <div style={s.subscribeCta}>
              <p style={s.subscribeTitle}>Want the full analysis?</p>
              <p style={s.subscribeText}>The newsletter includes technical deep-dives, historical context, who benefits and direct links to official regulation documents — every Monday in your inbox.</p>
              <div style={{ display: "flex", justifyContent: "center", marginTop: 20, marginBottom: 40 }}>
                <SubscribeForm />
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/subscribe" element={<SubscribePage />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
      </Routes>
    </BrowserRouter>
  );
}

const sf = {
  wrap: { width: "100%", maxWidth: 520 },
  row: { display: "flex", gap: 0 },
  input: { flex: 1, background: "#0d0d0d", border: "1px solid #222", borderRight: "none", color: "#e0e0e0", padding: "12px 16px", fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", outline: "none" },
  btn: { background: "#E8002D", color: "#fff", border: "none", padding: "12px 24px", fontSize: 11, letterSpacing: "0.1em", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  success: { color: "#66FFB2", fontSize: 12, margin: 0, letterSpacing: "0.1em" },
  error: { color: "#FF6B6B", fontSize: 11, margin: "6px 0 0", letterSpacing: "0.05em" },
  note: { fontSize: 10, color: "#333", margin: "8px 0 0", letterSpacing: "0.1em" },
};

const sp = {
  hero: { borderBottom: "1px solid #141414", padding: "80px 32px 64px", background: "linear-gradient(180deg, #0d0d0d 0%, #080808 100%)" },
  heroInner: { maxWidth: 680, margin: "0 auto", textAlign: "center" },
  title: { fontSize: 42, fontWeight: 900, color: "#fff", margin: "0 0 16px", lineHeight: 1.15, fontFamily: "'Arial Black', sans-serif", letterSpacing: "-0.02em" },
  sub: { fontSize: 15, color: "#666", lineHeight: 1.7, margin: "0 auto" },
  features: { padding: "64px 32px", borderBottom: "1px solid #141414" },
  featuresInner: { maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 2 },
  featureCard: { background: "#0d0d0d", padding: 24, borderTop: "2px solid #E8002D22" },
  featureIcon: { fontSize: 24, marginBottom: 12 },
  featureTitle: { fontSize: 13, fontWeight: 700, color: "#ddd", marginBottom: 8, letterSpacing: "0.05em" },
  featureText: { fontSize: 12, color: "#555", lineHeight: 1.7 },
  ctaBottom: { padding: "64px 32px 80px", background: "#0d0d0d", borderBottom: "1px solid #141414" },
  ctaInner: { maxWidth: 520, margin: "0 auto", textAlign: "center" },
  ctaTitle: { fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 24px", fontFamily: "'Arial Black', sans-serif" },
};

const bl = {
  hero: { borderBottom: "1px solid #141414", padding: "64px 32px 48px", background: "linear-gradient(180deg, #0d0d0d 0%, #080808 100%)" },
  heroInner: { maxWidth: 1100, margin: "0 auto" },
  title: { fontSize: 42, fontWeight: 900, color: "#fff", margin: "0 0 16px", lineHeight: 1.15, fontFamily: "'Arial Black', sans-serif", letterSpacing: "-0.02em" },
  sub: { fontSize: 14, color: "#666", lineHeight: 1.7, maxWidth: 620, margin: 0 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 2, marginBottom: 48 },
  card: { background: "#0d0d0d", borderTop: "2px solid #E8002D", padding: 24, display: "block", animation: "fadeInUp 0.4s ease forwards", opacity: 0 },
  cardMeta: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  cardDate: { fontSize: 10, color: "#333", letterSpacing: "0.1em", marginLeft: "auto" },
  cardTitle: { fontSize: 16, fontWeight: 700, color: "#ddd", margin: "0 0 12px", lineHeight: 1.4, fontFamily: "'Arial Black', sans-serif" },
  cardExcerpt: { fontSize: 12, color: "#555", lineHeight: 1.7, margin: "0 0 16px" },
  cardCta: { fontSize: 11, color: "#E8002D", letterSpacing: "0.1em", fontWeight: 700 },
};

const bp = {
  hero: { borderBottom: "1px solid #141414", padding: "48px 32px 40px", background: "linear-gradient(180deg, #0d0d0d 0%, #080808 100%)" },
  heroInner: { maxWidth: 720, margin: "0 auto" },
  backLink: { fontSize: 11, color: "#444", textDecoration: "none", letterSpacing: "0.1em" },
  backLink2: { display: "inline-block", fontSize: 11, color: "#444", textDecoration: "none", letterSpacing: "0.1em", marginTop: 40 },
  date: { fontSize: 10, color: "#333", letterSpacing: "0.1em" },
  title: { fontSize: 32, fontWeight: 900, color: "#fff", margin: "16px 0 16px", lineHeight: 1.2, fontFamily: "'Arial Black', sans-serif", letterSpacing: "-0.02em" },
  excerpt: { fontSize: 15, color: "#666", lineHeight: 1.7, margin: 0 },
  main: { maxWidth: 720, margin: "0 auto", padding: "48px 32px 80px" },
  content: { fontSize: 15, color: "#bbb", lineHeight: 1.9, fontFamily: "Georgia, serif" },
  ctaBox: { border: "1px solid #E8002D22", background: "#E8002D06", padding: 32, margin: "48px 0 0", textAlign: "center" },
  ctaTitle: { fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 8px", fontFamily: "'Arial Black', sans-serif" },
  ctaText: { fontSize: 13, color: "#666", lineHeight: 1.7, margin: "0 0 4px", maxWidth: 520, marginLeft: "auto", marginRight: "auto" },
};

const s = {
  root: { minHeight: "100vh", background: "#080808", color: "#e0e0e0", fontFamily: "'IBM Plex Mono', 'Courier New', monospace" },
  header: { borderBottom: "1px solid #141414", padding: "0 32px", position: "sticky", top: 0, background: "rgba(8,8,8,0.95)", backdropFilter: "blur(8px)", zIndex: 100 },
  headerInner: { maxWidth: 1100, margin: "0 auto", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between" },
  nav: { display: "flex", alignItems: "center", gap: 16 },
  navLink: { fontSize: 11, color: "#666", textDecoration: "none", letterSpacing: "0.1em" },
  navBtn: { padding: "8px 20px", border: "1px solid #E8002D", color: "#E8002D", textDecoration: "none", fontSize: 11, letterSpacing: "0.15em", fontFamily: "'IBM Plex Mono', monospace", transition: "all 0.2s", cursor: "pointer" },
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
  subscribeCta: { border: "1px solid #E8002D22", background: "#E8002D06", padding: "32px", textAlign: "center", marginBottom: 40 },
  subscribeTitle: { fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 8px", fontFamily: "'Arial Black', sans-serif" },
  subscribeText: { fontSize: 13, color: "#666", lineHeight: 1.7, margin: "0 0 20px", maxWidth: 520, marginLeft: "auto", marginRight: "auto" },
  analysisTease: { border: "1px solid #E8002D22", background: "#E8002D06", padding: 24, marginBottom: 24 },
  analysisTeaseLabel: { fontSize: 10, letterSpacing: "0.25em", color: "#E8002D", fontWeight: 700, marginBottom: 8 },
  analysisTeaseTitle: { fontSize: 16, fontWeight: 700, color: "#ddd", margin: "0 0 8px", fontFamily: "'Arial Black', sans-serif", lineHeight: 1.3 },
  analysisTeaseExcerpt: { fontSize: 12, color: "#555", lineHeight: 1.7, margin: "0 0 12px" },
  analysisTeaseLink: { fontSize: 11, color: "#E8002D", textDecoration: "none", letterSpacing: "0.1em", fontWeight: 700 },
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
