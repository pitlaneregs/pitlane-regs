cat > /mnt/user-data/outputs/generate-digest.js << 'ENDOFFILE'
import { put } from "@vercel/blob";
import { Resend } from "resend";

const SYSTEM_PROMPT_SHORT = `Return ONLY this JSON, no other text:
{"digest_title":"string","digest_date":"string","summary":"string","items":[{"series":"string","headline":"string","detail":"string","impact":"LOW|MEDIUM|HIGH","category":"Technical|Sporting|Financial|Safety"}],"cross_series_insight":"string"}`;

const SYSTEM_PROMPT_FULL = `You are a senior motorsport regulations analyst with deep technical expertise. You MUST return ONLY a valid JSON object. No markdown, no backticks, no text before or after the JSON. Return ONLY this structure:
{"digest_title":"string","digest_date":"string","executive_summary":"string","items":[{"series":"string","headline":"string","what_changed":"string","why_it_changed":"string","technical_analysis":"string","who_benefits":"string","historical_context":"string","impact":"LOW|MEDIUM|HIGH","category":"Technical|Sporting|Financial|Safety","source_url":"string","source_document":"string"}],"cross_series_insight":"string","outlook":"string"}`;

export default async function handler(req, res) {
  const secret = req.headers["x-cron-secret"] || req.body?.password;
  if (secret !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const now = new Date();
  const today = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()}`;
  const isoDate = now.toISOString().split("T")[0];

  try {
    // Step 1 — Generate short version for website
    const shortRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.VITE_ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: SYSTEM_PROMPT_SHORT,
        messages: [{ role: "user", content: `Today is ${today}. Write a motorsport regulations digest for F1, MotoGP, WRC, Formula E, NASCAR, IndyCar. Use exactly these series names: "F1", "MotoGP", "WRC", "Formula E", "NASCAR", "IndyCar". Return ONLY valid JSON, no markdown, no backticks.` }],
      }),
    });

    const shortData = await shortRes.json();
    const shortRaw = shortData.content?.find(b => b.type === "text")?.text || "";
    const shortClean = shortRaw.replace(/```json|```/g, "").trim();
    const shortDigest = JSON.parse(shortClean);

    // Step 2 — Save short version to Blob
    await put("digest/latest.json", JSON.stringify(shortDigest), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });

    // Step 3 — Generate full version for newsletter
    const fullRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.VITE_ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 2000,
        system: SYSTEM_PROMPT_FULL,
        messages: [{ role: "user", content: `Today is ${today}. Write a DEEPLY DETAILED motorsport regulations newsletter for F1, MotoGP, WRC, Formula E. For each item include: what exactly changed, why it changed, full technical analysis, which teams/manufacturers benefit, historical context comparing to previous regulations, and direct URLs to official FIA/FIM/series documents. Use exactly these series names: "F1", "MotoGP", "WRC", "Formula E". You MUST return ONLY a valid JSON object. No markdown, no backticks, no text before or after the JSON.` }],
      }),
    });

    const fullData = await fullRes.json();
    const fullRaw = fullData.content?.find(b => b.type === "text")?.text || "";
    const fullClean = fullRaw.replace(/```json|```/g, "").trim();

    // Parse full digest safely
    let fullDigest;
    try {
      fullDigest = JSON.parse(fullClean);
    } catch(e) {
      fullDigest = {
        digest_title: shortDigest.digest_title,
        digest_date: isoDate,
        executive_summary: shortDigest.summary,
        items: shortDigest.items.map(i => ({...i, what_changed: i.detail, technical_analysis: i.detail})),
        cross_series_insight: shortDigest.cross_series_insight,
      };
    }

    // Step 4 — Format email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;background:#fff;color:#222">
  <div style="border-top:3px solid #E8002D;padding-top:16px;margin-bottom:24px">
    <h1 style="font-family:Arial Black;color:#E8002D;font-size:26px;margin:0 0 4px">${fullDigest.digest_title}</h1>
    <p style="font-family:monospace;font-size:11px;color:#999;margin:0">${fullDigest.digest_date} · PitLane Regs Newsletter</p>
  </div>

  <div style="background:#f9f9f9;padding:16px;border-left:3px solid #E8002D;margin-bottom:32px">
    <p style="font-size:14px;line-height:1.7;color:#444;margin:0"><strong>Executive Summary:</strong> ${fullDigest.executive_summary || fullDigest.summary || ""}</p>
  </div>

  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>

  ${(fullDigest.items || []).map(item => `
    <div style="margin-bottom:40px">
      <div style="font-family:monospace;font-size:10px;color:#E8002D;font-weight:bold;letter-spacing:0.1em;margin-bottom:8px">
        ${item.series} · ${item.category} · <span style="color:${item.impact === 'HIGH' ? '#E8002D' : item.impact === 'MEDIUM' ? '#FF8900' : '#00A650'}">${item.impact} IMPACT</span>
      </div>
      <h2 style="font-family:Arial Black;font-size:18px;margin:0 0 16px;color:#111;line-height:1.3;border-bottom:1px solid #eee;padding-bottom:12px">${item.headline}</h2>

      ${item.what_changed ? `
      <p style="font-size:12px;font-family:monospace;color:#E8002D;font-weight:bold;margin:0 0 4px;letter-spacing:0.05em">WHAT CHANGED</p>
      <p style="font-size:13px;line-height:1.8;color:#444;margin:0 0 16px">${item.what_changed}</p>` : ""}

      ${item.why_it_changed ? `
      <p style="font-size:12px;font-family:monospace;color:#E8002D;font-weight:bold;margin:0 0 4px;letter-spacing:0.05em">WHY IT CHANGED</p>
      <p style="font-size:13px;line-height:1.8;color:#444;margin:0 0 16px">${item.why_it_changed}</p>` : ""}

      ${item.technical_analysis ? `
      <p style="font-size:12px;font-family:monospace;color:#E8002D;font-weight:bold;margin:0 0 4px;letter-spacing:0.05em">TECHNICAL ANALYSIS</p>
      <p style="font-size:13px;line-height:1.8;color:#444;margin:0 0 16px">${item.technical_analysis}</p>` : ""}

      ${item.who_benefits ? `
      <p style="font-size:12px;font-family:monospace;color:#E8002D;font-weight:bold;margin:0 0 4px;letter-spacing:0.05em">WHO BENEFITS</p>
      <p style="font-size:13px;line-height:1.8;color:#444;margin:0 0 16px">${item.who_benefits}</p>` : ""}

      ${item.historical_context ? `
      <p style="font-size:12px;font-family:monospace;color:#999;font-weight:bold;margin:0 0 4px;letter-spacing:0.05em">HISTORICAL CONTEXT</p>
      <p style="font-size:13px;line-height:1.8;color:#666;margin:0 0 16px;font-style:italic">${item.historical_context}</p>` : ""}

      ${item.source_url ? `
      <div style="background:#f5f5f5;padding:10px 14px;display:inline-block">
        <a href="${item.source_url}" style="font-size:11px;color:#E8002D;text-decoration:none;font-family:monospace;font-weight:bold">
          ↗ ${item.source_document || "Official source"}
        </a>
      </div>` : ""}
    </div>
  `).join('<hr style="border:none;border-top:1px solid #eee;margin:32px 0"/>')}

  <hr style="border:none;border-top:1px solid #eee;margin:32px 0"/>

  <div style="background:#f0f8ff;padding:20px;border-left:3px solid #00BFFF;margin-bottom:24px">
    <p style="font-family:monospace;font-size:10px;color:#00BFFF;font-weight:bold;margin:0 0 8px;letter-spacing:0.1em">◈ CROSS-SERIES INSIGHT</p>
    <p style="font-size:13px;line-height:1.7;color:#444;margin:0">${fullDigest.cross_series_insight || ""}</p>
  </div>

  ${fullDigest.outlook ? `
  <div style="background:#fff9f0;padding:20px;border-left:3px solid #FF8900;margin-bottom:24px">
    <p style="font-family:monospace;font-size:10px;color:#FF8900;font-weight:bold;margin:0 0 8px;letter-spacing:0.1em">⟳ OUTLOOK</p>
    <p style="font-size:13px;line-height:1.7;color:#444;margin:0">${fullDigest.outlook}</p>
  </div>` : ""}

  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
  <p style="font-size:11px;color:#bbb;font-family:monospace;text-align:center">
    PitLane Regs · <a href="https://pitlaneregs.com" style="color:#E8002D;text-decoration:none">pitlaneregs.com</a> · Motorsport Regulatory Intelligence
  </p>
</body>
</html>`;

    // Step 5 — Send email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "PitLane Regs <onboarding@resend.dev>",
      to: process.env.ADMIN_EMAIL,
      subject: `📋 ${fullDigest.digest_title} — Ready to publish`,
      html: emailHtml,
    });

    return res.status(200).json({
      success: true,
      message: "Digest generated, saved and email sent",
      items: shortDigest.items?.length,
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
ENDOFFILE
echo "Done"
