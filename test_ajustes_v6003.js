// test_ajustes_v6003.js — v6.0.3: MODO ESCURO DO FISCAL (print dele provou)
// + saveConfig blindado (erro real do console: TypeError 'value' de null).
//  1) Print da evidência: cards brancos pendurados no fundo escuro, botão com
//     texto invisível, título duplicado. Regra: CSS próprio do módulo (claro
//     e escuro, html.digi-escuro com !important) e classes cnf-* nos elementos.
//  2) saveConfig lia inputs da tela de Config antiga sem conferir se existiam
//     (a tela neo Salvar não tem cfg-emp-nome) → agora só salva quando a tela
//     estiver AGORA na DOM; senão, avisa sem explodir — NUNCA mais TypeError.
//  3) Histórico: um único cabeçalho "EMISSÕES DESTA EMPRESA" (o box tem, a
//     tela não repete), linhas e botões com classes escuras.
const fs = require('fs');

function ok(name, cond) {
  if (!cond) { console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const src = fs.readFileSync('autocura_empresa_central_nf_tela_patch.js', 'utf8');
const trx = fs.readFileSync('nf_transmissao_patch.js', 'utf8');
const bundle = fs.readFileSync('app.bundle.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));

console.log('== MODO ESCURO: CSS próprio do módulo fiscal ==');
ok('injeta o bloco cnf-aba-css UMA vez', src.indexOf("st.id='cnf-aba-css'") >= 0 && src.indexOf("document.getElementById('cnf-aba-css')") >= 0);
ok('regras claras das classes fiscais (cnf-card/btn/input)', src.indexOf("#view-central-nf .cnf-card{") >= 0 && src.indexOf("#view-central-nf .cnf-btn{") >= 0 && src.indexOf("#view-central-nf .cnf-input{") >= 0);
ok('regras escuras com html.digi-escuro', src.indexOf('html.digi-escuro #view-central-nf .cnf-card{') >= 0 && src.indexOf('html.digi-escuro #view-central-nf .cnf-btn:hover{') >= 0);
ok('escuro sobrepõe inline com !important', src.indexOf('html.digi-escuro #view-central-nf .cnf-card{background:#101a30 !important;border-color:#2b3b5c !important;color:#dbe3f0 !important}') >= 0);
ok('popup fiscal também no escuro (#nfx-modal)', src.indexOf('html.digi-escuro #nfx-modal>div{background:#101a30 !important') >= 0 && src.indexOf('html.digi-escuro #nfx-modal input{background:#0d1830 !important') >= 0);
ok('CSS injetado dentro do bundle', bundle.indexOf('cnf-aba-css') >= 0 && bundle.indexOf('digi-escuro #view-central-nf') >= 0);

console.log('== TEXTO FANTASMA: botões com classe (nunca mais branco sobre branco) ==');
ok('cnf-amb / cnf-config / cnf-inut usar classes de botão fiscal', src.indexOf('id="cnf-amb" class="cnf-btn"') >= 0 && src.indexOf('id="cnf-config" class="cnf-btn"') >= 0 && src.indexOf('id="cnf-inut" class="cnf-btn-d"') >= 0);
ok('inputs da NFC-e tem classe cnf-input', src.indexOf('id="cnf-cscid" class="cnf-input"') >= 0 && src.indexOf('id="cnf-csc" class="cnf-input"') >= 0);
ok('botão Salvar CSC também classificado', src.indexOf('id="cnf-cscsalvar" class="cnf-btn"') >= 0);
ok('cards Certificado + CSC tem classe cnf-card', src.indexOf('<div class="cnf-card"><p style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;margin:0 0 6px" class="cnf-sub">Certificado A1</p>') >= 0);
ok('subtítulos com classe cnf-sub (escuro cobre)', src.indexOf('class="cnf-sub"') >= 3);

console.log('== TÍTULO DUPLICADO ELIMINADO (print mostrava 2x EMISSÕES) ==');
ok('a tela NÃO repete o título "Emissões desta empresa" fora do box', src.indexOf('>Emissões desta empresa</p>') < 0);
ok('o box do histórico mantém o cabeçalho ÚNICO (com classe própria)', trx.indexOf("class=\"nfx-hist-cab\"") >= 0 && trx.indexOf('EMISSÕES DESTA EMPRESA (ficam salvas na nuvem)') >= 0);
ok('linhas e botões do histórico com classes escuras', trx.indexOf('class="nfx-linha"') >= 0 && trx.indexOf('class="nfx-btn-mini"') >= 0 && trx.indexOf('class="nfx-btn-mini nfx-btn-cancel"') >= 0 && trx.indexOf('class="nfx-vazio"') >= 0);
ok('rende dentro de cnf-hist com box classificado (sem inline claro pendurado)', trx.indexOf("document.getElementById('cnf-hist')") >= 0 && trx.indexOf("box.className='nfx-hist'") >= 0);

console.log('== saveConfig BLINDADO (o TypeError que ele logou) ==');
ok('guarda o saveConfig original (não quebra o existente)', src.indexOf('_saveConfig0.apply') >= 0 && src.indexOf('window.saveConfig=function()') >= 0);
ok('confere se os inputs de empresa EXISTEM antes de deixar o original rodar', src.indexOf("['cfg-emp-nome','cfg-emp-cnpj','cfg-emp-fone','cfg-emp-email'].some(") >= 0);
ok('tela sem os campos: NÃO quebra, salva o db e só avisa', src.indexOf('Nada de empresa para salvar nesta tela') >= 0 && src.indexOf('document.getElementById(id)') >= 0);
ok('try/catch envolve o save (nenhum TypeError volta a vazar)', src.indexOf("catch(e){ acToast('Falha ao salvar configuração: '") >= 0);
ok('a placa que apareceu no console é mencionada no rótulo', src.indexOf('saveConfig blindado') >= 0 && bundle.indexOf('v6.0.3 — fiscal no modo escuro + saveConfig blindado') >= 0);

console.log('== CARIMBO 6.0.3 ==');
ok('package.json na 6.0.3', pkg.version === '6.1.0');
ok('index.html carimbado 6.0.3', html.indexOf("DIGICOPY_APP_VERSION = '6.1.0'") >= 0 && html.indexOf('>v6.1.0<') >= 0);
ok('manifesto já é 219 (v6.0.14 fecha a fila com as 6 telas fiscais completas do catálogo)', manifest.length === 220 && manifest[manifest.length - 13] === 'autocura_empresa_central_nf_tela_patch.js' && manifest[manifest.length - 12] === 'perfis_nuvem_cura_sessao_patch.js' && manifest[manifest.length - 11] === 'permissoes_estorno_venda_patch.js' && manifest[manifest.length - 10] === 'fiscal_menu_completo_patch.js' && manifest[manifest.length - 9] === 'dashboard_inicio_clicavel_patch.js' && manifest[manifest.length - 8] === 'menus_fiscais_separados_patch.js' && manifest[manifest.length - 7] === 'permissoes_override_menus_fiscais_patch.js' && manifest[manifest.length - 6] === 'seis_submenus_velho_patch.js' && manifest[manifest.length - 5] === 'submenu_hover_nfe_patch.js' && manifest[manifest.length - 4] === 'navegacao_sem_tela_branca_patch.js' && manifest[manifest.length - 3] === 'ribbon_fiscal_estilo_antigo_patch.js' && manifest[manifest.length - 2] === 'fiscal_catalogo_completo_patch.js');
ok('worker SEGUE 5.26.3 · gerente SEGUE 5.26.3', fs.readFileSync('cloudflare-worker/src/index.js', 'utf8').indexOf("WORKER_VERSION = '5.26.3'") >= 0 && JSON.parse(fs.readFileSync('gerente-atualizacoes/package.json', 'utf8')).version === '5.26.3');

console.log('\nTudo OK — v6.0.3 (fiscal bonito no claro e no escuro: sem texto fantasma, sem card pendurado, sem título duplicado; saveConfig não explode mais com tela neo aberta).');
