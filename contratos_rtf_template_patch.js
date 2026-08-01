// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.18 — Modelos RTF editáveis de contrato/proposta
// • Usa placeholders do modelo original: {CLI_NOMERAZAO}, {EMP_NOMERAZAO}, [TABLE]...
// • Permite colar/salvar o RTF original no próprio sistema, sem anexar arquivo
// • Gera RTF preenchido por cima do template salvo
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

const DEFAULT_CONTRATO_RTF = String.raw`{\rtf1\ansi\ansicpg1252\deff0{\fonttbl{\f0 Times New Roman;}{\f1 Arial;}}\paperw11907\paperh16840\margl1134\margr1134\margt426\margb1078
\fs24\qc\b\ul CONTRATO DE LOCA\'c7\'c3O DE IMPRESSORA\b0\ul0\par\par
\qj Pelo presente instrumento contratual que firmam {CLI_NOMERAZAO}, inscrita no {CLI_CPFCNPJ_EX} sob o n\'ba {CLI_CPFCNPJ}, estabelecida na {CLI_ENDERECO}, n\'ba {CLI_NUMERO}, bairro {CLI_BAIRRO}, cidade de {CLI_CIDADE}, Estado de {CLI_UF_EX}, CEP {CLI_CEP}, doravante denominada simplesmente \b CONTRATANTE\b0, e do outro lado,\par\par
{EMP_NOMERAZAO}, inscrita no {EMP_CPFCNPJ_EX} sob o n\'ba {EMP_CPFCNPJ}, estabelecida na {EMP_ENDERECO}, n\'ba {EMP_NUMERO}, bairro {EMP_BAIRRO}, na cidade de {EMP_CIDADE}, Estado de {EMP_UF_EX}, CEP {EMP_CEP}, doravante denominada simplesmente \b CONTRATADA\b0, resolvem celebrar o presente contrato, mediante cl\'e1usulas e condi\'e7\'f5es a seguir enunciadas:\par\par
\b\ul CL\'c1USULA PRIMEIRA - DO OBJETO:\b0\ul0\par\par
O presente contrato tem por objeto a loca\'e7\'e3o de {QTD_MAQUINAS} impressora(s), conforme descri\'e7\'e3o abaixo:\par\par
[TABLE]\par\par
\b\ul CL\'c1USULA SEGUNDA - FORNECIMENTO DE MATERIAL:\b0\ul0\par\par
A CONTRATADA ficar\'e1 obrigada a fornecer os seguintes materiais de consumo e servi\'e7os: tinta, toner e assist\'eancia t\'e9cnica em hor\'e1rio comercial, exceto papel.\par\par
\b\ul CL\'c1USULA TERCEIRA - DO VALOR DO CONTRATO:\b0\ul0\par\par
O valor do contrato \u233? correspondente ao objeto total descrito e caracterizado na cl\'e1usula primeira do presente instrumento. Valor mensal: {CTR_VALOR_MENSAL}.\par\par
\b\ul CL\'c1USULA QUARTA - DO PAGAMENTO:\b0\ul0\par\par
O pagamento ser\'e1 efetuado mediante {CLI_FORMA_PGTO} pela CONTRATANTE com vencimento todo dia {CLI_VENC_DIA} ({CLI_VENC_DIA_EX}) de forma mensal.\par\par
\b\ul CL\'c1USULA QUINTA - DA FOR\'c7A MAIOR:\b0\ul0\par\par
No caso de impossibilidade de cumprimento por motivo de for\'e7a maior, a parte impedida dever\'e1 comunicar o fato \u224? outra parte, ratificando por escrito em at\'e9 30 dias.\par\par
\b\ul CL\'c1USULA SEXTA - DA RESCIS\'c3O:\b0\ul0\par\par
A rescis\'e3o contratual poder\'e1 ser realizada com aviso pr\'e9vio de {AVISO} ({AVISO_EX}) {AVISO_TIPO}.\par\par
\b\ul CL\'c1USULA S\'c9TIMA - DA VIG\'caNCIA:\b0\ul0\par\par
O presente contrato tem vig\'eancia durante o per\'edodo de {DATA_INICIO} \u224? {DATA_TERMINO}, podendo ser renovado mediante manifesta\'e7\'e3o de vontade.\par\par
\b\ul CL\'c1USULA OITAVA - DO FORO:\b0\ul0\par\par
As partes elegem o Foro da Comarca de {EMP_CIDADE}, com ren\'fancia de qualquer outro, para dirimir quest\'f5es resultantes deste contrato.\par\par
\qr {EMP_CIDADE}, {DIA} de {MES_EX} de {ANO}.\par\par\par
\qc _______________________________________\par\b {EMP_NOMERAZAO}\b0\par CONTRATADA\par\par\par
_______________________________________\par\b {CLI_NOMERAZAO}\b0\par CONTRATANTE\par\par\ql
\b TESTEMUNHAS:\b0\par\par
1\'aa _______________________________________\par Nome:\par CPF:\par\par
2\'aa _______________________________________\par Nome:\par CPF:\par
}`;

