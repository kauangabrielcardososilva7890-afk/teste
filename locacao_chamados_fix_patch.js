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
function toastMsg(m,t){ if(typeof window.lfbAlert==='function' && t==='error') window.lfbAlert(m,'Aviso'); else if(typeof toast==='function') toast(m,t||'info'); }
function clienteTemContrato(clienteId){
  return (db.contratos||[]).some(c => c.clienteId===clienteId && c.status!=='excluido' && c.status!=='encerrado');
}
function parqueAtivo(p){ return p && p.status!=='inativo' && p.modalidade!=='inativo'; }
function impressoraTemColor(p, eq){
  if(p && (p.temColor===true || p.colorAtivo===true)) return true;
  if(eq && (eq.temColor===true || /color/i.test(eq.tipo||''))) return true;
  return false;
}
function chamadoDeContrato(o){ return !!(o && o.contratoId); }

// ── 1.1 / 1.2 Impressora do contrato ──
function injetarAjustesImpressora(){
  const body = document.getElementById('modal-body');
  if(!body) return;
  body.querySelectorAll('input[type="checkbox"]').forEach(ch=>{
    const lab = (ch.closest('label')||ch.parentElement);
    const t = (lab && lab.textContent||'').toLowerCase();
    if(/^\s*ativo\s*$/.test(t.trim()) || (t.includes('ativo') && !t.includes('inativo') && !t.includes('finaliz'))){
      if(lab) lab.remove();
    }
  });
  if(!document.getElementById('lc-tem-color')){
    const mods = body.querySelector('input[name="ki-modalidade"], input[name="pe-modalidade"]');
    const box = mods && mods.closest('div');
    if(box){
      const wrap = document.createElement('label');
      wrap.className = 'flex items-center gap-2 mt-2 font-semibold text-[13px]';
      wrap.innerHTML = '<input type="checkbox" id="lc-tem-color" class="w-4 h-4"> Esta impressora tem Color (A4/A3 unificado)';
      box.appendChild(wrap);
      const prqId = (window.modalContext && window.modalContext.parqueId) || null;
      const p = prqId && (db.parque||[]).find(x=>x.id===prqId);
      if(p && p.temColor) document.getElementById('lc-tem-color').checked = true;
    }
  }
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
    const mod = document.querySelector('input[name="ki-modalidade"]:checked, input[name="pe-modalidade"]:checked');
    if(!mod){
      toastMsg('Escolha uma modalidade. Sem modalidade ativa a impressora não é cadastrada.','error');
      return;
    }
    if(mod.value==='inativo'){
      const isNew = !arguments[1];
      if(isNew){
        // permite cadastrar inativa no cliente, mas não entra em leitura/chamado
      }
    }
    const r = orig.apply(this, arguments);
    try{
      const temColor = !!document.getElementById('lc-tem-color')?.checked;
      const contratoId = arguments[0];
      const parqueId = arguments[1];
      let p = parqueId && (db.parque||[]).find(x=>x.id===parqueId);
      if(!p){
        p = (db.parque||[]).filter(x=>x.contratoId===contratoId).slice(-1)[0];
      }
      if(p){ p.temColor = temColor; if(typeof saveDB==='function') saveDB(); }
    }catch(e){}
    return r;
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
    '<button onclick="navigateTo(\'impressoras\')"><i class="ph ph-printer"></i>Impressoras</button>'+
    '<button onclick="abrirHistoricoChamadosGeral()"><i class="ph ph-wrench"></i>Chamados</button>';
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
      setTimeout(abrirHistoricoChamadosGeral, 30);
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
  if(!body || document.getElementById('lc-cont-color-atu')) return;
  const pb = document.getElementById('ko-cont-atu') || document.getElementById('o-cont-atu') || document.getElementById('ca-cont-atu');
  if(pb && pb.parentElement && pb.parentElement.parentElement){
    const grid = pb.parentElement.parentElement;
    const divAnt = document.createElement('div');
    divAnt.innerHTML = `<label class="block font-bold text-slate-500 mb-1 text-[11px] uppercase">Contador Color Antigo</label><input id="lc-cont-color-ant" type="number" readonly class="w-full h-10 px-3 rounded-xl border bg-slate-50 font-mono">`;
    const divAtu = document.createElement('div');
    divAtu.innerHTML = `<label class="block font-bold text-[#0a1e8a] mb-1 text-[11px] uppercase">Contador Color Atual</label><input id="lc-cont-color-atu" type="number" disabled class="w-full h-10 px-3 rounded-xl border font-mono bg-slate-100" placeholder="Somente se a impressora tiver Color">`;
    grid.appendChild(divAnt);
    grid.appendChild(divAtu);
  }
  if(!document.getElementById('lc-data-atend')){
    const geral = document.getElementById('ko-painel-geral') || document.getElementById('painel-os-geral') || body;
    const d = document.createElement('div');
    d.innerHTML = `<label class="block font-bold text-slate-600 mb-1 mt-2">Data de atendimento</label><input id="lc-data-atend" type="date" class="w-full h-10 px-3 rounded-xl border max-w-[220px]">`;
    geral.appendChild(d);
  }
  if(!document.getElementById('lc-pecas')){
    const finais = document.getElementById('ko-painel-finais') || document.getElementById('painel-os-finais') || body;
    const d = document.createElement('div');
    d.innerHTML = `<label class="block font-bold text-slate-600 mb-1 mt-2">Produtos / peças utilizadas</label><textarea id="lc-pecas" class="w-full h-20 p-2 rounded-xl border"></textarea>`;
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
      marcarDirtyChamado();
    }, 80);
    return r;
  };
}

