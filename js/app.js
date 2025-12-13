function renderizarCategorias() {
  // extrai categorias únicas mesmo quando produto tem várias
  const all = PRODUTOS.flatMap(p => p.categorias || (p.categoria ? [p.categoria] : []));
  const categoriasUnicas = [...new Set(all)];

  // renderiza no sidebar se existir
  const sidebar = document.getElementById('sidebarCategorias');
  const nav = document.getElementById('categorias');

  const catButtons = ['<li><button class="cat-btn" data-cat="">Todos</button></li>']
    .concat(categoriasUnicas.map(c => `<li><button class="cat-btn" data-cat="${c}">${c}</button></li>`));

  if (sidebar) sidebar.innerHTML = catButtons.join('');
  if (nav) nav.innerHTML = `<a href="?">Todos</a>` + categoriasUnicas.map(c => `<a href="?categoria=${c}">${c}</a>`).join("");

  // attach handlers to sidebar buttons
  if (sidebar) {
    [...sidebar.querySelectorAll('.cat-btn')].forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-cat') || '';
        selectCategory(cat);
      });
    });
    // marcar a categoria ativa de acordo com URL
    const params = new URLSearchParams(window.location.search);
    const current = params.get('categoria') || '';
    [...sidebar.querySelectorAll('.cat-btn')].forEach(b => b.classList.toggle('active', (b.getAttribute('data-cat')||'')===current));
  }

  // Make header title act like "Home": clear query and re-render products
  var siteTitle = document.getElementById('siteTitle');
  if(siteTitle){
    siteTitle.addEventListener('click', function(e){
      e.preventDefault();
      // remove querystring params (categoria, pagina, busca)
      if(history && history.pushState){
        var url = new URL(location.href);
        url.search = '';
        history.pushState({}, document.title, url.toString());
      } else {
        // fallback
        location.href = location.pathname;
      }
      // ensure search input cleared and re-render
      var search = document.getElementById('searchInput');
      if(search) search.value = '';
      renderizarProdutos();
    });
  }
}

function filtrarPorCategoria(lista) {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get("categoria") || '';
  if (!cat) return lista;
  return lista.filter(p => {
    const cats = p.categorias || (p.categoria ? [p.categoria] : []);
    return cats.includes(cat);
  });
}

function selectCategory(cat){
  const params = new URLSearchParams(window.location.search);
  if (cat) params.set('categoria', cat); else params.delete('categoria');
  const qs = params.toString();
  const url = qs ? `?${qs}` : window.location.pathname;
  history.pushState(null,'',url);
  // update active classes in sidebar
  const sidebar = document.getElementById('sidebarCategorias');
  if (sidebar) {
    [...sidebar.querySelectorAll('.cat-btn')].forEach(b => b.classList.toggle('active', (b.getAttribute('data-cat')||'')===cat));
  }
  renderizarProdutos();
}

function filtrarPorPesquisa(lista) {
  const input = document.getElementById('searchInput');
  if(!input) return lista;
  const q = input.value.trim().toLowerCase();
  if(!q) return lista;
  return lista.filter(p => (p.nome || '').toLowerCase().includes(q) || (p.descricao || '').toLowerCase().includes(q));
}

