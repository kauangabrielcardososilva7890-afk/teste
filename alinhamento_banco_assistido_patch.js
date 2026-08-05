// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.51 — Alinhamento assistido do banco antigo
// • Analisa tabelas migradas, sugere onde cada tabela pertence no ERP novo
// • Permite marcar sugestão errada e escolher destino correto
// • Marca módulos esperados como presentes/faltando/não sei
// • Gera relatório completo para correção fina da migração
// • v4.9.51: configurações, empresa, caixa, permissões e comunicação não caem mais como técnico/ignorar
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function up(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
function esc(v){ if(typeof escapeHtml==='function') return escapeHtml(v); return txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function rows(nome){ return (((db.modulosDinamicos||{})[nome]||{}).dados)||[]; }
function cols(mod){ return (mod&&mod.colunas&&mod.colunas.length?mod.colunas:(mod&&mod.dados&&mod.dados[0]?Object.keys(mod.dados[0]):[])).map(c=>String(c)); }
function has(colunas, termos){ const U=colunas.map(up).join('|'); return (Array.isArray(termos)?termos:[termos]).some(t=>U.includes(up(t))); }
function score(colunas, termos){ return (Array.isArray(termos)?termos:[termos]).reduce((s,t)=>s+(has(colunas,t)?1:0),0); }
function destinoLabel(id){ return (DESTINOS.find(d=>d.id===id)||{}).label||id; }

const DESTINOS=[
  {id:'clientes',label:'Clientes'},
  {id:'contratos',label:'Contratos / locação'},
  {id:'impressoras_contrato',label:'Impressoras do contrato'},
  {id:'leituras',label:'Leituras'},
  {id:'contadores',label:'Contadores da leitura'},
  {id:'chamados',label:'Chamados / visitas'},
  {id:'vendas',label:'Vendas / notinhas'},
  {id:'itens_venda',label:'Itens da venda'},
  {id:'financeiro_receber',label:'Contas a receber'},
  {id:'financeiro_pagar',label:'Contas a pagar'},
  {id:'caixa',label:'Caixa / contas'},
  {id:'produtos',label:'Produtos / estoque'},
  {id:'cartuchos',label:'Cartuchos / recargas'},
  {id:'fiscal',label:'Fiscal / notas'},
  {id:'usuarios',label:'Usuários / funcionários'},
  {id:'permissoes',label:'Permissões de usuários'},
  {id:'empresas',label:'Empresas / dados da loja'},
  {id:'configuracoes',label:'Configurações do sistema'},
  {id:'comunicacao',label:'Comunicação / e-mail / SMS'},
  {id:'comissoes',label:'Comissões'},
  {id:'orcamentos',label:'Orçamentos / propostas'},
  {id:'fornecedores',label:'Fornecedores'},
  {id:'auxiliares',label:'Auxiliares úteis'},
  {id:'ignorar',label:'Ignorar / técnico'}
];
const ESPERADOS=[
  ['clientes','Clientes'],['contratos','Contratos'],['impressoras_contrato','Impressoras do contrato'],['leituras','Leituras'],['contadores','Contadores da leitura'],['chamados','Chamados'],['vendas','Vendas/notinhas'],['itens_venda','Itens da venda'],['financeiro_receber','Contas a receber'],['caixa','Caixa/contas'],['produtos','Produtos'],['cartuchos','Cartuchos/recargas'],['usuarios','Usuários'],['permissoes','Permissões'],['empresas','Empresas'],['configuracoes','Configurações'],['comunicacao','Comunicação'],['fiscal','Fiscal/notas']
];

function classificarTabela(nome, modulo){
  const n=up(nome); const c=cols(modulo); let best={destino:'auxiliares',pontos:0,motivos:[]};
  function cand(destino,pontos,motivo){ if(pontos>best.pontos){ best={destino,pontos,motivos:[motivo]}; } else if(pontos===best.pontos&&pontos>0) best.motivos.push(motivo); }
  if(/^RDB\$|IBE\$LOG|^LOG$|^LOG_|_LOG$|TEMPORAR|^TMP/.test(n)) cand('ignorar',20,'interno/técnico');
  if(/EMPRESAS?|FILIAIS?|LOJAS?|DADOS_EMPRESA/.test(n)) cand('empresas',10,'empresa/dados da loja');
  cand('empresas',score(c,['COD_EMPRESA','RAZAO_SOCIAL','NOME_FANTASIA','CNPJ','LOGOTIPO','WHATSAPP','EMAIL_EMPRESA']),'campos de empresa');
  if(/RESTRICAO|RESTRIÇÕES|PERMISSAO|PERMISSÃO|PERFIL|ACESSO_MODULO/.test(n)) cand('permissoes',10,'permissões/restrições');
  cand('permissoes',score(c,['VISUALIZAR','CADASTRAR','ALTERAR','DELETAR','FATURAR','RELATORIO','EXPORTAR','COD_FUNCIONARIO','COD_USUARIO']),'campos de permissão');
  if(/CONFIG|CONFIGURACAO|CONFIGURAÇÃO|PARAMETRO|PARÂMETRO|OPCOES|OPÇÕES/.test(n)) cand('configuracoes',9,'configuração do sistema');
  cand('configuracoes',score(c,['VALOR_PADRAO','DIAS_PRAZO','JUROS_PADRAO','ANO_EXERCICIO','MULTI_EMPRESA','CLIENTE_BALCAO','BLOQUEAR_USUARIO']),'campos de configuração');
  if(/SMTP|EMAIL|E_MAIL|SMS|WHATS|PUBLICIDADE|PESQUISA|NOTIFICACAO|NOTIFICAÇÃO|MENSAGEM/.test(n)) cand('comunicacao',9,'comunicação/notificações');
  cand('comunicacao',score(c,['SMTP','EMAIL','SMS','WHATSAPP','MENSAGEM_PADRAO','LINK_PESQUISA','NOTIFICAR_ADMIN']),'campos de comunicação');
  if(/CAIXA|FLUXO_CAIXA|CONTAS_BANCO|CONTA_BANCARIA|MOVIMENTACAO|MOVIMENTAÇÃO|TRANSFERENCIA|TRANSFERÊNCIA|RETIRADA/.test(n)) cand('caixa',9,'caixa/contas');
  cand('caixa',score(c,['COD_CAIXA','DATA_ABERTURA','DATA_FECHAMENTO','VALOR_ABERTURA','VALOR_FECHAMENTO','CONTA_DESTINO','SALDO']),'campos de caixa');
  if(/COMISSAO|COMISSÃO/.test(n)) cand('comissoes',9,'comissões');
  cand('comissoes',score(c,['COD_FUNCIONARIO','PERCENTUAL_COMISSAO','COMISSAO_VENDA','COMISSAO_SERVICO','COMISSAO_RECARGA','COMISSAO_LOCACAO']),'campos de comissão');
  if(/ORCAMENTO|ORÇAMENTO|PROPOSTA/.test(n)) cand('orcamentos',9,'orçamentos/propostas');
  if(/^CLIENTES?$|CLIENTES_FINAL/.test(n)) cand('clientes',10,'nome da tabela');
  cand('clientes',score(c,['COD_CLIENTE','NOME_RAZAOSOCIAL','CPF_CNPJ','TELEFONE','ENDERECO','LIMITE_CREDITO','DIA_VENCIMENTO'])+(/CLIENT/.test(n)&&!/CONFIG/.test(n)?3:0),'campos de cliente');
  if(/^LOCACAO$|LOCAÇÃO|CONTRATO/.test(n)) cand('contratos',10,'nome de locação/contrato');
  cand('contratos',score(c,['COD_LOCACAO','COD_CLIENTE','VALOR','LOC_COD_EMPRESA','DATA_INICIO'])+(/LOCACAO/.test(n)&&!/CONFIG/.test(n)?4:0),'campos de contrato');
  if(/ITENS_LOCACAO/.test(n)) cand('impressoras_contrato',10,'itens de locação');
  cand('impressoras_contrato',score(c,['IT_COD_ITENS_LOCACAO','IT_COD_LOCACAO','IT_COD_EQUIPAMENTO','IT_SERIAL','IT_SITUACAO'])+(/EQUIPAMENTOS/.test(n)?2:0),'campos de impressora do contrato');
  if(/^LEITURAS?$/.test(n)) cand('leituras',10,'nome de leituras');
  cand('leituras',score(c,['LE_COD_LEITURA','LE_COD_LOCACAO','LE_VALOR_TOTAL','LE_DATA_INICIO','LE_DATA_FINAL','CONTROLE_LEITURA']),'campos de leitura');
  if(/CONTADOR_PAGINAS|CONTADORES?$/.test(n)) cand('contadores',10,'contador de páginas');
  cand('contadores',score(c,['COD_CONTADOR','COD_ITENS_LOCACAO','CP_COD_LEITURA','CP_TIPO','PAGINAS_ATUAL','CP_VALOR_TOTAL','CON_SERIAL']),'campos de contador');
  if(/^VISITAS?$|CHAMADO|OS|ORDEM_SERVICO/.test(n)) cand('chamados',10,'visitas/chamados');
  cand('chamados',score(c,['COD_VISITA','VI_COD_CLIENTE','VI_COD_ITENS_LOCACAO','VI_COD_EQUIPAMENTO','VI_SITUACAO','VI_COD_VENDA','DEFEITO','SERVICO_EXECUTADO']),'campos de chamado');
  if(/^VENDAS?$|NOTINHA|CUPOM|SAIDA$/.test(n)) cand('vendas',10,'vendas/notinhas');
  cand('vendas',score(c,['COD_VENDA','COD_CLIENTE','VALOR_TOTAL','FINALIZADA','COD_RECEBIMENTO','FORMA_ENTREGA','VENDEDOR','CLIENTE_BALCAO']),'campos de venda');
  if(/ITENS_VENDA/.test(n)) cand('itens_venda',10,'itens da venda');
  cand('itens_venda',score(c,['COD_ITENS_VENDA','COD_VENDA','COD_PRODUTO','COD_CARTUCHO','QTDE','VALOR_UNITARIO','VALOR_TOTAL']),'campos de item venda');
  if(/CONTAS_RECEBER/.test(n)) cand('financeiro_receber',10,'contas a receber');
  cand('financeiro_receber',score(c,['COD_PARCELA','COD_CLIENTE','COD_VENDA','CR_COD_LEITURA','VALOR_PARCELA','DATA_VENCIMENTO','DATA_PAGAMENTO','FORMA_PAGAMENTO']),'campos receber');
  if(/CONTAS_PAGAR/.test(n)) cand('financeiro_pagar',10,'contas a pagar');
  if(/BOLETO|GERENCIANET|PAGSEGURO|CARTAO|CARTÃO|PIX/.test(n)) cand('financeiro_receber',8,'cobrança/recebimento');
  if(/^PRODUTOS?$|PRODUTOS_HISTORICO|PRODUTOS_VARIACAO/.test(n)) cand('produtos',9,'produtos/estoque');
  cand('produtos',score(c,['COD_PRODUTO','DESCRICAO','QTDE','ESTOQUE_MINIMO','VALOR_CUSTO','VALOR_TOTAL','PR_NCM','CODIGO_BARRA','LOCALIZACAO']),'campos produto');
  if(/CARTUCHO|RECARGA|INSUMO|TONER|TINTA|ETIQUETA/.test(n)) cand('cartuchos',9,'cartuchos/recargas');
  if(/NOTA_FISCAL|ITENS_NOTA|NCM|TRIBUTOS|NFSE|FATURA_NFE|CUPOM_FISCAL/.test(n)) cand('fiscal',9,'fiscal/nota');
  if(/FUNCIONARIOS|USUARIOS/.test(n)) cand('usuarios',9,'usuários/funcionários');
  if(/FORNECEDOR|TRANSPORTADOR/.test(n)) cand('fornecedores',8,'fornecedor/transportador');
  let confianca=Math.min(100,Math.max(20,best.pontos*10));
  if(best.destino==='auxiliares') confianca=35;
  return {tabela:nome,destino:best.destino,confianca,motivo:best.motivos[0]||'heurística',registros:((modulo||{}).dados||[]).length,colunas:c};
}
function analisarBanco(dbRef){
  const mod=dbRef.modulosDinamicos||{};
  const tabelas=Object.entries(mod).filter(([,m])=>m&&Array.isArray(m.dados)&&m.dados.length).map(([nome,m])=>classificarTabela(nome,m));
  tabelas.sort((a,b)=>a.destino.localeCompare(b.destino)||a.tabela.localeCompare(b.tabela));
  const porDestino={}; tabelas.forEach(t=>{ (porDestino[t.destino]=porDestino[t.destino]||[]).push(t); });
  return {tabelas,porDestino,totalTabelas:tabelas.length,totalRegistros:tabelas.reduce((s,t)=>s+t.registros,0)};
}
function cfg(){ db.config=db.config||{}; db.config.alinhamentoBanco=db.config.alinhamentoBanco||{feedback:{},faltantes:{}}; return db.config.alinhamentoBanco; }
function aplicarFeedback(t){ const f=cfg().feedback[t.tabela]||{}; return {...t,destinoUsuario:f.destino||t.destino,errada:!!f.errada,obs:f.obs||''}; }
function relatorioAlinhamento(dbRef){
  const a=analisarBanco(dbRef); const c=cfg();
  const linhas=[];
  linhas.push('RELATÓRIO DE ALINHAMENTO DO BANCO ANTIGO');
  linhas.push('Gerado em: '+new Date().toLocaleString('pt-BR'));
  linhas.push('Tabelas analisadas: '+a.totalTabelas);
  linhas.push('Registros em tabelas migradas: '+a.totalRegistros);
  linhas.push('');
  DESTINOS.forEach(d=>{
    const tabs=(a.porDestino[d.id]||[]).map(aplicarFeedback);
    if(!tabs.length) return;
    linhas.push('## '+d.label);
    tabs.forEach(t=>linhas.push(`- ${t.tabela} (${t.registros} reg.) => sugerido: ${destinoLabel(t.destino)} | marcado: ${t.errada?'ERRADA':'ok'} | destino final: ${destinoLabel(t.destinoUsuario)} | confiança ${t.confianca}% | ${t.motivo}${t.obs?' | obs: '+t.obs:''}`));
    linhas.push('');
  });
  linhas.push('## Módulos esperados / faltantes');
  ESPERADOS.forEach(([id,label])=>linhas.push(`- ${label}: ${c.faltantes[id]||'não informado'}`));
  linhas.push('');
  linhas.push('## Tabelas marcadas como erradas pelo usuário');
  const err=Object.entries(c.feedback||{}).filter(([,v])=>v.errada);
  if(!err.length) linhas.push('- Nenhuma marcada ainda.');
  err.forEach(([tab,v])=>linhas.push(`- ${tab}: destino correto informado = ${destinoLabel(v.destino||'')}; obs=${v.obs||''}`));
  return linhas.join('\n');
}
function baixarRelatorio(){ const blob=new Blob([relatorioAlinhamento(db)],{type:'text/plain;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='relatorio_alinhamento_banco_antigo.txt'; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},500); }
function rodarAutomacoes(){
  const s=typeof getSession==='function'?getSession():null; if(!s) return 0; let total=0;
  const fns=['aplicarAutomacoesTriggers','aplicarAutomacoesFinanceiroEstoque','aplicarAutomacoesLocacaoVisitas','aplicarAutomacoesContratosCaixaFiscal','aplicarAutomacoesFiscalCartuchos','aplicarAutomacoesVendasComprasCadastros','aplicarAutomacoesOrcClientesAux','aplicarAutomacoesPixContadoresAux','aplicarAutomacoesVendasFiscalAuxiliares','aplicarAutomacoesComprasRecebimentosContadores','aplicarAutomacoesCaixaChatAuxiliares','aplicarAutomacoesFinaisLocacaoAux','aplicarAutomacoesProceduresOperacionais'];
  fns.forEach(nome=>{ try{ if(typeof window[nome]==='function') total+=Number(window[nome](s.empresaId)||0); }catch(e){ console.warn('[ALINHAMENTO]',nome,e); } });
  if(typeof saveDB==='function') saveDB();
  if(typeof toast==='function') toast('Alinhamento automático processado: '+total+' ajustes','success');
  return total;
}

window.ALINHAMENTO_BANCO_PURE={ classificarTabela, analisarBanco, relatorioAlinhamento, DESTINOS, ESPERADOS };
window.baixarRelatorioAlinhamentoBanco=baixarRelatorio;
window.rodarAlinhamentoAutomaticoBanco=rodarAutomacoes;

if(typeof document==='undefined') return;
function renderAlinhamento(){
  const a=analisarBanco(db); const c=cfg(); const withFb=a.tabelas.map(aplicarFeedback);
  const opts=DESTINOS.map(d=>`<option value="${d.id}">${d.label}</option>`).join('');
  const card=document.createElement('div'); card.id='alinhamento-banco-card'; card.className='rounded-[16px] bg-white border p-6 lg:col-span-3';
  card.innerHTML=`<h4 class="font-bold text-[15px]"><i class="ph ph-flow-arrow"></i> Alinhamento do banco antigo</h4><p class="text-[12px] text-slate-500 mt-1">O sistema sugere onde cada tabela pertence. Marque a chave se estiver errada, escolha o destino correto e depois baixe o relatório.</p><div class="flex flex-wrap gap-2 mt-3"><button onclick="rodarAlinhamentoAutomaticoBanco()" class="neo-btn primary">Aplicar alinhamento automático</button><button onclick="baixarRelatorioAlinhamentoBanco()" class="neo-btn">Baixar relatório</button><button onclick="if(window.syncCarregarDaNuvem) syncCarregarDaNuvem({confirmar:false})" class="neo-btn">Carregar nuvem</button></div><div class="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3"><div class="neo-card"><p class="neo-label">Tabelas</p><div class="neo-total">${a.totalTabelas}</div></div><div class="neo-card"><p class="neo-label">Registros</p><div class="neo-total">${a.totalRegistros}</div></div><div class="neo-card"><p class="neo-label">Marcadas erradas</p><div class="neo-total">${withFb.filter(t=>t.errada).length}</div></div></div><div class="mt-4 rounded-xl border overflow-auto max-h-[480px]"><table class="w-full text-left text-[12px]"><thead class="bg-slate-50 sticky top-0"><tr><th class="px-3 py-2">Tabela</th><th>Reg.</th><th>Sugerido</th><th>Conf.</th><th>Errada?</th><th>Destino correto</th><th>Obs.</th></tr></thead><tbody>${withFb.map(t=>`<tr class="border-t"><td class="px-3 py-2"><b>${t.tabela}</b><br><span class="text-[10px] text-slate-500">${t.colunas.slice(0,6).join(', ')}</span></td><td>${t.registros}</td><td>${destinoLabel(t.destino)}</td><td>${t.confianca}%</td><td><input type="checkbox" ${t.errada?'checked':''} onchange="alinhamentoMarcar('${t.tabela}',this.checked)"></td><td><select data-alin-tab="${t.tabela}" onchange="alinhamentoDestino('${t.tabela}',this.value)" class="h-8 rounded border">${opts}</select></td><td><input value="${esc(t.obs)}" onchange="alinhamentoObs('${t.tabela}',this.value)" class="h-8 px-2 rounded border"></td></tr>`).join('')||'<tr><td colspan="7" class="text-center text-slate-400 py-8">Nenhuma tabela migrada carregada. Clique em Carregar nuvem ou importe os JSONs.</td></tr>'}</tbody></table></div><div class="mt-4 rounded-xl border p-3"><b class="text-[13px]">Módulos esperados / está faltando?</b><div class="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">${ESPERADOS.map(([id,label])=>`<label class="text-[12px] border rounded-lg p-2"><b>${label}</b><select onchange="alinhamentoFaltante('${id}',this.value)" class="mt-1 w-full h-8 rounded border"><option value="não informado" ${(c.faltantes[id]||'não informado')==='não informado'?'selected':''}>Não sei</option><option value="presente" ${c.faltantes[id]==='presente'?'selected':''}>Presente</option><option value="faltando" ${c.faltantes[id]==='faltando'?'selected':''}>Faltando</option><option value="não usa" ${c.faltantes[id]==='não usa'?'selected':''}>Não usa</option></select></label>`).join('')}</div></div>`;
  const grid=document.querySelector('#view-config .grid')||document.getElementById('view-config'); if(grid&&!document.getElementById('alinhamento-banco-card')) grid.appendChild(card);
  setTimeout(()=>{ withFb.forEach(t=>{ const s=card.querySelector(`select[data-alin-tab="${t.tabela}"]`); if(s) s.value=t.destinoUsuario; }); },0);
}
window.alinhamentoMarcar=function(tabela,err){ cfg().feedback[tabela]=cfg().feedback[tabela]||{}; cfg().feedback[tabela].errada=err; if(typeof saveDB==='function') saveDB(); };
window.alinhamentoDestino=function(tabela,dest){ cfg().feedback[tabela]=cfg().feedback[tabela]||{}; cfg().feedback[tabela].destino=dest; if(typeof saveDB==='function') saveDB(); };
window.alinhamentoObs=function(tabela,obs){ cfg().feedback[tabela]=cfg().feedback[tabela]||{}; cfg().feedback[tabela].obs=obs; if(typeof saveDB==='function') saveDB(); };
window.alinhamentoFaltante=function(id,val){ cfg().faltantes[id]=val; if(typeof saveDB==='function') saveDB(); };
const oldRenderConfig=window.renderConfig;
window.renderConfig=function(){ if(oldRenderConfig) oldRenderConfig.apply(this,arguments); setTimeout(renderAlinhamento,80); };
setTimeout(renderAlinhamento,1200);
console.log('[DIGICOPY] alinhamento_banco_assistido_patch.js v4.9.51 carregado');
})();
