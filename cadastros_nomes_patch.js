// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.15 — Correção de nomes vazios em cadastros migrados
// • Preenche nomes conhecidos por código
// • Tenta reaproveitar fantasia/razão/contato das tabelas migradas
// • Evita cadastro aparecendo vazio no uso diário
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

const NOMES_CONHECIDOS = {
  '116': 'Fernando Seguros',
  '166': 'Papelaria JK',
  '175': 'Caixa Escolar Manoel Neto dos Santos'
};

function texto(v){ return String(v ?? '').trim(); }
function semAcento(v){ return texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase(); }
function codigoCliente(c){
  const raw = c && (c.codigo ?? c.CODIGO ?? c.codCliente ?? c.COD_CLIENTE ?? c.idLegado ?? c.ID_LEGADO ?? c.id);
  const grupos = texto(raw).match(/\d+/g);
  if(!grupos || !grupos.length) return '';
  return (grupos[grupos.length - 1].replace(/^0+/, '') || '0');
}
function nomeValido(v){
  const s = texto(v);
  if(!s) return false;
  const n = semAcento(s);
  if(['-', '.', '0', 'NULL', 'N/A', 'SEM NOME', 'CLIENTE', 'NAO INFORMADO', 'NÃO INFORMADO'].includes(n)) return false;
  return /[A-Z0-9]/.test(n);
}
function titleEmpresa(nome){
  const s = texto(nome);
  if(!s) return '';
  if(/\b(JK|ME|LTDA|EIRELI|EPP|MEI)\b/i.test(s)){
    return s.toLowerCase().replace(/\b\p{L}/gu, ch => ch.toUpperCase()).replace(/\b(Jk|Me|Ltda|Eireli|Epp|Mei)\b/g, m => m.toUpperCase()).replace(/\b(Da|De|Do|Das|Dos|E)\b/g, m => m.toLowerCase());
  }
  return s.toLowerCase().replace(/\b\p{L}/gu, ch => ch.toUpperCase()).replace(/\b(Da|De|Do|Das|Dos|E)\b/g, m => m.toLowerCase());
}
function nomeDoCliente(c){
  const campos = [
    c.nome, c.NOME, c.razaoSocial, c.RAZAO_SOCIAL, c.RAZAOSOCIAL, c.RAZAO, c.NOME_RAZAO,
    c.fantasia, c.FANTASIA, c.nomeFantasia, c.NOME_FANTASIA, c.APELIDO,
    c.nomeCliente, c.NOME_CLIENTE, c.CLIENTE, c.NM_CLIENTE, c.NOMECLI,
    c.PESSOA, c.NOME_PESSOA, c.ENTIDADE, c.DESCRICAO,
    c.contato, c.CONTATO, c.RESPONSAVEL, c.RESPONSÁVEL
  ];
  const achou = campos.find(nomeValido);
  return achou ? titleEmpresa(achou) : '';
}
function nomeMigradoPorCodigo(dbRef, codigo){
  const mods = dbRef.modulosDinamicos || {};
  for(const modulo of Object.values(mods)){
    const linhas = (modulo && modulo.dados) || [];
    for(const r of linhas){
      const cod = codigoCliente({ codigo: r.CODIGO ?? r.COD_CLIENTE ?? r.ID ?? r.CLIENTE_ID });
      if(cod !== codigo) continue;
      const nome = nomeDoCliente(r);
      if(nome) return nome;
    }
  }
  return '';
}
function corrigirNomesClientes(dbRef, empresaId){
  if(!dbRef || !Array.isArray(dbRef.clientes)) return 0;
  let alterados = 0;
  dbRef.clientes.forEach(c => {
    if(empresaId && c.empresaId !== empresaId) return;
    const codigo = codigoCliente(c);
    let nome = nomeDoCliente(c);
    if(!nome && codigo && NOMES_CONHECIDOS[codigo]) nome = NOMES_CONHECIDOS[codigo];
    if(!nome && codigo) nome = nomeMigradoPorCodigo(dbRef, codigo);
    if(!nome && c.documento && nomeValido(c.documento)) nome = `Cliente ${codigo || String(c.documento).replace(/\D+/g, '').slice(-6) || 'sem código'}`;
    if(!nome && codigo) nome = `Cliente ${codigo}`;
    if(!nome) nome = 'Cliente sem cadastro completo';
    if(nome && c.nome !== nome){ c.nome = nome; alterados++; }
    if(!c.fantasia && nome) c.fantasia = nome;
    if(!c.codigo && codigo) c.codigo = codigo;
  });
  return alterados;
}

