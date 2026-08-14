/* ==========================================================================
 * DIGICOPY ERP — PATCH LOCAÇÃO v4.4 (build 3.11)
 * O importador original lia as tabelas LOCACAO / ITENS_LOCACAO / VISITAS /
 * CONTADOR_PAGINAS e as DESCARTAVA em silêncio (estavam na lista "mapeadas"
 * mas não havia código de tratamento). Este patch, executado logo após o
 * fbImportToErp original, transforma:
 *   LOCACAO          → db.contratos   (upsert por codigoAntigo)
 *   ITENS_LOCACAO    → db.parque      (upsert por codigoAntigo + vínculos)
 *   CONTADOR_PAGINAS → db.leituras    (upsert por legadoCodigo 'CP-<cod>')
 *   LEITURAS         → db.leituras    (upsert por legadoCodigo 'L-<cod>')
 *   VISITAS          → db.os          (upsert por legadoCodigo 'VIS-<cod>')
 * E remove os dados de DEMONSTRAÇÃO (seed CT-…/OS-…) quando dados reais
 * de locação chegam (era o motivo das "caixas" e contadores errados).
 * Não altera visual; só amplia a importação. Reimportar os mesmos JSONs
 * apenas ATUALIZA (nunca duplica), seguindo a regra "migracao" do app.
 * ========================================================================== */
(function(){
'use strict';

// ── Utilidades locais (não colidem com o escopo do app) ──────────────────
function jbStr(v){ return (v===undefined||v===null) ? '' : String(v).trim(); }
function jbEhMigracao(r){ return r && (r.criadoPor==='migracao' || r.origem==='migracao'); }
function jbNum(v){ const n=parseFloat(String(v).replace('.','').replace(',','.')); return isNaN(n)?0:n; }
// Se valor tiver vírgula decimal pt-BR ("1.234,56") corrige; senão parseFloat direto
function jbToF(v){
  if(v===undefined||v===null||v==='') return 0;
  if(typeof v==='number') return v;
  const s=String(v).trim();
  if(/,\d{1,3}$/.test(s)) return jbNum(s);
  const n=parseFloat(s); return isNaN(n)?0:n;
}
function jbInt(v){ const n=parseInt(String(v),10); return isNaN(n)?0:n; }
function jbIso(v, fallback){
  if(v===undefined||v===null||v==='') return fallback||null;
  if(typeof v==='string'){
    const s=v.trim();
    const m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})/); // dd/mm/aaaa
    if(m) return `${m[3]}-${m[2]}-${m[1]}`;
    const d=new Date(s);
    if(!isNaN(d)) return d.toISOString().slice(0,10);
    return fallback||null;
  }
  try{ const d=new Date(v); return isNaN(d)?(fallback||null):d.toISOString().slice(0,10); }catch(e){ return fallback||null; }
}
// Busca tabela no rawData APENAS por nome exato (evita ITENS_LOCACAO casar com LOCACAO)
function jbTabela(rawData, nomes){
  const up=nomes.map(n=>n.toUpperCase());
  for(const key of Object.keys(rawData||{})){
    if(up.includes(key.toUpperCase()) && rawData[key] && Array.isArray(rawData[key].data) && rawData[key].data.length){
      return rawData[key].data;
    }
  }
  return null;
}
function jbPick(row, nomes){
  for(const n of nomes){ if(row[n]!==undefined && row[n]!==null && row[n]!=='') return row[n]; }
  return undefined;
}

