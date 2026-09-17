// test_ajustes_v52435.js — v5.24.35: P7 FINAL (serial primeiro + remanejo).
// Ressuscita o desenho v5.22.43/45 adaptado ao fluxo VENCEDOR (ids impf-*):
// serial-first no cadastro novo, aviso de remanejo SÓ no salvar, equipamento
// nunca duplicado, remanejada congelada (não edita, não entra no mensal).
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const patch = fs.readFileSync('ajustes_v52435_impressora_remanejo_final_patch.js', 'utf8');
const venc  = fs.readFileSync('fluxo_contrato_leitura_corrigido_patch.js', 'utf8');

// ── 1. Marcas estruturais do wrap ────────────────────────────────────────────
ok(patch.includes('IMPRESSORA_REMANEJO_V52435_PURE'), 'expõe PURE para teste');
ok(patch.includes('impf-avancar') && patch.includes('impf-aviso-serial') && patch.includes('impf-serie'), 'serial primeiro: botão Avançar + banner Passo 1 sobre os ids impf-* do vencedor');
ok(patch.includes('v52435-remanejadas') && patch.includes('Remanejadas (histórico congelado'), 'painel Remanejadas no contrato com dedup por id');
ok((patch.match(/__v52435rem/g) || []).length >= 4, 'guards __v52435rem nos 3 wraps + marcações');
ok(patch.includes("p.status==='remanejada'") && patch.includes('Histórico congelado'), 'remanejada congelada: abrir/editar é bloqueado');
ok(patch.includes('msgRemanejar') && patch.includes('deseja remanejar essa impressora pra esse cadastro?'), 'frase do remanejo (a dele, do desenho original)');
ok(patch.includes("status='remanejada'") && patch.includes('remanejadoParaContratoId') && patch.includes('remanejadoParaClienteId'), 'remanejo marca o antigo com rastro do destino');
ok(patch.includes('idsAntes') && patch.includes('duplicata') && patch.includes('prqNovo.equipamentoId'), 'fixup anti-duplicata: reusa o equipamento existente e reponta o parque');

// ── 2. Vencedor filtra remanejada das operações ─────────────────────────────
const filtros = (venc.match(/status!=='inativo'&&[a-z]+\.?status!=='remanejada'|status!=='remanejada'/g) || []).length;
ok(filtros >= 3, 'vencedor: remanejada fora de máquinas do contrato + mensal fixo + leitura (' + filtros + '/3)');

