// ═════════════════════════════════════════════════
// PATCH v5.20.26 — Empresa única: fim dos dados invisíveis (correção definitiva)
//
// CAUSA RAIZ (o que as v5.20.25 e anteriores só remendavam):
// O sistema tem UMA empresa só, mas carrega 511 filtros `x.empresaId === s.empresaId`
// espalhados pelas telas — herança de um projeto multi-empresa que nunca existiu aqui.
// Toda vez que um empresaId destoava (import sem empresa, sessão antiga, base
// recriada com id novo), a tela filtrava tudo fora e a base "sumia".
// Remendar registro por registro, a cada versão, é enxugar gelo.
//
// SOLUÇÃO: uma única fonte de verdade. `EMPRESA_ID` fixo, tudo é normalizado
// para ele na carga, e a sessão nasce/permanece nele. Independente de qual
// usuário logar, o histórico (vendas, contratos, OS, clientes) é O MESMO.
//
// TAMBÉM: mata a criação automática de usuários a partir de db.tecnicos
// (`importarFuncionariosComoUsuarios`, login_otimizacao_patch.js:60), que
// recriava logins com senha '123' a cada login/showApp — a real origem dos
// "usuários que voltam sozinhos".
// ═════════════════════════════════════════════════
(function(){
'use strict';

var EMPRESA_ID = 'emp_digicopy';

function txt(v){ return String(v == null ? '' : v).trim(); }
function fold(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function temDb(){ return typeof db !== 'undefined' && db && typeof db === 'object'; }

// Toda entidade que as telas filtram por empresa.
var ENTIDADES = ['clientes','produtos','equipamentos','contratos','parque','leituras','os',
                 'vendas','contasReceber','contasPagar','notificacoes','tecnicos','logs',
                 'orcamentos','compras','caixa','visitas','chamados','etiquetas','usuarios'];

// ─────────────────────────────────────────────────
// Lógica pura (testável)
// ─────────────────────────────────────────────────

// Unifica TODOS os registros sob a empresa única, seja qual for o empresaId
// anterior (vazio, antigo ou aleatório). Nada é apagado.
function unificarEmpresa(banco, empresaId){
  var total = 0, porEntidade = {};
  if(!banco || !empresaId) return {total:0, porEntidade:{}};
  ENTIDADES.forEach(function(k){
    var arr = banco[k];
    if(!Array.isArray(arr)) return;
    var n = 0;
    arr.forEach(function(r){
      if(!r || typeof r !== 'object') return;
      if(txt(r.empresaId) !== empresaId){ r.empresaId = empresaId; n++; }
    });
    if(n){ porEntidade[k] = n; total += n; }
  });
  return {total: total, porEntidade: porEntidade};
}

// Mantém exatamente uma empresa, preservando nome/CNPJ já cadastrados.
function unificarCadastroEmpresa(lista, empresaId){
  var arr = Array.isArray(lista) ? lista : [];
  var base = arr.find(function(e){ return e && e.id === empresaId; })
          || arr.find(function(e){ return /digicopy/i.test(txt(e && (e.fantasia || e.nome))); })
          || arr[0]
          || null;
  var emp = {
    id: empresaId,
    cnpj: txt(base && base.cnpj),
    cnpjDigits: txt(base && base.cnpjDigits),
    senha: txt(base && base.senha),
    nome: txt(base && base.nome) || 'DIGICOPY Cartuchos e Impressoras',
    fantasia: txt(base && base.fantasia) || 'DIGICOPY',
    criadoEm: (base && base.criadoEm) || new Date().toISOString(),
    criadoPor: (base && base.criadoPor) || 'sistema'
  };
  return {empresa: emp, removidas: Math.max(0, arr.length - 1)};
}

// A sessão SEMPRE aponta para a empresa única.
function normalizarSessao(sessao, empresa){
  if(!sessao || !empresa) return null;
  if(txt(sessao.empresaId) === empresa.id) return null;
  var nova = {};
  Object.keys(sessao).forEach(function(k){ nova[k] = sessao[k]; });
  nova.empresaId = empresa.id;
  nova.empresaNome = empresa.fantasia || empresa.nome;
  return nova;
}

// Técnico NUNCA vira usuário de login. São cadastros distintos.
function tecnicoNaoViraUsuario(){ return true; }

// ─────────────────────────────────────────────────
// Aplicação
// ─────────────────────────────────────────────────
function aplicar(origem){
  if(!temDb()) return;

  // 1) uma empresa só
  var u = unificarCadastroEmpresa(db.empresas, EMPRESA_ID);
  var precisaTrocar = !Array.isArray(db.empresas) || db.empresas.length !== 1
                   || txt(db.empresas[0] && db.empresas[0].id) !== EMPRESA_ID;
  if(precisaTrocar) db.empresas = [u.empresa];

  // 2) todo registro pertence a ela
  var res = unificarEmpresa(db, EMPRESA_ID);

  // 3) a sessão também
  var trocouSessao = false;
  try{
    if(typeof getSession === 'function' && typeof setSession === 'function'){
      var nova = normalizarSessao(getSession(), u.empresa);
      if(nova){ setSession(nova); trocouSessao = true; }
    }
  }catch(e){ /* sessão ilegível */ }

  if((res.total || precisaTrocar || trocouSessao) && typeof saveDB === 'function'){
    try{ saveDB(); }catch(e){}
    if(res.total){
      console.log('[DIGICOPY v5.20.26] ' + res.total + ' registro(s) reunidos na empresa única (' + (origem||'carga') + '):', res.porEntidade);
    }
  }
}

// ─────────────────────────────────────────────────
// Desliga a criação automática de usuários a partir de técnicos.
// Era chamada em todo login E em todo showApp, recriando logins com senha '123'.
// ─────────────────────────────────────────────────
try{
  if(typeof window.importarFuncionariosComoUsuarios === 'function'){
    window.importarFuncionariosComoUsuarios = function(){ /* desativado na v5.20.26 */ };
  }
  if(window.LOGOPT_PURE && typeof window.LOGOPT_PURE.importarFuncionariosComoUsuarios === 'function'){
    window.LOGOPT_PURE.importarFuncionariosComoUsuarios = function(){ /* desativado */ };
  }
}catch(e){}

// Reaplica após login e ao abrir o app (a sessão nasce ali).
try{
  var _showApp = window.showApp;
  if(typeof _showApp === 'function'){
    window.showApp = function(){
      aplicar('showApp');
      var r = _showApp.apply(this, arguments);
      aplicar('pos-showApp');
      return r;
    };
  }
}catch(e){}

aplicar('inicial');
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', function(){ aplicar('dom'); });
}

window.AJUSTES_V52026_PURE = {
  EMPRESA_ID: EMPRESA_ID,
  ENTIDADES: ENTIDADES,
  unificarEmpresa: unificarEmpresa,
  unificarCadastroEmpresa: unificarCadastroEmpresa,
  normalizarSessao: normalizarSessao,
  tecnicoNaoViraUsuario: tecnicoNaoViraUsuario
};

})();
console.log('[DIGICOPY] PATCH ajustes_v52026_patch.js v5.20.26 — empresa única, fim dos dados invisíveis');