const DEFAULT_PROPOSTA_RTF = String.raw`{\rtf1\ansi\ansicpg1252\deff0{\fonttbl{\f0 Times New Roman;}{\f1 Arial;}}\paperw11906\paperh16838\margl1440\margr1106\margt1417\margb1417
\fs26\qr\b Proposta Loca\'e7\'e3o Equipamentos\b0\par\par
\fs32\b {CLI_NOMERAZAO}\b0\par
\fs24 {EMP_CIDADE}, {DIA} de {MES_EX} de {ANO}.\par
Validade da proposta: 20 dias\par\par\par
\ql\b A\b0\par {CLI_NOMERAZAO}\par ATT.:\par REF.: Proposta Loca\'e7\'e3o impressoras e multifuncionais\par\par
\i Prezados Senhores:\i0\par\par
Submetemos \u224? aprecia\'e7\'e3o a proposta de loca\'e7\'e3o de equipamentos para impress\'e3o, contemplando fornecimento, instala\'e7\'e3o, assist\'eancia t\'e9cnica e gest\'e3o do parque contratado.\par\par
A seguir apresentaremos:\par
\bullet\tab Proposta comercial\par
\bullet\tab Benef\'edcios\par
\bullet\tab Solu\'e7\'f5es\par
\bullet\tab Premissas\par
\bullet\tab Condi\'e7\'f5es gerais\par
\bullet\tab Termo de aceite e confidencialidade\par\par
\b PROPOSTA COMERCIAL\b0\par\par
O presente documento tem como objeto a loca\'e7\'e3o de {QTD_MAQUINAS} impressora(s), conforme abaixo:\par\par
[TABLE]\par\par
Pelo uso da infraestrutura, a empresa efetuar\'e1 o pagamento mensal conforme modalidade descrita, considerando valores expressos em reais.\par\par
\b CONDI\'c7\'d5ES GERAIS\b0\par
\bullet\tab Per\'edodo de loca\'e7\'e3o: {CTR_PERIODO}.\par
\bullet\tab Valor mensal: {CTR_VALOR_MENSAL}.\par
\bullet\tab Franquia: {CTR_FRANQUIA}.\par
\bullet\tab Vencimento mensal: dia {CLI_VENC_DIA}.\par\par
Colocamo-nos \u224? disposi\'e7\'e3o para eventuais esclarecimentos.\par\par
Atenciosamente,\par\par
{EMP_NOMERAZAO}\par\par
\b TERMO DE ACEITE\b0\par\par
Pelo presente, a empresa declara estar de acordo com as condi\'e7\'f5es comerciais e servi\'e7os apresentados nesta proposta.\par\par
{EMP_CIDADE}, {DIA} de {MES_EX} de {ANO}.\par\par\par
_______________________________________\par\b {CLI_NOMERAZAO}\b0\par LOCAT\'c1RIO\par
}`;

