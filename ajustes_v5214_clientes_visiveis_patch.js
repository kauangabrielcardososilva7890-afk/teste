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

// ── r54 (P4): união REVERSÍVEL + usuários repetidos + órfãos (D5/D7) ─────────
// Mesma união do cliUnir, mas GUARDA o valor anterior de cada registro tocado
// (clienteId + clienteNome + situação do cadastro). O "Desfazer" devolve tudo.
function cliUnirReversivel(base, idsRepetidos, principalId, principalNome){
  const ids=(idsRepetidos||[]).filter(id=>id&&id!==principalId);
  const out={total:0, itens:[]};
  if(!base||!ids.length) return out;
  Object.keys(base).forEach(k=>{
    const arr=base[k];
    if(!Array.isArray(arr)) return;
    arr.forEach(r=>{
      if(!r||typeof r!=='object') return;
      if(r.clienteId!==undefined&&r.clienteId!==null&&ids.indexOf(r.clienteId)>=0){
        out.itens.push({ent:k, id:r.id, campo:'clienteId', antes:r.clienteId, nomeAntes:(r.clienteNome==null?null:r.clienteNome)});
        r.clienteId=principalId;
        if(r.clienteNome) r.clienteNome=principalNome||r.clienteNome;
        out[k]=(out[k]||0)+1; out.total++;
      }
    });
  });
  (base.clientes||[]).forEach(c=>{
    if(c&&ids.indexOf(c.id)>=0){
      out.itens.push({ent:'clientes', id:c.id, campo:'__cadastro', antes:{status:(c.status==null?null:c.status), unificadoEm:(c.unificadoEm||null), unificadoPara:(c.unificadoPara||null), unificadoParaNome:(c.unificadoParaNome||null)}});
      c.status='unificado'; c.unificadoEm=new Date().toISOString();
      c.unificadoPara=principalId; c.unificadoParaNome=principalNome||'';
      out.clientesUnificados=(out.clientesUnificados||0)+1;
    }
  });
  return out;
}
// Devolve cada registro ao valor guardado. PURA (recebe base + itens).
function cliDesfazerUniao(base, itens){
  let feitos=0;
  (itens||[]).forEach(t=>{
    if(!t||!base) return;
    const arr=base[t.ent];
    if(!Array.isArray(arr)) return;
    const r=arr.find(x=>x&&x.id===t.id);
    if(!r) return;
    if(t.campo==='__cadastro'){
      const a=t.antes||{};
      if(a.status==null) delete r.status; else r.status=a.status;
      if(a.unificadoEm==null) delete r.unificadoEm; else r.unificadoEm=a.unificadoEm;
      if(a.unificadoPara==null) delete r.unificadoPara; else r.unificadoPara=a.unificadoPara;
      if(a.unificadoParaNome==null) delete r.unificadoParaNome; else r.unificadoParaNome=a.unificadoParaNome;
      feitos++;
    }else if(t.campo==='clienteId'){
      r.clienteId=t.antes;
      if(t.nomeAntes==null){ if(r.clienteNome!==undefined) delete r.clienteNome; }else r.clienteNome=t.nomeAntes;
      feitos++;
    }
  });
  return feitos;
}
// ── usuários repetidos (D5: mesmo login 2× quebra a busca por login) ────────
function usuNormLogin(v){ return String(v==null?'':v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9._@-]/g,'').trim(); }
function usuGruposDuplicados(usuarios, empId){
  const map={};
  (usuarios||[]).forEach(u=>{
    if(!u||!u.id) return;
    if(empId&&u.empresaId&&u.empresaId!==empId) return;
    if(u.ativo===false) return; // inativo já está "resolvido"
    const chave=usuNormLogin(u.login||'');
    if(!chave||chave.length<2) return;
    (map[chave]=map[chave]||[]).push(u);
  });
  return Object.keys(map).filter(k=>map[k].length>1).map(k=>({chave:k, login:map[k][0].login, itens:map[k].slice().sort((a,b)=>String(a.criadoEm||a.id||'')<String(b.criadoEm||b.id||'')?-1:1)}));
}
// Não apaga nem funde usuário (auditoria!): desativa os repetidos, mantendo o
// mais antigo como principal. Reversível (é só reativar na tela de Usuários).
function usuDesativarRepetidos(base, idsRepetidos, principalId){
  const ids=(idsRepetidos||[]).filter(id=>id&&id!==principalId);
  let feitos=0;
  ((base&&base.usuarios)||[]).forEach(u=>{
    if(u&&ids.indexOf(u.id)>=0&&u.ativo!==false){
      u.ativo=false; u.desativadoPorUniao=principalId; u.desativadoPorUniaoEm=new Date().toISOString();
      feitos++;
    }
  });
  return feitos;
}
// ── órfãos (D7): apontam para um cliente que não existe ─────────────────────
function orfaosListar(base){
  const out=[];
  if(!base) return out;
  const ids={};
  (base.clientes||[]).forEach(c=>{ if(c&&c.id) ids[c.id]=true; });
  CLI_ENTIDADES_REF.forEach(k=>{
    const arr=base[k];
    if(!Array.isArray(arr)) return;
    arr.forEach(r=>{
      if(!r||r.clienteId==null||r.clienteId==='') return;
      if(ids[r.clienteId]) return;
      out.push({ent:k, id:r.id, desc:String(r.numero||r.codigo||r.nome||r.id||''), clienteId:r.clienteId});
    });
  });
  return out;
}
function orfaoDesvincular(base, ent, id){
  const arr=base?base[ent]:null;
  if(!Array.isArray(arr)) return false;
  const r=arr.find(x=>x&&x.id===id);
  if(!r) return false;
  r.clienteId=null;
  if(r.clienteNome!==undefined) delete r.clienteNome;
  return true;
}

