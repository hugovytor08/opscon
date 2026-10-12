// Public-key-only denial checks. Never prints response data or credentials.
import assert from 'node:assert/strict';
import { remoteConfig } from '../app/config.js';
import { createInitialState } from '../app/domain.js';
import { randomUUID } from 'node:crypto';
const request = async (path, options = {}) => {
  const response = await fetch(`${remoteConfig.url}${path}`, { ...options, signal: AbortSignal.timeout(10000), headers: { apikey: remoteConfig.publishableKey, 'Content-Type': 'application/json' } });
  assert([401,403].includes(response.status), `Expected denial, got HTTP ${response.status}`);
  console.log(`${path.split('?')[0]}: denied HTTP ${response.status}`);
};
await request('/rest/v1/casa_snapshots?select=remote_revision');
await request('/rest/v1/casa_receipts?select=remote_revision');
await request('/rest/v1/rpc/casa_commit_snapshot', { method: 'POST', body: JSON.stringify({ p_operation_id: randomUUID(), p_base_revision: 0, p_state: createInitialState() }) });
