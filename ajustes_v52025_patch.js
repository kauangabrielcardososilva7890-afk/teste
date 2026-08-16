// ═════════════════════════════════════════════════
// PATCH v5.20.25 — Usuários fixos + dados "invisíveis" + diagnóstico
//
// 1) USUÁRIOS FIXOS (só estes 4 existem no sistema):
//      • kauan     — Admin       (senha 6132)
//      • denivaldo — Dono        (senha 3232)
//      • katia     — Funcionário (senha 4141)
//      • recepcao  — Funcionário (senha 5151)
//    Qualquer outro usuário é removido em toda carga. Senha/nome de quem já
//    existe é PRESERVADO (só cria quem falta) — assim ninguém perde o login.
//
// 2) DADOS "SUMIDOS" (correção do bug que deixava tudo em branco):
//    As telas filtram por `empresaId`. Registros importados sem empresaId, ou
//    com empresaId de uma sessão antiga, ficavam INVISÍVEIS mesmo estando
//    salvos. O seedData só corrigia quem já tinha empresaId preenchido
//    (`if(r.empresaId && r.empresaId !== emp.id)`), deixando os vazios de fora.
//    Aqui: todo registro sem empresaId ADOTA a empresa real, e a sessão ativa
//    é realinhada à empresa real. Nada é apagado — só volta a aparecer.
//
// 3) DIAGNÓSTICO: digite  diagDados()  no console (F12) para ver o que existe
//    de fato no armazenamento deste navegador/domínio.
// ═════════════════════════════════════════════════
(function(){
'use strict';

function txt(v){ return String(v == null ? '' : v).trim(); }
function fold(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function temDb(){ return typeof db !== 'undefined' && db && typeof db === 'object'; }

// ─────────────────────────────────────────────────
// Lógica pura (testável, sem DOM)
// ─────────────────────────────────────────────────

// Os 4 usuários oficiais do sistema. Perfis existentes: Admin, Dono, Funcionário.
var USUARIOS_FIXOS = [
  {id:'usr_kauan',     login:'kauan',     nome:'Kauan',     perfil:'Admin',       senha:'6132'},
  {id:'usr_denivaldo', login:'denivaldo', nome:'Denivaldo', perfil:'Dono',        senha:'3232'},
  {id:'usr_katia',     login:'katia',     nome:'Katia',     perfil:'Funcionário', senha:'4141'},
  {id:'usr_recepcao',  login:'recepcao',  nome:'Recepção',  perfil:'Funcionário', senha:'5151'}
];

// Entidades de negócio que são filtradas por empresaId nas telas.
var ENTIDADES_NEGOCIO = ['clientes','produtos','equipamentos','contratos','parque','leituras',
                         'os','vendas','contasReceber','contasPagar','notificacoes','tecnicos'];

// Reconcilia a lista de usuários: mantém só os fixos, preservando dados de
// quem já existe. Retorna {usuarios, criados, removidos}.
function reconciliarUsuarios(lista, empresaId){
  var atuais = Array.isArray(lista) ? lista : [];
  var oficiais = {};
  USUARIOS_FIXOS.forEach(function(f){ oficiais[f.login] = f; });

  var resultado = [];
  var jaVistos = {};
  var removidos = [];

  atuais.forEach(function(u){
    var l = fold(u && u.login);
    var fixo = oficiais[l];
    if(!fixo || jaVistos[l]){ removidos.push(txt(u && u.login) || '(sem login)'); return; }
    jaVistos[l] = true;
    // Preserva senha/nome que o usuário já tenha ajustado; só corrige o essencial.
    resultado.push({
      id: fixo.id,
      empresaId: empresaId,
      nome: txt(u.nome) || fixo.nome,
      login: fixo.login,
      senha: txt(u.senha) || fixo.senha,
      perfil: fixo.perfil,
      ativo: true,
      criadoEm: u.criadoEm || new Date().toISOString(),
      criadoPor: u.criadoPor || 'sistema'
    });
  });

  var criados = [];
  USUARIOS_FIXOS.forEach(function(f){
    if(jaVistos[f.login]) return;
    criados.push(f.login);
    resultado.push({
      id:f.id, empresaId:empresaId, nome:f.nome, login:f.login, senha:f.senha,
      perfil:f.perfil, ativo:true, criadoEm:new Date().toISOString(), criadoPor:'sistema'
    });
  });

  // Ordem estável: Admin, Dono, depois funcionários.
  var ordem = {};
  USUARIOS_FIXOS.forEach(function(f,i){ ordem[f.login] = i; });
  resultado.sort(function(a,b){ return (ordem[a.login]||0) - (ordem[b.login]||0); });

  return {usuarios: resultado, criados: criados, removidos: removidos};
}

// Faz registros órfãos (sem empresaId) adotarem a empresa real.
// NÃO apaga nada — apenas devolve visibilidade a dados já salvos.
function adotarOrfaos(banco, empresaId){
  var adotados = 0;
  if(!banco || !empresaId) return {adotados:0, porEntidade:{}};
  var porEntidade = {};
  ENTIDADES_NEGOCIO.forEach(function(k){
    var arr = banco[k];
    if(!Array.isArray(arr)) return;
    var n = 0;
    arr.forEach(function(r){
      if(!r || typeof r !== 'object') return;
      if(!txt(r.empresaId)){ r.empresaId = empresaId; n++; }
    });
    if(n > 0){ porEntidade[k] = n; adotados += n; }
  });
  return {adotados: adotados, porEntidade: porEntidade};
}

// A sessão salva aponta para a empresa certa? Se não, devolve a sessão corrigida.
function alinharSessao(sessao, empresaId, empresaNome){
  if(!sessao || !empresaId) return null;
  if(txt(sessao.empresaId) === txt(empresaId)) return null;
  var nova = {};
  Object.keys(sessao).forEach(function(k){ nova[k] = sessao[k]; });
  nova.empresaId = empresaId;
  if(empresaNome) nova.empresaNome = empresaNome;
  return nova;
}

// ─────────────────────────────────────────────────
// Aplicação
// ─────────────────────────────────────────────────
function aplicar(){
  if(!temDb()) return;
  if(!Array.isArray(db.empresas) || !db.empresas.length) return;

  var emp = db.empresas.find(function(e){ return e && e.id === 'emp_digicopy'; })
         || db.empresas.find(function(e){ return /digicopy/i.test(txt(e && (e.fantasia || e.nome))); })
         || db.empresas[0];
  if(!emp || !emp.id) return;

  var mudou = false;

  // 1) usuários fixos
  var rec = reconciliarUsuarios(db.usuarios, emp.id);
  var antes = JSON.stringify((db.usuarios || []).map(function(u){
    return [u.id, u.login, u.perfil, u.senha, u.ativo, u.empresaId].join('|');
  }).sort());
  var depois = JSON.stringify(rec.usuarios.map(function(u){
    return [u.id, u.login, u.perfil, u.senha, u.ativo, u.empresaId].join('|');
  }).sort());
  if(antes !== depois){ db.usuarios = rec.usuarios; mudou = true; }

  // 2) registros órfãos voltam a aparecer
  var ado = adotarOrfaos(db, emp.id);
  if(ado.adotados > 0){
    mudou = true;
    console.log('[DIGICOPY v5.20.25] ' + ado.adotados + ' registro(s) sem empresa foram vinculados e voltaram a aparecer:', ado.porEntidade);
  }

  // 3) sessão ativa alinhada à empresa real
  try{
    if(typeof getSession === 'function' && typeof setSession === 'function'){
      var nova = alinharSessao(getSession(), emp.id, emp.fantasia || emp.nome);
      if(nova){
        setSession(nova);
        console.log('[DIGICOPY v5.20.25] Sessão realinhada à empresa real — os dados voltam a aparecer.');
      }
    }
  }catch(e){ /* sessão ilegível: ignora */ }

  if(mudou && typeof saveDB === 'function'){
    try{ saveDB(); }catch(e){ console.warn('[DIGICOPY v5.20.25] falha ao salvar:', e); }
  }
}

// ─────────────────────────────────────────────────
// diagDados() — diagnóstico no console (F12)
// ─────────────────────────────────────────────────
window.diagDados = function(){
  var linhas = [];
  linhas.push('═══ DIAGNÓSTICO DIGICOPY ═══');
  linhas.push('Endereço : ' + location.origin);
  linhas.push('Modo     : ' + (function(){
    try{ localStorage.setItem('__t','1'); localStorage.removeItem('__t'); return 'normal (grava dados)'; }
    catch(e){ return 'ANÔNIMO/BLOQUEADO (não grava!)'; }
  })());

  var chaves = [];
  try{ chaves = Object.keys(localStorage).filter(function(k){ return k.indexOf('digicopy') >= 0; }); }catch(e){}
  linhas.push('Chaves   : ' + chaves.length + ' encontrada(s) neste endereço');

  var total = 0;
  chaves.forEach(function(k){
    var v = '';
    try{ v = localStorage.getItem(k) || ''; }catch(e){}
    total += v.length;
  });
  linhas.push('Tamanho  : ' + (total/1024).toFixed(1) + ' KB guardados');

  if(temDb()){
    linhas.push('─── Registros carregados na memória ───');
    ['clientes','produtos','vendas','os','contratos','contasReceber','usuarios'].forEach(function(k){
      var arr = db[k];
      linhas.push('  ' + k.padEnd(14) + ': ' + (Array.isArray(arr) ? arr.length : 0));
    });
    var s = (typeof getSession === 'function') ? getSession() : null;
    var empIds = (db.empresas || []).map(function(e){ return e.id; }).join(', ');
    linhas.push('Empresa(s) no banco : ' + (empIds || 'nenhuma'));
    linhas.push('Empresa da sessão   : ' + (s ? s.empresaId : 'sem login'));
    if(s && empIds && empIds.indexOf(s.empresaId) < 0){
      linhas.push('  >>> ATENÇÃO: sessão aponta pra empresa que não existe. Saia e entre de novo.');
    }
    var semEmp = 0;
    (db.clientes || []).forEach(function(c){ if(!txt(c && c.empresaId)) semEmp++; });
    if(semEmp) linhas.push('  >>> ' + semEmp + ' cliente(s) sem empresa vinculada.');
  }

  if(chaves.length === 0){
    linhas.push('');
    linhas.push('RESULTADO: este endereço NUNCA teve dados salvos.');
    linhas.push('Os dados estão em outro endereço (outro link/domínio) ou no app instalado.');
  }
  var texto = linhas.join('\n');
  console.log(texto);
  return texto;
};

// Roda agora (db já foi carregado pelo app.js) e de novo no DOM pronto.
aplicar();
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', aplicar);
}

// Exporta a lógica pura para os testes.
window.AJUSTES_V52025_PURE = {
  USUARIOS_FIXOS: USUARIOS_FIXOS,
  ENTIDADES_NEGOCIO: ENTIDADES_NEGOCIO,
  reconciliarUsuarios: reconciliarUsuarios,
  adotarOrfaos: adotarOrfaos,
  alinharSessao: alinharSessao
};

})();
console.log('[DIGICOPY] PATCH ajustes_v52025_patch.js v5.20.25 — 4 usuários fixos, dados órfãos recuperados, diagDados()');
