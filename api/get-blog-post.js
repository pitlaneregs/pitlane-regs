import { list } from "@vercel/blob";

export default async function handler(req, res) {
  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: "Missing slug" });

  try {
    const { blobs } = await list({ prefix: `blog/${slug}` });
    const blob = blobs.find(b => b.pathname === `blog/${slug}.json`);
    if (!blob) return res.status(404).json({ error: "Post not found" });
    const response = await fetch(blob.url);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
