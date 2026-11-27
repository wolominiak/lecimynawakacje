// Blokuje build, jeśli w treściach lub kodzie pojawi się długi myślnik (— lub –).
import fs from 'fs';
import path from 'path';
const roots = ['app', 'components', 'lib', 'content', 'data'];
const bad = [];
// dane generowane automatycznie z zewnętrznych źródeł (nazwy hoteli z API itp.): poprawiamy w locie zamiast blokować build
const AUTO = [path.join('data', 'hotels-index.json'), path.join('data', 'flights.json'), path.join('content', 'hotels') + path.sep, path.join('data', 'seeplaces-meta.json')];
let fixed = 0;
function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|json|css|md)$/.test(f)) {
      const s = fs.readFileSync(p, 'utf8');
      if (AUTO.some((a) => p === a || p.startsWith(a)) && /[–—]/.test(s)) {
        fs.writeFileSync(p, s.replace(/\s*[–—]\s*/g, ' - '));
        fixed++;
        continue;
      }
      s.split('\n').forEach((line, i) => { if (/[–—]/.test(line)) bad.push(`${p}:${i + 1}`); });
    }
  }
}
roots.filter((r) => fs.existsSync(r)).forEach(walk);
if (fixed) console.log(`Poprawiono długie myślniki w danych automatycznych: ${fixed} plik(ów)`);
if (bad.length) { console.error('Znaleziono długie myślniki:\n' + bad.join('\n')); process.exit(1); }
console.log('OK: brak długich myślników');
