const attempts = {};

export default function handler(req, res) {
  // 1. TAMPILAN WEB NYATA (Untuk Manusia yang membuka via Browser)
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Portal Masuk Sistem</title>
        <style>
          * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          body { background: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          .card { background: #1e293b; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); width: 100%; max-width: 400px; border: 1px solid #334155; }
          h2 { margin-top: 0; color: #38bdf8; text-align: center; font-size: 1.5rem; }
          p { color: #94a3b8; font-size: 0.875rem; text-align: center; margin-bottom: 1.5rem; }
          label { font-size: 0.85rem; color: #cbd5e1; display: block; margin-bottom: 0.5rem; }
          input { width: 100%; padding: 0.75rem; margin-bottom: 1.25rem; border-radius: 6px; border: 1px solid #475569; background: #0f172a; color: #fff; font-size: 1rem; }
          input:focus { outline: none; border-color: #38bdf8; }
          button { width: 100%; padding: 0.75rem; border-radius: 6px; border: none; background: #0284c7; color: white; font-weight: bold; font-size: 1rem; cursor: pointer; transition: 0.2s; }
          button:hover { background: #0369a1; }
          .status { margin-top: 1rem; padding: 0.75rem; border-radius: 6px; text-align: center; font-size: 0.875rem; display: none; }
          .error { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid #ef4444; }
          .success { background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid #22c55e; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Portal Otentikasi</h2>
          <p>Masukkan kredensial akun untuk mengakses server</p>
          <form id="loginForm">
            <label>Nama Pengguna (Username)</label>
            <input type="text" id="username" placeholder="Masukkan username" required />
            <label>Kata Sandi (PIN/Password)</label>
            <input type="password" id="password" placeholder="Masukkan PIN" required />
            <button type="submit">Masuk Ke Sistem</button>
          </form>
          <div id="statusBox" class="status"></div>
        </div>

        <script>
          document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const box = document.getElementById('statusBox');
            box.style.display = 'none';

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
              const res = await fetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
              });
              const data = await res.json();
              box.style.display = 'block';
              if (res.status === 200) {
                box.className = 'status success';
                box.innerText = '✅ ' + data.message;
              } else {
                box.className = 'status error';
                box.innerText = '❌ ' + (data.message || 'Akses Ditolak');
              }
            } catch (err) {
              box.style.display = 'block';
              box.className = 'status error';
              box.innerText = 'Gagal terhubung ke server.';
            }
          });
        </script>
      </body>
      </html>
    `);
  }

  // 2. SISTEM PROSES LOG IN & PROTEKSI RATE-LIMIT (Untuk Aplikasi Penguji)
  if (req.method === 'POST') {
    res.setHeader('Content-Type', 'application/json');

    const clientIp = req.headers['x-forwarded-for'] || 'unknown-ip';
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { username, password } = body;
    const currentTime = Date.now();

    if (!attempts[clientIp]) attempts[clientIp] = [];
    attempts[clientIp] = attempts[clientIp].filter(t => currentTime - t < 60000);

    // Proteksi Rate-Limit: Maksimal 10 percobaan per 60 detik
    if (attempts[clientIp].length >= 10) {
      return res.status(429).json({ 
        status: 429, 
        message: 'Too Many Requests! Terdeteksi aktivitas mencurigakan. Fitur diblokir sementara.' 
      });
    }

    attempts[clientIp].push(currentTime);

    if (username === 'admin' && password === '1234') {
      return res.status(200).json({ status: 200, message: 'Login Berhasil! Selamat Datang.' });
    } else {
      return res.status(401).json({ status: 401, message: 'Kombinasi Username / PIN Salah!' });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
