#!/usr/bin/env node
import { copyFile, mkdir, readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith('-')));
const target = args.find(a => !a.startsWith('-'));
const FORCE = flags.has('--force') || flags.has('-f');
const LIST = flags.has('--list');
const HELP = flags.has('--help') || flags.has('-h');
const VERSION = flags.has('--version') || flags.has('-v');

const files = ['SKILL.md', 'README.md', 'LICENSE', 'index.html', 'gallery.html'];
const dirs = ['examples', 'media'];

async function walk(dir, prefix = dir) {
  const out = [];
  for (const entry of await readdir(join(root, dir), { withFileTypes: true })) {
    const rel = join(prefix, entry.name);
    if (entry.isDirectory()) out.push(...await walk(join(dir, entry.name), rel));
    else out.push(rel);
  }
  return out;
}

async function inventory() {
  const list = [...files];
  for (const dir of dirs) list.push(...await walk(dir));
  return list.sort();
}

if (VERSION) {
  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  console.log(`isom3trics ${pkg.version}`);
  process.exit(0);
}

if (HELP || (!target && !LIST)) {
  console.log(`isom3trics — install the skill and its worked examples

Usage
  npx isom3trics <target>          copy the skill into <target>
  npx isom3trics <target> --force  overwrite an existing install

Options
  --list     print the files that would be copied
  --force    copy over existing files
  --version  print the version
  --help     show this message

The install writes SKILL.md, the twenty examples, the gallery and the
README previews. It does not add dependencies or run anything.`);
  process.exit(HELP ? 0 : 1);
}

const plan = await inventory();

if (LIST) {
  console.log(`${plan.length} files:`);
  for (const file of plan) console.log(`  ${file}`);
  process.exit(0);
}

const dest = resolve(target);

if (!FORCE) {
  try {
    const exists = await stat(dest);
    if (exists.isDirectory() && (await readdir(dest)).length) {
      console.error(`${dest} is not empty. Re-run with --force to overwrite, or pick an empty path.`);
      process.exit(1);
    }
  } catch {}
}

for (const file of plan) {
  const out = join(dest, file);
  await mkdir(dirname(out), { recursive: true });
  await copyFile(join(root, file), out);
}

console.log(`Installed isom3trics into ${dest} (${plan.length} files).`);
console.log('Start with SKILL.md, then open index.html through a local server.');
