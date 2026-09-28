// test_faixa_botoes_r46.js — r46 (v7.1.0) + r47 (v7.1.1, Q2): faixa de botões.
// Pedido do dono (relatório r45, confirmado com "sim"): tirar os botões de
// teste/confusão e deixar a sincronização 100% automática.
// 8 REMOÇÕES na r46 + TRAZER-DE-VOLTA apagado de vez na r47 (para todos os logins).
const fs = require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const ler = a => fs.readFileSync(a, 'utf8');

const sync = ler('cloudflare_sync_patch.js');
const vig = ler('ajustes_v5227_nuvem_acompanhamento_patch.js');
const nao = ler('ajustes_v52246_nuvem_nao_autorizar_patch.js');
const bk = ler('ajustes_v52296_backups_nuvem_patch.js');
const fx = ler('ajustes_v7015_nuvem_explica_patch.js');

console.log('== r46: as 8 remoções sumiram das fontes ==');
ok('só-nuvem: sem ligar/desligar e sem limpar', !sync.includes('dc-sonuvem-toggle') && !sync.includes('dc-sonuvem-limpar'));
ok('sincronizar-agora saiu', !sync.includes('dc-sync-now') && !sync.includes('Sincronizar agora'));
ok('não-autorizar saiu', !nao.includes('dc-nao-autorizar-local'));
ok('por-que-não-aparecem saiu (botão + função)', !vig.includes('dc-diag-invisiveis') && !vig.includes('dcDiagnosticoInvisiveis'));
ok('reparar-sessão saiu (botão; cura automática continua)', !vig.includes('dc-reparar-sessao'));
ok('check-up saiu (botão + 5 consertos + resumo)', !vig.includes('dc-abrir-checkup') && !vig.includes('dc-ck-') && !vig.includes('dcCheckupNuvem') && !vig.includes('injetarBotaoCheckup'));
ok('ralador de backups saiu (botão + função)', !bk.includes('bk-excluir-todos') && !bk.includes('excluirTodos'));
ok('faixa de avisos não chama mais o check-up', !fx.includes('dcCheckupNuvem') && !fx.includes('Ver check-up'));

console.log('== r46: o que FICA continua ==');
ok('só-nuvem explicado na tela (sem botão)', sync.includes('SÓ NUVEM'));
ok('desconectar este computador', sync.includes('Desconectar ESTE computador'));
ok('ver aparelhos + ver excluídos', sync.includes('dc-list-devices') && sync.includes('dc-list-deleted'));
ok('zerar dados da nuvem (admin)', sync.includes('dc-reset-cloud'));
ok('escolha da reinstalação (enviar/não-enviar)', sync.includes('dc-enviar-locais') && sync.includes('dc-nao-enviar'));
ok('acompanhar dados dos PCs', vig.includes('dc-watch-devices'));
ok('trazer-de-volta APAGADO de vez (r47 Q2: botão some p/ todos os logins)', !bk.includes('dc-restaurar-lote') && !bk.includes('instalarBotao') && !bk.includes('🩹 Trazer de volta o que foi excluído'));
ok('motor de recuperação guardado e testado (volta em 1 versão se pedir)', bk.includes('DIGICOPY_RECUPERAR') && bk.includes('restaurarLista'));
ok('diagnóstico + conferir agora', bk.includes('dc-diag-btn') && bk.includes('Conferir agora'));
ok('backup manual + baixar .zip', bk.includes('bk-agora') && bk.includes('bk-baixar-todos'));
ok('mandar-erro vivo no patch próprio', ler('ajustes_v7020_mandar_erro_patch.js').includes('digicopyMandarErro'));

console.log('== r46: avisos abrem a nuvem (trazer saiu na r47) ==');
ok('restaurar item-a-item continua (dentro de Ver excluídos)', ler('cloudflare_sync_patch.js').includes('dc-restore'));
ok('avisos renomeados (5× Abrir a Nuvem)', (fx.match(/rotulo: 'Abrir a Nuvem'/g) || []).length === 5);
ok('aviso abre a janela da nuvem', /function irCheckup\(\)\{[^}]*abrirCloudflareNuvem/s.test(fx));

console.log('== r46: bundles limpos (rodar npm run bundle antes de entregar) ==');
const b1 = ler('app.bundle.js'), b2 = ler('mobile/www/app.bundle.js');
['dc-sync-now', 'dc-sonuvem-toggle', 'dc-diag-invisiveis', 'dc-reparar-sessao', 'dc-abrir-checkup', 'dcCheckupNuvem', 'dcDiagnosticoInvisiveis', 'dc-nao-autorizar-local', 'bk-excluir-todos', 'dc-restaurar-lote', 'instalarBotao'].forEach(id => {
  ok('bundle sem ' + id, !b1.includes(id) && !b2.includes(id));
});
ok('bundles com o que fica', b1.includes('dc-watch-devices') && b2.includes('dc-watch-devices') && b1.includes('DIGICOPY_RECUPERAR') && b2.includes('DIGICOPY_RECUPERAR'));

console.log('\nRESULTADO: faixa de botões r46 passou!');
