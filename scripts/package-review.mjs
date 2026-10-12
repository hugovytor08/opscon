import { readdir, readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const files = [];
const collect = async relative => {
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    const name = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) await collect(name); else if (entry.isFile()) files.push(name);
  }
};
for (const dir of ['app','tests','supabase','scripts']) await collect(dir);
files.push('features.json','package.json','package-lock.json','docs/validacao/matriz-ca.md','docs/validacao/incremento-0.3.0.md','docs/arquitetura/protocolo-sync.md');
const hashes = {};
for (const file of files.sort()) hashes[file] = createHash('sha256').update(await readFile(path.join(root, file))).digest('hex');
const digest = createHash('sha256').update(JSON.stringify(hashes)).digest('hex');
const destination = path.join(root, 'output', 'review', `0.3.0-${digest.slice(0,12)}`);
await mkdir(destination, { recursive: true });
for (const file of files) {
  const target = path.join(destination, file); await mkdir(path.dirname(target), { recursive: true }); await copyFile(path.join(root, file), target);
}
await writeFile(path.join(destination, 'manifest.json'), JSON.stringify({ version: '0.3.0', status: 'development', contentSha256: digest, files: hashes, domainSchema: 1, indexedDbVersion: 2, remoteProtocol: 1, remoteMigration: '202610110001', published: false }, null, 2) + '\n');
console.log(destination);
