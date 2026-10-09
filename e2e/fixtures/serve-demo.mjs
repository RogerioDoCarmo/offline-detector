// Dependency-free static server for the exported web demo (apps/demo-web/out), mounted under the
// same base path as on GitHub Pages: http://127.0.0.1:4174/offline-detector/demo/.
// Playwright's `webServer` starts it. When the export is missing it builds it first (Turborepo
// builds the workspace packages the demo depends on), so a fresh checkout needs no extra step.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';

const repoRoot = join(import.meta.dirname, '..', '..');
const siteRoot = join(repoRoot, 'apps/demo-web/out');
const basePath = '/offline-detector/demo';
const port = Number(process.env.DEMO_PORT ?? 4174);

if (!existsSync(join(siteRoot, 'index.html'))) {
  console.log('apps/demo-web/out is missing: building the demo first');
  const build = spawnSync(
    'pnpm',
    ['exec', 'turbo', 'run', 'build', '--filter=@offline-detector/demo-web'],
    { cwd: repoRoot, stdio: 'inherit', shell: true },
  );
  if (build.status !== 0) process.exit(build.status ?? 1);
}

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

const server = createServer(async (request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');

  if (pathname !== basePath && !pathname.startsWith(`${basePath}/`)) {
    response.writeHead(404).end('Not found');
    return;
  }
  if (pathname === basePath) {
    response.writeHead(308, { Location: `${basePath}/` }).end();
    return;
  }

  const relative = pathname.slice(basePath.length);
  const target = relative.endsWith('/') ? `${relative}index.html` : relative;
  const file = normalize(join(siteRoot, decodeURIComponent(target)));

  // Refuse anything that escapes the export folder (`/offline-detector/demo/../secret`).
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
  console.log(`Demo export on http://127.0.0.1:${port}${basePath}/`);
});
