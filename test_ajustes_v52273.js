const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const ler=f=>fs.readFileSync(f,'utf8');
const pkg=JSON.parse(ler('package.json'));
const pos=ler('ajustes_pos_final_patch.js');
const ref=ler('contratos_refino_patch.js');
const cham=ler('locacao_chamados_fix_patch.js');
const painel=ler('cloudflare_sync_patch.js');
console.log('== AJUSTES v5.22.73 ==');
ok('versão subiu para 5.22.73',pkg.version==='5.22.73');

// 1 — a venda salva
ok('sumiu o "Não encontrei função de salvar esta venda"',!/Não encontrei função de salvar esta venda/.test(pos));
ok('a camada velha de fechar venda saiu inteira',!/chamarSalvarVendaDisponivel/.test(pos)&&!/vendaEmAndamento/.test(pos));
ok('nada de confirm nativo pedindo para salvar',pos.indexOf("confirm('Você está saindo de uma venda")<0);

// 2 — contador color só quando existe
ok('só pede contador color se a impressora tiver',/chamadoTemColor\(\)/.test(cham)&&/function chamadoTemColor/.test(cham));
ok('sem impressora identificada não trava',/if\(!equipId\) return false;/.test(cham));
ok('continua usando o cadastro da impressora',/return impressoraTemColor\(p, eq\);/.test(cham));

// 3 — fim do "Cannot set properties of null"
ok('campo do chamado só é preenchido se existir',/function porCampo\(id, valor\)\{ const el = document\.getElementById\(id\); if\(el\) el\.value = valor; \}/.test(ref));
ok('nenhum campo do chamado escreve sem conferir',!/document\.getElementById\('kr-os-modelo'\)\.value/.test(ref)&&!/document\.getElementById\('kr-os-cont-ant'\)\.value/.test(ref));

// 4 — recuperar o que sumiu
ok('dá para restaurar tudo de uma vez',/dc-restore-all/.test(painel)&&/Restaurar TUDO que foi excluído/.test(painel));
ok('a restauração não apaga nada',/Nada é apagado por esta ação/.test(painel));
ok('depois de restaurar, puxa para este PC',/tick\('restauracao'\)/.test(painel));
console.log('\nRESULTADO: ajustes v5.22.73 passaram!');
