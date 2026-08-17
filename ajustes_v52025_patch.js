// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.20.25 — "Teste da nuvem" de volta (diagnóstico do sync sob demanda)
// • O sync só falha EM SILÊNCIO (o diagnóstico antigo foi removido na v5.20.15).
//   Este patch recoloca o teste passo a passo (config → login anônimo → gravar
//   → ler) mostrando o ERRO EXATO do Firebase (permissão, cota, auth...).
// • Botão "Teste nuvem" na barra superior visível do sistema. Só gasta cota quando CLICADO (não roda automático).
// • O doc de teste (__diag_ping) é apagado da nuvem logo depois e removido do
//   banco local — não polui o backup.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

/* ---------------- LÓGICA PURA (testável em node) ---------------- */

// Traduz o erro do Firebase pra uma instrução em português.
function traduzirErroSync(e){
  const s = String((e && (e.message||e.code||e.status)) || e || '');
  const blob = s + ' ' + String((e && e.body) ? JSON.stringify(e.body) : '');
  if(/PERMISSION_DENIED|403|Missing or insufficient permissions/i.test(blob))
    return 'REGRAS do Firestore bloqueando. No console do Firebase → Firestore → Regras: publique as regras abaixo e clique em Publicar.';
  if(/429|RESOURCE_EXHAUSTED|Quota exceeded/i.test(blob))
    return 'COTA GRÁTIS do Firebase estourada (50 mil leituras + 20 mil escritas por dia). Ela volta sozinha ~4h da manhã. Hoje evite abrir o sistema em muitos aparelhos ao mesmo tempo.';
  if(/UNAUTHENTICATED|401|invalid.*key|api.*key/i.test(blob))
    return 'Login anônimo desligado ou chave inválida: Firebase → Authentication → Sign-in method → ative "Anônimo".';
  if(/Failed to fetch|NetworkError|Load failed|network/i.test(blob))
    return 'SEM INTERNET ou o endereço do Firebase está bloqueado (antivírus/firewall/proxy).';
  return 'Erro: ' + s.slice(0, 200);
}

function textoRegrasFirebase(){
  return 'rules_version = \'2\';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if request.auth != null;\n    }\n  }\n}';
}

window.AJUSTES_V52025_PURE = { traduzirErroSync, textoRegrasFirebase };

if(typeof document === 'undefined') return; // modo teste (node)

// Limpa qualquer resto de doc de teste anterior do banco local (não vai pro backup).
function limparDiagLocal(){ try{ if(typeof db !== 'undefined' && db && db.diagnostico){ delete db.diagnostico; } }catch(e){} }

/* ---------------- Diagnóstico passo a passo ---------------- */
window.__syncDiagnostico = async function(){
  limparDiagLocal();
  const L = [];
  const R = window.__syncRtInternals;
  if(!R){
    L.push('✘ Motor do sync NÃO carregou (__syncRtInternals ausente).');
    L.push('O arquivo sync_realtime_patch.js não rodou nesta página — cache velho ou script bloqueado. Recarregue com Ctrl+F5 usando o link novo.');
    return L.join('\n');
  }
  // 1. Config
  const cfg = window.FIREBASE_CONFIG || {};
  const temCfg = !!(cfg.apiKey && cfg.projectId);
  L.push((temCfg?'✔':'✘') + ' 1. Config do Firebase' + (temCfg ? ' OK ('+cfg.projectId+')' : ' FALTANDO'));
  if(!temCfg) return L.join('\n');
  // 2. Login anônimo
  let primeiroErro = null;
  try{
    const tk = await R.authToken();
    if(!tk) throw { message:'sem token' };
    L.push('✔ 2. Login anônimo OK');
  }catch(e){ primeiroErro = primeiroErro || e; L.push('✘ 2. Login anônimo FALHOU — ' + (e && (e.message||e.code) || e)); }
  // 3. Gravar doc de teste (e apagar em seguida)
  if(!primeiroErro){
    try{
      const ts = await R.rtWrite('__diag_ping', 'diagnostico', { ping: new Date().toISOString() }, false);
      L.push('✔ 3. Gravar na nuvem OK' + (ts ? ' (servidor: '+ts+')' : ''));
      try{ await R.rtWrite('__diag_ping', 'diagnostico', null, true); }catch(e){}
    }catch(e){ primeiroErro = primeiroErro || e; L.push('✘ 3. Gravar FALHOU — HTTP ' + (e.status||'') + ' ' + (e.code||'') + ': ' + (e.message||'')); }
  }
  // 4. Ler (runQuery)
  if(!primeiroErro){
    try{
      const docs = await R.rtListDesde(null, 3);
      L.push('✔ 4. Ler da nuvem OK (' + (docs ? docs.length : 0) + ' doc(s) na amostra)');
    }catch(e){ primeiroErro = primeiroErro || e; L.push('✘ 4. Ler FALHOU — HTTP ' + (e.status||'') + ' ' + (e.code||'') + ': ' + (e.message||'')); }
  }
  // 5. Estado deste PC
  let temCursor = false;
  try{ temCursor = (localStorage.getItem('digicopy_rt_state_v1')||'').indexOf('cursor') >= 0; }catch(e){}
  L.push((temCursor ? '✔' : '✘') + ' 5. Este aparelho já sincronizou alguma vez: ' + (temCursor ? 'sim' : 'NÃO (nunca conseguiu)'));
  if(typeof db !== 'undefined' && db){
    L.push('Registros neste aparelho: clientes=' + (db.clientes||[]).length + ' • vendas=' + (db.vendas||[]).length + ' • financeiro=' + ((db.contasReceber||[]).length + (db.contasPagar||[]).length) + ' • chamados=' + (db.os||[]).length);
  }
  try{ const lb = localStorage.getItem('digicopy_backup_auto_v1'); if(lb) L.push('Último backup automático: ' + lb.slice(0,10)); }catch(e){}
  if(primeiroErro){
    L.push('\n➡ O QUE FAZER: ' + traduzirErroSync(primeiroErro));
    if(/REGRAS/.test(traduzirErroSync(primeiroErro))) L.push('\nRegras pra colar no Firebase:\n' + textoRegrasFirebase());
  }else{
    L.push('\nTudo OK aqui. Se outro aparelho não recebe, rode este mesmo teste NELE (cada aparelho tem seu diagnóstico).');
  }
  limparDiagLocal();
  return L.join('\n');
};

window.__syncDiagnosticoAlert = async function(){
  let txt = '';
  try{ txt = await window.__syncDiagnostico(); }
  catch(e){ txt = 'Erro rodando o teste: ' + (e && (e.message||e.code) || e); }
  if(typeof window.lfbAlert === 'function') window.lfbAlert(txt, 'Teste da nuvem');
  return txt;
};

limparDiagLocal();
console.log('[DIGICOPY] ajustes_v52025_patch.js carregado — teste da nuvem disponível no botão da barra superior');
})();
