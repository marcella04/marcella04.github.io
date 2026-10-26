// Fails if source uses network APIs or dist references external resources.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const banned = [/\bfetch\s*\(/, /XMLHttpRequest/, /\bWebSocket\b/, /\bEventSource\b/, /axios/i, /watchPosition/, /sendBeacon/, /\bimport\s*\(\s*['"]https?:/];
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
let bad = 0;
for (const f of walk('src').filter((f) => /\.(ts|tsx)$/.test(f) && !f.endsWith('.test.ts'))) {
  const t = readFileSync(f, 'utf8');
  for (const re of banned) if (re.test(t)) { console.error(`Banned API ${re} in ${f}`); bad++; }
}
if (existsSync('dist/index.html')) {
  const html = readFileSync('dist/index.html', 'utf8');
  if (/(src|href)=["']https?:\/\//.test(html)) { console.error('External resource referenced in dist/index.html'); bad++; }
}
if (bad) process.exit(1);
console.log('Static check passed: no network APIs or external resources found.');