// ── 3. Funcional: PURE + fluxo de remanejo de ponta a ponta ─────────────────
(async function(){
  const alertas = [];
  const els = {
    'impf-serie': { value: 'SN-777' },
    'impf-modelo': { value: '' },
    'impf-patr': { value: '' }
  };
  const fakeDoc = {
    getElementById(id){ return els[id] || null; },
    querySelectorAll(){ return []; },
    createElement(){ return { style:{}, classList:{add(){}}, setAttribute(){}, appendChild(){}, remove(){} }; }
  };
  const flags = { salvarChamou: 0, confirmMsg: null, saveDB: 0, reRender: 0 };
  const eqOld = { id:'eqOLD', empresaId:'EMP1', modelo:'HP 426', serie:'SN-777', patrimonio:'P-09', contadorPB: 9000 };
  const dbFix = {
    empresaId:'EMP1',
    clientes: [{ id:'cliA', nome:'Padaria Sol' }, { id:'cliB', nome:'Loja B' }],
    equipamentos: [eqOld],
    contratos: [{ id:'cA', clienteId:'cliA', equipamentos:[] }, { id:'cB', clienteId:'cliB', equipamentos:[] }],
    parque: [
      { id:'pA', equipamentoId:'eqOLD', clienteId:'cliA', contratoId:'cA', status:'ativo', setor:'Caixa', medidores:{ pretoA4:{ contadorAnterior: 8000 } } },
      { id:'pREM', equipamentoId:'eqX', clienteId:'cliB', contratoId:'cB', status:'remanejada', frozen:{ serie:'SN-1', modelo:'X' } }
    ],
    leituras: []
  };
  const win = {
    lfbAlert(m){ alertas.push(String(m)); },
    confirmSistema(msg){ flags.confirmMsg = String(msg); return Promise.resolve(true); },
    abrirModalEquipamentoContrato(){ flags.abrirChamou = (flags.abrirChamou||0)+1; },
    salvarImpressoraContrato(contratoId){
      flags.salvarChamou++;
      // simula o vencedor: cria equipamento NOVO + parque e amarra no contrato
      const eqN = { id:'eqNEW', empresaId:'EMP1', modelo:'HP 426', serie:'SN-777', patrimonio:'P-09' };
      dbFix.equipamentos.push(eqN);
      dbFix.parque.push({ id:'pNEW'+flags.salvarChamou, equipamentoId:'eqNEW', clienteId: dbFix.contratos.find(c=>c.id===contratoId).clienteId, contratoId: contratoId, status:'ativo' });
      dbFix.contratos.find(c=>c.id===contratoId).equipamentos.push('eqNEW');
    },
    openContratoCompleto(){ flags.reRender++; },
    saveDB(){ flags.saveDB++; }
  };
  const ctx = { window: win, document: fakeDoc, db: dbFix,
    getSession(){ return { empresaId:'EMP1' }; }, saveDB: win.saveDB, openContratoCompleto: win.openContratoCompleto };
  new Function('window','document','db','getSession','saveDB','openContratoCompleto', patch)(
    ctx.window, ctx.document, ctx.db, ctx.getSession, ctx.saveDB, ctx.openContratoCompleto);

  const P = win.IMPRESSORA_REMANEJO_V52435_PURE;
  ok(!!P, 'PURE registrada no window');
  ok(P.acharEquipPorSerial(dbFix, 'sn-777', 'EMP1') === eqOld, 'PURE acha por serial (caixa alta/baixa)');
  ok(P.acharEquipPorSerial(dbFix, 'p-09', 'EMP1') === eqOld, 'PURE acha por patrimônio');
  ok(P.acharEquipPorSerial(dbFix, 'SN-777', 'EMP2') === null, 'PURE respeita a empresa da sessão');
  ok(P.parqueAtivoOutroCliente(dbFix, eqOld, 'cliB').id === 'pA', 'PURE detecta parque ATIVO em outro cliente');
  ok(P.parqueAtivoOutroCliente(dbFix, eqOld, 'cliA') === null, 'PURE: mesmo cliente não é conflito');
  ok(P.snapshotFrozen(eqOld, dbFix.parque[0]).setor === 'Caixa' && !!P.snapshotFrozen(eqOld, dbFix.parque[0]).congeladoEm, 'PURE snapshot congelado carrega setor + data');
  ok(P.msgRemanejar('Padaria Sol', 8000).includes('impressora cadastrada em Padaria Sol com o contador 8000'), 'PURE mensagem do remanejo com cliente + contador');

  // 3a. bloqueio de edição de remanejada
  const antes0 = flags.abrirChamou || 0;
  win.abrirModalEquipamentoContrato('cB', 'pREM');
  win.salvarImpressoraContrato('cB', 'pREM');
  ok((flags.abrirChamou||0) === antes0 && flags.salvarChamou === 0, 'remanejada congelada: modal não abre e salvar não roda');
  ok(alertas.filter(a=>a.includes('Histórico congelado')).length >= 2, 'aviso de congelado disparado nos 2 caminhos');

  // 3b. cadastro novo com serial ativo em OUTRO cliente → pergunta → remaneja
  win.salvarImpressoraContrato('cB', null);
  await new Promise(r=>setTimeout(r, 10));
  ok(flags.confirmMsg && flags.confirmMsg.includes('Padaria Sol') && flags.confirmMsg.includes('remanejar'), 'aviso de remanejo SÓ no salvar, citando o cliente antigo');
  ok(flags.salvarChamou === 1, 'fluxo original do vencedor rodou depois do sim');
  const pA = dbFix.parque.find(p=>p.id==='pA');
  ok(pA.status === 'remanejada' && pA.frozen && pA.frozen.serie === 'SN-777' && pA.remanejadoParaContratoId === 'cB' && pA.remanejadoParaClienteId === 'cliB', 'antiga congelada com snapshot + rastro do destino');
  ok(!dbFix.equipamentos.some(e=>e.id==='eqNEW'), 'anti-duplicata: equipamento novo removido (serial nunca duplica no sistema)');
  const pNEW = dbFix.parque.find(p=>p.id==='pNEW1');
  ok(pNEW && pNEW.equipamentoId === 'eqOLD', 'parque novo repontado pro equipamento existente');
  const cB = dbFix.contratos.find(c=>c.id==='cB');
  ok(cB.equipamentos.filter(id=>id==='eqOLD').length === 1 && !cB.equipamentos.includes('eqNEW'), 'contrato referencia só o equipamento existente');
  ok(flags.saveDB === 1 && flags.reRender === 1, 'fixup persiste e re-renderiza o contrato');

  // 3c. serial conhecido SÓ no próprio cliente → sem pergunta, sem duplicar
  const eq2 = { id:'eq2', empresaId:'EMP1', modelo:'Brother L2', serie:'SN-555', patrimonio:'P-55' };
  dbFix.equipamentos.push(eq2);
  dbFix.parque.push({ id:'pA2', equipamentoId:'eq2', clienteId:'cliA', contratoId:'cA', status:'ativo' });
  flags.confirmMsg = null; flags.salvarChamou = 0;
  const antesAlertas = alertas.length;
  els['impf-serie'].value = 'SN-555';
  win.salvarImpressoraContrato('cA', null);
  ok(flags.confirmMsg === null && flags.salvarChamou === 1, 'mesmo cliente: sem pergunta, segue direto');
  ok(!dbFix.equipamentos.some(e=>e.id==='eqNEW') && alertas.slice(antesAlertas).some(a=>a.includes('serial reconhecido')), 'mesmo cliente: reusa o existente e avisa "serial reconhecido"');

  // ── 4. Bundle / versão / celular ───────────────────────────────────────────
  const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
  ok(man[man.length-9] === 'ajustes_v52436_leitura_uma_aberta_patch.js' && man[man.length-8] === 'ajustes_v5250_leitura_overhaul_patch.js' && man[man.length-7] === 'ajustes_v5260_cnpj_gerente_patch.js' && man[man.length-6] === 'ajustes_v5262_login_nuvem_primeiro_patch.js' && man[man.length-5] === 'ajustes_v5264_chamado_data_grande_patch.js' && man[man.length-4] === 'painel_gerente_patch.js' && man[man.length-3] === 'fiscal_guard_patch.js' && man[man.length-2] === 'nf_transmissao_patch.js' && man[man.length-1] === 'autocura_empresa_central_nf_tela_patch.js', 'manifest: remanejo, depois guarda, revisao v5.25.0, CNPJ v5.26.0, login v5.26.2, chamado v5.26.4, painel, portao v6.0.0, transmissao v6.0.2 fecha a fila (vence sempre)');
  const bundle = fs.readFileSync('app.bundle.js', 'utf8');
  ok(bundle.includes('IMPRESSORA_REMANEJO_V52435_PURE') && bundle.includes('impf-avancar'), 'bundle: wrap final dentro');
  ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('IMPRESSORA_REMANEJO_V52435_PURE'), 'bundle do CELULAR igual');
  ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '6.0.2'"), 'index 6.0.2');
  ok(fs.readFileSync('index.html', 'utf8').includes('>v6.0.2<'), 'rodapé v6.0.2');
  ok(fs.readFileSync('mobile/www/index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '6.0.2'"), 'celular 6.0.2');
  ok(JSON.parse(fs.readFileSync('package.json', 'utf8')).version === '6.0.2', 'package.json 6.0.2');

  if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
  console.log('\nTudo OK — v5.24.35 (P7: serial primeiro + remanejo sem duplicar + remanejada congelada).');
})().catch(e=>{ console.error('✘ exceção no funcional:', e && e.message); process.exit(1); });
