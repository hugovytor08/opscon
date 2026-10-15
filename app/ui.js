import { renderDashboard } from './dashboard.js';
import { parseImportDraft, IMPORT_LIMITS } from './import-draft.js';
import { renderImportReview } from './import-review.js';
import { applyCommand, getSummary, getAccountBalance, getBenefitPlan } from './domain.js';
import { loadLocal, saveState, exportBackup, importBackup, restoreBackup } from './storage.js';
import { remoteConfig } from './config.js';
import { SupabaseClient } from './supabase.js';
import { SyncEngine } from './sync.js';
import { houseMap, readBindings, saveBindings } from './house-map.js';

const sections = { inicio: 'Início', casa: 'Casa', compras: 'Compras', mercado: 'Mercado', financas: 'Finanças', projetos: 'Projetos' };
const icons = { inicio: 'home', casa: 'house', compras: 'bag', mercado: 'basket', financas: 'chart', projetos: 'flag' };
const mobileSections = ['inicio', 'casa', 'compras', 'financas', 'projetos'];
const ui = { section: 'inicio', overlay: null, roomId: null, itemId: null, projectId: null, marketId: null, listTab: 'planned', houseMode: localStorage.getItem('casa-serena-house-mode') === 'lista' ? 'lista' : 'mapa', month: today().slice(0, 7), search: '', busy: false };
let state;
let local;
let remote;
let syncEngine;
let backupGeneration;
let remoteSetupError;
let noticeTimer;

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const svg = name => `<svg aria-hidden="true"><use href="#i-${name}"></use></svg>`;
const brl = cents => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((cents ?? 0) / 100);
function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
const formatDate = date => date ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)) : 'Sem data';
const monthLabel = month => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T12:00:00Z`));
const get = (collection, id) => (state[collection] ?? []).find(record => record.id === id);
const card = (body, extra = '') => `<section class="card ${extra}">${body}</section>`;
const chip = (label, tone = '') => `<span class="chip ${tone}">${esc(label)}</span>`;
const button = (label, action, klass = 'primary-button', attrs = '') => `<button type="button" class="${klass}" data-action="${action}" ${attrs}>${label}</button>`;
const heading = (title, subtitle, action = '') => `<div class="page-heading"><div><h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}</div>${action ? `<div class="head-actions">${action}</div>` : ''}</div>`;
const empty = (icon, title, text, action = '') => `<div class="empty-state"><span class="empty-icon">${svg(icon)}</span><h2>${title}</h2><p>${text}</p>${action}</div>`;
const field = (name, label, attrs = '') => `<label>${label}<input class="input" name="${name}" ${attrs}></label>`;
const moneyField = (name, label, value = '') => field(name, label, `inputmode="decimal" autocomplete="off" placeholder="0,00" value="${esc(value)}" required`);
const submitActions = (label = 'Salvar') => `<div class="modal-actions"><button type="button" class="outline-button" data-action="close-overlay">Cancelar</button><button type="submit" class="primary-button">${label}</button></div>`;

function centsFromInput(raw, { allowZero = false, allowNegative = false } = {}) {
  let value = String(raw ?? '').trim().replace(/\s|R\$/g, '');
  if (value.includes(',')) value = value.replace(/\./g, '').replace(',', '.');
  if (!/^-?\d+(\.\d{1,2})?$/.test(value)) throw new Error('Informe um valor válido, com até duas casas decimais.');
  const negative = value.startsWith('-');
  if (negative && !allowNegative) throw new Error('Este valor não pode ser negativo.');
  const [whole, fraction = ''] = value.replace('-', '').split('.');
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(result) || (!allowZero && result === 0)) throw new Error('Informe um valor maior que zero.');
  return negative ? -result : result;
}

function addMonthsClamped(date, offset) {
  const [year, month, day] = date.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 + offset, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, last));
  return target.toISOString().slice(0, 10);
}

function payable(obligation) {
  if (Number.isInteger(obligation.openCents)) return obligation.openCents;
  if (Number.isInteger(obligation.paidCents)) return Math.max(0, obligation.amountCents - obligation.paidCents);
  const applied = (state.payments ?? []).flatMap(payment => payment.allocations ?? []).filter(entry => entry.obligationId === obligation.id).reduce((sum, entry) => sum + entry.amountCents, 0);
  return Math.max(0, (obligation.amountCents ?? 0) - applied);
}

function obligationsOpen() { return (state.obligations ?? []).filter(obligation => payable(obligation) > 0).sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '')); }
function itemPurchase(itemId) { return (state.purchases ?? []).find(purchase => (purchase.lines ?? []).some(line => line.itemId === itemId)); }
function currentMarket() { return get('markets', ui.marketId) ?? [...(state.markets ?? [])].reverse().find(market => market.status !== 'closed') ?? [...(state.markets ?? [])].at(-1); }
const bankAccounts = () => state.accounts.filter(account => account.kind !== 'benefit');
const benefitAccounts = () => state.accounts.filter(account => account.kind === 'benefit');
function accountOptions(selected = '', kind = 'all') { return state.accounts.filter(a => kind === 'all' || (kind === 'bank' ? a.kind !== 'benefit' : a.kind === 'benefit')).map(account => `<option value="${esc(account.id)}" ${account.id === selected ? 'selected' : ''}>${esc(account.name)}${account.kind === 'benefit' ? ' · alimentação' : ''}</option>`).join(''); }
function locationOptions(selected = '') { return `<option value="">Sem cômodo</option>${(state.rooms ?? []).map(room => `<option value="${esc(room.id)}" ${room.id === selected ? 'selected' : ''}>${esc(room.name)}</option>`).join('')}`; }
function projectOptions(selected = '') { return `<option value="">Sem projeto</option>${(state.projects ?? []).map(project => `<option value="${esc(project.id)}" ${project.id === selected ? 'selected' : ''}>${esc(project.name)}</option>`).join('')}`; }
function accountSelect(name = 'accountId', kind = 'all') { return `<label>Conta<select class="input" name="${name}" required><option value="">Escolha a conta</option>${accountOptions('', kind)}</select></label>`; }
function purchasePaymentFields() {
  return `<label>Pagamento<select class="input" name="accountId"><option value="">Ainda não pago · ficará a pagar</option>${accountOptions()}${bankAccounts().length && benefitAccounts().length ? '<option value="split">Dividir: alimentação + conta bancária</option>' : ''}</select></label><div data-split-fields hidden></div>`;
}
function renderBenefitWallets() {
  return `<section class="card finance-card benefit-wallets"><div class="card-header"><h2>Cartão alimentação</h2>${button(benefitAccounts().length ? 'Outra carteira' : 'Cadastrar carteira', 'new-benefit', 'outline-button')}</div>${benefitAccounts().length ? benefitAccounts().map(account => {
    const plan = getBenefitPlan(state, account.id, ui.month);
    return `<div class="benefit-wallet" data-benefit-wallet="${esc(account.id)}"><div class="account-row"><strong>${esc(account.name)}</strong><strong>${brl(getAccountBalance(state, account.id))}</strong></div><p class="hint">Saldo disponível em alimentação · separado do dinheiro em conta.</p>${plan.income ? `<p>${chip('Recebimento confirmado')} ${brl(plan.income.amountCents)} · ${formatDate(plan.income.date)}</p>` : `<p>Previsto para ${formatDate(plan.expectedDate)}: <strong>${brl(plan.expectedCents)}</strong></p><p class="hint">A previsão não entra no saldo. Confirme somente depois de receber.</p>${button('Confirmar recebimento', 'confirm-benefit', 'soft-button', `data-account-id="${esc(account.id)}"`)}`}</div>`;
  }).join('') : '<p class="muted">Cadastre o saldo que você tem hoje. Os R$ 690 mensais serão apenas previstos até você confirmar o recebimento.</p>'}</section>`;
}

function renderNav() {
  $('#desktop-nav').innerHTML = Object.keys(sections).map(section => `<button type="button" class="nav-link ${ui.section === section ? 'active' : ''}" data-nav="${section}" ${ui.section === section ? 'aria-current="page"' : ''}>${svg(icons[section])}<span>${sections[section]}</span></button>`).join('');
  $('#mobile-nav').innerHTML = mobileSections.map(section => `<button type="button" class="${ui.section === section ? 'active' : ''}" data-nav="${section}" aria-label="${sections[section]}" ${ui.section === section ? 'aria-current="page"' : ''}>${svg(icons[section])}<span>${sections[section]}</span></button>`).join('');
  $('#desktop-utility').innerHTML = `<button class="utility-link" type="button" data-action="settings">${svg('info')} Dados e backup</button><span class="sidebar-caption">Casa Serena · seus registros</span>`;
}

function render(resetScroll = false) {
  renderNav();
  renderSyncStatus();
  $('#view').dataset.section = ui.section;
  const pages = { inicio: renderHome, casa: renderHouse, compras: renderShopping, mercado: renderMarket, financas: renderFinance, projetos: renderProjects };
  $('#view').innerHTML = pages[ui.section]();
  const mapScroll = $('.apartment-map-scroll');
  if (mapScroll && ui.mapScroll) { mapScroll.scrollLeft = ui.mapScroll.x; mapScroll.scrollTop = ui.mapScroll.y; }
  renderOverlay();
  if (resetScroll) window.scrollTo({ top: 0, behavior: 'instant' });
}

function syncMessage() {
  if (local?.sync.conflict) return 'Duas versões para revisar · envios interrompidos';
  const pending = local?.queue.length ?? 0;
  if (!remote) return remoteSetupError ?? `${pending ? `${pending} alterações locais · ` : ''}Nuvem ainda não configurada`;
  if (!remote.readSession()) return `${pending ? `${pending} alterações pendentes · ` : ''}Entre na sua conta`;
  if (!local?.sync.ownerId) return 'Exporte seu backup e vincule a conta';
  if (!navigator.onLine) return `Sem conexão · ${pending} alterações pendentes`;
  if (syncEngine?.error) return syncEngine.error.message;
  if (pending) return `${pending} alterações pendentes de confirmação`;
  if (!local?.sync.lastSyncedAt) return 'Nenhum envio confirmado ainda';
  return `Sincronizado · ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(local.sync.lastSyncedAt))}`;
}
function renderSyncStatus() {
  const status = $('#sync-status');
  status.textContent = syncMessage();
  status.dataset.status = local?.sync.conflict ? 'conflict' : syncEngine?.error || remoteSetupError ? 'error' : local?.queue.length ? 'pending' : local?.sync.lastSyncedAt ? 'synced' : 'local';
}
async function refreshLocal() {
  const latest = await loadLocal();
  if (local) local = { ...local, sync: latest.sync, queue: latest.queue };
  const editing = !!$('#overlay-root form') || ['restore-confirm', 'remote-confirm'].includes(ui.overlay);
  if (!ui.busy && !editing) {
    const changed = local?.generation !== latest.generation;
    state = latest.state; local = latest;
    if (changed) render();
    else if (ui.overlay === 'settings') renderOverlay();
  }
  renderSyncStatus();
}
function downloadBackup() {
  const blob = new Blob([exportBackup(state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = `meu-espaco-backup-${today()}.json`;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  backupGeneration = local?.generation;
}
function cloudControls() {
  if (!remote) return '<p class="hint">A configuração da conta remota está em preparação.</p>';
  const session = remote.readSession();
  if (!session && remote.config.authMode === 'password') return `<form data-form="auth-password" class="form-grid">${field('email', 'E-mail da sua conta', 'type="email" autocomplete="username" maxlength="254" required')}${field('password', 'Senha', 'type="password" autocomplete="current-password" maxlength="1024" required')}<p data-auth-error role="alert" tabindex="-1" hidden></p>${submitActions('Entrar')}</form>${button('Esqueci minha senha', 'auth-recover', 'text-button')}<p class="hint">Use a conta já cadastrada. O primeiro acesso precisa de conexão; os registros deste aparelho continuam disponíveis offline.</p>`;
  if (!session) return `<form data-form="auth-code" class="form-grid">${field('email', 'E-mail da sua conta', 'type="email" autocomplete="email" required')}${submitActions(remote.config.authMode === 'magic-link' ? 'Receber link de acesso' : 'Receber código')}</form>`;
  if (remote.hasPasswordRecovery()) return `<p>Seu acesso de recuperação está pronto.</p>${button('Definir nova senha', 'auth-reset')}${button('Sair da conta', 'sign-out', 'outline-button')}`;
  return `<p>Conta: <strong>${esc(session.user.email ?? '')}</strong></p>${!local?.sync.ownerId ? button('Vincular conta e recuperar dados', 'bind-cloud') : button('Sincronizar agora', 'sync-now')}${button('Sair da conta', 'sign-out', 'outline-button')}${local?.sync.conflict?.remote ? button('Revisar recuperação da nuvem', 'review-remote', 'outline-button') : ''}`;
}

function navigate(section) {
  if (!sections[section]) return;
  ui.section = section;
  ui.overlay = null;
  ui.itemId = null;
  ui.projectId = null;
  render(true);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) $('#view').animate([{ opacity: .4, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: 'ease-out' });
  $('#view').focus({ preventScroll: true });
  void refreshLocal().catch(error => toast(error.message, true));
}

function toast(message, isError = false) {
  const root = $('#toast-root');
  root.innerHTML = `<div class="toast ${isError ? 'error' : ''}">${isError ? svg('info') : svg('check')}${esc(message)}</div>`;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { root.innerHTML = ''; }, isError ? 6000 : 3500);
}

function renderHome() {
  return renderDashboard({ state, summary: getSummary(state),
    nextProject: state.projects.map(project => ({ project, task: state.tasks.find(task => task.projectId === project.id && !task.done) })).find(pair => pair.task),
    open: obligationsOpen().map(obligation => ({ ...obligation, openCents: payable(obligation) })),
    planned: state.items.filter(item => !itemPurchase(item.id)), missing: state.items.filter(item => !itemPurchase(item.id) && item.estimateCents == null),
    market: [...state.markets].reverse().find(entry => entry.status !== 'closed'),
    heading, card, button, svg, esc, brl, formatDate, purchaseLabel });
}

function renderHouse() {
  const rooms = state.rooms ?? [];
  const bindings = readBindings(state, local?.sync.ownerId);
  const visual = houseMap.regions.find(region => region.id === ui.visualRoomId);
  const selected = visual ? get('rooms', bindings[visual.id]) : get('rooms', ui.roomId) ?? rooms[0];
  const selectedVisual = visual?.id ?? Object.keys(bindings).find(id => bindings[id] === selected?.id);
  const items = selected ? (state.items ?? []).filter(item => item.roomId === selected.id) : [];
  const regions = houseMap.regions.map(region => {
    const label = `${region.number}. ${region.name}${bindings[region.id] ? ` · ${get('rooms', bindings[region.id])?.name}` : ' · Sem vínculo'}`;
    return `<g><polygon class="map-region ${selectedVisual === region.id ? 'is-selected' : ''}" points="${region.polygon.map(point => point.join(',')).join(' ')}" data-map-region="${region.id}" role="button" tabindex="0" aria-label="${esc(label)}" aria-pressed="${selectedVisual === region.id}"></polygon><g class="map-marker" transform="translate(${region.labelPosition.join(' ')})"><circle r="23"></circle><text text-anchor="middle" dominant-baseline="central">${region.number}</text></g></g>`;
  }).join('');
  const map = `<div class="apartment-map-scroll" tabindex="0" aria-label="Mapa do apartamento; use Ampliar para ver detalhes"><div class="apartment-map-canvas" style="width:${ui.mapZoom ? 200 : 100}%"><img class="apartment-map-image" src="./assets/apartamento-real/casa-isometrica.svg" alt="Isometria do apartamento reconstruída da planta e das fotos"><svg class="apartment-map-overlay" viewBox="${houseMap.viewBox.join(' ')}" aria-label="Ambientes do apartamento">${regions}</svg></div></div>`;
  const visualList = `<div class="map-room-list">${houseMap.regions.map(region => `<button type="button" class="map-room-choice ${selectedVisual === region.id ? 'active' : ''}" data-map-region="${region.id}" aria-pressed="${selectedVisual === region.id}"><strong>${region.number}. ${esc(region.name)}</strong><small>${bindings[region.id] ? esc(get('rooms', bindings[region.id])?.name) : 'Sem vínculo'}</small></button>`).join('')}</div>`;
  const roomList = rooms.length ? rooms.map(room => `<button type="button" class="room-list-card ${selected?.id === room.id ? 'active' : ''}" data-room="${esc(room.id)}"><span class="room-illustration">${svg('house')}</span><span><strong>${esc(room.name)}</strong><small>${(state.items ?? []).filter(item => item.roomId === room.id).length} itens</small></span>${svg('chevron')}</button>`).join('') : empty('house', 'A Casa começa por um cômodo', 'Crie um ambiente e organize seus itens sem precisar completar um cadastro longo.', button(`${svg('plus')} Criar cômodo`, 'new-room'));
  return `${heading('Minha casa', 'Organize cada ambiente.', button(`${svg('plus')} Cômodo`, 'new-room', 'outline-button'))}
    <div class="house-topline"><span>Uma casa, várias escolhas</span><div class="segmented"><button type="button" class="${ui.houseMode === 'mapa' ? 'active' : ''}" data-house-mode="mapa">Mapa</button><button type="button" class="${ui.houseMode === 'lista' ? 'active' : ''}" data-house-mode="lista">Lista</button></div></div>
    <div class="house-layout"><div>${ui.houseMode === 'mapa' && !ui.mapUnavailable ? card(`${map}<div class="map-toolbar"><button type="button" class="outline-button" data-map-zoom aria-pressed="${!!ui.mapZoom}">${ui.mapZoom ? 'Reduzir' : 'Ampliar'}</button>${button('Vincular ambientes', 'map-bindings', 'outline-button')}</div><p class="caption">Representação aproximada · dimensões e móveis estimados. Os móveis ilustrados não são itens cadastrados.</p>${visualList}<div class="room-tabs" aria-label="Cômodos cadastrados">${rooms.map(room => `<button type="button" class="${selected?.id === room.id ? 'active' : ''}" data-room="${esc(room.id)}">${esc(room.name)}</button>`).join('')}</div>`,'house-stage') : card(`${ui.mapUnavailable && ui.houseMode === 'mapa' ? '<p role="status">O mapa está indisponível. Continue pela lista de cômodos.</p>' : ''}<div class="room-list-grid">${roomList}</div>`,'card-pad')}</div>
    <div>${selected ? card(`<div class="card-header"><div><span class="eyebrow">Ambiente selecionado</span><h2>${esc(selected.name)}</h2></div><button type="button" class="soft-button" data-action="new-item" data-room-context="${esc(selected.id)}">${svg('plus')} Item</button></div><p class="muted">${items.length} ${items.length === 1 ? 'item organizado' : 'itens organizados'} neste cômodo.</p>${items.length ? items.map(item => itemRow(item)).join('') : empty('bag', 'Este cômodo está livre para começar', 'Guarde uma ideia para este ambiente ou continue por outra área.', `<button class="text-button" type="button" data-action="new-item" data-room-context="${esc(selected.id)}">Adicionar item ${svg('arrow')}</button>`)}`,'room-panel') : card(empty('house', visual ? esc(visual.name) : 'Seus cômodos aparecerão aqui', visual ? 'Este ambiente ainda não está vinculado a um cômodo cadastrado.' : 'Vincule os ambientes do mapa aos seus cômodos ou continue pela lista.', `${button('Vincular cômodo', 'map-bindings', 'outline-button')} ${button('Criar cômodo', 'new-room', 'outline-button')}`),'room-panel')}</div></div>`;
}

function itemRow(item) {
  const purchase = itemPurchase(item.id);
  return `<button type="button" class="room-item mobile-record" data-open-item="${esc(item.id)}"><span class="record-icon">${svg('bag')}</span><span class="main"><strong>${esc(item.name)}</strong><small>${purchase ? 'Adquirido' : item.estimateCents == null ? 'Sem preço' : `Estimativa ${brl(item.estimateCents)}`}</small></span>${svg('chevron')}</button>`;
}

function renderShopping() {
  if (ui.itemId && get('items', ui.itemId)) return renderItemDetail(get('items', ui.itemId));
  const items = (state.items ?? []).filter(item => Boolean(itemPurchase(item.id)) === (ui.listTab === 'acquired'));
  return `${heading('Compras', 'Desejos, escolhas e aquisições.', button(`${svg('plus')} Item`, 'new-item'))}
    <div class="segmented purchase-tabs"><button type="button" class="${ui.listTab === 'planned' ? 'active' : ''}" data-list-tab="planned">Por comprar</button><button type="button" class="${ui.listTab === 'acquired' ? 'active' : ''}" data-list-tab="acquired">Adquiridos</button></div>
    ${items.length ? `<div class="product-grid">${items.map(item => `<button type="button" class="product-list-card mobile-product" data-open-item="${esc(item.id)}"><span class="product-glyph">${svg('bag')}</span><span class="main"><strong>${esc(item.name)}</strong><small>${get('rooms', item.roomId)?.name ? `${esc(get('rooms', item.roomId).name)} · ` : ''}${itemPurchase(item.id) ? 'Adquirido' : 'Em pesquisa'}</small></span><span class="product-money">${itemPurchase(item.id) ? 'Ver compra' : item.estimateCents == null ? 'Sem preço' : brl(item.estimateCents)}</span>${svg('chevron')}</button>`).join('')}</div>` : card(empty('bag', ui.listTab === 'planned' ? 'Suas próximas escolhas começam aqui' : 'Nenhuma compra registrada', ui.listTab === 'planned' ? 'Salve o nome de um item. Preço e vínculos são opcionais.' : 'Quando registrar uma compra, ela aparecerá nesta área.', button(`${svg('plus')} Guardar item`, 'new-item')),'card-pad')}
    <div class="info-strip">${svg('info')} Planejar não altera seu saldo. Uma estimativa só vira compromisso ao registrar a compra.</div>`;
}

function renderItemDetail(item) {
  const purchase = itemPurchase(item.id);
  const obligations = purchase ? (state.obligations ?? []).filter(obligation => obligation.purchaseId === purchase.id) : [];
  return `<div class="detail-page"><button type="button" class="back-link" data-action="back-shopping">${svg('back')} Compras</button>
    ${heading(esc(item.name), get('rooms', item.roomId)?.name ? `Casa · ${esc(get('rooms', item.roomId).name)}` : 'Um registro do seu espaço', button(`${svg('edit')} Editar`, 'edit-item', 'outline-button'))}
    <div class="item-detail-hero"><span class="record-icon">${svg('bag')}</span><div><span class="eyebrow">${purchase ? 'Adquirido' : 'Em pesquisa'}</span><h2>${purchase ? brl(purchase.totalCents) : item.estimateCents == null ? 'Sem preço' : brl(item.estimateCents)}</h2><p>${purchase ? 'A compra e cada pagamento continuam separados.' : 'Uma ideia guardada não cria gasto nem obrigação.'}</p></div></div>
    ${purchase ? card(`<div class="card-header"><h2>Compra e parcelas</h2>${chip('Registrada')}</div><p class="muted">Comprado em ${formatDate(purchase.date)} · valor real ${brl(purchase.totalCents)}.</p>${obligations.map((obligation, index) => `<div class="installment-card"><span><strong>Parcela ${index + 1}/${obligations.length}</strong><small>Vence ${formatDate(obligation.dueDate)}</small></span><span><strong>${brl(payable(obligation))}</strong>${payable(obligation) ? `<button type="button" class="text-button" data-pay="${esc(obligation.id)}">Registrar pagamento</button>` : chip('Paga')}</span></div>`).join('')}`,'card-pad') : card(`<h2>Próxima etapa</h2><p class="muted">Quando a compra acontecer, registre o valor real e os vencimentos. Nenhum pagamento será presumido.</p>${button(`${svg('bag')} Registrar compra`, 'buy-item')}`,'card-pad')}
    ${!purchase && item.estimateCents == null ? `<div class="status-alert">${svg('info')} Preço ausente permanece desconhecido, não zero.</div>` : ''}</div>`;
}

function renderMarket() {
  const market = currentMarket();
  if (!market) return `${heading('Mercado', 'Uma lista ágil para cada ida às compras.', button(`${svg('plus')} Nova lista`, 'new-market'))}${button(`${svg('list')} Conferir JSON de documentos`, 'import-json', 'text-button')}
    <div class="market-intro">${svg('basket')}<div><h2>Comece pela lista, feche pelo total real.</h2><p>Marque os produtos no carrinho. A lista não altera suas finanças antes do fechamento.</p></div></div>
    ${card(empty('basket', 'Sua primeira lista está pronta para nascer', 'Adicione produtos sem precisar informar preço por unidade.', button(`${svg('plus')} Criar lista`, 'new-market')),'card-pad')}`;
  const closed = market.status === 'closed';
  const entries = market.entries ?? [];
  const inCart = entries.filter(entry => entry.inCart).length;
  const known = entries.reduce((sum, entry) => sum + (entry.estimateCents ?? 0) * (Number(entry.quantity) || 1), 0);
  const missing = entries.some(entry => entry.estimateCents == null);
  const linkedPurchase = get('purchases', market.purchaseId);
  const lastNames = [...new Set((state.markets ?? []).flatMap(list => list.entries ?? []).map(entry => entry.name))].filter(name => !entries.some(entry => entry.name.toLowerCase() === name.toLowerCase())).slice(-4).reverse();
  return `${heading('Mercado', 'Uma compra de cada vez.', button(`${svg('plus')} Lista`, 'new-market', 'outline-button'))}
    <div class="market-banner"><span class="big-icon">${svg('basket')}</span><div class="main"><h2>${esc(market.name)}</h2><p>${closed ? 'Compra concluída e guardada no histórico.' : `${inCart} de ${entries.length} produtos no carrinho`}</p></div>${chip(closed ? 'Concluída' : 'Em andamento', closed ? '' : 'blue')}</div>
    <div class="market-layout"><div>${card(`<div class="card-header"><h2>${closed ? 'Produtos desta compra' : 'Sua lista'}</h2>${chip(`${entries.length} itens`, 'gray')}</div>${!closed ? `<form data-form="market-add" class="market-inline-add"><input class="input" name="name" placeholder="Adicionar produto" aria-label="Nome do produto" maxlength="100" required><button class="primary-button" type="submit" aria-label="Adicionar produto">${svg('plus')}</button></form>` : ''}
      ${entries.length ? entries.map(entry => `<button type="button" class="market-entry ${entry.inCart ? 'in-cart' : ''}" data-market-toggle="${esc(entry.id)}" ${closed ? 'disabled' : ''}><span class="market-check">${entry.inCart ? svg('check') : ''}</span><span class="main"><strong>${esc(entry.name)}</strong><small>${esc(String(entry.quantity ?? 1))} ${Number(entry.quantity) === 1 ? 'unidade' : 'unidades'}${entry.estimateCents == null ? ' · sem preço' : ` · estimativa ${brl(entry.estimateCents)}`}</small></span></button>`).join('') : empty('basket', 'Adicione o primeiro produto', 'Você pode montar a lista durante a compra.')}
      `,'card-pad')}</div><div class="stack">${card(`<h2>${closed ? 'Total registrado' : 'Acompanhe sem complicar'}</h2><div class="market-progress"><div class="progress-track"><div class="progress-fill" style="width:${entries.length ? Math.round(inCart / entries.length * 100) : 0}%"></div></div><span>${inCart} no carrinho · ${entries.length - inCart} por pegar</span></div><div class="market-total"><span>${closed ? 'Valor real' : `Subtotal ${missing ? 'parcial' : 'estimado'}`}</span><strong>${closed ? brl(linkedPurchase?.totalCents ?? 0) : brl(known)}</strong></div><p class="muted small">${closed ? 'O valor foi registrado uma única vez.' : 'A estimativa não movimenta o saldo. Informe o valor real do caixa no fim.'}</p>${closed ? button(`Reutilizar produtos ${svg('arrow')}`, 'reuse-market') : button(`Fechar pelo total real ${svg('arrow')}`, 'close-market', 'primary-button', entries.length ? '' : 'disabled')}`,'card-pad')}
      ${!closed && lastNames.length ? card(`<h3>Adicionar novamente</h3><div class="chips">${lastNames.map(name => `<button class="soft-button frequent-chip" type="button" data-frequent="${esc(name)}">${svg('plus')} ${esc(name)}</button>`).join('')}</div>`,'card-pad') : ''}</div></div>`;
}

function renderFinance() {
  const summary = getSummary(state);
  const monthObligations = (state.obligations ?? []).filter(obligation => obligation.dueDate?.startsWith(ui.month) && payable(obligation) > 0);
  const openMonth = monthObligations.reduce((sum, obligation) => sum + payable(obligation), 0);
  const paidMonth = (state.payments ?? []).filter(payment => payment.date?.startsWith(ui.month)).reduce((sum, payment) => sum + payment.amountCents, 0);
  const monthControl = `<div class="month-switcher"><button type="button" data-month="-1" aria-label="Mês anterior">${svg('chevron')}</button><strong>${monthLabel(ui.month)}</strong><button type="button" data-month="1" aria-label="Próximo mês">${svg('chevron')}</button></div>`;
  const accountCard = summary.balanceCents == null
    ? `<div class="finance-metric balance"><span class="icon-disc blue">${svg('card')}</span><div><span>Saldo registrado</span><strong>Não informado</strong><small>Cadastre o saldo de uma conta para acompanhar suas finanças.</small></div>${button('Registrar saldo', 'new-account')}</div>`
    : `<div class="finance-metric balance"><span class="icon-disc blue">${svg('card')}</span><div><span>Dinheiro em contas</span><strong>${brl(summary.balanceCents)}</strong><small>${bankAccounts().length} conta(s) bancária(s) · alimentação separada</small></div></div>`;
  return `${heading('Finanças', 'Movimentos e compromissos em períodos claros.', monthControl)}
    <div class="finance-overview">${accountCard}<div class="finance-metric"><span class="icon-disc amber">${svg('clock')}</span><div><span>A pagar no mês</span><strong>${brl(openMonth)}</strong></div></div><div class="finance-metric"><span class="icon-disc">${svg('card')}</span><div><span>Pago no mês</span><strong>${brl(paidMonth)}</strong></div></div></div>
    ${summary.plannedHasUnknown ? `<div class="finance-warning">${svg('info')} Há itens planejados sem estimativa. Eles não entram nos valores confirmados.</div>` : ''}
    <div class="finance-action-row">${button(`${svg('plus')} Registrar movimentação`, 'new-finance')}${button('Nova conta', 'new-account', 'outline-button')}</div>
    ${renderBenefitWallets()}
    <div class="finance-lower">${card(`<div class="card-header"><h2>Próximos pagamentos</h2>${chip(String(monthObligations.length), 'gray')}</div>${monthObligations.length ? monthObligations.map(obligation => `<div class="finance-due"><span class="icon-disc amber">${svg('clock')}</span><div class="main"><strong>${esc(obligation.description ?? purchaseLabel(obligation.purchaseId))}</strong><small>${formatDate(obligation.dueDate)} · ${obligation.sequence ? `Parcela ${obligation.sequence}` : 'Compromisso'}</small></div><div class="right"><strong>${brl(payable(obligation))}</strong>${payable(obligation) ? `<button type="button" class="outline-button" data-pay="${esc(obligation.id)}">Confirmar pagamento</button>` : chip('Pago')}</div></div>`).join('') : empty('calendar', 'Sem vencimentos neste mês', 'Use as setas para consultar outros períodos.')}`,'finance-card')}
    <div class="stack">${card(`<h2>Contas</h2>${bankAccounts().length ? summary.accounts.filter(account => account.kind !== 'benefit').map(account => `<div class="account-row"><span>${svg('card')} ${esc(account.name)}</span><strong>${brl(account.balanceCents)}</strong></div>`).join('') : `<p class="muted">Seu saldo só aparecerá após cadastrar uma conta.</p>`}`,'finance-card')}
    ${card(`<h2>Movimentações no mês</h2>${recentMovements()}`,'finance-card')}</div></div>`;
}

function purchaseLabel(id) {
  const purchase = get('purchases', id);
  if (!purchase) return 'Pagamento pendente';
  if (purchase.source === 'market') return 'Mercado';
  if (purchase.source === 'expense') return purchase.description || 'Despesa';
  return purchase.lines?.[0]?.description || 'Compra';
}

function recentMovements() {
  const movements = [
    ...state.payments.map(entry => ({ ...entry, collection: 'payments', title: entry.description || 'Pagamento', signedCents: -entry.amountCents })),
    ...state.incomes.map(entry => ({ ...entry, collection: 'incomes', title: entry.benefitPeriod ? `Alimentação · ${entry.benefitPeriod}` : entry.description || 'Receita', signedCents: entry.amountCents })),
    ...state.transfers.map(entry => ({ ...entry, collection: 'transfers', title: `Transferência · ${get('accounts', entry.fromAccountId)?.name} → ${get('accounts', entry.toAccountId)?.name}`, signedCents: null })),
  ].filter(entry => entry.date.startsWith(ui.month)).sort((a, b) => b.date.localeCompare(a.date));
  return movements.length ? movements.map(entry => {
    const transfer = entry.collection === 'transfers';
    const accounts = transfer ? [entry.fromAccountId, entry.toAccountId] : [entry.accountId];
    const canReview = accounts.some(id => entry.date <= get('accounts', id).openingDate);
    const effect = transfer ? `Origem: ${entry.fromBalanceEffect === 'included' ? 'já incluída' : 'altera saldo'} · destino: ${entry.toBalanceEffect === 'included' ? 'já incluído' : 'altera saldo'}` : entry.balanceEffect === 'included' ? 'Já incluído no saldo informado' : 'Altera o saldo';
    return `<div class="movement-record" data-movement-id="${esc(entry.id)}"><div class="account-row"><span><small>Aconteceu em ${formatDate(entry.date)}</small><strong>${esc(entry.title)}</strong></span><strong>${transfer ? '' : entry.signedCents >= 0 ? '+' : '−'}${brl(entry.amountCents)}</strong></div><p class="hint">${esc(get('accounts', entry.accountId)?.name ?? '')} · ${esc(effect)}${entry.recordedAt ? ` · registrado em ${esc(new Date(entry.recordedAt).toLocaleString('pt-BR'))}` : ' · data de cadastro anterior não disponível'}</p>${canReview ? `<button type="button" class="text-button" data-review-effect="${esc(entry.id)}" data-collection="${entry.collection}">Revisar efeito no saldo</button>` : ''}</div>`;
  }).join('') : `<p class="muted">Nenhuma movimentação registrada neste mês.</p>`;
}

const balanceForms = ['income-create', 'expense-create', 'payment-create', 'transfer-create', 'market-close', 'effect-review', 'benefit-confirm'];
function updateBalanceReview(form) {
  if (!form || !balanceForms.includes(form.dataset.form)) return;
  const split = form.elements.accountId?.value === 'split';
  const splitRoot = form.querySelector('[data-split-fields]');
  if (splitRoot) {
    if (split && !splitRoot.innerHTML) splitRoot.innerHTML = `<label>Carteira alimentação<select class="input" name="benefitAccountId" required>${accountOptions('', 'benefit')}</select></label>${moneyField('benefitAmount', 'Valor no alimentação')}<label>Conta para o restante<select class="input" name="bankAccountId" required><option value="">Escolha a conta</option>${accountOptions('', 'bank')}</select></label><p data-split-remainder class="hint" role="status"></p>`;
    splitRoot.hidden = !split;
    splitRoot.querySelectorAll('input, select').forEach(input => { input.disabled = !split; });
  }
  let root = form.querySelector('[data-balance-review]');
  if (!root) { root = document.createElement('div'); root.dataset.balanceReview = ''; root.className = 'balance-review'; form.querySelector('.modal-actions').before(root); }
  const correcting = form.dataset.form === 'effect-review';
  const record = correcting ? get(ui.effectCollection, ui.effectRecordId) : null;
  const transfer = correcting ? ui.effectCollection === 'transfers' : form.dataset.form === 'transfer-create';
  const eventDate = correcting ? record.date : form.elements.date?.value;
  const entries = split ? [
    { account: get('accounts', form.elements.benefitAccountId?.value), field: 'benefitBalanceEffect', sign: -1, previous: 'apply' },
    { account: get('accounts', form.elements.bankAccountId?.value), field: 'bankBalanceEffect', sign: -1, previous: 'apply' },
  ] : transfer ? [
    { account: get('accounts', correcting ? record.fromAccountId : form.elements.fromAccountId.value), field: 'fromBalanceEffect', sign: -1, previous: record?.fromBalanceEffect ?? 'apply' },
    { account: get('accounts', correcting ? record.toAccountId : form.elements.toAccountId.value), field: 'toBalanceEffect', sign: 1, previous: record?.toBalanceEffect ?? 'apply' },
  ] : [{ account: get('accounts', correcting ? record.accountId : form.elements.accountId?.value), field: 'balanceEffect', sign: (correcting ? ui.effectCollection === 'incomes' : ['income-create', 'benefit-confirm'].includes(form.dataset.form)) ? 1 : -1, previous: record?.balanceEffect ?? 'apply' }];
  const context = JSON.stringify([eventDate, ...entries.map(entry => entry.account?.id)]);
  if (!correcting && ['expense-create', 'market-close'].includes(form.dataset.form) && !entries[0].account) {
    root.dataset.context = 'unpaid'; root.innerHTML = '<p class="hint">Pagamento não informado: a compra fica a pagar e nenhum saldo é alterado.</p>'; return;
  }
  if (transfer && entries[0].account && entries[0].account.id === entries[1].account?.id) {
    root.dataset.context = 'same-account'; root.innerHTML = '<p class="hint">Escolha contas diferentes para a origem e o destino.</p>'; return;
  }
  if (root.dataset.context !== context) {
    root.dataset.context = context;
    root.innerHTML = `<strong>Efeito no saldo</strong>${entries.map(({ account, field, previous }) => {
      if (!account || !eventDate) return '<p class="hint">Escolha a conta e a data para conferir o saldo antes de salvar.</p>';
      const canInclude = eventDate <= account.openingDate;
      const selected = correcting ? previous : eventDate === account.openingDate ? 'apply' : '';
      return `<fieldset><legend>${esc(account.name)}</legend><p class="hint">Saldo informado em ${formatDate(account.openingDate)}: ${brl(account.openingBalanceCents)}.</p>${canInclude ? `<label>Esse movimento já estava incluído nesse saldo?<select class="input" name="${field}" required><option value="" ${!selected ? 'selected' : ''}>Escolha como considerar</option><option value="apply" ${selected === 'apply' ? 'selected' : ''}>Ainda não estava incluído · altera o saldo</option><option value="included" ${selected === 'included' ? 'selected' : ''}>Já estava incluído · só histórico</option></select></label>` : `<input type="hidden" name="${field}" value="apply"><p class="hint">Movimento posterior ao saldo informado: altera o saldo.</p>`}<p class="balance-result" data-balance-result="${field}" role="status"></p></fieldset>`;
    }).join('')}`;
  }
  let amount;
  try { amount = correcting ? record.amountCents : centsFromInput(form.elements.amount?.value ?? form.elements.total?.value); } catch { amount = null; }
  let benefitAmount = null;
  if (split) {
    try { benefitAmount = centsFromInput(form.elements.benefitAmount.value); } catch { /* incomplete input */ }
    const valid = amount != null && benefitAmount != null && benefitAmount < amount;
    splitRoot.querySelector('[data-split-remainder]').textContent = valid ? `Alimentação ${brl(benefitAmount)} + conta ${brl(amount - benefitAmount)} = ${brl(amount)}.` : 'Informe uma parte positiva no alimentação, menor que o total. O restante será pago na conta escolhida.';
    form.elements.benefitAmount.setCustomValidity(benefitAmount != null && amount != null && !valid ? 'A parte do alimentação deve ser positiva e menor que o total.' : '');
  }
  for (const { account, field, sign, previous } of entries) {
    const output = root.querySelector(`[data-balance-result="${field}"]`);
    if (!output || !account) continue;
    const choice = form.elements[field]?.value;
    const part = split ? field === 'benefitBalanceEffect' ? benefitAmount : amount != null && benefitAmount != null ? amount - benefitAmount : null : amount;
    if (!choice || part == null || part <= 0 || (split && (benefitAmount == null || benefitAmount >= amount))) { output.textContent = 'Preencha o valor e escolha o efeito para conferir o resultado.'; continue; }
    const current = getAccountBalance(state, account.id);
    const delta = sign * part * ((choice === 'apply' ? 1 : 0) - (correcting && previous === 'apply' ? 1 : 0));
    if (!Number.isSafeInteger(current + delta)) { output.textContent = 'O resultado excede o limite de valor permitido.'; continue; }
    output.textContent = account.kind === 'benefit' && current + delta < 0 ? `Saldo alimentação insuficiente: disponível ${brl(current)}. Divida o pagamento ou confira o saldo e os recebimentos.` : `Saldo atual ${brl(current)} → após salvar ${brl(current + delta)}.${choice === 'included' ? ' O movimento fica no histórico.' : ''}`;
  }
}

function renderProjects() {
  if (ui.projectId && get('projects', ui.projectId)) return renderProjectDetail(get('projects', ui.projectId));
  const projects = state.projects ?? [];
  return `${heading('Projetos', 'Planos com próximos passos claros.', button(`${svg('plus')} Projeto`, 'new-project'))}
    ${projects.length ? `<div class="project-list">${projects.map(project => {
      const tasks = (state.tasks ?? []).filter(task => task.projectId === project.id);
      const done = tasks.filter(task => task.done).length;
      return `<button type="button" class="project-teaser" data-open-project="${esc(project.id)}"><span class="icon-disc">${svg('flag')}</span><span class="teaser-copy"><span class="eyebrow">Seu projeto</span><strong>${esc(project.name)}</strong><small>${done} de ${tasks.length} tarefas concluídas</small></span>${svg('arrow')}</button>`;
    }).join('')}</div>` : `<section class="project-cover project-empty"><span class="project-emblem" aria-hidden="true">${svg('flag')}</span><div class="cover-content"><h2>Seu próximo plano pode começar pequeno.</h2><p>Crie um projeto e acompanhe o que precisa acontecer, sem transformar estimativas em dívidas.</p>${button(`${svg('plus')} Criar projeto`, 'new-project')}</div></section>`}`;
}

function renderProjectDetail(project) {
  const tasks = (state.tasks ?? []).filter(task => task.projectId === project.id);
  const done = tasks.filter(task => task.done).length;
  const progress = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  const next = tasks.find(task => !task.done);
  return `<div class="detail-page"><button type="button" class="back-link" data-action="back-projects">${svg('back')} Projetos</button>${heading(esc(project.name), project.outcome ? `Resultado: ${esc(project.outcome)}` : 'Um plano em andamento')}
    <section class="project-cover"><span class="project-emblem" aria-hidden="true">${svg('flag')}</span><div class="cover-content">${chip('Projeto')}<h2>${esc(project.name)}</h2>${project.outcome ? `<p>${esc(project.outcome)}</p>` : ''}</div></section>
    <div class="project-grid"><div class="project-main">${card(`<span class="icon-disc">${svg('flag')}</span><div class="main"><span>Próxima ação</span><strong>${next ? esc(next.title) : tasks.length ? 'Tudo concluído por agora' : 'Adicione a primeira tarefa'}</strong></div>${button(next ? 'Ver tarefas' : 'Criar tarefa', next ? 'focus-tasks' : 'new-task')}`,'next-action')}
    ${card(`<div class="card-header"><h2>Planejamento</h2><span class="muted small">${done} de ${tasks.length} concluídas</span></div><div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>${tasks.length ? tasks.map(task => `<div class="task-row ${task.done ? 'done' : ''}"><button type="button" data-task-toggle="${esc(task.id)}" aria-label="${task.done ? 'Reabrir' : 'Concluir'} ${esc(task.title)}">${task.done ? svg('check') : ''}</button><span>${esc(task.title)}</span></div>`).join('') : `<p class="muted">Tarefas pequenas ajudam a tirar este plano do papel.</p>`}${button(`${svg('plus')} Tarefa`, 'new-task', 'text-button')}`,'task-card')}</div>
    <div class="project-side">${card(`<h2>Previsão do projeto</h2><div class="large-money">${project.estimateCents == null ? 'Não informada' : brl(project.estimateCents)}</div><p class="muted">Uma estimativa não cria pagamento ou dívida.</p>`,'project-cost')}</div></div></div>`;
}

function modal(title, content, wide = false) {
  return `<div class="overlay-backdrop" data-backdrop="true"><div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}" tabindex="-1"><div class="modal-header"><h2>${esc(title)}</h2><button type="button" class="icon-button" data-action="close-overlay" aria-label="Fechar">${svg('close')}</button></div>${content}</div></div>`;
}

