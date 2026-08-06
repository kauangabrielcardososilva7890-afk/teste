const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('vendas_chamados_reparo_patch.js','utf8');
const db={config:{empresa:{nome:'DIGICOPY Cartuchos LTDA',fantasia:'DIGICOPY',cnpj:'00.000.000/0001-00',fone:'(38) 0000-0000',endereco:'Rua A',numero:'10',bairro:'Centro',cidade:'Jaíba',estado:'MG'}},empresas:[{id:'emp',nome:'Razão Loja',fantasia:'Loja Teste',cnpj:'11.111.111/0001-11',endereco:'Av B',numero:'20',bairro:'Bairro',cidade:'Jaíba',estado:'MG',whatsapp:'+55 38 99109-8698'}]};
const ctx={window:{},document:undefined,db,localStorage:undefined};
new Function('window','document','db','localStorage',code)(ctx.window,ctx.document,ctx.db,ctx.localStorage);
const P=ctx.window.VENDAS_CHAMADOS_REPARO_PURE;
console.log('== VENDAS_CHAMADOS_REPARO_PURE ==');
ok('exporta funções puras', !!P && typeof P.validarChamadoParaFaturar==='function');
const emp=P.empresaCompleta(db,{empresaId:'emp',cnpj:'22'});
ok('empresa completa tem fantasia, endereço e whatsapp', emp.fantasia==='Loja Teste' && emp.endereco.includes('Av B') && emp.whatsapp.includes('99109'));
ok('contador calcula diferença e aceita vazio', P.contadorQtd(100,150)===50 && P.contadorQtd(100,'')===0);
const faltas=P.validarChamadoParaFaturar({clienteId:'',modelo:'',descricao:'',servicoExecutado:'',contadorPretoAtual:''});
ok('validação cobra campos obrigatórios para faturar chamado', faltas.includes('cliente') && faltas.includes('contador preto atual') && faltas.length===5);
ok('validação aceita color opcional', P.validarChamadoParaFaturar({clienteId:'cli',modelo:'HP',descricao:'defeito',servicoExecutado:'limpeza',contadorPretoAtual:120}).length===0);
ok('próximo número interno só número', P.proximoNumero([{empresaId:'emp',numero:'OS-2024-0009'},{empresaId:'emp',numero:'10'}],'emp')==='11');
console.log('\nRESULTADO: Testes de reparo vendas/chamados passaram!');
