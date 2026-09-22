// ════════════════════════════════════════════════════════════════════════════
// v5.24.35 — P7 FINAL (serial primeiro + remanejo) — ressuscita o desenho do
// wrap v5.22.43/45 ADAPTADO ao fluxo vencedor (id impf-*, pos-47):
// 1) novo cadastro começa SÓ no serial (Avançar) e preenche o resto se achar;
// 2) reutiliza o equipamento existente (nunca duplica serial no sistema);
// 3) se o serial está ativo em OUTRO cliente → ao salvar pergunta se remaneja;
//    o antigo vira status 'remanejada' com snapshot congelado (não edita);
// 4) contrato exibe o bloco "Remanejadas (histórico congelado)".
// ════════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v==null?'':v).trim(); }
function up(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
function n(v){ var x=Number(String(v==null?'':v).replace(',','.')); return isFinite(x)?x:0; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }

function acharEquipPorSerial(dbRef, serie, empId){
  var k = up(serie);
  if(!k) return null;
  return ((dbRef&&dbRef.equipamentos)||[]).find(function(e){
    if(!e) return false;
    if(empId && e.empresaId && e.empresaId!==empId) return false;
    return up(e.serie)===k || up(e.patrimonio)===k;
  })||null;
}
function parquesDoEquip(dbRef, eqId){
  return ((dbRef&&dbRef.parque)||[]).filter(function(p){ return p && p.equipamentoId===eqId; });
}
function parqueAtivoOutroCliente(dbRef, eq, clienteId){
  if(!eq) return null;
  return parquesDoEquip(dbRef, eq.id).find(function(p){
    return p && p.status==='ativo' && p.clienteId && p.clienteId!==clienteId;
  })||null;
}
function snapshotFrozen(eq, p){
  return {
    modelo: (eq&&eq.modelo)||'',
    serie: (eq&&eq.serie)||'',
    patrimonio: (eq&&eq.patrimonio)||'',
    setor: (p&&p.setor)||'',
    localInstalacao: (p&&(p.localInstalacao||p.enderecoInstalacao))||'',
    congeladoEm: new Date().toISOString()
  };
}
function msgRemanejar(nomeCliente, contador){
  return 'impressora cadastrada em '+(nomeCliente||'outro cliente')+' com o contador '+(contador==null?'-':contador)+', deseja remanejar essa impressora pra esse cadastro?';
}

window.IMPRESSORA_REMANEJO_V52435_PURE = {
  acharEquipPorSerial: acharEquipPorSerial,
  parqueAtivoOutroCliente: parqueAtivoOutroCliente,
  snapshotFrozen: snapshotFrozen,
  msgRemanejar: msgRemanejar
};

if(typeof document==='undefined') return;

function aviso(m,t){ if(typeof window.lfbAlert==='function') return window.lfbAlert(m,t||'Impressora'); if(typeof toast==='function') toast(m,'info'); }
function sessao(){ return typeof getSession==='function'?(getSession()||{}):{}; }
function nomeCli(id){
  if(typeof db==='undefined') return '';
  var c=(db.clientes||[]).find(function(x){ return x.id===id; });
  return (c&&c.nome)||'outro cliente';
}

function reexibirTudo(){
  document.querySelectorAll('.v52435-escondido').forEach(function(el){ el.style.display=''; el.classList.remove('v52435-escondido'); });
  var ban=document.getElementById('impf-aviso-serial'); if(ban) ban.remove();
  var foot=document.getElementById('modal-footer');
  if(foot) foot.querySelectorAll('button[data-v52435="1"]').forEach(function(b){ b.style.display=''; b.removeAttribute('data-v52435'); });
}
function passoSerialNovo(){
  if(document.getElementById('impf-avancar')) return;
  var serie=document.getElementById('impf-serie');
  if(!serie) return;
  var lblSerie=serie.closest('label');
  var grid=lblSerie?lblSerie.parentElement:null;
  var body=grid?grid.parentElement:null;
  if(grid){ Array.prototype.slice.call(grid.children).forEach(function(el){ if(el!==lblSerie){ el.classList.add('v52435-escondido'); el.style.display='none'; } }); }
  if(body){ Array.prototype.slice.call(body.children).forEach(function(el){ if(el!==grid){ el.classList.add('v52435-escondido'); el.style.display='none'; } }); }
  if(body && !document.getElementById('impf-aviso-serial')){
    var d=document.createElement('div');
    d.id='impf-aviso-serial';
    d.style.cssText='margin:8px 0;padding:10px 12px;border-radius:11px;background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;font-size:12.5px;font-weight:700';
    d.textContent='Passo 1: informe o serial da impressora e aperte Avançar. Se ela já existir no sistema, o restante se preenche sozinho.';
    body.insertBefore(d, grid);
  }
  var foot=document.getElementById('modal-footer'); if(!foot) return;
  var salvarBtn=null;
  foot.querySelectorAll('button').forEach(function(b){ if(/salvar/i.test(b.textContent||'')) salvarBtn=b; });
  if(salvarBtn){ salvarBtn.setAttribute('data-v52435','1'); salvarBtn.style.display='none'; }
  var btn=document.createElement('button');
  btn.id='impf-avancar';
  btn.textContent='Avançar';
  btn.className=(salvarBtn&&salvarBtn.className)||'neo-btn primary';
  btn.onclick=function(){
    var ch=txt(document.getElementById('impf-serie')&&document.getElementById('impf-serie').value);
    if(!ch){ aviso('Informe o serial da impressora.','Serial primeiro'); return; }
    var eq0=(typeof db!=='undefined')?acharEquipPorSerial(db, ch, sessao().empresaId):null;
    reexibirTudo();
    var bt=document.getElementById('impf-avancar'); if(bt) bt.remove();
    if(eq0){
      var mod=document.getElementById('impf-modelo'); if(mod && !txt(mod.value)) mod.value=eq0.modelo||'';
      var pt=document.getElementById('impf-patr'); if(pt && !txt(pt.value)) pt.value=eq0.patrimonio||'';
      document.getElementById('impf-serie').value=eq0.serie||ch;
      aviso('Serial reconhecido — dados preenchidos. Confira, complete os medidores e salve.','Impressora encontrada');
    }
  };
  foot.appendChild(btn);
  if(serie.focus) serie.focus();
}

function injetaRemanejadas(contratoId){
  if(document.getElementById('v52435-remanejadas')) return;
  var body=document.getElementById('modal-body'); if(!body) return;
  var lista=(typeof db!=='undefined'?(db.parque||[]):[]).filter(function(p){
    return p && p.contratoId===contratoId && p.status==='remanejada';
  });
  if(!lista.length) return;
  var div=document.createElement('div');
  div.id='v52435-remanejadas';
  div.className='border rounded-xl overflow-hidden';
  var linhas=lista.map(function(p){
    var fr=p.frozen||{};
    var dest=p.remanejadoParaClienteId?(' → remanejada para '+esc(nomeCli(p.remanejadoParaClienteId))):'';
    return '<tr style="border-top:1px solid #e2e8f0;height:38px">'
      +'<td style="padding:6px 14px;font-family:monospace;font-weight:800;color:#64748b">'+esc(fr.patrimonio||'-')+'</td>'
      +'<td style="padding:6px 14px;font-weight:700">'+esc(fr.modelo||'')+'</td>'
      +'<td style="padding:6px 14px;font-family:monospace">'+esc(fr.serie||'')+'</td>'
      +'<td style="padding:6px 14px;color:#64748b;font-size:12px">'+esc(fr.setor||'')+dest+'</td>'
      +'<td style="padding:6px 14px"><span style="background:#e2e8f0;color:#475569;padding:3px 10px;border-radius:999px;font-size:10.5px;font-weight:800;text-transform:uppercase">remanejada</span></td>'
      +'</tr>';
  }).join('');
  div.innerHTML='<div style="background:#f8fafc;padding:11px 16px;border-bottom:1px solid #e2e8f0;font-weight:800;font-size:13px;color:#475569">Remanejadas (histórico congelado — não edita, não entra no mensal)</div>'
    +'<div style="max-height:220px;overflow:auto"><table style="width:100%;font-size:12.5px;border-collapse:collapse"><tbody>'+linhas+'</tbody></table></div>';
  body.appendChild(div);
}

if(typeof window.abrirModalEquipamentoContrato==='function' && !window.abrirModalEquipamentoContrato.__v52435rem){
  var oldAbrir=window.abrirModalEquipamentoContrato;
  window.abrirModalEquipamentoContrato=function(contratoId, parqueId){
    if(parqueId && typeof db!=='undefined'){
      var pv=(db.parque||[]).find(function(x){ return x.id===parqueId; });
      if(pv && pv.status==='remanejada'){ aviso('Impressora remanejada. Histórico congelado — não edita.'); return; }
    }
    var r=oldAbrir.apply(this, arguments);
    if(!parqueId){
      setTimeout(passoSerialNovo, 0);
      setTimeout(passoSerialNovo, 120);
    }
    return r;
  };
  window.abrirModalEquipamentoContrato.__v52435rem=true;
}

if(typeof window.salvarImpressoraContrato==='function' && !window.salvarImpressoraContrato.__v52435rem){
  var oldSal=window.salvarImpressoraContrato;
  window.salvarImpressoraContrato=function(contratoId, parqueId){
    if(parqueId){
      if(typeof db!=='undefined'){
        var pp=(db.parque||[]).find(function(x){ return x.id===parqueId; });
        if(pp && pp.status==='remanejada'){ aviso('Impressora remanejada. Histórico congelado — não edita.'); return; }
      }
      return oldSal.apply(this, arguments);
    }
    if(typeof db==='undefined') return oldSal.apply(this, arguments);
    var c=(db.contratos||[]).find(function(x){ return x.id===contratoId; });
    if(!c) return oldSal.apply(this, arguments);
    var serie=txt(document.getElementById('impf-serie')&&document.getElementById('impf-serie').value);
    if(!serie) return oldSal.apply(this, arguments);
    var eqOld=acharEquipPorSerial(db, serie, sessao().empresaId);
    if(!eqOld) return oldSal.apply(this, arguments);
    var outro=parqueAtivoOutroCliente(db, eqOld, c.clienteId);
    var executar=function(){
      if(outro){
        outro.status='remanejada';
        outro.frozen=snapshotFrozen(eqOld, outro);
        outro.remanejadoEm=new Date().toISOString();
        outro.remanejadoParaContratoId=c.id;
        outro.remanejadoParaClienteId=c.clienteId;
      }
      var idsAntes={};
      (db.equipamentos||[]).forEach(function(x){ if(x) idsAntes[x.id]=1; });
      var r=oldSal.apply(window, [contratoId, parqueId]);
      var duplicata=(db.equipamentos||[]).find(function(x){ return x && x.id && !idsAntes[x.id]; });
      if(duplicata){
        eqOld.modelo=duplicata.modelo||eqOld.modelo;
        eqOld.patrimonio=duplicata.patrimonio||eqOld.patrimonio;
        eqOld.serie=duplicata.serie||eqOld.serie;
        eqOld.tipo=duplicata.tipo||eqOld.tipo;
        eqOld.status=duplicata.status||eqOld.status;
        eqOld.atualizadoEm=new Date().toISOString();
        var prqNovo=(db.parque||[]).find(function(x){ return x && x.equipamentoId===duplicata.id && x.contratoId===c.id; });
        if(prqNovo) prqNovo.equipamentoId=eqOld.id;
        c.equipamentos=(c.equipamentos||[]).map(function(id){ return id===duplicata.id?eqOld.id:id; });
        db.equipamentos=(db.equipamentos||[]).filter(function(x){ return x!==duplicata; });
        try{ if(typeof saveDB==='function') saveDB(); }catch(e){}
        if(typeof openContratoCompleto==='function') openContratoCompleto(c.id);
      }
      if(outro) aviso('impressora remanejada com sucesso');
      else aviso('impressora cadastrada com sucesso (serial reconhecido — sem duplicar)');
      return r;
    };
    if(outro){
      var cont=n(eqOld.contadorPB)||n(outro.medidores&&outro.medidores.pretoA4&&(outro.medidores.pretoA4.contadorAnterior||outro.medidores.pretoA4.contadorInicial));
      if(typeof window.confirmSistema==='function'){
        window.confirmSistema(msgRemanejar(nomeCli(outro.clienteId), cont),'Remanejar impressora').then(function(ok){ if(ok) executar(); });
        return;
      }
      return;
    }
    return executar();
  };
  window.salvarImpressoraContrato.__v52435rem=true;
}

if(typeof window.openContratoCompleto==='function' && !window.openContratoCompleto.__v52435rem){
  var oldCC=window.openContratoCompleto;
  window.openContratoCompleto=function(contratoId){
    var r=oldCC.apply(this, arguments);
    setTimeout(function(){ injetaRemanejadas(contratoId); }, 0);
    setTimeout(function(){ injetaRemanejadas(contratoId); }, 150);
    return r;
  };
  window.openContratoCompleto.__v52435rem=true;
}

console.log('[DIGICOPY] ajustes_v52435_impressora_remanejo_final_patch.js v5.24.35 carregado — P7 (serial primeiro + remanejo) ativo');
})();
