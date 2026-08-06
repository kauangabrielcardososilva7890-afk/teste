// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.66 — Ajustes pós-final: produtos, venda, impressão e usuários
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
window.AJUSTES_POS_FINAL_PURE={isProdutoImpressoraLocacao,patchHtmlImpressao};

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


console.log('[DIGICOPY] ajustes_pos_final_patch.js v4.9.66 carregado');
})();
