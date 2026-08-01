// ═══════════════════════════════════════════════════════════════════════════
// PATCH v4.9.20 — Upload de RTF e diagnóstico por arquivos
// • Permite carregar modelos .rtf/.txt pelo navegador em Configurações
// • Permite selecionar muitos arquivos JSON/RTF/TXT e baixar relatório .txt
// • Não altera dados da loja ao gerar diagnóstico
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

function texto(v){ return String(v ?? '').trim(); }
function bytesHumanos(n){
  n = Number(n || 0);
  if(n < 1024) return n + ' B';
  if(n < 1024*1024) return (n/1024).toFixed(1).replace('.', ',') + ' KB';
  return (n/1024/1024).toFixed(2).replace('.', ',') + ' MB';
}
function limitar(v, max){
  const s = String(v ?? '');
  return s.length > (max || 160) ? s.slice(0, max || 160) + '…' : s;
}
function colunasDeRows(rows){
  const set = new Set();
  (rows || []).slice(0, 20).forEach(r => Object.keys(r || {}).forEach(k => set.add(k)));
  return Array.from(set).sort((a,b)=>a.localeCompare(b, 'pt-BR', { numeric:true }));
}
function camposImportantes(row){
  const rx = /COD|ID|CLIENT|NOME|RAZAO|RAZÃO|FANTAS|LOC|CONTRAT|EQUIP|IMPRESS|MAQUINA|MÁQUINA|PATR|SERIE|SÉRIE|SERIAL|MODELO|DESCR|DATA|VALOR|FRANQ|CONT|DEP|SETOR|LOCAL|END|RUA|BAIRRO|CIDADE|UF|CEP/i;
  const out = {};
  Object.keys(row || {}).filter(k => rx.test(k)).slice(0, 80).forEach(k => out[k] = limitar(row[k], 180));
  return Object.keys(out).length ? out : Object.fromEntries(Object.entries(row || {}).slice(0, 40).map(([k,v]) => [k, limitar(v, 180)]));
}
function extrairRows(obj){
  if(Array.isArray(obj)) return obj;
  if(!obj || typeof obj !== 'object') return [];
  for(const k of ['dados','rows','data','registros','items','records']){
    if(Array.isArray(obj[k])) return obj[k];
  }
  const arrays = Object.values(obj).filter(Array.isArray);
  if(arrays.length === 1) return arrays[0];
  return [obj];
}
function analisarJsonTexto(nome, conteudo){
  let parsed;
  try{ parsed = JSON.parse(conteudo); }
  catch(err){ return { nome, tipo:'json-invalido', erro:String(err.message || err), linhas:[] }; }
  const rows = extrairRows(parsed);
  const cols = colunasDeRows(rows);
  return {
    nome,
    tipo:'json',
    total: rows.length,
    topKeys: parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? Object.keys(parsed).sort() : [],
    colunas: cols,
    amostras: rows.slice(0, 3).map(camposImportantes)
  };
}
function extrairPlaceholdersRTF(conteudo){
  const set = new Set();
  String(conteudo || '').replace(/\\?\{([A-Z0-9_*]+)\\?\}/g, (m, g) => { if(g && g.length <= 40) set.add(g); return m; });
  if(String(conteudo || '').includes('[TABLE]')) set.add('[TABLE]');
  return Array.from(set).sort();
}
function analisarTexto(nome, conteudo){
  const ext = nome.toLowerCase().split('.').pop();
  const ph = extrairPlaceholdersRTF(conteudo);
  return {
    nome,
    tipo: ext === 'rtf' || /^\s*\{\\rtf/i.test(conteudo) ? 'rtf/texto' : 'texto',
    caracteres: String(conteudo || '').length,
    placeholders: ph,
    primeirasLinhas: String(conteudo || '').split(/\r?\n/).slice(0, 30).map(x => limitar(x, 220))
  };
}
function relatorioAnalises(analises){
  const out = [];
  out.push('DIAGNÓSTICO DE ARQUIVOS SELECIONADOS');
  out.push('Gerado em: ' + new Date().toLocaleString('pt-BR'));
  out.push('Total de arquivos: ' + analises.length);
  out.push('');
  analises.forEach(a => {
    out.push('='.repeat(90));
    out.push('ARQUIVO: ' + a.nome);
    out.push('TIPO: ' + a.tipo);
    if(a.tamanho) out.push('TAMANHO: ' + a.tamanho);
    if(a.erro) out.push('ERRO: ' + a.erro);
    if(a.tipo === 'json'){
      out.push('REGISTROS ESTIMADOS: ' + a.total);
      if(a.topKeys && a.topKeys.length) out.push('CHAVES DO OBJETO: ' + a.topKeys.join(', '));
      out.push('COLUNAS: ' + a.colunas.join(', '));
      (a.amostras || []).forEach((am, idx) => out.push('AMOSTRA ' + (idx+1) + ': ' + JSON.stringify(am, null, 2)));
    } else {
      if(a.placeholders && a.placeholders.length) out.push('PLACEHOLDERS: ' + a.placeholders.join(', '));
      if(a.primeirasLinhas && a.primeirasLinhas.length) out.push('PRIMEIRAS LINHAS:\n' + a.primeirasLinhas.join('\n'));
    }
    out.push('');
  });
  return out.join('\n');
}
function gerarDiagnosticoArquivosTextos(arquivos){
  const analises = (arquivos || []).map(arq => {
    const nome = arq.nome || arq.name || 'arquivo';
    const conteudo = arq.conteudo || arq.texto || '';
    const lower = nome.toLowerCase();
    const base = lower.endsWith('.json') ? analisarJsonTexto(nome, conteudo) : analisarTexto(nome, conteudo);
    base.tamanho = arq.tamanho || bytesHumanos(conteudo.length);
    return base;
  });
  return relatorioAnalises(analises);
}

window.ARQUIVOS_MODELOS_PURE = { extrairPlaceholdersRTF, analisarJsonTexto, gerarDiagnosticoArquivosTextos };

if(typeof window === 'undefined' || typeof document === 'undefined') return;

function baixarTxt(nome, conteudo){
  const blob = new Blob([conteudo], { type:'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function lerArquivo(file, encoding){
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ''));
    fr.onerror = () => reject(fr.error || new Error('Falha ao ler arquivo'));
    fr.readAsText(file, encoding || 'windows-1252');
  });
}
function escapeHtml(v){ return String(v ?? '').replace(/[&<>]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch])); }

