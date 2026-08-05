// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.53 — Reparo de notinha, venda realizada e chamado avulso
// • Mantém venda Pix em meia folha, com QR compacto e WhatsApp para comprovante
// • Completa dados da loja na notinha e nos chamados
// • Chamado avulso passa a ter histórico, contador preto/color e 2 impressões
// • Chamado não altera contador oficial da impressora; só leitura altera contador
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function low(v){ return txt(v).toLowerCase(); }
function up(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
function esc(v){ if(typeof escapeHtml==='function') return escapeHtml(v); return txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function n(v,fb=0){ const out=Number(String(v ?? '').replace(',','.')); return Number.isFinite(out)?out:fb; }
function inteiro(v,fb=0){ const out=parseInt(String(v ?? '').replace(/\D+/g,''),10); return Number.isFinite(out)?out:fb; }
function sess(){ return typeof getSession==='function'?getSession():null; }
function uidSafe(p){ return typeof uid==='function'?uid(p):`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function money(v){ return typeof fmtMoney==='function'?fmtMoney(n(v,0)):n(v,0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function dataBR(v){ return typeof fmtDate==='function'?fmtDate(v):txt(v).slice(0,10); }
function dataHoraBR(v){ return typeof fmtDateTime==='function'?fmtDateTime(v):txt(v); }
function salvar(){ if(typeof saveDB==='function') saveDB(); }
function aviso(m,t){ if(typeof toast==='function') toast(m,t||'info'); }
function logar(e,a,id,d){ if(typeof logAction==='function') logAction(e,a,id,d); }
function cli(id){ return (db.clientes||[]).find(c=>c.id===id)||null; }
function eq(id){ return (db.equipamentos||[]).find(e=>e.id===id)||null; }
function parquePorEquip(equipId){ return (db.parque||[]).find(p=>p.equipamentoId===equipId)||null; }
function somenteNum(v){ const g=txt(v).match(/\d+/g); if(!g) return ''; const s=g[g.length-1].replace(/^0+/,''); return s||'0'; }
function proximoNumero(lista, empresaId){ const nums=(lista||[]).filter(x=>!empresaId||x.empresaId===empresaId).map(x=>inteiro(somenteNum(x.numero||x.codigo||''),0)); return String((nums.length?Math.max(...nums):0)+1); }
function isPix(v){ return /pix/i.test(txt(v&&v.formaPagamento)); }

const WHATS_QR='+55 38 99109-8698';

function empresaCompleta(dbRef, session){
  let empSel=null;
  try{ if(typeof localStorage!=='undefined') empSel=JSON.parse(localStorage.getItem('digicopy_empresa_notinha')||'null'); }catch(e){}
  const e=empSel || ((dbRef.empresas||[]).find(x=>session&&x.id===session.empresaId)) || ((dbRef.config||{}).empresa) || {};
  const fantasia=txt(e.fantasia||e.nomeFantasia||e.apelido||'DIGICOPY');
  const razao=txt(e.razaoSocial||e.razao||e.nome||e.empresa||fantasia);
  const cnpj=txt(e.cnpj||e.documento||(session&&session.cnpj)||'');
  const telefone=txt(e.telefone||e.fone||e.celular||'');
  const whatsapp=txt(e.whatsapp||e.whats||e.whatsApp||WHATS_QR)||WHATS_QR;
  const email=txt(e.email||e.mail||'');
  const rua=txt(e.logradouro||e.endereco||e.rua||e.av||'');
  const numero=txt(e.numero||e.num||'');
  const bairro=txt(e.bairro||'');
  const cidade=txt(e.municipio||e.cidade||'');
  const uf=txt(e.uf||e.estado||'');
  const cep=txt(e.cep||'');
  const endereco=[rua,numero,bairro,cidade&&uf?`${cidade}/${uf}`:(cidade||uf),cep].filter(Boolean).join(' • ');
  return {fantasia,razao,cnpj,telefone,whatsapp,email,endereco};
}
function contadorQtd(anterior, atual){ if(txt(atual)==='') return 0; return Math.max(0,n(atual,0)-n(anterior,0)); }
function validarChamadoParaFaturar(ch){
  const faltas=[];
  if(!txt(ch.clienteId)) faltas.push('cliente');
  if(!txt(ch.modelo)) faltas.push('modelo da impressora');
  if(!txt(ch.descricao)) faltas.push('motivo do chamado');
  if(!txt(ch.servicoExecutado||ch.servicos)) faltas.push('serviço executado');
  if(txt(ch.contadorPretoAtual)==='') faltas.push('contador preto atual');
  return faltas;
}
function ultimoContadorEquip(equipId,tipo,ignoreOsId){
  const e=eq(equipId)||{};
  const campoEq=tipo==='color'?'contadorCor':'contadorPB';
  let best={valor:n(e[campoEq],0),data:e.atualizadoEm||e.criadoEm||''};
  (db.leituras||[]).forEach(l=>{
    if(l.equipamentoId!==equipId) return;
    const d=l.dataLeitura||l.criadoEm||'';
    const val=tipo==='color'?n(l.contadorCor,0):n(l.contadorPB,0);
    if(!best.data || new Date(d)>=new Date(best.data||0)) best={valor:val,data:d};
  });
  (db.os||[]).forEach(o=>{
    if(ignoreOsId&&o.id===ignoreOsId) return;
    if(o.equipamentoId!==equipId) return;
    const d=o.dataFechamento||o.dataAbertura||o.criadoEm||'';
    const val=tipo==='color'?n(o.contadorColorAtual||o.contadorCorAtual,0):n(o.contadorPretoAtual||o.contadorAtual,0);
    if(val && (!best.data || new Date(d)>=new Date(best.data||0))) best={valor:val,data:d};
  });
  return best.valor||0;
}

function pixCompacto(v){
  if(!isPix(v) || typeof window.pixPayloadDaVenda!=='function' || !window.PIX_PURE) return '';
  let payload='';
  try{ payload=window.pixPayloadDaVenda(v); }catch(e){ return ''; }
  const link=typeof window.pixPagamentoUrl==='function'?window.pixPagamentoUrl(payload):'';
  const qr=window.PIX_PURE.qrUrl(payload,160);
  return `<div class="pix-compacto" style="margin-top:2mm;border:1px solid #9db3e8;border-radius:2mm;padding:1.8mm 2.2mm;display:flex;gap:3mm;align-items:center;page-break-inside:avoid;max-height:23mm;overflow:hidden">
    <a href="${esc(link)}" target="_blank" rel="noopener"><img src="${esc(qr)}" width="64" height="64" style="width:18mm;height:18mm" alt="QR Pix"></a>
    <div style="flex:1;min-width:0">
      <p style="margin:0;font-size:9.5px;font-weight:800;color:#0a1e8a">PIX QR CODE — ${money(v.total||0)}</p>
      <p style="margin:.7mm 0 0;font-size:7.7px;color:#444">Valor exato. Envie comprovante no WhatsApp <b>${esc(WHATS_QR)}</b> para baixa manual.</p>
      <p style="margin:.6mm 0 0;font-size:6.4px;color:#555;word-break:break-all;line-height:1.15">${esc(payload)}</p>
    </div>
  </div>`;
}
function patchNotinhaHtml(html,vendaId){
  const s=sess(); if(!s||!html) return html;
  const v=(db.vendas||[]).find(x=>x.id===vendaId)||null;
  const emp=empresaCompleta(db,s);
  const cab=`<p class="emp-nome">${esc(emp.fantasia)}</p><p class="emp-info">${esc(emp.razao)}${emp.cnpj?' • CNPJ '+esc(emp.cnpj):''}</p><p class="emp-info">${esc(emp.endereco||'Endereço não informado')}</p><p class="emp-info">${emp.telefone?'Tel. '+esc(emp.telefone)+' • ':''}WhatsApp QR Code: <b>${esc(emp.whatsapp)}</b>${emp.email?' • '+esc(emp.email):''}</p>`;
  html=html.replace(/<p class="emp-nome">[\s\S]*?<\/p>\s*<p class="emp-info">[\s\S]*?<\/p>\s*<p class="emp-info">[\s\S]*?<\/p>/,cab);
  html=html.replace(/\.meia\{height:138mm\}/,'.meia{height:148mm;max-height:148mm;overflow:hidden}');
  html=html.replace(/<div style="margin:8px 0;padding:8px;border:1px solid #f59e0b[\s\S]*?comprovante no WhatsApp[\s\S]*?<\/div>/g,'');
  if(v&&isPix(v)){
    const bloco=pixCompacto(v);
    if(bloco){
      if(/<div style="margin-top:3mm;border:1px solid #9db3e8[\s\S]*?<p class="audit">/.test(html)) html=html.replace(/<div style="margin-top:3mm;border:1px solid #9db3e8[\s\S]*?<p class="audit">/,bloco+'<p class="audit">');
      else if(!html.includes('pix-compacto')) html=html.replace('<p class="audit">',bloco+'<p class="audit">');
    }
  }
  return html;
}

window.VENDAS_CHAMADOS_REPARO_PURE={empresaCompleta,contadorQtd,validarChamadoParaFaturar,proximoNumero};

if(typeof document==='undefined') return;

const oldHtmlNotinha=window.vosGerarHtmlNotinha;
window.vosGerarHtmlNotinha=function(vendaId,opts){ return patchNotinhaHtml(oldHtmlNotinha?oldHtmlNotinha.apply(this,arguments):null,vendaId); };
const oldHistoricoVenda=window.historicoVenda;
window.historicoVenda=function(id){
  const ret=oldHistoricoVenda?oldHistoricoVenda.apply(this,arguments):undefined;
  setTimeout(()=>{
    const v=(db.vendas||[]).find(x=>x.id===id);
    if(!v) return;
    const body=document.getElementById('modal-body');
    if(body&&v.chamadoId&&!body.querySelector('#venda-chamado-alerta')){
      const o=(db.os||[]).find(x=>x.id===v.chamadoId);
      body.insertAdjacentHTML('afterbegin',`<div id="venda-chamado-alerta" class="mb-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-[12px] text-blue-900"><b>Notinha relacionada a chamado:</b> ${esc(o?o.numero:'chamado')} <button onclick="openModal('os','${esc(v.chamadoId)}')" class="ml-2 h-8 px-3 rounded-lg bg-[#0a1e8a] text-white font-bold">Abrir chamado</button></div>`);
    }
  },80);
  return ret;
};
window.showVenda=window.historicoVenda;
window.abrirVendaRealizada=window.historicoVenda;

function produtosOptions(sel){ return (db.produtos||[]).filter(p=>!sess()||p.empresaId===sess().empresaId).map(p=>`<option value="${p.id}" ${sel===p.id?'selected':''}>${esc(p.sku||p.codigo||'')} - ${esc(p.nome||'')} • ${money(p.preco||0)}</option>`).join(''); }
function tecnicosOptions(sel){ return (db.tecnicos||[]).map(t=>`<option value="${esc(t.id||t.nome)}" ${sel===(t.id||t.nome)?'selected':''}>${esc(t.nome||t.id)}</option>`).join(''); }
function clienteOptions(sel){ const s=sess(); return (db.clientes||[]).filter(c=>!s||c.empresaId===s.empresaId).map(c=>`<option value="${c.id}" ${sel===c.id?'selected':''}>${esc(c.codigo||'')} - ${esc(c.nome||'')}</option>`).join(''); }
function equipOptions(clienteId,sel){ const s=sess(); return (db.parque||[]).filter(p=>(!s||p.empresaId===s.empresaId)&&(!clienteId||p.clienteId===clienteId)).map(p=>{ const e=eq(p.equipamentoId)||{}; return `<option value="${p.equipamentoId}" ${sel===p.equipamentoId?'selected':''}>${esc(e.modelo||'')} • Patr. ${esc(e.patrimonio||'-')} • Serial ${esc(e.serie||'-')}</option>`; }).join(''); }
function renderItensChamado(){
  const box=document.getElementById('os-itens-list'); if(!box) return;
  const itens=window.__osItensTemp||[];
  box.innerHTML=itens.map((it,i)=>{ const p=eqProduto(it.produtoId); return `<div class="flex justify-between items-center gap-2 p-2 rounded-lg border bg-slate-50"><div><b>${esc(p?`${p.nome}`:it.nome||'Item')}</b><br><span class="text-[11px] text-slate-500">Qtd ${it.qtd} • ${money(it.preco||0)}</span></div><button onclick="removerItemChamadoV53(${i})" class="w-8 h-8 rounded-lg bg-white border text-red-600"><i class="ph ph-trash"></i></button></div>`;}).join('')||'<p class="text-[12px] text-slate-400">Nenhum item usado. Se não tiver item, o chamado faturado não cria notinha nem financeiro.</p>';
}
function eqProduto(id){ return (db.produtos||[]).find(p=>p.id===id)||null; }
window.adicionarItemChamadoV53=function(){ const prodId=document.getElementById('os-prod')?.value||''; const qtd=Math.max(1,inteiro(document.getElementById('os-prod-qtd')?.value,1)); if(!prodId) return aviso('Selecione o item/produto','error'); const p=eqProduto(prodId); window.__osItensTemp=window.__osItensTemp||[]; window.__osItensTemp.push({produtoId:prodId,nome:p&&p.nome,qtd,preco:n(p&&p.preco,0),subtotal:n(p&&p.preco,0)*qtd}); renderItensChamado(); };
window.removerItemChamadoV53=function(i){ (window.__osItensTemp||[]).splice(i,1); renderItensChamado(); };
window.osClienteMudouV53=function(){ const cliId=document.getElementById('os-cli')?.value||''; const sel=document.getElementById('os-eq'); if(sel) sel.innerHTML='<option value="">Avulso / digitar manual</option>'+equipOptions(cliId,''); };
window.osEquipMudouV53=function(){ const equipId=document.getElementById('os-eq')?.value||''; const e=eq(equipId)||{}; const p=parquePorEquip(equipId)||{}; if(!equipId) return; const set=(id,val)=>{ const el=document.getElementById(id); if(el) el.value=val||''; }; set('os-modelo',e.modelo); set('os-patr',e.patrimonio); set('os-serial',e.serie); set('os-local',p.localInstalacao||p.setor); set('os-cont-pb-ant',ultimoContadorEquip(equipId,'pb')); set('os-cont-cor-ant',ultimoContadorEquip(equipId,'color')); set('os-cont-pb-atu',''); set('os-cont-cor-atu',''); calcContadoresChamadoV53(); };
window.calcContadoresChamadoV53=function(){ const pb=contadorQtd(document.getElementById('os-cont-pb-ant')?.value,document.getElementById('os-cont-pb-atu')?.value); const cor=contadorQtd(document.getElementById('os-cont-cor-ant')?.value,document.getElementById('os-cont-cor-atu')?.value); const a=document.getElementById('os-qtd-pb'); if(a) a.value=pb; const b=document.getElementById('os-qtd-cor'); if(b) b.value=cor; };

function renderModalChamado(id){
  const s=sess(); if(!s) return;
  const o=id?(db.os||[]).find(x=>x.id===id):null;
  window.__osItensTemp=(o&&Array.isArray(o.itens))?JSON.parse(JSON.stringify(o.itens)):[];
  const num=o?txt(o.numero):proximoNumero(db.os||[],s.empresaId);
  const c=o?cli(o.clienteId):null;
  const box=document.getElementById('modal-box'); if(box) box.className='w-full max-w-[1050px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[94vh] flex flex-col';
  document.getElementById('modal-title').innerText=(o?'Chamado ':'Novo chamado ')+num;
  document.getElementById('modal-body').innerHTML=`<div class="space-y-4 text-[13px]"><div class="rounded-xl bg-blue-50 border border-blue-200 p-3 text-blue-900"><b>Chamado avulso / geral</b><p class="text-[12px] mt-1">Esta tela mostra e cria chamados fora de um contrato específico. Chamado de contrato continua dentro do contrato.</p></div><div class="grid grid-cols-1 md:grid-cols-5 gap-3"><label>Código<input id="os-num" readonly value="${esc(num)}" class="mt-1 w-full h-10 px-3 rounded-xl border bg-slate-50 font-mono font-bold"></label><label>Data abertura<input id="os-data" type="date" value="${txt(o&&o.dataAbertura?o.dataAbertura:new Date().toISOString()).slice(0,10)}" class="mt-1 w-full h-10 px-3 rounded-xl border"></label><label>Prioridade<select id="os-prio" class="mt-1 w-full h-10 px-3 rounded-xl border"><option value="normal">Normal</option><option value="alta">Alta</option><option value="baixa">Baixa</option></select></label><label>Técnico<select id="os-tec" class="mt-1 w-full h-10 px-3 rounded-xl border"><option value="">A definir</option>${tecnicosOptions(o&&o.tecnico)}</select></label><label>Status<select id="os-status" class="mt-1 w-full h-10 px-3 rounded-xl border"><option value="aberto">Aberto</option><option value="em_atendimento">Em atendimento</option><option value="aguardando_peca">Aguardando peça</option><option value="concluido">Concluído</option></select></label></div><div class="grid grid-cols-1 md:grid-cols-2 gap-3"><label>Cliente *<select id="os-cli" onchange="osClienteMudouV53()" class="mt-1 w-full h-10 px-3 rounded-xl border"><option value="">Selecione</option>${clienteOptions(o&&o.clienteId)}</select></label><label>Impressora<select id="os-eq" onchange="osEquipMudouV53()" class="mt-1 w-full h-10 px-3 rounded-xl border"><option value="">Avulso / digitar manual</option>${equipOptions(o&&o.clienteId,o&&o.equipamentoId)}</select></label></div><div class="grid grid-cols-1 md:grid-cols-4 gap-3"><label>Modelo da impressora *<input id="os-modelo" value="${esc(o&&o.modelo||'')}" class="mt-1 w-full h-10 px-3 rounded-xl border"></label><label>Patrimônio<input id="os-patr" value="${esc(o&&o.patrimonio||'')}" class="mt-1 w-full h-10 px-3 rounded-xl border"></label><label>Serial<input id="os-serial" value="${esc(o&&(o.serie||o.serial)||'')}" class="mt-1 w-full h-10 px-3 rounded-xl border"></label><label>Local<input id="os-local" value="${esc(o&&o.local||'')}" class="mt-1 w-full h-10 px-3 rounded-xl border"></label></div><div class="grid grid-cols-1 md:grid-cols-6 gap-3 bg-slate-50 border rounded-xl p-3"><label>Preto anterior<input id="os-cont-pb-ant" type="number" readonly value="${n(o&&(o.contadorPretoAnterior||o.contadorAntigo),0)}" class="mt-1 w-full h-10 px-3 rounded-xl border bg-white font-mono"></label><label>Preto atual *<input id="os-cont-pb-atu" type="number" value="${o&&txt(o.contadorPretoAtual||o.contadorAtual)}" oninput="calcContadoresChamadoV53()" class="mt-1 w-full h-10 px-3 rounded-xl border-2 border-[#0a1e8a] font-mono"></label><label>Usou preto<input id="os-qtd-pb" type="number" readonly value="${n(o&&o.quantidadePreto||o&&o.quantidadeImpressos,0)}" class="mt-1 w-full h-10 px-3 rounded-xl border bg-emerald-50 font-bold"></label><label>Color anterior<input id="os-cont-cor-ant" type="number" readonly value="${n(o&&o.contadorColorAnterior,0)}" class="mt-1 w-full h-10 px-3 rounded-xl border bg-white font-mono"></label><label>Color atual<input id="os-cont-cor-atu" type="number" value="${o&&txt(o.contadorColorAtual)}" oninput="calcContadoresChamadoV53()" class="mt-1 w-full h-10 px-3 rounded-xl border font-mono"></label><label>Usou color<input id="os-qtd-cor" type="number" readonly value="${n(o&&o.quantidadeColor,0)}" class="mt-1 w-full h-10 px-3 rounded-xl border bg-emerald-50 font-bold"></label></div><label>Motivo / defeito do chamado *<textarea id="os-desc" class="mt-1 w-full h-20 p-3 rounded-xl border">${esc(o&&o.descricao||'')}</textarea></label><label>Serviço executado *<textarea id="os-serv" class="mt-1 w-full h-20 p-3 rounded-xl border">${esc(o&&(o.servicoExecutado||o.servicos)||'')}</textarea></label><div class="rounded-xl border p-3"><p class="font-bold mb-2">Itens usados / peças para notinha relacionada</p><div class="grid grid-cols-1 md:grid-cols-12 gap-2"><select id="os-prod" class="md:col-span-8 h-10 px-3 rounded-xl border"><option value="">Selecione item/produto</option>${produtosOptions('')}</select><input id="os-prod-qtd" type="number" min="1" value="1" class="md:col-span-2 h-10 px-3 rounded-xl border"><button onclick="adicionarItemChamadoV53()" class="md:col-span-2 h-10 rounded-xl bg-[#0a1e8a] text-white font-bold">Adicionar</button></div><div id="os-itens-list" class="mt-3 space-y-2"></div><p class="text-[11px] text-amber-700 mt-2"><b>Aviso:</b> se faturar com itens, será criada uma notinha relacionada ao chamado com botão de atalho. Não será gerado financeiro automático do chamado.</p></div></div>`;
  document.getElementById('os-prio').value=o&&o.prioridade||'normal'; document.getElementById('os-status').value=o&&o.status||'aberto'; renderItensChamado();
  document.getElementById('modal-footer').innerHTML=`<button onclick="closeModal()" class="neo-btn">Fechar</button>${o?`<button onclick="imprimirChamadoTecnicoV53('${o.id}')" class="neo-btn"><i class="ph ph-file-text"></i> Modelo técnico</button>`:''}<button onclick="salvarChamadoV53('${o?o.id:''}',false)" class="neo-btn primary">Salvar chamado</button><button onclick="salvarChamadoV53('${o?o.id:''}',true)" class="neo-btn !bg-emerald-600 !text-white">Faturar chamado</button>${o&&o.faturado?`<button onclick="imprimirChamadoFinalV53('${o.id}')" class="neo-btn"><i class="ph ph-printer"></i> Chamado final</button>`:''}`;
  document.getElementById('modal-root')?.classList.remove('hidden');
}

window.salvarChamadoV53=function(id,faturar){
  const s=sess(); if(!s) return;
  const atualPB=txt(document.getElementById('os-cont-pb-atu')?.value);
  const atualCor=txt(document.getElementById('os-cont-cor-atu')?.value);
  const payload={empresaId:s.empresaId,numero:txt(document.getElementById('os-num')?.value)||proximoNumero(db.os||[],s.empresaId),clienteId:txt(document.getElementById('os-cli')?.value),equipamentoId:txt(document.getElementById('os-eq')?.value)||null,contratoId:null,dataAbertura:new Date(`${document.getElementById('os-data')?.value||new Date().toISOString().slice(0,10)}T12:00:00`).toISOString(),prioridade:txt(document.getElementById('os-prio')?.value)||'normal',tecnico:txt(document.getElementById('os-tec')?.value),status:faturar?'concluido':(txt(document.getElementById('os-status')?.value)||'aberto'),modelo:txt(document.getElementById('os-modelo')?.value),patrimonio:txt(document.getElementById('os-patr')?.value),serie:txt(document.getElementById('os-serial')?.value),local:txt(document.getElementById('os-local')?.value),contadorPretoAnterior:n(document.getElementById('os-cont-pb-ant')?.value),contadorPretoAtual:atualPB===''?'':n(atualPB),quantidadePreto:contadorQtd(document.getElementById('os-cont-pb-ant')?.value,atualPB),contadorColorAnterior:n(document.getElementById('os-cont-cor-ant')?.value),contadorColorAtual:atualCor===''?'':n(atualCor),quantidadeColor:contadorQtd(document.getElementById('os-cont-cor-ant')?.value,atualCor),descricao:txt(document.getElementById('os-desc')?.value),servicoExecutado:txt(document.getElementById('os-serv')?.value),servicos:txt(document.getElementById('os-serv')?.value),itens:window.__osItensTemp||[],faturado:!!faturar};
  if(!payload.clienteId) return aviso('Informe o cliente','error');
  if(!payload.descricao) return aviso('Informe o motivo do chamado','error');
  if(faturar){ const faltas=validarChamadoParaFaturar(payload); if(faltas.length) return aviso('Para faturar, falta: '+faltas.join(', '),'error'); payload.dataFechamento=new Date().toISOString(); }
  let o;
  if(id){ o=(db.os||[]).find(x=>x.id===id); if(!o) return aviso('Chamado não encontrado','error'); Object.assign(o,payload,{atualizadoEm:new Date().toISOString(),atualizadoPorNome:s.usuarioNome}); logar('os','editar',o.id,`Chamado ${o.numero} salvo por ${s.usuarioNome}`); }
  else { o={id:uidSafe('os'),criadoEm:new Date().toISOString(),criadoPor:s.usuarioId,criadoPorNome:s.usuarioNome,...payload}; db.os=db.os||[]; db.os.push(o); logar('os','criar',o.id,`Chamado ${o.numero} criado por ${s.usuarioNome}`); }
  if(faturar) gerarNotinhaDoChamado(o);
  salvar(); closeModal(); renderOs(); aviso(faturar?'Chamado faturado':'Chamado salvo','success');
};
function gerarNotinhaDoChamado(o){
  if(!o||!(o.itens||[]).length) return null;
  const s=sess(); if(!s) return null;
  let v=(db.vendas||[]).find(x=>x.chamadoId===o.id);
  const itens=(o.itens||[]).map(it=>{ const p=eqProduto(it.produtoId)||{}; const qtd=Math.max(1,n(it.qtd,1)); const preco=n(it.preco,p.preco||0); return {produtoId:it.produtoId,descricao:p.nome||it.nome||'Item do chamado',qtd,preco,desconto:0,subtotal:preco*qtd,tipo:p.categoria||'Produto'}; });
  const total=itens.reduce((sum,it)=>sum+n(it.subtotal,0),0);
  const dados={empresaId:s.empresaId,numero:v?v.numero:proximoNumero(db.vendas||[],s.empresaId),clienteId:o.clienteId,data:new Date().toISOString(),itens,desconto:0,total,formaPagamento:'Chamado / sem financeiro automático',status:'faturado',origem:'chamado',chamadoId:o.id,observacao:`Notinha relacionada ao chamado ${o.numero}. Não gera financeiro automático do chamado.`,criadoPor:s.usuarioId,criadoPorNome:s.usuarioNome};
  if(v) Object.assign(v,dados); else { v={id:uidSafe('vda'),criadoEm:new Date().toISOString(),...dados}; db.vendas=db.vendas||[]; db.vendas.push(v); }
  o.vendaId=v.id;
  return v;
}

function htmlBaseChamado(o,tipo){ const s=sess(); const c=cli(o.clienteId)||{}; const emp=empresaCompleta(db,s||{}); const titulo=tipo==='tecnico'?'ORDEM PARA TÉCNICO':'CHAMADO FINALIZADO'; return {s,c,emp,titulo,css:`@page{size:A4;margin:10mm}body{font-family:Arial,sans-serif;font-size:11px;color:#111}.cab{display:flex;justify-content:space-between;border-bottom:2px solid #0a1e8a;padding-bottom:8px}.emp b{font-size:15px}.muted{color:#555;font-size:9px}.box{border:1px solid #ccc;border-radius:8px;padding:8px;margin-top:8px}.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}.lbl{font-size:8px;text-transform:uppercase;color:#666;font-weight:bold}.linha{height:52px;border:1px dashed #999;border-radius:6px;margin-top:4px}.ass{margin-top:42px;border-top:1px solid #111;text-align:center;padding-top:4px;width:42%}.flex{display:flex;justify-content:space-between;gap:20px}.no-print{text-align:center;margin:10px}.no-print button{padding:10px 18px;border:0;border-radius:8px;background:#0a1e8a;color:#fff;font-weight:bold}@media print{.no-print{display:none}}`}; }
window.imprimirChamadoTecnicoV53=function(id){ const o=(db.os||[]).find(x=>x.id===id); if(!o) return aviso('Chamado não encontrado','error'); const b=htmlBaseChamado(o,'tecnico'); const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Chamado técnico ${esc(o.numero)}</title><style>${b.css}</style></head><body><div class="no-print"><button onclick="window.print()">Imprimir</button></div><div class="cab"><div class="emp"><b>${esc(b.emp.fantasia)}</b><div class="muted">${esc(b.emp.razao)} • ${esc(b.emp.cnpj)}</div><div class="muted">${esc(b.emp.endereco)}</div><div class="muted">WhatsApp: ${esc(b.emp.whatsapp)}</div></div><div><b>${b.titulo}</b><br>Nº ${esc(o.numero)}<br>${dataBR(o.dataAbertura)}</div></div><div class="box"><b>Cliente:</b> ${esc(b.c.nome||'')} • ${esc(b.c.telefone||'')}<br><b>Impressora:</b> ${esc(o.modelo||'')} • Patr. ${esc(o.patrimonio||'')} • Serial ${esc(o.serie||'')}<br><b>Motivo:</b> ${esc(o.descricao||'')}</div><div class="box grid"><div><div class="lbl">Serviço executado</div><div class="linha"></div></div><div><div class="lbl">Data atendimento</div><div class="linha"></div></div><div><div class="lbl">Produto/peça e quantidade</div><div class="linha"></div></div><div><div class="lbl">Contador preto atual</div><div class="linha"></div></div><div><div class="lbl">Contador color atual</div><div class="linha"></div></div><div><div class="lbl">Observações</div><div class="linha"></div></div></div><div class="flex"><div class="ass">Assinatura do técnico</div><div class="ass">Assinatura do cliente</div></div><script>setTimeout(()=>window.print(),250)<\/script></body></html>`; const w=window.open('','_blank'); if(w){w.document.write(html);w.document.close();} };
window.imprimirChamadoFinalV53=function(id){ const o=(db.os||[]).find(x=>x.id===id); if(!o) return aviso('Chamado não encontrado','error'); if(!o.faturado&&o.status!=='concluido') return aviso('Fature/conclua o chamado antes de imprimir o final','error'); const b=htmlBaseChamado(o,'final'); const itens=(o.itens||[]).map(it=>`<tr><td>${esc((eqProduto(it.produtoId)||{}).nome||it.nome||'Item')}</td><td>${it.qtd}</td></tr>`).join('')||'<tr><td colspan="2">Sem itens</td></tr>'; const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Chamado final ${esc(o.numero)}</title><style>${b.css}table{width:100%;border-collapse:collapse;margin-top:8px}td,th{border:1px solid #ddd;padding:6px}</style></head><body><div class="no-print"><button onclick="window.print()">Imprimir</button></div><div class="cab"><div class="emp"><b>${esc(b.emp.fantasia)}</b><div class="muted">${esc(b.emp.razao)} • ${esc(b.emp.cnpj)}</div><div class="muted">${esc(b.emp.endereco)}</div><div class="muted">WhatsApp: ${esc(b.emp.whatsapp)}</div></div><div><b>${b.titulo}</b><br>Nº ${esc(o.numero)}<br>${dataBR(o.dataAbertura)}</div></div><div class="box"><b>Cliente:</b> ${esc(b.c.nome||'')} • ${esc(b.c.telefone||'')}<br><b>Impressora:</b> ${esc(o.modelo||'')} • Patr. ${esc(o.patrimonio||'')} • Serial ${esc(o.serie||'')}<br><b>Motivo:</b> ${esc(o.descricao||'')}<br><b>Serviço executado:</b> ${esc(o.servicoExecutado||o.servicos||'')}</div><div class="box grid"><div><span class="lbl">Preto anterior</span><br><b>${esc(o.contadorPretoAnterior||0)}</b></div><div><span class="lbl">Preto atual</span><br><b>${esc(o.contadorPretoAtual||'')}</b></div><div><span class="lbl">Usado preto</span><br><b>${esc(o.quantidadePreto||0)}</b></div><div><span class="lbl">Color anterior</span><br><b>${esc(o.contadorColorAnterior||0)}</b></div><div><span class="lbl">Color atual</span><br><b>${esc(o.contadorColorAtual||'')}</b></div><div><span class="lbl">Usado color</span><br><b>${esc(o.quantidadeColor||0)}</b></div></div><table><thead><tr><th>Produto/peça</th><th>Qtd</th></tr></thead><tbody>${itens}</tbody></table><div class="flex"><div class="ass">Assinatura do técnico</div><div class="ass">Assinatura do cliente</div></div><script>setTimeout(()=>window.print(),250)<\/script></body></html>`; const w=window.open('','_blank'); if(w){w.document.write(html);w.document.close();} };
window.abrirNotinhaChamadoV53=function(id){ const o=(db.os||[]).find(x=>x.id===id); if(!o||!o.vendaId) return aviso('Este chamado ainda não tem notinha relacionada','info'); if(typeof historicoVenda==='function') historicoVenda(o.vendaId); };

const oldOpenModal=window.openModal;
window.openModal=function(type,id){ if(type==='os') return renderModalChamado(id); return oldOpenModal?oldOpenModal.apply(this,arguments):undefined; };
window.renderOs=function(){ const s=sess(); if(!s) return; const view=document.getElementById('view-manutencao')||document.getElementById('view-os'); if(!view) return; const q=low(window.__osBuscaV53||''); const st=window.__osStatusV53||''; let list=(db.os||[]).filter(o=>o.empresaId===s.empresaId); if(q) list=list.filter(o=>[o.numero,(cli(o.clienteId)||{}).nome,o.modelo,o.patrimonio,o.serie,o.descricao,o.servicoExecutado,o.servicos].some(v=>low(v).includes(q))); if(st) list=list.filter(o=>(o.status||'')===st); list.sort((a,b)=>new Date(b.dataAbertura||b.criadoEm||0)-new Date(a.dataAbertura||a.criadoEm||0)); view.innerHTML=`<div class="space-y-4"><div class="flex flex-wrap justify-between gap-3"><div><h3 class="font-bold text-[18px]">Chamados / histórico geral</h3><p class="text-[12px] text-slate-500">Mostra chamados avulsos e chamados de contrato. Duplo clique abre o chamado.</p></div><div class="flex flex-wrap gap-2"><button onclick="openModal('os')" class="neo-btn primary"><i class="ph ph-plus"></i>Abrir chamado</button><button onclick="gerarExemplosTesteFluxoV53()" class="neo-btn"><i class="ph ph-flask"></i>Exemplos teste</button></div></div><div class="rounded-[16px] bg-white border p-3 flex flex-wrap gap-2"><input id="os-busca-v53" value="${esc(window.__osBuscaV53||'')}" onkeydown="if(event.key==='Enter'){window.__osBuscaV53=this.value;renderOs()}" placeholder="Buscar por cliente, modelo, serial, patrimônio, motivo..." class="neo-input flex-1 min-w-[260px]"><button onclick="window.__osBuscaV53=document.getElementById('os-busca-v53').value;renderOs()" class="neo-btn"><i class="ph ph-magnifying-glass"></i></button><select onchange="window.__osStatusV53=this.value;renderOs()" class="neo-select"><option value="">Todos status</option>${['aberto','em_atendimento','aguardando_peca','concluido'].map(x=>`<option value="${x}" ${st===x?'selected':''}>${x.replace('_',' ')}</option>`).join('')}</select></div><div class="rounded-[16px] bg-white border overflow-auto"><table class="neo-table"><thead><tr><th>Código</th><th>Cliente</th><th>Impressora</th><th>Motivo / Serviço</th><th>Contadores</th><th>Status</th><th>Ações</th></tr></thead><tbody>${list.map(o=>{ const c=cli(o.clienteId)||{}; return `<tr ondblclick="openModal('os','${o.id}')" class="cursor-pointer hover:bg-slate-50"><td><b class="text-[#0a1e8a]">${esc(o.numero||'')}</b><br><span class="text-[11px] text-slate-500">${o.contratoId?'Contrato':'Avulso'}</span></td><td><b>${esc(c.nome||'')}</b><br><span class="text-[11px] text-slate-500">${esc(c.telefone||'')}</span></td><td>${esc(o.modelo||'')}<br><span class="text-[11px] text-slate-500">Patr. ${esc(o.patrimonio||'-')} • Serial ${esc(o.serie||'-')}</span></td><td><b>${esc(o.descricao||'')}</b><br><span class="text-[11px] text-slate-500">${esc(o.servicoExecutado||o.servicos||'')}</span></td><td>PB: ${esc(o.contadorPretoAtual||o.contadorAtual||'—')}<br>Color: ${esc(o.contadorColorAtual||'—')}</td><td><span class="neo-status ${o.faturado||o.status==='concluido'?'ok':'wait'}">${esc(o.faturado?'faturado':(o.status||'aberto'))}</span></td><td class="whitespace-nowrap"><button onclick="openModal('os','${o.id}')" class="neo-btn !px-2"><i class="ph ph-eye"></i></button><button onclick="imprimirChamadoTecnicoV53('${o.id}')" class="neo-btn !px-2" title="Modelo técnico"><i class="ph ph-file-text"></i></button>${o.faturado?`<button onclick="imprimirChamadoFinalV53('${o.id}')" class="neo-btn !px-2" title="Final"><i class="ph ph-printer"></i></button>`:''}${o.vendaId?`<button onclick="abrirNotinhaChamadoV53('${o.id}')" class="neo-btn !px-2" title="Notinha"><i class="ph ph-receipt"></i></button>`:''}</td></tr>`;}).join('')||'<tr><td colspan="7" class="text-center text-slate-400 py-10">Nenhum chamado. Clique em Exemplos teste para criar dados de conferência.</td></tr>'}</tbody></table></div></div>`; };

window.gerarExemplosTesteFluxoV53=function(){ const s=sess(); if(!s) return; db.clientes=db.clientes||[]; db.equipamentos=db.equipamentos||[]; db.parque=db.parque||[]; db.produtos=db.produtos||[]; db.os=db.os||[]; let c=db.clientes.find(x=>x.empresaId===s.empresaId&&x.exemploTesteFluxo); if(!c){ c={id:uidSafe('cli'),empresaId:s.empresaId,codigo:proximoNumero(db.clientes,s.empresaId),nome:'Cliente Exemplo Teste',fantasia:'Exemplo Teste',telefone:'(38) 99999-0000',endereco:'Rua Exemplo, 100 - Centro',cidade:'Jaíba',estado:'MG',status:'ativo',exemploTesteFluxo:true,criadoEm:new Date().toISOString()}; db.clientes.push(c); } let e=db.equipamentos.find(x=>x.empresaId===s.empresaId&&x.exemploTesteFluxo); if(!e){ e={id:uidSafe('eq'),empresaId:s.empresaId,modelo:'Impressora Exemplo Color',patrimonio:'1001',serie:'EXEMPLO123',contadorPB:1200,contadorCor:300,status:'disponivel',exemploTesteFluxo:true}; db.equipamentos.push(e); db.parque.push({id:uidSafe('parq'),empresaId:s.empresaId,clienteId:c.id,equipamentoId:e.id,status:'ativo',setor:'Recepção',localInstalacao:'Balcão',exemploTesteFluxo:true}); } let p=db.produtos.find(x=>x.empresaId===s.empresaId&&x.exemploTesteFluxo); if(!p){ p={id:uidSafe('prd'),empresaId:s.empresaId,sku:'1',nome:'Peça Exemplo para Chamado',categoria:'Peça',estoque:10,estoqueMin:1,custo:10,preco:50,status:'ativo',exemploTesteFluxo:true}; db.produtos.push(p); } const ja=db.os.find(x=>x.empresaId===s.empresaId&&x.exemploTesteFluxo); if(!ja){ db.os.push({id:uidSafe('os'),empresaId:s.empresaId,numero:proximoNumero(db.os,s.empresaId),clienteId:c.id,equipamentoId:e.id,dataAbertura:new Date().toISOString(),prioridade:'normal',tecnico:s.usuarioNome,status:'aberto',modelo:e.modelo,patrimonio:e.patrimonio,serie:e.serie,local:'Recepção',contadorPretoAnterior:1200,contadorColorAnterior:300,descricao:'Atolamento de papel para teste',servicoExecutado:'',itens:[{produtoId:p.id,nome:p.nome,qtd:1,preco:p.preco,subtotal:p.preco}],exemploTesteFluxo:true,criadoEm:new Date().toISOString(),criadoPorNome:s.usuarioNome}); } salvar(); renderOs(); aviso('Exemplos criados para teste','success'); };

setTimeout(()=>{ if((document.getElementById('view-manutencao')||{}).offsetParent!==null) try{ renderOs(); }catch(e){} },1200);
console.log('[DIGICOPY] vendas_chamados_reparo_patch.js v4.9.53 carregado');
})();
