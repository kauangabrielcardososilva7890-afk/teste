// PATCH v5.17.1 — avisos, color no criar, abas finalizado, PDF, filtros, ESC
(function(){
'use strict';

function esc(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function txt(v){ return String(v??'').trim(); }
function low(v){ return txt(v).toLowerCase(); }
function n(v,fb){ const x=Number(String(v??'').replace(',','.')); return Number.isFinite(x)?x:(fb===undefined?0:fb); }
function hoje(){ return new Date().toISOString().slice(0,10); }
function dia(v){ return String(v||'').slice(0,10); }
function sess(){ return typeof getSession==='function'?getSession():null; }
function aviso(m,t){ if(typeof window.lfbAlert==='function') return window.lfbAlert(m, t||'Aviso'); }

const SPAM = /bem[- ]vindo|nuvem atualiz|conectado ao google|dados enviados|publicad|sincroniz|venda .+ (salva|criada|faturada)|notinha .+ salva|cliente salvo|produto salvo|chamado salvo|impressora salva|contrato salvo|leitura (salva|registrada)|sessão encerrada|empresa validada|dados demo|coleta automática|faturas geradas|entrada de /i;

const _toast = window.toast;
window.toast = function(msg, type){
  const m = String(msg||'');
  if(SPAM.test(m) && type!=='error') return;
  if(type==='error' || /obrigat|informe|preencha|selecione|não (posso|encont|pode)|bloque|inativ/i.test(m)){
    return aviso(m, 'Aviso');
  }
  if(type==='success' || type==='info') return;
  return aviso(m, 'Aviso');
};

function logoSrc(){ return window.DIGICOPY_LOGO || './logo.png'; }
function dadosLoja(){
  const s = sess()||{};
  const emp = (typeof db!=='undefined' && db.empresas||[]).find(e=>e.id===s.empresaId) || {};
  const cfg = (db.config && db.config.empresa) || {};
  return {
    nome: emp.nome || cfg.nome || s.empresaNome || 'DIGICOPY',
    fantasia: emp.fantasia || 'DIGICOPY',
    cnpj: emp.cnpj || s.cnpj || cfg.cnpj || '',
    fone: cfg.fone || emp.telefone || '',
    email: cfg.email || emp.email || '',
    end: cfg.endereco || emp.endereco || ''
  };
}

function temColor(p, eq){
  const meds = (p && (p.medidoresConfig||p.medidores)) || {};
  if(meds.colorA4 && meds.colorA4.modalidade && meds.colorA4.modalidade!=='inativo') return true;
  if(meds.colorA3 && meds.colorA3.modalidade && meds.colorA3.modalidade!=='inativo') return true;
  return false;
}

function htmlColorBlock(){
  return `<div id="lc-color-block" class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 border rounded-xl mt-3">
    <div><label class="block font-bold text-slate-500 mb-1 text-[11px] uppercase">Contador Color Antigo</label><input id="lc-cont-color-ant" type="number" readonly class="w-full h-10 px-3 rounded-xl border bg-slate-50 font-mono"></div>
    <div><label class="block font-bold text-[#0a1e8a] mb-1 text-[11px] uppercase">Contador Color Atual</label><input id="lc-cont-color-atu" type="number" disabled class="w-full h-10 px-3 rounded-xl border font-mono bg-slate-100" placeholder="Digite (só se Color A4/A3 ativo)"></div>
  </div>`;
}

window.__lcMontarChamadoUI = function(contrato){
  const body = document.getElementById('modal-body');
  if(!body) return;

  // 2.2 abas Aberto / Finalizado ANTES das informações
  if(!document.getElementById('lc-tab-aberto')){
    const bar = document.createElement('div');
    bar.id = 'lc-status-tabs';
    bar.className = 'flex gap-0 border-b-2 border-slate-200 mb-4';
    bar.innerHTML = `<button type="button" id="lc-tab-aberto" class="flex-1 h-11 font-extrabold text-[13px]">Aberto</button>
      <button type="button" id="lc-tab-fin" class="flex-1 h-11 font-extrabold text-[13px]">Finalizado</button>`;
    body.insertBefore(bar, body.firstChild);
    const chk = document.getElementById('ko-concluido') || document.getElementById('o-concluido') || document.getElementById('ca-concluido');
    if(chk){
      const lab = chk.closest('label');
      if(lab) lab.style.display='none';
    }
    function pintar(){
      const c = document.getElementById('ko-concluido') || document.getElementById('o-concluido') || document.getElementById('ca-concluido');
      const fin = !!(c && c.checked);
      const a=document.getElementById('lc-tab-aberto'), f=document.getElementById('lc-tab-fin');
      if(a){ a.className='flex-1 h-11 font-extrabold text-[13px] '+(fin?'bg-white text-slate-500':'bg-[#0a1e8a] text-white'); }
      if(f){ f.className='flex-1 h-11 font-extrabold text-[13px] '+(fin?'bg-emerald-600 text-white':'bg-white text-slate-500'); }
    }
    document.getElementById('lc-tab-aberto').onclick=function(){
      const c = document.getElementById('ko-concluido') || document.getElementById('o-concluido') || document.getElementById('ca-concluido');
      if(c) c.checked=false; pintar(); window.__lcChamDirty=true;
    };
    document.getElementById('lc-tab-fin').onclick=function(){
      const c = document.getElementById('ko-concluido') || document.getElementById('o-concluido') || document.getElementById('ca-concluido');
      if(c) c.checked=true; pintar(); window.__lcChamDirty=true;
    };
    pintar();
  }

  // 2.1 color SEMPRE visível no painel geral (criar já mostra)
  const geral = document.getElementById('ko-painel-geral') || body;
  if(!document.getElementById('lc-cont-color-atu')){
    const wrap = document.createElement('div');
    wrap.innerHTML = htmlColorBlock();
    geral.appendChild(wrap.firstChild);
  } else if(!document.getElementById('lc-color-block') && document.getElementById('ko-painel-geral')){
    // move para geral se ficou em detalhes
    const el = document.getElementById('lc-cont-color-atu').closest('.grid') || document.getElementById('lc-cont-color-atu').parentElement;
    if(el && !geral.contains(el)) geral.appendChild(el);
  }

  if(!document.getElementById('lc-data-atend')){
    const d=document.createElement('div');
    d.innerHTML = `<label class="block font-bold text-slate-600 mb-1 mt-3">Data de atendimento</label><input id="lc-data-atend" type="date" class="w-full h-10 px-3 rounded-xl border max-w-[200px]">`;
    geral.appendChild(d);
  }

  // limpar zero dos contadores atuais (obrigar digitar)
  ['ko-cont-atu','o-cont-atu','ca-cont-atu','lc-cont-color-atu'].forEach(id=>{
    const el=document.getElementById(id);
    if(el && (el.value==='0' || el.value===0) && !el.dataset.keep) el.value='';
  });

  // 4.1 remove 5 linhas extras do FORM
  const extra = document.getElementById('lc-pecas-wrap');
  if(extra) extra.remove();

  // busca de produto igual vendas
  const sel = document.getElementById('ko-produto');
  if(sel && !document.getElementById('lc-prod-search')){
    const box = sel.parentElement;
    const search = document.createElement('input');
    search.id='lc-prod-search';
    search.placeholder='Digite nome, código, ref...';
    search.className='w-full h-10 px-3 rounded-xl border mb-2';
    search.oninput=function(){
      const q=low(this.value);
      const s=sess();
      let lista=(db.produtos||[]).filter(p=>(!s||p.empresaId===s.empresaId)&&p.status!=='inativo');
      if(q) lista=lista.filter(p=>[p.nome,p.sku,p.codigo,p.categoria].some(v=>low(v).includes(q)));
      sel.innerHTML='<option value="">Selecione</option>'+lista.slice(0,40).map(p=>`<option value="${p.id}">${esc(p.sku||p.codigo||'')} - ${esc(p.nome||'')}</option>`).join('');
    };
    box.insertBefore(search, sel);
  }

  // avulso: color digitável + aviso
  if(!contrato){
    const colorAtu=document.getElementById('lc-cont-color-atu');
    if(colorAtu){
      colorAtu.disabled=false;
      colorAtu.classList.remove('bg-slate-100');
      if(!colorAtu.dataset.bindWarn){
        colorAtu.dataset.bindWarn='1';
        colorAtu.addEventListener('focus', function(){
          if(this.dataset.warned) return;
          aviso('Certifique que essa impressora do chamado realmente tem contador color.','Contador color').then(()=>{ this.dataset.warned='1'; });
        });
      }
    }
  }
};

window.__lcAtualizarColor = function(equipId){
  const p=(db.parque||[]).find(x=>x.equipamentoId===equipId);
  const eq=(db.equipamentos||[]).find(x=>x.id===equipId);
  const tem = temColor(p,eq);
  const el=document.getElementById('lc-cont-color-atu');
  const ant=document.getElementById('lc-cont-color-ant');
  if(ant) ant.value = eq && eq.contadorCor!=null && eq.contadorCor!=='' ? eq.contadorCor : '';
  if(!el) return;
  if(tem){ el.disabled=false; el.classList.remove('bg-slate-100'); }
  else { el.disabled=true; el.value=''; el.classList.add('bg-slate-100'); }
};

const _open = window.openModalChamadoCompleto;
if(typeof _open==='function'){
  window.openModalChamadoCompleto = function(osId, contratoId){
    window.__lcChamFormAberto=true;
    window.__lcChamDirty=false;
    window.__lcChamPersistida=!!osId;
    window.modalContext=Object.assign(window.modalContext||{},{type:'chamado',id:osId||'',contratoId:contratoId||''});
    const r=_open.apply(this,arguments);
    const go=()=>{
      window.__lcMontarChamadoUI(true);
      const o=osId && (db.os||[]).find(x=>x.id===osId);
      if(o){
        const da=document.getElementById('lc-data-atend'); if(da) da.value=dia(o.dataAtendimento||'');
        const ca=document.getElementById('lc-cont-color-atu'); if(ca && o.contadorColor!=null && o.contadorColor!=='') ca.value=o.contadorColor;
        const chk=document.getElementById('ko-concluido'); if(chk) chk.checked=o.status==='concluido';
        document.getElementById('lc-tab-fin')?.click && o.status==='concluido' && (chk.checked=true);
        const a=document.getElementById('lc-tab-aberto'), f=document.getElementById('lc-tab-fin');
        if(o.status==='concluido' && f) f.click();
      }
      const eqSel=document.getElementById('ko-equip')?.value || (o&&o.equipamentoId);
      if(eqSel) window.__lcAtualizarColor(eqSel);
    };
    setTimeout(go,40);
    setTimeout(go,180);
    return r;
  };
}

const _auto=window.autoPreencherDadosChamado;
if(typeof _auto==='function'){
  window.autoPreencherDadosChamado=function(equipId){
    const r=_auto.apply(this,arguments);
    const atu=document.getElementById('ko-cont-atu');
    if(atu && (atu.value==='0'||atu.value===0)) atu.value='';
    setTimeout(()=>window.__lcAtualizarColor(equipId),10);
    return r;
  };
}

const _av=window.abrirChamadoAvulsoForm;
window.abrirChamadoAvulsoForm=function(id){
  window.__lcChamFormAberto=true;
  window.__lcChamDirty=false;
  window.__lcChamPersistida=!!id;
  if(_av) _av.apply(this,arguments);
  else if(window.openModal) window.openModal('os',id||null);
  setTimeout(()=>window.__lcMontarChamadoUI(false),80);
  setTimeout(()=>window.__lcMontarChamadoUI(false),200);
};

// 3 filtros impressoras
window.__lcImpFiltro = window.__lcImpFiltro || { campo:'serial', q:'' };
const _re = window.renderEquipamentos;
window.renderEquipamentos = function(){
  const s=sess(); if(!s) return;
  const view=document.getElementById('view-impressoras');
  if(!view){ if(_re) return _re.apply(this,arguments); return; }
  const F=window.__lcImpFiltro;
  F.campo = document.getElementById('lc-imp-campo')?.value || F.campo || 'serial';
  F.q = document.getElementById('lc-imp-q')?.value ?? F.q;
  const q=low(F.q);
  const lista=(db.equipamentos||[]).filter(e=>e.empresaId===s.empresaId).map(e=>{
    const p=(db.parque||[]).find(x=>x.equipamentoId===e.id);
    const c=p && (db.contratos||[]).find(x=>x.id===p.contratoId);
    const cli=(p&&p.clienteId)?(db.clientes||[]).find(x=>x.id===p.clienteId):(c&&c.clienteId?(db.clientes||[]).find(x=>x.id===c.clienteId):null);
    return {e,p,c,cli};
  }).filter(x=>{
    if(!q) return true;
    const mapa={
      serial:x.e.serie,
      'contador preto':x.e.contadorPB,
      'contador color':x.e.contadorCor,
      'nome cliente':x.cli&&x.cli.nome,
      'cod contrato cliente':x.c&&x.c.numero,
      departamento:x.p&&x.p.setor,
      local:x.p&&(x.p.localInstalacao||x.p.enderecoInstalacao)
    };
    const val=mapa[low(F.campo)];
    return low(val).includes(q);
  });
  const campos=['Serial','Contador preto','Contador color','Nome cliente','Cod contrato cliente','Departamento','Local'];
  view.innerHTML=`<div class="neo-shell"><div class="neo-panel"><div class="neo-head"><div><h3>Impressoras</h3><p>Todas as impressoras cadastradas nos clientes</p></div></div>
    <div class="p-4 border-b flex flex-wrap gap-2 items-center">
      <select id="lc-imp-campo" class="neo-select">${campos.map(c=>`<option ${low(F.campo)===low(c)?'selected':''}>${c}</option>`).join('')}</select>
      <input id="lc-imp-q" value="${esc(F.q)}" placeholder="Filtro" class="neo-input w-full max-w-[320px]" onkeydown="if(event.key==='Enter'){window.__lcImpFiltro.campo=document.getElementById('lc-imp-campo').value;window.__lcImpFiltro.q=this.value;renderEquipamentos()}">
      <button type="button" onclick="window.__lcImpFiltro.campo=document.getElementById('lc-imp-campo').value;window.__lcImpFiltro.q=document.getElementById('lc-imp-q').value;renderEquipamentos()" class="neo-btn primary">Buscar</button>
    </div>
    <div class="overflow-auto max-h-[calc(100vh-260px)]"><table class="neo-table"><thead><tr><th>Modelo</th><th>Serial</th><th>Patrimônio</th><th>Contador PB</th><th>Color</th><th>Cliente</th><th>Contrato</th><th>Depto</th><th>Local</th></tr></thead><tbody>
    ${lista.map(x=>`<tr class="cursor-pointer" ondblclick="${x.c?`openContratoCompleto('${x.c.id}')`:''}"><td><b>${esc(x.e.modelo||'')}</b></td><td class="font-mono">${esc(x.e.serie||'-')}</td><td class="font-mono">${esc(x.e.patrimonio||'-')}</td><td>${x.e.contadorPB??'-'}</td><td>${temColor(x.p,x.e)?'Sim':'Não'}</td><td>${esc(x.cli?x.cli.nome:'-')}</td><td>${esc(x.c?x.c.numero:'fora de contrato')}</td><td>${esc(x.p&&x.p.setor||'-')}</td><td>${esc((x.p&&(x.p.localInstalacao||x.p.enderecoInstalacao))||'-')}</td></tr>`).join('')||'<tr><td colspan="9" class="text-center py-10 text-slate-400">Nenhuma impressora</td></tr>'}
    </tbody></table></div></div></div>`;
};

// PDF chamado
window.imprimirChamadoPDF = function(osId){
  const o=(db.os||[]).find(x=>x.id===osId);
  if(!o){ aviso('Salve o chamado antes de imprimir.'); return; }
  const cli=(db.clientes||[]).find(c=>c.id===o.clienteId)||{};
  const loja=dadosLoja();
  const fin=o.status==='concluido';
  const p=(db.parque||[]).find(x=>x.equipamentoId===o.equipamentoId);
  const eq=(db.equipamentos||[]).find(e=>e.id===o.equipamentoId)||{};
  const deContrato=!!o.contratoId;
  const showColor=!deContrato || temColor(p,eq);
  const pecas=Array.isArray(o.pecas)&&o.pecas.length?o.pecas.map(it=>({d:it.descricao||it.nome||'',q:it.qtd||''})):[];
  while(pecas.length<5) pecas.push({d:'',q:''});
  const v=(x)=> fin ? esc(x==null||x===''?'':x) : '';
  const dataAt = fin && o.dataAtendimento ? dia(o.dataAtendimento).split('-').reverse().join('/') : '&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;';
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Chamado ${esc(o.numero||'')}</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;margin:16px;color:#111;font-size:12px}
    .top{display:flex;gap:12px;align-items:flex-start;border-bottom:2px solid #0a1e8a;padding-bottom:10px}
    .top img{height:64px;width:auto}
    .loja{flex:1}
    .loja h1{margin:0;color:#0a1e8a;font-size:18px}
    table{width:100%;border-collapse:collapse;margin-top:8px}
    th,td{border:1px solid #bbb;padding:5px 7px;text-align:left}
    th{background:#eef2ff;color:#0a1e8a;font-size:11px}
    .faixa{background:#0a1e8a;color:#fff;text-align:center;font-weight:800;padding:6px;margin:12px 0 4px;letter-spacing:.06em}
    .blank{min-height:22px}
    .data{display:inline-block;border-bottom:1px solid #333;min-width:96px;text-align:center;letter-spacing:1px}
    @media print{.no-print{display:none}}
  </style></head><body>
  <div class="no-print"><button onclick="window.print()">Imprimir</button></div>
  <div class="top"><img src="${logoSrc()}" alt="logo"><div class="loja"><h1>${esc(loja.fantasia)}</h1><div>${esc(loja.nome)}</div><div>${esc(loja.cnpj)} ${loja.fone?('• '+esc(loja.fone)):''}</div><div>${esc(loja.end)}</div></div>
    <div style="text-align:right"><b>OS ${esc(o.numero||'')}</b><br>${fin?'Finalizado':'Aberto'}</div></div>
  <table><tr><th>Cliente</th><th>Documento</th><th>Telefone</th><th>Cidade</th></tr>
  <tr><td>${esc(cli.nome||'')}</td><td>${esc(cli.documento||'')}</td><td>${esc(cli.telefone||'')}</td><td>${esc((cli.cidade||'')+(cli.estado?('/'+cli.estado):''))}</td></tr></table>
  ${!deContrato?`<table><tr><th>Impressora</th><th>Serial</th></tr><tr><td class="blank">${v(o.modelo)}</td><td class="blank">${v(o.serie)}</td></tr></table>`:''}
  <table><tr><th>Contador preto atual</th>${showColor?'<th>Contador color atual</th>':''}</tr>
  <tr><td class="blank">${v(o.contadorAtual)}</td>${showColor?`<td class="blank">${v(o.contadorColor)}</td>`:''}</tr></table>
  <div class="faixa">MOTIVO / DEFEITO</div>
  <div style="border:1px solid #bbb;min-height:36px;padding:8px">${v(o.descricao)}</div>
  <div class="faixa">PRODUTO / PEÇAS</div>
  <table><thead><tr><th style="width:78%">Descrição</th><th>Quantidade</th></tr></thead><tbody>
  ${pecas.slice(0,5).map(it=>`<tr><td class="blank">${fin?esc(it.d):''}</td><td class="blank">${fin?esc(it.q):''}</td></tr>`).join('')}
  </tbody></table>
  <div class="faixa">OBSERVAÇÃO</div>
  <div style="border:1px solid #bbb;min-height:40px;padding:8px">${v(o.observacao||o.servicos)}</div>
  <p style="margin-top:14px"><b>Data do atendimento:</b> <span class="data">${dataAt}</span></p>
  </body></html>`;
  const w=window.open('','_blank'); if(w){ w.document.write(html); w.document.close(); }
};

// logo em relatórios (menos rtf/etiqueta)
function injetarLogoNoDoc(html){
  if(!html || /DIGICOPY_LOGO|class="logo-rel"/.test(html)) return html;
  const img=`<img class="logo-rel" src="${logoSrc()}" style="height:52px;width:auto;display:block;margin-bottom:8px" alt="logo">`;
  return html.replace(/<body[^>]*>/i, m=>m+img);
}
['imprimirLeituraContrato','imprimirRelatorioLeiturasPDF','imprimirContratoLocacaoOperacional','imprimirNotinha'].forEach(nome=>{
  const orig=window[nome];
  if(typeof orig!=='function' || orig.__logoWrap) return;
  window[nome]=function(){
    const _open=window.open;
    window.open=function(a,b,c){
      const w=_open.call(window,a,b,c);
      if(w){
        const _write=w.document.write.bind(w.document);
        w.document.write=function(html){ return _write(injetarLogoNoDoc(String(html))); };
      }
      return w;
    };
    try{ return orig.apply(this,arguments); }
    finally{ window.open=_open; }
  };
  window[nome].__logoWrap=true;
});

// 4.5 ESC / X / Cancelar — sempre pergunta se form de chamado aberto
function perguntarSairChamado(seguir){
  if(!(window.__lcChamFormAberto && (window.__lcChamDirty || document.getElementById('ko-desc') || document.getElementById('ca-desc')))){
    return seguir();
  }
  if(typeof window.confirmSistema!=='function') return seguir();
  window.confirmSistema('Deseja salvar este chamado?','Sair do chamado').then(ok=>{
    if(ok){
      if(document.getElementById('ko-desc')||document.getElementById('o-desc')){
        window.salvarChamadoCompleto && window.salvarChamadoCompleto(window.modalContext?.id||'', window.modalContext?.contratoId||'');
      } else {
        window.salvarChamadoAvulso && window.salvarChamadoAvulso(window.modalContext?.id||'');
      }
    }
    window.__lcChamFormAberto=false;
    window.__lcChamDirty=false;
    seguir();
  });
}

// Fechar/ESC/Cancelar do chamado ficou só no v5.17.2 (evita popup empilhado).

// 5 Leituras: barra De/Até + Todos que realmente mostra tudo
const _lei=window.abrirLeiturasContrato;
window.abrirLeiturasContrato=function(contratoId){
  window.__lcLeiCtr=contratoId;
  const r=_lei?_lei.apply(this,arguments):undefined;
  setTimeout(()=>{
    const body=document.getElementById('modal-body'); if(!body) return;
    let bar=document.getElementById('lc-lei-bar');
    if(!bar){
      bar=document.createElement('div');
      bar.id='lc-lei-bar';
      bar.className='flex flex-wrap gap-2 items-center mb-3';
      bar.innerHTML=`<label class="text-[12px] font-bold">De <input id="lc-lei-de" type="date" class="h-9 px-2 rounded-lg border"></label>
        <label class="text-[12px] font-bold">até <input id="lc-lei-ate" type="date" class="h-9 px-2 rounded-lg border"></label>
        <button type="button" id="lc-lei-ok" class="h-9 px-3 rounded-lg bg-[#0a1e8a] text-white font-bold text-[12px]">Filtrar</button>
        <button type="button" id="lc-lei-todos" class="h-9 px-3 rounded-lg border font-bold text-[12px]">Todos</button>`;
      body.insertBefore(bar, body.firstChild);
    }
    const aplicar=(todos)=>{
      const de=todos?'':(document.getElementById('lc-lei-de')?.value||'');
      const ate=todos?'':(document.getElementById('lc-lei-ate')?.value||'');
      if(todos){ const a=document.getElementById('lc-lei-de'), b=document.getElementById('lc-lei-ate'); if(a)a.value=''; if(b)b.value=''; }
      body.querySelectorAll('tbody tr').forEach(tr=>{
        if(todos || (!de && !ate)){ tr.style.display=''; return; }
        const m=(tr.innerText||'').match(/(\d{2})\/(\d{2})\/(\d{4})/);
        const iso=m?(m[3]+'-'+m[2]+'-'+m[1]):'';
        let ok=true;
        if(de && iso && iso<de) ok=false;
        if(ate && iso && iso>ate) ok=false;
        tr.style.display=ok?'':'none';
      });
    };
    const ok=document.getElementById('lc-lei-ok'); if(ok) ok.onclick=()=>aplicar(false);
    const td=document.getElementById('lc-lei-todos'); if(td) td.onclick=()=>aplicar(true);
  }, 30);
  return r;
};

console.log('[DIGICOPY] ajustes_v5171_patch.js');
})();
