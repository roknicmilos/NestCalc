// Copies seed data into the git-ignored local storage dir (without overwriting existing data).
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..', 'data');
const seeds = path.join(root, 'seeds');
const storage = path.join(root, 'storage');

mkdirSync(storage, { recursive: true });
for (const file of readdirSync(seeds)) {
  const target = path.join(storage, file);
  if (existsSync(target)) {
    console.log(`data/storage/${file} already exists, skipping`);
    continue;
  }
  copyFileSync(path.join(seeds, file), target);
  console.log(`Seeded data/storage/${file}`);
}
