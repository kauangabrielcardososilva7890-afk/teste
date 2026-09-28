// test_unificar_contratos_r49.js — r49: unificar contratos duplicados.
// Pedido do dono: "continue unificando sem eu dizer mais nada" (contrato 77
// duplicado do Balcão + números 8/7/1 discordando).
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const ler = a => fs.readFileSync(a, 'utf8');

console.log('== r49: regra do qual fica (pura, sem banco) ==');
const U = require('./ajustes_v52437_contrato_unificar_patch.js');
const A = (o) => Object.assign({id:'x'}, o);
let r = U.escolherPrincipal(
  A({criadoPor:'migracao', __nAtivas:9, criadoEm:'2020-01-01', numero:'1'}),
  A({criadoPor:'u1', __nAtivas:0, criadoEm:'2026-01-01', numero:'77'}));
ok('criado por gente ganha da migração mesmo com menos impressoras', r.manter.criadoPor === 'u1');
r = U.escolherPrincipal(
  A({numero:'1', __nAtivas:7, criadoEm:'2026-08-17'}),
  A({numero:'77', __nAtivas:1, criadoEm:'2026-08-01'}));
ok('com mais impressoras ganha mesmo sendo mais novo (caso Balcão: fica o 1)', r.manter.numero === '1');
r = U.escolherPrincipal(
  A({numero:'5', __nAtivas:3, criadoEm:'2026-09-01'}),
  A({numero:'9', __nAtivas:3, criadoEm:'2026-08-01'}));
ok('empatou impressoras: mais antigo ganha', r.manter.numero === '9');
r = U.escolherPrincipal(
  A({numero:'77', __nAtivas:2, criadoEm:'2026-08-01'}),
  A({numero:'1', __nAtivas:2, criadoEm:'2026-08-01'}));
ok('empatou tudo: menor código ganha', r.manter.numero === '1');

console.log('== r49: o unificar existe e é reversível ==');
const f = ler('ajustes_v52437_contrato_unificar_patch.js');
ok('unificar + desfazer expostos', f.includes('unificarContratos') && f.includes('desfazerUnificacao'));
ok('aposenta com status encerrado (não apaga)', f.includes("'encerrado'"));
ok('guarda de-onde-veio cada linha (contratoIdAnterior)', f.includes('contratoIdAnterior'));
ok('registra na Auditoria', f.includes("logAction('contrato'"));
ok('sugestão automática no modal (banner)', f.includes('v52437-uni'));
ok('só unifica mesmo cliente e mesma empresa (trava)', f.includes('cliente-diferente') && f.includes('empresa-diferente'));

console.log('== r49: UMA conta oficial nas 3 telas ==');
ok('conta oficial exportada', ler('contratos_final_patch.js').includes('window.maquinasContrato'));
ok('tabela v52243 usa a conta oficial', ler('ajustes_v52243_impressora_remanejar_patch.js').includes('maquinasContrato(c)'));
const v45 = ler('ajustes_v52245_impressora_serial_ocultar_patch.js');
ok('tabela v52245 usa a conta oficial', v45.includes('maquinasContrato(c)'));
ok('verde recalculado no instante da tabela', v45.includes('sincVerdeContrato'));

console.log('== r49: bundles (rodar npm run bundle antes de entregar) ==');
const b1 = ler('app.bundle.js'), b2 = ler('mobile/www/app.bundle.js');
ok('bundles com o unificar', b1.includes('unificarContratos') && b2.includes('unificarContratos'));
ok('bundles com a conta oficial', b1.includes('window.maquinasContrato') && b2.includes('window.maquinasContrato'));

console.log('\nRESULTADO: unificar contratos r49 passou!');
