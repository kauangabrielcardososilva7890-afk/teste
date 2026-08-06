const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const login=fs.readFileSync('sistema_virgem_usuarios_patch.js','utf8');
const buscador=fs.readFileSync('buscador_escola_final_patch.js','utf8');
console.log('== LOGIN_BUSCADOR_UI_FINAL ==');
ok('login do sistema não vem preenchido por padrão', login.includes('id="login-user"') && login.includes('value=""') && !login.includes('value="${esc(primeiro.login'));
ok('login do sistema não mostra dica com Kauan por padrão', !login.includes('Usuários: Kauan'));
ok('buscador tem botão para login API', buscador.includes('Login API') && buscador.includes('mostrarCredenciaisBuscador()'));
ok('buscador tem salvar e enviar nuvem', buscador.includes('Salvar e enviar nuvem') && buscador.includes('publicarConfigBuscadorNuvem'));
ok('buscador tem contador de próxima atualização', buscador.includes('proximaAtualizacaoTexto') && buscador.includes('Próxima:'));
console.log('\nRESULTADO: Testes de login/buscador UI final passaram!');