window.carregarTemplateRTFArquivo = async function(tipo, input){
  const file = input && input.files && input.files[0];
  if(!file) return;
  try{
    const conteudo = await lerArquivo(file, 'windows-1252');
    const id = tipo === 'proposta' ? 'cfg-rtf-proposta' : 'cfg-rtf-contrato';
    const area = document.getElementById(id);
    if(area) area.value = conteudo;
    if(typeof salvarTemplatesRTF === 'function') salvarTemplatesRTF();
    if(typeof toast === 'function') toast('Modelo RTF carregado: ' + file.name, 'success');
  }catch(err){
    if(typeof toast === 'function') toast('Não consegui ler o arquivo RTF', 'error');
  }finally{
    if(input) input.value = '';
  }
};
function inserirUploadsRTF(){
  const card = document.getElementById('rtf-template-card');
  if(!card || document.getElementById('rtf-upload-row')) return;
  const alvo = card.querySelector('.mt-3.flex') || card;
  alvo.insertAdjacentHTML('beforebegin', `
    <div id="rtf-upload-row" class="mt-3 rounded-xl border bg-slate-50 p-3">
      <p class="text-[12px] text-slate-600 mb-2"><b>Carregar arquivo RTF:</b> selecione o arquivo original no seu computador. O conteúdo será salvo no campo acima.</p>
      <div class="flex flex-wrap gap-2">
        <label class="h-10 px-4 rounded-xl bg-white border font-bold text-[12px] cursor-pointer flex items-center gap-2"><i class="ph ph-upload-simple"></i> Contrato .rtf<input type="file" accept=".rtf,.txt" class="hidden" onchange="carregarTemplateRTFArquivo('contrato', this)"></label>
        <label class="h-10 px-4 rounded-xl bg-white border font-bold text-[12px] cursor-pointer flex items-center gap-2"><i class="ph ph-upload-simple"></i> Proposta .rtf<input type="file" accept=".rtf,.txt" class="hidden" onchange="carregarTemplateRTFArquivo('proposta', this)"></label>
      </div>
    </div>`);
}

