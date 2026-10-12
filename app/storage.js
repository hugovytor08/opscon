import { createInitialState, DomainError, validateState } from './domain.js';

const DB_NAME = 'casa-serena';
const DB_VERSION = 2;
const STORES = ['snapshots', 'outbox', 'recoveries'];
const BACKUP_FORMAT = 'casa-serena-backup';
export const MAX_SNAPSHOT_BYTES = 2 * 1024 * 1024;
export const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]` :
  value && typeof value === 'object' ? `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}` : JSON.stringify(value);
const initialSync = () => ({ ownerId: null, remoteRevision: 0, lastSyncedAt: null, conflict: null });
const uuid = () => crypto.randomUUID();
const storageError = error => new DomainError(error?.name === 'QuotaExceededError' ? 'STORAGE_QUOTA' : 'STORAGE_ERROR',
  error?.name === 'QuotaExceededError' ? 'O armazenamento está cheio. Nada foi salvo; libere espaço e exporte seu backup.' : 'Não foi possível gravar os dados locais. Nada foi confirmado.');

function openDatabase() {
  if (typeof indexedDB === 'undefined') throw new DomainError('STORAGE_UNAVAILABLE', 'IndexedDB não está disponível neste navegador.');
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      for (const name of STORES) if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name, { keyPath: 'key' });
    };
    request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
    request.onerror = () => reject(storageError(request.error));
    request.onblocked = () => reject(new DomainError('STORAGE_BLOCKED', 'Feche outras abas do app para atualizar os dados locais.'));
  });
}

// Dependent reads/writes share a transaction; no network awaits inside it.
async function transaction(mode, change) {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORES, mode);
      const snapshots = tx.objectStore('snapshots'), outbox = tx.objectStore('outbox'), recoveries = tx.objectStore('recoveries');
      const requests = [snapshots.get('current'), snapshots.get('sync'), outbox.getAll()];
      let remaining = requests.length, result, failure;
      for (const req of requests) req.onsuccess = () => {
        if (--remaining) return;
        try {
          const stored = requests[0].result;
          const current = stored ? { ...stored, generation: stored.generation ?? null } : { key: 'current', state: createInitialState(), generation: null };
          const sync = requests[1].result?.value ?? initialSync();
          const queue = requests[2].result.sort((a, b) => a.sequence - b.sequence);
          validateState(current.state);
          result = change({ current, sync, queue, snapshots, outbox, recoveries });
        } catch (error) { failure = error instanceof DomainError ? error : storageError(error); tx.abort(); }
      };
      tx.oncomplete = () => resolve(result);
      tx.onabort = () => reject(failure ?? storageError(tx.error));
      tx.onerror = () => { failure ??= storageError(tx.error); };
    });
  } finally { db.close(); }
}

const guard = (current, revision, generation) => {
  if (current.state.revision !== revision || (generation !== undefined && current.generation !== generation))
    throw new DomainError('STORAGE_CONFLICT', 'Os dados mudaram em outra aba ou na sincronização. Recarregue antes de salvar.');
};
function checkSize(state) {
  if (new TextEncoder().encode(JSON.stringify(state)).length > MAX_SNAPSHOT_BYTES)
    throw new DomainError('STORAGE_LIMIT', 'Este conjunto excede 2 MB. Exporte uma cópia e revise o histórico antes de continuar.');
}
function enqueue(outbox, queue, state, kind = 'snapshot') {
  checkSize(state);
  const entry = { key: uuid(), sequence: (queue.at(-1)?.sequence ?? 0) + 1, state, kind, baseRevision: null };
  outbox.put(entry);
  return entry;
}
const keepRecovery = (recoveries, current, reason) => recoveries.put({ key: uuid(), createdAt: new Date().toISOString(), reason, state: current.state });
const ensureWritable = sync => {
  if (sync.conflict) throw new DomainError('SYNC_CONFLICT', 'Revise o conflito de sincronização antes de registrar novas alterações. As cópias foram preservadas.');
};

export const loadLocal = () => transaction('readonly', ({ current, sync, queue }) => ({ ...current, sync, queue }));
export const loadState = async () => (await loadLocal()).state;

export async function saveState(state, expectedRevision = Math.max(0, state.revision - 1), generation) {
  validateState(state); checkSize(state);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new DomainError('VALIDATION', 'Revisão esperada inválida.');
  return transaction('readwrite', ({ current, sync, queue, snapshots, outbox }) => {
    guard(current, expectedRevision, generation); ensureWritable(sync);
    if (state.revision !== current.state.revision + 1) throw new DomainError('STORAGE_CONFLICT', 'A revisão deve avançar exatamente uma vez.');
    snapshots.put({ key: 'current', state, generation: uuid() });
    enqueue(outbox, queue, state);
    return state;
  });
}

export function exportBackup(state) {
  validateState(state);
  return JSON.stringify({ format: BACKUP_FORMAT, version: 1, state }, null, 2);
}
export function importBackup(json) {
  let value;
  try { value = JSON.parse(json); } catch { throw new DomainError('BACKUP_INVALID', 'JSON do backup é inválido.'); }
  if (value?.format !== BACKUP_FORMAT || value.version !== 1 || !value.state) throw new DomainError('BACKUP_INVALID', 'Formato ou versão do backup incompatível.');
  return validateState(value.state);
}
export async function restoreBackup(json, expectedRevision, generation) {
  const restored = importBackup(json); checkSize(restored);
  return transaction('readwrite', ({ current, sync, queue, snapshots, outbox, recoveries }) => {
    guard(current, expectedRevision, generation); ensureWritable(sync);
    if (queue.some(entry => entry.baseRevision !== null)) throw new DomainError('SYNC_PENDING', 'Confirme o envio pendente antes de restaurar; sua resposta pode ter sido perdida.');
    keepRecovery(recoveries, current, 'before-restore');
    for (const entry of queue) outbox.delete(entry.key);
    snapshots.put({ key: 'current', state: restored, generation: uuid() });
    enqueue(outbox, [], restored, 'restore');
    return restored;
  });
}

export function validateRemote(remote) {
  if (remote === null) return null;
  if (!remote || !Number.isSafeInteger(remote.revision) || remote.revision < 1 || typeof remote.updatedAt !== 'string' || Number.isNaN(Date.parse(remote.updatedAt)))
    throw new DomainError('SYNC_PROTOCOL', 'Confirmação remota inválida; a cópia local foi preservada.');
  validateState(remote.state); checkSize(remote.state);
  return remote;
}

function markConflict(ctx, remote) {
  validateRemote(remote);
  ctx.sync.conflict = { remote, detectedAt: new Date().toISOString() };
  ctx.snapshots.put({ key: 'sync', value: ctx.sync });
  keepRecovery(ctx.recoveries, ctx.current, 'sync-conflict-local');
  if (remote) keepRecovery(ctx.recoveries, { state: remote.state }, 'sync-conflict-remote');
}

export async function bindOwner(ownerId, remote, generation) {
  validateRemote(remote);
  if (typeof ownerId !== 'string' || !ownerId) throw new DomainError('AUTH', 'Entre na sua conta.');
  return transaction('readwrite', ctx => {
    const { current, sync, queue, snapshots, outbox, recoveries } = ctx;
    guard(current, current.state.revision, generation);
    if (sync.ownerId && sync.ownerId !== ownerId) throw new DomainError('OWNER_MISMATCH', 'Estes dados pertencem a outra conta. Entre na conta já vinculada.');
    if (sync.ownerId) return;
    keepRecovery(recoveries, current, 'before-bind');
    sync.ownerId = ownerId;
    if (remote && (current.state.revision > 0 || queue.length) && canonical(current.state) !== canonical(remote.state)) {
      markConflict(ctx, remote); return;
    }
    for (const entry of queue) outbox.delete(entry.key);
    if (remote) {
      snapshots.put({ key: 'current', state: remote.state, generation: uuid() });
      sync.remoteRevision = remote.revision; sync.lastSyncedAt = remote.updatedAt;
    } else if (current.state.revision > 0 || queue.length) enqueue(outbox, [], current.state, 'initial-import');
    snapshots.put({ key: 'sync', value: sync });
  });
}

export const prepareTransmission = ownerId => transaction('readwrite', ({ sync, queue, outbox }) => {
  if (!sync.ownerId || sync.ownerId !== ownerId) throw new DomainError('OWNER_MISMATCH', 'Conta não corresponde aos dados locais.');
  ensureWritable(sync);
  const entry = queue[0];
  if (!entry) return null;
  if (entry.baseRevision === null) { entry.baseRevision = sync.remoteRevision; outbox.put(entry); }
  return entry;
});

export async function acknowledge(ownerId, entry, receipt) {
  validateRemote(receipt);
  if (receipt.operationId !== entry.key || receipt.revision !== entry.baseRevision + 1 || canonical(receipt.state) !== canonical(entry.state))
    throw new DomainError('SYNC_PROTOCOL', 'Recibo não corresponde ao envio. A pendência foi mantida.');
  return transaction('readwrite', ({ sync, queue, snapshots, outbox }) => {
    if (sync.ownerId !== ownerId || queue[0]?.key !== entry.key || sync.remoteRevision !== entry.baseRevision)
      throw new DomainError('SYNC_STALE', 'A fila mudou em outra aba. Confira novamente a sincronização.');
    outbox.delete(entry.key);
    sync.remoteRevision = receipt.revision; sync.lastSyncedAt = receipt.updatedAt;
    snapshots.put({ key: 'sync', value: sync });
  });
}

export async function pullRemote(ownerId, remote, generation) {
  validateRemote(remote);
  return transaction('readwrite', ctx => {
    const { current, sync, queue, snapshots } = ctx;
    guard(current, current.state.revision, generation);
    if (sync.ownerId !== ownerId) throw new DomainError('OWNER_MISMATCH', 'Conta não corresponde aos dados locais.');
    ensureWritable(sync);
    if (queue.length) return;
    if ((!remote && sync.remoteRevision > 0) || (remote && remote.revision < sync.remoteRevision)) { markConflict(ctx, remote); return; }
    if (!remote) return;
    if (remote.revision === sync.remoteRevision) {
      if (canonical(remote.state) !== canonical(current.state)) markConflict(ctx, remote);
      return;
    }
    snapshots.put({ key: 'current', state: remote.state, generation: uuid() });
    sync.remoteRevision = remote.revision; sync.lastSyncedAt = remote.updatedAt;
    snapshots.put({ key: 'sync', value: sync });
  });
}
export const recordConflict = (ownerId, remote) => transaction('readwrite', ctx => {
  if (ctx.sync.ownerId !== ownerId) throw new DomainError('OWNER_MISMATCH', 'Conta não corresponde aos dados locais.');
  markConflict(ctx, remote);
});

// Only explicit selection of remote after export can discard the local queue.
export async function acceptRemote(ownerId, remote, generation) {
  validateRemote(remote);
  if (!remote) throw new DomainError('SYNC_CONFLICT', 'A cópia remota está ausente. Preserve o backup e investigue o banco.');
  return transaction('readwrite', ctx => {
    const { current, sync, queue, snapshots, outbox, recoveries } = ctx;
    guard(current, current.state.revision, generation);
    if (sync.ownerId !== ownerId || !sync.conflict) throw new DomainError('SYNC_STALE', 'O conflito mudou; confira novamente.');
    keepRecovery(recoveries, current, 'before-accept-remote');
    for (const entry of queue) outbox.delete(entry.key);
    snapshots.put({ key: 'current', state: remote.state, generation: uuid() });
    snapshots.put({ key: 'sync', value: { ownerId, remoteRevision: remote.revision, lastSyncedAt: remote.updatedAt, conflict: null } });
  });
}
