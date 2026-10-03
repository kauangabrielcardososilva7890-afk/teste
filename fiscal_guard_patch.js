// ═══════════════════════════════════════════════════════════════════════════
// FISCAL_GUARD_PATCH v6.0.0 — "PORTÃO FISCAL" (primeira pedra da linha NF)
// As três garantias que ele exigiu, virando LEI de código na 6.0.0:
//  1) AMBIENTE: tudo nasce em HOMOLOGAÇÃO (teste, sem valor fiscal). Produção
//     só habilita por ação humana explícita: digitar "PRODUCAO" + usuário com
//     permissão de emitir NF. Voltar p/ homologação é um clique só.
//  2) NADA AUTOMÁTICO: este patch NÃO tem nenhum setInterval/setTimeout e
//     nenhuma emissão/conferência dispara sozinha — só clique. A suíte de
//     testes PROVA isso (varre o arquivo atrás de temporizadores).
//  3) SEM EMISSÃO FANTASMA: toda conferência NF gera registro de auditoria
//     (quem, quando, em qual ambiente) — não existe caminho silencioso.
// Selo anti-fraude p/ a fase de envio (6.0.1): em homologação o XML leva no
// próprio infCpl "NOTA DE TESTE, SEM VALOR FISCAL" — a contabilidade nunca
// confunde teste com nota oficial. Duplicidade: detector pronto p/ o emissor
// (mesmo modelo+série+número+origem nunca passa duas vezes sem confirmação).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
if(typeof window!=='undefined' && window.__v6000fg) return;

/* NFG_PURE_START */
// ── Funções puras (sem DOM/banco) — usadas também pelo teste automatizado ────
function nfgAmbiente(dbInst){
  const cfg=(dbInst && dbInst.config) || {};
  const v=String(cfg.nfAmbiente||'').toLowerCase();
  return v==='producao' ? 'producao' : 'homologacao'; // padrão SEGURO: homologação
}
function nfgRotulo(amb){
  if(amb==='producao') return 'PRODUÇÃO — a nota gerada aqui VALE DE VERDADE';
  return 'HOMOLOGAÇÃO — MODO TESTE, SEM VALOR FISCAL';
}
function nfgCor(amb){ return amb==='producao' ? '#14532d' : '#7f1d1d'; }
// Registro de notas da linha 6.xx (alimentado pelo emissor da 6.0.1+)
function nfgRegistro(dbInst){ return ((dbInst && dbInst.config && dbInst.config.nfRegistro) || []); }
function nfgChaveUnica(n){
  return [String(n && n.modelo||''),String(n && n.serie||''),String(n && n.numero||''),String(n && n.origemId||'')].join('|');
}
function nfgJaRegistrada(dbInst, nota){
  const k=nfgChaveUnica(nota);
  return nfgRegistro(dbInst).some(x=>nfgChaveUnica(x)===k && String(x && x.status||'')!=='cancelada');
}
// Selo anti-fraude: em homologação o XML diz ALTO que é teste (fase 6.0.1 usa)
function nfgSeloTeste(xml, amb){
  if(!xml || amb==='producao') return xml;
  const selo='AMBIENTE DE HOMOLOGACAO - NOTA DE TESTE, SEM VALOR FISCAL. ';
  if(xml.indexOf('<infCpl>')>=0) return xml.replace('<infCpl>','<infCpl>'+selo);
  return xml.replace('</infNFe>','<infAdic><infCpl>'+selo.slice(0,-2)+'</infCpl></infAdic></infNFe>');
}
/* NFG_PURE_END */

// ── Exporta (testes + próximas fases da linha 6.xx) ─────────────────────────
const api={ nfgAmbiente:nfgAmbiente, nfgRotulo:nfgRotulo, nfgCor:nfgCor,
            nfgRegistro:nfgRegistro, nfgChaveUnica:nfgChaveUnica,
            nfgJaRegistrada:nfgJaRegistrada, nfgSeloTeste:nfgSeloTeste };
if(typeof module!=='undefined') module.exports=api;
if(typeof window!=='undefined') window.NFG_PURE=api;
else if(typeof global!=='undefined') global.NFG_PURE=api;

if(typeof window==='undefined' || typeof document==='undefined') return;
window.__v6000fg=true;