window.processarArquivosDiagnostico = async function(input){
  const files = Array.from((input && input.files) || []);
  if(!files.length){ if(typeof toast === 'function') toast('Selecione os arquivos primeiro', 'info'); return; }
  const status = document.getElementById('diag-arquivos-status');
  if(status) status.innerText = 'Lendo ' + files.length + ' arquivo(s)...';
  const itens = [];
  for(const file of files){
    try{
      const conteudo = await lerArquivo(file, 'windows-1252');
      itens.push({ nome:file.webkitRelativePath || file.name, conteudo, tamanho:bytesHumanos(file.size) });
    }catch(err){
      itens.push({ nome:file.webkitRelativePath || file.name, conteudo:'', tamanho:bytesHumanos(file.size), erro:String(err && err.message || err) });
    }
  }
  const rel = gerarDiagnosticoArquivosTextos(itens);
  baixarTxt('diagnostico-arquivos-selecionados.txt', rel);
  if(status) status.innerText = 'Relatório TXT gerado com ' + files.length + ' arquivo(s).';
  if(input) input.value = '';
};

function inserirDiagnosticoArquivos(){
  const banco = document.getElementById('view-banco');
  if(!banco || document.getElementById('diag-arquivos-card')) return;
  banco.insertAdjacentHTML('afterbegin', `
    <div id="diag-arquivos-card" class="rounded-xl border bg-blue-50 border-blue-200 p-3 flex flex-wrap items-center justify-between gap-3">
      <div><b class="text-blue-900">Diagnóstico por arquivos</b><p class="text-[12px] text-blue-800">Selecione JSON/RTF/TXT de qualquer pasta. O sistema não importa nem altera dados: só gera um relatório .txt para análise.</p><p id="diag-arquivos-status" class="text-[11px] text-blue-700 mt-1">Aguardando seleção.</p></div>
      <label class="h-10 px-4 rounded-xl bg-[#0a1e8a] text-white font-bold text-[12px] cursor-pointer flex items-center gap-2"><i class="ph ph-files"></i> Selecionar arquivos e baixar TXT<input type="file" multiple accept=".json,.txt,.rtf" class="hidden" onchange="processarArquivosDiagnostico(this)"></label>
    </div>`);
}

const oldAbrirDiag = window.abrirDiagnosticoMigracao;
window.abrirDiagnosticoMigracao = function(){
  const rel = (window.DIAGNOSTICO_MIGRACAO_PURE && window.DIAGNOSTICO_MIGRACAO_PURE.diagnosticoMigracao) ? window.DIAGNOSTICO_MIGRACAO_PURE.diagnosticoMigracao(db || {}) : 'Diagnóstico indisponível';
  baixarTxt('diagnostico-tabelas-migradas.txt', rel);
  if(typeof toast === 'function') toast('Diagnóstico baixado em TXT', 'success');
};

const oldRenderConfig = window.renderConfig;
window.renderConfig = function(){
  if(oldRenderConfig) oldRenderConfig.apply(this, arguments);
  setTimeout(inserirUploadsRTF, 80);
};
const oldRenderBanco = window.renderBanco;
window.renderBanco = function(){
  if(oldRenderBanco) oldRenderBanco.apply(this, arguments);
  setTimeout(inserirDiagnosticoArquivos, 80);
};
setInterval(() => { inserirUploadsRTF(); inserirDiagnosticoArquivos(); }, 1200);
console.log('[DIGICOPY] arquivos_modelos_diagnostico_patch.js v4.9.20 carregado');
})();
