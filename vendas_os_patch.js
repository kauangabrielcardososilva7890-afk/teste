// ═══════════════════════════════════════════════════════════════════════════
// VENDAS_OS_PATCH v4.2.0 — Tela de Vendas + Ordem de Serviço completa
// - Nova venda: código automático, data/hora, usuário, cliente, destino, prazo
// - Aba Itens: tipo, produto/serviço/recarga/toner/manutenção, nº cartucho,
//   identificação, qtd, unitário, desconto, total, situação, PE, PS, técnico
// - Aba OS: série, modelo, tipo, patrimônio, contador, acessórios, técnico,
//   entrega, garantia, defeito, serviços, peças, valor, desconto, situação
// - Busca automática por serial (preenche e avisa última ocorrência)
// - Faturamento: à vista conclui; a prazo abre parcelas + carnê (sem boleto)
// - Impressão A4: venda = meia folha; venda + OS completa = folha inteira
// - Consulta: filtros avançados + colunas com ordenação pelo título
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';

/* VOS_PURE_START */
// ── Helpers puros (sem DOM/banco) — também usados pelo teste automatizado ──
function vosPad4(n){ return String(Math.max(0,parseInt(n,10)||0)).padStart(4,'0'); }
function vosNumeroInt(num){ const m=String(num||'').match(/(\d+)(?!.*\d)/); return m?parseInt(m[1],10):0; }
function vosNextNumero(prefix, ano, lista){
  let max=0;
  (lista||[]).forEach(x=>{ const n=vosNumeroInt(x && x.numero); if(n>max) max=n; });
  return prefix + '-' + ano + '-' + vosPad4(max+1);
}
// Regra oficial: OS só entra na notinha com Modelo + Nº série + (Patrimônio OU Contador)
function vosOsCompleta(os){
  if(!os) return false;
  const modelo = String(os.modelo||'').trim();
  const serie  = String(os.numeroSerie||'').trim();
  const patr   = String(os.patrimonio||'').trim();
  const cont   = String(os.contador==null?'':os.contador).trim();
  return !!(modelo && serie && (patr || cont));
}
function vosAddDias(date, dias){ const d=new Date(date.getTime()); d.setDate(d.getDate()+dias); return d; }
function vosAddMesesDiaFixo(base, meses, dia){
  const d=new Date(base.getTime());
  const alvoMes=d.getMonth()+meses;
  const ano=d.getFullYear()+Math.floor(alvoMes/12);
  const mes=((alvoMes%12)+12)%12;
  const ultimo=new Date(ano, mes+1, 0).getDate();
  d.setFullYear(ano, mes, Math.min(dia, ultimo));
  return d;
}
// Gera parcelas: valor, {parcelas, primeiroVencimento 'YYYY-MM-DD', intervaloDias, diaFixo, jurosMes (%a.m.), hoje}
function vosCalcParcelas(valor, opts){
  opts = opts||{};
  const n = Math.max(1, parseInt(opts.parcelas,10)||1);
  const juros = parseFloat(opts.jurosMes)||0;
  const intervalo = Math.max(1, parseInt(opts.intervaloDias,10)||30);
  const diaFixo = parseInt(opts.diaFixo,10)||0;
  let hoje;
  if(opts.hoje){
    hoje = (opts.hoje instanceof Date) ? new Date(opts.hoje.getTime()) : new Date(String(opts.hoje).slice(0,10)+'T00:00:00');
    if(isNaN(hoje)) hoje = new Date();
  } else hoje = new Date();
  hoje.setHours(0,0,0,0);
  let prim;
  if(opts.primeiroVencimento){
    prim = new Date(String(opts.primeiroVencimento).slice(0,10)+'T12:00:00');
    if(isNaN(prim)) prim = vosAddDias(hoje, intervalo);
  } else prim = vosAddDias(hoje, intervalo);
  const base = Math.round((valor/n)*100)/100;
  const out = [];
  let acum = 0;
  for(let i=0;i<n;i++){
    const venc = diaFixo>0 ? vosAddMesesDiaFixo(prim, i, diaFixo) : vosAddDias(prim, i*intervalo);
    const venc0 = new Date(venc.getTime()); venc0.setHours(0,0,0,0);
    const dias = Math.max(0, Math.round((venc0-hoje)/86400000));
    const val = Math.round(base*(1+(juros/100)*(dias/30))*100)/100;
    out.push({n:i+1, vencimento:venc.toISOString(), valor:val});
    acum += val;
  }
  return { parcelas: out, total: Math.round(acum*100)/100 };
}
/* VOS_PURE_END */
window.__vosPure = { vosOsCompleta, vosCalcParcelas, vosNextNumero, vosNumeroInt };

