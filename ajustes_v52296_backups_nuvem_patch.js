// ═══════════════════════════════════════════════════════════════════════════
// AJUSTES v5.22.97 — Painel de BACKUPS na nuvem (só administrador)
// ═══════════════════════════════════════════════════════════════════════════
// Em "Nuvem" há agora um card "Backups na nuvem" com:
//   • a lista do que a nuvem guardou, separado nas pastas:
//       📁 Backup diario (todo dia 18:30 sozinho)
//       📁 Backup atualizações (sozinho a cada versão nova, foto da anterior)
//       📁 Backup manual (botão 📸 Backup agora — reforço antes de mexer);
//   • 📥 Baixar todos os backups (um .zip pronto pra guardar no HD externo);
//   • 🗑️ Excluir os backups (apaga SÓ os backups da nuvem — os dados do
//     sistema nunca, e o ciclo continua: amanhã 18:30 sai outro diário).
// O card só aparece para o aparelho/usuário administrador (mesmo lugar dos
// outros botões de administração da nuvem).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function api(){ return window.DIGICOPY_CLOUD && window.DIGICOPY_CLOUD.api; }

function dataBR(iso){
  try{ const d = new Date(iso); return isNaN(+d) ? '' : d.toLocaleString('pt-BR'); }catch(e){ return ''; }
}
function tamanhoBR(bytes){
  const n = Number(bytes)||0;
  if(n >= 1048576) return (n/1048576).toFixed(1).replace('.', ',') + ' MB';
  if(n >= 1024) return (n/1024).toFixed(0) + ' KB';
  return n + ' B';
}

function aviso(el, texto, cor){
  if(!el) return;
  el.innerHTML = '<div style="padding:10px 12px;border-radius:10px;font-size:12px;font-weight:700;background:' +
    (cor === 'erro' ? '#fef2f2' : cor === 'ok' ? '#ecfdf5' : '#eff6ff') +
    ';color:' + (cor === 'erro' ? '#991b1b' : cor === 'ok' ? '#047857' : '#1d4ed8') +
    ';border:1px solid ' + (cor === 'erro' ? '#fecaca' : cor === 'ok' ? '#a7f3d0' : '#bfdbfe') + '">' + texto + '</div>';
}

function traduzErro(e){
  const codigo = e && (e.code || '') + '|' + (e.message || '');
  if(codigo.indexOf('404') >= 0 || codigo.indexOf('HTML') >= 0)
    return 'O servidor da nuvem é antigo e ainda não tem a função de backups. Rode "npx wrangler deploy" na pasta cloudflare-worker (veja o README da nuvem).';
  if(codigo.indexOf('ADMIN') >= 0 || codigo.indexOf('403') >= 0)
    return 'Só o aparelho administrador pode mexer nos backups.';
  return e && e.message || String(e);
}

