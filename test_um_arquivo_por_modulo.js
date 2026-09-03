// ═══════════════════════════════════════════════════════════════════════════
// TESTE — um arquivo por módulo (sem cópia com versão nova)
//
// Regra do projeto: correção MEXE no arquivo do módulo que já existe.
// Só se cria arquivo novo quando a função ainda não existe em lugar nenhum.
//
// O que aconteceu na v5.22.43: em vez de corrigir os 6 arquivos da v5.22.42,
// cada um foi COPIADO inteiro e a versão trocada. Os 12 ficaram no bundle e os
// 6 antigos rodavam antes só para serem sobrescritos — trabalho dobrado, e no
// financeiro a barra antiga chegava a ser desenhada antes de ser refeita.
// Um dos pares (financeiro_menu) era byte a byte igual, só mudava o número.
//
// Este teste impede a volta do padrão.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1);} console.log('  ✔ '+name); }

const manifest = JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));

console.log('== UM ARQUIVO POR MÓDULO ==');

// ── 1. Nenhum módulo pode ter duas versões no bundle ────────────────────────
const porModulo = {};
for (const f of manifest) {
  const m = /^ajustes_v(\d+)_(.+)_patch\.js$/.exec(f);
  if (!m) continue;
  (porModulo[m[2]] = porModulo[m[2]] || []).push(f);
}
const duplicados = Object.keys(porModulo).filter(k => porModulo[k].length > 1);
ok('nenhum módulo aparece em duas versões' +
   (duplicados.length ? ' → ' + duplicados.map(k => k + ': ' + porModulo[k].join(' + ')).join(' | ') : ''),
   duplicados.length === 0);

// ── 2. Nenhum par de arquivos com conteúdo igual ────────────────────────────
// Copiar um patch e só trocar o número de versão é o erro que gerou o item 1.
function normalizar(s){
  return s.replace(/5\.22\.\d+/g, 'VER')
          .replace(/[Vv]522\d\d/g, 'VER')
          .replace(/\s+/g, ' ')
          .trim();
}
const vistos = new Map();
const iguais = [];
for (const f of manifest) {
  if (!fs.existsSync(f)) continue;
  const chave = normalizar(fs.readFileSync(f, 'utf8'));
  if (chave.length < 200) continue;              // arquivos minúsculos podem coincidir
  if (vistos.has(chave)) iguais.push(vistos.get(chave) + ' == ' + f);
  else vistos.set(chave, f);
}
ok('nenhum arquivo é cópia de outro só com a versão trocada' +
   (iguais.length ? ' → ' + iguais.join(', ') : ''),
   iguais.length === 0);

// ── 3. Cada símbolo público sai de um lugar só ──────────────────────────────
// Dois arquivos publicando window.X é o sintoma de módulo duplicado. Aqui só
// vale para os *_PURE, que são a assinatura de cada módulo.
const donos = {};
for (const f of manifest) {
  if (!fs.existsSync(f)) continue;
  const s = fs.readFileSync(f, 'utf8');
  // (?!=) evita casar com comparação (=== / ==), que só LÊ o objeto
  for (const m of s.matchAll(/window\.([A-Z0-9_]+_PURE)\s*=(?!=)/g)) {
    (donos[m[1]] = donos[m[1]] || []).push(f);
  }
}
const compartilhados = Object.keys(donos).filter(k => new Set(donos[k]).size > 1);
ok('cada módulo publica seu _PURE de um arquivo só' +
   (compartilhados.length ? ' → ' + compartilhados.join(', ') : ''),
   compartilhados.length === 0);

// ── 4. Os arquivos consolidados não voltaram ────────────────────────────────
const CONSOLIDADOS = [
  'ajustes_v52242_orcamentos_status_patch.js',
  'ajustes_v52242_contratos_sort_patch.js',
  'ajustes_v52242_impressora_remanejar_patch.js',
  'ajustes_v52242_financeiro_filtros_patch.js',
  'ajustes_v52242_financeiro_menu_patch.js',
  'ajustes_v52242_menu_versao_boleto_patch.js'
];
const voltaram = CONSOLIDADOS.filter(f => fs.existsSync(f) || manifest.includes(f));
ok('os 6 arquivos consolidados na v5.22.43 não voltaram' +
   (voltaram.length ? ' → ' + voltaram.join(', ') : ''),
   voltaram.length === 0);

// ── 5. O módulo que ficou continua completo ─────────────────────────────────
const MODULOS = ['orcamentos_status','contratos_sort','impressora_remanejar',
                 'financeiro_filtros','financeiro_menu','menu_versao_boleto'];
for (const mod of MODULOS) {
  const arq = 'ajustes_v52243_' + mod + '_patch.js';
  ok('módulo ' + mod + ' presente e único', fs.existsSync(arq) && manifest.includes(arq));
}

console.log('\nRESULTADO: um arquivo por módulo!');
