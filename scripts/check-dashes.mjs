// Blokuje build, jeśli w treściach lub kodzie pojawi się długi myślnik (— lub –).
import fs from 'fs';
import path from 'path';
const roots = ['app', 'components', 'lib', 'content', 'data'];
const bad = [];
function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|json|css|md)$/.test(f)) {
      const s = fs.readFileSync(p, 'utf8');
      s.split('\n').forEach((line, i) => { if (/[–—]/.test(line)) bad.push(`${p}:${i + 1}`); });
    }
  }
}
roots.filter((r) => fs.existsSync(r)).forEach(walk);
if (bad.length) { console.error('Znaleziono długie myślniki:\n' + bad.join('\n')); process.exit(1); }
console.log('OK: brak długich myślników');
