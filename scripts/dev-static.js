import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GET as getWishes, POST as postWish } from '../api/wishes.js';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const localEnvPath = resolve(projectRoot, '.env.local');
if (existsSync(localEnvPath)) {
  for (const line of readFileSync(localEnvPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[1] in process.env) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

const hasSupabase = Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
let nextLocalWishId = 1;
const localWishes = [];
const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'], ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'], ['.xml', 'application/xml; charset=utf-8'], ['.txt', 'text/plain; charset=utf-8'], ['.png', 'image/png'], ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'], ['.ico', 'image/x-icon']
]);

function sendJson(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(data));
}

async function invokeApi(handler, request, response, url) {
  let body;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
      size += chunk.length;
      if (size > 16_384) {
        sendJson(response, 413, { error: 'Request body is too large.' });
        return;
      }
      chunks.push(chunk);
    }
    body = Buffer.concat(chunks);
  }
  const apiRequest = new Request(url, {
    method: request.method,
    headers: request.headers,
    ...(body ? { body } : {})
  });
  const result = await handler(apiRequest);
  response.writeHead(result.status, Object.fromEntries(result.headers.entries()));
  response.end(Buffer.from(await result.arrayBuffer()));
}

function localWishApi(request, response, url) {
  if (request.method === 'GET') {
    const after = Number(url.searchParams.get('after') || 0);
    if (!Number.isSafeInteger(after) || after < 0) return sendJson(response, 400, { error: 'The after cursor must be a non-negative integer.' });
    return sendJson(response, 200, localWishes.filter((wish) => wish.id > after));
  }
  if (request.method !== 'POST') {
    response.writeHead(405, { Allow: 'GET, POST' }).end();
    return;
  }
  let raw = '';
  request.setEncoding('utf8');
  request.on('data', (chunk) => { raw += chunk; });
  request.on('end', () => {
    let body;
    try { body = JSON.parse(raw); } catch { return sendJson(response, 400, { error: 'Request body must be valid JSON.' }); }
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    const x = Number(body?.x), rest = Number(body?.rest), size = Number(body?.size), sway = Number(body?.sway), delay = Number(body?.delay) || 0;
    if (!text || text.length > 100) return sendJson(response, 400, { error: 'Wish must be between 1 and 100 characters.' });
    if (![x, rest, size, sway, delay].every(Number.isFinite) || x < 22 || x > 96 || rest < 8 || rest > 93 || size < 34 || size > 48 || sway < 4 || sway > 6 || delay < -3 || delay > 0) {
      return sendJson(response, 400, { error: 'Invalid lantern placement.' });
    }
    const wish = { id: nextLocalWishId++, text, x, rest, size, sway, delay };
    localWishes.push(wish);
    sendJson(response, 201, wish);
  });
}

const server = createServer(async (request, response) => {
  let url;
  try { url = new URL(request.url, 'http://localhost'); } catch { response.writeHead(400).end('Bad request'); return; }

  if (url.pathname === '/api/wishes') {
    try {
      if (hasSupabase) return await invokeApi(request.method === 'POST' ? postWish : getWishes, request, response, url);
      return localWishApi(request, response, url);
    } catch (error) {
      process.stderr.write(`Local API request failed: ${error.message}\n`);
      sendJson(response, 500, { error: 'Local API request failed.' });
      return;
    }
  }
  if (url.pathname === '/api/realtime-config') {
    if (!hasSupabase || !(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY)) {
      return sendJson(response, 200, { localPreview: true });
    }
    return sendJson(response, 200, {
      url: process.env.SUPABASE_URL,
      publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY
    });
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { response.writeHead(400).end('Bad request'); return; }
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const fileRelativePath = relativePath.split(/[\\/]/).join(sep);
  const filePath = resolve(projectRoot, fileRelativePath);
  const isProjectFile = filePath === projectRoot || filePath.startsWith(`${projectRoot}${sep}`);
  const isPublicFile = ['index.html', 'robots.txt', 'sitemap.xml'].includes(fileRelativePath) || fileRelativePath.startsWith(`assets${sep}`);
  if (!isProjectFile) return response.writeHead(403).end('Forbidden');
  if (!isPublicFile) return response.writeHead(404).end('Not found');
  try {
    const content = await readFile(filePath);
    response.writeHead(200, { 'Content-Type': contentTypes.get(extname(filePath).toLowerCase()) || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch (error) {
    const status = error.code === 'ENOENT' || error.code === 'EISDIR' ? 404 : 500;
    response.writeHead(status).end(status === 404 ? 'Not found' : 'Unable to read file');
  }
});

const port = Number(process.env.PORT) || 3000;
server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Local preview listening on http://127.0.0.1:${port}\n`);
  process.stdout.write(hasSupabase ? 'Wish storage: configured local Supabase project\n' : 'Wish storage: temporary in-memory preview (not saved after restart)\n');
});