function cfg(){
  if(typeof db === 'undefined') return {contrato:'', proposta:''};
  db.config = db.config || {};
  db.config.rtfTemplates = db.config.rtfTemplates || { contrato:'', proposta:'' };
  return db.config.rtfTemplates;
}
function texto(v){ return String(v ?? '').trim(); }
function n(v, fb=0){ const out = Number(String(v ?? '').replace(',', '.')); return Number.isFinite(out) ? out : fb; }
function dataBR(v){ if(typeof fmtDate === 'function') return fmtDate(v); if(!v) return ''; const d=new Date(v); return Number.isNaN(d.getTime()) ? texto(v) : d.toLocaleDateString('pt-BR'); }
function dinheiro(v){ return typeof fmtMoney === 'function' ? fmtMoney(n(v)) : n(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function rtf(v){
  const s = texto(v);
  let out = '';
  for(const ch of s){
    const code = ch.charCodeAt(0);
    if(ch === '\\') out += '\\\\';
    else if(ch === '{') out += '\\{';
    else if(ch === '}') out += '\\}';
    else if(ch === '\n') out += '\\par ';
    else if(code > 127) out += `\\u${code}?`;
    else out += ch;
  }
  return out;
}
function extensoDia(nDia){ return String(nDia || '').padStart(2,'0'); }
function mesNome(d){ return d.toLocaleDateString('pt-BR', { month:'long' }); }
function cpfCnpjEx(doc){ return String(doc || '').replace(/\D/g,'').length > 11 ? 'CNPJ' : 'CPF'; }
function getEmpresa(sess){ return (db.empresas || []).find(e => e.id === (sess && sess.empresaId)) || {}; }
function getCliente(id){ return (db.clientes || []).find(c => c.id === id) || {}; }
function getContrato(id){ return (db.contratos || []).find(c => c.id === id) || {}; }
function getEquip(id){ return (db.equipamentos || []).find(e => e.id === id) || {}; }
function maquinasContrato(c){
  const seen = new Set();
  return (db.parque || []).filter(p => p.contratoId === c.id || (c.clienteId && p.clienteId === c.clienteId)).filter(p => {
    const k = p.id || `${p.equipamentoId}-${p.contratoId}`;
    if(seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
function tableRtf(maqs){
  if(!maqs.length) return 'Nenhum equipamento cadastrado.\\par ';
  let out = 'Patrim\\u244?nio\\tab Modelo\\tab Serial\\tab Local\\par ';
  out += '------------------------------------------------------------\\par ';
  maqs.forEach(p => {
    const e = getEquip(p.equipamentoId);
    out += `${rtf(e.patrimonio || p.patrimonio || '-')}\\tab ${rtf(e.modelo || '')}\\tab ${rtf(e.serie || '')}\\tab ${rtf(p.setor || '')} ${rtf(p.localInstalacao || '')}\\par `;
  });
  return out;
}
function campos(contratoId){
  const sess = typeof getSession === 'function' ? getSession() : null;
  const emp = getEmpresa(sess) || {};
  const c = getContrato(contratoId);
  const cli = getCliente(c.clienteId);
  const hoje = new Date();
  const maqs = maquinasContrato(c);
  const map = {
    CLI_NOMERAZAO: cli.nome || cli.fantasia || '',
    CLI_CPFCNPJ_EX: cpfCnpjEx(cli.documento),
    CLI_CPFCNPJ: cli.documento || '',
    CLI_RGIE: cli.ie || cli.rg || '',
    CLI_ENDERECO: cli.endereco || '',
    CLI_NUMERO: cli.numero || '',
    CLI_BAIRRO: cli.bairro || '',
    CLI_CIDADE: cli.cidade || '',
    CLI_UF_EX: cli.estado || cli.uf || '',
    CLI_CEP: cli.cep || '',
    CLI_FORMA_PGTO: c.formaPagamento || 'mensalidade',
    CLI_VENC_DIA: c.diaVencimento || 10,
    CLI_VENC_DIA_EX: extensoDia(c.diaVencimento || 10),
    EMP_NOMERAZAO: emp.nome || emp.fantasia || 'DIGICOPY',
    EMP_CPFCNPJ_EX: 'CNPJ',
    EMP_CPFCNPJ: emp.cnpj || (sess && sess.cnpj) || '',
    EMP_RGIE: emp.ie || '',
    EMP_ENDERECO: emp.endereco || emp.logradouro || '',
    EMP_NUMERO: emp.numero || '',
    EMP_BAIRRO: emp.bairro || '',
    EMP_CIDADE: emp.cidade || emp.municipio || 'Bocaiúva',
    EMP_UF_EX: emp.estado || emp.uf || 'MG',
    EMP_CEP: emp.cep || '',
    DATA_INICIO: dataBR(c.dataInicio),
    DATA_TERMINO: dataBR(c.dataFim),
    QTD_MAQUINAS: maqs.length,
    CTR_VALOR_MENSAL: dinheiro(c.valorMensalFixo || 0),
    CTR_FRANQUIA: `${n(c.franquiaPB,0).toLocaleString('pt-BR')} páginas`,
    CTR_PERIODO: `${dataBR(c.dataInicio)} a ${dataBR(c.dataFim)}`,
    DIA: hoje.getDate(),
    MES_EX: mesNome(hoje),
    ANO: hoje.getFullYear(),
    AVISO: 30,
    AVISO_EX: 'trinta',
    AVISO_TIPO: 'dias'
  };
  return { map, table: tableRtf(maqs), contrato:c };
}
function aplicarTemplate(template, contratoId){
  const base = String(template || '');
  const c = campos(contratoId);
  let out = base.replace(/\[TABLE\]/g, c.table);
  Object.keys(c.map).forEach(k => {
    const val = rtf(c.map[k]);
    out = out.replace(new RegExp('\\\\?\\{'+k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\\\?\\}', 'g'), val);
  });
  out = out.replace(new RegExp('Printer'+'Store','gi'), 'DIGICOPY');
  return out;
}
function baixar(nome, conteudo){
  const blob = new Blob([conteudo], { type:'application/rtf' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

window.RTF_TEMPLATE_PURE = { rtf, aplicarTemplate, DEFAULT_CONTRATO_RTF, DEFAULT_PROPOSTA_RTF };

if(typeof window === 'undefined' || typeof document === 'undefined') return;

window.baixarContratoRTF = function(contratoId, tipo){
  const c = getContrato(contratoId);
  const codigo = (String(c.numero || c.codigoAntigo || c.id).match(/\d+/g) || ['contrato']).pop().replace(/^0+/,'') || '0';
  const conf = cfg();
  const template = tipo === 'proposta' ? (conf.proposta || DEFAULT_PROPOSTA_RTF) : (conf.contrato || DEFAULT_CONTRATO_RTF);
  const rtfFinal = aplicarTemplate(template, contratoId);
  baixar(`${tipo === 'proposta' ? 'proposta' : 'contrato'}-${codigo}.rtf`, rtfFinal);
};

function renderCardConfig(){
  const grid = document.querySelector('#view-config .grid');
  if(!grid || document.getElementById('rtf-template-card')) return;
  const c = cfg();
  const card = document.createElement('div');
  card.id = 'rtf-template-card';
  card.className = 'rounded-[16px] bg-white border p-6 lg:col-span-3';
  card.innerHTML = `
    <h4 class="font-bold text-[14px]"><i class="ph ph-file-rtf"></i> Modelos RTF de contrato/proposta</h4>
    <p class="mt-1 text-[11.5px] text-slate-500">Cole aqui o conteúdo RTF original. O sistema troca campos como <b>{CLI_NOMERAZAO}</b>, <b>{DATA_INICIO}</b> e <b>[TABLE]</b>.</p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
      <div><label class="text-[11px] uppercase font-bold text-slate-500">Contrato RTF</label><textarea id="cfg-rtf-contrato" class="mt-1 w-full h-52 p-3 rounded-xl border font-mono text-[11px]" placeholder="Cole o RTF de contrato aqui">${(c.contrato||'').replace(/[&<>]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]))}</textarea></div>
      <div><label class="text-[11px] uppercase font-bold text-slate-500">Proposta RTF</label><textarea id="cfg-rtf-proposta" class="mt-1 w-full h-52 p-3 rounded-xl border font-mono text-[11px]" placeholder="Cole o RTF de proposta aqui">${(c.proposta||'').replace(/[&<>]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]))}</textarea></div>
    </div>
    <div class="mt-3 flex gap-2"><button onclick="salvarTemplatesRTF()" class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white font-bold">Salvar modelos RTF</button><button onclick="limparTemplatesRTF()" class="h-10 px-4 rounded-xl bg-white border font-bold">Usar modelos padrão</button></div>`;
  grid.appendChild(card);
}
window.salvarTemplatesRTF = function(){
  const c = cfg();
  c.contrato = document.getElementById('cfg-rtf-contrato')?.value || '';
  c.proposta = document.getElementById('cfg-rtf-proposta')?.value || '';
  if(typeof saveDB === 'function') saveDB();
  if(typeof toast === 'function') toast('Modelos RTF salvos', 'success');
};
window.limparTemplatesRTF = function(){
  const c = cfg(); c.contrato = ''; c.proposta = '';
  if(typeof saveDB === 'function') saveDB();
  if(typeof renderConfig === 'function') renderConfig();
  if(typeof toast === 'function') toast('Modelos padrão restaurados', 'info');
};
const oldRenderConfig = window.renderConfig;
window.renderConfig = function(){
  if(oldRenderConfig) oldRenderConfig.apply(this, arguments);
  setTimeout(renderCardConfig, 60);
};
setTimeout(renderCardConfig, 500);
console.log('[DIGICOPY] contratos_rtf_template_patch.js v4.9.18 carregado');
})();
