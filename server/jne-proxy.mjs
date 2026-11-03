import http from 'node:http';

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const isCnote = req.url?.includes('generatecnote');
  const isPricedev = req.url?.includes('pricedev');

  if ((isCnote || isPricedev) && req.method === 'POST') {
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', async () => {
      try {
        const parsed = new URLSearchParams(bodyData);
        const username = parsed.get('username') || '';
        const endpoint = isPricedev ? 'pricedev' : 'generatecnote';

        const targetHost = username === 'TESTAPI'
          ? `https://apiv2.jne.co.id:10202/tracing/api/${endpoint}`
          : `https://apiv2.jne.co.id:10206/tracing/api/${endpoint}`;

        console.log(`[JNE Proxy] Forwarding ${endpoint} request to: ${targetHost}`);

        const jneRes = await fetch(targetHost, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'node-request'
          },
          body: bodyData
        });

        const jneText = await jneRes.text();
        res.writeHead(jneRes.status, { 'Content-Type': 'application/json' });
        res.end(jneText);
      } catch (err) {
        console.error('[JNE Proxy Error]:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`🚀 SYB JNE Proxy Server running at http://localhost:${PORT}`);
  console.log(`📡 Endpoints supported: /api/jne/generatecnote & /api/jne/pricedev`);
});
