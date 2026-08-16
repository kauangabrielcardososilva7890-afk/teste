// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.18.9 — correções de impressão de chamado + logo padrão + dados loja
// • 1  — Corrige o erro "Informe o motivo do chamado" ao imprimir (a validação
//        lia o campo errado). Agora detecta o formulário correto.
// • 2  — Impede imprimir sem preencher os campos obrigatórios (motivo; e
//        cliente no chamado fora de contrato).
// • 3  — Logo volta a ser a padrão (logo.png). Os dados da loja (nome fantasia,
//        razão social, CNPJ, telefone, e-mail, endereço) aparecem no cabeçalho.
// • 4  — Remove "about:blank" do rodapé da impressão (título/URL limpos).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
function n(v, fb){ var x = Number(String(v == null ? '' : v).replace(',', '.')); return Number.isFinite(x) ? x : (fb === undefined ? 0 : fb); }
function money(v){ return typeof fmtMoney === 'function' ? fmtMoney(n(v)) : ('R$ ' + n(v).toFixed(2).replace('.', ',')); }
function sess(){ return typeof getSession === 'function' ? getSession() : null; }
function aviso(m){ if(typeof window.lfbAlert === 'function') return window.lfbAlert(m, 'Aviso'); else if(typeof toast === 'function') return toast(m, 'error'); }
function logoDefault(){ return window.DIGICOPY_LOGO || './logo.png'; }
function dia(v){ return String(v == null ? '' : v).slice(0, 10); }
function dataBR(v){ var s = dia(v); if(!s) return ''; var p = s.split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : s; }

// ═════════════════════════════════════════════════════════════════════════
// Dados da loja (robusto): db.config.loja → db.config.empresa → db.empresas → sessão
// ═════════════════════════════════════════════════════════════════════════
function lojaData(){
  var s = sess() || {};
  var emp = (typeof db !== 'undefined' && db.empresas || []).find(function(e){ return e.id === s.empresaId; }) || (typeof db !== 'undefined' && db.empresas || [])[0] || {};
  var cfgEmp = (typeof db !== 'undefined' && db.config && db.config.empresa) || {};
  var loja = (typeof db !== 'undefined' && db.config && db.config.loja) || {};
  var d = Object.assign({}, emp, cfgEmp, loja);
  var end = loja.endereco || [loja.rua || d.rua || d.logradouro, loja.numero || d.numero, loja.bairro || d.bairro, loja.cidade || d.cidade || d.municipio, loja.uf || d.uf || d.estado, loja.cep || d.cep].filter(Boolean).join(' • ');
  return {
    fantasia: loja.fantasia || d.fantasia || 'DIGICOPY',
    razao: loja.razaoSocial || loja.nome || d.razaoSocial || d.nome || '',
    cnpj: loja.cnpj || d.cnpj || s.cnpj || '',
    tel: loja.telefone || loja.fone || d.telefone || d.fone || '',
    whats: loja.whatsapp || d.whatsapp || '',
    email: loja.email || d.email || '',
    end: end || ''
  };
}

function normItem(it){
  var qtd = Math.max(1, n(it.qtd, 1));
  var preco = n(it.preco, 0);
  var desconto = Math.max(0, n(it.desconto, 0));
  return Object.assign({}, it, { qtd: qtd, preco: preco, desconto: desconto, subtotal: Math.max(0, qtd * preco - desconto) });
}

