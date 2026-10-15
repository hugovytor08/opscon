import { readdir, readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const version = JSON.parse(await readFile(path.join(root, 'app/version.json'), 'utf8'));
const files = [];
const collect = async relative => {
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    const name = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) await collect(name); else if (entry.isFile()) files.push(name);
  }
};
for (const dir of ['app','tests','supabase','scripts','docs/importacao','docs/design/apartamento-real/editor','docs/design/apartamento-real/revisao-2026-10-14','docs/validacao/evidencias/reformulacao-0.3.2','docs/validacao/evidencias/incremento-0.3.3']) await collect(dir);
files.push('features.json','package.json','package-lock.json','README.md','vercel.json','docs/validacao/matriz-ca.md','docs/validacao/incremento-0.3.0.md','docs/validacao/incremento-0.3.1.md','docs/arquitetura/protocolo-sync.md');
files.push('docs/validacao/incremento-0.3.2.md','docs/produto/backlog-reformulacao.json','docs/design/reformulacao-2026-10-14.md','docs/design/apartamento-real/geometria.json','docs/design/apartamento-real/areas-interativas.json','docs/design/apartamento-real/casa-isometrica.svg');
files.push('docs/validacao/incremento-0.3.3.md','docs/design/referencias-historicas/ref-inicio.png');
const hashes = {};
for (const file of files.sort()) hashes[file] = createHash('sha256').update(await readFile(path.join(root, file))).digest('hex');
const digest = createHash('sha256').update(JSON.stringify(hashes)).digest('hex');
const destination = path.join(root, 'output', 'review', `${version.version}-${digest.slice(0,12)}`);
await mkdir(destination, { recursive: true });
for (const file of files) {
  const target = path.join(destination, file); await mkdir(path.dirname(target), { recursive: true }); await copyFile(path.join(root, file), target);
}
await writeFile(path.join(destination, 'manifest.json'), JSON.stringify({ version: version.version, status: version.releaseStatus, contentSha256: digest, files: hashes, domainSchema: version.domainSchema, indexedDbVersion: version.indexedDbVersion, remoteProtocol: version.remoteProtocol, remoteMigration: version.remoteMigration, published: false }, null, 2) + '\n');
console.log(destination);
