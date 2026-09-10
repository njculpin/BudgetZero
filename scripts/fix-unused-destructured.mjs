/**
 * Remove unused properties from controller destructuring patterns.
 *
 * The route conversion added `request` (and sometimes `params`/`cookies`) to
 * every controller signature regardless of whether the body used it, on the
 * assumption that a handler taking a request was harmless. It is not: an unused
 * binding is a claim about what the function needs, and a wrong one.
 *
 * Driven by ESLint's report so only bindings it flagged are touched.
 *
 * One-shot. Delete once run.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const report = JSON.parse(readFileSync(process.argv[2], 'utf8'));

/** file -> Map(line -> Set(names)) */
const targets = new Map();

for (const file of report) {
  for (const message of file.messages) {
    if (message.severity !== 2) continue;
    if (!/no-unused-vars/.test(message.ruleId ?? '')) continue;
    if (!/is defined but never used\. Allowed unused args/.test(message.message)) continue;

    const name = message.message.match(/^'([^']+)'/)?.[1];
    if (!name) continue;

    if (!targets.has(file.filePath)) targets.set(file.filePath, new Map());
    const lines = targets.get(file.filePath);
    if (!lines.has(message.line)) lines.set(message.line, new Set());
    lines.get(message.line).add(name);
  }
}

let files = 0;
let removed = 0;

for (const [filePath, lines] of targets) {
  const split = readFileSync(filePath, 'utf8').split('\n');
  let touched = false;

  for (const [line, names] of lines) {
    const index = line - 1;
    const original = split[index];
    if (original === undefined) continue;

    // Only rewrite an object pattern: `async ({ a, b, c }) =>`
    const match = original.match(/\{\s*([A-Za-z0-9_,\s]+?)\s*\}/);
    if (!match) continue;

    const kept = match[1]
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .filter((p) => !names.has(p));

    const replacement = kept.length > 0 ? `{ ${kept.join(', ')} }` : '{}';
    const updated = original.replace(match[0], replacement);

    if (updated !== original) {
      split[index] = updated;
      touched = true;
      removed += names.size;
    }
  }

  if (touched) {
    writeFileSync(filePath, split.join('\n'));
    files++;
  }
}

console.log(`removed ${removed} unused destructured bindings across ${files} files`);
