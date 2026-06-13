import { list, head } from "@vercel/blob";

export default async function handler(req, res) {
  try {
    const { blobs } = await list({ prefix: "blog/" });
    const indexBlob = blobs.find(b => b.pathname === "blog/index.json");
    if (!indexBlob) return res.status(200).json({ posts: [] });
    const response = await fetch(indexBlob.url);
    const data = await response.json();
    return res.status(200).json({ posts: data });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
