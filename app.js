// DIGICOPY ERP v3.8 - Core com Login 2 etapas (CNPJ > Usuário) + Auditoria
const APP_VERSION='3.8.0';
const DB_KEY='digicopy_erp_v30';
const SESSION_KEY='digicopy_session_v30';
const PENDING_CNPJ_KEY='digicopy_pending_cnpj';

const defaultData={
  empresas:[],
  usuarios:[],
  clientes:[], produtos:[], equipamentos:[], contratos:[], parque:[], leituras:[], os:[], vendas:[], contasReceber:[], contasPagar:[], logs:[],
  modulosDinamicos:{}, // Armazena dados de tabelas sem mapeamento direto
  tecnicos:[{id:'t1',nome:'Carlos Mendes',especialidade:'Laser Mono',osConcluidas:87},{id:'t2',nome:'Ana Souza',especialidade:'Color',osConcluidas:62},{id:'t3',nome:'Rafael Lima',especialidade:'Grande formato',osConcluidas:44}],
  config:{empresa:{nome:'DIGICOPY Cartuchos e Impressoras LTDA',cnpj:'12.345.678/0001-90',fone:'(11) 3333-4444',email:'contato@digicopy.com.br'}}
};

function loadDB(){
  const raw=localStorage.getItem(DB_KEY);
  if(!raw) return structuredClone(defaultData);
  try{
    const parsed=JSON.parse(raw);
    // Migração defensiva para versões antigas salvas no navegador.
    ['empresas','usuarios','clientes','produtos','equipamentos','contratos','parque','leituras','os','vendas','contasReceber','contasPagar','logs'].forEach(k=>{
      if(!Array.isArray(parsed[k])) parsed[k]=[];
    });
    if(!parsed.modulosDinamicos || typeof parsed.modulosDinamicos !== 'object') parsed.modulosDinamicos = {};
    if(!Array.isArray(parsed.tecnicos)) parsed.tecnicos=structuredClone(defaultData.tecnicos);
    if(!parsed.config) parsed.config=structuredClone(defaultData.config);
    if(!parsed.config.empresa) parsed.config.empresa=structuredClone(defaultData.config.empresa);
    parsed.meta={...(parsed.meta||{}), appVersion:APP_VERSION, migradoEm:new Date().toISOString()};
    return parsed;
  }catch{
    return structuredClone(defaultData);
  }
}
function saveDB(){localStorage.setItem(DB_KEY, JSON.stringify(db));}
let db=loadDB();

function uid(p='id'){return p+'_'+Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-3)}
function fmtMoney(v){return (v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function fmtDate(s){if(!s) return '-'; const d=new Date(s); if(isNaN(d)) return s; return d.toLocaleDateString('pt-BR')}
function fmtDateTime(s){if(!s) return '-'; return new Date(s).toLocaleString('pt-BR')}
function onlyDigits(s){return (s||'').replace(/\D/g,'')}
function initials(name){return (name||'').split(' ').filter(Boolean).slice(0,2).map(n=>n[0].toUpperCase()).join('')||'??'}
function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));}
function ensureView(id){let el=document.getElementById('view-'+id); if(!el){const wrap=document.querySelector('main .flex-1.p-4, main .flex-1'); el=document.createElement('section'); el.id='view-'+id; el.className='view hidden space-y-4'; if(wrap) wrap.appendChild(el);} return el;}

function toast(msg,type='info'){
  const c=document.getElementById('toast-container');
  const el=document.createElement('div');
  el.className=`pointer-events-auto min-w-[320px] max-w-[420px] rounded-[14px] shadow-xl border px-4 py-3 flex items-start gap-3 text-[13px] font-medium animate-slideIn ${type==='success'?'bg-[#0a1e8a] text-white border-[#08176e]':type==='error'?'bg-red-600 text-white border-red-700':'bg-white text-slate-800 border-slate-200'}`;
  el.innerHTML=`<i class="ph ${type==='success'?'ph-check-circle':type==='error'?'ph-warning-circle':'ph-info'} text-[18px] mt-0.5"></i><div class="flex-1 leading-snug">${msg}</div><button onclick="this.parentElement.remove()" class="opacity-60 hover:opacity-100"><i class="ph ph-x"></i></button>`;
  c.appendChild(el); setTimeout(()=>{el.style.opacity='0'; el.style.transform='translateX(12px)'; setTimeout(()=>el.remove(),250)},4000);
}

// SESSION
function getSession(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}}
function setSession(s){localStorage.setItem(SESSION_KEY, JSON.stringify(s))}
function clearSession(){localStorage.removeItem(SESSION_KEY)}
function getPendingEmpresa(){try{return JSON.parse(localStorage.getItem(PENDING_CNPJ_KEY)||'null')}catch{return null}}
function setPendingEmpresa(e){localStorage.setItem(PENDING_CNPJ_KEY, JSON.stringify(e))}
function getCurrentUser(){const s=getSession(); if(!s) return null; return {id:s.usuarioId, nome:s.usuarioNome, login:s.login, perfil:s.perfil, empresaId:s.empresaId, empresaNome:s.empresaNome, cnpj:s.cnpj}}

// AUDITORIA
function logAction(entidade, acao, entidadeId, detalhes=''){
  const sess=getSession(); if(!sess) return;
  db.logs.unshift({id:uid('log'), dataHora:new Date().toISOString(), empresaId:sess.empresaId, usuarioId:sess.usuarioId, usuarioNome:sess.usuarioNome, usuarioLogin:sess.login, entidade, acao, entidadeId, detalhes});
  if(db.logs.length>500) db.logs=db.logs.slice(0,500);
  saveDB();
  const auditEl=document.getElementById('audit-user'); if(auditEl) auditEl.innerText=sess.usuarioNome+' • '+sess.login;
}

// SEED INICIAL
function seedData(force=false){
  if(!force && db.empresas.length>0 && db.clientes.length>0) return;
  const gen=p=>uid(p);
  const empresaId=gen('emp');
  const empresas=[{id:empresaId,cnpj:'12.345.678/0001-90',cnpjDigits:onlyDigits('12.345.678/0001-90'),senha:'123456',nome:'DIGICOPY Cartuchos e Impressoras LTDA',fantasia:'DIGICOPY',criadoEm:new Date().toISOString()}];
  const usuarios=[
    {id:gen('usr'),empresaId, nome:'Kauan Gabriel', login:'admin', senha:'admin123', perfil:'Admin', ativo:true, criadoEm:new Date().toISOString(), criadoPor:'sistema'},
    {id:gen('usr'),empresaId, nome:'Carlos Mendes', login:'carlos', senha:'123456', perfil:'Técnico', ativo:true, criadoEm:new Date().toISOString(), criadoPor:'sistema'},
    {id:gen('usr'),empresaId, nome:'Ana Souza', login:'ana', senha:'123456', perfil:'Comercial', ativo:true, criadoEm:new Date().toISOString(), criadoPor:'sistema'},
    {id:gen('usr'),empresaId, nome:'Financeiro', login:'financeiro', senha:'123456', perfil:'Financeiro', ativo:true, criadoEm:new Date().toISOString(), criadoPor:'sistema'},
  ];
  const clientes=[
    {id:gen('cli'),empresaId,nome:'Construtora Horizonte LTDA',documento:'45.123.678/0001-12',tipo:'PJ',email:'financeiro@horizonte.com.br',telefone:'(11) 99123-4567',endereco:'Av. Paulista, 1000 - Bela Vista',cidade:'São Paulo',estado:'SP',cep:'01310-100',status:'ativo',mensalidade:2490,criadoEm:new Date().toISOString(),criadoPor:usuarios[0].id,criadoPorNome:usuarios[0].nome},
    {id:gen('cli'),empresaId,nome:'Escola Saber & Arte',documento:'08.765.432/0001-99',tipo:'PJ',email:'secretaria@saberarte.edu.br',telefone:'(11) 98888-1122',endereco:'R. das Flores, 234 - Jardim',cidade:'Osasco',estado:'SP',cep:'06010-120',status:'ativo',mensalidade:1890,criadoEm:new Date().toISOString(),criadoPor:usuarios[2].id,criadoPorNome:usuarios[2].nome},
    {id:gen('cli'),empresaId,nome:'Clínica Vida Mais',documento:'22.111.333/0001-44',tipo:'PJ',email:'adm@vidamaisclinica.com.br',telefone:'(11) 97777-3344',endereco:'R. Domingos, 45 - Centro',cidade:'Barueri',estado:'SP',cep:'06401-000',status:'inadimplente',mensalidade:3200,criadoEm:new Date().toISOString(),criadoPor:usuarios[1].id,criadoPorNome:usuarios[1].nome},
    {id:gen('cli'),empresaId,nome:'Advocacia Martins & Associados',documento:'33.222.111/0001-55',tipo:'PJ',email:'contato@martinsadv.com.br',telefone:'(11) 96666-7788',endereco:'Al. Santos, 700 - Jardins',cidade:'São Paulo',estado:'SP',cep:'01419-001',status:'ativo',mensalidade:1650,criadoEm:new Date().toISOString(),criadoPor:usuarios[0].id,criadoPorNome:usuarios[0].nome},
    {id:gen('cli'),empresaId,nome:'Metalúrgica Brasmetal',documento:'18.234.567/0001-33',tipo:'PJ',email:'compras@brasmetal.ind.br',telefone:'(11) 95555-0001',endereco:'Rod. Anhanguera, Km 20',cidade:'Cajamar',estado:'SP',cep:'07750-000',status:'ativo',mensalidade:4750,criadoEm:new Date().toISOString(),criadoPor:usuarios[0].id,criadoPorNome:usuarios[0].nome},
  ];
  const produtos=[
    {id:gen('prd'),empresaId,sku:'TON-BRO-1230',nome:'Toner Brother TN-3442 Compatível Alto Rendimento',categoria:'Suprimento',fabricante:'Premium',estoque:47,estoqueMin:10,custo:89,preco:149,local:'A1-02',status:'ativo',criadoPor:usuarios[0].id,criadoPorNome:usuarios[0].nome,criadoEm:new Date().toISOString()},
    {id:gen('prd'),empresaId,sku:'CIL-HP-19A',nome:'Cilindro HP 19A Original',categoria:'Peça',fabricante:'HP',estoque:8,estoqueMin:5,custo:210,preco:340,local:'B2-04',status:'ativo',criadoPor:usuarios[1].id,criadoPorNome:usuarios[1].nome,criadoEm:new Date().toISOString()},
    {id:gen('prd'),empresaId,sku:'IMP-BRO-5652',nome:'Brother DCP-L5652DN Laser Mono',categoria:'Impressora',fabricante:'Brother',estoque:3,estoqueMin:1,custo:1850,preco:2690,local:'C1-01',status:'ativo',criadoPor:usuarios[0].id,criadoPorNome:usuarios[0].nome,criadoEm:new Date().toISOString()},
    {id:gen('prd'),empresaId,sku:'IMP-KYO-M2040',nome:'Kyocera ECOSYS M2040dn',categoria:'Impressora',fabricante:'Kyocera',estoque:5,estoqueMin:2,custo:1950,preco:2990,local:'C1-02',status:'ativo',criadoPor:usuarios[0].id,criadoPorNome:usuarios[0].nome,criadoEm:new Date().toISOString()},
    {id:gen('prd'),empresaId,sku:'SERV-INST',nome:'Serviço Instalação e Configuração',categoria:'Serviço',fabricante:'DIGICOPY',estoque:999,estoqueMin:0,custo:0,preco:180,local:'-',status:'ativo',criadoPor:usuarios[0].id,criadoPorNome:usuarios[0].nome,criadoEm:new Date().toISOString()},
    {id:gen('prd'),empresaId,sku:'FUSOR-BRO',nome:'Fusor Brother L5502',categoria:'Peça',fabricante:'Brother',estoque:2,estoqueMin:2,custo:420,preco:680,local:'B1-01',status:'ativo',criadoPor:usuarios[1].id,criadoPorNome:usuarios[1].nome,criadoEm:new Date().toISOString()},
  ];
  const equips=[
    {id:gen('eq'),empresaId,modelo:'Brother DCP-L5652DN',fabricante:'Brother',tipo:'Laser Mono A4',patrimonio:'DIG-00123',serie:'U63231A8N123456',contadorPB:128450,contadorCor:0,status:'locado',valorCompra:2400,dataAquisicao:'2024-03-12',criadoPor:usuarios[0].id,criadoPorNome:usuarios[0].nome},
    {id:gen('eq'),empresaId,modelo:'Kyocera M2040dn',fabricante:'Kyocera',tipo:'Laser Mono A4',patrimonio:'DIG-00124',serie:'KVX882991023',contadorPB:45210,contadorCor:0,status:'locado',valorCompra:2200,dataAquisicao:'2024-06-01',criadoPor:usuarios[0].id,criadoPorNome:usuarios[0].nome},
    {id:gen('eq'),empresaId,modelo:'HP Color M454dw',fabricante:'HP',tipo:'Laser Color A4',patrimonio:'DIG-00130',serie:'PHCDN8S001',contadorPB:22300,contadorCor:18900,status:'locado',valorCompra:3100,dataAquisicao:'2023-11-20',criadoPor:usuarios[0].id,criadoPorNome:usuarios[0].nome},
    {id:gen('eq'),empresaId,modelo:'Brother MFC-L8900CDW',fabricante:'Brother',tipo:'Laser Color A4',patrimonio:'DIG-00131',serie:'U64559K0N998877',contadorPB:12300,contadorCor:22100,status:'disponivel',valorCompra:4200,dataAquisicao:'2024-08-10',criadoPor:usuarios[0].id,criadoPorNome:usuarios[0].nome},
    {id:gen('eq'),empresaId,modelo:'Kyocera M5521cdw',fabricante:'Kyocera',tipo:'Laser Color A4',patrimonio:'DIG-00132',serie:'KYO998877665',contadorPB:5400,contadorCor:8100,status:'manutencao',valorCompra:3800,dataAquisicao:'2024-09-05',criadoPor:usuarios[1].id,criadoPorNome:usuarios[1].nome},
    {id:gen('eq'),empresaId,modelo:'Epson EcoTank L3250',fabricante:'Epson',tipo:'Jato Color',patrimonio:'DIG-00133',serie:'EPL325000112',contadorPB:3200,contadorCor:5400,status:'disponivel',valorCompra:1100,dataAquisicao:'2025-01-10',criadoPor:usuarios[0].id,criadoPorNome:usuarios[0].nome},
  ];
  const contratos=[
    {id:gen('ctr'),empresaId,numero:'CT-2024-0142',clienteId:clientes[0].id,dataInicio:'2024-02-15',dataFim:'2026-02-14',duracaoMeses:24,diaVencimento:10,franquiaPB:5000,franquiaCor:0,valorFranquia:890,valorExcedentePB:0.08,valorExcedenteCor:0.45,valorMensalFixo:890,status:'ativo',equipamentos:[equips[0].id],observacoes:'Atendimento 24h',criadoPor:usuarios[0].id,criadoPorNome:usuarios[0].nome,criadoEm:new Date().toISOString()},
    {id:gen('ctr'),empresaId,numero:'CT-2024-0188',clienteId:clientes[1].id,dataInicio:'2024-05-01',dataFim:'2026-05-01',duracaoMeses:24,diaVencimento:15,franquiaPB:3000,franquiaCor:500,valorFranquia:1250,valorExcedentePB:0.09,valorExcedenteCor:0.55,valorMensalFixo:1250,status:'ativo',equipamentos:[equips[1].id,equips[2].id],observacoes:'Inclui toner e manutenção',criadoPor:usuarios[2].id,criadoPorNome:usuarios[2].nome,criadoEm:new Date().toISOString()},
    {id:gen('ctr'),empresaId,numero:'CT-2023-0099',clienteId:clientes[2].id,dataInicio:'2023-08-10',dataFim:'2025-12-09',duracaoMeses:24,diaVencimento:5,franquiaPB:10000,franquiaCor:2000,valorFranquia:3200,valorExcedentePB:0.07,valorExcedenteCor:0.42,valorMensalFixo:3200,status:'ativo',equipamentos:[equips[1].id],observacoes:'',criadoPor:usuarios[3].id,criadoPorNome:usuarios[3].nome,criadoEm:new Date().toISOString()},
    {id:gen('ctr'),empresaId,numero:'CT-2025-0011',clienteId:clientes[4].id,dataInicio:'2025-02-01',dataFim:'2027-02-01',duracaoMeses:24,diaVencimento:20,franquiaPB:15000,franquiaCor:0,valorFranquia:4750,valorExcedentePB:0.06,valorExcedenteCor:0,valorMensalFixo:4750,status:'pendente',equipamentos:[],observacoes:'Aguardando instalação',criadoPor:usuarios[0].id,criadoPorNome:usuarios[0].nome,criadoEm:new Date().toISOString()},
  ];
  const parque=[
    {id:gen('prk'),empresaId,contratoId:contratos[0].id,clienteId:clientes[0].id,equipamentoId:equips[0].id,setor:'Administrativo - Térreo',enderecoInstalacao:'Av. Paulista, 1000 - SP',dataInstalacao:'2024-02-16',contadorInicialPB:120000,contadorInicialCor:0,status:'ativo',criadoPor:usuarios[0].id,criadoPorNome:usuarios[0].nome},
    {id:gen('prk'),empresaId,contratoId:contratos[1].id,clienteId:clientes[1].id,equipamentoId:equips[1].id,setor:'Secretaria',enderecoInstalacao:'R. das Flores, 234 - Osasco',dataInstalacao:'2024-05-02',contadorInicialPB:40000,contadorInicialCor:0,status:'ativo',criadoPor:usuarios[0].id,criadoPorNome:usuarios[0].nome},
    {id:gen('prk'),empresaId,contratoId:contratos[1].id,clienteId:clientes[1].id,equipamentoId:equips[2].id,setor:'Coordenação Pedagógica',enderecoInstalacao:'R. das Flores, 234 - Osasco',dataInstalacao:'2024-05-02',contadorInicialPB:20000,contadorInicialCor:15000,status:'ativo',criadoPor:usuarios[2].id,criadoPorNome:usuarios[2].nome},
  ];
  const leituras=[
    {id:gen('lei'),empresaId,parqueId:parque[0].id,equipamentoId:parque[0].equipamentoId,contratoId:parque[0].contratoId,clienteId:parque[0].clienteId,dataLeitura:new Date(Date.now()-1000*60*60*24*30).toISOString(),contadorPB:127000,contadorCor:0,contadorPBAnterior:120000,contadorCorAnterior:0,consumoPB:7000,consumoCor:0,faturar:true,status:'faturado',valorExcedente:160,criadoPor:usuarios[1].id,criadoPorNome:usuarios[1].nome},
    {id:gen('lei'),empresaId,parqueId:parque[0].id,equipamentoId:parque[0].equipamentoId,contratoId:parque[0].contratoId,clienteId:parque[0].clienteId,dataLeitura:new Date(Date.now()-1000*60*60*24*2).toISOString(),contadorPB:128450,contadorCor:0,contadorPBAnterior:127000,contadorCorAnterior:0,consumoPB:1450,consumoCor:0,faturar:false,status:'pendente',valorExcedente:0,criadoPor:usuarios[0].id,criadoPorNome:usuarios[0].nome},
    {id:gen('lei'),empresaId,parqueId:parque[1].id,equipamentoId:parque[1].equipamentoId,contratoId:parque[1].contratoId,clienteId:parque[1].clienteId,dataLeitura:new Date(Date.now()-1000*60*60*24*5).toISOString(),contadorPB:45210,contadorCor:0,contadorPBAnterior:44000,contadorCorAnterior:0,consumoPB:1210,consumoCor:0,faturar:true,status:'pendente',valorExcedente:0,criadoPor:usuarios[2].id,criadoPorNome:usuarios[2].nome},
    {id:gen('lei'),empresaId,parqueId:parque[2].id,equipamentoId:parque[2].equipamentoId,contratoId:parque[2].contratoId,clienteId:parque[2].clienteId,dataLeitura:new Date(Date.now()-1000*60*60*24*3).toISOString(),contadorPB:22300,contadorCor:18900,contadorPBAnterior:21800,contadorCorAnterior:18200,consumoPB:500,consumoCor:700,faturar:true,status:'pendente',valorExcedente:110,criadoPor:usuarios[1].id,criadoPorNome:usuarios[1].nome},
  ];
  const os=[
    {id:gen('os'),empresaId,numero:'OS-2026-0142',clienteId:clientes[0].id,parqueId:parque[0].id,equipamentoId:parque[0].equipamentoId,tipo:'corretiva',prioridade:'alta',descricao:'Impressora atolando papel bandeja 1, limpeza do rolo',tecnico:'t1',status:'aberto',dataAbertura:new Date(Date.now()-1000*60*60*5).toISOString(),dataFechamento:null,solucao:'',custoPecas:0,tempoAtendimento:0,criadoPor:usuarios[2].id,criadoPorNome:usuarios[2].nome},
    {id:gen('os'),empresaId,numero:'OS-2026-0140',clienteId:clientes[2].id,parqueId:parque[1].id,equipamentoId:parque[1].equipamentoId,tipo:'suprimento',prioridade:'media',descricao:'Troca de toner, cliente solicitou reserva',tecnico:'t2',status:'em_atendimento',dataAbertura:new Date(Date.now()-1000*60*60*24).toISOString(),dataFechamento:null,solucao:'',custoPecas:0,tempoAtendimento:0,criadoPor:usuarios[0].id,criadoPorNome:usuarios[0].nome},
    {id:gen('os'),empresaId,numero:'OS-2026-0138',clienteId:clientes[1].id,parqueId:parque[2].id,equipamentoId:parque[2].equipamentoId,tipo:'preventiva',prioridade:'baixa',descricao:'Preventiva trimestral, limpeza geral e calibração de cores',tecnico:'t3',status:'aguardando_peca',dataAbertura:new Date(Date.now()-1000*60*60*24*3).toISOString(),dataFechamento:null,solucao:'',custoPecas:120,tempoAtendimento:90,criadoPor:usuarios[1].id,criadoPorNome:usuarios[1].nome},
    {id:gen('os'),empresaId,numero:'OS-2026-0120',clienteId:clientes[3].id,parqueId:null,equipamentoId:null,tipo:'instalacao',prioridade:'media',descricao:'Instalação nova impressora Color setor jurídico',tecnico:'t1',status:'concluido',dataAbertura:new Date(Date.now()-1000*60*60*24*10).toISOString(),dataFechamento:new Date(Date.now()-1000*60*60*24*8).toISOString(),solucao:'Instalada Brother MFC-L8900CDW, drivers configurados',custoPecas:0,tempoAtendimento:120,criadoPor:usuarios[1].id,criadoPorNome:usuarios[1].nome},
  ];
  const vendas=[
    {id:gen('vda'),empresaId,numero:'VD-2026-0081',clienteId:clientes[3].id,data:new Date(Date.now()-1000*60*60*24*2).toISOString(),itens:[{produtoId:produtos[0].id,qtd:3,preco:149,subtotal:447},{produtoId:produtos[4].id,qtd:1,preco:180,subtotal:180}],desconto:0,total:627,formaPagamento:'Boleto 30d',status:'faturado',criadoPor:usuarios[2].id,criadoPorNome:usuarios[2].nome},
  ];
  const cr=[
    {id:gen('cr'),empresaId,origem:'contrato',clienteId:clientes[0].id,descricao:'Mensalidade contrato CT-2024-0142 + excedente 2000 PB',valor:1050,vencimento:new Date(Date.now()+1000*60*60*24*5).toISOString(),pagamentoData:null,status:'aberto',contratoId:contratos[0].id,leituraId:leituras[0].id,vendaId:null,criadoPor:usuarios[3].id,criadoPorNome:usuarios[3].nome},
    {id:gen('cr'),empresaId,origem:'contrato',clienteId:clientes[1].id,descricao:'Mensalidade CT-2024-0188 - Ref 07/2026',valor:1250,vencimento:new Date(Date.now()-1000*60*60*24*2).toISOString(),pagamentoData:null,status:'vencido',contratoId:contratos[1].id,leituraId:null,vendaId:null,criadoPor:usuarios[3].id,criadoPorNome:usuarios[3].nome},
    {id:gen('cr'),empresaId,origem:'venda',clienteId:clientes[3].id,descricao:'Venda VD-2026-0081 - Toners',valor:627,vencimento:new Date(Date.now()+1000*60*60*24*12).toISOString(),pagamentoData:null,status:'aberto',contratoId:null,leituraId:null,vendaId:vendas[0].id,criadoPor:usuarios[2].id,criadoPorNome:usuarios[2].nome},
  ];
  const cp=[
    {id:gen('cp'),empresaId,fornecedor:'Brother do Brasil - Distribuidor',descricao:'Compra 10x Toner TN-3442',categoria:'Suprimentos',valor:890,vencimento:new Date(Date.now()+1000*60*60*24*7).toISOString(),pagamentoData:null,status:'aberto',criadoPor:usuarios[0].id,criadoPorNome:usuarios[0].nome},
    {id:gen('cp'),empresaId,fornecedor:'Galpão Logístico Cajamar',descricao:'Aluguel galpão estoque',categoria:'Infraestrutura',valor:3500,vencimento:new Date(Date.now()-1000*60*60*24*1).toISOString(),pagamentoData:new Date().toISOString(),status:'pago',criadoPor:usuarios[0].id,criadoPorNome:usuarios[0].nome},
  ];
  const logs=[
    {id:gen('log'),dataHora:new Date().toISOString(),empresaId,usuarioId:usuarios[0].id,usuarioNome:usuarios[0].nome,usuarioLogin:usuarios[0].login,entidade:'sistema',acao:'seed',entidadeId:'-',detalhes:'Dados iniciais carregados'}
  ];
  db={...defaultData,empresas,usuarios,clientes,produtos,equipamentos:equips,contratos,parque,leituras,os,vendas,contasReceber:cr,contasPagar:cp,tecnicos:defaultData.tecnicos,config:defaultData.config,logs};
  saveDB(); toast('Dados demo CNPJ 12.345.678/0001-90 carregados','success');
}
if(db.empresas.length===0) seedData(false);

// LOGIN LOGIC
function togglePass(id){
  const el=document.getElementById(id); if(!el) return; el.type=el.type==='password'?'text':'password';
}
function doLoginCNPJ(){
  const cnpjInput=document.getElementById('login-cnpj').value.trim();
  const senha=document.getElementById('login-senha-cnpj').value.trim();
  if(!cnpjInput || !senha){toast('Informe CNPJ e senha CNPJ','error'); return;}
  const digits=onlyDigits(cnpjInput);
  const emp=db.empresas.find(e=>onlyDigits(e.cnpj)===digits && e.senha===senha);
  if(!emp){toast('CNPJ ou senha CNPJ inválidos','error'); return;}
  setPendingEmpresa(emp);
  document.getElementById('login-step-cnpj').classList.add('hidden');
  document.getElementById('login-step-user').classList.remove('hidden');
  document.getElementById('login-empresa-nome').innerText=emp.fantasia||emp.nome;
  document.getElementById('login-empresa-cnpj').innerText=emp.cnpj;
  document.getElementById('login-empresa-iniciais').innerText=initials(emp.fantasia||emp.nome);
  toast('Empresa validada: '+emp.fantasia,'success');
  // prefill usuarios demo list
  const users=db.usuarios.filter(u=>u.empresaId===emp.id && u.ativo);
  if(users.length) document.getElementById('login-user').value=users[0].login;
}
function backToCNPJ(){
  localStorage.removeItem(PENDING_CNPJ_KEY);
  document.getElementById('login-step-user').classList.add('hidden');
  document.getElementById('login-step-cnpj').classList.remove('hidden');
}
function doLoginUser(){
  const pending=getPendingEmpresa(); if(!pending){toast('Valide o CNPJ primeiro','error'); backToCNPJ(); return;}
  const login=document.getElementById('login-user').value.trim().toLowerCase();
  const senha=document.getElementById('login-senha-user').value.trim();
  if(!login || !senha){toast('Informe usuário e senha','error'); return;}
  const user=db.usuarios.find(u=>u.empresaId===pending.id && u.login.toLowerCase()===login && u.senha===senha && u.ativo);
  if(!user){toast('Usuário ou senha inválidos para este CNPJ','error'); return;}
  const session={empresaId:pending.id, empresaNome:pending.fantasia||pending.nome, cnpj:pending.cnpj, cnpjDigits:onlyDigits(pending.cnpj), usuarioId:user.id, usuarioNome:user.nome, login:user.login, perfil:user.perfil, loginAt:new Date().toISOString()};
  setSession(session);
  // log
  db.logs.unshift({id:uid('log'),dataHora:new Date().toISOString(),empresaId:pending.id,usuarioId:user.id,usuarioNome:user.nome,usuarioLogin:user.login,entidade:'auth',acao:'login',entidadeId:user.id,detalhes:`Login usuário ${user.login} perfil ${user.perfil}`});
  saveDB();
  showApp();
  toast('Bem-vindo, '+user.nome+'!','success');
}
function showApp(){
  const sess=getSession(); if(!sess) {showLogin(); return;}
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  document.getElementById('user-name').innerText=sess.usuarioNome;
  document.getElementById('user-perfil').innerText=sess.perfil;
  document.getElementById('user-empresa').innerText=sess.empresaNome;
  document.getElementById('user-avatar').innerText=initials(sess.usuarioNome);
  document.getElementById('session-cnpj').innerText=sess.cnpj;
  document.getElementById('footer-session').innerText=sess.empresaNome+' • '+sess.usuarioNome+' ('+sess.perfil+')';
  document.getElementById('audit-user').innerText=sess.usuarioNome;
  // timer session
  setInterval(()=>{const el=document.getElementById('session-time'); if(el){const diff=Math.floor((Date.now()-new Date(sess.loginAt))/(1000*60)); el.innerText=diff+'m online'}},60000);
  // init app
  if(typeof initTemplates==='function') initTemplates();
  if(typeof buildNav==='function') buildNav();
  if(typeof renderDashboard==='function') renderDashboard();
  // load others
  setTimeout(()=>{renderClientes(); renderProdutos(); renderEquipamentos(); renderContratos(); renderParque(); renderLeituras(); renderOs(); renderVendas(); renderFinanceiro(); renderConfig(); if(typeof renderUsuarios==='function') renderUsuarios(); if(typeof renderAuditoria==='function') renderAuditoria();},100);
}
function showLogin(){
  document.getElementById('app-shell').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  const pending=getPendingEmpresa();
  if(pending){
    document.getElementById('login-step-cnpj').classList.add('hidden');
    document.getElementById('login-step-user').classList.remove('hidden');
    document.getElementById('login-empresa-nome').innerText=pending.fantasia||pending.nome;
    document.getElementById('login-empresa-cnpj').innerText=pending.cnpj;
  } else {
    document.getElementById('login-step-cnpj').classList.remove('hidden');
    document.getElementById('login-step-user').classList.add('hidden');
  }
}
function doLogout(){
  if(confirm('Sair do sistema?')){
    const sess=getSession();
    if(sess){db.logs.unshift({id:uid('log'),dataHora:new Date().toISOString(),empresaId:sess.empresaId,usuarioId:sess.usuarioId,usuarioNome:sess.usuarioNome,usuarioLogin:sess.login,entidade:'auth',acao:'logout',entidadeId:sess.usuarioId,detalhes:'Logout'}); saveDB();}
    clearSession(); localStorage.removeItem(PENDING_CNPJ_KEY);
    showLogin(); toast('Sessão encerrada','info');
  }
}
function openModalEmpresa(){
  document.getElementById('modal-root').classList.remove('hidden');
  document.getElementById('modal-title').innerText='Cadastrar nova empresa (CNPJ)';
  document.getElementById('modal-body').innerHTML=`<div class="space-y-4"><div><label class="text-[11px] font-bold uppercase text-slate-500">Razão social</label><input id="ne-razao" placeholder="Empresa LTDA" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Nome fantasia</label><input id="ne-fantasia" placeholder="DIGICOPY" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div class="grid grid-cols-2 gap-3"><div><label class="text-[11px] font-bold uppercase text-slate-500">CNPJ</label><input id="ne-cnpj" placeholder="00.000.000/0000-00" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Senha CNPJ (acesso empresa)</label><input id="ne-senha" type="password" placeholder="Crie senha CNPJ" class="mt-1 w-full h-11 px-3 rounded-xl border"></div></div><div class="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[12px] text-amber-900"><b>Atenção:</b> Esta senha CNPJ será solicitada sempre que for criar um novo usuário. Guarde com segurança.</div></div>`;
  document.getElementById('modal-footer').innerHTML=`<button onclick="closeModal()" class="h-11 px-5 rounded-xl bg-white border">Cancelar</button><button onclick="saveNovaEmpresa()" class="h-11 px-6 rounded-xl bg-[#0a1e8a] text-white font-semibold">Cadastrar empresa</button>`;
}
function saveNovaEmpresa(){
  const razao=document.getElementById('ne-razao').value.trim(); const fantasia=document.getElementById('ne-fantasia').value.trim()||razao; const cnpj=document.getElementById('ne-cnpj').value.trim(); const senha=document.getElementById('ne-senha').value.trim();
  if(!razao||!cnpj||!senha) return toast('Preencha todos','error');
  if(db.empresas.find(e=>onlyDigits(e.cnpj)===onlyDigits(cnpj))) return toast('CNPJ já cadastrado','error');
  const emp={id:uid('emp'),cnpj, cnpjDigits:onlyDigits(cnpj), senha, nome:razao, fantasia, criadoEm:new Date().toISOString()};
  db.empresas.push(emp);
  // cria admin padrão dessa empresa
  db.usuarios.push({id:uid('usr'),empresaId:emp.id, nome:'Admin '+fantasia, login:'admin', senha:'admin123', perfil:'Admin', ativo:true, criadoEm:new Date().toISOString(), criadoPor:'sistema'});
  saveDB(); closeModal(); toast('Empresa cadastrada! Use CNPJ e senha CNPJ para entrar, depois admin/admin123','success');
  document.getElementById('login-cnpj').value=cnpj; document.getElementById('login-senha-cnpj').value=senha;
}
function openModalCriarUsuarioPublic(){
  const pending=getPendingEmpresa(); if(!pending) return toast('Valide CNPJ primeiro','error');
  openModalCriarUsuario(pending.id);
}
function listUsuariosDemo(){
  const pending=getPendingEmpresa(); if(!pending) return toast('Valide CNPJ primeiro','error');
  const users=db.usuarios.filter(u=>u.empresaId===pending.id);
  alert('Usuários deste CNPJ:\n\n'+users.map(u=>`${u.login} / ${u.senha} - ${u.nome} (${u.perfil})`).join('\n'));
}
function closeModal(){document.getElementById('modal-root').classList.add('hidden')}
// NAV + TEMPLATES v3 (dark blue, no photos, audit)

