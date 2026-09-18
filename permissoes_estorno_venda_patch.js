// ═══════════════════════════════════════════════════════════════════════════
// PERMISSOES_ESTORNO_VENDA_PATCH v6.0.5
// Quatro pedidos dele (com a regra nova: conferir antes de concordar — tudo
// aqui foi verificado no código antes):
//
// 1) PERMISSÕES NO EDITOR DO USUÁRIO (Configurações → Usuários → Ações →
//    Editar): a caixa "Emitir NF" (que hoje é uma coluna injetada na tabela,
//    v5.22.21) passa a existir TAMBÉM dentro da edição do usuário, e nascem
//    duas irmãs: "Apagar registros" e "Estornar registros"
//    (vendas/chamados/orçamentos/leituras...). Só Admin/Dono vê e mexe nesse
//    bloco. Padrões seguros: existentes nascem PERMITIDOS (ninguém trava por
//    acidente); Emitir NF segue desmarcada por padrão (como sempre foi).
//    A coluna da tabela continua (escreve no mesmo campo).
//
// 2) BLOQUEIO DE VERDADE nos executores (não é só esconder botão):
//    apagar → excluirVendaUnificado, deleteVenda, excluirChamadosSelecionados,
//             excluirChamadoV52422, excluirOrcamento(sMarcados),
//             removerLancamentoLeitura;
//    estornar → estornarVenda, estornarVendasSelecionadas,
//             estornarLeituraContrato, estornarNotinha.
//    Admin/Dono sempre podem (anti-trancamento); funcionário sem a caixa leva
//    aviso do sistema + a tentativa fica na Auditoria.
//
// 3) NOTINHA ESTORNADA ABRE NA ABA DA VENDA (não no modal de histórico que
//    "nem deveria existir"): clicar numa notinha extornada abre a tela de nova
//    venda CARREGADA com os dados (cliente + itens + desconto), marcada como
//    "refazendo notinha extornada" — salvar ATUALIZA a mesma notinha
//    (mantém número), devolve o estoque dos itens antigos e baixa o dos novos
//    (o estorno original não mexia em estoque — por isso o acerto é por
//    devolução+nova baixa, nunca baixa em dobro). Faturado na hora = cria o
//    título novo normalmente. Histórico/auditoria do estorno são preservados.
//    Conferido os "outros lugares" que ele mandou olhar: leitura extornada JÁ
//    volta aberta pra edição (v5.25.0 faz certo); chamados e orçamentos não
//    têm estorno (só exclusão).
//
// 4) FINANCEIRO MOSTRA O EXTORNADO (não some mais): o estorno MARCA os
//    títulos como 'estornado' (antes APAGAVA — por isso sumiam do Financeiro).
//    Títulos extornados aparecem com tarja própria, sem checkbox de baixa,
//    fora das somas de aberto/recebido/vencido (edição cirúrgica no
//    renderFinanceiro do app.js). Bônus conferido: os títulos 'estornado' que
//    a LEITURA já marcava (v5.25.0) hoje apareciam como "vencido" por engano
//    — o mesmo acerto cobre eles.
//
// Guard: __v6005pes. PURE exportado p/ testes (sem DOM).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
if(typeof window!=='undefined' && window.__v6005pes) return;

/* P605_PURE_START */
// Regra de permissão — pura e testável.
//   acao: 'emitirNfe' | 'apagar' | 'estornar'
//   perfil Admin/Dono → sempre pode (anti-trancamento);
//   demais: emitirNfe padrão DESMARCADO (como sempre foi),
//           apagar/estornar padrão MARCADO (usuários antigos não travam do nada
//           — o dono desmarca em quem quiser restringir).
function p605Perfil(u){
  const p=String((u&&u.perfil)||'').trim();
  return (p==='Admin'||p==='Dono')?p:'Funcionário';
}
function p605Pode(u, acao){
  if(!u) return false;
  if(p605Perfil(u)!=='Funcionário') return true;
  if(acao==='emitirNfe') return !!u.podeEmitirNfe;
  if(acao==='apagar') return u.podeApagar===undefined ? true : !!u.podeApagar;
  if(acao==='estornar') return u.podeEstornar===undefined ? true : !!u.podeEstornar;
  return false;
}
// Valor que a checkbox do editor mostra (mesmos padrões acima)
function p605ValorCaixa(u, acao){
  if(acao==='emitirNfe') return !!(u&&u.podeEmitirNfe);
  if(acao==='apagar') return !u||u.podeApagar===undefined?true:!!u.podeApagar;
  if(acao==='estornar') return !u||u.podeEstornar===undefined?true:!!u.podeEstornar;
  return false;
}
/* P605_PURE_END */

