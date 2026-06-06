import { put } from "@vercel/blob";
import { Resend } from "resend";

const SYSTEM_PROMPT_SHORT = `Return ONLY this JSON, no other text:
{"digest_title":"string","digest_date":"string","summary":"string","items":[{"series":"string","headline":"string","detail":"string","impact":"LOW|MEDIUM|HIGH","category":"Technical|Sporting|Financial|Safety"}],"cross_series_insight":"string"}`;

const SYSTEM_PROMPT_FULL = `You are a motorsport regulations expert. Return ONLY this JSON, no other text:
{"digest_title":"string","digest_date":"string","summary":"string","items":[{"series":"string","headline":"string","brief":"string","full_analysis":"string","technical_implications":"string","impact":"LOW|MEDIUM|HIGH","category":"Technical|Sporting|Financial|Safety","source_url":"string"}],"cross_series_insight":"string","editor_note":"string"}`;

export default async function handler(req, res) {
  const secret = req.headers["x-cron-secret"] || req.body?.password;
  if (secret !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const today = new Date().toLocaleDateString("en-GB");

  try {
    // Generate short version for website
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
        messages: [{ role: "user", content: `Write a motorsport regulations digest for F1, MotoGP, WRC, Formula E, NASCAR, IndyCar for ${today}. Return ONLY valid JSON.` }],
      }),
    });

    const shortData = await shortRes.json();
    const shortRaw = shortData.content?.find(b => b.type === "text")?.text || "";
    const shortDigest = JSON.parse(shortRaw.replace(/```json|```/g, "").trim());

    // Save short version to Blob
    await put("digest/latest.json", JSON.stringify(shortDigest), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });

    // Generate full version for newsletter
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
        messages: [{ role: "user", content: `Write a DETAILED motorsport regulations newsletter for F1, MotoGP, WRC, Formula E, NASCAR, IndyCar for ${today}. Include full technical analysis and source URLs. Return ONLY valid JSON.` }],
      }),
    });

    const fullData = await fullRes.json();
    const fullRaw = fullData.content?.find(b => b.type === "text")?.text || "";
    const fullDigest = JSON.parse(fullRaw.replace(/```json|```/g, "").trim());

    // Format newsletter email
    const emailHtml = `
<h1 style="font-family:Arial Black;color:#E8002D">${fullDigest.digest_title}</h1>
<p style="color:#666;font-family:monospace">${fullDigest.digest_date}</p>
<p style="font-family:Arial;font-size:14px;line-height:1.7">${fullDigest.summary}</p>
<hr style="border-color:#222;margin:24px 0"/>
${fullDigest.items?.map(item => `
<div style="margin-bottom:32px;border-left:3px solid #E8002D;padding-left:16px">
  <div style="font-family:monospace;font-size:11px;color:#E8002D;font-weight:bold;margin-bottom:8px">
    ${item.series} · ${item.category} · ${item.impact}
  </div>
  <h2 style="font-family:Arial Black;font-size:18px;margin:0 0 8px">${item.headline}</h2>
  <p style="font-size:14px;line-height:1.7;color:#444">${item.full_analysis}</p>
  <p style="font-size:13px;line-height:1.6;color:#666"><strong>Technical implications:</strong> ${item.technical_implications}</p>
  ${item.source_url ? `<a href="${item.source_url}" style="font-size:11px;color:#E8002D">Official source ↗</a>` : ""}
</div>`).join("")}
<hr style="border-color:#222;margin:24px 0"/>
<div style="background:#f5f5f5;padding:16px;border-left:3px solid #00BFFF">
  <strong>Cross-Series Insight:</strong><br/>
  ${fullDigest.cross_series_insight}
</div>
<br/>
<p style="font-size:12px;color:#999;font-family:monospace">PitLane Regs · pitlaneregs.com</p>
    `;

    // Send email via Resend
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
      items: shortDigest.items?.length 
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
