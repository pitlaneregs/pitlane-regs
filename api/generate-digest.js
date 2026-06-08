import { put } from "@vercel/blob";
import { Resend } from "resend";

const SYSTEM_PROMPT_SHORT = `Return ONLY this JSON, no other text:
{"digest_title":"string","digest_date":"string","summary":"string","items":[{"series":"string","headline":"string","detail":"string","impact":"LOW|MEDIUM|HIGH","category":"Technical|Sporting|Financial|Safety"}]}`;

const SERIES_SOURCES = {
  "F1": { label: "FIA Formula 1 Regulations", url: "https://www.fia.com/regulation/category/110" },
  "MotoGP": { label: "MotoGP Technical Regulations", url: "https://www.motogp.com/en/news/rules-and-regulations" },
  "WRC": { label: "FIA WRC Regulations", url: "https://www.fia.com/regulation/category/185" },
  "Formula E": { label: "FIA Formula E Regulations", url: "https://www.fia.com/regulation/category/1491" },
  "NASCAR": { label: "NASCAR Rulebook", url: "https://www.nascar.com/rules" },
  "IndyCar": { label: "IndyCar Rules", url: "https://www.indycar.com/Info/Rules" },
};

export default async function handler(req, res) {
  const secret = req.headers["x-cron-secret"] || req.body?.password;
  if (secret !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const now = new Date();
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();
  const day = now.getDate().toString().padStart(2,'0');
  const isoDate = `${year}-${(now.getMonth()+1).toString().padStart(2,'0')}-${day}`;
  const today = `${day} ${month} ${year}`;

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
        messages: [{ role: "user", content: `Today is ${today}. Write a motorsport regulations digest for F1, MotoGP, WRC, Formula E, NASCAR, IndyCar. Use digest_date: "${isoDate}". Return ONLY valid JSON.` }],
      }),
    });

    const shortData = await shortRes.json();
    const shortRaw = shortData.content?.find(b => b.type === "text")?.text || "";
    const shortDigest = JSON.parse(shortRaw.replace(/```json|```/g, "").trim());

    // Step 2 — Save short version to Blob
    await put("digest/latest.json", JSON.stringify(shortDigest), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });

    // Step 3 — Generate newsletter content (no URLs - we add them ourselves)
    const newsletterRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.VITE_ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 4000,
        system: `You are a senior motorsport regulations analyst writing for engineers and team managers. Write analytically and specifically. Return HTML with inline styles only. DO NOT include any source links or URLs — these will be added separately.`,
        messages: [{ role: "user", content: `Today is ${today}. Write the PitLane Regs weekly newsletter for F1, MotoGP, WRC, Formula E.

For each regulation story write flowing magazine prose (not bullet points, not rigid headers):
- Sharp opening sentence on why this matters
- What specifically changed (concrete, not generic)
- The political or competitive context behind the change (genuinely different from what changed)
- Technical depth: aerodynamic, mechanical or software implications — how teams adapt
- Which specific teams or manufacturers benefit or lose out — be specific
- Historical parallel if relevant

Use this HTML structure per story:
<div style="margin-bottom:40px">
  <div style="font-family:monospace;font-size:11px;color:#E8002D;font-weight:bold;letter-spacing:0.15em;margin-bottom:8px">SERIES / CATEGORY</div>
  <h2 style="font-family:Arial Black;font-size:20px;color:#111;margin:0 0 16px;line-height:1.3">Headline</h2>
  <p style="font-size:14px;line-height:1.8;color:#333;margin:0 0 12px">Paragraph...</p>
</div>

Cover 4 stories: one F1, one MotoGP, one WRC, one Formula E.
End with a brief "What to watch this week" section.
DO NOT include any links or URLs anywhere.` }],
      }),
    });

    const newsletterData = await newsletterRes.json();
    let newsletterHtml = newsletterData.content?.find(b => b.type === "text")?.text || "<p>Newsletter generation failed</p>";

    // Step 4 — Inject verified source links for each series
    const sourceLinksHtml = Object.entries(SERIES_SOURCES).map(([series, source]) => `
      <div style="display:inline-block;margin:4px 8px 4px 0">
        <a href="${source.url}" style="font-family:monospace;font-size:11px;color:#E8002D;text-decoration:none;border:1px solid #E8002D33;padding:4px 10px">
          ${series} ↗
        </a>
      </div>
    `).join("");

    // Step 5 — Build final email
    const emailHtml = `<!DOCTYPE html>
<html>
<body style="font-family:Georgia,serif;max-width:680px;margin:0 auto;padding:32px 24px;background:#fff;color:#222">

  <div style="border-top:3px solid #E8002D;padding-top:20px;margin-bottom:32px">
    <div style="font-family:monospace;font-size:10px;color:#E8002D;font-weight:bold;letter-spacing:0.25em;margin-bottom:6px">PITLANE REGS · WEEKLY NEWSLETTER</div>
    <div style="font-family:monospace;font-size:11px;color:#999">${today} · pitlaneregs.com</div>
  </div>

  ${newsletterHtml}

  <hr style="border:none;border-top:1px solid #eee;margin:40px 0 24px"/>

  <div style="margin-bottom:32px">
    <div style="font-family:monospace;font-size:10px;color:#555;font-weight:bold;letter-spacing:0.15em;margin-bottom:12px">OFFICIAL REGULATION SOURCES</div>
    ${sourceLinksHtml}
  </div>

  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
  <div style="text-align:center">
    <p style="font-size:11px;color:#bbb;font-family:monospace;margin:0">
      PitLane Regs · <a href="https://pitlaneregs.com" style="color:#E8002D;text-decoration:none">pitlaneregs.com</a>
    </p>
    <p style="font-size:10px;color:#ddd;font-family:monospace;margin:8px 0 0">
      <a href="https://pitlaneregs.beehiiv.com/subscribe" style="color:#E8002D;text-decoration:none">Subscribe</a> · Forward to a colleague who follows motorsport regulations
    </p>
  </div>

</body>
</html>`;

    // Step 6 — Send email
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "PitLane Regs <onboarding@resend.dev>",
      to: process.env.ADMIN_EMAIL,
      subject: `PitLane Regs — ${today} digest ready`,
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
