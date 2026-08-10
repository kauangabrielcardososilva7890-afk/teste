// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.0.5 — Chamados (relatório do usuário)
// 1. Código global sequencial (não por cliente)
// 2. Contador color opcional com checkbox "não adquirido"
// 3. Seções destacadas com faixas visuais
// 4. PDF com áreas em branco para escrita manual (antes de finalizar)
// 5. Campos obrigatórios ao finalizar
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

// Código global sequencial para chamados
function proximoCodChamado(){
  const todos = (db.os||[]);
  let max = 0;
  todos.forEach(o => {
    const n = parseInt(String(o.numero||'').replace(/\D/g,''))||0;
    if(n > max) max = n;
  });
  return String(max + 1);
}

// Sobrescrever saveOS para usar código global
const _origSaveOS = window.saveOS;
if(typeof _origSaveOS === 'function'){
  window.saveOS = function(){
    const sess = getSession(); if(!sess) return;
    const id = window.modalContext?.id;
    const parqueId = document.getElementById('f-os-parque')?.value;
    const parque = parqueId ? db.parque.find(p=>p.id===parqueId) : null;
    const payload = {
      empresaId: sess.empresaId,
      clienteId: document.getElementById('f-os-cli')?.value,
      parqueId: parqueId||null,
      equipamentoId: parque?.equipamentoId||null,
      tipo: document.getElementById('f-os-tipo')?.value||'corretiva',
      prioridade: document.getElementById('f-os-prio')?.value||'media',
      tecnico: document.getElementById('f-os-tec')?.value||'',
      status: document.getElementById('f-os-status')?.value||'aberto',
      descricao: document.getElementById('f-os-desc')?.value?.trim()||'',
      contadorPB: parseInt(document.getElementById('f-os-cnt-pb')?.value)||0,
      contadorColor: parseInt(document.getElementById('f-os-cnt-color')?.value)||0,
      contadorColorNA: document.getElementById('f-os-cnt-color-na')?.checked||false,
      servicoExecutado: document.getElementById('f-os-servico')?.value?.trim()||'',
      motivoDefeito: document.getElementById('f-os-motivo')?.value?.trim()||''
    };
    if(!payload.clienteId) return toast('Selecione cliente','error');
    if(!payload.descricao) return toast('Descreva o problema','error');
    
    // Campos obrigatórios ao finalizar
    const finalizado = payload.status === 'concluido';
    if(finalizado){
      if(!payload.motivoDefeito) return toast('Preencha Motivo/Defeito','error');
      if(!payload.servicoExecutado) return toast('Preencha Serviço Executado','error');
      if(!payload.contadorPB && !payload.contadorColorNA) return toast('Informe o contador preto ou marque como não disponível','error');
    }
    
    if(id){
      const os = db.os.find(o=>o.id===id && o.empresaId===sess.empresaId);
      Object.assign(os, payload, {atualizadoPor: sess.usuarioId, atualizadoPorNome: sess.usuarioNome});
      if(finalizado && !os.dataFechamento) os.dataFechamento = new Date().toISOString();
      logAction('os','editar',id,`Editado OS ${os.numero}`);
    } else {
      const novo = {
        id: uid('os'),
        ...payload,
        numero: proximoCodChamado(),
        dataAbertura: new Date().toISOString(),
        dataFechamento: finalizado ? new Date().toISOString() : null,
        custoPecas: 0,
        tempoAtendimento: 0,
        criadoPor: sess.usuarioId,
        criadoPorNome: sess.usuarioNome,
        criadoEm: new Date().toISOString()
      };
      db.os.push(novo);
      logAction('os','criar',novo.id,`Criado OS ${novo.numero}`);
    }
    saveDB(); renderOs(); closeModal(); toast('Chamado salvo','success'); buildNav(); renderAuditoria();
  };
}

