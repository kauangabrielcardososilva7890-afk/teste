// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.18.6 — chamado de contrato (peças + faixas), PDF, nuvem e boas-vindas
// • 1.2 — Garante a área de peças "igual vendas" (busca/lupa, qtd, valor,
//         desconto, valor final, Adicionar item) no chamado DENTRO do contrato.
// • 4.1 — Garante as faixas azuis de seção no chamado DENTRO do contrato.
//         (feito via MutationObserver, independente de timing/formulário)
// • 3   — PDF do chamado: caixa Impressora com modelo, patrimônio, serial e
//         local (buscando do equipamento quando o chamado não tiver).
// • 5   — Aviso de tela cheia "Carregando dados da nuvem..." antes da
//         recarga automática; em erro, aviso pedindo para corrigir.
// • 5.1 — Aviso "Bem-vindo, Fulano!" com botão único (OK) após o login.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
function n(v, fb){ var x = Number(String(v == null ? '' : v).replace(',', '.')); return Number.isFinite(x) ? x : (fb === undefined ? 0 : fb); }
function money(v){ return typeof fmtMoney === 'function' ? fmtMoney(n(v)) : ('R$ ' + n(v).toFixed(2).replace('.', ',')); }
function sess(){ return typeof getSession === 'function' ? getSession() : null; }
function aviso(m){ if(typeof window.lfbAlert === 'function') return window.lfbAlert(m, 'Aviso'); }
function logoSrc(){ return window.DIGICOPY_LOGO || './logo.png'; }
function dia(v){ return String(v == null ? '' : v).slice(0, 10); }
function dataBR(v){ var s = dia(v); if(!s) return ''; var p = s.split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : s; }

function normItem(it){
  var qtd = Math.max(1, n(it.qtd, 1));
  var preco = n(it.preco, 0);
  var desconto = Math.max(0, n(it.desconto, 0));
  return Object.assign({}, it, { qtd: qtd, preco: preco, desconto: desconto, subtotal: Math.max(0, qtd * preco - desconto) });
}

// ─────────────────────────────────────────────────────────────────────────
// Lógica pura (testável)
// ─────────────────────────────────────────────────────────────────────────
window.AJUSTES_V5186_PURE = {
  dadosImpressora: function(o, dbRef){
    if(!o) return { modelo:'', patrimonio:'', serie:'', local:'' };
    const eq = ((dbRef && dbRef.equipamentos) || []).find(function(e){ return e.id === o.equipamentoId; }) || {};
    const p = ((dbRef && dbRef.parque) || []).find(function(x){ return x.equipamentoId === o.equipamentoId; }) || {};
    return {
      modelo: o.modelo || eq.modelo || '',
      patrimonio: o.patrimonio || eq.patrimonio || '',
      serie: o.serie || eq.serie || '',
      local: o.local || p.localInstalacao || p.setor || ''
    };
  },
  deveTerFaixa: function(texto){
    return /motivo|defeito|serviço executado|servicos|observa|contador|itens usados|peças|pecas/.test(String(texto||'').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase());
  },
  tituloFaixa: function(texto){
    return String(texto || '').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
  }
};

if(typeof window === 'undefined' || typeof document === 'undefined') return;

