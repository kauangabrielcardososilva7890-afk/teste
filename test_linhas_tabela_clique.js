// ═══════════════════════════════════════════════════════════════════════════
// TESTE — duplo clique nas tabelas abre o registro DA PRÓPRIA TABELA
//
// AUDITORIA 23/09/2026 — defeito de copiar/colar que sobreviveu em 5 telas:
// as tabelas de USUÁRIOS, AUDITORIA, EQUIPAMENTOS, LEITURAS e OS tinham o
// manipulador de duplo clique copiado da tabela de PRODUTOS:
//
//     ondblclick="openModal('produto','${p.id}')"
//
// Só que nessas telas a variável da linha é `u`, `l`, `e`/`l`, `o` — e `p` NÃO
// existe em lugar nenhum do arquivo. Como isso roda como atributo inline, o
// erro fica só no console: para quem usa, o duplo clique simplesmente não faz
// nada (nas de produto, `p` é a variável certa e sempre funcionou).
//
// Este teste confere que cada tabela aponta para um modal existente E que a
// variável usada é a da própria linha. Assim, copiar linha de uma tabela para
// outra volta a ser seguro.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');

let passou = 0;
function ok(nome, cond){
  if(!cond){ console.error('  ✘ ' + nome); process.exit(1); }
  passou++;
  console.log('  ✔ ' + nome);
}

const app = fs.readFileSync('app.js', 'utf8');

console.log('== DUPLO CLIQUE NAS TABELAS ==');

// Cada tabela: id do tbody, a variável da linha (map) e o modal que ela abre.
// OBS: a tabela de PRODUTOS não tem duplo clique hoje — o trecho com
// openModal('produto','${p.id}') foi copiado dela numa versão antiga e ficou
// colado nas outras cinco, onde "p" nem existe.
const tabelas = [
  { tbody: 'tbody-usuarios',  variavel: 'u', modais: ['usuario'] },
  { tbody: 'tbody-equip',     variavel: 'e', modais: ['equipamento'] },
  { tbody: 'tbody-leituras',  variavel: 'l', modais: ['leitura'] },
  { tbody: 'tbody-os',        variavel: 'o', modais: ['os'] },
];

for(const t of tabelas){
  const i = app.indexOf("getElementById('" + t.tbody + "')");
  ok('achei a tabela ' + t.tbody, i >= 0);
  // o trecho desta tabela vai até o próximo tbody renderizado
  const j = app.indexOf('getElementById(\'tbody-', i + 10);
  const trecho = app.slice(i, j > 0 ? j : i + 4000);

  const dbl = /ondblclick="openModal\('([a-z-]+)','\$\{([a-z])\.id\}'\)"/.exec(trecho);
  if(t.modais){
    ok(t.tbody + ': o duplo clique abre um modal de verdade', !!dbl);
    ok(t.tbody + ': abre "' + t.modais[0] + '" (não o de outra tela)', !!dbl && t.modais.indexOf(dbl[1]) >= 0);
    ok(t.tbody + ': usa a variável da PRÓPRIA linha (' + t.variavel + ')', !!dbl && dbl[2] === t.variavel);
  }
}

// A tabela de auditoria não tem tela de detalhe: o certo é NÃO ter duplo clique
// (antes ela chamava o modal de produto, que não existe para uma linha de log).
const iAud = app.indexOf("getElementById('tbody-auditoria')");
const jAud = app.indexOf('getElementById(\'tbody-', iAud + 10);
const trechoAud = app.slice(iAud, jAud > 0 ? jAud : iAud + 4000);
ok('auditoria: sem duplo clique órfão (não existe tela de detalhe do log)', !/ondblclick=/.test(trechoAud));

// Varredura raiz: nenhum outro ponto pode chamar modal com variável inexistente
const todos = [...app.matchAll(/ondblclick="openModal\('([a-z-]+)','\$\{([a-z])\.id\}'\)"/g)];
ok('nenhum duplo clique usa variável solta no arquivo inteiro',
   todos.every(m => /[uleo]/.test(m[2])));
ok('nenhuma tabela abre o modal de PRODUTOS por engano',
   !todos.some(m => m[1] === 'produto'));

console.log('\nRESULTADO: ' + passou + ' verificações — duplo clique das tabelas correto!');
