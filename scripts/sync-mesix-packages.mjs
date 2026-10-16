import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packages = [
  {
    name: '@mesix/theme',
    source: resolve(root, '../Mesix_Common/theme/dist/mesix-theme'),
    target: join(root, 'CustomPackages/@mesix/theme'),
  },
  {
    name: '@mesix/custom-control',
    source: resolve(root, '../Mesix_Common/custom_control/dist/mesix-custom-control'),
    target: join(root, 'CustomPackages/@mesix/custom-control'),
  },
];

for (const pkg of packages) {
  if (!existsSync(pkg.source)) {
    console.error(`Missing build output for ${pkg.name}: ${pkg.source}`);
    console.error('Build the library first, then run npm run sync:mesix');
    process.exit(1);
  }
  mkdirSync(dirname(pkg.target), { recursive: true });
  rmSync(pkg.target, { recursive: true, force: true });
  cpSync(pkg.source, pkg.target, { recursive: true });
  console.log(`Synced ${pkg.name} -> ${pkg.target}`);
}

console.log('Done. Run npm install if package contents changed.');
