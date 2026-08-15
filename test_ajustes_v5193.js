const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v5193_patch.js', 'utf8');

// Monta um DOM fake com os campos f-cli-*
function makeDom(initial){
  const map = {};
  Object.keys(initial).forEach(id => { map[id] = { value: initial[id] }; });
  return {
    getElementById: (id) => map[id] || null,
    body: {}
  };
}

console.log('== AJUSTES_V5193: aviso ao sair do cliente (só se modificou) ==');

// Cenário 1: modificou o nome → deve pedir para salvar
{
  let saved = false;
  let confirmShown = false;
  const dom = makeDom({ 'f-cli-nome': 'João', 'f-cli-tel': '999' });
  const win = {
    confirmSistema: (msg) => { confirmShown = true; return Promise.resolve(true); },
    saveCliente: function(){ saved = true; },
    closeModal: function(){ win.__closed = true; },
    renderModalCliente: function(id){ /* mock */ }
  };
  new Function('window', 'document', code)(win, dom);

  // simula abrir edição + foto
  win.__cliEditId = 'cli1';
  win.__cliEditSnapshot = { 'f-cli-nome': 'João', 'f-cli-tel': '999' };
  dom.getElementById('f-cli-nome').value = 'João Alterado'; // usuário mudou

  win.closeModal();
  setTimeout(() => {
    ok('aviso de salvar apareceu quando modificou', confirmShown === true);
    // respondeu "sim" → chamou saveCliente
    ok('respondeu sim → chamou saveCliente', saved === true);

    // Cenário 2: não modificou nada → fecha direto sem aviso
    let confirmShown2 = false;
    const dom2 = makeDom({ 'f-cli-nome': 'Maria' });
    const win2 = {
      confirmSistema: (msg) => { confirmShown2 = true; return Promise.resolve(true); },
      saveCliente: function(){},
      closeModal: function(){ win2.__closed = true; },
      renderModalCliente: function(){}
    };
    new Function('window', 'document', code)(win2, dom2);
    win2.__cliEditId = 'cli2';
    win2.__cliEditSnapshot = { 'f-cli-nome': 'Maria' };
    win2.closeModal();
    ok('sem modificação → fecha direto (sem aviso)', confirmShown2 === false && win2.__closed === true);

    console.log('\nRESULTADO: Testes do ajustes_v5193 passaram!');
    process.exit(0);
  }, 30);
}
