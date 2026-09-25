// ═══════════════════════════════════════════════════════════════════════════
// v5.22.45 — Impressora no contrato:
//            1) pesquisa só o serial; 2) abre a tela completa (com ou sem
//            cadastro em outro cliente); 3) se achar, preenche o resto;
//            4) aviso de remanejo só no SALVAR; 5) nova sem outro contrato
//            só confirma sucesso; 6) Ocultar / Desocultar (status oculta).
// ═══════════════════════════════════════════════════════════════════════════
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
function parqueOutroCliente(dbRef, eq, clienteId){
  if(!eq) return null;
  return parquesDoEquip(dbRef, eq.id).find(function(p){
    if(!p || !p.clienteId || p.clienteId===clienteId) return false;
    var st = String(p.status||'ativo');
    return st==='ativo' || st==='oculta';
  })||null;
}
function snapshotFrozen(eq, p){
  return {
    modelo: (eq&&eq.modelo)||'',
    serie: (eq&&eq.serie)||'',
    patrimonio: (eq&&eq.patrimonio)||'',
    setor: (p&&p.setor)||'',
    localInstalacao: (p&&(p.localInstalacao||p.enderecoInstalacao))||'',
    contadorPB: n(eq&&eq.contadorPB),
    contadorCor: n(eq&&eq.contadorCor),
    congeladoEm: new Date().toISOString()
  };
}
function msgRemanejar(nomeCliente, contador){
  return 'impressora cadastrada em '+(nomeCliente||'outro cliente')+' com o contador '+(contador==null?'-':contador)+', deseja remanejar essa impressora pra esse cadastro?';
}
function msgOcultar(){
  return 'Deseja remanejar essa impressora? Ela vai para Remanejadas com status oculta.';
}
function msgDesocultar(){
  return 'Deseja desocultar essa impressora? Ela volta ao cadastro normal.';
}

window.IMPRESSORA_SERIAL_OCULTAR_V52245_PURE = {
  acharEquipPorSerial: acharEquipPorSerial,
  parqueOutroCliente: parqueOutroCliente,
  snapshotFrozen: snapshotFrozen,
  msgRemanejar: msgRemanejar,
  msgOcultar: msgOcultar,
  msgDesocultar: msgDesocultar
};

if(typeof document==='undefined') return;

function aviso(m){ if(typeof window.lfbAlert==='function') return window.lfbAlert(m,'Impressora'); if(typeof toast==='function') toast(m,'info'); }
function nomeCli(id){
  if(typeof db==='undefined') return '';
  var c=(db.clientes||[]).find(function(x){ return x.id===id; });
  return (c&&c.nome)||'outro cliente';
}

function esconderDepoisSerial(){
  ['kr-imp-modelo','kr-imp-patr','kr-imp-serie','kr-imp-dept','kr-imp-local'].forEach(function(id){
    var el=document.getElementById(id);
    if(!el) return;
    var box = el.closest('.grid') || el.parentElement;
    if(box){ box.classList.add('v52245-depois-serial'); box.style.display='none'; }
  });
  document.querySelectorAll('#modal-body .border.rounded-xl.p-3').forEach(function(el){
    el.classList.add('v52245-depois-serial');
    el.style.display='none';
  });
}
function mostrarDepoisSerial(){
  document.querySelectorAll('.v52245-depois-serial, .v52243-depois-serial').forEach(function(el){
    el.style.display='';
    el.classList.remove('v52245-depois-serial');
    el.classList.remove('v52243-depois-serial');
  });
}

function injetarOcultar(parqueId){
  if(!parqueId || document.getElementById('kr-imp-ocultar-box')) return;
  if(typeof db==='undefined') return;
  var p = (db.parque||[]).find(function(x){ return x.id===parqueId; });
  if(!p) return;
  var body = document.getElementById('modal-body');
  if(!body) return;
  var box = document.createElement('label');
  box.id = 'kr-imp-ocultar-box';
  box.className = 'flex items-center gap-2 rounded-xl border bg-slate-50 p-3 font-bold text-[13px]';
  if(p.status==='oculta'){
    box.innerHTML = '<input id="kr-imp-desocultar" type="checkbox" class="w-4 h-4"> Desocultar esta impressora';
  } else {
    box.innerHTML = '<input id="kr-imp-ocultar" type="checkbox" class="w-4 h-4"> Ocultar';
  }
  body.appendChild(box);
}