function renderOverlay() {
  const root = $('#overlay-root');
  document.querySelectorAll('.main-shell, .sidebar, #mobile-nav').forEach(element => { element.inert = !!ui.overlay; });
  if (!ui.overlay) { root.innerHTML = ''; return; }
  const active = currentMarket();
  switch (ui.overlay) {
    case 'import-json':
      root.innerHTML = modal('Conferir documentos', `<form data-form="import-preview" class="form-grid"><p>Cole o JSON extraído no ChatGPT ou escolha o arquivo. A conferência é local e não grava registros.</p><label>JSON do lote<textarea class="input import-json-input" name="json" spellcheck="false" autocomplete="off" placeholder="Cole o objeto JSON aqui…" aria-describedby="import-error">${esc(ui.importRaw ?? '')}</textarea></label><label>Ou abrir arquivo JSON<input class="input" type="file" name="file" accept=".json,application/json"></label><p class="hint">Contrato casa-serena-import v1 · até 512 KiB, 20 documentos e 500 linhas. Campos desconhecidos permanecem pendentes.</p><p id="import-error" class="error-text" role="alert"></p>${submitActions('Conferir lote')}</form>`, true);
      break;
    case 'import-review':
      root.innerHTML = modal('Conferência do lote', renderImportReview(ui.importReview, { esc, brl, formatDate, button, svg }), true);
      break;
    case 'map-bindings': {
      const bindings = readBindings(state, local?.sync.ownerId);
      root.innerHTML = modal('Vincular ambientes do mapa', `<form data-form="map-bindings" class="form-grid"><p>Escolha qual cômodo cadastrado corresponde a cada ambiente. Nenhum cadastro será criado ou renomeado.</p>${houseMap.regions.map(region => `<label>${region.number}. ${esc(region.name)}<select class="input" name="${region.id}">${locationOptions(bindings[region.id])}</select></label>`).join('')}<p class="hint">Os vínculos ficam somente neste navegador. Ao trocar de aparelho ou restaurar dados de outra origem, confira e refaça os vínculos quando necessário.</p>${submitActions('Salvar vínculos')}</form>`);
      break;
    }
    case 'menu':
      root.innerHTML = `<div class="overlay-backdrop" data-backdrop="true"></div><aside class="drawer" tabindex="-1" role="dialog" aria-modal="true" aria-label="Menu de áreas"><button type="button" class="icon-button drawer-close" data-action="close-overlay" aria-label="Fechar menu">${svg('close')}</button><div class="brand"><span class="brand-mark">${svg('leaf')}</span>Meu espaço</div><button type="button" class="nav-link drawer-new" data-action="new">${svg('plus')} Novo registro</button>${Object.keys(sections).map(section => `<button type="button" class="nav-link ${ui.section === section ? 'active' : ''}" data-nav="${section}">${svg(icons[section])}${sections[section]}</button>`).join('')}<div class="drawer-bottom"><button type="button" class="utility-link" data-action="settings">${svg('info')} Dados e backup</button></div></aside>`;
      break;
    case 'new':
      root.innerHTML = modal('O que você quer fazer?', [
        ['spark', 'Guardar uma ideia', 'Só o nome é obrigatório', 'new-item'],
        ['basket', 'Montar lista de Mercado', 'Produtos e carrinho', 'new-market'],
        ['card', 'Registrar movimentação', 'Despesa, receita ou transferência', 'new-finance'],
        ['list', 'Conferir JSON de documentos', 'Prévia local, sem gravar registros', 'import-json'],
        ['flag', 'Criar projeto', 'Tarefas e próximos passos', 'new-project'],
      ].map(([icon, title, description, action]) => `<button type="button" class="choice-row" data-action="${action}"><span class="icon-disc">${svg(icon)}</span><span class="main"><strong>${title}</strong><small>${description}</small></span>${svg('chevron')}</button>`).join(''));
      break;
    case 'new-item':
      root.innerHTML = modal('Guardar item', `<form data-form="item-create" class="form-grid">${field('name', 'Nome do item', 'placeholder="Ex.: tênis para caminhar" maxlength="120" required autofocus')}${field('estimate', 'Estimativa (opcional)', 'inputmode="decimal" placeholder="0,00"')}<label>Cômodo<select class="input" name="roomId">${locationOptions(ui.contextRoomId)}</select></label><label>Projeto<select class="input" name="projectId">${projectOptions()}</select></label><p class="hint">Sem preço e sem vínculo também é válido. Guardar não cria gasto.</p>${submitActions('Guardar item')}</form>`);
      break;
    case 'edit-item': {
      const item = get('items', ui.itemId);
      root.innerHTML = modal('Completar item', `<form data-form="item-update" class="form-grid">${field('name', 'Nome', `value="${esc(item.name)}" maxlength="120" required`)}${field('estimate', 'Estimativa (opcional)', `inputmode="decimal" placeholder="0,00" value="${item.estimateCents == null ? '' : (item.estimateCents / 100).toFixed(2).replace('.', ',')}"`)}<label>Cômodo<select class="input" name="roomId">${locationOptions(item.roomId)}</select></label><label>Projeto<select class="input" name="projectId">${projectOptions(item.projectId)}</select></label>${itemPurchase(item.id) ? `<label class="check-label"><input type="checkbox" name="received" ${item.received ? 'checked' : ''}> Recebido</label><label class="check-label"><input type="checkbox" name="installed" ${item.installed ? 'checked' : ''}> Instalado</label>` : ''}${submitActions('Salvar alterações')}</form>`);
      break;
    }
    case 'new-room':
      root.innerHTML = modal('Criar cômodo', `<form data-form="room-create" class="form-grid">${field('name', 'Nome do cômodo', 'placeholder="Ex.: Sala" maxlength="80" required autofocus')}<p class="hint">Você poderá organizar itens pela lista mesmo sem usar o mapa.</p>${submitActions('Criar cômodo')}</form>`);
      break;
    case 'new-benefit':
    case 'new-account':
      root.innerHTML = modal(ui.overlay === 'new-benefit' ? 'Cadastrar cartão alimentação' : 'Registrar conta e saldo', `<form data-form="account-create" class="form-grid"><input type="hidden" name="kind" value="${ui.overlay === 'new-benefit' ? 'benefit' : 'bank'}">${field('name', 'Nome da conta', 'placeholder="Ex.: Conta principal" maxlength="80" required autofocus')}${moneyField('openingBalance', 'Saldo atual informado')}${field('openingDate', 'Data desse saldo', `type="date" value="${today()}" required`)}<p class="hint">${ui.overlay === 'new-benefit' ? 'Informe o saldo real, inclusive sobras anteriores. Use 0,00 se estiver zerado. A previsão de R$ 690 não será creditada automaticamente.' : 'Este valor é informado por você. O aplicativo não acessa seu banco.'}</p>${submitActions('Salvar conta')}</form>`);
      break;
    case 'confirm-benefit': {
      const account = get('accounts', ui.benefitAccountId);
      const plan = getBenefitPlan(state, account.id, ui.month);
      root.innerHTML = modal('Confirmar recebimento do alimentação', plan.income ? '<p>Este mês já foi confirmado.</p>' : `<form data-form="benefit-confirm" class="form-grid"><input type="hidden" name="accountId" value="${esc(account.id)}"><input type="hidden" name="benefitPeriod" value="${esc(ui.month)}"><p>${esc(account.name)} · competência ${monthLabel(ui.month)}</p>${moneyField('amount', 'Valor realmente recebido', (plan.expectedCents / 100).toFixed(2).replace('.', ','))}${field('date', 'Data real do recebimento', `type="date" value="${plan.expectedDate}" required`)}<p class="hint">Você pode ajustar a data e o valor. Confirme somente se o crédito já aconteceu. Não serão creditados outros meses.</p>${submitActions('Confirmar valor recebido')}</form>`);
      break;
    }
    case 'buy-item': {
      const item = get('items', ui.itemId);
      root.innerHTML = modal('Registrar compra', `<form data-form="purchase-create" class="form-grid"><p><strong>${esc(item.name)}</strong> · registre o valor real. A estimativa deixará de contar como planejado.</p>${moneyField('total', 'Valor final')}${field('date', 'Data da compra', `type="date" value="${today()}" required`)}<label>Parcelas<select class="input" name="installments">${Array.from({ length: 12 }, (_, index) => `<option value="${index + 1}">${index + 1}${index ? ' parcelas' : ' pagamento'}</option>`).join('')}</select></label>${field('firstDueDate', 'Primeiro vencimento', `type="date" value="${today()}" required`)}<p class="hint">Comprar cria compromisso. Confirme o pagamento separadamente, apenas quando ele acontecer.</p>${submitActions('Registrar compra')}</form>`);
      break;
    }
    case 'pay-obligation': {
      const obligation = get('obligations', ui.obligationId);
      root.innerHTML = modal('Confirmar pagamento ocorrido', `${(state.accounts ?? []).length ? `<form data-form="payment-create" class="form-grid"><p><strong>${esc(purchaseLabel(obligation.purchaseId))}</strong> · aberto ${brl(payable(obligation))}. Registre somente se o pagamento já aconteceu.</p>${moneyField('amount', 'Valor pago', (payable(obligation) / 100).toFixed(2).replace('.', ','))}${accountSelect()}${field('date', 'Data do pagamento', `type="date" value="${today()}" required`)}${submitActions('Confirmar pagamento')}</form>` : `${empty('card', 'Cadastre uma conta primeiro', 'A saída de dinheiro precisa indicar de qual saldo veio.', button('Registrar saldo', 'new-account'))}`}`);
      break;
    }
    case 'new-market':
      root.innerHTML = modal('Nova lista de Mercado', `<form data-form="market-create" class="form-grid">${field('name', 'Nome da lista', 'placeholder="Ex.: Compras da semana" maxlength="100"')}<p class="hint">A lista não cria despesa até você informar o total real no fechamento.</p>${submitActions('Criar lista')}</form>`);
      break;
    case 'close-market':
      root.innerHTML = modal('Fechar compra do Mercado', `<form data-form="market-close" class="form-grid"><p>Você marcou ${(active.entries ?? []).filter(entry => entry.inCart).length} de ${(active.entries ?? []).length} produtos. Informe o total real do caixa.</p>${moneyField('total', 'Total real da compra')}${field('date', 'Data da compra', `type="date" value="${today()}" required`)}${purchasePaymentFields()}<p class="hint">Uma única compra será criada. Escolha uma conta apenas se o valor já foi pago.</p>${submitActions('Confirmar compra')}</form>`);
      break;
    case 'new-project':
      root.innerHTML = modal('Criar projeto', `<form data-form="project-create" class="form-grid">${field('name', 'Nome do projeto', 'placeholder="Ex.: Fim de semana na serra" maxlength="120" required autofocus')}${field('outcome', 'Resultado desejado (opcional)', 'placeholder="Ex.: roteiro e reservas definidos" maxlength="240"')}${field('estimate', 'Previsão (opcional)', 'inputmode="decimal" placeholder="0,00"')}<p class="hint">Previsão de projeto não cria dívida.</p>${submitActions('Criar projeto')}</form>`);
      break;
    case 'new-task':
      root.innerHTML = modal('Nova tarefa', `<form data-form="task-create" class="form-grid">${field('title', 'Próxima ação', 'placeholder="Ex.: pesquisar hospedagem" maxlength="160" required autofocus')}<label>Projeto<select class="input" name="projectId" required><option value="">Escolha o projeto</option>${(state.projects ?? []).map(project => `<option value="${esc(project.id)}" ${project.id === ui.projectId ? 'selected' : ''}>${esc(project.name)}</option>`).join('')}</select></label>${submitActions('Adicionar tarefa')}</form>`);
      break;
    case 'new-finance':
      root.innerHTML = modal('Registrar movimentação', [
        ['card', 'Despesa', 'Valor e data informados por você', 'new-expense'],
        ['plus', 'Receita', 'Entrada confirmada na conta', 'new-income'],
        ['arrow', 'Transferência', 'Entre duas contas cadastradas', 'new-transfer'],
      ].map(([icon, title, description, action]) => `<button type="button" class="choice-row" data-action="${action}"><span class="icon-disc">${svg(icon)}</span><span class="main"><strong>${title}</strong><small>${description}</small></span>${svg('chevron')}</button>`).join(''));
      break;
    case 'new-expense':
      root.innerHTML = modal('Registrar despesa', `<form data-form="expense-create" class="form-grid">${field('description', 'Descrição', 'placeholder="Ex.: dentista" maxlength="160" required autofocus')}${moneyField('amount', 'Valor')}${field('date', 'Data', `type="date" value="${today()}" required`)}${purchasePaymentFields()}<p class="hint">Sem conta selecionada, o valor ficará a pagar. Não será registrado como pago automaticamente.</p>${submitActions('Registrar despesa')}</form>`);
      break;
    case 'new-income':
      root.innerHTML = modal('Registrar receita', `${bankAccounts().length ? `<form data-form="income-create" class="form-grid">${field('description', 'Descrição', 'placeholder="Ex.: salário" maxlength="160" required autofocus')}${moneyField('amount', 'Valor recebido')}${accountSelect('accountId', 'bank')}${field('date', 'Data do recebimento', `type="date" value="${today()}" required`)}${submitActions('Registrar receita')}</form>` : empty('card', 'Cadastre uma conta primeiro', 'A entrada precisa indicar em qual saldo foi recebida.', button('Registrar saldo', 'new-account'))}`);
      break;
    case 'new-transfer':
      root.innerHTML = modal('Registrar transferência', `${bankAccounts().length >= 2 ? `<form data-form="transfer-create" class="form-grid"><label>Origem<select class="input" name="fromAccountId" required><option value="">Escolha a conta</option>${accountOptions('', 'bank')}</select></label><label>Destino<select class="input" name="toAccountId" required><option value="">Escolha a conta</option>${accountOptions('', 'bank')}</select></label>${moneyField('amount', 'Valor transferido')}${field('date', 'Data', `type="date" value="${today()}" required`)}${submitActions('Registrar transferência')}</form>` : empty('card', 'São necessárias duas contas', 'Uma transferência move saldo entre contas, sem criar receita ou despesa.', button('Nova conta', 'new-account'))}`);
      break;
    case 'effect-review': {
      const record = get(ui.effectCollection, ui.effectRecordId);
      if (!record) { root.innerHTML = ''; break; }
      root.innerHTML = modal('Revisar efeito no saldo', `<form data-form="effect-review" class="form-grid"><p>Movimento de ${brl(record.amountCents)} em ${formatDate(record.date)}. Esta revisão muda apenas como ele participa do saldo; valores, datas e vínculos são preservados.</p>${field('reason', 'Motivo da revisão', 'maxlength="160" required')}${submitActions('Salvar revisão')}</form>`);
      break;
    }
    case 'search':
      root.innerHTML = modal('Buscar no meu espaço', `<input id="global-search" class="input" type="search" placeholder="Item, cômodo, Mercado, projeto..." aria-label="Termo de busca" value="${esc(ui.search)}"><div id="search-results" class="search-results"></div>`, true);
      renderSearchResults();
      break;
    case 'settings':
      root.innerHTML = modal('Dados e backup', `<div class="settings-panel"><p class="status-alert">${esc(syncMessage())}</p><p>Seu registro é salvo neste aparelho primeiro. Só a confirmação do servidor o torna recuperável em outro telefone. Se o telefone for perdido antes, alterações pendentes não estarão na nuvem.</p>${cloudControls()}<button type="button" class="choice-row" data-action="export-backup"><span class="icon-disc">${svg('box')}</span><span class="main"><strong>Exportar backup</strong><small>Arquivo JSON completo dos seus registros</small></span>${svg('arrow')}</button><button type="button" class="choice-row" data-action="restore-backup"><span class="icon-disc">${svg('list')}</span><span class="main"><strong>Restaurar backup</strong><small>Substituir dados deste aparelho após revisão</small></span>${svg('arrow')}</button><p class="hint">Guarde o JSON fora do telefone. Ele contém seus dados em texto legível. Sincronização pode propagar exclusões e não substitui essa cópia.</p>${button('Solicitar proteção do armazenamento local', 'persist-storage', 'outline-button')}</div>`);
      break;
    case 'auth-verify':
      root.innerHTML = modal('Entrar na sua conta', `<form data-form="auth-verify" class="form-grid"><p>Digite o código recebido em ${esc(ui.authEmail)}. Usar o mesmo e-mail em outro telefone recupera seus registros confirmados.</p>${field('code', 'Código do e-mail', 'inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,10}" required')}${submitActions('Entrar')}</form>`);
      break;
    case 'auth-link':
      root.innerHTML = modal('Confira seu e-mail', `<p>Se a conta estiver provisionada, um link de acesso será enviado para ${esc(ui.authEmail)}.</p><p>Abra esse link neste mesmo navegador. Ele só funciona uma vez. Se pedir outro link, use o mais recente.</p><p class="hint">Não compartilhe o link. Seus registros locais continuam preservados enquanto você entra.</p>${button('Voltar aos dados', 'settings', 'outline-button')}`);
      break;
    case 'auth-recover':
      root.innerHTML = modal('Recuperar senha', `<form data-form="auth-recover" class="form-grid"><p>Informe o e-mail da conta existente. O link será usado apenas para definir uma nova senha.</p>${field('email', 'E-mail da sua conta', `type="email" autocomplete="username" maxlength="254" value="${esc(ui.authEmail ?? '')}" required`)}<p data-auth-error role="alert" tabindex="-1" hidden></p>${submitActions('Enviar recuperação')}</form>`);
      break;
    case 'auth-recovery-sent':
      root.innerHTML = modal('Confira seu e-mail', `<p>Se o e-mail estiver cadastrado, você receberá as instruções para definir uma nova senha.</p><p>Abra o link mais recente neste mesmo navegador. Seus registros locais continuam preservados.</p>${button('Voltar ao acesso', 'settings', 'outline-button')}`);
      break;
    case 'auth-reset':
      root.innerHTML = modal('Definir nova senha', `<form data-form="auth-reset" class="form-grid"><p>Use pelo menos 8 caracteres. Depois você poderá entrar com e-mail e senha.</p>${field('password', 'Nova senha', 'type="password" autocomplete="new-password" minlength="8" maxlength="1024" required')}${field('confirmation', 'Repita a nova senha', 'type="password" autocomplete="new-password" minlength="8" maxlength="1024" required')}<p data-auth-error role="alert" tabindex="-1" hidden></p>${submitActions('Salvar nova senha')}</form>`);
      break;
    case 'auth-error':
      root.innerHTML = modal('Não foi possível entrar', `<p class="status-alert">${esc(ui.authError)}</p><p>${remote?.config.authMode === 'password' ? 'Volte ao acesso para entrar com e-mail e senha ou pedir a recuperação da senha.' : 'Solicite um novo link e abra apenas o e-mail mais recente, no mesmo navegador onde pediu acesso. O link só funciona uma vez.'}</p><p class="hint">Seus registros locais foram preservados. Não é necessário alterar as tabelas no Supabase.</p>${button('Voltar ao acesso', 'settings')}`);
      break;
    case 'remote-confirm':
      root.innerHTML = modal('Recuperar versão da nuvem', `<p>Há dados diferentes neste aparelho e na nuvem. O backup local deve ser guardado antes de continuar.</p><p class="status-alert">Esta ação substitui os dados locais pela versão atual da nuvem e remove a fila local. As alterações locais não serão mescladas.</p><div class="modal-actions">${button('Voltar', 'settings', 'outline-button')}${button('Confirmar recuperação da nuvem', 'accept-remote')}</div>`);
      break;
    case 'restore-backup':
      root.innerHTML = modal('Restaurar backup', `<form data-form="backup-preview" class="form-grid"><p>Escolha um arquivo de backup exportado por este aplicativo. Você verá um resumo antes de substituir os dados atuais.</p><label>Arquivo JSON<input class="input" type="file" name="file" accept=".json,application/json" required></label>${submitActions('Verificar arquivo')}</form>`);
      break;
    case 'restore-confirm': {
      const preview = importBackup(ui.pendingBackup);
      root.innerHTML = modal('Confirmar substituição', `<p>O backup contém <strong>${preview.items.length} itens</strong>, <strong>${preview.purchases.length} compras</strong>, <strong>${preview.markets.length} listas</strong> e <strong>${preview.projects.length} projetos</strong>.</p><p class="status-alert">${svg('info')} Os dados atuais deste navegador serão substituídos. Exporte um backup deles antes, se quiser guardá-los.</p><div class="modal-actions"><button type="button" class="outline-button" data-action="close-overlay">Cancelar</button><button type="button" class="primary-button" data-action="confirm-restore">Restaurar dados</button></div>`);
      break;
    }
    default: root.innerHTML = '';
  }
  updateBalanceReview(root.querySelector('form[data-form]'));
}

