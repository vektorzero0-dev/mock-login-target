const attempts = {};

export default function handler(req, res) {
  // Bolehkan CORS agar aplikasi penguji tidak terbendung
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Supaya saat dibuka di browser tidak 404
  if (req.method === 'GET') {
    return res.status(200).json({ message: "Server Target Vercel Aktif!" });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const clientIp = req.headers['x-forwarded-for'] || 'unknown-ip';
  const currentTime = Date.now();

  if (!attempts[clientIp]) attempts[clientIp] = [];
  attempts[clientIp] = attempts[clientIp].filter(t => currentTime - t < 60000);

  // Batas rate limit: 10 request per menit
  if (attempts[clientIp].length >= 10) {
    return res.status(429).json({ 
      status: 429, 
      message: "Too Many Requests! Proteksi Rate-Limit Aktif." 
    });
  }

  attempts[clientIp].push(currentTime);
  return res.status(401).json({ status: 401, message: "PIN Salah" });
}
