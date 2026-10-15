import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { withApp } from './browser-harness.mjs';

const evidence = fileURLToPath(new URL('../docs/validacao/evidencias/reformulacao-0.3.2/', import.meta.url));
const fixture = JSON.parse(await readFile(new URL('../docs/importacao/exemplo-lote.json', import.meta.url), 'utf8'));
const snapshot = page => page.evaluate(async () => {
  const local = await (await import('./storage.js')).loadLocal();
  return JSON.stringify({ state: local.state, queue: local.queue, generation: local.generation });
});
async function nav(page, section) {
  if (page.viewportSize().width > 950) await page.locator(`#desktop-nav [data-nav="${section}"]`).click();
  else if (section === 'mercado') {
    await page.locator('[data-action="menu"]').click(); await page.locator(`.drawer [data-nav="${section}"]`).click();
  } else await page.locator(`#mobile-nav [data-nav="${section}"]`).click();
  await page.locator(`#view[data-section="${section}"]`).waitFor();
}
async function submit(page, kind, fields) {
  const form = page.locator(`form[data-form="${kind}"]`);
  for (const [key, value] of Object.entries(fields)) {
    const input = form.locator(`[name="${key}"]`);
    if (await input.evaluate(node => node.tagName === 'SELECT')) await input.selectOption(value);
    else await input.fill(value);
  }
  await form.locator('[type="submit"]').click();
  await form.waitFor({ state: 'detached' });
}

