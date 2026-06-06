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
          <text x
