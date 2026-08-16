// =====================================================================
// DIGICOPY — Ferramenta de diagnóstico da migração de dados antigos
// Lista os textos (chaves) gravados dentro dos arquivos LevelDB do
// localStorage do Electron (.ldb / .log / .old). NÃO altera nada.
//
// Uso (no Windows, com o sistema fechado):
//   node ler_chaves_leveldb.js "C:\Users\User\AppData\Roaming\digicopy-erp\Local Storage\leveldb"
//
// Depois, cole a saída aqui no chat.
// =====================================================================
const fs = require('fs');
const path = require('path');

const dir = process.argv[2];
if (!dir) {
  console.log('ERRO: informe a pasta leveldb entre aspas.');
  console.log('Exemplo:');
  console.log('  node ler_chaves_leveldb.js "C:\\Users\\User\\AppData\\Roaming\\digicopy-erp\\Local Storage\\leveldb"');
  process.exit(1);
}
if (!fs.existsSync(dir)) {
  console.log('ERRO: pasta nao encontrada -> ' + dir);
  process.exit(1);
}

const arquivos = fs.readdirSync(dir).filter(f =>
  /\.(ldb|log|old)$/i.test(f) || /^MANIFEST/i.test(f) || /^CURRENT$/i.test(f)
);

if (arquivos.length === 0) {
  console.log('ERRO: nenhum arquivo .ldb/.log/.old encontrado em -> ' + dir);
  console.log('Arquivos que existem na pasta:');
  fs.readdirSync(dir).forEach(f => console.log('  ' + f));
  process.exit(1);
}

const textos = new Set();
for (const f of arquivos) {
  let buf;
  try { buf = fs.readFileSync(path.join(dir, f)); } catch (e) { continue; }
  let cur = '';
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    if (b >= 0x20 && b < 0x7f) { cur += String.fromCharCode(b); }
    else { if (cur.length >= 3) textos.add(cur); cur = ''; }
  }
  if (cur.length >= 3) textos.add(cur);
}

const lista = [...textos].sort();

console.log('==================================================');
console.log('Pasta lida: ' + dir);
console.log('Arquivos: ' + arquivos.join(', '));
console.log('Total de textos unicos: ' + lista.length);
console.log('==================================================');
console.log('');
console.log('=== CANDIDATOS A CHAVE DE DADOS ===');
const chave = /digicopy|_erp|erp|dados|tabelas|backup|session|cnpj|state|\bdb\b|v20|v10|v42|cliente|produto|venda|\bos\b|firebase/i;
const candidatos = lista.filter(s => chave.test(s));
if (candidatos.length === 0) console.log('  (nenhum — cole a lista completa abaixo)');
candidatos.forEach(s => console.log('  ' + s));
console.log('');
console.log('=== TODOS OS TEXTOS (cole tudo se pedirem) ===');
lista.forEach(s => console.log(s));
