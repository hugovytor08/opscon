import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// No shell interpolation and no tokens/passwords accepted as arguments.
const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const positional = args.filter(arg => arg !== '--dry-run');
const repository = positional[0];
const fail = message => { console.error(message); process.exit(1); };
if (positional.length > 1 || (repository && !/^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/.test(repository))) {
  fail('Use: npm run github:push -- https://github.com/USUARIO/REPOSITORIO.git [--dry-run]');
}
if (!repository && !dryRun) fail('Informe a URL HTTPS do repositorio GitHub ja criado.');
const git = (params, optional = false) => {
  const result = spawnSync('git', params, { cwd: root, encoding: 'utf8', windowsHide: true });
  if (result.error) fail('Git indisponivel. Instale o Git e abra um novo terminal.');
  if (result.status !== 0 && !optional) fail(result.stderr.trim() || `Git falhou: ${params[0]}`);
  return result;
};
if (path.resolve(git(['rev-parse', '--show-toplevel']).stdout.trim()) !== path.resolve(root)) fail('A raiz Git deve ser a pasta deste projeto.');
const branch = git(['branch', '--show-current']).stdout.trim();
if (!branch) fail('Selecione uma branch antes do push.');
const origin = git(['remote', 'get-url', 'origin'], true);
if (repository && origin.status === 0 && origin.stdout.trim().replace(/\.git$/, '') !== repository.replace(/\.git$/, '')) {
  fail('origin aponta para outro repositorio. Confira git remote -v; nenhuma configuracao foi alterada.');
}

// Inspect exactly the tracked/nonignored files that git add -A would include.
const files = git(['ls-files', '--cached', '--others', '--exclude-standard', '-z']).stdout.split('\0').filter(Boolean);
const suspect = [];
const secretPatterns = [
  /sb_secret_[A-Za-z0-9_-]{10,}/,
  /gh[pousr]_[A-Za-z0-9]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];
for (const file of new Set(files)) {
  const filename = path.basename(file);
  if ((filename.startsWith('.env') && filename !== '.env.example') || /\.(?:pem|key)$/i.test(file)) { suspect.push(file); continue; }
  let bytes;
  try { bytes = readFileSync(path.join(root, file)); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
  if (bytes.includes(0)) continue;
  const content = bytes.toString('utf8');
  const serviceRole = content.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)?.some(token => {
    try { return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).role === 'service_role'; } catch { return false; }
  });
  if (serviceRole || secretPatterns.some(pattern => pattern.test(content))) suspect.push(file);
}
if (suspect.length) fail(`Possiveis credenciais em arquivos: ${suspect.join(', ')}. Remova-as antes do push.`);
const checks = spawnSync(process.execPath, ['--check', fileURLToPath(import.meta.url)], { cwd: root, encoding: 'utf8', windowsHide: true });
if (checks.status !== 0) fail('Falha de sintaxe na ferramenta.');
for (const file of ['domain.js', 'storage.js', 'ui.js', 'sw.js', 'sync.js', 'supabase.js', 'config.js', 'house-map.js', 'house-map-data.js']) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, 'app', file)], { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) fail(`Falha de sintaxe: app/${file}`);
}
const hasIdentity = ['user.name', 'user.email'].every(key => git(['config', '--get', key], true).stdout.trim());
console.log(`Validacao concluida. Branch: ${branch}. ${new Set(files).size} arquivos considerados.`);
if (!hasIdentity) console.log('Configure git config user.name e git config user.email antes de executar o push.');
if (dryRun) { console.log('Simulacao: nenhum commit, remoto ou push realizado.'); process.exit(0); }
if (!hasIdentity) fail('Identidade Git ausente. Consulte README.md.');
const remoteProbe = git(['ls-remote', repository]);
if (git(['rev-parse', '--verify', 'HEAD'], true).status !== 0 && remoteProbe.stdout.trim()) {
  fail('O repositorio remoto ja tem historico. Use um repositorio vazio ou integre o historico primeiro.');
}
git(['add', '-A']);
if (git(['diff', '--cached', '--quiet'], true).status !== 0) {
  git(['commit', '-m', 'Prepare Casa Serena for Vercel phone testing']);
}
if (origin.status !== 0) git(['remote', 'add', 'origin', repository]);
git(['push', '--set-upstream', 'origin', branch]);
console.log(`Push concluido na branch ${branch}. Importe o repositorio no Vercel usando essa branch.`);
