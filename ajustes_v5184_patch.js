// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.18.4 — PDF do chamado: dados do cliente e de atendimento lado a lado
// • Item 3 — no PDF do chamado (Ordem de Serviço), a caixa de DADOS DO CLIENTE
//   fica ao lado da caixa de DADOS DE ATENDIMENTO (economiza espaço).
//   - Cliente: nome, documento, telefone e endereço.
//   - Atendimento: técnico, criado por, motivo/defeito, data de cadastro e
//     data de atendimento.
//   - A "Data do atendimento" que ficava solta no rodapé subiu para a caixa
//     de atendimento; os contadores continuam no rodapé (em branco até
//     finalizar, como já era).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
function n(v, fb){ var x = Number(String(v==null?'':v).replace(',', '.')); return Number.isFinite(x) ? x : (fb === undefined ? 0 : fb); }
function money(v){ return typeof fmtMoney === 'function' ? fmtMoney(n(v)) : ('R$ ' + n(v).toFixed(2).replace('.', ',')); }
function sess(){ return typeof getSession === 'function' ? getSession() : null; }
function aviso(m){ if(typeof window.lfbAlert === 'function') return window.lfbAlert(m, 'Aviso'); }
function logoSrc(){ return window.DIGICOPY_LOGO || './logo.png'; }
function dia(v){ return String(v==null?'':v).slice(0,10); }
function dataBR(v){ var s = dia(v); if(!s) return ''; var p = s.split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : s; }

function normItem(it){
  var qtd = Math.max(1, n(it.qtd, 1));
  var preco = n(it.preco, 0);
  var desconto = Math.max(0, n(it.desconto, 0));
  return Object.assign({}, it, { qtd: qtd, preco: preco, desconto: desconto, subtotal: Math.max(0, qtd * preco - desconto) });
}

function chamadoFinalizado(o){
  if(!o) return false;
  var chk = document.getElementById('ko-concluido') || document.getElementById('ca-concluido');
  if(chk) return !!chk.checked;
  var st = String(o.status || '').toLowerCase();
  return st === 'concluido' || st === 'finalizado' || st === 'fechado';
}
function parqueDaOs(o){
  var list = db.parque || [];
  return list.find(function(x){ return x.equipamentoId === o.equipamentoId && (!o.contratoId || x.contratoId === o.contratoId); })
      || list.find(function(x){ return x.equipamentoId === o.equipamentoId; })
      || null;
}
function temColor(p, o){
  if(!o.contratoId) return true;
  var m = (p && (p.medidoresConfig || p.medidores)) || {};
  return ['colorA4','colorA3'].some(function(k){
    var x = m[k]; if(!x) return false;
    var mod = String(x.modalidade || x.mod || '').toLowerCase();
    return !!(mod && mod !== 'inativo' && mod !== 'off');
  });
}
function lojaRodape(){
  var s = sess() || {};
  var emp = (db.empresas || []).find(function(e){ return e.id === s.empresaId; }) || {};
  var l = (db.config && (db.config.loja || db.config.empresa)) || {};
  var d = Object.assign({}, emp, l);
  var end = d.endereco || [d.rua || d.logradouro, d.numero, d.bairro, d.cidade || d.municipio, d.uf || d.estado, d.cep].filter(Boolean).join(' • ');
  return { fantasia: d.fantasia || 'DIGICOPY', razao: d.razaoSocial || d.nome || '', cnpj: d.cnpj || s.cnpj || '', tel: d.telefone || d.fone || '', whats: d.whatsapp || '', email: d.email || '', end: end || '' };
}

