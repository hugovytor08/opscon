import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { withApp } from './browser-harness.mjs';

const evidence = fileURLToPath(new URL('../docs/validacao/evidencias/incremento-0.3.4/', import.meta.url));
const snapshot = page => page.evaluate(async () => {
  const local = await (await import('./storage.js')).loadLocal();
  return JSON.stringify({ state: local.state, queue: local.queue, generation: local.generation });
});

// Measure rendered foreground against the actual stack of backgrounds. Group
// opacity matters too: completed entries must remain readable as history.
async function contrast(page, selector, property = 'color') {
  return page.locator(selector).evaluateAll((nodes, property) => {
    const parse = value => {
      const values = value.match(/[\d.]+/g).map(Number);
      return [...values.slice(0, 3), values[3] ?? 1];
    };
    const over = (foreground, background) => {
      const alpha = foreground[3] + background[3] * (1 - foreground[3]);
      if (!alpha) return [0, 0, 0, 0];
      return [...foreground.slice(0, 3).map((v, i) => (v * foreground[3] + background[i] * background[3] * (1 - foreground[3])) / alpha), alpha];
    };
    const luminance = color => color.slice(0, 3).map(v => {
      v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
    }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
    return nodes.map(node => {
      const style = getComputedStyle(node);
      let ink = parse(style[property]), paper = property === 'outlineColor' ? [0, 0, 0, 0] : parse(style.backgroundColor);
      ink = over(ink, paper);
      for (let element = node; element; element = element.parentElement) {
        const current = getComputedStyle(element), opacity = Number(current.opacity);
        ink[3] *= opacity; paper[3] *= opacity;
        const behind = element.parentElement ? parse(getComputedStyle(element.parentElement).backgroundColor) : [255, 255, 255, 1];
        ink = over(ink, behind); paper = over(paper, behind);
      }
      const a = luminance(ink), b = luminance(paper);
      return { text: node.textContent.trim().slice(0, 80), ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05), foreground: ink, background: paper };
    });
  }, property);
}

async function checkText(page, selector, measurements, label) {
  const values = await contrast(page, selector);
  assert.ok(values.length, `${label}: expected visible content`);
  for (const value of values) assert.ok(value.ratio >= 4.5, `${label}: ${JSON.stringify(value)}`);
  measurements[label] = values;
}

async function market(page) {
  await page.locator('[data-action="menu"]').click();
  await page.locator('.drawer [data-nav="mercado"]').click();
  await page.locator('#view[data-section="mercado"]').waitFor();
}

test('Mercado: contraste em vazio, lista aberta/concluída, foco e leitura offline sem alterar dados', { timeout: 120000 }, async () => withApp(async ({ page, context, url }) => {
  const errors = [], measurements = {}, layouts = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mkdir(evidence, { recursive: true });
  await page.goto(url); await page.locator('h1').waitFor();
  await market(page);
  const emptyState = await snapshot(page);
  await checkText(page, '.market-intro h2, .market-intro p, .empty-state h2, .empty-state p', measurements, 'empty');
  await page.screenshot({ path: path.join(evidence, 'mercado-vazio-390.png'), fullPage: true, animations: 'disabled' });
  assert.equal(await snapshot(page), emptyState);

  await page.locator('#view [data-action="new-market"]').first().click();
  await page.locator('[data-form="market-create"] [name="name"]').fill('Lista de teste');
  await page.locator('[data-form="market-create"] [type="submit"]').click();
  await page.locator('.market-banner').waitFor();
  await checkText(page, '.market-banner h2, .market-banner p, .market-banner .chip, .market-total span, .market-total strong', measurements, 'emptyList');
  for (const name of ['Arroz de teste', 'Óleo de teste']) {
    await page.locator('[data-form="market-add"] [name="name"]').fill(name);
    await page.locator('[data-form="market-add"] [type="submit"]').click();
    await page.locator('.market-entry strong').filter({ hasText: name }).waitFor();
  }
  await page.locator('.market-entry').first().click();
  await page.locator('.market-entry.in-cart').waitFor();

  async function inspect(state) {
    await page.locator('#toast-root .toast').waitFor({ state: 'detached' });
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      await checkText(page, '.market-banner h2, .market-banner p, .market-banner .chip, .market-total span, .market-total strong, .market-entry strong, .market-entry small, .market-progress > span', measurements, `${state}-${width}`);
      const icon = await contrast(page, '.market-banner .big-icon');
      assert.ok(icon[0].ratio >= 3); measurements[`${state}-icon-${width}`] = icon;
      const check = await contrast(page, '.market-entry.in-cart .market-check');
      assert.ok(check[0].ratio >= 3); measurements[`${state}-check-${width}`] = check;
      const layout = await page.evaluate(() => ({ width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth + 1 }));
      assert.equal(layout.overflow, false); layouts.push({ state, ...layout });
      for (const box of await page.locator('#view button:not(:disabled), #view input').evaluateAll(nodes => nodes.map(node => ({ width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height })))) {
        assert.ok(box.width >= 44 && box.height >= 44, `${state}: touch target ${JSON.stringify(box)}`);
      }
      await page.screenshot({ path: path.join(evidence, `mercado-${state}-${width}.png`), fullPage: true, animations: 'disabled' });
    }
  }
  const opened = await snapshot(page);
  await inspect('aberto'); assert.equal(await snapshot(page), opened);
  await page.setViewportSize({ width: 390, height: 844 });
  const input = page.locator('[data-form="market-add"] input');
  await input.focus(); await page.keyboard.press('Tab');
  const focus = await page.locator('[data-form="market-add"] button').evaluate(node => {
    const style = getComputedStyle(node);
    return { active: document.activeElement === node, visible: node.matches(':focus-visible'), outline: style.outlineStyle, width: parseFloat(style.outlineWidth) };
  });
  assert.ok(focus.active && focus.visible && focus.outline !== 'none' && focus.width >= 2);
  const outline = await contrast(page, '[data-form="market-add"] button', 'outlineColor');
  assert.ok(outline[0].ratio >= 3); measurements.focus = outline;

  await page.locator('[data-action="close-market"]').click();
  await page.locator('[data-form="market-close"] [name="total"]').fill('35,00');
  await page.locator('[data-form="market-close"] [type="submit"]').click();
  await page.locator('.market-banner .chip').filter({ hasText: 'Concluída' }).waitFor();
  assert.equal(await page.locator('.market-entry:disabled').count(), 2);
  const closed = await snapshot(page);
  const financial = JSON.parse(closed).state;
  assert.equal(financial.purchases.length, 1); assert.equal(financial.payments.length, 0);
  assert.equal(financial.purchases[0].totalCents, 3500);
  await inspect('concluido'); assert.equal(await snapshot(page), closed);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); await page.locator('h1').waitFor();
  await context.setOffline(true); await page.reload(); await page.locator('h1').waitFor();
  await market(page);
  await checkText(page, '.market-banner h2, .market-banner p, .market-banner .chip, .market-entry strong, .market-entry small, .market-total strong', measurements, 'offline');
  assert.equal(await snapshot(page), closed);
  assert.deepEqual(errors, []);
  await writeFile(path.join(evidence, 'qa.json'), JSON.stringify({ release: '0.3.4', engine: 'Chromium', syntheticOnly: true, physicalS23: false, measurements, layouts, focus, offlineReload: true, visualChecksPreservedStateQueueGeneration: true, purchaseCents: 3500, payments: 0, errors }, null, 2) + '\n');
}));
