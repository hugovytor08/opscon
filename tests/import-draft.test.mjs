import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseImportDraft, IMPORT_LIMITS } from '../app/import-draft.js';
import { importSchema } from '../app/import-schema.js';

const fixture = JSON.parse(await readFile(new URL('../docs/importacao/exemplo-lote.json', import.meta.url), 'utf8'));
const parse = value => parseImportDraft(JSON.stringify(value));
const change = mutate => { const batch = structuredClone(fixture); mutate(batch); return batch; };
export function twentyLines() {
  const batch = structuredClone(fixture); batch.documents = [batch.documents[0]];
  const doc = batch.documents[0];
  doc.lineItems = Array.from({ length: 20 }, (_, i) => ({ ...structuredClone(doc.lineItems[0]), lineId: `line-${String(i + 1).padStart(3, '0')}`, description: `Produto sintético ${i + 1}`, sourceText: null, soldQuantity: '1', unitPriceDecimal: '1.00', grossLineCents: 100, lineDiscountCents: 0, netLineCents: 100 }));
  doc.totals = { itemsGrossCents: 2000, discountCents: 0, extraCents: 0, totalCents: 2000, amountPaidCents: null };
  return batch;
}

test('contrato distribuído no shell corresponde exatamente à fonte versionada', async () => {
  assert.deepEqual(importSchema, JSON.parse(await readFile(new URL('../docs/importacao/contrato-importacao.schema.json', import.meta.url), 'utf8')));
});
test('rascunho de 20 linhas conserva valores, null, decimal fracionário e não altera a entrada', () => {
  const batch = twentyLines(), before = JSON.stringify(batch), review = parse(batch);
  assert.equal(review.batch.documents[0].lineItems.length, 20);
  assert.deepEqual(review.documents[0].issues, []);
  assert.equal(JSON.stringify(batch), before);
  const example = parse(fixture);
  assert.equal(example.batch.documents[0].lineItems[1].soldQuantity, '0.350');
  assert.equal(example.batch.documents[0].totals.amountPaidCents, null);
  assert.ok(example.documents.at(-1).issues.some(issue => issue.includes('não comprova pagamento')));
});
test('formato, datas, IDs locais, centavos, decimais e campos inesperados são estritos', () => {
  const invalid = [
    b => b.version = 2, b => b.format = 'casa-serena-backup', b => b.extra = true,
    b => b.documents[0].issuedOn = '2026-02-30', b => delete b.documents[0].merchant.branch,
    b => b.documents[0].totals.totalCents = .5, b => b.documents[0].totals.totalCents = Number.MAX_SAFE_INTEGER + 1,
    b => b.documents[0].lineItems[0].soldQuantity = '0,350', b => b.documents[0].lineItems[0].unitPriceDecimal = 8.5,
    b => b.documents[0].lineItems[0].soldQuantity = '1\n', b => b.documents[0].id = 'doc-001\n',
    b => b.documents[0].totals.discountCents = -1, b => b.documents[0].transactionStatus = 'paid',
    b => b.documents.push(structuredClone(b.documents[0])),
    b => b.documents[0].lineItems.push(structuredClone(b.documents[0].lineItems[0])),
    b => b.documents[0].lineItems[0].description = 'a'.repeat(201)
  ];
  invalid.forEach(mutate => assert.throws(() => parse(change(mutate))));
  assert.throws(() => parseImportDraft('```json\n{}\n```'));
  assert.throws(() => parseImportDraft('{"__proto__":{"polluted":true}}'));
  assert.equal({}.polluted, undefined);
});
test('limites de bytes UTF-8, documentos, profundidade e 500 linhas globais são aplicados antes da prévia', () => {
  assert.throws(() => parseImportDraft(' '.repeat(IMPORT_LIMITS.bytes + 1)), /512 KiB/);
  assert.throws(() => parseImportDraft('é'.repeat(IMPORT_LIMITS.bytes / 2 + 1)), /512 KiB/);
  assert.throws(() => parseImportDraft('['.repeat(30) + '0' + ']'.repeat(30)), /profunda/);
  assert.throws(() => parse(change(b => { b.documents = Array.from({ length: 21 }, (_, i) => ({ ...b.documents[0], id: `doc-${String(i + 1).padStart(3, '0')}` })); })));
  const batch = twentyLines(); const doc = batch.documents[0];
  doc.lineItems = Array.from({ length: 250 }, (_, i) => ({ ...doc.lineItems[0], lineId: `line-${String(i + 1).padStart(3, '0')}` }));
  batch.documents.push({ ...structuredClone(doc), id: 'doc-002' });
  assert.equal(parse(batch).batch.documents.length, 2);
  batch.documents[1].lineItems.push({ ...doc.lineItems[0], lineId: 'line-251' });
  assert.throws(() => parse(batch), /500 linhas/);
});
test('regras de negócio mantêm divergências, moeda, quantidade zero e pagamento agendado como pendências', () => {
  const review = parse(change(b => {
    b.documents[0].totals.totalCents = 3;
    b.documents[0].lineItems[0].soldQuantity = '0.000';
    b.documents[0].lineItems[0].netLineCents = 1;
    b.documents[1].transactionStatus = 'scheduled';
    b.documents[1].direction = 'unknown'; b.documents[1].currency = 'USD';
  }));
  assert.ok(review.documents[0].issues.some(issue => issue.includes('difere do total')));
  assert.ok(review.documents[0].issues.some(issue => issue.includes('quantidade')));
  assert.ok(review.documents[1].issues.some(issue => issue.includes('não dar baixa')));
  assert.ok(review.documents[1].issues.some(issue => issue.includes('BRL')));
  // BigInt sums do not silently round safe individual values when combined.
  const huge = twentyLines(); huge.documents[0].lineItems.forEach(line => line.grossLineCents = Number.MAX_SAFE_INTEGER);
  assert.ok(parse(huge).documents[0].issues.length > 0);
});
