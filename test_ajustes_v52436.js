// test_ajustes_v52436.js — v5.24.36: bug relatado por ele (contrato → leituras
// → novo → faturar → estornar → editar contador → lista mostra o anterior
// errado) + decreto: só cria nova leitura se a aberta estiver fechada.
const fs = require('fs');
let falhas = 0;
function ok(cond, msg) {
  if (cond) console.log('✔', msg);
  else { console.error('✘', msg); falhas++; }
}

const patch = fs.readFileSync('ajustes_v52436_leitura_uma_aberta_patch.js', 'utf8');

// ── 1. Marcas estruturais ────────────────────────────────────────────────────
ok(patch.includes('LEITURA_UMA_ABERTA_V52436_PURE'), 'expõe PURE para teste');
ok(patch.includes("guarda('novaLeituraContrato'") && patch.includes("guarda('criarLeituraDetalhada'") && patch.includes("guarda('criarLeituraDefinitiva'"), 'guarda nos 3 caminhos que criam leitura (decreto universal)');
ok(patch.includes("l.status!=='faturado'") && patch.includes('Array.isArray(l.itens)'), 'aberta = formato novo (itens) não faturada — legado parqueId simples fica fora');
ok(patch.includes('Fature (feche) ela antes de criar outra') && patch.includes('ou apague a leitura'), 'mensagem explica como fechar (a saída dela mesma)');
ok(patch.includes('lan-edit-idx') && patch.includes('p.contadores[item.medidor] = n(item.anterior)'), 'edição pós-estorno: parque vivo alinhado ao anterior do item ANTES do salvar original');
ok((patch.match(/__v52436lei/g) || []).length >= 4, 'guards __v52436lei nos 4 wraps');