if(typeof module!=='undefined') module.exports={p605Perfil:p605Perfil,p605Pode:p605Pode,p605ValorCaixa:p605ValorCaixa};
if(typeof window!=='undefined'){ window.P605_PURE={p605Perfil:p605Perfil,p605Pode:p605Pode,p605ValorCaixa:p605ValorCaixa}; }
if(typeof window==='undefined' || typeof document==='undefined') return;
window.__v6005pes=true;

function txt(v){ return String(v==null?'':v).trim(); }
function sess(){ return typeof getSession==='function'?getSession():null; }
function usuarioLogado(){
  const s=sess(); if(!s) return null;
  try{
    return (db.usuarios||[]).find(function(u){ return u && u.id===s.usuarioId; })
        || (db.usuarios||[]).find(function(u){ return u && u.login===s.login && u.empresaId===s.empresaId; })
        || {id:s.usuarioId,login:s.login,perfil:s.perfil,podeEmitirNfe:false};
  }catch(e){ return {id:s.usuarioId,login:s.login,perfil:s.perfil,podeEmitirNfe:false}; }
}
function avisoSeg(msg){
  if(typeof window.lfbAlert==='function'){ window.lfbAlert(msg,'Permissão'); return; }
  if(typeof toast==='function') toast(msg,'error');
}
function negado(acaoPt){
  const s=sess()||{};
  avisoSeg('Seu usuário NÃO tem permissão para '+acaoPt+'. Só quem está marcado nas caixas de permissão (Usuários → editar) faz isso — peça ao Admin ou Dono.');
  try{ if(typeof logAction==='function') logAction('seguranca','negado',null,'Tentativa de '+acaoPt+' sem permissão por '+(s.usuarioNome||s.login||'?')); }catch(e){}
}
window.usuarioPodeApagar=function(){ return p605Pode(usuarioLogado(),'apagar'); };
window.usuarioPodeEstornar=function(){ return p605Pode(usuarioLogado(),'estornar'); };

