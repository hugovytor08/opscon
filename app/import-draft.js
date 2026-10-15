import { importSchema } from './import-schema.js';

export const IMPORT_LIMITS = Object.freeze({ bytes: 512 * 1024, documents: 20, lines: 500 });
export class ImportDraftError extends Error {
  constructor(message, path = '$') { super(`${path}: ${message}`); this.name = 'ImportDraftError'; this.path = path; }
}
const fail = (message, path) => { throw new ImportDraftError(message, path); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const matchesType = (value, type) => type === 'null' ? value === null : type === 'object' ? object(value) : type === 'array' ? Array.isArray(value) : type === 'integer' ? Number.isSafeInteger(value) : typeof value === type;

// Implements every validation keyword used by this bundled contract, including
// calendar dates. Unknown schema keywords fail closed; no eval or remote refs.
const keywords = new Set(['$schema', '$defs', '$ref', 'title', 'description', 'type', 'const', 'enum', 'required', 'properties', 'additionalProperties', 'items', 'minItems', 'maxItems', 'minLength', 'maxLength', 'minimum', 'maximum', 'pattern', 'format']);
function validate(value, rule, path) {
  for (const key of Object.keys(rule)) if (!keywords.has(key)) fail('Contrato contém regra não suportada.', path);
  if (rule.$ref) {
    if (!/^#\/\$defs\/[\w]+$/.test(rule.$ref)) fail('Referência de contrato inválida.', path);
    const reference = importSchema.$defs[rule.$ref.split('/').at(-1)];
    if (!reference) fail('Referência de contrato ausente.', path);
    validate(value, reference, path);
  }
  if ('const' in rule && value !== rule.const) fail('Formato ou versão não suportado.', path);
  if (rule.enum && !rule.enum.includes(value)) fail('Opção desconhecida.', path);
  if (rule.type && ![rule.type].flat().some(type => matchesType(value, type))) fail('Tipo de dado inválido.', path);
  if (value === null) return;
  if (object(value)) {
    for (const key of rule.required ?? []) if (!Object.hasOwn(value, key)) fail('Campo obrigatório ausente.', `${path}.${key}`);
    for (const key of Object.keys(value)) {
      if (rule.additionalProperties === false && !Object.hasOwn(rule.properties ?? {}, key)) fail('Campo não permitido.', path);
      if (Object.hasOwn(rule.properties ?? {}, key)) validate(value[key], rule.properties[key], `${path}.${key}`);
    }
  }
  if (Array.isArray(value)) {
    if (value.length < (rule.minItems ?? 0) || value.length > (rule.maxItems ?? Infinity)) fail('Quantidade de registros fora do limite.', path);
    if (rule.items) value.forEach((entry, i) => validate(entry, rule.items, `${path}[${i}]`));
  }
  if (typeof value === 'string') {
    const length = [...value].length;
    if (length < (rule.minLength ?? 0) || length > (rule.maxLength ?? Infinity)) fail('Texto fora do limite de tamanho.', path);
    // Contract patterns are anchored. Reject the trailing newline accepted by
    // JavaScript's $ anchor: IDs and decimal strings must be canonical.
    if (rule.pattern && new RegExp(rule.pattern).exec(value)?.[0] !== value) fail('Formato de campo inválido.', path);
    if (rule.format) {
      if (rule.format !== 'date') fail('Formato do contrato não suportado.', path);
      const date = new Date(`${value}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.valueOf()) || date.toISOString().slice(0, 10) !== value) fail('Data inexistente; use AAAA-MM-DD.', path);
    }
  }
  if (typeof value === 'number' && (value < (rule.minimum ?? -Infinity) || value > (rule.maximum ?? Infinity))) fail('Valor fora do limite.', path);
}

export function parseImportDraft(raw) {
  if (typeof raw !== 'string') fail('Escolha ou cole um arquivo JSON em texto.');
  if (raw.length > IMPORT_LIMITS.bytes || new TextEncoder().encode(raw).byteLength > IMPORT_LIMITS.bytes) fail('O limite é 512 KiB; divida o lote.');
  let batch;
  try { batch = JSON.parse(raw); } catch { fail('JSON inválido. Cole somente o objeto JSON, sem bloco de código.'); }
  // Bound depth before recursive schema validation and reject prototype keys.
  const pending = [[batch, 0]];
  while (pending.length) {
    const [value, depth] = pending.pop();
    if (depth > 16) fail('Estrutura JSON profunda demais.');
    if (value && typeof value === 'object') for (const key of Object.keys(value)) {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) fail('Campo não permitido.');
      pending.push([value[key], depth + 1]);
    }
  }
  validate(batch, importSchema, '$');
  if (batch.documents.reduce((sum, doc) => sum + doc.lineItems.length, 0) > IMPORT_LIMITS.lines) fail('O lote excede 500 linhas.');
  const ids = new Set();
  for (const doc of batch.documents) {
    if (ids.has(doc.id)) fail('Identificador de documento repetido.');
    ids.add(doc.id);
    if (new Set(doc.lineItems.map(line => line.lineId)).size !== doc.lineItems.length) fail('Identificador de linha repetido.', doc.id);
  }
  return { batch, documents: batch.documents.map(inspectDocument) };
}

const sum = values => values.some(value => value === null) ? null : values.reduce((total, value) => total + BigInt(value), 0n);
export function inspectDocument(doc) {
  const issues = [];
  if (doc.currency !== 'BRL') issues.push('Moeda ausente ou diferente de BRL.');
  if (doc.kind === 'other') issues.push('Documento não classificado; manter pendente.');
  if (!doc.issuedOn) issues.push('Data do documento não identificada.');
  if (doc.totals.totalCents === null) issues.push('Total desconhecido; não equivale a zero.');
  const totals = doc.totals;
  if ([totals.itemsGrossCents, totals.discountCents, totals.extraCents, totals.totalCents].every(value => value !== null) && BigInt(totals.itemsGrossCents) - BigInt(totals.discountCents) + BigInt(totals.extraCents) !== BigInt(totals.totalCents)) issues.push('Bruto − descontos + acréscimos difere do total.');
  if (doc.kind === 'itemized_purchase') {
    if (!doc.lineItems.length) issues.push('Nota detalhada sem linhas.');
    const gross = sum(doc.lineItems.map(line => line.grossLineCents));
    if (gross !== null && totals.itemsGrossCents !== null && gross !== BigInt(totals.itemsGrossCents)) issues.push('Soma bruta das linhas difere do total bruto.');
    const net = sum(doc.lineItems.map(line => line.netLineCents));
    if (net !== null && [totals.totalCents, totals.extraCents, totals.discountCents].every(value => value !== null)) {
      // Contract discountCents is the total discount (line + document).
      const lineDiscount = sum(doc.lineItems.map(line => line.lineDiscountCents));
      if (lineDiscount !== null && (lineDiscount > BigInt(totals.discountCents) || net - (BigInt(totals.discountCents) - lineDiscount) + BigInt(totals.extraCents) !== BigInt(totals.totalCents))) issues.push('Descontos e valores líquidos das linhas não fecham.');
    }
  }
  for (const line of doc.lineItems) {
    if (!line.description?.trim() || line.netLineCents === null || line.soldQuantity === null || /^0(?:\.0+)?$/.test(line.soldQuantity) || line.soldUnit === 'unknown') issues.push(`${line.lineId}: produto, quantidade, unidade ou preço pendente.`);
    if (line.packageSize !== null && /^0(?:\.0+)?$/.test(line.packageSize)) issues.push(`${line.lineId}: conteúdo da embalagem deve ser maior que zero.`);
    if ([line.grossLineCents, line.lineDiscountCents, line.netLineCents].every(value => value !== null) && BigInt(line.grossLineCents) - BigInt(line.lineDiscountCents) !== BigInt(line.netLineCents)) issues.push(`${line.lineId}: bruto − desconto difere do líquido.`);
  }
  if (doc.kind === 'utility_bill') issues.push('Conta a vencer não comprova pagamento.');
  if (['payment_receipt', 'income_receipt'].includes(doc.kind)) {
    if (doc.transactionStatus !== 'completed') issues.push('Sem execução confirmada; não dar baixa.');
    if (doc.direction === 'unknown') issues.push('Revisar se é saída, entrada ou transferência própria.');
    if (!doc.paidOn || doc.totals.amountPaidCents === null) issues.push('Data ou valor efetivamente pago/recebido pendente.');
    issues.push('Escolher conta e conciliar documentos antes de registrar.');
  }
  return { id: doc.id, issues, warnings: [...doc.uncertainties, ...doc.lineItems.flatMap(line => line.uncertainties)] };
}