// ── 2. Funcional ponta a ponta (DOM fake) ───────────────────────────────────
(async function(){
  const alertas = [];
  const calls = { nova: 0, detalhe: 0, def: 0, salvarLanc: 0, abriuDetalhe: [] };
  const els = { 'lan-edit-idx': { value: '' } };
  const fakeDoc = { getElementById(id){ return els[id] || null; } };
  const dbFix = {
    leituras: [
      { id:'l1', contratoId:'c1', numero:'L-101', status:'faturado', itens:[] },
      { id:'l2', contratoId:'c1', numero:'L-102', status:'aberta', itens:[
        { parqueId:'p1', medidor:'pretoA4', anterior: 1000, atual: 1150 }
      ] },
      { id:'l3', contratoId:'c2', numero:'L-200', status:'estornada', itens:[] },
      { id:'lX', contratoId:'c3', numero:'velha', status:'pendente', parqueId:'p1' } // formato legado: não bloqueia
    ],
    parque: [ { id:'p1', contadores:{ pretoA4: 1150 } } ]
  };
  const win = {
    lfbAlert(m){ alertas.push(String(m)); },
    novaLeituraContrato(){ calls.nova++; },
    criarLeituraDetalhada(){ calls.detalhe++; },
    criarLeituraDefinitiva(){ calls.def++; },
    abrirLeituraContratoDetalhe(id){ calls.abriuDetalhe.push(id); },
    salvarLancamentoContador(leituraId){
      calls.salvarLanc++;
      // imita o original: recalcula anterior do parque vivo e devolve o atual
      const l = dbFix.leituras.find(x=>x.id===leituraId);
      const item = l.itens[Number(els['lan-edit-idx'].value)];
      const p = dbFix.parque.find(x=>x.id===item.parqueId);
      const anterior = p.contadores[item.medidor];
      p.contadores[item.medidor] = Number(win.__novoAtual);
      win.__anteriorVisto = anterior;
    }
  };
  const ctx = { window: win, document: fakeDoc, db: dbFix };
  new Function('window','document','db', patch)(ctx.window, ctx.document, ctx.db);

  const P = win.LEITURA_UMA_ABERTA_V52436_PURE;
  ok(!!P, 'PURE registrada');
  ok(P.leituraAbertaDoContrato(dbFix, 'c1').id === 'l2', 'PURE: acha a aberta (faturada não conta)');
  ok(P.leituraAbertaDoContrato(dbFix, 'c2').id === 'l3', 'PURE: estornada conta como aberta (bloqueia)');
  ok(P.leituraAbertaDoContrato(dbFix, 'c3') === null, 'PURE: leitura legada parqueId-simples NÃO bloqueia o fluxo novo');
  ok(P.leituraAbertaDoContrato(dbFix, 'c9') === null, 'PURE: contrato sem leitura aberta passa livre');
  ok(P.rotuloStatus({status:'estornada'}) === 'estornada' && P.msgBloqueioNovaLeitura(dbFix.leituras[2]).includes('apague'), 'PURE: estornada orienta faturar OU apagar');

  // 2a. decreto: criar nova leitura com uma aberta → BLOQUEIA e abre a dela
  win.novaLeituraContrato('c1');
  ok(calls.nova === 0 && calls.abriuDetalhe[0] === 'l2', 'nova leitura bloqueada com leitura aberta + abre a existente');
  ok(alertas.some(a=>a.includes('L-102') && a.includes('Fature (feche)')), 'aviso cita a leitura aberta e como fechar');

  // 2b. estornada também bloqueia
  win.criarLeituraDetalhada('c2');
  ok(calls.detalhe === 0, 'estornada bloqueia a tela de leitura avulsa também');

  // 2c. livre: sem aberta → deixa criar
  win.novaLeituraContrato('c9');
  win.criarLeituraDefinitiva('c9');
  ok(calls.nova === 1 && calls.def === 1, 'sem aberta: cria normal nos 3 caminhos');

  // 2d. anterior certo na edição pós-estorno (o relato dele)
  els['lan-edit-idx'].value = '0';
  win.__novoAtual = 1180;
  win.salvarLancamentoContador('l2');
  ok(win.__anteriorVisto === 1000, 'edição: anterior volta a ser o do lançamento (1000), não o salvo/faturado (1150)');
  ok(dbFix.parque[0].contadores.pretoA4 === 1180, 'edição: parque vivo fica com o NOVO atual (1180) — lista coerente');

  // ── 3. Bundle / versão / celular ───────────────────────────────────────────
  const man = JSON.parse(fs.readFileSync('bundle-manifest.json', 'utf8'));
  ok(man.length === 214 && man[man.length-15] === 'ajustes_v52436_leitura_uma_aberta_patch.js' && man[man.length-14] === 'ajustes_v5250_leitura_overhaul_patch.js' && man[man.length-13] === 'ajustes_v5260_cnpj_gerente_patch.js' && man[man.length-12] === 'ajustes_v5262_login_nuvem_primeiro_patch.js' && man[man.length-11] === 'ajustes_v5264_chamado_data_grande_patch.js' && man[man.length-10] === 'painel_gerente_patch.js' && man[man.length-9] === 'fiscal_guard_patch.js' && man[man.length-8] === 'nf_transmissao_patch.js' && man[man.length-7] === 'autocura_empresa_central_nf_tela_patch.js' && man[man.length-6] === 'perfis_nuvem_cura_sessao_patch.js' && man[man.length-5] === 'permissoes_estorno_venda_patch.js' && man[man.length-4] === 'fiscal_menu_completo_patch.js' && man[man.length-3] === 'dashboard_inicio_clicavel_patch.js' && man[man.length-2] === 'menus_fiscais_separados_patch.js' && man[man.length-1] === 'permissoes_override_menus_fiscais_patch.js', 'manifest: 214 scripts; override de supervisor + menus fiscais de verdade v6.0.9 fecha a fila');
  const bundle = fs.readFileSync('app.bundle.js', 'utf8');
  ok(bundle.includes('LEITURA_UMA_ABERTA_V52436_PURE') && bundle.includes('Fature (feche) ela antes de criar outra'), 'bundle: guarda dentro');
  ok(fs.readFileSync('mobile/www/app.bundle.js', 'utf8').includes('LEITURA_UMA_ABERTA_V52436_PURE'), 'bundle do CELULAR igual');
  ok(fs.readFileSync('index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '6.0.9'"), 'index 6.0.9');
  ok(fs.readFileSync('index.html', 'utf8').includes('>v6.0.9<'), 'rodapé v6.0.9');
  ok(fs.readFileSync('mobile/www/index.html', 'utf8').includes("DIGICOPY_APP_VERSION = '6.0.9'"), 'celular 6.0.9');
  ok(JSON.parse(fs.readFileSync('package.json', 'utf8')).version === '6.0.9', 'package.json 6.0.9');

  // ── 4. Link oficial (githack morto — ele cobrou) ──────────────────────────
  const sync = fs.readFileSync('sync_build.js', 'utf8');
  ok(sync.includes('teste-60f.pages.dev') && !sync.includes('LINK_GITHACK'), 'sync_build imprime o SITE PRÓPRIO (githack fora — repo privado)');
  ok(fs.readFileSync('RELATORIO_SESSAO.md', 'utf8').includes('teste-60f.pages.dev'), 'REL registra o link oficial do site próprio');

  if (falhas > 0) { console.error(`\n${falhas} assert(s) FALHARAM`); process.exit(1); }
  console.log('\nTudo OK — v5.24.36 (uma leitura aberta por vez + anterior certo na edição + links oficiais do site próprio).');
})().catch(e=>{ console.error('✘ exceção no funcional:', e && e.message); process.exit(1); });