// ══ 1) EDITOR DO USUÁRIO: bloco de permissões (visível só p/ Admin/Dono) ════
function montarBlocoPermissoes(u){
  const velho=document.getElementById('p605-permissoes');
  if(velho) velho.remove();
  const eu=usuarioLogado();
  if(p605Perfil(eu)==='Funcionário') return; // funcionário nem vê o bloco
  const alvo=(typeof db!=='undefined'&&db&&db.usuarios&&u&&u.id)
    ? (db.usuarios.find(function(x){return x&&x.id===u.id;})||u) : (u||{});
  const corpo=document.getElementById('modal-body');
  if(!corpo) return;
  if(!corpo.querySelector('#u-nome')) return; // não é o modal de usuário
  const caixa=function(id,acao,rotulo,desc){
    return '<label style="display:flex;gap:9px;align-items:flex-start;padding:8px 10px;border:1px solid #e2e8f0;border-radius:10px;cursor:pointer;background:#fff">'+
      '<input type="checkbox" id="'+id+'" '+(p605ValorCaixa(alvo,acao)?'checked':'')+' style="width:16px;height:16px;margin-top:2px">'+
      '<span><b style="font-size:12.5px">'+rotulo+'</b><br><small style="color:#64748b;font-size:11px">'+desc+'</small></span></label>';
  };
  const div=document.createElement('div');
  div.id='p605-permissoes';
  div.style.cssText='margin-top:12px;border-top:1px solid #e2e8f0;padding-top:12px';
  div.innerHTML='<p style="font-size:11px;font-weight:800;color:#0a1e8a;text-transform:uppercase;letter-spacing:.3px;margin:0 0 8px">Permissões do usuário (só Admin/Dono mexe)</p>'+
    '<div style="display:grid;gap:8px">'+
    caixa('u-perm-nfe','emitirNfe','Emitir NF (nota fiscal)','Quem NÃO estiver marcado nem vê botão de emitir/conferir NF funcionando.')+
    caixa('u-perm-apagar','apagar','Apagar registros','Vendas, chamados, orçamentos, lançamentos de leitura... Sem a caixa, o sistema avisa e registra na Auditoria.')+
    caixa('u-perm-estornar','estornar','Estornar registros','Estornar venda faturada, leitura faturada, notinha... Sem a caixa, bloqueia na hora.')+
    '</div>';
  corpo.appendChild(div);
}
if(typeof window.renderModalUsuario==='function' && !window.renderModalUsuario.__p605){
  const _rmu=window.renderModalUsuario;
  const embr=function(id){
    const r=_rmu.apply(this,arguments);
    try{
      let alvo=null;
      try{ const s=sess(); alvo=id?(db.usuarios||[]).find(function(x){return x&&x.id===id && (!s||x.empresaId===s.empresaId);}):null; }catch(e){}
      montarBlocoPermissoes(alvo||{});
    }catch(e){}
    return r;
  };
  embr.__p605=true;
  window.renderModalUsuario=embr;
}
// Aplica as caixas no salvar (o saveUsuario original lê só os campos dele)
if(typeof window.saveUsuario==='function' && !window.saveUsuario.__p605){
  const _su=window.saveUsuario;
  const embrS=function(){
    const bloco=document.getElementById('p605-permissoes');
    let vals=null;
    if(bloco){
      const eu=usuarioLogado();
      if(p605Perfil(eu)!=='Funcionário'){
        vals={
          podeEmitirNfe:!!(document.getElementById('u-perm-nfe')&&document.getElementById('u-perm-nfe').checked),
          podeApagar:!!(document.getElementById('u-perm-apagar')&&document.getElementById('u-perm-apagar').checked),
          podeEstornar:!!(document.getElementById('u-perm-estornar')&&document.getElementById('u-perm-estornar').checked)
        };
      }
    }
    const r=_su.apply(this,arguments);
    if(vals){
      try{
        const s=sess();
        const id=(window.modalContext&&window.modalContext.id)||null;
        const login=(document.getElementById('u-login')&&document.getElementById('u-login').value||'').trim().toLowerCase();
        let u=id?(db.usuarios||[]).find(function(x){return x&&x.id===id;}):null;
        if(!u&&login) u=(db.usuarios||[]).find(function(x){return x&&x.login===login&&(!s||x.empresaId===s.empresaId);});
        if(u){
          const antes={nfe:!!u.podeEmitirNfe,apagar:p605ValorCaixa(u,'apagar'),estornar:p605ValorCaixa(u,'estornar')};
          u.podeEmitirNfe=vals.podeEmitirNfe; u.podeApagar=vals.podeApagar; u.podeEstornar=vals.podeEstornar;
          if(antes.nfe!==u.podeEmitirNfe||antes.apagar!==p605ValorCaixa(u,'apagar')||antes.estornar!==p605ValorCaixa(u,'estornar')){
            try{ if(typeof logAction==='function') logAction('usuario','permissoes',u.id,'Permissões de '+(u.login||'?')+': NF='+(u.podeEmitirNfe?'SIM':'não')+' apagar='+(u.podeApagar?'SIM':'não')+' estornar='+(u.podeEstornar?'SIM':'não')); }catch(e){}
          }
          try{ if(typeof saveDB==='function') saveDB(); }catch(e){}
          try{ if(typeof renderUsuarios==='function') renderUsuarios(); }catch(e){}
        }
      }catch(e){}
    }
    return r;
  };
  embrS.__p605=true;
  window.saveUsuario=embrS;
}

// ══ 2) GATES (barramento de verdade) nos executores ═════════════════════════
function wrapGate(nome, acaoPt, checa){
  if(typeof window[nome]!=='function'){
    // pode ainda não existir nesta posição da fila? tenta de novo depois
    setTimeout(function(){ wrapGate(nome, acaoPt, checa); },1200);
    return;
  }
  if(window[nome].__p605gate) return;
  const _f=window[nome];
  const embr=function(){
    if(!checa()){ negado(acaoPt); return; }
    return _f.apply(this,arguments);
  };
  embr.__p605gate=true;
  window[nome]=embr;
}
wrapGate('excluirVendaUnificado','apagar registros (vendas)',window.usuarioPodeApagar);
wrapGate('deleteVenda','apagar registros (vendas)',window.usuarioPodeApagar);
wrapGate('excluirChamadosSelecionados','apagar registros (chamados)',window.usuarioPodeApagar);
wrapGate('excluirChamadoV52422','apagar registros (chamados)',window.usuarioPodeApagar);
wrapGate('excluirOrcamento','apagar registros (orçamentos)',window.usuarioPodeApagar);
wrapGate('excluirOrcamentosMarcados','apagar registros (orçamentos)',window.usuarioPodeApagar);
wrapGate('removerLancamentoLeitura','apagar registros (leituras)',window.usuarioPodeApagar);
wrapGate('estornarVenda','estornar registros (vendas)',window.usuarioPodeEstornar);
wrapGate('estornarVendasSelecionadas','estornar registros (vendas)',window.usuarioPodeEstornar);
wrapGate('estornarLeituraContrato','estornar registros (leituras)',window.usuarioPodeEstornar);
wrapGate('estornarNotinha','estornar registros (notinhas)',window.usuarioPodeEstornar);

