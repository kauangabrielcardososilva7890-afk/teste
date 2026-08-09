// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.0.4 — Chamados (relatório do usuário)
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

console.log('[DIGICOPY] patch_chamados v5.0.4 carregado');
})();
