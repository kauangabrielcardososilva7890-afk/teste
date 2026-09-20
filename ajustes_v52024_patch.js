// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.20.24 — Filtro "pagar" do Financeiro + backup automático diário
// • Financeiro: apaga DE VERDADE o filtro de tipo (Receber+Pagar/Só a receber/
//   Só a pagar) que ficava junto dos outros filtros — pedido do usuário.
// • Backup automático 1x AO DIA, sem clicar: no programinha (.exe/Electron)
//   salva em %APPDATA%\digicopy-erp\backups\ ; no navegador, baixa o arquivo.
// • Regra pura de "usuário demo antigo" exportada p/ teste (o seedData usa a
//   mesma regra — nunca apaga usuário que o dono cadastrou pela tela).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

/* ---------------- LÓGICA PURA (testável em node) ---------------- */

// Demo antigo = login de demo com id de demo OU criado pelo 'sistema'/sem dono.
// Usuário criado pela tela (criadoPor = id de quem criou) NUNCA é demo.
function ehUsuarioDemoAntigo(u, demoLogins, demoIds){
  if(!u) return false;
  const l = String(u.login||'').toLowerCase();
  if((demoIds||[]).includes(u.id)) return true;
  return (demoLogins||[]).includes(l) && (!u.criadoPor || u.criadoPor==='sistema');
}

// JSON do backup SEM o campo interno de sincronização (_rt) — igual exportBackup.
function jsonBackupLimpo(db){
  const o=JSON.parse(JSON.stringify(db, (k,v)=>k==='_rt'?undefined:v));
  try{ if(o&&o.config&&o.config.escolaAuth) delete o.config.escolaAuth; }catch(e){}
  return JSON.stringify(o, null, 2);
}

window.AJUSTES_V52024_PURE = { ehUsuarioDemoAntigo, jsonBackupLimpo };

if(typeof document === 'undefined') return; // modo teste (node)

const oldExportBackup=window.exportBackup;
if(typeof oldExportBackup==='function'&&!oldExportBackup.__semSenhaEscola){
  window.exportBackup=function(){
    if(typeof db==='undefined') return oldExportBackup.apply(this,arguments);
    const dataStr=jsonBackupLimpo(db);
    const blob=new Blob([dataStr],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download='digicopy-backup-'+new Date().toISOString().slice(0,10)+'.json';
    a.click();
    setTimeout(()=>{ try{ URL.revokeObjectURL(url); }catch(e){} }, 2000);
  };
  window.exportBackup.__semSenhaEscola=true;
}

/* ---------------- 1. Financeiro SEM o filtro de tipo ---------------- */
function removerFiltroTipoFin(){
  const sel = document.getElementById('neo-fin-tipo');
  if(sel) sel.remove();
}
if(typeof window.renderFinanceiro === 'function' && !window.renderFinanceiro.__v52024){
  const oldF = window.renderFinanceiro;
  const wrapF = function(){ const r = oldF.apply(this, arguments); try{ removerFiltroTipoFin(); }catch(e){} return r; };
  wrapF.__v52024 = true; window.renderFinanceiro = wrapF;
}

/* -------- 2. Backup: SÓ no botão -------------------------------------
   O backup automático diário foi removido a pedido do usuário (v5.22.67).
   A cópia de segurança agora sai apenas quando alguém clica em "Backup",
   que chama o exportBackup logo acima. Nada roda sozinho, nada de arquivo
   aparecendo em Downloads sem ninguém pedir.                            */

console.log('[DIGICOPY] ajustes_v52024_patch.js carregado — sem filtro de tipo no financeiro, backup só pelo botão');
})();
