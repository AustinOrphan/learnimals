/**
 * Build the GitHub Pages site.
 *
 * The app is a no-build static site served from the repo root, and it uses
 * root-absolute URLs (/src/..., /public/..., /serviceWorker.js). GitHub
 * project Pages serves under a subpath (https://<user>.github.io/learnimals/),
 * where those root-absolute URLs would 404. This copies the site into _site/
 * and rewrites root-absolute paths to include the base prefix.
 *
 * Set PAGES_BASE='' to build for a root deployment (custom domain / Option A);
 * defaults to '/learnimals' for the project-Pages subpath (Option B).
 *
 * Only ROOT-ABSOLUTE occurrences are rewritten (a path preceded by a quote,
 * paren, '=', or whitespace) so relative paths like ../src/ are untouched.
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

// 1. Fresh _site with the exact structure the app expects (repo-root docroot).
if (existsSync(SITE)) rmSync(SITE, { recursive: true, force: true });
mkdirSync(SITE, { recursive: true });
for (const entry of ['index.html', 'serviceWorker.js', 'src', 'public']) {
  const from = join(ROOT, entry);
  if (existsSync(from)) cpSync(from, join(SITE, entry), { recursive: true });
}

// 2. Rewrite root-absolute paths in text assets.
const REWRITE_EXT = new Set(['.html', '.js', '.mjs', '.css', '.json', '.webmanifest']);
const DELIM = `(["'(=\\s])`; // a path only counts as absolute after one of these

const rules = BASE
  ? [
      [new RegExp(`${DELIM}/src/`, 'g'), `$1${BASE}/src/`],
      [new RegExp(`${DELIM}/public/`, 'g'), `$1${BASE}/public/`],
      [new RegExp(`${DELIM}/serviceWorker\\.js`, 'g'), `$1${BASE}/serviceWorker.js`],
      // PWA manifest scope (start_url is covered by the /src/ rule).
      [/("scope":\s*")\//g, `$1${BASE}/`],
    ]
  : [];

let filesRewritten = 0;
let replacements = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      walk(p);
    } else if (REWRITE_EXT.has(extname(p))) {
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
}
if (rules.length) walk(SITE);

console.log(
  `Built _site (base='${BASE || '(root)'}'): ${filesRewritten} files rewritten, ${replacements} path replacements.`
);
