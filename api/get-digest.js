import { list } from "@vercel/blob";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const { blobs } = await list({ prefix: 'digest/' });
    
    if (blobs.length === 0) {
      return res.status(404).json({ error: "No digest found" });
    }

    const latest = blobs[0];
    const response = await fetch(latest.url);
    const digest = await response.json();
    
    return res.status(200).json(digest);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
