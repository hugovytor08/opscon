import { houseMap } from './house-map-data.js';
export { houseMap };
const key = scope => `casa-serena-map-bindings-v1:${scope ?? 'local'}`;
const roomOrigin = (state, id) => {
  const event = state.audit.find(entry => entry.type === 'room.create' && entry.recordIds?.roomId === id);
  // Sequential room IDs alone cannot identify a room after unrelated restores.
  return event?.idempotencyKey || JSON.stringify(event ?? state.rooms.find(room => room.id === id));
};
export function readBindings(state, scope, storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage.getItem(key(scope)) ?? '{}');
    const result = {}, used = new Set();
    for (const region of houseMap.regions) {
      const entry = saved[region.id];
      if (entry && state.rooms.some(room => room.id === entry.roomId) && entry.origin === roomOrigin(state, entry.roomId) && !used.has(entry.roomId)) {
        result[region.id] = entry.roomId; used.add(entry.roomId);
      }
    }
    return result;
  } catch { return {}; }
}
export function saveBindings(bindings, state, scope, storage = globalThis.localStorage) {
  const saved = {}, used = new Set();
  for (const region of houseMap.regions) {
    const roomId = bindings[region.id];
    if (!roomId) continue;
    if (!state.rooms.some(room => room.id === roomId)) throw new Error('Um cômodo mudou. Feche e abra o vínculo novamente.');
    if (used.has(roomId)) throw new Error('Escolha um cômodo diferente para cada ambiente do mapa.');
    used.add(roomId); saved[region.id] = { roomId, origin: roomOrigin(state, roomId) };
  }
  try { storage.setItem(key(scope), JSON.stringify(saved)); }
  catch { throw new Error('Não foi possível guardar os vínculos neste navegador. Nenhum vínculo foi confirmado.'); }
}