// Melhorar renderModalOS com seções destacadas e contador color
const _origRenderModalOS = window.renderModalOS;
if(typeof _origRenderModalOS === 'function'){
  window.renderModalOS = function(id){
    _origRenderModalOS.apply(this, arguments);
    // Adicionar campos extras após renderizar
    setTimeout(()=>{
      const body = document.getElementById('modal-body');
      if(!body) return;
      const o = id ? db.os.find(x=>x.id===id) : null;
      const concluido = o?.status === 'concluido';
      
      // Adicionar contador color após o contador preto
      const cntPB = body.querySelector('[id*="contador"], [id*="cnt-pb"]');
      const parent = cntPB?.closest('.grid') || body;
      
      // Verificar se impressora tem color
      const eqId = o?.equipamentoId || document.getElementById('f-os-parque')?.value;
      let temColor = false;
      if(eqId){
        const eq = db.equipamentos.find(e=>e.id===eqId);
        if(eq && (eq.tipo||'').toLowerCase().includes('color')) temColor = true;
      }
      
      // Adicionar checkbox "não adquirido" para contador color
      const colorHTML = `
        <div class="mt-3 p-3 rounded-xl bg-slate-50 border">
          <label class="text-[11px] font-bold uppercase text-slate-500">Contador Color${temColor?' (Obrigatório)':''}</label>
          <div class="flex items-center gap-3 mt-2">
            <input id="f-os-cnt-color" type="number" value="${o?.contadorColor||''}" placeholder="Contador color" class="flex-1 h-10 px-3 rounded-lg border text-[13px]">
            <label class="flex items-center gap-2 text-[12px]">
              <input type="checkbox" id="f-os-cnt-color-na" ${o?.contadorColorNA?'checked':''}> Não adquirido
            </label>
          </div>
        </div>
      `;
      
      // Seções destacadas
      const secoes = body.querySelectorAll('label, .neo-label');
      const cores = {
        'motivo': '#fef3c7', 'defeito': '#fef3c7',
        'serviço': '#dbeafe', 'executado': '#dbeafe',
        'observa': '#f3e8ff',
        'contador': '#ecfdf5',
        'item': '#fce7f3', 'peça': '#fce7f3'
      };
      secoes.forEach(label => {
        const txt = (label.textContent||'').toLowerCase();
        for(const [key, cor] of Object.entries(cores)){
          if(txt.includes(key)){
            const p = label.closest('.space-y-4, .rounded-xl, .neo-card, fieldset');
            if(p && !p.dataset.faixa){
              p.dataset.faixa = '1';
              p.style.borderLeft = '4px solid ' + (key==='motivo'||key==='defeito'?'#f59e0b':key==='serviço'||key==='executado'?'#3b82f6':key==='observa'?'#a855f7':key==='contador'?'#10b981':'#ec4899');
              p.style.background = cor;
              p.style.borderRadius = '8px';
              p.style.padding = '12px';
              p.style.marginBottom = '8px';
            }
            break;
          }
        }
      });
    }, 200);
  };
}

console.log('[DIGICOPY] patch_chamados v5.0.5 carregado');
})();


