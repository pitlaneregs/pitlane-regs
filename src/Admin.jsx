import { useState } from "react";

const SYSTEM_PROMPT = `Return ONLY this JSON, no other text:
{"digest_title":"string","digest_date":"string","summary":"string","items":[{"series":"string","headline":"string","detail":"string","impact":"LOW|MEDIUM|HIGH","category":"Technical|Sporting|Financial|Safety"}],"cross_series_insight":"string"}`;

export default function Admin() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateAndSave = async () => {
    if (!password) { setStatus("Enter password"); return; }
    setLoading(true);
    setStatus("Generating digest...");

    try {
      const aiRes = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1300,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Write a motorsport regulations digest for F1, MotoGP, WRC, Formula E for ${new Date().toLocaleDateString("en-GB")}. Return ONLY valid JSON.` }],
        }),
      });

      const aiData = await aiRes.json();
      const raw = aiData.content?.find((b) => b.type === "text")?.text || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setDigest(parsed);
      setStatus("Digest generated. Saving...");

      const saveRes = await fetch("/api/save-digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ digest: parsed, password }),
      });

      const saveData = await saveRes.json();
      if (saveData.url) {
        setStatus("✓ Digest saved successfully! URL: " + saveData.url);
      } else {
        setStatus("Error saving: " + JSON.stringify(saveData));
      }
    } catch (e) {
      setStatus("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#e0e0e0", fontFamily: "monospace", padding: 32 }}>
      <h1 style={{ color: "#E8002D", marginBottom: 24 }}>PITLANE REGS — ADMIN</h1>
      <div style={{ marginBottom: 16 }}>
        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: "10px 16px", background: "#111", border: "1px solid #333", color: "#fff", fontFamily: "monospace", marginRight: 12, width: 200 }}
        />
        <button
          onClick={generateAndSave}
          disabled={loading}
          style={{ padding: "10px 24px", background: "#E8002D", color: "#fff", border: "none", fontFamily: "monospace", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1 }}
        >
          {loading ? "PROCESSING..." : "GENERATE & SAVE DIGEST"}
        </button>
      </div>
      {status && <p style={{ color: "#888", marginBottom: 16, fontSize: 12 }}>{status}</p>}
      {digest && (
        <pre style={{ background: "#111", padding: 16, fontSize: 11, overflow: "auto", maxHeight: 400, color: "#0f0" }}>
          {JSON.stringify(digest, null, 2)}
        </pre>
      )}
    </div>
  );
}
