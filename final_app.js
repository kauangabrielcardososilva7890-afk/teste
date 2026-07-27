// DIGICOPY ERP v3.0 - Core com Login 2 etapas (CNPJ > Usuário) + Auditoria
const DB_KEY='digicopy_erp_v30';
const SESSION_KEY='digicopy_session_v30';
const PENDING_CNPJ_KEY='digicopy_pending_cnpj';

const defaultData={
  empresas:[],
  usuarios:[],
  clientes:[], produtos:[], equipamentos:[], contratos:[], parque:[], leituras:[], os:[], vendas:[], contasReceber:[], contasPagar:[], logs:[],
  tecnicos:[{id:'t1',nome:'Carlos Mendes',especialidade:'Laser Mono',osConcluidas:87},{id:'t2',nome:'Ana Souza',especialidade:'Color',osConcluidas:62},{id:'t3',nome:'Rafael Lima',especialidade:'Grande formato',osConcluidas:44}],
  config:{empresa:{nome:'DIGICOPY Cartuchos e Impressoras LTDA',cnpj:'12.345.678/0001-90',fone:'(11) 3333-4444',email:'contato@digicopy.com.br'}}
};

function loadDB(){
  const raw=localStorage.getItem(DB_KEY);
  if(!raw) return structuredClone(defaultData);
  try{const parsed=JSON.parse(raw); // migração se faltar campos
    if(!parsed.empresas) parsed.empresas=[]; if(!parsed.usuarios) parsed.usuarios=[];
    if(!parsed.logs) parsed.logs=[]; if(!parsed.tecnicos) parsed.tecnicos=defaultData.tecnicos;
    return parsed;
  }catch{return structuredClone(defaultData)}
}
function saveDB(){localStorage.setItem(DB_KEY, JSON.stringify(db));}
let db=loadDB();

