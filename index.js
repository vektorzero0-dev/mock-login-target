const attempts = {};

export default function handler(req, res) {
  // Pengaturan Izinkan CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ message: 'Server Target Siap Aktif!' });
  }

  if (req.method === 'POST') {
    const clientIp = req.headers['x-forwarded-for'] || 'unknown-ip';
    
    // Parse body aman untuk mendukung JSON maupun Text Plain
    let body = {};
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    } catch (e) {
      body = {};
    }

    const { username, password } = body;
    const currentTime = Date.now();

    if (!attempts[clientIp]) attempts[clientIp] = [];
    attempts[clientIp] = attempts[clientIp].filter(t => currentTime - t < 60000);

    // Rate-limit: Maksimal 10 percobaan per 60 detik
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

  return res.status(405).json({ message: 'Method Not Allowed' });
}
