// ═══════════════════════════════════════════════════════════════════════════
// v5.22.37 — Filtros de busca em Locação → Contratos
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

var FILTROS = [
  ['todos','Todos'],
  ['nome','Nome'],
  ['cidade','Cidade'],
  ['equipamento','Equipamento'],
  ['patrimonio','Patrimônio'],
  ['serial','Serial'],
  ['departamento','Departamento'],
  ['chamados_abertos','Chamados Abertos'],
  ['cod_locacao','Cod Locação'],
  ['cod_cliente','Cod Cliente'],
  ['endereco_impressora','Endereço Impressora'],
  ['vencidos','Contratos Vencidos'],
  ['vencer_30','Contratos Vencer 30 Dias'],
  ['leituras_hoje','Leituras Lançar Hoje'],
  ['cod_leitura','Cod Leitura'],
  ['nao_faturados_mes','Não Faturados esse Mês'],
  ['faturados_mes','Faturados esse Mês'],
  ['nao_faturados_passado','Não Faturados Mês passado'],
  ['mes_fixo','Fatura por Mês Fixo'],
  ['franquia_individual','Fatura Franquia Individual']
];

function txt(v){ return String(v==null?'':v).trim(); }
function up(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
function soDig(v){ return txt(v).replace(/\D/g,''); }
function codigoNorm(v){ var d=soDig(v); if(!d) return ''; return d.replace(/^0+/,'')||'0'; }
function ym(d){ if(!d) return ''; var x=new Date(d); if(isNaN(x)) return String(d).slice(0,7); return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0'); }
function hojeISO(){ return new Date().toISOString().slice(0,10); }
function mesAtual(){ return hojeISO().slice(0,7); }
function mesPassado(){
  var d=new Date(); d.setDate(1); d.setMonth(d.getMonth()-1);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
}

function maquinas(c){
  if(!c || typeof db==='undefined') return [];
  return (db.parque||[]).filter(function(p){
    return p && (p.contratoId===c.id || (c.clienteId && p.clienteId===c.clienteId));
  });
}
function eqDe(p){
  if(!p || typeof db==='undefined') return {};
  return (db.equipamentos||[]).find(function(e){ return e.id===p.equipamentoId; })||{};
}
function clienteDe(c){
  if(!c || typeof db==='undefined') return {};
  return (db.clientes||[]).find(function(x){ return x.id===c.clienteId; })||{};
}
// Cidade do CLIENTE do contrato. Cada cadastro guardou com um nome
// diferente ao longo do tempo, então aceita todos.
function cidadeDe(c){
  var cl=clienteDe(c);
  return txt(cl.cidade || cl.municipio || cl.cidadeNome || (cl.endereco && cl.endereco.cidade) || '');
}
function chamadosAbertos(c){
  if(!c || typeof db==='undefined') return 0;
  return (db.os||[]).filter(function(o){
    if(!o) return false;
    if(o.contratoId && o.contratoId===c.id) return !/conclu|cancel|fechad/i.test(o.status||'');
    return o.clienteId===c.clienteId && !/conclu|cancel|fechad/i.test(o.status||'');
  }).length;
}
function leiturasDo(c){
  if(!c || typeof db==='undefined') return [];
  return (db.leituras||[]).filter(function(l){
    return l && (l.contratoId===c.id || (c.clienteId && l.clienteId===c.clienteId));
  });
}
function leituraFaturada(l){ return /faturad/i.test(String(l&&l.status||'')); }
function temLeituraMes(c, mes){
  return leiturasDo(c).some(function(l){ return ym(l.dataLeitura||l.criadoEm||l.dataInicio)===mes; });
}
function temFaturadaMes(c, mes){
  return leiturasDo(c).some(function(l){ return leituraFaturada(l) && ym(l.dataLeitura||l.criadoEm||l.faturadoEm)===mes; });
}
function modalidadeDe(c){
  var out=[];
  maquinas(c).forEach(function(p){
    var meds=p.medidores||p.medidoresConfig||{};
    Object.keys(meds).forEach(function(k){
      var m=meds[k];
      if(m && m.ativo!==false && m.modalidade) out.push(String(m.modalidade));
    });
    if(p.modalidade) out.push(String(p.modalidade));
  });
  return out.join(' ').toLowerCase();
}

function filtraContratos(list, campo, q){
  var arr=list||[];
  var termo=up(q);
  var mes=mesAtual();
  var pass=mesPassado();
  var hoje=hojeISO();
  function passaTexto(c){
    if(!termo) return true;
    var cl=clienteDe(c);
    var maqs=maquinas(c);
    if(campo==='nome') return up(cl.nome).indexOf(termo)>=0 || up(cl.fantasia).indexOf(termo)>=0;
    if(campo==='cidade') return up(cidadeDe(c)).indexOf(termo)>=0;
    if(campo==='equipamento') return maqs.some(function(p){ return up(eqDe(p).modelo).indexOf(termo)>=0; });
    if(campo==='patrimonio') return maqs.some(function(p){ return up(eqDe(p).patrimonio||p.patrimonio).indexOf(termo)>=0; });
    if(campo==='serial') return maqs.some(function(p){ return up(eqDe(p).serie).indexOf(termo)>=0; });
    if(campo==='departamento') return maqs.some(function(p){ return up(p.setor||p.departamento).indexOf(termo)>=0; });
    if(campo==='cod_locacao') return codigoNorm(c.numero)===codigoNorm(q) || codigoNorm(c.codigo)===codigoNorm(q) || codigoNorm(c.codigoAntigo)===codigoNorm(q);
    if(campo==='cod_cliente') return codigoNorm(cl.codigo)===codigoNorm(q) || codigoNorm(cl.codigoAntigo)===codigoNorm(q);
    if(campo==='endereco_impressora') return maqs.some(function(p){ return up(p.localInstalacao||p.enderecoInstalacao||p.endereco).indexOf(termo)>=0; });
    if(campo==='cod_leitura') return leiturasDo(c).some(function(l){ return codigoNorm(l.numero)===codigoNorm(q) || codigoNorm(l.codigoAntigo)===codigoNorm(q); });
    return true;
  }
  return arr.filter(function(c){
    if(!c || c.status==='excluido') return false;
    if(campo==='todos' || !campo){
      if(!termo) return true;
      var cl=clienteDe(c);
      var maqs=maquinas(c);
      return [c.numero,c.codigo,cl.nome,cl.fantasia].some(function(v){ return up(v).indexOf(termo)>=0; })
        || maqs.some(function(p){ var e=eqDe(p); return up(e.modelo).indexOf(termo)>=0 || up(e.patrimonio).indexOf(termo)>=0; });
    }
    if(campo==='chamados_abertos') return chamadosAbertos(c)>0;
    if(campo==='vencidos'){
      var fim=String(c.dataFim||'').slice(0,10);
      return !!fim && fim<hoje && !/encerr|inativ/i.test(c.status||'');
    }
    if(campo==='vencer_30'){
      var f2=String(c.dataFim||'').slice(0,10);
      if(!f2) return false;
      var lim=new Date(); lim.setDate(lim.getDate()+30);
      return f2>=hoje && f2<=lim.toISOString().slice(0,10);
    }
    if(campo==='leituras_hoje'){
      return !temLeituraMes(c, mes) || leiturasDo(c).some(function(l){ return String(l.dataLeitura||l.criadoEm||'').slice(0,10)===hoje; });
    }
    if(campo==='nao_faturados_mes') return !temFaturadaMes(c, mes);
    if(campo==='faturados_mes') return temFaturadaMes(c, mes);
    if(campo==='nao_faturados_passado') return !temFaturadaMes(c, pass);
    if(campo==='mes_fixo') return /mes_fixo|mês fixo|mes fixo/.test(modalidadeDe(c));
    if(campo==='franquia_individual') return /individual/.test(modalidadeDe(c));
    return passaTexto(c);
  });
}

window.CONTRATOS_FILTROS_PURE = { FILTROS: FILTROS, filtraContratos: filtraContratos, codigoNorm: codigoNorm, cidadeDe: cidadeDe };

if(typeof document==='undefined') return;

var STATE = window.__CTR_FILTRO_V52237 || (window.__CTR_FILTRO_V52237 = { campo:'todos', q:'' });

function ehStatus(campo){
  return /chamados_abertos|vencidos|vencer_30|leituras_hoje|nao_faturados|faturados_mes|mes_fixo|franquia/.test(campo||'');
}

function injetar(){
  var view=document.getElementById('view-contratos');
  if(!view || view.classList.contains('hidden')) return;
  if(document.getElementById('ctr-filtro-campo')) return;
  var busca=document.getElementById('search-contratos');
  if(!busca) return;
  var sel=document.createElement('select');
  sel.id='ctr-filtro-campo';
  sel.className='h-10 px-3 rounded-xl bg-white border text-[13px] min-w-[210px]';
  sel.innerHTML=FILTROS.map(function(it){
    return '<option value="'+it[0]+'"'+(STATE.campo===it[0]?' selected':'')+'>'+it[1]+'</option>';
  }).join('');
  sel.onchange=function(){
    STATE.campo=sel.value;
    if(ehStatus(STATE.campo)){ STATE.q=''; if(busca) busca.value=''; }
    if(typeof window.contratosFinalBuscar==='function') window.contratosFinalBuscar();
    else if(typeof window.renderContratos==='function') window.renderContratos();
  };
  var pai=busca.parentNode;
  if(pai) pai.insertBefore(sel, busca);
}

if(typeof window.renderContratos==='function' && !window.renderContratos.__v52237fil){
  var old=window.renderContratos;
  window.renderContratos=function(){
    var s=typeof getSession==='function'?getSession():null;
    var campo=(document.getElementById('ctr-filtro-campo')||{}).value || STATE.campo || 'todos';
    var q=(document.getElementById('search-contratos')||{}).value || STATE.q || '';
    STATE.campo=campo; STATE.q=q;
    if(s && typeof db!=='undefined'){
      var orig=db.contratos;
      try{
        db.contratos=filtraContratos((orig||[]).filter(function(c){ return !s.empresaId || c.empresaId===s.empresaId; }), campo, q);
        var r=old.apply(this, arguments);
        return r;
      } finally {
        db.contratos=orig;
        setTimeout(injetar, 20);
      }
    }
    var r2=old.apply(this, arguments);
    setTimeout(injetar, 20);
    return r2;
  };
  window.renderContratos.__v52237fil=true;
}

if(typeof window.contratosFinalBuscar==='function' && !window.contratosFinalBuscar.__v52237fil){
  var oldB=window.contratosFinalBuscar;
  window.contratosFinalBuscar=function(){
    STATE.q=document.getElementById('search-contratos')&&document.getElementById('search-contratos').value||'';
    STATE.campo=document.getElementById('ctr-filtro-campo')&&document.getElementById('ctr-filtro-campo').value||'todos';
    return oldB.apply(this, arguments);
  };
  window.contratosFinalBuscar.__v52237fil=true;
}

setTimeout(injetar, 500);
console.log('[DIGICOPY] v5.22.37 filtros de contratos');
})();
