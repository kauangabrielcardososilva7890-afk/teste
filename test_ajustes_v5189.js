const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v5189_patch.js', 'utf8');
const ctx = { window: {}, db: {} };
new Function('window', 'db', 'document', code)(ctx.window, ctx.db, undefined);
const R = ctx.window.AJUSTES_V5189_PURE;

console.log('== AJUSTES_V5189_PURE: dados da loja ==');
{
  const oldDb = global.db;
  // lojaData lê db global; simulamos com getSession + db no escopo
  const g = {};
  g.getSession = () => ({ empresaId: 'e1' });
  g.window = {};
  g.db = {
    empresas: [{ id: 'e1', nome: 'Empresa Antiga', fantasia: 'DIGICOPY' }],
    config: {
      loja: { fantasia: 'Minha Loja', razaoSocial: 'Minha Loja LTDA', cnpj: '00.000.000/0001-00', telefone: '(38) 9999', email: 'a@b.com', rua: 'Rua X', numero: '10', cidade: 'Janaúba', uf: 'MG' }
    }
  };
  new Function('window', 'db', 'getSession', 'document', code)(g.window, g.db, g.getSession, undefined);
  const loja = g.window.AJUSTES_V5189_PURE.lojaData();
  ok('fantasia da loja', loja.fantasia === 'Minha Loja');
  ok('razão social da loja', loja.razao === 'Minha Loja LTDA');
  ok('cnpj da loja', loja.cnpj === '00.000.000/0001-00');
  ok('endereço montado', /Rua X/.test(loja.end));
}

console.log('== AJUSTES_V5189_PURE: merge do formulário ==');
{
  function makeDoc(fields){ const m={}; Object.keys(fields).forEach(id=>m[id]={value:fields[id]}); return { getElementById: id=>m[id]||null }; }
  const doc = makeDoc({ 'kr-os-desc': 'Troca de fusor', 'kr-os-cont-atu': '5200' });
  const merged = R.coletarFormChamado({ id:'os1', descricao:'Antigo', contadorAtual:'5000' }, doc);
  ok('motivo digitado sobrescreve', merged.descricao === 'Troca de fusor');
  ok('contador digitado sobrescreve', merged.contadorAtual === '5200');
}

console.log('== AJUSTES_V5189_PURE: impressora ==');
{
  const dbRef = { equipamentos:[{id:'e1',modelo:'HP',patrimonio:'P1',serie:'S1'}], parque:[{equipamentoId:'e1',setor:'Recepção'}] };
  const imp = R.dadosImpressora({ equipamentoId:'e1' }, dbRef);
  ok('modelo', imp.modelo === 'HP');
  ok('patrimônio', imp.patrimonio === 'P1');
  ok('serial', imp.serie === 'S1');
  ok('local', imp.local === 'Recepção');
}

console.log('\nRESULTADO: Testes do ajustes_v5189 passaram!');
