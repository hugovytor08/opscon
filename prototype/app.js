(() => {
  'use strict';
  const names = {inicio:'Início',casa:'Casa',compras:'Compras',mercado:'Mercado',financas:'Finanças',projetos:'Projetos'};
  const icons = {inicio:'home',casa:'house',compras:'bag',mercado:'basket',financas:'chart',projetos:'flag'};
  const mobileSections = ['inicio','casa','compras','financas','projetos'];
  const state = {
    section:'inicio', overlay:null, room:'Sala', houseMode:'mapa', shoppingItem:'sofa', shoppingTab:'resumo', shoppingListTab:'adquiridos', alt:150,
    sofaPaid:900, balance:5000, lampBought:false, marketClosed:false, marketAmount:0, marketPurchases:[], marketListNumber:1, quickExpenses:[], marketItems:[
      {id:1,name:'Arroz',detail:'1 pacote · Grãos',estimate:null,section:'Despensa',cart:false},
      {id:2,name:'Leite',detail:'1 unidade · Laticínios',estimate:6,section:'Geladeira',cart:false},
      {id:3,name:'Banana',detail:'1 cacho · Hortifruti',estimate:8.5,section:'Hortifruti',cart:false},
    ], nextMarketId:4, finMonth:1, finTab:'visao', financeExpanded:false,
    tasks:[{id:1,text:'Escolher destino',done:true},{id:2,text:'Pesquisar hospedagem',done:false},{id:3,text:'Definir transporte',done:false}], nextTaskId:4,
    ideas:[], hero:'casa', toastTimer:null
  };
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const brl = (n) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:2}).format(n);
  const svg = (n,extra='') => `<svg ${extra} aria-hidden="true"><use href="#i-${n}"></use></svg>`;
  const asset = (kind,src,extra='') => `<div class="crop ${kind}-art ${extra}"><img src="assets/${src}" alt="" loading="lazy"></div>`;
  const chip = (text,kind='') => `<span class="chip ${kind}">${text}</span>`;
  const iconDisc = (name,kind='') => `<span class="icon-disc ${kind}">${svg(name)}</span>`;
  const card = (content,cls='') => `<section class="card ${cls}">${content}</section>`;
  const btn = (label,action,cls='primary-button',extra='') => `<button type="button" class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
  const heading = (title,subtitle,action='') => `<div class="page-heading"><div><h1>${title}</h1><p>${subtitle}</p></div>${action ? `<div class="head-actions">${action}</div>`:''}</div>`;
  const note = `<p class="bottom-note">Protótipo visual interativo · dados de demonstração · nenhuma informação é salva fora desta página.</p>`;
  const currentMarketCount = () => state.marketItems.filter(i=>i.cart).length;
  const knownMarketSum = () => state.marketItems.reduce((n,i)=>n+(i.estimate||0),0);
  const missingMarketPrices = () => state.marketItems.some(i=>i.estimate==null);
  const recordedMarket = () => state.marketPurchases.reduce((n,p)=>n+p.amount,0);
  const recordedExpenses = () => state.quickExpenses.reduce((n,p)=>n+p.amount,0);
  const acquired = () => 2700+(state.lampBought?state.alt:0)+recordedMarket()+recordedExpenses();
  const paid = () => state.sofaPaid+recordedMarket()+recordedExpenses();
  const open = () => acquired()-paid();

  function renderNav(){
    $('#desktop-nav').innerHTML = Object.keys(names).map(k=>`<button type="button" class="nav-link ${state.section===k?'active':''}" data-nav="${k}" ${state.section===k?'aria-current="page"':''}>${svg(icons[k])}<span>${names[k]}</span></button>`).join('');
    $('#mobile-nav').innerHTML = mobileSections.map(k=>`<button type="button" class="${state.section===k?'active':''}" data-nav="${k}" aria-label="${names[k]}" ${state.section===k?'aria-current="page"':''}>${svg(icons[k])}<span>${names[k]}</span></button>`).join('');
  }
  function render(preserve=true){
    const scrollY = window.scrollY;
    renderNav();
    const pages={inicio:renderHome,casa:renderHouse,compras:renderShopping,mercado:renderMarket,financas:renderFinance,projetos:renderProjects};
    $('#view').innerHTML=pages[state.section]()+note;
    renderOverlay();
    if(preserve) window.scrollTo(0,scrollY); else window.scrollTo({top:0,behavior:'instant'});
  }
  function navigate(section){state.section=section;state.overlay=null;render(false);}
  function toast(message){
    const el=$('#toast-root');el.innerHTML=`<div class="toast">${svg('check')}${esc(message)}</div>`;
    clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>{el.innerHTML=''},3500);
  }

  function renderHome(){
    const homeHero = state.hero==='casa'
      ? `<span class="hero-kicker">Organizar o apartamento · Sala</span><h2>Uma casa que ganha forma, uma escolha de cada vez.</h2><p>Compare a luminária da Sala e mantenha suas decisões no mesmo lugar.</p>${btn(`Retomar a Casa ${svg('arrow')}`,'go-house','primary-button hero-action')}`
      : `<span class="hero-kicker">Seu plano de viagem · Próxima ação</span><h2>A serra pode começar com um pequeno passo.</h2><p>Pesquise hospedagem e acompanhe o progresso, sem transformar a estimativa em dívida.</p>${btn(`Abrir projeto ${svg('arrow')}`,'go-project','primary-button hero-action')}`;
    const heroArt=state.hero==='casa'?asset('living','ref-inicio.png'):asset('mountain','ref-projetos.png');
    return `${heading('Seu próximo passo','Terça-feira, 29 de setembro de 2026',btn(`${svg('spark')} Trocar foco`,'change-hero','outline-button'))}
      <div class="home-top"><section class="home-hero">${heroArt}<div class="hero-copy">${homeHero}</div></section>
      ${card(`<h2>Guardar uma ideia</h2><p>Uma frase basta para começar. Complete detalhes quando fizer sentido.</p><form id="idea-form"><input class="input" name="idea" aria-label="Nome da ideia" placeholder="Ex.: luminária para a Sala" maxlength="80" required><button class="primary-button" type="submit">Salvar ideia ${svg('arrow')}</button></form><span class="quiet-note">Só o nome é obrigatório. Isso não cria gasto.</span>`,'idea-card')}</div>
      ${card(`<div class="stat-block">${iconDisc('bag')}<div><span>Custo adquirido</span><strong>${brl(acquired())}</strong></div></div><div class="stat-block">${iconDisc('card')}<div><span>Pago</span><strong>${brl(paid())}</strong></div></div><div class="stat-block">${iconDisc('clock','amber')}<div><span>A pagar</span><strong>${brl(open())}</strong></div></div>`,'stats-ribbon')}
      <div class="home-lower">${card(`<div class="card-header"><h2>Próximos vencimentos</h2>${btn(`Ver Finanças ${svg('arrow')}`,'go-finance','text-button')}</div>
        <div class="list-row">${iconDisc('card')}<div class="main"><strong>Sofá · parcela 2/3</strong><span class="sub">05 de outubro · Cartão</span></div><span class="amount">${state.sofaPaid>=1800?'Paga':brl(900)}</span></div>
        <div class="list-row">${iconDisc('card')}<div class="main"><strong>Sofá · parcela 3/3</strong><span class="sub">05 de novembro · Cartão</span></div><span class="amount">${brl(900)}</span></div>
        <button type="button" class="market-shortcut" data-nav="mercado">${iconDisc('basket')}<div class="main"><strong>Ir ao Mercado</strong><span>Continue sua lista antes de sair</span></div>${svg('arrow')}</button>`,'card-pad')}
      ${card(`<div class="card-header"><h2>Falta completar</h2>${chip('Sem pressa','gray')}</div>
        <div class="list-row">${iconDisc('spark','amber')}<div class="main"><strong>Luminária · Sem preço</strong><span class="sub">Um desejo para a Sala</span></div>${btn('Ver opções','go-lamp','text-button')}</div>
        <div class="list-row">${iconDisc('flag')}<div class="main"><strong>Fim de semana na serra</strong><span class="sub">Próxima ação: pesquisar hospedagem</span></div>${btn('Abrir','go-project','text-button')}</div>
        ${state.ideas.length?`<div class="divider"></div><h3>Ideias recentes</h3>${state.ideas.slice(-2).reverse().map(i=>`<div class="list-row">${iconDisc('spark')}<div class="main"><strong>${esc(i)}</strong><span class="sub">Sem preço · Ainda planejado</span></div></div>`).join('')}`:''}`,'card-pad')}</div>`;
  }

  function roomDetails(){
    if(state.room!=='Sala') return `${card(`<div class="card-header"><div><span class="eyebrow">Ambiente selecionado</span><h2 style="margin:5px 0 0">${state.room}</h2></div>${btn(`${svg('plus')} Novo item`,'new-idea','soft-button')}</div><div style="padding:35px 18px;text-align:center;background:#f8f9f4;border-radius:15px">${iconDisc('house')}<h3 style="margin:12px 0 5px">Um espaço para começar</h3><p class="muted small">Ainda não há itens neste ambiente. A Casa pode ser organizada aos poucos.</p></div>`,'room-panel')}`;
    return `${card(`<div class="card-header"><div><span class="eyebrow">Ambiente selecionado</span><h2 style="margin:5px 0 0">Sala</h2></div>${btn(`${svg('plus')} Novo item`,'new-idea','soft-button')}</div>
      <div class="room-kpis"><div class="room-kpi">${svg('bag')}<div><span>Adquirido</span><strong>${brl(2700+(state.lampBought?state.alt:0))}</strong></div></div><div class="room-kpi">${svg('card')}<div><span>Pago</span><strong>${brl(state.sofaPaid)}</strong></div></div><div class="room-kpi">${svg('clock')}<div><span>A pagar</span><strong>${brl(2700+ (state.lampBought?state.alt:0)-state.sofaPaid)}</strong></div></div><div class="room-kpi">${svg('info')}<div><span>Ainda planejado</span><strong>${state.lampBought?'R$ 0':'Parcial'}</strong></div></div></div>
      ${!state.lampBought?`<p class="status-alert" style="margin:16px 0 0">${svg('info')} 1 item sem preço · Projeção incompleta</p>`:''}
      <div class="divider"></div><h3>Itens da Sala</h3>
      <button type="button" class="room-item" data-action="go-sofa">${asset('sofa','ref-compras.png','thumb')}<div class="main"><h3>Sofá</h3><div class="chips">${chip('Recebido')}${chip(state.sofaPaid>=2700?'Pago':'Parcialmente pago','amber')}</div><div class="sub">3 × ${brl(900)} · ${brl(2700-state.sofaPaid)} em aberto</div></div>${svg('chevron')}</button>
      <button type="button" class="room-item" data-action="go-lamp">${asset('lamp','ref-compras.png','thumb')}<div class="main"><h3>Luminária</h3><div class="chips">${chip(state.lampBought?'Adquirida':'Em pesquisa','gray')}${!state.lampBought?chip('Sem preço','gray'):''}</div></div>${svg('chevron')}</button>`,'room-panel')}`;
  }
  function renderHouse(){
    const map = `${card(`<div class="house-visual">${asset('house','ref-casa.png')}
      <div class="house-map-pins"><button type="button" class="room-pin sala ${state.room==='Sala'?'active':''}" data-room="Sala">Sala</button><button type="button" class="room-pin quarto ${state.room==='Quarto'?'active':''}" data-room="Quarto">Quarto</button><button type="button" class="room-pin cozinha ${state.room==='Cozinha'?'active':''}" data-room="Cozinha">Cozinha</button></div></div>
      <p class="caption">Representação aproximada · Use a lista se preferir</p><div class="room-tabs">${['Sala','Cozinha','Quarto'].map(r=>`<button type="button" class="${state.room===r?'active':''}" data-room="${r}">${r}</button>`).join('')}</div>`,'house-stage')}`;
    const list = `${card(`<div class="room-list-grid">${['Sala','Cozinha','Quarto','Banheiro'].map(r=>`<button class="room-list-card ${state.room===r?'active':''}" type="button" data-room="${r}"><span class="room-illustration">${svg('house')}</span><span><strong>${r}</strong><small>${r==='Sala'?'2 itens · 1 compra':'Tudo pronto para organizar'}</small></span>${svg('chevron')}</button>`).join('')}</div><p class="quiet-note" style="margin:18px 0 0">A lista conserva todas as ações quando o mapa não está disponível.</p>`,'card-pad')}`;
    return `${heading('Minha casa','Organize cada ambiente, do jeito que for mais natural.',btn(`${svg('plus')} Novo cômodo`,'new-room','outline-button'))}
      <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;margin:-7px 0 17px"><span class="eyebrow">Um lugar, várias escolhas</span><div class="segmented"><button type="button" class="${state.houseMode==='mapa'?'active':''}" data-house-mode="mapa">Mapa</button><button type="button" class="${state.houseMode==='lista'?'active':''}" data-house-mode="lista">Lista</button></div></div>
      <div class="house-layout"><div>${state.houseMode==='mapa'?map:list}</div><div>${roomDetails()}</div></div>`;
  }

  function renderShopping(){
    const sofa = state.shoppingItem==='sofa';
    const head = sofa ? `${asset('sofa','ref-compras.png','product-art')}<div><span class="eyebrow">Sala · Organizar o apartamento</span><h2>Sofá</h2><p class="muted">Uma escolha feita. Agora, cada etapa continua clara.</p><div class="chips">${chip('Recebido')}${chip(state.sofaPaid>=2700?'Pago':'Parcialmente pago','amber')}</div></div>` : `${asset('lamp','ref-compras.png','product-art')}<div><span class="eyebrow">Sala · Próxima escolha</span><h2>Luminária</h2><p class="muted">Pesquise alternativas com calma. A intenção ainda não é uma compra.</p><div class="chips">${chip(state.lampBought?'Adquirida':'Em pesquisa','gray')}${!state.lampBought?chip('Sem preço','gray'):''}</div></div>`;
    const detail = sofa ? (state.shoppingTab==='resumo' ? `
      <div class="payment-state"><div>${svg('box')} Entrega: <strong>Recebido</strong></div><div>${svg('card')} Pagamento: <strong>${state.sofaPaid>=2700?'Pago':'Parcial'}</strong></div></div>
      <div class="money-grid"><div><span>Custo adquirido</span><strong>${brl(2700)}</strong></div><div><span>Pago</span><strong class="positive">${brl(state.sofaPaid)}</strong></div><div><span>A pagar</span><strong class="pending">${brl(2700-state.sofaPaid)}</strong></div></div>
      <div class="info-strip">${svg('info')} Estimativa original: ${brl(3000)} · fora do total ainda planejado.</div>
      <h3 style="margin:18px 0 8px">Parcelas · 3 × ${brl(900)}</h3><div class="installment-row header"><span>Parcela</span><span>Vencimento</span><span>Valor</span><span>Situação</span></div>
      ${[1,2,3].map((n)=>`<div class="installment-row"><span>${n}/3</span><span>05/${String(8+n).padStart(2,'0')}/2026</span><strong>${brl(900)}</strong>${chip(state.sofaPaid>=n*900?'Paga':'Pendente',state.sofaPaid>=n*900?'':'amber')}</div>`).join('')}
      <div class="detail-bottom">${btn(`${svg('card')} ${state.sofaPaid>=2700?'Ver pagamentos':'Confirmar pagamento'}`,'pay-sofa')}${btn('Ver Finanças','go-finance','text-button')}</div>` : state.shoppingTab==='alternativas' ? `<div class="info-strip">${svg('info')} A alternativa foi escolhida antes da aquisição. O valor real da compra foi ${brl(2700)}.</div><div class="alternative-card selected"><div><strong>Sofá de dois lugares</strong><div class="muted small">Referência pesquisada · Estimativa ${brl(3000)}</div></div>${chip('Histórico')}</div>` : `<div class="list-row">${iconDisc('search')}<div class="main"><strong>Desejo criado</strong><span class="sub">Estimativa inicial ${brl(3000)}</span></div></div><div class="list-row">${iconDisc('bag')}<div class="main"><strong>Compra registrada</strong><span class="sub">Valor real ${brl(2700)} · 3 parcelas</span></div></div><div class="list-row">${iconDisc('card')}<div class="main"><strong>Pagamento informado</strong><span class="sub">${brl(state.sofaPaid)} pago até agora</span></div></div>`) : (state.shoppingTab==='resumo' ? `
      <div class="payment-state"><div>${svg('search')} Pesquisa: <strong>${state.lampBought?'Concluída':'Em andamento'}</strong></div><div>${svg('card')} Pagamento: <strong>${state.lampBought?'Pendente':'Não iniciado'}</strong></div></div>
      <div class="money-grid"><div><span>Ainda planejado</span><strong>${state.lampBought?'R$ 0':'Parcial'}</strong></div><div><span>Adquirido</span><strong>${state.lampBought?brl(state.alt):'R$ 0'}</strong></div><div><span>Pago</span><strong>R$ 0</strong></div></div><div class="info-strip">${svg('info')} Preço ausente não é zero. Escolher uma referência ajuda a planejar, sem criar dívida.</div>
      <div class="detail-bottom">${btn(`${svg('spark')} Ver alternativas`,'see-alternatives')}${state.lampBought?'':btn('Registrar compra','buy-lamp','outline-button')}</div>` : state.shoppingTab==='alternativas' ? `<p class="muted small">Compare possibilidades. A selecionada será uma estimativa de referência, sem mudar o caixa.</p>${[150,180].map((v,i)=>`<button type="button" class="alternative-card ${state.alt===v?'selected':''}" data-alt="${v}"><div><strong>${i===0?'Luminária de piso sálvia':'Luminária de madeira clara'}</strong><div class="muted small">${i===0?'Luz suave para a Sala':'Madeira natural · iluminação quente'}</div></div><strong>${brl(v)}</strong></button>`).join('')}<div class="detail-bottom">${btn(`${svg('bag')} Registrar compra`,'buy-lamp')}${chip(`Referência: ${brl(state.alt)}`)}</div>` : `<div class="list-row">${iconDisc('spark')}<div class="main"><strong>Ideia guardada</strong><span class="sub">Sem preço e sem obrigação</span></div></div>${state.lampBought?`<div class="list-row">${iconDisc('bag')}<div class="main"><strong>Compra registrada</strong><span class="sub">${brl(state.alt)} · pagamento pendente</span></div></div>`:''}`);
    return `${heading('Compras','O que você deseja, pesquisa e já trouxe para a sua vida.',btn(`${svg('plus')} Novo item`,'new-idea'))}
      <div class="shopping-layout">${card(`<div class="segmented"><button type="button" class="${state.shoppingListTab==='por-comprar'?'active':''}" data-shopping-list-tab="por-comprar">Por comprar</button><button type="button" class="${state.shoppingListTab==='adquiridos'?'active':''}" data-shopping-list-tab="adquiridos">Adquiridos</button></div><div class="filter-line"><button class="active" type="button">Todos</button><button type="button" data-action="filter-sala">Casa</button><button type="button" data-action="filter-life">Vida pessoal</button></div><span class="eyebrow" style="margin:0 0 10px">${state.shoppingListTab==='por-comprar'?'Em pesquisa':'Seus registros'}</span>
      <button type="button" class="product-list-card ${!sofa?'active':''}" data-item="lamp">${asset('lamp','ref-compras.png','thumb')}<span class="main"><strong>Luminária</strong><small>${state.lampBought?'Adquirida':'Em pesquisa · Sem preço'}</small></span>${svg('chevron')}</button>
      <button type="button" class="product-list-card ${sofa?'active':''}" data-item="sofa">${asset('sofa','ref-compras.png','thumb')}<span class="main"><strong>Sofá</strong><small>Recebido · ${state.sofaPaid>=2700?'Pago':'Parcialmente pago'}</small></span>${svg('chevron')}</button>
      <div class="divider"></div><p class="muted small">Tênis, viagens, saúde e outros assuntos podem entrar aqui sem vínculo com a Casa.</p>`,'shopping-list')}
      ${card(`<div class="product-head">${head}</div><div class="detail-tabs">${['resumo','alternativas','historico'].map(t=>`<button type="button" class="${state.shoppingTab===t?'active':''}" data-shopping-tab="${t}">${t==='resumo'?'Resumo':t==='alternativas'?'Alternativas':'Histórico'}</button>`).join('')}</div>${detail}`,'shopping-detail')}</div>`;
  }

  function renderMarket(){
    const count=currentMarketCount(), total=state.marketItems.length, percentage=total?Math.round(count/total*100):0;
    const sections=[...new Set(state.marketItems.map(i=>i.section))];
    return `${heading('Mercado','Uma lista leve para acompanhar a compra de verdade.',btn(`${svg('plus')} ${state.marketClosed?'Reutilizar lista':'Nova lista'}`,'new-market-list','outline-button'))}
      <div class="market-banner"><div class="big-icon">${svg('basket')}</div><div class="main"><h2>Lista ${state.marketListNumber} · ${state.marketClosed?'compra concluída':'em andamento'}</h2><p>Adicione rápido, marque no carrinho e feche pelo valor real do caixa.</p></div>${chip(state.marketClosed?'Compra fechada':'Em andamento',state.marketClosed?'':'blue')}</div>
      <div class="market-layout">${card(`<div class="card-header"><h2>${state.marketClosed?'O que foi comprado':'O que falta pegar'}</h2><span class="muted small">${count} de ${total} no carrinho</span></div><form id="market-add" class="add-product"><input name="product" type="text" placeholder="Adicionar produto..." aria-label="Adicionar produto" maxlength="60" ${state.marketClosed?'disabled':''} required><button class="primary-button" type="submit" aria-label="Adicionar produto" ${state.marketClosed?'disabled':''}>${svg('plus')}</button></form>
      ${sections.map(section=>`<div class="market-section-label"><span>${esc(section)}</span><span>${state.marketItems.filter(i=>i.section===section).length} itens</span></div>${state.marketItems.filter(i=>i.section===section).map(i=>`<div class="grocery-row ${i.cart?'in-cart':''}"><button type="button" class="grocery-check" data-market-toggle="${i.id}" aria-label="${i.cart?'Tirar':'Colocar'} ${esc(i.name)} ${i.cart?'do':'no'} carrinho">${i.cart?svg('check'):''}</button><div class="main"><strong>${esc(i.name)}</strong><small>${esc(i.detail)}</small></div><span class="est">${i.estimate==null?'Sem preço':brl(i.estimate)}</span></div>`).join('')}`).join('')}
      <p class="quiet-note" style="margin:18px 0 0">${state.marketClosed?'Histórico preservado. Reutilizar cria uma lista nova com outros IDs.':'Marcar um item não cria gasto nem altera saldo.'}</p>`,'market-list')}
      <div class="market-side">${card(`<div class="progress-ring" style="--progress:${percentage}%"><strong>${percentage}%</strong></div><h3>Sua ida ao mercado</h3><p class="muted small">${count} produto${count===1?'':'s'} no carrinho</p><div class="market-total"><span class="muted small">${state.marketClosed?'Total real confirmado':'Subtotal estimado conhecido'}</span><strong>${brl(state.marketClosed?state.marketAmount:knownMarketSum())}</strong><small>${state.marketClosed?'Uma compra, ligada à lista':missingMarketPrices()?'Parcial · há produtos sem preço':'Estimativa completa · total real no caixa'}</small></div>${state.marketClosed?btn(`${svg('arrow')} Ver em Finanças`,'go-finance'):btn(`${svg('arrow')} Finalizar compra`,'finish-market')}`,'card market-progress')}
      ${card(`<div class="card-header"><h3>Produtos frequentes</h3>${svg('spark')}</div><p class="muted small">Toque para acrescentar à lista.</p>${['Ovos','Café','Pão','Tomate'].map(n=>`<button type="button" class="frequent-item" data-frequent="${n}">+ ${n}</button>`).join('')}`,'frequent-card')}</div></div>`;
  }

  function financeMonthData(){
    const months=['Setembro 2026','Outubro 2026','Novembro 2026'];
    const selected=state.finMonth;
    const due= selected===0?0:selected===1?(state.sofaPaid>=1800?0:900):(state.sofaPaid>=2700?0:900);
    const monthPaid= selected===0?900+recordedMarket()+recordedExpenses():selected===1?(state.sofaPaid>=1800?900:0):(state.sofaPaid>=2700?900:0);
    return {name:months[selected],due,monthPaid};
  }
  function renderFinance(){
    const m=financeMonthData();
    const bars=[46,74,61,82,64,51];
    return `${heading('Finanças','Seu dinheiro, seus compromissos e o momento de cada movimento.',`<div class="month-switcher"><button type="button" data-month="-1" aria-label="Mês anterior">${svg('chevron')}</button><strong>${m.name}</strong><button type="button" data-month="1" aria-label="Próximo mês">${svg('chevron')}</button></div>`)}
      <div class="finance-tabs">${[['visao','Visão do mês'],['contas','Contas'],['cartoes','Cartões e faturas'],['recorrencias','Recorrências']].map(([k,n])=>`<button type="button" class="${state.finTab===k?'active':''}" data-fin-tab="${k}">${n}</button>`).join('')}</div>
      <div class="finance-overview">${card(`${iconDisc('card','blue')}<div><h3>Saldo confirmado da conta</h3><strong>${brl(state.balance)}</strong><small>Valor demonstrativo · movimentos informados</small></div>`,'finance-metric balance')}
      ${card(`${iconDisc('clock','amber')}<div><h3>A pagar em ${m.name.split(' ')[0]}</h3><strong class="pending">${brl(m.due)}</strong><small>Parcelas com vencimento no período</small></div>`,'finance-metric')}
      ${card(`${iconDisc('check')}<div><h3>Pago no período</h3><strong class="positive">${brl(m.monthPaid)}</strong><small>Saídas confirmadas na demonstração</small></div>`,'finance-metric')}</div>
      <div class="finance-lower">${card(`<div class="card-header"><h2>${state.finTab==='visao'?'Próximos pagamentos':state.finTab==='contas'?'Movimentos da conta':state.finTab==='cartoes'?'Fatura do cartão':'Ocorrências previstas'}</h2>${chip(m.name,'blue')}</div>
      ${state.finTab==='recorrencias'?`<div class="timeline-entry"><div class="timeline-date">15</div><div class="main"><strong>Conta fixa prevista</strong><span>Previsão · não é pagamento</span></div><div class="right"><strong>${brl(100)}</strong></div></div>`:
      `<div class="timeline-entry"><div class="timeline-date">05</div><div class="main"><strong>Sofá · parcela 2/3</strong><span>Outubro · ${state.sofaPaid>=1800?'Pagamento informado':'Pendente'}</span></div><div class="right"><strong>${brl(900)}</strong>${state.sofaPaid<1800?btn('Confirmar pagamento','pay-sofa','text-button'):chip('Paga')}</div></div>
      <div class="timeline-entry"><div class="timeline-date">05</div><div class="main"><strong>Sofá · parcela 3/3</strong><span>Novembro · ${state.sofaPaid>=2700?'Pagamento informado':'Pendente'}</span></div><div class="right"><strong>${brl(900)}</strong>${state.sofaPaid>=2700?chip('Paga'):chip('Pendente','amber')}</div></div>
      ${state.finMonth===0?state.marketPurchases.map(p=>`<div class="timeline-entry"><div class="timeline-date">29</div><div class="main"><strong>Mercado · lista ${p.list}</strong><span>Uma compra ligada à lista</span></div><div class="right"><strong>${brl(p.amount)}</strong>${chip('Paga')}</div></div>`).join('')+state.quickExpenses.map(p=>`<div class="timeline-entry"><div class="timeline-date">29</div><div class="main"><strong>${esc(p.description)}</strong><span>Gasto rápido · sem vínculo à Casa</span></div><div class="right"><strong>${brl(p.amount)}</strong>${chip('Paga')}</div></div>`).join(''):''}`}
      <div class="unreported">${svg('info')} Os valores pagos e a pagar são separados por data e origem. A projeção não se mistura ao saldo.</div>`,'finance-card')}
      <div class="stack">${card(`<div class="card-header"><h2>Ritmo dos meses</h2>${svg('chart')}</div><p class="muted small">Composição ilustrativa das obrigações previstas.</p><div class="bars">${bars.map((h,i)=>`<div class="bar-wrap ${i===state.finMonth+2?'current':''}"><div class="bar" style="height:${Math.round(h*1.3)}px"></div><span>${['Jul','Ago','Set','Out','Nov','Dez'][i]}</span></div>`).join('')}</div>${btn(`${state.financeExpanded?'Ocultar':'Ver'} composição ${svg('chevron')}`,'finance-breakdown','text-button')}${state.financeExpanded?`<div class="breakdown"><div class="divider"></div><div class="list-row"><div class="main"><strong>Sofá · parcelas</strong><span class="sub">Compra única, pagamentos separados</span></div><strong>${brl(2700)}</strong></div><div class="list-row"><div class="main"><strong>Pago do sofá</strong><span class="sub">Confirmado</span></div><strong>${brl(state.sofaPaid)}</strong></div><div class="list-row"><div class="main"><strong>Aberto do sofá</strong><span class="sub">2/3 e 3/3, conforme estado</span></div><strong>${brl(2700-state.sofaPaid)}</strong></div></div>`:''}`,'finance-card')}
      ${card(`<div class="card-header"><h3>Orçamento e reservas</h3>${svg('flag')}</div><p class="muted small">Planejar um valor não movimenta a conta. Acompanhamento por categoria e contexto aparece aqui quando informado.</p><div class="chips">${chip('Viagem')}${chip('Casa')}${chip('Vida pessoal')}</div>`,'finance-card')}</div></div>`;
  }

  function renderProjects(){
    const done=state.tasks.filter(t=>t.done).length;const pct=Math.round(done/state.tasks.length*100);const next=state.tasks.find(t=>!t.done);
    return `${heading('Projetos','Planos que saem do pensamento e ganham próximos passos.',btn(`${svg('plus')} Novo projeto`,'new-project','outline-button'))}
      <section class="project-cover">${asset('mountain','ref-projetos.png')}<div class="cover-content">${chip(`${svg('flag')} Viagem`)}<h2>Fim de semana na serra</h2><p>Resultado desejado: roteiro e reservas definidos.</p></div></section>
      <div class="project-grid"><div class="project-main">${card(`${iconDisc('flag','amber')}<div class="main"><span>Próxima ação</span><strong>${next?esc(next.text):'Tudo concluído por agora'}</strong></div>${btn(`${next?'Abrir tarefa':'Rever plano'} ${svg('arrow')}`,'focus-task','primary-button')}`,'next-action')}
      ${card(`<div class="card-header"><div><h2>Planejamento</h2><span class="muted small">${done} de ${state.tasks.length} tarefas concluídas</span></div>${btn(`${svg('plus')} Tarefa`,'new-task','soft-button')}</div><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><span class="quiet-note">${pct}% do percurso · progresso por execução</span><div class="divider"></div>${state.tasks.map(t=>`<div class="task-row ${t.done?'done':''}"><button type="button" data-task="${t.id}" aria-label="${t.done?'Reabrir':'Concluir'} ${esc(t.text)}">${t.done?svg('check'):''}</button><span>${esc(t.text)}</span>${!t.done&&t.id===next?.id?chip('Próxima ação','amber'):''}</div>`).join('')}`,'task-card')}</div>
      <div class="project-side">${card(`<div class="card-header"><h2>Previsão do projeto</h2>${iconDisc('card','blue')}</div><div class="large-money">${brl(8000)}</div><p class="muted small">Estimativa para planejar a viagem.</p><div class="divider"></div><div class="list-row">${iconDisc('info','blue')}<div class="main"><strong>Nenhuma compra registrada</strong><span class="sub">Este plano ainda não gera dívida.</span></div></div>`,'project-cost')}
      ${card(`<div class="card-header"><h3>O que este plano conecta</h3>${svg('spark')}</div><div class="list-row"><div class="main"><strong>Tarefas</strong><span class="sub">Ações que podem ser concluídas</span></div>${chip(String(state.tasks.length))}</div><div class="list-row"><div class="main"><strong>Compras futuras</strong><span class="sub">Só entram se forem registradas</span></div>${chip('Nenhuma','gray')}</div>`,'project-cost')}</div></div>`;
  }

  function modalShell(title,content,wide=false){return `<div class="overlay-backdrop" data-backdrop="true"><div class="modal ${wide?'wide':''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-header"><h2>${title}</h2><button class="icon-button" type="button" data-action="close-overlay" aria-label="Fechar">${svg('close')}</button></div>${content}</div></div>`;}
  function renderOverlay(){
    const root=$('#overlay-root');const key=state.overlay;
    if(!key){root.innerHTML='';return;}
    if(key==='menu'){
      root.innerHTML=`<div class="overlay-backdrop" data-backdrop="true"></div><aside class="drawer" role="dialog" aria-modal="true" aria-label="Menu de áreas"><div class="brand"><span class="brand-mark">${svg('leaf')}</span>Meu espaço</div>${Object.keys(names).map(k=>`<button type="button" class="nav-link ${state.section===k?'active':''}" data-nav="${k}">${svg(icons[k])}${names[k]}</button>`).join('')}<div class="drawer-bottom">Mercado fica no menu e no atalho do Início. A barra móvel mantém cinco destinos.</div></aside>`;return;
    }
    if(key==='new'){
      root.innerHTML=modalShell('O que você quer fazer?',`<button class="choice-row" type="button" data-action="new-idea">${iconDisc('spark')}<span class="main"><strong>Guardar uma ideia</strong><small>Comece só com o nome</small></span>${svg('chevron')}</button><button class="choice-row" type="button" data-nav="mercado">${iconDisc('basket')}<span class="main"><strong>Montar lista de Mercado</strong><small>Produtos, carrinho e fechamento</small></span>${svg('chevron')}</button><button class="choice-row" type="button" data-action="new-expense">${iconDisc('card','blue')}<span class="main"><strong>Registrar gasto</strong><small>Sem vincular à Casa</small></span>${svg('chevron')}</button><button class="choice-row" type="button" data-action="new-task">${iconDisc('flag')}<span class="main"><strong>Criar tarefa</strong><small>Um próximo passo para um projeto</small></span>${svg('chevron')}</button>`);return;
    }
    if(key==='search'){
      root.innerHTML=modalShell('Buscar no meu espaço',`<input id="global-search" class="input" type="search" placeholder="Sofá, Mercado, viagem..." aria-label="Termo de busca"><div class="search-results" id="search-results"></div>`,true);setTimeout(()=>$('#global-search')?.focus(),0);renderSearchResults('');return;
    }
    if(key==='idea'){
      root.innerHTML=modalShell('Guardar uma ideia',`<form id="modal-idea" class="form-grid"><label>Nome do item<input class="input" name="idea" placeholder="Ex.: um livro para a viagem" maxlength="80" required></label><span class="hint">Preço, contexto e cômodo podem ser completados depois.</span><div class="modal-actions"><button type="button" class="outline-button" data-action="close-overlay">Cancelar</button><button class="primary-button" type="submit">Salvar ideia</button></div></form>`);return;
    }
    if(key==='buy-lamp'){
      root.innerHTML=modalShell('Registrar compra da luminária',`<p class="muted">O valor pesquisado de <strong>${brl(state.alt)}</strong> será usado como valor real desta demonstração. Nenhum pagamento será presumido.</p><div class="info-strip">${svg('info')} Compra e obrigação ficam registradas; o pagamento continua pendente.</div><div class="modal-actions"><button type="button" class="outline-button" data-action="close-overlay">Voltar</button><button type="button" class="primary-button" data-action="confirm-lamp">Confirmar ${brl(state.alt)}</button></div>`);return;
    }
    if(key==='pay-sofa'){
      root.innerHTML=modalShell('Confirmar pagamento',`<p class="muted">Sofá · próxima parcela de ${brl(900)}. Uma saída será registrada na conta demonstrativa.</p><div class="money-grid"><div><span>Pago antes</span><strong>${brl(state.sofaPaid)}</strong></div><div><span>Pagamento</span><strong>${brl(900)}</strong></div><div><span>Aberto depois</span><strong>${brl(Math.max(0,2700-state.sofaPaid-900))}</strong></div></div><div class="modal-actions"><button type="button" class="outline-button" data-action="close-overlay">Cancelar</button><button type="button" class="primary-button" data-action="confirm-pay">Confirmar pagamento</button></div>`);return;
    }
    if(key==='finish-market'){
      root.innerHTML=modalShell('Fechar compra do Mercado',`<p class="muted">${currentMarketCount()} de ${state.marketItems.length} produtos no carrinho. O subtotal de ${brl(knownMarketSum())} é ${missingMarketPrices()?'parcial':'estimado'}; informe o total real do caixa.</p><form id="market-finish" class="form-grid"><label>Total real da nota<input class="input" name="amount" type="number" min="0.01" step="0.01" value="48.90" required></label><label>Pagamento<input class="input" value="À vista · Conta principal" disabled></label><div class="info-strip">${svg('info')} Será criada uma única compra financeira, ligada à lista.</div><div class="modal-actions"><button type="button" class="outline-button" data-action="close-overlay">Voltar</button><button type="submit" class="primary-button">Confirmar compra</button></div></form>`);return;
    }
    if(key==='task'){
      root.innerHTML=modalShell('Nova tarefa do projeto',`<form id="task-form" class="form-grid"><label>Próxima ação<input class="input" name="task" placeholder="Ex.: escolher hospedagem" maxlength="80" required></label><div class="modal-actions"><button type="button" class="outline-button" data-action="close-overlay">Cancelar</button><button class="primary-button" type="submit">Adicionar tarefa</button></div></form>`);return;
    }
    if(key==='expense'){
      root.innerHTML=modalShell('Gasto rápido',`<form id="expense-form" class="form-grid"><label>Descrição<input class="input" name="description" placeholder="Ex.: táxi para a viagem" required></label><label>Valor informado<input class="input" name="amount" type="number" min="0.01" step="0.01" placeholder="0,00" required></label><span class="hint">Categoria, contexto, Casa e Projeto são opcionais. Este protótipo mostra apenas a confirmação visual.</span><div class="modal-actions"><button type="button" class="outline-button" data-action="close-overlay">Cancelar</button><button class="primary-button" type="submit">Registrar gasto</button></div></form>`);return;
    }
    root.innerHTML=modalShell('Sobre esta demonstração',`<p>Este é um protótipo de interface, não o aplicativo pronto. As interações alteram apenas os dados fictícios desta página, sem gravá-los em servidor ou enviar pagamentos reais.</p><p>Casa Serena guia a composição, mas cada área possui estrutura e comportamento próprios. Use o menu, os cartões, o mapa, a lista do Mercado, as parcelas e as tarefas para explorar.</p><div class="modal-actions">${btn('Entendi','close-overlay')}</div>`);
  }
  function renderSearchResults(q){
    const items=[['Sofá','Compra · Sala','compras','sofa'],['Luminária','Desejo · Sala','compras','lamp'],['Lista de hoje','Mercado','mercado',''],['Fim de semana na serra','Projeto · Viagem','projetos',''],['Sala','Casa','casa',''],['Próximos pagamentos','Finanças','financas','']];
    const matched=items.filter(x=>(x[0]+' '+x[1]).toLowerCase().includes(q.toLowerCase()));
    $('#search-results').innerHTML=matched.length?matched.map(([title,detail,section,item])=>`<button type="button" class="search-result" data-search-nav="${section}" data-search-item="${item}">${iconDisc(icons[section])}<span><strong>${title}</strong><br><small>${detail}</small></span>${svg('chevron')}</button>`).join(''):'<p class="muted">Nenhum registro encontrado nesta demonstração.</p>';
  }
  function closeOverlay(){state.overlay=null;renderOverlay();}

  document.addEventListener('click',e=>{
    const nav=e.target.closest('[data-nav]');if(nav){navigate(nav.dataset.nav);return;}
    const room=e.target.closest('[data-room]');if(room){state.room=room.dataset.room;render();return;}
    const mode=e.target.closest('[data-house-mode]');if(mode){state.houseMode=mode.dataset.houseMode;render();return;}
    const item=e.target.closest('[data-item]');if(item){state.shoppingItem=item.dataset.item;state.shoppingTab='resumo';render();return;}
    const shopTab=e.target.closest('[data-shopping-tab]');if(shopTab){state.shoppingTab=shopTab.dataset.shoppingTab;render();return;}
    const listTab=e.target.closest('[data-shopping-list-tab]');if(listTab){state.shoppingListTab=listTab.dataset.shoppingListTab;render();return;}
    const alt=e.target.closest('[data-alt]');if(alt){state.alt=Number(alt.dataset.alt);render();toast(`Estimativa selecionada: ${brl(state.alt)}`);return;}
    const market=e.target.closest('[data-market-toggle]');if(market){if(state.marketClosed){toast('Lista fechada. Reutilize para uma nova compra.');return;}const it=state.marketItems.find(i=>i.id===Number(market.dataset.marketToggle));it.cart=!it.cart;render();toast(it.cart?`${it.name} no carrinho`:`${it.name} voltou à lista`);return;}
    const freq=e.target.closest('[data-frequent]');if(freq){if(state.marketClosed){toast('Reutilize a lista para acrescentar produtos.');return;}state.marketItems.push({id:state.nextMarketId++,name:freq.dataset.frequent,detail:'1 unidade · Frequentes',estimate:null,section:'Outros',cart:false});render();toast(`${freq.dataset.frequent} adicionado à lista`);return;}
    const month=e.target.closest('[data-month]');if(month){state.finMonth=Math.max(0,Math.min(2,state.finMonth+Number(month.dataset.month)));render();return;}
    const ftab=e.target.closest('[data-fin-tab]');if(ftab){state.finTab=ftab.dataset.finTab;render();return;}
    const task=e.target.closest('[data-task]');if(task){const t=state.tasks.find(t=>t.id===Number(task.dataset.task));t.done=!t.done;render();toast(t.done?'Tarefa concluída':'Tarefa reaberta');return;}
    const searchNav=e.target.closest('[data-search-nav]');if(searchNav){if(searchNav.dataset.searchItem)state.shoppingItem=searchNav.dataset.searchItem;navigate(searchNav.dataset.searchNav);return;}
    const action=e.target.closest('[data-action]');if(action){handleAction(action.dataset.action);return;}
    if(e.target.dataset.backdrop==='true')closeOverlay();
  });
  document.addEventListener('submit',e=>{
    e.preventDefault();const form=e.target;
    if(form.id==='idea-form'||form.id==='modal-idea'){const value=form.elements.idea.value.trim();if(!value)return;state.ideas.push(value);state.overlay=null;render();toast('Ideia guardada, sem criar gasto');return;}
    if(form.id==='market-add'){if(state.marketClosed)return;const value=form.elements.product.value.trim();if(!value)return;state.marketItems.push({id:state.nextMarketId++,name:value,detail:'1 unidade · Novo produto',estimate:null,section:'Outros',cart:false});render();toast(`${value} adicionado à lista`);return;}
    if(form.id==='market-finish'){const value=Number(form.elements.amount.value);if(!Number.isFinite(value)||value<=0)return;if(!state.marketClosed){state.marketClosed=true;state.marketAmount=Math.round(value*100)/100;state.marketPurchases.push({list:state.marketListNumber,amount:state.marketAmount});state.balance-=state.marketAmount;toast(`Mercado fechado por ${brl(state.marketAmount)}`);}else toast('Esta lista já foi fechada; nenhuma compra duplicada');state.overlay=null;render();return;}
    if(form.id==='task-form'){const value=form.elements.task.value.trim();if(!value)return;state.tasks.push({id:state.nextTaskId++,text:value,done:false});state.overlay=null;navigate('projetos');toast('Tarefa acrescentada ao projeto');return;}
    if(form.id==='expense-form'){const value=Number(form.elements.amount.value);if(!Number.isFinite(value)||value<=0)return;state.balance-=value;state.quickExpenses.push({description:form.elements.description.value.trim(),amount:value});state.overlay=null;navigate('financas');toast('Gasto de demonstração registrado');return;}
  });
  document.addEventListener('input',e=>{if(e.target.id==='global-search')renderSearchResults(e.target.value);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.overlay){closeOverlay();return;}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();state.overlay='search';renderOverlay();}});
  function handleAction(a){
    if(a==='close-overlay'){closeOverlay();return;}
    if(a==='menu'||a==='new'||a==='search'){state.overlay=a;renderOverlay();return;}
    if(a==='demo-note'){state.overlay='about';renderOverlay();return;}
    if(a==='go-house'){navigate('casa');return;}
    if(a==='go-finance'){navigate('financas');return;}
    if(a==='go-project'){navigate('projetos');return;}
    if(a==='go-lamp'||a==='go-sofa'){state.shoppingItem=a==='go-lamp'?'lamp':'sofa';state.shoppingTab='resumo';navigate('compras');return;}
    if(a==='change-hero'){state.hero=state.hero==='casa'?'viagem':'casa';render();return;}
    if(a==='new-idea'){state.overlay='idea';renderOverlay();return;}
    if(a==='new-expense'){state.overlay='expense';renderOverlay();return;}
    if(a==='new-task'){state.overlay='task';renderOverlay();return;}
    if(a==='see-alternatives'){state.shoppingTab='alternativas';render();return;}
    if(a==='buy-lamp'){if(state.lampBought){toast('Esta compra já foi registrada');return;}state.overlay='buy-lamp';renderOverlay();return;}
    if(a==='confirm-lamp'){if(!state.lampBought){state.lampBought=true;toast('Compra registrada sem pagamento presumido');}state.overlay=null;render();return;}
    if(a==='pay-sofa'){if(state.sofaPaid>=2700){toast('Todas as parcelas já foram pagas');return;}state.overlay='pay-sofa';renderOverlay();return;}
    if(a==='confirm-pay'){if(state.sofaPaid<2700){state.sofaPaid+=900;state.balance-=900;toast('Pagamento confirmado uma vez');}state.overlay=null;render();return;}
    if(a==='finish-market'){state.overlay='finish-market';renderOverlay();return;}
    if(a==='finance-breakdown'){state.financeExpanded=!state.financeExpanded;render();return;}
    if(a==='focus-task'){document.querySelector('.task-card')?.scrollIntoView({behavior:'smooth',block:'center'});return;}
    if(a==='new-market-list'){if(!state.marketClosed){toast('Feche a lista atual antes de reutilizá-la.');return;}state.marketItems=state.marketItems.map(i=>({...i,id:state.nextMarketId++,cart:false}));state.marketListNumber+=1;state.marketClosed=false;state.marketAmount=0;render();toast('Nova lista criada; compra anterior preservada');return;}
    if(a==='new-room'||a==='new-project'){toast('A criação completa entra na próxima iteração do protótipo');return;}
    if(a==='filter-sala'||a==='filter-life'){toast('Itens podem aparecer em vários contextos sem duplicar a compra');return;}
  }
  render(false);
})();
