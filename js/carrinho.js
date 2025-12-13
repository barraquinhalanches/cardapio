let CARRINHO = JSON.parse(localStorage.getItem("carrinho")) || [];


function salvarCarrinho() {
localStorage.setItem("carrinho", JSON.stringify(CARRINHO));
}


function addCarrinho(prod, options) {
	const item = Object.assign({}, prod);
	if(options && typeof options === 'object'){
		if(options.observacoes) item.observacoes = options.observacoes;
		if(options.tamanho) item.tamanho = options.tamanho;
		if(options.acrescimos) item.acrescimos = options.acrescimos;
		if(typeof options.acrescimos_total !== 'undefined') item.acrescimos_total = options.acrescimos_total;
		// allow an explicit final price (preco_final) calculated by the modal
		if(typeof options.preco_final !== 'undefined') item.preco = Number(options.preco_final) || item.preco;
	}
	CARRINHO.push(item);
	salvarCarrinho();
	const obsText = item.tamanho? ` (${item.tamanho.toUpperCase()})` : '';
	const obsNote = item.observacoes? ` — ${item.observacoes}` : '';
	alert(prod.nome + obsText + obsNote + ' adicionado ao pedido');
	atualizarCarrinhoUI();
}


function atualizarCarrinhoUI() {
const lista = document.getElementById("listaCarrinho");
if(!CARRINHO || CARRINHO.length === 0){
	lista.innerHTML = `<li>Carrinho vazio</li>`;
	} else {
		lista.innerHTML = CARRINHO.map(p => {
			const sizeLabel = p.tamanho? ` — ${p.tamanho.toUpperCase()}` : '';
			const obs = p.observacoes? ` — ${p.observacoes}` : '';
			const adds = Array.isArray(p.acrescimos) && p.acrescimos.length? ` — +${p.acrescimos.map(a=>a.nome).join(', ')}` : '';
			return `<li>${p.nome}${sizeLabel}${adds}${obs} — R$ ${p.preco.toFixed(2)}</li>`;
		}).join("");
}
}


// Abrir e fechar modal
document.getElementById("abrirCarrinho").onclick = () => {
document.getElementById("carrinhoModal").style.display = "flex";
};


document.getElementById("carrinhoModal").onclick = e => {
if (e.target.id === "carrinhoModal") e.target.style.display = "none";
};


// (handler defined further below)

// include product id in messages and provide send via email
function formatOrderLines(){
	return CARRINHO.map(p => {
		const sizeLabel = p.tamanho? ` - ${p.tamanho.toUpperCase()}` : '';
		const obs = p.observacoes? ` - Obs: ${p.observacoes}` : '';
		const adds = Array.isArray(p.acrescimos) && p.acrescimos.length? ` - Acresc: ${p.acrescimos.map(a=>a.nome).join(',')}` : '';
		return `ID:${p.id} - ${p.nome}${sizeLabel}${adds}${obs} - R$ ${p.preco.toFixed(2)}`;
	});
}

document.getElementById("enviarZap").onclick = () => {
	if(!CARRINHO || CARRINHO.length === 0){ alert('Carrinho vazio'); return; }
	const lines = formatOrderLines();
	const texto = encodeURIComponent(['Pedido:', ...lines, '', `Total: R$ ${CARRINHO.reduce((s,i)=>s+i.preco,0).toFixed(2)}`].join('\n'));
	const url = `https://wa.me/5516988087678?text=${texto}`;
	window.open(url, '_blank');
};

document.getElementById('enviarEmail').onclick = () => {
	if(!CARRINHO || CARRINHO.length === 0){ alert('Carrinho vazio'); return; }
	const lines = formatOrderLines();
	const subject = encodeURIComponent('Pedido - Cardápio');
	const body = encodeURIComponent(['Pedido:', ...lines, '', `Total: R$ ${CARRINHO.reduce((s,i)=>s+i.preco,0).toFixed(2)}`, '', 'Envie seus dados de entrega aqui:'].join('\n'));
	const mailto = `mailto:vla.eleut@gmail.com?subject=${subject}&body=${body}`;
	window.location.href = mailto;
};

// Limpar carrinho
function limparCarrinho(){
	CARRINHO = [];
	salvarCarrinho();
	atualizarCarrinhoUI();
}

const btnLimpar = document.getElementById('limparCarrinho');
if(btnLimpar) btnLimpar.onclick = limparCarrinho;

// Contact modal handlers (open/close/send)
const btnOpenContact = document.getElementById('openContact');
const contactModal = document.getElementById('contactModal');
if(btnOpenContact && contactModal){
	btnOpenContact.addEventListener('click', ()=> contactModal.classList.add('show'));
}
const contactBackdrop = document.getElementById('contactModalBackdrop');
const btnCloseContact = document.getElementById('closeContactModal');
if(contactBackdrop) contactBackdrop.addEventListener('click', ()=> contactModal.classList.remove('show'));
if(btnCloseContact) btnCloseContact.addEventListener('click', ()=> contactModal.classList.remove('show'));

// send contact via email
const btnContactEmail = document.getElementById('contactSendEmail');
const btnContactWhats = document.getElementById('contactSendWhatsApp');
if(btnContactEmail) btnContactEmail.addEventListener('click', ()=>{
	const name = document.getElementById('contactName').value || '';
	const msg = document.getElementById('contactMessage').value || '';
	const subject = encodeURIComponent('Contato - Cardápio');
	const body = encodeURIComponent(`Nome: ${name}\n\n${msg}`);
	window.location.href = `mailto:vla.eleut@gmail.com?subject=${subject}&body=${body}`;
});
if(btnContactWhats) btnContactWhats.addEventListener('click', ()=>{
	const name = document.getElementById('contactName').value || '';
	const msg = document.getElementById('contactMessage').value || '';
	const texto = encodeURIComponent(`Contato: ${name}\n\n${msg}`);
	window.open(`https://wa.me/5516988087678?text=${texto}`, '_blank');
});

// inicializa UI
atualizarCarrinhoUI();