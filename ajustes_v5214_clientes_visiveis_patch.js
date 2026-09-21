// ═══════════════════════════════════════════════════════════════════════════
// v5.21.4 — clientes visíveis na tela
// A nuvem/contagem usa db.clientes.length. A tela filtrava empresaId e
// sumia com cadastro antigo sem empresa ou com empresa antiga.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

const ENTIDADES=['clientes','produtos','equipamentos','contratos','parque','leituras','os','vendas','contasReceber','contasPagar','notificacoes'];

function empresaUnica(){
  if(typeof db==='undefined'||!db)return 'emp_digicopy';
  const emp=(db.empresas||[]).find(e=>e&&e.id==='emp_digicopy')
    ||(db.empresas||[]).find(e=>/digicopy/i.test(String((e&&e.fantasia)||(e&&e.nome)||'')))
    ||(db.empresas||[])[0];
  return (emp&&emp.id)||'emp_digicopy';
}

function normalizarEmpresaClientes(){
  if(typeof db==='undefined'||!db)return 0;
  const empId=empresaUnica();
  let mudou=0;
  ENTIDADES.forEach(k=>{
    if(!Array.isArray(db[k]))return;
    db[k].forEach(r=>{
      if(!r||typeof r!=='object')return;
      if(!r.empresaId||r.empresaId!==empId){r.empresaId=empId;mudou++;}
    });
  });
  try{
    const sess=typeof getSession==='function'?getSession():null;
    if(sess&&sess.empresaId!==empId){
      sess.empresaId=empId;
      if(typeof setSession==='function')setSession(sess);
    }
  }catch(e){}
  if(mudou&&typeof saveDB==='function')saveDB();
  return mudou;
}

function pertenceEmpresa(c,empId){
  if(!c)return false;
  return !c.empresaId||c.empresaId===empId;
}

