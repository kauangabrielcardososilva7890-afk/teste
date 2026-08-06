// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.18 — Diagnóstico das tabelas migradas
// • Gera um relatório pequeno com tabelas, colunas e amostras úteis
// • Serve para analisar 174 JSONs sem mandar arquivo por arquivo no chat
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function keys(row){ return Object.keys(row || {}).sort(); }
function norm(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
function relevante(nome){ return /CLIENT|PESSOA|LOCAC|LOCAÇ|CONTRAT|ITENS_LOC|ITEM.*LOC|EQUIP|IMPRESS|MAQUINA|MÁQUINA|PATRIM|SERIAL|LEIT|CONTADOR|CHAMADO|VISITA/i.test(nome); }
function amostra(row){
  const campos = keys(row).filter(k => /COD|ID|CLIENT|NOME|RAZAO|FANTAS|LOC|CONTRAT|EQUIP|IMPRESS|MAQUINA|PATR|SERIE|SERIAL|MODELO|DESCR|DATA|VALOR|FRANQ|CONT|DEP|SETOR|LOCAL/i.test(k));
  const out = {};
  campos.slice(0, 40).forEach(k => out[k] = row[k]);
  return out;
}
function diagnosticoMigracao(dbRef){
  const mod = (dbRef && dbRef.modulosDinamicos) || {};
  const linhas = [];
  linhas.push('DIAGNÓSTICO DAS TABELAS MIGRADAS');
  linhas.push('Gerado em: ' + new Date().toLocaleString('pt-BR'));
  linhas.push('Total de tabelas: ' + Object.keys(mod).length);
  linhas.push('');
  linhas.push('DADOS JÁ CONVERTIDOS NO ERP:');
  ['clientes','contratos','equipamentos','parque','leituras','os'].forEach(nome => {
    const arr = (dbRef && dbRef[nome]) || [];
    linhas.push('- ' + nome + ': ' + arr.length + ' registros');
    if(arr[0]) linhas.push('  colunas: ' + keys(arr[0]).join(', '));
    if(arr[0]) linhas.push('  amostra 1: ' + JSON.stringify(arr[0], null, 2));
    if(arr[1]) linhas.push('  amostra 2: ' + JSON.stringify(arr[1], null, 2));
  });
  linhas.push('');
  Object.entries(mod).sort((a,b)=>a[0].localeCompare(b[0],'pt-BR')).forEach(([nome, m]) => {
    const dados = (m && m.dados) || [];
    if(!relevante(nome) && dados.length < 1) return;
    const first = dados[0] || {};
    linhas.push('='.repeat(80));
    linhas.push('TABELA: ' + nome);
    linhas.push('REGISTROS: ' + dados.length);
    linhas.push('COLUNAS: ' + keys(first).join(', '));
    linhas.push('AMOSTRA 1: ' + JSON.stringify(amostra(first), null, 2));
    if(dados[1]) linhas.push('AMOSTRA 2: ' + JSON.stringify(amostra(dados[1]), null, 2));
    linhas.push('');
  });
  linhas.push('RESUMO DE TABELAS MAIS IMPORTANTES:');
  Object.entries(mod).filter(([nome]) => relevante(nome)).forEach(([nome,m]) => linhas.push('- ' + nome + ': ' + (((m||{}).dados||[]).length) + ' registros'));
  return linhas.join('\n');
}

window.DIAGNOSTICO_MIGRACAO_PURE = { diagnosticoMigracao };

if(typeof window === 'undefined' || typeof document === 'undefined') return;

function abrirDiagnostico(){
  const texto = diagnosticoMigracao(db || {});
  const box = document.getElementById('modal-box');
  if(box) box.className = 'w-full max-w-[980px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[94vh] flex flex-col';
  document.getElementById('modal-title').innerText = 'Diagnóstico das tabelas migradas';
  document.getElementById('modal-body').innerHTML = `<div class="space-y-3"><p class="text-[12px] text-slate-600">Copie este texto e mande no chat se ainda precisar mapear vínculo de cliente/contrato/impressora.</p><textarea id="diag-migracao-text" class="w-full h-[520px] p-3 rounded-xl border font-mono text-[11px]">${texto.replace(/[&<>]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]))}</textarea></div>`;
  document.getElementById('modal-footer').innerHTML = `<button onclick="copiarDiagnosticoMigracao()" class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white font-bold">Copiar diagnóstico</button><button onclick="baixarDiagnosticoMigracao()" class="h-10 px-4 rounded-xl bg-white border font-bold">Baixar TXT</button><button onclick="closeModal()" class="h-10 px-5 rounded-xl bg-white border font-bold">Fechar</button>`;
  document.getElementById('modal-root').classList.remove('hidden');
}
window.abrirDiagnosticoMigracao = abrirDiagnostico;
window.copiarDiagnosticoMigracao = function(){
  const el = document.getElementById('diag-migracao-text');
  if(!el) return;
  el.select();
  const done = () => typeof toast === 'function' && toast('Diagnóstico copiado', 'success');
  if(navigator.clipboard) navigator.clipboard.writeText(el.value).then(done).catch(() => { document.execCommand('copy'); done(); });
  else { document.execCommand('copy'); done(); }
};
window.baixarDiagnosticoMigracao = function(){
  const texto = document.getElementById('diag-migracao-text')?.value || diagnosticoMigracao(db || {});
  const blob = new Blob([texto], {type:'text/plain;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'diagnostico-tabelas-migradas.txt';
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
};

function inserirBotoes(){
  const banco = document.getElementById('view-banco');
  if(banco && !document.getElementById('btn-diag-migracao')){
    banco.insertAdjacentHTML('afterbegin', `<div class="rounded-xl border bg-amber-50 border-amber-200 p-3 flex flex-wrap items-center justify-between gap-2"><div><b class="text-amber-900">Diagnóstico das tabelas migradas</b><p class="text-[12px] text-amber-800">Gera lista de tabelas, colunas e amostras para corrigir vínculos sem enviar 174 arquivos.</p></div><button id="btn-diag-migracao" onclick="abrirDiagnosticoMigracao()" class="h-10 px-4 rounded-xl bg-amber-600 text-white font-bold">Gerar diagnóstico</button></div>`);
  }
}
const oldRenderBanco = window.renderBanco;
window.renderBanco = function(){
  if(oldRenderBanco) oldRenderBanco.apply(this, arguments);
  setTimeout(inserirBotoes, 60);
};
setTimeout(inserirBotoes, 500);
console.log('[DIGICOPY] diagnostico_migracao_patch.js v4.9.18 carregado');
})();