function renderSearchResults() {
  const query = ui.search.trim().toLocaleLowerCase('pt-BR');
  const records = [
    ...(state.items ?? []).map(record => ({ title: record.name, context: 'Compras', section: 'compras', id: record.id, kind: 'item' })),
    ...(state.rooms ?? []).map(record => ({ title: record.name, context: 'Casa', section: 'casa', id: record.id, kind: 'room' })),
    ...(state.markets ?? []).map(record => ({ title: record.name, context: 'Mercado', section: 'mercado', id: record.id, kind: 'market' })),
    ...(state.projects ?? []).map(record => ({ title: record.name, context: 'Projetos', section: 'projetos', id: record.id, kind: 'project' })),
    ...(state.accounts ?? []).map(record => ({ title: record.name, context: 'Finanças', section: 'financas', id: record.id, kind: 'account' })),
  ].filter(record => !query || `${record.title} ${record.context}`.toLocaleLowerCase('pt-BR').includes(query)).slice(0, 20);
  $('#search-results').innerHTML = records.length ? records.map(record => `<button type="button" class="search-result" data-search-kind="${record.kind}" data-search-id="${esc(record.id)}"><span class="icon-disc">${svg(icons[record.section])}</span><span><strong>${esc(record.title)}</strong><br><small>${record.context}</small></span>${svg('chevron')}</button>`).join('') : `<p class="muted">Nenhum registro encontrado.</p>`;
}

