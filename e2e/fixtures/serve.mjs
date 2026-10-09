// Dependency-free static file server for the E2E fixture site. Playwright's `webServer` starts it,
// so no download-on-run tool (`npx serve@latest` and friends) is ever involved.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';

const siteRoot = join(import.meta.dirname, 'site');
const port = Number(process.env.PORT ?? 4173);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const server = createServer(async (request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');
  const relative = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
  const file = normalize(join(siteRoot, decodeURIComponent(relative)));

  // Refuse anything that escapes the site folder (`/../secret`).
  if (file !== siteRoot && !file.startsWith(siteRoot + sep)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const body = await readFile(file);
    response.writeHead(200, {
      'Content-Type': contentTypes[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(body);
  } catch {
    response.writeHead(404).end('Not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`E2E fixture site on http://127.0.0.1:${port}`);
});
