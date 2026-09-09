// ═══════════════════════════════════════════════════════════════════════════
// AJUSTES v5.22.103 — Menu BACKUP próprio (não dentro da Nuvem):
// o botão Backup abre a TELA NORMAL "Backup do sistema" (igual às outras
// abas, nada de gaveta voadora) com os 3 botões diretos dentro:
// 📸 Backup manual (faz os dois), 📥 Baixar todo histórico,
// 🗑️ Excluir o histórico + seção do backup clássico do PC.
// ═══════════════════════════════════════════════════════════════════════════
// Em "Nuvem" há agora um card "Backups na nuvem" com:
//   • a lista do que a nuvem guardou, separado nas pastas:
//       📁 Backup diario (todo dia 18:30 sozinho)
//       📁 Backup atualizações (sozinho a cada versão nova, foto da anterior)
//       📁 Backup manual (botão 📸 Backup manual — faz os dois: guarda na nuvem e baixa no PC);
//   • 📥 Baixar todos os backups (um .zip pronto pra guardar no HD externo);
//   • 🗑️ Excluir os backups (apaga SÓ os backups da nuvem — os dados do
//     sistema nunca, e o ciclo continua: amanhã 18:30 sai outro diário).
// O card só aparece para o aparelho/usuário administrador (mesmo lugar dos
// outros botões de administração da nuvem) e já abre sozinho, de cara, com:
//   • último backup de TUDO;
//   • último de cada modalidade (diário / atualizações / manual);
//   • quanto falta pro próximo diário — tempo CONGELADO na abertura da
//     janela (nada de reloginho rodando sem parar: PC da loja não sofre).
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