// ═══════════════════════════════════════════════════════════════════════════
// v6.1.4 — CLIENTES DUPLICADOS (relato dele, 21/09/2026, com foto: "teve esse
// cliente balcão que duplicou") e CONTRATOS SEM VÍNCULO no mesmo lugar.
//
// O que este bloco entrega:
//   1) DETECTOR: agrupa clientes da empresa pelo nome comparável (sem acento,
//      sem maiúscula, sem sufixo LTDA/ME/EIRELI...) e mostra os grupos com mais
//      de um cadastro — com QUANTAS referências cada um tem (contrato, venda,
//      OS, leitura, título...), para o dono decidir com o dado na mão.
//   2) UNIÃO GUIADA: move TODAS as referências (clienteId em qualquer lista do
//      banco) para o cadastro PRINCIPAL e marca os repetidos como 'unificado'.
//      Nunca apaga nada: o cadastro repetido continua no banco, marcado, e o
//      principal fica com tudo. Exige confirmação em popup do sistema.
//   3) LISTA dos contratos que continuam sem vínculo (para saber onde olhar).
// Regra de segurança: nome repetido NÃO é unido sozinho — só pelo botão, com
// confirmação, porque quem decide qual cadastro é o certo é o dono.
// ═══════════════════════════════════════════════════════════════════════════
function cliNormNome(v){
  return String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()
    .replace(/[^A-Z0-9 ]/g,' ').replace(/\b(LTDA|ME|MEI|EIRELI|EPP|SA|E)\b/g,' ')
    .replace(/\s+/g,' ').trim();
}
const CLI_ENTIDADES_REF=['contratos','vendas','os','leituras','orcamentos','contasReceber','contasPagar','parque','notificacoes','recargas','equipamentos','produtos'];
function cliRefsDe(base, clienteId){
  const out={total:0};
  if(!base||!clienteId) return out;
  CLI_ENTIDADES_REF.forEach(k=>{
    const arr=base[k];
    if(!Array.isArray(arr)) return;
    const n=arr.filter(x=>x&&x.clienteId===clienteId).length;
    if(n){ out[k]=n; out.total+=n; }
  });
  return out;
}
function cliGruposDuplicados(clientes, empId, base){
  const map={};
  (clientes||[]).forEach(c=>{
    if(!c||!c.id) return;
    if(empId&&c.empresaId&&c.empresaId!==empId) return;
    if(c.status==='unificado') return; // já resolvido antes: não conta de novo
    const chave=cliNormNome(c.nome||c.fantasia);
    if(!chave||chave.length<3) return;
    (map[chave]=map[chave]||[]).push(c);
  });
  return Object.keys(map).filter(k=>map[k].length>1).map(k=>{
    const itens=map[k].map(c=>({cliente:c, refs:cliRefsDe(base,c.id)}));
    return {chave:k, nome:itens[0].cliente.nome||itens[0].cliente.fantasia||k, itens:itens};
  }).sort((a,b)=>b.itens.length-a.itens.length);
}
function cliNum(v){ const g=String(v==null?'':v).match(/\d+/g); return g?parseInt(g[g.length-1].replace(/^0+/,'')||'0',10):Number.MAX_SAFE_INTEGER; }
function cliEscolherPrincipal(itens){
  const arr=(itens||[]).slice().sort((a,b)=>{
    if((b.refs.total||0)!==(a.refs.total||0)) return (b.refs.total||0)-(a.refs.total||0); // mais referências primeiro
    const ca=cliNum(a.cliente.codigo||a.cliente.codigoAntigo), cb=cliNum(b.cliente.codigo||b.cliente.codigoAntigo);
    if(ca!==cb) return ca-cb;                                                              // código menor (mais antigo)
    const da=String(a.cliente.criadoEm||''), db2=String(b.cliente.criadoEm||'');
    if(da!==db2) return da<db2?-1:1;                                                       // criado antes
    return 0;
  });
  return arr[0];
}
// Move TODA referência (clienteId em qualquer lista) para o principal e marca os
// repetidos como unificados. Devolve o que mudou, por entidade. Não apaga nada.
function cliUnir(base, idsRepetidos, principalId, principalNome){
  const ids=(idsRepetidos||[]).filter(id=>id&&id!==principalId);
  const mudou={total:0};
  if(!base||!ids.length) return mudou;
  Object.keys(base).forEach(k=>{
    const arr=base[k];
    if(!Array.isArray(arr)) return;
    arr.forEach(r=>{
      if(!r||typeof r!=='object') return;
      if(r.clienteId!==undefined&&r.clienteId!==null&&ids.indexOf(r.clienteId)>=0){
        r.clienteId=principalId;
        if(r.clienteNome) r.clienteNome=principalNome||r.clienteNome;
        mudou[k]=(mudou[k]||0)+1; mudou.total++;
      }
    });
  });
  (base.clientes||[]).forEach(c=>{
    if(c&&ids.indexOf(c.id)>=0){
      c.status='unificado'; c.unificadoEm=new Date().toISOString();
      c.unificadoPara=principalId; c.unificadoParaNome=principalNome||'';
      mudou.clientesUnificados=(mudou.clientesUnificados||0)+1;
    }
  });
  return mudou;
}

window.CLIENTES_VISIVEIS_PURE={empresaUnica,normalizarEmpresaClientes,pertenceEmpresa,cliNormNome,cliRefsDe,cliGruposDuplicados,cliEscolherPrincipal,cliUnir};

if(typeof document==='undefined')return;

const oldSeed=window.seedData;
if(typeof oldSeed==='function'&&!oldSeed.__v5214){
  window.seedData=function(){
    const r=oldSeed.apply(this,arguments);
    normalizarEmpresaClientes();
    return r;
  };
  window.seedData.__v5214=true;
}

if(typeof window.renderClientes==='function'&&!window.renderClientes.__v5214){
  const oldRender=window.renderClientes;
  window.renderClientes=function(){
    normalizarEmpresaClientes();
    return oldRender.apply(this,arguments);
  };
  window.renderClientes.__v5214=true;
}

