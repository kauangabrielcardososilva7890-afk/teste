// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.52 — Cartuchos, etiquetas e configurações vindas do banco antigo
// • Usa o vídeo público apenas como referência funcional, sem copiar identidade
// • Configura etiquetas numéricas com código de barras para colar nos cartuchos
// • Usa etiquetas antigas para sugerir o próximo número
// • Remove produtos de "cartucho vazio" gerados automaticamente, conforme regra atual
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v ?? '').trim(); }
function up(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase(); }
function num(v,fb=0){ const n=Number(String(v ?? '').replace(',','.')); return Number.isFinite(n)?n:fb; }
function inteiro(v,fb=0){ const n=parseInt(String(v ?? '').replace(/\D+/g,''),10); return Number.isFinite(n)?n:fb; }
function esc(v){
  const s=txt(v);
  if(typeof escapeHtml==='function') return escapeHtml(s);
  return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function rows(dbRef,nome){ return ((((dbRef||{}).modulosDinamicos||{})[nome]||{}).dados)||[]; }
function nomesTabelas(dbRef){ return Object.keys(((dbRef||{}).modulosDinamicos)||{}); }
function pick(row,campos){ for(const c of campos){ if(row&&row[c]!==undefined&&row[c]!==null&&txt(row[c])!=='') return row[c]; } return ''; }
function agora(){ return new Date().toISOString(); }

const CAMPOS_ETIQUETA=/ETIQUETA|IDENTIFICACAO|IDENTIFICACAO_CARTUCHO|IDENTIFICAÇÃO|CHASSI|PRV_IDENTIFICACAO/i;
const TABELAS_ETIQUETA=/CARTUCHO|RECARGA|ITENS_VENDA|PRODUTOS_VARIACAO|REMAN|LOGISTICA|ROTEIRO|COLETA/i;

function tabelaComEtiqueta(nome){ return TABELAS_ETIQUETA.test(up(nome)); }
function camposEtiqueta(row){ return Object.keys(row||{}).filter(k=>CAMPOS_ETIQUETA.test(up(k))); }
function extrairEtiquetasLegado(dbRef, limitePorTabela=20000){
  const mapa=new Map();
  nomesTabelas(dbRef).filter(tabelaComEtiqueta).forEach(nome=>{
    const lista=rows(dbRef,nome).slice(0,Math.max(1,limitePorTabela));
    lista.forEach((row,idx)=>{
      camposEtiqueta(row).forEach(campo=>{
        const etiqueta=txt(row[campo]);
        if(!etiqueta || etiqueta==='0' || /^SEM\s*ETIQUETA$/i.test(etiqueta)) return;
        const chave=up(etiqueta);
        if(mapa.has(chave)) return;
        mapa.set(chave,{
          etiqueta,
          tabela:nome,
          campo,
          linha:idx+1,
          cartuchoCodigoAntigo:txt(pick(row,['COD_CARTUCHO','IV_COD_CARTUCHO','CODIGO_CARTUCHO','PRV_COD_CARTUCHO'])),
          vendaCodigoAntigo:txt(pick(row,['COD_VENDA','IV_COD_VENDA','VENDA','PRV_COD_VENDA'])),
          clienteCodigoAntigo:txt(pick(row,['COD_CLIENTE','IV_COD_CLIENTE','PRV_COD_CLIENTE'])),
          situacao:txt(pick(row,['SITUACAO','STATUS','IV_SITUACAO','PRV_STATUS','REC_SITUACAO'])),
          data:txt(pick(row,['DATA','DATA_VENDA','DATA_ENTRADA','PRV_DATA','CRIADO_EM']))
        });
      });
    });
  });
  return Array.from(mapa.values()).sort((a,b)=>a.etiqueta.localeCompare(b.etiqueta,'pt-BR',{numeric:true}));
}
function numeroDaEtiqueta(v){
  const s=txt(v);
  if(!s) return 0;
  if(/^\d+$/.test(s)) return inteiro(s,0);
  const grupos=s.match(/\d+/g);
  if(!grupos||!grupos.length) return 0;
  return inteiro(grupos[grupos.length-1],0);
}
function maiorNumeroEtiqueta(valores){ return (valores||[]).reduce((m,v)=>Math.max(m,numeroDaEtiqueta(typeof v==='object'?v.etiqueta:v)),0); }
function gerarSequenciaEtiquetas(inicio, quantidade){
  const ini=Math.max(1,inteiro(inicio,1));
  const qtd=Math.min(300,Math.max(1,inteiro(quantidade,30)));
  const largura=Math.max(6,String(ini+qtd-1).length);
  return Array.from({length:qtd},(_,i)=>String(ini+i).padStart(largura,'0'));
}
function removerProdutosCartuchoVazio(dbRef, empId){
  if(!dbRef||!Array.isArray(dbRef.produtos)) return 0;
  const antes=dbRef.produtos.length;
  dbRef.produtos=dbRef.produtos.filter(p=>{
    if(empId&&p.empresaId&&p.empresaId!==empId) return true;
    const cat=up(p.categoria||'');
    const sku=up(p.sku||p.codigo||'');
    const nome=up(p.nome||p.descricao||'');
    const gerado=/^CARTVAZ[-_]/.test(sku)||p.cartuchoCodigoAntigo;
    const vazio=/CARTUCHO\s+VAZIO|VAZIO\s+CARTUCHO/.test(cat+' '+nome);
    return !(cat==='CARTUCHO VAZIO'||(gerado&&vazio));
  });
  return antes-dbRef.produtos.length;
}
function aplicarConfiguracoesCartuchos(dbRef, opts={}){
  if(!dbRef) return {alterou:false,etiquetasEncontradas:0,maiorNumeroEtiqueta:0,proximoNumero:1,produtosCartuchoVazioRemovidos:0};
  dbRef.config=dbRef.config||{};
  const cfg=dbRef.config.cartuchosRecargas=dbRef.config.cartuchosRecargas||{};
  const antes=JSON.stringify(cfg);
  const etiquetas=extrairEtiquetasLegado(dbRef);
  const maior=maiorNumeroEtiqueta(etiquetas);
  const removidos=removerProdutosCartuchoVazio(dbRef, opts.empresaId);
  cfg.etiquetas={
    layout:'A4_3X10',
    colunas:3,
    linhas:10,
    larguraMm:63.5,
    alturaMm:25.4,
    margemSuperiorMm:12.7,
    margemEsquerdaMm:4.5,
    espacoHorizontalMm:2.5,
    espacoVerticalMm:0,
    usarCodigoBarras:true,
    codigoSomenteNumerico:true,
    permitirLetras:false,
    etiquetaPerpetua:true,
    ...(cfg.etiquetas||{})
  };
  cfg.etiquetas.codigoSomenteNumerico=true;
  cfg.etiquetas.permitirLetras=false;
  cfg.etiquetas.etiquetaPerpetua=true;
  const atual=inteiro(cfg.etiquetas.proximoNumero,1);
  cfg.etiquetas.proximoNumero=Math.max(1,atual,maior+1);
  cfg.logistica={
    telaLeve:true,
    filtros:['todos','toner','tinta','reciclando','pronto','defeito','garantia'],
    status:['recebido','reciclando','aguardando_autorizacao','com_defeito','pronto','entregue','garantia'],
    ...(cfg.logistica||{})
  };
  cfg.regras={
    cartuchoVazioComoProduto:false,
    etiquetaObrigatoria:false,
    etiquetaSomenteNumerica:true,
    permitirCartuchoTerceiro:true,
    permitirGarantiaSemFinanceiro:true,
    baixaAutomaticaInsumos:false,
    ...(cfg.regras||{})
  };
  cfg.regras.cartuchoVazioComoProduto=false;
  cfg.regras.etiquetaSomenteNumerica=true;
  cfg.dadosAntigos={
    etiquetasEncontradas:etiquetas.length,
    maiorNumeroEtiqueta:maior,
    exemplos:etiquetas.slice(0,12),
    tabelasUsadas:nomesTabelas(dbRef).filter(tabelaComEtiqueta),
    atualizadoEm:cfg.dadosAntigos&&cfg.dadosAntigos.atualizadoEm&&!opts.forcar?cfg.dadosAntigos.atualizadoEm:agora()
  };
  cfg.produtosCartuchoVazioRemovidos=(cfg.produtosCartuchoVazioRemovidos||0)+removidos;
  const depois=JSON.stringify(cfg);
  return {alterou:antes!==depois||removidos>0,etiquetasEncontradas:etiquetas.length,maiorNumeroEtiqueta:maior,proximoNumero:cfg.etiquetas.proximoNumero,produtosCartuchoVazioRemovidos:removidos};
}

const CODE39={
  '0':'nnnwwnwnn','1':'wnnwnnnnw','2':'nnwwnnnnw','3':'wnwwnnnnn','4':'nnnwwnnnw',
  '5':'wnnwwnnnn','6':'nnwwwnnnn','7':'nnnwnnwnw','8':'wnnwnnwnn','9':'nnwwnnwnn','*':'nwnnwnwnn'
};
function code39Svg(valor,opt={}){
  const code=txt(valor).replace(/\D+/g,'');
  const chars=('*'+code+'*').split('');
  const narrow=num(opt.narrow,1.1), wide=num(opt.wide,3.1), height=num(opt.height,32);
  let x=2, rects='';
  chars.forEach(ch=>{
    const pat=CODE39[ch]||CODE39['0'];
    for(let i=0;i<pat.length;i++){
      const w=pat[i]==='w'?wide:narrow;
      if(i%2===0) rects+=`<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="${height}"/>`;
      x+=w;
    }
    x+=narrow;
  });
  return `<svg viewBox="0 0 ${Math.ceil(x+2)} ${height}" preserveAspectRatio="none" aria-label="${code}">${rects}</svg>`;
}
function htmlEtiquetas(codigos,opt={}){
  const c={colunas:3,linhas:10,larguraMm:63.5,alturaMm:25.4,margemSuperiorMm:12.7,margemEsquerdaMm:4.5,espacoHorizontalMm:2.5,espacoVerticalMm:0,usarCodigoBarras:true,...(opt||{})};
  const css=`@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#0f172a}.folha{padding-top:${c.margemSuperiorMm}mm;padding-left:${c.margemEsquerdaMm}mm;display:grid;grid-template-columns:repeat(${c.colunas},${c.larguraMm}mm);grid-auto-rows:${c.alturaMm}mm;column-gap:${c.espacoHorizontalMm}mm;row-gap:${c.espacoVerticalMm}mm}.etq{width:${c.larguraMm}mm;height:${c.alturaMm}mm;border:0.2mm dashed #d7dce5;padding:1.5mm 2mm;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;page-break-inside:avoid}.titulo{font-size:7pt;font-weight:700;letter-spacing:.02em}.codigo{font-size:12pt;font-weight:900;letter-spacing:.08em;margin-top:.5mm}.barra{width:100%;height:9mm;margin-top:.8mm}.barra svg{width:100%;height:100%;display:block}.obs{font-size:5.8pt;color:#64748b;margin-top:.5mm}@media print{.etq{border:0}}`;
  const itens=(codigos||[]).map(cod=>`<div class="etq"><div class="titulo">DIGICOPY CARTUCHO</div>${c.usarCodigoBarras?`<div class="barra">${code39Svg(cod)}</div>`:''}<div class="codigo">${esc(cod)}</div><div class="obs">identificação do cartucho</div></div>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Etiquetas de cartuchos</title><style>${css}</style></head><body><div class="folha">${itens}</div><script>setTimeout(()=>window.print(),250)<\/script></body></html>`;
}
function cfgAtual(){ return (((db||{}).config||{}).cartuchosRecargas)||{}; }
function aplicarNoApp(opts={}){
  const sess=typeof getSession==='function'?getSession():null;
  const r=aplicarConfiguracoesCartuchos(db,{empresaId:sess&&sess.empresaId,forcar:!!opts.forcar});
  if(r.alterou&&typeof saveDB==='function') saveDB();
  if(opts.toast&&typeof toast==='function') toast(`Cartuchos configurados: ${r.etiquetasEncontradas} etiqueta(s) antiga(s), próximo número ${r.proximoNumero}`,'success');
  return r;
}
function imprimirEtiquetasUI(){
  const cfg=cfgAtual().etiquetas||{};
  const inicio=inteiro(document.getElementById('cart-etq-inicio')?.value,cfg.proximoNumero||1);
  const qtd=inteiro(document.getElementById('cart-etq-qtd')?.value,30);
  const codigos=gerarSequenciaEtiquetas(inicio,qtd);
  db.config=db.config||{}; db.config.cartuchosRecargas=db.config.cartuchosRecargas||{}; db.config.cartuchosRecargas.etiquetas={...(db.config.cartuchosRecargas.etiquetas||{}),proximoNumero:inicio+codigos.length};
  if(typeof saveDB==='function') saveDB();
  const html=htmlEtiquetas(codigos,db.config.cartuchosRecargas.etiquetas);
  const w=window.open('','_blank');
  if(!w){ if(typeof toast==='function') toast('Navegador bloqueou a impressão. Libere pop-up.','error'); return; }
  w.document.open(); w.document.write(html); w.document.close();
  setTimeout(renderCardEtiquetas,100);
}
async function atualizarEEnviarNuvem(){
  const r=aplicarNoApp({forcar:true,toast:true});
  if(typeof window.syncEnviarParaNuvem==='function'){
    try{ await window.syncEnviarParaNuvem({confirmar:false}); if(typeof toast==='function') toast('Configuração salva e enviada para a nuvem','success'); }
    catch(e){ console.warn('[CARTUCHOS_ETIQUETAS] sync',e); if(typeof toast==='function') toast('Salvo localmente. Não consegui enviar para a nuvem agora.','error'); }
  }
  return r;
}
function renderCardEtiquetas(){
  if(typeof document==='undefined') return;
  const grid=document.querySelector('#view-config .grid')||document.getElementById('view-config');
  if(!grid) return;
  aplicarNoApp({forcar:false});
  const cfg=cfgAtual(); const et=cfg.etiquetas||{}; const ant=cfg.dadosAntigos||{};
  let card=document.getElementById('cartuchos-etiquetas-card');
  if(!card){ card=document.createElement('div'); card.id='cartuchos-etiquetas-card'; card.className='rounded-[16px] bg-white border p-6 lg:col-span-3'; grid.appendChild(card); }
  card.innerHTML=`<div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3"><div><h4 class="font-bold text-[15px]"><i class="ph ph-barcode"></i> Etiquetas de cartuchos</h4><p class="text-[12px] text-slate-500 mt-1">Gera etiquetas numéricas próprias, com código de barras, para colar nos cartuchos. Usa as etiquetas antigas só para sugerir o próximo número.</p></div><div class="text-[11px] text-slate-500">Próximo: <b class="text-slate-800">${et.proximoNumero||1}</b></div></div><div class="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4"><div class="neo-card"><p class="neo-label">Etiquetas antigas</p><div class="neo-total">${ant.etiquetasEncontradas||0}</div></div><div class="neo-card"><p class="neo-label">Maior etiqueta</p><div class="neo-total">${ant.maiorNumeroEtiqueta||0}</div></div><div class="neo-card"><p class="neo-label">Produtos vazios removidos</p><div class="neo-total">${cfg.produtosCartuchoVazioRemovidos||0}</div></div><div class="neo-card"><p class="neo-label">Regra atual</p><div class="text-[13px] font-bold text-emerald-700 mt-2">vazio não é produto</div></div></div><div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end"><label class="text-[12px] font-bold text-slate-600">Número inicial<input id="cart-etq-inicio" type="number" min="1" value="${et.proximoNumero||1}" class="mt-1 w-full h-10 px-3 rounded-xl border"></label><label class="text-[12px] font-bold text-slate-600">Quantidade<input id="cart-etq-qtd" type="number" min="1" max="300" value="30" class="mt-1 w-full h-10 px-3 rounded-xl border"></label><button onclick="imprimirEtiquetasCartucho()" class="neo-btn primary"><i class="ph ph-printer"></i> Imprimir etiquetas</button><button onclick="atualizarConfigCartuchosAntigos()" class="neo-btn"><i class="ph ph-cloud-arrow-up"></i> Atualizar e enviar nuvem</button></div><div class="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-[12px] text-amber-900"><b>Importante:</b> as etiquetas novas são só números, sem prefixo e sem ano. Cartucho vazio não entra como produto separado no estoque.</div>`;
}

window.CARTUCHOS_ETIQUETAS_PURE={extrairEtiquetasLegado,numeroDaEtiqueta,maiorNumeroEtiqueta,gerarSequenciaEtiquetas,removerProdutosCartuchoVazio,aplicarConfiguracoesCartuchos,code39Svg,htmlEtiquetas};
window.imprimirEtiquetasCartucho=imprimirEtiquetasUI;
window.atualizarConfigCartuchosAntigos=atualizarEEnviarNuvem;

if(typeof document==='undefined') return;
const oldRenderConfig=window.renderConfig;
window.renderConfig=function(){ const r=oldRenderConfig?oldRenderConfig.apply(this,arguments):undefined; setTimeout(renderCardEtiquetas,180); return r; };
setTimeout(()=>aplicarNoApp({forcar:false}),1600);
setTimeout(renderCardEtiquetas,2200);
console.log('[DIGICOPY] cartuchos_etiquetas_config_patch.js v4.9.52 carregado');
})();
