import { put } from "@vercel/blob";
import { Resend } from "resend";

const SYSTEM_PROMPT_SHORT = `Return ONLY this JSON, no other text:
{"digest_title":"string","digest_date":"string","summary":"string","items":[{"series":"string","headline":"string","detail":"string","impact":"LOW|MEDIUM|HIGH","category":"Technical|Sporting|Financial|Safety"}],"cross_series_insight":"string"}`;

const SYSTEM_PROMPT_FULL = `You are a motorsport regulations expert. You MUST return ONLY a valid JSON object. No markdown, no backticks, no text before or after the JSON. Return ONLY this structure:
{"digest_title":"string","digest_date":"string","summary":"string","items":[{"series":"string","headline":"string","full_analysis":"string","impact":"LOW|MEDIUM|HIGH","category":"Technical|Sporting|Financial|Safety","source_url":"string"}],"cross_series_insight":"string"}`;

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
        messages: [{ role: "user", content: `Today is ${today}. Write a motorsport regulations digest for F1, MotoGP, WRC, Formula E, NASCAR, IndyCar. Return ONLY valid JSON, no markdown, no backticks.` }],
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
        messages: [{ role: "user", content: `Today is ${today}. Write a detailed motorsport regulations newsletter for F1, MotoGP, WRC, Formula E. Include full technical analysis and source URLs. You MUST return ONLY a valid JSON object. No markdown, no backticks, no text before or after the JSON.` }],
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
        items: shortDigest.items,
        cross_series_insight: shortDigest.cross_series_insight,
        summary: shortDigest.summary,
      };
    }

    // Step 4 — Format email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;background:#fff;color:#222">
  <div style="border-top:3px solid #E8002D;padding-top:16px;margin-bottom:24px">
    <h1 style="font-family:Arial Black;color:#E8002D;font-size:28px;margin:0 0 4px">${fullDigest.digest_title}</h1>
    <p style="font-family:monospace;font-size:11px;color:#999;margin:0">${fullDigest.digest_date} · PitLane Regs</p>
  </div>

  <p style="font-size:14px;line-height:1.7;color:#555;margin-bottom:32px">${fullDigest.summary || ""}</p>

  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>

  ${(fullDigest.items || []).map(item => `
    <div style="margin-bottom:32px;padding-left:16px;border-left:3px solid #E8002D">
      <div style="font-family:monospace;font-size:10px;color:#E8002D;font-weight:bold;letter-spacing:0.1em;margin-bottom:8px">
        ${item.series} · ${item.category} · ${item.impact}
      </div>
      <h2 style="font-family:Arial Black;font-size:17px;margin:0 0 10px;color:#111;line-height:1.3">${item.headline}</h2>
      <p style="font-size:13px;line-height:1.8;color:#444;margin:0 0 8px">${item.full_analysis || item.detail || ""}</p>
      ${item.source_url ? `<a href="${item.source_url}" style="font-size:11px;color:#E8002D;text-decoration:none;font-family:monospace">Official source ↗</a>` : ""}
    </div>
  `).join("")}

  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>

  <div style="background:#f8f8f8;padding:20px;border-left:3px solid #00BFFF;margin-bottom:24px">
    <p style="font-family:monospace;font-size:10px;color:#00BFFF;font-weight:bold;margin:0 0 8px;letter-spacing:0.1em">◈ CROSS-SERIES INSIGHT</p>
    <p style="font-size:13px;line-height:1.7;color:#555;margin:0">${fullDigest.cross_series_insight || ""}</p>
  </div>

  <p style="font-size:11px;color:#bbb;font-family:monospace;text-align:center">
    PitLane Regs · <a href="https://pitlaneregs.com" style="color:#E8002D;text-decoration:none">pitlaneregs.com</a>
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
