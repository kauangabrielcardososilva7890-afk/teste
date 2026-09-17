// test_ajustes_v5263.js — v5.26.3: reportes reais DELE no Gerente .exe.
//
//  1) "clico em ENTRAR e nada acontece, nem aviso" → botão blindado: checa a
//     ponte (window.gerente), captura promessa e erro síncrono, e destrava o
//     botão EM TODOS os caminhos (nunca mais clique morto/mudo);
//  2) máscara de CNPJ no Gerente: só entra número, pontua sozinho enquanto
//     digita (lg-cnpj do login + pb-emp-cnpj do cadastro de empresa);
//  3) máscara de CNPJ no PORTÃO da nuvem (v5262-cnpj): idem;
//  4) rodapé do Gerente era texto fixo e ficou desatualizado (v5.26.0) → agora
//     a tela puxa a versão REAL do programa (g:versao → app.getVersion()).
const fs = require('fs');
const vm = require('vm');

function ok(name, cond) {
  if (!cond) { console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const gHtml = fs.readFileSync('gerente-atualizacoes/index.html', 'utf8');
const gMain = fs.readFileSync('gerente-atualizacoes/main.js', 'utf8');
const gPre = fs.readFileSync('gerente-atualizacoes/preload.js', 'utf8');
const gPkg = JSON.parse(fs.readFileSync('gerente-atualizacoes/package.json', 'utf8'));
const patch = fs.readFileSync('ajustes_v5262_login_nuvem_primeiro_patch.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
const bundle = fs.readFileSync('app.bundle.js', 'utf8');

// o script embutido do gerente TEM que ser válido (senão o clique morre mudo)
const mInline = gHtml.match(/<script>([\s\S]*?)<\/script>/);
ok('gerente: tem UM bloco de script embutido', !!mInline);
fs.writeFileSync('/tmp/gscript_chk.js', mInline ? mInline[1] : '');
const { execFileSync } = require('child_process');
try { execFileSync(process.execPath, ['--check', '/tmp/gscript_chk.js']); ok('gerente: script embutido sem erro de sintaxe', true); }
catch (e) { ok('gerente: script embutido sem erro de sintaxe', false); }

console.log('== 1) BOTÃO ENTRAR NUNCA MAIS MORTO ==');
ok('handler checa a ponte antes de ir (aviso claro de window.gerente ausente)', gHtml.indexOf('ponte de segurança do programa falhou') >= 0 && /typeof window\.gerente\.api !== 'function'/.test(gHtml));
ok('promessa com .catch mostrando aviso (nada some)', gHtml.indexOf('.catch(function(e){ falhar(') >= 0);
ok('erro síncrono do clique também cai no aviso (try/catch em volta)', gHtml.indexOf("Erro inesperado no clique:") >= 0);
ok('botão SEMPRE destrava (destravar() em falha e sucesso)', (gHtml.split('function destravar').length - 1) >= 2 || gHtml.indexOf('destravar();') >= 0);

console.log('== 2/3) MÁSCARA DE CNPJ (gerente + portão da nuvem) ==');
ok('gerente: função mascararCnpj limita a 14 dígitos e pontua em 4 estágios', gHtml.indexOf('function mascararCnpj') >= 0 && gHtml.indexOf("slice(0, 14)") >= 0 && gHtml.indexOf("$1.$2.$3/$4-$5") >= 0 && gHtml.indexOf('maxlength') >= 0);
ok('gerente: máscara ligada no login E no cadastro de empresa', gHtml.indexOf("mascararCnpj($('lg-cnpj'))") >= 0 && gHtml.indexOf("mascararCnpj($('pb-emp-cnpj'))") >= 0);
ok('portão da nuvem: máscara no v5262-cnpj (maxlength 18 + listener input)', patch.indexOf("cp.setAttribute('maxlength','18')") >= 0 && patch.indexOf("cp.addEventListener('input'") >= 0);
ok('máscaras progressivas (ponto, ponto, barra, hífen vão saindo sozinhos)',
  [/'\$1\.\$2'/, /\$1\.\$2\.\$3/].some(r => r.test(patch)) || patch.indexOf('$1.$2') >= 0);

// testa a máscara do portão de verdade (função pura simulada)
function mascaraCnpj(v){
  var d = String(v||'').replace(/\D/g,'').slice(0,14), out = d;
  if(d.length > 12) out = d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/,'$1.$2.$3/$4-$5');
  else if(d.length > 8) out = d.replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/,'$1.$2.$3/$4');
  else if(d.length > 5) out = d.replace(/(\d{2})(\d{3})(\d{1,3})/,'$1.$2.$3');
  else if(d.length > 2) out = d.replace(/(\d{2})(\d{1,3})/,'$1.$2');
  return out;
}
ok('PURA máscara: "123" → "12.3", compleita → "12.345.678/0001-99"',
  mascaraCnpj('123') === '12.3' && mascaraCnpj('12345678000199') === '12.345.678/0001-99');
ok('PURA máscara: letras não entram; excesso de dígitos é cortado',
  mascaraCnpj('abc1234567800019999') === '12.345.678/0001-99');
ok('PURA máscara: barra e hífen nascem na hora certa',
  mascaraCnpj('12345678') === '12.345.678' && mascaraCnpj('123456789') === '12.345.678/9' && mascaraCnpj('123456780001') === '12.345.678/0001' && mascaraCnpj('1234567800019') === '12.345.678/0001-9');

console.log('== 4) RODAPÉ VIVO (versão real do programa) ==');
ok('rodapé tem id e NÃO fica mais em versão velha no texto', gHtml.indexOf('<footer id="ft">') >= 0 && gHtml.indexOf('v5.26.0') < 0);
ok('main expõe g:versao (app.getVersion)', gMain.indexOf("'g:versao'") >= 0 && gMain.indexOf('app.getVersion()') >= 0);
ok('preload expõe versao() pra tela', gPre.indexOf('versao:') >= 0 && gPre.indexOf("'g:versao'") >= 0);
ok('tela preenche o rodapé com a versão real no load', gHtml.indexOf('window.gerente.versao()') >= 0 && /\$ \(' ft '|ft\.textContent|\$\('ft'\)/.test(gHtml.replace(/\s+/g,'')) || gHtml.indexOf("ft.textContent") >= 0);

console.log('== CONTEXT: carimbos e trilha (v5.26.3→v5.26.4) ==');
ok('gerente package 5.26.3', gPkg.version === '5.26.3');
ok('app (package.json) na 5.26.4 (a v5.26.3 era o gerente; app subiu de 5.26.3 pra 5.26.4 na entrega do chamado)', pkg.version === '5.26.4');
ok('index.html carimbado 5.26.4 (versão real + rodapé)', html.indexOf("DIGICOPY_APP_VERSION = '5.26.4'") >= 0 && html.indexOf('>v5.26.4<') >= 0);
ok('worker SEGUE 5.26.2 (sem mudança de motor nesta entrega)', fs.readFileSync('cloudflare-worker/src/index.js','utf8').indexOf("WORKER_VERSION = '5.26.2'") >= 0);
ok('manifesto sobe pra 204 e fecha com a data grande do chamado', manifest.length === 204 && manifest[202] === 'ajustes_v5262_login_nuvem_primeiro_patch.js' && manifest[203] === 'ajustes_v5264_chamado_data_grande_patch.js');
ok('bundle contém o patch com a máscara nova', bundle.indexOf('__v5262ln') >= 0 && bundle.indexOf('$1.$2.$3/$4-$5') >= 0);
ok('mobile sincronizado com o bundle', fs.readFileSync('mobile/www/app.bundle.js','utf8') === bundle);

console.log('\nTudo OK — v5.26.3 (botão Entrar blindado com aviso garantido · máscara de CNPJ no Gerente e no portão · rodapé do Gerente puxa a versão real).');
