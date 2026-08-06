// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.37 — Tipos de dados/domínios legados
// • Preserva os domínios do banco antigo como documentação técnica do ERP
// • Adiciona normalizadores/validadores leves para CPF/CNPJ, CEP, UF, e-mail,
//   telefone e valores monetários sem alterar dados existentes automaticamente
// • Mantém o padrão novo: código interno numérico simples
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

const TIPOS_DADOS_LEGADO = Object.freeze({
  BAIRRO:{base:'VARCHAR',categoria:'texto',rotulo:'Bairro'},
  CARTAO:{base:'VARCHAR',categoria:'texto_sensivel',rotulo:'Cartão'},
  CEP:{base:'VARCHAR',categoria:'cep',rotulo:'CEP'},
  CIDADE:{base:'VARCHAR',categoria:'texto',rotulo:'Cidade'},
  COMPLEMENTO:{base:'VARCHAR',categoria:'texto',rotulo:'Complemento'},
  COR:{base:'VARCHAR',categoria:'texto',rotulo:'Cor'},
  CPF_CNPJ:{base:'VARCHAR',categoria:'documento',rotulo:'CPF/CNPJ'},
  DATA_HORA:{base:'TIMESTAMP',categoria:'data_hora',rotulo:'Data/hora'},
  DESCRICAO_1000:{base:'VARCHAR',categoria:'texto_longo',max:1000,rotulo:'Descrição 1000'},
  DESCRICAO_2000:{base:'VARCHAR',categoria:'texto_longo',max:2000,rotulo:'Descrição 2000'},
  DESCRICAO_50:{base:'VARCHAR',categoria:'texto',max:50,rotulo:'Descrição 50'},
  DM_COD_PROD:{base:'VARCHAR',categoria:'codigo_texto',rotulo:'Código produto legado'},
  DM_CONTROLE:{base:'VARCHAR',categoria:'controle',rotulo:'Controle'},
  DM_DESCRICAO_100:{base:'VARCHAR',categoria:'texto',max:100,rotulo:'Descrição 100'},
  DM_DESCRICAO_250:{base:'VARCHAR',categoria:'texto',max:250,rotulo:'Descrição 250'},
  DM_DESCRICAO_500:{base:'VARCHAR',categoria:'texto_longo',max:500,rotulo:'Descrição 500'},
  DM_SIGLA:{base:'VARCHAR',categoria:'sigla',rotulo:'Sigla'},
  DM_TABELA:{base:'VARCHAR',categoria:'tabela',rotulo:'Tabela'},
  DM_TOKEN:{base:'VARCHAR',categoria:'token',rotulo:'Token'},
  DM_VALOR_METRO:{base:'NUMERIC',categoria:'valor',precisao:12,escala:2,rotulo:'Valor por metro'},
  EMAIL:{base:'VARCHAR',categoria:'email',rotulo:'E-mail'},
  IP:{base:'VARCHAR',categoria:'ip',rotulo:'IP'},
  LATITUDE:{base:'VARCHAR',categoria:'coordenada',rotulo:'Latitude'},
  LONGITUDE:{base:'VARCHAR',categoria:'coordenada',rotulo:'Longitude'},
  NOME:{base:'VARCHAR',categoria:'nome',rotulo:'Nome'},
  NUMERO:{base:'VARCHAR',categoria:'numero_texto',rotulo:'Número'},
  RG_IE:{base:'VARCHAR',categoria:'documento_estadual',rotulo:'RG/IE'},
  RUA:{base:'VARCHAR',categoria:'texto',rotulo:'Rua'},
  SENHA:{base:'VARCHAR',categoria:'senha',rotulo:'Senha'},
  TELEFONE:{base:'VARCHAR',categoria:'telefone',rotulo:'Telefone'},
  TEXTO_BR_100:{base:'VARCHAR',categoria:'texto',max:100,rotulo:'Texto 100'},
  TEXTO_BR_255:{base:'VARCHAR',categoria:'texto',max:255,rotulo:'Texto 255'},
  TEXTO_BR_40:{base:'VARCHAR',categoria:'texto',max:40,rotulo:'Texto 40'},
  TEXTO_BR_50:{base:'VARCHAR',categoria:'texto',max:50,rotulo:'Texto 50'},
  UF:{base:'CHAR',categoria:'uf',max:2,rotulo:'UF'},
  VALOR:{base:'NUMERIC',categoria:'valor',precisao:15,escala:5,rotulo:'Valor'},
  SMALLINT:{base:'SMALLINT',categoria:'nativo'},
  INTEGER:{base:'INTEGER',categoria:'nativo'},
  FLOAT:{base:'FLOAT',categoria:'nativo'},
  DATE:{base:'DATE',categoria:'nativo'},
  TIME:{base:'TIME',categoria:'nativo'},
  CHAR:{base:'CHAR',categoria:'nativo'},
  BIGINT:{base:'BIGINT',categoria:'nativo'},
  NUMERIC:{base:'NUMERIC',categoria:'nativo'},
  DECIMAL:{base:'DECIMAL',categoria:'nativo'},
  'DOUBLE PRECISION':{base:'DOUBLE PRECISION',categoria:'nativo'},
  TIMESTAMP:{base:'TIMESTAMP',categoria:'nativo'},
  VARCHAR:{base:'VARCHAR',categoria:'nativo'},
  CSTRING:{base:'CSTRING',categoria:'nativo'},
  BLOB:{base:'BLOB',categoria:'nativo'},
  BOOLEAN:{base:'BOOLEAN',categoria:'nativo'}
});