function openOverlay(name) {
  clearTimeout(noticeTimer);
  $('#toast-root').innerHTML = '';
  if (!ui.overlay) ui.overlayTrigger = document.activeElement;
  ui.overlay = name;
  renderOverlay();
  $('#overlay-root input[autofocus], #global-search, #overlay-root [role="dialog"]')?.focus();
}

function closeOverlay() {
  ui.overlay = null;
  ui.pendingBackup = null;
  ui.importRaw = null;
  ui.importReview = null;
  renderOverlay();
  if (ui.overlayTrigger?.isConnected) ui.overlayTrigger.focus({ preventScroll: true });
  void refreshLocal().catch(error => toast(error.message, true));
}

function operationKey(form) {
  if (form?.dataset.operationKey) return form.dataset.operationKey;
  const key = `ui-${crypto.randomUUID()}`;
  if (form) form.dataset.operationKey = key;
  return key;
}

async function commit(type, payload, form = null) {
  if (ui.busy) return false;
  ui.busy = true;
  if (form) form.querySelectorAll('button[type="submit"]').forEach(element => { element.disabled = true; });
  try {
    const next = applyCommand(state, { type, payload, idempotencyKey: operationKey(form), occurredAt: new Date().toISOString() });
    if (next !== state) await saveState(next, state.revision, local.generation);
    local = await loadLocal();
    state = local.state;
    backupGeneration = undefined;
    renderSyncStatus();
    void syncEngine?.run();
    return true;
  } catch (error) {
    toast(error.message || 'Não foi possível salvar. Confira os dados e tente de novo.', true);
    return false;
  } finally {
    ui.busy = false;
    if (form) form.querySelectorAll('button[type="submit"]').forEach(element => { element.disabled = false; });
  }
}