function passoSerialNovo(){
  if(!window.__impPassoSerial) return;
  if(!document.getElementById('kr-imp-busca')) return;
  esconderDepoisSerial();
  var foot = document.getElementById('modal-footer');
  if(!foot) return;
  var salvar = null;
  foot.querySelectorAll('button').forEach(function(b){
    if(/salvar/i.test(b.textContent||'')) salvar = b;
  });
  if(salvar) salvar.style.display='none';
  function avancar(){
    var chave = txt(document.getElementById('kr-imp-busca')&&document.getElementById('kr-imp-busca').value);
    if(!chave){ aviso('Informe o serial.'); return; }
    if(typeof window.reconhecerImpressoraContrato==='function') window.reconhecerImpressoraContrato();
    mostrarDepoisSerial();
    var btn = document.getElementById('kr-imp-avancar');
    if(btn) btn.remove();
    if(salvar) salvar.style.display='';
    window.__impPassoSerial = false;
  }
  var busca = document.querySelector('#modal-body button[onclick*="reconhecerImpressoraContrato"]');
  if(busca && !busca.__v52245av){
    busca.__v52245av = true;
    busca.addEventListener('click', function(){ setTimeout(avancar, 0); });
  }
  var inp = document.getElementById('kr-imp-busca');
  if(inp && !inp.__v52245av){
    inp.__v52245av = true;
    inp.addEventListener('keydown', function(e){
      if(e.key==='Enter'){ e.preventDefault(); avancar(); }
    });
  }
  if(!document.getElementById('kr-imp-avancar')){
    var btn = document.createElement('button');
    btn.id='kr-imp-avancar';
    btn.type='button';
    btn.className='h-10 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold';
    btn.textContent='Avançar';
    btn.onclick=avancar;
    foot.appendChild(btn);
  }
}

if(typeof window.abrirModalEquipamentoContrato==='function' && !window.abrirModalEquipamentoContrato.__v52245imp){
  var oldAbrir = window.abrirModalEquipamentoContrato;
  window.abrirModalEquipamentoContrato = function(contratoId, parqueId){
    if(parqueId && typeof db!=='undefined'){
      var p = (db.parque||[]).find(function(x){ return x.id===parqueId; });
      if(p && p.status==='remanejada'){
        aviso('Impressora remanejada. Histórico congelado — não edita.');
        return;
      }
    }
    window.__impPassoSerial = !parqueId;
    var r = oldAbrir.apply(this, arguments);
    try{
      if(!parqueId){
        setTimeout(passoSerialNovo, 0);
        setTimeout(passoSerialNovo, 80);
      } else {
        setTimeout(function(){ injetarOcultar(parqueId); }, 0);
        setTimeout(function(){ injetarOcultar(parqueId); }, 80);
      }
    }catch(e){}
    return r;
  };
  window.abrirModalEquipamentoContrato.__v52245imp = true;
}

function marcarRemanejo(outro, eq, contrato){
  if(!outro) return;
  outro.status = 'remanejada';
  outro.frozen = snapshotFrozen(eq, outro);
  outro.remanejadoEm = new Date().toISOString();
  outro.remanejadoParaContratoId = contrato.id;
  outro.remanejadoParaClienteId = contrato.clienteId;
}

