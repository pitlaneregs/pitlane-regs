import { put } from "@vercel/blob";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { digest, password } = req.body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { url } = await put('digest/latest.json', JSON.stringify(digest), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });

  return res.status(200).json({ url });
}
