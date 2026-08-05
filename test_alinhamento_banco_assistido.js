const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const code=fs.readFileSync('alinhamento_banco_assistido_patch.js','utf8');
const db={config:{},modulosDinamicos:{
  CLIENTES:{dados:[{COD_CLIENTE:1,NOME_RAZAOSOCIAL:'A',CPF_CNPJ:'1'}]},
  ITENS_LOCACAO:{dados:[{IT_COD_ITENS_LOCACAO:1,IT_COD_LOCACAO:2,IT_SERIAL:'S'}]},
  CONTADOR_PAGINAS:{dados:[{COD_CONTADOR:1,CP_COD_LEITURA:2,CP_TIPO:'PRETO'}]},
  BAIRROS:{dados:[{COD_BAIRRO:1,DESCRICAO:'Centro'}]},
  CONFIG_FINANCEIRO:{dados:[{DIAS_PRAZO:30,JUROS_PADRAO:2,CLIENTE_BALCAO:1}]},
  EMPRESAS:{dados:[{COD_EMPRESA:1,RAZAO_SOCIAL:'Empresa',CNPJ:'00000000000000'}]},
  RESTRICAO_USUARIOS:{dados:[{COD_FUNCIONARIO:1,VISUALIZAR:'S',FATURAR:'N',EXPORTAR:'N'}]},
  CAIXA:{dados:[{COD_CAIXA:1,VALOR_ABERTURA:100,VALOR_FECHAMENTO:200}]},
  ROTEIRO_COLETA:{dados:[{COD_ROTEIRO:1,DATA_ENTREGA:'2026-08-05',MOTOBOY:'Técnico'}]}
}};
const ctx={window:{},document:undefined,db};
new Function('window','document','db',code)(ctx.window,ctx.document,ctx.db);
const A=ctx.window.ALINHAMENTO_BANCO_PURE;
console.log('== ALINHAMENTO_BANCO_PURE ==');
ok('classifica clientes', A.classificarTabela('CLIENTES', db.modulosDinamicos.CLIENTES).destino==='clientes');
ok('classifica itens locação como impressoras contrato', A.classificarTabela('ITENS_LOCACAO', db.modulosDinamicos.ITENS_LOCACAO).destino==='impressoras_contrato');
ok('classifica contador páginas', A.classificarTabela('CONTADOR_PAGINAS', db.modulosDinamicos.CONTADOR_PAGINAS).destino==='contadores');
ok('configuração não cai mais como ignorar técnico', A.classificarTabela('CONFIG_FINANCEIRO', db.modulosDinamicos.CONFIG_FINANCEIRO).destino==='configuracoes');
ok('classifica empresas/dados da loja', A.classificarTabela('EMPRESAS', db.modulosDinamicos.EMPRESAS).destino==='empresas');
ok('classifica permissões/restrições separado de usuário', A.classificarTabela('RESTRICAO_USUARIOS', db.modulosDinamicos.RESTRICAO_USUARIOS).destino==='permissoes');
ok('classifica caixa/contas', A.classificarTabela('CAIXA', db.modulosDinamicos.CAIXA).destino==='caixa');
ok('classifica roteiro/coleta como logística', A.classificarTabela('ROTEIRO_COLETA', db.modulosDinamicos.ROTEIRO_COLETA).destino==='logistica');
const r=A.analisarBanco(db);
ok('analisa total de tabelas', r.totalTabelas===9 && r.totalRegistros===9);
ok('tem destinos esperados', A.DESTINOS.some(d=>d.id==='leituras') && A.DESTINOS.some(d=>d.id==='logistica') && A.DESTINOS.some(d=>d.id==='configuracoes') && A.ESPERADOS.some(e=>e[0]==='contratos'));
const rel=A.relatorioAlinhamento(db);
ok('relatório contém tabelas e faltantes', rel.includes('CLIENTES') && rel.includes('CONFIG_FINANCEIRO') && rel.includes('ROTEIRO_COLETA') && rel.includes('Módulos esperados'));
console.log('\nRESULTADO: Testes de alinhamento assistido passaram!');
