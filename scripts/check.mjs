import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const app = new URL('../app/', import.meta.url);
for (const name of (await readdir(app)).filter(name => name.endsWith('.js')).sort()) {
  const result = spawnSync(process.execPath, ['--check', fileURLToPath(new URL(name, app))], { stdio: 'inherit', windowsHide: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('Sintaxe válida em todos os módulos de app.');
