import test from 'node:test';
import assert from 'node:assert/strict';
import { SupabaseClient, validateConfig } from '../app/supabase.js';
import { createInitialState } from '../app/domain.js';
import { SyncEngine } from '../app/sync.js';

const config = { url: 'https://test.supabase.co', publishableKey: 'sb_publishable_test' };
const memory = () => { const values = new Map(); return { getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) }; };
test('configuração remota rejeita segredo e transporte sem HTTPS', () => {
  assert.throws(() => validateConfig({ ...config, publishableKey: ['sb', 'secret', 'privileged'].join('_') }), e => e.code === 'REMOTE_CONFIG');
  const secret = `eyHeader.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.sig`;
  assert.throws(() => validateConfig({ ...config, publishableKey: secret }), e => e.code === 'REMOTE_CONFIG');
  assert.throws(() => validateConfig({ ...config, url: 'http://test.supabase.co' }), e => e.code === 'REMOTE_CONFIG');
  assert.throws(() => validateConfig({ url: '', publishableKey: '' }), e => e.code === 'REMOTE_NOT_CONFIGURED');
});
test('Auth usa código, renovação e identidade confirmada; logout elimina credencial mesmo sem rede', async () => {
  const calls = [], storage = memory();
  const client = new SupabaseClient(config, { sessionStorage: storage, fetcher: async (url, options) => {
    calls.push({ path: new URL(url).pathname, body: options.body ? JSON.parse(options.body) : null, headers: options.headers });
    if (url.includes('/logout')) throw new Error('offline');
    if (url.includes('/user')) return Response.json({ id: 'owner-a' });
    if (url.includes('/verify') || url.includes('/token')) return Response.json({ access_token: 'access', refresh_token: 'refresh', expires_in: url.includes('/token') ? 3600 : 0, user: { id: 'owner-a', email: 'test@example.invalid' } });
    return Response.json({});
  }});
  await client.sendCode('test@example.invalid');
  assert.equal(calls[0].body.create_user, false);
  await client.verifyCode('test@example.invalid', '123456');
  const session = await client.session();
  assert.equal(session.user.id, 'owner-a');
  assert(calls.some(c => c.path === '/auth/v1/token'));
  await assert.rejects(client.signOut(), e => e.code === 'NETWORK');
  assert.equal(client.readSession(), null);
});
test('erros remotos mantêm resultado incerto e não expõem resposta/segredos', async () => {
  const client = new SupabaseClient(config, { sessionStorage: memory(), fetcher: async () => Response.json({ code: 'CS409', message: 'private internal detail' }, { status: 400 }) });
  await assert.rejects(client.commit({ access_token: 'test' }, { key: 'operation', baseRevision: 0, state: createInitialState() }), e => e.code === 'REMOTE_CONFLICT' && !e.message.includes('private'));
  client.fetcher = async () => { throw new Error('secret network detail'); };
  await assert.rejects(client.read({ access_token: 'test' }), e => e.code === 'NETWORK' && !e.message.includes('secret'));
});

test('reconexão durante tentativa offline dispara nova passagem sem esperar polling', async () => {
  let online = false, reads = 0, changes = 0, engine;
  const local = { loadLocal: async () => ({ sync: { ownerId: 'a' }, queue: [], generation: null }), prepareTransmission: async () => null, pullRemote: async () => {} };
  engine = new SyncEngine({ session: async () => ({ user: { id: 'a' } }), read: async () => { reads++; return null; } }, {
    local, isOnline: () => online, onChange: async () => { if (++changes === 1) { online = true; void engine.run(); } },
  });
  await engine.run();
  assert.equal(reads, 1); assert.equal(engine.error, null);
});

test('link PKCE exige verificador do mesmo navegador, troca uma vez e exclui segredo da sessão', async () => {
  const storage = memory(), calls = [];
  const client = new SupabaseClient({ ...config, authMode: 'magic-link' }, { sessionStorage: storage, fetcher: async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return Response.json(url.includes('/token') ? { access_token: 'access', refresh_token: 'refresh', expires_in: 3600, user: { id: 'a' } } : {});
  }});
  await assert.rejects(client.exchangeCode('test-code'), e => e.code === 'AUTH_LINK');
  await client.sendLink('test@example.invalid', 'http://127.0.0.1:8766/');
  assert.equal(calls[0].body.code_challenge_method, 's256');
  assert.equal(calls[0].body.create_user, false);
  assert(!Object.hasOwn(calls[0].body, 'code_verifier'));
  await client.exchangeCode('test-code');
  assert.equal(client.readSession().user.id, 'a');
  assert(!Object.hasOwn(client.readSession(), 'verifier'));
  await assert.rejects(client.exchangeCode('test-code'), e => e.code === 'AUTH_LINK');
  await assert.rejects(client.sendLink('test@example.invalid', 'http://unsafe.example/'), e => e.code === 'AUTH_REDIRECT');
});

