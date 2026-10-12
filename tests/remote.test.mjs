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
