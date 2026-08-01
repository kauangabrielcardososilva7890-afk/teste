const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code = fs.readFileSync('arquivos_modelos_diagnostico_patch.js','utf8');
const ctx = { window:{} };
new Function('window', code)(ctx.window);
const P = ctx.window.ARQUIVOS_MODELOS_PURE;
console.log('== ARQUIVOS_MODELOS_PURE ==');
const ph = P.extrairPlaceholdersRTF('{\\rtf1 {CLI_NOMERAZAO} {EMP_CIDADE} [TABLE]}');
ok('extrai placeholders RTF', ph.includes('CLI_NOMERAZAO') && ph.includes('EMP_CIDADE') && ph.includes('[TABLE]'));
const j = P.analisarJsonTexto('LOCACAO.json', JSON.stringify([{COD_LOCACAO:82, COD_CLIENTE:116, VALOR:120}]));
ok('analisa JSON array', j.tipo === 'json' && j.total === 1 && j.colunas.includes('COD_CLIENTE'));
const rel = P.gerarDiagnosticoArquivosTextos([{nome:'CLIENTES.json', conteudo:JSON.stringify([{CODIGO:116,NOME:'Teste'}])}, {nome:'contrato.rtf', conteudo:'{\\rtf1 {CLI_NOMERAZAO}}'}]);
ok('gera relatório com json e rtf', rel.includes('CLIENTES.json') && rel.includes('contrato.rtf') && rel.includes('CLI_NOMERAZAO'));
console.log('\nRESULTADO: Testes de arquivos/modelos passaram!');