if(typeof window.salvarImpressoraContrato==='function' && !window.salvarImpressoraContrato.__v52245imp){
  var oldSal = window.salvarImpressoraContrato;
  window.salvarImpressoraContrato = function(contratoId, parqueId){
    var s = typeof getSession==='function'?getSession():null;
    if(!s || typeof db==='undefined') return oldSal.apply(this, arguments);
    var c = (db.contratos||[]).find(function(x){ return x.id===contratoId; });
    if(!c) return oldSal.apply(this, arguments);

    var pe = parqueId ? (db.parque||[]).find(function(x){ return x.id===parqueId; }) : null;
    if(pe && pe.status==='remanejada'){ aviso('Impressora remanejada. Histórico congelado — não edita.'); return; }

    var querOcultar = !!(document.getElementById('kr-imp-ocultar')&&document.getElementById('kr-imp-ocultar').checked);
    var querDesocultar = !!(document.getElementById('kr-imp-desocultar')&&document.getElementById('kr-imp-desocultar').checked);

    var serie = txt(document.getElementById('kr-imp-serie')&&document.getElementById('kr-imp-serie').value)
      || txt(document.getElementById('kr-imp-busca')&&document.getElementById('kr-imp-busca').value);
    var eq = acharEquipPorSerial(db, serie, s.empresaId);
    var outro = parqueOutroCliente(db, eq, c.clienteId);

    var gravar = function(depois){
      var r = oldSal.apply(window, [contratoId, parqueId]);
      if(typeof depois==='function') depois();
      return r;
    };

    if(parqueId && pe && querOcultar){
      var goOcultar = function(){
        gravar(function(){
          var atual = (db.parque||[]).find(function(x){ return x.id===parqueId; });
          if(atual){
            atual.status = 'oculta';
            atual.ocultoEm = new Date().toISOString();
          }
          if(typeof saveDB==='function') saveDB();
        });
      };
      if(typeof window.confirmSistema==='function'){
        window.confirmSistema(msgOcultar(),'Ocultar impressora').then(function(ok){ if(ok) goOcultar(); });
        return;
      }
      return;
    }

    if(parqueId && pe && pe.status==='oculta' && querDesocultar){
      var goShow = function(){
        gravar(function(){
          var atual = (db.parque||[]).find(function(x){ return x.id===parqueId; });
          if(atual){
            atual.status = 'ativo';
            atual.ocultoEm = null;
            atual.desocultoEm = new Date().toISOString();
          }
          if(typeof saveDB==='function') saveDB();
          if(typeof window.openContratoCompleto==='function') window.openContratoCompleto(contratoId);
        });
      };
      if(typeof window.confirmSistema==='function'){
        window.confirmSistema(msgDesocultar(),'Desocultar impressora').then(function(ok){ if(ok) goShow(); });
        return;
      }
      return;
    }

    if(outro && !parqueId){
      var cont = n((eq&&eq.contadorPB) || (outro.medidores&&outro.medidores.pretoA4&&outro.medidores.pretoA4.contadorAnterior));
      var msg = msgRemanejar(nomeCli(outro.clienteId), cont);
      var goRem = function(){
        marcarRemanejo(outro, eq, c);
        if(typeof saveDB==='function') saveDB();
        gravar();
      };
      if(typeof window.confirmSistema==='function'){
        window.confirmSistema(msg,'Remanejar impressora').then(function(ok){ if(ok) goRem(); });
        return;
      }
      return;
    }

    return gravar();
  };
  window.salvarImpressoraContrato.__v52245imp = true;
}

function htmlLista(c, lista, titulo, editar){
  return '<div class="border rounded-xl overflow-hidden mt-3"><div class="bg-slate-50 px-4 py-3 border-b"><b>'+esc(titulo)+'</b></div>'
    +'<div class="overflow-auto max-h-[280px]"><table class="w-full text-left text-[12.5px]"><thead class="bg-slate-50 border-b text-[10.5px] uppercase font-bold text-slate-500"><tr>'
    +'<th class="px-4 py-2.5">Patrimônio</th><th class="px-4 py-2.5">Modelo</th><th class="px-4 py-2.5">Serial</th><th class="px-4 py-2.5">Departamento / Local</th><th class="px-4 py-2.5">Status</th>'
    +(editar?'<th class="px-4 py-2.5 text-right">Editar</th>':'')+'</tr></thead><tbody class="divide-y">'
    +(lista.map(function(p){
      var e = ((typeof db!=='undefined'&&db.equipamentos)||[]).find(function(x){ return x.id===p.equipamentoId; })||{};
      var fr = p.frozen||{};
      var pode = editar || p.status==='oculta';
      var pat = pode ? (e.patrimonio||p.patrimonio||'-') : (fr.patrimonio||e.patrimonio||'-');
      var mod = pode ? (e.modelo||'') : (fr.modelo||e.modelo||'');
      var ser = pode ? (e.serie||'') : (fr.serie||e.serie||'');
      var set = pode ? (p.setor||'Geral') : (fr.setor||p.setor||'Geral');
      var loc = pode ? (p.localInstalacao||'') : (fr.localInstalacao||p.localInstalacao||'');
      var trOpen = pode ? 'ondblclick="abrirModalEquipamentoContrato(\''+(p.contratoId||c.id)+'\',\''+p.id+'\')" class="hover:bg-slate-50 cursor-pointer"' : 'class="bg-slate-50 text-slate-500"';
      return '<tr '+trOpen+'><td class="px-4 py-2.5 font-mono font-bold text-[#0a1e8a]">'+esc(pat)+'</td><td class="px-4 py-2.5 font-semibold">'+esc(mod)+'</td><td class="px-4 py-2.5 font-mono">'+esc(ser)+'</td><td class="px-4 py-2.5">'+esc(set)+'<br><span class="text-[11px] text-slate-500">'+esc(loc)+'</span></td><td class="px-4 py-2.5"><span class="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-bold uppercase">'+esc(p.status||'ativo')+'</span></td>'
        +(editar||p.status==='oculta'?'<td class="px-4 py-2.5 text-right"><button onclick="abrirModalEquipamentoContrato(\''+(p.contratoId||c.id)+'\',\''+p.id+'\')" class="w-8 h-8 rounded-lg hover:bg-slate-100"><i class="ph ph-pencil"></i></button></td>':'')
        +'</tr>';
    }).join('') || '<tr><td colspan="6" class="p-6 text-center text-slate-400">Nenhuma</td></tr>')
    +'</tbody></table></div></div>';
}

