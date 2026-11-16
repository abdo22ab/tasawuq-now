const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 5000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  const filePath = path.join(__dirname, reqPath);

  // Security check: prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Anti-cache headers on ALL responses
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Clear-Site-Data': '"cache"',
      'Access-Control-Allow-Origin': '*'
    });

    console.log(`[${new Date().toLocaleTimeString()}] 200 GET ${req.url}`);
    fs.createReadStream(filePath).pipe(res);
  });
});

// Find network IP for phone testing
function getNetworkIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (iface.address.startsWith('172.') || iface.address.startsWith('192.168.') || iface.address.startsWith('10.')) {
          return iface.address;
        }
      }
    }
  }
  return '127.0.0.1';
}

const networkIp = getNetworkIp();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 السيرفر يعمل الآن بنجاح على:`);
  console.log(`💻 من هذا الكمبيوتر: http://localhost:${PORT}`);
  console.log(`📱 من الهاتف عبر الشبكة: http://${networkIp}:${PORT}`);
});
