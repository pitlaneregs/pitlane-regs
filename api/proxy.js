export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const bodyString = JSON.stringify(req.body);
  const key = process.env.VITE_ANTHROPIC_KEY;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: bodyString,
  });

  const text = await response.text();
  console.log('Response status:', response.status);
console.log('Response length:', text.length);
console.log('Response preview:', text.substring(0, 100));

  console.log('Status:', response.status, 'Length:', text.length, 'Preview:', text.substring(0, 50));
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).send(text);
}
