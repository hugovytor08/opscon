import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { validate, renderIso, regions } from '../docs/design/apartamento-real/editor/geometry-core.mjs';
const source = new URL('../docs/design/apartamento-real/revisao-2026-10-14/', import.meta.url);
const root = new URL('../', import.meta.url);
const provenance = JSON.parse(await readFile(new URL('proveniencia.json', source), 'utf8'));
for (const entry of provenance.sources) {
  const bytes = await readFile(new URL(entry.copy, root));
  if (createHash('sha256').update(bytes).digest('hex') !== entry.sha256) throw new Error('Fonte da planta alterada: ' + entry.copy);
}
const model = validate(JSON.parse(await readFile(new URL('minha-planta.json', source), 'utf8')));
const svg = await readFile(new URL('casa-isometrica.svg', source), 'utf8');
if (svg !== renderIso(model, { furniture: false })) throw new Error('Isometria não corresponde ao JSON.');
console.log(JSON.stringify({ rooms: model.rooms.length, walls: model.walls.length, openings: model.openings.length, unit: model.coordinateSystem.unit, scaleToMeters: model.coordinateSystem.scaleToMeters, viewBox: regions(model).viewBox, exactSvgMatch: true, appliedToApp: false }));
