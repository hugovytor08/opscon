const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.CASA_PLAYWRIGHT_MODULE || 'C:/Users/hugov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CASA_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  const out = path.resolve('tmp/app_qa'); fs.mkdirSync(out, { recursive: true });
  const view = async (section) => {
    if (section === 'mercado') {
      await page.locator('[data-action="menu"]').first().click();
      await page.locator('.drawer [data-nav="mercado"]').click();
    } else await page.locator(`#mobile-nav [data-nav="${section}"]`).click();
    await page.waitForTimeout(80);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    if (overflow) errors.push(`${section}: horizontal overflow`);
    await page.screenshot({ path: path.join(out, `${section}.png`), fullPage: true });
    console.log(section, await page.locator('h1').first().innerText());
  };
  await page.goto(process.env.CASA_PREVIEW_URL || 'http://127.0.0.1:8766/', { waitUntil: 'networkidle' });
  await page.locator('h1').first().waitFor();
  if (await page.locator('#mobile-nav button').count() !== 5) errors.push('mobile tab count');
  for (const section of ['inicio','casa','compras','mercado','financas','projetos']) await view(section);

  await view('casa');
  await page.locator('[data-action="new-room"]').first().click();
  await page.locator('form[data-form="room-create"] [name="name"]').fill('Sala');
  await page.locator('form[data-form="room-create"] button[type="submit"]').click();
  await page.locator('.room-panel h2').getByText('Sala').waitFor();
  await page.locator('.room-panel [data-action="new-item"]').first().click();
  await page.locator('form[data-form="item-create"] [name="name"]').fill('Sofá');
  await page.locator('form[data-form="item-create"] [name="estimate"]').fill('3000,00');
  await page.locator('form[data-form="item-create"] button[type="submit"]').click();
  await page.locator('.detail-page h1').getByText('Sofá').waitFor();
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[data-nav="compras"]').last().click();
  await page.locator('[data-open-item]').first().click();
  await page.locator('.detail-page h1').getByText('Sofá').waitFor();

  await view('financas');
  await page.locator('[data-action="new-account"]').first().click();
  await page.locator('form[data-form="account-create"] [name="name"]').fill('Principal');
  await page.locator('form[data-form="account-create"] [name="openingBalance"]').fill('5000,00');
  await page.locator('form[data-form="account-create"] button[type="submit"]').click();
  await page.getByText('R$ 5.000,00').first().waitFor();

  await view('compras');
  await page.locator('[data-open-item]').first().click();
  await page.locator('[data-action="buy-item"]').click();
  await page.locator('form[data-form="purchase-create"] [name="total"]').fill('2700,00');
  await page.locator('form[data-form="purchase-create"] [name="installments"]').selectOption('3');
  await page.locator('form[data-form="purchase-create"] button[type="submit"]').click();
  await page.locator('.installment-card').first().waitFor();
  if (await page.locator('.installment-card').count() !== 3) errors.push('installment count');
  await page.locator('[data-pay]').first().click();
  await page.locator('form[data-form="payment-create"] [name="accountId"]').selectOption({ label: 'Principal' });
  await page.locator('form[data-form="payment-create"] button[type="submit"]').click();
  await view('financas');
  if (!(await page.locator('#view').innerText()).includes('R$ 4.100,00')) errors.push('balance after payment');

  await view('mercado');
  await page.locator('[data-action="new-market"]').first().click();
  await page.locator('form[data-form="market-create"] [name="name"]').fill('Semana');
  await page.locator('form[data-form="market-create"] button[type="submit"]').click();
  await page.locator('form[data-form="market-add"] [name="name"]').fill('Arroz');
  await page.locator('form[data-form="market-add"] button[type="submit"]').click();
  await page.locator('.market-entry').click();
  await page.locator('[data-action="close-market"]').click();
  await page.locator('form[data-form="market-close"] [name="total"]').fill('48,90');
  await page.locator('form[data-form="market-close"] [name="accountId"]').selectOption({ label: 'Principal' });
  await page.locator('form[data-form="market-close"] button[type="submit"]').click();
  await page.getByText('R$ 48,90').first().waitFor();
  await page.locator('[data-action="reuse-market"]').click();
  await page.locator('.market-entry').first().waitFor();

  await view('projetos');
  await page.locator('[data-action="new-project"]').first().click();
  await page.locator('form[data-form="project-create"] [name="name"]').fill('Fim de semana na serra');
  await page.locator('form[data-form="project-create"] button[type="submit"]').click();
  await page.locator('[data-action="new-task"]').first().click();
  await page.locator('form[data-form="task-create"] [name="title"]').fill('Pesquisar hospedagem');
  await page.locator('form[data-form="task-create"] button[type="submit"]').click();
  await page.locator('[data-task-toggle]').click();
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#mobile-nav [data-nav="projetos"]').click();
  await page.locator('[data-open-project]').first().click();
  if (!(await page.locator('#view').innerText()).includes('1 de 1 concluídas')) errors.push('project persistence');

  await page.locator('[data-action="menu"]').first().click();
  await page.locator('[data-action="settings"]').last().click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-action="export-backup"]').click();
  const download = await downloadPromise;
  if (!download.suggestedFilename().endsWith('.json')) errors.push('backup download');
  console.log('backup', download.suggestedFilename());

  const backupPath = path.join(out, 'saved-backup.json');
  await download.saveAs(backupPath);
  await page.locator('[data-action="close-overlay"]').last().click();
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('h1').first().waitFor();
  await page.locator('#mobile-nav [data-nav="compras"]').click();
  await page.locator('[data-action="new-item"]').first().click();
  await page.locator('form[data-form="item-create"] [name="name"]').fill('Offline novo');
  await page.locator('form[data-form="item-create"] button[type="submit"]').click();
  await page.locator('.detail-page h1').getByText('Offline novo').waitFor();
  await context.setOffline(false);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#mobile-nav [data-nav="compras"]').click();
  if (!(await page.locator('#view').innerText()).includes('Offline novo')) errors.push('offline item persistence');
  await page.locator('[data-action="menu"]').first().click();
  await page.locator('[data-action="settings"]').last().click();
  await page.locator('[data-action="restore-backup"]').click();
  await page.locator('form[data-form="backup-preview"] [name="file"]').setInputFiles(backupPath);
  await page.locator('form[data-form="backup-preview"] button[type="submit"]').click();
  await page.locator('[data-action="confirm-restore"]').click();
  await page.locator('#mobile-nav [data-nav="compras"]').click();
  if ((await page.locator('#view').innerText()).includes('Offline novo')) errors.push('backup restore did not replace');

  for (const width of [320, 360, 430, 768, 1536]) {
    await page.setViewportSize({ width, height: 900 });
    for (const section of ['inicio','casa','compras','mercado','financas','projetos']) {
      if (width >= 951) await page.locator(`#desktop-nav [data-nav="${section}"]`).click();
      else if (section === 'mercado') {
        await page.locator('[data-action="menu"]').first().click();
        await page.locator('.drawer [data-nav="mercado"]').click();
      } else await page.locator(`#mobile-nav [data-nav="${section}"]`).click();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      if (overflow) errors.push(`${width}/${section}: horizontal overflow`);
    }
    if (width === 1536) {
      await page.locator('#desktop-nav [data-nav="inicio"]').click();
      await page.screenshot({ path: path.join(out, 'desktop-inicio.png'), fullPage: true });
    }
  }

  await browser.close();
  console.log('errors', errors);
  if (errors.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