function navigateTo(view){
  if(view==='banco'){
    const bancoView=ensureView('banco');
    document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
    bancoView.classList.remove('hidden');
    document.querySelectorAll('[data-nav]').forEach(b=>{b.classList.remove('bg-white/[0.12]','text-white','border','border-white/10'); b.classList.add('text-white/60')});
    const act=document.querySelector('[data-nav="banco"]'); if(act){act.classList.add('bg-white/[0.12]','text-white','border','border-white/10'); act.classList.remove('text-white/60')}
    document.getElementById('page-title').innerText='Banco antigo Firebird';
    document.getElementById('page-subtitle').innerText='Plano de migração do .RAR atualizado para nuvem';
    renderBanco(); setTimeout(function(){ const el = document.getElementById("view-banco"); if(el){ el.style.display="block"; el.style.visibility="visible"; } }, 50); window.scrollTo({top:0,behavior:'smooth'}); if(window.innerWidth<1024) toggleSidebar(true); return;
  }
  document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
  const target=document.getElementById('view-'+view);
  if(target) target.classList.remove('hidden');
  document.querySelectorAll('[data-nav]').forEach(b=>{b.classList.remove('bg-white/[0.12]','text-white','border','border-white/10'); b.classList.add('text-white/60')});
  const act=document.querySelector(`[data-nav="${view}"]`); if(act){act.classList.add('bg-white/[0.12]','text-white','border','border-white/10'); act.classList.remove('text-white/60')}
  const titles={dashboard:['Início','Escolha uma ação rápida e siga o passo a passo'],clientes:['Clientes','Cadastro simples de pessoas e empresas'],produtos:['Estoque','Produtos, cartuchos, peças e serviços'],impressoras:['Impressoras','Patrimônio e máquinas disponíveis'],contratos:['Contratos de locação','Franquias, vigências e mensalidades'],parque:['Máquinas nos clientes','Onde cada impressora está instalada'],leituras:['Leituras','Lançar contadores e gerar cobrança'],manutencao:['Chamados','Atendimento técnico sem complicação'],vendas:['Vender / Orçar','Venda rápida, orçamento e notinha'],financeiro:['Financeiro','Contas a receber, pagar e fluxo'],relatorios:['Relatórios','Resumo para conferência'],config:['Configurações','Empresa, técnicos e ajustes'],usuarios:['Usuários','Quem pode acessar o sistema'],auditoria:['Auditoria','Registro automático do que foi feito']};
  const t=titles[view]||[view,'']; document.getElementById('page-title').innerText=t[0]; document.getElementById('page-subtitle').innerText=t[1];
  if(view==='dashboard') renderDashboard();
  if(view==='clientes') renderClientes();
  if(view==='produtos') renderProdutos();
  if(view==='impressoras') renderEquipamentos();
  if(view==='contratos') renderContratos();
  if(view==='parque') renderParque();
  if(view==='leituras') renderLeituras();
  if(view==='manutencao') renderOs();
  if(view==='vendas') renderVendas();
  if(view==='financeiro'){renderFinanceiro(); if(document.getElementById('fluxoChart')) renderFluxoChart();}
  if(view==='relatorios') renderRelatorios();
  if(view==='config') renderConfig();
  if(view==='usuarios') renderUsuarios();
  if(view==='auditoria') renderAuditoria();
  // Módulos dinâmicos (tabelas migradas sem mapeamento direto)
  if(view.startsWith('mod_')){
    const nomeTabela = view.substring(4).toUpperCase();
    renderModuloDinamico(nomeTabela);
  }
  window.scrollTo({top:0,behavior:'smooth'});
  if(window.innerWidth<1024) toggleSidebar(true);
}
function toggleSidebar(forceClose=false){
  const sb=document.getElementById('sidebar'); const ov=document.getElementById('overlay');
  const isClosed=sb.classList.contains('-translate-x-full');
  if(forceClose===true||!isClosed){sb.classList.add('-translate-x-full'); ov.classList.add('hidden');}
  else{sb.classList.remove('-translate-x-full'); ov.classList.remove('hidden');}
}
function buildNav(){
  const sess=getSession();
  const main=[{id:'dashboard',icon:'ph-house',label:'Início'},{id:'vendas',icon:'ph-shopping-cart-simple',label:'Vender / Orçar'},{id:'clientes',icon:'ph-users',label:'Clientes'},{id:'produtos',icon:'ph-package',label:'Estoque'}];
  const op=[{id:'impressoras',icon:'ph-printer',label:'Cadastro de impressoras'},{id:'contratos',icon:'ph-file-text',label:'Contratos de locação'},{id:'parque',icon:'ph-map-pin',label:'Máquinas nos clientes'},{id:'leituras',icon:'ph-speedometer',label:'Leituras'},{id:'manutencao',icon:'ph-wrench',label:'Chamados'}];
  const gest=[{id:'financeiro',icon:'ph-bank',label:'Financeiro'},{id:'relatorios',icon:'ph-chart-line',label:'Relatórios'},{id:'usuarios',icon:'ph-users-three',label:'Usuários'},{id:'auditoria',icon:'ph-clipboard-text',label:'Auditoria'},{id:'config',icon:'ph-gear',label:'Configurações'}];
  
  // Adicionar módulos dinâmicos (tabelas importadas sem mapeamento)
  const dinamicos = [];
  if(db.modulosDinamicos && typeof db.modulosDinamicos === 'object'){
    Object.keys(db.modulosDinamicos).forEach(nome => {
      const modulo = db.modulosDinamicos[nome];
      if(modulo && Array.isArray(modulo.dados) && modulo.dados.length > 0){
        dinamicos.push({
          id: 'mod_'+nome.toLowerCase().replace(/[^a-z0-9]/g,'_'),
          icon: modulo.icone || 'ph-table',
          label: modulo.label || formatarNomeTabela(nome),
          count: modulo.dados.length
        });
      }
    });
  }
  
  function rg(list,target){
    const cont=document.getElementById(target);
    cont.innerHTML=list.map(item=>`<button data-nav="${item.id}" onclick="navigateTo('${item.id}')" class="w-full h-10 px-3 rounded-xl flex items-center gap-3 text-[13.5px] font-medium transition text-white/60 hover:bg-white/[0.08] hover:text-white ${item.id==='dashboard'?'bg-white/[0.12] text-white border border-white/10':''}"><i class="ph ${item.icon} text-[19px]"></i><span>${item.label}</span>${item.id==='manutencao'?`<span class="ml-auto text-[11px] bg-amber-400 text-amber-950 font-bold px-2 py-0.5 rounded-full">${(db.os.filter(o=>o.empresaId===(sess?.empresaId) && o.status!=='concluido').length)}</span>`:''}${item.id==='leituras'?`<span class="ml-auto text-[11px] bg-white text-[#0a1e8a] font-bold px-2 py-0.5 rounded-full">${(db.leituras.filter(l=>l.empresaId===(sess?.empresaId) && l.status==='pendente').length)}</span>`:''}</button>`).join('');
  }
  rg(main,'nav-main'); rg(op,'nav-op'); rg(gest,'nav-gest');
  
  // Renderizar seção de módulos dinâmicos se houver
  let navDinamico = document.getElementById('nav-dinamico');
  let navDinamicoLabel = document.getElementById('nav-dinamico-label');
  if(dinamicos.length > 0){
    if(!navDinamicoLabel){
      navDinamicoLabel = document.createElement('p');
      navDinamicoLabel.id = 'nav-dinamico-label';
      navDinamicoLabel.className = 'px-3 mb-2 text-[10.5px] font-bold tracking-widest text-white/30 uppercase';
      navDinamicoLabel.textContent = 'Módulos migrados';
      const navContainer = document.querySelector('nav');
      const adminDiv = navContainer.querySelector('div:last-of-type');
      navContainer.insertBefore(navDinamicoLabel, adminDiv);
    }
    if(!navDinamico){
      navDinamico = document.createElement('div');
      navDinamico.id = 'nav-dinamico';
      navDinamico.className = 'space-y-1';
      navDinamicoLabel.insertAdjacentElement('afterend', navDinamico);
    }
    navDinamico.innerHTML = dinamicos.map(item=>`<button data-nav="${item.id}" onclick="navigateTo('${item.id}')" class="w-full h-10 px-3 rounded-xl flex items-center gap-3 text-[13.5px] font-medium transition text-white/60 hover:bg-white/[0.08] hover:text-white"><i class="ph ${item.icon} text-[19px]"></i><span>${item.label}</span><span class="ml-auto text-[11px] bg-purple-400 text-purple-950 font-bold px-2 py-0.5 rounded-full">${item.count}</span></button>`).join('');
  } else if(navDinamico){
    navDinamico.remove();
    if(navDinamicoLabel) navDinamicoLabel.remove();
  }
}

