// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.66 — Ajustes pós-final: produtos, venda, impressão e usuários
// • Impressoras de locação não aparecem no menu Produtos
// • Sair de venda em andamento pergunta se deseja salvar
// • Rodapé de dados da loja em impressões HTML, sem repetir no rodapé da venda
// • Chamados com faixas de seção destacadas
// • Usuários editáveis com perfil restrito a Admin/Dono
// • Assistente local de ajuda do Sistema Digicopy
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function fold(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
function esc(v){ if(typeof escapeHtml==='function') return escapeHtml(v); return txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function sess(){ return typeof getSession==='function'?getSession():null; }
function salvar(){ if(typeof saveDB==='function') saveDB(); }

function loja(){
  const s=sess(); const emp=(db.empresas||[]).find(e=>s&&e.id===s.empresaId)||((db.empresas||[])[0])||{}; const l=(db.config||{}).loja||{};
  const d={...emp,...l};
  const endereco=d.endereco||[d.rua||d.logradouro,d.numero,d.bairro,d.cidade||d.municipio,d.uf||d.estado,d.cep].filter(Boolean).join(' • ');
  return {fantasia:d.fantasia||'DIGICOPY',razao:d.razaoSocial||d.nome||'',cnpj:d.cnpj||'',telefone:d.telefone||d.fone||'',whatsapp:d.whatsapp||'+55 38 99109-8698',email:d.email||'',endereco};
}
function isProdutoImpressoraLocacao(p){
  const cat=fold(p.categoria||p.tipo||'');
  const origem=fold(p.origem||p.origemMigracao||p.tabelaOrigem||'');
  if(p.equipamentoId||p.contratoId||p.parqueId||p.codigoEquipamento||p.patrimonio||p.serial||p.serie) return true;
  if(cat==='impressora'||cat==='equipamento'||cat.includes('locacao')||cat.includes('locação')) return true;
  if(origem.includes('equipamento')||origem.includes('locacao')||origem.includes('locação')||origem.includes('itens_locacao')) return true;
  return false;
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
  // DESATIVADO (v5.19.23): as faixas azuis agora são feitas só pelo
  // ajustes_v5186_patch.js. Esta função antiga adicionava faixa SEM esconder
  // o título, duplicando os nomes (ex.: "MOTIVO/DEFEITO" duas vezes).
  return;
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

// v5.22.73 — este aviso "Deseja salvar antes de sair?" era de uma tela de venda
// que não existe mais: ele procurava neoSalvarVenda/cvSaveVenda/saveVenda e,
// como a venda de hoje salva por vosGravarVenda, terminava em "Não encontrei
// função de salvar esta venda" — travando o Salvar. A venda atual já grava
// sozinha ao fechar (ajustes_v52241), então esta camada foi removida.
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

// r58 (auditoria, achado 9): modal de usuário + saveUsuarioFinal REMOVIDOS daqui —
// estavam mortos (o v5196 carrega depois e os window.* dele vencem). Uma tela, uma função.
console.log('[DIGICOPY] ajustes_pos_final_patch.js v4.9.66 carregado');
})();
