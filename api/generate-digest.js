import { put } from "@vercel/blob";
import { Resend } from "resend";

const SYSTEM_PROMPT_SHORT = `Return ONLY this JSON, no other text:
{"digest_title":"string","digest_date":"string","summary":"string","items":[{"series":"string","headline":"string","detail":"string","impact":"LOW|MEDIUM|HIGH","category":"Technical|Sporting|Financial|Safety"}],"cross_series_insight":"string"}`;

const SYSTEM_PROMPT_FULL = `You are a motorsport regulations expert writing a detailed newsletter. Return ONLY this JSON, no other text:
{"digest_title":"string","digest_date":"string","summary":"string","items":[{"series":"string","headline":"string","full_analysis":"string","impact":"LOW|MEDIUM|HIGH","category":"Technical|Sporting|Financial|Safety","source_url":"string"}],"cross_series_insight":"string"}`;

export default async function handler(req, res) {
  const secret = req.headers["x-cron-secret"] || req.body?.password;
  if (secret !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const today = new Date().toLocaleDateString("en-GB");

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
        messages: [{ role: "user", content: `Write a motorsport regulations digest for F1, MotoGP, WRC, Formula E, NASCAR, IndyCar for ${today}. Return ONLY valid JSON.` }],
      }),
    });

    const shortData = await shortRes.json();
    const shortRaw = shortData.content?.find(b => b.type === "text")?.text || "";
    const shortDigest = JSON.parse(shortRaw.replace(/```json|```/g, "").trim());

    // Step 2 — Save short version to Blob (public website)
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
        messages: [{ role: "user", content: `Write a DETAILED motorsport regulations newsletter for F1, MotoGP, WRC, Formula E for ${today}. Include full technical analysis. Return ONLY valid JSON.` }],
      }),
    });

    const fullData = await fullRes.json();
    const fullRaw = fullData.content?.find(b => b.type === "text")?.text || "";

    // Parse full digest safely
    let fullDigest;
    try {
      fullDigest = JSON.parse(fullRaw.replace(/```json|```/g, "").trim());
    } catch(e) {
      fullDigest = {
        digest_title: shortDigest.digest_title,
        digest_date: shortDigest.digest_date,
        raw_content: fullRaw,
      };
    }

    // Step 4 — Format email HTML
    const emailHtml = fullDigest.raw_content
      ? `
        <h1 style="font-family:Arial Black;color:#E8002D">${fullDigest.digest_title}</h1>
        <p style="color:#666;font-family:monospace">${fullDigest.digest_date}</p>
        <hr style="border-color:#eee;margin:24px 0"/>
        <pre style="font-family:Arial;font-size:13px;line-height:1.8;white-space:pre-wrap">${fullDigest.raw_content}</pre>
        <hr style="border-color:#eee;margin:24px 0"/>
        <p style="font-size:11px;color:#999;font-family:monospace">PitLane Regs · pitlaneregs.com</p>
      `
      : `
        <h1 style="font-family:Arial Black;color:#E8002D">${fullDigest.digest_title}</h1>
        <p style="color:#666;font-family:monospace">${fullDigest.digest_date}</p>
        <p style="font-family:Arial;font-size:14px;line-height:1.7;color:#444">${fullDigest.summary}</p>
        <hr style="border-color:#eee;margin:24px 0"/>
        ${(fullDigest.items || []).map(item => `
          <div style="margin-bottom:32px;border-left:3px solid #E8002D;padding-left:16px">
            <div style="font-family:monospace;font-size:11px;color:#E8002D;font-weight:bold;margin-bottom:8px">
              ${item.series} · ${item.category} · ${item.impact}
            </div>
            <h2 style="font-family:Arial Black;font-size:18px;margin:0 0 8px;color:#111">${item.headline}</h2>
            <p style="font-size:14px;line-height:1.7;color:#444">${item.full_analysis}</p>
            ${item.source_url ? `<a href="${item.source_url}" style="font-size:11px;color:#E8002D;text-decoration:none">Official source ↗</a>` : ""}
          </div>
        `).join("")}
        <hr style="border-color:#eee;margin:24px 0"/>
        <div style="background:#f9f9f9;padding:16px;border-left:3px solid #00BFFF">
          <strong>Cross-Series Insight:</strong><br/>
          <p style="font-size:13px;color:#555;line-height:1.7">${fullDigest.cross_series_insight || ""}</p>
        </div>
        <br/>
        <p style="font-size:11px;color:#999;font-family:monospace">PitLane Regs · pitlaneregs.com</p>
      `;

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
