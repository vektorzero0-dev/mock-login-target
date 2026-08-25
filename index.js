const attempts = {};

export default function handler(req, res) {
  // Terima request POST dan GET (agar mudah diuji di browser)
  if (req.method === 'GET') {
    return res.status(200).json({ message: 'Server Target Siap Aktif!' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const clientIp = req.headers['x-forwarded-for'] || 'unknown-ip';
  const { username, password } = req.body || {};
  const currentTime = Date.now();

  if (!attempts[clientIp]) {
    attempts[clientIp] = [];
  }

  attempts[clientIp] = attempts[clientIp].filter(time => currentTime - time < 60000);

  // Batas rate limit: 10 request per menit
  if (attempts[clientIp].length >= 10) {
    return res.status(429).json({ 
      status: 429, 
      message: 'Too Many Requests! Proteksi Rate-Limit Aktif.' 
    });
  }

  attempts[clientIp].push(currentTime);

  if (username === 'admin' && password === '1234') {
    return res.status(200).json({ status: 200, message: 'Login Berhasil!' });
  } else {
    return res.status(401).json({ status: 401, message: 'PIN Salah' });
  }
}
