// PATCH v5.18.0 — PDF: contador só se finalizado; rodapé+assinatura no fim da A4
(function(){
'use strict';

function esc(s){ return String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])); }
function dia(v){ return String(v||'').slice(0,10); }
function dataBR(v){ const s=dia(v); if(!s) return ''; const p=s.split('-'); return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:s; }
function sess(){ return typeof getSession==='function'?getSession():null; }
function aviso(m){ if(typeof window.lfbAlert==='function') return window.lfbAlert(m,'Aviso'); }
function logoSrc(){ return window.DIGICOPY_LOGO||'./logo.png'; }

function chamadoFinalizado(o){
  if(!o) return false;
  const chk=document.getElementById('ko-concluido')||document.getElementById('ca-concluido')||document.getElementById('o-concluido');
  if(chk) return !!chk.checked;
  const st=String(o.status||'').toLowerCase();
  return st==='concluido'||st==='finalizado'||st==='fechado';
}

function parqueDaOs(o){
  const list=db.parque||[];
  return list.find(x=>x.equipamentoId===o.equipamentoId && (!o.contratoId||x.contratoId===o.contratoId))
      || list.find(x=>x.equipamentoId===o.equipamentoId)
      || null;
}
function temColor(p,o){
  if(!o.contratoId) return true;
  if(p && (p.temColor===true || p.colorAtivo===true)) return true;
  const m=(p&&(p.medidoresConfig||p.medidores))||{};
  return ['colorA4','colorA3','color'].some(k=>{
    const x=m[k]; if(!x) return false;
    const mod=String(x.modalidade||x.mod||'').toLowerCase();
    return !!(mod && mod!=='inativo' && mod!=='off');
  });
}
function lojaRodape(){
  const s=sess()||{};
  const emp=(db.empresas||[]).find(e=>e.id===s.empresaId)||{};
  const l=(db.config&&(db.config.loja||db.config.empresa))||{};
  const d=Object.assign({},emp,l);
  const end=d.endereco||[d.rua||d.logradouro,d.numero,d.bairro,d.cidade||d.municipio,d.uf||d.estado,d.cep].filter(Boolean).join(' • ');
  return {
    fantasia:d.fantasia||'DIGICOPY',
    razao:d.razaoSocial||d.nome||'',
    cnpj:d.cnpj||s.cnpj||'',
    tel:d.telefone||d.fone||'',
    whats:d.whatsapp||'',
    email:d.email||'',
    end:end||''
  };
}


if(typeof window.imprimirChamado==='function'){
  window.imprimirChamado=function(id){ return window.imprimirChamadoPDF(id); };
}

console.log('[DIGICOPY] ajustes_v5180_patch.js');
})();