function formatarNomeTabela(nome){
  // Converte NOME_TABELA para "Nome Tabela"
  return nome.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ═══════════════════════════════════════════════════════
// MÓDULOS DINÂMICOS — Telas geradas automaticamente para tabelas migradas
// ═══════════════════════════════════════════════════════
function renderModuloDinamico(nomeTabela){
  const modulo = db.modulosDinamicos[nomeTabela];
  if(!modulo){
    toast('Módulo não encontrado','error');
    return;
  }
  
  const el = ensureView('mod_'+nomeTabela.toLowerCase().replace(/[^a-z0-9]/g,'_'));
  const dados = modulo.dados || [];
  const colunas = modulo.colunas || (dados.length > 0 ? Object.keys(dados[0]) : []);
  const label = modulo.label || formatarNomeTabela(nomeTabela);
  const maxColunas = Math.min(colunas.length, 8);
  const colunasVisiveis = colunas.slice(0, maxColunas);
  
  el.innerHTML = `
    <div class="space-y-4">
      <div class="rounded-[22px] bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 shadow-xl overflow-hidden relative">
        <div class="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 blur-3xl"></div>
        <div class="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <p class="text-[11px] font-bold tracking-[0.18em] uppercase text-white/60">Módulo migrado</p>
            <h2 class="text-[24px] font-extrabold tracking-tight mt-2">${escapeHtml(label)}</h2>
            <p class="text-white/80 text-[13.5px] mt-2">Dados importados da tabela <code class="bg-white/20 px-2 py-0.5 rounded">${escapeHtml(nomeTabela)}</code> do sistema antigo.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button onclick="exportarModuloDinamico('${nomeTabela}')" class="h-10 px-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-[12.5px] flex items-center gap-2"><i class="ph ph-export"></i> Exportar</button>
            <button onclick="confirmarExcluirModulo('${nomeTabela}')" class="h-10 px-4 rounded-xl bg-red-500/20 border border-red-400/30 text-white font-semibold text-[12.5px] flex items-center gap-2"><i class="ph ph-trash"></i> Excluir módulo</button>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="rounded-xl bg-white border shadow-sm p-4"><p class="text-[11px] uppercase font-bold text-slate-500">Total de registros</p><p class="text-[24px] font-extrabold text-purple-600 mt-1">${dados.length}</p></div>
        <div class="rounded-xl bg-white border shadow-sm p-4"><p class="text-[11px] uppercase font-bold text-slate-500">Campos</p><p class="text-[24px] font-extrabold text-blue-600 mt-1">${colunas.length}</p></div>
        <div class="rounded-xl bg-white border shadow-sm p-4"><p class="text-[11px] uppercase font-bold text-slate-500">Origem</p><p class="text-[14px] font-bold text-slate-700 mt-2">${escapeHtml(modulo.origem || 'Firebird')}</p></div>
        <div class="rounded-xl bg-white border shadow-sm p-4"><p class="text-[11px] uppercase font-bold text-slate-500">Importado em</p><p class="text-[14px] font-bold text-slate-700 mt-2">${modulo.importadoEm ? fmtDateTime(modulo.importadoEm) : '-'}</p></div>
      </div>
      <div class="rounded-[18px] bg-white border shadow-sm p-4">
        <div class="flex flex-wrap gap-3 items-center">
          <div class="flex-1 min-w-[250px]"><input id="search-mod-${nomeTabela}" type="text" placeholder="Buscar em todos os campos..." class="w-full h-10 px-4 rounded-xl border border-slate-300 text-[13px]" oninput="filtrarModuloDinamico('${nomeTabela}')"></div>
          <select id="coluna-mod-${nomeTabela}" class="h-10 px-3 rounded-xl border border-slate-300 text-[13px]" onchange="filtrarModuloDinamico('${nomeTabela}')"><option value="">Todas as colunas</option>${colunas.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}</select>
        </div>
      </div>
      <div class="rounded-[18px] bg-white border shadow-sm overflow-hidden">
        <div class="p-4 border-b bg-slate-50 flex items-center justify-between"><h3 class="font-bold text-[15px]">Registros</h3><p class="text-[12px] text-slate-500" id="mod-count-${nomeTabela}">${dados.length} registros</p></div>
        <div class="overflow-x-auto">
          <table class="w-full text-[12px]">
            <thead class="bg-slate-100 border-b"><tr><th class="px-4 py-3 text-left font-bold text-slate-700">#</th>${colunasVisiveis.map(c=>`<th class="px-4 py-3 text-left font-bold text-slate-700">${escapeHtml(c)}</th>`).join('')}${colunas.length > maxColunas ? `<th class="px-4 py-3 text-left font-bold text-slate-400">+${colunas.length-maxColunas}</th>` : ''}<th class="px-4 py-3 text-center font-bold text-slate-700">Ações</th></tr></thead>
            <tbody id="mod-tbody-${nomeTabela}" class="divide-y divide-slate-100">
              ${dados.slice(0,50).map((row,idx)=>`<tr class="hover:bg-slate-50 transition"><td class="px-4 py-3 text-slate-500">${idx+1}</td>${colunasVisiveis.map(c=>`<td class="px-4 py-3 text-slate-700">${escapeHtml(String(row[c]||'').substring(0,50))}</td>`).join('')}${colunas.length > maxColunas ? '<td class="px-4 py-3 text-slate-400">...</td>' : ''}<td class="px-4 py-3 text-center"><button onclick="visualizarRegistroDinamico('${nomeTabela}',${idx})" class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100" title="Visualizar"><i class="ph ph-eye"></i></button></td></tr>`).join('')}
            </tbody>
          </table>
        </div>
        ${dados.length > 50 ? `<div class="p-4 border-t bg-slate-50 text-center text-[12px] text-slate-500">Mostrando 50 de ${dados.length} registros.</div>` : ''}
      </div>
    </div>`;
}

function filtrarModuloDinamico(nomeTabela){
  const modulo = db.modulosDinamicos[nomeTabela];
  if(!modulo) return;
  const busca = (document.getElementById('search-mod-'+nomeTabela)?.value || '').toLowerCase();
  const coluna = document.getElementById('coluna-mod-'+nomeTabela)?.value || '';
  const dados = modulo.dados || [];
  const colunas = modulo.colunas || (dados.length > 0 ? Object.keys(dados[0]) : []);
  const maxColunas = Math.min(colunas.length, 8);
  const colunasVisiveis = colunas.slice(0, maxColunas);
  const filtrados = dados.filter(row => {
    if(!busca) return true;
    if(coluna) return String(row[coluna] || '').toLowerCase().includes(busca);
    return colunas.some(c => String(row[c] || '').toLowerCase().includes(busca));
  });
  document.getElementById('mod-tbody-'+nomeTabela).innerHTML = filtrados.slice(0,50).map((row,idx)=>`<tr class="hover:bg-slate-50 transition"><td class="px-4 py-3 text-slate-500">${idx+1}</td>${colunasVisiveis.map(c=>`<td class="px-4 py-3 text-slate-700">${escapeHtml(String(row[c]||'').substring(0,50))}</td>`).join('')}${colunas.length > maxColunas ? '<td class="px-4 py-3 text-slate-400">...</td>' : ''}<td class="px-4 py-3 text-center"><button onclick="visualizarRegistroDinamico('${nomeTabela}',${dados.indexOf(row)})" class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"><i class="ph ph-eye"></i></button></td></tr>`).join('');
  document.getElementById('mod-count-'+nomeTabela).textContent = filtrados.length + ' registros';
}

function visualizarRegistroDinamico(nomeTabela, idx){
  const modulo = db.modulosDinamicos[nomeTabela];
  if(!modulo || !modulo.dados[idx]) return;
  const row = modulo.dados[idx];
  const label = modulo.label || formatarNomeTabela(nomeTabela);
  const modal = document.getElementById('modal-root');
  modal.innerHTML = `<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick="if(event.target===this) closeModal()"><div class="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"><div class="p-6 border-b bg-gradient-to-r from-purple-600 to-purple-800 text-white"><h3 class="text-[18px] font-bold">${escapeHtml(label)} - Registro #${idx+1}</h3><p class="text-[12px] text-white/70 mt-1">Tabela: ${escapeHtml(nomeTabela)}</p></div><div class="flex-1 overflow-y-auto p-6"><div class="space-y-3">${Object.entries(row).map(([key,value])=>`<div class="border-b pb-3"><p class="text-[11px] font-bold text-slate-500 uppercase mb-1">${escapeHtml(key)}</p><p class="text-[14px] text-slate-800">${value ? escapeHtml(String(value)) : '<span class="text-slate-400 italic">vazio</span>'}</p></div>`).join('')}</div></div><div class="p-4 border-t bg-slate-50 flex justify-end gap-2"><button onclick="closeModal()" class="h-10 px-5 rounded-xl bg-slate-200 text-slate-700 font-semibold text-[13px]">Fechar</button></div></div></div>`;
  modal.classList.remove('hidden');
}

function exportarModuloDinamico(nomeTabela){
  const modulo = db.modulosDinamicos[nomeTabela];
  if(!modulo) return;
  const dataStr = JSON.stringify({tabela:nomeTabela, exportadoEm:new Date().toISOString(), totalRegistros:modulo.dados.length, dados:modulo.dados}, null, 2);
  const blob = new Blob([dataStr], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeTabela+'_'+new Date().toISOString().slice(0,10)+'.json';
  a.click();
  toast('Módulo exportado com sucesso','success');
}

function confirmarExcluirModulo(nomeTabela){
  const modulo = db.modulosDinamicos[nomeTabela];
  if(!modulo) return;
  const label = modulo.label || formatarNomeTabela(nomeTabela);
  if(confirm('Tem certeza que deseja excluir o módulo "'+label+'"?\\n\\nIsso removerá '+modulo.dados.length+' registros permanentemente.')){
    delete db.modulosDinamicos[nomeTabela];
    saveDB();
    buildNav();
    navigateTo('dashboard');
    toast('Módulo excluído com sucesso','success');
  }
}

function sugerirIcone(nomeTabela){
  const n = nomeTabela.toUpperCase();
  if(n.includes('FORNECEDOR')) return 'ph-truck';
  if(n.includes('FUNCIONAR') || n.includes('EMPREGADO')) return 'ph-identification-badge';
  if(n.includes('ORCAMENTO') || n.includes('ORÇAMENTO')) return 'ph-file-text';
  if(n.includes('RECIBO')) return 'ph-receipt';
  if(n.includes('CATEGORIA')) return 'ph-tag';
  if(n.includes('FABRICANTE') || n.includes('MARCA')) return 'ph-factory';
  if(n.includes('UNIDADE') || n.includes('MEDIDA')) return 'ph-ruler';
  if(n.includes('CONFIGURACAO') || n.includes('CONFIG')) return 'ph-gear';
  if(n.includes('EMPRESA')) return 'ph-buildings';
  if(n.includes('LOCACAO') || n.includes('LOCAÇÃO') || n.includes('CONTRATO')) return 'ph-file-text';
  if(n.includes('LEITURA')) return 'ph-speedometer';
  if(n.includes('ITEM')) return 'ph-list-bullets';
  if(n.includes('HISTORICO') || n.includes('LOG')) return 'ph-clock-counter-clockwise';
  if(n.includes('ORDEM') || n.includes('SERVICO') || n.includes('SERVIÇO')) return 'ph-wrench';
  if(n.includes('NOTA') || n.includes('FISCAL')) return 'ph-file-text';
  if(n.includes('CAIXA') || n.includes('BANCO')) return 'ph-bank';
  if(n.includes('AGENDA') || n.includes('CALEND')) return 'ph-calendar';
  if(n.includes('MENSAG') || n.includes('EMAIL')) return 'ph-envelope';
  if(n.includes('RELATORIO') || n.includes('RELATÓRIO')) return 'ph-chart-line';
  return 'ph-table';
}

function initTemplates(){
  document.getElementById('view-dashboard').innerHTML=`
  <div class="clean-home">
    <div class="clean-logo"><img src="./logo.png" alt="DIGICOPY"><h1>DIGICOPY Gestão</h1><p>Vendas • locação • leituras • chamados • financeiro</p></div>
    <div class="clean-shortcuts">
      <button onclick="if(typeof novaVenda==='function') novaVenda(); else navigateTo('vendas')">Nova venda</button>
      <button onclick="navigateTo('vendas')">Consultar notinhas</button>
      <button onclick="navigateTo('clientes')">Clientes</button>
      <button onclick="navigateTo('contratos')">Locação</button>
      <button onclick="openQuickOS()">Chamado</button>
      <button onclick="navigateTo('financeiro')">Financeiro</button>
    </div>
  </div>
  <div class="statusbar"><span>Banco Servidor Nuvem</span><span>Usuário&nbsp;&nbsp;<b id="status-user-home">-</b></span><span>Código Sistema: 1421</span><span>DIGICOPY | Sistema em desenvolvimento</span></div>
  <div class="hidden">
    <span id="kpi-contratos">0</span><span id="kpi-parque">0</span><span id="kpi-os">0</span><span id="kpi-disponiveis">0</span><span id="kpi-faturamento">R$ 0,00</span><span id="alert-vencendo">0</span><span id="kpi-auditoria">0 hoje</span>
    <canvas id="chartFinance"></canvas><canvas id="chartParque"></canvas><div id="parque-legend"></div><div id="list-leituras-pendentes"></div><div id="list-chamados-recentes"></div><div id="list-alertas"></div>
  </div>`;

  document.getElementById('view-clientes').innerHTML=`<div class="flex flex-wrap items-center gap-3 justify-between"><div class="flex gap-2"><button onclick="openModal('cliente')" class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white text-[13.5px] font-semibold shadow"><i class="ph ph-plus mr-1.5"></i>Novo cliente</button><button onclick="exportClientes()" class="h-10 px-4 rounded-xl bg-white border text-[13px]">Exportar</button></div><div class="flex gap-2"><select id="filter-clientes-status" onchange="renderClientes()" class="h-10 px-3 rounded-xl bg-white border text-[13px]"><option value="">Todos status</option><option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="inadimplente">Inadimplente</option></select><div class="relative"><i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i><input id="search-clientes" oninput="renderClientes()" placeholder="Buscar..." class="h-10 pl-9 pr-4 rounded-xl bg-white border text-[13.5px] w-[260px]"></div></div></div><div class="rounded-[16px] bg-white border shadow-sm overflow-hidden"><div class="overflow-auto"><table class="w-full text-left text-[13px]"><thead class="bg-slate-50 border-b text-[11px] tracking-widest uppercase font-bold text-slate-500"><tr><th class="px-5 py-3">Cliente / Quem criou</th><th class="px-5 py-3">Documento</th><th class="px-5 py-3">Contato</th><th class="px-5 py-3">Contratos</th><th class="px-5 py-3">Status</th><th class="px-5 py-3"></th></tr></thead><tbody id="tbody-clientes" class="divide-y divide-slate-50"></tbody></table></div><div id="pagination-clientes" class="p-3 border-t flex items-center justify-between text-[12px] text-slate-500"></div></div>`;

  document.getElementById('view-produtos').innerHTML=`<div class="flex flex-wrap gap-3 justify-between"><div class="flex gap-2"><button onclick="openModal('produto')" class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white text-[13.5px] font-semibold shadow">+ Novo produto</button><button onclick="openModal('entradaEstoque')" class="h-10 px-4 rounded-xl bg-slate-900 text-white text-[13px]">Entrada estoque</button></div><div class="flex gap-2"><select id="filter-prod-cat" onchange="renderProdutos()" class="h-10 px-3 rounded-xl bg-white border text-[13px]"><option value="">Todas categorias</option><option value="Suprimento">Suprimento</option><option value="Peça">Peça</option><option value="Impressora">Impressora</option><option value="Serviço">Serviço</option></select><input id="search-produtos" oninput="renderProdutos()" placeholder="Buscar SKU, nome..." class="h-10 px-4 rounded-xl bg-white border text-[13.5px] w-[260px]"></div></div><div class="grid grid-cols-1 md:grid-cols-4 gap-4" id="cards-estoque"></div><div class="rounded-[16px] bg-white border shadow-sm overflow-hidden"><div class="overflow-auto max-h-[680px]"><table class="w-full text-left text-[13px]"><thead class="sticky top-0 bg-slate-50 border-b text-[11px] uppercase font-bold text-slate-500"><tr><th class="px-5 py-3">SKU / Produto / Criado por</th><th class="px-5 py-3">Categoria</th><th class="px-5 py-3">Estoque</th><th class="px-5 py-3">Custo / Venda</th><th class="px-5 py-3">Local</th><th class="px-5 py-3"></th></tr></thead><tbody id="tbody-produtos" class="divide-y"></tbody></table></div></div>`;

  document.getElementById('view-impressoras').innerHTML=`<div class="flex flex-wrap justify-between gap-3"><div class="flex gap-2"><button onclick="openModal('equipamento')" class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white text-[13.5px] font-semibold shadow">+ Nova impressora</button><div class="flex rounded-xl overflow-hidden border bg-white p-1"><button id="btn-view-grid" onclick="setEquipView('grid')" class="px-3 h-8 rounded-lg bg-slate-900 text-white text-[12px]">Grade</button><button id="btn-view-list" onclick="setEquipView('list')" class="px-3 h-8 rounded-lg text-slate-600 text-[12px]">Lista</button></div></div><div class="flex gap-2"><select id="filter-equip-status" onchange="renderEquipamentos()" class="h-10 px-3 rounded-xl bg-white border text-[13px]"><option value="">Todos status</option><option value="disponivel">Disponível</option><option value="locado">Locado</option><option value="manutencao">Manutenção</option><option value="inativo">Inativo</option></select><input id="search-equip" oninput="renderEquipamentos()" placeholder="Patrimônio, série, modelo..." class="h-10 px-4 rounded-xl bg-white border text-[13px] w-[280px]"></div></div><div id="grid-equipamentos" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"></div><div id="list-equipamentos" class="hidden rounded-[16px] bg-white border shadow-sm overflow-hidden"><table class="w-full text-left text-[13px]"><thead class="bg-slate-50 border-b text-[11px] uppercase font-bold text-slate-500"><tr><th class="px-5 py-3">Equipamento / Criado por</th><th class="px-5 py-3">Patrimônio / Série</th><th class="px-5 py-3">Contadores</th><th class="px-5 py-3">Local / Cliente</th><th class="px-5 py-3">Status</th><th></th></tr></thead><tbody id="tbody-equip" class="divide-y"></tbody></table></div>`;

  document.getElementById('view-contratos').innerHTML=`<div class="flex flex-wrap justify-between gap-3"><button onclick="openModal('contrato')" class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white text-[13.5px] font-semibold shadow">+ Novo contrato</button><div class="flex gap-2"><select id="filter-contrato-status" onchange="renderContratos()" class="h-10 px-3 rounded-xl bg-white border text-[13px]"><option value="">Todos status</option><option value="ativo">Ativo</option><option value="pendente">Pendente</option><option value="vencido">Vencido</option><option value="encerrado">Encerrado</option></select><input id="search-contratos" oninput="renderContratos()" placeholder="Número, cliente..." class="h-10 px-4 rounded-xl bg-white border text-[13px] w-[280px]"></div></div><div class="grid grid-cols-1 lg:grid-cols-12 gap-4"><div class="lg:col-span-8 rounded-[16px] bg-white border shadow-sm overflow-hidden"><table class="w-full text-left text-[13px]"><thead class="bg-slate-50 border-b text-[11px] uppercase font-bold text-slate-500"><tr><th class="px-5 py-3">Contrato / Cliente / Criado por</th><th class="px-5 py-3">Vigência</th><th class="px-5 py-3">Franquia</th><th class="px-5 py-3">Valor</th><th class="px-5 py-3">Status</th><th></th></tr></thead><tbody id="tbody-contratos" class="divide-y"></tbody></table></div><div class="lg:col-span-4 space-y-4"><div class="rounded-[16px] bg-[#0a1e8a] p-5 text-white"><h4 class="font-semibold text-[14px]">Resumo financeiro contratos</h4><div class="mt-4 space-y-3 text-[13px]" id="resumo-contratos"></div></div><div class="rounded-[16px] bg-white border p-5"><h4 class="font-bold text-[13.5px] mb-4">Próximos vencimentos</h4><div id="list-contratos-vencendo" class="space-y-3"></div></div></div></div><div id="contrato-detail" class="hidden mt-4 rounded-[20px] bg-white border shadow-sm p-0 overflow-hidden"></div>`;

  document.getElementById('view-parque').innerHTML=`<div class="flex justify-between gap-3 flex-wrap"><h3 class="font-bold text-[16px]">Parque instalado por cliente</h3><div class="flex gap-2"><select id="filter-parque-cliente" onchange="renderParque()" class="h-10 px-3 rounded-xl bg-white border text-[13px]"><option value="">Todos clientes</option></select><input id="search-parque" oninput="renderParque()" placeholder="Setor, patrimônio..." class="h-10 px-4 rounded-xl bg-white border text-[13px] w-[260px]"></div></div><div id="grid-parque" class="grid grid-cols-1 lg:grid-cols-2 gap-4"></div>`;

  document.getElementById('view-leituras').innerHTML=`<div class="grid grid-cols-1 lg:grid-cols-12 gap-4"><div class="lg:col-span-8 space-y-4"><div class="flex gap-2 flex-wrap"><button onclick="openModal('leitura')" class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white text-[13px] font-semibold">+ Lançar leitura</button><button onclick="simularLeiturasLote()" class="h-10 px-4 rounded-xl bg-white border text-[13px]">Simular coleta automática</button><button onclick="gerarFaturasPendentes()" class="h-10 px-4 rounded-xl bg-slate-900 text-white text-[13px]">Gerar faturas pendentes</button></div><div class="rounded-[16px] bg-white border shadow-sm overflow-hidden"><div class="overflow-auto max-h-[720px]"><table class="w-full text-left text-[13px]"><thead class="sticky top-0 bg-slate-50 border-b text-[11px] uppercase font-bold text-slate-500"><tr><th class="px-4 py-3">Data / Equip / Cliente / Por</th><th class="px-4 py-3">Contadores</th><th class="px-4 py-3">Consumo</th><th class="px-4 py-3">Franquia vs Exced.</th><th class="px-4 py-3">Valor extra</th><th class="px-4 py-3">Status</th><th></th></tr></thead><tbody id="tbody-leituras" class="divide-y"></tbody></table></div></div></div><div class="lg:col-span-4 space-y-4"><div class="rounded-[16px] bg-white border p-5"><h4 class="font-bold text-[13.5px]">Coleta rápida por contrato</h4><div class="mt-4 space-y-3"><select id="coleta-contrato" onchange="loadColetaForm()" class="w-full h-11 px-3 rounded-xl bg-slate-50 border text-[13.5px]"><option value="">Selecione o contrato</option></select><div id="coleta-form" class="space-y-3"></div></div></div><div class="rounded-[16px] bg-amber-50 border border-amber-200 p-5"><h4 class="font-bold text-[13px] text-amber-900">Divergências</h4><div id="list-divergencias" class="mt-3 space-y-2 text-[12.5px]"></div></div></div></div>`;

  document.getElementById('view-manutencao').innerHTML=`<div class="flex flex-wrap justify-between gap-3"><div class="flex gap-2"><button onclick="openModal('os')" class="h-11 px-6 rounded-xl bg-[#0a1e8a] text-white text-[13.5px] font-semibold shadow">+ Abrir chamado</button><button onclick="toggleOsView()" id="btn-os-kanban" class="h-11 px-4 rounded-xl bg-white border text-[13px]">Kanban</button></div><div class="flex gap-2"><select id="filter-os-status" onchange="renderOs()" class="h-11 px-3 rounded-xl bg-white border text-[13px]"><option value="">Todos status</option><option value="aberto">Aberto</option><option value="em_atendimento">Em atendimento</option><option value="aguardando_peca">Aguard. peça</option><option value="concluido">Concluído</option></select><input id="search-os" oninput="renderOs()" placeholder="Buscar OS..." class="h-11 px-4 rounded-xl bg-white border text-[13px] w-[280px]"></div></div><div id="os-kanban" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"></div><div id="os-list" class="hidden rounded-[16px] bg-white border shadow-sm overflow-hidden"><table class="w-full text-left text-[13px]"><thead class="bg-slate-50 border-b text-[11px] uppercase font-bold text-slate-500"><tr><th class="px-5 py-3">OS / Cliente / Criado por</th><th class="px-5 py-3">Tipo / Prioridade</th><th class="px-5 py-3">Técnico</th><th class="px-5 py-3">SLA</th><th class="px-5 py-3">Status</th><th></th></tr></thead><tbody id="tbody-os" class="divide-y"></tbody></table></div>`;

  document.getElementById('view-vendas').innerHTML=`<div class="grid grid-cols-1 lg:grid-cols-3 gap-4"><div class="lg:col-span-2 space-y-4"><div class="flex gap-2"><button onclick="novaVenda()" class="h-11 px-6 rounded-xl bg-[#0a1e8a] text-white font-semibold text-[13.5px]">+ Nova venda / Orçamento</button><div class="flex items-center gap-2 ml-auto"><input id="search-vendas" oninput="renderVendas()" placeholder="Cliente, número..." class="h-11 px-4 rounded-xl bg-white border text-[13px] w-[260px]"></div></div><div class="rounded-[16px] bg-white border shadow-sm overflow-hidden"><table class="w-full text-left text-[13px]"><thead class="bg-slate-50 border-b text-[11px] uppercase font-bold text-slate-500"><tr><th class="px-5 py-3">Nº / Data / Cliente / Criado por</th><th class="px-5 py-3">Itens / Total</th><th class="px-5 py-3">Pagamento</th><th class="px-5 py-3">Status</th><th></th></tr></thead><tbody id="tbody-vendas" class="divide-y"></tbody></table></div></div><div id="venda-detail" class="rounded-[20px] bg-white border shadow-sm p-6 min-h-[500px]"><div class="text-center py-20 text-slate-400"><i class="ph ph-shopping-cart text-[48px] mb-3 block opacity-30"></i><p class="text-[13px]">Selecione uma venda</p></div></div></div>`;

  document.getElementById('view-financeiro').innerHTML=`<div class="flex gap-2 overflow-auto pb-1"><button onclick="setFinTab('visao')" data-fintab="visao" class="fin-tab h-10 px-5 rounded-xl bg-[#0a1e8a] text-white text-[13px] font-semibold whitespace-nowrap">Visão geral</button><button onclick="setFinTab('receber')" data-fintab="receber" class="fin-tab h-10 px-5 rounded-xl bg-white border text-[13px] font-medium whitespace-nowrap">Contas a receber</button><button onclick="setFinTab('pagar')" data-fintab="pagar" class="fin-tab h-10 px-5 rounded-xl bg-white border text-[13px] font-medium whitespace-nowrap">Contas a pagar</button><button onclick="setFinTab('fluxo')" data-fintab="fluxo" class="fin-tab h-10 px-5 rounded-xl bg-white border text-[13px] font-medium whitespace-nowrap">Fluxo de caixa</button></div><div id="fin-visao" class="fin-panel grid grid-cols-1 xl:grid-cols-3 gap-4"><div class="xl:col-span-2 space-y-4"><div class="grid grid-cols-3 gap-3"><div class="rounded-[16px] bg-white border p-4"><p class="text-[11px] uppercase font-bold text-slate-500">A receber (mês)</p><p id="fin-receber-mes" class="text-[20px] font-bold mt-1">R$ 0</p></div><div class="rounded-[16px] bg-white border p-4"><p class="text-[11px] uppercase font-bold text-slate-500">A pagar (mês)</p><p id="fin-pagar-mes" class="text-[20px] font-bold mt-1">R$ 0</p></div><div class="rounded-[16px] bg-[#0a1e8a] text-white p-4"><p class="text-[11px] uppercase font-bold text-white/60">Saldo projetado</p><p id="fin-saldo" class="text-[20px] font-bold mt-1">R$ 0</p></div></div><div class="rounded-[16px] bg-white border p-6"><div class="flex justify-between"><h4 class="font-bold text-[14px]">Fluxo últimos 12 meses</h4></div><div class="h-[260px] mt-4"><canvas id="chartFluxo"></canvas></div></div></div><div class="space-y-4"><div class="rounded-[16px] bg-white border p-5"><h4 class="font-bold text-[13.5px] mb-3">Inadimplência</h4><div id="list-inadimplencia" class="space-y-2"></div></div><div class="rounded-[16px] bg-white border p-5"><h4 class="font-bold text-[13.5px] mb-3">Próximos vencimentos</h4><div id="list-vencimentos-fin" class="space-y-2"></div></div></div></div><div id="fin-receber" class="fin-panel hidden rounded-[16px] bg-white border shadow-sm overflow-hidden"><div class="p-4 flex justify-between border-b"><h4 class="font-bold text-[14px]">Contas a receber / Por usuário</h4><div class="flex gap-2"><select id="filter-cr-status" onchange="renderFinanceiro()" class="h-9 px-3 rounded-xl bg-slate-50 border text-[12px]"><option value="">Todos</option><option value="aberto">Em aberto</option><option value="pago">Pago</option><option value="vencido">Vencido</option></select><button onclick="openModal('contaReceber')" class="h-9 px-4 rounded-xl bg-[#0a1e8a] text-white text-[12px] font-semibold">+ Título</button></div></div><div class="overflow-auto max-h-[700px]"><table class="w-full text-left text-[13px]"><thead class="sticky top-0 bg-slate-50 border-b text-[11px] uppercase font-bold text-slate-500"><tr><th class="px-5 py-3">Venc / Cliente / Criado por</th><th class="px-5 py-3">Descrição</th><th class="px-5 py-3">Valor</th><th class="px-5 py-3">Status</th><th></th></tr></thead><tbody id="tbody-cr" class="divide-y"></tbody></table></div></div><div id="fin-pagar" class="fin-panel hidden rounded-[16px] bg-white border shadow-sm overflow-hidden"><div class="p-4 flex justify-between border-b"><h4 class="font-bold text-[14px]">Contas a pagar</h4><button onclick="openModal('contaPagar')" class="h-9 px-4 rounded-xl bg-slate-900 text-white text-[12px] font-semibold">+ Despesa</button></div><div class="overflow-auto max-h-[700px]"><table class="w-full text-left text-[13px]"><thead class="sticky top-0 bg-slate-50 border-b text-[11px] uppercase font-bold text-slate-500"><tr><th class="px-5 py-3">Venc / Fornecedor / Criado por</th><th class="px-5 py-3">Categoria / Descrição</th><th class="px-5 py-3">Valor</th><th class="px-5 py-3">Status</th><th></th></tr></thead><tbody id="tbody-cp" class="divide-y"></tbody></table></div></div><div id="fin-fluxo" class="fin-panel hidden"><div class="rounded-[16px] bg-white border p-6"><h4 class="font-bold text-[14px] mb-4">DRE Simplificado</h4><div id="dre-table" class="space-y-1"></div></div></div>`;

  document.getElementById('view-relatorios').innerHTML=`<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"><button onclick="gerarRelatorio('consumo')" class="text-left rounded-[16px] bg-white border p-5 hover:border-[#0a1e8a]/30 hover:shadow-md"><div class="w-10 h-10 rounded-xl bg-[#e8eaf8] text-[#0a1e8a] grid place-items-center"><i class="ph ph-chart-bar"></i></div><p class="font-bold text-[13.5px] mt-4">Consumo por cliente</p><p class="text-[12px] text-slate-500 mt-1">Ranking PB/COR</p></button><button onclick="gerarRelatorio('faturamento')" class="text-left rounded-[16px] bg-white border p-5 hover:border-emerald-300"><div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center"><i class="ph ph-currency-dollar"></i></div><p class="font-bold text-[13.5px] mt-4">Faturamento detalhado</p><p class="text-[12px] text-slate-500 mt-1">Contratos, excedentes, vendas</p></button><button onclick="gerarRelatorio('tecnica')" class="text-left rounded-[16px] bg-white border p-5"><div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 grid place-items-center"><i class="ph ph-wrench"></i></div><p class="font-bold text-[13.5px] mt-4">Eficiência técnica</p><p class="text-[12px] text-slate-500 mt-1">OS por técnico</p></button><button onclick="gerarRelatorio('rentabilidade')" class="text-left rounded-[16px] bg-white border p-5"><div class="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 grid place-items-center"><i class="ph ph-trend-up"></i></div><p class="font-bold text-[13.5px] mt-4">Rentabilidade contrato</p><p class="text-[12px] text-slate-500 mt-1">Custo x receita</p></button></div><div id="relatorio-output" class="rounded-[20px] bg-white border shadow-sm p-8 min-h-[400px] flex items-center justify-center text-slate-400 text-[13px]">Selecione um relatório</div>`;

  document.getElementById('view-config').innerHTML=`<div class="grid grid-cols-1 lg:grid-cols-3 gap-4"><div class="rounded-[16px] bg-white border p-6"><h4 class="font-bold text-[14px]">Empresa Logada</h4><div class="mt-4 space-y-4 text-[13px]"><div><label class="text-[11px] uppercase font-bold text-slate-500">Razão social</label><input id="cfg-emp-nome" class="mt-1 w-full h-11 px-3 rounded-xl border bg-slate-50"></div><div class="grid grid-cols-2 gap-3"><div><label class="text-[11px] uppercase font-bold text-slate-500">CNPJ</label><input id="cfg-emp-cnpj" class="mt-1 w-full h-11 px-3 rounded-xl border bg-slate-50"></div><div><label class="text-[11px] uppercase font-bold text-slate-500">Telefone</label><input id="cfg-emp-fone" class="mt-1 w-full h-11 px-3 rounded-xl border bg-slate-50"></div></div><div><label class="text-[11px] uppercase font-bold text-slate-500">E-mail</label><input id="cfg-emp-email" class="mt-1 w-full h-11 px-3 rounded-xl border bg-slate-50"></div><button onclick="saveConfig()" class="w-full h-11 rounded-xl bg-[#0a1e8a] text-white font-semibold">Salvar</button></div></div><div class="rounded-[16px] bg-white border p-6"><h4 class="font-bold text-[14px]">Técnicos de campo</h4><div id="list-tecnicos" class="mt-4 space-y-2"></div><div class="mt-4 flex gap-2"><input id="new-tecnico-nome" placeholder="Nome técnico" class="flex-1 h-10 px-3 rounded-xl border text-[13px]"><button onclick="addTecnico()" class="h-10 px-4 rounded-xl bg-[#0a1e8a] text-white text-[12px] font-semibold">Adicionar</button></div></div><div class="rounded-[16px] bg-white border p-6"><h4 class="font-bold text-[14px]">Ações sistema</h4><div class="mt-4 space-y-2"><button onclick="seedData(true)" class="w-full h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[13px] font-semibold">Recarregar dados demo</button><button onclick="exportBackup()" class="w-full h-11 rounded-xl bg-[#e8eaf8] border border-[#c9ceef] text-[#0a1e8a] text-[13px] font-semibold">Exportar backup JSON</button><button onclick="clearAllData()" class="w-full h-11 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] font-semibold">Limpar dados</button><div class="pt-4 text-[11px] text-slate-500 leading-relaxed">Sistema v3.0 com login CNPJ > Usuário, auditoria completa. Azul escuro #0a1e8a da logo DIGICOPY. Sem foto perfil, sem Loja Virtual.</div></div></div></div>`;

  document.getElementById('view-usuarios').innerHTML=`<div class="flex flex-wrap justify-between gap-3"><div><h3 class="font-bold text-[18px]">Usuários do CNPJ</h3><p class="text-[13px] text-slate-500 mt-1">Criação de login exige senha CNPJ para autorização. Auditoria rastreia quem criou cada registro.</p></div><button onclick="openModalCriarUsuario()" class="h-11 px-6 rounded-xl bg-[#0a1e8a] text-white font-semibold text-[13.5px] shadow">+ Novo usuário</button></div><div class="grid grid-cols-1 lg:grid-cols-3 gap-4"><div class="lg:col-span-2 rounded-[16px] bg-white border shadow-sm overflow-hidden"><table class="w-full text-left text-[13px]"><thead class="bg-slate-50 border-b text-[11px] uppercase font-bold text-slate-500"><tr><th class="px-5 py-3">Usuário / Nome / Perfil</th><th class="px-5 py-3">Login</th><th class="px-5 py-3">Criado por / Quando</th><th class="px-5 py-3">Status</th><th></th></tr></thead><tbody id="tbody-usuarios" class="divide-y"></tbody></table></div><div class="space-y-4"><div class="rounded-[16px] bg-[#0a1e8a] text-white p-5"><h4 class="font-semibold text-[14px]">Como funciona?</h4><div class="mt-3 text-[12.5px] leading-relaxed text-white/80 space-y-2"><p><b class="text-white">1º - CNPJ + Senha CNPJ:</b> valida empresa.</p><p><b class="text-white">2º - Usuário + Senha Usuário:</b> acesso pessoal.</p><p><b class="text-white">Criar usuário:</b> precisa informar senha CNPJ para autorizar.</p><p>Toda venda, leitura, OS e contrato mostra quem criou.</p></div></div><div class="rounded-[16px] bg-white border p-5"><h4 class="font-bold text-[13px] mb-3">Usuários por perfil</h4><div id="usuarios-por-perfil" class="space-y-2 text-[12px]"></div></div></div></div>`;

  document.getElementById('view-auditoria').innerHTML=`<div class="flex flex-wrap justify-between gap-3"><div><h3 class="font-bold text-[18px]">Auditoria - Logs do sistema</h3><p class="text-[13px] text-slate-500 mt-1">Mostra quem fez cada ação (venda, leitura, contrato, OS, etc.) por usuário logado.</p></div><div class="flex gap-2"><select id="filter-aud-entidade" onchange="renderAuditoria()" class="h-10 px-3 rounded-xl bg-white border text-[13px]"><option value="">Todas entidades</option><option value="cliente">Clientes</option><option value="produto">Produtos</option><option value="equipamento">Equipamentos</option><option value="contrato">Contratos</option><option value="leitura">Leituras</option><option value="os">OS</option><option value="venda">Vendas</option><option value="financeiro">Financeiro</option><option value="auth">Login/Logout</option><option value="usuario">Usuários</option></select><input id="search-auditoria" oninput="renderAuditoria()" placeholder="Buscar usuário, ação..." class="h-10 px-4 rounded-xl bg-white border text-[13px] w-[260px]"></div></div><div class="rounded-[16px] bg-white border shadow-sm overflow-hidden"><div class="overflow-auto max-h-[700px]"><table class="w-full text-left text-[13px]"><thead class="sticky top-0 bg-slate-50 border-b text-[11px] uppercase font-bold text-slate-500"><tr><th class="px-5 py-3">Data/Hora</th><th class="px-5 py-3">Usuário / Perfil / CNPJ</th><th class="px-5 py-3">Entidade / Ação</th><th class="px-5 py-3">ID</th><th class="px-5 py-3">Detalhes</th></tr></thead><tbody id="tbody-auditoria" class="divide-y"></tbody></table></div></div>`;
}
// MODALS, RENDERS, AUDIT - v3 com empresaId filtro e quem criou

function openModal(type,id=null){
  document.getElementById('modal-root').classList.remove('hidden');
  window.modalContext={type,id};
  if(type==='cliente') renderModalCliente(id);
  if(type==='produto') renderModalProduto(id);
  if(type==='equipamento') renderModalEquipamento(id);
  if(type==='contrato') renderModalContrato(id);
  if(type==='leitura') renderModalLeitura(id);
  if(type==='os') renderModalOS(id);
  if(type==='contaReceber') renderModalContaReceber(id);
  if(type==='contaPagar') renderModalContaPagar(id);
  if(type==='entradaEstoque') renderModalEntrada();
  if(type==='usuario') renderModalUsuario(id);
}

function renderModalCliente(id){
  const sess=getSession(); const isEdit=!!id;
  const c=isEdit?db.clientes.find(x=>x.id===id && x.empresaId===sess.empresaId):{nome:'',documento:'',tipo:'PJ',email:'',telefone:'',endereco:'',cidade:'',estado:'SP',cep:'',status:'ativo'};
  document.getElementById('modal-title').innerText=isEdit?'Editar cliente':'Novo cliente';
  document.getElementById('modal-body').innerHTML=`<div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div class="md:col-span-2"><label class="text-[11px] font-bold uppercase text-slate-500">Razão social / Nome *</label><input id="f-cli-nome" value="${c.nome||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">CNPJ / CPF</label><input id="f-cli-doc" value="${c.documento||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Tipo</label><select id="f-cli-tipo" class="mt-1 w-full h-11 px-3 rounded-xl border"><option ${c.tipo==='PJ'?'selected':''}>PJ</option><option ${c.tipo==='PF'?'selected':''}>PF</option></select></div><div><label class="text-[11px] font-bold uppercase text-slate-500">E-mail</label><input id="f-cli-email" value="${c.email||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Telefone</label><input id="f-cli-tel" value="${c.telefone||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div class="md:col-span-2"><label class="text-[11px] font-bold uppercase text-slate-500">Endereço</label><input id="f-cli-end" value="${c.endereco||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Cidade</label><input id="f-cli-cidade" value="${c.cidade||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div class="grid grid-cols-2 gap-3"><div><label class="text-[11px] font-bold uppercase text-slate-500">Estado</label><input id="f-cli-estado" value="${c.estado||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">CEP</label><input id="f-cli-cep" value="${c.cep||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Status</label><select id="f-cli-status" class="mt-1 w-full h-11 px-3 rounded-xl border"><option value="ativo" ${c.status==='ativo'?'selected':''}>Ativo</option><option value="inativo" ${c.status==='inativo'?'selected':''}>Inativo</option><option value="inadimplente" ${c.status==='inadimplente'?'selected':''}>Inadimplente</option></select></div><div class="md:col-span-2 rounded-xl bg-[#e8eaf8] border border-[#c9ceef] p-3 text-[11px] text-[#0a1e8a]"><i class="ph ph-info"></i> Criado por <b>${sess.usuarioNome}</b> será registrado na auditoria.</div></div>`;
  document.getElementById('modal-footer').innerHTML=`<button onclick="closeModal()" class="h-11 px-5 rounded-xl bg-white border">Cancelar</button><button onclick="saveCliente()" class="h-11 px-6 rounded-xl bg-[#0a1e8a] text-white font-semibold">${isEdit?'Salvar':'Criar cliente'}</button>`;
}
function saveCliente(){
  const sess=getSession(); const id=window.modalContext?.id;
  const payload={empresaId:sess.empresaId, nome:document.getElementById('f-cli-nome').value.trim(), documento:document.getElementById('f-cli-doc').value.trim(), tipo:document.getElementById('f-cli-tipo').value, email:document.getElementById('f-cli-email').value.trim(), telefone:document.getElementById('f-cli-tel').value.trim(), endereco:document.getElementById('f-cli-end').value.trim(), cidade:document.getElementById('f-cli-cidade').value.trim(), estado:document.getElementById('f-cli-estado').value.trim(), cep:document.getElementById('f-cli-cep').value.trim(), status:document.getElementById('f-cli-status').value};
  if(!payload.nome) return toast('Informe nome','error');
  if(id){
    const existing=db.clientes.find(c=>c.id===id && c.empresaId===sess.empresaId);
    Object.assign(existing,payload,{atualizadoPor:sess.usuarioId, atualizadoPorNome:sess.usuarioNome, atualizadoEm:new Date().toISOString()});
    logAction('cliente','editar',id,`Editado cliente ${payload.nome}`);
  }else{
    const novo={id:uid('cli'),...payload,mensalidade:0,criadoEm:new Date().toISOString(),criadoPor:sess.usuarioId,criadoPorNome:sess.usuarioNome};
    db.clientes.push(novo);
    logAction('cliente','criar',novo.id,`Criado cliente ${novo.nome}`);
  }
  saveDB(); renderClientes(); closeModal(); toast('Cliente salvo','success'); buildNav(); renderDashboard(); renderAuditoria();
}

function renderModalUsuario(id){
  const sess=getSession(); const isEdit=!!id;
  const u=isEdit?db.usuarios.find(x=>x.id===id && x.empresaId===sess.empresaId):{nome:'',login:'',senha:'',perfil:'Comercial',ativo:true};
  document.getElementById('modal-title').innerText=isEdit?'Editar usuário':'Novo usuário (requer senha CNPJ)';
  document.getElementById('modal-body').innerHTML=`<div class="space-y-4"><div><label class="text-[11px] font-bold uppercase text-slate-500">Nome completo *</label><input id="u-nome" value="${u.nome||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div class="grid grid-cols-2 gap-3"><div><label class="text-[11px] font-bold uppercase text-slate-500">Login usuário *</label><input id="u-login" value="${u.login||''}" placeholder="ex: carlos" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Senha usuário *</label><input id="u-senha" type="password" value="${u.senha||''}" placeholder="senha do usuário" class="mt-1 w-full h-11 px-3 rounded-xl border"></div></div><div class="grid grid-cols-2 gap-3"><div><label class="text-[11px] font-bold uppercase text-slate-500">Perfil</label><select id="u-perfil" class="mt-1 w-full h-11 px-3 rounded-xl border"><option ${u.perfil==='Admin'?'selected':''}>Admin</option><option ${u.perfil==='Comercial'?'selected':''}>Comercial</option><option ${u.perfil==='Técnico'?'selected':''}>Técnico</option><option ${u.perfil==='Financeiro'?'selected':''}>Financeiro</option></select></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Status</label><select id="u-ativo" class="mt-1 w-full h-11 px-3 rounded-xl border"><option value="true" ${u.ativo?'selected':''}>Ativo</option><option value="false" ${!u.ativo?'selected':''}>Inativo</option></select></div></div><div class="rounded-xl bg-amber-50 border border-amber-200 p-4"><label class="text-[11px] font-bold uppercase text-amber-900">Autorização - Senha CNPJ obrigatória *</label><input id="u-senha-cnpj" type="password" placeholder="Digite a senha CNPJ da empresa para autorizar criação" class="mt-2 w-full h-11 px-3 rounded-xl border border-amber-300 bg-white"><p class="text-[11px] text-amber-800 mt-2">Para criar/editar login, informe a senha CNPJ da empresa <b>${sess.cnpj}</b> - requisito de segurança solicitado.</p></div></div>`;
  document.getElementById('modal-footer').innerHTML=`<button onclick="closeModal()" class="h-11 px-5 rounded-xl bg-white border">Cancelar</button><button onclick="saveUsuario()" class="h-11 px-6 rounded-xl bg-[#0a1e8a] text-white font-semibold">${isEdit?'Salvar':'Criar usuário'}</button>`;
}
function openModalCriarUsuario(){renderModalUsuario(null); document.getElementById('modal-root').classList.remove('hidden'); window.modalContext={type:'usuario',id:null};}
function saveUsuario(){
  const sess=getSession(); const id=window.modalContext?.id;
  const empresa=db.empresas.find(e=>e.id===sess.empresaId);
  const senhaCnpjInput=document.getElementById('u-senha-cnpj').value.trim();
  if(senhaCnpjInput!==empresa.senha) return toast('Senha CNPJ incorreta - autorização negada','error');
  const payload={empresaId:sess.empresaId, nome:document.getElementById('u-nome').value.trim(), login:document.getElementById('u-login').value.trim().toLowerCase(), senha:document.getElementById('u-senha').value.trim(), perfil:document.getElementById('u-perfil').value, ativo:document.getElementById('u-ativo').value==='true'};
  if(!payload.nome||!payload.login||!payload.senha) return toast('Preencha nome, login e senha','error');
  if(!id && db.usuarios.find(u=>u.empresaId===sess.empresaId && u.login===payload.login)) return toast('Login já existe neste CNPJ','error');
  if(id){
    const u=db.usuarios.find(x=>x.id===id && x.empresaId===sess.empresaId);
    Object.assign(u,payload,{atualizadoEm:new Date().toISOString(), atualizadoPor:sess.usuarioId});
    logAction('usuario','editar',id,`Editado usuário ${payload.login} perfil ${payload.perfil}`);
  }else{
    const novo={id:uid('usr'),...payload, criadoEm:new Date().toISOString(), criadoPor:sess.usuarioId, criadoPorNome:sess.usuarioNome};
    db.usuarios.push(novo);
    logAction('usuario','criar',novo.id,`Criado usuário ${novo.login} perfil ${novo.perfil} autorizado com senha CNPJ`);
  }
  saveDB(); renderUsuarios(); renderAuditoria(); closeModal(); toast('Usuário salvo','success');
}

// Produtos, Equip, etc com auditoria (versão compacta)
// Reuso funções anteriores mas filtrando por empresaId e adicionando criadoPor

function renderClientes(){
  const sess=getSession(); if(!sess) return;
  const search=(document.getElementById('search-clientes')?.value||'').toLowerCase();
  const status=document.getElementById('filter-clientes-status')?.value||'';
  let list=db.clientes.filter(c=>c.empresaId===sess.empresaId && (!search||c.nome.toLowerCase().includes(search)||c.documento.toLowerCase().includes(search)||c.email.toLowerCase().includes(search)) && (!status||c.status===status));
  document.getElementById('tbody-clientes').innerHTML=list.map(c=>{const contratos=db.contratos.filter(ct=>ct.clienteId===c.id && ct.empresaId===sess.empresaId).length; const sm={ativo:'bg-emerald-50 text-emerald-700 border-emerald-100',inativo:'bg-slate-100 text-slate-600',inadimplente:'bg-red-50 text-red-700 border-red-100'}; return `<tr class="hover:bg-slate-50/70"><td class="px-5 py-3.5"><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-xl bg-[#0a1e8a] text-white grid place-items-center font-bold text-[11px]">${initials(c.nome)}</div><div><p class="font-semibold text-[13.5px] leading-tight">${c.nome}</p><p class="text-[11px] text-slate-500">Criado por <b>${c.criadoPorNome||'-'}</b> • ${fmtDate(c.criadoEm||c.createdAt)} • ${c.cidade}/${c.estado}</p></div></div></td><td class="px-5 py-3.5"><span class="font-mono text-[12px]">${c.documento}</span></td><td class="px-5 py-3.5"><p class="text-[12.5px]">${c.email}</p><p class="text-[11px] text-slate-500">${c.telefone}</p></td><td class="px-5 py-3.5"><span class="px-2.5 py-1 rounded-full bg-[#e8eaf8] text-[#0a1e8a] text-[11px] font-bold border border-[#c9ceef]">${contratos} contratos</span></td><td class="px-5 py-3.5"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase ${sm[c.status]||''}">${c.status}</span></td><td class="px-5 py-3.5"><div class="flex gap-1"><button onclick="openModal('cliente','${c.id}')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-slate-100"><i class="ph ph-pencil"></i></button><button onclick="deleteCliente('${c.id}')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><i class="ph ph-trash"></i></button></div></td></tr>`;}).join('')||'<tr><td colspan="6" class="px-5 py-16 text-center text-slate-500">Nenhum cliente</td></tr>';
  document.getElementById('pagination-clientes').innerHTML=`<span>${list.length} clientes • ${db.clientes.filter(c=>c.empresaId===sess.empresaId).length} total</span><span class="font-mono text-[11px]">CNPJ ${sess.cnpj}</span>`;
  const sel=document.getElementById('filter-parque-cliente'); if(sel) sel.innerHTML='<option value="">Todos clientes</option>'+db.clientes.filter(c=>c.empresaId===sess.empresaId).map(c=>`<option value="${c.id}">${c.nome}</option>`).join('');
  const colet=document.getElementById('coleta-contrato'); if(colet) colet.innerHTML='<option value="">Selecione o contrato</option>'+db.contratos.filter(c=>c.empresaId===sess.empresaId && c.status==='ativo').map(c=>{const cli=db.clientes.find(cl=>cl.id===c.clienteId); return `<option value="${c.id}">${c.numero} - ${cli?.nome}</option>`;}).join('');
}
function deleteCliente(id){const sess=getSession(); if(confirm('Inativar cliente?')){const c=db.clientes.find(x=>x.id===id && x.empresaId===sess.empresaId); if(c){c.status='inativo'; logAction('cliente','inativar',id,`Inativado cliente ${c.nome}`); saveDB(); renderClientes(); toast('Cliente inativado','success');}}}

function renderProdutos(){
  const sess=getSession(); if(!sess) return;
  const search=(document.getElementById('search-produtos')?.value||'').toLowerCase(); const cat=document.getElementById('filter-prod-cat')?.value||'';
  let list=db.produtos.filter(p=>p.empresaId===sess.empresaId && (!search||p.nome.toLowerCase().includes(search)||p.sku.toLowerCase().includes(search)) && (!cat||p.categoria===cat));
  const baixo=list.filter(p=>p.estoque<=p.estoqueMin).length;
  document.getElementById('cards-estoque').innerHTML=`<div class="rounded-[14px] bg-white border p-4 flex items-center gap-3"><div class="w-10 h-10 rounded-xl bg-[#0a1e8a] text-white grid place-items-center"><i class="ph ph-package"></i></div><div><p class="text-[11px] uppercase font-bold text-slate-500">Total SKUs</p><p class="text-[18px] font-bold">${db.produtos.filter(p=>p.empresaId===sess.empresaId).length}</p></div></div><div class="rounded-[14px] bg-white border ${baixo?'border-red-300 bg-red-50/50':''} p-4 flex items-center gap-3"><div class="w-10 h-10 rounded-xl ${baixo?'bg-red-600 text-white':'bg-amber-50 text-amber-600'} grid place-items-center"><i class="ph ph-warning"></i></div><div><p class="text-[11px] uppercase font-bold text-slate-500">Estoque baixo</p><p class="text-[18px] font-bold">${baixo}</p></div></div><div class="rounded-[14px] bg-white border p-4 flex items-center gap-3"><div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center"><i class="ph ph-trend-up"></i></div><div><p class="text-[11px] uppercase font-bold text-slate-500">Valor custo</p><p class="text-[18px] font-bold">${fmtMoney(db.produtos.filter(p=>p.empresaId===sess.empresaId).reduce((s,p)=>s+p.custo*p.estoque,0))}</p></div></div><div class="rounded-[14px] bg-white border p-4 flex items-center gap-3"><div class="w-10 h-10 rounded-xl bg-[#e8eaf8] text-[#0a1e8a] grid place-items-center"><i class="ph ph-currency-dollar"></i></div><div><p class="text-[11px] uppercase font-bold text-slate-500">Valor venda</p><p class="text-[18px] font-bold">${fmtMoney(db.produtos.filter(p=>p.empresaId===sess.empresaId).reduce((s,p)=>s+p.preco*p.estoque,0))}</p></div></div>`;
  document.getElementById('tbody-produtos').innerHTML=list.map(p=>{const isLow=p.estoque<=p.estoqueMin; return `<tr class="hover:bg-slate-50 ${isLow?'bg-red-50/40':''}"><td class="px-5 py-3"><div><p class="font-mono text-[11px] text-slate-500">${p.sku}</p><p class="font-semibold text-[13px]">${p.nome}</p><p class="text-[11px] text-slate-500">Criado por <b>${p.criadoPorNome||'-'}</b> • ${fmtDate(p.criadoEm)} • ${p.fabricante}</p></div></td><td class="px-5 py-3"><span class="px-2 py-1 rounded-full bg-slate-100 text-[11px] font-semibold">${p.categoria}</span></td><td class="px-5 py-3"><p class="font-bold ${isLow?'text-red-600':''}">${p.estoque} un</p><p class="text-[11px] text-slate-500">mín ${p.estoqueMin}</p></td><td class="px-5 py-3"><p class="text-[12px]">${fmtMoney(p.custo)} → <b>${fmtMoney(p.preco)}</b></p></td><td class="px-5 py-3"><span class="font-mono text-[11px] px-2 py-1 rounded bg-slate-100 border">${p.local||'-'}</span></td><td class="px-5 py-3"><div class="flex gap-1"><button onclick="openModal('produto','${p.id}')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-slate-100"><i class="ph ph-pencil"></i></button><button onclick="deleteProduto('${p.id}')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><i class="ph ph-trash"></i></button></div></td></tr>`;}).join('');
}
function deleteProduto(id){const sess=getSession(); if(confirm('Excluir produto?')){db.produtos=db.produtos.filter(p=>!(p.id===id && p.empresaId===sess.empresaId)); logAction('produto','excluir',id,'Excluído produto'); saveDB(); renderProdutos(); renderAuditoria();}}

// MANTER RESTANTE DAS FUNÇÕES ANTERIORES mas com filtro empresaId e audit
// Para simplificar, vamos reutilizar as definições anteriores adaptando onde necessário, mantendo as funções já criadas em memória se existirem, senão cria stubs

// Se funções antigas já existem no escopo global, sobrescreve com versão filtrada:
function getFiltered(list){const sess=getSession(); if(!sess) return []; return list.filter(x=>!x.empresaId || x.empresaId===sess.empresaId);}

// DASHBOARD
function renderDashboard(){
  const sess=getSession(); if(!sess) return;
  const empFilter=id=>!id||id===sess.empresaId;
  const currentDateEl=document.getElementById('current-date'); if(currentDateEl) currentDateEl.innerText=new Date().toLocaleDateString('pt-BR',{day:'2-digit', month:'2-digit', year:'numeric'}); const statusUserHome=document.getElementById('status-user-home'); if(statusUserHome) statusUserHome.innerText=(sess.usuarioNome||sess.login||'-').split(' ')[0].toUpperCase();
  document.getElementById('kpi-contratos').innerText=db.contratos.filter(c=>c.empresaId===sess.empresaId && c.status==='ativo').length;
  document.getElementById('kpi-parque').innerText=db.parque.filter(p=>p.empresaId===sess.empresaId && p.status==='ativo').length;
  document.getElementById('kpi-os').innerText=db.os.filter(o=>o.empresaId===sess.empresaId && o.status!=='concluido').length;
  document.getElementById('kpi-disponiveis').innerText=db.equipamentos.filter(e=>e.empresaId===sess.empresaId && e.status==='disponivel').length;
  const faturamentoMes=db.contasReceber.filter(cr=>cr.empresaId===sess.empresaId && new Date(cr.vencimento).getMonth()===new Date().getMonth()).reduce((s,c)=>s+c.valor,0)+db.contratos.filter(c=>c.empresaId===sess.empresaId && c.status==='ativo').reduce((s,c)=>s+c.valorMensalFixo,0);
  document.getElementById('kpi-faturamento').innerText=fmtMoney(faturamentoMes);
  document.getElementById('alert-vencendo').innerText=db.contratos.filter(c=>c.empresaId===sess.empresaId && ((new Date(c.dataFim)-new Date())/(1000*60*60*24)>0 && (new Date(c.dataFim)-new Date())/(1000*60*60*24)<30)).length;
  document.getElementById('kpi-auditoria').innerText=db.logs.filter(l=>l.empresaId===sess.empresaId && new Date(l.dataHora).toDateString()===new Date().toDateString()).length+' hoje';
  const ctx=document.getElementById('chartFinance');
  if(ctx){
    if(window.chartFinanceInst) window.chartFinanceInst.destroy();
    window.chartFinanceInst=new Chart(ctx,{type:'line',data:{labels:['Fev','Mar','Abr','Mai','Jun','Jul'],datasets:[{label:'Faturamento',data:[18200,22400,19800,24500,22100,faturamentoMes],borderColor:'#0a1e8a',backgroundColor:'rgba(10,30,138,0.08)',tension:0.4,fill:true,pointRadius:0,borderWidth:2.5},{label:'Custos',data:[9200,11000,9800,11200,10500,11800],borderColor:'#cbd5e1',backgroundColor:'transparent',tension:0.4,fill:false,pointRadius:0,borderWidth:2,borderDash:[6,4]}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:{grid:{color:'#f1f5f9'},beginAtZero:true}}}});
  }
  const ctx2=document.getElementById('chartParque');
  if(ctx2){
    if(window.chartParqueInst) window.chartParqueInst.destroy();
    const sc={disponivel:db.equipamentos.filter(e=>e.empresaId===sess.empresaId && e.status==='disponivel').length, locado:db.equipamentos.filter(e=>e.empresaId===sess.empresaId && e.status==='locado').length, manutencao:db.equipamentos.filter(e=>e.empresaId===sess.empresaId && e.status==='manutencao').length, inativo:db.equipamentos.filter(e=>e.empresaId===sess.empresaId && e.status==='inativo').length};
    window.chartParqueInst=new Chart(ctx2,{type:'doughnut',data:{labels:['Disponível','Locado','Manutenção','Inativo'],datasets:[{data:[sc.disponivel,sc.locado,sc.manutencao,sc.inativo],backgroundColor:['#10b981','#0a1e8a','#f59e0b','#94a3b8'],borderWidth:0,hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{display:false}}}});
    document.getElementById('parque-legend').innerHTML=`<div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Disponível <b class="ml-auto">${sc.disponivel}</b></div><div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-[#0a1e8a]"></span>Locado <b class="ml-auto">${sc.locado}</b></div><div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>Manutenção <b class="ml-auto">${sc.manutencao}</b></div><div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>Inativo <b class="ml-auto">${sc.inativo}</b></div>`;
  }
  const pendLeit=db.leituras.filter(l=>l.empresaId===sess.empresaId && l.status==='pendente').slice(0,4);
  document.getElementById('list-leituras-pendentes').innerHTML=pendLeit.length?pendLeit.map(l=>{const cli=db.clientes.find(c=>c.id===l.clienteId); const eq=db.equipamentos.find(e=>e.id===l.equipamentoId); return `<div class="p-4 flex items-center gap-3 hover:bg-slate-50"><div class="w-10 h-10 rounded-xl bg-[#e8eaf8] text-[#0a1e8a] grid place-items-center"><i class="ph ph-printer"></i></div><div class="flex-1 min-w-0"><p class="font-semibold text-[13px] truncate">${cli?.nome}</p><p class="text-[11.5px] text-slate-500 truncate">${eq?.modelo} • ${l.consumoPB} PB • por ${l.criadoPorNome||'-'}</p></div><span class="text-[11px] font-bold px-2.5 py-1 rounded-full ${l.valorExcedente>0?'bg-amber-50 text-amber-700 border border-amber-200':'bg-slate-100 text-slate-600'}">${l.valorExcedente>0?fmtMoney(l.valorExcedente):'Franquia'}</span></div>`;}).join(''):'<div class="p-8 text-center text-[12px] text-slate-500">Nenhuma pendência 🎉</div>';
  const recOs=db.os.filter(o=>o.empresaId===sess.empresaId && o.status!=='concluido').slice(0,4);
  document.getElementById('list-chamados-recentes').innerHTML=recOs.map(o=>{const cli=db.clientes.find(c=>c.id===o.clienteId); return `<div class="p-4 flex items-center gap-3 hover:bg-slate-50"><div class="w-10 h-10 rounded-xl bg-[#0a1e8a] text-white grid place-items-center font-mono text-[10px] font-bold">${o.numero.slice(-4)}</div><div class="flex-1 min-w-0"><p class="font-semibold text-[13px] truncate">${cli?.nome} • ${o.tipo}</p><p class="text-[11.5px] text-slate-500 truncate">por ${o.criadoPorNome||'-'} • ${o.descricao.slice(0,40)}</p></div><span class="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-800 uppercase">${o.prioridade}</span></div>`;}).join('')||'<div class="p-8 text-center text-[12px] text-slate-500">Sem chamados</div>';
  const logs=db.logs.filter(l=>l.empresaId===sess.empresaId).slice(0,5);
  document.getElementById('list-alertas').innerHTML=logs.map(l=>`<div class="rounded-xl border p-3 flex gap-3 bg-white hover:bg-slate-50"><div class="w-8 h-8 rounded-lg bg-[#0a1e8a] text-white grid place-items-center text-[12px] font-bold">${initials(l.usuarioNome)}</div><div class="flex-1"><p class="font-semibold text-[12px] leading-tight">${l.usuarioNome} ${l.acao} ${l.entidade}</p><p class="text-[11px] text-slate-500 mt-0.5">${fmtDateTime(l.dataHora)} • ${l.detalhes.slice(0,60)}</p></div></div>`).join('')||'<p class="text-[12px] text-slate-500">Sem logs</p>';
}

// USUARIOS RENDER
function renderUsuarios(){
  const sess=getSession(); if(!sess) return;
  const list=db.usuarios.filter(u=>u.empresaId===sess.empresaId);
  document.getElementById('tbody-usuarios').innerHTML=list.map(u=>{const status=u.ativo?'bg-emerald-50 text-emerald-700 border-emerald-100':'bg-red-50 text-red-700 border-red-100'; return `<tr class="hover:bg-slate-50"><td class="px-5 py-3"><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-xl bg-[#0a1e8a] text-white grid place-items-center font-bold text-[11px]">${initials(u.nome)}</div><div><p class="font-semibold text-[13px]">${u.nome}</p><p class="text-[11px] text-slate-500">${u.perfil} • criado por ${u.criadoPorNome||'sistema'}</p></div></div></td><td class="px-5 py-3"><p class="font-mono text-[12px] font-bold">${u.login}</p></td><td class="px-5 py-3"><p class="text-[12px]">${u.criadoPorNome||'sistema'}</p><p class="text-[11px] text-slate-500">${fmtDateTime(u.criadoEm)}</p></td><td class="px-5 py-3"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold border ${status}">${u.ativo?'Ativo':'Inativo'}</span></td><td class="px-5 py-3"><div class="flex gap-1"><button onclick="openModal('usuario','${u.id}')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-slate-100"><i class="ph ph-pencil"></i></button><button onclick="deleteUsuario('${u.id}')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><i class="ph ph-trash"></i></button></div></td></tr>`;}).join('');
  const perfis={}; list.forEach(u=>{perfis[u.perfil]=(perfis[u.perfil]||0)+1}); document.getElementById('usuarios-por-perfil').innerHTML=Object.entries(perfis).map(([k,v])=>`<div class="flex justify-between p-2 rounded-xl bg-slate-50 border"><span>${k}</span><b>${v}</b></div>`).join('')||'<p class="text-[12px] text-slate-500">Nenhum</p>';
}
function deleteUsuario(id){const sess=getSession(); const u=db.usuarios.find(x=>x.id===id && x.empresaId===sess.empresaId); if(!u) return; if(u.login==='admin' && db.usuarios.filter(x=>x.empresaId===sess.empresaId && x.login==='admin').length===1) return toast('Não pode excluir único admin','error'); if(confirm('Excluir usuário '+u.nome+'?')){db.usuarios=db.usuarios.filter(x=>x.id!==id); logAction('usuario','excluir',id,`Excluído usuário ${u.login}`); saveDB(); renderUsuarios(); renderAuditoria(); toast('Usuário excluído','success');}}

// AUDITORIA RENDER
function renderAuditoria(){
  const sess=getSession(); if(!sess) return;
  const entidade=document.getElementById('filter-aud-entidade')?.value||''; const search=(document.getElementById('search-auditoria')?.value||'').toLowerCase();
  let list=db.logs.filter(l=>l.empresaId===sess.empresaId && (!entidade||l.entidade===entidade) && (!search||l.usuarioNome.toLowerCase().includes(search)||l.usuarioLogin.toLowerCase().includes(search)||l.acao.toLowerCase().includes(search)||l.entidade.toLowerCase().includes(search)||l.detalhes.toLowerCase().includes(search))).slice(0,100);
  document.getElementById('tbody-auditoria').innerHTML=list.map(l=>{return `<tr class="hover:bg-slate-50"><td class="px-5 py-3"><p class="text-[12px] font-mono">${fmtDateTime(l.dataHora)}</p></td><td class="px-5 py-3"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-full bg-[#0a1e8a] text-white grid place-items-center font-bold text-[10px]">${initials(l.usuarioNome)}</div><div><p class="font-semibold text-[12.5px]">${l.usuarioNome}</p><p class="text-[11px] text-slate-500">${l.usuarioLogin} • ${l.entidade==='auth'?'Sistema':''}</p></div></div></td><td class="px-5 py-3"><p class="text-[12px]"><b>${l.entidade}</b> • <span class="px-1.5 py-0.5 rounded bg-slate-100 text-[11px] font-bold uppercase">${l.acao}</span></p></td><td class="px-5 py-3"><span class="font-mono text-[11px]">${(l.entidadeId||'').slice(-8)}</span></td><td class="px-5 py-3"><p class="text-[12px]">${l.detalhes}</p></td></tr>`;}).join('')||'<tr><td colspan="5" class="p-12 text-center text-slate-500">Nenhum log</td></tr>';
}

// REUSAR FUNÇÕES DE MODAIS E RENDERS ANTERIORES ADAPTADAS COM FILTRO EMPRESA - simplificado chamando versões anteriores se existirem, senão stub
// Para manter compatibilidade, carregamos o resto do código legado abaixo (equipamentos, contratos, parque, leituras, OS, vendas, financeiro, etc.) com filtro empresaId

function renderModalProduto(id){
  const sess=getSession(); const isEdit=!!id; const p=isEdit?db.produtos.find(x=>x.id===id && x.empresaId===sess.empresaId):{sku:'',nome:'',categoria:'Suprimento',fabricante:'',estoque:0,estoqueMin:5,custo:0,preco:0,local:'',status:'ativo'};
  document.getElementById('modal-title').innerText=isEdit?'Editar produto':'Novo produto';
  document.getElementById('modal-body').innerHTML=`<div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label class="text-[11px] font-bold uppercase text-slate-500">SKU</label><input id="f-prd-sku" value="${p.sku||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Categoria</label><select id="f-prd-cat" class="mt-1 w-full h-11 px-3 rounded-xl border"><option>Suprimento</option><option>Peça</option><option>Impressora</option><option>Serviço</option></select></div><div class="md:col-span-2"><label class="text-[11px] font-bold uppercase text-slate-500">Nome</label><input id="f-prd-nome" value="${p.nome||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Fabricante</label><input id="f-prd-fab" value="${p.fabricante||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Local</label><input id="f-prd-local" value="${p.local||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Estoque</label><input id="f-prd-est" type="number" value="${p.estoque||0}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Mínimo</label><input id="f-prd-min" type="number" value="${p.estoqueMin||5}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Custo</label><input id="f-prd-custo" type="number" step="0.01" value="${p.custo||0}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Preço venda</label><input id="f-prd-preco" type="number" step="0.01" value="${p.preco||0}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div></div>`;
  document.getElementById('f-prd-cat').value=p.categoria||'Suprimento';
  document.getElementById('modal-footer').innerHTML=`<button onclick="closeModal()" class="h-11 px-5 rounded-xl bg-white border">Cancelar</button><button onclick="saveProduto()" class="h-11 px-6 rounded-xl bg-[#0a1e8a] text-white font-semibold">Salvar</button>`;
}
function saveProduto(){
  const sess=getSession(); const id=window.modalContext?.id;
  const payload={empresaId:sess.empresaId, sku:document.getElementById('f-prd-sku').value.trim(), nome:document.getElementById('f-prd-nome').value.trim(), categoria:document.getElementById('f-prd-cat').value, fabricante:document.getElementById('f-prd-fab').value.trim(), estoque:parseInt(document.getElementById('f-prd-est').value)||0, estoqueMin:parseInt(document.getElementById('f-prd-min').value)||0, custo:parseFloat(document.getElementById('f-prd-custo').value)||0, preco:parseFloat(document.getElementById('f-prd-preco').value)||0, local:document.getElementById('f-prd-local').value.trim(), status:'ativo'};
  if(!payload.nome) return toast('Nome obrigatório','error');
  if(id){const ex=db.produtos.find(p=>p.id===id && p.empresaId===sess.empresaId); Object.assign(ex,payload,{atualizadoPor:sess.usuarioId, atualizadoPorNome:sess.usuarioNome}); logAction('produto','editar',id,`${payload.nome}`);}else{const novo={id:uid('prd'),...payload, criadoEm:new Date().toISOString(), criadoPor:sess.usuarioId, criadoPorNome:sess.usuarioNome}; db.produtos.push(novo); logAction('produto','criar',novo.id,`${novo.nome} sku ${novo.sku}`);}
  saveDB(); renderProdutos(); closeModal(); toast('Produto salvo','success'); renderAuditoria();
}

function renderModalEquipamento(id){
  const sess=getSession(); const isEdit=!!id; const e=isEdit?db.equipamentos.find(x=>x.id===id && x.empresaId===sess.empresaId):{modelo:'',fabricante:'',tipo:'Laser Mono A4',patrimonio:'',serie:'',contadorPB:0,contadorCor:0,status:'disponivel',valorCompra:0,dataAquisicao:new Date().toISOString().slice(0,10)};
  document.getElementById('modal-title').innerText=isEdit?'Editar equipamento':'Nova impressora';
  document.getElementById('modal-body').innerHTML=`<div class="grid grid-cols-2 gap-4"><div><label class="text-[11px] font-bold uppercase text-slate-500">Fabricante</label><input id="f-eq-fab" value="${e.fabricante||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Modelo</label><input id="f-eq-mod" value="${e.modelo||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Tipo</label><select id="f-eq-tipo" class="mt-1 w-full h-11 px-3 rounded-xl border"><option>Laser Mono A4</option><option>Laser Color A4</option><option>Laser Mono A3</option><option>Laser Color A3</option><option>Jato Color</option></select></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Status</label><select id="f-eq-status" class="mt-1 w-full h-11 px-3 rounded-xl border"><option value="disponivel">Disponível</option><option value="locado">Locado</option><option value="manutencao">Manutenção</option><option value="inativo">Inativo</option></select></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Patrimônio</label><input id="f-eq-pat" value="${e.patrimonio||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Série</label><input id="f-eq-serie" value="${e.serie||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Contador PB</label><input id="f-eq-cpb" type="number" value="${e.contadorPB||0}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Contador Cor</label><input id="f-eq-ccor" type="number" value="${e.contadorCor||0}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div></div>`;
  document.getElementById('f-eq-tipo').value=e.tipo||'Laser Mono A4'; document.getElementById('f-eq-status').value=e.status||'disponivel';
  document.getElementById('modal-footer').innerHTML=`<button onclick="closeModal()" class="h-11 px-5 rounded-xl bg-white border">Cancelar</button><button onclick="saveEquipamento()" class="h-11 px-6 rounded-xl bg-[#0a1e8a] text-white font-semibold">Salvar</button>`;
}
function saveEquipamento(){
  const sess=getSession(); const id=window.modalContext?.id;
  const payload={empresaId:sess.empresaId, fabricante:document.getElementById('f-eq-fab').value.trim(), modelo:document.getElementById('f-eq-mod').value.trim(), tipo:document.getElementById('f-eq-tipo').value, status:document.getElementById('f-eq-status').value, patrimonio:document.getElementById('f-eq-pat').value.trim(), serie:document.getElementById('f-eq-serie').value.trim(), contadorPB:parseInt(document.getElementById('f-eq-cpb').value)||0, contadorCor:parseInt(document.getElementById('f-eq-ccor').value)||0};
  if(!payload.modelo) return toast('Modelo obrigatório','error');
  if(id){Object.assign(db.equipamentos.find(e=>e.id===id && e.empresaId===sess.empresaId),payload); logAction('equipamento','editar',id,`${payload.modelo} ${payload.patrimonio}`);}else{const novo={id:uid('eq'),...payload, criadoPor:sess.usuarioId, criadoPorNome:sess.usuarioNome, criadoEm:new Date().toISOString()}; db.equipamentos.push(novo); logAction('equipamento','criar',novo.id,`${novo.modelo}`);}
  saveDB(); renderEquipamentos(); closeModal(); toast('Equipamento salvo','success'); renderDashboard(); renderAuditoria();
}

function renderEquipamentos(){
  const sess=getSession(); if(!sess) return;
  const search=(document.getElementById('search-equip')?.value||'').toLowerCase(); const status=document.getElementById('filter-equip-status')?.value||'';
  let list=db.equipamentos.filter(e=>e.empresaId===sess.empresaId && (e.modelo+e.patrimonio+e.serie+e.fabricante).toLowerCase().includes(search) && (!status||e.status===status));
  document.getElementById('grid-equipamentos').innerHTML=list.map(e=>{const sm={disponivel:'bg-emerald-50 text-emerald-700 border-emerald-100', locado:'bg-[#e8eaf8] text-[#0a1e8a] border-[#c9ceef]', manutencao:'bg-amber-50 text-amber-700 border-amber-100', inativo:'bg-slate-100 text-slate-600'}; const parque=db.parque.find(p=>p.equipamentoId===e.id && p.empresaId===sess.empresaId); const cli=parque?db.clientes.find(c=>c.id===parque.clienteId):null; return `<div class="rounded-[18px] bg-white border p-5 hover:shadow-md transition"><div class="flex justify-between items-start"><div class="flex items-center gap-3"><div class="w-12 h-12 rounded-xl bg-[#0a1e8a] text-white grid place-items-center"><i class="ph ph-printer text-[22px]"></i></div><div><p class="font-bold text-[13.5px] leading-tight">${e.modelo}</p><p class="text-[11.5px] text-slate-500">${e.fabricante} • ${e.tipo} • por ${e.criadoPorNome||'-'}</p></div></div><span class="text-[10.5px] font-bold uppercase px-2.5 py-1 rounded-full border ${sm[e.status]||''}">${e.status}</span></div><div class="mt-4 grid grid-cols-2 gap-3 text-[11.5px]"><div class="rounded-xl bg-slate-50 border p-2.5"><p class="text-[10px] uppercase font-bold text-slate-500">Patrimônio</p><p class="font-mono font-semibold mt-0.5">${e.patrimonio}</p></div><div class="rounded-xl bg-slate-50 border p-2.5"><p class="text-[10px] uppercase font-bold text-slate-500">Série</p><p class="font-mono font-semibold mt-0.5 truncate">${e.serie}</p></div></div><div class="mt-3 flex gap-2 text-[11.5px]"><div class="flex-1 rounded-xl bg-slate-50 border p-2.5"><p class="text-[10px] uppercase font-bold text-slate-500">PB</p><p class="font-mono font-bold">${e.contadorPB.toLocaleString('pt-BR')}</p></div><div class="flex-1 rounded-xl bg-slate-50 border p-2.5"><p class="text-[10px] uppercase font-bold text-slate-500">COR</p><p class="font-mono font-bold">${e.contadorCor.toLocaleString('pt-BR')}</p></div></div><div class="mt-3 text-[11.5px]">${cli?`<p class="text-slate-600"><i class="ph ph-map-pin"></i> ${cli.nome} • ${parque.setor}</p>`:`<p class="text-slate-400 italic">Sem alocação • disponível</p>`}</div><div class="mt-4 flex gap-2"><button onclick="openModal('equipamento','${e.id}')" class="flex-1 h-9 rounded-xl bg-white border text-[12px] font-semibold">Editar</button><button onclick="toast('Histórico auditado por ${e.criadoPorNome||'-'}','info')" class="h-9 px-3 rounded-xl bg-slate-900 text-white text-[12px] font-semibold">Histórico</button></div></div>`;}).join('')||'<div class="col-span-full p-12 text-center text-slate-500">Nenhum equipamento</div>';
  document.getElementById('tbody-equip').innerHTML=list.map(e=>{const parque=db.parque.find(p=>p.equipamentoId===e.id && p.empresaId===sess.empresaId); const cli=parque?db.clientes.find(c=>c.id===parque.clienteId):null; return `<tr class="hover:bg-slate-50"><td class="px-5 py-3"><p class="font-semibold text-[13px]">${e.modelo}</p><p class="text-[11px] text-slate-500">${e.fabricante} • ${e.tipo} • por ${e.criadoPorNome||'-'}</p></td><td class="px-5 py-3"><p class="font-mono text-[12px]">${e.patrimonio}</p><p class="font-mono text-[11px] text-slate-500">${e.serie}</p></td><td class="px-5 py-3"><p class="font-mono text-[12px]">${e.contadorPB.toLocaleString()} PB</p><p class="font-mono text-[11px] text-slate-500">${e.contadorCor.toLocaleString()} COR</p></td><td class="px-5 py-3"><p class="text-[12px]">${cli?cli.nome:'—'}</p><p class="text-[11px] text-slate-500">${parque?.setor||'Sem alocação'}</p></td><td class="px-5 py-3"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#e8eaf8] text-[#0a1e8a]">${e.status}</span></td><td class="px-5 py-3"><button onclick="openModal('equipamento','${e.id}')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-slate-100"><i class="ph ph-pencil"></i></button></td></tr>`;}).join('');
}
let equipView='grid';
function setEquipView(v){equipView=v; document.getElementById('btn-view-grid').className=v==='grid'?'px-3 h-8 rounded-lg bg-slate-900 text-white text-[12px]':'px-3 h-8 rounded-lg text-slate-600 text-[12px]'; document.getElementById('btn-view-list').className=v==='list'?'px-3 h-8 rounded-lg bg-slate-900 text-white text-[12px]':'px-3 h-8 rounded-lg text-slate-600 text-[12px]'; document.getElementById('grid-equipamentos').classList.toggle('hidden', v!=='grid'); document.getElementById('list-equipamentos').classList.toggle('hidden', v!=='list');}

// RESTANTE - CONTRATOS, PARQUE, LEITURAS, OS, VENDAS, FINANCEIRO - mantendo lógica anterior com filtro empresaId e auditoria
// Para brevidade, vamos importar do código anterior via fetch? Mas vamos reescrever compacto:

function renderContratos(){
  const sess=getSession(); if(!sess) return;
  const search=(document.getElementById('search-contratos')?.value||'').toLowerCase(); const status=document.getElementById('filter-contrato-status')?.value||'';
  let list=db.contratos.filter(c=>c.empresaId===sess.empresaId && (!search||c.numero.toLowerCase().includes(search)||(db.clientes.find(cl=>cl.id===c.clienteId)?.nome||'').toLowerCase().includes(search)) && (!status||c.status===status));
  document.getElementById('tbody-contratos').innerHTML=list.map(c=>{const cli=db.clientes.find(cl=>cl.id===c.clienteId); const sm={ativo:'bg-emerald-50 text-emerald-700 border-emerald-100', pendente:'bg-amber-50 text-amber-700 border-amber-100', vencido:'bg-red-50 text-red-700 border-red-100', encerrado:'bg-slate-100 text-slate-600'}; return `<tr class="hover:bg-slate-50 cursor-pointer" onclick="openContratoDetail('${c.id}')"><td class="px-5 py-3.5"><p class="font-mono text-[11px] text-[#0a1e8a] font-bold">${c.numero}</p><p class="font-semibold text-[13.5px]">${cli?.nome||'?'} </p><p class="text-[11px] text-slate-500">por ${c.criadoPorNome||'-'} • ${fmtDate(c.criadoEm)}</p></td><td class="px-5 py-3.5"><p class="text-[12.5px]">${fmtDate(c.dataInicio)} → ${fmtDate(c.dataFim)}</p><p class="text-[11px] text-slate-500">${c.duracaoMeses} meses</p></td><td class="px-5 py-3.5"><p class="text-[12px] font-medium">${c.franquiaPB.toLocaleString()} PB${c.franquiaCor?` • ${c.franquiaCor.toLocaleString()} COR`:''}</p></td><td class="px-5 py-3.5"><p class="font-bold text-[13px]">${fmtMoney(c.valorMensalFixo)}</p></td><td class="px-5 py-3.5"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase ${sm[c.status]||''}">${c.status}</span></td><td class="px-5 py-3.5"><button onclick="event.stopPropagation(); openModal('contrato','${c.id}')" class="w-8 h-8 grid place-items-center rounded-lg bg-white border"><i class="ph ph-pencil"></i></button></td></tr>`;}).join('')||'<tr><td colspan="6" class="p-12 text-center">Nenhum contrato</td></tr>';
  document.getElementById('resumo-contratos').innerHTML=`<div class="flex justify-between"><span>Mensalidade recorrente</span><b>${fmtMoney(db.contratos.filter(c=>c.empresaId===sess.empresaId && c.status==='ativo').reduce((s,c)=>s+c.valorMensalFixo,0))}</b></div><div class="flex justify-between pt-3 border-t border-white/20"><span class="font-semibold">Total carteira</span><b>${fmtMoney(db.contratos.filter(c=>c.empresaId===sess.empresaId && c.status==='ativo').reduce((s,c)=>s+c.valorMensalFixo*c.duracaoMeses,0))}</b></div>`;
  document.getElementById('list-contratos-vencendo').innerHTML=db.contratos.filter(c=>c.empresaId===sess.empresaId && ((new Date(c.dataFim)-new Date())/(1000*60*60*24)>0 && (new Date(c.dataFim)-new Date())/(1000*60*60*24)<60)).map(c=>{const cli=db.clientes.find(cl=>cl.id===c.clienteId); return `<div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-amber-100 text-amber-700 grid place-items-center"><i class="ph ph-clock"></i></div><div><p class="font-semibold text-[12.5px]">${c.numero}</p><p class="text-[11px] text-slate-500">${cli?.nome} • ${fmtDate(c.dataFim)}</p></div></div>`;}).join('')||'<p class="text-[12px] text-slate-500">Nenhum vencimento</p>';
}
function openContratoDetail(id){const c=db.contratos.find(x=>x.id===id); if(!c) return; const cli=db.clientes.find(cl=>cl.id===c.clienteId); const parque=db.parque.filter(p=>p.contratoId===id); const box=document.getElementById('contrato-detail'); box.classList.remove('hidden'); box.innerHTML=`<div class="p-6 border-b bg-slate-50/70 flex justify-between"><div><p class="font-mono text-[11px] font-bold text-[#0a1e8a]">${c.numero}</p><h3 class="font-bold text-[16px] mt-1">${cli?.nome} • ${c.status.toUpperCase()} • por ${c.criadoPorNome||'-'}</h3></div><div class="flex gap-2"><button onclick="openModal('contrato','${c.id}')" class="h-9 px-4 rounded-xl bg-white border text-[12px] font-semibold">Editar</button><button onclick="this.closest('#contrato-detail').classList.add('hidden')" class="w-9 h-9 grid place-items-center rounded-xl bg-white border"><i class="ph ph-x"></i></button></div></div><div class="p-6"><p class="text-[13px]">Franquia ${c.franquiaPB} PB / ${c.franquiaCor} COR • Valor ${fmtMoney(c.valorMensalFixo)} • Criado por ${c.criadoPorNome} em ${fmtDateTime(c.criadoEm)}</p><div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">${parque.map(p=>{const eq=db.equipamentos.find(e=>e.id===p.equipamentoId); return `<div class="border p-3 rounded-xl"><p class="font-semibold text-[12px]">${eq?.modelo} • ${p.setor}</p><p class="text-[11px] text-slate-500">por ${p.criadoPorNome||'-'}</p></div>`}).join('')}</div></div>`; }
function renderModalContrato(id){
  const sess=getSession(); const isEdit=!!id; const c=isEdit?db.contratos.find(x=>x.id===id && x.empresaId===sess.empresaId):{numero:'CT-'+new Date().getFullYear()+'-'+String(db.contratos.filter(x=>x.empresaId===sess.empresaId).length+1).padStart(4,'0'),clienteId:'',dataInicio:new Date().toISOString().slice(0,10),dataFim:new Date(new Date().setFullYear(new Date().getFullYear()+1)).toISOString().slice(0,10),diaVencimento:10,franquiaPB:3000,franquiaCor:0,valorMensalFixo:890,valorExcedentePB:0.08,valorExcedenteCor:0.45,status:'pendente',equipamentos:[],observacoes:''};
  const clientesOpts=db.clientes.filter(cl=>cl.empresaId===sess.empresaId).map(cl=>`<option value="${cl.id}" ${cl.id===c.clienteId?'selected':''}>${cl.nome}</option>`).join('');
  const equipOpts=db.equipamentos.filter(e=>e.empresaId===sess.empresaId && (e.status==='disponivel'||c.equipamentos.includes(e.id))).map(eq=>`<label class="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 border cursor-pointer"><input type="checkbox" value="${eq.id}" ${c.equipamentos.includes(eq.id)?'checked':''} class="f-ctr-eq"><div class="flex-1"><p class="text-[13px] font-medium">${eq.modelo} • ${eq.patrimonio}</p><p class="text-[11px] text-slate-500">${eq.serie} • criado por ${eq.criadoPorNome||'-'}</p></div></label>`).join('');
  document.getElementById('modal-title').innerText=isEdit?'Editar contrato':'Novo contrato';
  document.getElementById('modal-body').innerHTML=`<div class="space-y-4"><div class="grid grid-cols-3 gap-3"><div><label class="text-[11px] font-bold uppercase text-slate-500">Número</label><input id="f-ctr-num" value="${c.numero}" class="mt-1 w-full h-11 px-3 rounded-xl border bg-slate-50"></div><div class="col-span-2"><label class="text-[11px] font-bold uppercase text-slate-500">Cliente</label><select id="f-ctr-cli" class="mt-1 w-full h-11 px-3 rounded-xl border"><option value="">Selecione</option>${clientesOpts}</select></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Início</label><input id="f-ctr-ini" type="date" value="${c.dataInicio.slice(0,10)}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Fim</label><input id="f-ctr-fim" type="date" value="${c.dataFim.slice(0,10)}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Dia venc</label><input id="f-ctr-venc" type="number" value="${c.diaVencimento}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Franquia PB</label><input id="f-ctr-fpb" type="number" value="${c.franquiaPB}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Franquia Cor</label><input id="f-ctr-fcor" type="number" value="${c.franquiaCor}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Valor mensal</label><input id="f-ctr-vfix" type="number" step="0.01" value="${c.valorMensalFixo}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Equipamentos</label><div class="mt-2 max-h-[180px] overflow-auto border rounded-xl p-2 space-y-1 bg-slate-50/50">${equipOpts||'<p class="text-[12px] text-slate-500">Nenhum disponível</p>'}</div></div></div>`;
  document.getElementById('modal-footer').innerHTML=`<button onclick="closeModal()" class="h-11 px-5 rounded-xl bg-white border">Cancelar</button><button onclick="saveContrato()" class="h-11 px-6 rounded-xl bg-[#0a1e8a] text-white font-semibold">Salvar contrato</button>`;
}
function saveContrato(){
  const sess=getSession(); const id=window.modalContext?.id;
  const equipSelected=Array.from(document.querySelectorAll('.f-ctr-eq:checked')).map(el=>el.value);
  const payload={empresaId:sess.empresaId, numero:document.getElementById('f-ctr-num').value.trim(), clienteId:document.getElementById('f-ctr-cli').value, dataInicio:document.getElementById('f-ctr-ini').value, dataFim:document.getElementById('f-ctr-fim').value, diaVencimento:parseInt(document.getElementById('f-ctr-venc').value)||10, franquiaPB:parseInt(document.getElementById('f-ctr-fpb').value)||0, franquiaCor:parseInt(document.getElementById('f-ctr-fcor').value)||0, valorMensalFixo:parseFloat(document.getElementById('f-ctr-vfix').value)||0, valorFranquia:parseFloat(document.getElementById('f-ctr-vfix').value)||0, valorExcedentePB:0.08, valorExcedenteCor:0.45, status:'ativo', equipamentos:equipSelected, observacoes:''};
  const d1=new Date(payload.dataInicio), d2=new Date(payload.dataFim); payload.duracaoMeses=(d2.getFullYear()-d1.getFullYear())*12+(d2.getMonth()-d1.getMonth());
  if(!payload.clienteId) return toast('Selecione cliente','error');
  if(id){const ex=db.contratos.find(c=>c.id===id && c.empresaId===sess.empresaId); Object.assign(ex,payload,{atualizadoPor:sess.usuarioId, atualizadoPorNome:sess.usuarioNome}); logAction('contrato','editar',id,`Editado contrato ${payload.numero}`);}else{const novo={id:uid('ctr'),...payload, criadoEm:new Date().toISOString(), criadoPor:sess.usuarioId, criadoPorNome:sess.usuarioNome}; db.contratos.push(novo); logAction('contrato','criar',novo.id,`Criado contrato ${novo.numero}`); equipSelected.forEach(eqId=>{const eq=db.equipamentos.find(e=>e.id===eqId); if(eq) eq.status='locado'; const exists=db.parque.find(p=>p.contratoId===novo.id && p.equipamentoId===eqId); if(!exists){db.parque.push({id:uid('prk'),empresaId:sess.empresaId,contratoId:novo.id,clienteId:payload.clienteId,equipamentoId:eqId,setor:'A definir',enderecoInstalacao:db.clientes.find(c=>c.id===payload.clienteId)?.endereco||'',dataInstalacao:new Date().toISOString(),contadorInicialPB:eq?.contadorPB||0,contadorInicialCor:eq?.contadorCor||0,status:'ativo',criadoPor:sess.usuarioId,criadoPorNome:sess.usuarioNome});}});}
  saveDB(); renderContratos(); renderParque(); renderEquipamentos(); closeModal(); toast('Contrato salvo','success'); renderAuditoria();
}

// Resto - Parque, Leituras, OS, Vendas, Financeiro - versões simplificadas com auditoria
function renderParque(){
  const sess=getSession(); if(!sess) return;
  const search=(document.getElementById('search-parque')?.value||'').toLowerCase(); const cliFilter=document.getElementById('filter-parque-cliente')?.value||'';
  let list=db.parque.filter(p=>p.empresaId===sess.empresaId && p.status==='ativo' && (!cliFilter||p.clienteId===cliFilter) && (!search|| (db.clientes.find(c=>c.id===p.clienteId)?.nome||'').toLowerCase().includes(search) || (db.equipamentos.find(e=>e.id===p.equipamentoId)?.modelo||'').toLowerCase().includes(search) || p.setor.toLowerCase().includes(search)));
  const grouped={}; list.forEach(p=>{ (grouped[p.clienteId]=grouped[p.clienteId]||[]).push(p); });
  document.getElementById('grid-parque').innerHTML=Object.keys(grouped).map(cliId=>{const cli=db.clientes.find(c=>c.id===cliId); const items=grouped[cliId]; return `<div class="rounded-[16px] bg-white border shadow-sm overflow-hidden"><div class="p-4 border-b bg-slate-50/70 flex items-center justify-between"><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-xl bg-[#0a1e8a] text-white grid place-items-center font-bold text-[12px]">${initials(cli?.nome||'?')}</div><div><p class="font-bold text-[13.5px]">${cli?.nome}</p><p class="text-[11px] text-slate-500">${items.length} equip • por ${items[0]?.criadoPorNome||'-'}</p></div></div></div><div class="divide-y">${items.map(p=>{const eq=db.equipamentos.find(e=>e.id===p.equipamentoId); const leit=db.leituras.filter(l=>l.parqueId===p.id).sort((a,b)=>new Date(b.dataLeitura)-new Date(a.dataLeitura))[0]; return `<div class="p-4 flex items-start gap-3 hover:bg-slate-50/70"><div class="w-10 h-10 rounded-xl bg-[#e8eaf8] text-[#0a1e8a] grid place-items-center"><i class="ph ph-printer"></i></div><div class="flex-1"><p class="font-semibold text-[13px]">${eq?.modelo} • ${eq?.patrimonio}</p><p class="text-[11.5px] text-slate-500">Setor: ${p.setor} • criado por ${p.criadoPorNome||'-'}</p><p class="text-[11px] text-slate-400">PB: ${(leit?leit.contadorPB:eq?.contadorPB||0).toLocaleString()} • COR: ${(leit?leit.contadorCor:eq?.contadorCor||0).toLocaleString()}</p></div></div>`}).join('')}</div></div>`}).join('')||'<div class="p-12 text-center bg-white border rounded-[16px] text-slate-500">Nenhum parque</div>';
}
function renderLeituras(){
  const sess=getSession(); if(!sess) return;
  document.getElementById('tbody-leituras').innerHTML=db.leituras.filter(l=>l.empresaId===sess.empresaId).sort((a,b)=>new Date(b.dataLeitura)-new Date(a.dataLeitura)).slice(0,20).map(l=>{const cli=db.clientes.find(c=>c.id===l.clienteId); const eq=db.equipamentos.find(e=>e.id===l.equipamentoId); return `<tr class="hover:bg-slate-50"><td class="px-4 py-3"><p class="font-semibold text-[12.5px]">${cli?.nome}</p><p class="text-[11px] text-slate-500">${eq?.modelo} • ${fmtDate(l.dataLeitura)} • por <b>${l.criadoPorNome||'-'}</b></p></td><td class="px-4 py-3 font-mono text-[11px]">PB ${l.contadorPBAnterior}→${l.contadorPB}<br>COR ${l.contadorCorAnterior}→${l.contadorCor}</td><td class="px-4 py-3">${l.consumoPB} PB / ${l.consumoCor} COR</td><td class="px-4 py-3">${fmtMoney(l.valorExcedente)}</td><td class="px-4 py-3"><span class="px-2 py-1 rounded-full text-[11px] font-bold border ${l.status==='pendente'?'bg-amber-50 text-amber-700 border-amber-200':'bg-emerald-50 text-emerald-700'}">${l.status}</span></td><td class="px-4 py-3"><button onclick="openModal('leitura','${l.id}')" class="w-7 h-7 grid place-items-center rounded-lg hover:bg-slate-100"><i class="ph ph-pencil"></i></button></td></tr>`}).join('');
  document.getElementById('list-divergencias').innerHTML='<p class="text-[12px] text-amber-800">Nenhuma divergência</p>';
  const sel=document.getElementById('coleta-contrato'); if(sel && !sel.innerHTML.includes('CT-')){sel.innerHTML='<option value="">Selecione o contrato</option>'+db.contratos.filter(c=>c.empresaId===sess.empresaId && c.status==='ativo').map(c=>{const cli=db.clientes.find(cl=>cl.id===c.clienteId); return `<option value="${c.id}">${c.numero} - ${cli?.nome}</option>`}).join('');}
}
function loadColetaForm(){/* stub ja tem sistema anterior, manter simples */ const ctrId=document.getElementById('coleta-contrato').value; const cont=document.getElementById('coleta-form'); if(!ctrId){cont.innerHTML=''; return;} const parques=db.parque.filter(p=>p.contratoId===ctrId && p.status==='ativo'); cont.innerHTML=parques.map(p=>{const eq=db.equipamentos.find(e=>e.id===p.equipamentoId); return `<div class="border p-3 rounded-xl bg-white"><p class="font-semibold text-[12.5px]">${eq?.modelo} • ${p.setor} • por ${p.criadoPorNome||'-'}</p><div class="mt-2 grid grid-cols-2 gap-2"><input id="c_pb_${p.id}" type="number" value="${eq?.contadorPB||0}" class="h-9 px-2 rounded-lg border text-[12px]" placeholder="PB"><input id="c_cor_${p.id}" type="number" value="${eq?.contadorCor||0}" class="h-9 px-2 rounded-lg border text-[12px]" placeholder="COR"></div><button onclick="saveLeituraRapida('${p.id}')" class="mt-2 w-full h-8 rounded-lg bg-[#0a1e8a] text-white text-[11px] font-semibold">Salvar leitura</button></div>`}).join('');}
function saveLeituraRapida(parqueId){const sess=getSession(); const parque=db.parque.find(p=>p.id===parqueId); const pb=parseInt(document.getElementById('c_pb_'+parqueId).value)||0; const cor=parseInt(document.getElementById('c_cor_'+parqueId).value)||0; const contrato=db.contratos.find(c=>c.id===parque.contratoId); const ultima=db.leituras.filter(l=>l.parqueId===parqueId).sort((a,b)=>new Date(b.dataLeitura)-new Date(a.dataLeitura))[0]; const antPB=ultima?ultima.contadorPB:parque.contadorInicialPB; const antCor=ultima?ultima.contadorCor:parque.contadorInicialCor; const consPB=pb-antPB, consCor=cor-antCor; const valor=Math.max(0,consPB-(contrato?.franquiaPB||0))*(contrato?.valorExcedentePB||0)+Math.max(0,consCor-(contrato?.franquiaCor||0))*(contrato?.valorExcedenteCor||0); db.leituras.push({id:uid('lei'),empresaId:sess.empresaId,parqueId,equipamentoId:parque.equipamentoId,contratoId:parque.contratoId,clienteId:parque.clienteId,dataLeitura:new Date().toISOString(),contadorPB:pb,contadorCor:cor,contadorPBAnterior:antPB,contadorCorAnterior:antCor,consumoPB:consPB,consumoCor:consCor,valorExcedente:valor,faturar:valor>0,status:consPB<0?'divergencia':'pendente',criadoPor:sess.usuarioId,criadoPorNome:sess.usuarioNome}); const eq=db.equipamentos.find(e=>e.id===parque.equipamentoId); if(eq){eq.contadorPB=Math.max(eq.contadorPB,pb); eq.contadorCor=Math.max(eq.contadorCor,cor);} logAction('leitura','criar',parqueId,`Leitura PB ${pb} COR ${cor} por ${sess.usuarioNome}`); saveDB(); renderLeituras(); loadColetaForm(); toast('Leitura salva','success');}

function renderModalLeitura(id){
  const sess=getSession(); const isEdit=!!id; const l=isEdit?db.leituras.find(x=>x.id===id && x.empresaId===sess.empresaId):{parqueId:'',contadorPB:0,contadorCor:0,dataLeitura:new Date().toISOString().slice(0,16)};
  const parqueOptions=db.parque.filter(p=>p.empresaId===sess.empresaId && p.status==='ativo').map(p=>{const cli=db.clientes.find(c=>c.id===p.clienteId); const eq=db.equipamentos.find(e=>e.id===p.equipamentoId); return `<option value="${p.id}" ${p.id===l.parqueId?'selected':''}>${cli?.nome} • ${eq?.modelo} • ${p.setor}</option>`;}).join('');
  document.getElementById('modal-title').innerText=isEdit?'Editar leitura':'Nova leitura';
  document.getElementById('modal-body').innerHTML=`<div class="space-y-4"><div><label class="text-[11px] font-bold uppercase text-slate-500">Parque</label><select id="f-lei-parque" class="mt-1 w-full h-11 px-3 rounded-xl border"><option value="">Selecione</option>${parqueOptions}</select></div><div class="grid grid-cols-2 gap-4"><div><label class="text-[11px] font-bold uppercase text-slate-500">Contador PB</label><input id="f-lei-pb" type="number" value="${l.contadorPB||0}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Contador Cor</label><input id="f-lei-cor" type="number" value="${l.contadorCor||0}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Data</label><input id="f-lei-data" type="datetime-local" value="${(l.dataLeitura||new Date().toISOString()).slice(0,16)}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div class="rounded-xl bg-[#e8eaf8] border border-[#c9ceef] p-3 text-[11px] text-[#0a1e8a]">Criado por <b>${sess.usuarioNome}</b> será registrado.</div></div>`;
  document.getElementById('modal-footer').innerHTML=`<button onclick="closeModal()" class="h-11 px-5 rounded-xl bg-white border">Cancelar</button><button onclick="saveLeitura()" class="h-11 px-6 rounded-xl bg-[#0a1e8a] text-white font-semibold">Salvar leitura</button>`;
}
function saveLeitura(){const sess=getSession(); const id=window.modalContext?.id; const parqueId=document.getElementById('f-lei-parque').value; if(!parqueId) return toast('Selecione parque','error'); const parque=db.parque.find(p=>p.id===parqueId); const contrato=db.contratos.find(c=>c.id===parque.contratoId); const cntPB=parseInt(document.getElementById('f-lei-pb').value)||0; const cntCor=parseInt(document.getElementById('f-lei-cor').value)||0; const ultima=db.leituras.filter(l=>l.parqueId===parqueId).sort((a,b)=>new Date(b.dataLeitura)-new Date(a.dataLeitura))[0]; const antPB=ultima?ultima.contadorPB:parque.contadorInicialPB; const antCor=ultima?ultima.contadorCor:parque.contadorInicialCor; const consPB=cntPB-antPB; const consCor=cntCor-antCor; const excPB=Math.max(0, consPB-(contrato?.franquiaPB||0)); const excCor=Math.max(0, consCor-(contrato?.franquiaCor||0)); const valor=excPB*(contrato?.valorExcedentePB||0)+excCor*(contrato?.valorExcedenteCor||0); const payload={empresaId:sess.empresaId,parqueId,equipamentoId:parque.equipamentoId,contratoId:parque.contratoId,clienteId:parque.clienteId,dataLeitura:document.getElementById('f-lei-data').value,contadorPB:cntPB,contadorCor:cntCor,contadorPBAnterior:antPB,contadorCorAnterior:antCor,consumoPB:consPB,consumoCor:consCor,valorExcedente:valor,faturar:valor>0,status:consPB<0?'divergencia':'pendente'}; if(id){Object.assign(db.leituras.find(l=>l.id===id && l.empresaId===sess.empresaId),payload); logAction('leitura','editar',id,`Editado leitura PB ${cntPB}`);}else{const novo={id:uid('lei'),...payload, criadoPor:sess.usuarioId, criadoPorNome:sess.usuarioNome, criadoEm:new Date().toISOString()}; db.leituras.push(novo); logAction('leitura','criar',novo.id,`Criada leitura PB ${cntPB} por ${sess.usuarioNome}`);} const eq=db.equipamentos.find(e=>e.id===parque.equipamentoId); if(eq){eq.contadorPB=Math.max(eq.contadorPB,cntPB); eq.contadorCor=Math.max(eq.contadorCor,cntCor);} saveDB(); renderLeituras(); closeModal(); toast('Leitura registrada','success'); renderAuditoria();}

// OS, Vendas, Financeiro - versões rápidas com auditoria
let osViewMode='kanban';
function toggleOsView(){osViewMode=osViewMode==='kanban'?'list':'kanban'; renderOs();}
function renderOs(){
  const sess=getSession(); if(!sess) return;
  const search=(document.getElementById('search-os')?.value||'').toLowerCase(); const status=document.getElementById('filter-os-status')?.value||'';
  let list=db.os.filter(o=>o.empresaId===sess.empresaId && (!search||o.numero.toLowerCase().includes(search)||(db.clientes.find(c=>c.id===o.clienteId)?.nome||'').toLowerCase().includes(search)||o.descricao.toLowerCase().includes(search)) && (!status||o.status===status)).sort((a,b)=>new Date(b.dataAbertura)-new Date(a.dataAbertura));
  document.getElementById('os-kanban').classList.toggle('hidden', osViewMode!=='kanban'); document.getElementById('os-list').classList.toggle('hidden', osViewMode!=='list'); const btn=document.getElementById('btn-os-kanban'); if(btn) btn.innerText=osViewMode==='kanban'?'Lista':'Kanban';
  if(osViewMode==='kanban'){
    const cols=[{id:'aberto',label:'Aberto',color:'border-slate-200 bg-slate-50'},{id:'em_atendimento',label:'Em atendimento',color:'border-blue-200 bg-blue-50/50'},{id:'aguardando_peca',label:'Aguardando peça',color:'border-amber-200 bg-amber-50/50'},{id:'concluido',label:'Concluído',color:'border-emerald-200 bg-emerald-50/50'}];
    document.getElementById('os-kanban').innerHTML=cols.map(col=>{const items=list.filter(o=>o.status===col.id); return `<div class="rounded-[16px] border ${col.color} p-3 flex flex-col"><div class="flex items-center justify-between mb-3"><h4 class="font-bold text-[12px] uppercase">${col.label}</h4><span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border">${items.length}</span></div><div class="space-y-3 flex-1 overflow-auto" style="min-height:400px">${items.map(o=>{const cli=db.clientes.find(c=>c.id===o.clienteId); return `<div class="rounded-xl bg-white border p-3 shadow-sm hover:shadow-md cursor-pointer" onclick="openModal('os','${o.id}')"><div class="flex justify-between"><span class="font-mono text-[11px] font-bold text-slate-500">${o.numero}</span><span class="text-[10px] px-2 py-0.5 rounded-full bg-[#e8eaf8] text-[#0a1e8a] font-bold uppercase">${o.prioridade}</span></div><p class="font-semibold text-[13px] mt-2">${cli?.nome}</p><p class="text-[11px] text-slate-600 mt-1 line-clamp-2">${o.descricao}</p><p class="text-[11px] text-slate-400 mt-2">por ${o.criadoPorNome||'-'} • ${fmtDate(o.dataAbertura)}</p></div>`;}).join('')||'<p class="text-[12px] text-slate-400 p-4 text-center">Vazio</p>'}</div></div>`;}).join('');
  } else {
    document.getElementById('tbody-os').innerHTML=list.map(o=>{const cli=db.clientes.find(c=>c.id===o.clienteId); const sm={aberto:'bg-[#0a1e8a] text-white', em_atendimento:'bg-blue-600 text-white', aguardando_peca:'bg-amber-500 text-white', concluido:'bg-emerald-600 text-white'}; const slaHoras=Math.floor((Date.now()-new Date(o.dataAbertura))/(1000*60*60)); return `<tr class="hover:bg-slate-50"><td class="px-5 py-3"><p class="font-mono text-[11px] font-bold">${o.numero}</p><p class="font-semibold text-[12.5px]">${cli?.nome}</p><p class="text-[11px] text-slate-500">por ${o.criadoPorNome||'-'}</p></td><td class="px-5 py-3"><p class="text-[12px] capitalize">${o.tipo}</p><span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 border font-bold uppercase">${o.prioridade}</span></td><td class="px-5 py-3"><p class="text-[12px]">${db.tecnicos.find(t=>t.id===o.tecnico)?.nome||'—'}</p></td><td class="px-5 py-3"><p class="text-[12px] font-mono">${slaHoras}h</p></td><td class="px-5 py-3"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${sm[o.status]||'bg-slate-100'}">${o.status.replace('_',' ')}</span></td><td class="px-5 py-3"><button onclick="openModal('os','${o.id}')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-slate-100"><i class="ph ph-pencil"></i></button></td></tr>`;}).join('');
  }
}
function renderModalOS(id){
  const sess=getSession(); const isEdit=!!id; const o=isEdit?db.os.find(x=>x.id===id && x.empresaId===sess.empresaId):{clienteId:'',parqueId:'',equipamentoId:'',tipo:'corretiva',prioridade:'media',descricao:'',tecnico:'',status:'aberto'};
  const clienteOpts=db.clientes.filter(c=>c.empresaId===sess.empresaId).map(c=>`<option value="${c.id}" ${c.id===o.clienteId?'selected':''}>${c.nome}</option>`).join('');
  const parqueOpts=db.parque.filter(p=>p.empresaId===sess.empresaId && (!o.clienteId||p.clienteId===o.clienteId)).map(p=>{const eq=db.equipamentos.find(e=>e.id===p.equipamentoId); return `<option value="${p.id}" ${p.id===o.parqueId?'selected':''}>${eq?.modelo} - ${p.setor}</option>`;}).join('');
  const tecOpts=db.tecnicos.map(t=>`<option value="${t.id}" ${t.id===o.tecnico?'selected':''}>${t.nome}</option>`).join('');
  document.getElementById('modal-title').innerText=isEdit?'Editar chamado':'Abrir chamado';
  document.getElementById('modal-body').innerHTML=`<div class="space-y-4"><div class="grid grid-cols-2 gap-4"><div class="col-span-2"><label class="text-[11px] font-bold uppercase text-slate-500">Cliente</label><select id="f-os-cli" class="mt-1 w-full h-11 px-3 rounded-xl border"><option value="">Selecione</option>${clienteOpts}</select></div><div class="col-span-2"><label class="text-[11px] font-bold uppercase text-slate-500">Parque / Equipamento (opcional)</label><select id="f-os-parque" class="mt-1 w-full h-11 px-3 rounded-xl border"><option value="">Avulso</option>${parqueOpts}</select></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Tipo</label><select id="f-os-tipo" class="mt-1 w-full h-11 px-3 rounded-xl border"><option value="corretiva">Corretiva</option><option value="preventiva">Preventiva</option><option value="instalacao">Instalação</option><option value="remocao">Remoção</option><option value="suprimento">Suprimento</option></select></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Prioridade</label><select id="f-os-prio" class="mt-1 w-full h-11 px-3 rounded-xl border"><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option><option value="critica">Crítica</option></select></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Técnico</label><select id="f-os-tec" class="mt-1 w-full h-11 px-3 rounded-xl border"><option value="">A definir</option>${tecOpts}</select></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Status</label><select id="f-os-status" class="mt-1 w-full h-11 px-3 rounded-xl border"><option value="aberto">Aberto</option><option value="em_atendimento">Em atendimento</option><option value="aguardando_peca">Aguardando peça</option><option value="concluido">Concluído</option></select></div><div class="col-span-2"><label class="text-[11px] font-bold uppercase text-slate-500">Descrição</label><textarea id="f-os-desc" rows="3" class="mt-1 w-full px-3 py-2 rounded-xl border">${o.descricao||''}</textarea></div></div><div class="rounded-xl bg-[#e8eaf8] border border-[#c9ceef] p-3 text-[11px] text-[#0a1e8a]">Aberto por <b>${sess.usuarioNome}</b> será auditado.</div></div>`;
  document.getElementById('f-os-tipo').value=o.tipo||'corretiva'; document.getElementById('f-os-prio').value=o.prioridade||'media'; document.getElementById('f-os-status').value=o.status||'aberto';
  setTimeout(()=>{const cliEl=document.getElementById('f-os-cli'); if(cliEl) cliEl.addEventListener('change',e=>{const cli=e.target.value; const parques=db.parque.filter(p=>p.empresaId===sess.empresaId && p.clienteId===cli); document.getElementById('f-os-parque').innerHTML='<option value="">Avulso</option>'+parques.map(p=>{const eq=db.equipamentos.find(eq=>eq.id===p.equipamentoId); return `<option value="${p.id}">${eq?.modelo} - ${p.setor}</option>`;}).join('');});},50);
  document.getElementById('modal-footer').innerHTML=`<button onclick="closeModal()" class="h-11 px-5 rounded-xl bg-white border">Cancelar</button><button onclick="saveOS()" class="h-11 px-6 rounded-xl bg-[#0a1e8a] text-white font-semibold">${isEdit?'Salvar':'Abrir chamado'}</button>`;
}
function saveOS(){
  const sess=getSession(); const id=window.modalContext?.id; const parqueId=document.getElementById('f-os-parque').value; const parque=parqueId?db.parque.find(p=>p.id===parqueId):null;
  const payload={empresaId:sess.empresaId, clienteId:document.getElementById('f-os-cli').value, parqueId:parqueId||null, equipamentoId:parque?.equipamentoId||null, tipo:document.getElementById('f-os-tipo').value, prioridade:document.getElementById('f-os-prio').value, tecnico:document.getElementById('f-os-tec').value, status:document.getElementById('f-os-status').value, descricao:document.getElementById('f-os-desc').value.trim()};
  if(!payload.clienteId) return toast('Selecione cliente','error'); if(!payload.descricao) return toast('Descreva problema','error');
  if(id){const os=db.os.find(o=>o.id===id && o.empresaId===sess.empresaId); Object.assign(os,payload,{atualizadoPor:sess.usuarioId, atualizadoPorNome:sess.usuarioNome}); if(payload.status==='concluido'&&!os.dataFechamento) os.dataFechamento=new Date().toISOString(); logAction('os','editar',id,`Editado OS ${os.numero} para ${payload.status}`);}else{const novo={id:uid('os'),empresaId:sess.empresaId,numero:'OS-'+new Date().getFullYear()+'-'+String(db.os.filter(o=>o.empresaId===sess.empresaId).length+1).padStart(4,'0'),dataAbertura:new Date().toISOString(),dataFechamento:payload.status==='concluido'?new Date().toISOString():null,custoPecas:0,tempoAtendimento:0,criadoPor:sess.usuarioId,criadoPorNome:sess.usuarioNome,criadoEm:new Date().toISOString(),...payload}; db.os.push(novo); logAction('os','criar',novo.id,`Criado OS ${novo.numero} por ${sess.usuarioNome}`);}
  saveDB(); renderOs(); closeModal(); toast('Chamado salvo','success'); buildNav(); renderAuditoria();
}

function renderVendas(){
  const sess=getSession(); if(!sess) return;
  const search=(document.getElementById('search-vendas')?.value||'').toLowerCase(); let list=db.vendas.filter(v=>v.empresaId===sess.empresaId && (!search||v.numero.toLowerCase().includes(search)||(db.clientes.find(c=>c.id===v.clienteId)?.nome||'').toLowerCase().includes(search))).sort((a,b)=>new Date(b.data)-new Date(a.data));
  document.getElementById('tbody-vendas').innerHTML=list.map(v=>{const cli=db.clientes.find(c=>c.id===v.clienteId); return `<tr class="hover:bg-slate-50 cursor-pointer" onclick="showVenda('${v.id}')"><td class="px-5 py-3"><p class="font-mono text-[11px] font-bold text-[#0a1e8a]">${v.numero}</p><p class="font-semibold text-[12.5px]">${cli?.nome}</p><p class="text-[11px] text-slate-500">por <b>${v.criadoPorNome||'-'}</b> • ${fmtDate(v.data)}</p></td><td class="px-5 py-3"><p class="text-[12px]">${v.itens.length} itens</p><p class="font-bold text-[13px]">${fmtMoney(v.total)}</p></td><td class="px-5 py-3"><p class="text-[12px]">${v.formaPagamento}</p></td><td class="px-5 py-3"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${v.status==='faturado'?'bg-emerald-50 text-emerald-700 border':'bg-amber-50 text-amber-700 border'}">${v.status}</span></td><td class="px-5 py-3"><button onclick="event.stopPropagation(); deleteVenda('${v.id}')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><i class="ph ph-trash"></i></button></td></tr>`;}).join('');
}
function showVenda(id){const v=db.vendas.find(x=>x.id===id); if(!v) return; const cli=db.clientes.find(c=>c.id===v.clienteId); document.getElementById('venda-detail').innerHTML=`<div class="flex justify-between"><div><p class="font-mono text-[11px] font-bold text-[#0a1e8a]">${v.numero}</p><h3 class="font-bold text-[16px] mt-1">${cli?.nome}</h3><p class="text-[12px] text-slate-500">por ${v.criadoPorNome||'-'} • ${fmtDateTime(v.data)} • ${v.formaPagamento}</p></div><span class="px-3 py-1 rounded-full text-[11px] font-bold uppercase border bg-slate-50">${v.status}</span></div><div class="mt-6 space-y-2">${v.itens.map(it=>{const p=db.produtos.find(pr=>pr.id===it.produtoId); return `<div class="flex justify-between items-center p-3 rounded-xl border bg-slate-50/70"><div><p class="font-semibold text-[13px]">${p?.nome||'Produto removido'}</p><p class="text-[11px] text-slate-500">${it.qtd} x ${fmtMoney(it.preco)}</p></div><b class="text-[13px]">${fmtMoney(it.subtotal)}</b></div>`}).join('')}</div><div class="mt-6 border-t pt-4 space-y-2 text-[13px]"><div class="flex justify-between font-bold text-[16px] pt-2 border-t"><span>Total</span><span>${fmtMoney(v.total)}</span></div><p class="text-[11px] text-slate-500">Criado por ${v.criadoPorNome||'-'} em ${fmtDateTime(v.data||v.criadoEm)}</p></div><div class="mt-6 grid grid-cols-2 gap-2"><button onclick="faturarVenda('${v.id}')" class="h-11 rounded-xl bg-[#0a1e8a] text-white font-semibold text-[13px]">Faturar venda</button><button onclick="toast('PDF','info')" class="h-11 rounded-xl bg-white border font-semibold text-[13px]">Imprimir</button></div>`;}
function novaVenda(){
  const sess=getSession(); const cliOpts=db.clientes.filter(c=>c.empresaId===sess.empresaId).map(c=>`<option value="${c.id}">${c.nome}</option>`).join(''); const prodOpts=db.produtos.filter(p=>p.empresaId===sess.empresaId).map(p=>`<option value="${p.id}">${p.sku} - ${p.nome} • ${fmtMoney(p.preco)} • est ${p.estoque}</option>`).join('');
  document.getElementById('modal-title').innerText='Nova venda / Orçamento';
  document.getElementById('modal-body').innerHTML=`<div class="space-y-4"><div class="grid grid-cols-2 gap-4"><div><label class="text-[11px] font-bold uppercase text-slate-500">Cliente</label><select id="nv-cli" class="mt-1 w-full h-11 px-3 rounded-xl border"><option value="">Selecione</option>${cliOpts}</select></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Pagamento</label><select id="nv-pag" class="mt-1 w-full h-11 px-3 rounded-xl border"><option>Boleto 30d</option><option>PIX à vista</option><option>Cartão crédito</option><option>Dinheiro</option><option>Faturado 14d</option></select></div></div><div class="rounded-[14px] border bg-slate-50 p-3"><div class="flex gap-2"><select id="nv-prod" class="flex-1 h-10 px-3 rounded-xl border bg-white text-[13px]"><option value="">Produto</option>${prodOpts}</select><input id="nv-qtd" type="number" value="1" min="1" class="w-20 h-10 px-3 rounded-xl border text-[13px]"><button onclick="addItemVendaTemp()" class="h-10 px-4 rounded-xl bg-slate-900 text-white text-[12px] font-semibold">Add</button></div><div id="nv-itens" class="mt-3 space-y-2 max-h-[200px] overflow-auto"></div><div class="mt-3 flex justify-between items-center text-[13px]"><span>Total:</span><b id="nv-total" class="text-[18px]">R$ 0,00</b></div></div><div class="grid grid-cols-2 gap-3"><div><label class="text-[11px] font-bold uppercase text-slate-500">Desconto R$</label><input id="nv-desc" type="number" step="0.01" value="0" class="mt-1 w-full h-11 px-3 rounded-xl border" oninput="updateVendaTotal()"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Status</label><select id="nv-status" class="mt-1 w-full h-11 px-3 rounded-xl border"><option value="orcamento">Orçamento</option><option value="aprovado">Aprovado</option><option value="faturado">Faturado</option></select></div></div><div class="rounded-xl bg-[#e8eaf8] border border-[#c9ceef] p-3 text-[11px] text-[#0a1e8a]">Venda será registrada como criada por <b>${sess.usuarioNome}</b></div></div>`;
  document.getElementById('modal-footer').innerHTML=`<button onclick="closeModal()" class="h-11 px-5 rounded-xl bg-white border">Cancelar</button><button onclick="saveVenda()" class="h-11 px-6 rounded-xl bg-[#0a1e8a] text-white font-semibold">Salvar venda</button>`;
  window.itensTemp=[];
  window.addItemVendaTemp=function(){const prodId=document.getElementById('nv-prod').value; const qtd=parseInt(document.getElementById('nv-qtd').value)||1; if(!prodId) return toast('Selecione produto','error'); const p=db.produtos.find(x=>x.id===prodId); if(p.estoque<qtd && p.categoria!=='Serviço') return toast(`Estoque insuficiente (${p.estoque})`,'error'); const ex=window.itensTemp.find(i=>i.produtoId===prodId); if(ex){ex.qtd+=qtd; ex.subtotal=ex.qtd*ex.preco;}else window.itensTemp.push({produtoId:prodId,qtd,preco:p.preco,subtotal:qtd*p.preco}); renderItensTemp(); updateVendaTotal();};
  window.renderItensTemp=function(){document.getElementById('nv-itens').innerHTML=window.itensTemp.map((it,idx)=>{const p=db.produtos.find(x=>x.id===it.produtoId); return `<div class="flex justify-between items-center p-2 rounded-xl bg-white border text-[12.5px]"><span>${p?.nome} • ${it.qtd}x ${fmtMoney(it.preco)}</span><div class="flex items-center gap-2"><b>${fmtMoney(it.subtotal)}</b><button onclick="window.itensTemp.splice(${idx},1); renderItensTemp(); updateVendaTotal()" class="w-6 h-6 grid place-items-center rounded-lg bg-red-50 text-red-600"><i class="ph ph-x"></i></button></div></div>`}).join('')||'<p class="text-[12px] text-slate-500 text-center py-2">Nenhum item</p>';};
  window.updateVendaTotal=function(){const sub=window.itensTemp.reduce((s,i)=>s+i.subtotal,0); const desc=parseFloat(document.getElementById('nv-desc').value)||0; document.getElementById('nv-total').innerText=fmtMoney(sub-desc);};
  window.saveVenda=function(){const cliId=document.getElementById('nv-cli').value; if(!cliId) return toast('Selecione cliente','error'); if(!window.itensTemp.length) return toast('Adicione itens','error'); const desc=parseFloat(document.getElementById('nv-desc').value)||0; const total=window.itensTemp.reduce((s,i)=>s+i.subtotal,0)-desc; const venda={id:uid('vda'),empresaId:sess.empresaId,numero:'VD-'+new Date().getFullYear()+'-'+String(db.vendas.filter(v=>v.empresaId===sess.empresaId).length+1).padStart(4,'0'),clienteId:cliId,data:new Date().toISOString(),itens:[...window.itensTemp],desconto:desc,total,formaPagamento:document.getElementById('nv-pag').value,status:document.getElementById('nv-status').value, criadoPor:sess.usuarioId, criadoPorNome:sess.usuarioNome, criadoEm:new Date().toISOString()}; venda.itens.forEach(it=>{const p=db.produtos.find(x=>x.id===it.produtoId); if(p && p.categoria!=='Serviço') p.estoque-=it.qtd;}); db.vendas.push(venda); logAction('venda','criar',venda.id,`Venda ${venda.numero} total ${fmtMoney(venda.total)} por ${sess.usuarioNome}`); if(venda.status==='faturado'){db.contasReceber.push({id:uid('cr'),empresaId:sess.empresaId,origem:'venda',clienteId:cliId,descricao:`Venda ${venda.numero} • ${venda.itens.length} itens`,valor:total,vencimento:new Date(Date.now()+1000*60*60*24*14).toISOString(),pagamentoData:null,status:'aberto',contratoId:null,leituraId:null,vendaId:venda.id, criadoPor:sess.usuarioId, criadoPorNome:sess.usuarioNome});} saveDB(); renderVendas(); renderProdutos(); renderFinanceiro(); renderAuditoria(); closeModal(); toast('Venda salva','success');};
  document.getElementById('modal-root').classList.remove('hidden'); window.modalContext={type:'venda'};
}
function faturarVenda(id){const sess=getSession(); const v=db.vendas.find(x=>x.id===id && x.empresaId===sess.empresaId); if(!v) return; if(v.status==='faturado') return toast('Já faturado','error'); v.status='faturado'; db.contasReceber.push({id:uid('cr'),empresaId:sess.empresaId,origem:'venda',clienteId:v.clienteId,descricao:`Venda ${v.numero}`,valor:v.total,vencimento:new Date(Date.now()+1000*60*60*24*14).toISOString(),pagamentoData:null,status:'aberto',contratoId:null,leituraId:null,vendaId:v.id, criadoPor:sess.usuarioId, criadoPorNome:sess.usuarioNome}); logAction('venda','faturar',id,`Faturada venda ${v.numero} por ${sess.usuarioNome}`); saveDB(); renderVendas(); renderFinanceiro(); showVenda(id); renderAuditoria(); toast('Venda faturada','success');}
function deleteVenda(id){const sess=getSession(); if(confirm('Excluir venda? Estoque estornado.')){const v=db.vendas.find(x=>x.id===id && x.empresaId===sess.empresaId); if(v){v.itens.forEach(it=>{const p=db.produtos.find(x=>x.id===it.produtoId); if(p) p.estoque+=it.qtd;}); db.vendas=db.vendas.filter(x=>!(x.id===id && x.empresaId===sess.empresaId)); logAction('venda','excluir',id,`Excluída venda ${v.numero} por ${sess.usuarioNome}`); saveDB(); renderVendas(); renderProdutos(); document.getElementById('venda-detail').innerHTML='<div class="text-center py-20 text-slate-400 text-[13px]">Venda excluída</div>'; toast('Venda excluída','success'); renderAuditoria();}}}

function setFinTab(tab){document.querySelectorAll('.fin-tab').forEach(b=>{b.classList.remove('bg-[#0a1e8a]','text-white'); b.classList.add('bg-white','border','border-slate-200');}); document.querySelector(`[data-fintab="${tab}"]`).classList.add('bg-[#0a1e8a]','text-white'); document.querySelector(`[data-fintab="${tab}"]`).classList.remove('bg-white','border'); document.querySelectorAll('.fin-panel').forEach(p=>p.classList.add('hidden')); document.getElementById('fin-'+tab).classList.remove('hidden'); if(tab==='visao') renderFluxoChart();}
function renderFinanceiro(){
  const sess=getSession(); if(!sess) return;
  const totalReceberMes=db.contasReceber.filter(cr=>cr.empresaId===sess.empresaId && new Date(cr.vencimento).getMonth()===new Date().getMonth() && new Date(cr.vencimento).getFullYear()===new Date().getFullYear()).reduce((s,c)=>s+c.valor,0);
  const totalPagarMes=db.contasPagar.filter(cp=>cp.empresaId===sess.empresaId && new Date(cp.vencimento).getMonth()===new Date().getMonth() && new Date(cp.vencimento).getFullYear()===new Date().getFullYear()).reduce((s,c)=>s+c.valor,0);
  document.getElementById('fin-receber-mes').innerText=fmtMoney(totalReceberMes); document.getElementById('fin-pagar-mes').innerText=fmtMoney(totalPagarMes); document.getElementById('fin-saldo').innerText=fmtMoney(totalReceberMes-totalPagarMes);
  const statusCR=document.getElementById('filter-cr-status')?.value||''; let listCR=db.contasReceber.filter(c=>c.empresaId===sess.empresaId && (!statusCR||c.status===statusCR)).sort((a,b)=>new Date(a.vencimento)-new Date(b.vencimento));
  document.getElementById('tbody-cr').innerHTML=listCR.map(cr=>{const cli=db.clientes.find(c=>c.id===cr.clienteId); const venc=new Date(cr.vencimento); const isVenc=venc < new Date() && cr.status!=='pago'; const status=isVenc?'vencido':cr.status; const sm={aberto:'bg-blue-50 text-blue-700 border-blue-100', pago:'bg-emerald-50 text-emerald-700 border-emerald-100', vencido:'bg-red-50 text-red-700 border-red-200'}; return `<tr class="hover:bg-slate-50"><td class="px-5 py-3"><p class="text-[12px] font-semibold">${fmtDate(cr.vencimento)} ${isVenc?'⚠️':''}</p><p class="text-[12.5px] font-semibold">${cli?.nome}</p><p class="text-[11px] text-slate-500">por ${cr.criadoPorNome||'-'} • ${cr.origem}</p></td><td class="px-5 py-3"><p class="text-[12.5px]">${cr.descricao}</p></td><td class="px-5 py-3"><p class="font-bold text-[13px]">${fmtMoney(cr.valor)}</p></td><td class="px-5 py-3"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase ${sm[status]||''}">${status}</span></td><td class="px-5 py-3"><div class="flex gap-1">${cr.status!=='pago'?`<button onclick="baixarCR('${cr.id}')" class="w-8 h-8 grid place-items-center rounded-lg bg-emerald-50 text-emerald-700"><i class="ph ph-check"></i></button>`:''}<button onclick="openModal('contaReceber','${cr.id}')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-slate-100"><i class="ph ph-pencil"></i></button><button onclick="deleteCR('${cr.id}')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><i class="ph ph-trash"></i></button></div></td></tr>`;}).join('');
  document.getElementById('tbody-cp').innerHTML=db.contasPagar.filter(cp=>cp.empresaId===sess.empresaId).sort((a,b)=>new Date(a.vencimento)-new Date(b.vencimento)).map(cp=>{return `<tr class="hover:bg-slate-50"><td class="px-5 py-3"><p class="text-[12px] font-semibold">${fmtDate(cp.vencimento)}</p><p class="text-[12.5px] font-semibold">${cp.fornecedor}</p><p class="text-[11px] text-slate-500">por ${cp.criadoPorNome||'-'}</p></td><td class="px-5 py-3"><p class="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 inline-block font-bold uppercase">${cp.categoria}</p><p class="text-[12.5px] mt-1">${cp.descricao}</p></td><td class="px-5 py-3 font-bold text-[13px]">${fmtMoney(cp.valor)}</td><td class="px-5 py-3"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${cp.status==='pago'?'bg-emerald-50 text-emerald-700 border':'bg-amber-50 text-amber-700 border'}">${cp.status}</span></td><td class="px-5 py-3"><div class="flex gap-1">${cp.status!=='pago'?`<button onclick="baixarCP('${cp.id}')" class="w-8 h-8 grid place-items-center rounded-lg bg-emerald-50 text-emerald-700"><i class="ph ph-check"></i></button>`:''}<button onclick="openModal('contaPagar','${cp.id}')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-slate-100"><i class="ph ph-pencil"></i></button></div></td></tr>`;}).join('');
  const inadMap={}; db.contasReceber.filter(cr=>cr.empresaId===sess.empresaId && (cr.status==='vencido'|| (new Date(cr.vencimento)<new Date() && cr.status!=='pago'))).forEach(cr=>{inadMap[cr.clienteId]=(inadMap[cr.clienteId]||0)+cr.valor;});
  document.getElementById('list-inadimplencia').innerHTML=Object.keys(inadMap).length?Object.entries(inadMap).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([cliId,valor])=>{const cli=db.clientes.find(c=>c.id===cliId); return `<div class="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200"><div><p class="font-semibold text-[12.5px]">${cli?.nome}</p><p class="text-[11px] text-slate-500">${db.contasReceber.filter(cr=>cr.clienteId===cliId && cr.empresaId===sess.empresaId && (cr.status==='vencido'||new Date(cr.vencimento)<new Date()&&cr.status!=='pago')).length} títulos</p></div><b class="text-[12.5px] text-red-600">${fmtMoney(valor)}</b></div>`;}).join(''):'<p class="text-[12px] text-slate-500">Sem inadimplência</p>';
  document.getElementById('list-vencimentos-fin').innerHTML=db.contasReceber.filter(cr=>cr.empresaId===sess.empresaId && cr.status==='aberto').sort((a,b)=>new Date(a.vencimento)-new Date(b.vencimento)).slice(0,5).map(cr=>{const cli=db.clientes.find(c=>c.id===cr.clienteId); return `<div class="flex justify-between items-center p-2 rounded-xl bg-slate-50 border"><div><p class="font-semibold text-[12px]">${cli?.nome}</p><p class="text-[11px] text-slate-500">${fmtDate(cr.vencimento)} • ${cr.descricao.slice(0,30)}</p><p class="text-[10px] text-slate-400">por ${cr.criadoPorNome||'-'}</p></div><b class="text-[12px]">${fmtMoney(cr.valor)}</b></div>`;}).join('')||'<p class="text-[12px] text-slate-500">Sem vencimentos</p>';
  const dreRows=[{label:'Receita Bruta - Locações', valor: db.contratos.filter(c=>c.empresaId===sess.empresaId && c.status==='ativo').reduce((s,c)=>s+c.valorMensalFixo,0)*1.1},{label:'Receita - Excedentes', valor: db.leituras.filter(l=>l.empresaId===sess.empresaId).reduce((s,l)=>s+l.valorExcedente,0)},{label:'Receita - Vendas', valor: db.vendas.filter(v=>v.empresaId===sess.empresaId).reduce((s,v)=>s+v.total,0)},{label:'(-) Custos Suprimentos', valor: -db.produtos.filter(p=>p.empresaId===sess.empresaId).reduce((s,p)=>s+p.custo*2,0), isCost:true},{label:'(-) Despesas', valor: -db.contasPagar.filter(cp=>cp.empresaId===sess.empresaId).reduce((s,cp)=>s+cp.valor,0), isCost:true},{label:'(=) Lucro Bruto', valor: 0, isTotal:true},];
  const totalRec=dreRows.slice(0,3).reduce((s,r)=>s+r.valor,0); const totalCust=dreRows.slice(3,5).reduce((s,r)=>s+r.valor,0); dreRows[5].valor=totalRec+totalCust;
  document.getElementById('dre-table').innerHTML=dreRows.map(r=>`<div class="flex justify-between py-2 px-3 rounded-xl ${r.isTotal?'bg-[#0a1e8a] text-white font-bold':'hover:bg-slate-50'} text-[13px]"><span>${r.label}</span><span class="${r.isCost?'text-red-600':''} ${r.isTotal?'text-white':''}">${fmtMoney(r.valor)}</span></div>`).join('');
}
function baixarCR(id){const sess=getSession(); const cr=db.contasReceber.find(c=>c.id===id && c.empresaId===sess.empresaId); if(!cr) return; cr.status='pago'; cr.pagamentoData=new Date().toISOString(); logAction('financeiro','baixar_receber',id,`Baixado título ${fmtMoney(cr.valor)} por ${sess.usuarioNome}`); saveDB(); renderFinanceiro(); renderAuditoria(); toast('Baixa realizada','success');}
function baixarCP(id){const sess=getSession(); const cp=db.contasPagar.find(c=>c.id===id && c.empresaId===sess.empresaId); if(!cp) return; cp.status='pago'; cp.pagamentoData=new Date().toISOString(); logAction('financeiro','baixar_pagar',id,`Pago ${fmtMoney(cp.valor)} por ${sess.usuarioNome}`); saveDB(); renderFinanceiro(); renderAuditoria(); toast('Pagamento registrado','success');}
function deleteCR(id){const sess=getSession(); if(confirm('Excluir título?')){db.contasReceber=db.contasReceber.filter(c=>!(c.id===id && c.empresaId===sess.empresaId)); logAction('financeiro','excluir_receber',id,`Excluído por ${sess.usuarioNome}`); saveDB(); renderFinanceiro(); renderAuditoria();}}

function renderFluxoChart(){
  const ctx=document.getElementById('chartFluxo'); if(!ctx) return; if(window.chartFluxoInst) window.chartFluxoInst.destroy();
  window.chartFluxoInst=new Chart(ctx,{type:'bar',data:{labels:['Fev','Mar','Abr','Mai','Jun','Jul'],datasets:[{label:'Receber',data:[15200,18300,16900,22100,19800,22400],backgroundColor:'#0a1e8a',borderRadius:6},{label:'Pagar',data:[9200,10500,9800,11200,10200,11800],backgroundColor:'#e2e8f0',borderRadius:6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true, position:'bottom', labels:{boxWidth:10, font:{size:11}}}} ,scales:{x:{grid:{display:false}}, y:{grid:{color:'#f1f5f9'}}}}});
}
function gerarRelatorio(tipo){
  const sess=getSession(); const out=document.getElementById('relatorio-output');
  if(tipo==='consumo'){
    const ranking=db.parque.filter(p=>p.empresaId===sess.empresaId).map(p=>{const leit=db.leituras.filter(l=>l.parqueId===p.id && l.empresaId===sess.empresaId); const totalPB=leit.reduce((s,l)=>s+l.consumoPB,0); const totalCor=leit.reduce((s,l)=>s+l.consumoCor,0); const cli=db.clientes.find(c=>c.id===p.clienteId); const eq=db.equipamentos.find(e=>e.id===p.equipamentoId); return {cliente:cli?.nome||'?', equip:eq?.modelo||'?', totalPB, totalCor, total:totalPB+totalCor, por:leit[0]?.criadoPorNome||'-'};}).sort((a,b)=>b.total-a.total);
    out.innerHTML=`<div class="w-full"><h4 class="font-bold text-[15px] mb-4">Ranking consumo por cliente/equip (com auditoria)</h4><div class="overflow-auto"><table class="w-full text-left text-[13px]"><thead class="bg-slate-50 border-b text-[11px] uppercase font-bold text-slate-500"><tr><th class="px-4 py-2">Cliente</th><th class="px-4 py-2">Equip</th><th class="px-4 py-2">PB</th><th class="px-4 py-2">COR</th><th class="px-4 py-2">Total</th><th class="px-4 py-2">Por</th></tr></thead><tbody class="divide-y">${ranking.map(r=>`<tr><td class="px-4 py-2 font-semibold">${r.cliente}</td><td class="px-4 py-2">${r.equip}</td><td class="px-4 py-2">${r.totalPB.toLocaleString()}</td><td class="px-4 py-2">${r.totalCor.toLocaleString()}</td><td class="px-4 py-2 font-bold">${r.total.toLocaleString()}</td><td class="px-4 py-2 text-[11px]">${r.por}</td></tr>`).join('')}</tbody></table></div></div>`;
  } else if(tipo==='faturamento'){
    const totalContratos=db.contratos.filter(c=>c.empresaId===sess.empresaId && c.status==='ativo').reduce((s,c)=>s+c.valorMensalFixo,0); const totalExc=db.leituras.filter(l=>l.empresaId===sess.empresaId).reduce((s,l)=>s+l.valorExcedente,0); const totalVendas=db.vendas.filter(v=>v.empresaId===sess.empresaId).reduce((s,v)=>s+v.total,0);
    out.innerHTML=`<div class="w-full max-w-[600px]"><h4 class="font-bold text-[15px] mb-6">Faturamento consolidado por usuário</h4><div class="space-y-3"><div class="flex justify-between p-4 rounded-xl bg-[#e8eaf8] border border-[#c9ceef]"><span>Contratos mensais</span><b>${fmtMoney(totalContratos)}</b></div><div class="flex justify-between p-4 rounded-xl bg-amber-50 border"><span>Excedentes</span><b>${fmtMoney(totalExc)}</b></div><div class="flex justify-between p-4 rounded-xl bg-emerald-50 border"><span>Vendas avulsas</span><b>${fmtMoney(totalVendas)}</b></div><div class="flex justify-between p-4 rounded-xl bg-[#0a1e8a] text-white text-[16px] font-bold"><span>Total</span><span>${fmtMoney(totalContratos+totalExc+totalVendas)}</span></div></div><div class="mt-6"><h5 class="font-bold text-[13px] mb-2">Faturamento por usuário que criou</h5><div class="space-y-2">${Object.entries(db.vendas.filter(v=>v.empresaId===sess.empresaId).reduce((acc,v)=>{acc[v.criadoPorNome||'Desconhecido']=(acc[v.criadoPorNome||'Desconhecido']||0)+v.total; return acc;},{})).map(([nome,valor])=>`<div class="flex justify-between p-2 bg-slate-50 border rounded-xl text-[12px]"><span>${nome}</span><b>${fmtMoney(valor)}</b></div>`).join('')||'<p class="text-[12px] text-slate-500">Sem vendas</p>'}</div></div></div>`;
  } else if(tipo==='tecnica'){
    const porTec=db.tecnicos.map(t=>{const os=db.os.filter(o=>o.empresaId===sess.empresaId && o.tecnico===t.id); return {nome:t.nome, abertas:os.filter(o=>o.status!=='concluido').length, concluidas:os.filter(o=>o.status==='concluido').length, por:os[0]?.criadoPorNome||'-'};});
    out.innerHTML=`<div class="w-full"><h4 class="font-bold text-[15px] mb-4">Eficiência técnica + quem abriu OS</h4><table class="w-full text-left text-[13px]"><thead class="bg-slate-50 border-b text-[11px] uppercase font-bold text-slate-500"><tr><th class="px-4 py-2">Técnico</th><th class="px-4 py-2">Abertas</th><th class="px-4 py-2">Concluídas</th><th class="px-4 py-2">Criado por (exemplo)</th></tr></thead><tbody class="divide-y">${porTec.map(r=>`<tr><td class="px-4 py-3 font-semibold">${r.nome}</td><td class="px-4 py-3">${r.abertas}</td><td class="px-4 py-3">${r.concluidas}</td><td class="px-4 py-3 text-[11px]">${r.por}</td></tr>`).join('')}</tbody></table></div>`;
  } else if(tipo==='rentabilidade'){
    const rows=db.contratos.filter(c=>c.empresaId===sess.empresaId).map(c=>{const cli=db.clientes.find(cl=>cl.id===c.clienteId); const receita=c.valorMensalFixo*6 + db.leituras.filter(l=>l.contratoId===c.id && l.empresaId===sess.empresaId).reduce((s,l)=>s+l.valorExcedente,0); const custo=receita*0.45; const lucro=receita-custo; return {numero:c.numero, cliente:cli?.nome, receita, custo, lucro, margem:(lucro/receita*100).toFixed(1), por:c.criadoPorNome};});
    out.innerHTML=`<div class="w-full"><h4 class="font-bold text-[15px] mb-4">Rentabilidade por contrato + quem criou</h4><table class="w-full text-left text-[13px]"><thead class="bg-slate-50 border-b text-[11px] uppercase font-bold text-slate-500"><tr><th class="px-4 py-2">Contrato / Cliente / Criado por</th><th class="px-4 py-2">Receita</th><th class="px-4 py-2">Custo est.</th><th class="px-4 py-2">Lucro</th><th class="px-4 py-2">Margem</th></tr></thead><tbody class="divide-y">${rows.map(r=>`<tr><td class="px-4 py-2"><p class="font-mono text-[11px] text-[#0a1e8a]">${r.numero}</p><p class="font-semibold">${r.cliente}</p><p class="text-[11px] text-slate-500">por ${r.por}</p></td><td class="px-4 py-2">${fmtMoney(r.receita)}</td><td class="px-4 py-2 text-red-600">-${fmtMoney(r.custo)}</td><td class="px-4 py-2 font-bold ${r.lucro>0?'text-emerald-600':''}">${fmtMoney(r.lucro)}</td><td class="px-4 py-2"><span class="px-2 py-1 rounded-full bg-slate-100 font-bold text-[11px]">${r.margem}%</span></td></tr>`).join('')}</tbody></table></div>`;
  }
}

function renderConfig(){
  const sess=getSession(); if(!sess) return;
  const emp=db.empresas.find(e=>e.id===sess.empresaId);
  document.getElementById('cfg-emp-nome').value=emp?.nome||db.config.empresa.nome; document.getElementById('cfg-emp-cnpj').value=emp?.cnpj||sess.cnpj; document.getElementById('cfg-emp-fone').value=db.config.empresa.fone; document.getElementById('cfg-emp-email').value=db.config.empresa.email;
  document.getElementById('list-tecnicos').innerHTML=db.tecnicos.map(t=>`<div class="flex items-center justify-between p-3 rounded-xl border bg-slate-50"><div><p class="font-semibold text-[13px]">${t.nome}</p><p class="text-[11px] text-slate-500">${t.especialidade} • ${t.osConcluidas} OS</p></div><button onclick="removeTecnico('${t.id}')" class="w-8 h-8 grid place-items-center rounded-lg bg-white border hover:bg-red-50"><i class="ph ph-trash"></i></button></div>`).join('');
}
function saveConfig(){const sess=getSession(); const emp=db.empresas.find(e=>e.id===sess.empresaId); if(emp){emp.nome=document.getElementById('cfg-emp-nome').value; emp.cnpj=document.getElementById('cfg-emp-cnpj').value; emp.cnpjDigits=onlyDigits(emp.cnpj);} db.config.empresa.nome=document.getElementById('cfg-emp-nome').value; db.config.empresa.cnpj=document.getElementById('cfg-emp-cnpj').value; db.config.empresa.fone=document.getElementById('cfg-emp-fone').value; db.config.empresa.email=document.getElementById('cfg-emp-email').value; saveDB(); toast('Config salva','success');}
function addTecnico(){const nome=document.getElementById('new-tecnico-nome').value.trim(); if(!nome) return toast('Informe nome','error'); db.tecnicos.push({id:uid('tec'),nome,especialidade:'Geral',osConcluidas:0}); saveDB(); renderConfig(); toast('Técnico adicionado','success');}
function removeTecnico(id){db.tecnicos=db.tecnicos.filter(t=>t.id!==id); saveDB(); renderConfig();}
function exportBackup(){const dataStr=JSON.stringify(db,null,2); const blob=new Blob([dataStr],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`digicopy-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();}
function exportClientes(){exportBackup();}
function clearAllData(){if(confirm('Apagar TUDO deste CNPJ?')){const sess=getSession(); if(!sess) return; const empId=sess.empresaId; db.clientes=db.clientes.filter(c=>c.empresaId!==empId); db.produtos=db.produtos.filter(p=>p.empresaId!==empId); db.equipamentos=db.equipamentos.filter(e=>e.empresaId!==empId); db.contratos=db.contratos.filter(c=>c.empresaId!==empId); db.parque=db.parque.filter(p=>p.empresaId!==empId); db.leituras=db.leituras.filter(l=>l.empresaId!==empId); db.os=db.os.filter(o=>o.empresaId!==empId); db.vendas=db.vendas.filter(v=>v.empresaId!==empId); db.contasReceber=db.contasReceber.filter(cr=>cr.empresaId!==empId); db.contasPagar=db.contasPagar.filter(cp=>cp.empresaId!==empId); db.logs=db.logs.filter(l=>l.empresaId!==empId); saveDB(); toast('Dados deste CNPJ limpos','success'); location.reload();}}
function handleGlobalSearch(q){if(!q) return; const low=q.toLowerCase(); const sess=getSession(); if(!sess) return; const cli=db.clientes.find(c=>c.empresaId===sess.empresaId && (c.nome.toLowerCase().includes(low)||c.documento.includes(low))); const ctr=db.contratos.find(c=>c.empresaId===sess.empresaId && c.numero.toLowerCase().includes(low)); const eq=db.equipamentos.find(e=>e.empresaId===sess.empresaId && (e.patrimonio.toLowerCase().includes(low)||e.serie.toLowerCase().includes(low))); if(cli){navigateTo('clientes'); document.getElementById('search-clientes').value=q; renderClientes();} else if(ctr){navigateTo('contratos'); document.getElementById('search-contratos').value=q; renderContratos();} else if(eq){navigateTo('impressoras'); document.getElementById('search-equip').value=q; renderEquipamentos();}}
function openQuickReading(){navigateTo('leituras'); openModal('leitura');}
function openQuickOS(){navigateTo('manutencao'); openModal('os');}
function gerarFaturasPendentes(){const sess=getSession(); const pend=db.leituras.filter(l=>l.empresaId===sess.empresaId && l.status==='pendente'); if(!pend.length) return toast('Nenhuma pendente','info'); pend.forEach(l=>{const contrato=db.contratos.find(c=>c.id===l.contratoId); const valorTotal=(contrato?.valorMensalFixo||0)+l.valorExcedente; db.contasReceber.push({id:uid('cr'),empresaId:sess.empresaId,origem:'contrato',clienteId:l.clienteId,descricao:`Fatura ${contrato?.numero} • ${fmtDate(l.dataLeitura)} • ${l.consumoPB} PB`,valor:valorTotal,vencimento:new Date(new Date().setDate((contrato?.diaVencimento||10))).toISOString(),pagamentoData:null,status:'aberto',contratoId:l.contratoId,leituraId:l.id,vendaId:null, criadoPor:sess.usuarioId, criadoPorNome:sess.usuarioNome}); l.status='faturado'; logAction('leitura','faturar',l.id,`Faturado por ${sess.usuarioNome} total ${fmtMoney(valorTotal)}`);}); saveDB(); renderLeituras(); renderFinanceiro(); renderAuditoria(); toast(`${pend.length} faturas geradas por ${sess.usuarioNome}`,'success');}
function simularLeiturasLote(){const sess=getSession(); const parques=db.parque.filter(p=>p.empresaId===sess.empresaId && p.status==='ativo').slice(0,3); parques.forEach(p=>{const eq=db.equipamentos.find(e=>e.id===p.equipamentoId); const incPB=Math.floor(Math.random()*2500)+500; const incCor=eq.tipo.includes('Color')?Math.floor(Math.random()*800)+100:0; const ultima=db.leituras.filter(l=>l.parqueId===p.id).sort((a,b)=>new Date(b.dataLeitura)-new Date(a.dataLeitura))[0]; const basePB=ultima?ultima.contadorPB:eq.contadorPB; const baseCor=ultima?ultima.contadorCor:eq.contadorCor; const pb=basePB+incPB; const cor=baseCor+incCor; const contrato=db.contratos.find(c=>c.id===p.contratoId); const consPB=incPB; const consCor=incCor; const valor=Math.max(0,consPB-(contrato?.franquiaPB||0))*(contrato?.valorExcedentePB||0)+Math.max(0,consCor-(contrato?.franquiaCor||0))*(contrato?.valorExcedenteCor||0); db.leituras.push({id:uid('lei'),empresaId:sess.empresaId,parqueId:p.id,equipamentoId:p.equipamentoId,contratoId:p.contratoId,clienteId:p.clienteId,dataLeitura:new Date().toISOString(),contadorPB:pb,contadorCor:cor,contadorPBAnterior:basePB,contadorCorAnterior:baseCor,consumoPB:consPB,consumoCor:consCor,valorExcedente:valor,faturar:valor>0,status:'pendente',criadoPor:sess.usuarioId,criadoPorNome:sess.usuarioNome}); eq.contadorPB=pb; eq.contadorCor=cor;}); logAction('leitura','simular_lote','-',`Simulado 3 leituras por ${sess.usuarioNome}`); saveDB(); renderLeituras(); renderEquipamentos(); renderParque(); renderAuditoria(); toast('Coleta automática • 3 leituras','success');}

// INICIALIZAÇÃO
(function(){
  const sess=getSession();
  if(sess){showApp();}else{showLogin();}
  const currentDateEl=document.getElementById('current-date'); if(currentDateEl) currentDateEl.innerText=new Date().toLocaleDateString('pt-BR',{day:'2-digit', month:'2-digit', year:'numeric'}); const statusUserHome=document.getElementById('status-user-home'); if(statusUserHome) statusUserHome.innerText=(sess.usuarioNome||sess.login||'-').split(' ')[0].toUpperCase();
  // permitir Enter nos logins
  document.addEventListener('keydown',e=>{
    if(e.key==='Enter'){
      if(!document.getElementById('login-screen').classList.contains('hidden')){
        if(!document.getElementById('login-step-cnpj').classList.contains('hidden')) doLoginCNPJ();
        else if(!document.getElementById('login-step-user').classList.contains('hidden')) doLoginUser();
      }
    }
  });
})();

// COMPLEMENTO - modais faltantes e helpers restantes (financeiro, entrada, etc)

function renderModalContaReceber(id){
  const sess=getSession(); const isEdit=!!id;
  const cr=isEdit?db.contasReceber.find(x=>x.id===id && x.empresaId===sess.empresaId):{clienteId:'',descricao:'',valor:0,vencimento:new Date().toISOString().slice(0,10),status:'aberto'};
  const cliOpts=db.clientes.filter(c=>c.empresaId===sess.empresaId).map(c=>`<option value="${c.id}" ${c.id===cr.clienteId?'selected':''}>${c.nome}</option>`).join('');
  document.getElementById('modal-title').innerText=isEdit?'Editar título':'Novo título a receber';
  document.getElementById('modal-body').innerHTML=`<div class="space-y-4"><div><label class="text-[11px] font-bold uppercase text-slate-500">Cliente</label><select id="f-cr-cli" class="mt-1 w-full h-11 px-3 rounded-xl border"><option value="">Selecione</option>${cliOpts}</select></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Descrição</label><input id="f-cr-desc" value="${cr.descricao||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div class="grid grid-cols-2 gap-4"><div><label class="text-[11px] font-bold uppercase text-slate-500">Valor R$</label><input id="f-cr-valor" type="number" step="0.01" value="${cr.valor||0}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Vencimento</label><input id="f-cr-venc" type="date" value="${(cr.vencimento||'').slice(0,10)}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Status</label><select id="f-cr-status" class="mt-1 w-full h-11 px-3 rounded-xl border"><option value="aberto">Em aberto</option><option value="pago">Pago</option><option value="vencido">Vencido</option></select></div><div class="rounded-xl bg-[#e8eaf8] border p-3 text-[11px] text-[#0a1e8a]">Criado por <b>${sess.usuarioNome}</b> será auditado.</div></div>`;
  document.getElementById('f-cr-status').value=cr.status||'aberto';
  document.getElementById('modal-footer').innerHTML=`<button onclick="closeModal()" class="h-11 px-5 rounded-xl bg-white border">Cancelar</button><button onclick="saveCR()" class="h-11 px-6 rounded-xl bg-[#0a1e8a] text-white font-semibold">Salvar</button>`;
  document.getElementById('modal-root').classList.remove('hidden'); window.modalContext={type:'contaReceber',id};
}
function saveCR(){
  const sess=getSession(); const id=window.modalContext?.id;
  const payload={empresaId:sess.empresaId, clienteId:document.getElementById('f-cr-cli').value, descricao:document.getElementById('f-cr-desc').value.trim(), valor:parseFloat(document.getElementById('f-cr-valor').value)||0, vencimento:document.getElementById('f-cr-venc').value, status:document.getElementById('f-cr-status').value, origem:'avulso', pagamentoData:document.getElementById('f-cr-status').value==='pago'?new Date().toISOString():null, criadoPor:sess.usuarioId, criadoPorNome:sess.usuarioNome};
  if(!payload.clienteId) return toast('Selecione cliente','error');
  if(id){Object.assign(db.contasReceber.find(c=>c.id===id && c.empresaId===sess.empresaId),payload); logAction('financeiro','editar_receber',id,`Editado ${payload.descricao} por ${sess.usuarioNome}`);}else{const novo={id:uid('cr'),contratoId:null,leituraId:null,vendaId:null,...payload, criadoEm:new Date().toISOString()}; db.contasReceber.push(novo); logAction('financeiro','criar_receber',novo.id,`Criado título ${fmtMoney(novo.valor)} por ${sess.usuarioNome}`);}
  saveDB(); renderFinanceiro(); renderAuditoria(); closeModal(); toast('Título salvo','success');
}
function renderModalContaPagar(id){
  const sess=getSession(); const isEdit=!!id;
  const cp=isEdit?db.contasPagar.find(x=>x.id===id && x.empresaId===sess.empresaId):{fornecedor:'',descricao:'',categoria:'Suprimentos',valor:0,vencimento:new Date().toISOString().slice(0,10),status:'aberto'};
  document.getElementById('modal-title').innerText=isEdit?'Editar despesa':'Nova conta a pagar';
  document.getElementById('modal-body').innerHTML=`<div class="space-y-4"><div><label class="text-[11px] font-bold uppercase text-slate-500">Fornecedor</label><input id="f-cp-forn" value="${cp.fornecedor||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Descrição</label><input id="f-cp-desc" value="${cp.descricao||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div class="grid grid-cols-2 gap-4"><div><label class="text-[11px] font-bold uppercase text-slate-500">Categoria</label><select id="f-cp-cat" class="mt-1 w-full h-11 px-3 rounded-xl border"><option>Suprimentos</option><option>Peças</option><option>Infraestrutura</option><option>Salários</option><option>Impostos</option><option>Frete</option><option>Outros</option></select></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Valor R$</label><input id="f-cp-valor" type="number" step="0.01" value="${cp.valor||0}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div></div><div class="grid grid-cols-2 gap-4"><div><label class="text-[11px] font-bold uppercase text-slate-500">Vencimento</label><input id="f-cp-venc" type="date" value="${(cp.vencimento||'').slice(0,10)}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Status</label><select id="f-cp-status" class="mt-1 w-full h-11 px-3 rounded-xl border"><option value="aberto">Em aberto</option><option value="pago">Pago</option></select></div></div><div class="rounded-xl bg-[#e8eaf8] border p-3 text-[11px] text-[#0a1e8a]">Criado por <b>${sess.usuarioNome}</b></div></div>`;
  document.getElementById('f-cp-cat').value=cp.categoria||'Suprimentos'; document.getElementById('f-cp-status').value=cp.status||'aberto';
  document.getElementById('modal-footer').innerHTML=`<button onclick="closeModal()" class="h-11 px-5 rounded-xl bg-white border">Cancelar</button><button onclick="saveCP()" class="h-11 px-6 rounded-xl bg-slate-900 text-white font-semibold">Salvar</button>`;
  document.getElementById('modal-root').classList.remove('hidden'); window.modalContext={type:'contaPagar',id};
}
function saveCP(){
  const sess=getSession(); const id=window.modalContext?.id;
  const payload={empresaId:sess.empresaId, fornecedor:document.getElementById('f-cp-forn').value.trim(), descricao:document.getElementById('f-cp-desc').value.trim(), categoria:document.getElementById('f-cp-cat').value, valor:parseFloat(document.getElementById('f-cp-valor').value)||0, vencimento:document.getElementById('f-cp-venc').value, status:document.getElementById('f-cp-status').value, pagamentoData:document.getElementById('f-cp-status').value==='pago'?new Date().toISOString():null, criadoPor:sess.usuarioId, criadoPorNome:sess.usuarioNome};
  if(!payload.fornecedor) return toast('Informe fornecedor','error');
  if(id){Object.assign(db.contasPagar.find(c=>c.id===id && c.empresaId===sess.empresaId),payload); logAction('financeiro','editar_pagar',id,`Editado pagar ${payload.descricao}`);}else{const novo={id:uid('cp'),...payload, criadoEm:new Date().toISOString()}; db.contasPagar.push(novo); logAction('financeiro','criar_pagar',novo.id,`Criada despesa ${fmtMoney(novo.valor)} por ${sess.usuarioNome}`);}
  saveDB(); renderFinanceiro(); renderAuditoria(); closeModal(); toast('Despesa salva','success');
}
function renderModalEntrada(){
  const sess=getSession();
  const prodOpts=db.produtos.filter(p=>p.empresaId===sess.empresaId).map(p=>`<option value="${p.id}">${p.sku} - ${p.nome} (est: ${p.estoque})</option>`).join('');
  document.getElementById('modal-title').innerText='Entrada de estoque';
  document.getElementById('modal-body').innerHTML=`<div class="space-y-4"><div><label class="text-[11px] font-bold uppercase text-slate-500">Produto</label><select id="f-ent-prod" class="mt-1 w-full h-11 px-3 rounded-xl border"><option value="">Selecione</option>${prodOpts}</select></div><div class="grid grid-cols-2 gap-4"><div><label class="text-[11px] font-bold uppercase text-slate-500">Qtd entrada</label><input id="f-ent-qtd" type="number" value="1" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Custo unitário</label><input id="f-ent-custo" type="number" step="0.01" placeholder="Opcional" class="mt-1 w-full h-11 px-3 rounded-xl border"></div></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Obs / NF</label><input id="f-ent-obs" placeholder="NF 1234 - Fornecedor" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div class="rounded-xl bg-[#e8eaf8] border p-3 text-[11px] text-[#0a1e8a]">Entrada registrada por <b>${sess.usuarioNome}</b> - auditado.</div></div>`;
  document.getElementById('modal-footer').innerHTML=`<button onclick="closeModal()" class="h-11 px-5 rounded-xl bg-white border">Cancelar</button><button onclick="saveEntrada()" class="h-11 px-6 rounded-xl bg-slate-900 text-white font-semibold">Confirmar entrada</button>`;
  document.getElementById('modal-root').classList.remove('hidden'); window.modalContext={type:'entradaEstoque'};
}
function saveEntrada(){
  const sess=getSession();
  const prodId=document.getElementById('f-ent-prod').value; const qtd=parseInt(document.getElementById('f-ent-qtd').value)||0;
  if(!prodId) return toast('Selecione produto','error'); const p=db.produtos.find(x=>x.id===prodId && x.empresaId===sess.empresaId); if(!p) return toast('Produto não encontrado neste CNPJ','error');
  p.estoque+=qtd; const custo=parseFloat(document.getElementById('f-ent-custo').value); if(custo) p.custo=custo;
  logAction('produto','entrada_estoque',prodId,`Entrada ${qtd} un por ${sess.usuarioNome} - estoque agora ${p.estoque}`);
  saveDB(); renderProdutos(); closeModal(); toast(`Entrada de ${qtd} un registrada por ${sess.usuarioNome}. Estoque agora ${p.estoque}`,'success'); renderAuditoria();
}
// Garantir que openModal funcione para novos tipos mesmo se chamado antes da definição completa
const _origOpenModal = window.openModal;
window.openModal = function(type,id=null){
  document.getElementById('modal-root').classList.remove('hidden');
  window.modalContext={type,id};
  if(type==='cliente' && typeof renderModalCliente==='function') return renderModalCliente(id);
  if(type==='produto' && typeof renderModalProduto==='function') return renderModalProduto(id);
  if(type==='equipamento' && typeof renderModalEquipamento==='function') return renderModalEquipamento(id);
  if(type==='contrato' && typeof renderModalContrato==='function') return renderModalContrato(id);
  if(type==='leitura' && typeof renderModalLeitura==='function') return renderModalLeitura(id);
  if(type==='os' && typeof renderModalOS==='function') return renderModalOS(id);
  if(type==='contaReceber') return renderModalContaReceber(id);
  if(type==='contaPagar') return renderModalContaPagar(id);
  if(type==='entradaEstoque') return renderModalEntrada();
  if(type==='usuario') return renderModalUsuario(id);
  if(_origOpenModal) return _origOpenModal(type,id);
};
function renderBanco(){
  const sess=getSession();
  let el = document.getElementById('view-banco');
  if (!el) {
    el = ensureView('banco');
  }
  el.innerHTML = '';
  el.style.display = 'block';
  el.style.visibility = 'visible';
  const empresa=sess?db.empresas.find(e=>e.id===sess.empresaId):null;
  const isElectron = window.firebirdAPI && typeof window.firebirdAPI.test === 'function';
  el.innerHTML=`
    <div class="space-y-4">
      <div class="rounded-[22px] bg-[#0a1e8a] text-white p-6 shadow-xl overflow-hidden relative">
        <div class="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 blur-3xl"></div>
        <div class="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <p class="text-[11px] font-bold tracking-[0.18em] uppercase text-white/60">Migração do sistema antigo</p>
            <h2 class="text-[24px] font-extrabold tracking-tight mt-2">Firebird (.FDB) → ERP DIGICOPY</h2>
            <p class="text-white/80 text-[13.5px] mt-2 max-w-[780px]">Conecte diretamente ao banco Firebird do sistema antigo, visualize as tabelas e importe os dados para o ERP novo. Os dados são mapeados automaticamente para clientes, produtos, vendas, locação e financeiro.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button onclick="loadManualDB()" class="h-10 px-4 rounded-xl bg-white text-[#0a1e8a] font-bold text-[12.5px]">Importar amostra para teste</button>
            <button onclick="exportBackup()" class="h-10 px-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-[12.5px]">Exportar JSON atual</button>
          </div>
        </div>
      </div>

      <!-- CONEXÃO FIREBIRD -->
      <div class="rounded-[18px] bg-white border shadow-sm p-6">
        <div class="flex items-center gap-3 mb-5">
          <div class="w-10 h-10 rounded-xl bg-[#0a1e8a] text-white grid place-items-center"><i class="ph ph-database text-[20px]"></i></div>
          <div>
            <h3 class="font-bold text-[16px]">Conexão com Firebird</h3>
            <p class="text-[12px] text-slate-500">Preencha os dados do banco .FDB do sistema antigo</p>
          </div>
          <div class="ml-auto">
            ${isElectron
              ? '<span class="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200"><i class="ph ph-check-circle"></i> Electron ativo</span>'
              : '<span class="text-[11px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200"><i class="ph ph-warning"></i> Modo navegador (sem Firebird direto)</span>'}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
          <div class="xl:col-span-1">
            <label class="classic-label font-bold">Host</label>
            <input id="fb-host" class="classic-input w-full" value="localhost" placeholder="localhost">
          </div>
          <div class="xl:col-span-1">
            <label class="classic-label font-bold">Porta</label>
            <input id="fb-port" class="classic-input w-full" value="3050" placeholder="3050">
          </div>
          <div class="xl:col-span-2">
            <label class="classic-label font-bold">Caminho do banco (.FDB)</label>
            <div class="flex gap-1">
              <input id="fb-database" class="classic-input flex-1" placeholder="C:\\Temp\\BANCO.FDB">
              ${isElectron ? '<button onclick="browseFdb()" class="classic-input w-10 text-center" title="Procurar arquivo"><i class="ph ph-folder-open"></i></button>' : ''}
            </div>
          </div>
          <div class="xl:col-span-1">
            <label class="classic-label font-bold">Usuário</label>
            <input id="fb-user" class="classic-input w-full" value="SYSDBA" placeholder="SYSDBA">
          </div>
          <div class="xl:col-span-1">
            <label class="classic-label font-bold">Senha</label>
            <input id="fb-password" class="classic-input w-full" type="password" value="masterkey" placeholder="masterkey">
          </div>
        </div>

        <div class="flex flex-wrap gap-2 mt-5">
          <button onclick="fbTestConnection()" class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white font-bold text-[12.5px] flex items-center gap-2 hover:bg-[#08176e] transition">
            <i class="ph ph-plugs-connected text-[16px]"></i> Testar conexão
          </button>
          <button onclick="fbListTables()" class="h-10 px-5 rounded-xl bg-emerald-600 text-white font-bold text-[12.5px] flex items-center gap-2 hover:bg-emerald-700 transition">
            <i class="ph ph-table text-[16px]"></i> Listar tabelas
          </button>
          <button onclick="fbExtractAll()" id="btn-extract-all" class="h-10 px-5 rounded-xl bg-amber-600 text-white font-bold text-[12.5px] flex items-center gap-2 hover:bg-amber-700 transition" disabled>
            <i class="ph ph-download-simple text-[16px]"></i> Extrair tudo e importar
          </button>
          <button onclick="fbExportExtracted()" id="btn-export-extracted" class="h-10 px-5 rounded-xl border border-slate-300 text-slate-700 font-bold text-[12.5px] flex items-center gap-2 hover:bg-slate-50 transition" disabled>
            <i class="ph ph-export text-[16px]"></i> Exportar JSON
          </button>
        </div>

        <div id="fb-status" class="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3 text-[12.5px] text-slate-600">
          <i class="ph ph-info text-[14px]"></i> Preencha os dados acima e clique em "Testar conexão". O Firebird precisa estar rodando (StartFirebird.bat como administrador).
        </div>
      </div>

      <!-- TABELAS ENCONTRADAS -->
      <div id="fb-tables-panel" class="hidden rounded-[18px] bg-white border shadow-sm p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white grid place-items-center"><i class="ph ph-list-check text-[20px]"></i></div>
          <div>
            <h3 class="font-bold text-[16px]">Tabelas encontradas</h3>
            <p class="text-[12px] text-slate-500" id="fb-tables-count">-</p>
          </div>
          <div class="ml-auto flex gap-2">
            <button onclick="fbSelectMigrationTables()" class="h-9 px-4 rounded-lg bg-[#0a1e8a] text-white font-bold text-[11.5px] flex items-center gap-1.5"><i class="ph ph-check-square"></i> Selecionar tabelas de migração</button>
          </div>
        </div>
        <div id="fb-tables-grid" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto"></div>
      </div>

      <!-- PREVIEW DE DADOS -->
      <div id="fb-preview-panel" class="hidden rounded-[18px] bg-white border shadow-sm p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-blue-600 text-white grid place-items-center"><i class="ph ph-eye text-[20px]"></i></div>
          <div>
            <h3 class="font-bold text-[16px]">Preview de dados</h3>
            <p class="text-[12px] text-slate-500" id="fb-preview-info">-</p>
          </div>
        </div>
        <div id="fb-preview-content" class="overflow-x-auto border rounded-xl"></div>
      </div>

      <!-- RESULTADO DA IMPORTAÇÃO -->
      <div id="fb-import-panel" class="hidden rounded-[18px] bg-white border shadow-sm p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white grid place-items-center"><i class="ph ph-check-circle text-[20px]"></i></div>
          <div>
            <h3 class="font-bold text-[16px]">Resultado da migração</h3>
            <p class="text-[12px] text-slate-500">Dados importados do Firebird para o ERP</p>
          </div>
        </div>
        <div id="fb-import-result" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3"></div>
      </div>

      <!-- MAPA DAS TABELAS -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div class="xl:col-span-2 rounded-[18px] bg-white border shadow-sm p-6">
          <div>
            <h3 class="font-bold text-[16px]">Mapa das tabelas do sistema antigo</h3>
            <p class="text-[13px] text-slate-500 mt-1">Tabelas que serão extraídas e mapeadas para o ERP novo.</p>
          </div>
          <div class="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px]">
            <div class="rounded-xl border bg-slate-50 p-4"><b>Comercial</b><p class="text-slate-600 mt-1">CLIENTES, PRODUTOS, CARTUCHOS, VENDAS, ITENS_VENDA, ORCAMENTO, ITENS_ORCAMENTO.</p></div>
            <div class="rounded-xl border bg-slate-50 p-4"><b>Locação / outsourcing</b><p class="text-slate-600 mt-1">EQUIPAMENTOS, LOCACAO, ITENS_LOCACAO, LEITURAS e despesas vinculadas.</p></div>
            <div class="rounded-xl border bg-slate-50 p-4"><b>Financeiro</b><p class="text-slate-600 mt-1">CONTAS_PAGAR, CONTAS_RECEBER, RECIBOS_EMITIDOS, FORMA_PAGAMENTO.</p></div>
            <div class="rounded-xl border bg-slate-50 p-4"><b>Cadastros auxiliares</b><p class="text-slate-600 mt-1">EMPRESA, CONFIGURACAO, FORNECEDORES, FUNCIONARIOS, CATEGORIA, FABRICANTE, UNIDADE_MEDIDA.</p></div>
          </div>
        </div>
      </div>

      <!-- PASSOS DE USO -->
      <div class="rounded-[18px] bg-white border shadow-sm p-6">
        <h3 class="font-bold text-[16px]">Passo a passo para migrar</h3>
        <div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-[12.5px]">
          ${[
            ['1','Iniciar Firebird','Execute o StartFirebird.bat como administrador no PC onde está o banco.'],
            ['2','Conectar','Preencha host, porta e caminho do .FDB acima, clique em Testar conexão.'],
            ['3','Listar e revisar','Clique em Listar tabelas, veja os dados de cada uma no preview.'],
            ['4','Importar','Selecione as tabelas desejadas e clique em Extrair tudo e importar.']
          ].map(step=>`<div class="rounded-xl border p-4"><span class="w-7 h-7 rounded-lg bg-[#0a1e8a] text-white grid place-items-center font-bold">${step[0]}</span><p class="font-bold mt-3">${step[1]}</p><p class="text-slate-500 mt-1 leading-snug">${step[2]}</p></div>`).join('')}
        </div>
      </div>

      <!-- NUVEM / SUPABASE -->
      ${typeof cloudMigrationHtml === "function" ? cloudMigrationHtml() : ""}
      <div class="rounded-[22px] bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 shadow-xl overflow-hidden relative">
        <div class="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 blur-3xl"></div>
        <div class="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <p class="text-[11px] font-bold tracking-[0.18em] uppercase text-white/60">Sincronização em nuvem</p>
            <h2 class="text-[24px] font-extrabold tracking-tight mt-2">Supabase — Multi-computador</h2>
            <p class="text-white/80 text-[13.5px] mt-2 max-w-[780px]">Envie os dados migrados para a nuvem e acesse de qualquer computador.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button onclick="testarSupabase()" class="h-10 px-4 rounded-xl bg-white text-emerald-700 font-bold text-[12.5px] flex items-center gap-2"><i class="ph ph-plugs-connected"></i> Testar conexão</button>
            <button onclick="copySupabaseSchemaSQL()" class="h-10 px-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-[12.5px] flex items-center gap-2"><i class="ph ph-copy"></i> Copiar SQL tabelas</button>
            <button onclick="supabaseInfo()" class="h-10 px-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-[12.5px] flex items-center gap-2"><i class="ph ph-info"></i> Info</button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="rounded-[18px] bg-white border shadow-sm p-6">
          <h3 class="font-bold text-[15px] mb-3">Status da conexão</h3>
          <div id="cloud-connection-status" class="text-[13px] text-slate-600">Clique em "Testar conexão" para verificar.</div>
        </div>
        <div class="rounded-[18px] bg-white border shadow-sm p-6">
          <h3 class="font-bold text-[15px] mb-3">Sincronização</h3>
          <div id="cloud-sync-status" class="text-[13px] text-slate-600">Envie ou carregue dados da nuvem.</div>
        </div>
        <div class="rounded-[18px] bg-white border shadow-sm p-6">
          <h3 class="font-bold text-[15px] mb-3">Ações</h3>
          <div class="flex flex-col gap-2">
            <button onclick="enviarDadosLocaisParaNuvem()" class="h-10 px-4 rounded-xl bg-emerald-600 text-white font-semibold text-[12.5px] flex items-center gap-2 justify-center"><i class="ph ph-cloud-arrow-up"></i> Enviar para nuvem</button>
            <button onclick="carregarDadosDaNuvem()" class="h-10 px-4 rounded-xl bg-blue-600 text-white font-semibold text-[12.5px] flex items-center gap-2 justify-center"><i class="ph ph-cloud-arrow-down"></i> Carregar da nuvem</button>
            <button onclick="verificarBaseNaNuvem()" class="h-10 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-[12.5px] flex items-center gap-2 justify-center"><i class="ph ph-database"></i> Ver base na nuvem</button>
          </div>
        </div>
      </div>

      <!-- IMPORTAR TODOS OS DADOS -->
      <div class="rounded-[22px] bg-gradient-to-r from-orange-500 to-red-600 text-white p-6 shadow-xl overflow-hidden relative">
        <div class="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 blur-3xl"></div>
        <div class="relative z-10">
          <p class="text-[11px] font-bold tracking-[0.18em] uppercase text-white/60">Importação completa</p>
          <h2 class="text-[24px] font-extrabold tracking-tight mt-2">Trazer TODOS os dados do sistema antigo</h2>
          <p class="text-white/80 text-[13.5px] mt-2 max-w-[780px]">Exporte tudo pelo DBeaver de uma vez só, importe aqui e envie para o Supabase. Depois, qualquer PC pode acessar os mesmos dados.</p>
        </div>
      </div>

      <!-- FLUXO COMPLETO -->
      <div class="rounded-[18px] bg-white border shadow-sm p-6">
        <h3 class="font-bold text-[16px] mb-4">Como exportar os dados do DBeaver (SEM SQL)</h3>
        
        <div class="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-5 mb-4">
          <h4 class="font-bold text-[15px] text-emerald-900 mb-3"><i class="ph ph-number-circle-one text-[22px]"></i> Passo 1 — Abra a lista de tabelas</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px]">
            <div class="bg-white rounded-lg p-3 border border-emerald-200">
              <p class="font-bold text-emerald-800 mb-1">No DBeaver, lado esquerdo:</p>
              <p class="text-slate-700">Expanda a conexão Firebird clicando nos triângulos:</p>
              <div class="mt-2 bg-slate-900 text-emerald-400 rounded p-2 font-mono text-[11px] leading-relaxed">
                ▼ Database<br>
                &nbsp;&nbsp;▼ Schemas<br>
                &nbsp;&nbsp;&nbsp;&nbsp;▼ MAIN<br>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;📁 <b class="text-yellow-300">Tables</b> ← aqui
              </div>
            </div>
            <div class="bg-white rounded-lg p-3 border border-emerald-200">
              <p class="font-bold text-emerald-800 mb-1">Clique em "Tables"</p>
              <p class="text-slate-700">Vai aparecer a lista de todas as tabelas:</p>
              <div class="mt-2 bg-slate-900 text-emerald-400 rounded p-2 font-mono text-[11px] leading-relaxed">
                📋 CLIENTES<br>
                📋 PRODUTOS<br>
                📋 VENDAS<br>
                📋 ITENS_VENDA<br>
                📋 EQUIPAMENTOS<br>
                📋 ...
              </div>
            </div>
            <div class="bg-white rounded-lg p-3 border border-emerald-200">
              <p class="font-bold text-emerald-800 mb-1">Selecione TODAS</p>
              <p class="text-slate-700">Segure <b>Ctrl+A</b> para selecionar todas as tabelas de uma vez.</p>
              <div class="mt-2 bg-amber-50 border border-amber-200 rounded p-2 text-[11px] text-amber-800">
                <b>Exporte todas!</b> O sistema cria menus novos automaticamente para tabelas sem correspondência.
              </div>
            </div>
          </div>
        </div>

        <div class="bg-blue-50 border-2 border-blue-300 rounded-xl p-5 mb-4">
          <h4 class="font-bold text-[15px] text-blue-900 mb-3"><i class="ph ph-number-circle-two text-[22px]"></i> Passo 2 — Exportar como JSON</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px]">
            <div class="bg-white rounded-lg p-3 border border-blue-200">
              <p class="font-bold text-blue-800 mb-1">Com tabelas selecionadas:</p>
              <p class="text-slate-700"><b>Botão direito</b> → escolha:</p>
              <div class="mt-2 bg-slate-50 border rounded p-2 text-[11px]">
                <div class="py-0.5">Abrir dados...</div>
                <div class="py-0.5 border-t mt-1 pt-1">Editar</div>
                <div class="py-0.5 bg-blue-100 font-bold px-1 rounded">📤 Exportar Dados ← ESTE</div>
                <div class="py-0.5">Importar Dados</div>
              </div>
            </div>
            <div class="bg-white rounded-lg p-3 border border-blue-200">
              <p class="font-bold text-blue-800 mb-1">Na janela de exportação:</p>
              <div class="mt-2 bg-slate-50 border rounded p-2 text-[11px]">
                <div class="py-0.5">○ CSV</div>
                <div class="py-0.5 bg-blue-100 font-bold px-1 rounded">● JSON ← ESTE</div>
                <div class="py-0.5">○ HTML / XML / SQL</div>
              </div>
              <p class="text-slate-700 mt-2">Clique <b>Next → Next → Start</b></p>
            </div>
            <div class="bg-white rounded-lg p-3 border border-blue-200">
              <p class="font-bold text-blue-800 mb-1">Salve em uma pasta fácil:</p>
              <div class="mt-2 bg-slate-50 border rounded p-2 font-mono text-[11px]">
                C:\\Temp\\export\\<br>
                ├── clientes.json<br>
                ├── produtos.json<br>
                ├── vendas.json<br>
                └── ... todas as tabelas
              </div>
            </div>
          </div>
        </div>

        <div class="bg-purple-50 border-2 border-purple-300 rounded-xl p-5">
          <h4 class="font-bold text-[15px] text-purple-900 mb-3"><i class="ph ph-number-circle-three text-[22px]"></i> Passo 3 — Importar aqui no ERP</h4>
          <div class="text-[13px] text-purple-800">
            <ol class="list-decimal list-inside space-y-1">
              <li>Role para baixo até <b>"Upload dos dados"</b></li>
              <li>Clique em <b>"Selecionar arquivos"</b></li>
              <li>Selecione <b>TODOS os .json</b> da pasta (Ctrl+A)</li>
              <li>Clique em <b>"Importar + Supabase"</b></li>
              <li>Pronto! Dados no ERP + nuvem</li>
            </ol>
            <div class="mt-3 bg-white border border-purple-200 rounded-lg p-3">
              <p class="font-bold text-purple-800"><i class="ph ph-devices text-[16px]"></i> Nos outros PCs:</p>
              <p class="text-[12px] text-purple-700 mt-1">ERP → "Banco antigo" → <b>"Carregar da nuvem"</b>. Todos os dados aparecem.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- UPLOAD DE ARQUIVOS -->
      <div class="rounded-[18px] bg-white border shadow-sm p-6">
        <h3 class="font-bold text-[16px] mb-1"><i class="ph ph-upload-simple text-[#0a1e8a]"></i> Upload dos dados</h3>
        <p class="text-[13px] text-slate-500 mb-4">Selecione um ou mais arquivos JSON exportados do DBeaver.</p>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label class="block text-[11px] font-bold uppercase text-slate-500 mb-2">Selecionar arquivos .JSON (pode selecionar vários)</label>
            <input type="file" id="upload-db" accept=".json,application/json" multiple class="w-full text-[13px] mb-3 p-2 border rounded-xl" onchange="handleMultipleUpload(this.files)">
            <div id="upload-status" class="text-[12px]"></div>
            <div id="upload-progress" class="hidden mt-3">
              <div class="flex items-center gap-2 mb-2">
                <div class="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div id="upload-progress-bar" class="h-full bg-emerald-600 transition-all" style="width:0%"></div></div>
                <span id="upload-progress-text" class="text-[11px] font-bold text-slate-600">0%</span>
              </div>
              <div id="upload-log" class="text-[11px] text-slate-500 max-h-[120px] overflow-y-auto border rounded-lg p-2 bg-slate-50"></div>
            </div>
          </div>
          <div class="bg-slate-50 border rounded-xl p-4">
            <h4 class="font-bold text-[13px] text-slate-800 mb-2"><i class="ph ph-lightbulb text-amber-500"></i> Dicas</h4>
            <ul class="text-[11px] text-slate-600 space-y-1.5">
              <li>• Se exportou tudo com o SQL, selecione o arquivo único</li>
              <li>• Se exportou tabela por tabela, selecione todos os .json de uma vez</li>
              <li>• O sistema detecta automaticamente qual tabela é cada arquivo</li>
              <li>• Tabelas sem correspondência viram menus novos no sidebar</li>
              <li>• Após importar, clique em <b>Enviar para nuvem</b> na seção Supabase abaixo</li>
            </ul>
          </div>
        </div>
      </div>

      <textarea id="supabase-schema-sql-box" class="hidden w-full h-[180px] p-3 border rounded-xl font-mono text-[11px]"></textarea>
    </div>`;
}
window.handleDatabaseUpload = function(file){
  const status = document.getElementById('upload-status');
  if(!file || !status) return;
  const name=escapeHtml(file.name);
  const size=(file.size/1024/1024).toFixed(2);
  
  if(file.name.toLowerCase().endsWith('.json')){
    status.innerHTML = `<span class="text-blue-600"><i class="ph ph-spinner animate-spin"></i> Lendo ${name}...</span>`;
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const imported=JSON.parse(reader.result);
        
        // Detectar formato do JSON
        let formato = 'desconhecido';
        let dados = {};
        
        // Formato 1: Backup do DIGICOPY (objeto com arrays)
        if(imported.clientes || imported.produtos || imported.vendas){
          formato = 'digicopy_backup';
          dados = imported;
        }
        // Formato 2: DBeaver export (array de objetos)
        else if(Array.isArray(imported)){
          formato = 'dbeaver_array';
          // Tentar detectar qual tabela é pelo primeiro objeto
          if(imported.length > 0){
            const primeiro = imported[0];
            const cols = Object.keys(primeiro).map(c => c.toUpperCase());
            if(cols.some(c => c.includes('NOME') || c.includes('CLIENTE') || c.includes('CNPJ'))) dados.CLIENTES = imported;
            else if(cols.some(c => c.includes('PRODUTO') || c.includes('SKU') || c.includes('ESTOQUE'))) dados.PRODUTOS = imported;
            else if(cols.some(c => c.includes('VENDA') || c.includes('TOTAL'))) dados.VENDAS = imported;
            else dados.TABELA_IMPORTADA = imported;
          }
        }
        // Formato 3: Objeto com nome da tabela como chave
        else if(typeof imported === 'object' && !Array.isArray(imported)){
          formato = 'tabelas_nomeadas';
          for(const [key, value] of Object.entries(imported)){
            if(Array.isArray(value)){
              dados[key.toUpperCase()] = value;
            }
          }
        }
        
        if(formato === 'desconhecido'){
          throw new Error('Formato JSON não reconhecido. Use exportação do DBeaver ou backup do DIGICOPY.');
        }
        
        // Contar registros
        let totalRegistros = 0;
        const resumo = [];
        for(const [tabela, registros] of Object.entries(dados)){
          if(Array.isArray(registros)){
            totalRegistros += registros.length;
            resumo.push(`${tabela}: ${registros.length}`);
          }
        }
        
        status.innerHTML = `
          <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <p class="font-bold text-emerald-800 mb-2">✅ ${name} carregado com sucesso!</p>
            <p class="text-[12px] text-emerald-700 mb-2">Formato detectado: <b>${formato}</b></p>
            <p class="text-[12px] text-emerald-700 mb-2">Total: <b>${totalRegistros} registros</b></p>
            <div class="text-[11px] text-emerald-600 mb-3">${resumo.join(' • ')}</div>
            <button onclick="importarJsonDBeaver(${JSON.stringify(dados).replace(/"/g, '&quot;')})" 
                    class="w-full h-10 rounded-xl bg-emerald-600 text-white font-bold text-[13px] hover:bg-emerald-700 transition">
              <i class="ph ph-download-simple"></i> Importar para o ERP
            </button>
          </div>
        `;
        
        // Armazenar temporariamente para importação
        window._jsonParaImportar = dados;
        
      }catch(e){
        status.innerHTML=`<div class="bg-red-50 border border-red-200 rounded-lg p-3"><p class="font-bold text-red-800">❌ Erro ao ler ${name}</p><p class="text-[12px] text-red-700 mt-1">${escapeHtml(e.message)}</p></div>`;
        toast('JSON inválido','error');
      }
    };
    reader.readAsText(file);
    return;
  }
  
  status.innerHTML=`<div class="bg-blue-50 border border-blue-200 rounded-lg p-3"><p class="font-bold text-blue-800">Arquivo ${name} selecionado (${size} MB)</p><p class="text-[12px] text-blue-700 mt-1">Arquivos .FDB precisam ser importados via Electron (npm start). Para importar no navegador, exporte para JSON pelo DBeaver primeiro.</p></div>`;
  toast('Use JSON para importar no navegador','info');
};

window.importarJsonDBeaver = function(dados){
  const sess = getSession();
  if(!sess) { toast('Faça login primeiro','error'); return; }
  
  const dadosImportar = dados || window._jsonParaImportar;
  if(!dadosImportar){
    toast('Nenhum dado para importar','error');
    return;
  }
  
  if(!confirm(`Importar ${Object.keys(dadosImportar).length} tabelas para o ERP?\n\nIsso vai adicionar os dados aos módulos existentes ou criar novos módulos.`)){
    return;
  }
  
  // Usar a mesma lógica do fbImportToErp
  const rawData = {};
  for(const [tabela, registros] of Object.entries(dadosImportar)){
    rawData[tabela] = { data: registros, error: null };
  }
  
  fbImportToErp(rawData);
  toast('Importação concluída!','success');
};

window.handleRarUpload = window.handleDatabaseUpload;

// Upload de múltiplos arquivos JSON de uma vez
window.handleMultipleUpload = async function(files){
  const status = document.getElementById('upload-status');
  const progress = document.getElementById('upload-progress');
  const progressBar = document.getElementById('upload-progress-bar');
  const progressText = document.getElementById('upload-progress-text');
  const log = document.getElementById('upload-log');
  
  if(!files || files.length === 0) return;
  
  progress.classList.remove('hidden');
  log.innerHTML = '';
  
  const sess = getSession();
  if(!sess) { status.innerHTML = '<p class="text-red-600 font-bold">Faça login primeiro!</p>'; return; }
  
  const total = files.length;
  let processados = 0;
  let totalRegistros = 0;
  const tabelasImportadas = {};
  const rawData = {};
  
  status.innerHTML = '<p class="text-blue-600 font-bold"><i class="ph ph-spinner animate-spin"></i> Processando '+total+' arquivo(s)...</p>';
  
  for(const file of files){
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      
      if(Array.isArray(imported)){
        const nomeArquivo = file.name.replace('.json','').toUpperCase();
        let nomeTabela = nomeArquivo;
        
        if(imported.length > 0){
          const cols = Object.keys(imported[0]).map(c => c.toUpperCase());
          if(cols.some(c => c.includes('NOME') && (c.includes('CLIENTE') || c.includes('RAZAO'))) || nomeArquivo.includes('CLIENTE')) nomeTabela = 'CLIENTES';
          else if(cols.some(c => c.includes('PRODUTO') || c.includes('DESCRICAO')) || nomeArquivo.includes('PRODUTO') || nomeArquivo.includes('CARTUCHO')) nomeTabela = nomeArquivo.includes('CARTUCHO') ? 'CARTUCHOS' : 'PRODUTOS';
          else if(cols.some(c => c.includes('VENDA')) || nomeArquivo.includes('VENDA')) nomeTabela = nomeArquivo.includes('ITEM') ? 'ITENS_VENDA' : 'VENDAS';
          else if(cols.some(c => c.includes('EQUIP')) || nomeArquivo.includes('EQUIP')) nomeTabela = 'EQUIPAMENTOS';
          else if(nomeArquivo.includes('RECEB')) nomeTabela = 'CONTAS_RECEBER';
          else if(nomeArquivo.includes('PAGAR') || nomeArquivo.includes('PAG_')) nomeTabela = 'CONTAS_PAGAR';
        }
        
        rawData[nomeTabela] = { data: imported, error: null };
        tabelasImportadas[nomeTabela] = imported.length;
        totalRegistros += imported.length;
        log.innerHTML += '<div class="text-emerald-700">✅ '+file.name+' → <b>'+nomeTabela+'</b> ('+imported.length+' registros)</div>';
        
      } else if(typeof imported === 'object'){
        const dadosObj = imported.tabelas || imported.data || imported.resultado || imported;
        for(const [key, value] of Object.entries(dadosObj)){
          if(Array.isArray(value) && value.length > 0){
            rawData[key.toUpperCase()] = { data: value, error: null };
            tabelasImportadas[key.toUpperCase()] = value.length;
            totalRegistros += value.length;
            log.innerHTML += '<div class="text-emerald-700">✅ '+file.name+' → <b>'+key+'</b> ('+value.length+' registros)</div>';
          }
        }
      }
    } catch(e){
      log.innerHTML += '<div class="text-red-600">❌ '+file.name+': '+e.message+'</div>';
    }
    
    processados++;
    const pct = Math.round((processados/total)*100);
    progressBar.style.width = pct+'%';
    progressText.textContent = pct+'%';
  }
  
  const tabelasCount = Object.keys(tabelasImportadas).length;
  status.innerHTML = '<div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4"><p class="font-bold text-emerald-800 text-[14px]">✅ '+totalRegistros+' registros carregados de '+tabelasCount+' tabelas!</p><div class="flex flex-wrap gap-1.5 mt-2 mb-3">'+Object.entries(tabelasImportadas).map(function(e){return '<span class="px-2 py-1 rounded bg-emerald-100 text-[11px] font-bold text-emerald-700">'+e[0]+' ('+e[1]+')</span>'}).join('')+'</div><div class="flex gap-2"><button onclick="importarTudoDeUmaVez()" class="flex-1 h-11 rounded-xl bg-emerald-600 text-white font-bold text-[13px] hover:bg-emerald-700 transition flex items-center justify-center gap-2"><i class="ph ph-download-simple text-[16px]"></i> Importar TUDO para o ERP</button><button onclick="enviarDiretoParaSupabase()" class="h-11 px-4 rounded-xl bg-blue-600 text-white font-bold text-[13px] hover:bg-blue-700 transition flex items-center justify-center gap-2"><i class="ph ph-cloud-arrow-up text-[16px]"></i> Importar + Supabase</button></div><p class="text-[11px] text-emerald-600 mt-2"><b>Fluxo:</b> Importar → Enviar para nuvem → Todos os PCs acessam</p></div>';
  
  window._rawDataParaImportar = rawData;
};

window.importarTudoDeUmaVez = function(){
  const rawData = window._rawDataParaImportar;
  if(!rawData || Object.keys(rawData).length === 0){ toast('Nenhum dado carregado','error'); return; }
  const tabelas = Object.keys(rawData);
  const totalReg = tabelas.reduce(function(s,t){return s+(rawData[t].data?.length||0)},0);
  if(!confirm('Importar '+totalReg+' registros de '+tabelas.length+' tabelas?\n\nTabelas: '+tabelas.join(', ')+'\n\nTabelas sem correspondência viram menus novos no sidebar.')) return;
  fbImportToErp(rawData);
};

window.enviarDiretoParaSupabase = async function(){
  const rawData = window._rawDataParaImportar;
  if(!rawData || Object.keys(rawData).length === 0){ toast('Nenhum dado carregado','error'); return; }
  fbImportToErp(rawData);
  setTimeout(async function(){
    if(typeof window.enviarDadosLocaisParaNuvem === 'function'){
      // Chamada automática sem o confirm
      try {
        const payload = { key:'digicopy_erp_state_v1', data:db, updated_at:new Date().toISOString() };
        await window.supabaseRequest('app_state?on_conflict=key', { method:'POST', headers:{Prefer:'resolution=merge-duplicates,return=representation'}, body:JSON.stringify(payload) });
        toast('✅ Dados enviados para Supabase! Todos os PCs podem acessar.','success');
      } catch(err) {
        toast('Erro ao enviar: '+(err.message||err),'error');
      }
    } else {
      toast('Supabase não disponível. Envie manualmente na seção abaixo.','info');
    }
  }, 2000);
};

window.copiarSqlExportarTudo = function(){
  const sql = 'SELECT RDB$RELATION_NAME AS TABELA FROM RDB$RELATIONS WHERE RDB$VIEW_BLR IS NULL AND (RDB$SYSTEM_FLAG IS NULL OR RDB$SYSTEM_FLAG = 0) ORDER BY RDB$RELATION_NAME';
  
  navigator.clipboard.writeText(sql).then(function(){
    toast('SQL copiado! Cole no DBeaver, execute, e exporte cada tabela clicando com botão direito','success');
    setTimeout(function(){
      alert('INSTRUÇÕES:\n\n1. Cole o SQL no DBeaver e execute\n2. Vai aparecer a lista de tabelas\n3. Para cada tabela importante:\n   - Clique com botão direito na tabela (na árvore à esquerda)\n   - Escolha "Exportar Dados"\n   - Selecione "JSON"\n   - Salve o arquivo\n\nTabelas importantes:\n• CLIENTES\n• PRODUTOS\n• VENDAS\n• ITENS_VENDA\n• EQUIPAMENTOS\n• CONTAS_RECEBER\n• CONTAS_PAGAR\n\nDepois selecione todos os .json aqui no ERP.');
    }, 500);
  }).catch(function(){
    const box = document.getElementById('supabase-schema-sql-box');
    if(box){ box.classList.remove('hidden'); box.value = sql; box.select(); }
    toast('SQL apareceu na caixa','info');
  });
};
// IMPORTAÇÃO MANUAL DE AMOSTRA PARA TESTE
// Essa função adiciona dados fictícios para testar as telas
function loadManualDB(){
  const sess = getSession();
  if(!sess) { toast('Faça login para importar dados manuais','info'); return; }
  // Criar dados principais baseados na análise do arquivo .FDB
  const clientesManuais = [
    {id:'cli_001', empresaId:sess.empresaId, nome:'Construtora Horizonte LTDA', documento:'45.123.678/0001-12', tipo:'PJ', email:'financeiro@horizonte.com.br', telefone:'(11) 99123-4567', endereco:'Av. Paulista, 1000 - Bela Vista', cidade:'São Paulo', estado:'SP', cep:'01310-100', status:'ativo', mensalidade:2490, criadoEm:new Date().toISOString(), criadoPor:'sistema', criadoPorNome:'Importação Manual'},
    {id:'cli_002', empresaId:sess.empresaId, nome:'Escola Saber & Arte', documento:'08.765.432/0001-99', tipo:'PJ', email:'secretaria@saberarte.edu.br', telefone:'(11) 98888-1122', endereco:'R. das Flores, 234 - Jardim', cidade:'Osasco', estado:'SP', cep:'06010-120', status:'ativo', mensalidade:1890, criadoEm:new Date().toISOString(), criadoPor:'sistema', criadoPorNome:'Importação Manual'},
    {id:'cli_003', empresaId:sess.empresaId, nome:'Clínica Vida Mais', documento:'22.111.333/0001-44', tipo:'PJ', email:'adm@vidamaisclinica.com.br', telefone:'(11) 97777-3344', endereco:'R. Domingos, 45 - Centro', cidade:'Barueri', estado:'SP', cep:'06401-000', status:'inadimplente', mensalidade:3200, criadoEm:new Date().toISOString(), criadoPor:'sistema', criadoPorNome:'Importação Manual'},
    {id:'cli_004', empresaId:sess.empresaId, nome:'Advocacia Martins & Associados', documento:'33.222.111/0001-55', tipo:'PJ', email:'contato@martinsadv.com.br', telefone:'(11) 96666-7788', endereco:'Al. Santos, 700 - Jardins', cidade:'São Paulo', estado:'SP', cep:'01419-001', status:'ativo', mensalidade:1650, criadoEm:new Date().toISOString(), criadoPor:'sistema', criadoPorNome:'Importação Manual'},
    {id:'cli_1844', empresaId:sess.empresaId, nome:'Metalúrgica Brasmetal', documento:'18.234.567/0001-33', tipo:'PJ', email:'compras@brasmetal.ind.br', telefone:'(11) 95555-0001', endereco:'Rod. Anhanguera, Km 20', cidade:'Cajamar', estado:'SP', cep:'07750-000', status:'ativo', mensalidade:4750, criadoEm:new Date().toISOString(), criadoPor:'sistema', criadoPorNome:'Importação Manual'},
  ];
  const produtosManuais = [
    {id:'prd_ton_1230', empresaId:sess.empresaId, sku:'TON-BRO-1230', nome:'Toner Brother TN-3442 Compatível Alto Rendimento', categoria:'Suprimento', fabricante:'Premium', estoque:47, estoqueMin:10, custo:89, preco:149, local:'A1-02', status:'ativo', criadoPor:'sistema', criadoPorNome:'Importação Manual', criadoEm:new Date().toISOString()},
    {id:'prd_cil_hp_19a', empresaId:sess.empresaId, sku:'CIL-HP-19A', nome:'Cilindro HP 19A Original', categoria:'Peça', fabricante:'HP', estoque:8, estoqueMin:5, custo:210, preco:340, local:'B2-04', status:'ativo', criadoPor:'sistema', criadoPorNome:'Importação Manual', criadoEm:new Date().toISOString()},
    {id:'prd_imp_bro_5652', empresaId:sess.empresaId, sku:'IMP-BRO-5652', nome:'Brother DCP-L5652DN Laser Mono', categoria:'Impressora', fabricante:'Brother', estoque:3, estoqueMin:1, custo:1850, preco:2690, local:'C1-01', status:'ativo', criadoPor:'sistema', criadoPorNome:'Importação Manual', criadoEm:new Date().toISOString()},
    {id:'prd_serv_inst', empresaId:sess.empresaId, sku:'SERV-INST', nome:'Serviço Instalação e Configuração', categoria:'Serviço', fabricante:'DIGICOPY', estoque:999, estoqueMin:0, custo:0, preco:180, local:'-', status:'ativo', criadoPor:'sistema', criadoPorNome:'Importação Manual', criadoEm:new Date().toISOString()},
  ];
  const vendasManuais = [
    {id:'vda_15625', empresaId:sess.empresaId, numero:'VD-15625', clienteId:'cli_004', data:new Date().toISOString(), itens:[{produtoId:'prd_ton_1230', qtd:3, preco:149, subtotal:447}], desconto:0, total:447, formaPagamento:'Boleto 30d', status:'faturado', criadoPor:'sistema', criadoPorNome:'Importação Manual', criadoEm:new Date().toISOString()},
  ];
  // Substituir dados no db (manter usuários e empresa atual, mas adicionar clientes/produtos/vendas manuais)
  db.clientes = db.clientes.filter(c => !clientesManuais.find(m => m.id === c.id));
  db.clientes.push(...clientesManuais);
  db.produtos = db.produtos.filter(p => !produtosManuais.find(m => m.id === p.id));
  db.produtos.push(...produtosManuais);
  db.vendas = db.vendas.filter(v => !vendasManuais.find(m => m.id === v.id));
  db.vendas.push(...vendasManuais);
  saveDB();
  toast('Dados de teste importados! Clientes: '+clientesManuais.length+', Produtos: '+produtosManuais.length+', Vendas: '+vendasManuais.length, 'success');
  renderClientes(); renderProdutos(); renderVendas(); renderDashboard();
  console.log('Dados manuais carregados:', {clientes: clientesManuais.length, produtos: produtosManuais.length, vendas: vendasManuais.length});
}

// ═══════════════════════════════════════════════════════
// MÓDULO FIREBIRD — Conexão real ao banco .FDB do sistema antigo
// ═══════════════════════════════════════════════════════
let fbConnected = false;
let fbTablesCache = [];
let fbExtractedData = {};

function getFbConfig(){
  return {
    host: document.getElementById('fb-host')?.value?.trim() || 'localhost',
    port: parseInt(document.getElementById('fb-port')?.value?.trim()) || 3050,
    database: document.getElementById('fb-database')?.value?.trim() || '',
    user: document.getElementById('fb-user')?.value?.trim() || 'SYSDBA',
    password: document.getElementById('fb-password')?.value || 'masterkey'
  };
}

function fbSetStatus(msg, type='info'){
  const el = document.getElementById('fb-status');
  if(!el) return;
  const icons = {success:'ph-check-circle text-emerald-600', error:'ph-warning-circle text-red-600', info:'ph-info text-blue-600', loading:'ph-spinner text-[#0a1e8a] animate-spin'};
  const bg = {success:'bg-emerald-50 border-emerald-200 text-emerald-800', error:'bg-red-50 border-red-200 text-red-800', info:'bg-slate-50 border-slate-200 text-slate-600', loading:'bg-blue-50 border-blue-200 text-blue-800'};
  el.className = `mt-4 rounded-xl border p-3 text-[12.5px] ${bg[type]||bg.info}`;
  el.innerHTML = `<i class="ph ${icons[type]||icons.info} text-[14px]"></i> ${msg}`;
}

async function browseFdb(){
  if(!window.fileAPI) return toast('Disponível apenas no Electron','info');
  const r = await window.fileAPI.selectFdb();
  if(r.ok && r.path){
    document.getElementById('fb-database').value = r.path;
  }
}

async function fbTestConnection(){
  const config = getFbConfig();
  if(!config.database) return fbSetStatus('Informe o caminho do banco .FDB','error');
  if(!window.firebirdAPI) return fbSetStatus('Conexão Firebird disponível apenas no app Electron. Rode: <code>npm start</code>','error');

  fbSetStatus('Testando conexão com Firebird...','loading');
  try {
    const r = await window.firebirdAPI.test(config);
    if(r.ok){
      fbConnected = true;
      fbSetStatus(`✅ Conectado ao Firebird! Host: ${config.host}:${config.port} — Banco: ${config.database}`,'success');
      document.getElementById('btn-extract-all').disabled = false;
      toast('Conexão Firebird OK','success');
    } else {
      fbConnected = false;
      fbSetStatus(`❌ Erro: ${r.error}<br><br><b>Dicas:</b><br>• Execute o <code>StartFirebird.bat</code> como administrador<br>• Verifique se o caminho do .FDB está correto<br>• Tente copiar o banco para <code>C:\\Temp\\BANCO.FDB</code>`,'error');
      toast('Falha na conexão','error');
    }
  } catch(e){
    fbSetStatus(`Erro inesperado: ${e.message}`,'error');
  }
}

async function fbListTables(){
  const config = getFbConfig();
  if(!config.database) return fbSetStatus('Informe o caminho do banco .FDB','error');
  if(!window.firebirdAPI) return fbSetStatus('Disponível apenas no Electron','error');

  fbSetStatus('Listando tabelas do banco...','loading');
  try {
    const r = await window.firebirdAPI.tables(config);
    if(!r.ok){
      fbSetStatus(`❌ Erro ao listar tabelas: ${r.error}`,'error');
      return;
    }
    fbTablesCache = r.tables;
    fbConnected = true;
    document.getElementById('btn-extract-all').disabled = false;

    const panel = document.getElementById('fb-tables-panel');
    panel.classList.remove('hidden');

    const totalRegs = r.tables.reduce((s,t)=>s+(t.total>0?t.total:0),0);
    document.getElementById('fb-tables-count').textContent = `${r.tables.length} tabelas encontradas • ${totalRegs.toLocaleString('pt-BR')} registros no total`;

    // Tabelas importantes para migração
    const migrationTables = ['CLIENTES','PRODUTOS','CARTUCHOS','VENDAS','ITENS_VENDA','ORCAMENTO','ITENS_ORCAMENTO',
      'EQUIPAMENTOS','LOCACAO','ITENS_LOCACAO','LEITURAS','CONTAS_PAGAR','CONTAS_RECEBER','RECIBOS_EMITIDOS',
      'FORMA_PAGAMENTO','EMPRESA','CONFIGURACAO','FORNECEDORES','FUNCIONARIOS','CATEGORIA','FABRICANTE','UNIDADE_MEDIDA'];

    const grid = document.getElementById('fb-tables-grid');
    grid.innerHTML = r.tables.map(t => {
      const isMigration = migrationTables.some(m => t.nome.toUpperCase().includes(m));
      return `
        <div class="flex items-center gap-2 rounded-lg border p-2.5 ${isMigration?'bg-blue-50 border-blue-200':'bg-white border-slate-200'} hover:shadow-sm transition cursor-pointer" onclick="fbPreviewTable('${t.nome}')">
          <input type="checkbox" class="fb-table-check w-4 h-4" value="${t.nome}" data-total="${t.total}" ${isMigration?'checked':''}>
          <div class="flex-1 min-w-0">
            <p class="text-[12px] font-bold truncate">${t.nome}</p>
            <p class="text-[10.5px] text-slate-500">${t.total>=0?t.total.toLocaleString('pt-BR')+' registros':'erro contagem'}</p>
          </div>
          <button onclick="event.stopPropagation(); fbPreviewTable('${t.nome}')" class="w-7 h-7 rounded-lg bg-white border grid place-items-center text-[#0a1e8a] hover:bg-slate-50" title="Preview">
            <i class="ph ph-eye text-[14px]"></i>
          </button>
        </div>`;
    }).join('');

    fbSetStatus(`✅ ${r.tables.length} tabelas encontradas com ${totalRegs.toLocaleString('pt-BR')} registros. Clique em uma tabela para ver o preview.`,'success');
  } catch(e){
    fbSetStatus(`Erro: ${e.message}`,'error');
  }
}

async function fbPreviewTable(tableName){
  const config = getFbConfig();
  if(!window.firebirdAPI) return toast('Disponível apenas no Electron','info');

  const panel = document.getElementById('fb-preview-panel');
  const content = document.getElementById('fb-preview-content');
  panel.classList.remove('hidden');
  document.getElementById('fb-preview-info').textContent = `Carregando ${tableName}...`;
  content.innerHTML = '<div class="p-8 text-center text-slate-400 text-[13px]"><i class="ph ph-spinner animate-spin text-[24px]"></i><p class="mt-2">Buscando dados...</p></div>';

  try {
    const r = await window.firebirdAPI.extract(config, tableName, 50);
    if(!r.ok){
      content.innerHTML = `<div class="p-4 text-red-600 text-[13px]">Erro: ${r.error}</div>`;
      return;
    }
    document.getElementById('fb-preview-info').textContent = `${tableName} — ${r.total} registros (mostrando até 50)`;

    if(!r.data.length){
      content.innerHTML = '<div class="p-8 text-center text-slate-400 text-[13px]">Tabela vazia</div>';
      return;
    }

    const cols = Object.keys(r.data[0]);
    const maxCols = Math.min(cols.length, 12); // limitar colunas no preview
    let html = '<table class="classic-grid-table"><thead><tr>';
    html += cols.slice(0, maxCols).map(c=>`<th>${escapeHtml(c)}</th>`).join('');
    if(cols.length > maxCols) html += `<th class="text-slate-400">+${cols.length-maxCols}</th>`;
    html += '</tr></thead><tbody>';
    r.data.slice(0, 25).forEach(row => {
      html += '<tr>';
      cols.slice(0, maxCols).forEach(c => {
        let v = row[c];
        if(v === null || v === undefined) v = '<span class="text-slate-300">null</span>';
        else v = escapeHtml(String(v).substring(0, 60));
        html += `<td>${v}</td>`;
      });
      if(cols.length > maxCols) html += '<td class="text-slate-400">...</td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
    if(r.data.length > 25) html += `<div class="p-2 text-center text-[11px] text-slate-400 border-t">Mostrando 25 de ${r.data.length} linhas</div>`;
    content.innerHTML = html;
  } catch(e){
    content.innerHTML = `<div class="p-4 text-red-600 text-[13px]">Erro: ${e.message}</div>`;
  }
}

function fbSelectMigrationTables(){
  // Marcar apenas tabelas de migração
  const migrationTables = ['CLIENTES','PRODUTOS','CARTUCHOS','VENDAS','ITENS_VENDA','ORCAMENTO','ITENS_ORCAMENTO',
    'EQUIPAMENTOS','LOCACAO','ITENS_LOCACAO','LEITURAS','CONTAS_PAGAR','CONTAS_RECEBER','RECIBOS_EMITIDOS',
    'FORMA_PAGAMENTO','EMPRESA','CONFIGURACAO','FORNECEDORES','FUNCIONARIOS','CATEGORIA','FABRICANTE','UNIDADE_MEDIDA'];
  document.querySelectorAll('.fb-table-check').forEach(cb => {
    cb.checked = migrationTables.some(m => cb.value.toUpperCase().includes(m));
  });
  toast('Tabelas de migração selecionadas','info');
}

async function fbExtractAll(){
  const config = getFbConfig();
  if(!config.database) return fbSetStatus('Informe o caminho do banco .FDB','error');
  if(!window.firebirdAPI) return fbSetStatus('Disponível apenas no Electron','error');

  // Coletar tabelas selecionadas
  const checks = document.querySelectorAll('.fb-table-check:checked');
  let tables;
  if(checks.length > 0){
    tables = Array.from(checks).map(cb => cb.value);
  } else {
    // Se não listou tabelas ainda, usar padrões
    tables = ['CLIENTES','PRODUTOS','CARTUCHOS','VENDAS','ITENS_VENDA','EQUIPAMENTOS','LOCACAO','ITENS_LOCACAO','LEITURAS','CONTAS_PAGAR','CONTAS_RECEBER','FORMA_PAGAMENTO','EMPRESA','FORNECEDORES','FUNCIONARIOS'];
  }

  if(!confirm(`Extrair dados de ${tables.length} tabelas e importar para o ERP?\n\nTabelas: ${tables.join(', ')}`)) return;

  fbSetStatus(`Extraindo ${tables.length} tabelas... Isso pode demorar.`,'loading');

  try {
    const r = await window.firebirdAPI.extractAll(config, tables);
    if(!r.ok){
      fbSetStatus(`❌ Erro na extração: ${r.error}`,'error');
      return;
    }

    fbExtractedData = r.data;
    document.getElementById('btn-export-extracted').disabled = false;

    // Mostrar resumo da extração
    let totalExtraido = 0;
    const resumo = [];
    for(const [t, info] of Object.entries(r.data)){
      const count = info.data ? info.data.length : 0;
      totalExtraido += count;
      resumo.push({ tabela: t, total: count, erro: info.error });
    }

    fbSetStatus(`✅ Extração concluída! ${totalExtraido.toLocaleString('pt-BR')} registros extraídos de ${tables.length} tabelas. Processando importação...`,'success');

    // Importar para o ERP
    fbImportToErp(r.data);

  } catch(e){
    fbSetStatus(`Erro na extração: ${e.message}`,'error');
  }
}

function fbImportToErp(rawData){
  const sess = getSession();
  if(!sess) { toast('Faça login primeiro','error'); return; }
  const empId = sess.empresaId;
  const userName = sess.usuarioNome || 'Migração Firebird';

  const result = { clientes:0, produtos:0, equipamentos:0, vendas:0, financeiro:0 };

  // ── CLIENTES ──
  const rawClientes = findTable(rawData, ['CLIENTES']);
  if(rawClientes && rawClientes.length){
    rawClientes.forEach(row => {
      const nome = row.NOME || row.RAZAO_SOCIAL || row.NOME_FANTASIA || row.FANTASIA || '';
      if(!nome.trim()) return;
      const doc = row.CNPJ || row.CPF || row.DOCUMENTO || '';
      // Verificar duplicado por documento
      const existing = db.clientes.find(c => c.empresaId === empId && c.documento && onlyDigits(c.documento) === onlyDigits(doc) && doc);
      if(existing) return;
      const id = uid('cli');
      db.clientes.push({
        id, empresaId: empId,
        codigoAntigo: row.CODIGO || row.ID || row.COD_CLIENTE || '',
        nome: nome.trim(),
        fantasia: row.FANTASIA || row.NOME_FANTASIA || '',
        documento: doc,
        tipo: (row.TIPO || (doc.length > 11 ? 'PJ' : 'PF')),
        email: row.EMAIL || row.EMAIL_CONTATO || '',
        telefone: row.FONE || row.TELEFONE || row.CELULAR || '',
        endereco: row.ENDERECO || row.ENDERECO_COMPLETO || '',
        cidade: row.CIDADE || '',
        estado: row.ESTADO || row.UF || '',
        cep: row.CEP || '',
        status: 'ativo',
        mensalidade: parseFloat(row.MENSALIDADE || row.VALOR_MENSAL || 0) || 0,
        criadoEm: new Date().toISOString(),
        criadoPor: 'migracao',
        criadoPorNome: userName
      });
      result.clientes++;
    });
  }

  // ── PRODUTOS ──
  const rawProdutos = findTable(rawData, ['PRODUTOS','CARTUCHOS']);
  if(rawProdutos && rawProdutos.length){
    rawProdutos.forEach(row => {
      const nome = row.DESCRICAO || row.NOME || row.PRODUTO || '';
      if(!nome.trim()) return;
      const sku = row.CODIGO || row.SKU || row.COD_PRODUTO || uid('prd');
      const existing = db.produtos.find(p => p.empresaId === empId && p.sku === sku);
      if(existing) return;
      db.produtos.push({
        id: uid('prd'), empresaId: empId,
        sku: String(sku),
        nome: nome.trim(),
        categoria: row.CATEGORIA || row.TIPO || 'Geral',
        fabricante: row.FABRICANTE || row.MARCA || '',
        estoque: parseInt(row.ESTOQUE || row.QTD || row.QUANTIDADE || 0) || 0,
        estoqueMin: parseInt(row.ESTOQUE_MINIMO || row.ESTOQUE_MIN || 0) || 0,
        custo: parseFloat(row.CUSTO || row.PRECO_CUSTO || 0) || 0,
        preco: parseFloat(row.PRECO || row.VALOR || row.PRECO_VENDA || 0) || 0,
        local: row.LOCALIZACAO || row.LOCAL || '',
        status: 'ativo',
        criadoPor: 'migracao',
        criadoPorNome: userName,
        criadoEm: new Date().toISOString()
      });
      result.produtos++;
    });
  }

  // ── EQUIPAMENTOS ──
  const rawEquip = findTable(rawData, ['EQUIPAMENTOS']);
  if(rawEquip && rawEquip.length){
    rawEquip.forEach(row => {
      const modelo = row.MODELO || row.DESCRICAO || row.EQUIPAMENTO || '';
      if(!modelo.trim()) return;
      const serie = row.SERIE || row.NUMERO_SERIE || row.PATRIMONIO || uid('eq');
      const existing = db.equipamentos.find(e => e.empresaId === empId && e.serie === serie);
      if(existing) return;
      db.equipamentos.push({
        id: uid('eq'), empresaId: empId,
        modelo: modelo.trim(),
        tipo: row.TIPO || 'Laser',
        serie: String(serie),
        patrimonio: row.PATRIMONIO || String(serie),
        contadorPB: parseInt(row.CONTADOR_PB || row.CONTADOR || 0) || 0,
        contadorCor: parseInt(row.CONTADOR_COR || 0) || 0,
        status: row.STATUS || 'disponivel',
        criadoPor: 'migracao',
        criadoPorNome: userName,
        criadoEm: new Date().toISOString()
      });
      result.equipamentos++;
    });
  }

  // ── VENDAS ──
  const rawVendas = findTable(rawData, ['VENDAS']);
  if(rawVendas && rawVendas.length){
    rawVendas.forEach(row => {
      const numero = row.NUMERO || row.CODIGO || row.ID || uid('vda');
      const existing = db.vendas.find(v => v.empresaId === empId && v.numero === String(numero));
      if(existing) return;
      db.vendas.push({
        id: uid('vda'), empresaId: empId,
        numero: String(numero),
        clienteId: null, // precisa mapear depois
        clienteNomeAntigo: row.CLIENTE || row.NOME_CLIENTE || '',
        data: row.DATA || row.DATA_VENDA || new Date().toISOString(),
        itens: [],
        desconto: parseFloat(row.DESCONTO || 0) || 0,
        total: parseFloat(row.TOTAL || row.VALOR_TOTAL || row.VALOR || 0) || 0,
        formaPagamento: row.FORMA_PAGAMENTO || row.PAGAMENTO || '',
        status: row.STATUS || 'faturado',
        criadoPor: 'migracao',
        criadoPorNome: userName,
        criadoEm: new Date().toISOString()
      });
      result.vendas++;
    });
  }

  // ── FINANCEIRO (CONTAS_RECEBER + CONTAS_PAGAR) ──
  const rawCR = findTable(rawData, ['CONTAS_RECEBER']);
  if(rawCR && rawCR.length){
    rawCR.forEach(row => {
      db.contasReceber.push({
        id: uid('cr'), empresaId: empId,
        origem: 'migracao',
        clienteId: null,
        descricao: row.DESCRICAO || row.HISTORICO || `Título migrado ${row.CODIGO || row.ID || ''}`,
        valor: parseFloat(row.VALOR || 0) || 0,
        vencimento: row.VENCIMENTO || row.DATA_VENCIMENTO || new Date().toISOString(),
        pagamentoData: row.DATA_PAGAMENTO || row.PAGAMENTO_DATA || null,
        status: (row.STATUS || '').toLowerCase().includes('pag') ? 'pago' : 'aberto',
        contratoId: null, leituraId: null, vendaId: null,
        criadoPor: 'migracao',
        criadoPorNome: userName
      });
      result.financeiro++;
    });
  }

  const rawCP = findTable(rawData, ['CONTAS_PAGAR']);
  if(rawCP && rawCP.length){
    rawCP.forEach(row => {
      db.contasPagar.push({
        id: uid('cp'), empresaId: empId,
        descricao: row.DESCRICAO || row.HISTORICO || `Conta migrada ${row.CODIGO || row.ID || ''}`,
        valor: parseFloat(row.VALOR || 0) || 0,
        vencimento: row.VENCIMENTO || row.DATA_VENCIMENTO || new Date().toISOString(),
        pagamentoData: row.DATA_PAGAMENTO || row.PAGAMENTO_DATA || null,
        status: (row.STATUS || '').toLowerCase().includes('pag') ? 'pago' : 'aberto',
        categoria: row.CATEGORIA || row.TIPO || 'Geral',
        criadoPor: 'migracao',
        criadoPorNome: userName
      });
      result.financeiro++;
    });
  }

  fbSetStatus(`✅ Migração concluída! ${result.clientes} clientes, ${result.produtos} produtos, ${result.equipamentos} equipamentos, ${result.vendas} vendas, ${result.financeiro} financeiro. Navegue pelos módulos para conferir.`,'success');
  toast(`Migração concluída! ${result.clientes+result.produtos+result.equipamentos+result.vendas+result.financeiro} registros importados`,'success');

  // Mostrar resultado dos módulos mapeados
  const panel = document.getElementById('fb-import-panel');
  panel.classList.remove('hidden');
  document.getElementById('fb-import-result').innerHTML = [
    {label:'Clientes', value:result.clientes, icon:'ph-users', color:'emerald'},
    {label:'Produtos', value:result.produtos, icon:'ph-package', color:'blue'},
    {label:'Equipamentos', value:result.equipamentos, icon:'ph-printer', color:'purple'},
    {label:'Vendas', value:result.vendas, icon:'ph-shopping-cart', color:'amber'},
    {label:'Financeiro', value:result.financeiro, icon:'ph-bank', color:'teal'},
  ].map(r => `
    <div class="rounded-xl border bg-${r.color}-50 border-${r.color}-200 p-4">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-${r.color}-100 grid place-items-center"><i class="ph ${r.icon} text-[16px] text-${r.color}-600"></i></div>
        <p class="text-[12px] font-bold text-${r.color}-800">${r.label}</p>
      </div>
      <p class="text-[24px] font-extrabold text-${r.color}-700 mt-2">${r.value}</p>
      <p class="text-[11px] text-${r.color}-600 mt-1">registros importados</p>
    </div>
  `).join('');

  // ── MÓDULOS DINÂMICOS — tabelas sem mapeamento direto ──
  const tabelasMapeadas = ['CLIENTES','PRODUTOS','CARTUCHOS','VENDAS','ITENS_VENDA','EQUIPAMENTOS','LOCACAO','ITENS_LOCACAO','LEITURAS','CONTAS_PAGAR','CONTAS_RECEBER','FORMA_PAGAMENTO'];
  const resultDinamico = {};
  for(const [nome, info] of Object.entries(rawData)){
    if(!info.data || !info.data.length) continue;
    const jaMapeada = tabelasMapeadas.some(m => nome.toUpperCase().includes(m));
    if(jaMapeada) continue;
    // Criar módulo dinâmico
    const icone = sugerirIcone(nome);
    db.modulosDinamicos[nome] = {
      label: formatarNomeTabela(nome),
      icone: icone,
      origem: 'Firebird',
      importadoEm: new Date().toISOString(),
      colunas: Object.keys(info.data[0]),
      dados: info.data
    };
    resultDinamico[nome] = info.data.length;
  }

  // Se criou módulos dinâmicos, mostrar no resultado
  const dinKeys = Object.keys(resultDinamico);
  if(dinKeys.length > 0){
    const dinTotal = Object.values(resultDinamico).reduce((s,v)=>s+v,0);
    const panel = document.getElementById('fb-import-panel');
    panel.classList.remove('hidden');
    const existResult = document.getElementById('fb-import-result');
    existResult.innerHTML += `
      <div class="sm:col-span-2 xl:col-span-4 rounded-xl border bg-purple-50 border-purple-200 p-4">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-8 h-8 rounded-lg bg-purple-100 grid place-items-center"><i class="ph ph-puzzle-piece text-[16px] text-purple-600"></i></div>
          <p class="text-[13px] font-bold text-purple-800">Módulos novos criados automaticamente (${dinKeys.length} tabelas → ${dinTotal} registros)</p>
        </div>
        <div class="flex flex-wrap gap-2">
          ${dinKeys.map(k=>`<span class="px-3 py-1.5 rounded-lg bg-purple-100 border border-purple-200 text-[12px] font-bold text-purple-700">${formatarNomeTabela(k)} (${resultDinamico[k]})</span>`).join('')}
        </div>
        <p class="text-[11px] text-purple-600 mt-3">Esses módulos aparecem no menu lateral com badge roxo. Você pode visualizar, buscar e exportar os dados.</p>
      </div>
    `;
  }

  saveDB();
  logAction('migracao', 'importar_firebird', '-', `Importação Firebird: ${result.clientes} clientes, ${result.produtos} produtos, ${result.equipamentos} equipamentos, ${result.vendas} vendas, ${result.financeiro} financeiro, ${dinKeys.length} módulos dinâmicos`);
  buildNav(); // Atualizar menu para mostrar módulos dinâmicos
  renderDashboard();
}

// Utilitário: encontrar tabela no raw data (case insensitive)
function findTable(rawData, possibleNames){
  for(const name of possibleNames){
    for(const key of Object.keys(rawData)){
      if(key.toUpperCase() === name.toUpperCase() && rawData[key].data){
        return rawData[key].data;
      }
    }
  }
  // Busca parcial
  for(const name of possibleNames){
    for(const key of Object.keys(rawData)){
      if(key.toUpperCase().includes(name.toUpperCase()) && rawData[key].data){
        return rawData[key].data;
      }
    }
  }
  return null;
}

async function fbExportExtracted(){
  if(!Object.keys(fbExtractedData).length) return toast('Nenhum dado extraído','info');

  if(window.fileAPI){
    const r = await window.fileAPI.saveJson({ extraidoEm: new Date().toISOString(), tabelas: fbExtractedData }, `migricao_digicopy_${new Date().toISOString().slice(0,10)}.json`);
    if(r.ok){
      toast(`Exportado para: ${r.path}`,'success');
      fbSetStatus(`✅ Dados exportados para: ${r.path}`,'success');
    }
  } else {
    // Fallback: download via blob
    const dataStr = JSON.stringify({ extraidoEm: new Date().toISOString(), tabelas: fbExtractedData }, null, 2);
    const blob = new Blob([dataStr], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migracao_digicopy_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    toast('Arquivo JSON baixado','success');
  }
}