// ── AUDITORIA FISCAL DE VERDADE (v6.1.4) ───────────────────────────────────
// RELATÓRIO DELE (21/09/2026, pergunta C5): "registra no log, não na auditoria"
// — e era exatamente isso: o portão gravava só o log técnico (tipo
// 'nf-portao'), sem os campos que a tela Auditoria lê (empresaId, entidade,
// usuarioNome, dataHora). Resultado: a ação fiscal ficava invisível na
// Auditoria. Agora cada ação fiscal grava TAMBÉM uma linha de auditoria no
// mesmo formato do resto do sistema (logAction), com o nome de quem fez.
// O log técnico continua (é ele que ajuda a achar problema do menu fiscal).
window.nfAuditarFiscal=function(acao, detalhes, entidadeId){
  try{
    if(typeof logAction!=='function') return false;
    const s=(typeof getSession==='function'?getSession():null)||{};
    if(!s.usuarioId && !s.login) return false;
    const rotulos={
      'ambiente->producao':'Fiscal: ambiente mudado para PRODUCAO',
      'ambiente->homologacao':'Fiscal: ambiente voltado para HOMOLOGACAO (teste)',
      'conferir':'Fiscal: nota conferida',
      'abrir-central':'Fiscal: Central de Nota Fiscal aberta',
      'status-inicio':'Fiscal: teste da SEFAZ iniciado',
      'status-resposta':'Fiscal: SEFAZ respondeu ao teste',
      'status-falha':'Fiscal: teste da SEFAZ sem resposta',
      'status-excecao':'Fiscal: erro no teste da SEFAZ',
      'sem-certificado':'Fiscal: teste da SEFAZ bloqueado (sem certificado A1 neste PC)',
      'pacote-contador':'Fiscal: pacote do mes (.zip) gerado para o contador',
      'pacote-excecao':'Fiscal: erro ao gerar o pacote do mes',
      'cce-inicio':'Fiscal: Carta de Correcao (CC-e) iniciada',
      'cce-resposta':'Fiscal: Carta de Correcao (CC-e) respondida pela SEFAZ',
      'cce-excecao':'Fiscal: erro na Carta de Correcao',
      'transmitir-inicio':'Fiscal: envio de nota para a SEFAZ iniciado',
      'transmitir-resposta':'Fiscal: resposta da SEFAZ para o envio de nota',
      'cancelar-inicio':'Fiscal: cancelamento de nota iniciado',
      'cancelar-resposta':'Fiscal: resposta da SEFAZ ao cancelamento'
    };
    const base=rotulos[acao]||('Fiscal: '+String(acao||'').replace(/[-_]/g,' '));
    const extra=typeof nfgResumoDados==='function'?nfgResumoDados(detalhes):'';
    logAction('fiscal', acao, entidadeId||'', (base+(extra?(' — '+extra):'')).slice(0,300));
    return true;
  }catch(e){ return false; }
};
// Resumo curto do que aconteceu (sem despejar o objeto inteiro na Auditoria)
function nfgResumoDados(d){
  if(!d || typeof d!=='object') return '';
  const p=[];
  if(d.ambiente) p.push('ambiente '+d.ambiente);
  if(d.numero!=null && d.numero!=='') p.push('nota '+d.numero);
  if(d.modelo) p.push('modelo '+d.modelo);
  if(d.mes) p.push('mês '+d.mes);
  if(d.notas!=null) p.push(d.notas+' nota(s)');
  if(d.arquivos!=null) p.push(d.arquivos+' arquivo(s)');
  if(d.cStat) p.push('cStat '+d.cStat);
  if(d.motivo) p.push(String(d.motivo).slice(0,90));
  if(d.erro) p.push('erro: '+String(d.erro).slice(0,90));
  return p.join(' · ');
}

