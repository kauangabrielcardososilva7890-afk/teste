// ═══════════════════════════════════════════════════════════════════════════
// PATCH v5.18.8 — logo da loja configurável + dados da loja nos cabeçalhos
// • Adiciona upload de LOGO no card "Dados da loja para relatórios e notinhas"
//   (salvo em db.config.loja.logo, em base64).
// • A logo passa a ser usada nos chamados (dentro e fora de contrato), nas
//   leituras e nas notinhas de vendas — tudo via window.DIGICOPY_LOGO, que é
//   reaplicado com a logo da loja (se configurada).
// • Os dados da empresa (nome fantasia, razão social, CNPJ, telefone, e-mail,
//   endereço) também são lidos do card "Dados da loja".
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

if(typeof window === 'undefined') return;

// Guarda a logo original (logo.png embutida) para restaurar se não houver
// logo customizada.
var _ORIGINAL_LOGO = window.DIGICOPY_LOGO;

window.digicopyLoja = function(){
  var s = typeof getSession === 'function' ? getSession() : null;
  var emp = (typeof db !== 'undefined' && db.empresas || []).find(function(e){ return e.id === (s && s.empresaId); }) || (typeof db !== 'undefined' && db.empresas || [])[0] || {};
  var loja = (typeof db !== 'undefined' && db.config && db.config.loja) || {};
  var empresaCfg = (typeof db !== 'undefined' && db.config && db.config.empresa) || {};
  return Object.assign({}, emp, empresaCfg, loja);
};

window.digicopyLogo = function(){
  var loja = (typeof db !== 'undefined' && db.config && db.config.loja) || {};
  return loja.logo || _ORIGINAL_LOGO || './logo.png';
};

// Reaplica a logo global (para todas as impressões que usam window.DIGICOPY_LOGO)
function aplicarLogoConfig(){
  var loja = (typeof db !== 'undefined' && db.config && db.config.loja) || {};
  if(loja.logo){ window.DIGICOPY_LOGO = loja.logo; }
  else if(_ORIGINAL_LOGO){ window.DIGICOPY_LOGO = _ORIGINAL_LOGO; }
}

// ─────────────────────────────────────────────────────────────────────────
// Upload de logo no card "Dados da loja para relatórios e notinhas"
// ─────────────────────────────────────────────────────────────────────────
window.trocarLogoLoja = function(input){
  var file = input && input.files && input.files[0];
  if(!file) return;
  if(!/^image\//.test(file.type)){ if(typeof window.lfbAlert === 'function') window.lfbAlert('Escolha um arquivo de imagem.', 'Aviso'); return; }
  var reader = new FileReader();
  reader.onload = function(e){
    window.__lojaLogoPending = String(e.target.result);
    var prev = document.getElementById('loja-logo-preview');
    if(prev) prev.innerHTML = '<img src="' + window.__lojaLogoPending + '" style="width:100%;height:100%;object-fit:contain">';
  };
  reader.readAsDataURL(file);
};

window.limparLogoLoja = function(){
  window.__lojaLogoRemover = true;
  window.__lojaLogoPending = null;
  var prev = document.getElementById('loja-logo-preview');
  if(prev) prev.innerHTML = '<span style="font-size:11px;color:#94a3b8">Logo</span>';
  var inp = document.getElementById('loja-logo-input');
  if(inp) inp.value = '';
};

function injetarLogoLoja(){
  if(typeof document === 'undefined') return;
  var card = document.getElementById('dados-loja-card');
  if(!card || document.getElementById('loja-logo-input')) return;
  var loja = (typeof db !== 'undefined' && db.config && db.config.loja) || {};
  var logoHtml = loja.logo ? '<img src="' + loja.logo + '" style="width:100%;height:100%;object-fit:contain">' : '<span style="font-size:11px;color:#94a3b8">Logo</span>';
  var bloco = document.createElement('div');
  bloco.className = 'flex items-center gap-4 mt-4 mb-1';
  bloco.innerHTML =
    '<div id="loja-logo-preview" style="width:72px;height:72px;border:1.5px dashed #cbd5e1;border-radius:14px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#f8fafc;flex-shrink:0">' + logoHtml + '</div>' +
    '<div style="flex:1"><label class="text-[11px] font-bold uppercase text-slate-500">Logo da loja<input id="loja-logo-input" type="file" accept="image/*" class="mt-1 text-[12px]" onchange="trocarLogoLoja(this)"></label>' +
    '<p class="text-[11px] text-slate-500 mt-1">Aparece nos chamados, leituras e notinhas.</p></div>' +
    '<button type="button" onclick="limparLogoLoja()" class="h-9 px-3 rounded-lg bg-white border font-bold text-[12px] self-end" style="flex-shrink:0">Remover logo</button>';
  var grid = card.querySelector('.grid');
  if(grid) card.insertBefore(bloco, grid);
  else card.appendChild(bloco);
}

// Salva a logo junto com os dados da loja
const _salvarLoja = window.salvarDadosLojaFinal;
if(typeof _salvarLoja === 'function'){
  window.salvarDadosLojaFinal = function(){
    const r = _salvarLoja.apply(this, arguments);
    try{
      if(typeof db === 'undefined') return r;
      db.config = db.config || {};
      db.config.loja = db.config.loja || {};
      if(window.__lojaLogoRemover){
        delete db.config.loja.logo;
      } else if(window.__lojaLogoPending){
        db.config.loja.logo = window.__lojaLogoPending;
      }
      // espelha também na empresa e no config.empresa
      if(db.config.loja.logo){
        db.config.empresa = db.config.empresa || {};
        db.config.empresa.logo = db.config.loja.logo;
        const s = typeof getSession === 'function' ? getSession() : null;
        const emp = (db.empresas || []).find(function(e){ return e.id === (s && s.empresaId); }) || (db.empresas || [])[0];
        if(emp) emp.logo = db.config.loja.logo;
      }
      window.__lojaLogoPending = null;
      window.__lojaLogoRemover = false;
      if(typeof saveDB === 'function') saveDB();
      aplicarLogoConfig();
    }catch(e){}
    return r;
  };
}

// Reaplica a logo quando a tela de configurações renderiza e após o login
const _renderConfig = window.renderConfig;
if(typeof _renderConfig === 'function'){
  window.renderConfig = function(){
    const r = _renderConfig.apply(this, arguments);
    setTimeout(function(){ injetarLogoLoja(); aplicarLogoConfig(); }, 150);
    return r;
  };
}
const _showApp = window.showApp;
if(typeof _showApp === 'function'){
  window.showApp = function(){
    const r = _showApp.apply(this, arguments);
    setTimeout(aplicarLogoConfig, 200);
    return r;
  };
}

// Aplica logo configurada assim que a base estiver disponível
setTimeout(aplicarLogoConfig, 800);
setTimeout(aplicarLogoConfig, 2500);
setTimeout(function(){ injetarLogoLoja(); }, 1200);

console.log('[DIGICOPY] ajustes_v5188_patch.js');
})();
