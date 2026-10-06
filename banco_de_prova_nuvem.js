// BANCO DE PROVA DA NUVEM (ferramenta de desenvolvimento — NÃO faz parte do sistema, não entra no bundle).
// uma função instantânea. O que sobra no cronômetro é o trabalho do próprio PC.
const fs=require('fs');
const code=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');

// ── base parecida com a do dono ─────────────────────────────────────────────
const TAM={clientes:3000,produtos:1500,contratos:4000,parque:3000,leituras:25000,
           os:8000,vendas:20000,contasReceber:4000,contasPagar:2000,
           equipamentos:2000,orcamentos:3000,recargas:1000,tecnicos:50};
function reg(entity,i){
  const base={id:entity+'-'+i,nome:'REGISTRO '+i+' DE '+entity,valor:(i*7)%1000,
    data:'2026-0'+((i%9)+1)+'-1'+(i%9),texto:'observacao do registro '+i+' com '+
    'um texto de tamanho realista para medir a copia profunda do motor'};
  if(entity==='leituras')base.payload='L'.repeat(120);
  if(entity==='contratos')base.itens=[{id:'it'+i,qtd:i%7},{id:'it2'+i,qtd:(i*3)%5}];
  return base;
}
const db={config:{empresa:'X'},_seq:{venda:100},modulosDinamicos:{}};
for(const [e,n] of Object.entries(TAM)){
  db[e]=[];for(let i=1;i<=n;i++)db[e].push(reg(e,i));
}
globalThis.db=db;
const total=Object.values(TAM).reduce((a,b)=>a+b,0);

// ── diário da nuvem: 1 mudança por registro + 20% de edições ────────────────
const diario=[];let seq=0;
for(const [e,n] of Object.entries(TAM)){
  for(let i=1;i<=n;i++){
    const d=reg(e,i);d.marca='v1';
    diario.push({seq:++seq,entity:e,recordId:e+'-'+i,operation:'upsert',data:d,version:1});
    if(i%5===0){const d2=reg(e,i);d2.marca='v2-'+(i%3);
      diario.push({seq:++seq,entity:e,recordId:e+'-'+i,operation:'upsert',data:d2,version:2});}
  }
}
// config e _seq também existem na nuvem (sem eles a fila nunca esvazia e a prova mente)
diario.push({seq:++seq,entity:'config',recordId:'__root__',operation:'upsert',data:{empresa:'X'},version:1});
diario.push({seq:++seq,entity:'_seq',recordId:'__root__',operation:'upsert',data:{venda:100},version:1});
const MAXSEQ=diario.length;
let chamadas=0,custoStatus=0,t0=0,tEstadoAgora=0;
const api=async(path)=>{
  if(path.indexOf('/v1/status')===0){custoStatus+=1;return {ok:true,totals:{records:total,cursor:MAXSEQ}};}
  const m=/cursor=(\d+)&limit=(\d+)/.exec(path);
  if(!m)throw new Error('rota inesperada: '+path);
  chamadas+=1;
  const cursor=Number(m[1]),limite=Number(m[2]);
  if(!tEstadoAgora&&cursor>MAXSEQ/2)tEstadoAgora=Date.now()-t0;   // 1ª página do passe rápido
  const fatia=diario.filter(x=>x.seq>cursor).slice(0,limite);
  const hasMore=diario.some(x=>x.seq>(fatia.length?fatia[fatia.length-1].seq:cursor));
  return {ok:true,nextCursor:fatia.length?fatia[fatia.length-1].seq:cursor,hasMore,changes:fatia};
};
const store={};const localStorage={getItem:k=>(k in store?store[k]:null),
  setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];},
  get length(){return Object.keys(store).length;},key:i=>Object.keys(store)[i]||null};
const window={DIGICOPY_CLOUD:{token:()=>'tok',api}};
new Function('window','localStorage','document',code)(window,localStorage,undefined);
const S=window.DIGICOPY_CLOUD_SYNC;

// a base abre vazia neste PC (modo só nuvem): o motor remonta tudo do diário
for(const k of Object.keys(db)){if(Array.isArray(db[k]))db[k]=[];}
db.config={};db._seq={};db.modulosDinamicos={};

(async()=>{
  console.log('base: '+total.toLocaleString('pt-BR')+' registros · diário: '+MAXSEQ.toLocaleString('pt-BR')+' mudanças');
  let t=Date.now();t0=t;tEstadoAgora=0;
  await S.tick('bench-1');
  const t1=Date.now()-t;
  const paginas=chamadas;
  // segundo ciclo: base já remontada (é o que acontece em cada 3 s)
  chamadas=0;custoStatus=0;
  await new Promise(r=>setTimeout(r,800));   // deixa a gravação agrupada do 1º ciclo terminar
  t=Date.now();
  await S.tick('heartbeat');
  const t2=Date.now()-t;
  console.log('1ª carga (remonta a base inteira): '+t1+' ms · '+paginas+' páginas');
  console.log('estado de AGORA na tela (passe rápido, 1ª página): '+(tEstadoAgora||0)+' ms');
  console.log('ciclo seguinte (base já pronta)   : '+t2+' ms · status='+custoStatus+' · páginas='+chamadas);
  const i1=S.info();
  const est=JSON.parse(store['digicopy_cf_sync_state_v1']||'{}');
  console.log('DIAG: outbox='+i1.outbox+' · pending='+i1.pending+' · limpar='+((est.limpar||[]).length)+
    ' · sumindo='+Object.keys(est.sumindo||{}).length+' · faxina='+est.faxina);
  const ritmo=[];
  for(let i=0;i<4;i++){
    await new Promise(r=>setTimeout(r,3000));   // ritmo real do sistema (3 s)
    const ti=Date.now();await S.tick('agendado');ritmo.push(Date.now()-ti);
  }
  console.log('ciclos automáticos seguintes (3 s de intervalo): '+ritmo.join(' · ')+' ms');
  // ── CUSTO DO CLIQUE DE APAGAR (a marca da v7.0.7 tira dois retratos da base) ──
  const t3=Date.now();S.marcarIntencaoDeExcluir();const t4=Date.now();
  const t5=Date.now();S.fecharIntencaoDeExclusao();const t6=Date.now();
  console.log('CUSTO DO CLIQUE: marca='+(t4-t3)+' ms · fecha='+(t6-t5)+' ms · total='+((t4-t3)+(t6-t5))+' ms');
  console.log('tamanho do estado salvo no navegador: '+
    Math.round((store['digicopy_cf_sync_state_v1']||'').length/1024)+' KB');
})().catch(e=>{console.error('erro no banco de prova:',e&&e.stack||e);process.exit(1);});
