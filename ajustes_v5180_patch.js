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

window.imprimirChamadoPDF=function(osId){
  const o=(db.os||[]).find(x=>x.id===osId);
  if(!o){ aviso('Salve o chamado antes de imprimir.'); return; }
  const cl=(db.clientes||[]).find(c=>c.id===o.clienteId)||{};
  const loja=lojaRodape();
  const fin=chamadoFinalizado(o);
  const p=parqueDaOs(o);
  const showColor=!o.contratoId || temColor(p,o);
  const pecas=Array.isArray(o.pecas)&&o.pecas.length?o.pecas.map(it=>({d:it.descricao||'',q:it.qtd||''})):[];
  while(pecas.length<5) pecas.push({d:'',q:''});
  const cell=(x)=>fin?esc(x==null||x===''?'':x):'';
  const dataCad=dataBR(o.criadoEm||o.dataAbertura);
  const dataAt=fin&&o.dataAtendimento?dataBR(o.dataAtendimento):'&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;';
  // NUNCA número no contador se não estiver finalizado
  const pb = fin && o.contadorAtual!=null && String(o.contadorAtual).trim()!=='' ? esc(String(o.contadorAtual)) : '';
  const cor = fin && o.contadorColor!=null && String(o.contadorColor).trim()!=='' ? esc(String(o.contadorColor)) : '';
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Chamado ${esc(o.numero||'')}</title>
  <style>
    @page{size:A4;margin:10mm}
    *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
    html,body{margin:0;padding:0}
    body{font-family:Arial,sans-serif;color:#111;font-size:12px}
    .page{height:277mm;max-height:277mm;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden}
    .head{display:flex;gap:12px;align-items:center;padding-bottom:8px;border-bottom:3px solid #0a1e8a;flex-shrink:0}
    .head img{height:50px}.head h1{margin:0;color:#0a1e8a;font-size:18px}
    .muted{color:#64748b;font-size:11px}
    .cards{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0;flex-shrink:0}
    .card{border:1px solid #cbd5e1;border-radius:10px;padding:8px 10px;background:#f8fafc}
    .faixa{background:#0a1e8a!important;color:#fff!important;text-align:center;font-weight:800;padding:6px;margin:8px 0 4px;border-radius:6px;flex-shrink:0}
    table{width:100%;border-collapse:collapse} th,td{border:1px solid #cbd5e1;padding:5px}
    th{background:#eef2ff!important;color:#0a1e8a}
    .box-write{border:1px solid #94a3b8;border-radius:8px;min-height:52px;padding:6px 10px;
      background-image:repeating-linear-gradient(#fff 0 20px,#cbd5e1 20px 21px)}
    .mid{flex:0 1 auto}
    .rodape-cnt{margin-top:10px;line-height:1.9;font-size:13px;flex-shrink:0}
    .foot{margin-top:auto;padding-top:12px;flex-shrink:0}
    .assin{display:flex;justify-content:space-between;gap:48px;margin-bottom:14px}
    .assin div{flex:1;text-align:center;border-top:1px solid #111;padding-top:6px}
    .rodape-loja-final{border-top:1px solid #d8dee9;padding-top:4px;text-align:center;font-size:8.5px;color:#5b6472}
    @media print{.no-print{display:none!important}.page{height:277mm}}
  </style></head><body>
  <div class="no-print" style="padding:8px"><button onclick="window.print()">Imprimir</button></div>
  <div class="page">
  <div class="head"><img src="${logoSrc()}"><div><h1>${esc(loja.fantasia)}</h1><div class="muted">${esc(loja.razao)}</div></div>
    <div style="margin-left:auto;text-align:right"><b>OS ${esc(o.numero||'')}</b></div></div>
  <div class="cards">
    <div class="card"><div class="muted">CLIENTE</div><b>${esc(cl.nome||'')}</b><div class="muted">${esc(cl.documento||'')} • ${esc(cl.telefone||'')}</div></div>
    <div class="card"><div class="muted">ATENDIMENTO</div>
      <div>Técnico: <b>${esc(o.tecnico||'')}</b></div>
      <div>Motivo / Defeito: <b>${esc(o.descricao||'')}</b></div>
      <div class="muted">Data de cadastro: ${esc(dataCad)}</div>
    </div>
  </div>
  <div class="mid">
  <div class="faixa">SERVIÇOS EXECUTADOS</div>
  <div class="box-write">${cell(o.servicos)}</div>
  <div class="faixa">PRODUTOS / PEÇAS USADAS</div>
  <table><thead><tr><th style="width:78%">Descrição</th><th>Quantidade</th></tr></thead><tbody>
  ${pecas.slice(0,5).map(it=>`<tr><td>${fin?esc(it.d):''}&nbsp;</td><td>${fin?esc(it.q):''}&nbsp;</td></tr>`).join('')}
  </tbody></table>
  <div class="faixa">OBSERVAÇÃO</div>
  <div class="box-write">${cell(o.observacao)}</div>
  <p class="rodape-cnt">
    <b>Data do atendimento:</b> <span style="border-bottom:1px solid #111;min-width:110px;display:inline-block;text-align:center">${dataAt}</span>
    &nbsp;&nbsp;<b>Contador preto:</b> <span class="cnt-line" style="display:inline-block;border-bottom:1px solid #111;min-width:140px;height:16px;text-align:center">${pb}</span>
    ${showColor?'&nbsp;&nbsp;<b>Contador color:</b> <span class="cnt-line" style="display:inline-block;border-bottom:1px solid #111;min-width:140px;height:16px;text-align:center">'+cor+'</span>':''}
  </p>
  </div>
  <div class="foot">
    <div class="assin">
      <div>Assinatura do técnico</div>
      <div>Assinatura do cliente</div>
    </div>
    <div class="rodape-loja-final"><b>${esc(loja.fantasia)}</b>${loja.razao?' • '+esc(loja.razao):''}${loja.cnpj?' • CNPJ '+esc(loja.cnpj):''}<br>${esc(loja.end||'Endereço não informado')}${loja.tel?' • Tel. '+esc(loja.tel):''}${loja.whats?' • WhatsApp '+esc(loja.whats):''}${loja.email?' • '+esc(loja.email):''}</div>
  </div>
  </div>
  </body></html>`;
  const w=window.open('','_blank');
  if(w){ w.document.write(html); w.document.close(); }
};

if(typeof window.imprimirChamado==='function'){
  window.imprimirChamado=function(id){ return window.imprimirChamadoPDF(id); };
}

console.log('[DIGICOPY] ajustes_v5180_patch.js');
})();
