// メインサーバー

import { createServer } from 'http';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import config from './config/index.js';
import WebSocketHandler from './websocket/handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// HTTPサーバー（フロントエンド配信用）
const server = createServer((req, res) => {
  // CORSヘッダー
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // ヘルスチェック
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      ttsProvider: config.tts.provider,
      sttProvider: config.stt.provider,
    }));
    return;
  }

  // フロントエンドファイル配信
  if (req.url === '/' || req.url === '/index.html') {
    const path = join(__dirname, '../../frontend/index.html');

    try {
      const content = readFileSync(path, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    } catch (error) {
      res.writeHead(404);
      res.end('Not found');
    }
    return;
  }

  // 静的ファイル
  if (req.url.startsWith('/app.js') || req.url.startsWith('/style.css')) {
    const path = join(__dirname, '../../frontend', req.url);

    try {
      const content = readFileSync(path, 'utf-8');
      const contentType = req.url.endsWith('.js') ? 'application/javascript' : 'text/css';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (error) {
      res.writeHead(404);
      res.end('Not found');
    }
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

// WebSocketハンドラー初期化
const wsHandler = new WebSocketHandler(server);

// サーバー起動
const PORT = config.wsPort;
server.listen(PORT, () => {
  console.log(`🚀 Voice Chat Server running on port ${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}`);
  console.log(`🌐 HTTP: http://localhost:${PORT}`);
  console.log(`\nTTS Provider: ${config.tts.provider}`);
  console.log(`STT Provider: ${config.stt.provider}`);
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default server;
