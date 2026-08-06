// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.65 — Ajustes pós-final: produtos, venda, impressão, usuários e assistente Gemini
// • Impressoras de locação não aparecem no menu Produtos
// • Sair de venda em andamento pergunta se deseja salvar
// • Rodapé de dados da loja em impressões HTML, sem repetir no rodapé da venda
// • Chamados com faixas de seção destacadas
// • Usuários editáveis com perfil restrito a Kauan/Denivaldo
// • Assistente local de ajuda do Sistema Digicopy
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function fold(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
function esc(v){ if(typeof escapeHtml==='function') return escapeHtml(v); return txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function money(v){ return typeof fmtMoney==='function'?fmtMoney(Number(v)||0):(Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function sess(){ return typeof getSession==='function'?getSession():null; }
function salvar(){ if(typeof saveDB==='function') saveDB(); }
function toastMsg(m,t){ if(typeof toast==='function') toast(m,t||'info'); }
function uidSafe(p){ return typeof uid==='function'?uid(p):`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }

function loja(){
  const s=sess(); const emp=(db.empresas||[]).find(e=>s&&e.id===s.empresaId)||((db.empresas||[])[0])||{}; const l=(db.config||{}).loja||{};
  const d={...emp,...l};
  const endereco=d.endereco||[d.rua||d.logradouro,d.numero,d.bairro,d.cidade||d.municipio,d.uf||d.estado,d.cep].filter(Boolean).join(' • ');
  return {fantasia:d.fantasia||'DIGICOPY',razao:d.razaoSocial||d.nome||'',cnpj:d.cnpj||'',telefone:d.telefone||d.fone||'',whatsapp:d.whatsapp||'+55 38 99109-8698',email:d.email||'',endereco};
}
function usuarioPodePerfil(){ const s=sess(); const l=fold(s&&s.login); return l==='kauan'||l==='denivaldo'||fold(s&&s.usuarioNome)==='kauan'||fold(s&&s.usuarioNome)==='denivaldo'; }
function isProdutoImpressoraLocacao(p){
  const cat=fold(p.categoria||p.tipo||'');
  const origem=fold(p.origem||p.origemMigracao||p.tabelaOrigem||'');
  if(p.equipamentoId||p.contratoId||p.parqueId||p.codigoEquipamento||p.patrimonio||p.serial||p.serie) return true;
  if(cat==='impressora'||cat==='equipamento'||cat.includes('locacao')||cat.includes('locação')) return true;
  if(origem.includes('equipamento')||origem.includes('locacao')||origem.includes('locação')||origem.includes('itens_locacao')) return true;
  return false;
}
function vendaEmAndamento(){
  const ctx=window.modalContext||{};
  const vendaCtx=ctx.type==='venda'||document.getElementById('nv-itens')||document.getElementById('neo-venda-itens')||document.getElementById('cv-itens');
  if(!vendaCtx) return false;
  const hasItems=(window.itensTemp&&window.itensTemp.length)||(window.neoVendaItens&&window.neoVendaItens.length)||(window.cvItens&&window.cvItens.length);
  const hasClient=window.neoVendaCliente||document.getElementById('nv-cli')?.value||document.getElementById('cv-cliente')?.value;
  const obs=document.querySelector('#modal-body textarea')?.value||'';
  return !!(hasItems||hasClient||txt(obs));
}
function chamarSalvarVendaDisponivel(){
  if(typeof window.neoSalvarVenda==='function' && (window.neoVendaItens||[]).length) return window.neoSalvarVenda();
  if(typeof window.cvSaveVenda==='function' && (window.cvItens||[]).length) return window.cvSaveVenda();
  if(typeof window.saveVenda==='function') return window.saveVenda();
  toastMsg('Não encontrei função de salvar esta venda.','error');
}
function rodapeLojaHtml(){
  const l=loja();
  return `<div class="rodape-loja-final" style="margin:6mm 10mm 3mm;border-top:1px solid #d8dee9;padding-top:2mm;text-align:center;font-family:Arial,sans-serif;font-size:8.5px;color:#5b6472;page-break-inside:avoid"><b>${esc(l.fantasia)}</b>${l.razao?' • '+esc(l.razao):''}${l.cnpj?' • CNPJ '+esc(l.cnpj):''}<br>${esc(l.endereco||'Endereço não informado')}${l.telefone?' • Tel. '+esc(l.telefone):''}${l.whatsapp?' • WhatsApp '+esc(l.whatsapp):''}${l.email?' • '+esc(l.email):''}</div>`;
}
function patchHtmlImpressao(html){
  if(!html||typeof html!=='string') return html;
  if(/\{\\rtf/i.test(html.slice(0,50))) return html;
  // Remove repetição antiga no audit da venda; o rodapé padronizado entra uma vez.
  html=html.replace(/<p class="audit">([\s\S]*?)CNPJ[\s\S]*?<\/p>/, '<p class="audit">Emitido em '+new Date().toLocaleString('pt-BR')+'</p>');
  if(!html.includes('rodape-loja-final')) html=html.replace(/<script>setTimeout\(\(\)=>window\.print\(\),250\)<\\\/script>|<script>window\.onload[\s\S]*?<\\\/script>|<\/body>/i, (m)=>{
    if(/<\/body>/i.test(m)) return rodapeLojaHtml()+m;
    return rodapeLojaHtml()+m;
  });
  return html;
}
function destacarChamadoModal(){
  const body=document.getElementById('modal-body'); if(!body||body.dataset.chamadoFaixas==='1') return;
  const title=(document.getElementById('modal-title')?.innerText||''); if(!/chamado|ordem/i.test(title)) return;
  body.dataset.chamadoFaixas='1';
  const labels=[...body.querySelectorAll('label,p')];
  labels.forEach(el=>{
    const t=fold(el.innerText||el.textContent||'');
    if(/motivo|defeito|serviço executado|servicos|observa|contador|itens usados|peças|pecas/.test(t)){
      const faixa=document.createElement('div'); faixa.className='faixa-chamado-final'; faixa.textContent=(el.innerText||el.textContent||'Seção').replace('*','').trim();
      el.parentNode.insertBefore(faixa,el);
    }
  });
}
function respostaAssistente(q){
  const s=fold(q);
  if(!s) return 'Me diga o que você quer encontrar no sistema: venda, cliente, chamado, leitura, contrato, buscador escola, etiquetas, pix ou financeiro.';
  if(s.includes('cliente')) return 'Clientes: abra Clientes, pesquise por Enter/lupa ou use filtros. A lista não abre todos por padrão para ficar leve. O código é número puro e continua do maior importado.';
  if(s.includes('venda')||s.includes('notinha')) return 'Vendas/Notinhas: use Atendimento > Nova venda. Se tentar sair de uma venda em andamento, o sistema pergunta se deseja salvar. Notinha faturada bloqueia edição até estornar.';
  if(s.includes('chamado')||s.includes('os')) return 'Chamados: ficam no menu Chamados. Chamado avulso mostra histórico geral; chamado de contrato fica dentro do contrato. Modelo técnico imprime antes de faturar; chamado final imprime depois.';
  if(s.includes('leitura')) return 'Leituras: ficam dentro do contrato. Abra Contratos > selecione contrato > Leituras. Leitura faturada bloqueia edição até estornar.';
  if(s.includes('contrato')) return 'Contratos: impressoras ficam dentro do contrato. Use Contratos > abrir contrato > Nova impressora, Leituras, Chamados e Modelos contrato.';
  if(s.includes('buscador')||s.includes('escola')) return 'Buscador Escola: fica no menu Buscador Escola antes de Configurações. Use Atualizar, digite o termo e filtre por MG/Norte de Minas.';
  if(s.includes('etiqueta')||s.includes('cartucho')) return 'Etiquetas: ficam em Configurações > Etiquetas de cartuchos enquanto a configuração estiver liberada. Agora saem pequenas e com número direto, sem zeros à esquerda.';
  if(s.includes('pix')) return 'Pix: Pix e Pix QR Code não dão baixa automática. Peça comprovante e faça baixa manual.';
  if(s.includes('financeiro')) return 'Financeiro: vendas/leitura faturadas geram contas a receber. Pix não baixa sozinho.';
  return 'Ainda não achei uma resposta exata. Tente perguntar usando palavras como cliente, venda, notinha, chamado, leitura, contrato, buscador escola, etiqueta, pix ou financeiro.';
}

function iaCfg(){
  db.config=db.config||{};
  db.config.ia=db.config.ia||{};
  // v4.9.65: a chave não fica mais salva localmente; somente no banco do sistema.
  try{
    localStorage.removeItem('digicopy_gemini_api_key');
    localStorage.removeItem('digicopy_gemini_model');
  }catch(e){}
  db.config.ia.geminiModel=db.config.ia.geminiModel||'gemini-1.5-flash';
  return db.config.ia;
}
function salvarGeminiKey(chave){
  const c=iaCfg();
  c.geminiApiKey=txt(chave);
  c.geminiSalvaEm=new Date().toISOString();
  salvar();
  return c;
}
function apagarGeminiKey(){
  const c=iaCfg();
  delete c.geminiApiKey;
  c.geminiRemovidaEm=new Date().toISOString();
  salvar();
}
function limparHistoricoAssistente(){
  try{ localStorage.removeItem('digicopy_ia_historico'); localStorage.removeItem('digicopy_ai_history'); }catch(e){}
}

window.AJUSTES_POS_FINAL_PURE={isProdutoImpressoraLocacao,patchHtmlImpressao,respostaAssistente,iaCfg,salvarGeminiKey,limparHistoricoAssistente};

if(typeof document==='undefined') return;

// Remove a barra azul duplicada no topo; o .exe já tem barra própria.
const style=document.createElement('style');
style.id='ajustes-pos-final-css';
style.textContent=`.app-titlebar{display:none!important}.faixa-chamado-final{margin:10px 0 6px;padding:7px 10px;background:#0a1e8a;color:#fff;border-radius:10px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}`;
document.head.appendChild(style);

// Produtos: não mostrar impressoras de locação/equipamentos no menu Produtos.
const oldRenderProdutos=window.renderProdutos;
if(typeof oldRenderProdutos==='function') window.renderProdutos=function(){
  const orig=db.produtos;
  try{ db.produtos=(orig||[]).filter(p=>!isProdutoImpressoraLocacao(p)); return oldRenderProdutos.apply(this,arguments); }
  finally{ db.produtos=orig; }
};

// Fechar venda em andamento: pergunta se deseja salvar antes de sair.
const oldClose=window.closeModal;
window.closeModal=function(){
  if(vendaEmAndamento()&&!window.__fecharVendaConfirmado&&!window.__salvandoVendaFinal){
    const salvarVenda=confirm('Você está saindo de uma venda/notinha em andamento. Deseja salvar antes de sair?\n\nOK = salvar agora\nCancelar = sair sem salvar');
    if(salvarVenda){ window.__salvandoVendaFinal=true; try{ chamarSalvarVendaDisponivel(); } finally{ setTimeout(()=>window.__salvandoVendaFinal=false,600); } return; }
    window.__fecharVendaConfirmado=true;
    const r=oldClose?oldClose.apply(this,arguments):undefined;
    setTimeout(()=>window.__fecharVendaConfirmado=false,200);
    return r;
  }
  return oldClose?oldClose.apply(this,arguments):undefined;
};
document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ const m=document.getElementById('modal-root'); if(m&&!m.classList.contains('hidden')){ e.preventDefault(); window.closeModal(); } } },true);

// Rodapé padrão em qualquer janela HTML de impressão/PDF (exceto RTF).
const oldOpen=window.open;
window.open=function(){
  const w=oldOpen?oldOpen.apply(window,arguments):null;
  try{
    if(w&&w.document&&w.document.write){
      const ow=w.document.write.bind(w.document);
      w.document.write=function(html){ if(typeof html==='string'&&/<html|<!DOCTYPE/i.test(html)) html=patchHtmlImpressao(html); return ow(html); };
    }
  }catch(e){}
  return w;
};
const oldVos=window.vosGerarHtmlNotinha;
if(typeof oldVos==='function') window.vosGerarHtmlNotinha=function(){ return patchHtmlImpressao(oldVos.apply(this,arguments)); };

// Destacar seções do chamado após abrir.
const oldOpenModal=window.openModal;
window.openModal=function(type,id){ const r=oldOpenModal?oldOpenModal.apply(this,arguments):undefined; if(type==='os') setTimeout(destacarChamadoModal,160); return r; };

// Usuários editáveis.
window.renderModalUsuario=function(id){
  const s=sess(); if(!s) return;
  const isEdit=!!id; const atual=(db.usuarios||[]).find(u=>u.id===s.usuarioId)||{};
  const u=isEdit?(db.usuarios||[]).find(x=>x.id===id):{empresaId:s.empresaId,nome:'',login:'',senha:'',perfil:'Comercial',ativo:true};
  const podePerfil=usuarioPodePerfil(); const podeEditar=podePerfil||!isEdit||u.id===s.usuarioId;
  if(!podeEditar) return toastMsg('Você só pode alterar seu próprio usuário. Perfil só Kauan ou Denivaldo alteram.','error');
  const perfilDisabled=podePerfil?'':'disabled';
  const root=document.getElementById('modal-root'); if(root) root.classList.remove('hidden');
  document.getElementById('modal-title').innerText=isEdit?'Editar usuário':'Novo usuário';
  document.getElementById('modal-body').innerHTML=`<div class="space-y-4"><div><label class="text-[11px] font-bold uppercase text-slate-500">Nome</label><input id="u-nome" value="${esc(u.nome||'')}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div class="grid grid-cols-2 gap-3"><div><label class="text-[11px] font-bold uppercase text-slate-500">Login</label><input id="u-login" value="${esc(u.login||'')}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Senha</label><input id="u-senha" type="password" value="${esc(u.senha||'')}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div></div><div class="grid grid-cols-2 gap-3"><div><label class="text-[11px] font-bold uppercase text-slate-500">Perfil</label><select id="u-perfil" ${perfilDisabled} class="mt-1 w-full h-11 px-3 rounded-xl border bg-white"><option ${u.perfil==='Admin'?'selected':''}>Admin</option><option ${u.perfil==='Comercial'?'selected':''}>Comercial</option><option ${u.perfil==='Técnico'?'selected':''}>Técnico</option><option ${u.perfil==='Financeiro'?'selected':''}>Financeiro</option></select>${!podePerfil?'<p class="text-[11px] text-amber-700 mt-1">Somente Kauan ou Denivaldo alteram perfil.</p>':''}</div><div><label class="text-[11px] font-bold uppercase text-slate-500">Status</label><select id="u-ativo" class="mt-1 w-full h-11 px-3 rounded-xl border bg-white"><option value="true" ${u.ativo!==false?'selected':''}>Ativo</option><option value="false" ${u.ativo===false?'selected':''}>Inativo</option></select></div></div></div>`;
  document.getElementById('modal-footer').innerHTML=`<button onclick="closeModal()" class="neo-btn">Cancelar</button><button onclick="saveUsuarioFinal('${esc(id||'')}')" class="neo-btn primary">Salvar usuário</button>`;
  window.modalContext={type:'usuario',id:id||null};
};
window.saveUsuarioFinal=function(id){
  const s=sess(); if(!s) return; const podePerfil=usuarioPodePerfil();
  const nome=txt(document.getElementById('u-nome')?.value), login=txt(document.getElementById('u-login')?.value), senha=txt(document.getElementById('u-senha')?.value), ativo=document.getElementById('u-ativo')?.value==='true';
  if(!nome||!login||!senha) return toastMsg('Preencha nome, login e senha','error');
  let u=id?(db.usuarios||[]).find(x=>x.id===id):null;
  if(u && !podePerfil && u.id!==s.usuarioId) return toastMsg('Você só pode alterar seu próprio usuário','error');
  if(!u){ u={id:uidSafe('usr'),empresaId:s.empresaId,criadoEm:new Date().toISOString(),criadoPor:s.usuarioId}; db.usuarios.push(u); }
  const perfil=podePerfil?document.getElementById('u-perfil')?.value:(u.perfil||'Comercial');
  Object.assign(u,{nome,login,senha,ativo,perfil,atualizadoEm:new Date().toISOString(),atualizadoPor:s.usuarioId}); salvar();
  if(typeof renderUsuarios==='function') renderUsuarios(); if(typeof closeModal==='function') closeModal(); toastMsg('Usuário salvo','success');
};

// Assistente local.
function renderAssistente(){
  if(document.getElementById('assistente-digicopy')) return;
  const box=document.createElement('div'); box.id='assistente-digicopy'; box.innerHTML=`<button id="assist-btn" title="Assistente" style="position:fixed;right:18px;bottom:18px;z-index:70;width:52px;height:52px;border-radius:18px;background:#0a1e8a;color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.25);font-weight:800">IA</button><div id="assist-panel" class="hidden" style="position:fixed;right:18px;bottom:82px;z-index:70;width:min(390px,calc(100vw - 32px));background:white;border:1px solid #d9e0ee;border-radius:18px;box-shadow:0 18px 50px rgba(0,0,0,.25);overflow:hidden"><div style="padding:12px 14px;background:#0a1e8a;color:white;font-weight:800;display:flex;justify-content:space-between;gap:8px"><span>Assistente do Sistema Digicopy</span><button id="assist-config" style="background:rgba(255,255,255,.18);border:0;color:white;border-radius:8px;padding:2px 8px;font-size:11px">Gemini</button></div><div id="assist-chat" style="height:285px;overflow:auto;padding:12px;font-size:12px;color:#334155"><p><b>Assistente:</b> Pergunte sobre cliente, venda, chamado, leitura, contrato, buscador escola, etiqueta, pix ou financeiro. Se a chave Gemini estiver salva no sistema, eu respondo como IA online; sem chave uso ajuda local. O histórico apaga ao fechar o sistema.</p></div><div style="display:flex;gap:6px;padding:10px;border-top:1px solid #eef2f7"><input id="assist-input" style="flex:1;height:38px;border:1px solid #d9e0ee;border-radius:10px;padding:0 10px" placeholder="Digite sua pergunta"><button id="assist-send" style="height:38px;padding:0 12px;border-radius:10px;background:#0a1e8a;color:white;font-weight:800">Enviar</button></div></div>`; document.body.appendChild(box);
  document.getElementById('assist-btn').onclick=()=>document.getElementById('assist-panel').classList.toggle('hidden');
  document.getElementById('assist-config').onclick=()=>{ const atual=!!iaCfg().geminiApiKey; const k=prompt('Cole sua chave API do Gemini. Pegue em: https://aistudio.google.com/app/apikey\n\nEla ficará salva no banco do sistema para usar em todos os PCs sincronizados. Não aparece em tela.\n\nSe já estiver configurada e quiser manter, clique Cancelar. Para apagar, deixe vazio e confirme.', ''); if(k!==null){ if(txt(k)){ salvarGeminiKey(k); toastMsg('Chave Gemini salva no sistema','success'); } else if(atual && confirm('Apagar a chave Gemini salva no sistema?')){ apagarGeminiKey(); toastMsg('Chave Gemini apagada; usando ajuda local','info'); } } };
  const send=async()=>{
    const inp=document.getElementById('assist-input'), chat=document.getElementById('assist-chat'); const q=inp.value; if(!txt(q)) return;
    chat.insertAdjacentHTML('beforeend',`<p><b>Você:</b> ${esc(q)}</p><p><b>Assistente:</b> pensando...</p>`); inp.value=''; chat.scrollTop=chat.scrollHeight;
    let resp=''; const cfgIA=iaCfg(); const key=cfgIA.geminiApiKey||'';
    if(key&&window.digicopyAI&&typeof window.digicopyAI.chat==='function'){
      try{ const r=await window.digicopyAI.chat({apiKey:key,prompt:q,model:cfgIA.geminiModel||'gemini-1.5-flash'}); resp=(r&&r.ok&&r.text)?r.text:('Gemini falhou: '+(r&&r.error?r.error:'erro desconhecido')+'\n\nResposta local: '+respostaAssistente(q)); }
      catch(e){ resp='Gemini falhou: '+(e.message||e)+'\n\nResposta local: '+respostaAssistente(q); }
    }else resp=respostaAssistente(q)+'\n\nPara resposta online grátis/limitada, clique em Gemini e salve sua chave API do Google AI Studio no sistema.';
    const ps=chat.querySelectorAll('p'); const last=ps[ps.length-1]; if(last) last.innerHTML='<b>Assistente:</b> '+esc(resp).replace(/\n/g,'<br>'); chat.scrollTop=chat.scrollHeight;
  };
  document.getElementById('assist-send').onclick=send; document.getElementById('assist-input').onkeydown=e=>{ if(e.key==='Enter') send(); };
}
window.addEventListener('beforeunload',limparHistoricoAssistente);
setTimeout(renderAssistente,1200);
console.log('[DIGICOPY] ajustes_pos_final_patch.js v4.9.65 carregado');
})();
