// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.50 — Exemplos das tabelas no alinhamento do banco antigo
// • Mostra uma amostra segura de cada tabela para facilitar a conferência
// • Botão "Ver exemplos" abre primeiros registros com documentos/senhas mascarados
// • Relatório TXT passa a incluir exemplos resumidos das tabelas
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function up(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
function esc(v){
  const s=txt(v);
  if(typeof escapeHtml==='function') return escapeHtml(s);
  return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function modulos(dbRef){ return ((dbRef||{}).modulosDinamicos)||{}; }
function colunasModulo(mod){
  return (mod&&Array.isArray(mod.colunas)&&mod.colunas.length?mod.colunas:(mod&&Array.isArray(mod.dados)&&mod.dados[0]?Object.keys(mod.dados[0]):[])).map(c=>String(c));
}
function trunc(v,max){ const s=txt(v).replace(/\s+/g,' '); return s.length>max?s.slice(0,Math.max(0,max-3))+'...':s; }
function apenasDigitos(v){ return txt(v).replace(/\D+/g,''); }
function mascararDocumento(v){
  const d=apenasDigitos(v);
  if(d.length>=14) return d.slice(0,2)+'.***.***/****-'+d.slice(-2);
  if(d.length>=11) return d.slice(0,3)+'.***.***-'+d.slice(-2);
  if(d.length>=5) return d.slice(0,2)+'***'+d.slice(-2);
  return trunc(v,24);
}
function mascararTelefone(v){
  const d=apenasDigitos(v);
  if(d.length>=8) return '('+d.slice(0,2)+') *****-'+d.slice(-4);
  return trunc(v,24);
}
function mascararEmail(v){
  const s=txt(v); const p=s.split('@');
  if(p.length<2) return trunc(s,34);
  return (p[0].slice(0,2)||'**')+'***@'+p.slice(1).join('@');
}
function valorExemplo(campo,valor){
  if(valor===null||valor===undefined) return '';
  let s=txt(valor);
  if(!s) return '';
  const k=up(campo);
  if(/SENHA|PASSWORD|TOKEN|SECRET|CHAVE_ACESSO|CHAVEAPI|API_KEY/.test(k)) return '***';
  if(/CPF|CNPJ|DOCUMENTO|RG|INSCR|INSC|IE\b/.test(k)) return mascararDocumento(s);
  if(/EMAIL|E_MAIL|MAIL/.test(k)) return mascararEmail(s);
  if(/FONE|TELEF|CELULAR|WHATS|CONTATO/.test(k)) return mascararTelefone(s);
  return trunc(s,42);
}
function amostraTabela(dbRef,nome,maxLinhas,maxCampos){
  const mod=modulos(dbRef)[nome]||{};
  const dados=Array.isArray(mod.dados)?mod.dados:[];
  const colunas=colunasModulo(mod);
  const exemplos=[];
  const limiteLinhas=Number(maxLinhas)||2;
  const limiteCampos=Number(maxCampos)||6;
  for(const row of dados.slice(0,30)){
    const partes=[];
    for(const campo of colunas){
      if(partes.length>=limiteCampos) break;
      const valor=valorExemplo(campo,row&&row[campo]);
      if(valor) partes.push(`${campo}=${valor}`);
    }
    if(partes.length) exemplos.push(partes.join(' | '));
    if(exemplos.length>=limiteLinhas) break;
  }
  return {tabela:nome,registros:dados.length,colunas,exemplos};
}
function resumoExemplo(dbRef,nome){
  const a=amostraTabela(dbRef,nome,1,4);
  return a.exemplos[0]||'Sem exemplo com valor preenchido.';
}
function tabelasOrdenadas(dbRef){
  const A=window.ALINHAMENTO_BANCO_PURE||{};
  if(typeof A.analisarBanco==='function'){
    try{ return (A.analisarBanco(dbRef).tabelas||[]).map(t=>t.tabela); }catch(e){ /* segue fallback */ }
  }
  return Object.keys(modulos(dbRef)).sort((a,b)=>a.localeCompare(b));
}
function relatorioComExemplos(dbRef){
  const A=window.ALINHAMENTO_BANCO_PURE||{};
  const linhas=[];
  if(typeof A.relatorioAlinhamento==='function'){
    try{ linhas.push(A.relatorioAlinhamento(dbRef)); }catch(e){ linhas.push('RELATÓRIO DE ALINHAMENTO DO BANCO ANTIGO'); }
  }else{
    linhas.push('RELATÓRIO DE ALINHAMENTO DO BANCO ANTIGO');
    linhas.push('Gerado em: '+new Date().toLocaleString('pt-BR'));
  }
  linhas.push('');
  linhas.push('## Exemplos seguros das tabelas');
  linhas.push('Obs.: exemplos usam os primeiros registros encontrados. Documentos, telefones, e-mails e senhas são mascarados quando possível.');
  tabelasOrdenadas(dbRef).forEach(nome=>{
    const a=amostraTabela(dbRef,nome,2,7);
    linhas.push(`- ${nome}: ${a.registros} registro(s), ${a.colunas.length} coluna(s)`);
    if(!a.exemplos.length){ linhas.push('  exemplo: sem valor preenchido nos primeiros registros.'); return; }
    a.exemplos.forEach((ex,i)=>linhas.push(`  exemplo ${i+1}: ${ex}`));
  });
  return linhas.join('\n');
}
function baixarRelatorioComExemplos(){
  const blob=new Blob([relatorioComExemplos(db)],{type:'text/plain;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='relatorio_alinhamento_banco_antigo.txt';
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },500);
  if(typeof toast==='function') toast('Relatório com exemplos gerado','success');
}
function htmlExemplo(nome){
  const resumo=resumoExemplo(db,nome);
  return `<div class="max-w-[270px] leading-snug"><div class="text-[10px] text-slate-600 font-mono break-words">${esc(resumo)}</div><button type="button" class="alin-ver-exemplos mt-1 h-7 px-2 rounded-lg border bg-white text-[11px] font-semibold hover:bg-slate-50" data-tabela="${esc(nome)}">Ver exemplos</button></div>`;
}
function aplicarColunaExemplos(){
  const card=document.getElementById('alinhamento-banco-card');
  if(!card) return false;
  const tabela=card.querySelector('table');
  if(!tabela) return false;
  const cab=tabela.querySelector('thead tr');
  const primeiroTh=cab&&cab.children&&cab.children[0];
  if(primeiroTh&&!cab.querySelector('.alin-col-exemplos')) primeiroTh.insertAdjacentHTML('afterend','<th class="alin-col-exemplos px-2 py-2">Exemplo</th>');
  tabela.querySelectorAll('tbody tr').forEach(tr=>{
    if(tr.querySelector('.alin-cell-exemplos')) return;
    const sel=tr.querySelector('select[data-alin-tab]');
    if(!sel){ const vazio=tr.querySelector('td[colspan]'); if(vazio) vazio.setAttribute('colspan','8'); return; }
    const primeira=tr.children&&tr.children[0];
    if(!primeira) return;
    primeira.insertAdjacentHTML('afterend',`<td class="alin-cell-exemplos px-2 py-2 align-top">${htmlExemplo(sel.getAttribute('data-alin-tab'))}</td>`);
  });
  if(!card.querySelector('#alinhamento-exemplos-aviso')){
    const aviso=document.createElement('div');
    aviso.id='alinhamento-exemplos-aviso';
    aviso.className='mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-[12px] text-blue-900';
    aviso.innerHTML='<b>Exemplos adicionados:</b> use a coluna <b>Exemplo</b> para reconhecer a tabela antes de marcar se ela está errada. Os dados sensíveis são reduzidos/mascarados no relatório.';
    const alvo=card.querySelector('.rounded-xl.border.overflow-auto')||card;
    alvo.insertAdjacentElement('beforebegin',aviso);
  }
  return true;
}
function abrirModalExemplos(nome){
  const info=amostraTabela(db,nome,3,10);
  const campos=info.colunas.slice(0,30).join(', ')+(info.colunas.length>30?' ...':'');
  const exemplos=info.exemplos.length?info.exemplos.map((ex,i)=>`<div class="rounded-xl border bg-slate-50 p-3"><div class="text-[11px] font-bold text-slate-500 mb-1">Exemplo ${i+1}</div><div class="font-mono text-[12px] whitespace-pre-wrap break-words">${esc(ex)}</div></div>`).join(''):'<div class="rounded-xl border bg-slate-50 p-3 text-slate-500">Sem registro preenchido para exemplo.</div>';
  const root=document.getElementById('modal-root');
  const title=document.getElementById('modal-title');
  const body=document.getElementById('modal-body');
  const footer=document.getElementById('modal-footer');
  if(root&&title&&body&&footer){
    title.innerText='Exemplos da tabela '+nome;
    body.innerHTML=`<div class="space-y-4"><div class="rounded-xl bg-blue-50 border border-blue-100 p-3 text-[12px] text-blue-900">Estes são só exemplos dos primeiros registros para ajudar você a identificar se a tabela é de cliente, contrato, leitura, venda, estoque etc. Dados sensíveis são mascarados quando possível.</div><div class="grid grid-cols-2 gap-3"><div class="neo-card"><p class="neo-label">Registros</p><div class="neo-total">${info.registros}</div></div><div class="neo-card"><p class="neo-label">Colunas</p><div class="neo-total">${info.colunas.length}</div></div></div><div><div class="text-[11px] font-bold text-slate-500 uppercase mb-1">Campos encontrados</div><div class="text-[12px] text-slate-700 break-words">${esc(campos||'Nenhum campo encontrado')}</div></div><div class="space-y-2">${exemplos}</div></div>`;
    footer.innerHTML='<button onclick="closeModal()" class="h-10 px-5 rounded-xl bg-slate-900 text-white font-semibold text-[13px]">Fechar</button>';
    root.classList.remove('hidden');
  }else{
    alert('Exemplos da tabela '+nome+'\n\n'+(info.exemplos.join('\n\n')||'Sem exemplo.'));
  }
}

window.ALINHAMENTO_EXEMPLOS_PURE={valorExemplo,amostraTabela,resumoExemplo,relatorioComExemplos};
window.baixarRelatorioAlinhamentoBanco=baixarRelatorioComExemplos;
window.alinhamentoVerExemplos=abrirModalExemplos;

if(typeof document==='undefined') return;

document.addEventListener('click',function(ev){
  const btn=ev.target&&ev.target.closest?ev.target.closest('.alin-ver-exemplos'):null;
  if(btn){ ev.preventDefault(); abrirModalExemplos(btn.getAttribute('data-tabela')||''); }
});
const oldRenderConfig=window.renderConfig;
if(typeof oldRenderConfig==='function'&&!oldRenderConfig.__alinhamentoExemplos){
  const wrapped=function(){ const r=oldRenderConfig.apply(this,arguments); setTimeout(aplicarColunaExemplos,160); return r; };
  wrapped.__alinhamentoExemplos=true;
  window.renderConfig=wrapped;
}
let tentativas=0;
(function tentar(){ tentativas+=1; const ok=aplicarColunaExemplos(); if(!ok&&tentativas<12) setTimeout(tentar,500); })();
console.log('[DIGICOPY] alinhamento_banco_exemplos_patch.js v4.9.50 carregado');
})();
