// Downloads every image/video that is still hosted on Base44's CDN into /public/assets
// and rewrites the source files to use the local copies.
//
//   node scripts/migrate-assets.mjs
//
// Run this BEFORE you cancel / delete the Base44 app (the files disappear with it).
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public', 'assets');
const HOSTS = /https:\/\/(?:base44\.app|media\.base44\.com)\/[^'"`\s)<>]+/g;

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else if (/\.(jsx?|tsx?|html|css)$/.test(e.name)) out.push(p);
  }
  return out;
}

const files = [...await walk(path.join(ROOT, 'src')), path.join(ROOT, 'index.html')];
const urls = new Set();
const contents = new Map();

for (const f of files) {
  const s = await fs.readFile(f, 'utf8');
  contents.set(f, s);
  for (const m of s.match(HOSTS) || []) urls.add(m);
  // brandArt.js builds URLs as `${BASE}file.jpeg`
  const base = s.match(/const BASE = '(https:\/\/[^']+\/)'/);
  if (base) for (const m of s.matchAll(/\$\{BASE\}([^`'"\s]+)/g)) urls.add(base[1] + m[1]);
}

if (!urls.size) { console.log('Nothing to migrate: no Base44-hosted assets found.'); process.exit(0); }
await fs.mkdir(OUT, { recursive: true });

const mapping = new Map();
let failed = 0;
for (const url of urls) {
  const name = decodeURIComponent(url.split('/').pop().split('?')[0]);
  const dest = path.join(OUT, name);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
    mapping.set(url, `/assets/${name}`);
    console.log('✓', name);
  } catch (e) {
    failed++;
    console.error('✗', url, '-', e.message);
  }
}

if (failed) {
  console.error(`\n${failed} file(s) could not be downloaded. Source files were NOT modified. Fix the failures (or download them by hand) and run again.`);
  process.exit(1);
}

// longest URL first so a base path never clobbers a full URL
const ordered = [...mapping.entries()].sort((a, b) => b[0].length - a[0].length);
for (const [f, original] of contents) {
  let s = original;
  for (const [url, local] of ordered) s = s.split(url).join(local);
  s = s.replace(/const BASE = 'https:\/\/[^']+\/'/, "const BASE = '/assets/'");
  if (s !== original) { await fs.writeFile(f, s); console.log('rewrote', path.relative(ROOT, f)); }
}
console.log(`\nDone: ${mapping.size} assets saved to public/assets. Commit them to git.`);
