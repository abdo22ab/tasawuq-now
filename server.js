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

function parseMultipart(buffer, boundary) {
  const boundaryBuffer = Buffer.from('--' + boundary);
  const endBoundaryBuffer = Buffer.from('--' + boundary + '--');
  
  let startIndex = buffer.indexOf(boundaryBuffer);
  if (startIndex === -1) return null;
  
  startIndex += boundaryBuffer.length + 2; // skip boundary + CRLF
  
  const headerEndIndex = buffer.indexOf(Buffer.from('\r\n\r\n'), startIndex);
  if (headerEndIndex === -1) return null;
  
  const headerStr = buffer.slice(startIndex, headerEndIndex).toString('utf8');
  const filenameMatch = headerStr.match(/filename="([^"]+)"/i);
  let filename = filenameMatch ? filenameMatch[1] : 'video.mp4';
  filename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
  
  const fileStart = headerEndIndex + 4;
  let fileEnd = buffer.indexOf(boundaryBuffer, fileStart);
  if (fileEnd === -1) {
    fileEnd = buffer.indexOf(endBoundaryBuffer, fileStart);
  }
  if (fileEnd === -1) fileEnd = buffer.length;
  else if (fileEnd >= 2 && buffer[fileEnd - 2] === 13 && buffer[fileEnd - 1] === 10) {
    fileEnd -= 2; // strip trailing CRLF before boundary
  }
  
  const fileData = buffer.slice(fileStart, fileEnd);
  return { filename, fileData };
}

const server = http.createServer((req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range, Authorization, apikey'
    });
    res.end();
    return;
  }

  let reqPath = decodeURIComponent(req.url.split('?')[0]);

  // 🎬 معالجة رفع مقاطع فيديو الريلز والستوري محلياً عبر /api/upload-video
  if (reqPath === '/api/upload-video' && req.method === 'POST') {
    const chunks = [];
    let totalSize = 0;
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

    req.on('data', chunk => {
      totalSize += chunk.length;
      if (totalSize > MAX_VIDEO_SIZE) {
        req.destroy();
        res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: 'حجم الفيديو كبير جداً (الحد الأقصى 50 ميجابايت)' }));
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const bodyBuffer = Buffer.concat(chunks);
        const cType = req.headers['content-type'] || '';
        let targetFileName = `video_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.mp4`;
        let videoData = null;

        const ALLOWED_VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.m4v'];

        if (cType.includes('multipart/form-data')) {
          const match = cType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
          const boundary = match ? (match[1] || match[2]) : null;
          if (boundary) {
            const parsed = parseMultipart(bodyBuffer, boundary);
            if (parsed && parsed.fileData.length > 0) {
              let ext = (path.extname(parsed.filename) || '.mp4').toLowerCase();
              if (!ALLOWED_VIDEO_EXTS.includes(ext)) ext = '.mp4';
              targetFileName = `video_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
              videoData = parsed.fileData;
            }
          }
        } else {
          // Direct binary upload
          let ext = cType.includes('webm') ? '.webm' : (cType.includes('quicktime') ? '.mov' : '.mp4');
          if (!ALLOWED_VIDEO_EXTS.includes(ext)) ext = '.mp4';
          targetFileName = `video_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
          videoData = bodyBuffer;
        }

        if (!videoData || videoData.length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ error: 'لم يتم استلام أي بيانات فيديو صالحة' }));
          return;
        }

        // 🛡️ فحص أمني لمحتوى الملف: رفض أي ملفات قابلة للتنفيذ أو سكريبتات أو HTML
        const headerCheck = videoData.slice(0, 1024).toString('utf8').toLowerCase();
        if (
          headerCheck.includes('<html') ||
          headerCheck.includes('<!doctype') ||
          headerCheck.includes('<script') ||
          headerCheck.includes('<?php') ||
          (videoData[0] === 0x4D && videoData[1] === 0x5A) // MZ header (.exe / .dll)
        ) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ error: '⛔ تم رفض الملف: نوع الملف غير مسموح به لحماية النظام' }));
          return;
        }

        const videosDir = path.join(__dirname, 'uploads', 'videos');
        if (!fs.existsSync(videosDir)) {
          fs.mkdirSync(videosDir, { recursive: true });
        }

        const destPath = path.join(videosDir, targetFileName);
        fs.writeFileSync(destPath, videoData);

        const videoUrl = `/uploads/videos/${targetFileName}`;
        console.log(`[${new Date().toLocaleTimeString()}] ✅ تم حفظ فيديو الريلز محلياً بنجاح: ${videoUrl} (${(videoData.length / (1024 * 1024)).toFixed(2)} MB)`);

        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ success: true, url: videoUrl }));
      } catch (err) {
        console.error('Error handling /api/upload-video:', err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: 'خطأ في معالجة الفيديو: ' + err.message }));
      }
    });
    return;
  }

  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  const filePath = path.join(__dirname, reqPath);

  // Security check: prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // 🎬 دعم البث المجزأ Range للفيديوهات (HTTP 206 Partial Content) لضمان تشغيل وسحب الريلز بسلاسة
    const range = req.headers.range;
    if (range && (ext === '.mp4' || ext === '.webm' || ext === '.mov')) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;

      if (start >= stats.size) {
        res.writeHead(416, {
          'Content-Range': `bytes */${stats.size}`,
          'Access-Control-Allow-Origin': '*'
        });
        res.end();
        return;
      }

      const chunksize = (end - start) + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN'
      });
      fileStream.pipe(res);
      return;
    }

    // Security & Anti-cache headers on ALL responses
    const respHeaders = {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Clear-Site-Data': '"cache"',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };

    if (reqPath.startsWith('/uploads/')) {
      respHeaders['Content-Security-Policy'] = "default-src 'none'; media-src 'self'; sandbox";
    }

    res.writeHead(200, respHeaders);

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