async function submitForm(form) {
  const kind = form.dataset.form;
  const authForm = kind.startsWith('auth-');
  if (authForm && ui.authBusy) return;
  if (authForm) { ui.authBusy = true; form.querySelector('[type="submit"]').disabled = true; }
  const data = new FormData(form);
  const value = key => String(data.get(key) ?? '').trim();
  const password = () => String(data.get('password') ?? '');
  let type, payload;
  try {
    switch (kind) {
      case 'auth-password':
        ui.authEmail = value('email');
        await remote.signInWithPassword(ui.authEmail, password(), local.sync.ownerId);
        openOverlay('settings'); renderSyncStatus();
        if (local.sync.ownerId) await syncEngine.run();
        return;
      case 'auth-recover':
        ui.authEmail = value('email');
        await remote.recoverPassword(ui.authEmail, `${location.origin}${location.pathname}`);
        openOverlay('auth-recovery-sent'); return;
      case 'auth-reset':
        if (password() !== String(data.get('confirmation') ?? '')) throw new Error('As senhas precisam ser iguais.');
        await remote.updatePassword(password());
        openOverlay('settings'); renderSyncStatus();
        toast('Nova senha salva.'); return;
      case 'import-preview': {
        const file = form.elements.file.files?.[0];
        if (file && value('json')) throw new Error('Escolha uma fonte: texto colado ou arquivo.');
        if (file && file.size > IMPORT_LIMITS.bytes) throw new Error('O limite é 512 KiB; divida o lote.');
        const raw = file ? await file.text() : value('json');
        const review = parseImportDraft(raw);
        ui.importRaw = raw; ui.importReview = review;
        openOverlay('import-review'); return;
      }
      case 'map-bindings': {
        const latest = await loadLocal();
        if (latest.generation !== local.generation) throw new Error('Os dados mudaram. Feche e abra os vínculos novamente.');
        saveBindings(Object.fromEntries(houseMap.regions.map(region => [region.id, value(region.id)])), latest.state, latest.sync.ownerId);
        state = latest.state; local = latest; ui.overlay = null; render(); toast('Vínculos salvos neste navegador'); return;
      }
      case 'auth-code':
        ui.authEmail = value('email');
        if (remote.config.authMode === 'magic-link') {
          await remote.sendLink(ui.authEmail, `${location.origin}${location.pathname}`);
          openOverlay('auth-link'); return;
        }
        await remote.sendCode(ui.authEmail);
        openOverlay('auth-verify');
        return;
      case 'auth-verify':
        await remote.verifyCode(ui.authEmail, value('code'));
        openOverlay('settings'); renderSyncStatus();
        if (local.sync.ownerId) await syncEngine.run();
        return;
      case 'quick-item':
      case 'item-create':
        type = 'item.create';
        payload = { name: value('name'), roomId: value('roomId') || ui.contextRoomId || null, projectId: value('projectId') || null, estimateCents: value('estimate') ? centsFromInput(value('estimate')) : null };
        break;
      case 'item-update': {
        const item = get('items', ui.itemId);
        type = 'item.update';
        payload = { itemId: item.id, changes: { name: value('name'), roomId: value('roomId') || null, projectId: value('projectId') || null, estimateCents: value('estimate') ? centsFromInput(value('estimate')) : null } };
        if (itemPurchase(item.id)) {
          payload.changes.received = data.has('received');
          payload.changes.installed = data.has('installed');
        }
        break;
      }
      case 'room-create': type = 'room.create'; payload = { name: value('name') }; break;
      case 'account-create': type = 'account.create'; payload = { kind: value('kind'), name: value('name'), openingBalanceCents: centsFromInput(value('openingBalance'), { allowZero: true, allowNegative: true }), openingDate: value('openingDate') }; break;
      case 'purchase-create': {
        const item = get('items', ui.itemId);
        const totalCents = centsFromInput(value('total'));
        const count = Number(value('installments'));
        type = 'purchase.record';
        payload = { date: value('date'), totalCents, description: item.name, lines: [{ itemId: item.id, description: item.name, amountCents: totalCents }], dueDates: Array.from({ length: count }, (_, index) => addMonthsClamped(value('firstDueDate'), index)) };
        break;
      }
      case 'payment-create':
        type = 'payment.record'; payload = { date: value('date'), accountId: value('accountId'), allocations: [{ obligationId: ui.obligationId, amountCents: centsFromInput(value('amount')) }], description: purchaseLabel(get('obligations', ui.obligationId)?.purchaseId) }; break;
      case 'market-create': type = 'market.create'; payload = { name: value('name') || undefined }; break;
      case 'market-add': type = 'market.addItem'; payload = { marketId: currentMarket().id, name: value('name') }; break;
      case 'market-close': type = 'market.close'; payload = { marketId: currentMarket().id, date: value('date'), totalCents: centsFromInput(value('total')), accountId: value('accountId') || null }; break;
      case 'project-create': type = 'project.create'; payload = { name: value('name'), outcome: value('outcome') || null, estimateCents: value('estimate') ? centsFromInput(value('estimate')) : null }; break;
      case 'task-create': type = 'task.create'; payload = { projectId: value('projectId'), title: value('title') }; break;
      case 'expense-create': type = 'expense.record'; payload = { date: value('date'), description: value('description'), amountCents: centsFromInput(value('amount')), accountId: value('accountId') || null }; break;
      case 'income-create': type = 'income.record'; payload = { date: value('date'), description: value('description'), amountCents: centsFromInput(value('amount')), accountId: value('accountId') }; break;
      case 'benefit-confirm': type = 'benefit.confirm'; payload = { accountId: value('accountId'), benefitPeriod: value('benefitPeriod'), description: `Alimentação · ${value('benefitPeriod')}`, date: value('date'), amountCents: centsFromInput(value('amount')) }; break;
      case 'transfer-create': type = 'transfer.record'; payload = { date: value('date'), fromAccountId: value('fromAccountId'), toAccountId: value('toAccountId'), amountCents: centsFromInput(value('amount')) }; break;
      case 'effect-review': type = 'balance-effect.update'; payload = { collection: ui.effectCollection, recordId: ui.effectRecordId, reason: value('reason') }; break;
      case 'backup-preview': {
        const file = form.elements.file.files?.[0];
        if (!file || file.size > 20_000_000) throw new Error('Escolha um backup JSON de até 20 MB.');
        const raw = await file.text();
        importBackup(raw);
        ui.pendingBackup = raw;
        openOverlay('restore-confirm');
        return;
      }
      default: return;
    }
    for (const field of ['balanceEffect', 'fromBalanceEffect', 'toBalanceEffect']) if (form.elements[field]) payload[field] = value(field);
    if (['market-close', 'expense-create'].includes(kind) && value('accountId') === 'split') {
      const total = payload.totalCents ?? payload.amountCents, part = centsFromInput(value('benefitAmount'));
      payload.accountId = null;
      delete payload.balanceEffect;
      payload.payments = [{ accountId: value('benefitAccountId'), amountCents: part, balanceEffect: value('benefitBalanceEffect') }, { accountId: value('bankAccountId'), amountCents: total - part, balanceEffect: value('bankBalanceEffect') }];
    }
  } catch (error) {
    if (kind === 'import-preview') {
      $('#import-error').textContent = error.message || 'Não foi possível conferir o JSON.';
      form.elements.json.setAttribute('aria-invalid', 'true');
      form.elements.json.focus();
      return;
    }
    const notice = authForm && form.querySelector('[data-auth-error]');
    if (notice) { notice.hidden = false; notice.className = 'status-alert'; notice.textContent = error.message; notice.focus(); }
    else toast(error.message || 'Confira os campos informados.', true);
    return;
  } finally {
    if (authForm) {
      ui.authBusy = false;
      form.querySelectorAll('input[type="password"]').forEach(input => { input.value = ''; });
      form.querySelectorAll('[type="submit"]').forEach(input => { input.disabled = false; });
    }
  }
  if (!await commit(type, payload, form)) return;
  ui.overlay = null;
  ui.contextRoomId = null;
  if (kind === 'item-create' || kind === 'quick-item') {
    ui.section = 'compras'; ui.itemId = state.items.at(-1)?.id; ui.listTab = 'planned';
  } else if (kind === 'room-create') {
    ui.section = 'casa'; ui.roomId = state.rooms.at(-1)?.id; ui.visualRoomId = null; ui.houseMode = 'lista';
  } else if (kind === 'market-create') {
    ui.section = 'mercado'; ui.marketId = state.markets.at(-1)?.id;
  } else if (kind === 'project-create') {
    ui.section = 'projetos'; ui.projectId = state.projects.at(-1)?.id;
  } else if (kind === 'account-create' || kind === 'payment-create' || kind === 'expense-create' || kind === 'income-create' || kind === 'transfer-create' || kind === 'effect-review' || kind === 'benefit-confirm') {
    ui.section = 'financas';
    if (payload.date) ui.month = payload.date.slice(0, 7);
  }
  render(true);
  $('#view').focus({ preventScroll: true });
  toast(kind === 'expense-create' ? (payload.accountId || payload.payments ? 'Despesa e pagamento salvos neste aparelho' : 'Despesa salva · continua a pagar') : kind === 'income-create' || kind === 'benefit-confirm' ? 'Recebimento salvo na conta escolhida' : 'Salvo neste aparelho');
}

