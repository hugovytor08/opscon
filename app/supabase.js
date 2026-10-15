import { DomainError } from './domain.js';
import { validateRemote } from './storage.js';

export function validateConfig(config) {
  if (!config?.url || !config.publishableKey) throw new DomainError('REMOTE_NOT_CONFIGURED', 'O projeto Supabase ainda não foi configurado. Seus dados seguem locais.');
  let url;
  try { url = new URL(config.url); } catch { throw new DomainError('REMOTE_CONFIG', 'Endereço Supabase inválido.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash)
    throw new DomainError('REMOTE_CONFIG', 'Use a origem HTTPS do projeto Supabase.');
  const key = config.publishableKey;
  let allowed = /^sb_publishable_[A-Za-z0-9_-]+$/.test(key);
  if (key.startsWith('ey')) {
    try { allowed = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role === 'anon'; } catch { allowed = false; }
  }
  if (!allowed) throw new DomainError('REMOTE_CONFIG', 'Use somente chave pública publishable ou anon. Chaves privilegiadas são proibidas no app.');
  const authMode = config.authMode ?? 'code';
  if (!['code', 'magic-link', 'password'].includes(authMode)) throw new DomainError('REMOTE_CONFIG', 'Modo de autenticação inválido.');
  return { url: url.origin, publishableKey: key, authMode };
}

export class SupabaseClient {
  constructor(config, { fetcher = (...args) => globalThis.fetch(...args), sessionStorage = globalThis.localStorage } = {}) {
    this.config = validateConfig(config); this.fetcher = fetcher; this.storage = sessionStorage;
    this.sessionKey = `casa-serena-auth:${this.config.url}`;
  }
  readSession() {
    try { return JSON.parse(this.storage.getItem(this.sessionKey) ?? 'null'); }
    catch { throw new DomainError('AUTH_STORAGE', 'Não foi possível ler a sessão. Entre novamente.'); }
  }
  saveSession(session) {
    if (!session?.access_token || !session.refresh_token || !session.user?.id || !Number.isFinite(session.expires_in))
      throw new DomainError('AUTH_PROTOCOL', 'A resposta de autenticação está incompleta.');
    const saved = { access_token: session.access_token, refresh_token: session.refresh_token, user: { id: session.user.id, email: session.user.email }, expiresAt: Date.now() + session.expires_in * 1000 };
    try { this.storage.setItem(this.sessionKey, JSON.stringify(saved)); }
    catch { throw new DomainError('AUTH_STORAGE', 'Não foi possível guardar a sessão neste navegador.'); }
    return saved;
  }
  async request(path, { method = 'GET', body, token } = {}) {
    let response;
    try {
      response = await this.fetcher(`${this.config.url}${path}`, {
        method, cache: 'no-store', signal: AbortSignal.timeout(15000),
        headers: { apikey: this.config.publishableKey, ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
    } catch { throw new DomainError('NETWORK', 'Sem confirmação do servidor. As alterações continuam pendentes neste aparelho.'); }
    let value;
    try { value = await response.json(); } catch { value = null; }
    if (!response.ok) {
      if (response.status === 429) throw new DomainError('REMOTE_LIMIT', 'Muitas tentativas. Aguarde antes de tentar novamente.');
      if (path === '/auth/v1/token?grant_type=password' && [400, 401, 403, 422].includes(response.status))
        throw new DomainError('AUTH_CREDENTIALS', 'Não foi possível entrar. Confira o e-mail e a senha.');
      if (path === '/auth/v1/user' && method === 'PUT' && [400, 422].includes(response.status))
        throw new DomainError('AUTH_PASSWORD', 'A senha não foi aceita. Use uma senha diferente que atenda às regras da sua conta.');
      if (value?.code === 'CS409') throw new DomainError('REMOTE_CONFLICT', 'A versão remota mudou. As duas cópias serão preservadas.');
      if (value?.code === 'CS422') throw new DomainError('IDEMPOTENCY_CONFLICT', 'O servidor rejeitou a reutilização de uma operação com dados diferentes.');
      if (value?.code === 'CS426') throw new DomainError('REMOTE_SCHEMA', 'Os dados usam uma versão mais recente. Atualize o aplicativo antes de sincronizar.');
      if (response.status === 401 || response.status === 403) throw new DomainError('AUTH', 'Sua sessão precisa ser renovada. Entre novamente na mesma conta.');
      throw new DomainError('REMOTE_ERROR', 'O servidor não confirmou a operação. A cópia local foi preservada.');
    }
    return value;
  }
  async sendCode(email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new DomainError('VALIDATION', 'Informe seu e-mail.');
    await this.request('/auth/v1/otp', { method: 'POST', body: { email, create_user: false } });
  }
  async sendLink(email, redirectUrl) {
    return this.sendAccessEmail(email, redirectUrl, false);
  }
  async recoverPassword(email, redirectUrl) {
    return this.sendAccessEmail(email, redirectUrl, true);
  }
  async signInWithPassword(email, password, expectedOwnerId = null) {
    email = String(email).trim();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new DomainError('VALIDATION', 'Informe seu e-mail.');
    if (typeof password !== 'string' || !password.length || password.length > 1024) throw new DomainError('VALIDATION', 'Informe sua senha.');
    const session = await this.request('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } });
    if (expectedOwnerId && session?.user?.id !== expectedOwnerId)
      throw new DomainError('AUTH_OWNER', 'Entre na mesma conta já vinculada a este aparelho. Seus registros foram preservados.');
    const saved = this.saveSession(session);
    this.storage.removeItem(`${this.sessionKey}:pkce`);
    this.storage.removeItem(`${this.sessionKey}:recovery`);
    return saved;
  }
  async sendAccessEmail(email, redirectUrl, recovery) {
    email = String(email).trim();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new DomainError('VALIDATION', 'Informe seu e-mail.');
    const url = new URL(redirectUrl);
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1','localhost'].includes(url.hostname)))
      throw new DomainError('AUTH_REDIRECT', 'O acesso requer HTTPS ou a prévia local segura.');
    if (url.username || url.password || url.search || url.hash) throw new DomainError('AUTH_REDIRECT', 'Origem de retorno inválida.');
    const encode = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
    const verifier = encode(crypto.getRandomValues(new Uint8Array(32)));
    const challenge = encode(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
    this.storage.setItem(`${this.sessionKey}:pkce`, JSON.stringify({ verifier, recovery, expiresAt: Date.now() + 3600000 }));
    await this.request(`/auth/v1/${recovery ? 'recover' : 'otp'}?redirect_to=${encodeURIComponent(url.href)}`, { method: 'POST', body: { email, ...(!recovery ? { create_user: false } : {}), code_challenge: challenge, code_challenge_method: 's256' } });
  }
  hasPasswordRecovery() {
    try {
      const pending = JSON.parse(this.storage.getItem(`${this.sessionKey}:recovery`) ?? 'null');
      return !!pending && pending.expiresAt > Date.now() && pending.userId === this.readSession()?.user.id;
    } catch { return false; }
  }
  async updatePassword(password) {
    if (!this.hasPasswordRecovery()) throw new DomainError('AUTH_LINK', 'Solicite a recuperação de senha novamente neste navegador.');
    if (typeof password !== 'string' || password.length < 8 || password.length > 1024) throw new DomainError('VALIDATION', 'Use uma senha de 8 a 1024 caracteres.');
    const session = await this.session();
    const user = await this.request('/auth/v1/user', { method: 'PUT', token: session.access_token, body: { password } });
    if (user?.id !== session.user.id) throw new DomainError('AUTH_PROTOCOL', 'Não foi possível confirmar a identidade da conta. Entre novamente.');
    this.storage.removeItem(`${this.sessionKey}:recovery`);
  }
  async exchangeCode(code, expectedOwnerId = null) {
    let pending;
    try { pending = JSON.parse(this.storage.getItem(`${this.sessionKey}:pkce`) ?? 'null'); } catch { pending = null; }
    if (!pending?.verifier || pending.expiresAt < Date.now()) throw new DomainError('AUTH_LINK', 'Abra o link no mesmo navegador onde pediu acesso. Se expirou, solicite outro link.');
    const session = await this.request('/auth/v1/token?grant_type=pkce', { method: 'POST', body: { auth_code: code, code_verifier: pending.verifier } });
    if (expectedOwnerId && session?.user?.id !== expectedOwnerId) throw new DomainError('AUTH_OWNER', 'A recuperação deve usar a mesma conta já vinculada a este aparelho.');
    const saved = this.saveSession(session);
    if (pending.recovery) this.storage.setItem(`${this.sessionKey}:recovery`, JSON.stringify({ userId: saved.user.id, expiresAt: Date.now() + 900000 }));
    this.storage.removeItem(`${this.sessionKey}:pkce`);
    return saved;
  }
  async verifyCode(email, token) {
    if (!/^\d{6,10}$/.test(token)) throw new DomainError('VALIDATION', 'Informe o código recebido por e-mail.');
    return this.saveSession(await this.request('/auth/v1/verify', { method: 'POST', body: { email, token, type: 'email' } }));
  }
  async session() {
    const refresh = async () => {
      let session = this.readSession();
      if (!session) throw new DomainError('AUTH', 'Entre na sua conta para sincronizar.');
      if (session.expiresAt <= Date.now() + 60000) session = this.saveSession(await this.request('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: session.refresh_token } }));
      const user = await this.request('/auth/v1/user', { token: session.access_token });
      if (user?.id !== session.user.id) throw new DomainError('AUTH', 'A identidade da sessão mudou. Entre novamente.');
      return session;
    };
    return globalThis.navigator?.locks ? navigator.locks.request(this.sessionKey, refresh) : refresh();
  }
  async signOut() {
    const token = this.readSession()?.access_token;
    try { if (token) await this.request('/auth/v1/logout?scope=local', { method: 'POST', token }); }
    finally { this.storage.removeItem(this.sessionKey); this.storage.removeItem(`${this.sessionKey}:pkce`); this.storage.removeItem(`${this.sessionKey}:recovery`); }
  }
  async read(session) {
    const rows = await this.request('/rest/v1/casa_snapshots?select=remote_revision,state,updated_at', { token: session.access_token });
    if (!Array.isArray(rows) || rows.length > 1) throw new DomainError('SYNC_PROTOCOL', 'A leitura remota retornou um conjunto inválido.');
    return rows.length ? validateRemote({ revision: rows[0].remote_revision, state: rows[0].state, updatedAt: rows[0].updated_at }) : null;
  }
  async commit(session, entry) {
    const receipt = await this.request('/rest/v1/rpc/casa_commit_snapshot', { method: 'POST', token: session.access_token,
      body: { p_operation_id: entry.key, p_base_revision: entry.baseRevision, p_state: entry.state } });
    return validateRemote(receipt);
  }
}