// ── Estado temporário do formulário ──
function vosNovoForm(){
  const agora = new Date();
  return {
    vendaId: null,
    cliente: null,
    produtoSel: null,
    itens: [],
    codigo: '',
    data: agora.toISOString().slice(0,10),
    hora: agora.toTimeString().slice(0,5)
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// NOVA VENDA — modal completo com abas Itens / Ordem de Serviço
// ═══════════════════════════════════════════════════════════════════════════
window.novaVenda = function(){
  const sess = getSession(); if(!sess) return;
  window.__vosForm = vosNovoForm();
  const f = window.__vosForm;
  f.codigo = vosNextNumero('VD', new Date().getFullYear(), db.vendas.filter(v=>v.empresaId===sess.empresaId));
  const box = document.getElementById('modal-box');
  if(box) box.className = 'w-full max-w-[1180px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[94vh] flex flex-col';
  document.getElementById('modal-title').innerText = 'Nova venda / Notinha';
  const anoHoje = f.data.split('-').reverse().join('/');
  document.getElementById('modal-body').innerHTML = `
  <div class="space-y-3">
    <!-- Cabeçalho: código, data, hora, atendente -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
      <div class="rounded-xl bg-[#0a1e8a] text-white p-3">
        <p class="text-[10px] uppercase font-bold text-white/70">Código (automático)</p>
        <p class="font-bold text-[15px]" id="vos-codigo">${escapeHtml(f.codigo)}</p>
      </div>
      <div class="rounded-xl border p-3">
        <p class="text-[10px] uppercase font-bold text-slate-500">Data</p>
        <p class="font-bold text-[14px]">${anoHoje}</p>
      </div>
      <div class="rounded-xl border p-3">
        <p class="text-[10px] uppercase font-bold text-slate-500">Hora</p>
        <p class="font-bold text-[14px]">${f.hora}</p>
      </div>
      <div class="rounded-xl border p-3">
        <p class="text-[10px] uppercase font-bold text-slate-500">Usuário / Vendedor</p>
        <p class="font-bold text-[14px]">${escapeHtml(sess.usuarioNome)}</p>
      </div>
    </div>

    <!-- Cliente -->
    <div class="rounded-[14px] border-2 border-[#0a1e8a]/20 bg-[#f8f9ff] p-3">
      <div class="flex gap-2 items-end">
        <div class="flex-1 relative">
          <label class="text-[11px] font-bold uppercase text-[#0a1e8a]">Cliente * — busque por código, nome, CPF/CNPJ, endereço ou telefone</label>
          <div class="relative mt-1">
            <i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[#0a1e8a]"></i>
            <input id="vos-cli-search" oninput="vosVendaSearchCliente(this.value)" placeholder="Ex: 1844, JOAO LUCAS, 45.123.678/0001-12, Rua Albino..." class="w-full h-[44px] pl-10 pr-3 rounded-xl border-2 border-[#0a1e8a]/20 bg-white focus:border-[#0a1e8a] outline-none text-[13px] font-medium">
          </div>
          <div id="vos-cli-results" class="hidden absolute z-30 left-0 right-0 mt-1 max-h-[240px] overflow-auto rounded-xl border bg-white shadow-xl text-[12.5px]"></div>
        </div>
        <button onclick="openModal('cliente')" class="h-[44px] px-4 rounded-xl bg-[#0a1e8a] text-white text-[12px] font-bold flex items-center gap-1 shrink-0"><i class="ph ph-user-plus"></i> Novo cliente</button>
      </div>
      <div id="vos-cli-selecionado" class="hidden mt-2 rounded-xl bg-white border border-[#0a1e8a]/20 p-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-[#0a1e8a] text-white grid place-items-center font-bold text-[12px]" id="vos-cli-avatar"></div>
          <div>
            <p class="font-bold text-[13px]" id="vos-cli-nome"></p>
            <p class="text-[11px] text-slate-500" id="vos-cli-detalhes"></p>
          </div>
        </div>
        <button onclick="vosVendaClearCliente()" class="w-8 h-8 grid place-items-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"><i class="ph ph-x"></i></button>
      </div>
    </div>

    <!-- Destino / datas -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
      <div><label class="text-[11px] font-bold uppercase text-slate-500">Destino / local de entrega</label>
        <input id="vos-destino" placeholder="Ex: no cliente, balcão, sede..." class="mt-1 w-full h-[40px] px-3 rounded-xl border text-[13px]"></div>
      <div><label class="text-[11px] font-bold uppercase text-slate-500">Data de saída</label>
        <input id="vos-data-saida" type="date" value="${f.data}" class="mt-1 w-full h-[40px] px-3 rounded-xl border text-[13px]"></div>
      <div><label class="text-[11px] font-bold uppercase text-slate-500">Prazo de entrega</label>
        <input id="vos-prazo-entrega" type="date" class="mt-1 w-full h-[40px] px-3 rounded-xl border text-[13px]"></div>
    </div>

    <!-- Abas -->
    <div class="flex border-b border-slate-200">
      <button id="vos-tab-itens" onclick="vosSetAba('itens')" class="px-5 py-2 text-[13px] font-bold border-b-2 border-[#0a1e8a] text-[#0a1e8a]">Itens</button>
      <button id="vos-tab-os" onclick="vosSetAba('os')" class="px-5 py-2 text-[13px] font-bold border-b-2 border-transparent text-slate-500">Ordem de Serviço <span id="vos-tab-os-badge" class="hidden ml-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px]">folha inteira</span></button>
    </div>

    <!-- ABA ITENS -->
    <div id="vos-aba-itens" class="space-y-2">
      <div class="rounded-[14px] border bg-[#f8f9ff] p-3 space-y-2">
        <div class="grid grid-cols-12 gap-2 items-end">
          <label class="col-span-12 md:col-span-2 text-[11px] font-bold uppercase text-slate-500">Tipo
            <select id="vos-item-tipo" onchange="vosOnTipoItem()" class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-white text-[12px]">
              <option>Produto</option><option>Serviço</option><option>Recarga de cartucho</option><option>Toner</option><option>Manutenção</option>
            </select></label>
          <label class="col-span-10 md:col-span-5 text-[11px] font-bold uppercase text-slate-500 relative">Descrição ou código do produto/serviço
            <input id="vos-prod-search" oninput="vosVendaSearchProd(this.value)" placeholder="Digite para buscar ou escreva a descrição manual..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]">
            <div id="vos-prod-results" class="hidden absolute z-30 left-0 right-0 top-full mt-1 max-h-[200px] overflow-auto rounded-xl border bg-white shadow-xl text-[12px]"></div>
          </label>
          <button onclick="openModal('produto')" class="hidden md:flex col-span-1 h-[40px] rounded-xl bg-white border text-[#0a1e8a] items-center justify-center" title="Cadastrar produto"><i class="ph ph-plus-circle text-[18px]"></i></button>
          <label class="col-span-3 md:col-span-1 text-[11px] font-bold uppercase text-slate-500">Qtd
            <input id="vos-item-qtd" type="number" min="1" value="1" oninput="vosItemCalcTotal()" class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-white text-[12.5px]"></label>
          <label class="col-span-4 md:col-span-1 text-[11px] font-bold uppercase text-slate-500">V. Unit
            <input id="vos-item-vunit" type="number" step="0.01" value="" oninput="vosItemCalcTotal()" class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-white text-[12.5px]"></label>
          <label class="col-span-5 md:col-span-1 text-[11px] font-bold uppercase text-slate-500">Desc R$
            <input id="vos-item-desc" type="number" step="0.01" value="0" oninput="vosItemCalcTotal()" class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-white text-[12.5px]"></label>
          <label class="col-span-12 md:col-span-1 text-[11px] font-bold uppercase text-slate-500">Total
            <input id="vos-item-total" readonly class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-slate-100 text-[12.5px] font-bold"></label>
        </div>
        <div id="vos-item-extra" class="hidden grid grid-cols-12 gap-2 items-end border-t border-[#0a1e8a]/10 pt-2">
          <label class="col-span-6 md:col-span-2 text-[11px] font-bold uppercase text-slate-500">Nº do cartucho
            <input id="vos-item-cartucho" class="mt-1 w-full h-[38px] px-2 rounded-xl border bg-white text-[12px]"></label>
          <label class="col-span-6 md:col-span-3 text-[11px] font-bold uppercase text-slate-500">Identificação / comanda
            <input id="vos-item-ident" class="mt-1 w-full h-[38px] px-2 rounded-xl border bg-white text-[12px]"></label>
          <label class="col-span-5 md:col-span-2 text-[11px] font-bold uppercase text-slate-500">Situação
            <select id="vos-item-sit" class="mt-1 w-full h-[38px] px-2 rounded-xl border bg-white text-[12px]"><option>Pendente</option><option>Executando</option><option>Pronto</option><option>Entregue</option></select></label>
          <label class="col-span-3 md:col-span-1 text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1 mt-5"><input type="checkbox" id="vos-item-pe" class="w-4 h-4 accent-[#0a1e8a]"> PE</label>
          <label class="col-span-3 md:col-span-1 text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1 mt-5"><input type="checkbox" id="vos-item-ps" class="w-4 h-4 accent-[#0a1e8a]"> PS</label>
          <label class="col-span-6 md:col-span-3 text-[11px] font-bold uppercase text-slate-500">Técnico / responsável
            <input id="vos-item-tec" list="vos-tec-list" class="mt-1 w-full h-[38px] px-2 rounded-xl border bg-white text-[12px]"></label>
        </div>
        <div class="flex justify-end">
          <button onclick="vosAddItem()" class="h-[40px] px-5 rounded-xl bg-emerald-600 text-white text-[12.5px] font-bold flex items-center gap-2"><i class="ph ph-plus-circle"></i> Adicionar item</button>
        </div>
      </div>
      <div class="rounded-[14px] border overflow-hidden bg-white">
        <div class="max-h-[220px] overflow-auto">
          <table class="w-full text-left text-[12px]">
            <thead class="sticky top-0 bg-slate-50 border-b text-[10.5px] uppercase font-bold text-slate-500">
              <tr><th class="px-3 py-2">Tipo</th><th class="px-3 py-2">Descrição</th><th class="px-3 py-2">Ident./Cartucho</th><th class="px-3 py-2">Qtd</th><th class="px-3 py-2">V.Unit</th><th class="px-3 py-2">Desc</th><th class="px-3 py-2">Total</th><th class="px-3 py-2">Situação</th><th class="px-3 py-2">PE</th><th class="px-3 py-2">PS</th><th class="px-3 py-2">Técnico</th><th class="px-2 py-2"></th></tr>
            </thead>
            <tbody id="vos-itens-body" class="divide-y"><tr><td colspan="12" class="text-center text-slate-400 py-8">Nenhum item lançado</td></tr></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ABA OS -->
    <div id="vos-aba-os" class="hidden space-y-2">
      <div id="vos-serial-info" class="hidden rounded-xl border border-amber-300 bg-amber-50 p-3 text-[12px] text-amber-900"></div>
      <div class="rounded-[14px] border bg-[#f8f9ff] p-3 grid grid-cols-12 gap-2">
        <label class="col-span-6 md:col-span-3 text-[11px] font-bold uppercase text-slate-500">Número de série *
          <input id="vos-os-serie" onchange="vosBuscarSerial(this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault(); vosBuscarSerial(this.value);}" placeholder="Digite e tecle Enter..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>
        <label class="col-span-6 md:col-span-4 text-[11px] font-bold uppercase text-slate-500">Modelo do equipamento *
          <input id="vos-os-modelo" oninput="vosOsRuleHint()" class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>
        <label class="col-span-6 md:col-span-3 text-[11px] font-bold uppercase text-slate-500">Tipo da OS
          <select id="vos-os-tipo" class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-white text-[12.5px]"><option>Manutenção corretiva</option><option>Manutenção preventiva</option><option>Instalação</option><option>Retirada</option><option>Troca de equipamento</option><option>Recarga no local</option><option>Outros</option></select></label>
        <label class="col-span-6 md:col-span-2 text-[11px] font-bold uppercase text-slate-500">Patrimônio
          <input id="vos-os-patri" oninput="vosOsRuleHint()" class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>
        <label class="col-span-6 md:col-span-2 text-[11px] font-bold uppercase text-slate-500">Contador / qtd cópias
          <input id="vos-os-contador" oninput="vosOsRuleHint()" class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>
        <label class="col-span-12 md:col-span-4 text-[11px] font-bold uppercase text-slate-500">Acessórios
          <input id="vos-os-acess" placeholder="cabos, toner reserva, bandeja..." class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>
        <label class="col-span-6 md:col-span-3 text-[11px] font-bold uppercase text-slate-500">Técnico responsável
          <input id="vos-os-tec" list="vos-tec-list" class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>
        <label class="col-span-6 md:col-span-3 text-[11px] font-bold uppercase text-slate-500">Responsável pela entrega
          <input id="vos-os-entrega" list="vos-tec-list" class="mt-1 w-full h-[40px] px-3 rounded-xl border bg-white text-[12.5px]"></label>
        <label class="col-span-6 md:col-span-2 text-[11px] font-bold uppercase text-slate-500">Garantia
          <select id="vos-os-garantia" class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-white text-[12.5px]"><option>Sem garantia</option><option>7 dias</option><option>30 dias</option><option>60 dias</option><option>90 dias</option></select></label>
        <label class="col-span-6 md:col-span-2 text-[11px] font-bold uppercase text-slate-500">Valor serviço R$
          <input id="vos-os-valor" type="number" step="0.01" value="0" oninput="vosResumoVenda()" class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-white text-[12.5px]"></label>
        <label class="col-span-6 md:col-span-2 text-[11px] font-bold uppercase text-slate-500">Desconto OS R$
          <input id="vos-os-desc" type="number" step="0.01" value="0" oninput="vosResumoVenda()" class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-white text-[12.5px]"></label>
        <label class="col-span-12 md:col-span-4 text-[11px] font-bold uppercase text-slate-500">Situação da OS
          <select id="vos-os-situacao" class="mt-1 w-full h-[40px] px-2 rounded-xl border bg-white text-[12.5px]"><option>Aberta</option><option>Em execução</option><option>Aguardando peça</option><option>Concluída</option><option>Entregue</option></select></label>
        <label class="col-span-12 text-[11px] font-bold uppercase text-slate-500">Defeito apresentado
          <textarea id="vos-os-defeito" class="mt-1 w-full h-[52px] p-2 rounded-xl border bg-white text-[12.5px]"></textarea></label>
        <label class="col-span-12 md:col-span-6 text-[11px] font-bold uppercase text-slate-500">Serviços executados
          <textarea id="vos-os-servicos" class="mt-1 w-full h-[52px] p-2 rounded-xl border bg-white text-[12.5px]"></textarea></label>
        <label class="col-span-12 md:col-span-6 text-[11px] font-bold uppercase text-slate-500">Peças utilizadas
          <textarea id="vos-os-pecas" class="mt-1 w-full h-[52px] p-2 rounded-xl border bg-white text-[12.5px]"></textarea></label>
      </div>
      <div id="vos-os-rule" class="rounded-xl border p-3 text-[12px]"></div>
    </div>

    <datalist id="vos-tec-list">${(db.tecnicos||[]).map(t=>`<option value="${escapeHtml(t.nome||t)}">`).join('')}</datalist>

    <!-- Rodapé: resumo, situação, obs -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-2 border-t pt-3">
      <div class="md:col-span-2 space-y-2">
        <label class="text-[11px] font-bold uppercase text-slate-500 block">Observações da venda
          <textarea id="vos-obs" class="mt-1 w-full h-[52px] p-2 rounded-xl border text-[12.5px]" placeholder="Anotações impressas na notinha..."></textarea></label>
        <div class="flex items-center gap-2">
          <label class="text-[11px] font-bold uppercase text-slate-500">Situação da venda</label>
          <select id="vos-status" class="h-[38px] px-3 rounded-xl border text-[12.5px] font-bold">
            <option value="aguardar">AGUARDAR</option>
            <option value="orcamento">ORÇAMENTO</option>
            <option value="aprovado">APROVADA</option>
          </select>
          <label class="text-[11px] font-bold uppercase text-slate-500 ml-2">Desconto venda R$</label>
          <input id="vos-desc-venda" type="number" step="0.01" value="0" oninput="vosResumoVenda()" class="w-[110px] h-[38px] px-2 rounded-xl border text-[12.5px]">
        </div>
      </div>
      <div class="rounded-[14px] bg-[#0a1e8a] text-white p-3 space-y-1">
        <div class="flex justify-between text-[12px] text-white/80"><span>Subtotal itens</span><b id="vos-sub-itens">R$ 0,00</b></div>
        <div class="flex justify-between text-[12px] text-white/80"><span>Serviço OS</span><b id="vos-sub-os">R$ 0,00</b></div>
        <div class="flex justify-between text-[12px] text-white/80"><span>Descontos</span><b id="vos-sub-desc">R$ 0,00</b></div>
        <div class="flex justify-between text-[17px] font-bold border-t border-white/20 pt-1 mt-1"><span>TOTAL</span><b id="vos-total">R$ 0,00</b></div>
      </div>
    </div>
  </div>`;
  document.getElementById('modal-footer').innerHTML = `
    <button onclick="closeModal()" class="h-[46px] px-5 rounded-xl bg-white border text-red-600 font-bold flex items-center gap-2"><i class="ph ph-x-circle"></i> Sair</button>
    <button onclick="vosImprimirAtual()" class="h-[46px] px-5 rounded-xl bg-white border font-bold flex items-center gap-2"><i class="ph ph-printer"></i> Imprimir</button>
    <button onclick="vosSalvarVenda()" class="h-[46px] px-6 rounded-xl bg-[#0a1e8a] text-white font-bold flex items-center gap-2"><i class="ph ph-floppy-disk"></i> Salvar</button>
    <button onclick="vosFaturarAtual()" class="h-[46px] px-6 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-2"><i class="ph ph-check"></i> Faturar</button>`;
  document.getElementById('modal-root').classList.remove('hidden');
  window.modalContext = { type:'venda' };
  vosResumoVenda(); vosOsRuleHint();
  setTimeout(()=>document.getElementById('vos-cli-search')?.focus(), 120);
};

// ── Abas ──
window.vosSetAba = function(aba){
  document.getElementById('vos-aba-itens')?.classList.toggle('hidden', aba!=='itens');
  document.getElementById('vos-aba-os')?.classList.toggle('hidden', aba!=='os');
  const ti = document.getElementById('vos-tab-itens'), to = document.getElementById('vos-tab-os');
  [[ti, aba==='itens'],[to, aba==='os']].forEach(([el,on])=>{
    if(!el) return;
    el.classList.toggle('border-[#0a1e8a]', on); el.classList.toggle('text-[#0a1e8a]', on);
    el.classList.toggle('border-transparent', !on); el.classList.toggle('text-slate-500', !on);
  });
};

// ── Cliente ──
window.vosVendaSearchCliente = function(q){
  const sess = getSession(); const el = document.getElementById('vos-cli-results'); if(!el) return;
  const low = (q||'').toLowerCase().trim();
  if(!low){ el.classList.add('hidden'); el.innerHTML=''; return; }
  const num = onlyDigits(low);
  const list = db.clientes.filter(c=>c.empresaId===sess.empresaId).filter(c=>{
    return String(c.codigo||'').includes(low)
      || (c.nome||'').toLowerCase().includes(low)
      || (c.fantasia||'').toLowerCase().includes(low)
      || (c.documento||'').toLowerCase().includes(low) || (num && onlyDigits(c.documento).includes(num))
      || (c.endereco||'').toLowerCase().includes(low)
      || (c.telefone||'').toLowerCase().includes(low);
  }).slice(0,15);
  el.innerHTML = list.map(c=>`<button onclick="vosVendaSelectCliente('${c.id}')" class="w-full text-left px-3 py-2 hover:bg-[#f0f2ff] border-b last:border-0 flex justify-between gap-2">
    <span><b class="text-[#0a1e8a]">#${c.codigo||'-'}</b> <b>${escapeHtml(c.nome||'')}</b><br><span class="text-slate-500 text-[11px]">${escapeHtml(c.documento||'')} • ${escapeHtml(c.telefone||'')} • ${escapeHtml(c.endereco||'')}</span></span>
    <span class="text-[10px] text-slate-400 shrink-0">${escapeHtml(c.cidade||'')}/${escapeHtml(c.estado||'')}</span>
  </button>`).join('') || '<p class="px-3 py-3 text-slate-400">Nenhum cliente encontrado — cadastre em "+ Novo cliente"</p>';
  el.classList.remove('hidden');
};
window.vosVendaSelectCliente = function(id){
  const c = db.clientes.find(x=>x.id===id); if(!c) return;
  window.__vosForm.cliente = c;
  document.getElementById('vos-cli-results').classList.add('hidden');
  document.getElementById('vos-cli-search').value = '';
  document.getElementById('vos-cli-selecionado').classList.remove('hidden');
  document.getElementById('vos-cli-avatar').innerText = initials(c.nome);
  document.getElementById('vos-cli-nome').innerText = (c.codigo?`#${c.codigo} — `:'') + (c.nome||'');
  document.getElementById('vos-cli-detalhes').innerText = `${c.documento||''} • ${c.telefone||''} • ${c.endereco||''} • ${c.cidade||''}/${c.estado||''}`;
};
window.vosVendaClearCliente = function(){
  window.__vosForm.cliente = null;
  document.getElementById('vos-cli-selecionado').classList.add('hidden');
  document.getElementById('vos-cli-search').value = '';
  document.getElementById('vos-cli-search').focus();
};

// ── Itens ──
window.vosOnTipoItem = function(){
  const t = document.getElementById('vos-item-tipo').value;
  const extra = /Recarga|Toner|Manutenção|Serviço/i.test(t);
  document.getElementById('vos-item-extra')?.classList.toggle('hidden', !extra);
  document.getElementById('vos-item-cartucho')?.classList.toggle('hidden', !/Recarga|Toner/i.test(t));
};
window.vosVendaSearchProd = function(q){
  const sess = getSession(); const el = document.getElementById('vos-prod-results'); if(!el) return;
  const low = (q||'').toLowerCase().trim();
  if(!low){ el.classList.add('hidden'); return; }
  const list = db.produtos.filter(p=>p.empresaId===sess.empresaId).filter(p=>(p.nome||'').toLowerCase().includes(low)||(p.sku||'').toLowerCase().includes(low)||(p.categoria||'').toLowerCase().includes(low)).slice(0,10);
  el.innerHTML = list.map(p=>`<button onclick="vosVendaSelectProd('${p.id}')" class="w-full text-left px-3 py-2 hover:bg-[#f0f2ff] border-b last:border-0">
    <b>${escapeHtml(p.nome||'')}</b> <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100">${escapeHtml(p.categoria||'')}</span><br>
    <span class="text-slate-500 text-[11px]">${escapeHtml(p.sku||'')} • estoque ${p.estoque||0} • <b class="text-[#0a1e8a]">${fmtMoney(p.preco||0)}</b></span>
  </button>`).join('') || '<p class="px-3 py-2 text-slate-400">Sem produto — a descrição digitada será usada manualmente</p>';
  el.classList.remove('hidden');
};
window.vosVendaSelectProd = function(id){
  const p = db.produtos.find(x=>x.id===id); if(!p) return;
  window.__vosForm.produtoSel = p;
  document.getElementById('vos-prod-search').value = p.nome||'';
  document.getElementById('vos-item-vunit').value = p.preco||0;
  document.getElementById('vos-prod-results').classList.add('hidden');
  vosItemCalcTotal();
};
window.vosItemCalcTotal = function(){
  const qtd = parseFloat(document.getElementById('vos-item-qtd')?.value)||0;
  const vu  = parseFloat(document.getElementById('vos-item-vunit')?.value)||0;
  const de  = parseFloat(document.getElementById('vos-item-desc')?.value)||0;
  const el = document.getElementById('vos-item-total');
  if(el) el.value = fmtMoney(Math.max(0, qtd*vu - de));
};
window.vosAddItem = function(){
  const f = window.__vosForm;
  const descTxt = (document.getElementById('vos-prod-search').value||'').trim();
  const p = f.produtoSel;
  if(!p && !descTxt) return toast('Selecione um produto ou escreva a descrição','error');
  const qtd = parseFloat(document.getElementById('vos-item-qtd').value)||1;
  const preco = parseFloat(document.getElementById('vos-item-vunit').value)||0;
  const desc = parseFloat(document.getElementById('vos-item-desc').value)||0;
  const tipo = document.getElementById('vos-item-tipo').value;
  const showExtra = !document.getElementById('vos-item-extra').classList.contains('hidden');
  const item = {
    produtoId: p ? p.id : null,
    descricao: p ? (p.nome||'') : descTxt,
    sku: p ? (p.sku||'') : '',
    tipo,
    numCartucho: showExtra ? (document.getElementById('vos-item-cartucho').value||'').trim() : '',
    identificacao: showExtra ? (document.getElementById('vos-item-ident').value||'').trim() : '',
    qtd, preco, desconto: desc, subtotal: Math.max(0, qtd*preco - desc),
    situacao: showExtra ? document.getElementById('vos-item-sit').value : 'Pendente',
    pe: showExtra ? !!document.getElementById('vos-item-pe').checked : false,
    ps: showExtra ? !!document.getElementById('vos-item-ps').checked : false,
    tecnico: showExtra ? (document.getElementById('vos-item-tec').value||'').trim() : ''
  };
  f.itens.push(item);
  f.produtoSel = null;
  ['vos-prod-search','vos-item-cartucho','vos-item-ident','vos-item-tec'].forEach(id=>{const e=document.getElementById(id); if(e) e.value='';});
  document.getElementById('vos-item-qtd').value = 1;
  document.getElementById('vos-item-vunit').value = '';
  document.getElementById('vos-item-desc').value = 0;
  document.getElementById('vos-item-total').value = '';
  document.getElementById('vos-item-pe').checked = false;
  document.getElementById('vos-item-ps').checked = false;
  vosRenderItens(); vosResumoVenda();
  document.getElementById('vos-prod-search').focus();
};
window.vosRenderItens = function(){
  const body = document.getElementById('vos-itens-body'); if(!body) return;
  const itens = window.__vosForm.itens;
  body.innerHTML = itens.map((it,i)=>`<tr class="hover:bg-slate-50">
    <td class="px-3 py-2"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0a1e8a]/10 text-[#0a1e8a]">${escapeHtml(it.tipo||'Produto')}</span></td>
    <td class="px-3 py-2"><b>${escapeHtml(it.descricao)}</b><br><span class="text-[10.5px] text-slate-500">${escapeHtml(it.sku||'')}</span></td>
    <td class="px-3 py-2">${escapeHtml(it.identificacao||'')}${it.numCartucho?`<br><span class="text-[10.5px] text-slate-500">cart. ${escapeHtml(it.numCartucho)}</span>`:''}</td>
    <td class="px-3 py-2">${it.qtd}</td>
    <td class="px-3 py-2">${fmtMoney(it.preco)}</td>
    <td class="px-3 py-2">${fmtMoney(it.desconto||0)}</td>
    <td class="px-3 py-2"><b>${fmtMoney(it.subtotal)}</b></td>
    <td class="px-3 py-2">${escapeHtml(it.situacao||'')}</td>
    <td class="px-3 py-2 text-center">${it.pe?'✔':''}</td>
    <td class="px-3 py-2 text-center">${it.ps?'✔':''}</td>
    <td class="px-3 py-2">${escapeHtml(it.tecnico||'')}</td>
    <td class="px-2 py-2"><button onclick="vosRemoveItem(${i})" class="w-7 h-7 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"><i class="ph ph-trash"></i></button></td>
  </tr>`).join('') || '<tr><td colspan="12" class="text-center text-slate-400 py-8">Nenhum item lançado</td></tr>';
};
window.vosRemoveItem = function(i){ window.__vosForm.itens.splice(i,1); vosRenderItens(); vosResumoVenda(); };

// ── Aba OS: coleta, regra e busca por serial ──
function vosColetarOS(){
  const g = id => (document.getElementById(id)?.value ?? '');
  return {
    numeroSerie: g('vos-os-serie').trim(),
    modelo: g('vos-os-modelo').trim(),
    tipoOS: g('vos-os-tipo'),
    patrimonio: g('vos-os-patri').trim(),
    contador: g('vos-os-contador').trim(),
    acessorios: g('vos-os-acess').trim(),
    tecnico: g('vos-os-tec').trim(),
    responsavelEntrega: g('vos-os-entrega').trim(),
    garantia: g('vos-os-garantia'),
    valorServico: parseFloat(g('vos-os-valor'))||0,
    desconto: parseFloat(g('vos-os-desc'))||0,
    situacao: g('vos-os-situacao'),
    defeito: g('vos-os-defeito').trim(),
    servicos: g('vos-os-servicos').trim(),
    pecas: g('vos-os-pecas').trim()
  };
}
function vosOsTemAlgumDado(os){
  if(!os) return false;
  return ['numeroSerie','modelo','patrimonio','contador','defeito','servicos','pecas','acessorios','tecnico'].some(k=>String(os[k]||'').trim()) || (os.valorServico||0)>0;
}
window.vosOsRuleHint = function(){
  const el = document.getElementById('vos-os-rule'); if(!el) return;
  const os = vosColetarOS();
  const completa = vosOsCompleta(os);
  const algum = vosOsTemAlgumDado(os);
  document.getElementById('vos-tab-os-badge')?.classList.toggle('hidden', !completa);
  if(!algum){
    el.className = 'rounded-xl border p-3 text-[12px] bg-slate-50 text-slate-600';
    el.innerHTML = '<i class="ph ph-info"></i> Aba OS opcional. Se ficar vazia, a venda sai como <b>notinha normal (meia folha)</b>.';
  } else if(completa){
    el.className = 'rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-[12px] text-emerald-900';
    el.innerHTML = '<i class="ph ph-check-circle"></i> <b>OS completa!</b> Modelo + Nº série + Patrimônio/Contador preenchidos → a notinha sairá em <b>folha inteira (venda + OS)</b>.';
  } else {
    el.className = 'rounded-xl border border-amber-300 bg-amber-50 p-3 text-[12px] text-amber-900';
    el.innerHTML = '<i class="ph ph-warning"></i> <b>OS incompleta.</b> Para sair na notinha (folha inteira) preencha: ' +
      [!os.modelo&&'Modelo do equipamento', !os.numeroSerie&&'Número de série', (!os.patrimonio&&!os.contador)&&'Patrimônio ou contador de cópias'].filter(Boolean).map(s=>'<b>'+s+'</b>').join(', ') +
      '. Os dados serão salvos, mas a notinha sairá como venda normal (meia folha).';
  }
};
window.vosBuscarSerial = function(serial){
  const sess = getSession(); if(!sess) return;
  const s = String(serial||'').trim().toLowerCase();
  const info = document.getElementById('vos-serial-info');
  if(!s){ if(info) info.classList.add('hidden'); return; }
  const normSerie = o => String((o && (o.numeroSerie||o.serie))||'').trim().toLowerCase();
  // 1) vendas nativas com esse serial
  const hist = (db.vendas||[]).filter(v=>v.empresaId===sess.empresaId && v.os && normSerie(v.os)===s)
    .sort((a,b)=>new Date(b.data||0)-new Date(a.data||0));
  // 2) chamados/OS com esse serial
  const chamado = (db.os||[]).filter(o=>o.empresaId===sess.empresaId && normSerie(o)===s)
    .sort((a,b)=>new Date(b.abertura||b.criadoEm||0)-new Date(a.abertura||a.criadoEm||0))[0];
  // 3) cadastro de equipamentos
  const eq = (db.equipamentos||[]).find(e=>e.empresaId===sess.empresaId && normSerie(e)===s);
  const ult = hist[0];
  let preencheu = [];
  const setIfEmpty = (id, val)=>{
    const el = document.getElementById(id);
    if(el && !el.value.trim() && val!=null && String(val).trim()){ el.value = String(val).trim(); preencheu.push(id); }
  };
  const fonte = ult ? ult.os : (chamado || null);
  if(fonte){
    setIfEmpty('vos-os-modelo', fonte.modelo || fonte.equipamentoModelo || '');
    setIfEmpty('vos-os-patri', fonte.patrimonio || '');
    setIfEmpty('vos-os-contador', (fonte.contador!=null?fonte.contador:''));
  }
  if(eq){
    setIfEmpty('vos-os-modelo', eq.modelo);
    setIfEmpty('vos-os-patri', eq.patrimonio);
    setIfEmpty('vos-os-contador', eq.contadorPB);
  }
  // cliente: da última notinha, do chamado ou do parque (máquina instalada)
  let cliId = ult ? ult.clienteId : (chamado ? chamado.clienteId : null);
  if(!cliId && eq){
    const inst = (db.parque||[]).find(p=>p.empresaId===sess.empresaId && p.equipamentoId===eq.id);
    if(inst) cliId = inst.clienteId;
  }
  let autoCli = false;
  if(cliId && !(window.__vosForm && window.__vosForm.cliente)){
    const c = db.clientes.find(x=>x.id===cliId);
    if(c){ vosVendaSelectCliente(c.id); autoCli = true; }
  }
  if(info){
    if(ult || chamado || eq){
      const cliNome = ult ? ((db.clientes.find(x=>x.id===ult.clienteId)||{}).nome || ult.clienteNomeAntigo || '-') : ((db.clientes.find(x=>x.id===cliId)||{}).nome || '-');
      info.className = 'rounded-xl border border-amber-300 bg-amber-50 p-3 text-[12px] text-amber-900 block';
      info.innerHTML = `<p class="font-bold mb-1"><i class="ph ph-clock-counter-clockwise"></i> Última notinha encontrada para este equipamento:</p>` +
        (ult ? `Data: <b>${fmtDate(ult.data)}</b> • Cliente: <b>${escapeHtml(cliNome)}</b> • Modelo: <b>${escapeHtml(ult.os.modelo||'-')}</b> • Venda/OS: <b>${escapeHtml(ult.numero)}${ult.os.numero?` / ${escapeHtml(ult.os.numero)}`:''}</b>` :
        chamado ? `Chamado <b>${escapeHtml(chamado.numero||'-')}</b> de <b>${fmtDate(chamado.abertura||chamado.criadoEm)}</b> • Cliente: <b>${escapeHtml(cliNome)}</b>` :
        `Equipamento cadastrado: <b>${escapeHtml(eq.modelo||'-')}</b> (patrimônio ${escapeHtml(eq.patrimonio||'-')})`) +
        (preencheu.length || autoCli ? `<p class="mt-1 text-emerald-800 font-semibold"><i class="ph ph-magic-wand"></i> Preenchido automaticamente${autoCli?' (incluindo cliente)':''} — confira antes de salvar.</p>` : '');
    } else {
      info.className = 'rounded-xl border border-slate-200 bg-slate-50 p-3 text-[12px] text-slate-500 block';
      info.innerHTML = '<i class="ph ph-info"></i> Nenhuma notinha anterior encontrada para este número de série.';
    }
  }
  vosOsRuleHint();
};
// O hint da regra da OS é atualizado por eventos de digitação (sem setInterval pesado)
if(typeof document!=='undefined' && document.addEventListener){
  document.addEventListener('input', function(ev){
    if(ev.target && ev.target.id && ev.target.id.startsWith('vos-os-')) vosOsRuleHint();
  });
}

// ── Resumo / totais ──
window.vosResumoVenda = function(){
  const f = window.__vosForm; if(!f) return;
  const subItens = f.itens.reduce((s,i)=>s+(i.subtotal||0),0);
  const os = document.getElementById('vos-aba-os') ? vosColetarOS() : {valorServico:0,desconto:0};
  const descOS = os.desconto||0, valOS = os.valorServico||0;
  const descVenda = parseFloat(document.getElementById('vos-desc-venda')?.value)||0;
  const descTotais = f.itens.reduce((s,i)=>s+(i.desconto||0),0) + descOS + descVenda;
  const total = Math.max(0, subItens + valOS - descVenda - descOS);
  const set = (id,v)=>{const e=document.getElementById(id); if(e) e.innerText=v;};
  set('vos-sub-itens', fmtMoney(subItens));
  set('vos-sub-os', fmtMoney(valOS));
  set('vos-sub-desc', fmtMoney(descTotais));
  set('vos-total', fmtMoney(total));
};

// ── Gravar (criar/atualizar) a venda ──
function vosGravarVenda(silencioso){
  const sess = getSession(); const f = window.__vosForm;
  if(!f.cliente){ toast('Selecione o cliente','error'); vosSetAba('itens'); return null; }
  const os = vosColetarOS();
  const temOS = vosOsTemAlgumDado(os);
  if(!f.itens.length && !(temOS && (os.valorServico||0)>0)){
    toast('Adicione ao menos um item ou um valor de serviço na OS','error'); return null;
  }
  const descVenda = parseFloat(document.getElementById('vos-desc-venda').value)||0;
  const total = Math.max(0, f.itens.reduce((s,i)=>s+i.subtotal,0) + (temOS?(os.valorServico||0):0) - descVenda - (temOS?(os.desconto||0):0));
  const status = document.getElementById('vos-status').value;
  const isNova = !f.vendaId;
  let venda;
  if(f.vendaId){
    venda = db.vendas.find(v=>v.id===f.vendaId && v.empresaId===sess.empresaId);
  }
  if(!venda){
    venda = { id: uid('vda'), empresaId: sess.empresaId, numero: f.codigo, criadoPor: sess.usuarioId, criadoPorNome: sess.usuarioNome, criadoEm: new Date().toISOString() };
    // baixa de estoque apenas na criação
    f.itens.forEach(it=>{
      const p = it.produtoId && db.produtos.find(x=>x.id===it.produtoId);
      if(p && p.categoria!=='Serviço'){ p.estoque = (p.estoque||0) - it.qtd; }
    });
    db.vendas.push(venda);
    f.vendaId = venda.id;
  }
  Object.assign(venda, {
    clienteId: f.cliente.id,
    data: (venda.data && f.vendaId) ? venda.data : new Date().toISOString(),
    dataSaida: document.getElementById('vos-data-saida').value || '',
    prazoEntrega: document.getElementById('vos-prazo-entrega').value || '',
    destino: (document.getElementById('vos-destino').value||'').trim(),
    itens: f.itens.map(it=>({...it})),
    desconto: descVenda,
    total,
    observacao: (document.getElementById('vos-obs').value||'').trim(),
    status: (venda.status==='faturado') ? 'faturado' : status,
    atendenteNome: sess.usuarioNome
  });
  // OS junto da venda
  if(temOS){
    if(!venda.os) venda.os = {};
    const numeroOS = venda.os.numero || vosNextNumero('OS', new Date().getFullYear(), db.os);
    Object.assign(venda.os, os, { numero: numeroOS, completa: vosOsCompleta(os) });
    // espelha em db.os (aparece nos Chamados)
    let reg = (db.os||[]).find(o=>o.empresaId===sess.empresaId && o.vendaId===venda.id);
    if(!reg){
      reg = { id: uid('os'), empresaId: sess.empresaId, numero: numeroOS, vendaId: venda.id, abertura: new Date().toISOString(), criadoEm: new Date().toISOString(), criadoPor: sess.usuarioId, criadoPorNome: sess.usuarioNome, contratoId: null, equipamentoId: null };
      db.os.push(reg);
    }
    Object.assign(reg, {
      clienteId: venda.clienteId,
      problema: os.defeito || os.tipoOS || 'OS via notinha',
      descricao: os.servicos || '',
      serie: os.numeroSerie, numeroSerie: os.numeroSerie, modelo: os.modelo, equipamentoModelo: os.modelo,
      patrimonio: os.patrimonio, contador: os.contador, tipoOS: os.tipoOS,
      tecnico: os.tecnico, tecnicoNome: os.tecnico, responsavelEntrega: os.responsavelEntrega,
      garantia: os.garantia, pecasTexto: os.pecas, situacaoOS: os.situacao, acessorios: os.acessorios,
      status: /Conclu|Entregue/i.test(os.situacao||'') ? 'concluido' : 'aberto',
      prioridade: reg.prioridade || 'normal'
    });
  } else if(venda.os) {
    delete venda.os;
    db.os = (db.os||[]).filter(o=>!(o.empresaId===sess.empresaId && o.vendaId===venda.id));
  }
  logAction('venda', isNova ? 'criar' : 'salvar', venda.id, `Venda ${venda.numero} (${fmtMoney(total)}) ${isNova?'criada':'salva'} por ${sess.usuarioNome}${temOS?' • OS '+venda.os.numero+(venda.os.completa?' completa':' parcial'):''}`);
  saveDB();
  if(!silencioso){
    closeModal();
    renderVendas(); renderProdutos(); renderFinanceiro && renderFinanceiro(); renderAuditoria && renderAuditoria();
    toast(`Venda ${venda.numero} salva`, 'success');
  }
  return venda;
}
window.vosSalvarVenda = function(){ vosGravarVenda(false); };
window.vosImprimirAtual = function(){
  const f = window.__vosForm;
  if(!f || !f.vendaId){
    const v = vosGravarVenda(true);
    if(!v) return;
    toast(`Venda ${v.numero} salva`, 'success');
  } else {
    if(!vosGravarVenda(true)) return;
  }
  closeModal();
  renderVendas(); renderFinanceiro && renderFinanceiro();
  imprimirNotinha(window.__vosForm ? window.__vosForm.vendaId : null);
};

// ═══════════════════════════════════════════════════════════════════════════
// FATURAMENTO — à vista conclui; a prazo abre tela de parcelas (sem boleto)
// ═══════════════════════════════════════════════════════════════════════════
window.vosFaturarAtual = function(){
  const v = vosGravarVenda(true);
  if(!v) return;
  if(v.status==='faturado'){ toast('Venda já faturada','info'); return; }
  vosAbrirRecebimento(v.id);
};
window.faturarVenda = function(id){
  const sess = getSession();
  const v = db.vendas.find(x=>x.id===id && x.empresaId===sess.empresaId);
  if(!v) return;
  if(v.status==='faturado') return toast('Já faturado','info');
  vosAbrirRecebimento(id);
};
const VOS_FORMAS_VISTA = ['Dinheiro','Pix','Cartão de crédito','Cartão de débito','Cheque','Conta','Grátis'];
window.vosAbrirRecebimento = function(vendaId){
  const sess = getSession();
  const v = db.vendas.find(x=>x.id===vendaId && x.empresaId===sess.empresaId);
  if(!v) return;
  window.__vosFatVendaId = vendaId;
  const cli = db.clientes.find(c=>c.id===v.clienteId)||{};
  const box = document.getElementById('modal-box');
  if(box) box.className = 'w-full max-w-[860px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[94vh] flex flex-col';
  document.getElementById('modal-title').innerText = 'Faturamento — ' + v.numero;
  const hoje = new Date().toISOString().slice(0,10);
  const primDef = vosAddDias(new Date(), 30).toISOString().slice(0,10);
  document.getElementById('modal-body').innerHTML = `
  <div class="space-y-3">
    <div class="rounded-[14px] bg-[#0a1e8a] text-white p-4 flex items-center justify-between">
      <div>
        <p class="text-[11px] uppercase font-bold text-white/70">Venda</p>
        <p class="font-bold">${escapeHtml(v.numero)} — ${escapeHtml(cli.nome||'')}</p>
      </div>
      <div class="text-right">
        <p class="text-[11px] uppercase font-bold text-white/70">Total a faturar</p>
        <p class="font-bold text-[22px]" id="vos-fat-total">${fmtMoney(v.total||0)}</p>
      </div>
    </div>
    <div>
      <label class="text-[11px] font-bold uppercase text-slate-500">Forma de recebimento</label>
      <div class="mt-1 grid grid-cols-2 md:grid-cols-4 gap-2" id="vos-formas">
        ${[...VOS_FORMAS_VISTA,'Prazo'].map(fx=>`<button onclick="vosEscolherForma('${fx}')" data-forma="${fx}" class="vos-forma h-[44px] rounded-xl border-2 text-[12.5px] font-bold ${fx==='Dinheiro'?'border-[#0a1e8a] bg-[#0a1e8a]/5 text-[#0a1e8a]':'border-slate-200 bg-white'}">${fx==='Prazo'?'A prazo':fx}</button>`).join('')}
      </div>
      <input type="hidden" id="vos-forma" value="Dinheiro">
    </div>

    <!-- À vista -->
    <div id="vos-vista-box" class="rounded-[14px] border p-4 bg-emerald-50/50 border-emerald-200">
      <p class="text-[13px] text-emerald-900" id="vos-vista-msg"><i class="ph ph-check-circle"></i> Venda à vista em <b>Dinheiro</b>: será faturada e <b>concluída</b> automaticamente.</p>
    </div>

    <!-- A prazo / parcelas -->
    <div id="vos-prazo-box" class="hidden rounded-[14px] border p-4 space-y-3 bg-[#f8f9ff]">
      <p class="font-bold text-[13px] text-[#0a1e8a]"><i class="ph ph-calendar-blank"></i> Parcelamento — venda a prazo</p>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
        <label class="text-[11px] font-bold uppercase text-slate-500">Qtd parcelas
          <input id="vos-parc-qtd" type="number" min="1" max="60" value="1" onchange="vosParcelasPreview('${v.id}')" class="mt-1 w-full h-[38px] px-2 rounded-xl border text-[13px]"></label>
        <label class="text-[11px] font-bold uppercase text-slate-500">Primeiro vencimento
          <input id="vos-parc-prim" type="date" value="${primDef}" onchange="vosParcelasPreview('${v.id}')" class="mt-1 w-full h-[38px] px-2 rounded-xl border text-[13px]"></label>
        <label class="text-[11px] font-bold uppercase text-slate-500">Intervalo (dias)
          <input id="vos-parc-int" type="number" min="1" value="30" onchange="document.getElementById('vos-parc-dia').value=''; vosParcelasPreview('${v.id}')" class="mt-1 w-full h-[38px] px-2 rounded-xl border text-[13px]"></label>
        <label class="text-[11px] font-bold uppercase text-slate-500">Venc. todo dia
          <input id="vos-parc-dia" type="number" min="1" max="31" placeholder="ex: 10" onchange="vosParcelasPreview('${v.id}')" class="mt-1 w-full h-[38px] px-2 rounded-xl border text-[13px]"></label>
        <label class="text-[11px] font-bold uppercase text-slate-500">Juros % a.m.
          <input id="vos-parc-juros" type="number" step="0.01" value="0" onchange="vosParcelasPreview('${v.id}')" class="mt-1 w-full h-[38px] px-2 rounded-xl border text-[13px]"></label>
      </div>
      <div class="rounded-xl border overflow-hidden bg-white">
        <table class="w-full text-left text-[12px]">
          <thead class="bg-slate-50 border-b text-[10.5px] uppercase font-bold text-slate-500"><tr><th class="px-3 py-2">Parcela</th><th class="px-3 py-2">Vencimento</th><th class="px-3 py-2">Valor</th></tr></thead>
          <tbody id="vos-parc-body" class="divide-y"></tbody>
          <tfoot><tr class="bg-[#0a1e8a]/5 font-bold"><td class="px-3 py-2" colspan="2">TOTAL</td><td class="px-3 py-2" id="vos-parc-total"></td></tr></tfoot>
        </table>
      </div>
    </div>
  </div>`;
  const osCompleta = v.os && v.os.completa;
  document.getElementById('modal-footer').innerHTML = `
    <button onclick="vosVoltarRecebimento('${v.id}')" class="h-[46px] px-5 rounded-xl bg-white border text-slate-600 font-bold flex items-center gap-2"><i class="ph ph-arrow-left"></i> Cancelar</button>
    <button onclick="vosImprimirCarneDaTela('${v.id}')" id="vos-btn-carne" class="hidden h-[46px] px-5 rounded-xl bg-white border font-bold flex items-center gap-2"><i class="ph ph-ticket"></i> Imprimir carnê</button>
    <button onclick="vosConcluirFaturamento('${v.id}')" class="h-[46px] px-6 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-2"><i class="ph ph-check"></i> <span id="vos-fat-btn-label">Concluir faturamento</span></button>`;
  document.getElementById('modal-root').classList.remove('hidden');
};
window.vosEscolherForma = function(fx){
  document.getElementById('vos-forma').value = fx;
  document.querySelectorAll('.vos-forma').forEach(b=>{
    const on = b.dataset.forma===fx;
    b.className = 'vos-forma h-[44px] rounded-xl border-2 text-[12.5px] font-bold ' + (on ? (fx==='Prazo'?'border-amber-500 bg-amber-50 text-amber-700':'border-[#0a1e8a] bg-[#0a1e8a]/5 text-[#0a1e8a]') : 'border-slate-200 bg-white');
  });
  const prazo = fx==='Prazo';
  document.getElementById('vos-prazo-box').classList.toggle('hidden', !prazo);
  document.getElementById('vos-vista-box').classList.toggle('hidden', prazo);
  document.getElementById('vos-btn-carne').classList.toggle('hidden', !prazo);
  if(!prazo){
    const msg = fx==='Grátis'
      ? '<i class="ph ph-gift"></i> Venda <b>Grátis (sem cobrança)</b>: será faturada e concluída sem gerar conta a receber.'
      : `<i class="ph ph-check-circle"></i> Venda à vista em <b>${fx}</b>: será faturada e <b>concluída</b> automaticamente.`;
    document.getElementById('vos-vista-msg').innerHTML = msg;
    document.getElementById('vos-fat-btn-label').innerText = 'Concluir faturamento';
  } else {
    document.getElementById('vos-fat-btn-label').innerText = 'Finalizar e gerar parcelas';
    if(window.__vosFatVendaId) vosParcelasPreview(window.__vosFatVendaId);
  }
};
window.vosParcelasPreview = function(vendaId){
  const sess = getSession();
  const v = db.vendas.find(x=>x.id===vendaId && x.empresaId===sess.empresaId);
  if(!v) return;
  const cfg = {
    parcelas: parseInt(document.getElementById('vos-parc-qtd').value)||1,
    primeiroVencimento: document.getElementById('vos-parc-prim').value,
    intervaloDias: parseInt(document.getElementById('vos-parc-int').value)||30,
    diaFixo: parseInt(document.getElementById('vos-parc-dia').value)||0,
    jurosMes: parseFloat(document.getElementById('vos-parc-juros').value)||0
  };
  const r = vosCalcParcelas(v.total||0, cfg);
  document.getElementById('vos-parc-body').innerHTML = r.parcelas.map(p=>`<tr><td class="px-3 py-2"><b>${p.n}/${r.parcelas.length}</b></td><td class="px-3 py-2">${fmtDate(p.vencimento)}</td><td class="px-3 py-2"><b>${fmtMoney(p.valor)}</b></td></tr>`).join('');
  document.getElementById('vos-parc-total').innerText = fmtMoney(r.total);
};
window.vosConcluirFaturamento = function(vendaId){
  const sess = getSession();
  const v = db.vendas.find(x=>x.id===vendaId && x.empresaId===sess.empresaId);
  if(!v) return;
  if(v.status==='faturado'){ toast('Venda já faturada','info'); return; }
  const forma = document.getElementById('vos-forma').value;
  // remove CRs antigos abertos desta venda (re-faturamento)
  db.contasReceber = (db.contasReceber||[]).filter(c=>!(c.vendaId===v.id && c.status==='aberto'));
  v.formaPagamento = forma;
  v.status = 'faturado';
  v.faturadoEm = new Date().toISOString();
  v.faturadoPor = sess.usuarioNome;
  if(forma==='Prazo'){
    const cfg = {
      parcelas: Math.max(1, parseInt(document.getElementById('vos-parc-qtd').value)||1),
      primeiroVencimento: document.getElementById('vos-parc-prim').value,
      intervaloDias: parseInt(document.getElementById('vos-parc-int').value)||30,
      diaFixo: parseInt(document.getElementById('vos-parc-dia').value)||0,
      jurosMes: parseFloat(document.getElementById('vos-parc-juros').value)||0
    };
    const r = vosCalcParcelas(v.total||0, cfg);
    r.parcelas.forEach(p=>{
      db.contasReceber.push({
        id: uid('cr'), empresaId: sess.empresaId, origem: 'venda', clienteId: v.clienteId,
        descricao: `Venda ${v.numero} • parcela ${p.n}/${r.parcelas.length}`,
        valor: p.valor, vencimento: p.vencimento, pagamentoData: null, status: 'aberto',
        contratoId: null, leituraId: null, vendaId: v.id,
        parcela: p.n, totalParcelas: r.parcelas.length, jurosMes: cfg.jurosMes,
        criadoPor: sess.usuarioId, criadoPorNome: sess.usuarioNome
      });
    });
    v.parcelas = r.parcelas.map(p=>({n:p.n, total:r.parcelas.length, vencimento:p.vencimento, valor:p.valor}));
    logAction('venda','faturar_prazo',v.id,`Venda ${v.numero} faturada A PRAZO em ${r.parcelas.length}x de ${fmtMoney(r.total/r.parcelas.length)} (total ${fmtMoney(r.total)}) por ${sess.usuarioNome}`);
  } else if(forma==='Grátis'){
    v.parcelas = [];
    logAction('venda','faturar_gratis',v.id,`Venda ${v.numero} faturada como GRÁTIS (sem cobrança) por ${sess.usuarioNome}`);
  } else {
    // à vista: conta a receber já baixada (histórico e fluxo de caixa)
    db.contasReceber.push({
      id: uid('cr'), empresaId: sess.empresaId, origem: 'venda', clienteId: v.clienteId,
      descricao: `Venda ${v.numero} • à vista (${forma})`,
      valor: v.total||0, vencimento: new Date().toISOString(), pagamentoData: new Date().toISOString(), status: 'pago',
      contratoId: null, leituraId: null, vendaId: v.id, parcela: 1, totalParcelas: 1,
      criadoPor: sess.usuarioId, criadoPorNome: sess.usuarioNome
    });
    v.parcelas = [{n:1, total:1, vencimento:new Date().toISOString(), valor:v.total||0}];
    logAction('venda','faturar_vista',v.id,`Venda ${v.numero} faturada À VISTA em ${forma} (${fmtMoney(v.total)}) por ${sess.usuarioNome}`);
  }
  saveDB();
  closeModal();
  renderVendas(); renderFinanceiro && renderFinanceiro(); renderAuditoria && renderAuditoria();
  toast(`Venda ${v.numero} faturada (${forma==='Prazo'?'a prazo — contas a receber criadas':forma})`, 'success');
  imprimirNotinha(v.id);
};
window.vosVoltarRecebimento = function(vendaId){
  // volta para edição se veio da nova venda
  if(window.__vosForm && window.__vosForm.vendaId===vendaId){
    closeModal();
    toast('Faturamento cancelado — venda salva como aguardando', 'info');
    renderVendas(); renderFinanceiro && renderFinanceiro();
  } else closeModal();
};
window.vosImprimirCarneDaTela = function(vendaId){
  const sess = getSession();
  const v = db.vendas.find(x=>x.id===vendaId && x.empresaId===sess.empresaId);
  if(!v) return;
  const cfg = {
    parcelas: Math.max(1, parseInt(document.getElementById('vos-parc-qtd').value)||1),
    primeiroVencimento: document.getElementById('vos-parc-prim').value,
    intervaloDias: parseInt(document.getElementById('vos-parc-int').value)||30,
    diaFixo: parseInt(document.getElementById('vos-parc-dia').value)||0,
    jurosMes: parseFloat(document.getElementById('vos-parc-juros').value)||0
  };
  const r = vosCalcParcelas(v.total||0, cfg);
  vosImprimirCarne(v.id, r.parcelas);
};

// ── Carnê de pagamento ──
window.vosImprimirCarne = function(vendaId, parcelasOpt){
  const sess = getSession();
  const v = db.vendas.find(x=>x.id===vendaId && x.empresaId===sess.empresaId);
  if(!v) return;
  const cli = db.clientes.find(c=>c.id===v.clienteId)||{};
  const empresa = db.empresas.find(e=>e.id===sess.empresaId)||{nome:'DIGICOPY'};
  let parcelas = parcelasOpt;
  if(!parcelas){
    const crs = (db.contasReceber||[]).filter(c=>c.vendaId===v.id).sort((a,b)=>(a.parcela||0)-(b.parcela||0));
    parcelas = crs.length ? crs.map(c=>({n:c.parcela||1, total:c.totalParcelas||crs.length, vencimento:c.vencimento, valor:c.valor})) : (v.parcelas||[]);
  }
  if(!parcelas.length) return toast('Esta venda não possui parcelas','info');
  const win = window.open('','_blank');
  const folhas = parcelas.map(p=>`
  <div class="canhoto">
    <div class="linha top"><div><b class="emp">${escapeHtml(empresa.fantasia||empresa.nome||'DIGICOPY')}</b><br><span>${escapeHtml(empresa.cnpj||sess.cnpj||'')} • ${escapeHtml(empresa.telefone||'')}</span></div>
    <div class="num">CARNÊ<br>VENDA ${escapeHtml(v.numero)}</div></div>
    <div class="grid2">
      <div><span>Cliente</span><b>${escapeHtml(cli.nome||'')}</b></div>
      <div><span>Cód. cliente</span><b>${cli.codigo||'-'}</b></div>
      <div><span>Parcela</span><b class="big">${p.n}/${p.total||parcelas.length}</b></div>
      <div><span>Vencimento</span><b class="big">${fmtDate(p.vencimento)}</b></div>
      <div><span>Valor</span><b class="big valor">${fmtMoney(p.valor)}</b></div>
      <div><span>Pagamento</span><b>____/____/______</b></div>
    </div>
    <p class="rod">Recebemos de <b>${escapeHtml(cli.nome||'')}</b> a importância referente à parcela indicada. &nbsp;&nbsp; Assinatura: ________________________________________</p>
  </div>
  <div class="corte">✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -</div>`).join('');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Carnê — ${escapeHtml(v.numero)}</title><style>
    @page{size:A4 portrait; margin:0}
    *{box-sizing:border-box}
    body{margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11.5px;color:#111}
    .pagina{width:210mm;padding:10mm 14mm}
    .canhoto{border:1.5px solid #111;border-radius:4mm;padding:5mm 6mm;margin-bottom:2mm;page-break-inside:avoid}
    .linha.top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px dashed #888;padding-bottom:2.5mm;margin-bottom:3mm}
    .emp{font-size:14px}
    .linha.top span{font-size:9.5px;color:#444}
    .num{text-align:right;font-weight:800;font-size:12px;line-height:1.35}
    .grid2{display:grid;grid-template-columns:repeat(3,1fr);gap:2.5mm 6mm}
    .grid2 span{display:block;font-size:8.5px;text-transform:uppercase;letter-spacing:.06em;color:#555}
    .grid2 b{font-size:12px}
    .grid2 b.big{font-size:14px}
    .grid2 b.valor{font-size:16px}
    .rod{margin:3.5mm 0 0;font-size:10px;border-top:1px solid #ccc;padding-top:2.5mm}
    .corte{color:#999;font-size:10px;margin:1mm 0 4mm;white-space:nowrap;overflow:hidden}
    .no-print{margin:8mm;text-align:center}
    .no-print button{padding:3mm 7mm;border:0;border-radius:2mm;background:#0a1e8a;color:#fff;font-weight:700;cursor:pointer}
    .no-print button.sec{background:#fff;color:#333;border:1px solid #aaa}
    @media print{.no-print{display:none!important}.corte{color:#bbb}}
  </style></head><body>
  <div class="no-print"><button onclick="window.print()">Imprimir carnê</button> <button class="sec" onclick="window.close()">Fechar</button></div>
  <div class="pagina">${folhas}</div>
  <script>window.onload=function(){setTimeout(function(){window.print()},350)};<\/script>
  </body></html>`);
  win.document.close();
  logAction('venda','imprimir_carne',vendaId,`Carnê de ${parcelas.length} parcela(s) da venda ${v.numero}`);
  saveDB();
};

// ═══════════════════════════════════════════════════════════════════════════
// IMPRESSÃO DA NOTINHA — venda normal = meia folha A4; venda + OS = folha inteira
// ═══════════════════════════════════════════════════════════════════════════
function vosDadosEmpresaNotinha(sess){
  let empSel = null;
  try{ empSel = JSON.parse(localStorage.getItem('digicopy_empresa_notinha')||'null'); }catch(e){}
  return empSel || db.empresas.find(e=>e.id===sess.empresaId) || {nome:'DIGICOPY', fantasia:'DIGICOPY'};
}
// Monta o HTML completo da notinha (usado pela impressão E pela exportação em arquivo)
window.vosGerarHtmlNotinha = function(vendaId, opts){
  opts = opts||{};
  const sess = getSession(); if(!sess || !vendaId) return null;
  const v = db.vendas.find(x=>x.id===vendaId && x.empresaId===sess.empresaId);
  if(!v) return null;
  const cli = (typeof clienteDaVenda==='function' ? clienteDaVenda(v) : db.clientes.find(c=>c.id===v.clienteId)) || {};
  const empresa = vosDadosEmpresaNotinha(sess);
  const temOS = v.os && vosOsCompleta(v.os);
  const ora = new Date(v.data||Date.now());
  const hora = isNaN(ora) ? '' : ora.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  const codNum = (v.numero||'').replace(/^VD-/,'');

  const itensRows = (v.itens||[]).map((it,i)=>{
    const p = it.produtoId ? db.produtos.find(pr=>pr.id===it.produtoId) : null;
    const desc = (p&&p.nome) || it.descricao || 'Item';
    const ident = [it.identificacao, it.numCartucho ? ('cart. '+it.numCartucho) : ''].filter(Boolean).join(' • ');
    return `<tr>
      <td class="c">${i+1}</td>
      <td><b>${escapeHtml(desc)}</b>${ident?`<br><span class="mini">${escapeHtml(ident)}</span>`:''}${it.tecnico?`<br><span class="mini">Téc: ${escapeHtml(it.tecnico)}</span>`:''}</td>
      <td class="c">${escapeHtml(it.tipo||((p&&p.categoria)||''))}</td>
      <td class="c">${it.qtd}</td>
      <td class="r">${fmtMoney(it.preco)}</td>
      <td class="r">${fmtMoney(it.desconto||0)}</td>
      <td class="r"><b>${fmtMoney(it.subtotal)}</b></td>
    </tr>`;
  }).join('') || '<tr><td colspan="7" class="c">Sem itens</td></tr>';

  const parcelasRows = (v.parcelas && v.parcelas.length>1) ? `
    <p class="sec-t">Parcelas (${escapeHtml(v.formaPagamento||'Prazo')})</p>
    <table class="tb"><thead><tr><th></th><th>Vencimento</th><th></th><th></th><th></th><th></th><th class="r">Valor</th></tr></thead><tbody>
    ${v.parcelas.map(p=>`<tr><td class="c">${p.n}/${p.total||v.parcelas.length}</td><td>${fmtDate(p.vencimento)}</td><td></td><td></td><td></td><td></td><td class="r"><b>${fmtMoney(p.valor)}</b></td></tr>`).join('')}
    </tbody></table>` : '';

  const subItens = (v.itens||[]).reduce((s,i)=>s+(i.subtotal||0),0);
  const valOS = (v.os && v.os.valorServico)||0;
  const descV = (v.desconto||0) + ((v.os && v.os.desconto)||0);

  const cabecalho = `
  <div class="cab">
    <div class="cab-esq">
      <div class="logo">DC</div>
      <div>
        <p class="emp-nome">${escapeHtml(empresa.fantasia||empresa.nome||'DIGICOPY')}</p>
        <p class="emp-info">${escapeHtml([empresa.nome, empresa.cnpj||sess.cnpj, empresa.telefone].filter(Boolean).join(' • '))}</p>
        <p class="emp-info">${escapeHtml([empresa.logradouro, empresa.numero, empresa.bairro, empresa.municipio, empresa.uf].filter(Boolean).join(', '))}</p>
      </div>
    </div>
    <div class="cab-dir">
      <p class="nota-t">${v.status==='orcamento'?'ORÇAMENTO':'VENDA / NOTINHA'}</p>
      <p class="nota-n">Nº ${escapeHtml(codNum)}</p>
      <p class="emp-info">${fmtDate(v.data)}${hora?' às '+hora:''}</p>
      <p class="emp-info">Atendente: <b>${escapeHtml(v.atendenteNome||v.criadoPorNome||sess.usuarioNome)}</b></p>
    </div>
  </div>
  <div class="cli-box">
    <div>
      <span class="lbl">Cliente</span>
      <b>${cli.codigo?`#${cli.codigo} — `:''}${escapeHtml(cli.nome||'')}</b>${cli.fantasia?` (${escapeHtml(cli.fantasia)})`:''}
      <p class="emp-info">${escapeHtml([cli.documento, cli.telefone].filter(Boolean).join(' • '))}</p>
      <p class="emp-info">${escapeHtml([cli.endereco, cli.cidade && (cli.cidade+'/'+(cli.estado||'')), cli.cep].filter(Boolean).join(' — '))}</p>
    </div>
    <div class="cli-dir">
      <span class="lbl">Entrega</span>
      <p class="emp-info">Destino: <b>${escapeHtml(v.destino||'-')}</b></p>
      <p class="emp-info">Saída: <b>${v.dataSaida?fmtDate(v.dataSaida):'-'}</b> • Prazo: <b>${v.prazoEntrega?fmtDate(v.prazoEntrega):'___/___/____'}</b></p>
      <p class="emp-info">Pagamento: <b>${escapeHtml(v.formaPagamento||'—')}</b> • Situação: <b>${(String(v.status||'').toUpperCase())}</b></p>
    </div>
  </div>`;

  const corpoVenda = `
  <p class="sec-t">Itens da venda</p>
  <table class="tb">
    <thead><tr><th class="c">#</th><th>Descrição</th><th class="c">Tipo</th><th class="c">Qtd</th><th class="r">Unitário</th><th class="r">Desconto</th><th class="r">Total</th></tr></thead>
    <tbody>${itensRows}</tbody>
  </table>
  ${temOS && valOS>0 ? `<table class="tb" style="margin-top:2mm"><tbody><tr><td>Serviço da OS ${escapeHtml(v.os.numero||'')}${v.os.desconto?` (desc. ${fmtMoney(v.os.desconto)})`:''}</td><td class="r" style="width:32mm"><b>${fmtMoney(valOS)}</b></td></tr></tbody></table>`:''}
  <div class="tots">
    <span>Subtotal: <b>${fmtMoney(subItens + (temOS?valOS:0))}</b></span>
    <span>Descontos: <b>${fmtMoney(descV)}</b></span>
    <span class="tot-grande">TOTAL: ${fmtMoney(v.total||0)}</span>
  </div>
  ${parcelasRows}
  ${v.observacao?`<p class="obs"><b>Observações:</b> ${escapeHtml(v.observacao)}</p>`:''}`;

  let corpoOS = '';
  if(temOS){
    const o = v.os;
    corpoOS = `
    <div class="os-div"><span>ORDEM DE SERVIÇO ${escapeHtml(o.numero||'')}</span></div>
    <table class="tb os-tb">
      <tbody>
        <tr>
          <td><span class="lbl">Equipamento / modelo</span><b>${escapeHtml(o.modelo||'')}</b></td>
          <td><span class="lbl">Nº de série</span><b>${escapeHtml(o.numeroSerie||'')}</b></td>
          <td><span class="lbl">Patrimônio</span><b>${escapeHtml(o.patrimonio||'-')}</b></td>
          <td><span class="lbl">Contador (cópias)</span><b>${escapeHtml(String(o.contador??'')||'-')}</b></td>
        </tr>
        <tr>
          <td><span class="lbl">Tipo da OS</span><b>${escapeHtml(o.tipoOS||'-')}</b></td>
          <td><span class="lbl">Acessórios</span><b>${escapeHtml(o.acessorios||'-')}</b></td>
          <td><span class="lbl">Técnico responsável</span><b>${escapeHtml(o.tecnico||'-')}</b></td>
          <td><span class="lbl">Resp. entrega / garantia</span><b>${escapeHtml(o.responsavelEntrega||'-')} • ${escapeHtml(o.garantia||'-')}</b></td>
        </tr>
      </tbody>
    </table>
    <table class="tb" style="margin-top:2mm"><tbody>
      <tr><td><span class="lbl">Defeito apresentado</span><p>${escapeHtml(o.defeito||'-')}</p></td></tr>
      <tr><td><span class="lbl">Serviços executados</span><p>${escapeHtml(o.servicos||'-')}</p></td></tr>
      <tr><td><span class="lbl">Peças</span><p>${escapeHtml(o.pecas||'-')}</p></td></tr>
      <tr><td><span class="lbl">Situação da OS</span><b>${escapeHtml(o.situacao||'-')}</b></td></tr>
    </tbody></table>
    <div class="ass-dupla">
      <div class="ass">Assinatura do cliente</div>
      <div class="ass">Assinatura do técnico</div>
    </div>`;
  }

  const assinaturaVenda = temOS ? '' : `<div class="ass-unica"><div class="ass">Assinatura do cliente<br><span class="mini">Recebi em ___/___/____ às ___:___</span></div></div>`;
  const audit = `<p class="audit">Emitido por ${escapeHtml(v.atendenteNome||v.criadoPorNome||sess.usuarioNome)} • CNPJ ${escapeHtml(sess.cnpj||'')} • Cód. cliente ${cli.codigo||'-'} • ${new Date().toLocaleString('pt-BR')}</p>`;

  const cssBase = `
    @page{size:A4 portrait; margin:0}
    *{box-sizing:border-box}
    body{margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#111}
    .pagina{width:210mm;padding:9mm 12mm}
    .meia{height:138mm}
    .inteira{min-height:278mm}
    .cab{display:flex;justify-content:space-between;gap:6mm;border-bottom:1.5px solid #0a1e8a;padding-bottom:3mm}
    .cab-esq{display:flex;gap:4mm;align-items:flex-start}
    .logo{width:12mm;height:12mm;border-radius:2.5mm;background:#0a1e8a;color:#fff;font-weight:800;display:grid;place-items:center;font-size:14px}
    .emp-nome{font-weight:800;font-size:14px;margin:0}
    .emp-info{margin:1px 0 0;font-size:9px;color:#555}
    .cab-dir{text-align:right}
    .nota-t{margin:0;font-size:10px;font-weight:700;color:#0a1e8a;letter-spacing:.05em}
    .nota-n{margin:0;font-size:17px;font-weight:800}
    .cli-box{display:flex;justify-content:space-between;gap:6mm;border:1px solid #ccc;border-radius:2mm;padding:2.5mm 3.5mm;margin-top:3mm}
    .cli-dir{text-align:right}
    .lbl{display:block;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#777;margin-bottom:1mm}
    .sec-t{margin:3.5mm 0 1.5mm;font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#0a1e8a}
    table.tb{width:100%;border-collapse:collapse;font-size:10.5px}
    .tb th{background:#eef0f8;font-size:8.5px;text-transform:uppercase;letter-spacing:.05em;color:#444;padding:1.6mm 2mm;border:1px solid #d5d9e8;text-align:left}
    .tb td{padding:1.6mm 2mm;border:1px solid #e2e5ee;vertical-align:top}
    .c{text-align:center}.r{text-align:right}
    .mini{font-size:8.5px;color:#777}
    .tots{display:flex;justify-content:flex-end;gap:8mm;margin-top:2.5mm;font-size:11px;align-items:baseline}
    .tot-grande{font-size:14px;font-weight:800;color:#0a1e8a}
    .obs{margin:2.5mm 0 0;font-size:10px;border:1px dashed #bbb;border-radius:2mm;padding:2mm 3mm}
    .ass{margin-top:14mm;border-top:1px solid #333;width:62mm;text-align:center;padding-top:1.5mm;font-size:9.5px}
    .ass-unica{display:flex}
    .ass-dupla{display:flex;justify-content:space-between;margin-top:2mm}
    .os-div{margin:4mm 0 2.5mm;background:#0a1e8a;color:#fff;font-weight:800;font-size:11px;letter-spacing:.06em;text-align:center;padding:2mm;border-radius:1.5mm}
    .os-tb td{width:25%}
    .audit{margin-top:3mm;font-size:8.5px;color:#888;border-top:1px solid #eee;padding-top:1.5mm}
    .no-print{margin:6mm;text-align:center;font-family:Arial}
    .no-print button{padding:3mm 8mm;border:0;border-radius:2mm;background:#0a1e8a;color:#fff;font-weight:700;cursor:pointer;font-size:12px}
    .no-print button.sec{background:#fff;color:#333;border:1px solid #aaa}
    .corte{margin:0;color:#999;font-size:9px;white-space:nowrap;overflow:hidden;width:210mm;padding:0 12mm}
    @media print{.no-print{display:none!important}.corte{color:#ccc}}`;
  const botoesHtml = opts.paraArquivo ? '' : `<div class="no-print"><button onclick="window.print()">🖨 Imprimir / Salvar PDF</button> <button class="sec" onclick="window.close()">Fechar</button> <span style="margin-left:8px;color:#666;font-size:12px">${temOS?'Venda + OS — folha inteira (A4)':'Venda normal — meia folha (A4)'} • para PDF, escolha "Salvar como PDF" na janela de impressão</span></div>`;
  const corteHtml = temOS ? '' : '<div class="corte no-print">✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -</div>';
  const scriptHtml = opts.paraArquivo ? '' : '<' + 'script>window.onload=function(){setTimeout(function(){window.print()},350)};<' + '/script>';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Notinha ${escapeHtml(v.numero)}</title><style>${cssBase}</style></head><body>
  ${botoesHtml}
  <div class="pagina ${temOS?'inteira':'meia'}">
    ${cabecalho}
    ${corpoVenda}
    ${corpoOS}
    ${assinaturaVenda}
    ${audit}
  </div>
  ${corteHtml}
  ${scriptHtml}
  </body></html>`;
};
// Impressão (janela do navegador/Electron → imprimir ou salvar como PDF)
window.imprimirNotinha = function(vendaId){
  const html = vosGerarHtmlNotinha(vendaId, {});
  if(!html){ if(typeof toast==='function') toast('Venda não encontrada','error'); return; }
  const win = window.open('','_blank');
  if(!win){ toast('Bloqueador de pop-up impediu a impressão','error'); return; }
  win.document.write(html); win.document.close();
  const v = db.vendas.find(x=>x.id===vendaId);
  if(v) logAction('venda','imprimir_notinha',v.id,`Notinha ${v.numero} impressa (${(v.os&&vosOsCompleta(v.os))?'folha inteira com OS '+v.os.numero:'meia folha'})`);
  saveDB();
};
// Exporta a notinha como arquivo Word (.doc) — cada notinha vira um arquivo separado
window.vosExportarNotinhaWord = function(vendaId){
  const html = vosGerarHtmlNotinha(vendaId, {paraArquivo:true});
  if(!html){ toast('Venda não encontrada','error'); return; }
  const v = db.vendas.find(x=>x.id===vendaId);
  const blob = new Blob(['\ufeff'+html], {type:'application/msword'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'notinha_' + String((v&&v.numero)||vendaId).replace(/[^\w-]+/g,'_') + '.doc';
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 1500);
  toast('Notinha salva em arquivo Word (.doc)','success');
  if(v) logAction('venda','exportar_notinha_word',v.id,`Notinha ${v.numero} exportada em Word`);
  saveDB();
};
// Exporta a listagem filtrada da consulta como planilha (CSV que o Excel abre)
window.vosExportarVendasCSV = function(){
  const sess = getSession(); if(!sess) return;
  const list = window.__vosUltimaListaVendas || [];
  if(!list.length) return toast('Nada para exportar — ajuste os filtros','info');
  const cliDe = v => (typeof clienteDaVenda==='function' ? clienteDaVenda(v) : db.clientes.find(c=>c.id===v.clienteId)) || {};
  const usrDe = v => (typeof usuarioDaVenda==='function' ? usuarioDaVenda(v) : (v.atendenteNome||v.criadoPorNome||'-'));
  const esc = x => '"' + String(x==null?'':x).replace(/"/g,'""') + '"';
  const linhas = [['Código','Data','Cliente','Cód. cliente','Valor','Situação','Tipo','Usuário','Pagamento','Origem'].map(esc).join(';')];
  list.forEach(v=>{
    const c = cliDe(v);
    const tipo = v.os ? 'Venda + OS' : ((v.itens||[]).some(it=>{ const p=it.produtoId&&db.produtos.find(pr=>pr.id===it.produtoId); return (p&&p.categoria==='Serviço')||/Serviço|Recarga|Manutenção/i.test(it.tipo||''); }) ? 'Serviço' : 'Venda');
    linhas.push([v.numero||'', fmtDate(v.data), c.nome||v.clienteNomeAntigo||'', c.codigo||v.codClienteAntigo||'', (v.total||0).toFixed(2).replace('.',','), v.status||'', tipo, usrDe(v), vosPagamentoStatus(v), v.origemMigracao?'sistema antigo':'novo'].map(esc).join(';'));
  });
  const blob = new Blob(['\ufeff'+linhas.join('\r\n')], {type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'vendas_' + new Date().toISOString().slice(0,10) + '.csv';
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 1500);
  toast(list.length + ' notinhas exportadas para Excel/CSV','success');
  logAction('venda','exportar_csv',null,`Exportação de ${list.length} notinhas para CSV por ${sess.usuarioNome}`);
  saveDB();
};

// ═══════════════════════════════════════════════════════════════════════════
// CONSULTA DE VENDAS — filtros avançados + ordenação clicando no título
// ═══════════════════════════════════════════════════════════════════════════
function vosLegadosVendas(sess){
  // Cache: reconverte os 20k+ registros antigos só quando os módulos mudarem
  const mod = db.modulosDinamicos||{};
  const c = window.__vosLegCache;
  if(c && c.mod===mod && c.emp===sess.empresaId) return c.list;
  const legados = [];
  Object.entries(db.modulosDinamicos||{}).forEach(([nome,mod])=>{
    if(!/VENDA|ORCAMENT|PEDIDO|NOTINHA|CUPOM|COMANDA/i.test(nome)) return;
    (mod.dados||[]).forEach((r,i)=>{
      const numero = r.NUMERO||r.CODIGO||r.COD_VENDA||r.ID||`${nome}-${i+1}`;
      legados.push({
        id:`legado_venda_${nome}_${i}`, empresaId:sess.empresaId, numero:String(numero),
        data:r.DATA||r.DATA_VENDA||r.EMISSAO||r.DT_VENDA||r.CRIADO_EM,
        total:Number(r.TOTAL||r.VALOR||r.VALOR_TOTAL||0)||0,
        status:String(r.SITUACAO||r.STATUS||'finalizada').toLowerCase(),
        formaPagamento:r.PAGAMENTO||r.FORMA_PAGAMENTO||r.RECEBIMENTO||'Prazo',
        clienteNomeAntigo:r.CLIENTE||r.NOME_CLIENTE||r.RAZAO_SOCIAL||r.NOME||'',
        fantasiaAntiga:r.FANTASIA||r.NOME_FANTASIA||'',
        numeroNfe:r.NFE||r.NUMERO_NFE||r.NUM_NFE||'',
        codClienteAntigo:r.COD_CLIENTE||r.CODIGO_CLIENTE||'',
        criadoPorNome:r.VENDEDOR||r.USUARIO||r.ATENDENTE||'Importado',
        observacao:r.OBSERVACAO||r.OBS||'',
        itens:[], origemMigracao:true, tabelaOrigem:nome
      });
    });
  });
  window.__vosLegCache = { mod, emp:sess.empresaId, list:legados };
  return legados;
}
function vosPagamentoStatus(v){
  if(v.origemMigracao) return v.formaPagamento||'Prazo';
  const crs = (db.contasReceber||[]).filter(c=>c.vendaId===v.id);
  if(crs.some(c=>String(c.status).toLowerCase()==='estornado')) return 'Estornado';
  if(crs.some(c=>String(c.status).toLowerCase()==='problema')) return 'Com problema';
  if(crs.some(c=>String(c.status).toLowerCase()==='cancelado')) return 'Cancelado';
  if(crs.length && crs.every(c=>c.status==='pago')) return 'Aprovado';
  if(crs.some(c=>c.status==='aberto')) return 'Aguardando';
  if(v.formaPagamento==='Grátis') return 'Grátis';
  return v.formaPagamento||'—';
}
window.vosSortVendas = function(col){
  const cur = window.__vosSortV || {col:'data', dir:'desc'};
  window.__vosSortV = { col, dir: (cur.col===col && cur.dir==='desc') ? 'asc' : 'desc' };
  localStorage.setItem('digicopy_sort_vendas', JSON.stringify(window.__vosSortV));
  window.__vosLimiteVendas = 300;
  renderVendas();
};
window.renderVendas = function(){
  const sess = getSession(); if(!sess) return;
  const view = document.getElementById('view-vendas') || ensureView('vendas');
  const g = id => document.getElementById(id)?.value || '';
  const qRaw = g('neo-search-vendas');
  const tab = g('neo-tab-vendas') || 'todas';
  const fDe = g('neo-vendas-de'), fAte = g('neo-vendas-ate');
  const fSit = g('neo-vendas-sit') || 'todas';
  const fVend = g('neo-vendas-vend') || 'todos';
  const adv = window.__vosAdvAberto || false;
  const AF = window.__vosAdvF || (window.__vosAdvF = {});
  const low = qRaw.toLowerCase();
  const hoje = new Date().toISOString().slice(0,10);
  const base = [ ...db.vendas.filter(v=>v.empresaId===sess.empresaId), ...vosLegadosVendas(sess) ];
  const cliDe = v => (typeof clienteDaVenda==='function' ? clienteDaVenda(v) : db.clientes.find(c=>c.id===v.clienteId)) || null;
  const usrDe = v => (typeof usuarioDaVenda==='function' ? usuarioDaVenda(v) : (v.atendenteNome||v.criadoPorNome||'-'));
  const numInt = n => (typeof numeroVendaInt==='function' ? numeroVendaInt(n) : vosNumeroInt(n));
  const tipoDe = v => {
    if(v.os) return 'Venda + OS';
    return (v.itens||[]).some(it=>{
      const p = it.produtoId && db.produtos.find(pr=>pr.id===it.produtoId);
      return (p && p.categoria==='Serviço') || /Serviço|Recarga|Manutenção/i.test(it.tipo||'');
    }) ? 'Serviço' : 'Venda';
  };
  let list = base.slice();
  if(tab==='hoje') list = list.filter(v=>(v.data||'').slice(0,10)===hoje);
  if(tab==='hojeabertas') list = list.filter(v=>(v.data||'').slice(0,10)===hoje && !['faturado','finalizada'].includes((v.status||'').toLowerCase()));
  if(tab==='abertas') list = list.filter(v=>!['faturado','finalizada'].includes((v.status||'').toLowerCase()));
  if(tab==='orcamentos') list = list.filter(v=>(v.status||'').toLowerCase()==='orcamento');
  if(fDe) list = list.filter(v=>(v.data||'').slice(0,10)>=fDe);
  if(fAte) list = list.filter(v=>(v.data||'').slice(0,10)<=fAte);
  if(fSit!=='todas') list = list.filter(v=>(v.status||'aguardar')===fSit);
  if(fVend!=='todos') list = list.filter(v=>usrDe(v)===fVend);
  if(low) list = list.filter(v=>{
    const c = cliDe(v)||{};
    return (v.numero||'').toLowerCase().includes(low)
      || (c.nome||'').toLowerCase().includes(low)
      || String(c.codigo||'').includes(low)
      || String(v.codClienteAntigo||'').includes(low)
      || (v.clienteNomeAntigo||'').toLowerCase().includes(low)
      || usrDe(v).toLowerCase().includes(low)
      || (v.formaPagamento||'').toLowerCase().includes(low);
  });
  // ── filtros avançados ──
  const has = k => (AF[k]||'').toLowerCase().trim();
  if(has('fantasia')) list = list.filter(v=>((cliDe(v)||{}).fantasia||v.fantasiaAntiga||'').toLowerCase().includes(has('fantasia')));
  if(has('codvenda')) list = list.filter(v=>String(numInt(v.numero)).includes(has('codvenda').replace(/\D/g,'')) || (v.numero||'').toLowerCase().includes(has('codvenda')));
  if(has('codcli')) list = list.filter(v=>{ const c=cliDe(v)||{}; return String(c.codigo||'').includes(has('codcli')) || String(v.codClienteAntigo||'').includes(has('codcli')); });
  if(has('valorDe')) list = list.filter(v=>(v.total||0)>=parseFloat(AF.valorDe));
  if(has('valorAte')) list = list.filter(v=>(v.total||0)<=parseFloat(AF.valorAte));
  if(has('nfe')) list = list.filter(v=>String(v.numeroNfe||'').includes(has('nfe')));
  if(has('produto')) list = list.filter(v=>(v.itens||[]).some(it=>{ const p=it.produtoId&&db.produtos.find(pr=>pr.id===it.produtoId); return ((p&&p.nome)||it.descricao||'').toLowerCase().includes(has('produto')); }));
  if(has('obs')) list = list.filter(v=>(v.observacao||'').toLowerCase().includes(has('obs')));
  if(has('ident')) list = list.filter(v=>(v.itens||[]).some(it=>((it.identificacao||'')+' '+(it.numCartucho||'')).toLowerCase().includes(has('ident'))));
  if(has('osSerie')) list = list.filter(v=>v.os && (v.os.numeroSerie||'').toLowerCase().includes(has('osSerie')));
  if(has('osPatr')) list = list.filter(v=>v.os && (((v.os.patrimonio||'')+' '+(v.os.contador||'')).toLowerCase().includes(has('osPatr'))));
  if(has('osTec')) list = list.filter(v=>v.os && ((v.os.tecnico||'')+' '+(v.os.responsavelEntrega||'')).toLowerCase().includes(has('osTec')));
  if(has('osEquip')) list = list.filter(v=>v.os && (v.os.modelo||'').toLowerCase().includes(has('osEquip')));
  if(has('osServ')) list = list.filter(v=>v.os && (v.os.servicos||'').toLowerCase().includes(has('osServ')));
  if(has('pag')) list = list.filter(v=>vosPagamentoStatus(v).toLowerCase()===has('pag'));
  // ── ordenação pelos títulos ──
  let sort; try{ sort = JSON.parse(localStorage.getItem('digicopy_sort_vendas')||'null') || {col:'data', dir:'desc'}; }catch(e){ sort={col:'data', dir:'desc'}; }
  window.__vosSortV = sort;
  const cmp = {
    codigo: (a,b)=>numInt(a.numero)-numInt(b.numero),
    data: (a,b)=>new Date(a.data||0)-new Date(b.data||0),
    cliente: (a,b)=>(((cliDe(a)||{}).nome)||'').localeCompare(((cliDe(b)||{}).nome)||'','pt-BR',{sensitivity:'base'}),
    valor: (a,b)=>(a.total||0)-(b.total||0),
    situacao: (a,b)=>String(a.status||'').localeCompare(String(b.status||'')),
    tipo: (a,b)=>tipoDe(a).localeCompare(tipoDe(b)),
    usuario: (a,b)=>usrDe(a).localeCompare(usrDe(b),'pt-BR',{sensitivity:'base'}),
    pagamento: (a,b)=>vosPagamentoStatus(a).localeCompare(vosPagamentoStatus(b),'pt-BR',{sensitivity:'base'})
  };
  const fn = cmp[sort.col] || cmp.data;
  list.sort((a,b)=>{ const r=fn(a,b); if(r!==0) return sort.dir==='asc' ? -r : r; return numInt(b.numero)-numInt(a.numero); });
  const total = list.reduce((s,v)=>s+(v.total||0),0);
  window.__vosUltimaListaVendas = list; // lista filtrada (usada pelo Excel/CSV)
  const limite = window.__vosLimiteVendas || 300; // paginação: nunca renderiza milhares de linhas de uma vez
  const listRender = list.slice(0, limite);
  const vendedores = [...new Set(base.map(usrDe).filter(x=>x && x!=='-'))].sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'}));
  const situacoes = [...new Set(base.map(v=>v.status||'aguardar'))].sort();
  const seta = col => sort.col===col ? (sort.dir==='asc'?' ▲':' ▼') : '';
  const th = (col,label)=>`<th onclick="vosSortVendas('${col}')" class="cursor-pointer select-none hover:text-[#0a1e8a]" title="Clique para ordenar">${label}${seta(col)}</th>`;
  const lblStatus = v => { const s=(v.status||'aguardar'); return s==='faturado'?'Finalizada':s==='orcamento'?'Orçamento':s==='aprovado'?'Aprovada':s==='finalizada'?'Finalizada':'Aguardando'; };
  const clsStatus = v => { const s=(v.status||''); return (s==='faturado'||s==='finalizada')?'ok':(s==='orcamento'||s==='aprovado')?'info':'wait'; };
  const advInput = (k,label,ph,type)=>`<label class="text-[10px] font-bold uppercase text-slate-500">${label}<input id="vosf-${k}" type="${type||'text'}" value="${escapeHtml(AF[k]||'')}" placeholder="${ph||''}" onchange="window.__vosAdvF['${k}']=this.value; window.__vosLimiteVendas=300; renderVendas()" class="mt-0.5 w-full h-[34px] px-2 rounded-lg border text-[12px] normal-case font-normal"></label>`;
  view.innerHTML = `<div class="neo-shell">
    <div class="neo-panel neo-float-in">
      <div class="neo-head"><div><h3>Vendas e Notinhas</h3><p>Consulta de vendas novas e antigas — <b>clique no título da coluna</b> para ordenar • <b>duplo clique</b> abre o histórico</p></div><div class="neo-actions"><button onclick="novaVenda()" class="neo-btn primary"><i class="ph ph-plus"></i>Nova venda</button><button onclick="if(window.neoVendaSelecionada) historicoVenda(window.neoVendaSelecionada); else toast('Selecione uma notinha','info')" class="neo-btn"><i class="ph ph-clock-counter-clockwise"></i>Histórico</button><button onclick="if(window.neoVendaSelecionada) imprimirNotinha(window.neoVendaSelecionada); else toast('Selecione uma notinha','info')" class="neo-btn"><i class="ph ph-printer"></i>Imprimir</button><button onclick="vosExportarVendasCSV()" class="neo-btn" title="Baixa a listagem filtrada em planilha (abre no Excel)"><i class="ph ph-file-xls"></i>Excel/CSV</button><button onclick="excluirVendaNeo()" class="neo-btn danger"><i class="ph ph-trash"></i>Excluir</button></div></div>
      <div class="p-4 border-b bg-white space-y-2">
        <input type="hidden" id="neo-tab-vendas" value="${tab}">
        <div class="flex flex-wrap items-center gap-3">
          <div class="neo-tabs"><button onclick="window.__vosLimiteVendas=300; setNeoVendasTab('todas')" class="neo-tab ${tab==='todas'?'active':''}">Todas</button><button onclick="window.__vosLimiteVendas=300; setNeoVendasTab('hojeabertas')" class="neo-tab ${tab==='hojeabertas'?'active':''}">Hoje/Abertas</button><button onclick="window.__vosLimiteVendas=300; setNeoVendasTab('hoje')" class="neo-tab ${tab==='hoje'?'active':''}">Hoje</button><button onclick="window.__vosLimiteVendas=300; setNeoVendasTab('abertas')" class="neo-tab ${tab==='abertas'?'active':''}">Abertas</button><button onclick="window.__vosLimiteVendas=300; setNeoVendasTab('orcamentos')" class="neo-tab ${tab==='orcamentos'?'active':''}">Orçamentos</button></div>
          <input id="neo-search-vendas" value="${escapeHtml(qRaw)}" oninput="vosBuscaVendasDeb()" class="neo-input ml-auto min-w-[240px] flex-1" placeholder="Busca livre: código, cliente, código cliente, usuário, pagamento...">
          <div class="text-right text-[12px] text-slate-500 min-w-[120px]"><b class="text-[#0a1e8a]">${listRender.length}</b> de <b>${list.length}</b> reg.<br>${fmtMoney(total)}</div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <label class="text-[11px] font-bold text-slate-500 uppercase">De</label><input id="neo-vendas-de" type="date" value="${fDe}" onchange="window.__vosLimiteVendas=300; renderVendas()" class="neo-input !w-[145px] !h-9">
          <label class="text-[11px] font-bold text-slate-500 uppercase">Até</label><input id="neo-vendas-ate" type="date" value="${fAte}" onchange="window.__vosLimiteVendas=300; renderVendas()" class="neo-input !w-[145px] !h-9">
          <select id="neo-vendas-sit" onchange="window.__vosLimiteVendas=300; renderVendas()" class="neo-select !h-9"><option value="todas">Situação: todas</option>${situacoes.map(s=>`<option value="${s}" ${fSit===s?'selected':''}>${s}</option>`).join('')}</select>
          <select id="neo-vendas-vend" onchange="window.__vosLimiteVendas=300; renderVendas()" class="neo-select !h-9"><option value="todos">Vendedor: todos</option>${vendedores.map(n=>`<option ${fVend===n?'selected':''}>${escapeHtml(n)}</option>`).join('')}</select>
          <button onclick="window.__vosAdvAberto=!window.__vosAdvAberto; renderVendas()" class="neo-btn !h-9 ${window.__vosAdvAberto?'primary':''}"><i class="ph ph-funnel"></i>Filtros avançados${Object.values(AF).filter(x=>(x||'').trim()).length?` (${Object.values(AF).filter(x=>(x||'').trim()).length})`:''}</button>
          <button onclick="window.__vosAdvF={}; window.__vosLimiteVendas=300; document.getElementById('neo-vendas-de').value='';document.getElementById('neo-vendas-ate').value='';document.getElementById('neo-vendas-sit').value='todas';document.getElementById('neo-vendas-vend').value='todos';document.getElementById('neo-search-vendas').value='';renderVendas()" class="neo-btn !h-9"><i class="ph ph-funnel-x"></i>Limpar</button>
        </div>
        ${adv?`<div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2 pt-2 border-t border-dashed">
          ${advInput('codvenda','Código venda','nº')}
          ${advInput('codcli','Código cliente','cód')}
          ${advInput('fantasia','Nome fantasia','fantasia')}
          ${advInput('ident','Identificação / comanda','ident')}
          ${advInput('produto','Nome produto','produto')}
          ${advInput('obs','Observação','obs')}
          ${advInput('nfe','Número NF-e','nf-e')}
          ${advInput('valorDe','Valor de','0,00','number')}
          ${advInput('valorAte','Valor até','0,00','number')}
          ${advInput('osSerie','OS — série','serial')}
          ${advInput('osPatr','OS — patrimônio/contador','patr/cont')}
          ${advInput('osTec','OS — técnico','técnico')}
          ${advInput('osEquip','OS — equipamento','modelo')}
          ${advInput('osServ','OS — serviços executados','serviço')}
          <label class="text-[10px] font-bold uppercase text-slate-500">Pagamento
            <select id="vosf-pag" onchange="window.__vosAdvF['pag']=this.value; window.__vosLimiteVendas=300; renderVendas()" class="mt-0.5 w-full h-[34px] px-2 rounded-lg border text-[12px]">
              <option value="">todos</option>
              ${['Aprovado','Aguardando','Estornado','Com problema','Cancelado','Grátis'].map(p=>`<option ${has('pag')===p.toLowerCase()?'selected':''}>${p}</option>`).join('')}
            </select></label>
        </div>`:''}
      </div>
      <div class="overflow-auto max-h-[calc(100vh-360px)]"><table class="neo-table"><thead><tr>${th('codigo','Código')}${th('data','Data')}${th('cliente','Cliente')}${th('valor','Valor')}${th('situacao','Situação')}${th('tipo','Tipo')}${th('usuario','Usuário')}${th('pagamento','Pagamento')}<th></th></tr></thead><tbody>
      ${listRender.map(v=>{
        const c = cliDe(v);
        return `<tr onclick="window.neoVendaSelecionada='${v.id}'; renderVendas()" ondblclick="if('${v.id}'.startsWith('legado_')){toast('Notinha do sistema antigo — veja em Cadastros/Módulos','info')}else{historicoVenda('${v.id}')}" class="cursor-pointer ${window.neoVendaSelecionada===v.id?'neo-selected':''}">
        <td><b class="text-[#0a1e8a]">${escapeHtml((v.numero||'').replace('VD-',''))}</b></td>
        <td>${fmtDate(v.data)}</td>
        <td><b>${escapeHtml(c?c.nome:'(sem cliente)')}</b><br><span class="text-[11px] text-slate-500">Cód. ${c?(c.codigo||'-'):'-'}${c&&c.semVinculo?' • sistema antigo':''}</span></td>
        <td><b>${fmtMoney(v.total||0)}</b></td>
        <td><span class="neo-status ${clsStatus(v)}">${lblStatus(v)}</span></td>
        <td>${tipoDe(v)}${v.os?` <span class="text-[10px]" title="OS ${escapeHtml(v.os.numero||'')} ${v.os.completa?'(completa — folha inteira)':'(parcial)'}">🔧</span>`:''}</td>
        <td>${escapeHtml(usrDe(v).split(' ')[0])}</td>
        <td>${escapeHtml(vosPagamentoStatus(v))}</td>
        <td>${v.origemMigracao?`<span class="text-[10px] text-slate-400">antiga</span>`:`<button onclick="event.stopPropagation(); historicoVenda('${v.id}')" class="neo-btn !px-2" title="Abrir histórico"><i class="ph ph-eye"></i></button>`}</td>
      </tr>`;}).join('') || '<tr><td colspan="9" class="text-center text-slate-500 py-12">Nenhuma notinha encontrada com estes filtros</td></tr>'}
      </tbody></table>
      ${list.length>listRender.length?`<div class="p-3 text-center border-t bg-slate-50/70 sticky bottom-0"><button onclick="window.__vosLimiteVendas=${limite+300}; renderVendas()" class="neo-btn primary"><i class="ph ph-plus-circle"></i>Mostrar mais ${Math.min(300, list.length-listRender.length)} de ${list.length-listRender.length} restantes</button><p class="text-[11px] text-slate-500 mt-1">Dica: refine os filtros para chegar direto na notinha desejada</p></div>`:''}
      </div>
    </div>
  </div>`;
  const input = document.getElementById('neo-search-vendas');
  if(input && document.activeElement && document.activeElement.id==='neo-search-vendas'){ input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
};
// Busca com espera de 180ms — não redesenha a grade a cada tecla (performance)
window.vosBuscaVendasDeb = function(){
  clearTimeout(window.__vosBT);
  window.__vosBT = setTimeout(()=>{ window.__vosLimiteVendas=300; renderVendas(); }, 180);
};
// captura valores dos filtros avançados antes do re-render (oninput sem perder foco)
document.addEventListener('input', function(ev){
  if(ev.target && ev.target.id && ev.target.id.startsWith('vosf-')){
    window.__vosAdvF = window.__vosAdvF || {};
    window.__vosAdvF[ev.target.id.slice(5)] = ev.target.value;
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// HISTÓRICO — venda + OS + parcelas + ações
// ═══════════════════════════════════════════════════════════════════════════
window.historicoVenda = function(id){
  const v = db.vendas.find(x=>x.id===id);
  if(!v){ toast('Notinha não encontrada','error'); return; }
  const cli = (typeof clienteDaVenda==='function' ? clienteDaVenda(v) : db.clientes.find(c=>c.id===v.clienteId)) || {};
  const logs = (db.logs||[]).filter(l=>String(l.entidadeId)===v.id || String(l.entidadeId)===v.numero).slice(0,30);
  const fins = (db.contasReceber||[]).filter(c=>c.vendaId===v.id).sort((a,b)=>(a.parcela||0)-(b.parcela||0));
  const box = document.getElementById('modal-box');
  if(box) box.className = 'w-full max-w-[900px] rounded-[18px] bg-white shadow-2xl animate-slideIn overflow-hidden max-h-[94vh] flex flex-col';
  document.getElementById('modal-title').innerText = 'Histórico — ' + v.numero;
  const o = v.os;
  const temOSDados = o && vosOsTemAlgumDado(o);
  document.getElementById('modal-body').innerHTML = `
  <div class="space-y-3">
    <div class="rounded-[14px] ${v.status==='faturado'?'bg-emerald-600':'bg-[#0a1e8a]'} text-white p-4 flex justify-between items-center">
      <div><p class="text-[11px] uppercase font-bold text-white/70">${v.status==='orcamento'?'Orçamento':'Venda'}</p><p class="font-bold text-[18px]">${escapeHtml(v.numero)}</p></div>
      <div class="text-right text-[12px]"><p>${fmtDateTime(v.data)}</p><p>Atendente: <b>${escapeHtml(v.atendenteNome||v.criadoPorNome||'-')}</b></p><p class="font-bold text-[16px] mt-1">${fmtMoney(v.total||0)} • ${escapeHtml(v.formaPagamento||'—')}</p></div>
    </div>
    <div class="rounded-[14px] border p-3 text-[12.5px]">
      <p class="font-bold">${cli.codigo?`#${cli.codigo} — `:''}${escapeHtml(cli.nome||'(sem cliente)')} ${cli.fantasia?`(${escapeHtml(cli.fantasia)})`:''}</p>
      <p class="text-slate-500">${escapeHtml(cli.documento||'')} • ${escapeHtml(cli.telefone||'')} • ${escapeHtml(cli.endereco||'')} ${cli.cidade?`• ${cli.cidade}/${cli.estado||''}`:''}</p>
      ${v.destino||v.prazoEntrega||v.dataSaida?`<p class="mt-1 text-slate-500">Destino: <b>${escapeHtml(v.destino||'-')}</b> • Saída: <b>${v.dataSaida?fmtDate(v.dataSaida):'-'}</b> • Prazo entrega: <b>${v.prazoEntrega?fmtDate(v.prazoEntrega):'-'}</b></p>`:''}
    </div>
    <div class="rounded-[14px] border overflow-hidden">
      <table class="w-full text-left text-[12px]">
        <thead class="bg-slate-50 border-b text-[10.5px] uppercase font-bold text-slate-500"><tr><th class="px-3 py-2">Tipo</th><th class="px-3 py-2">Descrição</th><th class="px-3 py-2">Ident./Cart.</th><th class="px-3 py-2">Qtd</th><th class="px-3 py-2">Unit</th><th class="px-3 py-2">Desc</th><th class="px-3 py-2">Total</th><th class="px-3 py-2">Sit</th><th class="px-3 py-2">PE</th><th class="px-3 py-2">PS</th><th class="px-3 py-2">Téc</th></tr></thead>
        <tbody class="divide-y">${(v.itens||[]).map(it=>{ const p=it.produtoId?db.produtos.find(pr=>pr.id===it.produtoId):null; return `<tr>
          <td class="px-3 py-2">${escapeHtml(it.tipo||'')}</td><td class="px-3 py-2"><b>${escapeHtml((p&&p.nome)||it.descricao||'')}</b></td>
          <td class="px-3 py-2">${escapeHtml([it.identificacao,it.numCartucho].filter(Boolean).join(' / '))}</td><td class="px-3 py-2">${it.qtd}</td>
          <td class="px-3 py-2">${fmtMoney(it.preco)}</td><td class="px-3 py-2">${fmtMoney(it.desconto||0)}</td><td class="px-3 py-2"><b>${fmtMoney(it.subtotal)}</b></td>
          <td class="px-3 py-2">${escapeHtml(it.situacao||'')}</td><td class="px-3 py-2">${it.pe?'✔':''}</td><td class="px-3 py-2">${it.ps?'✔':''}</td><td class="px-3 py-2">${escapeHtml(it.tecnico||'')}</td></tr>`;}).join('') || '<tr><td colspan="11" class="text-center text-slate-400 py-6">Sem itens</td></tr>'}</tbody>
      </table>
    </div>
    ${temOSDados?`<div class="rounded-[14px] border-2 ${o.completa?'border-emerald-300 bg-emerald-50/40':'border-amber-300 bg-amber-50/40'} p-3 text-[12.5px]">
      <p class="font-bold text-[13px] mb-1"><i class="ph ph-wrench"></i> Ordem de Serviço ${escapeHtml(o.numero||'')} ${o.completa?'<span class="ml-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px]">completa — impressa em folha inteira</span>':'<span class="ml-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">parcial — não sai na notinha (faltam modelo/série/patrimônio-contador)</span>'}</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
        <span>Modelo: <b>${escapeHtml(o.modelo||'-')}</b></span>
        <span>Série: <b>${escapeHtml(o.numeroSerie||'-')}</b></span>
        <span>Patrimônio: <b>${escapeHtml(o.patrimonio||'-')}</b></span>
        <span>Contador: <b>${escapeHtml(String(o.contador??'-'))}</b></span>
        <span>Tipo: <b>${escapeHtml(o.tipoOS||'-')}</b></span>
        <span>Técnico: <b>${escapeHtml(o.tecnico||'-')}</b></span>
        <span>Entrega: <b>${escapeHtml(o.responsavelEntrega||'-')}</b></span>
        <span>Garantia: <b>${escapeHtml(o.garantia||'-')}</b></span>
        <span>Situação OS: <b>${escapeHtml(o.situacao||'-')}</b></span>
        <span>Valor serviço: <b>${fmtMoney(o.valorServico||0)}</b></span>
        <span>Desc. OS: <b>${fmtMoney(o.desconto||0)}</b></span>
        <span>Acessórios: <b>${escapeHtml(o.acessorios||'-')}</b></span>
      </div>
      ${o.defeito?`<p class="mt-1"><b>Defeito:</b> ${escapeHtml(o.defeito)}</p>`:''}
      ${o.servicos?`<p class="mt-1"><b>Serviços executados:</b> ${escapeHtml(o.servicos)}</p>`:''}
      ${o.pecas?`<p class="mt-1"><b>Peças:</b> ${escapeHtml(o.pecas)}</p>`:''}
    </div>`:''}
    ${v.observacao?`<div class="rounded-[14px] border p-3 text-[12.5px]"><b>Observações:</b> ${escapeHtml(v.observacao)}</div>`:''}
    <div class="rounded-[14px] border overflow-hidden">
      <div class="px-3 py-2 bg-slate-50 border-b font-bold text-[12px] flex justify-between"><span>Financeiro (contas a receber)</span><span class="text-slate-500">${fins.length} título(s)</span></div>
      <table class="w-full text-left text-[12px]"><tbody class="divide-y">
        ${fins.map(cr=>{ const venc=new Date(cr.vencimento); const atraso=cr.status==='aberto'&&venc<new Date(); return `<tr>
          <td class="px-3 py-2"><b>${cr.parcela?`Parcela ${cr.parcela}/${cr.totalParcelas||1}`:'Título único'}</b><br><span class="text-slate-500">${escapeHtml(cr.descricao||'')}</span></td>
          <td class="px-3 py-2">${fmtDate(cr.vencimento)} ${atraso?'⚠️':''}</td>
          <td class="px-3 py-2"><b>${fmtMoney(cr.valor)}</b></td>
          <td class="px-3 py-2"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${cr.status==='pago'?'bg-emerald-50 text-emerald-700':atraso?'bg-red-50 text-red-700':'bg-blue-50 text-blue-700'}">${atraso?'vencido':cr.status}${cr.status==='pago'&&cr.pagamentoData?` em ${fmtDate(cr.pagamentoData)}`:''}</span></td>
          <td class="px-3 py-2">${cr.status!=='pago'?`<button onclick="baixarCR('${cr.id}'); setTimeout(()=>historicoVenda('${v.id}'),200)" class="h-7 px-3 rounded-lg bg-emerald-600 text-white text-[11px] font-bold">Baixar</button>`:''}</td>
        </tr>`;}).join('') || '<tr><td class="px-3 py-3 text-slate-400">Nenhum título gerado para esta venda</td></tr>'}
      </tbody></table>
    </div>
    <div class="rounded-[14px] border p-3 text-[11.5px] text-slate-500 max-h-[120px] overflow-auto">
      ${logs.map(l=>`<p>${fmtDateTime(l.criadoEm||l.data)} • <b>${escapeHtml(l.usuarioNome||'-')}</b> • ${escapeHtml(l.acao||'')} — ${escapeHtml(l.detalhes||'')}</p>`).join('') || '<p>Sem registros de auditoria</p>'}
    </div>
  </div>`;
  document.getElementById('modal-footer').innerHTML = `
    <button onclick="closeModal()" class="h-[44px] px-5 rounded-xl bg-white border font-bold">Fechar</button>
    ${(v.parcelas&&v.parcelas.length>1)||fins.length>1?`<button onclick="vosImprimirCarne('${v.id}')" class="h-[44px] px-5 rounded-xl bg-white border font-bold flex items-center gap-2"><i class="ph ph-ticket"></i> Carnê</button>`:''}
    <button onclick="vosExportarNotinhaWord('${v.id}')" class="h-[44px] px-5 rounded-xl bg-white border font-bold flex items-center gap-2" title="Baixa a notinha em arquivo Word (.doc)"><i class="ph ph-file-doc"></i> Word</button>
    <button onclick="imprimirNotinha('${v.id}')" class="h-[44px] px-5 rounded-xl bg-white border font-bold flex items-center gap-2" title="Imprimir ou salvar em PDF"><i class="ph ph-printer"></i> Imprimir/PDF${temOSDados&&o.completa?' (folha inteira)':''}</button>
    ${v.status!=='faturado'?`<button onclick="closeModal(); faturarVenda('${v.id}')" class="h-[44px] px-6 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-2"><i class="ph ph-check-circle"></i> Faturar</button>`:''}`;
  document.getElementById('modal-root').classList.remove('hidden');
};
window.showVenda = window.historicoVenda;

console.log('PATCH vendas+OS v4.2.0 — nova venda completa, OS, serial, faturamento, parcelas, carnê e impressão A4');
})();
