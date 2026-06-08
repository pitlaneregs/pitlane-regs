import { put } from "@vercel/blob";
import { Resend } from "resend";

const SYSTEM_PROMPT_SHORT = `Return ONLY this JSON, no other text:
{"digest_title":"string","digest_date":"string","summary":"string","items":[{"series":"string","headline":"string","detail":"string","impact":"LOW|MEDIUM|HIGH","category":"Technical|Sporting|Financial|Safety"}]}`;

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

    // Step 3 — Generate newsletter as flowing magazine article
    const newsletterRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.VITE_ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 3000,
        system: `You are a senior motorsport regulations correspondent writing for a professional audience of engineers, team managers and serious enthusiasts. Write in the style of a high-quality technical magazine — analytical, specific, authoritative. Use HTML with inline styles only.`,
        messages: [{ role: "user", content: `Today is ${today}. Write the PitLane Regs weekly newsletter.

Write it as a flowing magazine article — NOT as a list of rigid sections. For each regulation story:
- Open with a sharp lead sentence explaining the significance
- Explain specifically what changed and why (these must be genuinely different sentences covering different information)
- Provide real technical depth: aerodynamic effects, mechanical implications, how specific teams will need to adapt their car architecture or setup
- Name specific teams, manufacturers or drivers that benefit or lose out — be specific, not generic
- Reference historical precedent where relevant (e.g. "similar to the 2019 front wing regulation change...")
- End each story with a direct link to the official source document

Format in HTML. Use this structure for each story:
- Series name + category as small red (#E8002D) monospace label
- Story headline as h2
- Body as flowing paragraphs (not bullet points, not rigid section headers)
- Source link at end in red

After all stories, write a brief "What to watch" closing section.

Write about F1, MotoGP, WRC, Formula E. Be specific and technically detailed throughout.` }],
      }),
    });

    const newsletterData = await newsletterRes.json();
    const newsletterHtml = newsletterData.content?.find(b => b.type === "text")?.text || "<p>Newsletter generation failed</p>";

    // Step 4 — Wrap in email template
    const emailHtml = `<!DOCTYPE html>
<html>
<body style="font-family:Georgia,serif;max-width:680px;margin:0 auto;padding:32px 24px;background:#fff;color:#222">
  <div style="border-top:3px solid #E8002D;padding-top:20px;margin-bottom:32px">
    <div style="font-family:monospace;font-size:10px;color:#E8002D;font-weight:bold;letter-spacing:0.25em;margin-bottom:6px">PITLANE REGS · WEEKLY NEWSLETTER</div>
    <div style="font-family:monospace;font-size:11px;color:#999">${today} · pitlaneregs.com</div>
  </div>
  ${newsletterHtml}
  <hr style="border:none;border-top:1px solid #eee;margin:40px 0 24px"/>
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

    // Step 5 — Send email
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
