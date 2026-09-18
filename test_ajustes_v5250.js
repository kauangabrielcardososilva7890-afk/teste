// test_ajustes_v5250.js — v5.25.0: revisão completa da área de leituras
// (relato: contador anterior sumiu / faturar+estornar sem confirmação e sem
// pop-up do sistema / rodapé da leitura desatualizado / tela antiga fora do
// contrato aposentada por decreto).
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const patch = fs.readFileSync('ajustes_v5250_leitura_overhaul_patch.js', 'utf8');

// ── 1. Marcas estruturais ────────────────────────────────────────────────────
ok(patch.includes('LEITURA_OVERHAUL_V5250_PURE'), 'expõe PURE');
ok(patch.includes('v5250-lan-ant') && patch.includes('Contador anterior registrado'), 'avulso 1: chip de contador anterior no lançamento');
ok(patch.includes('atualizarTiposLancamento') && patch.includes("'lan-med'") && patch.includes("'lan-prq'"), 'chip atualiza ao trocar impressora/tipo (mudança delegada + wrap)');
ok(patch.includes("'Faturar leitura'") && patch.includes("'Estornar leitura'") && patch.includes("'Remover lançamento'"), 'avulso 2/4: faturar, estornar e remover com confirmSistema (pop-up do sistema, título próprio)');
ok(patch.includes('v5250fatDaLista') && patch.includes('injetarAcoesListagem'), 'avulso 2: botões Faturar/Estornar por leitura na LISTAGEM');
ok(patch.includes('v5250-lei-salvar') && patch.includes("abrirLeiturasContrato") && patch.includes('data-nfe-emit'), 'avulso 3: rodapé reconstruído — remove Voltar+NF-e, fica Salvar (volta à listagem) + Imprimir');
ok(patch.includes('v5250leituraXBypass') && patch.includes('antes de fechar'), 'avulso 3: X da leitura pergunta "salvar antes de fechar?" com pop-up do sistema');
ok(patch.includes('Leituras agora vivem dentro do contrato') && patch.includes('pendentesLegadas') && patch.includes('gerarFaturasPendentes'), 'decreto: tela antiga aposentada + resgate de pendências velhas (nada órfão)');
ok(patch.includes("tipo==='leitura'") && patch.includes('data-nav="leituras"'), 'tela antiga: openModal redirect + menu escondido');
ok((patch.match(/__v5250lo/g) || []).length >= 10, 'guards __v5250lo em todos os wraps');