function escap(v){ return String(v == null ? '' : v).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function aviso(el, texto, cor){
  if(!el) return;
  el.innerHTML = '<div class="bk-msg bk-msg-' + cor + '" style="padding:10px 12px;border-radius:10px;font-size:12px;font-weight:700;background:' +
    (cor === 'erro' ? '#fef2f2' : cor === 'ok' ? '#ecfdf5' : '#eff6ff') +
    ';color:' + (cor === 'erro' ? '#991b1b' : cor === 'ok' ? '#047857' : '#1d4ed8') +
    ';border:1px solid ' + (cor === 'erro' ? '#fecaca' : cor === 'ok' ? '#a7f3d0' : '#bfdbfe') + '">' + texto + '</div>';
}

function traduzErro(e){
  const codigo = e && (e.code || '') + '|' + (e.message || '');
  if(codigo.indexOf('404') >= 0 || codigo.indexOf('HTML') >= 0)
    return 'O servidor da nuvem é antigo e ainda não tem a função de backups. Rode "npx wrangler deploy" na pasta cloudflare-worker (veja o README da nuvem).';
  if(codigo.indexOf('ADMIN') >= 0 || codigo.indexOf('403') >= 0)
    return 'Seu USUÁRIO não tem cargo Admin no sistema. A partir da v5.24.1 o que vale é o usuário (não o aparelho): entre com Kauan (Admin) ou Denivaldo (Dono) em qualquer computador para ver, baixar ou apagar backups.';
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
// v5.24.1 — cargo do USUÁRIO logado (Admin/Dono = permissão total no sistema).
function usuarioAtualEhAdminBackup(){
  try{
    const sess=(typeof getSession==='function')?getSession():null;
    if(!sess) return false;
    const cargo=String(sess.perfil||'').trim().toLowerCase();
    if(cargo==='admin'||cargo==='dono') return true;
    // sessão pode ser mais velha que o cadastro (trocaram o cargo depois do login)
    const u=((typeof db!=='undefined'&&db.usuarios)||[]).find(function(x){return x&&x.id===sess.usuarioId;});
    const cargo2=String((u&&u.perfil)||'').trim().toLowerCase();
    return cargo2==='admin'||cargo2==='dono';
  }catch(e){ return false; }
}
// Prova do usuário para o download direto abaixo (fetch cru; os outros
// endpoints passam pelo api() global, que já anexa a prova desde a v5.24.1).
async function bkCabUsuario(){
  try{
    const sess=(typeof getSession==='function')?getSession():null;
    if(!sess||!sess.login) return {};
    const u=((typeof db!=='undefined'&&db.usuarios)||[]).find(function(x){return x&&String(x.login||'').toLowerCase()===String(sess.login).toLowerCase();});
    if(!u||!u.senha||typeof crypto==='undefined'||!crypto.subtle) return {};
    const dados=new TextEncoder().encode(String(sess.login).toLowerCase()+'|'+String(u.senha));
    const digest=await crypto.subtle.digest('SHA-256',dados);
    const prova=Array.from(new Uint8Array(digest),function(b){return b.toString(16).padStart(2,'0');}).join('');
    return {'x-digicopy-usuario-login':String(sess.login).toLowerCase(),'x-digicopy-usuario-prova':prova};
  }catch(e){ return {}; }
}

async function baixarUmBackup(chave){
  const call = api(); if(!call) throw new Error('API da nuvem não carregada.');
  const cabUsuario = await bkCabUsuario();
  const resp = await fetch(window.DIGICOPY_CLOUD.API + '/v1/backup?key=' + encodeURIComponent(chave), {
    headers: Object.assign({ authorization: 'Bearer ' + window.DIGICOPY_CLOUD.token() }, cabUsuario)
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

// ─── Resumo (últimos + contagem CONGELADA na abertura da janela) ───────────
// Nada de setInterval: o tempo até o próximo diário é calculado UMA vez,
// no momento em que a janela da Nuvem é aberta — PC da loja não sofre.
function horaSPde(ms){ // retorna {dia, mes, ano, hora, min} no horário de São Paulo
  const partes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(new Date(ms));
  const o = {};
  partes.forEach(function(p){ if(p.type !== 'literal') o[p.type] = parseInt(p.value, 10); });
  return { dia: o.day, mes: o.month, ano: o.year, hora: o.hour % 24, min: o.minute };
}
const ALVO_DIARIO_HORA_UTC = 21, ALVO_DIARIO_MIN_UTC = 30; // 18:30 SP = 21:30 UTC (Brasil sem horário de verão)

function proximaDiaria(ms){
  // Próxima 18:30 de São Paulo: hoje se ainda não passou, senão amanhã.
  const hoje = horaSPde(ms);
  let alvo = Date.UTC(hoje.ano, hoje.mes - 1, hoje.dia, ALVO_DIARIO_HORA_UTC, ALVO_DIARIO_MIN_UTC);
  let ehHoje = true;
  if (ms >= alvo){ alvo += 86400000; ehHoje = false; }
  const falta = alvo - ms;
  const faltamH = Math.floor(falta / 3600000);
  const faltamM = Math.floor((falta % 3600000) / 60000);
  return {
    ehHoje: ehHoje,
    alvoMs: alvo,
    faltaTexto: faltamH > 0 ? (faltamH + 'h ' + String(faltamM).padStart(2, '0') + 'min') : (faltamM + ' min'),
    alvoSP: horaSPde(alvo)
  };
}

function rotuloDataHora(iso){
  if(!iso) return '—';
  try{
    const ms = new Date(iso).getTime();
    const sp = horaSPde(ms);
    return pad2(sp.dia) + '/' + pad2(sp.mes) + ' ' + pad2(sp.hora) + 'h' + pad2(sp.min);
  }catch(e){ return dataBR(iso); }
}
function pad2(n){ return String(n).padStart(2, '0'); }

function linhaResumo(titulo, valor, vazio){
  return '<div style="display:flex;gap:6px;font-size:11px;line-height:1.55">' +
    '<span style="min-width:118px;font-weight:900;color:#334155">' + titulo + '</span>' +
    '<span style="color:' + (vazio ? '#94a3b8' : '#1e293b') + ';font-weight:700">' + (valor || vazio) + '</span></div>';
}

function preencherResumo(card, itens){
  const box = card.querySelector('#bk-resumo'); if(!box) return;
  const porPasta = {};
  itens.forEach(function(b){ const p = b.pasta || ''; if(!porPasta[p]) porPasta[p] = b; }); // já vem do mais novo pro mais velho
  const ultimo = itens[0];
  const prox = proximaDiaria(Date.now());
  let h = '<div style="background:#fff;border:1px solid #dbe3f5;border-radius:10px;padding:10px 12px">';
  h += linhaResumo('🕐 Último backup:', ultimo
    ? '<b>' + ultimo.nome.replace(/</g,'&lt;') + '</b> • ' + rotuloDataHora(ultimo.geradoEm) + ' • ' + tamanhoBR(ultimo.tamanho)
    : null, 'nenhum ainda');
  h += linhaResumo('📁 Último DIÁRIO:', porPasta['Backup diario']
    ? '<b>' + porPasta['Backup diario'].nome.replace(/</g,'&lt;') + '</b> • ' + rotuloDataHora(porPasta['Backup diario'].geradoEm)
    : null, 'o primeiro sai sozinho 18:30');
  h += linhaResumo('📁 Último ATUALIZAÇÃO:', porPasta['Backup atualizações']
    ? '<b>' + porPasta['Backup atualizações'].nome.replace(/</g,'&lt;') + '</b> • ' + rotuloDataHora(porPasta['Backup atualizações'].geradoEm)
    : null, 'sai sozinho quando subir versão nova');
  h += linhaResumo('📁 Último MANUAL:', porPasta['Backup manual']
    ? '<b>' + porPasta['Backup manual'].nome.replace(/</g,'&lt;') + '</b> • ' + rotuloDataHora(porPasta['Backup manual'].geradoEm)
    : null, 'aperta 📸 Backup agora pra fazer');
  h += '<div style="border-top:1px dashed #dbe3f5;margin:7px 0"></div>';
  h += linhaResumo('⏳ Próximo diário:',
    '<b>' + (prox.ehHoje ? 'hoje' : 'amanhã') + ' às 18:30</b> — faltam <b>' + prox.faltaTexto + '</b>');
  h += '<div style="font-size:10px;color:#94a3b8;margin-top:3px">tempo contado quando esta janela abriu — não fica atualizando sozinho; reabra pra atualizar.</div>';
  h += '</div>';
  box.innerHTML = h;
}

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
    preencherResumo(card, itens);
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
  // v5.24.1 — backup da nuvem depende do USUÁRIO (cargo Admin/Dono), não do
  // aparelho. Sem cargo, a seção da nuvem mostra o cadeado e nem chama a API;
  // a restauração por arquivo (seção de baixo) continua liberada para todos.
  if(!usuarioAtualEhAdminBackup()){
    card.innerHTML =
      '<div class="bk-card" style="border:1px solid #fecaca;background:#fef2f2;border-radius:12px;padding:14px;margin-top:8px">' +
        '<b style="color:#b91c1c">🔒 Backups da nuvem: só usuário com cargo Admin</b>' +
        '<small class="bk-note" style="color:#7f1d1d;display:block;margin-top:6px">Entre no sistema com Kauan (Admin) ou Denivaldo (Dono) — em QUALQUER computador — para ver, baixar ou apagar os backups da nuvem. A restauração por arquivo, logo abaixo, continua liberada.</small>' +
      '</div>';
    return;
  }
  card.innerHTML =
    '<div class="bk-card" style="border:1px solid #c9ceef;background:#f4f6ff;border-radius:12px;padding:12px;margin-top:8px">' +
      '<small class="bk-note" style="color:#475569;display:block;margin-top:2px">📁 <b>Backup diario</b>: todo dia às <b>18:30</b> sozinho • 📁 <b>Backup atualizações</b>: sozinho a cada <b>atualização</b>, com a foto da versão anterior • 📁 <b>Backup manual</b>: quando você apertar aqui embaixo. Guarda tudo compactado dentro da nuvem, em tabela só de backups. <b id="bk-contador"></b></small>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' +
        '<button type="button" id="bk-agora" style="' + estiloBtn(true) + '">📸 Backup manual (nuvem + baixa no PC)</button>' +
        '<button type="button" id="bk-baixar-todos" style="' + estiloBtn(false) + '">📥 Baixar todos os backups (.zip)</button>' +
        '<button type="button" id="bk-excluir-todos" style="' + estiloBtn(false) + ';color:#b91c1c;border-color:#fecaca">🗑️ Excluir todos os backups da nuvem</button>' +
      '</div>' +
      '<div id="bk-resumo" style="margin-top:10px"></div>' +
      '<div id="bk-aviso" style="margin-top:10px"></div>' +
      '<div id="bk-lista" style="display:flex;flex-direction:column;gap:6px;margin-top:10px;max-height:260px;overflow:auto"></div>' +
    '</div>';

  const btnB = card.querySelector('#bk-baixar-todos');
  const btnE = card.querySelector('#bk-excluir-todos');
  const avisoEl = card.querySelector('#bk-aviso');
  card.querySelector('#bk-agora').onclick = async function(){
    const b = this;
    await acaoBackupManual(b, card);
    carregar(card);
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

// ─── Menu lateral BACKUP: abre a TELA NORMAL "Backup do sistema" ───────────
// (igual às outras abas — nada de gaveta/dropdown bugado por cima da tela).
// v5.23.2 — RESTAURAR backup: volta a valer dentro da aba (modo seguro)
const LISTAS_DB = ['clientes','produtos','recargas','equipamentos','contratos','parque','leituras','os','vendas','orcamentos','contasReceber','contasPagar','logs'];
function ehFormatoBackup(obj){
  if(!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
  const listas = LISTAS_DB.filter(k => Array.isArray(obj[k]));
  if(listas.length < 3) return null; // backup de verdade traz várias listas
  return listas;
}
function resumoBackup(obj, listas){
  return listas.map(k => k + ': ' + obj[k].length).join('  •  ');
}
function preencherBanco(obj, modo){ // modo: 'substituir' (exato como o arquivo) | 'somar' (junta sem apagar)
  if(typeof db === 'undefined' || !db) throw new Error('Banco local não carregado.');
  const listas = LISTAS_DB.filter(k => Array.isArray(obj[k]));
  if(modo === 'substituir'){
    listas.forEach(k => { db[k] = obj[k].map(x => Object.assign({}, x)); });
  }else{
    listas.forEach(k => {
      if(!Array.isArray(db[k])) db[k] = [];
      const ja = new Set(db[k].map(x => x && x.id).filter(Boolean));
      obj[k].forEach(x => {
        if(x && x.id && ja.has(x.id)){ // mesmo id: o do backup entra só se for mais novo
          const alvo = db[k].find(y => y && y.id === x.id);
          if(alvo && String(x.atualizadoEm || x.criadoEm || '') > String(alvo.atualizadoEm || alvo.criadoEm || '')) Object.assign(alvo, x);
        }else db[k].push(Object.assign({}, x));
      });
    });
  }
  if(typeof saveDB === 'function') saveDB();
  if(typeof window.renderApp === 'function') try{ window.renderApp(); }catch(e){}
}
function lerArquivoJSON(inp){
  const f = inp && inp.files && inp.files[0];
  if(!f) return;
  const leitor = new FileReader();
  leitor.onload = function(){
    const caixa = document.getElementById('bk-rest-prev');
    try{
      const obj = JSON.parse(String(leitor.result || ''));
      const listas = ehFormatoBackup(obj);
      if(!listas){ caixa.innerHTML = '<div style="color:#b91c1c;font-size:12px;font-weight:700">Esse arquivo não é um backup do Digicopy (não achei as listas de dados).</div>'; window.__bkRestaurar = null; return; }
      window.__bkRestaurar = obj;
      caixa.innerHTML = '<div style="font-size:12px;color:#166534;font-weight:800">✅ Backup reconhecido (' + escap(f.name) + ')</div>' +
        '<div style="font-size:11px;color:#475569;margin-top:3px">' + escap(resumoBackup(obj, listas)) + '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">' +
        '<button type="button" id="bk-rest-substituir" style="' + estiloBtn(true) + '">🔄 Substitui tudo (fica exato como o backup)</button>' +
        '<button type="button" id="bk-rest-somar" style="' + estiloBtn(false) + '">➕ Soma nos dados (não apaga nada)</button></div>';
      caixa.querySelector('#bk-rest-substituir').onclick = function(){ confirmarRestauracao('substituir'); };
      caixa.querySelector('#bk-rest-somar').onclick = function(){ confirmarRestauracao('somar'); };
    }catch(e){ caixa.innerHTML = '<div style="color:#b91c1c;font-size:12px;font-weight:700">Arquivo inválido: ' + escap(e && e.message || e) + '</div>'; window.__bkRestaurar = null; }
  };
  leitor.readAsText(f);
}
async function confirmarRestauracao(modo){
  const obj = window.__bkRestaurar;
  if(!obj) return;
  const perg = modo === 'substituir'
    ? 'Isso SUBSTITUI todos os dados deste PC pelos dados do backup. O que estiver aqui e não estiver no backup some deste PC. Continuar?'
    : 'Isso SOMA os dados do backup nos dados deste PC (linhas com o mesmo código são atualizadas se o backup for mais novo). Continuar?';
  const ok = typeof window.confirmSistema === 'function' ? await window.confirmSistema(perg, 'Restaurar backup') : true;
  if(!ok) return;
  try{
    preencherBanco(obj, modo);
    if(typeof toast === 'function') toast(modo === 'substituir' ? 'Backup restaurado: o PC ficou exato como o arquivo ✔' : 'Backup somado aos dados ✔', 'success');
    const caixa = document.getElementById('bk-rest-prev'); if(caixa) caixa.innerHTML = '';
    const inp = document.getElementById('bk-rest-arq'); if(inp) inp.value = '';
    window.__bkRestaurar = null;
  }catch(e){ window.lfbAlert && window.lfbAlert('Falha ao restaurar: ' + (e && e.message || e), 'Restaurar backup'); }
}

// v5.23.6 — modal próprio garantido. No bundle final, cada patch vai dentro de
// um bloco try{} do isolamento: declarações "function setModal" dos outros
// patches ficam PRESAS no bloco e nunca viram globais. Resultado real: o botão
// do menu Backup chamava abrirTelaBackup, que caía no fallback chamando
// window.exportBackup — que desde a 5.23.2 É o próprio abrirTelaBackup →
// recursão infinita, engolida pelo try/catch da captura → "botão clicável que
// não faz nada". Agora a tela usa o esqueleto de modal nativo do app
// (#modal-root) e, se nem isso existir, cria um overlay próprio.
function bkSetModal(titulo, corpo, rodape, max){
  const raiz = document.getElementById('modal-root');
  if(raiz){
    const box = document.getElementById('modal-box');
    if(box) box.className = 'w-full max-w-[' + (max || '940px') + '] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[94vh] flex flex-col';
    const t = document.getElementById('modal-title'); if(t) t.innerText = titulo;
    const b = document.getElementById('modal-body'); if(b) b.innerHTML = corpo;
    const f = document.getElementById('modal-footer'); if(f) f.innerHTML = rodape || '';
    raiz.classList.remove('hidden');
    return true;
  }
  let ov = document.getElementById('bk-overlay');
  if(!ov){
    ov = document.createElement('div'); ov.id = 'bk-overlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
    ov.innerHTML = '<div style="background:#fff;border-radius:18px;max-width:' + (max || '940px') + ';width:100%;max-height:94vh;overflow:auto;box-shadow:0 25px 60px rgba(0,0,0,.35)"><div style="display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid #e2e8f0"><b class="bk-ov-t" style="font-size:15px"></b><button type="button" class="bk-ov-x" style="font-size:18px;line-height:1;padding:4px 10px">✕</button></div><div class="bk-ov-b" style="padding:16px 18px"></div><div class="bk-ov-f" style="padding:12px 18px;border-top:1px solid #e2e8f0;text-align:right"></div></div>';
    ov.querySelector('.bk-ov-x').onclick = function(){ window.bkFecharTelaBackup(); };
    ov.onclick = function(ev){ if(ev.target === ov) window.bkFecharTelaBackup(); };
    document.body.appendChild(ov);
  }
  ov.querySelector('.bk-ov-t').innerText = titulo;
  ov.querySelector('.bk-ov-b').innerHTML = corpo;
  ov.querySelector('.bk-ov-f').innerHTML = rodape || '';
  ov.style.display = 'flex';
  return true;
}
window.bkFecharTelaBackup = function(){
  const raiz = document.getElementById('modal-root'); if(raiz){ try{ raiz.classList.add('hidden'); }catch(e){} }
  const ov = document.getElementById('bk-overlay'); if(ov) ov.style.display = 'none';
};

// v5.23.7 — modo escuro da tela Backup: o conteúdo usa cores claras fixas
// (estilo inline). Como inline ganha de tudo, a regra escura precisa de
// !important — e só vale quando o app está em digi-escuro. Injetada UMA vez.
function garantirCssBk(){
  if(document.getElementById('bk-aba-css')) return;
  const s = document.createElement('style'); s.id = 'bk-aba-css';
  s.textContent = "html.digi-escuro .bk-aba div{background-color:transparent !important;border-color:#334155 !important}\nhtml.digi-escuro .bk-aba,html.digi-escuro .bk-aba b,html.digi-escuro .bk-aba p,html.digi-escuro .bk-aba span,html.digi-escuro .bk-aba small,html.digi-escuro .bk-aba h3,html.digi-escuro .bk-aba h4{color:#e2e8f0 !important}\nhtml.digi-escuro .bk-intro{color:#cbd5e1 !important}\nhtml.digi-escuro .bk-sec{background:#1e293b !important;border-color:#334155 !important}\nhtml.digi-escuro .bk-sec-head{background:#0f172a !important;color:#93c5fd !important}\nhtml.digi-escuro .bk-sec-head .bk-sub{color:#94a3b8 !important}\nhtml.digi-escuro .bk-card{background:#16203a !important;border-color:#334155 !important}\nhtml.digi-escuro .bk-card h4{color:#93c5fd !important}\nhtml.digi-escuro .bk-card small{color:#94a3b8 !important}\nhtml.digi-escuro .bk-note{color:#94a3b8 !important}\nhtml.digi-escuro .bk-title{color:#e2e8f0 !important}\nhtml.digi-escuro .bk-dashed{border-color:#475569 !important}\nhtml.digi-escuro .bk-msg-erro{background:rgba(220,38,38,.16) !important;color:#fca5a5 !important;border-color:#7f1d1d !important}\nhtml.digi-escuro .bk-msg-ok{background:rgba(16,185,129,.14) !important;color:#6ee7b7 !important;border-color:#065f46 !important}\nhtml.digi-escuro .bk-msg-info{background:rgba(59,130,246,.15) !important;color:#93c5fd !important;border-color:#1e3a8a !important}";
  document.head.appendChild(s);
}

function abrirTelaBackup(){
  garantirCssBk();
  bkSetModal('Backup do sistema',
    '<div class="bk-aba"><div class="bk-intro" style="font-size:12px;color:#475569;margin-bottom:12px">São <b>3 jeitos</b> de guardar seus dados: 📸 <b>manual</b> (aperta o botão — salva na nuvem E baixa no PC), 📁 <b>diário</b> (sozinho, todo dia <b>18:30</b>) e 📁 <b>a cada atualização</b> (sozinho, foto da versão anterior). Tudo fica na nuvem, organizado em pastas.</div>' +
    '<div class="bk-sec" style="border:1px solid #c9ceef;border-radius:12px;padding:0 0 4px;overflow:hidden">' +
      '<div class="bk-sec-head" style="background:#eef1ff;padding:8px 12px;font-weight:900;font-size:13px;color:#0a1e8a">☁️ Backups na nuvem <small class="bk-sub" style="color:#64748b;font-weight:700">(sozinha, com PC desligado)</small></div>' +
      '<div style="padding:4px 12px 10px"><div id="dc-backups"></div></div>' +
    '</div>' +
    // v5.24.0 — o "💾 Baixar backup para este PC" (manual SÓ local, que não ia
    // pra nuvem) foi REMOVIDO a pedido do dono: era o botão duplicado. Ficam os
    // 3 da nuvem (📸 manual nuvem+PC, 📥 .zip de todos, 🗑️ excluir todos) e,
    // aqui embaixo, só a RESTAURAÇÃO a partir de arquivo — a porta de entrada
    // dos dados, que nunca pode sumir.
    '<div class="bk-sec" style="border:1px solid #e2e8f0;border-radius:12px;margin-top:12px;overflow:hidden">' +
      '<div class="bk-sec-head" style="background:#f8fafc;padding:8px 12px;font-weight:900;font-size:13px;color:#334155">📥 Restaurar a partir de um arquivo de backup</div>' +
      '<div style="padding:12px">' +
        '<div style="margin-top:2px"><input type="file" id="bk-rest-arq" accept=".json,application/json" style="font-size:12px"></div>' +
        '<div id="bk-rest-prev" style="margin-top:6px"></div>' +
        '<small class="bk-note" style="color:#64748b">Escolha aqui um arquivo de backup baixado antes (o manual .json ou o conteúdo do .zip) para restaurar os dados neste computador.</small>' +
      '</div>' +
    '</div>' + '</div>',
    '<button type="button" onclick="bkFecharTelaBackup()" class="h-10 px-6 rounded-xl bg-white border font-bold">Fechar</button>', '940px');
  const restInp = document.getElementById('bk-rest-arq');
  if(restInp) restInp.onchange = function(){ lerArquivoJSON(restInp); };
  const raiz = document.getElementById('modal-box') || document.body;
  setTimeout(function(){ try{ abrir(raiz); }catch(e){} }, 60);
  // v5.23.4 — dono pediu: medir o uso oficial quando ELE abre o menu (sem cronômetro)
  if(typeof window.DC_chamarMedidorOficial === 'function'){ try{ window.DC_chamarMedidorOficial(); }catch(e){} }
}

// 📸 Backup manual — FAZ OS DOIS: guarda na nuvem E já baixa no PC.
async function acaoBackupManual(btn, raiz){
  btn.innerText = '📸 fazendo...';
  btn.disabled = true;
  try{
    const r = await backupAgora(); // 1) guarda na pasta Backup manual da nuvem
    const chave = r && r.backup;
    if(typeof toast === 'function') toast('Backup guardado na nuvem ✔', 'success');
    try{
      const arq = await baixarUmBackup(chave); // 2) e já baixa pro PC
      baixarArquivo(arq.nome, new Blob([arq.bytes], { type: 'application/json' }));
      if(typeof toast === 'function') toast('E baixado neste PC também ✔', 'success');
    }catch(e){ window.lfbAlert && window.lfbAlert('Guardei na nuvem, mas o download falhou: ' + traduzErro(e), 'Backup manual'); }
  }catch(e){ window.lfbAlert && window.lfbAlert(traduzErro(e), 'Backup manual'); }
  finally{ btn.innerText = '📸 Backup manual (nuvem + baixa no PC)'; btn.disabled = false; }
}

window.abrirTelaBackup = abrirTelaBackup;

// v5.23.2 — o clássico separado do menu: baixar o JSON bruto ganhou nome próprio
// (window.exportarBackupJSON) e TODA chamada a exportBackup() abre esta aba.
// Assim qualquer pintura/personalização antiga do menu abre a tela certa.
if(typeof window.exportBackup === 'function' && !window.exportBackup.__v52302){
  const _exporJSON = window.exportBackup;
  if(!window.exportarBackupJSON) window.exportarBackupJSON = function(){ return _exporJSON.apply(this, arguments); };
  window.exportBackup = function(){ abrirTelaBackup(); };
  window.exportBackup.__v52302 = true;
}
if(typeof window.importBackup !== 'function' || !window.importBackup.__v52302){
  window.importBackup = function(){ abrirTelaBackup(); };
  window.importBackup.__v52302 = true;
}

// O botão Backup do menu lateral abre ESSA aba SEMPRE — interceptação por
// CAPTURA (document): mesmo que o menu seja re-pintado por outro trecho, o
// clique nunca mais cai no "baixar cópia" antigo (v5.22.102).
if(typeof document !== 'undefined' && !document.__v52301bkClick){
  document.addEventListener('click', function(ev){
    try{
      let alvo = ev.target && ev.target.closest ? ev.target.closest('#btn-backup-top') : null;
      if(!alvo){
        const b = ev.target && ev.target.closest ? ev.target.closest('button[onclick]') : null;
        if(b && /exportBackup\s*\(\s*\)/.test(b.getAttribute('onclick') || '')){
          // v5.23.1 — é menu se estiver no topo fixo OU dentro de um painel de menu
          const r = b.getBoundingClientRect ? b.getBoundingClientRect() : null;
          const noTopo = r && r.top < 90 && r.bottom > 0;
          const noMenu = b.closest('.module,.module-menu,.modern-topnav,.command-row,.topmod,[id^="menu-"],header,nav');
          if(noTopo || noMenu) alvo = b;
        }
      }
      if(!alvo){
        // v5.23.1 — botão re-pintado por outro sistema (título antigo ou texto "Backup" no topo)
        const b2 = ev.target && ev.target.closest ? ev.target.closest('button,a,[role="button"]') : null;
        if(b2){
          const titulo = (b2.getAttribute && b2.getAttribute('title')) || '';
          const rotulo = ((b2.textContent || '').trim() + ' ' + titulo).toLowerCase();
          const dentroDoTopo = b2.closest('.module,.module-menu,.modern-topnav,.command-row,.topmod,[id^="menu-"],header,nav');
          if(dentroDoTopo && /(^|\s)backup($|\s|c[oó]pia)/.test(rotulo)) alvo = b2;
        }
      }
      if(!alvo) return;
      ev.preventDefault(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    }catch(e){ return; }
    try{ abrirTelaBackup(); }catch(e){}
  }, true);
  document.__v52301bkClick = true;
}

function alternar(painelBody){
  const card = painelBody.querySelector('#dc-backups');
  if(!card) return;
  if(card.innerHTML && card.innerHTML.length > 0){ card.innerHTML = ''; return; }
  abrir(painelBody);
}

window.DIGICOPY_BACKUPS = { abrir: abrir, alternar: alternar, abrirTelaBackup: abrirTelaBackup, _montarZip: montarZip, _crc32: crc32, _proximaDiaria: proximaDiaria, _preencherResumo: preencherResumo };
console.log('[DIGICOPY] menu Backup (aba normal) carregado');
})();
