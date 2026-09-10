/**
 * Enforce the workspace dependency direction.
 *
 *     web  ->  api  ->  core
 *
 * Each arrow points one way only. The SDK isolation rule used to be a convention
 * CLAUDE.md asked people to remember; now that the layers are separate packages
 * the module graph can carry it — but only if something checks.
 *
 * The rule that matters most is the ban on `astro` below `web`. It is what keeps
 * the controllers mountable somewhere else: the moment a controller takes an
 * `AstroCookies` or calls Astro's `redirect()`, running the same code under Hono,
 * Bun or a background worker stops being an adapter and becomes a rewrite. That
 * is exactly the state this refactor started from.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const RULES = [
  {
    dir: 'packages/core/src',
    forbid: [
      [/from\s+['"]@\//, 'core must not import from the app via the @/ alias'],
      [/from\s+['"]@gameloopers\/(api|web)/, 'core must not depend on api or web'],
      [/from\s+['"]astro['"]/, 'core must not depend on Astro'],
    ],
  },
  {
    dir: 'packages/api/src',
    forbid: [
      [/from\s+['"]@\//, 'api must not import from the app via the @/ alias'],
      [/from\s+['"]@gameloopers\/web/, 'api must not depend on web'],
      [
        /from\s+['"]astro['"]/,
        'api must not depend on Astro - that is what makes the controllers ' +
          'mountable under another runtime',
      ],
      [
        /import\s+type\s*\{[^}]*Astro[A-Za-z]+/,
        'api must not reference Astro types',
      ],
    ],
  },
];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(p)) out.push(p);
  }
  return out;
}

let failures = 0;

for (const rule of RULES) {
  if (!existsSync(rule.dir)) continue;
  for (const file of walk(rule.dir)) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const [pattern, reason] of rule.forbid) {
        if (pattern.test(line)) {
          console.error(
            `${relative(process.cwd(), file)}:${i + 1}\n  ${line.trim()}\n  ${reason}\n`
          );
          failures++;
        }
      }
    });
  }
}

if (failures > 0) {
  console.error(`${failures} boundary violation(s).`);
  process.exit(1);
}
console.log('Package boundaries OK: web -> api -> core, and no Astro below web.');