function uid(p='id'){return p+'_'+Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-3)}
function fmtMoney(v){return (v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function fmtDate(s){if(!s) return '-'; const d=new Date(s); if(isNaN(d)) return s; return d.toLocaleDateString('pt-BR')}
function fmtDateTime(s){if(!s) return '-'; return new Date(s).toLocaleString('pt-BR')}
function onlyDigits(s){return (s||'').replace(/\D/g,'')}
function initials(name){return (name||'').split(' ').filter(Boolean).slice(0,2).map(n=>n[0].toUpperCase()).join('')||'??'}

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
  if(view==='banco'){ window.open('banco.html','_blank'); return; }
  document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
  const target=document.getElementById('view-'+view);
  if(target) target.classList.remove('hidden');
  document.querySelectorAll('[data-nav]').forEach(b=>{b.classList.remove('bg-white/[0.12]','text-white','border','border-white/10'); b.classList.add('text-white/60')});
  const act=document.querySelector(`[data-nav="${view}"]`); if(act){act.classList.add('bg-white/[0.12]','text-white','border','border-white/10'); act.classList.remove('text-white/60')}
  const titles={dashboard:['Dashboard','Visão geral da operação'],clientes:['Clientes','Base de clientes'],produtos:['Produtos & Suprimentos','Controle de estoque'],impressoras:['Impressoras & Patrimônio','Gestão de equipamentos'],contratos:['Contratos de Locação','Franquias e vigências'],parque:['Parque Instalado','Equipamentos alocados'],leituras:['Leituras & Faturamento','Coleta contadores'],manutencao:['Manutenção & Chamados','OS, técnicos, SLA'],vendas:['Vendas & Faturamento','Vendas avulsas'],financeiro:['Financeiro','Receber, pagar, fluxo'],relatorios:['Relatórios','Análises gerenciais'],config:['Configurações','Empresa, técnicos'],usuarios:['Usuários & Acessos','Login CNPJ > Usuário • Auditoria'],auditoria:['Auditoria','Quem fez o quê, quando']};
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
  if(view==='financeiro'){renderFinanceiro(); renderFluxoChart();}
  if(view==='config') renderConfig();
  if(view==='usuarios') renderUsuarios();
  if(view==='auditoria') renderAuditoria();
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
  const main=[{id:'dashboard',icon:'ph-squares-four',label:'Dashboard'},{id:'clientes',icon:'ph-users',label:'Clientes'},{id:'produtos',icon:'ph-package',label:'Produtos'},{id:'impressoras',icon:'ph-printer',label:'Impressoras'}];
  const op=[{id:'contratos',icon:'ph-file-text',label:'Contratos'},{id:'parque',icon:'ph-map-pin',label:'Parque Instalado'},{id:'leituras',icon:'ph-speedometer',label:'Leituras'},{id:'manutencao',icon:'ph-wrench',label:'Manutenção / OS'}];
  const gest=[{id:'vendas',icon:'ph-shopping-cart',label:'Vendas'},{id:'financeiro',icon:'ph-bank',label:'Financeiro'},{id:'relatorios',icon:'ph-chart-line',label:'Relatórios'},{id:'usuarios',icon:'ph-users-three',label:'Usuários'},{id:'auditoria',icon:'ph-clipboard-text',label:'Auditoria'},{id:'config',icon:'ph-gear',label:'Configurações'}];
  function rg(list,target){
    const cont=document.getElementById(target);
    cont.innerHTML=list.map(item=>`<button data-nav="${item.id}" onclick="navigateTo('${item.id}')" class="w-full h-10 px-3 rounded-xl flex items-center gap-3 text-[13.5px] font-medium transition text-white/60 hover:bg-white/[0.08] hover:text-white ${item.id==='dashboard'?'bg-white/[0.12] text-white border border-white/10':''}"><i class="ph ${item.icon} text-[19px]"></i><span>${item.label}</span>${item.id==='manutencao'?`<span class="ml-auto text-[11px] bg-amber-400 text-amber-950 font-bold px-2 py-0.5 rounded-full">${(db.os.filter(o=>o.empresaId===(sess?.empresaId) && o.status!=='concluido').length)}</span>`:''}${item.id==='leituras'?`<span class="ml-auto text-[11px] bg-white text-[#0a1e8a] font-bold px-2 py-0.5 rounded-full">${(db.leituras.filter(l=>l.empresaId===(sess?.empresaId) && l.status==='pendente').length)}</span>`:''}</button>`).join('');
  }
  rg(main,'nav-main'); rg(op,'nav-op'); rg(gest,'nav-gest');
}

function initTemplates(){
  document.getElementById('view-dashboard').innerHTML=`
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
    <div class="rounded-[20px] bg-white border p-5 shadow-sm"><div class="flex justify-between"><div class="w-10 h-10 rounded-xl bg-[#e8eaf8] text-[#0a1e8a] grid place-items-center"><i class="ph ph-file-text text-[20px]"></i></div><span class="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border">+2 mês</span></div><p class="mt-4 text-[12.5px] font-semibold text-slate-500 uppercase">Contratos Ativos</p><p class="text-[28px] font-bold mt-1" id="kpi-contratos">0</p><div class="mt-3 flex items-center gap-2 text-[12px]"><div class="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div class="h-full bg-[#0a1e8a] w-[72%]"></div></div><span>72% meta</span></div></div>
    <div class="rounded-[20px] bg-white border p-5 shadow-sm"><div class="flex justify-between"><div class="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 grid place-items-center"><i class="ph ph-printer text-[20px]"></i></div><span class="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-900 text-white">Parque</span></div><p class="mt-4 text-[12.5px] font-semibold text-slate-500 uppercase">Impressoras Locadas</p><p class="text-[28px] font-bold mt-1" id="kpi-parque">0</p><p class="mt-2 text-[12.5px] text-slate-500"><span id="kpi-disponiveis" class="font-semibold text-slate-800">0</span> disponíveis</p></div>
    <div class="rounded-[20px] bg-white border p-5 shadow-sm"><div class="flex justify-between"><div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 grid place-items-center"><i class="ph ph-warning-circle text-[20px]"></i></div><span class="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border">Atenção</span></div><p class="mt-4 text-[12.5px] font-semibold text-slate-500 uppercase">Chamados Abertos</p><p class="text-[28px] font-bold mt-1" id="kpi-os">0</p><p class="mt-2 text-[11px] text-slate-500"><span id="kpi-auditoria" class="font-semibold">- </span>ações auditadas hoje</p></div>
    <div class="rounded-[20px] bg-[#0a1e8a] text-white p-5 shadow-lg relative overflow-hidden"><div class="absolute right-0 top-0 w-56 h-56 bg-white/10 blur-3xl rounded-full"></div><div class="flex justify-between relative z-10"><div class="w-10 h-10 rounded-xl bg-white/15 grid place-items-center"><i class="ph ph-currency-dollar text-[20px]"></i></div><span class="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/15 border border-white/10">Este mês</span></div><p class="mt-4 text-[12.5px] font-semibold text-white/60 uppercase relative z-10">Faturamento Previsto</p><p class="text-[28px] font-bold mt-1 relative z-10" id="kpi-faturamento">R$ 0,00</p><div class="mt-3 flex items-center gap-1.5 text-[12px] text-emerald-200 relative z-10"><i class="ph ph-trend-up"></i><span class="font-semibold">Auditado por usuário</span></div></div>
  </div>
  <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
    <div class="xl:col-span-2 rounded-[20px] bg-white border p-6 shadow-sm"><div class="flex items-center justify-between mb-6"><div><h3 class="font-bold text-[15px]">Faturamento x Custos - 6 meses</h3><p class="text-[12.5px] text-slate-500">Locação + Vendas + Excedentes</p></div></div><div class="h-[260px]"><canvas id="chartFinance"></canvas></div></div>
    <div class="rounded-[20px] bg-white border p-6 shadow-sm flex flex-col"><h3 class="font-bold text-[15px]">Status do parque</h3><div class="mt-6 flex-1 grid place-items-center"><div class="w-[200px] h-[200px]"><canvas id="chartParque"></canvas></div></div><div class="mt-6 grid grid-cols-2 gap-3 text-[12px]" id="parque-legend"></div></div>
  </div>
  <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
    <div class="rounded-[20px] bg-white border shadow-sm"><div class="p-5 border-b flex items-center justify-between"><h3 class="font-bold text-[14px]">Leituras pendentes</h3><button onclick="navigateTo('leituras')" class="text-[12px] font-semibold text-[#0a1e8a]">Ver tudo</button></div><div class="divide-y divide-slate-50" id="list-leituras-pendentes"></div></div>
    <div class="rounded-[20px] bg-white border shadow-sm"><div class="p-5 border-b flex items-center justify-between"><h3 class="font-bold text-[14px]">Últimos chamados</h3><button onclick="navigateTo('manutencao')" class="text-[12px] font-semibold text-[#0a1e8a]">Ver tudo</button></div><div class="divide-y divide-slate-50" id="list-chamados-recentes"></div></div>
    <div class="rounded-[20px] bg-white border shadow-sm"><div class="p-5 border-b flex items-center justify-between"><h3 class="font-bold text-[14px]">Auditoria recente</h3><button onclick="navigateTo('auditoria')" class="text-[12px] font-semibold text-[#0a1e8a]">Ver tudo</button></div><div class="p-3 space-y-2" id="list-alertas"></div></div>
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
  document.getElementById('current-date').innerText=new Date().toLocaleDateString('pt-BR',{weekday:'long', day:'2-digit', month:'long', year:'numeric'});
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
  document.getElementById('current-date').innerText=new Date().toLocaleDateString('pt-BR',{weekday:'long', day:'2-digit', month:'long', year:'numeric'});
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
// DIGICOPY ERP v3.1 - PATCH vendas aprimoradas + cliente codigo + login primeira vez + logo original handling
(function(){
  // Garantir codigos de clientes existentes
  function ensureClienteCodigos(){
    const sess = typeof getSession==='function' ? getSession() : null;
    if(!sess) return;
    let maxCode = 0;
    db.clientes.forEach(c=>{ if(c.empresaId===sess.empresaId && c.codigo && c.codigo>maxCode) maxCode=c.codigo; });
    db.clientes.forEach(c=>{
      if(c.empresaId===sess.empresaId && !c.codigo){
        maxCode++;
        c.codigo = maxCode;
      }
    });
    saveDB();
  }

  // Sobrescrever seedData para incluir codigo se precisar
  const originalSeed = window.seedData;
  window.seedData = function(force=false){
    if(originalSeed) originalSeed(force);
    // adicionar codigos
    const sess = getSession();
    if(sess){
      let code=1;
      db.clientes.filter(c=>c.empresaId===sess.empresaId).forEach(c=>{ if(!c.codigo) c.codigo=code++; });
      // garantir produtos tem categoria Recarga
      if(!db.produtos.find(p=>p.categoria==='Recarga')){
        db.produtos.push({id:uid('prd'),empresaId:sess.empresaId,sku:'REC-TONER',nome:'Recarga de Toner HP 12A',categoria:'Recarga',fabricante:'DIGICOPY',estoque:999,estoqueMin:0,custo:25,preco:60,local:'-',status:'ativo',criadoPor:sess.usuarioId,criadoPorNome:sess.usuarioNome,criadoEm:new Date().toISOString()});
      }
      saveDB();
    }
  };

  // LOGIN - primeira vez só CNPJ
  // Modifica showLogin para tentar auto-preencher CNPJ se já existe empresa padrão
  const originalShowLogin = window.showLogin;
  window.showLogin = function(){
    const lastCnpj = localStorage.getItem('digicopy_last_cnpj');
    if(lastCnpj){
      // tenta setar pending como última empresa conhecida
      const emp = db.empresas.find(e=>onlyDigits(e.cnpj)===onlyDigits(lastCnpj));
      if(emp){
        setPendingEmpresa(emp);
      }
    }
    if(originalShowLogin) originalShowLogin();
    // se tem pending, já mostra step usuario (CNPJ só primeira vez implicitamente lembrado)
    const pending = getPendingEmpresa();
    if(pending){
      // se usuário já tem sessão? não, mas se tem pending e tem lastCnpj, mostra dica que CNPJ lembrado
      const dica = document.getElementById('login-step-user');
      if(dica){
        // adiciona badge "CNPJ lembrado"
      }
    }
  };
  const originalDoLoginCNPJ = window.doLoginCNPJ;
  window.doLoginCNPJ = function(){
    const cnpjInput = document.getElementById('login-cnpj').value.trim();
    if(cnpjInput){
      localStorage.setItem('digicopy_last_cnpj', cnpjInput);
    }
    if(originalDoLoginCNPJ) originalDoLoginCNPJ();
  };

  // NOVA VENDA - redesign completo
  window.novaVenda = function(){
    const sess = getSession(); if(!sess) return;
    ensureClienteCodigos();
    // garante codigo
    let maxCode=0;
    db.clientes.filter(c=>c.empresaId===sess.empresaId).forEach(c=>{ if(c.codigo>maxCode) maxCode=c.codigo; });
    // se algum sem codigo, atribui
    db.clientes.filter(c=>c.empresaId===sess.empresaId && !c.codigo).forEach(c=>{ maxCode++; c.codigo=maxCode; });
    saveDB();

    document.getElementById('modal-title').innerText='Nova venda / Notinha - Busca aberta';
    const modalBody = `
    <div class="space-y-5">
      <!-- CLIENTE - CAIXA ABERTA -->
      <div class="rounded-[14px] border-2 border-[#0a1e8a]/20 bg-[#f8f9ff] p-4">
        <label class="text-[11px] font-bold tracking-wide uppercase text-[#0a1e8a]">Cliente - Caixa aberta para pesquisar (código, nome, CPF/CNPJ, endereço, telefone)</label>
        <div class="mt-2 relative">
          <div class="relative">
            <i class="ph ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0a1e8a] text-[18px]"></i>
            <input id="nv-cliente-search" oninput="searchClientesVenda(this.value)" placeholder="Digite código, nome, CPF/CNPJ, endereço, telefone... Ex: 1844, JOAO LUCAS, 45.123.678/0001-12, Rua Albino..." class="w-full h-[48px] pl-11 pr-4 rounded-xl border-2 border-[#0a1e8a]/20 bg-white focus:bg-white focus:border-[#0a1e8a] focus:ring-4 focus:ring-[#0a1e8a]/10 outline-none text-[13.5px] font-medium">
            <button onclick="openModalClienteFromVenda()" class="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-3 rounded-lg bg-[#0a1e8a] text-white text-[11px] font-bold flex items-center gap-1"><i class="ph ph-plus"></i> Novo cliente</button>
          </div>
          <div id="nv-cliente-results" class="mt-2 max-h-[260px] overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg hidden"></div>
          <div id="nv-cliente-selecionado" class="mt-3 hidden rounded-xl bg-white border border-[#0a1e8a]/20 p-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-[#0a1e8a] text-white grid place-items-center font-bold text-[12px]" id="nv-cli-avatar">JL</div>
              <div>
                <p class="font-bold text-[13px]" id="nv-cli-nome">Cliente</p>
                <p class="text-[11px] text-slate-500" id="nv-cli-detalhes">Código • CPF • Endereço</p>
              </div>
            </div>
            <button onclick="clearClienteVenda()" class="w-8 h-8 grid place-items-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"><i class="ph ph-x"></i></button>
          </div>
        </div>
      </div>

      <!-- PRODUTO - CAIXA FECHADA AUXILIAR + CAIXA ABERTA -->
      <div class="rounded-[14px] border border-slate-200 p-4 bg-white">
        <div class="flex items-center justify-between mb-3">
          <label class="text-[11px] font-bold tracking-wide uppercase text-slate-500">Adicionar produto - Selecione tipo (caixa fechada) + busque (caixa aberta)</label>
          <span class="text-[10px] px-2 py-1 rounded-full bg-[#e8eaf8] text-[#0a1e8a] font-bold">2 caixas: fechada aux + aberta busca</span>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div class="col-span-1">
            <label class="text-[11px] font-bold uppercase text-slate-500">Tipo (caixa fechada)</label>
            <select id="nv-tipo-item" onchange="onTipoItemChange()" class="mt-1 w-full h-[44px] px-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-[13px] font-semibold">
              <option value="produtos">Produtos / Itens</option>
              <option value="recarga">Recarga</option>
            </select>
          </div>
          <div class="col-span-2">
            <label class="text-[11px] font-bold uppercase text-slate-500">Buscar produto (caixa aberta)</label>
            <div class="relative mt-1">
              <i class="ph ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input id="nv-prod-search" oninput="searchProdutosVenda(this.value)" placeholder="Digite nome, código, ref... ex: TONER, CARTUCHO, RESET..." class="w-full h-[44px] pl-11 pr-[90px] rounded-xl border border-slate-200 bg-white focus:border-[#0a1e8a] focus:ring-4 focus:ring-[#0a1e8a]/10 outline-none text-[13px]">
              <button onclick="openModalProdutoFromVenda()" class="absolute right-1 top-1/2 -translate-y-1/2 h-[36px] px-3 rounded-lg bg-[#0a1e8a] text-white text-[11px] font-bold">+ Novo</button>
            </div>
          </div>
        </div>
        <div id="nv-prod-results" class="mt-3 rounded-xl border border-slate-200 bg-white shadow-sm max-h-[280px] overflow-auto hidden"></div>
        <div id="nv-itens" class="mt-4 space-y-2 max-h-[220px] overflow-auto border-t border-slate-100 pt-3"></div>
        <div class="mt-3 flex justify-between items-center">
          <span class="text-[12px] text-slate-500">Itens: <b id="nv-itens-count">0</b></span>
          <div class="text-right"><p class="text-[11px] uppercase font-bold text-slate-500">Total notinha</p><b id="nv-total" class="text-[20px] text-[#0a1e8a]">R$ 0,00</b></div>
        </div>
      </div>

      <!-- PAGAMENTO - só aparece quando for faturar -->
      <div id="nv-pagamento-section" class="rounded-[14px] border-2 border-[#0a1e8a]/20 bg-[#f8f9ff] p-4 hidden">
        <div class="flex items-center justify-between">
          <label class="text-[11px] font-bold tracking-wide uppercase text-[#0a1e8a]">Formas de pagamento (só aparece ao faturar)</label>
          <span class="text-[10px] px-2 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">Aparece só ao faturar</span>
        </div>
        <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="text-[11px] font-bold uppercase text-slate-500">Forma de pagamento *</label>
            <select id="nv-pag" onchange="onPagamentoChange()" class="mt-1 w-full h-[44px] px-3 rounded-xl border-2 border-[#0a1e8a]/20 bg-white text-[13px] font-medium">
              <option value="">Selecione...</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="PIX">PIX à vista</option>
              <option value="Cartão de crédito">Cartão de crédito</option>
              <option value="Cartão de débito">Cartão de débito</option>
              <option value="Boleto">Boleto</option>
              <option value="A prazo">A prazo</option>
              <option value="Conta">Conta (Transferência por conta)</option>
            </select>
          </div>
          <div id="nv-vencimento-wrapper" class="hidden">
            <label class="text-[11px] font-bold uppercase text-slate-500">Vencimento (A prazo) - escolha data</label>
            <input id="nv-vencimento" type="date" class="mt-1 w-full h-[44px] px-3 rounded-xl border-2 border-amber-300 bg-amber-50 text-[13px]">
            <p class="text-[11px] text-amber-700 mt-1">Ao selecionar "A prazo", escolha a data de vencimento aqui.</p>
          </div>
        </div>
        <div id="nv-pag-detalhes" class="mt-3 text-[12px] text-slate-600"></div>
      </div>

      <!-- STATUS E DESCONTO -->
      <div class="grid grid-cols-3 gap-3">
        <div><label class="text-[11px] font-bold uppercase text-slate-500">Desconto R$</label><input id="nv-desc" type="number" step="0.01" value="0" oninput="updateVendaTotal()" class="mt-1 w-full h-[44px] px-3 rounded-xl border text-[13px]"></div>
        <div><label class="text-[11px] font-bold uppercase text-slate-500">Status</label><select id="nv-status" onchange="onStatusVendaChange()" class="mt-1 w-full h-[44px] px-3 rounded-xl border text-[13px] font-medium"><option value="orcamento">Orçamento</option><option value="aprovado">Aprovado</option><option value="faturado">Faturado</option><option value="aguardar">Aguardar</option></select></div>
        <div class="flex items-end"><div class="w-full rounded-xl bg-[#0a1e8a] text-white p-3 text-center"><p class="text-[10px] uppercase font-bold tracking-wide opacity-70">Atendente</p><p class="font-bold text-[13px] mt-1" id="nv-atendente">KAUAN</p><p class="text-[10px] opacity-60 mt-1" id="nv-hora">00:00:00</p></div></div>
      </div>

      <div class="rounded-xl bg-[#e8eaf8] border border-[#c9ceef] p-3 text-[11px] text-[#0a1e8a] flex gap-2"><i class="ph ph-info text-[16px] mt-0.5"></i><div><b>Auditoria:</b> Venda será registrada como criada por <b id="nv-audit-user">-</b> com CNPJ <span id="nv-audit-cnpj">-</span>. Caixa aberta cliente busca por código, nome, CPF/CNPJ, endereço, telefone.</div></div>
    </div>
    `;
    document.getElementById('modal-body').innerHTML = modalBody;
    document.getElementById('modal-footer').innerHTML = `<button onclick="closeModal()" class="h-11 px-5 rounded-xl bg-white border">Cancelar</button><button onclick="saveVendaNova()" class="h-11 px-6 rounded-xl bg-[#0a1e8a] text-white font-semibold">Salvar notinha</button>`;

    // sess already declared - reuse
    document.getElementById('nv-atendente').innerText = (sess.usuarioNome||'').split(' ')[0].toUpperCase() || 'KAUAN';
    document.getElementById('nv-hora').innerText = new Date().toLocaleTimeString('pt-BR');
    document.getElementById('nv-audit-user').innerText = sess.usuarioNome;
    document.getElementById('nv-audit-cnpj').innerText = sess.cnpj;
    window.itensTemp = [];
    window.clienteSelecionadoVenda = null;
    window.searchClientesVenda = function(q){
      const sess = getSession(); const resultsEl = document.getElementById('nv-cliente-results');
      if(!q || q.length<1){ resultsEl.classList.add('hidden'); resultsEl.innerHTML=''; return; }
      const low = q.toLowerCase();
      const filtrados = db.clientes.filter(c=>c.empresaId===sess.empresaId && (
        (c.codigo && String(c.codigo).includes(low)) ||
        (c.nome && c.nome.toLowerCase().includes(low)) ||
        (c.documento && c.documento.toLowerCase().includes(low)) ||
        (c.endereco && c.endereco.toLowerCase().includes(low)) ||
        (c.cidade && c.cidade.toLowerCase().includes(low)) ||
        (c.telefone && c.telefone.toLowerCase().includes(low)) ||
        (c.email && c.email.toLowerCase().includes(low))
      )).slice(0,12);
      if(!filtrados.length){ resultsEl.innerHTML = `<div class="p-4 text-center text-[12px] text-slate-500">Nenhum cliente encontrado para "${q}" <br><button onclick="openModalClienteFromVenda()" class="mt-2 h-8 px-3 rounded-lg bg-[#0a1e8a] text-white text-[11px] font-bold">+ Novo cliente</button></div>`; resultsEl.classList.remove('hidden'); return; }
      resultsEl.innerHTML = filtrados.map(c=>`
        <div onclick="selectClienteVenda('${c.id}')" class="p-3 hover:bg-[#f8f9ff] cursor-pointer border-b border-slate-50 last:border-0 flex items-center justify-between group">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-[#0a1e8a] text-white grid place-items-center font-bold text-[11px]">${c.codigo||'--'}</div>
            <div>
              <p class="font-bold text-[13px] leading-tight group-hover:text-[#0a1e8a]">${c.nome}</p>
              <p class="text-[11px] text-slate-500">${c.codigo ? 'Cód: '+c.codigo+' • ':''}${c.documento||''} • ${c.endereco||''} • ${c.telefone||''} • ${c.cidade||''}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-[11px] font-mono text-slate-400">${c.codigo||''}</p>
            <i class="ph ph-arrow-right text-slate-300 group-hover:text-[#0a1e8a]"></i>
          </div>
        </div>
      `).join('');
      resultsEl.classList.remove('hidden');
    };
    window.selectClienteVenda = function(id){
      const c = db.clientes.find(x=>x.id===id);
      if(!c) return;
      window.clienteSelecionadoVenda = c;
      document.getElementById('nv-cliente-search').value = `${c.codigo||''} - ${c.nome}`;
      document.getElementById('nv-cliente-results').classList.add('hidden');
      document.getElementById('nv-cliente-selecionado').classList.remove('hidden');
      document.getElementById('nv-cli-avatar').innerText = initials(c.nome);
      document.getElementById('nv-cli-nome').innerText = c.nome;
      document.getElementById('nv-cli-detalhes').innerText = `Cód: ${c.codigo||'-'} • ${c.documento||''} • ${c.endereco||''} • ${c.telefone||''} • ${c.cidade||''}/${c.estado||''}`;
    };
    window.clearClienteVenda = function(){
      window.clienteSelecionadoVenda = null;
      document.getElementById('nv-cliente-search').value='';
      document.getElementById('nv-cliente-selecionado').classList.add('hidden');
      document.getElementById('nv-cliente-results').classList.add('hidden');
    };
    window.openModalClienteFromVenda = function(){
      // abre modal cliente mas mantém referência para voltar
      const nomeDigitado = document.getElementById('nv-cliente-search').value;
      openModal('cliente');
      setTimeout(()=>{
        const el = document.getElementById('f-cli-nome');
        if(el && nomeDigitado) el.value = nomeDigitado;
      },200);
    };
    window.onTipoItemChange = function(){
      const tipo = document.getElementById('nv-tipo-item').value;
      const searchEl = document.getElementById('nv-prod-search');
      if(tipo==='recarga'){ searchEl.placeholder='Buscar recarga... ex: RECARGA HP, RECARGA 12A...'; }
      else{ searchEl.placeholder='Buscar produto/itens... ex: TONER, CARTUCHO, RESET...'; }
      // re-filtra
      searchProdutosVenda(searchEl.value);
    };
    window.searchProdutosVenda = function(q){
      const sess=getSession(); const tipo=document.getElementById('nv-tipo-item').value; const resultsEl=document.getElementById('nv-prod-results');
      const low=(q||'').toLowerCase();
      let lista = db.produtos.filter(p=>p.empresaId===sess.empresaId && p.status==='ativo');
      if(tipo==='recarga'){
        lista = lista.filter(p=>p.categoria==='Recarga' || p.nome.toLowerCase().includes('recarga'));
      }else{
        // produtos/itens = tudo exceto recarga? ou todos? Vamos incluir todos exceto recarga para diferenciar, mas se busca contém recarga ainda mostra?
        lista = lista.filter(p=>p.categoria!=='Recarga');
      }
      if(low){
        lista = lista.filter(p=> 
          (p.nome && p.nome.toLowerCase().includes(low)) ||
          (p.sku && p.sku.toLowerCase().includes(low)) ||
          (p.categoria && p.categoria.toLowerCase().includes(low)) ||
          (p.fabricante && p.fabricante.toLowerCase().includes(low))
        );
      }
      lista = lista.slice(0,15);
      if(!lista.length){
        resultsEl.innerHTML = `<div class="p-3 text-center text-[12px] text-slate-500">Nenhum produto em <b>${tipo}</b> para "${q||''}"<br><button onclick="openModalProdutoFromVenda()" class="mt-2 h-8 px-3 rounded-lg bg-[#0a1e8a] text-white text-[11px] font-bold">+ Criar novo produto</button></div>`;
        resultsEl.classList.remove('hidden');
        return;
      }
      resultsEl.innerHTML = `
        <div class="p-2 border-b bg-slate-50 flex items-center justify-between text-[11px] font-bold uppercase text-slate-500"><span>Pesquisar produto / serviço</span><span>${lista.length} resultados</span></div>
        ${lista.map(p=>`
          <div class="p-3 hover:bg-[#f8f9ff] cursor-pointer border-b border-slate-50 last:border-0 flex items-center justify-between group" onclick="selectProdutoVenda('${p.id}')">
            <div class="flex-1">
              <p class="font-bold text-[13px] leading-tight group-hover:text-[#0a1e8a]">${p.nome}</p>
              <p class="text-[11px] text-slate-500">SKU: ${p.sku} • ${p.categoria} • ${p.fabricante} • Est: ${p.estoque}</p>
              <p class="text-[11px] font-bold text-[#0a1e8a]">R$ ${p.preco.toFixed(2).replace('.',',')} • Criado por ${p.criadoPorNome||'-'}</p>
            </div>
            <div class="text-right ml-3">
              <p class="text-[12px] font-bold">${fmtMoney(p.preco)}</p>
              <p class="text-[11px] text-slate-400 font-mono">${p.estoque} un</p>
              <button class="mt-1 w-7 h-7 grid place-items-center rounded-lg bg-[#0a1e8a] text-white"><i class="ph ph-plus"></i></button>
            </div>
          </div>
        `).join('')}
        <div class="p-2 flex gap-2"><button onclick="openModalProdutoFromVenda()" class="flex-1 h-9 rounded-xl bg-white border border-[#0a1e8a]/20 text-[#0a1e8a] text-[11px] font-bold">+ Novo produto (foco notinha)</button><button onclick="document.getElementById('nv-prod-results').classList.add('hidden')" class="h-9 px-4 rounded-xl bg-slate-900 text-white text-[11px] font-bold">Ok</button></div>
      `;
      resultsEl.classList.remove('hidden');
    };
    window.openModalProdutoFromVenda = function(){
      const termo = document.getElementById('nv-prod-search').value;
      const tipo = document.getElementById('nv-tipo-item').value;
      // abre modal produto com foco em adicionar na notinha
      openModal('produto');
      setTimeout(()=>{
        const nomeEl = document.getElementById('f-prd-nome');
        const catEl = document.getElementById('f-prd-cat');
        if(nomeEl && termo) nomeEl.value = termo.toUpperCase();
        if(catEl){
          if(tipo==='recarga') catEl.value='Recarga';
          else catEl.value='Suprimento';
        }
      },200);
    };
    window.selectProdutoVenda = function(id){
      const p = db.produtos.find(x=>x.id===id); if(!p) return;
      // verificar se já existe nos itensTemp
      let existing = window.itensTemp.find(i=>i.produtoId===id);
      if(existing){ existing.qtd++; existing.subtotal = existing.qtd*existing.preco; }
      else{ window.itensTemp.push({produtoId:id, qtd:1, preco:p.preco, subtotal:p.preco}); }
      renderItensVenda();
      updateVendaTotal();
      // não esconde resultados para continuar adicionando
    };
    window.renderItensVenda = function(){
      const container = document.getElementById('nv-itens');
      if(!window.itensTemp.length){ container.innerHTML = '<p class="text-[12px] text-slate-400 text-center py-4">Nenhum item adicionado. Use a caixa aberta acima para buscar.</p>'; document.getElementById('nv-itens-count').innerText='0'; return; }
      container.innerHTML = window.itensTemp.map((it,idx)=>{
        const p=db.produtos.find(x=>x.id===it.produtoId);
        return `<div class="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#0a1e8a]/30 transition">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-[#0a1e8a] text-white grid place-items-center font-bold text-[10px]">${it.qtd}</div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-[12.5px] truncate">${p?.nome||'Produto'}</p>
              <p class="text-[11px] text-slate-500">${p?.sku||''} • ${fmtMoney(it.preco)} un • Criado por ${p?.criadoPorNome||'-'}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1">
              <button onclick="alterarQtdItem(${idx},-1)" class="w-7 h-7 grid place-items-center rounded-lg bg-slate-100 hover:bg-slate-200"><i class="ph ph-minus"></i></button>
              <span class="w-8 text-center font-bold text-[12px]">${it.qtd}</span>
              <button onclick="alterarQtdItem(${idx},1)" class="w-7 h-7 grid place-items-center rounded-lg bg-slate-100 hover:bg-slate-200"><i class="ph ph-plus"></i></button>
            </div>
            <b class="text-[12px] min-w-[70px] text-right">${fmtMoney(it.subtotal)}</b>
            <button onclick="removerItemVenda(${idx})" class="w-7 h-7 grid place-items-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"><i class="ph ph-trash"></i></button>
          </div>
        </div>`;
      }).join('');
      document.getElementById('nv-itens-count').innerText = window.itensTemp.length;
    };
    window.alterarQtdItem = function(idx,delta){
      const it = window.itensTemp[idx]; if(!it) return;
      it.qtd += delta;
      if(it.qtd<=0){ window.itensTemp.splice(idx,1); }
      else{ it.subtotal = it.qtd*it.preco; }
      renderItensVenda(); updateVendaTotal();
    };
    window.removerItemVenda = function(idx){ window.itensTemp.splice(idx,1); renderItensVenda(); updateVendaTotal(); };
    window.updateVendaTotal = function(){
      const sub = window.itensTemp.reduce((s,i)=>s+i.subtotal,0);
      const desc = parseFloat(document.getElementById('nv-desc').value)||0;
      const total = sub - desc;
      document.getElementById('nv-total').innerText = fmtMoney(total);
    };
    window.onStatusVendaChange = function(){
      const status = document.getElementById('nv-status').value;
      const pagSection = document.getElementById('nv-pagamento-section');
      if(status==='faturado'){
        pagSection.classList.remove('hidden');
      }else{
        pagSection.classList.add('hidden');
      }
    };
    window.onPagamentoChange = function(){
      const pag = document.getElementById('nv-pag').value;
      const vencWrapper = document.getElementById('nv-vencimento-wrapper');
      const detalhes = document.getElementById('nv-pag-detalhes');
      if(pag==='A prazo'){
        vencWrapper.classList.remove('hidden');
        detalhes.innerHTML = '<p>Selecione a data de vencimento para pagamento a prazo.</p>';
      }else{
        vencWrapper.classList.add('hidden');
        if(pag==='Conta (Transferência por conta)'){
          detalhes.innerHTML = '<p>Transferência bancária - informe conta na descrição da venda se necessário.</p>';
        }else if(pag){
          detalhes.innerHTML = `<p>Forma selecionada: <b>${pag}</b></p>`;
        }else{
          detalhes.innerHTML = '';
        }
      }
    };
    window.saveVendaNova = function(){
      const sess=getSession();
      if(!window.clienteSelecionadoVenda) return toast('Selecione o cliente pela caixa aberta','error');
      if(!window.itensTemp.length) return toast('Adicione pelo menos um produto pela caixa aberta','error');
      const status = document.getElementById('nv-status').value;
      let pagamento = document.getElementById('nv-pag').value;
      let vencimento = null;
      if(status==='faturado'){
        if(!pagamento) return toast('Selecione forma de pagamento (aparece ao faturar)','error');
        if(pagamento==='A prazo'){
          vencimento = document.getElementById('nv-vencimento').value;
          if(!vencimento) return toast('Selecione a data de vencimento para A prazo','error');
        }
      }
      const desc = parseFloat(document.getElementById('nv-desc').value)||0;
      const total = window.itensTemp.reduce((s,i)=>s+i.subtotal,0) - desc;
      const venda = {
        id:uid('vda'), empresaId:sess.empresaId,
        numero:'VD-'+new Date().getFullYear()+'-'+String(db.vendas.filter(v=>v.empresaId===sess.empresaId).length+1).padStart(4,'0'),
        clienteId: window.clienteSelecionadoVenda.id,
        data:new Date().toISOString(),
        itens:[...window.itensTemp],
        desconto:desc,
        total,
        formaPagamento: pagamento || 'Não faturado',
        vencimento: vencimento || null,
        status,
        criadoPor:sess.usuarioId,
        criadoPorNome:sess.usuarioNome,
        criadoEm:new Date().toISOString()
      };
      // baixa estoque
      venda.itens.forEach(it=>{
        const p=db.produtos.find(x=>x.id===it.produtoId && x.empresaId===sess.empresaId);
        if(p && p.categoria!=='Serviço' && p.categoria!=='Recarga') p.estoque -= it.qtd;
      });
      db.vendas.push(venda);
      logAction('venda','criar',venda.id,`Venda ${venda.numero} cliente ${window.clienteSelecionadoVenda.nome} total ${fmtMoney(total)} por ${sess.usuarioNome} - Código cliente ${window.clienteSelecionadoVenda.codigo} - Pagamento ${pagamento||'N/A'}`);
      if(status==='faturado'){
        db.contasReceber.push({
          id:uid('cr'), empresaId:sess.empresaId, origem:'venda', clienteId:venda.clienteId,
          descricao:`Venda ${venda.numero} - ${window.clienteSelecionadoVenda.nome} - ${pagamento}${vencimento?' - Venc '+fmtDate(vencimento):''}`,
          valor:total, vencimento: vencimento ? new Date(vencimento).toISOString() : new Date(Date.now()+1000*60*60*24*14).toISOString(),
          pagamentoData:null, status:'aberto', contratoId:null, leituraId:null, vendaId:venda.id,
          criadoPor:sess.usuarioId, criadoPorNome:sess.usuarioNome, formaPagamento:pagamento
        });
      }
      saveDB(); renderVendas(); renderProdutos(); renderFinanceiro(); renderAuditoria(); closeModal(); toast(`Notinha ${venda.numero} salva por ${sess.usuarioNome} - Cliente ${window.clienteSelecionadoVenda.codigo}`,'success');
      // abrir impressão notinha no formato da imagem anexada
      setTimeout(()=>{imprimirNotinha(venda.id);},500);
    };
    // inicia com clientes e produtos vazios mas com focus
    setTimeout(()=>{const el=document.getElementById('nv-cliente-search'); if(el) el.focus();},200);
    document.getElementById('modal-root').classList.remove('hidden');
    window.modalContext={type:'venda'};
  };

  // Sobrescrever showVenda e imprimir para formato notinha da imagem
  const originalShowVenda = window.showVenda;
  window.showVenda = function(id){
    if(originalShowVenda) originalShowVenda(id);
    // adiciona botão imprimir notinha no detalhe
    setTimeout(()=>{
      const detail = document.getElementById('venda-detail');
      if(detail && !detail.innerHTML.includes('Imprimir notinha')){
        const btn = document.createElement('button');
        btn.className='mt-3 w-full h-11 rounded-xl bg-[#0a1e8a] text-white font-semibold text-[13px]';
        btn.innerHTML='<i class="ph ph-printer mr-1"></i> Imprimir notinha (formato imagem anexada)';
        btn.onclick=()=>imprimirNotinha(id);
        detail.appendChild(btn);
      }
    },300);
  };

  window.imprimirNotinha = function(vendaId){
    const sess=getSession(); const v=db.vendas.find(x=>x.id===vendaId && x.empresaId===sess.empresaId); if(!v) return;
    const cli=db.clientes.find(c=>c.id===v.clienteId);
    const empresa=db.empresas.find(e=>e.id===sess.empresaId);
    const config=db.config.empresa;
    const win = window.open('', '_blank');
    const html = `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Notinha Venda ${v.numero}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif; font-size:12px; color:#222; margin:0; padding:20px;}
  .header{display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #222; padding-bottom:10px;}
  .logo{width:80px; height:80px; background:#eee; display:grid; place-items:center; font-weight:bold; border:1px solid #ccc;}
  .center{text-align:center; flex:1;}
  .center h1{margin:0; font-size:20px;}
  .center h2{margin:2px 0; font-size:12px; font-weight:normal;}
  .right{text-align:right; font-size:11px; line-height:1.3;}
  table{width:100%; border-collapse:collapse; margin-top:8px; font-size:11px;}
  th{background:#c0c0c0; text-align:left; padding:4px; font-size:11px;}
  td{padding:4px; border-bottom:1px solid #ddd;}
  .green-bar{background:#2e8b57; color:white; text-align:center; padding:8px; font-size:18px; font-weight:bold; margin-top:12px;}
  .totais{display:flex; gap:10px; margin-top:10px;}
  .box{border:1px solid #aaa; padding:8px; flex:1; text-align:center;}
  .box b{font-size:16px; display:block;}
  .footer{margin-top:60px; display:flex; justify-content:space-between; font-size:11px;}
  .footer .line{border-top:1px solid #222; width:300px; text-align:center; padding-top:4px;}
  .small{font-size:10px; color:#555;}
  @media print{body{padding:0} button{display:none}}
</style></head><body>
<div class="header">
  <div class="logo"><img src="./logo.png" style="max-width:70px; max-height:70px; object-fit:contain"><br>Logo</div>
  <div class="center">
    <h1>DIGICOPY</h1>
    <h2>${empresa?.nome||config.nome||'DENIVALDO COM. DE ELET. LOCACOES E MANU LTDA'}</h2>
    <div class="small">${empresa?.cnpj||sess.cnpj} - ${sess.empresaNome}</div>
    <div class="small">Atendente: ${v.criadoPorNome||sess.usuarioNome} - ${fmtDateTime(v.data)}</div>
  </div>
  <div class="right">
    ${empresa?.cnpj||sess.cnpj}<br>
    ${config.fone||''}<br>
    Avenida Pedro Alves da Silva 97<br>
    Padre Eustáquio<br>
    JANAUBA - MG
  </div>
</div>

<table>
  <tr><th>Codigo</th><th>Nome</th><th>Nome Fantasia</th><th>Fone</th><th>Fone 2</th></tr>
  <tr><td>${cli?.codigo||''}</td><td>${cli?.nome||''}</td><td>${cli?.nome||''}</td><td>${cli?.telefone||''}</td><td></td></tr>
</table>
<table>
  <tr><th>Endereço</th><th>Nº</th><th>Complemento</th><th>Bairro</th><th>CPF/CNPJ</th><th>RG/Inc. Est</th></tr>
  <tr><td>${cli?.endereco||''}</td><td>NUMERO</td><td></td><td>${cli?.cidade||''} - Veredas</td><td>${cli?.documento||''}</td><td></td></tr>
</table>
<table>
  <tr><th>Contato</th><th>Cidade</th><th>UF</th><th>CEP</th><th>Email</th></tr>
  <tr><td>${cli?.nome||''}</td><td>${cli?.cidade||'JANAUBA'}</td><td>${cli?.estado||'MG'}</td><td>${cli?.cep||'39440-001'}</td><td>${cli?.email||''}</td></tr>
</table>

<div class="green-bar">Venda ${v.numero.replace('VD-','')}</div>

<table>
  <tr><th>PARCELA</th><th>CÓD.</th><th>VALOR</th><th>VENCIMENTO</th><th>PAGAMENTO</th><th>DESCRIÇÃO</th><th>DOCUMENTO</th></tr>
  <tr><td>1/1</td><td>${v.id.slice(-5)}</td><td>${fmtMoney(v.total)}</td><td>${v.vencimento?fmtDate(v.vencimento):fmtDate(new Date(Date.now()+1000*60*60*24*14))}</td><td>${v.formaPagamento||''}</td><td>${v.formaPagamento||''}</td><td></td></tr>
</table>

<table>
  <tr><th>CÓD.</th><th>DESCRIÇÃO</th><th>UNITÁRIO</th><th>QTD.</th><th>TOTAL</th><th>SITUAÇÃO</th><th>OBS.</th></tr>
  ${v.itens.map(it=>{
    const p=db.produtos.find(pr=>pr.id===it.produtoId);
    return `<tr><td>${p?.codigo||p?.sku||it.produtoId.slice(-4)}</td><td>${p?.nome||'Produto'} - criado por ${p?.criadoPorNome||'-'}</td><td>${fmtMoney(it.preco)}</td><td>${it.qtd}</td><td>${fmtMoney(it.subtotal)}</td><td>PRODUTO</td><td>NENHUMA</td></tr>`;
  }).join('')}
</table>

<div class="totais">
  <div class="box"><b>${v.numero.replace('VD-','')}</b><br><span class="small">AGUARDAR</span></div>
  <div class="box"><b>${fmtDate(v.data)}</b><br><span class="small">${new Date(v.data).toLocaleTimeString('pt-BR')}</span></div>
  <div class="box" style="text-align:left; font-size:11px;">Acré. R$ 0,00 Frete R$ 0,00<br>Desc. R$ ${v.desconto||0} Atendente ${v.criadoPorNome||sess.usuarioNome}<br>Desc. 0% Entregar até</div>
  <div class="box"><b>${fmtMoney(v.total)}</b><br><span class="small">${v.formaPagamento||''}</span></div>
</div>

<div class="footer">
  <div>Recebi: ___/___/______ às ___:___ <br><br><div class="line">NOME POR EXTENSO</div></div>
  <div style="text-align:center;"><br><br><div class="small">Criado por ${v.criadoPorNome||sess.usuarioNome} • CNPJ ${sess.cnpj} • Código cliente ${cli?.codigo||''}</div></div>
</div>

<div class="small" style="margin-top:20px; border-top:1px dashed #aaa; padding-top:8px;">
  <b>Auditoria:</b> Venda criada por ${v.criadoPorNome} (${v.criadoPor}) em ${fmtDateTime(v.criadoEm||v.data)} - Empresa ${sess.empresaNome} CNPJ ${sess.cnpj} - Atendente ${v.criadoPorNome} - Forma pagamento ${v.formaPagamento} - Cliente código ${cli?.codigo}
</div>

<button onclick="window.print()" style="margin-top:20px; padding:10px 20px; background:#0a1e8a; color:white; border:0; border-radius:8px; cursor:pointer;">Imprimir</button>
<button onclick="window.close()" style="margin-top:20px; margin-left:10px; padding:10px 20px; background:white; border:1px solid #ccc; border-radius:8px; cursor:pointer;">Fechar</button>
</body></html>
    `;
    win.document.write(html);
    win.document.close();
    logAction('venda','imprimir_notinha',vendaId,`Impressão notinha ${v.numero} por ${sess.usuarioNome}`);
    saveDB();
  };

  // Garantir que ao criar cliente, gera codigo sequencial
  const originalSaveCliente = window.saveCliente;
  window.saveCliente = function(){
    const sess=getSession();
    const isNew = !window.modalContext?.id;
    if(isNew){
      const maxCode = Math.max(0, ...db.clientes.filter(c=>c.empresaId===sess.empresaId).map(c=>c.codigo||0));
      // temporariamente armazena para uso no payload
      window._nextCodigoCliente = maxCode+1;
    }
    // Chama original
    if(originalSaveCliente) {
      // interceptar dentro da original: vamos fazer override completo aqui para garantir codigo
      const id=window.modalContext?.id;
      const payload={
        empresaId:sess.empresaId,
        codigo: isNew ? window._nextCodigoCliente : undefined,
        nome:document.getElementById('f-cli-nome').value.trim(),
        documento:document.getElementById('f-cli-doc').value.trim(),
        tipo:document.getElementById('f-cli-tipo').value,
        email:document.getElementById('f-cli-email').value.trim(),
        telefone:document.getElementById('f-cli-tel').value.trim(),
        endereco:document.getElementById('f-cli-end').value.trim(),
        cidade:document.getElementById('f-cli-cidade').value.trim(),
        estado:document.getElementById('f-cli-estado').value.trim(),
        cep:document.getElementById('f-cli-cep').value.trim(),
        status:document.getElementById('f-cli-status').value
      };
      if(!payload.nome) return toast('Informe nome','error');
      if(id){
        const existing=db.clientes.find(c=>c.id===id && c.empresaId===sess.empresaId);
        // manter codigo existente
        payload.codigo = existing.codigo;
        Object.assign(existing,payload,{atualizadoPor:sess.usuarioId, atualizadoPorNome:sess.usuarioNome, atualizadoEm:new Date().toISOString()});
        logAction('cliente','editar',id,`Editado cliente ${payload.nome} código ${payload.codigo}`);
      }else{
        const novo={id:uid('cli'),...payload,mensalidade:0,criadoEm:new Date().toISOString(),criadoPor:sess.usuarioId,criadoPorNome:sess.usuarioNome};
        db.clientes.push(novo);
        logAction('cliente','criar',novo.id,`Criado cliente ${novo.nome} código ${novo.codigo} por ${sess.usuarioNome}`);
      }
      saveDB(); renderClientes(); closeModal(); toast(`Cliente salvo código ${payload.codigo||''} por ${sess.usuarioNome}`,'success'); buildNav(); renderDashboard(); renderAuditoria();
      // Se foi chamado de venda, selecionar automaticamente
      if(window.clienteSelecionadoVenda===null || window.novaVenda){
        // se modal cliente foi aberto a partir da venda, tenta auto selecionar
        const novoOuEdit = db.clientes.find(c=>c.empresaId===sess.empresaId && c.nome===payload.nome);
        if(novoOuEdit && window.selectClienteVenda){
          setTimeout(()=>selectClienteVenda(novoOuEdit.id),300);
        }
      }
      return;
    }
  };

  // Patch para remover area "remover.png" - se for alguma div com texto remover, esconde
  // O usuário disse "isso da imagem anexada escrita remover pode remover essa area"
  // Vamos ocultar qualquer elemento com texto "RECURSOS" ou "FAQ, Suporte, Email Marketing, Mapa, Agenda" que são do exemplo SisPrinter que não queremos
  // Nosso sistema já não tem essas áreas, mas garantimos que view-config não mostra nada com "remover"
  // Se houver elemento com id "remover", esconder
  setTimeout(()=>{
    document.querySelectorAll('*').forEach(el=>{
      if(el.textContent && el.textContent.trim().toLowerCase()==='remover'){
        const parent = el.closest('div');
        if(parent) parent.style.display='none';
      }
    });
  },1000);

  console.log('PATCH vendas v3.1 carregado - cliente codigo, busca aberta, pagamento só ao faturar, tipo produto/recarga');
})();
// EVOLUÇÃO PATCH v3.2 - Implementa itens acumulados TODO
// 1. CNPJ busca automática cliente
// 2. Empresas para PDF notinha (cadastro separado)
// 3. Chamados branco/verde + filtros avançados
// 4. Vendas lista detalhada + Orçamentos PDF
// 5. Contratos franquia exemplo 3000 copias R$120

// Helper CNPJ busca
async function buscarCNPJAutomatico(cnpjRaw){
  const cnpj = onlyDigits(cnpjRaw);
  if(cnpj.length!==14){ toast('CNPJ deve ter 14 dígitos','error'); return; }
  const btn = document.getElementById('btn-buscar-cnpj');
  if(btn){ btn.innerHTML='<i class="ph ph-spinner animate-spin"></i> Buscando...'; btn.disabled=true; }
  try{
    const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    if(!resp.ok) throw new Error('CNPJ não encontrado na BrasilAPI');
    const data = await resp.json();
    // Preenche campos do modal cliente
    const setVal = (id,val)=>{ const el=document.getElementById(id); if(el) el.value=val||''; };
    setVal('f-cli-nome', data.razao_social || data.nome_fantasia || '');
    setVal('f-cli-end', (data.logradouro||'') + (data.numero?' , '+data.numero:'') + (data.complemento?' - '+data.complemento:''));
    // tentar separar cidade, estado, cep, bairro
    document.getElementById('f-cli-cidade').value = data.municipio || '';
    document.getElementById('f-cli-estado').value = data.uf || '';
    document.getElementById('f-cli-cep').value = data.cep || '';
    // telefone
    if(data.ddd_telefone_1) setVal('f-cli-tel', `(${data.ddd_telefone_1.slice(0,2)}) ${data.ddd_telefone_1.slice(2)}`);
    if(data.email) setVal('f-cli-email', data.email);
    // Salva dados extras em campos ocultos ou no próprio objeto
    window._ultimoCNPJData = data;
    toast(`CNPJ encontrado: ${data.razao_social} - ${data.municipio}/${data.uf}`,'success');
    logAction('cliente','buscar_cnpj',cnpj,`Busca CNPJ ${cnpj} retornou ${data.razao_social}`);
  }catch(e){
    console.error(e);
    toast('Erro ao buscar CNPJ: '+e.message+'. Preencha manual.','error');
  }finally{
    if(btn){ btn.innerHTML='<i class="ph ph-magnifying-glass"></i> Buscar CNPJ'; btn.disabled=false; }
  }
}

// Sobrescreve renderModalCliente para incluir busca CNPJ e código
(function(){
  const origRenderModalCliente = window.renderModalCliente;
  window.renderModalCliente = function(id){
    const sess=getSession(); const isEdit=!!id;
    const c=isEdit?db.clientes.find(x=>x.id===id && x.empresaId===sess.empresaId):{nome:'',documento:'',tipo:'PJ',email:'',telefone:'',endereco:'',cidade:'',estado:'SP',cep:'',status:'ativo',codigo:''};
    const nextCodigo = Math.max(0,...db.clientes.filter(x=>x.empresaId===sess.empresaId).map(x=>x.codigo||0))+1;
    document.getElementById('modal-title').innerText=isEdit?`Editar cliente #${c.codigo||''}`:`Novo cliente #${nextCodigo}`;
    document.getElementById('modal-body').innerHTML=`
      <div class="space-y-4">
        <div class="rounded-xl bg-[#e8eaf8] border border-[#c9ceef] p-3 flex gap-3">
          <div class="flex-1">
            <label class="text-[11px] font-bold uppercase text-[#0a1e8a]">CNPJ para busca automática *</label>
            <div class="mt-1 flex gap-2">
              <input id="f-cli-doc" value="${c.documento||''}" placeholder="00.000.000/0000-00" class="flex-1 h-11 px-3 rounded-xl border-2 border-[#0a1e8a]/20 bg-white font-mono text-[13px]">
              <button id="btn-buscar-cnpj" onclick="buscarCNPJAutomatico(document.getElementById('f-cli-doc').value)" class="h-11 px-5 rounded-xl bg-[#0a1e8a] text-white font-bold text-[12px] flex items-center gap-1.5"><i class="ph ph-magnifying-glass"></i> Buscar CNPJ</button>
            </div>
            <p class="text-[11px] text-[#0a1e8a]/70 mt-1">Digite CNPJ e clique em Buscar CNPJ para preencher automaticamente razão social, endereço, cidade, UF, CEP, telefone e email via BrasilAPI.</p>
          </div>
          <div class="w-[90px] shrink-0">
            <label class="text-[11px] font-bold uppercase text-slate-500">Código</label>
            <input value="${c.codigo||nextCodigo}" disabled class="mt-1 w-full h-11 px-3 rounded-xl border bg-slate-100 font-mono font-bold text-[14px] text-center">
            <p class="text-[10px] text-slate-400 mt-1 text-center">Sequencial</p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2"><label class="text-[11px] font-bold uppercase text-slate-500">Razão social / Nome *</label><input id="f-cli-nome" value="${c.nome||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div>
          <div><label class="text-[11px] font-bold uppercase text-slate-500">Tipo</label><select id="f-cli-tipo" class="mt-1 w-full h-11 px-3 rounded-xl border"><option ${c.tipo==='PJ'?'selected':''}>PJ</option><option ${c.tipo==='PF'?'selected':''}>PF</option></select></div>
          <div><label class="text-[11px] font-bold uppercase text-slate-500">Nome Fantasia</label><input id="f-cli-fantasia" value="${c.fantasia||''}" placeholder="Fantasia" class="mt-1 w-full h-11 px-3 rounded-xl border"></div>
          <div><label class="text-[11px] font-bold uppercase text-slate-500">E-mail</label><input id="f-cli-email" value="${c.email||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div>
          <div><label class="text-[11px] font-bold uppercase text-slate-500">Telefone / Celular</label><input id="f-cli-tel" value="${c.telefone||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div>
          <div class="md:col-span-2"><label class="text-[11px] font-bold uppercase text-slate-500">Endereço completo</label><input id="f-cli-end" value="${c.endereco||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div>
          <div><label class="text-[11px] font-bold uppercase text-slate-500">Cidade</label><input id="f-cli-cidade" value="${c.cidade||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div>
          <div class="grid grid-cols-3 gap-3"><div><label class="text-[11px] font-bold uppercase text-slate-500">Estado</label><input id="f-cli-estado" value="${c.estado||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div class="col-span-2"><label class="text-[11px] font-bold uppercase text-slate-500">CEP</label><input id="f-cli-cep" value="${c.cep||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div></div>
          <div><label class="text-[11px] font-bold uppercase text-slate-500">Status</label><select id="f-cli-status" class="mt-1 w-full h-11 px-3 rounded-xl border"><option value="ativo" ${c.status==='ativo'?'selected':''}>Ativo</option><option value="inativo" ${c.status==='inativo'?'selected':''}>Inativo</option><option value="inadimplente" ${c.status==='inadimplente'?'selected':''}>Inadimplente</option></select></div>
          <div><label class="text-[11px] font-bold uppercase text-slate-500">Contato</label><input id="f-cli-contato" value="${c.contato||''}" placeholder="Pessoa contato" class="mt-1 w-full h-11 px-3 rounded-xl border"></div>
        </div>
        <div class="rounded-xl bg-[#e8eaf8] border border-[#c9ceef] p-3 text-[11px] text-[#0a1e8a]"><i class="ph ph-info"></i> Código sequencial será <b>#${c.codigo||nextCodigo}</b>. Criado por <b>${sess.usuarioNome}</b> será auditado. Busca CNPJ usa BrasilAPI.</div>
      </div>`;
    document.getElementById('modal-footer').innerHTML=`<button onclick="closeModal()" class="h-11 px-5 rounded-xl bg-white border">Cancelar</button><button onclick="saveCliente()" class="h-11 px-6 rounded-xl bg-[#0a1e8a] text-white font-semibold">${isEdit?'Salvar':'Criar cliente'}</button>`;
  };
})();

// Empresas para PDF notinha - CRUD separado, usado no cabeçalho da notinha
function renderEmpresas(){
  const sess=getSession(); if(!sess) return;
  const tbody=document.getElementById('tbody-empresas');
  if(!tbody) return;
  const list=db.empresas.filter(e=>e.id===sess.empresaId || true); // mostra todas empresas do CNPJ logado + outras? Mostrar todas para demo
  tbody.innerHTML=list.map(emp=>`
    <tr class="hover:bg-slate-50">
      <td class="px-5 py-3"><p class="font-mono text-[11px] font-bold text-[#0a1e8a]">${emp.cnpj}</p><p class="font-semibold text-[13px]">${emp.nome}</p><p class="text-[11px] text-slate-500">${emp.fantasia||''}</p></td>
      <td class="px-5 py-3"><p class="text-[12px]">${emp.logradouro||''} ${emp.numero||''} ${emp.bairro||''}</p><p class="text-[11px] text-slate-500">${emp.municipio||''}/${emp.uf||''} - ${emp.cep||''}</p></td>
      <td class="px-5 py-3"><p class="text-[12px]">${emp.telefone||''}</p><p class="text-[11px] text-slate-500">${emp.email||''}</p></td>
      <td class="px-5 py-3"><span class="px-2 py-1 rounded-full bg-[#e8eaf8] text-[#0a1e8a] text-[11px] font-bold">${emp.id===sess.empresaId?'Empresa Logada':''}</span></td>
      <td class="px-5 py-3"><div class="flex gap-1"><button onclick="editarEmpresa('${emp.id}')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-slate-100"><i class="ph ph-pencil"></i></button><button onclick="usarEmpresaNotinha('${emp.id}')" class="h-8 px-3 rounded-lg bg-[#0a1e8a] text-white text-[11px] font-bold">Usar na Notinha</button></div></td>
    </tr>
  `).join('')||'<tr><td colspan="5" class="p-12 text-center text-slate-500">Nenhuma empresa</td></tr>';
}
function editarEmpresa(id){
  const emp=db.empresas.find(e=>e.id===id);
  if(!emp) return;
  document.getElementById('modal-root').classList.remove('hidden');
  document.getElementById('modal-title').innerText='Editar empresa para PDF notinha';
  document.getElementById('modal-body').innerHTML=`
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-3"><div><label class="text-[11px] font-bold uppercase text-slate-500">CNPJ</label><input id="emp-cnpj" value="${emp.cnpj||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Senha CNPJ</label><input id="emp-senha" type="password" value="${emp.senha||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div></div>
      <div><label class="text-[11px] font-bold uppercase text-slate-500">Razão social</label><input id="emp-nome" value="${emp.nome||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div>
      <div><label class="text-[11px] font-bold uppercase text-slate-500">Fantasia</label><input id="emp-fantasia" value="${emp.fantasia||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div>
      <div class="grid grid-cols-2 gap-3"><div><label class="text-[11px] font-bold uppercase text-slate-500">Logradouro</label><input id="emp-log" value="${emp.logradouro||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Número</label><input id="emp-num" value="${emp.numero||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div></div>
      <div class="grid grid-cols-3 gap-3"><div><label class="text-[11px] font-bold uppercase text-slate-500">Bairro</label><input id="emp-bairro" value="${emp.bairro||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Município</label><input id="emp-mun" value="${emp.municipio||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">UF</label><input id="emp-uf" value="${emp.uf||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div></div>
      <div class="grid grid-cols-2 gap-3"><div><label class="text-[11px] font-bold uppercase text-slate-500">CEP</label><input id="emp-cep" value="${emp.cep||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div><div><label class="text-[11px] font-bold uppercase text-slate-500">Telefone</label><input id="emp-tel" value="${emp.telefone||''}" class="mt-1 w-full h-11 px-3 rounded-xl border"></div></div>
    </div>`;
  document.getElementById('modal-footer').innerHTML=`<button onclick="closeModal()" class="h-11 px-5 rounded-xl bg-white border">Cancelar</button><button onclick="saveEmpresaEdit('${emp.id}')" class="h-11 px-6 rounded-xl bg-[#0a1e8a] text-white font-semibold">Salvar</button>`;
  window.modalContext={type:'empresa',id};
}
function saveEmpresaEdit(id){
  const emp=db.empresas.find(e=>e.id===id);
  if(!emp) return;
  emp.cnpj=document.getElementById('emp-cnpj').value.trim();
  emp.cnpjDigits=onlyDigits(emp.cnpj);
  emp.senha=document.getElementById('emp-senha').value.trim();
  emp.nome=document.getElementById('emp-nome').value.trim();
  emp.fantasia=document.getElementById('emp-fantasia').value.trim();
  emp.logradouro=document.getElementById('emp-log').value.trim();
  emp.numero=document.getElementById('emp-num').value.trim();
  emp.bairro=document.getElementById('emp-bairro').value.trim();
  emp.municipio=document.getElementById('emp-mun').value.trim();
  emp.uf=document.getElementById('emp-uf').value.trim();
  emp.cep=document.getElementById('emp-cep').value.trim();
  emp.telefone=document.getElementById('emp-tel').value.trim();
  saveDB(); renderEmpresas(); closeModal(); toast('Empresa atualizada para notinha','success');
}
function usarEmpresaNotinha(id){
  const emp=db.empresas.find(e=>e.id===id);
  if(!emp) return;
  localStorage.setItem('digicopy_empresa_notinha', JSON.stringify(emp));
  toast(`Empresa ${emp.fantasia||emp.nome} selecionada para PDF notinha`,'success');
}

// Patch para impressão notinha usar empresa selecionada da tela Empresas
(function(){
  const origImprimir = window.imprimirNotinha;
  window.imprimirNotinha = function(vendaId){
    // se tem empresa notinha selecionada, usa ela no cabeçalho
    const empNotinhaRaw = localStorage.getItem('digicopy_empresa_notinha');
    if(empNotinhaRaw){
      try{
        const empSel = JSON.parse(empNotinhaRaw);
        // injeta temporariamente no db.config para PDF usar?
        const prevConfig = JSON.parse(JSON.stringify(db.config.empresa));
        // sobrescreve temporariamente
        db.config.empresa.nome = empSel.nome;
        db.config.empresa.cnpj = empSel.cnpj;
        db.config.empresa.fone = empSel.telefone||prevConfig.fone;
        // guarda prev para restaurar depois
        window._prevConfigEmpresa = prevConfig;
      }catch{}
    }
    if(origImprimir) origImprimir(vendaId);
    // restaura após 2s
    setTimeout(()=>{
      if(window._prevConfigEmpresa){
        db.config.empresa = window._prevConfigEmpresa;
        window._prevConfigEmpresa=null;
      }
    },2000);
  };
})();

// CHAMADOS - branco não resolvido verde resolvido + filtros avançados
(function(){
  const origRenderOs = window.renderOs;
  window.renderOs = function(){
    // chama original que já faz kanban, mas vamos sobrescrever lista para branco/verde
    if(origRenderOs) origRenderOs();
    // após original, pinta linhas conforme status
    const sess=getSession(); if(!sess) return;
    const tbody=document.getElementById('tbody-os');
    if(!tbody) return;
    const rows=tbody.querySelectorAll('tr');
    rows.forEach(row=>{
      const statusCell=row.querySelector('td:nth-child(5) span');
      if(!statusCell) return;
      const txt=statusCell.textContent.toLowerCase();
      if(txt.includes('aberto')||txt.includes('em atendimento')||txt.includes('aguardando')){
        row.classList.add('bg-white');
        row.classList.remove('bg-emerald-50');
      }else if(txt.includes('concluido')){
        row.classList.add('bg-emerald-50');
        row.classList.add('border-l-4');
        row.classList.add('border-l-emerald-500');
      }
    });
  };
  // Busca avançada chamados: nome fantasia, celular, cidade, endereço, código cliente
  const origHandleSearch = window.handleGlobalSearch;
  // vamos sobrescrever renderOs para filtrar mais campos
  const origRenderOs2 = window.renderOs;
  // Já temos renderOs acima, mas vamos adicionar filtro extra na busca
  window.searchChamadosAvancada = function(q){
    const sess=getSession(); if(!sess) return;
    const low=q.toLowerCase();
    return db.os.filter(o=>{
      if(o.empresaId!==sess.empresaId) return false;
      const cli=db.clientes.find(c=>c.id===o.clienteId);
      if(!cli) return false;
      return (
        (cli.nome&&cli.nome.toLowerCase().includes(low)) ||
        (cli.fantasia&&cli.fantasia.toLowerCase().includes(low)) ||
        (cli.telefone&&cli.telefone.toLowerCase().includes(low)) ||
        (cli.cidade&&cli.cidade.toLowerCase().includes(low)) ||
        (cli.endereco&&cli.endereco.toLowerCase().includes(low)) ||
        (cli.codigo&&String(cli.codigo).includes(low)) ||
        (cli.documento&&cli.documento.toLowerCase().includes(low)) ||
        (o.numero&&o.numero.toLowerCase().includes(low)) ||
        (o.descricao&&o.descricao.toLowerCase().includes(low))
      );
    });
  };
  // Override renderOs to use busca avançada quando digitado em search-os
  window.renderOs = function(){
    const sess=getSession(); if(!sess) return;
    const searchInput=document.getElementById('search-os');
    const search=searchInput?searchInput.value.toLowerCase():'';
    const status=document.getElementById('filter-os-status')?.value||'';
    let list;
    if(search && search.length>=2){
      list=window.searchChamadosAvancada(search);
    }else{
      list=db.os.filter(o=>o.empresaId===sess.empresaId);
    }
    list=list.filter(o=>!status||o.status===status).sort((a,b)=>new Date(b.dataAbertura)-new Date(a.dataAbertura));
    // renderiza igual original mas com cores
    const osKanbanEl=document.getElementById('os-kanban');
    const osListEl=document.getElementById('os-list');
    const btn=document.getElementById('btn-os-kanban');
    if(osKanbanEl) osKanbanEl.classList.toggle('hidden', window.osViewMode!=='kanban');
    if(osListEl) osListEl.classList.toggle('hidden', window.osViewMode!=='list');
    if(btn) btn.innerText=window.osViewMode==='kanban'?'Lista':'Kanban';

    if(window.osViewMode==='kanban'){
      const cols=[{id:'aberto',label:'Aberto (Branco)',color:'border-slate-200 bg-white'},{id:'em_atendimento',label:'Em atendimento (Branco)',color:'border-blue-200 bg-white'},{id:'aguardando_peca',label:'Aguardando peça (Branco)',color:'border-amber-200 bg-white'},{id:'concluido',label:'Concluído (Verde)',color:'border-emerald-300 bg-emerald-50'}];
      document.getElementById('os-kanban').innerHTML=cols.map(col=>{const items=list.filter(o=>o.status===col.id); return `<div class="rounded-[16px] border ${col.color} p-3 flex flex-col"><div class="flex items-center justify-between mb-3"><h4 class="font-bold text-[12px] uppercase">${col.label}</h4><span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border">${items.length}</span></div><div class="space-y-3 flex-1 overflow-auto" style="min-height:400px">${items.map(o=>{const cli=db.clientes.find(c=>c.id===o.clienteId); const eq=db.equipamentos.find(e=>e.id===o.equipamentoId); return `<div class="rounded-xl ${col.id==='concluido'?'bg-emerald-100 border-emerald-300':'bg-white border-slate-200'} border p-3 shadow-sm hover:shadow-md cursor-pointer" onclick="openModal('os','${o.id}')"><div class="flex justify-between"><span class="font-mono text-[11px] font-bold text-slate-500">${o.numero}</span><span class="text-[10px] px-2 py-0.5 rounded-full bg-[#e8eaf8] text-[#0a1e8a] font-bold uppercase">${o.prioridade}</span></div><p class="font-semibold text-[13px] mt-2">${cli?.nome||''} ${cli?.fantasia?`(${cli.fantasia})`:''}</p><p class="text-[11px] text-slate-600">Cód: ${cli?.codigo||'-'} • ${cli?.telefone||''} • ${cli?.cidade||''}</p><p class="text-[11px] text-slate-600 mt-1">${eq?.modelo||'Sem equipamento'} • ${o.descricao.slice(0,60)}</p><p class="text-[11px] text-slate-400 mt-2">por ${o.criadoPorNome||'-'} • ${fmtDate(o.dataAbertura)}</p></div>`;}).join('')||'<p class="text-[12px] text-slate-400 p-4 text-center">Vazio</p>'}</div></div>`;}).join('');
    }else{
      document.getElementById('tbody-os').innerHTML=list.map(o=>{const cli=db.clientes.find(c=>c.id===o.clienteId); const isConcluido=o.status==='concluido'; return `<tr class="${isConcluido?'bg-emerald-50/70 border-l-4 border-l-emerald-500':'bg-white'} hover:bg-slate-50"><td class="px-5 py-3"><p class="font-mono text-[11px] font-bold">${o.numero}</p><p class="font-semibold text-[12.5px]">${cli?.nome||''}</p><p class="text-[11px] text-slate-500">Fantasia: ${cli?.fantasia||'-'} • Cód: ${cli?.codigo||'-'} • por ${o.criadoPorNome||'-'}</p><p class="text-[11px] text-slate-500">${cli?.telefone||''} • ${cli?.cidade||''} • ${cli?.endereco||''}</p></td><td class="px-5 py-3"><p class="text-[12px] capitalize">${o.tipo}</p><span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 border font-bold uppercase">${o.prioridade}</span></td><td class="px-5 py-3"><p class="text-[12px]">${db.tecnicos.find(t=>t.id===o.tecnico)?.nome||'—'}</p></td><td class="px-5 py-3"><p class="text-[12px] font-mono">${Math.floor((Date.now()-new Date(o.dataAbertura))/(1000*60*60))}h</p></td><td class="px-5 py-3"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${isConcluido?'bg-emerald-600 text-white':'bg-slate-900 text-white'}">${o.status.replace('_',' ')}</span></td><td class="px-5 py-3"><button onclick="openModal('os','${o.id}')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-slate-100"><i class="ph ph-pencil"></i></button></td></tr>`;}).join('');
    }
  };
})();

// VENDAS LISTA DETALHADA - código venda, data, cliente, valor, tipo pagamento, serviço ou venda, usuário, situação
(function(){
  const origRenderVendas = window.renderVendas;
  window.renderVendas = function(){
    const sess=getSession(); if(!sess) return;
    const search=(document.getElementById('search-vendas')?.value||'').toLowerCase();
    let list=db.vendas.filter(v=>v.empresaId===sess.empresaId && (!search||v.numero.toLowerCase().includes(search)||(db.clientes.find(c=>c.id===v.clienteId)?.nome||'').toLowerCase().includes(search)||(db.clientes.find(c=>c.id===v.clienteId)?.codigo&&String(db.clientes.find(c=>c.id===v.clienteId).codigo).includes(search)))).sort((a,b)=>new Date(b.data)-new Date(a.data));
    document.getElementById('tbody-vendas').innerHTML=list.map(v=>{
      const cli=db.clientes.find(c=>c.id===v.clienteId);
      const isServico = v.itens.some(it=>{const p=db.produtos.find(pr=>pr.id===it.produtoId); return p&&p.categoria==='Serviço';});
      const tipo = isServico ? 'Serviço' : 'Venda';
      return `<tr class="hover:bg-slate-50 cursor-pointer ${v.status==='estornada'?'bg-red-50':''}" onclick="showVenda('${v.id}')">
        <td class="px-5 py-3">
          <p class="font-mono text-[11px] font-bold text-[#0a1e8a]">${v.numero} • Cód: ${cli?.codigo||'-'}</p>
          <p class="font-semibold text-[12.5px]">${cli?.nome||''} ${cli?.fantasia?`(${cli.fantasia})`:''}</p>
          <p class="text-[11px] text-slate-500">${fmtDate(v.data)} • ${fmtDateTime(v.data).split(',')[1]||''} • por <b>${v.criadoPorNome||'-'}</b></p>
        </td>
        <td class="px-5 py-3">
          <p class="text-[12px]">${v.itens.length} itens • ${tipo}</p>
          <p class="font-bold text-[13px]">${fmtMoney(v.total)}</p>
          <p class="text-[11px] text-slate-500">${v.formaPagamento||'Não faturado'}</p>
        </td>
        <td class="px-5 py-3">
          <p class="text-[11px] px-2 py-1 rounded-full bg-[#e8eaf8] text-[#0a1e8a] font-bold inline-block">${tipo}</p>
          <p class="text-[11px] mt-1">${v.formaPagamento||'-'}</p>
        </td>
        <td class="px-5 py-3">
          <span class="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${v.status==='faturado'?'bg-emerald-50 text-emerald-700 border':v.status==='aberta'?'bg-blue-50 text-blue-700 border':v.status==='estornada'?'bg-red-50 text-red-700 border':v.status==='aprovado'?'bg-violet-50 text-violet-700 border':'bg-amber-50 text-amber-700 border'}">${v.status||'aberta'}</span>
          <p class="text-[11px] text-slate-500 mt-1">por ${v.criadoPorNome||'-'}</p>
        </td>
        <td class="px-5 py-3"><button onclick="event.stopPropagation(); deleteVenda('${v.id}')" class="w-8 h-8 grid place-items-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><i class="ph ph-trash"></i></button></td>
      </tr>`;
    }).join('');
  };
})();

// CONTRATOS - franquia exemplo 3000 copias R$120 + excedente
// Adiciona helper visual no modal contrato
(function(){
  const origRenderModalContrato = window.renderModalContrato;
  window.renderModalContrato = function(id){
    if(origRenderModalContrato) origRenderModalContrato(id);
    // adiciona exemplo após render
    setTimeout(()=>{
      const body=document.getElementById('modal-body');
      if(!body) return;
      if(!document.getElementById('exemplo-franquia')){
        const exemplo=document.createElement('div');
        exemplo.id='exemplo-franquia';
        exemplo.className='mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-900';
        exemplo.innerHTML='<b>Exemplo citado no Loom:</b> Franquia 3.000 cópias a R$120,00 e valor adicional R$0,04 por cópia excedente. Ou mensal por quantidade (sem franquia). Configure abaixo franquia PB e valor mensal fixo.';
        body.appendChild(exemplo);
      }
    },100);
  };
})();

// ORÇAMENTOS - PDF fluxo semelhante vendas
function renderOrcamentos(){
  const sess=getSession(); if(!sess) return;
  const orcamentos=db.vendas.filter(v=>v.empresaId===sess.empresaId && (v.status==='orcamento' || v.status==='aprovado'));
  // se não existe view-orcamentos, cria dinamicamente?
  const view=document.getElementById('view-vendas');
  // adiciona aba orçamentos dentro de vendas
  if(!document.getElementById('aba-orcamentos')){
    const header=view.querySelector('.flex.gap-2');
    if(header){
      const btn=document.createElement('button');
      btn.id='aba-orcamentos';
      btn.className='h-11 px-4 rounded-xl bg-white border text-[13px] font-medium';
      btn.innerText='Orçamentos PDF';
      btn.onclick=()=>{navigateTo('vendas'); setTimeout(()=>{const tb=document.getElementById('tbody-vendas'); if(tb){ tb.innerHTML=db.vendas.filter(v=>v.empresaId===sess.empresaId && v.status==='orcamento').map(v=>{const cli=db.clientes.find(c=>c.id===v.clienteId); return `<tr><td class="px-5 py-3"><p class="font-mono text-[11px] font-bold">${v.numero}</p><p class="font-semibold text-[12px]">${cli?.nome}</p><p class="text-[11px]">por ${v.criadoPorNome}</p></td><td class="px-5 py-3">${fmtMoney(v.total)}</td><td class="px-5 py-3">${v.status}</td><td class="px-5 py-3"><button onclick="gerarOrcamentoPDF('${v.id}')" class="h-8 px-3 rounded-lg bg-[#0a1e8a] text-white text-[11px] font-bold">Gerar PDF</button></td></tr>`}).join('');}},100);};
      header.appendChild(btn);
    }
  }
}
function gerarOrcamentoPDF(vendaId){
  const sess=getSession(); const v=db.vendas.find(x=>x.id===vendaId && x.empresaId===sess.empresaId); if(!v) return;
  const cli=db.clientes.find(c=>c.id===v.clienteId);
  const empRaw=localStorage.getItem('digicopy_empresa_notinha'); let emp=null; try{emp=JSON.parse(empRaw);}catch{}
  const empresa=emp||db.empresas.find(e=>e.id===sess.empresaId)||db.config.empresa;
  const win=window.open('','_blank');
  const html=`
  <html><head><meta charset="UTF-8"><title>Orçamento ${v.numero}</title><style>body{font-family:Arial; font-size:12px; margin:20px;} .header{display:flex; justify-content:space-between; border-bottom:2px solid #0a1e8a; padding-bottom:10px;} .logo{width:80px; height:80px; background:#0a1e8a; color:white; display:grid; place-items:center; font-weight:bold;} table{width:100%; border-collapse:collapse; margin-top:10px;} th{background:#0a1e8a; color:white; padding:6px; text-align:left;} td{padding:6px; border-bottom:1px solid #ddd;} .total{text-align:right; font-size:18px; font-weight:bold; margin-top:20px;} .footer{margin-top:40px; font-size:11px; color:#555; border-top:1px dashed #aaa; padding-top:10px;}</style></head><body>
  <div class="header"><div class="logo">DIGICOPY</div><div><h2>ORÇAMENTO ${v.numero}</h2><p>Empresa: ${empresa.fantasia||empresa.nome} - ${empresa.cnpj||sess.cnpj}</p><p>Cliente: ${cli?.nome} - Cód: ${cli?.codigo} - ${cli?.documento}</p><p>Data: ${fmtDateTime(v.data)} - Por: ${v.criadoPorNome}</p></div><div style="text-align:right;"><p>Status: ${v.status.toUpperCase()}</p><p>Validade: 7 dias</p></div></div>
  <table><tr><th>Item</th><th>Descrição</th><th>Qtd</th><th>Unit</th><th>Total</th></tr>${v.itens.map((it,idx)=>{const p=db.produtos.find(pr=>pr.id===it.produtoId); return `<tr><td>${idx+1}</td><td>${p?.nome||'Produto'}</td><td>${it.qtd}</td><td>${fmtMoney(it.preco)}</td><td>${fmtMoney(it.subtotal)}</td></tr>`}).join('')}</table>
  <div class="total">Total: ${fmtMoney(v.total)} ${v.desconto?`(Desc: ${fmtMoney(v.desconto)})`:''}</div>
  <div class="footer"><p>Orçamento gerado por ${v.criadoPorNome} em ${fmtDateTime(v.criadoEm||v.data)} - Empresa ${sess.empresaNome} CNPJ ${sess.cnpj}</p><p>Este orçamento é válido para aprovação pelo cliente. Ao aprovar, vira venda automaticamente.</p><p><button onclick="window.print()" style="padding:10px 20px; background:#0a1e8a; color:white; border:0; border-radius:8px;">Imprimir PDF</button> <button onclick="if(confirm('Aprovar orçamento e transformar em venda?')){window.opener.postMessage({type:'aprovarOrcamento',id:'${v.id}'},'*'); window.close();}" style="padding:10px 20px; background:green; color:white; border:0; border-radius:8px;">Aprovar Orçamento</button></p></div>
  </body></html>`;
  win.document.write(html); win.document.close();
  logAction('venda','gerar_pdf_orcamento',vendaId,`Gerado PDF orçamento ${v.numero} por ${sess.usuarioNome}`);
  saveDB();
}
window.addEventListener('message',e=>{
  if(e.data&&e.data.type==='aprovarOrcamento'){
    const sess=getSession(); const v=db.vendas.find(x=>x.id===e.data.id && x.empresaId===sess.empresaId);
    if(v){ v.status='aprovado'; logAction('venda','aprovar_orcamento',v.id,`Orçamento ${v.numero} aprovado por ${sess.usuarioNome}`); saveDB(); renderVendas(); toast(`Orçamento ${v.numero} aprovado!`,'success'); }
  }
});

// Garantir Empresas view existe
function ensureEmpresasView(){
  if(!document.getElementById('view-empresas')){
    const main=document.querySelector('.flex-1.p-4');
    if(main){
      const sec=document.createElement('section');
      sec.id='view-empresas';
      sec.className='view hidden space-y-4';
      sec.innerHTML=`
        <div class="flex justify-between gap-3 flex-wrap"><div><h3 class="font-bold text-[18px]">Empresas para PDF Notinha</h3><p class="text-[13px] text-slate-500 mt-1">Dados da empresa emitente que vão no cabeçalho da notinha de vendas/serviços. Seção "Outros" citada no Loom.</p></div><button onclick="openModalEmpresa()" class="h-11 px-6 rounded-xl bg-[#0a1e8a] text-white font-semibold text-[13.5px]">+ Nova empresa</button></div>
        <div class="rounded-[16px] bg-white border shadow-sm overflow-hidden"><table class="w-full text-left text-[13px]"><thead class="bg-slate-50 border-b text-[11px] uppercase font-bold text-slate-500"><tr><th class="px-5 py-3">CNPJ / Razão / Fantasia</th><th class="px-5 py-3">Endereço</th><th class="px-5 py-3">Contato</th><th class="px-5 py-3">Uso</th><th></th></tr></thead><tbody id="tbody-empresas" class="divide-y"></tbody></table></div>
        <div class="rounded-xl bg-amber-50 border border-amber-200 p-4 text-[12px] text-amber-900"><b>Dica:</b> Selecione uma empresa como padrão para PDF notinha clicando em "Usar na Notinha". Essa empresa será usada no cabeçalho da impressão da venda/orçamento.</div>
      `;
      main.appendChild(sec);
      // adiciona nav
      const navGest=document.getElementById('nav-gest');
      if(navGest && !document.querySelector('[data-nav="empresas"]')){
        const btn=document.createElement('button');
        btn.setAttribute('data-nav','empresas');
        btn.setAttribute('onclick',"navigateTo('empresas')");
        btn.className="w-full h-10 px-3 rounded-xl flex items-center gap-3 text-[13.5px] font-medium transition text-white/60 hover:bg-white/[0.08] hover:text-white";
        btn.innerHTML='<i class="ph ph-buildings text-[19px]"></i><span>Empresas (PDF)</span>';
        navGest.appendChild(btn);
      }
    }
  }
}
ensureEmpresasView();

// Sobrescreve buildNav para incluir empresas
const origBuildNav = window.buildNav;
window.buildNav = function(){
  if(origBuildNav) origBuildNav();
  ensureEmpresasView();
  const navGest=document.getElementById('nav-gest');
  if(navGest && !document.querySelector('[data-nav="empresas"]')){
    const btn=document.createElement('button');
    btn.setAttribute('data-nav','empresas');
    btn.setAttribute('onclick',"navigateTo('empresas')");
    btn.className="w-full h-10 px-3 rounded-xl flex items-center gap-3 text-[13.5px] font-medium transition text-white/60 hover:bg-white/[0.08] hover:text-white";
    btn.innerHTML='<i class="ph ph-buildings text-[19px]"></i><span>Empresas (PDF)</span>';
    navGest.appendChild(btn);
  }
};

// Atualiza navigateTo para incluir empresas
const origNavigateTo = window.navigateTo;
window.navigateTo = function(view){
  if(view==='empresas'){ document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden')); document.getElementById('view-empresas').classList.remove('hidden'); document.querySelectorAll('[data-nav]').forEach(b=>{b.classList.remove('bg-white/[0.12]','text-white','border','border-white/10'); b.classList.add('text-white/60')}); const act=document.querySelector('[data-nav="empresas"]'); if(act){act.classList.add('bg-white/[0.12]','text-white','border','border-white/10'); act.classList.remove('text-white/60')} document.getElementById('page-title').innerText='Empresas (PDF Notinha)'; document.getElementById('page-subtitle').innerText='Cadastro de empresas emitentes para cabeçalho da notinha'; renderEmpresas(); window.scrollTo({top:0,behavior:'smooth'}); if(window.innerWidth<1024) toggleSidebar(true); return; }
  if(origNavigateTo) origNavigateTo(view);
};

console.log('PATCH evolucao v3.2 - empresas PDF, CNPJ busca, chamados branco/verde filtros avançados, vendas detalhada, orçamentos PDF');
// NOTINHA PATCH v4.1 - Layout redesenhado inspirado mas não cópia, mantendo hub antigo (sidebar)
(function(){
window.imprimirNotinha = function(vendaId){
  const sess=getSession(); const v=db.vendas.find(x=>x.id===vendaId && x.empresaId===sess.empresaId); if(!v) return; const cli=db.clientes.find(c=>c.id===v.clienteId); const empRaw=localStorage.getItem('digicopy_empresa_notinha'); let empSel=null; try{empSel=JSON.parse(empRaw);}catch{} const empresa=empSel||db.empresas.find(e=>e.id===sess.empresaId)||{nome:'DIGICOPY'}; const win=window.open('','_blank');
  const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Notinha ${v.numero}</title><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap'); body{font-family:'Inter',Arial,sans-serif; font-size:12px; color:#1a1a1a; margin:0; padding:0; background:#f5f5f7;} .page{max-width:800px; margin:20px auto; background:white; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);} .top-bar{height:6px; background:#0a1e8a;} .header{padding:22px 28px; display:flex; justify-content:space-between; gap:20px; border-bottom:1px solid #eef0f5;} .brand{display:flex; gap:14px; align-items:center;} .brand-logo{width:54px; height:54px; background:#0a1e8a; border-radius:12px; display:grid; place-items:center; color:white; font-weight:800; font-size:20px;} .brand-text h1{margin:0; font-size:18px; font-weight:800;} .brand-text p{margin:2px 0 0; font-size:11px; color:#64748b;} .meta{text-align:right; font-size:11px; color:#475569;} .client-section{padding:18px 28px; background:#f8f9ff; border-bottom:1px solid #eef0f5; display:grid; grid-template-columns:1fr 1fr; gap:16px;} .client-card{background:white; border:1px solid #e2e8f0; border-radius:12px; padding:14px;} .client-card h4{margin:0 0 8px; font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#94a3b8;} .sale-bar{margin:20px 28px 0; background:#0a1e8a; color:white; border-radius:12px; padding:12px 18px; display:flex; justify-content:space-between; align-items:center;} .items{padding:0 28px; margin-top:16px;} table{width:100%; border-collapse:separate; border-spacing:0; font-size:12px;} th{text-align:left; font-size:10px; font-weight:700; text-transform:uppercase; color:#64748b; padding:10px 8px; border-bottom:2px solid #e2e8f0;} td{padding:10px 8px; border-bottom:1px solid #f1f5f9;} .totals{display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; padding:20px 28px; background:#f8f9ff; border-top:1px solid #eef0f5; border-bottom:1px solid #eef0f5; margin-top:16px;} .tot-box{background:white; border:1px solid #e2e8f0; border-radius:12px; padding:14px; text-align:center;} .tot-box b{font-size:20px; display:block; margin-top:4px; color:#0a1e8a;} .tot-box.highlight{background:#0a1e8a; color:white;} .tot-box.highlight b{color:white} .footer{padding:20px 28px; display:flex; justify-content:space-between; gap:20px; font-size:11px; color:#64748b;} .sig{border-top:1px solid #1a1a1a; width:220px; text-align:center; padding-top:6px; margin-top:40px;} .audit{margin:0 28px 20px; padding:12px; background:#fffbeb; border:1px solid #fde68a; border-radius:10px; font-size:11px; color:#92400e;} @media print{body{background:white} .page{box-shadow:none; margin:0} button{display:none}}</style></head><body><div class="page"><div class="top-bar"></div><div class="header"><div class="brand"><div class="brand-logo"><img src="./logo.png" style="width:36px; height:36px; object-fit:contain"></div><div class="brand-text"><h1>${empresa.fantasia||empresa.nome||'DIGICOPY'}</h1><p>${empresa.nome||''}<br>${empresa.cnpj||sess.cnpj} • ${empresa.telefone||''}<br>${empresa.logradouro||''} ${empresa.numero||''} - ${empresa.bairro||''} - ${empresa.municipio||''}/${empresa.uf||''}</p></div></div><div class="meta"><p><b>NOTINHA</b><br>${v.numero}<br>${fmtDate(v.data)} ${new Date(v.data).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</p><p style="margin-top:8px;">Atendente: <b>${v.criadoPorNome||sess.usuarioNome}</b><br>Forma: <b>${v.formaPagamento||''}</b>${v.vencimento?`<br>Venc: ${fmtDate(v.vencimento)}`:''}</p></div></div><div class="client-section"><div class="client-card"><h4>Cliente</h4><span style="font-family:monospace; font-size:11px; background:#0a1e8a; color:white; padding:2px 6px; border-radius:6px; display:inline-block; margin-bottom:6px;">#${cli?.codigo||'---'}</span><p><b>${cli?.nome||''}</b>${cli?.fantasia?` • ${cli.fantasia}`:''}</p><p>${cli?.documento||''} • ${cli?.telefone||''}</p><p style="font-size:11px; color:#64748b; margin-top:4px;">${cli?.endereco||''} • ${cli?.cidade||''}/${cli?.estado||''} • ${cli?.cep||''}</p></div><div class="client-card"><h4>Entrega / Observações</h4><p>Entregar até: ___/___/___</p><p style="margin-top:6px; color:#64748b;">Contato: ${cli?.contato||cli?.nome||''} • ${cli?.telefone||''}</p><p style="margin-top:8px;"><span style="background:#0a1e8a; color:white; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:700;">CÓD CLIENTE: ${cli?.codigo||'-'}</span></p></div></div><div class="sale-bar"><h2>${v.status==='orcamento'?'ORÇAMENTO':'VENDA'} ${v.numero.replace('VD-','')}</h2><span>${v.status.toUpperCase()} • ${v.itens.length} ITENS</span></div><div class="items"><table><tr><th>#</th><th>Descrição</th><th>SKU</th><th>Qtd</th><th>Unit</th><th>Total</th></tr>${v.itens.map((it,idx)=>{const p=db.produtos.find(pr=>pr.id===it.produtoId); return `<tr><td>${idx+1}</td><td><b>${p?.nome||'Produto'}</b><br><span style="font-size:10px; color:#64748b;">${p?.sku||''} • ${p?.categoria||''}</span></td><td style="font-family:monospace; font-size:11px;">${p?.sku||''}</td><td>${it.qtd}</td><td>${fmtMoney(it.preco)}</td><td><b>${fmtMoney(it.subtotal)}</b></td></tr>`;}).join('')}</table></div><div class="totals"><div class="tot-box"><small>Código Venda</small><b>${v.numero.replace('VD-','')}</b><span style="font-size:10px; color:#64748b;">${v.status}</span></div><div class="tot-box"><small>Desconto / Atendente</small><b style="font-size:14px;">Desc: ${fmtMoney(v.desconto||0)}<br></b><span style="font-size:10px; color:#64748b;">Atendente: ${v.criadoPorNome}</span></div><div class="tot-box highlight"><small>Total</small><b>${fmtMoney(v.total)}</b><span style="font-size:11px;">${v.formaPagamento||''}</span></div></div><div class="footer"><div><div class="sig">Assinatura Cliente<br><span style="font-size:10px; color:#94a3b8;">Recebi em ___/___/____ às ___:___</span></div></div><div style="text-align:right;"><p><b>Auditoria:</b> Criado por ${v.criadoPorNome||sess.usuarioNome}<br>CNPJ: ${sess.cnpj} • Código cliente: ${cli?.codigo||'-'}</p></div></div><div class="audit"><b>Layout novo:</b> Notinha redesenhada com header em cards, barra azul escura arredondada, totais em 3 boxes. Inspirada mas não cópia da Venda 15625 original.</div></div><div style="text-align:center; margin:20px;"><button onclick="window.print()" style="padding:12px 24px; background:#0a1e8a; color:white; border:0; border-radius:12px; font-weight:700;">Imprimir Notinha</button> <button onclick="window.close()" style="padding:12px 24px; background:white; border:1px solid #cbd5e1; border-radius:12px;">Fechar</button></div></body></html>`;
  win.document.write(html); win.document.close();
  logAction('venda','imprimir_notinha_v4',vendaId,`Impressão notinha redesenhada ${v.numero} por ${sess.usuarioNome}`);
  saveDB();
};
window.gerarOrcamentoPDF = function(vendaId){
  const sess=getSession(); const v=db.vendas.find(x=>x.id===vendaId && x.empresaId===sess.empresaId); if(!v) return; const cli=db.clientes.find(c=>c.id===v.clienteId); const empRaw=localStorage.getItem('digicopy_empresa_notinha'); let empSel=null; try{empSel=JSON.parse(empRaw);}catch{} const empresa=empSel||db.empresas.find(e=>e.id===sess.empresaId)||{nome:'DIGICOPY'}; const win=window.open('','_blank');
  const html=`<html><head><meta charset="UTF-8"><title>Orçamento ${v.numero}</title><style>body{font-family:Inter,Arial; margin:0; padding:0; background:#f6f7fb;} .page{max-width:800px; margin:20px auto; background:white; border-radius:16px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.08);} .header{background:#0a1e8a; color:white; padding:24px 28px; display:flex; justify-content:space-between;} .content{padding:24px 28px;} table{width:100%; border-collapse:collapse; font-size:12px;} th{background:#f1f5f9; text-align:left; padding:10px; font-size:10px; text-transform:uppercase; color:#64748b;} td{padding:10px; border-bottom:1px solid #f1f5f9;} .total{text-align:right; font-size:20px; font-weight:800; color:#0a1e8a; margin-top:20px;}</style></head><body><div class="page"><div class="header"><div><h1>ORÇAMENTO ${v.numero}</h1><p>${empresa.fantasia||empresa.nome} • ${empresa.cnpj||sess.cnpj}</p><p>Cliente: ${cli?.nome} • Cód: ${cli?.codigo}</p></div><div style="text-align:right;"><p style="background:rgba(255,255,255,0.15); padding:6px 12px; border-radius:20px; font-weight:700;">${v.status.toUpperCase()}</p></div></div><div class="content"><table><tr><th>#</th><th>Descrição</th><th>Qtd</th><th>Unit</th><th>Total</th></tr>${v.itens.map((it,idx)=>{const p=db.produtos.find(pr=>pr.id===it.produtoId); return `<tr><td>${idx+1}</td><td>${p?.nome||'Produto'}</td><td>${it.qtd}</td><td>${fmtMoney(it.preco)}</td><td><b>${fmtMoney(it.subtotal)}</b></td></tr>`}).join('')}</table><div class="total">Total: ${fmtMoney(v.total)}</div></div></div><div style="text-align:center; margin:20px;"><button onclick="window.print()" style="padding:12px 24px; background:#0a1e8a; color:white; border:0; border-radius:12px; font-weight:700;">Imprimir PDF Orçamento</button></div></body></html>`;
  win.document.write(html); win.document.close();
  logAction('venda','gerar_pdf_orcamento_v4',vendaId,`PDF orçamento ${v.numero}`);
  saveDB();
};
// Orçamentos view separada já existe no app.js? Vamos garantir renderOrcamentosView
window.renderOrcamentosView = window.renderOrcamentosView || function(){
  const sess=getSession(); if(!sess) return; const view=document.getElementById('view-orcamentos'); if(!view){ // se não existe view-orcamentos (no hub antigo), usa view-vendas filtrada
    // fallback: navega para vendas e filtra
    return;
  }
  const orcs=db.vendas.filter(v=>v.empresaId===sess.empresaId && (v.status==='orcamento' || v.status==='aprovado' || v.status==='aguardar')).sort((a,b)=>new Date(b.data)-new Date(a.data));
  // Se view-orcamentos não existe no hub antigo, não faz nada, pois orcamentos já está em vendas
  if(view){
    view.innerHTML=`<div class="flex flex-wrap justify-between gap-3"><div><h3 class="font-bold text-[16px]">Orçamentos</h3><p class="text-[13px] text-slate-500 mt-1">Separado de Vendas conforme pedido.</p></div><button onclick="novaVenda(); setTimeout(()=>{document.getElementById('nv-status').value='orcamento'; onStatusVendaChange();},300)" class="h-10 px-5 rounded-xl bg-[#0a1e8a] text-white font-semibold text-[13px] shadow">+ Novo orçamento</button></div>
    <div class="rounded-[16px] bg-white border shadow-sm overflow-hidden"><table class="w-full text-left text-[13px]"><thead class="bg-slate-50 border-b text-[11px] uppercase font-bold text-slate-500"><tr><th class="px-5 py-3">Orçamento / Cliente</th><th class="px-5 py-3">Total</th><th class="px-5 py-3">Situação</th><th class="px-5 py-3">Ações</th></tr></thead><tbody class="divide-y">${orcs.map(v=>{const cli=db.clientes.find(c=>c.id===v.clienteId); return `<tr class="hover:bg-slate-50"><td class="px-5 py-3"><p class="font-mono text-[11px] font-bold text-[#0a1e8a]">${v.numero}</p><p class="font-semibold text-[13px]">${cli?.nome||''}</p></td><td class="px-5 py-3"><p class="font-bold">${fmtMoney(v.total)}</p></td><td class="px-5 py-3"><span class="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-amber-50 text-amber-700 border">${v.status}</span></td><td class="px-5 py-3"><div class="flex gap-1"><button onclick="gerarOrcamentoPDF('${v.id}')" class="h-8 px-3 rounded-xl bg-[#0a1e8a] text-white text-[11px] font-bold">PDF</button></div></td></tr>`}).join('')||'<tr><td colspan="4" class="p-12 text-center text-slate-500">Nenhum orçamento</td></tr>'}</tbody></table></div>`;
  }
};
console.log('PATCH notinha v4.1 - layout novo inspirado não copia + orcamentos separado, mantendo hub antigo sidebar');
})();