// PDF do chamado com áreas em branco para escrita manual
window.imprimirChamado = function(id){
  const sess = getSession(); if(!sess) return;
  const o = db.os.find(x=>x.id===id && x.empresaId===sess.empresaId);
  if(!o) return toast('Chamado não encontrado','error');
  const cli = db.clientes.find(c=>c.id===o.clienteId);
  const eq = db.equipamentos.find(e=>e.id===o.equipamentoId);
  const loja = (db.config&&db.config.loja)||{};
  const finalizado = o.status === 'concluido';
  
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Chamado ${o.numero}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:20px;font-size:12px;color:#333}
    .header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0a1e8a;padding-bottom:10px;margin-bottom:15px}
    .header h1{font-size:18px;color:#0a1e8a;margin:0}
    .header .loja{text-align:right;font-size:11px}
    .section{border:1px solid #ddd;border-radius:8px;padding:12px;margin-bottom:12px}
    .section-title{font-size:11px;font-weight:bold;text-transform:uppercase;color:#0a1e8a;margin-bottom:8px;border-bottom:1px solid #eee;padding-bottom:4px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .field{margin-bottom:6px}
    .field label{font-size:10px;color:#666;display:block}
    .field .value{font-weight:bold;font-size:12px}
    .blank-line{border-bottom:1px dotted #999;min-height:20px;margin:4px 0}
    .signature{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:30px}
    .signature-line{border-top:1px solid #333;padding-top:4px;text-align:center;font-size:10px}
    @media print{body{padding:10px}}
  </style></head><body>
  <div class="header">
    <div><h1>CHAMADO ${o.numero}</h1><div style="font-size:11px;color:#666">${o.tipo} • ${o.prioridade} • ${o.status}</div></div>
    <div class="loja"><div style="font-weight:bold">${esc(loja.fantasia||loja.nome||'DIGICOPY')}</div><div>${esc(loja.cnpj||'')}</div><div>${esc(loja.telefone||'')}</div></div>
  </div>
  
  <div class="section">
    <div class="section-title">CLIENTE</div>
    <div class="grid">
      <div class="field"><label>Cliente</label><div class="value">${esc(cli?.nome||'-')}</div></div>
      <div class="field"><label>Documento</label><div class="value">${esc(cli?.documento||'-')}</div></div>
      <div class="field"><label>Telefone</label><div class="value">${esc(cli?.telefone||'-')}</div></div>
      <div class="field"><label>Endereço</label><div class="value">${esc(cli?.endereco||'-')}</div></div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">IMPRESSORA</div>
    <div class="grid">
      <div class="field"><label>Modelo</label><div class="value">${esc(eq?.modelo||'-')}</div></div>
      <div class="field"><label>Serial</label><div class="value">${esc(eq?.serie||'-')}</div></div>
      <div class="field"><label>Patrimônio</label><div class="value">${esc(eq?.patrimonio||'-')}</div></div>
      <div class="field"><label>Local</label><div class="value">${esc(o.local||'-')}</div></div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">MOTIVO / DEFEITO</div>
    ${finalizado ? '<div style="font-size:12px">'+esc(o.motivoDefeito||o.descricao||'-')+'</div>' : '<div class="blank-line"></div><div class="blank-line"></div><div class="blank-line"></div>'}
  </div>
  
  <div class="section">
    <div class="section-title">SERVIÇO EXECUTADO</div>
    ${finalizado ? '<div style="font-size:12px">'+esc(o.servicoExecutado||'-')+'</div>' : '<div class="blank-line"></div><div class="blank-line"></div><div class="blank-line"></div>'}
  </div>
  
  <div class="section">
    <div class="section-title">CONTADORES</div>
    <div class="grid">
      <div class="field"><label>Contador Preto</label><div class="value">${o.contadorPB||'_____'}</div></div>
      <div class="field"><label>Contador Color</label><div class="value">${o.contadorColorNA?'N/A':(o.contadorColor||'_____')}</div></div>
    </div>
  </div>
  
  ${finalizado ? '' : `
  <div class="section">
    <div class="section-title">DATA DE EXECUÇÃO</div>
    <div class="blank-line"></div>
  </div>
  <div class="section">
    <div class="section-title">PRODUTOS / PEÇAS UTILIZADAS</div>
    <div class="blank-line"></div><div class="blank-line"></div><div class="blank-line"></div>
  </div>`}
  
  <div class="signature">
    <div><div class="signature-line">Técnico</div></div>
    <div><div class="signature-line">Cliente</div></div>
  </div>
  
  <div style="margin-top:15px;font-size:9px;color:#999;text-align:center">
    ${esc(loja.fantasia||'DIGICOPY')} • ${esc(loja.cnpj||'')} • ${esc(loja.telefone||'')} • ${esc(loja.email||'')}
  </div>
  </body></html>`;
  
  const win = window.open('', '_blank');
  if(win){
    win.document.write(html);
    win.document.close();
    setTimeout(()=>win.print(), 500);
  }
};
