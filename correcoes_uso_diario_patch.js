// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.38 — Correções de uso diário, vendas e limpeza visual
// • Remove aviso de endereço provisório
// • Dashboard passa a mostrar somente dados novos/operacionais, sem inflar por legado
// • Vendas/OS abre leve, por padrão só hoje, filtros corrigidos e sem aba Orçamentos
// • Histórico de notinha antiga mostra o registro completo do banco migrado
// • Menus automáticos das tabelas migradas ficam escondidos; acesso só por Dados migrados
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function low(v){ return txt(v).toLowerCase(); }
function norm(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
function cod(v){ const g=txt(v).match(/\d+/g); if(!g||!g.length) return ''; const c=g[g.length-1].replace(/^0+/,''); return c||'0'; }
function num(v,fb=0){ const n=Number(String(v ?? '').replace(',','.')); return Number.isFinite(n)?n:fb; }
function hoje(){ return new Date().toISOString().slice(0,10); }
function esc(v){ if(typeof escapeHtml==='function') return escapeHtml(v); return txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function money(v){ return typeof fmtMoney==='function'?fmtMoney(num(v,0)):num(v,0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function data(v){ if(!txt(v)) return '—'; return typeof fmtDate==='function'?fmtDate(v):txt(v).slice(0,10); }
function dataHora(v){ if(!txt(v)) return '—'; return typeof fmtDateTime==='function'?fmtDateTime(v):txt(v); }
function uidSafe(p){ return typeof uid==='function'?uid(p):`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function getSess(){ return typeof getSession==='function'?getSession():null; }
function rows(nome){ return (((db.modulosDinamicos||{})[nome]||{}).dados)||[]; }
function pick(r, campos){ for(const c of campos){ if(r && r[c]!==undefined && r[c]!==null && txt(r[c])!=='') return r[c]; } return ''; }

// 1) Remove aviso de endereço provisório.
try{ localStorage.setItem('digicopy_rawgh_warn_ok','1'); }catch(e){}
function removerAvisoProvisorio(){
  if(typeof document==='undefined') return;
  document.querySelectorAll('#rawgh-warn,[id*="rawgh"],.rawgh-warn').forEach(el=>el.remove());
  [...document.querySelectorAll('div')].filter(el=>/endereço PROVISÓRIO|endereco PROVISORIO/i.test(el.textContent||'')).forEach(el=>el.remove());
}
setTimeout(removerAvisoProvisorio,100);
setTimeout(removerAvisoProvisorio,1000);

// 2) Menu: esconder tabelas migradas individuais.
function instalarCssMenuLimpo(){
  if(typeof document==='undefined'||document.getElementById('css-migrados-limpo')) return;
  const st=document.createElement('style'); st.id='css-migrados-limpo';
  st.textContent=`
    [data-dynamic-category], .dynamic-menu-heading, #nav-dinamico, #nav-dinamico-label { display:none!important; }
    [data-nav^="mod_"] { display:none!important; }
    [data-nav="migrados"] { display:none!important; }
  `;
  document.head.appendChild(st);
}
function garantirBotaoDadosMigrados(){
  const destino=document.getElementById('nav-gest')||document.querySelector('nav');
  if(!destino || destino.querySelector('[data-nav="migrados"]')) return;
  const total=Object.values(db.modulosDinamicos||{}).filter(m=>Array.isArray(m&&m.dados)&&m.dados.length).length;
  if(!total) return;
  const btn=document.createElement('button'); btn.dataset.nav='migrados';
  btn.className='w-full h-10 px-3 rounded-xl flex items-center gap-3 text-[13.5px] font-medium transition text-white/60 hover:bg-white/[0.08] hover:text-white';
  btn.innerHTML=`<i class="ph ph-database text-[19px]"></i><span>Dados migrados</span><span class="ml-auto text-[11px] bg-purple-400 text-purple-950 font-bold px-2 py-0.5 rounded-full">${total}</span>`;
  btn.onclick=()=>{ if(typeof navigateTo==='function') navigateTo('migrados'); };
  destino.appendChild(btn);
}
function limparMenusMigrados(){
  instalarCssMenuLimpo();
  document.querySelectorAll('[data-dynamic-category],#nav-dinamico,#nav-dinamico-label').forEach(e=>e.remove());
  garantirBotaoDadosMigrados();
}
const oldBuildNav=window.buildNav;
if(typeof oldBuildNav==='function' && !oldBuildNav.__usoDiarioLimpo){
  window.buildNav=function(){ const ret=oldBuildNav.apply(this,arguments); setTimeout(limparMenusMigrados,0); return ret; };
  window.buildNav.__usoDiarioLimpo=true;
}
if(typeof MutationObserver!=='undefined'){
  const obs=new MutationObserver(()=>limparMenusMigrados());
  setTimeout(()=>{ try{ obs.observe(document.body,{childList:true,subtree:true}); }catch(e){} },500);
}

// 3) Dashboard limpo: não usa legado/migração para inflar indicadores.
function ehNovoOperacional(x){ return x && !x.origemMigracao && !/migr/i.test(txt(x.criadoPor||x.origem||x.criadoPorNome)); }
window.renderDashboard=function(){
  const s=getSess(); if(!s) return;
  const view=document.getElementById('view-dashboard')|| (typeof ensureView==='function'?ensureView('dashboard'):null); if(!view) return;
  const ini=(db.config&&db.config.dashboardInicioEm)||new Date().toISOString();
  db.config=db.config||{}; if(!db.config.dashboardInicioEm) db.config.dashboardInicioEm=ini;
  const vendas=(db.vendas||[]).filter(v=>v.empresaId===s.empresaId&&ehNovoOperacional(v)&&String(v.criadoEm||v.data||'')>=ini);
  const os=(db.os||[]).filter(o=>o.empresaId===s.empresaId&&ehNovoOperacional(o)&&String(o.criadoEm||o.dataAbertura||'')>=ini);
  const cr=(db.contasReceber||[]).filter(c=>c.empresaId===s.empresaId&&ehNovoOperacional(c)&&String(c.criadoEm||c.vencimento||'')>=ini);
  const hojeIso=hoje();
  const vendasHoje=vendas.filter(v=>String(v.data||v.criadoEm||'').slice(0,10)===hojeIso);
  const faturamentoHoje=vendasHoje.reduce((a,v)=>a+num(v.total,0),0)+cr.filter(c=>String(c.pagamentoData||'').slice(0,10)===hojeIso&&c.status==='pago').reduce((a,c)=>a+num(c.valor,0),0);
  view.innerHTML=`<div class="space-y-5">
    <div class="rounded-[22px] bg-gradient-to-r from-[#0a1e8a] to-blue-700 text-white p-6 shadow-xl">
      <p class="text-[11px] font-bold tracking-[.16em] uppercase text-white/60">Dashboard limpo</p>
      <h2 class="text-[24px] font-extrabold mt-1">Acompanhamento a partir de agora</h2>
      <p class="text-white/80 text-[13px] mt-2">Os dados antigos migrados continuam guardados, mas não inflam mais o painel inicial. O dashboard passa a contar o movimento novo do ERP.</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="rounded-[16px] bg-white border p-4"><p class="text-[11px] uppercase font-bold text-slate-500">Vendas hoje</p><p class="text-[26px] font-extrabold text-[#0a1e8a]">${vendasHoje.length}</p></div>
      <div class="rounded-[16px] bg-white border p-4"><p class="text-[11px] uppercase font-bold text-slate-500">Faturamento hoje</p><p class="text-[22px] font-extrabold text-emerald-700">${money(faturamentoHoje)}</p></div>
      <div class="rounded-[16px] bg-white border p-4"><p class="text-[11px] uppercase font-bold text-slate-500">Chamados novos abertos</p><p class="text-[26px] font-extrabold text-amber-700">${os.filter(o=>!['concluido','cancelado','fechado'].includes(low(o.status))).length}</p></div>
      <div class="rounded-[16px] bg-white border p-4"><p class="text-[11px] uppercase font-bold text-slate-500">Títulos novos abertos</p><p class="text-[26px] font-extrabold text-blue-700">${cr.filter(c=>c.status==='aberto').length}</p></div>
    </div>
    <div class="rounded-[18px] bg-white border p-5">
      <h3 class="font-bold text-[16px]">Ações rápidas</h3>
      <div class="flex flex-wrap gap-3 mt-4">
        <button onclick="navigateTo('vendas'); setTimeout(()=>novaVenda&&novaVenda(),80)" class="neo-btn primary"><i class="ph ph-plus"></i>Nova notinha</button>
        <button onclick="navigateTo('clientes')" class="neo-btn"><i class="ph ph-users"></i>Clientes</button>
        <button onclick="navigateTo('contratos')" class="neo-btn"><i class="ph ph-file-text"></i>Contratos</button>
        <button onclick="navigateTo('manutencao')" class="neo-btn"><i class="ph ph-wrench"></i>Chamados</button>
      </div>
    </div>
  </div>`;
};

const RECEB={1:'Dinheiro',2:'Cheque',3:'Cartão crédito',4:'Cartão débito',5:'Conta',6:'Prazo/Boleto',9:'Pix'};
function tabelaVendaReal(nome){
  const n=norm(nome);
  if(/ITENS|ITEM|CLIENT|BAIRRO|ASSUNTO|CIDADE|CONFIG|LOG|STATUS|USUARIO|FUNCIONARIO|DEPARTAMENTO|MOTIVO|PRODUTO|LOCACAO|LEITURA|CONTADOR|ORCAMENTO|BOLETO|PIX|EMAIL|ANEXO|CATEGORIA|FORNECEDOR|TRANSPORT|NCM|TRIBUTO|ESTOQUE|ENDERECO/.test(n)) return false;
  return ['VENDAS','VENDA','NOTINHA','NOTINHAS','CUPOM','CUPONS','SAIDA','SAIDAS','ORDEM_SERVICO','OS','CHAMADO','CHAMADOS'].includes(n);
}
function dataVendaRaw(r){ return pick(r,['DATA','DATA_VENDA','EMISSAO','DT_VENDA','CRIADO_EM','VEN_DATA','DATA_CADASTRO']); }
function numeroRaw(r,i,nome){ return pick(r,['COD_VENDA','NUMERO','CODIGO','ID','COD_NOTA','NUMERO_OS','NUM_OS']) || `${nome}-${i+1}`; }
function pagamentoRaw(r){
  return pick(r,['PAGAMENTO','FORMA_PAGAMENTO','RECEBIMENTO','FORMA_RECEBIMENTO','CR_RECEBIMENTO']) || RECEB[cod(pick(r,['COD_RECEBIMENTO','CR_COD_RECEBIMENTO','COD_FORMA_PAGAMENTO']))] || '';
}
function itensPorVendaRaw(){
  const idx={};
  const itens=rows('ITENS_VENDA');
  itens.forEach(ir=>{ const c=cod(pick(ir,['COD_VENDA','IV_COD_VENDA','VEN_CODIGO'])); if(!c) return; (idx[c]=idx[c]||[]).push({raw:ir,descricao:pick(ir,['DESCRICAO','PRODUTO','NOME'])||'Item',tipo:pick(ir,['TIPO','TIPO_DESCRICAO']),qtd:num(pick(ir,['QTDE','QTD','QUANTIDADE']),1)||1,preco:num(pick(ir,['VALOR_UNITARIO','PRECO','VALOR']),0),desconto:num(pick(ir,['VALOR_DESCONTO','DESCONTO']),0),subtotal:num(pick(ir,['VALOR_TOTAL','TOTAL','SUBTOTAL']),0),situacao:pick(ir,['SITUACAO']),identificacao:pick(ir,['ETIQUETA','IDENTIFICACAO']),tecnico:pick(ir,['TECNICO','COD_TECNICO'])}); });
  return idx;
}
function montarLegadas(sess){
  const mod=db.modulosDinamicos||{};
  const fp=Object.entries(mod).map(([n,m])=>`${n}:${((m&&m.dados)||[]).length}`).join('|')+'|'+((db.vendas||[]).length);
  const cache=window.__vendasLegadasUsoDiario;
  if(cache&&cache.fp===fp&&cache.emp===sess.empresaId) return cache.lista;
  const itensIdx=itensPorVendaRaw();
  const out=[];
  Object.entries(mod).forEach(([nome,m])=>{
    if(!tabelaVendaReal(nome)) return;
    (m.dados||[]).forEach((r,i)=>{
      const numero=String(numeroRaw(r,i,nome)); const cNum=cod(numero);
      if(!cNum || cNum==='0') return;
      const its=itensIdx[cNum]||[];
      const total=num(pick(r,['VALOR_LIQUIDO','TOTAL_LIQUIDO','TOTAL_NOTA','VALOR_NOTA','TOTAL_GERAL','TOTAL_OS','TOTAL','VALOR','VALOR_TOTAL']), its.reduce((s,it)=>s+num(it.subtotal,0),0));
      const osObj=/OS|ORDEM_SERVICO|CHAMADO/i.test(nome)||pick(r,['MODELO','EQUIPAMENTO','SERIE','NUMERO_SERIE','PATRIMONIO','DEFEITO','PROBLEMA'])?{migrado:true,numero:pick(r,['NUMERO_OS','NUM_OS'])||numero,modelo:pick(r,['MODELO','EQUIPAMENTO','MAQUINA','IMPRESSORA']),numeroSerie:pick(r,['SERIE','NUMERO_SERIE','N_SERIE','SERIAL']),patrimonio:pick(r,['PATRIMONIO','PAT']),contador:pick(r,['CONTADOR','CONTADOR_PB','CONTADOR_ATUAL']),defeito:pick(r,['DEFEITO','PROBLEMA','DEFEITO_RELATADO']),servicos:pick(r,['SOLUCAO','SERVICO','SERVICOS']),tecnico:pick(r,['TECNICO','RESPONSAVEL','VENDEDOR'])}:null;
      out.push({id:`legado_venda_${nome}_${i}`,empresaId:sess.empresaId,numero,data:dataVendaRaw(r),total,status:lower(pick(r,['SITUACAO','STATUS']))||'finalizada',formaPagamento:pagamentoRaw(r)||'Prazo',clienteNomeAntigo:pick(r,['CLIENTE','NOME_CLIENTE','RAZAO_SOCIAL','NOME','NOME_RAZAOSOCIAL']),fantasiaAntiga:pick(r,['FANTASIA','NOME_FANTASIA']),numeroNfe:pick(r,['NFE','NUMERO_NFE','NUM_NFE']),codClienteAntigo:pick(r,['COD_CLIENTE','CODIGO_CLIENTE']),criadoPorNome:pick(r,['VENDEDOR','USUARIO','ATENDENTE','OPERADOR'])||'Importado',observacao:pick(r,['OBSERVACAO','OBS']),itens:its,origemMigracao:true,tabelaOrigem:nome,raw:r,os:osObj});
    });
  });
  window.__vendasLegadasUsoDiario={fp,emp:sess.empresaId,lista:out};
  return out;
}
window.vosLegadosVendas=function(sess){ return montarLegadas(sess); };

function clienteVenda(v){ return (v.clienteId&&(db.clientes||[]).find(c=>c.id===v.clienteId)) || (cod(v.codClienteAntigo)&&((db.clientes||[]).find(c=>c.empresaId===v.empresaId&&cod(c.codigo||c.codigoAntigo)===cod(v.codClienteAntigo)))) || null; }
function pagamentoVenda(v){
  if(v.formaPagamento&&v.formaPagamento!=='Não faturado') return v.formaPagamento;
  const cr=(db.contasReceber||[]).find(c=>c.vendaId===v.id);
  if(cr) return cr.formaPagamento||RECEB[cod(cr.codRecebimento||cr.CR_COD_RECEBIMENTO)]||cr.status||'Prazo';
  return v.origemMigracao?(v.formaPagamento||'Prazo'):'—';
}
function tipoVenda(v){ if(v.os) return 'Venda + OS'; if((v.itens||[]).some(it=>/SERV|RECARG|REMANU|CARTUCHO|\bR\b/i.test([it.tipo,it.descricao].join(' ')))) return 'Serviço/Recarga'; return 'Venda'; }
function dataKey(v){ const d=Date.parse(v.data||v.criadoEm||''); return Number.isFinite(d)?d:0; }
window.setNeoVendasTab=function(tab){ window.__vendasUsoFiltros=window.__vendasUsoFiltros||{}; window.__vendasUsoFiltros.tab=tab; window.__vendasUsoFiltros.forcouTab=true; renderVendas(); };
window.vendasUsoBuscar=function(){ const F=window.__vendasUsoFiltros=window.__vendasUsoFiltros||{}; F.q=document.getElementById('neo-search-vendas')?.value||''; F.de=document.getElementById('neo-vendas-de')?.value||''; F.ate=document.getElementById('neo-vendas-ate')?.value||''; F.sit=document.getElementById('neo-vendas-sit')?.value||'todas'; F.pag=document.getElementById('neo-vendas-pag')?.value||'todos'; F.forcouBusca=true; renderVendas(); };
window.vendasUsoLimpar=function(){ window.__vendasUsoFiltros={tab:'hoje'}; renderVendas(); };
window.renderVendas=function(){
  const sess=getSess(); if(!sess) return;
  const view=document.getElementById('view-vendas')||(typeof ensureView==='function'?ensureView('vendas'):null); if(!view) return;
  const F=window.__vendasUsoFiltros=window.__vendasUsoFiltros||{tab:'hoje'};
  const q=low(F.q||''), de=F.de||'', ate=F.ate||'', sit=F.sit||'todas', pag=F.pag||'todos', tab=F.tab||'hoje';
  const defaultHoje=tab==='hoje'&&!q&&!de&&!ate&&!F.forcouBusca;
  const baseNovas=[...(db.vendas||[]).filter(v=>v.empresaId===sess.empresaId&&!['orcamento','aprovado'].includes(low(v.status)))];
  // Modo leve: não converte milhares de notinhas antigas ao abrir a tela.
  // Só busca legado quando o usuário pede por filtro/busca/todas.
  const precisaLegado=!defaultHoje && (tab==='todas'||q||de||ate||sit!=='todas'||pag!=='todos');
  const base=precisaLegado?[...baseNovas,...montarLegadas(sess)]:baseNovas;
  let list=base.slice();
  if(defaultHoje||tab==='hoje') list=list.filter(v=>String(v.data||v.criadoEm||'').slice(0,10)===hoje());
  if(tab==='abertas') list=list.filter(v=>!['faturado','finalizada'].includes(low(v.status)));
  if(de) list=list.filter(v=>String(v.data||v.criadoEm||'').slice(0,10)>=de);
  if(ate) list=list.filter(v=>String(v.data||v.criadoEm||'').slice(0,10)<=ate);
  if(sit!=='todas') list=list.filter(v=>low(v.status||'aguardar')===low(sit));
  if(pag!=='todos') list=list.filter(v=>low(pagamentoVenda(v)).includes(low(pag)));
  if(q) list=list.filter(v=>{ const c=clienteVenda(v)||{}; return [v.numero,c.nome,c.codigo,v.codClienteAntigo,v.clienteNomeAntigo,v.criadoPorNome,pagamentoVenda(v),v.tabelaOrigem].some(x=>low(x).includes(q)); });
  list.sort((a,b)=>(dataKey(b)-dataKey(a))||(Number(cod(b.numero))-Number(cod(a.numero))));
  window.__vosUltimaListaVendas=list;
  const limite=window.__vosLimiteVendas||150; const vis=list.slice(0,limite); const total=list.reduce((s,v)=>s+num(v.total,0),0);
  const situacoes=[...new Set(base.map(v=>low(v.status||'aguardar')).filter(Boolean))].sort();
  view.innerHTML=`<div class="neo-shell"><div class="neo-panel neo-float-in">
    <div class="neo-head"><div><h3>Vendas e Notinhas</h3><p>Por padrão mostra somente hoje. Use busca/data para consultar notinhas antigas.</p></div><div class="neo-actions"><button onclick="novaVenda()" class="neo-btn primary"><i class="ph ph-plus"></i>Nova notinha</button><button onclick="excluirVendaNeo()" class="neo-btn danger"><i class="ph ph-trash"></i>Excluir</button></div></div>
    <div class="p-4 border-b bg-white space-y-2"><input type="hidden" id="neo-tab-vendas" value="${tab}">
      <div class="flex flex-wrap items-center gap-3"><div class="neo-tabs"><button onclick="setNeoVendasTab('hoje')" class="neo-tab ${tab==='hoje'?'active':''}">Hoje</button><button onclick="setNeoVendasTab('abertas')" class="neo-tab ${tab==='abertas'?'active':''}">Abertas</button><button onclick="setNeoVendasTab('todas')" class="neo-tab ${tab==='todas'?'active':''}">Todas</button></div><input id="neo-search-vendas" value="${esc(F.q||'')}" onkeydown="if(event.key==='Enter'){event.preventDefault(); vendasUsoBuscar()}" class="neo-input ml-auto min-w-[260px] flex-1" placeholder="Pesquisar: código, cliente, pagamento..."><button onclick="vendasUsoBuscar()" class="neo-btn primary"><i class="ph ph-magnifying-glass"></i></button><div class="text-right text-[12px] text-slate-500 min-w-[120px]"><b class="text-[#0a1e8a]">${vis.length}</b> de <b>${list.length}</b><br>${money(total)}</div></div>
      <div class="flex flex-wrap items-center gap-2"><label class="text-[11px] font-bold text-slate-500 uppercase">De</label><input id="neo-vendas-de" type="date" value="${esc(de)}" class="neo-input !w-[145px] !h-9"><label class="text-[11px] font-bold text-slate-500 uppercase">Até</label><input id="neo-vendas-ate" type="date" value="${esc(ate)}" class="neo-input !w-[145px] !h-9"><select id="neo-vendas-sit" class="neo-select !h-9"><option value="todas">Situação: todas</option>${situacoes.map(s=>`<option value="${esc(s)}" ${sit===s?'selected':''}>${esc(s)}</option>`).join('')}</select><select id="neo-vendas-pag" class="neo-select !h-9"><option value="todos">Pagamento: todos</option>${['Dinheiro','Cartão','Pix','Prazo','Boleto','Grátis'].map(p=>`<option ${pag===p?'selected':''}>${p}</option>`).join('')}</select><button onclick="vendasUsoBuscar()" class="neo-btn !h-9"><i class="ph ph-funnel"></i>Filtrar</button><button onclick="vendasUsoLimpar()" class="neo-btn !h-9"><i class="ph ph-funnel-x"></i>Limpar</button></div>
    </div>
    <div class="overflow-auto max-h-[calc(100vh-340px)]"><table class="neo-table"><thead><tr><th>Código</th><th>Data</th><th>Cliente</th><th>Valor</th><th>Situação</th><th>Tipo</th><th>Usuário</th><th>Pagamento</th><th></th></tr></thead><tbody>${vis.map(v=>{ const c=clienteVenda(v)||{}; const sel=window.neoVendaSelecionada===v.id; const st=low(v.status); return `<tr onclick="window.neoVendaSelecionada='${esc(v.id)}'; renderVendas()" ondblclick="historicoVenda('${esc(v.id)}')" class="cursor-pointer ${sel?'neo-selected':''}"><td><b class="text-[#0a1e8a]">${esc(cod(v.numero)||v.numero)}</b>${v.origemMigracao?'<br><span class="text-[10px] text-slate-400">antiga</span>':''}</td><td>${data(v.data||v.criadoEm)}</td><td><b>${esc(c.nome||v.clienteNomeAntigo||'(sem cliente)')}</b><br><span class="text-[11px] text-slate-500">Cód. ${esc(c.codigo||v.codClienteAntigo||'-')}</span></td><td><b>${money(v.total)}</b></td><td><span class="neo-status ${['faturado','finalizada'].includes(st)?'ok':st==='cancelado'?'bad':'wait'}">${esc(st==='faturado'?'finalizada':st||'aguardar')}</span></td><td>${esc(tipoVenda(v))}</td><td>${esc(v.atendenteNome||v.criadoPorNome||'-')}</td><td>${esc(pagamentoVenda(v))}</td><td><button onclick="event.stopPropagation(); historicoVenda('${esc(v.id)}')" class="neo-btn !px-2"><i class="ph ph-eye"></i></button></td></tr>`;}).join('')||'<tr><td colspan="9" class="text-center text-slate-400 py-8">Nenhuma notinha para o filtro atual.</td></tr>'}</tbody></table></div>${list.length>vis.length?`<div class="p-3 text-center border-t"><button class="neo-btn" onclick="window.__vosLimiteVendas=${limite+150}; renderVendas()">Mostrar mais ${Math.min(150,list.length-vis.length)}</button></div>`:''}</div></div>`;
};

const oldHistorico=window.historicoVenda;
window.historicoVenda=function(id){
  const sess=getSess(); if(!sess) return;
  const v=[...(db.vendas||[]),...montarLegadas(sess)].find(x=>x.id===id);
  if(!v) return oldHistorico?oldHistorico(id):null;
  if(!v.origemMigracao) return oldHistorico?oldHistorico(id):null;
  const c=clienteVenda(v)||{};
  const raw=v.raw||{}; const itens=v.itens||[];
  const modal=document.getElementById('modal-root'); const box=document.getElementById('modal-box');
  if(box) box.className='w-full max-w-[1050px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[94vh] flex flex-col';
  document.getElementById('modal-title').innerText='Histórico completo — '+(cod(v.numero)||v.numero);
  document.getElementById('modal-body').innerHTML=`<div class="space-y-4 text-[12.5px]"><div class="rounded-[14px] bg-[#0a1e8a] text-white p-4 flex justify-between"><div><p class="text-white/70 text-[11px] uppercase font-bold">Notinha antiga migrada</p><h3 class="font-extrabold text-[20px]">${esc(cod(v.numero)||v.numero)}</h3><p>${esc(v.tabelaOrigem||'VENDAS')}</p></div><div class="text-right"><p>${dataHora(v.data)}</p><p class="font-bold text-[18px] mt-1">${money(v.total)}</p><p>${esc(pagamentoVenda(v))}</p></div></div><div class="rounded-[14px] border p-3"><b>${esc(c.nome||v.clienteNomeAntigo||'(sem cliente)')}</b><p class="text-slate-500">Código: ${esc(c.codigo||v.codClienteAntigo||'-')} • Documento: ${esc(c.documento||'')} • Telefone: ${esc(c.telefone||'')}</p></div><div class="rounded-[14px] border overflow-hidden"><div class="p-3 bg-slate-50 border-b font-bold">Itens vinculados</div><table class="w-full text-left text-[12px]"><thead class="bg-slate-50"><tr><th class="px-3 py-2">Descrição</th><th>Tipo</th><th>Qtd</th><th>Unit.</th><th>Desc.</th><th>Total</th><th>Situação</th><th>Ident.</th></tr></thead><tbody>${itens.map(it=>`<tr class="border-t"><td class="px-3 py-2"><b>${esc(it.descricao)}</b></td><td>${esc(it.tipo)}</td><td>${esc(it.qtd)}</td><td>${money(it.preco)}</td><td>${money(it.desconto)}</td><td><b>${money(it.subtotal)}</b></td><td>${esc(it.situacao)}</td><td>${esc(it.identificacao)}</td></tr>`).join('')||'<tr><td colspan="8" class="text-center text-slate-400 py-5">Sem itens migrados vinculados. Veja os campos originais abaixo.</td></tr>'}</tbody></table></div>${v.os?`<div class="rounded-[14px] border p-3"><b>Dados de OS</b><div class="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2"><span>Modelo: <b>${esc(v.os.modelo)}</b></span><span>Série: <b>${esc(v.os.numeroSerie)}</b></span><span>Patrimônio: <b>${esc(v.os.patrimonio)}</b></span><span>Contador: <b>${esc(v.os.contador)}</b></span></div><p class="mt-2"><b>Defeito:</b> ${esc(v.os.defeito)}</p><p><b>Serviços:</b> ${esc(v.os.servicos)}</p></div>`:''}<div class="rounded-[14px] border overflow-hidden"><div class="p-3 bg-slate-50 border-b font-bold">Todos os campos originais da tabela ${esc(v.tabelaOrigem)}</div><div class="max-h-[360px] overflow-auto"><table class="w-full text-left text-[12px]"><tbody>${Object.entries(raw).map(([k,val])=>`<tr class="border-t"><td class="px-3 py-2 font-bold text-slate-500 w-[260px]">${esc(k)}</td><td class="px-3 py-2">${esc(val==null?'':String(val))}</td></tr>`).join('')}</tbody></table></div></div></div>`;
  document.getElementById('modal-footer').innerHTML='<button onclick="closeModal()" class="neo-btn">Fechar</button>';
  modal.classList.remove('hidden');
};

window.CORRECOES_USO_DIARIO_PURE={ tabelaVendaReal, dataVendaRaw, pagamentoRaw, ehNovoOperacional, cod, norm };

if(typeof document==='undefined') return;
function instalar(){ limparMenusMigrados(); removerAvisoProvisorio(); }
setTimeout(instalar,50); setTimeout(instalar,1000); setTimeout(instalar,3500);
console.log('[DIGICOPY] correcoes_uso_diario_patch.js v4.9.38 carregado');
})();
