import { DomainError } from './domain.js';
import * as storage from './storage.js';

export class SyncEngine {
  constructor(remote, { local = storage, isOnline = () => navigator.onLine, onChange = () => {} } = {}) {
    this.remote = remote; this.local = local; this.isOnline = isOnline; this.onChange = onChange;
    this.running = null; this.error = null; this.requested = false;
  }
  async connect() {
    const session = await this.remote.session();
    const before = await this.local.loadLocal();
    const remote = await this.remote.read(session);
    await this.local.bindOwner(session.user.id, remote, before.generation);
    return this.run();
  }
  async acceptRemote() {
    const session = await this.remote.session();
    const before = await this.local.loadLocal();
    const remote = await this.remote.read(session);
    await this.local.acceptRemote(session.user.id, remote, before.generation);
    return this.run();
  }
  run() {
    this.requested = true;
    if (this.running) return this.running;
    const work = async () => {
      this.error = null;
      if (!this.isOnline()) { await this.onChange(); return; }
      try {
        const session = await this.remote.session(), ownerId = session.user.id;
        const before = await this.local.loadLocal();
        if (!before.sync.ownerId) throw new DomainError('SYNC_BIND_REQUIRED', 'Vincule a conta após exportar seu backup local.');
        if (before.sync.ownerId !== ownerId) throw new DomainError('OWNER_MISMATCH', 'Entre na mesma conta vinculada a estes dados.');
        if (before.sync.conflict) throw new DomainError('SYNC_CONFLICT', 'Há duas versões para revisar. Exporte a cópia local antes de escolher.');
        // Bounded pass; writes created while sending stay durable for next pass.
        for (let count = 0; count < 50 && this.isOnline(); count++) {
          const entry = await this.local.prepareTransmission(ownerId);
          if (!entry) break;
          try { await this.local.acknowledge(ownerId, entry, await this.remote.commit(session, entry)); }
          catch (error) {
            if (error.code === 'REMOTE_CONFLICT') await this.local.recordConflict(ownerId, await this.remote.read(session));
            throw error;
          }
        }
        const after = await this.local.loadLocal();
        if (!after.queue.length) await this.local.pullRemote(ownerId, await this.remote.read(session), after.generation);
      } catch (error) { this.error = { code: error.code ?? 'SYNC_ERROR', message: error.message }; }
      await this.onChange();
    };
    const drain = async () => {
      do { this.requested = false; await work(); } while (this.requested);
    };
    const locked = () => globalThis.navigator?.locks ? navigator.locks.request('casa-serena-sync', drain) : drain();
    this.running = Promise.resolve().then(locked).finally(() => { this.running = null; });
    return this.running;
  }
}