window.CADASTROS_NOMES_PURE = { codigoCliente, nomeValido, titleEmpresa, corrigirNomesClientes, criarClientesAusentesDeMigrados };

if(typeof window === 'undefined') return;


function criarClientesAusentesDeMigrados(dbRef, empresaId){
  if(!dbRef || !dbRef.modulosDinamicos || !Array.isArray(dbRef.clientes)) return 0;
  let criados = 0;
  const nomesTabelas = /CLIENT|PESSOA|CADASTRO|CONTRATO|LOCACAO|LOCAÇÃO/i;
  Object.entries(dbRef.modulosDinamicos).forEach(([nomeTabela, modulo]) => {
    if(!nomesTabelas.test(nomeTabela)) return;
    ((modulo && modulo.dados) || []).forEach(row => {
      const codigo = codigoCliente({ codigo: row.CODIGO ?? row.COD_CLIENTE ?? row.CLIENTE_ID ?? row.ID_CLIENTE ?? row.ID });
      if(!codigo) return;
      const existe = dbRef.clientes.some(c => c.empresaId === empresaId && (codigoCliente(c) === codigo || texto(c.codigoAntigo) === codigo));
      if(existe) return;
      const nome = nomeDoCliente(row) || NOMES_CONHECIDOS[codigo] || `Cliente ${codigo}`;
      dbRef.clientes.push({
        id: (typeof uid === 'function' ? uid('cli') : 'cli_' + codigo),
        empresaId,
        codigo,
        codigoAntigo: codigo,
        nome,
        fantasia: nome,
        documento: row.CNPJ || row.CPF || row.DOCUMENTO || row.DOC || '',
        telefone: row.FONE || row.TELEFONE || row.CELULAR || '',
        email: row.EMAIL || '',
        endereco: row.ENDERECO || row.ENDERECO_COMPLETO || '',
        cidade: row.CIDADE || '',
        estado: row.ESTADO || row.UF || '',
        cep: row.CEP || '',
        tipo: 'PJ',
        status: 'ativo',
        criadoEm: new Date().toISOString(),
        criadoPor: 'migracao',
        criadoPorNome: 'Migração'
      });
      criados++;
    });
  });
  return criados;
}

function aplicar(){
  const s = typeof getSession === 'function' ? getSession() : null;
  if(!s || typeof db === 'undefined') return;
  const criados = criarClientesAusentesDeMigrados(db, s.empresaId);
  const total = corrigirNomesClientes(db, s.empresaId) + criados;
  if(total){
    if(typeof saveDB === 'function') saveDB();
    if(typeof renderClientes === 'function') setTimeout(() => renderClientes(), 0);
  }
}

const oldShowApp = window.showApp;
window.showApp = function(){
  if(oldShowApp) oldShowApp.apply(this, arguments);
  setTimeout(aplicar, 80);
};

const oldRenderClientes = window.renderClientes;
window.renderClientes = function(){
  const s = typeof getSession === 'function' ? getSession() : null;
  if(s && typeof db !== 'undefined') corrigirNomesClientes(db, s.empresaId);
  if(oldRenderClientes) return oldRenderClientes.apply(this, arguments);
};

setTimeout(aplicar, 300);
console.log('[DIGICOPY] cadastros_nomes_patch.js v4.9.15 carregado');
})();
