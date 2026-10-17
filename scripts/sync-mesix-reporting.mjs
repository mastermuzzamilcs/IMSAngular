import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, '../../MesixReporting/dist/mesix-reporting');
const target = join(root, 'CustomPackages/@mesix/reporting');
if (!existsSync(source)) {
  console.error(`Missing MesixReporting build output: ${source}`);
  console.error('From E:\\Work\\MesixReporting, run npm install and npm run build first.');
  process.exit(1);
}
mkdirSync(dirname(target), { recursive: true });
cpSync(source, target, { recursive: true });
console.log(`Synced @mesix/reporting -> ${target}`);