// ══ 3) ESTORNADA → ABRE NA ABA DA VENDA (carregada, edição que MANTÉM número)
//--------------------------------------------------------------------------
function abrirVendaEstornadaEdicao(v){
  if(typeof window.novaVenda!=='function'){
    avisoSeg('A tela de nova venda não carregou ainda. Recarregue (F5) e tente de novo.');
    return;
  }
  window.__editandoVendaEstornadaId=v.id;
  window.novaVenda();
  setTimeout(function(){
    try{
      if(typeof montarBlocoPermissoes==='function'){/* no-op */}
      // banner explicativo no topo do modal
      const corpo=document.getElementById('modal-body');
      if(corpo && !corpo.querySelector('#p605-banner-refazer')){
        const b=document.createElement('div');
        b.id='p605-banner-refazer';
        b.style.cssText='margin-bottom:10px;padding:10px 12px;border-radius:10px;background:#fff7ed;border:1px solid #fdba74;color:#9a3412;font-size:12.5px;font-weight:700';
        b.innerHTML='↩ Refazendo a notinha <b>'+String(v.numero||'')+'</b> (estava EXTORNADA) — veio com cliente, itens e desconto. Ajuste o que precisar e salve: <b>o número é mantido</b>. Se faturar de novo, o título novo aparece no Financeiro (o extornado fica visível com tarja própria).';
        corpo.insertBefore(b,corpo.firstChild);
      }
      // cliente
      if(typeof window.selectClienteVenda==='function' && v.clienteId){
        try{ window.selectClienteVenda(v.clienteId); }catch(e){}
      }
      // itens
      window.itensTemp=(v.itens||[]).map(function(it){
        return {produtoId:it.produtoId, qtd:Number(it.qtd)||1, preco:Number(it.preco)||0, subtotal:Number(it.subtotal)!=null?Number(it.subtotal):(Number(it.qtd)||1)*(Number(it.preco)||0)};
      });
      if(typeof window.renderItensVenda==='function') window.renderItensVenda();
      // desconto + status padrão seguro (orçamento: NADA de título novo sem escolha)
      const nvDesc=document.getElementById('nv-desc'); if(nvDesc) nvDesc.value=Number(v.desconto)||0;
      const nvSt=document.getElementById('nv-status');
      if(nvSt){ nvSt.value='orcamento'; if(typeof window.onStatusVendaChange==='function') window.onStatusVendaChange(); }
      if(typeof window.updateVendaTotal==='function') window.updateVendaTotal();
      // rodapé honesto
      const footer=document.getElementById('modal-footer');
      if(footer){ const btns=footer.querySelectorAll('button'); if(btns.length) btns[btns.length-1].textContent='Salvar notinha '+String(v.numero||'')+' (mantém o número)'; }
      // título do modal
      const t=document.getElementById('modal-title'); if(t) t.innerText='Refazer notinha '+String(v.numero||'')+' (extornada)';
    }catch(e){}
  },380);
}
// Clique numa notinha ESTORNADA: não abre o modal de histórico — vai pra aba
if(typeof window.historicoVenda==='function' && !window.historicoVenda.__p605){
  const _hv=window.historicoVenda;
  const embrH=function(id){
    let v=null;
    try{ v=(db.vendas||[]).find(function(x){return x&&x.id===id;})||null; }catch(e){}
    if(v && String(v.status||'').toLowerCase()==='estornada' && !v.origemMigracao){
      abrirVendaEstornadaEdicao(v);
      return;
    }
    return _hv.apply(this,arguments);
  };
  embrH.__p605=true;
  window.historicoVenda=embrH;
}
// Salvar no modo refazer: ATUALIZA a mesma notinha (mantém número/id), acerta
// o estoque por devolução+nova baixa, e só cria título novo se faturar.
if(typeof window.saveVendaNova==='function' && !window.saveVendaNova.__p605){
  const _svn=window.saveVendaNova;
  const embrV=function(){
    const editId=window.__editandoVendaEstornadaId;
    if(!editId) return _svn.apply(this,arguments);
    const s=sess();
    let v=null;
    try{ v=(db.vendas||[]).find(function(x){return x&&x.id===editId;})||null; }catch(e){}
    if(!v){ window.__editandoVendaEstornadaId=null; return _svn.apply(this,arguments); }
    // — mesmas validações do fluxo novo —
    if(!window.clienteSelecionadoVenda){ if(typeof toast==='function') toast('Selecione o cliente pela caixa aberta','error'); return; }
    if(!window.itensTemp||!window.itensTemp.length){ if(typeof toast==='function') toast('Adicione pelo menos um produto pela caixa aberta','error'); return; }
    const status=document.getElementById('nv-status').value;
    let pagamento=document.getElementById('nv-pag').value;
    let vencimento=null;
    if(status==='faturado'){
      if(!pagamento){ if(typeof toast==='function') toast('Selecione forma de pagamento (aparece ao faturar)','error'); return; }
      if(pagamento==='A prazo'){
        vencimento=document.getElementById('nv-vencimento').value;
        if(!vencimento){ if(typeof toast==='function') toast('Selecione a data de vencimento para A prazo','error'); return; }
      }
    }
    const desc=parseFloat(document.getElementById('nv-desc').value)||0;
    const total=window.itensTemp.reduce(function(s,i){return s+i.subtotal;},0)-desc;
    // — estoque: devolve os itens ANTIGOS, baixa os NOVOS (estoque nunca em dobro) —
    const mexeEstoque=function(it,sinal){
      const p=(db.produtos||[]).find(function(x){return x&&x.id===it.produtoId&&(!s||x.empresaId===s.empresaId);});
      if(p && p.categoria!=='Serviço' && p.categoria!=='Recarga' && !p.estoqueInfinito) p.estoque+=(sinal* (Number(it.qtd)||0));
    };
    (v.itens||[]).forEach(function(it){ mexeEstoque(it,+1); });
    window.itensTemp.forEach(function(it){ mexeEstoque(it,-1); });
    // — atualiza a MESMA notinha —
    const itensNovos=window.itensTemp.map(function(it){return {produtoId:it.produtoId,qtd:it.qtd,preco:it.preco,subtotal:it.subtotal};});
    v.itens=itensNovos;
    v.clienteId=window.clienteSelecionadoVenda.id;
    v.desconto=desc;
    v.total=total;
    v.status=status;
    v.formaPagamento=(status==='faturado')?(pagamento||'Não faturado'):'Não faturado';
    v.vencimento=(status==='faturado'&&vencimento)?vencimento:null;
    v.atualizadoEm=new Date().toISOString();
    v.atualizadoPor=s&&s.usuarioId; v.atualizadoPorNome=s&&s.usuarioNome;
    v.refeitaDeEstorno=true;
    try{ if(typeof logAction==='function') logAction('venda','refazer-pos-estorno',v.id,'Notinha '+v.numero+' refeita a partir do estorno por '+(s&&s.usuarioNome)+' — itens atualizados, número mantido'); }catch(e){}
    if(status==='faturado'&&s){
      db.contasReceber.push({
        id:uid('cr'), empresaId:s.empresaId, origem:'venda', clienteId:v.clienteId,
        descricao:'Venda '+v.numero+' - '+window.clienteSelecionadoVenda.nome+' - '+pagamento+(vencimento?' - Venc '+fmtDate(vencimento):''),
        valor:total, vencimento: vencimento?new Date(vencimento).toISOString():new Date(Date.now()+1000*60*60*24*14).toISOString(),
        pagamentoData:null, status:'aberto', contratoId:null, leituraId:null, vendaId:v.id,
        criadoPor:s.usuarioId, criadoPorNome:s.usuarioNome, formaPagamento:pagamento
      });
    }
    window.__editandoVendaEstornadaId=null;
    saveDB(); renderVendas(); renderProdutos(); renderFinanceiro(); renderAuditoria(); closeModal();
    if(typeof toast==='function') toast('Notinha '+v.numero+' refeita (número mantido) por '+(s&&s.usuarioNome),'success');
    setTimeout(function(){ try{ imprimirNotinha(v.id); }catch(e){} },500);
  };
  embrV.__p605=true;
  window.saveVendaNova=embrV;
}
console.log('v6.0.5 — permissões no editor (NF/apagar/estornar) com bloqueio real + notinha extornada abre na aba da venda + financeiro mostra EXTORNADO');
})();
