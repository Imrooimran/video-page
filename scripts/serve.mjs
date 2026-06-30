// Minimal static file server for local preview. Run: npm run serve
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = process.env.PORT || 4321;
const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.mp4': 'video/mp4', '.svg': 'image/svg+xml',
};

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p === '/') p = '/index.html';
    const file = join(root, normalize(p).replace(/^(\.\.[/\\])+/, ''));
    const s = await stat(file);
    if (s.isDirectory()) throw new Error('dir');
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
}).listen(PORT, () => console.log(`Serving on http://localhost:${PORT}`));