function txt(v){ return String(v ?? '').trim(); }
function soDigitos(v){ return txt(v).replace(/\D/g,''); }
function semAcento(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function normalizarUF(v){ return semAcento(v).toUpperCase().replace(/[^A-Z]/g,'').slice(0,2); }
function normalizarEmail(v){ return txt(v).toLowerCase(); }
function normalizarCep(v){ const d=soDigitos(v); return d.length===8?d:d; }
function normalizarTelefone(v){ return soDigitos(v).slice(0,14); }
function normalizarDocumento(v){ return soDigitos(v).slice(0,14); }
function normalizarValor(v, escala=5){
  const n=Number(String(v ?? '').replace(',', '.'));
  if(!Number.isFinite(n)) return 0;
  const p=Math.pow(10,escala);
  return Math.round((n+Number.EPSILON)*p)/p;
}
function limitarTexto(v, max){ const s=txt(v); return max&&s.length>max?s.slice(0,max):s; }
function normalizarPorTipo(tipo, valor){
  const t=TIPOS_DADOS_LEGADO[tipo]||{};
  if(t.categoria==='documento') return normalizarDocumento(valor);
  if(t.categoria==='cep') return normalizarCep(valor);
  if(t.categoria==='telefone') return normalizarTelefone(valor);
  if(t.categoria==='email') return normalizarEmail(valor);
  if(t.categoria==='uf') return normalizarUF(valor);
  if(t.categoria==='valor') return normalizarValor(valor, t.escala||5);
  if(t.max) return limitarTexto(valor,t.max);
  return txt(valor);
}
function validarPorTipo(tipo, valor){
  const t=TIPOS_DADOS_LEGADO[tipo]||{};
  const s=txt(valor);
  if(t.categoria==='documento'){ const d=soDigitos(s); return d.length===0||d.length===11||d.length===14; }
  if(t.categoria==='cep'){ const d=soDigitos(s); return d.length===0||d.length===8; }
  if(t.categoria==='email') return !s || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  if(t.categoria==='uf') return !s || /^[A-Za-z]{2}$/.test(s);
  if(t.categoria==='valor') return Number.isFinite(Number(String(s).replace(',','.')));
  if(t.max) return s.length<=t.max;
  return true;
}
function resumoTipos(){
  const out={total:Object.keys(TIPOS_DADOS_LEGADO).length,categorias:{}};
  Object.values(TIPOS_DADOS_LEGADO).forEach(t=>{ out.categorias[t.categoria||'outros']=(out.categorias[t.categoria||'outros']||0)+1; });
  return out;
}
function aplicarTiposDadosLegado(dbRef){
  if(!dbRef) return 0;
  dbRef.config=dbRef.config||{};
  const old=JSON.stringify(dbRef.config.tiposDadosLegado||{});
  dbRef.config.tiposDadosLegado={...TIPOS_DADOS_LEGADO};
  dbRef.config.tiposDadosLegadoResumo=resumoTipos();
  return old!==JSON.stringify(dbRef.config.tiposDadosLegado)?1:0;
}

window.TIPOS_DADOS_LEGADO_PURE={ TIPOS_DADOS_LEGADO, soDigitos, semAcento, normalizarUF, normalizarEmail, normalizarCep, normalizarTelefone, normalizarDocumento, normalizarValor, normalizarPorTipo, validarPorTipo, resumoTipos, aplicarTiposDadosLegado };

if(typeof window==='undefined'||typeof document==='undefined') return;
function run(){ const mudou=aplicarTiposDadosLegado(db); if(mudou&&typeof saveDB==='function') saveDB(); }
const oldShowApp=window.showApp;
window.showApp=function(){ const ret=oldShowApp?oldShowApp.apply(this,arguments):undefined; setTimeout(run,500); return ret; };
setTimeout(run,1500);
console.log('[DIGICOPY] tipos_dados_legado_patch.js v4.9.37 carregado');
})();