// ═════════════════════════════════════════════════════════════════════════
// Lógica pura (testável)
// ═════════════════════════════════════════════════════════════════════════
function coletarFormChamado(o, doc){
  var copy = Object.assign({}, o || {});
  function val(ids){
    for(var i = 0; i < ids.length; i++){
      var el = doc.getElementById(ids[i]);
      if(el && el.value != null && String(el.value).trim() !== '') return String(el.value).trim();
    }
    return null;
  }
  var motivo = val(['kr-os-desc','ko-desc','ca-desc']);
  if(motivo != null) copy.descricao = motivo;
  var serv = val(['kr-os-serv','ko-serv','ca-serv']);
  if(serv != null) copy.servicos = serv;
  var obs = val(['kr-os-obs','ko-obs','ca-obs']);
  if(obs != null) copy.observacao = obs;
  var contAtu = val(['kr-os-cont-atu','ko-cont-atu','ca-cont-atu']);
  if(contAtu != null) copy.contadorAtual = contAtu;
  var modelo = val(['kr-os-modelo','ko-modelo','ca-modelo']);
  if(modelo != null) copy.modelo = modelo;
  var patr = val(['kr-os-patr','ko-patr','ca-patr']);
  if(patr != null) copy.patrimonio = patr;
  var serie = val(['kr-os-serie','ko-serie','ca-serie']);
  if(serie != null) copy.serie = serie;
  var local = val(['kr-os-local','ko-local','ca-local']);
  if(local != null) copy.local = local;
  return copy;
}
function dadosImpressora(o, dbRef){
  if(!o) return { modelo:'', patrimonio:'', serie:'', local:'' };
  var eq = ((dbRef && dbRef.equipamentos) || []).find(function(e){ return e.id === o.equipamentoId; }) || {};
  var p = ((dbRef && dbRef.parque) || []).find(function(x){ return x.equipamentoId === o.equipamentoId; }) || {};
  return { modelo: o.modelo || eq.modelo || '', patrimonio: o.patrimonio || eq.patrimonio || '', serie: o.serie || eq.serie || '', local: o.local || p.localInstalacao || p.setor || '' };
}

window.AJUSTES_V5189_PURE = { lojaData: lojaData, coletarFormChamado: coletarFormChamado, dadosImpressora: dadosImpressora };

if(typeof window === 'undefined' || typeof document === 'undefined') return;