// ─── ZIP simples (sem compressão): suficiente e leve pra qualquer PC ───────
const CRC_TABELA = (function(){
  const t = new Uint32Array(256);
  for(let n = 0; n < 256; n++){
    let c = n;
    for(let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes){
  let c = 0xFFFFFFFF;
  for(let i = 0; i < bytes.length; i++) c = CRC_TABELA[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function dataDos(agora){
  const d = agora || new Date();
  const hora = (d.getHours() << 11) | (d.getMinutes() << 5) | ((d.getSeconds() / 2) | 0);
  const data = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
  return { hora, data };
}
function montarZip(arquivos){ // arquivos: [{nome, bytes(Uint8Array)}]
  const partes = [];
  const central = [];
  let offset = 0;
  const agora = dataDos();
  arquivos.forEach(function(arq){
    const nome = arq.nome.replace(/\\/g, '/'); // mantém as pastas dentro do zip
    const nomeBytes = new TextEncoder().encode(nome);
    const crc = crc32(arq.bytes);
    const cab = new DataView(new ArrayBuffer(30));
    cab.setUint32(0, 0x04034b50, true);      // assinatura local
    cab.setUint16(4, 20, true);              // versão mínima
    cab.setUint16(6, 0x0800, true);          // UTF-8
    cab.setUint16(8, 0, true);               // store (sem compressão)
    cab.setUint16(10, agora.hora, true);
    cab.setUint16(12, agora.data, true);
    cab.setUint32(14, crc, true);
    cab.setUint32(18, arq.bytes.length, true);
    cab.setUint32(22, arq.bytes.length, true);
    cab.setUint16(26, nomeBytes.length, true);
    cab.setUint16(28, 0, true);
    partes.push(new Uint8Array(cab.buffer), nomeBytes, arq.bytes);

    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true);
    cen.setUint16(4, 20, true);
    cen.setUint16(6, 20, true);
    cen.setUint16(8, 0x0800, true);
    cen.setUint16(10, 0, true);
    cen.setUint16(12, agora.hora, true);
    cen.setUint16(14, agora.data, true);
    cen.setUint32(16, crc, true);
    cen.setUint32(20, arq.bytes.length, true);
    cen.setUint32(24, arq.bytes.length, true);
    cen.setUint16(28, nomeBytes.length, true);
    cen.setUint32(42, offset, true);
    central.push(new Uint8Array(cen.buffer), nomeBytes);
    offset += 30 + nomeBytes.length + arq.bytes.length;
  });
  let tamCentral = 0;
  central.forEach(function(p){ tamCentral += p.length; });
  const fim = new DataView(new ArrayBuffer(22));
  fim.setUint32(0, 0x06054b50, true);
  fim.setUint16(8, arquivos.length, true);
  fim.setUint16(10, arquivos.length, true);
  fim.setUint32(12, tamCentral, true);
  fim.setUint32(16, offset, true);
  partes.push.apply(partes, central);
  partes.push(new Uint8Array(fim.buffer));
  return new Blob(partes, { type: 'application/zip' });
}

function baixarArquivo(nome, blob){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){ try{ URL.revokeObjectURL(url); }catch(e){} }, 5000);
}
async function baixarUmBackup(chave){
  const call = api(); if(!call) throw new Error('API da nuvem não carregada.');
  const resp = await fetch(window.DIGICOPY_CLOUD.API + '/v1/backup?key=' + encodeURIComponent(chave), {
    headers: { authorization: 'Bearer ' + window.DIGICOPY_CLOUD.token() }
  });
  if(!resp.ok){
    let msg = 'Erro HTTP ' + resp.status;
    try{ const d = await resp.json(); if(d && d.message) msg = d.message; }catch(e){}
    throw new Error(msg);
  }
  const corte = chave.indexOf('/');
  return { chave: chave, nome: corte > 0 ? chave.slice(corte + 1) : chave, bytes: new Uint8Array(await resp.arrayBuffer()) };
}

async function backupAgora(){
  const call = api(); if(!call) throw new Error('API da nuvem não carregada.');
  return call('/v1/backup/agora', { method: 'POST', body: JSON.stringify({ tipo: 'manual' }) });
}

// ─── Funções do painel ─────────────────────────────────────────────────────
async function listar(){ const call = api(); if(!call) throw new Error('API da nuvem não carregada.'); return call('/v1/backups'); }

async function baixarTodos(avisoEl, botao){
  const d = await listar();
  const itens = (d && d.backups) || [];
  if(!itens.length){ aviso(avisoEl, 'Ainda não há backups guardados. O primeiro diário sai 18:30, e o de sistema sai na próxima atualização.', 'info'); return 0; }
  aviso(avisoEl, 'Baixando ' + itens.length + ' backup(s) da nuvem... aguarde.', 'info');
  const arquivos = [];
  for(let i = 0; i < itens.length; i++){
    if(botao) botao.innerText = '📥 ' + (i + 1) + '/' + itens.length + '...';
    const arq = await baixarUmBackup(itens[i].chave);
    arquivos.push({ nome: itens[i].chave, bytes: arq.bytes }); // "Backup diario/Backup 08-09-2026.json" vira pasta no zip
  }
  const agora = new Date();
  const nomeZip = 'backups-digicopy-' +
    agora.getFullYear() + '-' + String(agora.getMonth() + 1).padStart(2, '0') + '-' + String(agora.getDate()).padStart(2, '0') +
    '-' + String(agora.getHours()).padStart(2, '0') + 'h' + String(agora.getMinutes()).padStart(2, '0') + '.zip';
  baixarArquivo(nomeZip, montarZip(arquivos));
  aviso(avisoEl, '✅ Pronto! Baixei <b>' + itens.length + ' backup(s)</b> no arquivo <b>' + nomeZip + '</b>. Guarde no HD externo.', 'ok');
  return itens.length;
}

async function excluirTodos(avisoEl){
  const d = await listar();
  const qtd = ((d && d.backups) || []).length;
  if(!qtd){ aviso(avisoEl, 'Não há backups para apagar.', 'info'); return 0; }
  const ok1 = await window.confirmSistema(
    'Excluir <b>' + qtd + ' backup(s)</b> da nuvem? Isso apaga <b>somente os backups</b> — os dados atuais do sistema <b>continuam intactos</b>.',
    'Excluir backups da nuvem');
  if(!ok1) return 0;
  const ok2 = await window.confirmSistema(
    'Última confirmação: tem certeza? Se baixar tudo no HD primeiro, lembre de guardar o arquivo <b>.zip</b>. Depois de apagar, o ciclo continua normal (amanhã 18:30 sai o diário e a cada atualização sai o de sistema).',
    'Tem certeza?');
  if(!ok2) return 0;
  const call = api();
  const r = await call('/v1/backups', { method: 'DELETE' });
  aviso(avisoEl, '🗑️ Apaguei <b>' + (r.apagados || qtd) + ' backup(s)</b> da nuvem. Os dados do sistema não foram tocados — amanhã 18:30 tem diário novo.', 'ok');
  return r.apagados || qtd;
}

// ─── A tela (card dentro do painel Nuvem) ──────────────────────────────────
function estiloBtn(principal){
  return 'height:38px;padding:0 14px;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer;' +
    (principal ? 'background:#0a1e8a;color:#fff;border:0' : 'background:#fff;color:#334155;border:1px solid #cbd5e1');
}

function renderLista(box, itens){
  if(!itens.length){
    box.innerHTML = '<div style="font-size:12px;color:#64748b;font-weight:700">Ainda não há backups. O diário sai 18:30 todo dia e o de sistema sai sozinho a cada atualização.</div>';
    return;
  }
  // Separa nas pastas do desenho do dono: diário, atualizações e manual.
  const pastas = ['Backup diario', 'Backup atualizações', 'Backup manual'];
  const grupos = {};
  itens.forEach(function(b){ const p = b.pasta || ''; (grupos[p] = grupos[p] || []).push(b); });
  let html = '';
  pastas.concat(Object.keys(grupos).filter(function(p){ return pastas.indexOf(p) < 0; })).forEach(function(p){
    const lista = grupos[p]; if(!lista || !lista.length) return;
    html += '<div style="font-size:11px;font-weight:900;color:#0a1e8a;margin:4px 0 2px">📁 ' + p.replace(/</g, '&lt;') + '</div>';
    html += lista.map(function(b){
      return '<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc">' +
        '<span style="font-size:15px">📝</span>' +
        '<span style="flex:1;min-width:0"><b style="font-size:12px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + b.nome.replace(/</g, '&lt;') + '</b>' +
        '<small style="color:#64748b;font-size:10px">' + dataBR(b.geradoEm) + ' • ' + tamanhoBR(b.tamanho) + (b.registros ? ' • ' + b.registros + ' registros' : '') + '</small></span>' +
        '<button type="button" data-bk-baixar="' + b.chave.replace(/"/g, '&quot;') + '" title="Baixar este backup" style="' + estiloBtn(false) + ';height:30px;padding:0 9px">⬇️</button>' +
        '<button type="button" data-bk-apagar="' + b.chave.replace(/"/g, '&quot;') + '" title="Apagar este backup" style="' + estiloBtn(false) + ';height:30px;padding:0 9px">🗑️</button>' +
      '</div>';
    }).join('');
  });
  box.innerHTML = html;

  box.querySelectorAll('[data-bk-baixar]').forEach(function(btn){
    btn.onclick = async function(){
      try{
        const arq = await baixarUmBackup(btn.getAttribute('data-bk-baixar'));
        baixarArquivo(arq.nome, new Blob([arq.bytes], { type: 'application/json' }));
      }catch(e){ window.lfbAlert && window.lfbAlert(traduzErro(e), 'Backups'); }
    };
  });
  box.querySelectorAll('[data-bk-apagar]').forEach(function(btn){
    btn.onclick = async function(){
      const chave = btn.getAttribute('data-bk-apagar');
      const ok = await window.confirmSistema('Apagar o backup <b>' + chave + '</b> da nuvem? Os dados do sistema continuam intactos.', 'Apagar um backup');
      if(!ok) return;
      try{
        const call = api();
        await call('/v1/backup?key=' + encodeURIComponent(chave), { method: 'DELETE' });
        carregar(box);
      }catch(e){ window.lfbAlert && window.lfbAlert(traduzErro(e), 'Backups'); }
    };
  });
}

async function carregar(card){
  const lista = card.querySelector('#bk-lista');
  const rodape = card.querySelector('#bk-aviso');
  if(lista) lista.innerHTML = '<div style="font-size:12px;color:#64748b;font-weight:700">Procurando backups na nuvem...</div>';
  try{
    const d = await listar();
    const itens = (d && d.backups) || [];
    const cont = card.querySelector('#bk-contador');
    if(cont) cont.innerText = itens.length + ' guardado(s)';
    renderLista(lista, itens);
    aviso(rodape, '', 'apagar');
    if(rodape) rodape.innerHTML = '';
  }catch(e){
    if(lista) lista.innerHTML = '';
    aviso(rodape, traduzErro(e), 'erro');
  }
}

async function abrir(painelBody){
  const card = painelBody.querySelector('#dc-backups');
  if(!card) return;
  card.innerHTML =
    '<div style="border:1px solid #c9ceef;background:#f4f6ff;border-radius:12px;padding:12px;margin-top:8px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">' +
        '<h4 style="margin:0;font-size:13px;font-weight:900;color:#0a1e8a">📁 Backups na nuvem</h4>' +
        '<small id="bk-contador" style="color:#64748b;font-weight:800">...</small>' +
      '</div>' +
      '<small style="color:#475569;display:block;margin-top:2px">📁 <b>Backup diario</b>: todo dia às <b>18:30</b> sozinho • 📁 <b>Backup atualizações</b>: sozinho a cada <b>atualização</b>, com a foto da versão anterior • 📁 <b>Backup manual</b>: quando você apertar aqui embaixo. Guarda tudo compactado dentro da nuvem, em tabela só de backups.</small>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' +
        '<button type="button" id="bk-atualizar" style="' + estiloBtn(false) + '">🔄 Atualizar</button>' +
        '<button type="button" id="bk-agora" style="' + estiloBtn(false) + '">📸 Backup agora</button>' +
        '<button type="button" id="bk-baixar-todos" style="' + estiloBtn(true) + '">📥 Baixar todos os backups</button>' +
        '<button type="button" id="bk-excluir-todos" style="' + estiloBtn(false) + ';color:#b91c1c;border-color:#fecaca">🗑️ Excluir backups</button>' +
      '</div>' +
      '<div id="bk-aviso" style="margin-top:10px"></div>' +
      '<div id="bk-lista" style="display:flex;flex-direction:column;gap:6px;margin-top:10px;max-height:260px;overflow:auto"></div>' +
    '</div>';

  const btnB = card.querySelector('#bk-baixar-todos');
  const btnE = card.querySelector('#bk-excluir-todos');
  const avisoEl = card.querySelector('#bk-aviso');
  card.querySelector('#bk-atualizar').onclick = function(){ carregar(card); };
  card.querySelector('#bk-agora').onclick = async function(){
    aviso(avisoEl, 'Fazendo foto completa agora... aguarde.', 'info');
    try{
      const r = await backupAgora();
      aviso(avisoEl, '✅ Backup feito na hora: <b>' + (r && r.backup || '').replace(/</g, '&lt;') + '</b> (' + (r && r.registros || 0) + ' registros).', 'ok');
    }catch(e){ aviso(avisoEl, traduzErro(e), 'erro'); }
    finally{ carregar(card); }
  };
  btnB.onclick = async function(){
    try{ await baixarTodos(avisoEl, btnB); }catch(e){ aviso(avisoEl, traduzErro(e), 'erro'); }
    finally{ btnB.innerText = '📥 Baixar todos os backups'; carregar(card); }
  };
  btnE.onclick = async function(){
    try{ await excluirTodos(avisoEl); }catch(e){ aviso(avisoEl, traduzErro(e), 'erro'); }
    finally{ carregar(card); }
  };
  carregar(card);
}

window.DIGICOPY_BACKUPS = { abrir: abrir, _montarZip: montarZip, _crc32: crc32 };
console.log('[DIGICOPY] backups na nuvem v5.22.96 carregado');
})();
