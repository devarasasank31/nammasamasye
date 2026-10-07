import { readFileSync, writeFileSync } from 'fs';

const p = 'C:/Users/satya/Documents/Default Project/nammasamasye/src/lib/priority-engine/facts.ts';
const orig = readFileSync(p, 'utf8');
const NL = orig.includes('\r\n') ? '\r\n' : '\n';
const lines = orig.split(/\r?\n/);

let moved = 0, blocks = 0;
for (let i = 0; i < lines.length - 1; i++) {
  if (lines[i] !== '    ],') continue;
  if (!/^      \//.test(lines[i + 1] || '')) continue;
  let j = i + 1;
  while (j < lines.length && /^      \/.+\/,\s*$/.test(lines[j])) j++;
  const block = lines.splice(i + 1, j - (i + 1));
  lines.splice(i, 0, ...block);
  moved += block.length;
  blocks++;
  i += block.length;
}
if (blocks !== 14) throw new Error('expected 16 blocks, got ' + blocks);
if (moved !== 480) throw new Error('expected 480 lines, got ' + moved);
writeFileSync(p, lines.join(NL));
console.log('repaired: moved ' + moved + ' lines in ' + blocks + ' blocks');
