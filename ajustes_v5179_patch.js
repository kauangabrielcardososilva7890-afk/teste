// PATCH v5.17.9 — cliente avulso X; color no PDF contrato; contadores vazios; 1 folha
(function(){
'use strict';

function esc(s){ return String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])); }
function txt(v){ return String(v??'').trim(); }
function n(v,fb){ const x=Number(String(v??'').replace(',','.')); return Number.isFinite(x)?x:(fb===undefined?0:fb); }
function dia(v){ return String(v||'').slice(0,10); }
function dataBR(v){ const s=dia(v); if(!s) return ''; const p=s.split('-'); return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:s; }
function sess(){ return typeof getSession==='function'?getSession():null; }
function aviso(m){ if(typeof window.lfbAlert==='function') return window.lfbAlert(m,'Aviso'); }
function logoSrc(){ return window.DIGICOPY_LOGO||'./logo.png'; }

function parqueDaOs(o){
  if(!o) return null;
  const list=db.parque||[];
  return list.find(x=>x.equipamentoId===o.equipamentoId && (!o.contratoId||x.contratoId===o.contratoId))
      || list.find(x=>x.equipamentoId===o.equipamentoId)
      || list.find(x=>x.id===o.parqueId)
      || null;
}

function temColor(p,o){
  if(o && (o.temColor===true || o.colorAtivo===true)) return true;
  if(o && o.contadorColor!=null && o.contadorColor!=='') return true;
  if(p && (p.temColor===true || p.colorAtivo===true)) return true;
  const m=(p&&(p.medidoresConfig||p.medidores||p.medidoresCfg))||{};
  const keys=['colorA4','colorA3','color','cor','colorido'];
  for(let i=0;i<keys.length;i++){
    const x=m[keys[i]];
    if(!x) continue;
    if(x===true) return true;
    const mod=String(x.modalidade||x.mod||x.tipo||x.status||'').toLowerCase();
    if(mod && mod!=='inativo' && mod!=='inativa' && mod!=='off' && mod!=='desligado') return true;
    if(x.ativo===true || x.habilitado===true || x.enabled===true) return true;
  }
  const e=o&&o.equipamentoId&&(db.equipamentos||[]).find(x=>x.id===o.equipamentoId);
  if(e && (e.temColor===true || /color/i.test(e.tipo||e.modelo||''))) return true;
  return false;
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

function htmlClienteSel(c){
  if(!c) return '<span class="text-slate-400">Nenhum cliente selecionado</span>';
  return `<div class="flex items-start justify-between gap-2">
    <div><b>${esc(c.nome||'')}</b><br><span class="text-[11px] text-slate-500">${esc(c.documento||'')} • ${esc(c.telefone||'')}</span></div>
    <button type="button" id="ca-cli-x" onclick="lcLimparClienteAvulso(event)" class="shrink-0 h-8 px-3 rounded-lg bg-red-50 text-red-600 font-bold text-[11px]" title="Remover cliente">Limpar</button>
  </div>`;
}

window.lcLimparClienteAvulso=function(ev){
  if(ev){ ev.preventDefault(); ev.stopPropagation(); }
  window.__CHAMADO_AVULSO=window.__CHAMADO_AVULSO||{};
  window.__CHAMADO_AVULSO.clienteId='';
  window.__CHAMADO_AVULSO.equipamentoId='';
  const el=document.getElementById('ca-cliente-selecionado');
  if(el) el.innerHTML=htmlClienteSel(null);
  const res=document.getElementById('ca-clientes-result');
  if(res){ res.innerHTML=''; res.classList.add('hidden'); res.style.display='none'; }
  const inp=document.getElementById('ca-busca-cliente'); if(inp){ inp.value=''; inp.focus(); }
};

const _sel=window.selecionarClienteChamadoAvulso;
window.selecionarClienteChamadoAvulso=function(id){
  if(_sel) _sel.apply(this,arguments);
  else {
    window.__CHAMADO_AVULSO=window.__CHAMADO_AVULSO||{};
    window.__CHAMADO_AVULSO.clienteId=id;
  }
  const c=(db.clientes||[]).find(x=>x.id===id);
  const el=document.getElementById('ca-cliente-selecionado');
  if(el) el.innerHTML=htmlClienteSel(c);
  const res=document.getElementById('ca-clientes-result');
  if(res){ res.innerHTML=''; res.classList.add('hidden'); res.style.display='none'; }
  const inp=document.getElementById('ca-busca-cliente'); if(inp) inp.value='';
};

const _busca=window.buscarClientesChamadoAvulso;
window.buscarClientesChamadoAvulso=function(){
  const res=document.getElementById('ca-clientes-result');
  if(res){ res.classList.remove('hidden'); res.style.display=''; }
  if(_busca) return _busca.apply(this,arguments);
};

const _av=window.abrirChamadoAvulsoForm;
if(typeof _av==='function'){
  window.abrirChamadoAvulsoForm=function(id){
    const r=_av.apply(this,arguments);
    setTimeout(()=>{
      const cid=window.__CHAMADO_AVULSO&&window.__CHAMADO_AVULSO.clienteId;
      const el=document.getElementById('ca-cliente-selecionado');
      if(el && cid){
        const c=(db.clientes||[]).find(x=>x.id===cid);
        el.innerHTML=htmlClienteSel(c);
      }
      const res=document.getElementById('ca-clientes-result');
      if(res && cid){ res.innerHTML=''; res.classList.add('hidden'); res.style.display='none'; }
    },100);
    return r;
  };
}


console.log('[DIGICOPY] ajustes_v5179_patch.js');
})();
