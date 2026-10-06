const fs = require('fs');
function ok(nome, cond) {
  if (!cond) { console.error('  ✘ ' + nome); process.exit(1); }
  console.log('  ✔ ' + nome);
}
const rel = fs.readFileSync('ajustes_relatorio_pai_patch.js', 'utf8');
const fiscal = fs.readFileSync('ajustes_v5240_relatorio_grande_patch.js', 'utf8');
const popup = fs.readFileSync('popup_sistema_patch.js', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const leitura = fs.readFileSync('ajustes_v5250_leitura_overhaul_patch.js', 'utf8');
console.log('== REGRESSÃO: diálogos nativos no Electron ==');
ok('estorno geral usa confirmSistema', /window\.confirmSistema\(/.test(rel));
ok('estorno geral não usa confirm nativo', !/\bconfirm\s*\(/.test(rel));
ok('fallback do estorno geral não executa sem confirmação segura', /A confirmação do sistema não está disponível/.test(rel));
ok('estorno fiscal usa confirmSistema', /window\.confirmSistema\(/.test(fiscal));
ok('fallback fiscal não usa alert nativo', !/\balert\s*\(/.test(fiscal));
ok('fallback fiscal não usa confirm nativo', !/\bconfirm\s*\(/.test(fiscal));
ok('fallback fiscal recusa com segurança', /cb\(false\)/.test(fiscal));
ok('popup não mantém referência ao confirm nativo', !/nativeConfirm/.test(popup));
ok('popup síncrono falha fechado com aviso visual', /Confirmação necessária/.test(popup) && /return false/.test(popup));
ok('extração Firebird aguarda confirmSistema', /await window\.confirmSistema\(confirmacao, 'Importar banco antigo'\)/.test(app));
ok('extração Firebird não usa confirm nativo', !/if\s*\(\s*!?confirm\s*\(/.test(app.slice(app.indexOf('async function fbExtractAll'), app.indexOf('function fbImportToErp'))));
ok('Leitura legada preserva ID conhecido', /leituraLegada && typeof window\.abrirLeituraContratoDetalhe/.test(leitura) && /leituraLegada\.id/.test(leitura));
console.log('  ✔ regressões de diálogos, extração Firebird e redirecionamento de Leituras');