// ═════════════════════════════════════════════════════════════════════════
// Item 3 — PDF do chamado com Impressora completa (modelo/patrimônio/serial/local)
// ═════════════════════════════════════════════════════════════════════════
function chamadoFinalizado(o){
  if(!o) return false;
  const chk = document.getElementById('ko-concluido') || document.getElementById('ca-concluido');
  if(chk) return !!chk.checked;
  const st = String(o.status || '').toLowerCase();
  return st === 'concluido' || st === 'finalizado' || st === 'fechado';
}
function parqueDaOs(o){
  const list = db.parque || [];
  return list.find(function(x){ return x.equipamentoId === o.equipamentoId && (!o.contratoId || x.contratoId === o.contratoId); })
      || list.find(function(x){ return x.equipamentoId === o.equipamentoId; })
      || null;
}
function temColor(p, o){
  if(!o.contratoId) return true;
  const m = (p && (p.medidoresConfig || p.medidores)) || {};
  return ['colorA4','colorA3'].some(function(k){
    const x = m[k]; if(!x) return false;
    const mod = String(x.modalidade || x.mod || '').toLowerCase();
    return !!(mod && mod !== 'inativo' && mod !== 'off');
  });
}
function lojaRodape(){
  const s = sess() || {};
  const emp = (db.empresas || []).find(function(e){ return e.id === s.empresaId; }) || {};
  const l = (db.config && (db.config.loja || db.config.empresa)) || {};
  const d = Object.assign({}, emp, l);
  const end = d.endereco || [d.rua || d.logradouro, d.numero, d.bairro, d.cidade || d.municipio, d.uf || d.estado, d.cep].filter(Boolean).join(' • ');
  return { fantasia: d.fantasia || 'DIGICOPY', razao: d.razaoSocial || d.nome || '', cnpj: d.cnpj || s.cnpj || '', tel: d.telefone || d.fone || '', whats: d.whatsapp || '', email: d.email || '', end: end || '' };
}

