/**
 * Local development server. No dependencies, no build step.
 *
 *   npm run dev  →  http://localhost:3000
 *
 * It serves the static files and routes /api/read to the same handler Vercel
 * runs in production, so what you see locally is what deploys.
 */

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

await loadEnv();
const { default: readHandler } = await import('./api/read.js');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (pathname === '/api/read') {
    try {
      return await readHandler(req, res);
    } catch (err) {
      console.error(err);
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: 'server_error' }));
    }
  }

  const file = resolve(pathname);
  if (!file) {
    res.statusCode = 404;
    return res.end('Not found');
  }

  try {
    const body = await readFile(file);
    res.setHeader('content-type', TYPES[path.extname(file)] || 'application/octet-stream');
    res.setHeader('cache-control', 'no-cache');
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  const key = process.env.ANTHROPIC_API_KEY;
  console.log(`\n  Destiny  →  http://localhost:${PORT}`);
  console.log(
    key
      ? '  Reading with the Anthropic API.\n'
      : '  No ANTHROPIC_API_KEY found: serving sample readings in demo mode.\n',
  );
});

/** Resolve a URL path to a file inside the project, refusing anything outside. */
function resolve(pathname) {
  const rel = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  const target = path.normalize(path.join(ROOT, rel));
  if (!target.startsWith(ROOT)) return null;
  if (existsSync(target) && !target.endsWith(path.sep)) return target;
  // Single page app: unknown routes fall back to the shell.
  return path.join(ROOT, 'index.html');
}

/** Minimal .env reader so a fresh clone does not need dotenv. */
async function loadEnv() {
  const file = path.join(ROOT, '.env');
  if (!existsSync(file)) return;

  const text = await readFile(file, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}