function marcarDirtyChamado(){
  const body = document.getElementById('modal-body');
  if(!body) return;
  body.addEventListener('input', ()=>{ window.__lcChamDirty = true; }, { once:false });
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
  const colorEl = document.getElementById('lc-cont-color-atu');
  if(contrato && colorEl && !colorEl.disabled && !txt(colorEl.value)){
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
    const r = orig.apply(this, arguments);
    try{
      const id = arguments[0];
      let o = id && (db.os||[]).find(x=>x.id===id);
      if(!o) o = (db.os||[]).slice(-1)[0];
      if(o){
        Object.assign(o, extras);
        // chamado NÃO altera contador final da impressora (color)
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
    injetarCamposChamado(false);
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
  const linha = (label, val) => fin
    ? `<div class="sec"><b>${label}</b><div>${esc(val||'-')}</div></div>`
    : `<div class="sec"><b>${label}</b><div class="blank"></div><div class="blank"></div></div>`;
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Chamado ${esc(o.numero||'')}</title>
  <style>body{font-family:Arial;margin:16px;font-size:12px}.cab{border-bottom:2px solid #0a1e8a;margin-bottom:10px}.sec{border:1px solid #ccc;padding:8px;margin:8px 0;border-radius:6px}.blank{border-bottom:1px dotted #999;height:18px;margin:4px 0}@media print{.no-print{display:none}}</style></head><body>
  <div class="no-print"><button onclick="window.print()">Imprimir</button></div>
  <div class="cab"><h2>CHAMADO ${esc(o.numero||'')}</h2><p>${esc(cli.nome||'')}</p></div>
  ${!deContrato? linha('Impressora', o.modelo)+linha('Serial', o.serie): ''}
  ${linha('Contador preto atual', fin?o.contadorAtual:'')}
  ${temColor? linha('Contador color atual', fin?o.contadorColor:'') : ''}
  ${linha('Motivo / Defeito', fin?o.descricao:'')}
  ${linha('Produtos e peças utilizadas', fin?(o.pecasTexto||''):'')}
  ${linha('Observação', fin?(o.observacao||o.servicos||''):'')}
  ${linha('Data de atendimento', fin?dia(o.dataAtendimento):'')}
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

console.log('[DIGICOPY] locacao_chamados_fix_patch.js v5.16.0');
})();
