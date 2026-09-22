// ═══════════════════════════════════════════════════════════════════════════
// AJUSTES_V6108_FALTA_EMITIR_PATCH v6.1.8 — "terminar a NF-e" (pedido dele
// 22/09/2026: "pode fazer tudo de uma vez").
//
// O que é: um cartão na tela da Central de Nota Fiscal chamado
//   "FALTA POUCO PARA A NOTA VALER DE VERDADE"
// que CONFERE tudo o que a emissão real exige, item por item, com o estado de
// AGORA (nada de "deve estar certo") e um botão para resolver cada pendência:
//   1. CNPJ da loja            (Configurações)
//   2. Inscrição Estadual      (Configurações → Fiscal)
//   3. Série e ambiente        (Configurações → Fiscal)
//   4. Perfil tributário       (CFOP/CSOSN)  → tela Perfil Tributário
//   5. NCM nos produtos        (conta de quantos já têm NCM de 8 dígitos)
//   6. CSC do cupom (NFC-e)    (ID + código, quando ele for usar cupom)
//   7. Certificado A1          (conferido NO PC, pela ponte do programa)
// Quando os 7 estão verdes, a frase muda para "está tudo pronto — só o clique".
//
// Por que em arquivo separado: regra #10 (1 módulo = 1 arquivo) — este é o
// "prontidão fiscal"; o catálogo fiscal (telas, emissão, CC-e) fica onde está.
// Nada aqui transmite nada: é leitura de estado + atalhos. Tudo dentro de
// try/catch e com sonda leve (2s) só enquanto a Central estiver aberta.
//
// Guard: __v6108falta. PURE exportado para teste (sem DOM).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
if(typeof window!=='undefined' && window.__v6108falta) return;

/* FE6108_PURE_START */
function feSoDigitos(v){ return String(v==null?'':v).replace(/\D/g,''); }

// Lê o banco (nuvem) e devolve a lista de pendências com o estado de agora.
function feAnalisar(db){
  var c=(db&&db.config)||{};
  var f=c.fiscal||{};
  var emp=(db&&db.empresas&&db.empresas[0])||{};
  var perfis=(db&&db.perfisNf)||[];
  var produtos=(db&&db.produtos)||[];
  var cnpj=feSoDigitos(emp.cnpj||c.cnpj);
  var ncmOk=0;
  produtos.forEach(function(p){ if(p && feSoDigitos(p.ncm).length===8) ncmOk++; });

  var itens=[
    { id:'cnpj', ok:cnpj.length===14, rotulo:'CNPJ da loja',
      detalhe:cnpj.length===14?('CNPJ '+cnpj):'sem CNPJ cadastrado na empresa',
      onde:'config', acao:'Configurações' },
    { id:'ie', ok:!!String(f.ie||'').trim(), rotulo:'Inscrição Estadual',
      detalhe:String(f.ie||'').trim()?('IE '+String(f.ie).trim()):'sem IE — a SEFAZ recusa a nota',
      onde:'config-fiscal', acao:'Configurações fiscais' },
    { id:'serie', ok:!!String(f.serie||'').trim() && !!String(f.crt||'').trim(), rotulo:'Série e regime (CRT)',
      detalhe:'série '+String(f.serie||'1')+' · regime '+(String(f.crt||'')==='1'?'Simples Nacional':(String(f.crt||'')||'não informado')),
      onde:'config-fiscal', acao:'Configurações fiscais' },
    { id:'perfil', ok:perfis.length>0, rotulo:'Perfil tributário (CFOP/CSOSN)',
      detalhe:perfis.length?(perfis.length+' perfil(is) cadastrado(s)'):'nenhum perfil — a nota sai sem tributação',
      onde:'fiscal-perfil', acao:'Perfil Tributário' },
    { id:'ncm', ok:produtos.length?ncmOk>0:false, rotulo:'NCM nos produtos',
      detalhe:produtos.length?(ncmOk+' de '+produtos.length+' produto(s) com NCM de 8 dígitos'):'nenhum produto cadastrado ainda',
      onde:'produtos', acao:'Produtos' },
    { id:'csc', ok:!!String(c.nfCscId||'').trim() && !!String(c.nfCsc||'').trim(), rotulo:'CSC do cupom (NFC-e)',
      detalhe:(String(c.nfCscId||'').trim()&&String(c.nfCsc||'').trim())?'ID '+String(c.nfCscId).trim()+' guardado':'só precisa para cupom (NFC-e) — gere no portal da SEFAZ-MG',
      onde:'central-nf', acao:'Central de NF-e' },
    // O certificado é conferido NO PC (assíncrono) — aqui fica o lugar dele.
    { id:'cert', ok:null, rotulo:'Certificado A1 (no PC emissor)',
      detalhe:'confiro na hora, pelo programa do PC', onde:'central-nf', acao:'Ver' }
  ];
  var prontos=itens.filter(function(i){ return i.ok===true; }).length;
  return { itens:itens, prontos:prontos, total:itens.length, producao:String(c.nfAmbiente||'homologacao')==='producao' };
}

