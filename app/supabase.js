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
  if (!['code', 'magic-link'].includes(authMode)) throw new DomainError('REMOTE_CONFIG', 'Modo de autenticação inválido.');
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
      if (value?.code === 'CS409') throw new DomainError('REMOTE_CONFLICT', 'A versão remota mudou. As duas cópias serão preservadas.');
      if (value?.code === 'CS422') throw new DomainError('IDEMPOTENCY_CONFLICT', 'O servidor rejeitou a reutilização de uma operação com dados diferentes.');
      if (response.status === 401 || response.status === 403) throw new DomainError('AUTH', 'Sua sessão precisa ser renovada. Entre novamente na mesma conta.');
      if (response.status === 429) throw new DomainError('REMOTE_LIMIT', 'Limite temporário do servidor. Tente novamente mais tarde.');
      throw new DomainError('REMOTE_ERROR', 'O servidor não confirmou a operação. A cópia local foi preservada.');
    }
    return value;
  }
  async sendCode(email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new DomainError('VALIDATION', 'Informe seu e-mail.');
    await this.request('/auth/v1/otp', { method: 'POST', body: { email, create_user: false } });
  }
  async sendLink(email, redirectUrl) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new DomainError('VALIDATION', 'Informe seu e-mail.');
    const url = new URL(redirectUrl);
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1','localhost'].includes(url.hostname)))
      throw new DomainError('AUTH_REDIRECT', 'O acesso requer HTTPS ou a prévia local segura.');
    if (url.username || url.password || url.search || url.hash) throw new DomainError('AUTH_REDIRECT', 'Origem de retorno inválida.');
    const encode = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
    const verifier = encode(crypto.getRandomValues(new Uint8Array(32)));
    const challenge = encode(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
    this.storage.setItem(`${this.sessionKey}:pkce`, JSON.stringify({ verifier, expiresAt: Date.now() + 3600000 }));
    await this.request(`/auth/v1/otp?redirect_to=${encodeURIComponent(url.href)}`, { method: 'POST', body: { email, create_user: false, code_challenge: challenge, code_challenge_method: 's256' } });
  }
  async exchangeCode(code) {
    let pending;
    try { pending = JSON.parse(this.storage.getItem(`${this.sessionKey}:pkce`) ?? 'null'); } catch { pending = null; }
    if (!pending?.verifier || pending.expiresAt < Date.now()) throw new DomainError('AUTH_LINK', 'Abra o link no mesmo navegador onde pediu acesso. Se expirou, solicite outro link.');
    const saved = this.saveSession(await this.request('/auth/v1/token?grant_type=pkce', { method: 'POST', body: { auth_code: code, code_verifier: pending.verifier } }));
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
    finally { this.storage.removeItem(this.sessionKey); this.storage.removeItem(`${this.sessionKey}:pkce`); }
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
