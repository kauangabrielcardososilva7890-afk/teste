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

// Backup diário: já rodou se a data salva é o mesmo dia (hora local).
function jaRodouHoje(ultimaISO, agora){
  if(!ultimaISO) return false;
  const a = new Date(ultimaISO), b = (agora instanceof Date) ? agora : new Date(agora||Date.now());
  if(isNaN(a) || isNaN(b)) return false;
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

function nomeBackupDiario(d){
  const dt = (d instanceof Date) ? d : new Date(d||Date.now());
  const p2 = n => String(n).padStart(2,'0');
  return 'digicopy-backup-'+dt.getFullYear()+'-'+p2(dt.getMonth()+1)+'-'+p2(dt.getDate())+'.json';
}

// JSON do backup SEM o campo interno de sincronização (_rt) — igual exportBackup.
function jsonBackupLimpo(db){
  return JSON.stringify(JSON.parse(JSON.stringify(db, (k,v)=>k==='_rt'?undefined:v)), null, 2);
}

window.AJUSTES_V52024_PURE = { ehUsuarioDemoAntigo, jaRodouHoje, nomeBackupDiario, jsonBackupLimpo };

if(typeof document === 'undefined') return; // modo teste (node)

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

/* ---------------- 2. Backup automático 1x ao dia ---------------- */
var LS_BKP = 'digicopy_backup_auto_v1';
async function rodarBackupDiario(){
  try{
    if(typeof db === 'undefined') return;
    if(typeof getSession === 'function' && !getSession()) return; // só depois de logado
    let ultima = null;
    try{ ultima = localStorage.getItem(LS_BKP); }catch(e){}
    if(jaRodouHoje(ultima, new Date())) return;
    const nome = nomeBackupDiario(new Date());
    const json = jsonBackupLimpo(db);
    let ok = false, onde = '';
    if(window.backupAPI && typeof window.backupAPI.saveDaily === 'function'){
      // Programinha (.exe): salva direto em %APPDATA%\digicopy-erp\backups — sem janela, sem clique.
      try{
        const r = await window.backupAPI.saveDaily(nome, json);
        ok = !!(r && r.ok); onde = r && (r.dir || r.path) || 'pasta de backups do programa';
      }catch(e){ ok = false; }
    }
    if(!ok){
      // Navegador (ou .exe antigo sem a ponte): baixa o arquivo (cai em Downloads).
      try{
        const blob = new Blob([json], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = nome; a.click();
        setTimeout(()=>{ try{ URL.revokeObjectURL(url); }catch(e){} }, 4000);
        ok = true; onde = 'Downloads';
      }catch(e){ ok = false; }
    }
    if(ok){
      try{ localStorage.setItem(LS_BKP, new Date().toISOString()); }catch(e){}
      if(typeof toast === 'function') toast('Backup diário salvo'+(onde?(' em '+onde):''), 'success');
      console.log('[DIGICOPY] backup diário salvo:', nome, onde);
    }
  }catch(e){ /* nunca atrapalha o uso */ }
}
function agendarBackupDiario(){
  // dispara ~30s depois que logar/abrir e re-avalia de tempos em tempos (virada de dia com o app aberto)
  setTimeout(rodarBackupDiario, 30*1000);
  setInterval(rodarBackupDiario, 2*60*60*1000);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) rodarBackupDiario(); });
}
if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', agendarBackupDiario); } else { agendarBackupDiario(); }

console.log('[DIGICOPY] ajustes_v52024_patch.js carregado — sem filtro de tipo no financeiro + backup diário automático');
})();
