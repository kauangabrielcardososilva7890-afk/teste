// DIGICOPY ERP — Pix (QR Code estático padrão Banco Central + copia e cola) — v4.6.0
// O QR sai com o VALOR EXATO da venda: o cliente só escaneia e confirma, sem digitar nada.
// Carregado por ÚLTIMO em index.html (depois dos demais patches).
(function(){
'use strict';

/* PIX_PURE_START */
// Núcleo puro e testável (sem dependência de navegador): monta o "copia e cola"
// no padrão BR Code/EMV do Banco Central e calcula o CRC16 de conferência.
const PIX_PURE = (function(){
  // Campo TLV do padrão EMV: ID (2 dígitos) + tamanho (2 dígitos) + valor
  function emv(id, valor){
    const v = String(valor);
    return id + String(v.length).padStart(2,'0') + v;
  }
  // CRC16-CCITT (variante FALSE: polinômio 0x1021, início 0xFFFF, sem reflexão)
  // — a única variante aceita pelo Banco Central no final do payload Pix.
  function crc16(str){
    let crc = 0xFFFF;
    for(let i=0;i<str.length;i++){
      crc ^= (str.charCodeAt(i) & 0xFF) << 8;
      for(let j=0;j<8;j++){
        crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
        crc &= 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4,'0');
  }
  // Nome/cidade: o padrão aceita letras, números e espaço. Remove acentos e símbolos.
  function limpar(txt, max){
    return String(txt||'')
      .normalize('NFD').replace(/[̀-ͯ]/g,'')
      .replace(/[^0-9A-Za-z ]/g,' ')
      .replace(/ {2,}/g,' ')
      .trim()
      .slice(0, max);
  }
  // txid (referência que aparece no extrato para você achar o pagamento): só letras/números, até 25.
  function txidLimpo(txt){
    const t = String(txt||'').replace(/[^0-9A-Za-z]/g,'').slice(0,25);
    return t || '***';
  }
  // Monta o payload Pix completo (copia e cola). valor>0 inclui o valor exato no QR.
  function montar(o){
    o = o||{};
    const chave = String(o.chave||'').trim();
    if(!chave) throw new Error('Chave Pix não informada');
    const nome = limpar(o.nome, 25) || 'RECEBEDOR';
    const cidade = limpar(o.cidade, 15) || 'BRASIL';
    const valor = Number(o.valor)||0;
    const txid = txidLimpo(o.txid);
    const gui = emv('00','br.gov.bcb.pix') + emv('01', chave);
    let p = emv('00','01')
      + emv('26', gui)
      + emv('52','0000')   // categoria não informada
      + emv('53','986');   // moeda: Real
    if(valor > 0) p += emv('54', valor.toFixed(2));
    p += emv('58','BR')
      + emv('59', nome)
      + emv('60', cidade)
      + emv('62', emv('05', txid))
      + '6304';
    return p + crc16(p);
  }
  // Detecta o tipo da chave só para mostrar na tela de configuração
  function tipoChave(chave){
    const c = String(chave||'').trim();
    if(!c) return '—';
    if(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c)) return 'Chave aleatória';
    if(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c)) return 'E-mail';
    if(/^\+55\d{10,11}$/.test(c)) return 'Telefone (+55 DDD número)';
    const d = c.replace(/\D/g,'');
    if(/^\d{11}$/.test(c) && d.length===11) return 'CPF';
    if(/^\d{14}$/.test(c) && d.length===14) return 'CNPJ';
    return 'Personalizada (verifique se está igual à do banco)';
  }
  // URL da imagem do QR (serviço público de geração de imagem; recebe só o próprio
  // código Pix — o mesmo texto que vai impresso na notinha). Sem internet a imagem
  // some, mas o código copia e cola continua funcionando.
  function qrUrl(payload, size){
    const s = Math.max(120, Math.min(540, size||220));
    return 'https://api.qrserver.com/v1/create-qr-code/?size=' + s + 'x' + s + '&margin=6&data=' + encodeURIComponent(payload);
  }
  return { emv:emv, crc16:crc16, limpar:limpar, txidLimpo:txidLimpo, montar:montar, tipoChave:tipoChave, qrUrl:qrUrl };
})();
/* PIX_PURE_END */
window.PIX_PURE = PIX_PURE;

// ═══════════════════════════════════════════════════════════════════════════
// Configuração salva no banco (sincroniza entre os PCs pela nuvem)
// ═══════════════════════════════════════════════════════════════════════════
function pixCfg(){
  try{
    if(typeof db==='undefined' || !db) return {};
    db.config = db.config || {};
    db.config.pix = db.config.pix || { chave:'', nome:'', cidade:'' };
    return db.config.pix;
  }catch(e){ return {}; }
}
function pixPronto(){ return !!String((pixCfg().chave)||'').trim(); }
function pixTxidDaVenda(v){
  // Ex.: venda "16001" → txid "VD16001" (aparece no seu extrato do banco)
  const base = String((v && v.numero) || 'VENDA').replace(/[^0-9A-Za-z]/g,'').toUpperCase();
  const comLetra = /[A-Z]/.test(base) ? base : ('VD'+base);
  return (comLetra || 'VENDA').slice(0,25);
}
function pixPayloadDaVenda(v){
  const c = pixCfg();
  const empresaNome = (db.config && db.config.empresa && db.config.empresa.nome) || '';
  return PIX_PURE.montar({
    chave: c.chave,
    nome: c.nome || empresaNome,
    cidade: c.cidade,
    valor: (v && v.total) || 0,
    txid: pixTxidDaVenda(v)
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 1) FATURAMENTO — ao escolher "Pix", mostra QR com o valor exato + copia e cola
// ═══════════════════════════════════════════════════════════════════════════
window.pixRenderPainelFaturamento = function(){
  const box = document.getElementById('vos-vista-box');
  if(!box) return;
  const sess = getSession(); if(!sess) return;
  const v = db.vendas.find(x=>x.id===window.__vosFatVendaId && x.empresaId===sess.empresaId);
  if(!v) return;
  box.className = 'rounded-[14px] border p-4 bg-sky-50/60 border-sky-300';
  if(!pixPronto()){
    box.innerHTML = `
      <div class="text-[13px] text-amber-900">
        <p class="font-bold"><i class="ph ph-warning"></i> Chave Pix ainda não configurada</p>
        <p class="mt-1">Cadastre a chave em <b>Configurações → Pix — QR Code de cobrança</b> e o QR aparecerá aqui automaticamente.</p>
        <button type="button" onclick="closeModal(); navigateTo('config')" class="mt-3 h-[40px] px-4 rounded-xl bg-amber-600 text-white font-bold text-[12px]">Configurar Pix agora</button>
      </div>`;
    return;
  }
  const payload = pixPayloadDaVenda(v);
  window.__pixUltimoPayload = payload;
  const c = pixCfg();
  box.innerHTML = `
    <div class="flex flex-col md:flex-row gap-4 items-center">
      <div class="shrink-0 rounded-xl bg-white border p-2 shadow-sm">
        <img src="${PIX_PURE.qrUrl(payload, 220)}" alt="QR Code Pix" width="150" height="150" class="block w-[150px] h-[150px]"
          onerror="this.outerHTML='<div class=&quot;w-[150px] h-[150px] grid place-items-center text-center text-[11px] text-slate-500&quot;>Sem internet para gerar a imagem.<br>Use o código<br>copia e cola abaixo.</div>'">
      </div>
      <div class="flex-1 min-w-0 w-full">
        <p class="font-bold text-[15px] text-sky-900"><i class="ph ph-qr-code"></i> Pague com Pix — <span class="text-[18px]">${fmtMoney(v.total||0)}</span></p>
        <p class="text-[12px] text-slate-600 mt-1">O cliente escaneia com o app do banco e o valor já vem preenchido. Chave: <b>${escapeHtml(c.chave)}</b></p>
        <div class="mt-2 flex gap-2">
          <input id="pix-copia-cola" readonly value="${payload}" class="flex-1 min-w-0 h-[40px] px-3 rounded-xl border bg-white text-[11px] font-mono" onclick="this.select()">
          <button type="button" onclick="pixCopiarCodigo()" class="h-[40px] px-4 rounded-xl bg-[#0a1e8a] text-white font-bold text-[12px] shrink-0"><i class="ph ph-copy"></i> Copiar</button>
        </div>
        <p class="text-[11px] text-slate-500 mt-2"><i class="ph ph-info"></i> Confira o recebimento no seu banco e clique em <b>Concluir faturamento</b>. (Baixa automática direto do banco: em desenvolvimento.)</p>
      </div>
    </div>`;
};
window.pixCopiarCodigo = function(){
  const payload = window.__pixUltimoPayload || (document.getElementById('pix-copia-cola')||{}).value || '';
  if(!payload) return;
  const conclui = ()=> toast('Código Pix copiado! Cole no app do banco.','success');
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(payload).then(conclui).catch(()=>{ pixCopiarLegado(payload); conclui(); });
  } else { pixCopiarLegado(payload); conclui(); }
};
function pixCopiarLegado(txt){
  const inp = document.getElementById('pix-copia-cola');
  if(inp){ inp.focus(); inp.select(); try{ document.execCommand('copy'); }catch(e){} }
}
const _pixOrigEscolherForma = window.vosEscolherForma;
window.vosEscolherForma = function(fx){
  // garante que a caixa à vista volte ao estado simples ao trocar de forma
  const box = document.getElementById('vos-vista-box');
  if(box && !document.getElementById('vos-vista-msg')){
    box.className = 'rounded-[14px] border p-4 bg-emerald-50/50 border-emerald-200';
    box.innerHTML = '<p class="text-[13px] text-emerald-900" id="vos-vista-msg"></p>';
  }
  if(_pixOrigEscolherForma) _pixOrigEscolherForma(fx);
  if(fx==='Pix') pixRenderPainelFaturamento();
};

// ═══════════════════════════════════════════════════════════════════════════
// 2) NOTINHA — venda faturada no Pix sai com QR + copia e cola impressos
// ═══════════════════════════════════════════════════════════════════════════
// Link da página de pagamento (funciona quando a notinha vira PDF: o cliente
// toca no link, abre no celular e escaneia o QR ou copia o código)
window.pixPagamentoUrl = function(payload){
  let base = 'pix_pagar.html';
  try{ base = new URL('pix_pagar.html', location.href).href; }catch(e){}
  return base + '?c=' + encodeURIComponent(payload);
};
function pixBlocoNotinha(v){
  if(!v || String(v.formaPagamento||'')!=='Pix' || !pixPronto()) return '';
  const c = pixCfg();
  let payload = '';
  try{ payload = pixPayloadDaVenda(v); }catch(e){ return ''; }
  const link = pixPagamentoUrl(payload);
  return `
  <div style="margin-top:3mm;border:1px solid #9db3e8;border-radius:2mm;padding:2.5mm 3mm;display:flex;gap:4mm;align-items:center;page-break-inside:avoid">
    <a href="${link}" target="_blank" rel="noopener"><img src="${PIX_PURE.qrUrl(payload, 200)}" width="82" height="82" style="width:26mm;height:26mm" alt="QR Pix"></a>
    <div style="flex:1;min-width:0">
      <p style="margin:0;font-size:11.5px;font-weight:800;color:#0a1e8a">PAGUE COM PIX — ${fmtMoney(v.total||0)}</p>
      <p style="margin:1mm 0 0;font-size:9px">Chave: <b>${escapeHtml(c.chave)}</b>${c.nome?(' • '+escapeHtml(c.nome)):''} • Aponte a câmera do celular</p>
      <p style="margin:1mm 0 0;font-size:8.5px"><b>Recebeu este documento em PDF?</b> <a href="${link}" target="_blank" rel="noopener" style="color:#0a1e8a;text-decoration:underline">Toque aqui para abrir a página de pagamento</a></p>
      <p style="margin:1mm 0 0;font-size:7.5px;color:#555">Pix copia e cola:</p>
      <p style="margin:0;font-size:6.5px;color:#555;word-break:break-all;line-height:1.35">${payload}</p>
    </div>
  </div>`;
}
const _pixOrigGerarNotinha = window.vosGerarHtmlNotinha;
window.vosGerarHtmlNotinha = function(vendaId, opts){
  let html = _pixOrigGerarNotinha ? _pixOrigGerarNotinha(vendaId, opts) : null;
  if(!html) return html;
  try{
    const v = db.vendas.find(x=>x.id===vendaId);
    const bloco = pixBlocoNotinha(v);
    if(bloco) html = html.replace('<p class="audit">', bloco + '<p class="audit">');
  }catch(e){}
  return html;
};

// ═══════════════════════════════════════════════════════════════════════════
// 3) CONFIGURAÇÕES — cartão "Pix — QR Code de cobrança"
// ═══════════════════════════════════════════════════════════════════════════
function pixRenderCartaoConfig(){
  const grid = document.querySelector('#view-config .grid');
  if(!grid || document.getElementById('pix-cfg-card')) return;
  const c = pixCfg();
  const card = document.createElement('div');
  card.className = 'rounded-[16px] bg-white border p-6';
  card.id = 'pix-cfg-card';
  card.innerHTML = `
    <h4 class="font-bold text-[14px]"><i class="ph ph-qr-code"></i> Pix — QR Code de cobrança</h4>
    <p class="mt-1 text-[11.5px] text-slate-500 leading-snug">Aparece no faturamento e na notinha quando a forma é <b>Pix</b>. O código já sai com o <b>valor exato</b> da venda.</p>
    <div class="mt-4 space-y-3 text-[13px]">
      <div>
        <label class="text-[11px] uppercase font-bold text-slate-500">Chave Pix</label>
        <input id="cfg-pix-chave" value="${escapeHtml(c.chave||'')}" placeholder="CNPJ, CPF, +55DDDtelefone, e-mail ou aleatória" class="mt-1 w-full h-11 px-3 rounded-xl border bg-slate-50">
        <p id="cfg-pix-tipo" class="mt-1 text-[11px] text-slate-500">Tipo detectado: ${PIX_PURE.tipoChave(c.chave)}</p>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-[11px] uppercase font-bold text-slate-500">Beneficiário (máx 25)</label>
          <input id="cfg-pix-nome" value="${escapeHtml(c.nome||'')}" maxlength="25" placeholder="Ex.: DIGICOPY" class="mt-1 w-full h-11 px-3 rounded-xl border bg-slate-50">
        </div>
        <div>
          <label class="text-[11px] uppercase font-bold text-slate-500">Cidade (máx 15)</label>
          <input id="cfg-pix-cidade" value="${escapeHtml(c.cidade||'')}" maxlength="15" placeholder="Ex.: JANAUBA" class="mt-1 w-full h-11 px-3 rounded-xl border bg-slate-50">
        </div>
      </div>
      <div class="flex gap-2">
        <button onclick="pixSalvarConfig()" class="flex-1 h-11 rounded-xl bg-[#0a1e8a] text-white font-semibold">Salvar Pix</button>
        <button onclick="pixPreviewConfig()" class="h-11 px-4 rounded-xl border bg-white font-semibold text-[12px]">Testar QR</button>
      </div>
      <div id="cfg-pix-preview" class="hidden mt-1 text-center border rounded-xl p-3 bg-slate-50"></div>
      <p class="text-[10.5px] text-slate-400 leading-snug">A imagem do QR é gerada pela internet a partir do próprio código Pix; sem internet, o código "copia e cola" continua valendo normalmente.</p>
    </div>`;
  grid.appendChild(card);
  const ch = document.getElementById('cfg-pix-chave');
  if(ch) ch.addEventListener('input', function(){
    const t = document.getElementById('cfg-pix-tipo');
    if(t) t.innerText = 'Tipo detectado: ' + PIX_PURE.tipoChave(ch.value);
  });
}
window.pixLerCamposConfig = function(){
  return {
    chave: (document.getElementById('cfg-pix-chave')||{}).value || '',
    nome: (document.getElementById('cfg-pix-nome')||{}).value || '',
    cidade: (document.getElementById('cfg-pix-cidade')||{}).value || ''
  };
};
window.pixSalvarConfig = function(){
  const campos = pixLerCamposConfig();
  const c = pixCfg();
  c.chave = campos.chave.trim();
  c.nome = campos.nome.trim();
  c.cidade = campos.cidade.trim();
  saveDB();
  if(!c.chave){ toast('Chave Pix apagada — o QR não será mais exibido','info'); return; }
  if(!c.cidade) toast('Pix salvo! Dica: preencha a cidade (alguns bancos pedem)','success');
  else toast('Pix salvo! O QR já aparece no faturamento e na notinha','success');
};
window.pixPreviewConfig = function(){
  const prev = document.getElementById('cfg-pix-preview');
  if(!prev) return;
  const campos = pixLerCamposConfig();
  if(!campos.chave.trim()){ prev.classList.remove('hidden'); prev.innerHTML = '<p class="text-[12px] text-amber-700 font-bold">Preencha a chave Pix para testar.</p>'; return; }
  let payload = '';
  try{
    payload = PIX_PURE.montar({ chave:campos.chave.trim(), nome:campos.nome.trim(), cidade:campos.cidade.trim(), valor:1.00, txid:'TESTE1' });
  }catch(e){ prev.classList.remove('hidden'); prev.innerHTML = '<p class="text-[12px] text-red-600 font-bold">'+escapeHtml(e.message)+'</p>'; return; }
  prev.classList.remove('hidden');
  prev.innerHTML = `
    <p class="text-[11px] font-bold text-slate-600 mb-2">Teste com R$ 1,00 — escaneie com o app do seu banco</p>
    <img src="${PIX_PURE.qrUrl(payload, 200)}" width="150" height="150" class="mx-auto block" alt="QR Pix teste"
      onerror="this.outerHTML='<p class=&quot;text-[11px] text-slate-500&quot;>Sem internet para gerar a imagem — o código abaixo já funciona.</p>'">
    <p class="mt-2 text-[10px] font-mono break-all text-left bg-white border rounded-lg p-2">${payload}</p>`;
};
const _pixOrigRenderConfig = window.renderConfig;
window.renderConfig = function(){
  if(_pixOrigRenderConfig) _pixOrigRenderConfig.apply(this, arguments);
  pixRenderCartaoConfig();
};

console.log('[DIGICOPY] Pix v4.6.0 carregado — QR estático padrão Banco Central (valor exato + copia e cola)');
})();
