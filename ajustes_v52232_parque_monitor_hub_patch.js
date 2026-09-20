// ═══════════════════════════════════════════════════════════════════════════
// v5.24.34 — DOIS PEDIDOS NUM SÓ LUGAR (Parque de Impressoras):
//
// FASE 1 DO MONITOR (tópico A, 'ue faz'): em cada impressora do Parque, botão
//   [Ler status (rede)] que pergunta o IP UMA VEZ (fica gravado no cadastro do
//   equipamento, sincroniza na nuvem como parte do registro) e lê a impressora
//   de verdade via SNMP — contador, toner e ERROS (sem papel, atolou, tampa,
//   toner) já em bom português. Só roda no .exe e na MESMA rede da impressora;
//   fora disso, avisa limpo em vez de quebrar.
//
// P8 — HUB DA IMPRESSORA (relatório grande): botão [Histórico] abre uma sala
//   só dela: ficha, contrato atual (botão pula pro contrato), últimas leituras
//   e chamados. Tudo do banco local que já existe — sem custar nuvem.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function esc(v){ return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function tn(m,t){ if(typeof toast==='function') toast(m,t||'info'); }
function dataBr(d){ try{ var x=new Date(d||''); return isNaN(x)?'—':x.toLocaleDateString('pt-BR'); }catch(e){ return '—'; } }
function moneyBr(v){ try{ return (Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }catch(e){ return 'R$ 0,00'; } }

function eqById(id){ return ((typeof db!=='undefined'&&db.equipamentos)||[]).find(e=>e.id===id)||null; }
function parqueById(id){ return ((typeof db!=='undefined'&&db.parque)||[]).find(p=>p.id===id)||null; }
function cliNome(id){ var c=((typeof db!=='undefined'&&db.clientes)||[]).find(x=>x.id===id); return c?String(c.nome||c.fantasia||''):''; }
function contratoDoParque(p){
  var cs=(typeof db!=='undefined'&&db.contratos)||[];
  if(!p) return null;
  return cs.find(c=>c.id===p.contratoId)||null;
}

// ── FASE 1: leitura SNMP do equipamento ───────────────────────────────────
async function lerStatusRede(parqueId){
  var p=parqueById(parqueId); var eq=p?eqById(p.equipamentoId):null;
  if(!p||!eq){ tn('Impressora não encontrada.','error'); return; }
  var api=window.prtAPI;
  if(!api||typeof api.lerStatus!=='function'){
    tn('A leitura direta da impressora só roda no programinha (.exe) — navegador e celular não falam a língua dela (SNMP).','info');
    return;
  }
  var ip=String(eq.ip||eq.enderecoIp||'').trim();
  if(!ip){
    var digitado=(typeof prompt==='function')?prompt('Qual o IP desta impressora na rede? (ex.: 192.168.0.50 — fica gravado no cadastro dela)',''):null;
    if(!digitado) return;
    digitado=digitado.trim();
    if(!/^\d{1,3}(\.\d{1,3}){3}$/.test(digitado)){ tn('IP não parece certo. Exemplo: 192.168.0.50','error'); return; }
    eq.ip=digitado;
    try{ if(typeof saveDB==='function') saveDB(); }catch(e){}
    ip=digitado;
    tn('IP gravado no cadastro da impressora.','success');
  }
  var selo=document.getElementById('status-mon-'+parqueId);
  if(selo){ selo.style.background='#e2e8f0'; selo.style.color='#334155'; selo.textContent='Lendo a impressora...'; }
  try{
    var r=await Promise.resolve(api.lerStatus(ip));
    if(!r){ if(selo){ selo.textContent='Sem resposta nenhuma.'; } return; }
    if(!r.ok){
      if(selo){ selo.style.background='#fef3c7'; selo.style.color='#92400e'; selo.textContent= r.offline? 'Desligada ou IP diferente ('+esc(r.erro||'')+')' : ('Leitura falhou: '+esc(r.erro||'?')); }
      return;
    }
    var erros=(r.erros||[]);
    if(selo){
      if(erros.length){ selo.style.background='#fee2e2'; selo.style.color='#991b1b'; selo.textContent='⚠ '+erros.join(' • '); }
      else{ selo.style.background='#dcfce7'; selo.style.color='#166534'; selo.textContent='Em dia'+(r.status?(' • '+r.status):'')+(r.tonerPct!=null?(' • toner ~'+r.tonerPct+'%'):'')+(r.contador!=null?(' • '+Number(r.contador).toLocaleString('pt-BR')+' páginas'):''); }
    }
    eq.snmp=eq.snmp||{};
    eq.snmp.ultima={ quando:r.lidoEm||Date.now(), status:r.status||'', erros:erros, tonerPct:(r.tonerPct==null?null:r.tonerPct), contador:(r.contador==null?null:r.contador) };
    try{ if(typeof saveDB==='function') saveDB(); }catch(e){}
  }catch(e){
    if(selo){ selo.style.background='#fef3c7'; selo.style.color='#92400e'; selo.textContent='Não consegui ler agora.'; }
  }
}
window.lerStatusImpressoraRede=lerStatusRede;

// ── P8: hub da impressora ─────────────────────────────────────────────────
function fecharHub(){ var d=document.getElementById('hub-impressora-modal'); if(d) d.remove(); }

function abrirHubImpressora(parqueId){
  var p=parqueById(parqueId); var eq=p?eqById(p.equipamentoId):null;
  if(!p||!eq){ tn('Impressora não encontrada.','error'); return; }
  var c=contratoDoParque(p);
  var leits=((typeof db!=='undefined'&&db.leituras)||[]).filter(l=>l.parqueId===p.id||l.equipamentoId===eq.id).sort((a,b)=>new Date(b.dataLeitura||b.criadoEm||0)-new Date(a.dataLeitura||a.criadoEm||0));
  var cham=((typeof db!=='undefined'&&db.os)||((typeof db!=='undefined'&&db.chamados)||[])).filter(o=>o.equipamentoId===eq.id||o.parqueId===p.id).sort((a,b)=>new Date(b.abertura||b.criadoEm||0)-new Date(a.abertura||a.criadoEm||0));
  var leitHtml=leits.slice(0,6).map(function(l){
    return '<div style="display:flex;justify-content:space-between;padding:8px 10px;border:1px solid #e2e8f0;border-radius:10px;margin-top:6px;">'+
      '<span style="font-weight:700;font-size:12px;color:#0a1e8a">'+(esc(l.numero||l.codigoAntigo||'leitura'))+'</span>'+
      '<span style="font-size:11.5px;color:#475569">'+esc(dataBr(l.dataLeitura||l.criadoEm))+' • PB '+Number(l.contadorPB||0).toLocaleString('pt-BR')+(l.contadorCor?(' • COR '+Number(l.contadorCor).toLocaleString('pt-BR')):'')+'</span></div>';
  }).join('')||'<p style="font-size:11.5px;color:#94a3b8;font-style:italic;margin:6px 0 0">Sem leituras ainda.</p>';
  var chamHtml=cham.slice(0,6).map(function(o){
    return '<div style="display:flex;justify-content:space-between;padding:8px 10px;border:1px solid #e2e8f0;border-radius:10px;margin-top:6px;">'+
      '<span style="font-weight:700;font-size:12px;color:#0a1e8a">'+(esc(o.numero||o.codigoAntigo||'chamado'))+'</span>'+
      '<span style="font-size:11.5px;color:#475569">'+esc(dataBr(o.abertura||o.criadoEm))+' • '+esc(o.status||'aberto')+(o.motivo?(' — '+esc(String(o.motivo).slice(0,40))):'')+'</span></div>';
  }).join('')||'<p style="font-size:11.5px;color:#94a3b8;font-style:italic;margin:6px 0 0">Nenhum chamado com esta impressora.</p>';

  var box=document.createElement('div');
  box.id='hub-impressora-modal';
  box.style.cssText='position:fixed;inset:0;z-index:99997;background:rgba(10,20,60,.45);display:flex;align-items:center;justify-content:center;padding:14px;';
  box.innerHTML=
    '<div style="background:#fff;border-radius:20px;max-width:560px;width:100%;padding:22px;box-shadow:0 24px 70px rgba(0,0,0,.25);font-family:inherit;max-height:92vh;overflow:auto;">'+
      '<div style="display:flex;align-items:center;gap:10px;">'+
        '<div style="width:46px;height:46px;border-radius:14px;background:#eef2ff;display:grid;place-items:center;"><i class="ph ph-printer" style="font-size:24px;color:#0a1e8a"></i></div>'+
        '<div style="flex:1;"><h3 style="margin:0;font-size:16.5px;font-weight:900;color:#0a1e8a">'+esc(eq.modelo||'Impressora')+'</h3>'+
        '<p style="margin:2px 0 0;font-size:11.5px;color:#64748b">Patrimônio <b>'+esc(eq.patrimonio||p.patrimonio||'-')+'</b> • Série '+esc(eq.serie||'-')+' • '+(esc(cliNome(p.clienteId))||'sem cliente')+'</p></div>'+
      '</div>'+
      '<div id="status-mon-'+esc(p.id)+'" style="margin-top:12px;border-radius:12px;padding:9px 12px;font-size:12px;font-weight:600;background:#f1f5f9;color:#64748b">Status da rede: aperte "Ler agora" (precisa estar na mesma rede que ela).</div>'+
      '<div style="display:flex;gap:10px;margin-top:10px;">'+
        '<button id="hub-mon" type="button" style="flex:1;height:40px;border:0;border-radius:12px;background:#0a1e8a;color:#fff;font-weight:800;font-size:12.5px;cursor:pointer"><i class="ph ph-pulse"></i> Ler status agora</button>'+
        (c?('<button id="hub-contrato" type="button" style="flex:1;height:40px;border:1px solid #cbd5e1;border-radius:12px;background:#fff;color:#0a1e8a;font-weight:800;font-size:12px;cursor:pointer">Contrato '+esc(c.numero||'')+'</button>'):'')+
      '</div>'+
      '<div style="margin-top:14px;border-top:1px solid #e2e8f0;padding-top:10px;">'+
        '<h4 style="margin:0;font-size:12.5px;font-weight:800;color:#0f172a"><i class="ph ph-speedometer"></i> Últimas leituras</h4>'+leitHtml+
      '</div>'+
      '<div style="margin-top:12px;border-top:1px solid #e2e8f0;padding-top:10px;">'+
        '<h4 style="margin:0;font-size:12.5px;font-weight:800;color:#0f172a"><i class="ph ph-wrench"></i> Chamados</h4>'+chamHtml+
      '</div>'+
      '<button id="hub-fechar" type="button" style="margin-top:14px;width:100%;height:36px;border:0;background:#f1f5f9;color:#475569;border-radius:12px;font-weight:800;font-size:12.5px;cursor:pointer">Fechar</button>'+
    '</div>';
  document.body.appendChild(box);
  document.getElementById('hub-fechar').onclick=fecharHub;
  box.addEventListener('click',function(ev){ if(ev.target===box) fecharHub(); });
  document.getElementById('hub-mon').onclick=function(){ lerStatusRede(p.id); };
  var bc=document.getElementById('hub-contrato');
  if(bc) bc.onclick=function(){ fecharHub(); try{ if(typeof openContratoCompleto==='function') openContratoCompleto(c.id); else tn('Contrato: '+(c.numero||c.id),'info'); }catch(e){} };
  // mostra a leitura SNMP salva (se houver) sem perguntar nada
  if(eq.snmp&&eq.snmp.ultima){
    var u=eq.snmp.ultima, selo=document.getElementById('status-mon-'+p.id);
    if(selo){
      if((u.erros||[]).length){ selo.style.background='#fee2e2'; selo.style.color='#991b1b'; selo.textContent='Última leitura ('+dataBr(u.quando)+'): ⚠ '+u.erros.join(' • '); }
      else{ selo.style.background='#dcfce7'; selo.style.color='#166534'; selo.textContent='Última leitura ('+dataBr(u.quando)+'): em dia'+(u.tonerPct!=null?(' • toner ~'+u.tonerPct+'%'):''); }
    }
  }
}
window.abrirHubImpressora=abrirHubImpressora;

// ── Botões na tela Parque (grid-parque): injeção cuidadosa, sem reescrever ──
function injetarBotoesParque(){
  var grid=document.getElementById('grid-parque');
  if(!grid) return;
  grid.querySelectorAll('[data-p8-hub]').forEach(b=>b.remove());
  var items=grid.querySelectorAll('.p-4.flex.items-start');
  items.forEach(function(el, idx){
    var parques=(typeof db!=='undefined'&&db.parque)||[];
    var eqs=(typeof db!=='undefined'&&db.equipamentos)||[];
    // casamento por PATRIMÔNIO (o grid pinta "modelo • patrimônio" na linha) —
    // nunca por índice: agrupamento por cliente mistura a ordem.
    var titulo=el.querySelector('p.font-semibold');
    var pat=titulo?String((titulo.textContent||'').split('•').pop()||'').trim():'';
    var pck=parques.find(function(pp){ var ee=eqs.find(function(x){return x.id===pp.equipamentoId;})||{}; return pat && (String(ee.patrimonio||pp.patrimonio||'').trim()===pat); })||parques[idx];
    if(!pck) return;
    var wrap=el.querySelector('div:last-child');
    if(!wrap) return;
    var mk=function(txt,fn,cor){
      var b=document.createElement('button');
      b.type='button'; b.setAttribute('data-p8-hub','1');
      b.textContent=txt;
      b.style.cssText='margin-top:6px;margin-right:6px;height:28px;padding:0 10px;border-radius:8px;border:1px solid #cbd5e1;background:#fff;color:'+(cor||'#0a1e8a')+';font-weight:800;font-size:10.5px;cursor:pointer';
      b.onclick=fn;
      return b;
    };
    wrap.appendChild(mk('Histórico', function(){ abrirHubImpressora(pck.id); }));
    wrap.appendChild(mk('Ler status (rede)', function(){ lerStatusRede(pck.id); }, '#166534'));
    var selo=document.createElement('div');
    selo.id='status-mon-'+pck.id;
    selo.setAttribute('data-p8-hub','1');
    selo.style.cssText='margin-top:4px;font-size:10.5px;color:#94a3b8';
    wrap.appendChild(selo);
  });
}

function armarScannerParque(){
  if(window.__p8ScannerArmado) return;
  window.__p8ScannerArmado=true;
  var tent=0;
  var t=setInterval(function(){ tent++; injetarBotoesParque(); if(tent>240) clearInterval(t); },1500);
  try{
    var mo=new MutationObserver(function(){ injetarBotoesParque(); });
    mo.observe(document.body,{childList:true,subtree:false});
  }catch(e){}
}
if(typeof document!=='undefined') armarScannerParque();

window.PARQUE_MONITOR_V52427={ lerStatusRede:lerStatusRede, abrirHubImpressora:abrirHubImpressora, injetarBotoesParque:injetarBotoesParque };
console.log('[DIGICOPY] v5.24.34 — monitor SNMP fase 1 + hub da impressora no Parque');
})();
