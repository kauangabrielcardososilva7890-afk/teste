// ═══════════════════════════════════════════════════════════════════════════
// v5.22.42 — Impressora no contrato: serial primeiro; remanejo com aviso;
//            Ativas vs Remanejadas (histórico congelado, sem editar).
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
    contadorPB: n(eq&&eq.contadorPB),
    contadorCor: n(eq&&eq.contadorCor),
    congeladoEm: new Date().toISOString()
  };
}
function msgRemanejar(nomeCliente, contador){
  return 'impressora cadastrada em '+(nomeCliente||'outro cliente')+' com o contador '+(contador==null?'-':contador)+', deseja remanejar essa impressora pra esse cadastro?';
}

window.IMPRESSORA_REMANEJAR_V52242_PURE = {
  acharEquipPorSerial: acharEquipPorSerial,
  parqueAtivoOutroCliente: parqueAtivoOutroCliente,
  snapshotFrozen: snapshotFrozen,
  msgRemanejar: msgRemanejar
};

if(typeof document==='undefined') return;

function aviso(m){ if(typeof window.lfbAlert==='function') return window.lfbAlert(m,'Impressora'); if(typeof toast==='function') toast(m,'info'); }
function nomeCli(id){
  if(typeof db==='undefined') return '';
  var c=(db.clientes||[]).find(function(x){ return x.id===id; });
  return (c&&c.nome)||'outro cliente';
}

if(typeof window.abrirModalEquipamentoContrato==='function' && !window.abrirModalEquipamentoContrato.__v52242rem){
  var oldAbrir = window.abrirModalEquipamentoContrato;
  window.abrirModalEquipamentoContrato = function(contratoId, parqueId){
    if(parqueId && typeof db!=='undefined'){
      var p = (db.parque||[]).find(function(x){ return x.id===parqueId; });
      if(p && p.status==='remanejada'){
        aviso('Impressora remanejada. Histórico congelado — não edita.');
        return;
      }
    }
    var r = oldAbrir.apply(this, arguments);
    try{
      if(!parqueId){
        window.__impPassoSerial = true;
        ['kr-imp-modelo','kr-imp-patr','kr-imp-serie','kr-imp-dept','kr-imp-local'].forEach(function(id){
          var el=document.getElementById(id); if(el){ el.closest('div') && (el.closest('.grid')||el.parentElement).classList.add('v52242-depois-serial'); }
        });
        var med = document.querySelector('#modal-body .border.rounded-xl.p-3');
        if(med) med.classList.add('v52242-depois-serial');
        document.querySelectorAll('.v52242-depois-serial').forEach(function(el){ el.style.display='none'; });
        var foot = document.getElementById('modal-footer');
        if(foot && !document.getElementById('kr-imp-avancar')){
          var btn = document.createElement('button');
          btn.id='kr-imp-avancar';
          btn.className='h-10 px-6 rounded-xl bg-[#0a1e8a] text-white font-bold';
          btn.textContent='Avançar';
          btn.onclick=function(){
            var chave = txt(document.getElementById('kr-imp-busca')&&document.getElementById('kr-imp-busca').value);
            if(!chave){ aviso('Informe o serial.'); return; }
            if(typeof window.reconhecerImpressoraContrato==='function') window.reconhecerImpressoraContrato();
            document.querySelectorAll('.v52242-depois-serial').forEach(function(el){ el.style.display=''; });
            btn.remove();
            window.__impPassoSerial = false;
          };
          foot.appendChild(btn);
        }
      }
    }catch(e){}
    return r;
  };
  window.abrirModalEquipamentoContrato.__v52242rem = true;
}

if(typeof window.salvarImpressoraContrato==='function' && !window.salvarImpressoraContrato.__v52242rem){
  var oldSal = window.salvarImpressoraContrato;
  window.salvarImpressoraContrato = function(contratoId, parqueId){
    var s = typeof getSession==='function'?getSession():null;
    if(!s || typeof db==='undefined') return oldSal.apply(this, arguments);
    var c = (db.contratos||[]).find(function(x){ return x.id===contratoId; });
    if(!c) return oldSal.apply(this, arguments);
    if(parqueId){
      var pe = (db.parque||[]).find(function(x){ return x.id===parqueId; });
      if(pe && pe.status==='remanejada'){ aviso('Impressora remanejada. Histórico congelado — não edita.'); return; }
    }
    var serie = txt(document.getElementById('kr-imp-serie')&&document.getElementById('kr-imp-serie').value)
      || txt(document.getElementById('kr-imp-busca')&&document.getElementById('kr-imp-busca').value);
    var eq = acharEquipPorSerial(db, serie, s.empresaId);
    var outro = parqueAtivoOutroCliente(db, eq, c.clienteId);
    if(outro && !parqueId){
      var cont = n((eq&&eq.contadorPB) || (outro.medidores&&outro.medidores.pretoA4&&outro.medidores.pretoA4.contadorAnterior));
      var msg = msgRemanejar(nomeCli(outro.clienteId), cont);
      var run = function(){
        outro.status = 'remanejada';
        outro.frozen = snapshotFrozen(eq, outro);
        outro.remanejadoEm = new Date().toISOString();
        outro.remanejadoParaContratoId = c.id;
        outro.remanejadoParaClienteId = c.clienteId;
        var r = oldSal.apply(window, [contratoId, parqueId]);
        aviso('impressora cadastrada com sucesso');
        return r;
      };
      if(typeof window.confirmSistema==='function'){
        window.confirmSistema(msg,'Remanejar impressora').then(function(ok){ if(ok) run(); });
        return;
      }
      return;
    }
    var r = oldSal.apply(this, arguments);
    if(!parqueId) aviso('impressora cadastrada com sucesso');
    return r;
  };
  window.salvarImpressoraContrato.__v52242rem = true;
}