function feResumo(an){
  if(!an) return '';
  if(an.prontos>=an.total-1 && an.itens.every(function(i){ return i.ok!==false; }))
    return 'Está tudo pronto — falta só o certificado e o clique.';
  return (an.prontos+' de '+an.total+' itens prontos — resolva o que está vermelho aqui embaixo.');
}
if(typeof window!=='undefined') window.FE6108_PURE={ feAnalisar:feAnalisar, feResumo:feResumo, feSoDigitos:feSoDigitos };
/* FE6108_PURE_END */

if(typeof document==='undefined') return;   // testes em Node: só a parte pura

function feBanco(){ try{ return (typeof db!=='undefined')?db:null; }catch(e){ return null; } }
function feEsc(v){ return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function feIr(onde){
  try{
    if(onde==='fiscal-perfil' && typeof abrirPerfilTributario==='function'){ abrirPerfilTributario(); return; }
    if(typeof navigateTo==='function') navigateTo(onde);
  }catch(e){}
}

function fePintar(){
  try{
    var v=document.getElementById('view-central-nf');
    if(!v || (v.classList && v.classList.contains('hidden'))) return;
    var an=feAnalisar(feBanco());
    var caixa=document.getElementById('fe6108-caixa');
    if(!caixa){
      caixa=document.createElement('div');
      caixa.id='fe6108-caixa';
      caixa.style.cssText='margin-top:12px;background:#fff;border:1px solid #c9ceef;border-radius:14px;padding:12px 14px';
      v.insertBefore(caixa, v.firstChild ? v.firstChild.nextSibling : null);
    }
    var linhas=an.itens.map(function(i){
      var marca=i.ok===true?'✅':(i.ok===null?'⏳':'⚠️');
      var cor=i.ok===true?'#166534':(i.ok===null?'#334155':'#b45309');
      return '<div style="display:flex;gap:8px;align-items:flex-start;padding:4px 0;font-size:12.5px">'+
        '<span>'+marca+'</span>'+
        '<span style="flex:1;color:'+cor+'"><b>'+feEsc(i.rotulo)+'</b> — '+feEsc(i.detalhe)+'</span>'+
        (i.ok===true?'':'<button type="button" data-fe-ir="'+feEsc(i.onde)+'" style="height:26px;padding:0 10px;border-radius:8px;border:1px solid #c9ceef;background:#e8eaf8;color:#0a1e8a;font-weight:700;font-size:11.5px;cursor:pointer">'+feEsc(i.acao)+'</button>')+
      '</div>';
    }).join('');
    caixa.innerHTML='<p style="margin:0 0 6px;font-size:13px;font-weight:800;color:#0a1e8a">FALTA POUCO PARA A NOTA VALER DE VERDADE'+
      '<span style="font-weight:600;color:#475569"> · '+(an.producao?'PRODUÇÃO':'HOMOLOGAÇÃO (teste)')+'</span></p>'+
      '<p style="margin:0 0 6px;font-size:12px;color:#475569">'+feEsc(feResumo(an))+'</p>'+linhas+
      '<p style="margin:8px 0 0;font-size:11.5px;color:#64748b">Nada aqui emite sozinho: a conferência é só leitura. A senha do certificado continua sendo pedida na hora de cada transmissão e não fica salva.</p>';
    Array.prototype.forEach.call(caixa.querySelectorAll('[data-fe-ir]'), function(b){
      b.onclick=function(){ feIr(b.getAttribute('data-fe-ir')); };
    });
    // Certificado: confere no PC (assíncrono) e atualiza só aquela linha
    try{
      var api=window.nfeCertAPI;
      if(api && typeof api.status==='function'){
        api.status().then(function(st){
          try{
            var alvo=caixa.querySelector('[data-fe-ir="central-nf"]');
            var linha=alvo?alvo.parentNode:(caixa.querySelectorAll('div[style*="display:flex"]')[5]||null);
            if(!linha) return;
            if(st&&st.installed){
              linha.innerHTML='<span>✅</span><span style="flex:1;color:#166534;font-size:12.5px"><b>Certificado A1</b> — instalado neste PC (a validade aparece quando você transmite)</span>';
            }else{
              linha.innerHTML='<span>⚠️</span><span style="flex:1;color:#b45309;font-size:12.5px"><b>Certificado A1</b> — não achei neste PC: importe o .pfx em Configurações fiscais, no programa do PC</span>';
            }
          }catch(e){}
        }).catch(function(){});
      }else{
        var sem=caixa.querySelector('[data-fe-ir="central-nf"]');
        if(sem) sem.parentNode.querySelector('span:nth-child(2)').innerHTML='<b>Certificado A1</b> — só dá para conferir no programa do PC (no site/celular não existe)';
      }
    }catch(e){}
  }catch(e){}
}

// sonda leve: só enquanto a Central estiver aberta (custo quase zero)
try{
  var feAgendada=false;
  setInterval(function(){
    if(feAgendada) return; feAgendada=true;
    try{ fePintar(); }catch(e){}
    feAgendada=false;
  }, 2000);
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(fePintar, 600); });
  window.addEventListener('load', function(){ setTimeout(fePintar, 600); });
}catch(e){}

window.fe6108Conferir=function(){ fePintar(); return feAnalisar(feBanco()); };
window.__v6108falta={vivo:true,versao:'6.1.8'};
console.log('[DIGICOPY] v6.1.8 Falta pouco para a nota valer de verdade (conferência na Central de NF-e)');
})();