async function handleAction(action, source = null) {
  if (action === 'retry') { location.reload(); return; }
  if (action === 'close-overlay') { closeOverlay(); return; }
  if (action === 'go-finance') { navigate('financas'); return; }
  if (action === 'back-shopping') { ui.itemId = null; render(true); return; }
  if (action === 'back-projects') { ui.projectId = null; render(true); return; }
  if (action === 'focus-tasks') { $('.task-card')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); return; }
  if (action === 'export-backup') {
    downloadBackup();
    toast('Backup gerado para download');
    return;
  }
  if (['bind-cloud', 'sync-now', 'sign-out', 'accept-remote', 'persist-storage', 'review-remote'].includes(action)) {
    if (ui.busy) return;
    ui.busy = true;
    try {
      if (action === 'review-remote') {
        if (backupGeneration !== local.generation) throw new Error('Exporte o backup desta cópia local antes de recuperar a nuvem.');
        openOverlay('remote-confirm'); return;
      }
      if (action === 'persist-storage') {
        const retained = await navigator.storage?.persist?.();
        toast(retained ? 'Armazenamento persistente concedido pelo navegador' : 'O navegador não concedeu proteção adicional. Mantenha sincronização e backup.');
        return;
      }
      if (action === 'bind-cloud') {
        if (state.revision > 0 && backupGeneration !== local.generation) throw new Error('Exporte seu backup local antes de vincular a conta.');
        await syncEngine.connect();
      }
      if (action === 'sync-now') await syncEngine.run();
      if (action === 'sign-out') {
        try { await remote.signOut(); }
        catch (error) {
          if (remote.readSession()) throw error;
          toast('Você saiu deste aparelho. A saída no servidor não pôde ser confirmada.');
        }
      }
      if (action === 'accept-remote') {
        if (backupGeneration !== local.generation) throw new Error('Exporte o backup local antes de confirmar.');
        await syncEngine.acceptRemote();
      }
      local = await loadLocal(); state = local.state;
      ui.overlay = 'settings'; render();
    } catch (error) { toast(error.message, true); }
    finally { ui.busy = false; }
    return;
  }
  if (action === 'confirm-restore') {
    if (!ui.pendingBackup || ui.busy) return;
    ui.busy = true;
    try {
      state = await restoreBackup(ui.pendingBackup, state.revision, local.generation);
      local = await loadLocal(); backupGeneration = undefined;
      void syncEngine?.run();
      ui.itemId = null; ui.projectId = null; ui.roomId = null; ui.marketId = null; ui.section = 'inicio';
      ui.overlay = null; ui.pendingBackup = null; render(true); toast('Backup restaurado neste aparelho');
    } catch (error) { toast(error.message || 'Não foi possível restaurar.', true); }
    finally { ui.busy = false; }
    return;
  }
  if (action === 'reuse-market') {
    const market = currentMarket();
    if (market && await commit('market.reuse', { marketId: market.id })) {
      ui.marketId = state.markets.at(-1)?.id; render(); toast('Nova lista criada sem copiar a compra anterior');
    }
    return;
  }
  if (action === 'new-task' && !(state.projects ?? []).length) { openOverlay('new-project'); return; }
  if (action === 'buy-item' && !get('items', ui.itemId)) return;
  if (action === 'edit-item' && !get('items', ui.itemId)) return;
  if (action === 'close-market' && (!currentMarket() || currentMarket().status !== 'open')) return;
  if (action === 'confirm-benefit') ui.benefitAccountId = source?.dataset.accountId;
  if (action === 'new-item') ui.contextRoomId = source?.dataset.roomContext ?? null;
  openOverlay(action);
}

