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

window.imprimirChamadoPDF=function(osId){
  const o=(db.os||[]).find(x=>x.id===osId);
  if(!o){ aviso('Salve o chamado antes de imprimir.'); return; }
  const cl=(db.clientes||[]).find(c=>c.id===o.clienteId)||{};
  const loja=lojaRodape();
  const fin=o.status==='concluido';
  const p=parqueDaOs(o);
  const showColor=!o.contratoId || temColor(p,o);
  const pecas=Array.isArray(o.pecas)&&o.pecas.length?o.pecas.map(it=>({d:it.descricao||'',q:it.qtd||''})):[];
  while(pecas.length<5) pecas.push({d:'',q:''});
  const cell=(x)=>fin?esc(x==null||x===''?'':x):'';
  const linha='<span style="display:inline-block;border-bottom:1px solid #111;min-width:150px;height:18px;vertical-align:bottom">&nbsp;</span>';
  const dataCad=dataBR(o.criadoEm||o.dataAbertura);
  const dataAt=fin&&o.dataAtendimento?dataBR(o.dataAtendimento):'&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;';
  // contadores: NADA escrito se não finalizado
  const pb = fin && o.contadorAtual!=null && o.contadorAtual!=='' ? esc(String(o.contadorAtual)) : '';
  const cor = fin && o.contadorColor!=null && o.contadorColor!=='' ? esc(String(o.contadorColor)) : '';
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Chamado ${esc(o.numero||'')}</title>
  <style>
    @page{size:A4;margin:10mm}
    *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
    html,body{margin:0;padding:0}
    body{font-family:Arial,sans-serif;color:#111;font-size:12px}
    .page{min-height:auto;display:flex;flex-direction:column;box-sizing:border-box}
    .head{display:flex;gap:12px;align-items:center;padding-bottom:8px;border-bottom:3px solid #0a1e8a}
    .head img{height:52px}.head h1{margin:0;color:#0a1e8a;font-size:18px}
    .muted{color:#64748b;font-size:11px}
    .cards{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}
    .card{border:1px solid #cbd5e1;border-radius:10px;padding:8px 10px;background:#f8fafc}
    .faixa{background:#0a1e8a!important;color:#fff!important;text-align:center;font-weight:800;padding:6px;margin:10px 0 5px;border-radius:6px}
    table{width:100%;border-collapse:collapse} th,td{border:1px solid #cbd5e1;padding:6px}
    th{background:#eef2ff!important;color:#0a1e8a}
    .box-write{border:1px solid #94a3b8;border-radius:8px;min-height:64px;padding:8px 10px;
      background-image:repeating-linear-gradient(#fff 0 21px,#cbd5e1 21px 22px)}
    .rodape{margin-top:14px;line-height:2;font-size:13px}
    .assin{margin-top:42px;display:flex;justify-content:space-between;gap:48px}
    .assin div{flex:1;text-align:center;border-top:1px solid #111;padding-top:6px}
    .rodape-loja-final{margin-top:18px;border-top:1px solid #d8dee9;padding-top:4px;text-align:center;font-size:8.5px;color:#5b6472}
    @media print{.no-print{display:none!important}}
  </style></head><body>
  <div class="no-print" style="padding:8px"><button onclick="window.print()">Imprimir</button></div>
  <div class="page">
  <div class="head"><img src="${logoSrc()}"><div><h1>${esc(loja.fantasia)}</h1><div class="muted">${esc(loja.razao)}</div><div class="muted">${esc(loja.cnpj)}</div></div>
    <div style="margin-left:auto;text-align:right"><b>OS ${esc(o.numero||'')}</b></div></div>
  <div class="cards">
    <div class="card"><div class="muted">CLIENTE</div><b>${esc(cl.nome||'')}</b><div class="muted">${esc(cl.documento||'')} • ${esc(cl.telefone||'')}</div></div>
    <div class="card"><div class="muted">ATENDIMENTO</div>
      <div>Técnico: <b>${esc(o.tecnico||'')}</b></div>
      <div>Motivo / Defeito: <b>${esc(o.descricao||'')}</b></div>
      <div class="muted">Data de cadastro: ${esc(dataCad)}</div>
    </div>
  </div>
  <div class="faixa">SERVIÇOS EXECUTADOS</div>
  <div class="box-write">${cell(o.servicos)}</div>
  <div class="faixa">PRODUTOS / PEÇAS USADAS</div>
  <table><thead><tr><th style="width:78%">Descrição</th><th>Quantidade</th></tr></thead><tbody>
  ${pecas.slice(0,5).map(it=>`<tr><td>${fin?esc(it.d):''}&nbsp;</td><td>${fin?esc(it.q):''}&nbsp;</td></tr>`).join('')}
  </tbody></table>
  <div class="faixa">OBSERVAÇÃO</div>
  <div class="box-write">${cell(o.observacao)}</div>
  <p class="rodape">
    <b>Data do atendimento:</b> <span style="border-bottom:1px solid #111;min-width:110px;display:inline-block;text-align:center">${dataAt}</span>
    &nbsp;&nbsp;<b>Contador preto:</b> <span style="display:inline-block;border-bottom:1px solid #111;min-width:140px;height:16px;text-align:center">${pb}</span>
    ${showColor?'&nbsp;&nbsp;<b>Contador color:</b> <span style="display:inline-block;border-bottom:1px solid #111;min-width:140px;height:16px;text-align:center">'+cor+'</span>':''}
  </p>
  <div class="assin">
    <div>Assinatura do técnico</div>
    <div>Assinatura do cliente</div>
  </div>
  <div class="rodape-loja-final"><b>${esc(loja.fantasia)}</b>${loja.razao?' • '+esc(loja.razao):''}${loja.cnpj?' • CNPJ '+esc(loja.cnpj):''}<br>${esc(loja.end||'Endereço não informado')}${loja.tel?' • Tel. '+esc(loja.tel):''}${loja.whats?' • WhatsApp '+esc(loja.whats):''}${loja.email?' • '+esc(loja.email):''}</div>
  </div>
  </body></html>`;
  const w=window.open('','_blank'); if(w){ w.document.write(html); w.document.close(); }
};

console.log('[DIGICOPY] ajustes_v5179_patch.js');
})();