function chamadoFinalizado(o){
  if(!o) return false;
  var chk = document.getElementById('ko-concluido') || document.getElementById('ca-concluido') || document.getElementById('kr-os-concluido');
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

window.imprimirChamadoPDF = function(osId){
  const o = (db.os || []).find(function(x){ return x.id === osId; });
  if(!o){ aviso('Salve o chamado antes de imprimir.'); return; }
  // mescla dados digitados no formulário (sem salvar)
  const merged = coletarFormChamado(o, document);
  const cl = (db.clientes || []).find(function(c){ return c.id === merged.clienteId; }) || {};
  const loja = lojaData();
  const fin = chamadoFinalizado(merged);
  const p = parqueDaOs(merged);
  const showColor = !merged.contratoId || temColor(p, merged);
  const imp = dadosImpressora(merged, db);
  let pecas = Array.isArray(merged.pecas) ? merged.pecas.map(normItem) : [];
  while(pecas.length < 5) pecas.push({ descricao:'', qtd:'', subtotal:'' });
  const cell = function(x){ return fin ? esc(x == null || x === '' ? '' : x) : ''; };
  const cellM = function(x){ return fin && x !== '' && x != null ? esc(money(x)) : ''; };
  const dataCad = dataBR(merged.criadoEm || merged.dataAbertura);
  const dataAt = fin && merged.dataAtendimento ? dataBR(merged.dataAtendimento) : '&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;';
  const pb = fin && merged.contadorAtual != null && String(merged.contadorAtual).trim() !== '' ? esc(String(merged.contadorAtual)) : '';
  const cor = fin && merged.contadorColor != null && String(merged.contadorColor).trim() !== '' ? esc(String(merged.contadorColor)) : '';
  const endCli = [cl.endereco || cl.rua || cl.logradouro, cl.numero, cl.bairro, cl.cidade, cl.uf || cl.estado, cl.cep].filter(Boolean).join(' • ');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Chamado ${esc(merged.numero||'')}</title>
  <style>
    @page{size:A4;margin:10mm}
    *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
    html,body{margin:0;padding:0} body{font-family:Arial,sans-serif;color:#111;font-size:12px}
    .page{height:277mm;max-height:277mm;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden}
    .head{display:flex;gap:12px;align-items:center;padding-bottom:8px;border-bottom:3px solid #0a1e8a}
    .head img{height:52px}.head h1{margin:0;color:#0a1e8a;font-size:18px}
    .muted{color:#64748b;font-size:11px}
    .cards{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}
    .card{border:1px solid #cbd5e1;border-radius:10px;padding:8px 10px;background:#f8fafc}
    .card .t{color:#0a1e8a;font-weight:800;font-size:10px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px}
    .imp-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px 12px}
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
  <div class="no-print" style="padding:8px"><button onclick="if(window.printAPI&amp;&amp;window.printAPI.cleanPrint){window.printAPI.cleanPrint()}else{window.print()}">Imprimir</button></div>
  <div class="page">
  <div class="head"><img src="${logoDefault()}"><div><h1>${esc(loja.fantasia)}</h1><div class="muted">${esc(loja.razao)}</div>${loja.cnpj?`<div class="muted">CNPJ ${esc(loja.cnpj)}</div>`:''}${loja.tel?`<div class="muted">Tel. ${esc(loja.tel)}${loja.email?' • '+esc(loja.email):''}</div>`:''}${loja.end?`<div class="muted">${esc(loja.end)}</div>`:''}</div>
    <div style="margin-left:auto;text-align:right"><b>OS ${esc(merged.numero||'')}</b></div></div>
  <div class="cards">
    <div class="card"><div class="t">Dados do Cliente</div><b>${esc(cl.nome||'')}</b><div class="muted">${esc(cl.documento||'')} • ${esc(cl.telefone||'')}</div>${endCli?`<div class="muted">${esc(endCli)}</div>`:''}</div>
    <div class="card"><div class="t">Dados de Atendimento</div>
      <div>Técnico: <b>${esc(merged.tecnico||'')}</b></div>
      <div>Motivo / Defeito: <b>${esc(merged.descricao||'')}</b></div>
      <div class="muted">Cadastro: ${esc(dataCad)} • Atendimento: ${dataAt}</div>
    </div>
  </div>
  <div class="card" style="margin:0 0 8px"><div class="t">Impressora</div>
    <div class="imp-grid">
      <div>Modelo: <b>${esc(imp.modelo||'-')}</b></div>
      <div>Patrimônio: <b>${esc(imp.patrimonio||'-')}</b></div>
      <div>Serial: <b>${esc(imp.serie||'-')}</b></div>
      <div>Local: <b>${esc(imp.local||'-')}</b></div>
    </div>
  </div>
  <div class="faixa">SERVIÇOS EXECUTADOS</div>
  <div class="box-write">${cell(merged.servicos)}</div>
  <div class="faixa">PRODUTOS / PEÇAS UTILIZADAS</div>
  <table><thead><tr><th style="width:62%">Descrição</th><th>Quantidade</th><th>Valor</th></tr></thead><tbody>
  ${pecas.slice(0,5).map(function(it){ return `<tr><td>${cell(it.descricao)}&nbsp;</td><td>${cell(it.qtd)}&nbsp;</td><td>${it.subtotal===''?'':cellM(it.subtotal)}&nbsp;</td></tr>`; }).join('')}
  </tbody></table>
  <div class="faixa">OBSERVAÇÃO</div>
  <div class="box-write">${cell(merged.observacao)}</div>
  <p style="margin-top:10px;font-size:13px">
    <b>Contador preto:</b> <span style="display:inline-block;border-bottom:1px solid #111;min-width:130px;height:16px;text-align:center">${pb}</span>
    ${showColor?'&nbsp;&nbsp;<b>Contador color:</b> <span style="display:inline-block;border-bottom:1px solid #111;min-width:130px;height:16px;text-align:center">'+cor+'</span>':''}
  </p>
  <div class="foot">
    <div class="assin"><div>Assinatura do técnico</div><div>Assinatura do cliente</div></div>
    <div class="rodape-loja-final"><b>${esc(loja.fantasia)}</b>${loja.razao?' • '+esc(loja.razao):''}${loja.cnpj?' • CNPJ '+esc(loja.cnpj):''}<br>${esc(loja.end||'Endereço não informado')}${loja.tel?' • Tel. '+esc(loja.tel):''}${loja.email?' • '+esc(loja.email):''}</div>
  </div>
  </div></body></html>`;
  const w = window.open('', '_blank');
  if(w){
    w.document.write(html);
    w.document.close();
    try{ w.history.replaceState(null, '', 'chamado-' + (merged.numero || osId) + '.html'); }catch(e){}
  }
};

// ═════════════════════════════════════════════════════════════════════════
// Itens 1 + 2 — validação correta ao imprimir pelo formulário
// (roda no window/capture, ANTES do handler quebrado do documento)
// ═════════════════════════════════════════════════════════════════════════
function campoValor(ids){
  for(var i = 0; i < ids.length; i++){
    var el = document.getElementById(ids[i]);
    if(el && el.value != null && String(el.value).trim() !== '') return String(el.value).trim();
  }
  return '';
}
function validarChamadoParaImprimir(){
  var motivo = campoValor(['kr-os-desc','ko-desc','ca-desc']);
  if(!motivo){ aviso('Informe o motivo do chamado'); return false; }
  // chamado fora de contrato: exige cliente
  if(document.getElementById('ca-desc')){
    var clienteId = window.__CHAMADO_AVULSO && window.__CHAMADO_AVULSO.clienteId;
    if(!clienteId){ aviso('Selecione o cliente'); return false; }
  }
  return true;
}

window.addEventListener('click', function(ev){
  var btn = ev.target && ev.target.closest ? ev.target.closest('button') : null;
  if(!btn) return;
  var t = (btn.textContent || '').toLowerCase();
  var oc = btn.getAttribute('onclick') || '';
  if(!(/imprimir/.test(t) || /imprimirChamado/.test(oc))) return;
  // só interfere quando o formulário de chamado está aberto
  if(!window.__lcChamFormAberto) return;
  ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
  if(!validarChamadoParaImprimir()) return;
  var id = (window.modalContext && window.modalContext.id) || '';
  var m = oc.match(/imprimirChamadoPDF\(\s*'([^']*)'/);
  if(m && m[1]) id = m[1];
  window.imprimirChamadoPDF(id);
}, true);

// ═════════════════════════════════════════════════════════════════════════
// Item 3 — logo padrão (logo.png). O upload de logo da v5.18.8 foi REMOVIDO.
// ═════════════════════════════════════════════════════════════════════════
// restaura a logo original (não existe mais logo customizada da loja)
window.DIGICOPY_LOGO = window.__DIGICOPY_LOGO_ORIGINAL || window.DIGICOPY_LOGO || './logo.png';
if(!window.__DIGICOPY_LOGO_ORIGINAL) window.__DIGICOPY_LOGO_ORIGINAL = window.DIGICOPY_LOGO;

const _renderConfig5189 = window.renderConfig;
if(typeof _renderConfig5189 === 'function'){
  window.renderConfig = function(){
    const r = _renderConfig5189.apply(this, arguments);
    setTimeout(function(){ window.DIGICOPY_LOGO = window.__DIGICOPY_LOGO_ORIGINAL || './logo.png'; }, 250);
    return r;
  };
}
setTimeout(function(){ window.DIGICOPY_LOGO = window.__DIGICOPY_LOGO_ORIGINAL || './logo.png'; }, 1500);

console.log('[DIGICOPY] ajustes_v5189_patch.js');
})();
