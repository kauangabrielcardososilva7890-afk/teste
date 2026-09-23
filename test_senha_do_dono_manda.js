// ═══════════════════════════════════════════════════════════════════════════
// TESTE — A SENHA QUE O DONO ESCOLHE É A QUE VALE
//
// O dono pediu os nomes das contas para trocar as senhas (23/09/2026). Ao
// conferir, apareceu o impedimento: o `seedData` (app.js) roda em TODA carga do
// sistema e reescrevia a senha dos dois usuários garantidos para o valor de
// fábrica —
//
//     if(u.senha !== g.senha){ u.senha = g.senha; mudou = true; }
//
// Ou seja: ele trocava a senha na tela Usuários e, na próxima vez que abria o
// sistema, a senha velha voltava sozinha — a troca "não pegava" e a senha que
// está no histórico do repositório continuava valendo. Isso deixava a rotação
// impossível (e é o mesmo defeito de classe do patch_relatorio.js, que trocava
// a senha do Denivaldo por conta própria).
//
// O que este teste garante:
//   • o sistema NÃO reescreve a senha de quem já existe;
//   • o padrão de fábrica continua servindo para CRIAR o usuário na primeira vez
//     (PC novo, base vazia) — isso não foi perdido;
//   • a migração antiga da senha do Denivaldo roda UMA vez e nunca mais.
// Nenhuma senha real é lida nem impressa aqui: o teste só confere o FORMATO do
// código (quem escreve o quê), nunca o valor.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
let passou = 0;
function ok(nome, cond){
  if(!cond){ console.error('  ✘ ' + nome); process.exit(1); }
  passou++; console.log('  ✔ ' + nome);
}

const app = fs.readFileSync('app.js', 'utf8');
const rel = fs.readFileSync('patch_relatorio.js', 'utf8');

console.log('== 1) O SEED NÃO REESCREVE MAIS A SENHA ==');
ok('o seed continua existindo e rodando na carga', /^seedData\(false\);/m.test(app));
ok('NÃO existe mais "u.senha = g.senha" (a senha de fábrica voltando por cima)',
   !/u\.senha\s*=\s*g\.senha/.test(app));
ok('a troca ficou explicada no próprio código (quem mexer depois entende)',
   /A SENHA NÃO É MAIS REIMPOSTA AQUI/.test(app));
ok('perfil, nome e ativo continuam garantidos (só a senha saiu da lista)',
   /if\(u\.perfil !== g\.perfil\)\{ u\.perfil = g\.perfil; mudou = true; \}/.test(app) &&
   /if\(u\.ativo !== true\)\{ u\.ativo = true; mudou = true; \}/.test(app));

console.log('\n== 2) PC NOVO CONTINUA FUNCIONANDO (usuário criado na 1ª vez) ==');
const cria = /db\.usuarios\.push\(\{id:g\.id[\s\S]{0,200}?\}\);/.exec(app);
ok('usuário inexistente ainda é criado com o acesso inicial', !!cria);
ok('a criação marca que veio do sistema (não é usuário de tela)', !!cria && /criadoPor:'sistema'/.test(cria[0]));

console.log('\n== 3) NENHUM OUTRO LUGAR MEXE NA SENHA POR CONTA PRÓPRIA ==');
const suspeitos = [];
const arquivos = fs.readdirSync('.').filter(f => f.endsWith('.js') && /^patch_|^ajustes_|^app\.js$/.test(f));
for(const f of arquivos){
  if(f === 'app.js') continue;
  const src = fs.readFileSync(f, 'utf8');
  // atribuição direta a .senha de usuário (fora de criação de registro novo)
  const mm = src.match(/u(?:suario)?\.senha\s*=\s*[^=]/g);
  if(mm) suspeitos.push(f + ' (' + mm.length + ')');
}
ok('nenhum patch reescreve senha de usuário direto: ' + (suspeitos.join(', ') || 'nenhum'),
   suspeitos.length === 0);

console.log('\n== 4) A MIGRAÇÃO ANTIGA DO DENIVALDO RODA UMA VEZ SÓ ==');
ok('existe (compatibilidade com base antiga)', /login\.toLowerCase\(\) === 'denivaldo'/.test(rel));
ok('tem a marca de "já rodou" (nunca mais mexe depois disso)', /!deni\.senhaMigradaV701/.test(rel));
ok('a marca é gravada antes de qualquer troca', /deni\.senhaMigradaV701 = new Date\(\)\.toISOString\(\);[\s\S]{0,80}?if\(deni\.senha ===/.test(rel));

console.log('\nRESULTADO: ' + passou + ' verificações — a senha trocada na tela é a que vale; o sistema não devolve mais a antiga.');