function pintarListas(contratoId){
  if(typeof db==='undefined') return;
  var c = (db.contratos||[]).find(function(x){ return x.id===contratoId; });
  if(!c) return;
  var body = document.getElementById('modal-body');
  if(!body) return;
  var todas = (db.parque||[]).filter(function(p){
    return p && (p.contratoId===c.id || (c.clienteId && p.clienteId===c.clienteId));
  });
  var ativas = todas.filter(function(p){ return p.status==='ativo'; });
  var rem = todas.filter(function(p){ return p.status==='remanejada' || p.status==='oculta'; });
  var html = htmlLista(c, ativas, 'Impressoras ativas', true) + htmlLista(c, rem, 'Impressoras remanejadas (histórico)', false);
  var old = document.getElementById('v52245-listas-imp') || document.getElementById('v52243-listas-imp') || document.getElementById('v52242-listas-imp');
  if(old){ old.id='v52245-listas-imp'; old.innerHTML = html; return; }
  var wrap = document.createElement('div');
  wrap.id = 'v52245-listas-imp';
  wrap.innerHTML = html;
  var cand = null;
  body.querySelectorAll('.border.rounded-xl.overflow-hidden').forEach(function(el){
    if(/impressora/i.test(el.textContent||'')) cand = el;
  });
  if(cand) cand.replaceWith(wrap);
  else body.appendChild(wrap);
}

if(typeof window.openContratoCompleto==='function' && !window.openContratoCompleto.__v52245imp){
  var oldOpen = window.openContratoCompleto;
  window.openContratoCompleto = function(contratoId){
    var r = oldOpen.apply(this, arguments);
    try{
      setTimeout(function(){ pintarListas(contratoId); }, 0);
      setTimeout(function(){ pintarListas(contratoId); }, 80);
    }catch(e){}
    return r;
  };
  window.openContratoCompleto.__v52245imp = true;
}

if(window.CONTRATOS_REFINO_PURE && typeof window.CONTRATOS_REFINO_PURE.parquesDoClienteContrato==='function' && !window.CONTRATOS_REFINO_PURE.parquesDoClienteContrato.__v52245){
  var oldP = window.CONTRATOS_REFINO_PURE.parquesDoClienteContrato;
  window.CONTRATOS_REFINO_PURE.parquesDoClienteContrato = function(dbRef, contrato, opts){
    var list = oldP(dbRef, contrato, opts)||[];
    if(opts && opts.todos) return list;
    return list.filter(function(p){ return p && p.status!=='remanejada' && p.status!=='oculta'; });
  };
  window.CONTRATOS_REFINO_PURE.parquesDoClienteContrato.__v52245 = true;
}

console.log('[DIGICOPY] v5.22.45 impressora: serial, remanejo no salvar, ocultar');
})();