function nfgAudit(acao, dados){
  try{
    db.logs=db.logs||[];
    const s=(typeof getSession==='function'?getSession():null)||{};
    // v6.1.4 — além do log técnico, a linha da AUDITORIA (é isso que o dono vê)
    if(typeof window.nfAuditarFiscal==='function'){ try{ window.nfAuditarFiscal(acao, dados, ''); }catch(e){} }
    db.logs.push({ tipo:'nf-portao', acao:acao, ambiente:nfgAmbiente(db),
      empresaId:s.empresaId||null, dataHora:new Date().toISOString(),
      usuarioId:s.usuarioId||null, usuarioNome:s.usuarioNome||s.login||null,
      usuarioLogin:s.login||s.usuarioLogin||null,
      dados:dados||{}, detalhes:nfgResumoDados(dados), at:new Date().toISOString() });
    if(db.logs.length>300){ db.logs.splice(0,db.logs.length-300); }
    if(typeof db.save==='function') db.save();
  }catch(e){}
}
// Selo visual: placa de ambiente presa nos dois modais fiscais
function nfgPlaca(alvo){
  try{
    const root=document.getElementById(alvo); if(!root||root.querySelector('.nfg-placa')) return;
    const amb=nfgAmbiente(db);
    const d=document.createElement('div');
    d.className='nfg-placa';
    d.style.cssText='margin:8px 10px 0;padding:7px 10px;border-radius:10px;font-size:11.5px;font-weight:800;letter-spacing:.2px;color:#fff;background:'+nfgCor(amb);
    d.textContent='🏛️ '+nfgRotulo(amb);
    root.insertBefore(d, root.firstChild);
  }catch(e){}
}
// Botão de troca de ambiente na Central de Nota Fiscal
function nfgBotaoAmbiente(){
  const central=document.getElementById('central-nfe-modal'); if(!central||central.querySelector('.nfg-amb-btn')) return;
  const b=document.createElement('button');
  b.className='nfg-amb-btn';
  b.style.cssText='margin:8px 10px 6px;height:34px;border-radius:10px;border:1px solid #cbd5e1;background:#fff;font-weight:800;font-size:12px;padding:0 12px;cursor:pointer';
  b.textContent = nfgAmbiente(db)==='producao' ? '⬇ Voltar p/ HOMOLOGAÇÃO (teste)' : '⬆ Habilitar PRODUÇÃO (vale de verdade)';
  b.onclick=function(){ window.nfgAlternarAmbiente(); };
  central.insertBefore(b, central.children[1]||null);
}
window.nfgAlternarAmbiente=async function(){
  const amb=nfgAmbiente(db);
  const pode=(typeof window.usuarioPodeEmitirNfe==='function') ? window.usuarioPodeEmitirNfe() : false;
  if(amb==='homologacao'){
    // NOTA DE AUDITORIA (prova de código morto): este botão antigo só nasce se
    // existir #central-nfe-modal. Desde a v6.0.2 o abrirCentralNfe (embrulhado
    // por último no autocura_empresa_central_nf_tela_patch.js) só chama
    // navigateTo('central-nf') e nunca recria esse modal, então nfgBotaoAmbiente
    // desiste na primeira linha. A proteção de produção que vale hoje é a da
    // tela nova (nfxPedirTexto + "PRODUCAO"). Este caminho ficou aqui como
    // histórico e NÃO foi removido (regra: não apagar código morto sem provar e
    // testar). Só deixou de usar prompt nativo, que estourava no .exe.
    if(!pode){ if(typeof toast==='function') toast('Só usuário com permissão de emitir NF habilita produção','error'); return; }
    const dig = (typeof window.pedirTextoSistema==='function')
      ? await window.pedirTextoSistema('⚠️ Produção faz nota VALER DE VERDADE na SEFAZ.\nPara habilitar, digite: PRODUCAO',{titulo:'Habilitar produção'})
      : (typeof window.nfxPedirTexto==='function' ? await window.nfxPedirTexto('Habilitar produção','⚠️ Produção faz nota VALER DE VERDADE na SEFAZ.\nPara habilitar, digite: PRODUCAO') : null);
    if(dig!=='PRODUCAO'){ if(dig!==null && typeof toast==='function') toast('Não habilitado — texto não confere','error'); return; }
    db.config=db.config||{}; db.config.nfAmbiente='producao';
    nfgAudit('ambiente->producao',{});
  }else{
    db.config=db.config||{}; db.config.nfAmbiente='homologacao';
    nfgAudit('ambiente->homologacao',{});
  }
  try{ if(typeof db.save==='function') db.save(); }catch(e){}
  // repinta placas
  document.querySelectorAll('.nfg-placa,.nfg-amb-btn').forEach(el=>el.remove());
  nfgPlaca('central-nfe-modal'); nfgPlaca('nfe-conf-modal'); nfgBotaoAmbiente();
};
// ── Trava anti-silêncio: conferência NF SEMPRE deixa rastro de auditoria ─────
if(typeof window.conferirNfe==='function'){
  const _conf0=window.conferirNfe;
  window.conferirNfe=function(tipo,id){
    nfgAudit('conferir',{origem:tipo, id:id});
    const r=_conf0.apply(this, arguments);
    Promise.resolve(r).then(function(){ nfgPlaca('nfe-conf-modal'); }, function(){});
    return r;
  };
}
if(typeof window.abrirCentralNfe==='function'){
  const _cen0=window.abrirCentralNfe;
  window.abrirCentralNfe=function(){
    nfgAudit('abrir-central',{});
    const r=_cen0.apply(this, arguments);
    Promise.resolve(r).then(function(){ nfgPlaca('central-nfe-modal'); nfgBotaoAmbiente(); }, function(){});
    return r;
  };
}
console.log('PORTÃO FISCAL v6.0.0 — homologação obrigatória, zero automático, tudo auditado');
})();
