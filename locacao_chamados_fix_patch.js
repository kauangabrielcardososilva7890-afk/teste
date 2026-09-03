// PATCH v5.16.0 — Locação + Chamados (contrato e avulso)
(function(){
'use strict';

function esc(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function txt(v){ return String(v??'').trim(); }
function low(v){ return txt(v).toLowerCase(); }
function n(v,fb){ const x=Number(String(v??'').replace(',','.')); return Number.isFinite(x)?x:(fb||0); }
function hoje(){ return new Date().toISOString().slice(0,10); }
function dia(v){ return String(v||'').slice(0,10); }
function sess(){ return typeof getSession==='function'?getSession():null; }
function toastMsg(m,t){ if(typeof window.lfbAlert==='function') window.lfbAlert(m,'Aviso'); else if(typeof toast==='function') toast(m,t||'info'); }
function clienteTemContrato(clienteId){
  return (db.contratos||[]).some(c => c.clienteId===clienteId && c.status!=='excluido' && c.status!=='encerrado');
}
function parqueAtivo(p){ return p && p.status!=='inativo' && p.modalidade!=='inativo'; }
// v5.22.73 — quem manda é a MODALIDADE do medidor color no cadastro da
// impressora: Color A4 ou Color A3 com modalidade ativa. O palpite pelo nome do
// tipo do equipamento saiu — era ele que fazia máquina preto e branco pedir
// contador color.
function modalidadeAtiva(med){
  if(!med) return false;
  const mod = String(med.modalidade || med.mod || '').toLowerCase();
  return !!(mod && mod !== 'inativo' && mod !== 'off');
}
function impressoraTemColor(p, eq){
  const meds = (p && (p.medidoresConfig||p.medidores)) || {};
  if(modalidadeAtiva(meds.colorA4) || modalidadeAtiva(meds.colorA3)) return true;
  const medsEq = (eq && (eq.medidoresConfig||eq.medidores)) || {};
  if(modalidadeAtiva(medsEq.colorA4) || modalidadeAtiva(medsEq.colorA3)) return true;
  return false;
}
function chamadoDeContrato(o){ return !!(o && o.contratoId); }

// ── 1.1 / 1.2 Impressora do contrato ──
function injetarAjustesImpressora(){
  const body = document.getElementById('modal-body');
  if(!body) return;
  body.querySelectorAll('input[id$="-ativo"], input[id*="-ativo"]').forEach(ch=>{
    const lab = ch.closest('label') || ch.parentElement;
    if(lab) lab.remove();
    else ch.remove();
  });
}

const _abrirImp = window.abrirModalEquipamentoContrato;
if(typeof _abrirImp==='function'){
  window.abrirModalEquipamentoContrato = function(contratoId, parqueId){
    const r = _abrirImp.apply(this, arguments);
    window.modalContext = Object.assign(window.modalContext||{}, { type:'impressoraContrato', contratoId, parqueId });
    setTimeout(injetarAjustesImpressora, 50);
    return r;
  };
}

function wrapSalvarImp(nome){
  const orig = window[nome];
  if(typeof orig!=='function' || orig.__lcWrap) return;
  window[nome] = function(){
    const mods = Array.from(document.querySelectorAll('select[id^="impf-"][id$="-mod"], select[id^="imp-med-"][id$="-mod"]'));
    if(mods.length){
      const algumAtivo = mods.some(sel => String(sel.value||'') !== 'inativo');
      if(!algumAtivo){
        toastMsg('Deixe ao menos UMA modalidade ativa. Só bloqueia se TODAS estiverem Inativo.','error');
        return;
      }
    }
    return orig.apply(this, arguments);
  };
  window[nome].__lcWrap = true;
}
wrapSalvarImp('salvarImpressoraContrato');

// ── 3.1 Menu Locação ──
function montarMenuLocacao(){
  const menu = document.getElementById('menu-outsourcing');
  if(!menu) return;
  menu.innerHTML =
    '<button onclick="navigateTo(\'contratos\')"><i class="ph ph-file-text"></i>Contratos</button>'+
    '<button onclick="navigateTo(\'impressoras\')"><i class="ph ph-printer"></i>Impressoras</button>';
  // v5.22.81: Chamados NÃO é submenu de Locação. Era esta função que recolocava
  // o botão a cada navegação, por isso ele voltava mesmo depois de removido dos
  // outros lugares. Os chamados continuam em Atendimento e dentro do contrato.
}
const _nav = window.navigateTo;
if(typeof _nav==='function' && !_nav.__lcMenu){
  window.navigateTo = function(view){
    if(view==='parque' || view==='leituras'){
      if(view==='leituras'){
        toastMsg('As leituras ficam dentro do contrato. Abra Locação > Contratos.','info');
        return _nav.call(this, 'contratos');
      }
      return _nav.call(this, 'impressoras');
    }
    if(view==='manutencao'){
      abrirHistoricoChamadosGeral();
      return;
    }
    const r = _nav.apply(this, arguments);
    setTimeout(montarMenuLocacao, 0);
    return r;
  };
  window.navigateTo.__lcMenu = true;
}
window.openQuickOS = function(){ abrirHistoricoChamadosGeral(); };
setTimeout(montarMenuLocacao, 800);

// ── 6 Impressoras unificadas ──
const _re = window.renderEquipamentos;
window.renderEquipamentos = function(){
  const s = sess(); if(!s) return;
  const view = document.getElementById('view-impressoras');
  if(!view){ if(_re) return _re.apply(this, arguments); return; }
  const q = low(document.getElementById('lc-imp-busca')?.value||'');
  const lista = (db.equipamentos||[]).filter(e=>e.empresaId===s.empresaId).map(e=>{
    const p = (db.parque||[]).find(x=>x.equipamentoId===e.id);
    const c = p && (db.contratos||[]).find(x=>x.id===p.contratoId);
    const cli = (p&&p.clienteId) ? (db.clientes||[]).find(x=>x.id===p.clienteId) : (c&&c.clienteId?(db.clientes||[]).find(x=>x.id===c.clienteId):null);
    return { e, p, c, cli };
  }).filter(x=>{
    if(!q) return true;
    return [x.e.modelo,x.e.serie,x.e.patrimonio,x.cli&&x.cli.nome,x.e.contadorPB].some(v=>low(v).includes(q));
  });
  view.innerHTML = `<div class="neo-shell"><div class="neo-panel"><div class="neo-head"><div><h3>Impressoras</h3><p>Todas as impressoras cadastradas nos clientes</p></div></div>
    <div class="p-4 border-b"><input id="lc-imp-busca" value="${esc(document.getElementById('lc-imp-busca')?.value||'')}" onkeydown="if(event.key==='Enter')renderEquipamentos()" placeholder="Serial, modelo, patrimônio, cliente..." class="neo-input w-full max-w-[420px]"></div>
    <div class="overflow-auto max-h-[calc(100vh-260px)]"><table class="neo-table"><thead><tr><th>Modelo</th><th>Serial</th><th>Patrimônio</th><th>Contador PB</th><th>Color</th><th>Cliente</th><th>Contrato</th><th>Situação</th></tr></thead><tbody>
    ${lista.map(x=>`<tr class="cursor-pointer" ondblclick="${x.c?`openContratoCompleto('${x.c.id}')`:''}"><td><b>${esc(x.e.modelo||'')}</b></td><td class="font-mono">${esc(x.e.serie||'-')}</td><td class="font-mono">${esc(x.e.patrimonio||'-')}</td><td>${n(x.e.contadorPB)}</td><td>${impressoraTemColor(x.p,x.e)?'Sim':'Não'}</td><td>${esc(x.cli?x.cli.nome:'-')}</td><td>${esc(x.c?x.c.numero:'fora de contrato')}</td><td>${esc((x.p&&x.p.status)||x.e.status||'')}</td></tr>`).join('')||'<tr><td colspan="8" class="text-center py-10 text-slate-400">Nenhuma impressora</td></tr>'}
    </tbody></table></div></div></div>`;
};

// ── Filtros de chamado ──
window.__lcChamFiltro = window.__lcChamFiltro || { tab:'hoje', de:'', ate:'', campo:'nome', q:'', origem:'todos' };

function listaChamadosFiltrada(opts){
  opts = opts||{};
  const F = window.__lcChamFiltro;
  const s = sess(); if(!s) return [];
  let list = (db.os||[]).filter(o=>!o.empresaId || o.empresaId===s.empresaId);
  if(opts.contratoId) list = list.filter(o=>o.contratoId===opts.contratoId || (!o.contratoId && o.clienteId && (db.contratos||[]).some(c=>c.id===opts.contratoId && c.clienteId===o.clienteId)));
  if(!opts.contratoId){
    if(F.origem==='contrato') list = list.filter(chamadoDeContrato);
    if(F.origem==='avulso') list = list.filter(o=>!chamadoDeContrato(o));
  }
  if(F.tab==='hoje' && !F.de && !F.ate && !F.q) list = list.filter(o=>dia(o.dataAbertura||o.criadoEm)===hoje());
  if(F.de) list = list.filter(o=>dia(o.dataAbertura||o.criadoEm)>=F.de);
  if(F.ate) list = list.filter(o=>dia(o.dataAbertura||o.criadoEm)<=F.ate);
  if(F.q){
    const q = low(F.q);
    list = list.filter(o=>{
      const cli = (db.clientes||[]).find(c=>c.id===o.clienteId)||{};
      const eq = (db.equipamentos||[]).find(e=>e.id===o.equipamentoId)||{};
      const mapa = {
        nome: cli.nome,
        motivo: o.descricao,
        equipamento: o.modelo||eq.modelo,
        serial: o.serie||eq.serie,
        patrimonio: o.patrimonio||eq.patrimonio,
        'técnico/atribuido': o.tecnico,
        'tecnico/atribuido': o.tecnico,
        'cód venda': o.vendaNumero||o.vendaId,
        'cod venda': o.vendaNumero||o.vendaId,
        'cód chamado': o.numero,
        'cod chamado': o.numero
      };
      const chave = low(F.campo||'nome');
      const val = mapa[chave] != null ? mapa[chave] : [cli.nome,o.descricao,o.modelo,o.serie,o.patrimonio,o.tecnico,o.numero].join(' ');
      return low(val).includes(q);
    });
  }
  return list.sort((a,b)=>new Date(b.dataAbertura||0)-new Date(a.dataAbertura||0));
}

function htmlFiltrosChamado(prefix, contratoId){
  const F = window.__lcChamFiltro;
  const origem = contratoId ? '' : `<select id="${prefix}-origem" onchange="window.__lcChamFiltro.origem=this.value; ${prefix==='lcg'?'abrirHistoricoChamadosGeral()':'abrirChamadosContrato(\''+contratoId+'\')'}" class="h-10 px-2 rounded-xl border text-[12px]"><option value="todos" ${F.origem==='todos'?'selected':''}>Todos</option><option value="contrato" ${F.origem==='contrato'?'selected':''}>Chamados de contrato</option><option value="avulso" ${F.origem==='avulso'?'selected':''}>Chamados fora de contrato</option></select>`;
  return `<div class="flex flex-wrap gap-2 items-center">
    <button onclick="window.__lcChamFiltro.tab='hoje';window.__lcChamFiltro.de='';window.__lcChamFiltro.ate='';window.__lcChamFiltro.q='';${prefix==='lcg'?'abrirHistoricoChamadosGeral()':'abrirChamadosContrato(\''+contratoId+'\')'}" class="neo-btn ${F.tab==='hoje'&&!F.de&&!F.q?'primary':''}">Hoje</button>
    <button onclick="window.__lcChamFiltro.tab='todos';${prefix==='lcg'?'abrirHistoricoChamadosGeral()':'abrirChamadosContrato(\''+contratoId+'\')'}" class="neo-btn ${F.tab==='todos'?'primary':''}">Todos</button>
    <input type="date" value="${esc(F.de)}" onchange="window.__lcChamFiltro.de=this.value;window.__lcChamFiltro.tab='todos';${prefix==='lcg'?'abrirHistoricoChamadosGeral()':'abrirChamadosContrato(\''+contratoId+'\')'}" class="h-10 px-2 rounded-xl border text-[12px]">
    <span class="text-[12px]">até</span>
    <input type="date" value="${esc(F.ate||hoje())}" onchange="window.__lcChamFiltro.ate=this.value;window.__lcChamFiltro.tab='todos';${prefix==='lcg'?'abrirHistoricoChamadosGeral()':'abrirChamadosContrato(\''+contratoId+'\')'}" class="h-10 px-2 rounded-xl border text-[12px]">
    <select id="${prefix}-campo" onchange="window.__lcChamFiltro.campo=this.value" class="h-10 px-2 rounded-xl border text-[12px]">
      ${['Nome','Motivo','Equipamento','Serial','Patrimonio','Técnico/Atribuido','Cód Venda','Cód Chamado'].map(x=>`<option ${low(F.campo)===low(x)?'selected':''}>${x}</option>`).join('')}
    </select>
    <input id="${prefix}-q" value="${esc(F.q)}" placeholder="Filtro chamados" onkeydown="if(event.key==='Enter'){window.__lcChamFiltro.q=this.value;window.__lcChamFiltro.campo=document.getElementById('${prefix}-campo').value;window.__lcChamFiltro.tab='todos';${prefix==='lcg'?'abrirHistoricoChamadosGeral()':'abrirChamadosContrato(\''+contratoId+'\')'}}" class="h-10 px-3 rounded-xl border text-[12px] min-w-[180px]">
    ${origem}
  </div>`;
}

function linhaChamado(o, contratoId){
  const cli = (db.clientes||[]).find(c=>c.id===o.clienteId)||{};
  const fin = o.status==='concluido';
  const deContrato = chamadoDeContrato(o);
  const click = contratoId
    ? `openModalChamadoCompleto('${o.id}','${contratoId}')`
    : (deContrato ? `avisoChamadoContrato('${o.id}')` : `abrirChamadoAvulsoForm('${o.id}')`);
  return `<tr class="hover:bg-slate-50 cursor-pointer" onclick="${click}">
    <td class="px-3 py-2 font-mono font-bold text-[#0a1e8a]">${esc(o.numero||'')}</td>
    <td class="px-3 py-2">${dia(o.dataAbertura||o.criadoEm).split('-').reverse().join('/')}</td>
    <td class="px-3 py-2">${esc(cli.nome||'-')}</td>
    <td class="px-3 py-2">${esc(o.descricao||'')}</td>
    <td class="px-3 py-2">${esc(o.modelo||o.serie||'')}</td>
    <td class="px-3 py-2">${esc(o.tecnico||'')}</td>
    <td class="px-3 py-2"><span class="neo-status ${fin?'ok':'wait'}">${fin?'Finalizado':'Aberto'}</span>${deContrato&&!contratoId?' <span class="text-[10px] text-amber-700">contrato</span>':''}</td>
  </tr>`;
}

window.avisoChamadoContrato = function(id){
  const o = (db.os||[]).find(x=>x.id===id);
  if(!o) return;
  const msg = 'Esse chamado é de CONTRATO. Use o botão para abrir no contrato.';
  const abrir = () => {
    if(o.contratoId && typeof window.openModalChamadoCompleto==='function'){
      window.openModalChamadoCompleto(o.id, o.contratoId);
    } else if(o.contratoId && typeof window.abrirChamadosContrato==='function'){
      window.abrirChamadosContrato(o.contratoId);
    }
  };
  if(typeof window.confirmSistema==='function'){
    window.confirmSistema(msg+'\n\nConfirmar = abrir o chamado do contrato.','Chamado de contrato').then(ok=>{ if(ok) abrir(); });
  } else abrir();
};

// ── 3 Histórico geral (submenu Chamados) ──
window.abrirHistoricoChamadosGeral = function(){
  const list = listaChamadosFiltrada({});
  const box = document.getElementById('modal-box');
  if(box) box.className = 'w-full max-w-[1080px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[94vh] flex flex-col';
  document.getElementById('modal-title').innerText = 'Chamados';
  document.getElementById('modal-body').innerHTML = `<div class="space-y-3 text-[13px]">
    ${htmlFiltrosChamado('lcg')}
    <div class="overflow-auto max-h-[520px] border rounded-xl"><table class="w-full text-left text-[12px]"><thead class="bg-slate-50 sticky top-0"><tr><th class="px-3 py-2">Cód</th><th class="px-3 py-2">Data</th><th class="px-3 py-2">Cliente</th><th class="px-3 py-2">Motivo</th><th class="px-3 py-2">Equipamento</th><th class="px-3 py-2">Técnico</th><th class="px-3 py-2">Status</th></tr></thead><tbody>
    ${list.map(o=>linhaChamado(o,null)).join('')||'<tr><td colspan="7" class="text-center py-10 text-slate-400">Nenhum chamado neste filtro</td></tr>'}
    </tbody></table></div>
  </div>`;
  document.getElementById('modal-footer').innerHTML =
    `<button onclick="closeModal()" class="h-10 px-5 rounded-xl bg-white border font-bold">Fechar</button>
     <button onclick="novoChamadoAvulsoGuard()" class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white font-bold">+ Novo chamado (fora de contrato)</button>`;
  document.getElementById('modal-root')?.classList.remove('hidden');
};

window.novoChamadoAvulsoGuard = function(){
  window.__lcChamOrigem = 'avulso';
  abrirChamadoAvulsoForm(null);
};

// ── 2.3 lista contrato com filtros ──
const _abrirChamCtr = window.abrirChamadosContrato;
window.abrirChamadosContrato = function(contratoId){
  if(typeof _abrirChamCtr==='function') _abrirChamCtr.apply(this, arguments);
  setTimeout(()=>{
    const body = document.getElementById('modal-body');
    if(!body) return;
    const list = listaChamadosFiltrada({ contratoId });
    const extra = document.getElementById('lc-filtros-ctr');
    if(!extra){
      const wrap = document.createElement('div');
      wrap.id = 'lc-filtros-ctr';
      wrap.className = 'mb-3';
      wrap.innerHTML = htmlFiltrosChamado('lcc', contratoId);
      body.prepend(wrap);
    }
    const tb = body.querySelector('tbody');
    if(tb) tb.innerHTML = list.map(o=>linhaChamado(o, contratoId)).join('') || '<tr><td colspan="7" class="text-center py-8 text-slate-400">Nenhum chamado deste contrato no filtro</td></tr>';
  }, 40);
};

// ── 2.1 / 4 color + campos no chamado de contrato ──
function injetarCamposChamado(contrato){
  const body = document.getElementById('modal-body');
  if(!body) return;
  body.querySelectorAll('label').forEach(lab=>{
    if(/buscar impressora do cliente/i.test(lab.textContent||'')){
      const box = lab.closest('.rounded-xl') || lab.parentElement;
      if(box) box.remove();
    }
  });
  const pb = document.getElementById('ko-cont-atu') || document.getElementById('o-cont-atu') || document.getElementById('ca-cont-atu');
  if(pb && !document.getElementById('lc-cont-color-atu')){
    const cell = pb.closest('div') || pb.parentElement;
    const grid = cell && cell.parentElement;
    if(grid){
      grid.className = (grid.className||'').replace(/md:grid-cols-3/,'md:grid-cols-5');
      const divAnt = document.createElement('div');
      divAnt.innerHTML = `<label class="block font-bold text-slate-500 mb-1 text-[11px] uppercase">Contador Color Antigo</label><input id="lc-cont-color-ant" type="number" readonly class="w-full h-10 px-3 rounded-xl border bg-slate-50 font-mono">`;
      const divAtu = document.createElement('div');
      divAtu.innerHTML = `<label class="block font-bold text-[#0a1e8a] mb-1 text-[11px] uppercase">Contador Color Atual</label><input id="lc-cont-color-atu" type="number" disabled class="w-full h-10 px-3 rounded-xl border font-mono bg-slate-100" placeholder="Só se Color A4/A3 estiver ativo">`;
      if(cell.nextSibling){ grid.insertBefore(divAnt, cell.nextSibling); grid.insertBefore(divAtu, divAnt.nextSibling); }
      else { grid.appendChild(divAnt); grid.appendChild(divAtu); }
    }
  }
  if(!document.getElementById('lc-data-atend')){
    const geral = document.getElementById('ko-painel-geral') || document.getElementById('painel-os-geral') || body;
    const d = document.createElement('div');
    d.innerHTML = `<label class="block font-bold text-slate-600 mb-1 mt-2">Data de atendimento</label><input id="lc-data-atend" type="date" class="w-full h-10 px-3 rounded-xl border max-w-[220px]">`;
    geral.appendChild(d);
  }
  if(!document.getElementById('lc-pecas') && !document.getElementById('ko-produto')){
    const finais = document.getElementById('ko-painel-finais') || document.getElementById('painel-os-finais') || body;
    const d = document.createElement('div');
    d.innerHTML = `<label class="block font-bold text-slate-600 mb-1 mt-2">Produtos / peças utilizadas</label><div id="lc-pecas-wrap" class="space-y-1">${[0,1,2,3,4].map(i=>`<div class="grid grid-cols-12 gap-2"><input id="lc-peca-desc-${i}" placeholder="Descrição" class="col-span-8 h-9 px-2 rounded-lg border"><input id="lc-peca-qtd-${i}" placeholder="Qtd" class="col-span-4 h-9 px-2 rounded-lg border"></div>`).join('')}</div><textarea id="lc-pecas" class="hidden"></textarea>`;
    finais.appendChild(d);
  }
  const colorAtu = document.getElementById('lc-cont-color-atu');
  if(colorAtu && !contrato){
    colorAtu.disabled = false;
    colorAtu.classList.remove('bg-slate-100');
    colorAtu.addEventListener('focus', function(){
      if(this.dataset.warned) return;
      const ok = () => { this.dataset.warned='1'; this.focus(); };
      if(typeof window.lfbAlert==='function'){
        window.lfbAlert('Certifique que essa impressora do chamado realmente tem contador color.','Contador color').then(ok);
      } else { alert('Certifique que essa impressora do chamado realmente tem contador color.'); this.dataset.warned='1'; }
    });
  }
}

function atualizarColorPorImpressora(equipId){
  const p = (db.parque||[]).find(x=>x.equipamentoId===equipId);
  const eq = (db.equipamentos||[]).find(x=>x.id===equipId);
  const tem = impressoraTemColor(p, eq);
  const el = document.getElementById('lc-cont-color-atu');
  const ant = document.getElementById('lc-cont-color-ant');
  if(ant) ant.value = eq ? (eq.contadorCor||0) : 0;
  if(!el) return;
  if(tem){
    el.disabled = false;
    el.classList.remove('bg-slate-100');
  } else {
    el.disabled = true;
    el.value = '';
    el.classList.add('bg-slate-100');
  }
}

const _auto = window.autoPreencherDadosChamado;
if(typeof _auto==='function'){
  window.autoPreencherDadosChamado = function(equipId){
    const r = _auto.apply(this, arguments);
    setTimeout(()=>atualizarColorPorImpressora(equipId), 20);
    return r;
  };
}

const _openCham = window.openModalChamadoCompleto;
if(typeof _openCham==='function'){
  window.openModalChamadoCompleto = function(osId, contratoId){
    window.__lcChamDirty = false;
    window.__lcChamPersistida = !!osId;
    window.__lcChamFormAberto = true;
    window.modalContext = Object.assign(window.modalContext||{}, { type:'chamado', id:osId||'', contratoId:contratoId||'' });
    const r = _openCham.apply(this, arguments);
    setTimeout(()=>{
      injetarCamposChamado(true);
      const o = osId && (db.os||[]).find(x=>x.id===osId);
      if(o){
        const da = document.getElementById('lc-data-atend'); if(da) da.value = dia(o.dataAtendimento||'');
        const pc = document.getElementById('lc-pecas'); if(pc) pc.value = o.pecasTexto || (Array.isArray(o.pecas)?o.pecas.map(p=>p.descricao).join(', '):'') || '';
        const ca = document.getElementById('lc-cont-color-atu'); if(ca && o.contadorColor!=null) ca.value = o.contadorColor;
      }
      if(o && o.equipamentoId) atualizarColorPorImpressora(o.equipamentoId);
      const eqSel = document.getElementById('ko-equip')?.value;
      if(eqSel) atualizarColorPorImpressora(eqSel);
      marcarDirtyChamado();
    }, 80);
    setTimeout(()=>injetarCamposChamado(true), 200);
    return r;
  };
}

function marcarDirtyChamado(){
  const body = document.getElementById('modal-body');
  if(!body) return;
  body.addEventListener('input', ()=>{ window.__lcChamDirty = true; }, { once:false });
}

// Descobre a impressora do chamado aberto e responde se ela tem contador color.
// Sem impressora identificada, a resposta é não — nunca travar por dúvida.
function chamadoTemColor(){
  let equipId = document.getElementById('ko-equip')?.value
    || document.getElementById('ca-equip')?.value || '';
  if(!equipId){
    const id = window.modalContext && window.modalContext.id;
    const o = id ? (db.os||[]).find(x=>x.id===id) : null;
    equipId = (o && o.equipamentoId) || '';
  }
  if(!equipId) return false;
  const p = (db.parque||[]).find(x=>x.equipamentoId===equipId);
  const eq = (db.equipamentos||[]).find(x=>x.id===equipId);
  return impressoraTemColor(p, eq);
}

function validarFinalizar(contrato){
  const chk = document.getElementById('ko-concluido') || document.getElementById('o-concluido') || document.getElementById('ca-concluido');
  if(!chk || !chk.checked) return true;
  const pb = document.getElementById('ko-cont-atu') || document.getElementById('o-cont-atu') || document.getElementById('ca-cont-atu');
  const motivo = document.getElementById('ko-desc') || document.getElementById('o-desc') || document.getElementById('ca-desc');
  const dataAt = document.getElementById('lc-data-atend');
  if(!txt(pb && pb.value)){ toastMsg('Preencha o contador preto atual para finalizar.','error'); return false; }
  if(!txt(motivo && motivo.value)){ toastMsg('Preencha Motivo / Defeito para finalizar.','error'); return false; }
  if(!txt(dataAt && dataAt.value)){ toastMsg('Preencha a data de atendimento para finalizar.','error'); return false; }
  // v5.22.73 — antes bastava o campo estar habilitado para o sistema exigir o
  // contador color, e ele nasce habilitado. Impressora preto e branco ficava
  // presa pedindo um número que ela não tem. Agora só pede se a impressora do
  // chamado realmente tiver contador color no cadastro.
  const colorEl = document.getElementById('lc-cont-color-atu');
  if(contrato && colorEl && !colorEl.disabled && chamadoTemColor() && !txt(colorEl.value)){
    toastMsg('Preencha o contador color atual para finalizar.','error'); return false;
  }
  if(!contrato){
    const imp = document.getElementById('ca-modelo') || document.getElementById('ko-modelo');
    const ser = document.getElementById('ca-serie') || document.getElementById('ko-serie');
    if(!txt(imp && imp.value)){ toastMsg('Preencha a impressora para finalizar.','error'); return false; }
    if(!txt(ser && ser.value)){ toastMsg('Preencha o serial para finalizar.','error'); return false; }
  }
  return true;
}

function coletarExtrasChamado(){
  return {
    dataAtendimento: document.getElementById('lc-data-atend')?.value || '',
    pecasTexto: document.getElementById('lc-pecas')?.value || '',
    contadorColor: document.getElementById('lc-cont-color-atu')?.disabled ? null : n(document.getElementById('lc-cont-color-atu')?.value, null),
    contadorColorAntigo: n(document.getElementById('lc-cont-color-ant')?.value, 0)
  };
}

function wrapSalvarChamado(nome, isContrato){
  const orig = window[nome];
  if(typeof orig!=='function' || orig.__lcWrap) return;
  window[nome] = function(){
    if(!validarFinalizar(isContrato)) return;
    const extras = coletarExtrasChamado();
    const equipId = document.getElementById('ko-equip')?.value || document.getElementById('ca-modelo') && window.__CHAMADO_AVULSO?.equipamentoId;
    const eq0 = (db.equipamentos||[]).find(e=>e.id===equipId);
    const snap = eq0 ? {pb:eq0.contadorPB, cor:eq0.contadorCor} : null;
    const r = orig.apply(this, arguments);
    if(snap && eq0){ eq0.contadorPB=snap.pb; eq0.contadorCor=snap.cor; }
    try{
      const id = arguments[0];
      let o = id && (db.os||[]).find(x=>x.id===id);
      if(!o) o = (db.os||[]).slice(-1)[0];
      if(o){
        const chk = document.getElementById('ko-concluido') || document.getElementById('o-concluido') || document.getElementById('ca-concluido');
        if(chk && chk.checked){ o.status='concluido'; o.dataFechamento=o.dataFechamento||new Date().toISOString(); o.faturado=true; }
        Object.assign(o, extras);
        const pecasLinhas=[];
        for(let i=0;i<5;i++){
          const d=document.getElementById('lc-peca-desc-'+i)?.value||'';
          const q=document.getElementById('lc-peca-qtd-'+i)?.value||'';
          if(d||q) pecasLinhas.push({descricao:d,qtd:q});
        }
        if(pecasLinhas.length) o.pecasTexto = pecasLinhas.map(x=>x.descricao+(x.qtd?(' x'+x.qtd):'')).join('\n');
        // chamado NÃO altera contador final da impressora
        const eq = (db.equipamentos||[]).find(e=>e.id===o.equipamentoId);
        if(eq){
          if(o._pbAntes!=null) eq.contadorPB = o._pbAntes;
          if(o._corAntes!=null) eq.contadorCor = o._corAntes;
        }
        if(typeof saveDB==='function') saveDB();
      }
    }catch(e){}
    window.__lcChamPersistida = true;
    window.__lcChamDirty = false;
    window.__lcChamFormAberto = false;
    return r;
  };
  window[nome].__lcWrap = true;
}
wrapSalvarChamado('salvarChamadoCompleto', true);
wrapSalvarChamado('salvarChamadoAvulso', false);

// ── Avulso: bloquear cliente com contrato + form ──
window.abrirChamadoAvulsoForm = function(id){
  window.__lcChamFormAberto = true;
  window.__lcChamPersistida = !!id;
  window.__lcChamDirty = false;
  if(typeof window.openModal==='function') window.openModal('os', id||null);
  setTimeout(()=>{
    // DESATIVADO (v5.19.23): no avulso, contador color e peças já vêm do
    // ajustes_v5175_patch.js. Chamar injetarCamposChamado aqui duplicava o
    // "Contador Color" e "Produtos/peças".
    marcarDirtyChamado();
  }, 80);
};

const _selCliAv = window.selecionarClienteChamadoAvulso;
if(typeof _selCliAv==='function'){
  window.selecionarClienteChamadoAvulso = function(id){
    if(clienteTemContrato(id)){
      toastMsg('Este cliente tem contrato. Abra o chamado pelo contrato.','error');
      return;
    }
    return _selCliAv.apply(this, arguments);
  };
}

// ── 4.1 / 4.2 impressão ──
window.imprimirChamadoPDF = function(osId){
  const o = (db.os||[]).find(x=>x.id===osId);
  if(!o){ toastMsg('Salve o chamado antes de imprimir.','error'); return; }
  const cli = (db.clientes||[]).find(c=>c.id===o.clienteId)||{};
  const fin = o.status==='concluido';
  const deContrato = chamadoDeContrato(o);
  const p = (db.parque||[]).find(x=>x.equipamentoId===o.equipamentoId);
  const eq = (db.equipamentos||[]).find(e=>e.id===o.equipamentoId)||{};
  const temColor = !deContrato || impressoraTemColor(p, eq);
  const pecas = Array.isArray(o.pecas)&&o.pecas.length
    ? o.pecas.map(it=>({d:it.descricao||'',q:it.qtd||''}))
    : String(o.pecasTexto||'').split('\n').filter(Boolean).map(line=>{
        const m=line.match(/^(.*?)(?:\s+x\s*(\d+))?$/i); return {d:(m&&m[1])||line,q:(m&&m[2])||''};
      });
  while(pecas.length<5) pecas.push({d:'',q:''});
  const fill = (v, blank)=>{
    if(fin) return esc(v==null||v===''?'-':v);
    return blank || '&nbsp;';
  };
  const dataAt = fin && o.dataAtendimento ? dia(o.dataAtendimento).split('-').reverse().join('/') : '&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;';
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Chamado ${esc(o.numero||'')}</title>
  <style>
    body{font-family:Arial,sans-serif;margin:18px;color:#111;font-size:12px}
    .cab{display:flex;justify-content:space-between;border-bottom:2px solid #0a1e8a;padding-bottom:10px;margin-bottom:12px}
    .cab h1{color:#0a1e8a;font-size:18px;margin:0}
    .faixa{background:#0a1e8a;color:#fff;text-align:center;font-weight:800;letter-spacing:.08em;padding:7px 10px;margin:12px 0 6px}
    .linha{border:1px solid #bbb;min-height:28px;padding:6px 8px;margin-bottom:8px}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    table{width:100%;border-collapse:collapse;margin-top:4px}
    th,td{border:1px solid #bbb;padding:7px;height:22px}
    th{background:#eef2ff;color:#0a1e8a;text-align:left}
    .data{display:inline-block;border-bottom:1px solid #333;min-width:92px;text-align:center;letter-spacing:2px}
    @media print{.no-print{display:none}}
  </style></head><body>
  <div class="no-print"><button onclick="window.print()">Imprimir</button></div>
  <div class="cab"><div><h1>DIGICOPY — CHAMADO TÉCNICO</h1><p><b>Cliente:</b> ${esc(cli.nome||'')}</p></div><div style="text-align:right"><p><b>OS:</b> ${esc(o.numero||'')}</p><p><b>Status:</b> ${esc(o.status||'')}</p></div></div>
  ${!deContrato?`<div class="grid2"><div class="linha"><b>Impressora</b><div>${fill(o.modelo)}</div></div><div class="linha"><b>Serial</b><div>${fill(o.serie)}</div></div></div>`:''}
  <div class="grid2">
    <div class="linha"><b>Contador preto atual</b><div>${fill(o.contadorAtual)}</div></div>
    ${temColor?`<div class="linha"><b>Contador color atual</b><div>${fill(o.contadorColor)}</div></div>`:'<div></div>'}
  </div>
  <div class="faixa">MOTIVO / DEFEITO</div>
  <div class="linha" style="min-height:42px">${fill(o.descricao)}</div>
  <div class="faixa">PRODUTO / PEÇAS</div>
  <table><thead><tr><th style="width:78%">Descrição</th><th>Quantidade</th></tr></thead><tbody>
  ${pecas.slice(0,5).map(it=>`<tr><td>${fin?esc(it.d||''):'&nbsp;'}</td><td>${fin?esc(it.q||''):'&nbsp;'}</td></tr>`).join('')}
  </tbody></table>
  <div class="faixa">OBSERVAÇÃO</div>
  <div class="linha" style="min-height:48px">${fill(o.observacao||o.servicos)}</div>
  <p style="margin-top:14px"><b>Data do atendimento:</b> <span class="data">${dataAt}</span></p>
  </body></html>`;
  const w = window.open('','_blank');
  if(w){ w.document.write(html); w.document.close(); }
};

const _impCham = window.imprimirChamado;
// wrap print buttons to ask save
document.addEventListener('click', function(ev){
  const btn = ev.target.closest && ev.target.closest('button');
  if(!btn) return;
  const t = (btn.textContent||'').toLowerCase();
  const oc = (btn.getAttribute('onclick')||'');
  if(!window.__lcChamFormAberto) return;
  if(!(/imprimir/.test(t) || /imprimirChamado/.test(oc))) return;
  ev.preventDefault();
  ev.stopPropagation();
  ev.stopImmediatePropagation();
  const msg = 'Deseja salvar este chamado antes de imprimir?';
  const seguir = (salvar)=>{
    if(salvar){
      if(typeof window.salvarChamadoCompleto==='function' && (document.getElementById('ko-desc')||document.getElementById('o-desc'))){
        const cid = window.modalContext && window.modalContext.contratoId;
        const oid = window.modalContext && window.modalContext.id;
        window.salvarChamadoCompleto(oid||'', cid||'');
      } else if(typeof window.salvarChamadoAvulso==='function'){
        window.salvarChamadoAvulso(window.modalContext && window.modalContext.id || '');
      }
      const id = (db.os||[]).slice(-1)[0];
      if(id) window.imprimirChamadoPDF(id.id);
    }
  };
  if(typeof window.confirmSistema==='function') window.confirmSistema(msg,'Imprimir chamado').then(seguir);
}, true);

// ── 4.5 sair pergunta ──
const _cm = window.closeModal;
window.closeModal = function(force){
  if(window.__lcChamFormAberto && window.__lcChamDirty && !force){
    if(typeof window.confirmSistema==='function'){
      window.confirmSistema('Deseja salvar este chamado?','Sair do chamado').then(ok=>{
        if(ok){
          if(document.getElementById('ko-desc')||document.getElementById('o-desc')){
            window.salvarChamadoCompleto && window.salvarChamadoCompleto(window.modalContext?.id||'', window.modalContext?.contratoId||'');
          } else {
            window.salvarChamadoAvulso && window.salvarChamadoAvulso(window.modalContext?.id||'');
          }
        } else if(!window.__lcChamPersistida){
          // primeira vez: não cria
        }
        window.__lcChamFormAberto = false;
        window.__lcChamDirty = false;
        if(_cm) _cm.call(window, true);
      });
      return;
    }
  }
  window.__lcChamFormAberto = false;
  return _cm ? _cm.apply(this, arguments) : undefined;
};

// ── 5 Leituras: filtro data + padrão não faturadas + faturadas do mês ──
const _leit = window.abrirLeiturasContrato;
if(typeof _leit==='function'){
  window.abrirLeiturasContrato = function(contratoId){
    const r = _leit.apply(this, arguments);
    setTimeout(()=>{
      const body = document.getElementById('modal-body');
      if(!body || document.getElementById('lc-lei-de')) return;
      const bar = document.createElement('div');
      bar.className = 'flex flex-wrap gap-2 items-center mb-3';
      const mes = hoje().slice(0,7);
      bar.innerHTML = `<label class="text-[12px] font-bold">De <input id="lc-lei-de" type="date" class="h-9 px-2 rounded-lg border"></label>
        <label class="text-[12px] font-bold">até <input id="lc-lei-ate" type="date" value="${hoje()}" class="h-9 px-2 rounded-lg border"></label>
        <button type="button" id="lc-lei-ok" class="h-9 px-3 rounded-lg bg-[#0a1e8a] text-white font-bold text-[12px]">Filtrar</button>`;
      body.prepend(bar);
      const aplicar = ()=>{
        const de = document.getElementById('lc-lei-de')?.value;
        const ate = document.getElementById('lc-lei-ate')?.value || hoje();
        const rows = body.querySelectorAll('tbody tr');
        rows.forEach(tr=>{
          const t = tr.innerText||'';
          // se filtro vazio: esconde faturadas de outro mês via data na primeira célula
          const m = t.match(/(\d{2})\/(\d{2})\/(\d{4})/);
          let iso = '';
          if(m) iso = m[3]+'-'+m[2]+'-'+m[1];
          if(de || ate){
            let ok = true;
            if(de && iso && iso<de) ok=false;
            if(ate && iso && iso>ate) ok=false;
            tr.style.display = ok?'':'none';
          }
        });
      };
      document.getElementById('lc-lei-ok').onclick = aplicar;
    }, 60);
    return r;
  };
}

const _voltar = window.voltarNivelModal;
window.voltarNivelModal = function(e){
  if(window.__lcChamFormAberto && window.__lcChamDirty){
    if(typeof window.confirmSistema==='function'){
      window.confirmSistema('Deseja salvar este chamado?','Sair do chamado').then(ok=>{
        if(ok){
          if(document.getElementById('ko-desc')||document.getElementById('o-desc')){
            window.salvarChamadoCompleto && window.salvarChamadoCompleto(window.modalContext?.id||'', window.modalContext?.contratoId||'');
          } else {
            window.salvarChamadoAvulso && window.salvarChamadoAvulso(window.modalContext?.id||'');
          }
        }
        window.__lcChamFormAberto=false; window.__lcChamDirty=false;
        if(_voltar) _voltar.call(window, e);
      });
      return;
    }
  }
  return _voltar ? _voltar.apply(this, arguments) : undefined;
};

// 5 Todos nas leituras
const _lei2 = window.abrirLeiturasContrato;
if(typeof _lei2==='function' && !_lei2.__lcTodos){
  window.abrirLeiturasContrato = function(contratoId){
    const r = _lei2.apply(this, arguments);
    setTimeout(()=>{
      const bar = document.getElementById('lc-lei-de') && document.getElementById('lc-lei-de').parentElement && document.getElementById('lc-lei-de').parentElement.parentElement;
      if(bar && !document.getElementById('lc-lei-todos')){
        const b=document.createElement('button');
        b.id='lc-lei-todos'; b.type='button';
        b.className='h-9 px-3 rounded-lg border font-bold text-[12px]';
        b.textContent='Todos';
        b.onclick=function(){
          const de=document.getElementById('lc-lei-de'); const ate=document.getElementById('lc-lei-ate');
          if(de) de.value=''; if(ate) ate.value='';
          document.querySelectorAll('#modal-body tbody tr').forEach(tr=>tr.style.display='');
        };
        bar.appendChild(b);
      }
    }, 80);
    return r;
  };
  window.abrirLeiturasContrato.__lcTodos=true;
}

console.log('[DIGICOPY] locacao_chamados_fix_patch.js v5.17.0');
})();