function renderizarProdutos() {
  renderizarCategorias();

  // renderiza lista simplificada por categoria (seções expansíveis)
  const lista = filtrarPorPesquisa(filtrarPorCategoria(PRODUTOS));

  // agrupa por primeira categoria disponível
  const groups = {};
  lista.forEach(p=>{
    const cat = (p.categorias && p.categorias[0]) || (p.categoria) || 'Outros';
    if(!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  });

  const html = Object.keys(groups).map(cat => `
    <section class="category">
      <div class="category-header" data-cat="${cat}">
        <strong>${cat}</strong>
      </div>
      <div class="category-list">
        ${groups[cat].map(p => `
          <div class="menu-item">
            <div class="menu-item-row">
              <div class="menu-item-info">
                <a href="#" class="menu-item-name" data-id="${p.id}" style="color:inherit;text-decoration:none;cursor:pointer">${p.nome}</a>
                <div class="menu-item-desc">${p.descricao || ''}</div>
              </div>
              <div class="menu-item-actions">
                ${p.preco_junior ? `
                  <div class="price"><span class="price-single">R$ ${(p.preco_grande||p.preco).toFixed(2)}</span><span class="price-jr">Jr: R$ ${p.preco_junior.toFixed(2)}</span></div>
                ` : `<div class="price"><span class="price-single">R$ ${p.preco.toFixed(2)}</span></div>`}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `).join('');

  document.getElementById('listaProdutos').innerHTML = html || '<p>Nenhum item encontrado.</p>';

  // sections are shown expanded by default (not collapsible initially)

  atualizarCarrinhoUI();
  attachAddButtons();
}

function attachAddButtons(){
  // attach click handlers to names to open observations modal
  document.querySelectorAll('.menu-item-name').forEach(el=>{
    if(el._hasHandler) return; el._hasHandler = true;
    el.addEventListener('click', (ev)=>{
      ev.preventDefault();
      const id = el.getAttribute('data-id');
      if(!id) return;
      openObsModal(id);
    });
  });
}

// open observations modal for catalog items
let _pendingAddProductId = null;
function openObsModal(prodId){
  _pendingAddProductId = prodId;
  const modal = document.getElementById('obsModal');
  const textarea = document.getElementById('obsTextarea');
  const sizeOpts = document.getElementById('obsSizeOptions');
  if(!modal || !textarea) return;
  textarea.value = '';
  const prod = PRODUTOS.find(p=>String(p.id)===String(prodId));
  if(prod && prod.preco_junior) {
    sizeOpts.style.display = 'block';
    const r = modal.querySelector('input[name="obsSize"][value="grande"]'); if(r) r.checked = true;
  } else {
    if(sizeOpts) sizeOpts.style.display = 'none';
  }
  // ensure additions panel initial state
  const addToggle = document.getElementById('obsAddToggle');
  const addBox = document.getElementById('obsAdditions');
  if(addToggle && addBox){ addBox.style.display = 'none'; addToggle.textContent = '+ Acrescentar ingredientes'; }
  // populate additions list (async)
  populateObsAdditions(prod);
  // set initial totals
  updateObsTotals();
  modal.classList.add('show');
}

function populateObsAdditions(prod){
  const listEl = document.getElementById('obsAdditionsList');
  const addBox = document.getElementById('obsAdditions');
  if(!listEl) return;
  listEl.innerHTML = 'Carregando ingredientes...';
  // helper: render an array of additions into the list
  function renderAvailable(arr){
    const available = Array.isArray(arr) ? arr : [];
    if(available.length === 0){ listEl.innerHTML = '<div>Nenhum ingrediente disponível.</div>'; return; }
    const size = (document.querySelector('input[name="obsSize"]:checked')||{}).value || 'grande';
    const rows = available.map(a=>{
      const price = (size==='jr'? (a.preco_junior ?? a.preco_grande) : (a.preco_grande ?? a.preco_junior)) || 0;
      return `<label style="display:block;margin-bottom:6px"><input type="checkbox" name="obsAdd" data-id="${a.id}" data-price="${price}"> ${a.nome} — R$ ${price.toFixed(2)}</label>`;
    }).join('');
    listEl.innerHTML = rows;
    listEl.querySelectorAll('input[name="obsAdd"]').forEach(ch => ch.addEventListener('change', updateObsTotals));
    updateObsTotals();
  }

  // parse CSV text into additions array (robust for 2-column name;price or larger rows)
  function parseCsvTextToAcrescimos(text){
    const lines = String(text||'').split(/\r?\n/).filter(l=>l.trim());
    const out = [];
    let id = 1;
    for(let i=0;i<lines.length;i++){
      let line = lines[i].trim();
      if(!line) continue;
      // split by ; then fallback to ,
      let cols = line.split(';');
      if(cols.length < 2) cols = line.split(',');
      cols = cols.map(c=> (c||'').trim());
      if(cols.length < 2) continue;
      // skip header heuristics
      if(i===0 && ((cols[0]||'').toLowerCase().includes('nome') || (cols[1]||'').toLowerCase().includes('pre') || (cols[1]||'').toLowerCase().includes('price')) ) continue;
      let nome = cols[0];
      let preco = null;
      if(cols.length === 2){ preco = parseFloat((cols[1]||'').replace(',','.')) || 0; }
      else {
        // try to find price-like column among the columns
        for(let j=1;j<cols.length;j++){
          const candidate = cols[j].replace(/[^0-9,\.\-]/g,'');
          if(candidate && /[0-9]/.test(candidate)) { preco = parseFloat(candidate.replace(',','.')) || 0; break; }
        }
        if(preco === null) preco = 0;
      }
      out.push({ id: id, nome: nome, preco_grande: preco, preco_junior: null });
      id++;
    }
    return out;
  }

  // Try use preloaded ACRESCIMOS when available; otherwise fetch and parse the CSV directly
  if(Array.isArray(ACRESCIMOS) && ACRESCIMOS.length>0){
    renderAvailable(ACRESCIMOS);
    return;
  }

  // If loader promise exists, wait for it then check ACRESCIMOS; if still empty, fetch CSV
  if(typeof ACRESCIMOS_READY !== 'undefined' && ACRESCIMOS_READY && typeof ACRESCIMOS_READY.then === 'function'){
    ACRESCIMOS_READY.then(()=>{
      if(Array.isArray(ACRESCIMOS) && ACRESCIMOS.length>0){ renderAvailable(ACRESCIMOS); return; }
      // fallback to direct fetch/parsing
      fetch('assets/data/acrescimos.csv').then(r=>r.text()).then(text=>{
        const parsed = parseCsvTextToAcrescimos(text);
        renderAvailable(parsed);
      }).catch(()=>{ listEl.innerHTML = '<div>Erro carregando ingredientes.</div>'; });
    }).catch(()=>{
      // final fallback
      fetch('assets/data/acrescimos.csv').then(r=>r.text()).then(text=>{
        const parsed = parseCsvTextToAcrescimos(text);
        renderAvailable(parsed);
      }).catch(()=>{ listEl.innerHTML = '<div>Ingredientes não disponíveis.</div>'; });
    });
  } else {
    // no loader, fetch directly
    fetch('assets/data/acrescimos.csv').then(r=>r.text()).then(text=>{
      const parsed = parseCsvTextToAcrescimos(text);
      renderAvailable(parsed);
    }).catch(()=>{ listEl.innerHTML = '<div>Ingredientes não disponíveis.</div>'; });
  }
}

function updateObsTotals(){
  const prod = PRODUTOS.find(p=>String(p.id)===String(_pendingAddProductId));
  const size = (document.querySelector('input[name="obsSize"]:checked')||{}).value || 'grande';
  const base = prod? (size==='jr' ? (prod.preco_junior ?? prod.preco_grande ?? prod.preco) : (prod.preco_grande ?? prod.preco)) : 0;
  let adds = 0;
  document.querySelectorAll('input[name="obsAdd"]:checked').forEach(ch=>{
    const v = parseFloat(ch.getAttribute('data-price')) || 0;
    adds += v;
  });
  const total = (base || 0) + adds;
  const obsAddTotal = document.getElementById('obsAddTotal'); if(obsAddTotal) obsAddTotal.textContent = adds.toFixed(2);
  const obsTotalValue = document.getElementById('obsTotalValue'); if(obsTotalValue) obsTotalValue.textContent = (total||0).toFixed(2);
}

function closeObsModal(){
  const modal = document.getElementById('obsModal');
  if(modal) modal.classList.remove('show');
  _pendingAddProductId = null;
}

document.addEventListener('DOMContentLoaded', ()=>{
  const backdrop = document.getElementById('obsModalBackdrop');
  const closeBtn = document.getElementById('closeObsModal');
  const cancelBtn = document.getElementById('cancelObs');
  const confirmBtn = document.getElementById('confirmObs');
  if(backdrop) backdrop.addEventListener('click', closeObsModal);
  if(closeBtn) closeBtn.addEventListener('click', closeObsModal);
  if(cancelBtn) cancelBtn.addEventListener('click', closeObsModal);
  if(confirmBtn) confirmBtn.addEventListener('click', ()=>{
    const textarea = document.getElementById('obsTextarea');
    const obs = textarea? textarea.value.trim() : '';
    if(!_pendingAddProductId) { closeObsModal(); return; }
    const prod = PRODUTOS.find(p=>String(p.id)===String(_pendingAddProductId));
    if(!prod){ alert('Produto não encontrado'); closeObsModal(); return; }
    const sizeEl = document.querySelector('input[name="obsSize"]:checked');
    const tamanho = sizeEl? sizeEl.value : 'grande';
    // collect selected additions
    const selected = [];
    let addsTotal = 0;
    document.querySelectorAll('input[name="obsAdd"]:checked').forEach(ch=>{
      const id = ch.getAttribute('data-id');
      const price = parseFloat(ch.getAttribute('data-price')) || 0;
      const item = (typeof ACRESCIMOS !== 'undefined' && Array.isArray(ACRESCIMOS))? ACRESCIMOS.find(a=>String(a.id)===String(id)) : null;
      selected.push({ id: id, nome: item? item.nome : ch.parentNode.textContent.trim(), preco: price });
      addsTotal += price;
    });
    // compute base price according to size
    const base = (tamanho==='jr' ? (prod.preco_junior ?? prod.preco_grande ?? prod.preco) : (prod.preco_grande ?? prod.preco)) || 0;
    const finalPrice = (base || 0) + addsTotal;
    if(typeof addCarrinho === 'function') addCarrinho(prod, { observacoes: obs, tamanho: tamanho, acrescimos: selected, acrescimos_total: addsTotal, preco_final: finalPrice });
    closeObsModal();
  });
  // close on Esc
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeObsModal(); });
  // Ensure the "Acrescentar ingredientes" toggle always works even if ACRESCIMOS not yet loaded
  const addToggleInit = document.getElementById('obsAddToggle');
  const addBoxInit = document.getElementById('obsAdditions');
  if(addToggleInit && addBoxInit){
    let _acrescimosRequested = false;
    addToggleInit.addEventListener('click', ()=>{
      const showing = addBoxInit.style.display === 'block';
      addBoxInit.style.display = showing ? 'none' : 'block';
      addToggleInit.textContent = showing ? '+ Acrescentar ingredientes' : '- Acrescentar ingredientes';
      if(!showing && !_acrescimosRequested){ _acrescimosRequested = true; populateObsAdditions(); }
      updateObsTotals();
    });
  }

  // size radio changes should always recalc totals
  document.querySelectorAll('input[name="obsSize"]').forEach(r => r.addEventListener('change', updateObsTotals));
});

function setupSearch(){
  const input = document.getElementById('searchInput');
  if(!input) return;
  input.addEventListener('input', ()=> renderizarProdutos());
  const clearBtn = document.getElementById('searchClear');
  if(clearBtn) clearBtn.addEventListener('click', ()=>{ input.value=''; renderizarProdutos(); });
}

setupSearch();

function setupSidebar(){
  const open = document.getElementById('openSidebar');
  const close = document.getElementById('closeSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const sidebar = document.getElementById('sidebar');
  if(open) open.addEventListener('click', ()=>{ if(sidebar) sidebar.classList.add('open'); if(overlay) overlay.classList.add('show'); });
  if(close) close.addEventListener('click', ()=>{ if(sidebar) sidebar.classList.remove('open'); if(overlay) overlay.classList.remove('show'); });
  if(overlay) overlay.addEventListener('click', ()=>{ if(sidebar) sidebar.classList.remove('open'); overlay.classList.remove('show'); });
}

setupSidebar();

// ensure products loaded before first render
if(typeof PRODUTOS_READY !== 'undefined' && PRODUTOS_READY && typeof PRODUTOS_READY.then === 'function'){
  PRODUTOS_READY.then(()=>{
    renderizarProdutos();
  });
} else {
  renderizarProdutos();
}