document.addEventListener('click', async event => {
  const reviewEffect = event.target.closest('[data-review-effect]');
  if (reviewEffect) { ui.effectCollection = reviewEffect.dataset.collection; ui.effectRecordId = reviewEffect.dataset.reviewEffect; openOverlay('effect-review'); return; }
  const nav = event.target.closest('[data-nav]');
  if (nav) { navigate(nav.dataset.nav); return; }
  const room = event.target.closest('[data-room]');
  if (room) { ui.roomId = room.dataset.room; ui.visualRoomId = null; render(); return; }
  const mapRegion = event.target.closest('[data-map-region]');
  if (mapRegion) {
    ui.visualRoomId = mapRegion.dataset.mapRegion;
    ui.roomId = readBindings(state, local?.sync.ownerId)[ui.visualRoomId] ?? null;
    const keyboard = event.detail === 0;
    const selector = mapRegion.tagName.toLowerCase() === 'polygon' ? 'polygon' : 'button';
    render();
    if (keyboard) $(`${selector}[data-map-region="${ui.visualRoomId}"]`)?.focus({ preventScroll: true });
    return;
  }
  if (event.target.closest('[data-map-zoom]')) { ui.mapZoom = !ui.mapZoom; ui.mapScroll = null; render(); $('[data-map-zoom]')?.focus({ preventScroll: true }); return; }
  const mode = event.target.closest('[data-house-mode]');
  if (mode) { ui.houseMode = mode.dataset.houseMode; if (ui.houseMode === 'lista') ui.visualRoomId = null; localStorage.setItem('casa-serena-house-mode', ui.houseMode); render(); return; }
  const tab = event.target.closest('[data-list-tab]');
  if (tab) { ui.listTab = tab.dataset.listTab; render(); return; }
  const item = event.target.closest('[data-open-item]');
  if (item) { ui.section = 'compras'; ui.itemId = item.dataset.openItem; ui.overlay = null; render(true); return; }
  const project = event.target.closest('[data-open-project]');
  if (project) { ui.section = 'projetos'; ui.projectId = project.dataset.openProject; ui.overlay = null; render(true); return; }
  const pay = event.target.closest('[data-pay]');
  if (pay) { ui.obligationId = pay.dataset.pay; openOverlay('pay-obligation'); return; }
  const marketItem = event.target.closest('[data-market-toggle]');
  if (marketItem) {
    const market = currentMarket();
    const entry = market?.entries.find(value => value.id === marketItem.dataset.marketToggle);
    if (entry && await commit('market.toggle', { marketId: market.id, entryId: entry.id, inCart: !entry.inCart })) render();
    return;
  }
  const frequent = event.target.closest('[data-frequent]');
  if (frequent) {
    const market = currentMarket();
    if (market && await commit('market.addItem', { marketId: market.id, name: frequent.dataset.frequent })) { render(); toast('Produto adicionado à lista'); }
    return;
  }
  const task = event.target.closest('[data-task-toggle]');
  if (task) {
    const record = get('tasks', task.dataset.taskToggle);
    if (record && await commit('task.toggle', { taskId: record.id, done: !record.done })) render();
    return;
  }
  const month = event.target.closest('[data-month]');
  if (month) { ui.month = addMonthsClamped(`${ui.month}-01`, Number(month.dataset.month)).slice(0, 7); render(); return; }
  const result = event.target.closest('[data-search-kind]');
  if (result) {
    const { searchKind: kind, searchId: id } = result.dataset;
    ui.section = ({ item: 'compras', room: 'casa', market: 'mercado', project: 'projetos', account: 'financas' })[kind];
    if (kind === 'item') ui.itemId = id;
    if (kind === 'room') { ui.roomId = id; ui.visualRoomId = null; }
    if (kind === 'market') ui.marketId = id;
    if (kind === 'project') ui.projectId = id;
    ui.overlay = null; render(true);
    return;
  }
  const action = event.target.closest('[data-action]');
  if (action) { await handleAction(action.dataset.action, action); return; }
  if (event.target.dataset.backdrop === 'true') closeOverlay();
});