// ── 2. Funcional ─────────────────────────────────────────────────────────────
(async function(){
  const alertas = [];
  const calls = { fat: 0, det: 0, lista: 0, nfe: 0, saveDB: 0, nav: [] };
  const fakeDoc = {
    getElementById(){ return null; },
    querySelectorAll(){ return []; },
    createElement(){ return { style:{}, classList:{toggle(){},add(){}}, setAttribute(){}, appendChild(){}, remove(){}, innerHTML:'' }; },
    addEventListener(){}
  };
  const dbFix = {
    leituras: [
      { id:'l1', contratoId:'c1', clienteId:'cli1', numero:'L-9', status:'faturado', itens:[{valorTotal: 120}], valorTotal: 120 },
      { id:'l2', contratoId:'c1', clienteId:'cli1', numero:'L-10', status:'aberta', itens:[], valorTotal: 0 },
      { id:'lOld', parqueId:'p9', empresaId:'e1', status:'pendente', dataLeitura:'2026-01-01' }
    ],
    contasReceber: [
      { id:'cr1', leituraId:'l1', status:'aberto', pagamentoData:'2026-09-10' }
    ],
    contratos: [ { id:'c1', clienteId:'cli1', status:'ativo' } ],
    parque: [ { id:'p1', contadores:{ pretoA4: 1150 }, medidores:{ pretoA4:{contadorInicial: 100} } }, { id:'p2', contadores:{}, medidores:{ pretoA4:{contadorInicial: 100} } } ]
  };
  const win = {
    lfbAlert(m){ alertas.push(String(m)); },
    toastMsg(m){ calls.toast = String(m); },
    confirmSistema(msg, t){ calls['conf_'+t] = String(msg); return Promise.resolve(true); },
    faturarLeituraContrato(){ calls.fat++; },
    estornarLeituraContrato(){},
    abrirLeituraContratoDetalhe(id){ calls.det++; calls.detId = id; },
    abrirLeiturasContrato(id){ calls.lista++; calls.listaId = id; },
    getSession(){ return { empresaId:'e1' }; },
    saveDB(){ calls.saveDB++; },
    navigateTo(v){ calls.nav.push(v); }
  };
  const ctx = { window: win, document: fakeDoc, db: dbFix, saveDB: win.saveDB };
  new Function('window','document','db','saveDB', patch)(ctx.window, ctx.document, ctx.db, ctx.saveDB);

  const P = win.LEITURA_OVERHAUL_V5250_PURE;
  ok(!!P, 'PURE registrada');
  ok(P.tituloEhLeitura('Leitura L-9 — Padaria') && !P.tituloEhLeitura('Novo lançamento de contador') && !P.tituloEhLeitura('Editar lançamento'), 'PURE: título de detalhe de leitura reconhecido (lançamento NÃO dispara o X)');
  ok(P.contadorAnteriorInfo(dbFix, dbFix.parque[0], 'pretoA4', null) === 1150, 'PURE: contador anterior live do parque');
  ok(P.contadorAnteriorInfo(dbFix, dbFix.parque[0], 'pretoA4', {anterior: 1000}) === 1000, 'PURE: edição mostra o congelado do item (1000), não o do parque (1150)');
  ok(P.contadorAnteriorInfo(dbFix, dbFix.parque[1], 'pretoA4', null) === 100, 'PURE: sem contador salvo → cai no contadorInicial (100)');
  ok(P.contadorAnteriorInfo(dbFix, dbFix.parque[1], 'colorA4', null) === 0, 'PURE: medidor inexistente → 0 (igual o cálculo original)');
  ok(P.valorLeitura(dbFix.leituras[0]) === 120, 'PURE: valor da leitura');
  ok(P.pendentesLegadas(dbFix, 'e1').length === 1 && P.pendentesLegadas(dbFix, 'e2').length === 0, 'PURE: acha pendência do formato legado (resgate no cartão)');

  // Estorno via execEstorno (o que roda depois do Confirmar)
  const crs = P.execEstorno(dbFix, dbFix.leituras[0]);
  ok(crs === 1 && dbFix.leituras[0].status === 'estornada' && dbFix.contasReceber[0].status === 'estornado' && dbFix.contasReceber[0].pagamentoData === null, 'PURE execEstorno: leitura aberta p/ edição + cobrança estornada + data limpa');

  // Faturar com popup do sistema
  win.faturarLeituraContrato('l2');
  await new Promise(r=>setTimeout(r,5));
  ok(calls.fat === 1 && calls['conf_Faturar leitura'] && calls['conf_Faturar leitura'].includes('L-10'), 'faturar: confirmação do SISTEMA com número da leitura antes de faturar');

  if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }

  // ── 3. Bundle / versão / mural / celular ───────────────────────────────────
  const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
  ok(man.length >= 201 && man[200] === 'ajustes_v5250_leitura_overhaul_patch.js', 'manifest: revisão de leituras fecha a ERA v5.25.0 na posição 201 (o v5.26.0 do CNPJ+gerente pode vir depois)');
  const bundle = fs.readFileSync('app.bundle.js', 'utf8');
  ok(bundle.includes('LEITURA_OVERHAUL_V5250_PURE') && bundle.includes('Contador anterior registrado') && bundle.includes('Leituras agora vivem dentro do contrato'), 'bundle: revisão dentro');
  ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('LEITURA_OVERHAUL_V5250_PURE'), 'bundle do CELULAR igual');
  ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '6.0.9'"), 'index 6.0.9 (re-ancorado: v5.26.0 = CNPJ + gerente)');
  ok(fs.readFileSync('index.html', 'utf8').includes('>v6.0.9<'), 'rodapé v6.0.9 (re-ancorado: entrega grande ganhou a 2ª casa)');
  ok(fs.readFileSync('mobile/www/index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '6.0.9'"), 'celular 6.0.9');
  ok(JSON.parse(fs.readFileSync('package.json', 'utf8')).version === '6.0.9', 'package.json 6.0.9');

  if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
  console.log('\nTudo OK — v5.25.0 (revisão completa de leituras: anterior visível, confirmações do sistema, ações na listagem, rodapé novo, tela antiga aposentada com resgate).');
})().catch(e=>{ console.error('✘ exceção no funcional:', e && e.message); process.exit(1); });