test('e-mail/senha usa Auth nativo, preserva espaços da senha e renova a mesma identidade', async () => {
  const storage = memory(), calls = [], password = ' senha sintética com espaços ';
  const client = new SupabaseClient({ ...config, authMode: 'password' }, { sessionStorage: storage, fetcher: async (url, options) => {
    calls.push({ url, ...options, body: options.body && JSON.parse(options.body) });
    return Response.json(url.endsWith('/user') ? { id: 'owner-a' } : { access_token: 'access', refresh_token: 'refresh', expires_in: url.endsWith('grant_type=password') ? 0 : 3600, user: { id: 'owner-a', email: 'test@example.invalid' } });
  }});
  await client.signInWithPassword(' test@example.invalid ', password, 'owner-a');
  assert.equal(calls[0].url, `${config.url}/auth/v1/token?grant_type=password`);
  assert.deepEqual(calls[0].body, { email: 'test@example.invalid', password });
  assert.equal(calls[0].cache, 'no-store');
  assert.equal((await client.session()).user.id, 'owner-a');
  assert.ok(calls.some(call => call.url.endsWith('grant_type=refresh_token')));
  assert.equal(storage.getItem(client.sessionKey).includes(password), false);
});

test('senha errada/conta inexistente são genéricas; limite e conta diferente não alteram a sessão anterior', async () => {
  const storage = memory(); let status = 400;
  const client = new SupabaseClient({ ...config, authMode: 'password' }, { sessionStorage: storage, fetcher: async () => Response.json(status === 200 ? { access_token: 'other', refresh_token: 'other', expires_in: 3600, user: { id: 'owner-b' } } : { message: 'private account detail' }, { status }) });
  client.saveSession({ access_token: 'a', refresh_token: 'r', expires_in: 3600, user: { id: 'owner-a' } });
  const before = storage.getItem(client.sessionKey);
  for (status of [400, 401, 403, 422]) await assert.rejects(client.signInWithPassword('test@example.invalid', 'synthetic', 'owner-a'), error => error.code === 'AUTH_CREDENTIALS' && !error.message.includes('private'));
  status = 429;
  await assert.rejects(client.signInWithPassword('test@example.invalid', 'synthetic'), error => error.code === 'REMOTE_LIMIT');
  status = 200;
  await assert.rejects(client.signInWithPassword('other@example.invalid', 'synthetic', 'owner-a'), error => error.code === 'AUTH_OWNER');
  assert.equal(storage.getItem(client.sessionKey), before);
});

test('recuperação nativa PKCE persiste o propósito, confirma identidade e atualiza senha sem guardá-la', async () => {
  const storage = memory(), calls = [], password = 'nova senha sintética';
  const fetcher = async (url, options) => {
    calls.push({ url, method: options.method, body: options.body && JSON.parse(options.body) });
    return Response.json(url.includes('/token') ? { access_token: 'a', refresh_token: 'r', expires_in: 3600, user: { id: 'owner-a' } } : url.endsWith('/user') ? { id: 'owner-a' } : {});
  };
  const client = new SupabaseClient({ ...config, authMode: 'password' }, { sessionStorage: storage, fetcher });
  await client.recoverPassword('test@example.invalid', 'http://127.0.0.1:8767/');
  assert.ok(calls[0].url.includes('/auth/v1/recover?redirect_to='));
  assert.equal(calls[0].body.code_challenge_method, 's256');
  assert.equal(Object.hasOwn(calls[0].body, 'create_user'), false);
  await client.exchangeCode('synthetic-code', 'owner-a');
  const challenge = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(calls[1].body.code_verifier))).toString('base64url');
  assert.equal(challenge, calls[0].body.code_challenge);
  const reloaded = new SupabaseClient({ ...config, authMode: 'password' }, { sessionStorage: storage, fetcher });
  assert.equal(reloaded.hasPasswordRecovery(), true);
  await reloaded.updatePassword(password);
  assert.equal(reloaded.hasPasswordRecovery(), false);
  assert.deepEqual(calls.find(call => call.method === 'PUT').body, { password });
  assert.equal(storage.getItem(`${client.sessionKey}:pkce`), null);
  assert.equal(storage.getItem(`${client.sessionKey}:recovery`), null);
  assert.equal(storage.getItem(client.sessionKey).includes(password), false);
  await assert.rejects(reloaded.updatePassword(password), error => error.code === 'AUTH_LINK');
});

test('recuperação inválida ou de outro proprietário não substitui a sessão; logout limpa propósito offline', async () => {
  const storage = memory();
  const client = new SupabaseClient({ ...config, authMode: 'password' }, { sessionStorage: storage, fetcher: async url => {
    if (url.includes('/logout')) throw new Error('offline');
    return Response.json(url.includes('/token') ? { access_token: 'other', refresh_token: 'other', expires_in: 3600, user: { id: 'owner-b' } } : {});
  }});
  client.saveSession({ access_token: 'a', refresh_token: 'r', expires_in: 3600, user: { id: 'owner-a' } });
  const before = storage.getItem(client.sessionKey);
  await assert.rejects(client.updatePassword('synthetic-password'), error => error.code === 'AUTH_LINK');
  await client.recoverPassword('test@example.invalid', 'http://127.0.0.1:8767/');
  await assert.rejects(client.exchangeCode('code', 'owner-a'), error => error.code === 'AUTH_OWNER');
  assert.equal(storage.getItem(client.sessionKey), before);
  storage.setItem(`${client.sessionKey}:recovery`, JSON.stringify({ userId: 'owner-a', expiresAt: Date.now() - 1 }));
  assert.equal(client.hasPasswordRecovery(), false);
  await assert.rejects(client.signOut(), error => error.code === 'NETWORK');
  assert.equal(storage.getItem(client.sessionKey), null);
  assert.equal(storage.getItem(`${client.sessionKey}:recovery`), null);
  assert.equal(storage.getItem(`${client.sessionKey}:pkce`), null);
});
