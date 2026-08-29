// ═══════════════════════════════════════════════════════════════════════════
// v5.22.0 — preparação NF-e (sem emitir ainda)
// • Card em Configurações: IE, regime, série, ambiente
// • Certificado A1 fica só neste PC (%APPDATA%\digicopy-erp\certs)
// • Senha do .pfx NÃO é salva nem vai para a nuvem
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v==null?'':v).trim(); }
function esc(v){ if(typeof escapeHtml==='function') return escapeHtml(v); return txt(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function toastMsg(m,t){ if(typeof toast==='function') toast(m,t||'info'); }
function fiscalAtual(){
  const f=(typeof db!=='undefined' && db.config && db.config.fiscal) || {};
  return {
    ie: txt(f.ie),
    crt: txt(f.crt)||'1',
    serie: txt(f.serie)||'1',
    ambiente: txt(f.ambiente)||'2',
    uf: txt(f.uf)||'MG'
  };
}
function salvarFiscal(dados){
  if(typeof db==='undefined') return dados;
  db.config=db.config||{};
  db.config.fiscal={...(db.config.fiscal||{}),...dados,atualizadoEm:new Date().toISOString()};
  if(typeof saveDB==='function') saveDB();
  return db.config.fiscal;
}

window.NFE_CONFIG_PURE={fiscalAtual,salvarFiscal};

if(typeof document==='undefined') return;

function certApi(){ return window.nfeCertAPI; }

async function atualizarStatusCert(){
  const el=document.getElementById('nfe-cert-status');
  if(!el) return;
  const api=certApi();
  if(!api){ el.textContent='Abra o programinha (.exe) para carregar o certificado A1 neste computador.'; return; }
  try{
    const st=await api.status();
    if(st&&st.installed){
      const dt=st.updatedAt?new Date(st.updatedAt).toLocaleString('pt-BR'):'';
      el.textContent='A1 instalado neste PC'+(dt?' • '+dt:'')+'. A senha será pedida só na hora de emitir.';
    }else{
      el.textContent='Nenhum certificado A1 neste computador.';
    }
  }catch(e){
    el.textContent='Não foi possível ler o certificado.';
  }
}

function renderNfeCard(){
  const grid=document.querySelector('#view-config .grid')||document.getElementById('view-config');
  if(!grid||document.getElementById('nfe-config-card')) return;
  const f=fiscalAtual();
  const card=document.createElement('div');
  card.id='nfe-config-card';
  card.className='rounded-[16px] bg-white border p-6 lg:col-span-3';
  card.innerHTML=`<h4 class="font-bold text-[15px]"><i class="ph ph-file-text"></i> NF-e — preparação</h4>
<p class="text-[12px] text-slate-500 mt-1">Ainda não emite nota. Aqui você deixa o certificado e os dados fiscais prontos. O arquivo A1 fica só neste PC, não vai para a nuvem.</p>
<div class="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
<label class="text-[11px] font-bold uppercase text-slate-500">Inscrição Estadual<input id="nfe-ie" value="${esc(f.ie)}" class="mt-1 w-full h-10 px-3 rounded-xl border"></label>
<label class="text-[11px] font-bold uppercase text-slate-500">Regime<select id="nfe-crt" class="mt-1 w-full h-10 px-3 rounded-xl border">
<option value="1" ${f.crt==='1'?'selected':''}>1 — Simples Nacional</option>
<option value="2" ${f.crt==='2'?'selected':''}>2 — Simples excesso</option>
<option value="3" ${f.crt==='3'?'selected':''}>3 — Regime normal</option>
</select></label>
<label class="text-[11px] font-bold uppercase text-slate-500">Série NF-e<input id="nfe-serie" value="${esc(f.serie)}" class="mt-1 w-full h-10 px-3 rounded-xl border"></label>
<label class="text-[11px] font-bold uppercase text-slate-500">Ambiente<select id="nfe-amb" class="mt-1 w-full h-10 px-3 rounded-xl border">
<option value="2" ${f.ambiente==='2'?'selected':''}>Homologação (teste)</option>
<option value="1" ${f.ambiente==='1'?'selected':''}>Produção</option>
</select></label>
</div>
<div class="mt-4 rounded-xl border bg-slate-50 p-3">
<p id="nfe-cert-status" class="text-[12px] text-slate-600">Verificando certificado...</p>
<div class="mt-2 flex flex-wrap gap-2">
<button type="button" id="nfe-cert-import" class="h-10 px-4 rounded-xl bg-[#0a1e8a] text-white font-bold text-[12px]">Carregar A1 (.pfx)</button>
<button type="button" id="nfe-cert-remove" class="h-10 px-4 rounded-xl bg-white border text-[12px] font-bold">Remover A1 deste PC</button>
</div>
</div>
<div class="mt-4"><button type="button" id="nfe-salvar" class="neo-btn primary"><i class="ph ph-floppy-disk"></i>Salvar dados fiscais</button></div>`;
  grid.appendChild(card);
  document.getElementById('nfe-salvar').onclick=function(){
    salvarFiscal({
      ie:txt(document.getElementById('nfe-ie').value),
      crt:txt(document.getElementById('nfe-crt').value)||'1',
      serie:txt(document.getElementById('nfe-serie').value)||'1',
      ambiente:txt(document.getElementById('nfe-amb').value)||'2',
      uf:'MG'
    });
    toastMsg('Dados fiscais salvos. Emissão ainda não está ligada.','success');
  };
  document.getElementById('nfe-cert-import').onclick=async function(){
    const api=certApi();
    if(!api){ toastMsg('Abra o .exe para carregar o certificado.','error'); return; }
    const r=await api.importar();
    if(r&&r.canceled) return;
    if(r&&r.ok){ toastMsg('Certificado A1 ficou neste computador.','success'); }
    else toastMsg((r&&r.error)||'Não foi possível carregar o A1.','error');
    atualizarStatusCert();
  };
  document.getElementById('nfe-cert-remove').onclick=async function(){
    const api=certApi();
    if(!api) return;
    const ok=typeof window.confirmSistema==='function'?await window.confirmSistema('Remover o certificado A1 só deste computador?','Remover A1'):true;
    if(!ok) return;
    const r=await api.remover();
    if(r&&r.ok) toastMsg('Certificado removido deste PC.','success');
    atualizarStatusCert();
  };
  atualizarStatusCert();
}

const oldRenderConfig=window.renderConfig;
if(typeof oldRenderConfig==='function'&&!oldRenderConfig.__v5220){
  window.renderConfig=function(){
    const r=oldRenderConfig.apply(this,arguments);
    setTimeout(renderNfeCard,200);
    setTimeout(renderNfeCard,500);
    return r;
  };
  window.renderConfig.__v5220=true;
}
setTimeout(renderNfeCard,800);
console.log('[DIGICOPY] v5.22.0 preparação NF-e');
})();
