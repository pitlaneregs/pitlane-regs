import { useState } from "react";

export default function Admin() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const generateDigest = async () => {
    if (!password) { setStatus("Enter password"); return; }
    setLoading(true);
    setStatus("Generating digest — this takes 20-30 seconds...");

    try {
      const res = await fetch("/api/generate-digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus(`✓ Done! ${data.items} items generated, saved to site and email sent to your inbox.`);
      } else {
        setStatus("Error: " + JSON.stringify(data));
      }
    } catch (e) {
      setStatus("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#e0e0e0", fontFamily: "monospace", padding: 32 }}>
      <div style={{ marginBottom: 32 }}>
        <svg viewBox="0 0 200 80" width="160" height="64">
          <rect width="200" height="80" fill="transparent"/>
          <rect x="0" y="0" width="200" height="2" fill="#E8002D"/>
          <text x="16" y="54" fontFamily="Arial Black" fontWeight="900" fontSize="48" letterSpacing="-1" fill="#FFFFFF">PL</text>
          <text x="96" y="54" fontFamily="Arial Black" fontWeight="900" fontSize="48" letterSpacing="-1" fill="#E8002D">R</text>
          <rect x="16" y="60" width="152" height="1" fill="#333"/>
          <text x="16" y="75" fontFamily="Arial" fontWeight="700" fontSize="10" letterSpacing="4" fill="#AAAAAA">PITLANE REGS</text>
        </svg>
      </div>

      <h2 style={{ color: "#E8002D", fontSize: 12, letterSpacing: "0.3em", marginBottom: 32 }}>ADMIN — WEEKLY DIGEST GENERATOR</h2>

      <div style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generateDigest()}
          style={{ padding: "12px 16px", background: "#111", border: "1px solid #333", color: "#fff", fontFamily: "monospace", width: 220, fontSize: 13 }}
        />
        <button
          onClick={generateDigest}
          disabled={loading}
          style={{ padding: "12px 28px", background: loading ? "#333" : "#E8002D", color: "#fff", border: "none", fontFamily: "monospace", cursor: loading ? "not-allowed" : "pointer", fontSize: 12, letterSpacing: "0.15em" }}
        >
          {loading ? "PROCESSING..." : "▶ GENERATE & SEND"}
        </button>
      </div>

      {status && (
        <div style={{ padding: 16, border: "1px solid #1a1a1a", background: "#0d0d0d", fontSize: 12, color: status.startsWith("✓") ? "#00FF88" : "#888", lineHeight: 1.6 }}>
          {status}
        </div>
      )}

      <div style={{ marginTop: 48, borderTop: "1px solid #1a1a1a", paddingTop: 24 }}>
        <p style={{ fontSize: 11, color: "#333", letterSpacing: "0.1em", lineHeight: 1.8 }}>
          WHAT THIS DOES:<br/>
          1. Generates short digest → saves to site (pitlaneregs.com)<br/>
          2. Generates full analysis → sends to your email<br/>
          3. Copy email content to Beehiiv → send to subscribers
        </p>
      </div>
    </div>
  );
}
