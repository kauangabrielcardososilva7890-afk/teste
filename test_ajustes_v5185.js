const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v5185_patch.js', 'utf8');

// Lógica pura: exposta antes do guard de document.
const ctx = { window: {}, db: {} };
new Function('window', 'db', 'document', code)(ctx.window, ctx.db, undefined);
const R = ctx.window.AJUSTES_V5185_PURE;

console.log('== AJUSTES_V5185_PURE: linha da impressora ==');
ok('modelo + patrimônio + serial', R.impressoraLinha({ modelo:'LaserJet 1102', patrimonio:'P-001', serie:'SN123' }) === 'LaserJet 1102 • Patrimônio P-001 • Serial SN123');
ok('só modelo', R.impressoraLinha({ modelo:'LaserJet 1102' }) === 'LaserJet 1102');
ok('vazio', R.impressoraLinha({}) === '');

console.log('== AJUSTES_V5185: remoção do bloco antigo de peças (simulação DOM) ==');
{
  // Monta um mini DOM: label + wrap(removido) + textarea, como fica após o v5.17.1.
  const elements = {};
  const textarea = { id: 'lc-pecas', parentElement: null };
  const container = { id: 'bloco-antigo', parentElement: {}, remove: function(){ container._removed = true; }, children: [] };
  textarea.parentElement = container;
  elements['lc-pecas'] = textarea;
  // #lc-pecas-wrap já não existe (foi removido pelo v5.17.1) — testa que a lógica
  // NÃO depende dele.
  elements['lc-pecas-wrap'] = null;

  const docMock = { getElementById: (id) => elements[id] || null };

  // Re-avalia o patch inteiro com esse document fake para expor __limparPecasAntigas.
  const win2 = { window: {}, db: { parque: [] } };
  new Function('window', 'db', 'document', 'MutationObserver', code)(win2.window, win2.db, docMock, function(){ this.observe = function(){}; });

  // Dispara a limpeza manualmente (como o observer/abertura faria).
  win2.window.__limparPecasAntigas();

  ok('bloco antigo (label+textarea) foi removido', container._removed === true);
}

console.log('\nRESULTADO: Testes do ajustes_v5185 passaram!');