function aposBasePronta(){
  try{
    normalizarEmpresaClientes();
    if(typeof seedData==='function')seedData(false);
    if(typeof getSession==='function'&&getSession()&&typeof showApp==='function'){
      const view=document.querySelector('.view:not(.hidden)');
      if(view&&view.id==='view-clientes'&&typeof renderClientes==='function')renderClientes();
    }
  }catch(e){}
}

const ready=window.DIGICOPY_DB_READY;
if(ready&&typeof ready.then==='function')ready.then(aposBasePronta).catch(function(){setTimeout(aposBasePronta,400);});
else setTimeout(aposBasePronta,400);

// ── UI: botão "Clientes duplicados" na tela de Clientes ────────────────────
function podeUnirClientes(){
  try{ if(typeof window.usuarioPodeApagar==='function') return !!window.usuarioPodeApagar(); }catch(e){}
  try{
    const s=typeof getSession==='function'?getSession():null;
    const p=String((s&&s.perfil)||'');
    const l=String((s&&(s.login||s.usuarioNome))||'').toLowerCase();
    return p==='Admin'||p==='Dono'||l==='kauan'||l==='denivaldo';
  }catch(e){ return false; }
}
function contratoSemVinculo(){
  const s=typeof getSession==='function'?getSession():null;
  const P=(typeof window.CONTRATOS_FINAL_PURE==='object'&&window.CONTRATOS_FINAL_PURE)?window.CONTRATOS_FINAL_PURE:null;
  if(!P||typeof P.clienteContrato!=='function') return [];
  return (db.contratos||[]).filter(c=>c&&(!s||!c.empresaId||c.empresaId===s.empresaId)&&c.status!=='excluido'&&!P.clienteContrato(c));
}
window.clientesDuplicadosContar=function(){
  try{ return cliGruposDuplicados(db.clientes, empresaUnica(), db).length; }catch(e){ return 0; }
};
function modalSistema(titulo, corpoHtml, rodapeHtml){
  const root=document.getElementById('modal-root');
  const box=document.getElementById('modal-box');
  const t=document.getElementById('modal-title');
  const b=document.getElementById('modal-body');
  const f=document.getElementById('modal-footer');
  if(!root||!b) { return false; }
  if(box) box.className='w-full max-w-[900px] rounded-[18px] bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col';
  if(t) t.textContent=titulo;
  b.innerHTML=corpoHtml;
  if(f) f.innerHTML=rodapeHtml||'<button onclick="closeModal()" class="h-10 px-5 rounded-xl bg-white border font-bold">Fechar</button>';
  root.classList.remove('hidden');
  return true;
}
window.clientesDuplicadosAbrir=async function(){
  if(typeof db==='undefined'||!db){ if(typeof window.lfbAlert==='function') window.lfbAlert('O banco ainda está carregando. Tente de novo em alguns segundos.','Clientes duplicados'); return; }
  const emp=empresaUnica();
  const grupos=cliGruposDuplicados(db.clientes, emp, db);
  const semVinculo=contratoSemVinculo();
  const cards=grupos.length?grupos.map((g,i)=>{
    const principal=cliEscolherPrincipal(g.itens);
    const linhas=g.itens.map(it=>{
      const c=it.cliente;
      const partes=Object.keys(it.refs).filter(k=>k!=='total').map(k=>it.refs[k]+' '+k);
      const cod=String(c.codigo||c.codigoAntigo||c.id||'');
      const ehPrincipal=principal.cliente.id===c.id;
      return '<li style="margin:3px 0">'+(ehPrincipal?'⭐ ':'• ')+'<b>cód '+cod+'</b> — '+(it.refs.total||0)+' referência(s)'+(partes.length?' ('+partes.join(', ')+')':'')+
        (ehPrincipal?' <b style="color:#15803d">— fica como principal</b>':'')+'</li>';
    }).join('');
    return '<div style="border:1px solid #e2e8f0;border-radius:12px;padding:11px 13px;margin-bottom:9px">'+
      '<p style="font-size:13.5px;font-weight:800;margin:0 0 5px">'+String(i+1)+'. '+String(g.nome).replace(/[<>&]/g,'')+' — '+g.itens.length+' cadastros</p>'+
      '<ul style="margin:0 0 8px 16px;font-size:12.5px;color:#334155">'+linhas+'</ul>'+
      '<button type="button" onclick="clientesDuplicadosUnir('+i+')" style="height:36px;padding:0 14px;border-radius:10px;background:#0a1e8a;color:#fff;border:none;font-weight:800;font-size:12.5px;cursor:pointer">Unir em 1 cadastro</button>'+
    '</div>';
  }).join('') : '<p style="font-size:13px;color:#15803d;font-weight:700;margin:0">✅ Nenhum cliente repetido encontrado (comparando nome sem acento e sem maiúscula).</p>';
  const sv=semVinculo.length
    ? '<p style="font-size:12.5px;color:#9a3412;font-weight:700;margin:0 0 4px">'+semVinculo.length+' contrato(s) sem vínculo ainda:</p>'+
      '<ul style="margin:0 0 0 16px;font-size:12.5px">'+semVinculo.slice(0,12).map(c=>{
        const P=window.CONTRATOS_FINAL_PURE||{};
        const nome=(typeof P.cfNomeDoContrato==='function'?P.cfNomeDoContrato(c):'')||'(sem nome guardado no contrato)';
        return '<li>Contrato <b>'+String(c.numero||c.codigo||c.id||'')+'</b> — nome no contrato: '+String(nome).replace(/[<>&]/g,'')+'</li>';
      }).join('')+(semVinculo.length>12?'<li>… e mais '+(semVinculo.length-12)+'</li>':'')+'</ul>'+
      '<p style="font-size:12px;color:#64748b;margin:6px 0 0">O sistema já tenta ligar pelo nome automaticamente (quando o nome existe em UM só cadastro). '+
      'Se o cliente não existir mais no cadastro, abra o contrato (duplo clique) e escolha o cliente — ou me manda print destes nomes.</p>'
    : '<p style="font-size:13px;color:#15803d;font-weight:700;margin:0">✅ Nenhum contrato sem vínculo de cliente.</p>';
  window.__cliDupGrupos=grupos;
  const corpo='<p style="font-size:12.5px;color:#475569;margin:0 0 10px">Comparação por nome (sem acento, sem maiúscula, ignorando LTDA/ME/EIRELI). '+
    'A união <b>não apaga nada</b>: as referências (contratos, vendas, ordens, leituras, títulos) passam para o cadastro principal e o repetido fica marcado como <b>UNIFICADO</b>.</p>'+
    '<h4 style="font-size:13px;color:#0a1e8a;margin:0 0 6px">Clientes repetidos</h4>'+cards+
    '<h4 style="font-size:13px;color:#0a1e8a;margin:12px 0 6px">Contratos sem vínculo</h4>'+sv;
  if(!modalSistema('Clientes duplicados', corpo)) if(typeof window.lfbAlert==='function') window.lfbAlert('Não achei a janela de modal nesta tela. Recarregue (F5) e tente de novo.','Clientes duplicados');
};
window.clientesDuplicadosUnir=async function(indice){
  const grupos=window.__cliDupGrupos||[];
  const g=grupos[indice];
  if(!g){ if(typeof window.lfbAlert==='function') window.lfbAlert('O grupo saiu da lista (a tela pode ter recarregado). Abra o botão de novo.','Clientes duplicados'); return; }
  if(!podeUnirClientes()){ if(typeof window.lfbAlert==='function') window.lfbAlert('Unir cadastros exige permissão de apagar/estornar (ou ser Admin/Dono).','Sem permissão'); return; }
  const principal=cliEscolherPrincipal(g.itens);
  const repetidos=g.itens.filter(it=>it.cliente.id!==principal.cliente.id);
  const resumo=repetidos.map(it=>(it.cliente.nome||'')+' (cód '+String(it.cliente.codigo||it.cliente.codigoAntigo||it.cliente.id)+', '+(it.refs.total||0)+' referência(s))').join('\n');
  const msg='Unir os '+g.itens.length+' cadastros de "'+g.nome+'"?\n\n'+
    'FICA COMO PRINCIPAL:\n• '+((principal.cliente.nome)||'')+' (cód '+String(principal.cliente.codigo||principal.cliente.codigoAntigo||principal.cliente.id)+', '+(principal.refs.total||0)+' referência(s))\n\n'+
    'SERÃO UNIFICADOS (nada é apagado — ficam marcados como UNIFICADO):\n'+resumo+'\n\n'+
    'Todas as referências passam para o principal.';
  let ok=true;
  if(typeof window.confirmSistema==='function'){ ok=await window.confirmSistema(msg,'Unir clientes duplicados'); }
  else if(typeof confirm==='function'){ ok=confirm(msg); }
  if(!ok) return;
  try{
    const r=cliUnir(db, repetidos.map(it=>it.cliente.id), principal.cliente.id, principal.cliente.nome||'');
    try{ if(typeof logAction==='function') logAction('cliente','unificar',principal.cliente.id,'Uniu '+g.itens.length+' cadastros de "'+g.nome+'" → principal código '+String(principal.cliente.codigo||principal.cliente.id)+' · '+r.total+' referência(s) movida(s)'); }catch(e){}
    if(typeof saveDB==='function') saveDB();
    try{ if(typeof renderClientes==='function') renderClientes(); }catch(e){}
    try{ if(typeof renderContratos==='function') renderContratos(); }catch(e){}
    try{ if(typeof renderAuditoria==='function') renderAuditoria(); }catch(e){}
    if(typeof window.lfbAlert==='function') window.lfbAlert('✅ União feita.\n\n• '+r.total+' referência(s) movida(s) para '+String(principal.cliente.nome||'')+'\n• '+(r.clientesUnificados||0)+' cadastro(s) repetido(s) marcado(s) como UNIFICADO (nada foi apagado)\n\nA lista de clientes já está atualizada.','Unir clientes duplicados');
    setTimeout(function(){ try{ window.clientesDuplicadosAbrir(); }catch(e){} },300);
  }catch(e){ if(typeof window.lfbAlert==='function') window.lfbAlert('Não deu para unir: '+(e.message||e),'Erro'); }
};
function injetarBotaoDuplicados(){
  try{
    const view=document.getElementById('view-clientes');
    if(!view||view.classList.contains('hidden')) return;
    const barra=view.firstElementChild;
    if(!barra) return;
    if(view.querySelector('#btn-clientes-duplicados')) return;
    const n=window.clientesDuplicadosContar();
    const b=document.createElement('button');
    b.id='btn-clientes-duplicados';
    b.type='button';
    b.title='Compara os cadastros pelo nome e ajuda a unir os repetidos (nada é apagado)';
    b.style.cssText='height:40px;padding:0 14px;border-radius:12px;font-weight:800;font-size:13px;background:'+(n?'#fff7ed':'#fff')+';color:'+(n?'#9a3412':'#334155')+';border:1px solid '+(n?'#fdba74':'#dbe3ef')+';cursor:pointer';
    b.textContent='🔎 Duplicados'+(n?(' ('+n+')'):'');
    b.onclick=window.clientesDuplicadosAbrir;
    const alvo=barra.querySelector('.flex.gap-2')||barra;
    alvo.appendChild(b);
  }catch(e){}
}
if(typeof window.renderClientes==='function'&&!window.renderClientes.__v5214dup){
  const ant=window.renderClientes;
  window.renderClientes=function(){
    const r=ant.apply(this,arguments);
    try{ injetarBotaoDuplicados(); }catch(e){}
    return r;
  };
  window.renderClientes.__v5214dup=true;
}
setTimeout(injetarBotaoDuplicados,1200);

console.log('[DIGICOPY] v6.1.4 clientes: duplicados com união guiada (nada é apagado)');
})();
