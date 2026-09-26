// test_ajustes_v52422.js — v5.24.34: pacote 2A do RELATORIO GRANDE.
// F1 contratos padrão "Hoje (criados ou mexidos hoje)" + botão Mostrar todos.
// F2 chamados: imprimir direto (sem abrir) + excluir com aviso escolhido;
//    cabeçalho "PDF" vira ícone de impressora; neo externa (view-manutencao)
//    ganha as mesmas duas ações.
// P6 contrato RTF: no .exe abre DIRETO no Word (rtf:abrir + shell.openPath);
//    navegador/celular seguem no download; mapa de campos completado
//    (DATA_INICIO, DATA_FIM, telefones, endereço completo...).
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const ctrs = fs.readFileSync('ajustes_v52237_contratos_filtros_patch.js', 'utf8');
const cham = fs.readFileSync('locacao_chamados_fix_patch.js', 'utf8');
const noti = fs.readFileSync('notinha_patch.js', 'utf8');
const main = fs.readFileSync('main.js', 'utf8');
const prel = fs.readFileSync('preload.js', 'utf8');
const rtfp = fs.readFileSync('contratos_rtf_template_patch.js', 'utf8');

// F1
ok(ctrs.includes("['hoje','Hoje (criados ou mexidos hoje)']"), 'F1: opção "Hoje" existe na faixa de filtros');
ok(ctrs.includes("campo:'hoje'") && ctrs.includes("campo:'hoje', q:''"), 'F1: estado padrão da tela = Hoje');
ok(ctrs.includes('__ctrMexeuHoje'), 'F1: cálculo vivo "mexeu hoje" (sem depender de carimbo)');
ok(ctrs.includes("tenta(db.os, 'contratoId'") && ctrs.includes("tenta(db.leituras, 'contratoId'") && ctrs.includes("tenta(db.parque, 'contratoId'"), 'F1: cobre impressora/chamado/leitura na mesma data');
ok(ctrs.includes('ctr-mostrar-todos'), 'F1: botão Mostrar todos plantado');
ok(ctrs.includes("STATE.campo='todos'; STATE.q='';"), 'F1: Mostrar todos limpa campo e busca');

// F2
ok(cham.includes('imprimirChamadoAgoraV52422'), 'F2: imprimir direto (sem abrir)');
ok(cham.includes('excluirChamadoV52422'), 'F2: excluir chamado existe');
ok(cham.includes('Esse chamado é DE CONTRATO'), 'F2: aviso ESPECIAL de chamado de contrato (= texto dele)');
ok(cham.includes('Excluir este chamado? Apaga SEM volta'), 'F2: aviso normal nos fora-de-contrato');
ok(cham.includes("/pdf/i.test(String(th.textContent||''))") && cham.includes('ph ph-printer text-slate-500'), 'F2: onde estava "PDF" nasce o ícone da impressora');
ok(cham.includes("db.os.splice(i,1)"), 'F2: apaga de verdade na fonte (o havia pedido "deletar é pra deletar")');
ok(noti.includes('window.imprimirChamadoAgoraV52422&&window.imprimirChamadoAgoraV52422') , 'F2: neo externa (view-manutencao) tem a dupla');

// P6
ok(main.includes("ipcMain.handle('rtf:abrir'"), 'P6: handler rtf:abrir no main.js');
ok(main.includes('shell.openPath(full)'), 'P6: shell.openPath abre no Word associado');
ok(main.includes("app.getPath('temp')"), 'P6: arquivo temporário no temp do sistema');
ok(prel.includes('rtfAPI: {') && prel.includes("ipcRenderer.invoke('rtf:abrir'"), 'P6: ponte preload exposta');
ok(rtfp.includes('window.rtfAPI.abrir({ nome: nome, conteudo: rtfFinal })'), 'P6: desktop usa a ponte');
ok(rtfp.includes('else if(typeof toast=='), 'P6: toast de "Abrindo no Word" no sucesso');
ok(rtfp.includes('DATA_INICIO') && rtfp.includes('DATA_FIM') && rtfp.includes('DATA_HOJE') && rtfp.includes('CTR_CODIGO'), 'P6: mapa cobre DATA_INICIO/FIM/HOJE + código do contrato');
ok(rtfp.includes('CLI_TELEFONE') && rtfp.includes('CLI_ENDCOMPLETO') && rtfp.includes('EMP_EMAIL'), 'P6: campos cliente/empresa completados');

const bundle = fs.readFileSync('app.bundle.js', 'utf8');
ok(bundle.includes('__ctrMexeuHoje') && bundle.includes('excluirChamadoV52422'), 'bundle: F1+F2 presentes');
ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('__ctrMexeuHoje'), 'bundle do CELULAR igual');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '" + pkg.version + "'"), 'index: versão v' + pkg.version);
ok(fs.readFileSync('index.html', 'utf8').includes('>v' + pkg.version + '<'), 'index: rodapé v' + pkg.version);
ok(/"version": "\d+\.\d+\.\d+"/.test(fs.readFileSync('package.json', 'utf8')), 'package.json com versão válida (v' + pkg.version + ')');
ok(main.includes('v5.24.34'), 'main.js com o comentário da versão');
ok(prel.includes("'5.24.34'") || prel.includes("v5.24.34") || prel.includes('5.24.34'), 'preload carimbado');

if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
console.log('\nTudo OK — v' + pkg.version + ' pacote 2A (F1 contratos-hoje, F2 chamados excluir+imprimir, P6 RTF no Word).');