// ── Mapeamento propriamente dito ─────────────────────────────────────────
function fbImportLocacaoFamilia(rawData){
  if(!rawData || typeof rawData!=='object') return;
  const sess = (typeof getSession==='function') ? getSession() : null;
  if(!sess){ console.warn('[locacao_patch] sem sessão; importação de locação ignorada'); return; }
  const empId = sess.empresaId;
  const userName = sess.usuarioNome || 'Migração Firebird';
  const agora = new Date().toISOString();

  const result = { contratos:0, parque:0, leituras:0, chamados:0, demosRemovidos:0 };

  // Índices auxiliares
  const clientePorCodigo = cod => {
    const k=jbStr(cod); if(!k) return null;
    const c=db.clientes.find(c=>c.empresaId===empId && jbStr(c.codigoAntigo)===k && jbEhMigracao(c))
        || db.clientes.find(c=>c.empresaId===empId && jbStr(c.codigoAntigo)===k);
    return c||null;
  };
  const nomeClienteCodigo = cod => { const c=clientePorCodigo(cod); return c?c.nome:''; };

  // Pessoas (funcionários/técnicos) por código legado
  const idxFuncPorCodigo = {};
  Object.keys(rawData||{}).forEach(key=>{
    if(!/VENDEDOR|ENTREG|FUNCION|USUARIO|ATENDENT|OPERADOR|TECNIC/i.test(key)) return;
    const rows=(rawData[key]&&rawData[key].data)||[];
    rows.forEach(r=>{
      const k=jbStr(jbPick(r,['CODIGO','COD_FUNCIONARIO','COD_USUARIO','COD_TECNICO','ID']));
      const n=jbStr(jbPick(r,['NOME','FUNCIONARIO','NOME_USUARIO','USUARIO','NOME_FUNCIONARIO','LOGIN']));
      if(k&&n&&!idxFuncPorCodigo[k]) idxFuncPorCodigo[k]=n;
    });
  });
  function tecnicoIdPorCodigo(cod){
    const nome=idxFuncPorCodigo[jbStr(cod)]; if(!nome) return '';
    let t=db.tecnicos.find(t=>(t.nome||'').toLowerCase()===nome.toLowerCase());
    if(!t){ t={id:(typeof uid==='function'?uid('tec'):'tec_'+Math.random().toString(36).slice(2,9)),nome,especialidade:'Migrado',osConcluidas:0}; db.tecnicos.push(t); }
    return t.id;
  }

  // Equipamentos: código legado (EQUIPAMENTOS.CODIGO) → equipamento do ERP (via série)
  const rawEquip = (typeof findTable==='function' ? (findTable(rawData,['EQUIPAMENTOS'])||[]) : []);
  const idxEquipSeriePorCodigo = {};
  rawEquip.forEach(r=>{
    const k=jbStr(jbPick(r,['CODIGO','COD_EQUIPAMENTO','ID']));
    const serie=jbStr(jbPick(r,['SERIE','NUMERO_SERIE','PATRIMONIO']))||k;
    if(k) idxEquipSeriePorCodigo[k]=serie;
  });
  function equipamentoPorCodigo(cod){
    const k=jbStr(cod); if(!k) return null;
    const serie=idxEquipSeriePorCodigo[k];
    if(serie){
      const e=db.equipamentos.find(e=>e.empresaId===empId && (String(e.serie)===serie || String(e.patrimonio)===serie));
      if(e) return e;
    }
    // fallback: equipamento migrado que usou o próprio código como série
    return db.equipamentos.find(e=>e.empresaId===empId && (String(e.serie)===k || String(e.patrimonio)===k)) || null;
  }

  // ── 1) LOCACAO → contratos ────────────────────────────────────────────
  const rawLoc = jbTabela(rawData, ['LOCACAO','LOCAÇÃO']);
  const idxContratoPorCodigo = {};
  if(rawLoc && rawLoc.length){
    rawLoc.forEach(row=>{
      const codigo = jbStr(jbPick(row,['COD_LOCACAO','CODIGO','LO_CODIGO','L_CODIGO','ID','COD']));
      if(!codigo) return;
      const codCli = jbPick(row,['LO_COD_CLIENTE','L_COD_CLIENTE','COD_CLIENTE','CLIENTE','COD_PESSOA']);
      const cli = codCli!==undefined ? clientePorCodigo(codCli) : null;
      const sitRaw = jbStr(jbPick(row,['LO_SITUACAO','L_SITUACAO','SITUACAO','STATUS','ATIVO'])).toUpperCase();
      let status='ativo';
      if(['E','ENC','ENCERRADO','F','FINALIZADO','C','CANCELADO','I','INATIVO','N'].includes(sitRaw)) status='encerrado';
      else if(['P','PENDENTE','AGUARDANDO'].includes(sitRaw)) status='pendente';
      const dtIni = jbIso(jbPick(row,['LO_DATA_INICIO','L_DATA_INICIO','DATA_INICIO','DATA','DT_INICIO','LO_DATA']), null);
      const dtFim = jbIso(jbPick(row,['LO_DATA_FIM','L_DATA_FIM','DATA_FIM','DATA_FINAL','DT_FIM','VENCIMENTO']), null);
      let durMeses = jbInt(jbPick(row,['DURACAO_MESES','LO_DURACAO','MESES']));
      if(!durMeses && dtIni && dtFim){ durMeses=Math.max(1, Math.round((new Date(dtFim)-new Date(dtIni))/(1000*60*60*24*30))); }
      if(!durMeses) durMeses=12;
      const vMensal = jbToF(jbPick(row,['LO_VALOR_MENSAL','L_VALOR_MENSAL','VALOR_MENSAL','LO_VALOR','L_VALOR','VALOR','VALOR_CONTRATO']));
      const dadosC = {
        codigoAntigo: codigo,
        numero: jbStr(jbPick(row,['LO_NUMERO','L_NUMERO','NUMERO','NUMERO_CONTRATO'])) || ('LC-'+codigo.padStart(6,'0')),
        clienteId: cli?cli.id:null,
        codClienteAntigo: codCli!==undefined?jbStr(codCli):'',
        dataInicio: dtIni || agora.slice(0,10),
        dataFim: dtFim || (dtIni ? (function(){const d=new Date(dtIni); d.setMonth(d.getMonth()+durMeses); return d.toISOString().slice(0,10);})() : null),
        duracaoMeses: durMeses,
        diaVencimento: jbInt(jbPick(row,['LO_DIA_VENCIMENTO','DIA_VENCIMENTO','DIA_VENC'])) || 10,
        franquiaPB: jbInt(jbPick(row,['LO_FRANQUIA','L_FRANQUIA','FRANQUIA','FRANQUIA_PB','LO_FRANQUIA_PB'])),
        franquiaCor: jbInt(jbPick(row,['LO_FRANQUIA_COR','FRANQUIA_COR','FRANQUIA_COLOR'])),
        valorExcedentePB: jbToF(jbPick(row,['LO_VALOR_PAGINA','VALOR_PAGINA','VALOR_EXCEDENTE','VALOR_EXCEDENTE_PB','VALOR_COPIA'])) || 0.08,
        valorExcedenteCor: jbToF(jbPick(row,['LO_VALOR_PAGINA_COR','VALOR_EXCEDENTE_COR','VALOR_COPIA_COR'])) || 0.45,
        valorFranquia: vMensal,
        valorMensalFixo: vMensal,
        status,
        observacoes: jbStr(jbPick(row,['OBS','OBSERVACAO','LO_OBS','LO_OBSERVACAO']))
      };
      let existing = db.contratos.find(c=>c.empresaId===empId && jbEhMigracao(c) && jbStr(c.codigoAntigo)===codigo);
      if(existing){ Object.assign(existing, dadosC); idxContratoPorCodigo[codigo]=existing; result.contratos++; return; }
      const novo = Object.assign({
        id:(typeof uid==='function'?uid('ctr'):'ctr_'+Math.random().toString(36).slice(2,9)),
        empresaId: empId, equipamentos: [], criadoPor:'migracao', criadoPorNome:userName, criadoEm: agora
      }, dadosC);
      db.contratos.push(novo);
      idxContratoPorCodigo[codigo]=novo;
      result.contratos++;
    });
  }

  // Função para achar contrato por código legado mesmo se LOCACAO veio em importação anterior
  function contratoPorCodigo(cod){
    const k=jbStr(cod); if(!k) return null;
    return idxContratoPorCodigo[k]
        || db.contratos.find(c=>c.empresaId===empId && jbEhMigracao(c) && jbStr(c.codigoAntigo)===k)
        || null;
  }

  // ── 2) ITENS_LOCACAO → parque (máquina no cliente) ────────────────────
  const rawItensLoc = jbTabela(rawData, ['ITENS_LOCACAO','ITENS_LOCAÇÃO']);
  if(rawItensLoc && rawItensLoc.length){
    rawItensLoc.forEach(row=>{
      const codigo = jbStr(jbPick(row,['COD_ITENS_LOCACAO','CODIGO','IL_CODIGO','ID','COD']));
      if(!codigo) return;
      const codLoc = jbStr(jbPick(row,['COD_LOCACAO','IL_COD_LOCACAO','LOCACAO']));
      const contrato = codLoc ? contratoPorCodigo(codLoc) : null;
      const equip = equipamentoPorCodigo(jbPick(row,['IL_COD_EQUIPAMENTO','COD_EQUIPAMENTO','EQUIPAMENTO']));
      const cli = contrato && contrato.clienteId ? db.clientes.find(c=>c.id===contrato.clienteId)
                : (jbPick(row,['IL_COD_CLIENTE','COD_CLIENTE'])!==undefined ? clientePorCodigo(jbPick(row,['IL_COD_CLIENTE','COD_CLIENTE'])) : null);
      const setor = jbStr(jbPick(row,['IL_DEPARTAMENTO','DEPARTAMENTO','SETOR','IL_SETOR','LOCAL','LOCALIDADE','LOCALIZACAO'])) || 'A definir';
      const dadosP = {
        codigoAntigo: codigo,
        contratoId: contrato?contrato.id:null,
        clienteId: cli?cli.id:null,
        equipamentoId: equip?equip.id:null,
        setor,
        patrimonio: jbStr(jbPick(row,['IL_PATRIMONIO','PATRIMONIO','IL_SERIAL','SERIAL'])),
        enderecoInstalacao: jbStr(jbPick(row,['ENDERECO','IL_ENDERECO','ENDERECO_INSTALACAO'])) || (cli?(cli.endereco||''):''),
        dataInstalacao: jbIso(jbPick(row,['DATA_INSTALACAO','IL_DATA_INSTALACAO','DATA']), agora.slice(0,10)),
        franquiaItem: jbInt(jbPick(row,['IL_FRANQUIA','FRANQUIA'])),
        valorPaginaItem: jbToF(jbPick(row,['IL_VALOR_PAGINA','VALOR_PAGINA','IL_VALOR'])),
        status: 'ativo'
      };
      let existing = db.parque.find(p=>p.empresaId===empId && jbEhMigracao(p) && jbStr(p.codigoAntigo)===codigo);
      if(existing){
        Object.assign(existing, dadosP);
      }else{
        existing = Object.assign({
          id:(typeof uid==='function'?uid('prk'):'prk_'+Math.random().toString(36).slice(2,9)),
          empresaId: empId, contadorInicialPB:0, contadorInicialCor:0, criadoPor:'migracao', criadoPorNome:userName
        }, dadosP);
        db.parque.push(existing);
      }
      // vincula equipamento ao contrato
      if(contrato && equip){
        if(!Array.isArray(contrato.equipamentos)) contrato.equipamentos=[];
        if(!contrato.equipamentos.includes(equip.id)) contrato.equipamentos.push(equip.id);
      }
      result.parque++;
    });
  }

  function parquePorItemLocacao(codItem){
    const k=jbStr(codItem); if(!k) return null;
    return db.parque.find(p=>p.empresaId===empId && jbEhMigracao(p) && jbStr(p.codigoAntigo)===k) || null;
  }

  // ── 3) CONTADOR_PAGINAS → leituras (cobrança por página) ──────────────
  const rawContPg = jbTabela(rawData, ['CONTADOR_PAGINAS']);
  if(rawContPg && rawContPg.length){
    rawContPg.forEach(row=>{
      const codigo = jbStr(jbPick(row,['COD_CONTADOR','CODIGO','ID']));
      if(!codigo) return;
      const leg = 'CP-'+codigo;
      const parque = parquePorItemLocacao(row['COD_ITENS_LOCACAO']);
      const equip = equipamentoPorCodigo(row['CP_COD_EQUIPAMENTO']) || (parque && parque.equipamentoId ? db.equipamentos.find(e=>e.id===parque.equipamentoId) : null);
      const tipo = jbStr(row['CP_TIPO']).toUpperCase();
      const ehCor = tipo.includes('COR') || tipo.includes('COLOR');
      const atual = jbInt(jbPick(row,['PAGINAS_ATUAL','CP_PAGINAS_ATUAL','CONTADOR_ATUAL']));
      const anterior = jbInt(jbPick(row,['CP_CONTADOR_ANTERIOR','CONTADOR_ANTERIOR','PAGINAS_ANTERIOR']));
      const paginas = jbInt(jbPick(row,['CP_PAGINAS','PAGINAS']));
      const dadosL = {
        legadoCodigo: leg,
        parqueId: parque?parque.id:null,
        equipamentoId: equip?equip.id:null,
        contratoId: parque?parque.contratoId:null,
        clienteId: parque?parque.clienteId:null,
        dataLeitura: jbIso(jbPick(row,['DATA_LEITURA','DATA','CP_DATA_LEITURA']), agora.slice(0,10)),
        contadorPB: ehCor?0:atual,
        contadorCor: ehCor?atual:0,
        contadorPBAnterior: ehCor?0:anterior,
        contadorCorAnterior: ehCor?anterior:0,
        consumoPB: ehCor?0:(paginas || Math.max(0, atual-anterior)),
        consumoCor: ehCor?(paginas || Math.max(0, atual-anterior)):0,
        franquiaLegado: jbInt(row['CP_FRANQUIA']),
        valorExcedente: jbToF(jbPick(row,['CP_VALOR_EXCEDENTE','CP_VALOR_TOTAL'])),
        modalidadeLegado: jbStr(row['CP_MODALIDADE']) || 'Impressao',
        setorLegado: jbStr(row['CP_DEPARTAMENTO']),
        faturar: true,
        status: jbStr(row['CP_FINALIZADA']).toUpperCase()==='S' ? 'faturado' : 'pendente'
      };
      const existing = db.leituras.find(l=>l.empresaId===empId && jbEhMigracao(l) && l.legadoCodigo===leg);
      if(existing){ Object.assign(existing, dadosL); result.leituras++; return; }
      db.leituras.push(Object.assign({
        id:(typeof uid==='function'?uid('lei'):'lei_'+Math.random().toString(36).slice(2,9)),
        empresaId: empId, criadoPor:'migracao',
        criadoPorNome: idxFuncPorCodigo[jbStr(row['CP_COD_FUNCIONARIO'])] || userName
      }, dadosL));
      result.leituras++;
    });
  }

  // ── 4) LEITURAS → leituras (cabeçalho mensal, se existir) ─────────────
  const rawLeit = jbTabela(rawData, ['LEITURAS']);
  if(rawLeit && rawLeit.length){
    rawLeit.forEach(row=>{
      const codigo = jbStr(jbPick(row,['COD_LEITURA','CODIGO','LE_CODIGO','ID','COD']));
      if(!codigo) return;
      const leg = 'L-'+codigo;
      const parque = parquePorItemLocacao(jbPick(row,['LE_COD_ITENS_LOCACAO','COD_ITENS_LOCACAO','ITENS_LOCACAO']));
      const atual = jbInt(jbPick(row,['LE_CONTADOR','CONTADOR','CONTADOR_ATUAL','LE_CONTADOR_ATUAL']));
      const anterior = jbInt(jbPick(row,['LE_CONTADOR_ANTERIOR','CONTADOR_ANTERIOR']));
      const dadosL = {
        legadoCodigo: leg,
        parqueId: parque?parque.id:null,
        equipamentoId: equipamentoPorCodigo(jbPick(row,['LE_COD_EQUIPAMENTO','COD_EQUIPAMENTO'])) ? equipamentoPorCodigo(jbPick(row,['LE_COD_EQUIPAMENTO','COD_EQUIPAMENTO'])).id : (parque?parque.equipamentoId:null),
        contratoId: parque?parque.contratoId:null,
        clienteId: parque?parque.clienteId:null,
        dataLeitura: jbIso(jbPick(row,['LE_DATA','DATA_LEITURA','DATA']), agora.slice(0,10)),
        contadorPB: atual, contadorCor: jbInt(jbPick(row,['LE_CONTADOR_COR','CONTADOR_COR','CONTADOR_COLOR'])),
        contadorPBAnterior: anterior, contadorCorAnterior: jbInt(jbPick(row,['LE_CONTADOR_COR_ANTERIOR','CONTADOR_COR_ANTERIOR'])),
        consumoPB: jbInt(jbPick(row,['LE_PAGINAS','PAGINAS'])) || Math.max(0, atual-anterior),
        consumoCor: jbInt(jbPick(row,['LE_PAGINAS_COR','PAGINAS_COR'])),
        valorExcedente: jbToF(jbPick(row,['LE_VALOR','VALOR','LE_VALOR_EXCEDENTE','VALOR_EXCEDENTE'])),
        faturar: true,
        status: jbStr(jbPick(row,['LE_FINALIZADA','FINALIZADA','LE_SITUACAO','SITUACAO'])).toUpperCase().match(/^(S|F|FATURADA)$/) ? 'faturado' : 'pendente'
      };
      const existing = db.leituras.find(l=>l.empresaId===empId && jbEhMigracao(l) && l.legadoCodigo===leg);
      if(existing){ Object.assign(existing, dadosL); result.leituras++; return; }
      db.leituras.push(Object.assign({
        id:(typeof uid==='function'?uid('lei'):'lei_'+Math.random().toString(36).slice(2,9)),
        empresaId: empId, criadoPor:'migracao',
        criadoPorNome: idxFuncPorCodigo[jbStr(jbPick(row,['LE_COD_FUNCIONARIO','COD_FUNCIONARIO']))] || userName
      }, dadosL));
      result.leituras++;
    });
  }

  // ── 5) VISITAS → os (chamados técnicos) ───────────────────────────────
  const rawVisitas = jbTabela(rawData, ['VISITAS']);
  if(rawVisitas && rawVisitas.length){
    rawVisitas.forEach(row=>{
      const codigo = jbStr(jbPick(row,['COD_VISITA','CODIGO','ID']));
      if(!codigo) return;
      const leg = 'VIS-'+codigo;
      const motivo = jbStr(jbPick(row,['VI_MOTIVO','MOTIVO']));
      // Tipo pelo motivo (regras palavra-chave do dia a dia)
      let tipo='corretiva';
      const m=motivo.toUpperCase();
      if(/TONER|TINTA|CARTUCHO|RECARGA|SUPRIMENT/.test(m)) tipo='suprimento';
      else if(/INSTALACAO|INSTALA|IMPLANTACAO/.test(m)) tipo='instalacao';
      else if(/RETIRADA|REMOCAO|DESINSTALACAO|DEVOLUCAO/.test(m)) tipo='remocao';
      else if(/PREVENTIVA|MANUTENCAO|REVISAO|LIMPEZA/.test(m)) tipo='preventiva';
      // Situação
      const sit=jbStr(jbPick(row,['VI_SITUACAO','SITUACAO','STATUS'])).toUpperCase();
      let status='aberto';
      if(['F','C','CONC','CONCLUIDA','CONCLUIDO','FINALIZADA','FINALIZADO','S'].includes(sit)) status='concluido';
      else if(['E','EA','ATENDIMENTO','EM_ATENDIMENTO'].includes(sit)) status='em_atendimento';
      else if(['P','AG','AGUARDANDO'].includes(sit)) status='aguardando_peca';
      // Prioridade (sistema anterior usa 1..3; preservamos com 3=alta)
      const prioN = jbInt(jbPick(row,['PRIORIDADE','VI_PRIORIDADE']));
      const prioridade = prioN>=3 ? 'alta' : (prioN===2 ? 'media' : (prioN===1 ? 'baixa' : 'media'));
      const parque = parquePorItemLocacao(row['VI_COD_ITENS_LOCACAO']);
      const equip = equipamentoPorCodigo(row['VI_COD_EQUIPAMENTO']) || (parque && parque.equipamentoId ? db.equipamentos.find(e=>e.id===parque.equipamentoId) : null);
      const cli = clientePorCodigo(jbPick(row,['VI_COD_CLIENTE','COD_CLIENTE'])) || (parque && parque.clienteId ? db.clientes.find(c=>c.id===parque.clienteId) : null);
      const obs = jbStr(jbPick(row,['VI_OBS','OBS','OBSERVACAO']));
      const numVis = jbStr(jbPick(row,['VI_NUMERO','NUMERO'])) || codigo;
      const dadosO = {
        legadoCodigo: leg,
        numero: 'CH-'+numVis.padStart(6,'0'),
        clienteId: cli?cli.id:null,
        clienteNomeAntigo: cli?'':nomeClienteCodigo(jbPick(row,['VI_COD_CLIENTE','COD_CLIENTE'])),
        parqueId: parque?parque.id:null,
        equipamentoId: equip?equip.id:null,
        patrimonioLegado: jbStr(jbPick(row,['VI_PATRIMONIO','PATRIMONIO'])),
        tipo,
        prioridade,
        descricao: motivo + (obs ? ' — '+obs : ''),
        tecnico: tecnicoIdPorCodigo(jbPick(row,['VI_COD_FUNCIONARIO_RESP','VI_COD_FUNCIONARIO','COD_FUNCIONARIO'])),
        status,
        dataAbertura: (function(){ const d=jbIso(row['DATA'], agora.slice(0,10)); const h=jbStr(row['VI_HORA']); try{ const base=new Date(d+'T'+(h||'00:00:00')); return isNaN(base)?new Date(d).toISOString():base.toISOString(); }catch(e){ return new Date(d).toISOString(); } })(),
        dataFechamento: jbIso(jbPick(row,['DATA_FINALIZADO','DATA_FECHAMENTO','VI_DATA_FINALIZADO']), null),
        solucao: jbStr(jbPick(row,['VI_SERVICOS_EXECUTADOS','SERVICOS_EXECUTADOS'])),
        custoPecas: jbToF(jbPick(row,['VI_VALOR_CUSTO','VALOR_CUSTO'])),
        valorExtraLegado: jbToF(jbPick(row,['VI_VALOR_EXTRA','VALOR_EXTRA'])),
        tempoAtendimento: 0,
        contadorNaVisita: jbInt(jbPick(row,['VI_CONTADOR_ATUAL','CONTADOR_ATUAL'])),
        contadorCorNaVisita: jbInt(jbPick(row,['VI_CONTADOR_ATUAL_COLOR','CONTADOR_ATUAL_COLOR'])),
        cidadeLegado: jbStr(jbPick(row,['VI_CIDADE','CIDADE'])),
        enderecoLegado: [jbStr(row['VI_RUA']), jbStr(row['VI_BAIRRO'])].filter(Boolean).join(' - ')
      };
      const existing = db.os.find(o=>o.empresaId===empId && jbEhMigracao(o) && o.legadoCodigo===leg);
      if(existing){ Object.assign(existing, dadosO); result.chamados++; return; }
      db.os.push(Object.assign({
        id:(typeof uid==='function'?uid('os'):'os_'+Math.random().toString(36).slice(2,9)),
        empresaId: empId, criadoPor:'migracao', criadoPorNome: dadosO.tecnico ? (db.tecnicos.find(t=>t.id===dadosO.tecnico)||{}).nome || userName : userName
      }, dadosO));
      result.chamados++;
    });
  }

  // ── 6) LIMPEZA DE DADOS DE DEMONSTRAÇÃO (somente se chegou dado real) ─
  if(result.contratos>0 || result.parque>0 || result.chamados>0 || result.leituras>0){
    // Demo = não-migracao + sem codigoAntigo/legadoCodigo + padrões de numero do seed
    const demoCtrIds = db.contratos
      .filter(c=>c.empresaId===empId && !jbEhMigracao(c) && !c.codigoAntigo && /^CT-\d{4}-\d{4}$/.test(c.numero||''))
      .map(c=>c.id);
    if(demoCtrIds.length){
      const demoPrkIds = db.parque.filter(p=>demoCtrIds.includes(p.contratoId)).map(p=>p.id);
      const antes = {ctr:db.contratos.length, prk:db.parque.length, lei:db.leituras.length, os:db.os.length, cr:db.contasReceber.length};
      db.contratos = db.contratos.filter(c=>!demoCtrIds.includes(c.id));
      db.parque    = db.parque.filter(p=>!demoCtrIds.includes(p.contratoId));
      db.leituras  = db.leituras.filter(l=>!demoCtrIds.includes(l.contratoId) && !demoPrkIds.includes(l.parqueId));
      db.contasReceber = db.contasReceber.filter(cr=>!demoCtrIds.includes(cr.contratoId));
      result.demosRemovidos += (antes.ctr-db.contratos.length)+(antes.prk-db.parque.length)+(antes.lei-db.leituras.length)+(antes.cr-db.contasReceber.length);
    }
    if(result.chamados>0){
      const antes = db.os.length;
      db.os = db.os.filter(o=>!(o.empresaId===empId && !jbEhMigracao(o) && !o.legadoCodigo && /^OS-\d{4}-\d{4}$/.test(o.numero||'')));
      result.demosRemovidos += antes - db.os.length;
    }
  }

  // ── Fallback: não perder LOCACAO se nenhuma linha estruturada foi criada ─
  if(rawLoc && rawLoc.length && result.contratos===0 && !db.modulosDinamicos['LOCACAO']){
    db.modulosDinamicos['LOCACAO'] = {
      label: 'Locação (tabela bruta)',
      icone: (typeof sugerirIcone==='function'?sugerirIcone('LOCACAO'):'ph-file-text'),
      origem: 'Firebird', importadoEm: agora,
      colunas: Object.keys(rawLoc[0]), dados: rawLoc
    };
  }

  // ── Persistir e reportar ──────────────────────────────────────────────
  if(result.contratos||result.parque||result.leituras||result.chamados||result.demosRemovidos){
    if(typeof saveDB==='function') saveDB();
    if(typeof logAction==='function') logAction('migracao','importar_locacao','-',
      `Locação migrada: ${result.contratos} contratos, ${result.parque} parque, ${result.leituras} leituras, ${result.chamados} chamados` +
      (result.demosRemovidos?` • ${result.demosRemovidos} registros demo removidos`:''));
    // Card extra no painel de resultado da importação
    try{
      const existResult = document.getElementById('fb-import-result');
      if(existResult){
        const partes=[];
        if(result.contratos) partes.push(`<b>${result.contratos}</b> contratos`);
        if(result.parque) partes.push(`<b>${result.parque}</b> máquinas no parque`);
        if(result.leituras) partes.push(`<b>${result.leituras}</b> leituras de contador`);
        if(result.chamados) partes.push(`<b>${result.chamados}</b> chamados`);
        let html = `<div class="sm:col-span-2 xl:col-span-4 rounded-xl border bg-blue-50 border-blue-200 p-4">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-blue-100 grid place-items-center"><i class="ph ph-printer text-[16px] text-blue-700"></i></div>
            <p class="text-[13px] font-bold text-blue-800">Locação migrada do sistema anterior ${result.demosRemovidos?`<span class="ml-2 text-[11px] font-semibold text-emerald-700">✓ ${result.demosRemovidos} registros de demonstração removidos</span>`:''}</p>
          </div>
          <p class="text-[12.5px] text-blue-700">${partes.join(' • ')||'Nenhum registro novo (já estavam atualizados)'}</p>
          <p class="text-[11px] text-blue-500 mt-1">Abra o menu <b>Contratos</b>, <b>Máquinas nos clientes</b>, <b>Leituras</b> e <b>Chamados</b> para conferir.</p>
        </div>`;
        existResult.innerHTML += html;
      }
      if(typeof fbSetStatus==='function' && (result.contratos||result.chamados)){
        fbSetStatus(`✅ Locação incluída na migração! ${result.contratos} contratos, ${result.parque} parque, ${result.leituras} leituras, ${result.chamados} chamados`+(result.demosRemovidos?` • ${result.demosRemovidos} demos removidos`:'')+'. Navegue pelos módulos para conferir.','success');
      }
      if(typeof buildNav==='function') buildNav();
      if(typeof renderContratos==='function') renderContratos();
      if(typeof renderParque==='function') renderParque();
      if(typeof renderLeituras==='function') renderLeituras();
      if(typeof renderOs==='function') renderOs();
      if(typeof renderDashboard==='function') renderDashboard();
    }catch(e){ console.warn('[locacao_patch] atualização de UI falhou (ok):', e); }
  }
  return result;
}