window.CLIENTES_VISIVEIS_PURE={empresaUnica,normalizarEmpresaClientes,pertenceEmpresa,cliNormNome,cliRefsDe,cliGruposDuplicados,cliEscolherPrincipal,cliUnir,cliUnirReversivel,cliDesfazerUniao,usuNormLogin,usuGruposDuplicados,usuDesativarRepetidos,orfaosListar,orfaoDesvincular};

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
        return '<li style="margin:4px 0">Contrato <b>'+String(c.numero||c.codigo||c.id||'')+'</b> — nome no contrato: '+String(nome).replace(/[<>&]/g,'')+
          ' <button type="button" onclick="clientesDuplicadosVincularContrato(\''+String(c.id)+'\')" style="height:28px;padding:0 10px;border-radius:8px;background:#fff7ed;color:#9a3412;border:1px solid #fdba74;font-weight:800;font-size:11.5px;cursor:pointer">🔗 Vincular cliente</button></li>';
      }).join('')+(semVinculo.length>12?'<li>… e mais '+(semVinculo.length-12)+'</li>':'')+'</ul>'+
      '<p style="font-size:12px;color:#64748b;margin:6px 0 0">O sistema liga isso <b>sozinho</b>: pelo código do sistema antigo, pelo CNPJ/CPF, '+
      'pelo parque/leituras/OS daquele contrato e pelo nome (mesmo parecido). Se ainda sobrou algum, é porque o nome guardado no contrato é genérico '+
      '(ex.: "Cliente") — aí o botão <b>🔗 Vincular cliente</b> continua ali como plano B. Nada é mesclado nem apagado, e cada decisão automática '+
      'fica registrada na Auditoria com o motivo.</p>'
    : '<p style="font-size:13px;color:#15803d;font-weight:700;margin:0">✅ Nenhum contrato sem vínculo de cliente.</p>';
  window.__cliDupGrupos=grupos;
  // r54 (P4): Desfazer (se há união guardada) + órfãos (D7) na mesma janela.
  let tokUniao=null;
  try{ tokUniao=JSON.parse(localStorage.getItem('digicopy_ultima_uniao')||'null'); }catch(eTok){ tokUniao=null; }
  const desfazer=(tokUniao&&tokUniao.itens&&tokUniao.itens.length)
    ? '<p style="margin:0 0 10px"><button type="button" onclick="clientesDuplicadosDesfazer()" style="height:36px;padding:0 14px;border-radius:10px;background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;font-weight:800;font-size:12.5px;cursor:pointer">↩ Desfazer última união ('+String(tokUniao.nome||'').replace(/[<>&]/g,'')+')</button></p>' : '';
  const orf=orfaosListar(db);
  const orfHtml=orf.length
    ? '<p style="font-size:12.5px;color:#9a3412;font-weight:700;margin:0 0 4px">'+orf.length+' registro(s) apontando para cliente que não existe:</p>'+
      '<ul style="margin:0 0 0 16px;font-size:12.5px">'+orf.slice(0,20).map((o,i)=>{
        const vinc=(o.ent==='contratos')?' <button type="button" onclick="clientesDuplicadosVincularContrato(\''+String(o.id)+'\')" style="height:28px;padding:0 10px;border-radius:8px;background:#fff7ed;color:#9a3412;border:1px solid #fdba74;font-weight:800;font-size:11.5px;cursor:pointer">🔗 Vincular cliente</button>':'';
        return '<li style="margin:4px 0">'+String(o.ent)+' <b>'+String(o.desc).replace(/[<>&]/g,'')+'</b> → cliente '+String(o.clienteId).replace(/[<>&]/g,'')+' (não existe)'+vinc+
          ' <button type="button" onclick="clientesOrfaoDesvincular('+i+')" style="height:28px;padding:0 10px;border-radius:8px;background:#fff;color:#64748b;border:1px solid #e2e8f0;font-weight:800;font-size:11.5px;cursor:pointer">✖️ Desvincular</button></li>';
      }).join('')+(orf.length>20?'<li>… e mais '+(orf.length-20)+'</li>':'')+'</ul>'
    : '<p style="font-size:13px;color:#15803d;font-weight:700;margin:0">✅ Nenhum registro órfão.</p>';
  window.__cliOrfaos=orf;
  const corpo=desfazer+'<p style="font-size:12.5px;color:#475569;margin:0 0 10px">Comparação por nome (sem acento, sem maiúscula, ignorando LTDA/ME/EIRELI). '+
    'A união <b>não apaga nada</b>: as referências (contratos, vendas, ordens, leituras, títulos) passam para o cadastro principal e o repetido fica marcado como <b>UNIFICADO</b>.</p>'+
    '<h4 style="font-size:13px;color:#0a1e8a;margin:0 0 6px">Clientes repetidos</h4>'+cards+
    '<h4 style="font-size:13px;color:#0a1e8a;margin:12px 0 6px">Contratos sem vínculo</h4>'+sv+
    '<h4 style="font-size:13px;color:#0a1e8a;margin:12px 0 6px">Registros sem cliente (órfãos)</h4>'+orfHtml;
  if(!modalSistema('Clientes duplicados', corpo)) if(typeof window.lfbAlert==='function') window.lfbAlert('Não achei a janela de modal nesta tela. Recarregue (F5) e tente de novo.','Clientes duplicados');
};
// v6.1.4 (22/09/2026) — DONO: "quero resolver o Cliente sem vínculo". O botão
// fecha esta janela e abre o seletor de clientes do próprio contrato.
window.clientesDuplicadosVincularContrato=function(contratoId){
  try{ if(typeof closeModal==='function') closeModal(); }catch(e){}
  setTimeout(function(){
    if(typeof window.contratoVincularCliente==='function') window.contratoVincularCliente(contratoId);
    else if(typeof window.lfbAlert==='function') window.lfbAlert('O seletor de cliente não carregou nesta tela. Recarregue (F5) e tente de novo.','Vincular cliente');
  },150);
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
    const r=cliUnirReversivel(db, repetidos.map(it=>it.cliente.id), principal.cliente.id, principal.cliente.nome||'');
    try{ localStorage.setItem('digicopy_ultima_uniao', JSON.stringify({quando:new Date().toISOString(), principalId:principal.cliente.id, nome:g.nome, itens:r.itens})); }catch(eTok){}
    try{ if(typeof logAction==='function') logAction('cliente','unificar',principal.cliente.id,'Uniu '+g.itens.length+' cadastros de "'+g.nome+'" → principal código '+String(principal.cliente.codigo||principal.cliente.id)+' · '+r.total+' referência(s) movida(s)'); }catch(e){}
    if(typeof saveDB==='function') saveDB();
    try{ if(typeof renderClientes==='function') renderClientes(); }catch(e){}
    try{ if(typeof renderContratos==='function') renderContratos(); }catch(e){}
    try{ if(typeof renderAuditoria==='function') renderAuditoria(); }catch(e){}
    if(typeof window.lfbAlert==='function') window.lfbAlert('✅ União feita.\n\n• '+r.total+' referência(s) movida(s) para '+String(principal.cliente.nome||'')+'\n• '+(r.clientesUnificados||0)+' cadastro(s) repetido(s) marcado(s) como UNIFICADO (nada foi apagado)\n\nA lista de clientes já está atualizada.\\n\\n↩ Errou? Reabra esta janela e use o botão \"Desfazer última união\" no topo.','Unir clientes duplicados');
    setTimeout(function(){ try{ window.clientesDuplicadosAbrir(); }catch(e){} },300);
  }catch(e){ if(typeof window.lfbAlert==='function') window.lfbAlert('Não deu para unir: '+(e.message||e),'Erro'); }
};
// r54 (P4): DESFAZER a última união (devolve cada registro ao valor guardado).
window.clientesDuplicadosDesfazer=async function(){
  let tok=null;
  try{ tok=JSON.parse(localStorage.getItem('digicopy_ultima_uniao')||'null'); }catch(e){ tok=null; }
  if(!tok||!tok.itens||!tok.itens.length){ if(typeof window.lfbAlert==='function') window.lfbAlert('Não há união guardada para desfazer.','Desfazer união'); return; }
  if(!podeUnirClientes()){ if(typeof window.lfbAlert==='function') window.lfbAlert('Desfazer união exige permissão de apagar/estornar (ou ser Admin/Dono).','Sem permissão'); return; }
  const msg='Desfazer a união de "'+(tok.nome||'')+'"?\n\nCada registro volta para o cadastro de onde saiu ('+tok.itens.length+' ajuste(s)). Nada é apagado.';
  let ok=true;
  if(typeof window.confirmSistema==='function'){ ok=await window.confirmSistema(msg,'Desfazer união'); }
  else if(typeof confirm==='function'){ ok=confirm(msg); }
  if(!ok) return;
  try{
    const n=cliDesfazerUniao(db, tok.itens);
    try{ localStorage.removeItem('digicopy_ultima_uniao'); }catch(e2){}
    try{ if(typeof logAction==='function') logAction('cliente','desfazer-uniao',tok.principalId||'','Desfez a união de "'+(tok.nome||'')+'" ('+n+' ajuste(s))'); }catch(e3){}
    if(typeof saveDB==='function') saveDB();
    try{ if(typeof renderClientes==='function') renderClientes(); }catch(e4){}
    try{ if(typeof renderAuditoria==='function') renderAuditoria(); }catch(e5){}
    if(typeof window.lfbAlert==='function') window.lfbAlert('✅ União desfeita ('+n+' ajuste(s)).','Desfazer união');
    setTimeout(function(){ try{ window.clientesDuplicadosAbrir(); }catch(e6){} },300);
  }catch(e){ if(typeof window.lfbAlert==='function') window.lfbAlert('Não deu para desfazer: '+(e.message||e),'Erro'); }
};
// r54 (P4): desvincula UM órfão (o registro continua existindo, só solta o cliente fantasma).
window.clientesOrfaoDesvincular=async function(indice){
  const lista=window.__cliOrfaos||[];
  const o=lista[indice];
  if(!o) return;
  if(!podeUnirClientes()){ if(typeof window.lfbAlert==='function') window.lfbAlert('Desvincular exige permissão de apagar/estornar (ou ser Admin/Dono).','Sem permissão'); return; }
  const msg='Soltar este registro do cliente fantasma?\n\n• '+o.ent+' '+(o.desc||o.id)+'\n• cliente '+o.clienteId+' (não existe)\n\nO registro CONTINUA no banco, só fica sem cliente.';
  let ok=true;
  if(typeof window.confirmSistema==='function'){ ok=await window.confirmSistema(msg,'Desvincular órfão'); }
  else if(typeof confirm==='function'){ ok=confirm(msg); }
  if(!ok) return;
  try{
    if(orfaoDesvincular(db, o.ent, o.id)){
      try{ if(typeof logAction==='function') logAction(o.ent,'desvincular-orfao',o.id,'Soltou do cliente fantasma '+o.clienteId); }catch(e2){}
      if(typeof saveDB==='function') saveDB();
    }
    setTimeout(function(){ try{ window.clientesDuplicadosAbrir(); }catch(e3){} },300);
  }catch(e){ if(typeof window.lfbAlert==='function') window.lfbAlert('Não deu: '+(e.message||e),'Erro'); }
};
// ── r54 (P4): USUÁRIOS repetidos (D5) — mesmo login 2× ───────────────────────
window.usuariosDuplicadosContar=function(){
  try{ return usuGruposDuplicados(db.usuarios, empresaUnica()).length; }catch(e){ return 0; }
};
window.usuariosDuplicadosAbrir=function(){
  if(typeof db==='undefined'||!db){ if(typeof window.lfbAlert==='function') window.lfbAlert('O banco ainda está carregando.','Usuários repetidos'); return; }
  const grupos=usuGruposDuplicados(db.usuarios, empresaUnica());
  window.__usuDupGrupos=grupos;
  const cards=grupos.length?grupos.map((g,i)=>{
    const linhas=g.itens.map((u,j)=>{
      return '<li style="margin:3px 0">'+(j===0?'⭐ ':'• ')+'<b>'+String(u.login||'').replace(/[<>&]/g,'')+'</b> — '+String(u.nome||'').replace(/[<>&]/g,'')+' ('+String(u.perfil||'')+')'+(j===0?' <b style="color:#15803d">— fica como principal (mais antigo)</b>':'')+'</li>';
    }).join('');
    return '<div style="border:1px solid #e2e8f0;border-radius:12px;padding:11px 13px;margin-bottom:9px">'+
      '<p style="font-size:13.5px;font-weight:800;margin:0 0 5px">'+String(i+1)+'. login "'+String(g.login).replace(/[<>&]/g,'')+'" — '+g.itens.length+' cadastros ativos</p>'+
      '<ul style="margin:0 0 8px 16px;font-size:12.5px;color:#334155">'+linhas+'</ul>'+
      '<button type="button" onclick="usuariosDuplicadosResolver('+i+')" style="height:36px;padding:0 14px;border-radius:10px;background:#0a1e8a;color:#fff;border:none;font-weight:800;font-size:12.5px;cursor:pointer">Manter o principal, desativar repetidos</button>'+
    '</div>';
  }).join('') : '<p style="font-size:13px;color:#15803d;font-weight:700;margin:0">✅ Nenhum login repetido.</p>';
  const corpo='<p style="font-size:12.5px;color:#475569;margin:0 0 10px">Login repetido confunde o sistema (ele acha o primeiro e ignora o outro). '+
    'A correção <b>não apaga ninguém</b>: desativa os repetidos e o principal continua valendo. Desativar é reversível (é só reativar na tela de Usuários).</p>'+cards;
  if(!modalSistema('Usuários repetidos', corpo)) if(typeof window.lfbAlert==='function') window.lfbAlert('Não achei a janela de modal nesta tela. Recarregue (F5) e tente de novo.','Usuários repetidos');
};
window.usuariosDuplicadosResolver=async function(indice){
  const grupos=window.__usuDupGrupos||[];
  const g=grupos[indice];
  if(!g) return;
  if(!podeUnirClientes()){ if(typeof window.lfbAlert==='function') window.lfbAlert('Resolver repetidos exige permissão de apagar/estornar (ou ser Admin/Dono).','Sem permissão'); return; }
  const principal=g.itens[0];
  const repetidos=g.itens.slice(1);
  const msg='Resolver o login "'+(g.login||'')+'"?\n\nFICA ATIVO (principal):\n• '+(principal.nome||'')+' ('+(principal.perfil||'')+')\n\nSERÃO DESATIVADOS (nada é apagado):\n'+repetidos.map(u=>'• '+(u.nome||'')+' ('+(u.perfil||'')+')').join('\n');
  let ok=true;
  if(typeof window.confirmSistema==='function'){ ok=await window.confirmSistema(msg,'Usuários repetidos'); }
  else if(typeof confirm==='function'){ ok=confirm(msg); }
  if(!ok) return;
  try{
    const n=usuDesativarRepetidos(db, repetidos.map(u=>u.id), principal.id);
    try{ if(typeof logAction==='function') logAction('usuario','desativar-repetido',principal.id,'Desativou '+n+' cadastro(s) repetido(s) do login "'+(g.login||'')+'"'); }catch(e2){}
    if(typeof saveDB==='function') saveDB();
    try{ if(typeof renderUsuarios==='function') renderUsuarios(); }catch(e3){}
    if(typeof window.lfbAlert==='function') window.lfbAlert('✅ Pronto: '+n+' repetido(s) desativado(s). Para reverter, reative na tela de Usuários.','Usuários repetidos');
    setTimeout(function(){ try{ window.usuariosDuplicadosAbrir(); }catch(e4){} },300);
  }catch(e){ if(typeof window.lfbAlert==='function') window.lfbAlert('Não deu: '+(e.message||e),'Erro'); }
};
function injetarBotaoUsuariosDup(){
  try{
    const view=document.getElementById('view-usuarios');
    if(!view||view.classList.contains('hidden')) return;
    const barra=view.firstElementChild;
    if(!barra) return;
    if(view.querySelector('#btn-usuarios-duplicados')) return;
    const n=window.usuariosDuplicadosContar();
    const b=document.createElement('button');
    b.id='btn-usuarios-duplicados';
    b.type='button';
    b.title='Acha logins cadastrados 2 vezes e ajuda a resolver (sem apagar ninguém)';
    b.style.cssText='height:40px;padding:0 14px;border-radius:12px;font-weight:800;font-size:13px;background:'+(n?'#fff7ed':'#fff')+';color:'+(n?'#9a3412':'#334155')+';border:1px solid '+(n?'#fdba74':'#dbe3ef')+';cursor:pointer';
    b.textContent='🔎 Logins repetidos'+(n?(' ('+n+')'):'');
    b.onclick=window.usuariosDuplicadosAbrir;
    const alvo=barra.querySelector('.flex.gap-2')||barra;
    alvo.appendChild(b);
  }catch(e){}
}
// SUBSTITUICAO DE PROPOSITO (r54): embrulha renderUsuarios para injetar o botão de logins repetidos; chama a original.
if(typeof window.renderUsuarios==='function'&&!window.renderUsuarios.__v5214usu){
  const origU=window.renderUsuarios;
  window.renderUsuarios=function(){
    const r=origU.apply(this,arguments);
    try{ injetarBotaoUsuariosDup(); }catch(e){}
    return r;
  };
  window.renderUsuarios.__v5214usu=true;
}
setTimeout(injetarBotaoUsuariosDup,1500);

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

console.log('[DIGICOPY] v6.1.4 clientes: duplicados com união guiada + desfazer + usuários repetidos + órfãos (r54, nada é apagado)');
})();
