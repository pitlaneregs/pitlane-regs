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
  const day = now.getDate().toString().padStart(2,'0');
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();
  const isoDate = now.toISOString().split("T")[0];
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
        messages: [{ role: "user", content: `Today is ${today} (ISO: ${isoDate}). The current month is ${month} ${year}. Write a motorsport regulations digest. Use digest_date: "${isoDate}" and include ${month} in the digest_title. Series: F1, MotoGP, WRC, Formula E, NASCAR, IndyCar. Return ONLY valid JSON.` }],
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

    // Step 3 — Generate newsletter as HTML directly (no JSON parsing issues)
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
        system: `You are a senior motorsport regulations analyst writing a professional newsletter email. Write in HTML format ready to paste into an email client. Use inline styles only. Background white, text dark.`,
        messages: [{ role: "user", content: `Today is ${today}. Write the PitLane Regs weekly newsletter for F1, MotoGP, WRC, Formula E.

For each regulation update write 4 clearly DIFFERENT sections:
1. WHAT CHANGED: Only the specific factual change (1-2 sentences)
2. WHY IT CHANGED: Only the political/competitive reasons behind it - do NOT repeat what changed
3. TECHNICAL ANALYSIS: Engineering implications, how teams will adapt their cars - completely different from above sections
4. WHO BENEFITS: Specific teams or manufacturers that gain advantage

End each item with a link to the official source document (specific URL, not homepage).

After all items add an OUTLOOK section about what to watch in coming weeks.

Format as clean HTML with inline styles. Use red (#E8002D) for section headers. Make it look professional.` }],
      }),
    });

    const newsletterData = await newsletterRes.json();
    const newsletterHtml = newsletterData.content?.find(b => b.type === "text")?.text || "<p>Newsletter generation failed</p>";

    // Step 4 — Wrap in email template
    const emailHtml = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;background:#fff;color:#222">
  <div style="border-top:3px solid #E8002D;padding-top:16px;margin-bottom:32px">
    <div style="font-family:monospace;font-size:10px;color:#E8002D;font-weight:bold;letter-spacing:0.2em;margin-bottom:8px">PITLANE REGS · WEEKLY NEWSLETTER</div>
    <p style="font-family:monospace;font-size:11px;color:#999;margin:0">${isoDate}</p>
  </div>
  ${newsletterHtml}
  <hr style="border:none;border-top:1px solid #eee;margin:32px 0"/>
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
      subject: `📋 PitLane Regs — ${month} ${year} digest ready to publish`,
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