window.imprimirChamadoPDF = function(osId){
  const o = (db.os || []).find(function(x){ return x.id === osId; });
  if(!o){ aviso('Salve o chamado antes de imprimir.'); return; }
  const cl = (db.clientes || []).find(function(c){ return c.id === o.clienteId; }) || {};
  const loja = lojaRodape();
  const fin = chamadoFinalizado(o);
  const p = parqueDaOs(o);
  const showColor = !o.contratoId || temColor(p, o);
  const imp = window.AJUSTES_V5186_PURE.dadosImpressora(o, db);
  let pecas = Array.isArray(o.pecas) ? o.pecas.map(normItem) : [];
  while(pecas.length < 5) pecas.push({ descricao:'', qtd:'', subtotal:'' });
  const cell = function(x){ return fin ? esc(x == null || x === '' ? '' : x) : ''; };
  const cellM = function(x){ return fin && x !== '' && x != null ? esc(money(x)) : ''; };
  const dataCad = dataBR(o.criadoEm || o.dataAbertura);
  const dataAt = fin && o.dataAtendimento ? dataBR(o.dataAtendimento) : '&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;';
  const pb = fin && o.contadorAtual != null && String(o.contadorAtual).trim() !== '' ? esc(String(o.contadorAtual)) : '';
  const cor = fin && o.contadorColor != null && String(o.contadorColor).trim() !== '' ? esc(String(o.contadorColor)) : '';
  const endCli = [cl.endereco || cl.rua || cl.logradouro, cl.numero, cl.bairro, cl.cidade, cl.uf || cl.estado, cl.cep].filter(Boolean).join(' • ');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Chamado ${esc(o.numero||'')}</title>
  <style>
    @page{size:A4;margin:10mm}
    *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
    html,body{margin:0;padding:0} body{font-family:Arial,sans-serif;color:#111;font-size:12px}
    .page{height:277mm;max-height:277mm;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden}
    .head{display:flex;gap:12px;align-items:center;padding-bottom:8px;border-bottom:3px solid #0a1e8a}
    .head img{height:50px}.head h1{margin:0;color:#0a1e8a;font-size:18px}
    .muted{color:#64748b;font-size:11px}
    .cards{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}
    .card{border:1px solid #cbd5e1;border-radius:10px;padding:8px 10px;background:#f8fafc}
    .card .t{color:#0a1e8a;font-weight:800;font-size:10px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px}
    .imp-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px 12px}
    .faixa{background:#0a1e8a!important;color:#fff!important;text-align:center;font-weight:800;padding:6px;margin:8px 0 4px;border-radius:6px}
    table{width:100%;border-collapse:collapse} th,td{border:1px solid #cbd5e1;padding:5px}
    th{background:#eef2ff!important;color:#0a1e8a}
    .box-write{border:1px solid #94a3b8;border-radius:8px;min-height:48px;padding:6px 10px;background-image:repeating-linear-gradient(#fff 0 20px,#cbd5e1 20px 21px)}
    .foot{margin-top:auto;padding-top:10px}
    .assin{display:flex;justify-content:space-between;gap:48px;margin-bottom:12px}
    .assin div{flex:1;text-align:center;border-top:1px solid #111;padding-top:6px}
    .rodape-loja-final{border-top:1px solid #d8dee9;padding-top:4px;text-align:center;font-size:8.5px;color:#5b6472}
    @media print{.no-print{display:none!important}}
  </style></head><body>
  <div class="no-print" style="padding:8px"><button onclick="window.print()">Imprimir</button></div>
  <div class="page">
  <div class="head"><img src="${logoSrc()}"><div><h1>${esc(loja.fantasia)}</h1><div class="muted">${esc(loja.razao)}</div></div>
    <div style="margin-left:auto;text-align:right"><b>OS ${esc(o.numero||'')}</b></div></div>
  <div class="cards">
    <div class="card"><div class="t">Dados do Cliente</div><b>${esc(cl.nome||'')}</b><div class="muted">${esc(cl.documento||'')} • ${esc(cl.telefone||'')}</div>${endCli?`<div class="muted">${esc(endCli)}</div>`:''}</div>
    <div class="card"><div class="t">Dados de Atendimento</div>
      <div>Técnico: <b>${esc(o.tecnico||'')}</b></div>
      <div>Motivo / Defeito: <b>${esc(o.descricao||'')}</b></div>
      <div class="muted">Cadastro: ${esc(dataCad)} • Atendimento: ${dataAt}</div>
    </div>
  </div>
  <div class="card" style="margin:0 0 8px"><div class="t">Impressora</div>
    <div class="imp-grid">
      <div>Modelo: <b>${esc(imp.modelo||'-')}</b></div>
      <div>Patrimônio: <b>${esc(imp.patrimonio||'-')}</b></div>
      <div>Serial: <b>${esc(imp.serie||'-')}</b></div>
      <div>Local: <b>${esc(imp.local||'-')}</b></div>
    </div>
  </div>
  <div class="faixa">SERVIÇOS EXECUTADOS</div>
  <div class="box-write">${cell(o.servicos)}</div>
  <div class="faixa">PRODUTOS / PEÇAS UTILIZADAS</div>
  <table><thead><tr><th style="width:62%">Descrição</th><th>Quantidade</th><th>Valor</th></tr></thead><tbody>
  ${pecas.slice(0,5).map(function(it){ return `<tr><td>${cell(it.descricao)}&nbsp;</td><td>${cell(it.qtd)}&nbsp;</td><td>${it.subtotal===''?'':cellM(it.subtotal)}&nbsp;</td></tr>`; }).join('')}
  </tbody></table>
  <div class="faixa">OBSERVAÇÃO</div>
  <div class="box-write">${cell(o.observacao)}</div>
  <p style="margin-top:10px;font-size:13px">
    <b>Contador preto:</b> <span style="display:inline-block;border-bottom:1px solid #111;min-width:130px;height:16px;text-align:center">${pb}</span>
    ${showColor?'&nbsp;&nbsp;<b>Contador color:</b> <span style="display:inline-block;border-bottom:1px solid #111;min-width:130px;height:16px;text-align:center">'+cor+'</span>':''}
  </p>
  <div class="foot">
    <div class="assin"><div>Assinatura do técnico</div><div>Assinatura do cliente</div></div>
    <div class="rodape-loja-final"><b>${esc(loja.fantasia)}</b>${loja.razao?' • '+esc(loja.razao):''}${loja.cnpj?' • CNPJ '+esc(loja.cnpj):''}<br>${esc(loja.end||'Endereço não informado')}${loja.tel?' • Tel. '+esc(loja.tel):''}${loja.whats?' • WhatsApp '+esc(loja.whats):''}${loja.email?' • '+esc(loja.email):''}</div>
  </div>
  </div></body></html>`;
  const w = window.open('', '_blank'); if(w){ w.document.write(html); w.document.close(); }
};

// ═════════════════════════════════════════════════════════════════════════
// Itens 1.2 + 4.1 — peças "igual vendas" e faixas no chamado de CONTRATO
// (MutationObserver: roda em qualquer timing/formulário, idempotente)
// ═════════════════════════════════════════════════════════════════════════
function garantirFaixaCSS(){
  if(document.getElementById('faixa-chamado-v5186-css')) return;
  const st = document.createElement('style');
  st.id = 'faixa-chamado-v5186-css';
  st.textContent = '.faixa-chamado-final{margin:10px 0 6px;padding:7px 10px;background:#0a1e8a;color:#fff;border-radius:10px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}';
  if(document.head) document.head.appendChild(st);
}

function garantirFaixasChamado(){
  const body = document.getElementById('modal-body');
  if(!body) return;
  const titleEl = document.getElementById('modal-title');
  const title = titleEl ? (titleEl.innerText || '') : '';
  if(!/chamado|ordem/i.test(title)) return;
  const els = body.querySelectorAll('label, p');
  for(let i = 0; i < els.length; i++){
    const el = els[i];
    const t = el.innerText || el.textContent || '';
    if(!window.AJUSTES_V5186_PURE.deveTerFaixa(t)) continue;
    if(el.dataset.faixa5186) continue;
    const prev = el.previousElementSibling;
    if(prev && prev.classList && prev.classList.contains('faixa-chamado-final')) continue;
    const faixa = document.createElement('div');
    faixa.className = 'faixa-chamado-final';
    faixa.textContent = window.AJUSTES_V5186_PURE.tituloFaixa(t);
    el.parentNode.insertBefore(faixa, el);
    el.dataset.faixa5186 = '1';
  }
}

// HTML da área de peças "igual vendas" (mesma estrutura do v5.18.2)
function htmlPecasVendas5186(prefix){
  return `<div class="rounded-xl border p-3 bg-[#f8f9ff]" id="${prefix}-pecas-box" data-pecas5186="1">
    <p class="font-bold text-slate-700 mb-2">Produtos / Peças usadas</p>
    <div class="grid grid-cols-12 gap-2 items-end">
      <label class="col-span-12 md:col-span-5 text-[11px] font-bold uppercase text-slate-500 relative">Descrição ou código
        <div class="flex gap-1 mt-1">
          <input id="${prefix}-prod-search" class="flex-1 h-10 px-3 rounded-xl border bg-white" placeholder="Nome, código, ref. — Enter ou lupa" autocomplete="off">
          <button type="button" id="${prefix}-prod-lupa" class="h-10 px-3 rounded-xl bg-[#0a1e8a] text-white font-bold"><i class="ph ph-magnifying-glass"></i></button>
        </div>
        <div id="${prefix}-prod-results" class="hidden absolute z-30 left-0 right-0 mt-1 max-h-[220px] overflow-auto rounded-xl border bg-white shadow-xl"></div>
      </label>
      <label class="col-span-3 md:col-span-1 text-[11px] font-bold uppercase text-slate-500">Qtd
        <input id="${prefix}-prod-qtd" type="number" min="1" value="1" oninput="lcPecaCalc('${prefix}')" class="mt-1 w-full h-10 px-2 rounded-xl border bg-white"></label>
      <label class="col-span-4 md:col-span-2 text-[11px] font-bold uppercase text-slate-500">Valor
        <input id="${prefix}-prod-preco" type="number" step="0.01" value="" oninput="lcPecaCalc('${prefix}')" class="mt-1 w-full h-10 px-2 rounded-xl border bg-white"></label>
      <label class="col-span-3 md:col-span-2 text-[11px] font-bold uppercase text-slate-500">Desc. R$
        <input id="${prefix}-prod-desc" type="number" step="0.01" value="0" oninput="lcPecaCalc('${prefix}')" class="mt-1 w-full h-10 px-2 rounded-xl border bg-white"></label>
      <label class="col-span-6 md:col-span-2 text-[11px] font-bold uppercase text-slate-500">Valor final
        <input id="${prefix}-prod-total" readonly class="mt-1 w-full h-10 px-2 rounded-xl border bg-slate-100 font-bold"></label>
    </div>
    <div class="flex justify-end mt-2">
      <button type="button" onclick="lcAddPecaManual('${prefix}')" class="h-10 px-5 rounded-xl bg-emerald-600 text-white font-bold">Adicionar item</button>
    </div>
    <div id="${prefix}-pecas-list" class="mt-3"></div>
  </div>`;
}

function garantirPecasVendas(prefix){
  const box = document.getElementById(prefix + '-pecas-box');
  if(!box) return;
  // já está "igual vendas"?
  if(document.getElementById(prefix + '-prod-total')) return;
  // rebaixa para a versão completa
  const wrap = document.createElement('div');
  wrap.innerHTML = htmlPecasVendas5186(prefix);
  const novo = wrap.firstChild;
  box.replaceWith(novo);
  const inp = document.getElementById(prefix + '-prod-search');
  const lupa = document.getElementById(prefix + '-prod-lupa');
  if(inp){
    inp.removeAttribute('oninput'); inp.oninput = null;
    inp.onkeydown = function(e){ if(e.key === 'Enter'){ e.preventDefault(); if(typeof window.lcBuscarPeca === 'function') window.lcBuscarPeca(prefix); } };
  }
  if(lupa) lupa.onclick = function(ev){ ev.preventDefault(); ev.stopPropagation(); if(typeof window.lcBuscarPeca === 'function') window.lcBuscarPeca(prefix); };
  if(typeof window.lcRenderPecas === 'function') window.lcRenderPecas(prefix);
  if(typeof window.lcPecaCalc === 'function') window.lcPecaCalc(prefix);
}

function garantirChamadoContrato(){
  garantirFaixasChamado();
  garantirPecasVendas('ko');
  garantirPecasVendas('ca');
}

garantirFaixaCSS();

// Reforço na abertura do formulário de contrato + avulso
const _openContrato = window.openModalChamadoCompleto;
if(typeof _openContrato === 'function'){
  window.openModalChamadoCompleto = function(){
    const r = _openContrato.apply(this, arguments);
    setTimeout(garantirChamadoContrato, 60);
    setTimeout(garantirChamadoContrato, 260);
    setTimeout(garantirChamadoContrato, 600);
    return r;
  };
}
const _abrirAvulso = window.abrirChamadoAvulsoForm;
if(typeof _abrirAvulso === 'function'){
  window.abrirChamadoAvulsoForm = function(){
    const r = _abrirAvulso.apply(this, arguments);
    setTimeout(garantirChamadoContrato, 120);
    setTimeout(garantirChamadoContrato, 400);
    return r;
  };
}

// Observer que roda sempre que o modal muda (pega qualquer recriação de form)
let _gcTimer = null;
function agendarGarantir(){
  if(_gcTimer) return;
  _gcTimer = setTimeout(function(){
    _gcTimer = null;
    garantirChamadoContrato();
  }, 90);
}
try{
  new MutationObserver(function(){ agendarGarantir(); }).observe(document.body, { childList: true, subtree: true });
}catch(e){}

// ═════════════════════════════════════════════════════════════════════════
// Item 5 — aviso de carregamento da nuvem (bloqueia até carregar / erro)
// ═════════════════════════════════════════════════════════════════════════
function ensureCloudOverlay(){
  let d = document.getElementById('cloud-load-overlay');
  if(d) return d;
  d = document.createElement('div');
  d.id = 'cloud-load-overlay';
  d.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:999990;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(255,255,255,0.97);font-family:Arial,sans-serif;';
  d.innerHTML = `<div style="text-align:center;max-width:460px;padding:0 24px">
    <div id="cloud-overlay-spin" style="width:46px;height:46px;margin:0 auto 16px;border:4px solid #e0e7ff;border-top-color:#0a1e8a;border-radius:50%;animation:cloudspin5186 0.8s linear infinite"></div>
    <p id="cloud-overlay-title" style="font-size:16px;font-weight:800;color:#0f172a;margin:0 0 8px">Carregando dados da nuvem...</p>
    <p id="cloud-overlay-msg" style="font-size:13px;color:#64748b;margin:0;line-height:1.5">Aguarde enquanto sincronizamos seus dados.</p>
    <div id="cloud-overlay-actions" style="margin-top:18px;display:none;justify-content:center;gap:10px">
      <button id="cloud-overlay-retry" type="button" style="height:42px;padding:0 22px;border-radius:11px;background:#0a1e8a;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer">Tentar novamente</button>
      <button id="cloud-overlay-close" type="button" style="height:42px;padding:0 22px;border-radius:11px;background:#fff;border:1px solid #cbd5e1;color:#334155;font-size:13px;font-weight:700;cursor:pointer">Continuar mesmo assim</button>
    </div>
  </div>`;
  document.body.appendChild(d);
  const st = document.createElement('style');
  st.textContent = '@keyframes cloudspin5186{to{transform:rotate(360deg)}}';
  if(document.head) document.head.appendChild(st);
  return d;
}
function cloudLoading(msg){
  const d = ensureCloudOverlay();
  const t = document.getElementById('cloud-overlay-title');
  const m = document.getElementById('cloud-overlay-msg');
  const a = document.getElementById('cloud-overlay-actions');
  const s = document.getElementById('cloud-overlay-spin');
  if(t) t.textContent = 'Carregando dados da nuvem...';
  if(m) m.textContent = msg || 'Aguarde enquanto sincronizamos seus dados.';
  if(a) a.style.display = 'none';
  if(s) s.style.display = 'block';
  d.style.display = 'flex';
}
function cloudError(msg){
  const d = ensureCloudOverlay();
  const t = document.getElementById('cloud-overlay-title');
  const m = document.getElementById('cloud-overlay-msg');
  const a = document.getElementById('cloud-overlay-actions');
  const s = document.getElementById('cloud-overlay-spin');
  if(t) t.textContent = 'Não foi possível carregar a nuvem';
  if(m) m.textContent = (msg || 'Erro ao carregar os dados da nuvem.') + '\nVerifique a conexão com a internet e a configuração do Google Firebase, depois tente novamente.';
  if(a) a.style.display = 'flex';
  if(s) s.style.display = 'none';
  d.style.display = 'flex';
}
function cloudHide(){
  const d = document.getElementById('cloud-load-overlay');
  if(d) d.style.display = 'none';
}

const _syncLoad = window.syncCarregarDaNuvem;
if(typeof _syncLoad === 'function'){
  window.syncCarregarDaNuvem = async function(){
    const automatico = arguments[0] && arguments[0].automatico === true;
    if(automatico) cloudLoading('Buscando seus dados na nuvem...');
    const r = await _syncLoad.apply(this, arguments);
    if(automatico){
      if(r && r.ok){
        // Vai recarregar a página — mantém o aviso até a recarga acontecer.
      } else if(r && r.vazio){
        cloudHide(); // nuvem sem dados ainda = instalação nova, deixa entrar
      } else if(r && r.cancelado){
        cloudHide(); // proteção/cancelamento: deixa entrar normalmente
      } else {
        const msg = (r && r.erros && r.erros.length) ? r.erros[0] : 'Erro ao carregar os dados da nuvem.';
        cloudError(msg);
        const retry = document.getElementById('cloud-overlay-retry');
        const close = document.getElementById('cloud-overlay-close');
        if(retry) retry.onclick = function(){ window.syncCarregarDaNuvem({confirmar:false, automatico:true}); };
        if(close) close.onclick = cloudHide;
      }
    }
    return r;
  };
}

// ═════════════════════════════════════════════════════════════════════════
// Item 5.1 — aviso "Bem-vindo, Fulano!" com um botão (OK)
// ═════════════════════════════════════════════════════════════════════════
const _doLogin = window.doLoginUser;
if(typeof _doLogin === 'function'){
  window.doLoginUser = function(){
    const antes = typeof getSession === 'function' ? getSession() : null;
    const antesNome = antes ? antes.usuarioNome : null;
    const r = _doLogin.apply(this, arguments);
    setTimeout(function(){
      const s = typeof getSession === 'function' ? getSession() : null;
      const nome = s ? s.usuarioNome : null;
      if(nome && nome !== antesNome){
        const msg = 'Bem-vindo, ' + nome + '!';
        if(typeof window.lfbAlert === 'function') window.lfbAlert(msg, 'Bem-vindo');
        else if(typeof toast === 'function') toast(msg, 'success');
      }
    }, 350);
    return r;
  };
}

console.log('[DIGICOPY] ajustes_v5186_patch.js');
})();
