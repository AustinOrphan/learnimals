/**
 * Build the GitHub Pages site.
 *
 * The app is a no-build static site served from the repo root, using
 * root-absolute URLs (/subjects/..., /games/..., /components/..., /public/...,
 * /serviceWorker.js). GitHub project Pages serves under a subpath
 * (https://<user>.github.io/learnimals/), where those URLs would 404. This
 * copies the app into _site/ and rewrites root-absolute app paths to include
 * the base prefix.
 *
 * Set PAGES_BASE='' for a root deployment (custom domain / Option A, no
 * rewrite); defaults to '/learnimals' for the project-Pages subpath.
 *
 * Only ROOT-ABSOLUTE occurrences are rewritten (a path preceded by a quote,
 * backtick, paren, '=', or whitespace) so relative paths are untouched.
 */
import {
  existsSync,
  rmSync,
  mkdirSync,
  cpSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { join, extname } from 'node:path';

const BASE = process.env.PAGES_BASE ?? '/learnimals';
const ROOT = process.cwd();
const SITE = join(ROOT, '_site');

// Everything at the repo root that is NOT part of the served app.
const DENY = new Set([
  'node_modules',
  '.git',
  '_site',
  'tests',
  'scripts',
  'e2e',
  'docker',
  'k8s',
  'docs',
  '.github',
  'coverage',
  'playwright-report',
  'test-results',
  '.claudeCodeStuffToStashForNow',
  'dedupe-archive',
  '.serena',
  '.husky',
  '.vale',
  '.zap',
  '.claude_agent_farm_backups',
]);
// Root-level files that are tooling/config, not app assets.
const isConfigFile = (name) =>
  name.startsWith('.') ||
  /\.(md|json|jsonc|ya?ml|mjs|txt|lock|log|toml|ini)$/i.test(name) ||
  name === 'package.json' ||
  name === 'package-lock.json' ||
  name === 'Makefile' ||
  name.startsWith('Makefile') ||
  name.startsWith('Dockerfile') ||
  name === 'vitest.config.js' ||
  name === 'eslint.config.mjs' ||
  name === 'postcss.config.js';

// 1. Fresh _site with the served app (repo-root layout preserved).
if (existsSync(SITE)) rmSync(SITE, { recursive: true, force: true });
mkdirSync(SITE, { recursive: true });
for (const name of readdirSync(ROOT)) {
  if (DENY.has(name)) continue;
  const abs = join(ROOT, name);
  const isDir = statSync(abs).isDirectory();
  if (!isDir && isConfigFile(name)) continue; // skip root config/doc files
  cpSync(abs, join(SITE, name), { recursive: true });
}

// 2. Rewrite root-absolute app paths to the base prefix.
let filesRewritten = 0;
let replacements = 0;
if (BASE) {
  const segments = readdirSync(SITE); // the app's top-level entries (dirs + files)
  const DELIM = `(["'\`(=\\s])`;
  const rules = segments.map((seg) => [
    new RegExp(`${DELIM}/${seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(/|["'\`)\\s]|$)`, 'g'),
    `$1${BASE}/${seg}$2`,
  ]);
  // PWA manifest scope.
  rules.push([/("scope":\s*")\//g, `$1${BASE}/`]);

  const REWRITE_EXT = new Set(['.html', '.js', '.mjs', '.css', '.json', '.webmanifest']);
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (REWRITE_EXT.has(extname(p))) {
        let s = readFileSync(p, 'utf8');
        const before = s;
        for (const [re, to] of rules) {
          const m = s.match(re);
          if (m) replacements += m.length;
          s = s.replace(re, to);
        }
        if (s !== before) {
          writeFileSync(p, s);
          filesRewritten += 1;
        }
      }
    }
  };
  walk(SITE);
}

console.log(
  `Built _site (base='${BASE || '(root)'}'): ${filesRewritten} files rewritten, ${replacements} path replacements.`
);
