// DIGICOPY ERP — Impressão das notinhas do sistema antigo (módulos migrados) — v4.7.0
// Cada registro de qualquer tabela migrada ganha botão "Imprimir" no detalhe,
// saindo um documento formatado com a logo. Tabelas de notinha/cupom são
// destacadas automaticamente no Explorar Migrados.
(function(){
'use strict';

/* MIGPRINT_PURE_START */
const MIGPRINT_PURE = (function(){
  function esc(s){
    return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function rotuloCampo(k){
    return String(k||'').replace(/[_]+/g,' ').toLowerCase().replace(/(^|\s)([a-zà-ÿ])/g, (m,p1,p2)=>p1+p2.toUpperCase());
  }
  // Tabelas que guardam notinha/cupom/venda antiga
  function ehTabelaNotinha(nome){
    return /NOTIN|NOTA|CUPOM|VENDA|SAIDA|ORCAM|PEDIDO/i.test(String(nome||''));
  }
  // Melhor campo para o título do documento
  function resumoRegistro(row){
    const prio = ['NUMERO','NRO','NOTA','NOTINHA','CUPOM','CODIGO','COD','DOCUMENTO','ID','DATA','EMISSAO'];
    const chaves = Object.keys(row||{});
    for(const p of prio){
      const k = chaves.find(c=>c.toUpperCase().includes(p) && String(row[c]??'').trim()!=='');
      if(k) return rotuloCampo(k) + ': ' + String(row[k]);
    }
    return '';
  }
  // Documento HTML pronto para imprimir (leve, sem dependência)
  function htmlDocRegistro(opt){
    const linhas = Object.entries(opt.row||{}).map(([k,v])=>
      `<tr><td class="k">${esc(rotuloCampo(k))}</td><td class="v">${(v==null||String(v).trim()==='')?'<span class="vz">—</span>':esc(String(v))}</td></tr>`).join('');
    const logoImg = opt.logo ? `<img src="${opt.logo}" style="width:30mm;max-height:16mm;object-fit:contain">` : '';
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${esc(opt.label)} — registro</title><style>
      @page{size:A4 portrait;margin:12mm}
      *{box-sizing:border-box}
      body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#111;margin:0}
      .cab{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0a1e8a;padding-bottom:4mm;margin-bottom:4mm;gap:6mm}
      .emp{font-size:9.5px;color:#555;margin-top:1mm}
      h1{font-size:15px;color:#0a1e8a;margin:0;text-transform:uppercase}
      .resumo{font-size:11px;color:#333;margin-top:1.5mm}
      table{width:100%;border-collapse:collapse;font-size:11.5px}
      td{border:1px solid #dfe3ee;padding:1.8mm 2.5mm;vertical-align:top}
      td.k{width:52mm;background:#eef0f8;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#333}
      .vz{color:#999}
      .rod{margin-top:5mm;font-size:9px;color:#777;border-top:1px solid #ddd;padding-top:2mm}
      .noprint{margin:8mm;text-align:center;font-family:Arial}
      .noprint button{padding:3mm 8mm;border:0;border-radius:2mm;background:#0a1e8a;color:#fff;font-weight:700;cursor:pointer;font-size:12px}
      @media print{.noprint{display:none}}
      </style></head><body>
      <div class="noprint"><button onclick="window.print()">🖨 Imprimir / Salvar PDF</button></div>
      <div class="cab">
        <div>${logoImg}<p class="emp">${esc(opt.empresaNome||'')}</p></div>
        <div style="text-align:right"><h1>${esc(opt.label)}</h1><p class="resumo">${esc(opt.resumo||('Registro '+(opt.indice+1)))} • tabela ${esc(opt.tabela)}</p><p class="emp">Documento do sistema antigo — consulta</p></div>
      </div>
      <table><tbody>${linhas}</tbody></table>
      <p class="rod">Emitido pelo DIGICOPY ERP em ${esc(new Date().toLocaleString('pt-BR'))} • dados migrados do sistema anterior (somente leitura)</p>
      <script>window.onload=function(){setTimeout(function(){window.print()},300)};</script>
      </body></html>`;
  }
  return { esc, rotuloCampo, ehTabelaNotinha, resumoRegistro, htmlDocRegistro };
})();
/* MIGPRINT_PURE_END */
window.MIGPRINT_PURE = MIGPRINT_PURE;

// Imprime um registro de qualquer tabela migrada
window.imprimirRegistroMigrado = function(nomeTabela, idx){
  const modulo = (db.modulosDinamicos||{})[nomeTabela];
  if(!modulo || !modulo.dados[idx]){ toast('Registro não encontrado','error'); return; }
  const sess = getSession();
  const emp = sess ? (db.empresas||[]).find(e=>e.id===sess.empresaId) : null;
  const html = MIGPRINT_PURE.htmlDocRegistro({
    tabela: nomeTabela,
    label: modulo.label || nomeTabela,
    row: modulo.dados[idx],
    indice: idx,
    resumo: MIGPRINT_PURE.resumoRegistro(modulo.dados[idx]),
    empresaNome: (emp && emp.nome) || (db.config && db.config.empresa && db.config.empresa.nome) || '',
    logo: window.DIGICOPY_LOGO || ''
  });
  const win = window.open('', '_blank');
  if(!win){ toast('Bloqueador de pop-up impediu a impressão','error'); return; }
  win.document.write(html); win.document.close();
};

// Botão "Imprimir" dentro do detalhe do registro migrado
const _mpOrigVisualizar = window.visualizarRegistroDinamico;
window.visualizarRegistroDinamico = function(nomeTabela, idx){
  if(_mpOrigVisualizar) _mpOrigVisualizar(nomeTabela, idx);
  const modal = document.getElementById('modal-root');
  if(!modal) return;
  const rodape = modal.querySelector('.p-4.border-t');
  if(rodape && !rodape.querySelector('[data-mig-print]')){
    const b = document.createElement('button');
    b.setAttribute('data-mig-print','1');
    b.className = 'h-10 px-5 rounded-xl bg-[#0a1e8a] text-white font-semibold text-[13px] flex items-center gap-2 mr-auto';
    b.innerHTML = '<i class="ph ph-printer"></i> Imprimir';
    b.onclick = function(){ imprimirRegistroMigrado(nomeTabela, idx); };
    rodape.prepend(b);
  }
};

// Atalho no topo: "Notinhas do sistema antigo" → abre direto a consulta de Vendas/OS em ordem do código maior p/ menor
window.abrirNotinhasAntigas = function(){
  window.__vosSortV = { col:'codigo', dir:'desc' };
  try{ localStorage.setItem('digicopy_sort_vendas', JSON.stringify(window.__vosSortV)); }catch(e){}
  navigateTo('vendas');
  setTimeout(function(){
    const s = document.getElementById('neo-search-vendas');
    if(s) s.value = '';
    if(typeof renderVendas==='function') renderVendas();
    if(typeof toast==='function') toast('Exibindo histórico de Vendas/OS (incluindo banco antigo em ordem do código maior p/ menor)','info');
  }, 120);
};

console.log('[DIGICOPY] Impressão de notinhas antigas v4.7.0 carregada');
})();