function htmlLista(c, lista, titulo, editar){
  return '<div class="border rounded-xl overflow-hidden mt-3"><div class="bg-slate-50 px-4 py-3 border-b"><b>'+esc(titulo)+'</b></div>'
    +'<div class="overflow-auto max-h-[280px]"><table class="w-full text-left text-[12.5px]"><thead class="bg-slate-50 border-b text-[10.5px] uppercase font-bold text-slate-500"><tr>'
    +'<th class="px-4 py-2.5">Patrimônio</th><th class="px-4 py-2.5">Modelo</th><th class="px-4 py-2.5">Serial</th><th class="px-4 py-2.5">Departamento / Local</th><th class="px-4 py-2.5">Status</th>'
    +(editar?'<th class="px-4 py-2.5 text-right">Editar</th>':'')+'</tr></thead><tbody class="divide-y">'
    +(lista.map(function(p){
      var e = ((typeof db!=='undefined'&&db.equipamentos)||[]).find(function(x){ return x.id===p.equipamentoId; })||{};
      var fr = p.frozen||{};
      var pat = editar ? (e.patrimonio||p.patrimonio||'-') : (fr.patrimonio||e.patrimonio||'-');
      var mod = editar ? (e.modelo||'') : (fr.modelo||e.modelo||'');
      var ser = editar ? (e.serie||'') : (fr.serie||e.serie||'');
      var set = editar ? (p.setor||'Geral') : (fr.setor||p.setor||'Geral');
      var loc = editar ? (p.localInstalacao||'') : (fr.localInstalacao||p.localInstalacao||'');
      var trOpen = editar ? 'ondblclick="abrirModalEquipamentoContrato(\''+(p.contratoId||c.id)+'\',\''+p.id+'\')" class="hover:bg-slate-50 cursor-pointer"' : 'class="bg-slate-50 text-slate-500"';
      return '<tr '+trOpen+'><td class="px-4 py-2.5 font-mono font-bold text-[#0a1e8a]">'+esc(pat)+'</td><td class="px-4 py-2.5 font-semibold">'+esc(mod)+'</td><td class="px-4 py-2.5 font-mono">'+esc(ser)+'</td><td class="px-4 py-2.5">'+esc(set)+'<br><span class="text-[11px] text-slate-500">'+esc(loc)+'</span></td><td class="px-4 py-2.5"><span class="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-bold uppercase">'+esc(p.status||'ativo')+'</span></td>'
        +(editar?'<td class="px-4 py-2.5 text-right"><button onclick="abrirModalEquipamentoContrato(\''+(p.contratoId||c.id)+'\',\''+p.id+'\')" class="w-8 h-8 rounded-lg hover:bg-slate-100"><i class="ph ph-pencil"></i></button></td>':'')
        +'</tr>';
    }).join('') || '<tr><td colspan="6" class="p-6 text-center text-slate-400">Nenhuma</td></tr>')
    +'</tbody></table></div></div>';
}

if(typeof window.openContratoCompleto==='function' && !window.openContratoCompleto.__v52242rem){
  var oldOpen = window.openContratoCompleto;
  window.openContratoCompleto = function(contratoId){
    var r = oldOpen.apply(this, arguments);
    try{
      if(typeof db==='undefined') return r;
      var c = (db.contratos||[]).find(function(x){ return x.id===contratoId; });
      if(!c) return r;
      var body = document.getElementById('modal-body');
      if(!body) return r;
      var todas = (db.parque||[]).filter(function(p){
        return p && (p.contratoId===c.id || (c.clienteId && p.clienteId===c.clienteId));
      });
      var ativas = todas.filter(function(p){ return p.status==='ativo'; });
      var rem = todas.filter(function(p){ return p.status==='remanejada'; });
      var wrap = document.createElement('div');
      wrap.id = 'v52242-listas-imp';
      wrap.innerHTML = htmlLista(c, ativas, 'Impressoras ativas', true) + htmlLista(c, rem, 'Impressoras remanejadas (histórico, sem editar)', false);
      var oldTab = body.querySelector('.border.rounded-xl.overflow-hidden');
      if(oldTab && !document.getElementById('v52242-listas-imp')){
        oldTab.replaceWith(wrap);
      } else if(!document.getElementById('v52242-listas-imp')){
        body.appendChild(wrap);
      }
    }catch(e){}
    return r;
  };
  window.openContratoCompleto.__v52242rem = true;
}

if(window.CONTRATOS_REFINO_PURE && typeof window.CONTRATOS_REFINO_PURE.parquesDoClienteContrato==='function' && !window.CONTRATOS_REFINO_PURE.parquesDoClienteContrato.__v52242){
  var oldP = window.CONTRATOS_REFINO_PURE.parquesDoClienteContrato;
  window.CONTRATOS_REFINO_PURE.parquesDoClienteContrato = function(dbRef, contrato, opts){
    var list = oldP(dbRef, contrato, opts)||[];
    if(opts && opts.todos) return list;
    return list.filter(function(p){ return p && p.status==='ativo'; });
  };
  window.CONTRATOS_REFINO_PURE.parquesDoClienteContrato.__v52242 = true;
}

console.log('[DIGICOPY] v5.22.42 impressora: remanejo + ativas/remanejadas');
})();