test('seis áreas: tema, alvos móveis, captura rápida, foco, prévia segura e shell offline', { timeout: 120000 }, async () => withApp(async ({ page, context, url }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await mkdir(evidence, { recursive: true });
  await page.goto(url); await page.locator('h1').waitFor();
  const initial = await snapshot(page);
  const layout = [];
  for (const width of [320, 360, 390, 412, 1200]) {
    await page.setViewportSize({ width, height: 900 });
    for (const section of ['inicio', 'casa', 'compras', 'mercado', 'financas', 'projetos']) {
      await nav(page, section);
      const check = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth + 1,
        // Chromium can report 43.999984px during a transform; round to 0.001px.
        smallButtons: [...document.querySelectorAll('#view button, #mobile-nav button, .topbar button')].filter(node => node.checkVisibility()).filter(node => Math.round(node.getBoundingClientRect().height * 1000) < 44000 || Math.round(node.getBoundingClientRect().width * 1000) < 44000).map(node => ({ text: node.textContent.trim(), height: node.getBoundingClientRect().height, width: node.getBoundingClientRect().width })) }));
      assert.equal(check.overflow, false, `overflow ${section} ${width}`);
      assert.deepEqual(check.smallButtons, [], `touch targets ${section} ${width}`);
      assert.equal(await page.locator('.apartment-map-image').count(), section === 'casa' ? 1 : 0);
      layout.push({ width, section, ...check });
      if ([390, 1200].includes(width)) await page.screenshot({ path: path.join(evidence, `${section}-vazio-${width}.png`), fullPage: true, animations: 'disabled' });
    }
  }
  assert.equal(await snapshot(page), initial, 'browsing must not seed user records');
  assert.ok(await page.locator('.sidebar .brand').evaluate(node => {
    const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
    const lum = value => rgb(value).reduce((n, v, i) => n + v * [.2126, .7152, .0722][i], 0);
    const a = lum(getComputedStyle(node).color), b = lum(getComputedStyle(node.closest('.sidebar')).backgroundColor);
    return (Math.max(a, b) + .05) / (Math.min(a, b) + .05) >= 4.5;
  }));
  await page.setViewportSize({ width: 390, height: 844 }); await nav(page, 'inicio');
  const expenseTrigger = page.locator('.quick-actions [data-action="new-expense"]');
  await expenseTrigger.click();
  assert.equal(await page.locator('.main-shell').evaluate(node => node.inert), true);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(() => document.activeElement.type), 'submit');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.dataset.action), 'close-overlay');
  await page.keyboard.press('Escape');
  assert.equal(await expenseTrigger.evaluate(node => node === document.activeElement), true);
  await page.locator('[data-action="new-account"]').click();
  await submit(page, 'account-create', { name: 'Conta sintética', openingBalance: '100,00' });
  const accountId = await page.evaluate(async () => (await (await import('./storage.js')).loadLocal()).state.accounts[0].id);
  await nav(page, 'inicio'); await page.locator('.quick-actions [data-action="new-income"]').click();
  assert.equal(await page.locator('[name="accountId"]').inputValue(), '', 'no default account');
  await submit(page, 'income-create', { description: 'Recebimento sintético', amount: '25,00', accountId });
  await nav(page, 'inicio'); await expenseTrigger.click();
  assert.equal(await page.locator('[name="accountId"]').inputValue(), '');
  await submit(page, 'expense-create', { description: 'Pão sintético', amount: '5,50' });
  const financial = await page.evaluate(async () => {
    const s = (await (await import('./storage.js')).loadLocal()).state;
    return { purchases: s.purchases.length, payments: s.payments.length, income: s.incomes[0].amountCents,
      total: s.purchases[0].totalCents, summary: (await import('./domain.js')).getSummary(s) };
  });
  assert.equal(financial.purchases, 1); assert.equal(financial.payments, 0);
  assert.equal(financial.income, 2500); assert.equal(financial.total, 550);
  assert.equal(financial.summary.balanceCents, 12500); assert.equal(financial.summary.openCents, 550);
  await nav(page, 'inicio');
  await page.screenshot({ path: path.join(evidence, 'inicio-registros-390.png'), fullPage: true, animations: 'disabled' });
  await page.locator('.quick-actions [data-action="new-expense"]').click();
  await submit(page, 'expense-create', { description: 'Suco sintético', amount: '3,00', accountId });
  const afterPayment = JSON.parse(await snapshot(page));
  assert.equal(afterPayment.state.purchases.length, 2); assert.equal(afterPayment.state.payments.length, 1);
  assert.equal(afterPayment.state.payments[0].allocations.some(entry => entry.obligationId === afterPayment.state.obligations[0].id), false);

  // Import preview is explicitly read only. Neither arbitrary text nor valid
  // documents can change domain, generation or outbox.
  const beforeImport = await snapshot(page);
  await page.locator('.topbar [data-action="new"]').click();
  await page.locator('[data-action="import-json"]').click();
  await page.locator('[name="json"]').fill('{"format":"unknown"}');
  await page.locator('form[data-form="import-preview"] [type="submit"]').click();
  await page.locator('#import-error').filter({ hasText: 'obrigatório' }).waitFor();
  assert.equal(await snapshot(page), beforeImport);
  const batch = structuredClone(fixture); batch.documents = [batch.documents[0]];
  batch.warnings = [];
  const doc = batch.documents[0];
  doc.lineItems = Array.from({ length: 20 }, (_, i) => ({ ...doc.lineItems[0], lineId: `line-${String(i + 1).padStart(3, '0')}`, description: i ? `Produto sintético ${i + 1}` : '<img src=x onerror="window.injected=true">', soldQuantity: '1', unitPriceDecimal: '1.00', grossLineCents: 100, lineDiscountCents: 0, netLineCents: 100 }));
  doc.totals = { itemsGrossCents: 2000, discountCents: 0, extraCents: 0, totalCents: 2000, amountPaidCents: null };
  await page.locator('[name="json"]').fill(JSON.stringify(batch));
  await page.locator('form[data-form="import-preview"] [type="submit"]').click();
  await page.locator('.import-review').waitFor();
  assert.equal(await page.locator('.review-lines li').count(), 20);
  assert.equal(await page.locator('.review-lines img').count(), 0);
  assert.equal(await page.evaluate(() => window.injected), undefined);
  assert.equal(await snapshot(page), beforeImport);
  await page.screenshot({ path: path.join(evidence, 'importacao-20-linhas-390.png'), animations: 'disabled' });
  await page.locator('[data-action="close-overlay"]').first().click();
  await page.locator('.topbar [data-action="new"]').click(); await page.locator('[data-action="import-json"]').click();
  await page.locator('[name="json"]').fill('');
  await page.locator('[name="file"]').setInputFiles({ name: 'teste-sintetico.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture)) });
  await page.locator('form[data-form="import-preview"] [type="submit"]').click(); await page.locator('.import-review').waitFor();
  assert.equal(await page.locator('.review-document').count(), 3);
  assert.equal(await snapshot(page), beforeImport);
  await page.keyboard.press('Escape');
  await page.emulateMedia({ reducedMotion: 'reduce' }); await nav(page, 'inicio');
  assert.equal(await page.locator('#view').evaluate(node => getComputedStyle(node).animationName), 'none');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); await page.locator('h1').waitFor();
  await context.setOffline(true); await page.reload(); await page.locator('h1').waitFor();
  await page.locator('.topbar [data-action="new"]').click(); await page.locator('[data-action="import-json"]').click();
  await page.locator('[name="json"]').fill(JSON.stringify(fixture));
  await page.locator('form[data-form="import-preview"] [type="submit"]').click(); await page.locator('.import-review').waitFor();
  assert.equal(await snapshot(page), beforeImport);
  assert.deepEqual(errors, []);
  await writeFile(path.join(evidence, 'qa.json'), JSON.stringify({ engine: 'Chromium', syntheticOnly: true, physicalS23: false, layout, quickExpense: { unpaid: 550, paid: 300 }, income: 2500, importPreview: { lines: 20, fileDocuments: 3, mutations: 0, hostileTextEscaped: true, offline: true }, focusTrap: true, reducedMotion: true }, null, 2));
}));
