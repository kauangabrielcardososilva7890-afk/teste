const fs = require('fs');
const { JSDOM } = require('jsdom');
const idx = fs.readFileSync('./index.html','utf8');
let bodyInner = (idx.match(/<body[^>]*>([\s\S]*)<\/body>/i)||[,''])[1].replace(/<script[\s\S]*?<\/script>/gi,'');
const dom = new JSDOM(`<!DOCTYPE html><html><body>${bodyInner}</body></html>`, { url:'http://localhost/', runScripts:'outside-only', pretendToBeVisual:true });
const { window } = dom;
window.matchMedia = window.matchMedia || function(){ return { matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}, onchange:null, dispatchEvent(){return false} }; };
window.scrollTo = function(){}; window.open = function(){ return null; }; window.print = function(){};
window.structuredClone = global.structuredClone;
window.requestAnimationFrame = window.requestAnimationFrame || function(cb){ return setTimeout(cb,0); };
window.fetch = function(){ return Promise.reject(new Error('offline')); };
window.localStorage.setItem('digicopy_session_v42_demo_apresentacao', JSON.stringify({ id:'u1', nome:'ADMIN', cargo:'admin', empresaId:'e1', usuarioNome:'ADMIN' }));
try { window.eval(fs.readFileSync('./app.bundle.js','utf8')); } catch(e){ console.log('eval err:', e.message); }
Object.assign(window.db, { empresaId:'e1', parque:[{id:'p1',contratoId:'ctr1',equipamentoId:'eq1',status:'ativo',localInstalacao:'Recepção'},{id:'p2',contratoId:'ctr1',equipamentoId:'eq2',status:'ativo',localInstalacao:'Depósito'}], equipamentos:[{id:'eq1',modelo:'Xerox B230',serie:'SN1',patrimonio:'PAT1',contadorPB:1000},{id:'eq2',modelo:'Kyocera M2040',serie:'SN2',patrimonio:'PAT2',contadorPB:2000}], contratos:[{id:'ctr1',clienteId:'cli1',status:'ativo'}], clientes:[{id:'cli1',nome:'Cliente A'}], os:[{id:'os1',empresaId:'e1',clienteId:'cli1',contratoId:'ctr1',numero:'101',dataAbertura:'2026-09-04T12:00:00',prioridade:'normal',tecnico:'ADMIN',descricao:'Sem papel',status:'aberto',equipamentoId:'eq1',modelo:'Xerox B230',serie:'SN1',patrimonio:'PAT1',local:'Recepção'}] });
try { window.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles:true })); } catch(e){}
const $ = id => window.document.getElementById(id);
// abre o chamado EXISTENTE (os1) pra editar
window.openModalChamadoCompleto('os1', 'ctr1');
setTimeout(function(){
  console.log('1) abriu edição: modelo =', $('ko-modelo').value, '| motivo =', $('ko-desc').value);
  // troca pela Kyocera
  window.lcEscolherImpressoraChamado('eq2');
  setTimeout(function(){
    console.log('2) após troca na edição: modelo =', $('ko-modelo').value, '| patr =', $('ko-patr').value);
    $('ko-desc').value = 'Atolamento na gaveta 2';
    // SALVA
    window.salvarChamadoCompleto('os1', 'ctr1');
    setTimeout(function(){
      const o = (window.db.os||[]).find(x=>x.id==='os1') || {};
      console.log('3) salvo: modelo =', o.modelo, '| patr =', o.patrimonio, '| serie =', o.serie, '| motivo =', o.descricao, '| equipId =', o.equipamentoId);
      // abre a LISTAGEM de chamados do contrato
      window.abrirChamadosContrato('ctr1');
      setTimeout(function(){
        const body = window.document.getElementById('modal-body') ? window.document.getElementById('modal-body').innerHTML : '';
        const okPat = body.indexOf('PAT2') >= 0;
        const okMod = body.indexOf('Kyocera M2040') >= 0;
        const okMot = body.indexOf('Atolamento na gaveta 2') >= 0;
        console.log('4) LISTA mostra PAT2?', okPat ? 'SIM OK' : 'NÃO -> FALHA');
        const i = body.indexOf('Kyocera');
        console.log('   trecho:', i >= 0 ? body.slice(Math.max(0, i-450), i+120).replace(/\s+/g,' ').slice(0,500) : '(sem trecho)');
        console.log('5) LISTA mostra Kyocera M2040?', okMod ? 'SIM OK' : 'NÃO -> FALHA');
        console.log('6) LISTA mostra motivo novo?', okMot ? 'SIM OK' : 'NÃO -> FALHA');
        process.exit(0);
      }, 100);
    }, 150);
  }, 60);
}, 350);