window.imprimirChamadoPDF = function(osId){
  const o = (db.os || []).find(function(x){ return x.id === osId; });
  if(!o){ aviso('Salve o chamado antes de imprimir.'); return; }
  const cl = (db.clientes || []).find(function(c){ return c.id === o.clienteId; }) || {};
  const loja = lojaRodape();
  const fin = chamadoFinalizado(o);
  const p = parqueDaOs(o);
  const showColor = !o.contratoId || temColor(p, o);
  let pecas = Array.isArray(o.pecas) ? o.pecas.map(normItem) : [];
  while(pecas.length < 5) pecas.push({ descricao:'', qtd:'', subtotal:'' });
  const cell = function(x){ return fin ? esc(x == null || x === '' ? '' : x) : ''; };
  const cellM = function(x){ return fin && x !== '' && x != null ? esc(money(x)) : ''; };
  const dataCad = dataBR(o.criadoEm || o.dataAbertura);
  const dataAt = fin && o.dataAtendimento ? dataBR(o.dataAtendimento) : '&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;';
  const pb = fin && o.contadorAtual != null && String(o.contadorAtual).trim() !== '' ? esc(String(o.contadorAtual)) : '';
  const cor = fin && o.contadorColor != null && String(o.contadorColor).trim() !== '' ? esc(String(o.contadorColor)) : '';
  const endCli = [cl.endereco || cl.rua || cl.logradouro, cl.numero, cl.bairro, cl.cidade, cl.uf || cl.estado, cl.cep].filter(Boolean).join(' • ');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Chamado ${esc(o.numero||'')}</title>
  <style>
    @page{size:A4;margin:10mm}
    *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
    html,body{margin:0;padding:0} body{font-family:Arial,sans-serif;color:#111;font-size:12px}
    .page{height:277mm;max-height:277mm;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden}
    .head{display:flex;gap:12px;align-items:center;padding-bottom:8px;border-bottom:3px solid #0a1e8a}
    .head img{height:50px}.head h1{margin:0;color:#0a1e8a;font-size:18px}
    .muted{color:#64748b;font-size:11px}
    .cards{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}
    .card{border:1px solid #cbd5e1;border-radius:10px;padding:8px 10px;background:#f8fafc}
    .card .t{color:#0a1e8a;font-weight:800;font-size:10px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px}
    .faixa{background:#0a1e8a!important;color:#fff!important;text-align:center;font-weight:800;padding:6px;margin:8px 0 4px;border-radius:6px}
    table{width:100%;border-collapse:collapse} th,td{border:1px solid #cbd5e1;padding:5px}
    th{background:#eef2ff!important;color:#0a1e8a}
    .box-write{border:1px solid #94a3b8;border-radius:8px;min-height:48px;padding:6px 10px;background-image:repeating-linear-gradient(#fff 0 20px,#cbd5e1 20px 21px)}
    .foot{margin-top:auto;padding-top:10px}
    .assin{display:flex;justify-content:space-between;gap:48px;margin-bottom:12px}
    .assin div{flex:1;text-align:center;border-top:1px solid #111;padding-top:6px}
    .rodape-loja-final{border-top:1px solid #d8dee9;padding-top:4px;text-align:center;font-size:8.5px;color:#5b6472}
    @media print{.no-print{display:none!important}}
  </style></head><body>
  <div class="no-print" style="padding:8px"><button onclick="window.print()">Imprimir</button></div>
  <div class="page">
  <div class="head"><img src="${logoSrc()}"><div><h1>${esc(loja.fantasia)}</h1><div class="muted">${esc(loja.razao)}</div></div>
    <div style="margin-left:auto;text-align:right"><b>OS ${esc(o.numero||'')}</b></div></div>
  <div class="cards">
    <div class="card"><div class="t">Dados do Cliente</div><b>${esc(cl.nome||'')}</b><div class="muted">${esc(cl.documento||'')} • ${esc(cl.telefone||'')}</div>${endCli?`<div class="muted">${esc(endCli)}</div>`:''}</div>
    <div class="card"><div class="t">Dados de Atendimento</div>
      <div>Técnico: <b>${esc(o.tecnico||'')}</b></div>
      <div>Motivo / Defeito: <b>${esc(o.descricao||'')}</b></div>
      <div class="muted">Cadastro: ${esc(dataCad)} • Atendimento: ${dataAt}</div>
    </div>
  </div>
  <div class="faixa">SERVIÇOS EXECUTADOS</div>
  <div class="box-write">${cell(o.servicos)}</div>
  <div class="faixa">PRODUTOS / PEÇAS UTILIZADAS</div>
  <table><thead><tr><th style="width:62%">Descrição</th><th>Quantidade</th><th>Valor</th></tr></thead><tbody>
  ${pecas.slice(0,5).map(function(it){ return `<tr><td>${cell(it.descricao)}&nbsp;</td><td>${cell(it.qtd)}&nbsp;</td><td>${it.subtotal===''?'':cellM(it.subtotal)}&nbsp;</td></tr>`; }).join('')}
  </tbody></table>
  <div class="faixa">OBSERVAÇÃO</div>
  <div class="box-write">${cell(o.observacao)}</div>
  <p style="margin-top:10px;font-size:13px">
    <b>Contador preto:</b> <span style="display:inline-block;border-bottom:1px solid #111;min-width:130px;height:16px;text-align:center">${pb}</span>
    ${showColor?'&nbsp;&nbsp;<b>Contador color:</b> <span style="display:inline-block;border-bottom:1px solid #111;min-width:130px;height:16px;text-align:center">'+cor+'</span>':''}
  </p>
  <div class="foot">
    <div class="assin"><div>Assinatura do técnico</div><div>Assinatura do cliente</div></div>
    <div class="rodape-loja-final"><b>${esc(loja.fantasia)}</b>${loja.razao?' • '+esc(loja.razao):''}${loja.cnpj?' • CNPJ '+esc(loja.cnpj):''}<br>${esc(loja.end||'Endereço não informado')}${loja.tel?' • Tel. '+esc(loja.tel):''}${loja.whats?' • WhatsApp '+esc(loja.whats):''}${loja.email?' • '+esc(loja.email):''}</div>
  </div>
  </div></body></html>`;
  const w = window.open('', '_blank'); if(w){ w.document.write(html); w.document.close(); }
};

console.log('[DIGICOPY] ajustes_v5184_patch.js');
})();
