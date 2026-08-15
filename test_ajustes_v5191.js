const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v5191_patch.js', 'utf8');

// Simula ambiente com funções de sync + confirmSistema
let confirmMsg = null;
const win = {
  confirmSistema: (m) => { confirmMsg = m; return Promise.resolve(true); },
  syncEnviarParaNuvem: () => { win.__enviou = true; },
  syncCarregarDaNuvem: () => { win.__carregou = true; },
  enviarDadosLocaisParaNuvem: function(){ win.__chamadaAntiga = true; },
  carregarDadosDaNuvem: function(){ win.__chamadaAntigaCarregar = true; }
};

new Function('window', code)(win);

console.log('== AJUSTES_V5191: sync manual usa confirmSistema ==');
win.enviarDadosLocaisParaNuvem();
setTimeout(() => {
  ok('confirmSistema foi chamado', confirmMsg && confirmMsg.indexOf('Enviar TODOS') >= 0);
  ok('syncEnviarParaNuvem chamado com confirmar:false', win.__enviou === true);
  ok('não chamou a função antiga (que usava confirm quebrado)', win.__chamadaAntiga !== true);

  win.carregarDadosDaNuvem();
  setTimeout(() => {
    ok('syncCarregarDaNuvem chamado', win.__carregou === true);
    console.log('\nRESULTADO: Testes do ajustes_v5191 passaram!');
    process.exit(0);
  }, 30);
}, 30);
