// Dependency-free static file server for the E2E fixture site and for the exported web demo.
// Playwright's `webServer` starts it, so no download-on-run tool (`npx serve@latest` and friends)
// is ever involved.
//
//   /                          the fixture site (e2e/fixtures/site)
//   /offline-detector/demo/    the static export of apps/demo-web (apps/demo-web/out), mounted
//                              under the same base path as on GitHub Pages
//
// When the export is missing it is built first (Turborepo builds the workspace packages the demo
// needs). A failed build is only logged: the fixture-site specs still run, the demo specs fail.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';

const repoRoot = join(import.meta.dirname, '..', '..');
const siteRoot = join(import.meta.dirname, 'site');
const demoRoot = join(repoRoot, 'apps/demo-web/out');
const demoBase = '/offline-detector/demo';
const port = Number(process.env.PORT ?? 4173);

if (!existsSync(join(demoRoot, 'index.html'))) {
  console.log('apps/demo-web/out is missing: building the demo first');
  // One command string: `pnpm` is a .cmd shim on Windows, so it needs a shell.
  const build = spawnSync(
    'pnpm exec turbo run build --filter=@offline-detector/demo-web',
    {
      cwd: repoRoot,
      stdio: 'inherit',
      shell: true,
    },
  );
  if (build.status !== 0)
    console.error('The demo build failed; /offline-detector/demo/ will 404');
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

  if (pathname === demoBase) {
    response.writeHead(308, { Location: `${demoBase}/` }).end();
    return;
  }

  const isDemo = pathname.startsWith(`${demoBase}/`);
  const root = isDemo ? demoRoot : siteRoot;
  const relative = isDemo ? pathname.slice(demoBase.length) : pathname;
  const target = relative.endsWith('/') ? `${relative}index.html` : relative;
  const file = normalize(join(root, decodeURIComponent(target)));

  // Refuse anything that escapes the served folder (`/../secret`).
  if (file !== root && !file.startsWith(root + sep)) {
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
  console.log(`E2E server on http://127.0.0.1:${port} (demo at ${demoBase}/)`);
});
