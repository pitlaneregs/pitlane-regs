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

    // Step 3 — Build digest summary to pass to newsletter generator
    const digestSummary = shortDigest.items.map((item, i) =>
      `${i+1}. [${item.series}] ${item.headline} (${item.category}, ${item.impact} impact)\n   Summary: ${item.detail}`
    ).join("\n\n");

    const seriesCovered = [...new Set(shortDigest.items.map(i => i.series))].join(", ");

    // Step 4 — Generate newsletter expanding exactly the site digest items
    const newsletterRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.VITE_ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 6000,
        system: `You are a senior motorsport regulations analyst writing for engineers and team managers. Write analytically and specifically. Return HTML with inline styles only. DO NOT include any source links or URLs.`,
        messages: [{ role: "user", content: `Today is ${today}. Write the PitLane Regs weekly newsletter.

The site digest published these ${shortDigest.items.length} stories today (${seriesCovered}):

${digestSummary}

Expand EVERY story from the list above into a full magazine article. Do not skip any. Cover them all in order.

For each story write flowing magazine prose:
- Sharp opening on why this matters to engineers and team managers
- What specifically changed (concrete details beyond the summary above)
- Political or competitive context behind the change
- Technical depth: aerodynamic, mechanical or software implications
- Which specific teams or manufacturers benefit or lose out
- Historical parallel if relevant (e.g. similar to 2019...)

Use this HTML structure per story:
<div style="margin-bottom:48px;padding-bottom:40px;border-bottom:1px solid #eee">
  <div style="font-family:monospace;font-size:11px;color:#E8002D;font-weight:bold;letter-spacing:0.15em;margin-bottom:8px">SERIES / CATEGORY · IMPACT</div>
  <h2 style="font-family:Arial Black;font-size:20px;color:#111;margin:0 0 16px;line-height:1.3">Headline</h2>
  <p style="font-size:14px;line-height:1.9;color:#333;font-family:Georgia,serif;margin:0 0 14px">Paragraph...</p>
</div>

End with a "What to watch" closing paragraph.
DO NOT include any URLs or links anywhere in the content.` }],
      }),
    });

    const newsletterData = await newsletterRes.json();
    const newsletterHtml = newsletterData.content?.find(b => b.type === "text")?.text || "<p>Newsletter generation failed</p>";

    // Step 5 — Build source links only for series that appeared in digest
    const seriesInDigest = [...new Set(shortDigest.items.map(i => i.series))];
    const sourceLinksHtml = seriesInDigest
      .filter(s => SERIES_SOURCES[s])
      .map(s => `
        <a href="${SERIES_SOURCES[s].url}" style="display:inline-block;font-family:monospace;font-size:11px;color:#E8002D;text-decoration:none;border:1px solid #E8002D44;padding:5px 12px;margin:4px 6px 4px 0">
          ${s} ↗
        </a>
      `).join("");

    // Step 6 — Build final email
    const emailHtml = `<!DOCTYPE html>
<html>
<body style="font-family:Georgia,serif;max-width:680px;margin:0 auto;padding:32px 24px;background:#fff;color:#222">

  <div style="border-top:3px solid #E8002D;padding-top:20px;margin-bottom:32px">
    <div style="font-family:monospace;font-size:10px;color:#E8002D;font-weight:bold;letter-spacing:0.25em;margin-bottom:6px">PITLANE REGS · WEEKLY NEWSLETTER</div>
    <div style="font-family:monospace;font-size:11px;color:#999">${today} · ${shortDigest.items.length} stories · pitlaneregs.com</div>
  </div>

  <div style="background:#f9f9f9;padding:16px 20px;border-left:3px solid #E8002D;margin-bottom:36px">
    <p style="font-size:13px;line-height:1.7;color:#555;margin:0;font-family:monospace">${shortDigest.summary}</p>
  </div>

  ${newsletterHtml}

  <div style="margin:40px 0 24px">
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

    // Step 7 — Send email
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "PitLane Regs <onboarding@resend.dev>",
      to: process.env.ADMIN_EMAIL,
      subject: `PitLane Regs — ${today} (${shortDigest.items.length} stories)`,
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
