/**
 * SYB Official Store - Local Node.js API Runner & Proxy
 * Run with: node server/server.mjs
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const REMOTE_API = process.env.REMOTE_API || 'https://shevajordanbersama.com/api';

console.log(`[SYB Server] Initializing Local Backend Gateway...`);
console.log(`[SYB Server] Remote Fallback: ${REMOTE_API}`);

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = parsedUrl.pathname.replace(/^\/+(api\/)?/, '');

  // Read request body if present
  let bodyBuffer = Buffer.alloc(0);
  for await (const chunk of req) {
    bodyBuffer = Buffer.concat([bodyBuffer, chunk]);
  }

  // Health check
  if (pathname === '' || pathname === 'health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'success',
      data: {
        service: 'SYB Local Node Runner',
        status: 'online',
        remote: REMOTE_API,
        time: new Date().toISOString()
      }
    }));
    return;
  }

  // Proxy directly to live DomaiNesia backend
  const targetUrl = `${REMOTE_API}/${pathname}${parsedUrl.search}`;
  const targetObj = new URL(targetUrl);

  const proxyReq = https.request(
    targetUrl,
    {
      method: req.method,
      headers: {
        ...req.headers,
        host: targetObj.hostname,
        'content-length': bodyBuffer.length,
      },
      rejectUnauthorized: false
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    console.error(`[SYB Proxy Error] ${err.message}`);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'error',
      message: 'Failed to communicate with remote backend: ' + err.message
    }));
  });

  if (bodyBuffer.length > 0) {
    proxyReq.write(bodyBuffer);
  }
  proxyReq.end();
});

server.listen(PORT, () => {
  console.log(`[SYB Server] REST API server running at http://localhost:${PORT}/api/`);
});
