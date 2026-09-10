/**
 * Print every ESLint error grouped by rule, with file:line.
 *
 * Temporary, for working through the existing backlog. Delete once lint is
 * clean and gated in CI.
 */
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';

const report = JSON.parse(readFileSync(process.argv[2], 'utf8'));

const rows = [];
for (const file of report) {
  for (const message of file.messages) {
    if (message.severity !== 2) continue;
    rows.push({
      file: relative(process.cwd(), file.filePath).split('\\').join('/'),
      line: message.line,
      rule: message.ruleId ?? '(parse)',
      message: message.message,
    });
  }
}

rows.sort(
  (a, b) =>
    a.rule.localeCompare(b.rule) || a.file.localeCompare(b.file) || a.line - b.line
);

let currentRule = '';
for (const row of rows) {
  if (row.rule !== currentRule) {
    console.log(`\n### ${row.rule}`);
    currentRule = row.rule;
  }
  console.log(`  ${row.file}:${row.line}  ${row.message.slice(0, 90)}`);
}
console.log(`\n${rows.length} errors`);