// ── Envolve o importador original ────────────────────────────────────────
if(typeof window !== 'undefined'){
  const _origFbImport = window.fbImportToErp;
  window.fbImportToErp = function(rawData){
    const r = (typeof _origFbImport==='function') ? _origFbImport.apply(this, arguments) : undefined;
    try{ window.__ultimaImportLocacao = fbImportLocacaoFamilia(rawData); }
    catch(e){ console.error('[locacao_patch] falha ao migrar locação:', e); try{ if(typeof toast==='function') toast('Aviso: parte da locação não migrou ('+e.message+')','error'); }catch(_){}}
    return r;
  };
  // Categorias de negócio: família locação junta das demais dinâmicas
  const _origCategoria = window.categoriaModulo;
  if(typeof _origCategoria === 'function'){
    window.categoriaModulo = function(nome){
      const n = String(nome||'').toUpperCase();
      // força categoria "Locação" para a família (VISITA já entra pela regra original)
      if(/LOCACAO|CONTADOR|LEITURA|DESPESAS_LOCACAO/.test(n)){
        return {id:'locacao', rotulo:'Locação e atendimento', icone:'ph-wrench', ordem:1};
      }
      return _origCategoria.apply(this, arguments);
    };
  }
  window.fbImportLocacaoFamilia = fbImportLocacaoFamilia;
}

})();
console.log('PATCH locacao v4.4 carregado - LOCACAO/ITENS_LOCACAO/CONTADOR_PAGINAS/LEITURAS/VISITAS viram Contratos/Parque/Leituras/Chamados + limpeza de demos');