document.addEventListener('submit', event => {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  void submitForm(form);
});

document.addEventListener('input', event => {
  if (event.target.id === 'global-search') { ui.search = event.target.value; renderSearchResults(); }
  updateBalanceReview(event.target.closest('form[data-form]'));
});
document.addEventListener('change', event => updateBalanceReview(event.target.closest('form[data-form]')));

document.addEventListener('keydown', event => {
  if (ui.overlay && event.key === 'Tab') {
    const dialog = $('#overlay-root [role="dialog"]');
    const controls = [...(dialog?.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') ?? [])].filter(element => element.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (!first) { event.preventDefault(); dialog?.focus(); return; }
    if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !controls.includes(document.activeElement))) { event.preventDefault(); first.focus(); }
  }
  if (event.target.matches('polygon[data-map-region]') && ['Enter', ' '].includes(event.key)) { event.preventDefault(); event.target.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 })); return; }
  if (event.key === 'Escape' && ui.overlay) { closeOverlay(); return; }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openOverlay('search'); }
});

document.addEventListener('scroll', event => {
  if (event.target.matches?.('.apartment-map-scroll')) ui.mapScroll = { x: event.target.scrollLeft, y: event.target.scrollTop };
}, true);
document.addEventListener('error', event => {
  if (event.target.matches?.('.apartment-map-image') && !ui.mapUnavailable) { ui.mapUnavailable = true; render(); }
}, true);

async function boot() {
  $('#view').innerHTML = `<div class="loading-state">Abrindo seu espaço…</div>`;
  const callback = new URL(location.href);
  const callbackHash = new URLSearchParams(callback.hash.slice(1));
  const authCode = callback.searchParams.get('code');
  const failedLink = callback.searchParams.has('error') || callbackHash.has('error');
  if (authCode || failedLink) {
    const authKeys = ['code','error','error_code','error_description','access_token','refresh_token','token_type','expires_in','expires_at','sb'];
    const authHash = authKeys.some(key => callbackHash.has(key));
    for (const key of authKeys) { callback.searchParams.delete(key); callbackHash.delete(key); }
    if (authHash) callback.hash = callbackHash.toString() ? `#${callbackHash}` : '';
    history.replaceState(null, '', `${callback.pathname}${callback.search}${callback.hash}`);
  }
  try {
    local = await loadLocal(); state = local.state;
    if (remoteConfig.url || remoteConfig.publishableKey) {
      try {
        remote = new SupabaseClient(remoteConfig);
        syncEngine = new SyncEngine(remote, { onChange: refreshLocal });
        if (authCode) {
          try { await remote.exchangeCode(authCode, local.sync.ownerId); ui.overlay = remote.hasPasswordRecovery() ? 'auth-reset' : 'settings'; }
          catch (error) { ui.authError = error.message; }
        }
      } catch (error) { remoteSetupError = error.message; }
    }
    if (failedLink) ui.authError = 'O Supabase recusou o link: ele expirou, já foi usado ou é inválido.';
    if (!ui.overlay && remote?.hasPasswordRecovery()) ui.overlay = 'auth-reset';
    if (ui.authError) ui.overlay = 'auth-error';
    render();
    if (remoteSetupError) toast(remoteSetupError, true);
    if (remote?.readSession() && local.sync.ownerId) void syncEngine.run();
    window.addEventListener('online', () => { renderSyncStatus(); void syncEngine?.run(); });
    window.addEventListener('offline', renderSyncStatus);
    window.addEventListener('focus', () => { void refreshLocal(); void syncEngine?.run(); });
    setInterval(() => { if (!document.hidden && remote?.readSession() && local.sync.ownerId) void syncEngine.run(); }, 60000);
    if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
  } catch (error) {
    $('#view').innerHTML = card(empty('info', 'Não foi possível abrir seus dados', `${esc(error.message || 'O armazenamento local está indisponível.')} Seus registros não foram substituídos.`, `<button type="button" class="primary-button" data-action="retry">Tentar novamente</button>`), 'card-pad');
  }
}

void boot();
