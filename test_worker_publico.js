// test_worker_publico.js — v7.0.12 (motor da nuvem 5.26.8)
// Roda o MOTOR DA NUVEM DE VERDADE (cloudflare-worker/src/index.js) sobre um banco
// SQLite em memória, aplicando as migrations reais do projeto. É o mesmo código
// que o dono publica — só o banco é de mentira.
//
// Trava o que foi provado nesta rodada:
//   1) o aparelho público ("Aprovação Pública") NÃO pode ser apagado e recriado a
//      cada acesso — era `INSERT OR REPLACE`, que no SQLite apaga a linha e com ela
//      ia embora a revogação (`revoked_at`) e a exclusão (`excluido_em`);
//   2) a busca do orçamento pelo token não pode trazer a lista inteira de orçamentos
//      para o motor abrir o JSON de cada um (a cada acesso do cliente);
//   3) o caminho público passa pelo freio da cota do dia e conta no medidor;
//   4) a criação "sem cadastro" (venda montada a partir do próprio link) tem teto
//      diário — o link é público e não tem como provar quem mandou;
//   5) o fluxo normal do cliente (ver, autorizar, recusar) continua funcionando.
const fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
let passou=0;
function ok(nome,cond){if(!cond){console.error('  \u2718 '+nome);process.exit(1);}console.log('  \u2714 '+nome);passou++;}

let sqlite=null;
try{ sqlite=require('node:sqlite'); }
catch(e){
  // Node antigo: tenta de novo com a flag (uma vez)
  if(process.env.__DIGICOPY_SQLITE!=='1'){
    const r=require('child_process').spawnSync(process.execPath,['--experimental-sqlite',__filename],
      {stdio:'inherit',env:Object.assign({},process.env,{__DIGICOPY_SQLITE:'1'})});
    process.exit(r.status||0);
  }
  console.log('== MOTOR DA NUVEM (banco de prova) ==');
  console.log('  (não rodou: este Node não tem node:sqlite)');
  process.exit(0);
}

console.log('== MOTOR DA NUVEM NO BANCO DE PROVA (v5.26.8) ==');

// ── banco de mentira, igual ao D1: prepare/bind/first/all/run/batch/exec ────
function abrirBanco(){
  const db=new sqlite.DatabaseSync(':memory:');
  // As tabelas que o MOTOR cria em execução (app_versao, app_releases, uso_diario…)
  // precisam existir antes das migrations: a 0006 altera app_releases. Extraio os
  // CREATE que o próprio motor escreve — nada inventado aqui.
  const fonteWorker=fs.readFileSync(process.env.DIGICOPY_WORKER||'cloudflare-worker/src/index.js','utf8');
  const cria=[...fonteWorker.matchAll(/DB\.exec\(`(CREATE TABLE IF NOT EXISTS[^`]*?)`\)/g)].map(m=>m[1]);
  for(const sql of cria) db.exec(sql);
  const migracoes=fs.readdirSync('cloudflare-worker/migrations').filter(f=>/\.sql$/.test(f)).sort();
  for(const m of migracoes) db.exec(fs.readFileSync(path.join('cloudflare-worker/migrations',m),'utf8'));
  const escritos=[];
  const norm=a=>a.map(x=>{
    if(x===undefined||x===null)return null;
    if(typeof x==='boolean')return x?1:0;
    if(typeof x==='number'&&!Number.isFinite(x))return null;
    return x;
  });
  function stmt(sql){
    const s={
      sql:sql,_args:[],
      bind(...a){ s._args=norm(a); return s; },
      async first(){ const r=db.prepare(sql).get(...s._args); return r===undefined?null:r; },
      async all(){ return {results:db.prepare(sql).all(...s._args)}; },
      async run(){ const i=db.prepare(sql).run(...s._args); return {success:true,meta:i}; }
    };
    return s;
  }
  const D1={
    prepare:sql=>{ escritos.push(String(sql).replace(/\s+/g,' ').trim()); return stmt(sql); },
    async exec(sql){ db.exec(sql); },
    async batch(lista){
      const saida=[];
      db.exec('BEGIN');
      try{
        for(const s of lista) saida.push(await s.run());
        db.exec('COMMIT');
      }catch(e){ try{db.exec('ROLLBACK');}catch(e2){} throw e; }
      return saida;
    }
  };
  return {db,D1,escritos};
}
// ── chama o worker de verdade: fetch(request, env, ctx) ────────────────────
async function abrirWorker(){
  // permite apontar para outra cópia do motor (usado para conferir que este teste
  // REPROVA o motor antigo — e passa no corrigido)
  const alvo=process.env.DIGICOPY_WORKER||'cloudflare-worker/src/index.js';
  const mod=await import(pathToFileURL(path.resolve(alvo)).href);
  return mod.default;
}
function chamar(worker,banco,url,opcoes){
  const pend=[];
  const ctx={waitUntil:p=>{pend.push(Promise.resolve(p));}};
  const env={DB:banco.D1,SETUP_SECRET:'segredo-de-teste'};
  const req=new Request(url,opcoes||{});
  return worker.fetch(req,env,ctx).then(async res=>{
    const corpo=await res.json().catch(()=>null);
    await Promise.all(pend);            // deixa o medidor do dia gravar
    return {status:res.status,corpo};
  });
}
const dia=()=>new Date().toISOString().slice(0,10);
function semearOrcamento(banco,recordId,token,dados){
  // o aparelho precisa existir: o banco de prova tem as mesmas chaves estrangeiras
  banco.db.prepare(`INSERT OR IGNORE INTO devices(id,name,token_hash,role,created_at,last_seen_at)
    VALUES('pc-1','PC da loja','h','device',?,?)`).run(Date.now(),Date.now());
  banco.db.prepare(`INSERT INTO records(entity,record_id,data_json,version,updated_at,deleted_at,updated_by)
    VALUES('orcamentos',?,?,1,?,NULL,'pc-1')`).run(recordId,JSON.stringify(Object.assign({id:recordId,token:token,numero:'100',clienteNome:'Cliente Teste',itens:[{descricao:'Serviço',qtd:1,preco:50,subtotal:50}],total:50,status:'aberto'},dados||{})),Date.now());
}
function payloadLink(extra){
  const p=Object.assign({t:'olink',n:'100',c:'Cliente Teste',dt:'2026-01-01',tot:50,w:'38999999999',it:[{d:'Serviço',q:1,p:50,s:50}]},extra||{});
  return Buffer.from(JSON.stringify(p),'utf8').toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
const conta=(banco,sql,...args)=>banco.db.prepare(sql).get(...args).n;

(async()=>{
  const worker=await abrirWorker();

  // ═══ 1) fluxo normal do cliente ══════════════════════════════════════════
  console.log('-- 1) o fluxo do cliente continua funcionando --');
  {
    const banco=abrirBanco();
    semearOrcamento(banco,'orc_1','otoken123456');
    const ver=await chamar(worker,banco,'https://api.test/orcamento?c=otoken123456');
    ok('abrir o link do orçamento devolve a página do cliente ('+ver.status+')',
      ver.status===200&&ver.corpo&&ver.corpo.ok===true&&ver.corpo.numero==='100');
    const ap=await chamar(worker,banco,'https://api.test/orcamento',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({acao:'aprovar',c:'otoken123456'})});
    ok('autorizar cria a venda salva ('+ap.corpo.vendaId+')',ap.status===200&&ap.corpo.status==='aprovado'&&!!ap.corpo.vendaId);
    ok('a venda existe no banco',conta(banco,"SELECT COUNT(*) n FROM records WHERE entity='vendas'")===1);
    ok('a notificação para o dono existe',conta(banco,"SELECT COUNT(*) n FROM records WHERE entity='notificacoes'")===1);
    ok('o orçamento ficou marcado como aprovado',
      String(JSON.parse(banco.db.prepare("SELECT data_json d FROM records WHERE entity='orcamentos' AND record_id='orc_1'").get().d).status)==='aprovado');
    ok('venda normal NÃO leva a marca de "sem cadastro"',
      !JSON.parse(banco.db.prepare("SELECT data_json d FROM records WHERE entity='vendas'").get().d).semCadastroNoSistema);
    const deNovo=await chamar(worker,banco,'https://api.test/orcamento',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({acao:'aprovar',c:'otoken123456'})});
    ok('autorizar duas vezes não gera outra venda ('+deNovo.corpo.message+')',
      deNovo.status===200&&conta(banco,"SELECT COUNT(*) n FROM records WHERE entity='vendas'")===1);
  }
  {
    const banco=abrirBanco();
    semearOrcamento(banco,'orc_2','otoken222222');
    const rec=await chamar(worker,banco,'https://api.test/orcamento',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({acao:'recusar',c:'otoken222222'})});
    ok('recusar continua funcionando',rec.status===200&&rec.corpo.status==='recusado');
    ok('recusa não cria venda',conta(banco,"SELECT COUNT(*) n FROM records WHERE entity='vendas'")===0);
  }
  {
    const banco=abrirBanco();
    const pedidoInvalido=await chamar(worker,banco,'https://api.test/orcamento',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({c:'otoken222222'})});
    ok('pedido sem ação é recusado',pedidoInvalido.status===400);
    ok('pedido recusado não grava NADA (nem a linha do aparelho público)',
      conta(banco,"SELECT COUNT(*) n FROM devices")===0);
  }

  // ═══ 2) o aparelho público não pode ser apagado e recriado ═══════════════
  console.log('-- 2) a revogação do aparelho público tem de segurar --');
  {
    const banco=abrirBanco();
    semearOrcamento(banco,'orc_3','otoken333333');
    // o mecanismo ANTIGO, para o defeito ficar documentado no próprio teste:
    // `INSERT OR REPLACE` apaga a linha e cria outra (revogação vai embora)
    banco.db.exec(`INSERT OR REPLACE INTO devices(id,name,token_hash,role,created_at,last_seen_at)
      VALUES('public-orcamento','Aprovação Pública','hash-publico','device',111,111)`);
    banco.db.exec(`UPDATE devices SET revoked_at=222, excluido_em=333 WHERE id='public-orcamento'`);
    banco.db.exec(`INSERT OR REPLACE INTO devices(id,name,token_hash,role,created_at,last_seen_at)
      VALUES('public-orcamento','Aprovação Pública','hash-publico','device',444,444)`);
    // ATENÇÃO (achado do próprio teste): num "OR REPLACE" o conflito pode ser de
    // OUTRO índice — o token_hash é ÚNICO, então subir o mesmo valor apagava a
    // linha de outro aparelho (o banco recusou por chave estrangeira no fim do
    // comando). Com ON CONFLICT(id) DO UPDATE isso não existe: a linha do
    // aparelho público é a única que pode ser tocada. Fica valendo em dobro
    // para a correção.
    const linha=banco.db.prepare("SELECT * FROM devices WHERE id='public-orcamento'").get();
    ok('(documentado) o INSERT OR REPLACE antigo apagava a revogação: revoked_at='+linha.revoked_at+' excluido_em='+linha.excluido_em,
      linha.revoked_at===null&&linha.excluido_em===null&&linha.created_at===444);
    // agora o dono REVOGA o aparelho público no painel e o cliente decide o orçamento
    // (abrir a página é só leitura; quem grava o aparelho público é o POST)
    banco.db.exec(`UPDATE devices SET revoked_at=555, excluido_em=666 WHERE id='public-orcamento'`);
    const post=()=>chamar(worker,banco,'https://api.test/orcamento',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({acao:'recusar',c:'otoken333333'})});
    await post();
    await post();
    const depois=banco.db.prepare("SELECT * FROM devices WHERE id='public-orcamento'").get();
    ok('o motor de agora manda a visita sem apagar a linha (revogado='+depois.revoked_at+', excluído='+depois.excluido_em+')',
      depois&&Number(depois.revoked_at)===555&&Number(depois.excluido_em)===666);
    ok('e sem reiniciar o "criado em" (created_at segue o primeiro)',
      depois.created_at===444);
    ok('mas a visita é atualizada (last_seen_at maior que antes)',Number(depois.last_seen_at)>444);
    ok('existe UMA só linha do aparelho público',conta(banco,"SELECT COUNT(*) n FROM devices WHERE id='public-orcamento'")===1);
  }

  // ═══ 3) achar o orçamento pelo token não pode varrer a lista inteira ═════
  console.log('-- 3) busca do token: uma linha, não a lista toda --');
  {
    const banco=abrirBanco();
    for(let i=0;i<300;i++)semearOrcamento(banco,'orc_v'+i,'otok'+String(i).padStart(6,'0'));
    banco.escritos.length=0;
    const achou=await chamar(worker,banco,'https://api.test/orcamento?c=otok000123');
    ok('acha o orçamento certo no meio de 300 ('+achou.status+' , numero='+(achou.corpo&&achou.corpo.numero)+')',
      achou.status===200&&achou.corpo&&achou.corpo.numero==='100');
    const varredura=banco.escritos.filter(q=>/SELECT \* FROM records WHERE entity = 'orcamentos' *$/.test(q.trim()));
    ok('NÃO pediu a lista inteira de orçamentos',varredura.length===0);
    ok('usou o filtro no banco (token dentro do JSON)',
      banco.escritos.some(q=>/LIKE \? ESCAPE/.test(q)&&/entity = 'orcamentos'/.test(q)));
    ok('não trouxe 300 registros (nenhuma consulta de lista completa)',
      !banco.escritos.some(q=>/FROM records WHERE entity = 'orcamentos'\s*$/.test(q.trim())));
    // e o caminho antigo (id do registro) continua valendo
    const porId=await chamar(worker,banco,'https://api.test/orcamento?c=orc_v5');
    ok('link antigo com o ID do registro continua abrindo',porId.status===200);
    const nada=await chamar(worker,banco,'https://api.test/orcamento?c=naoexiste123');
    ok('token que não existe devolve 404',nada.status===404);
    const curto=await chamar(worker,banco,'https://api.test/orcamento?c=abc');
    ok('token curto demais não acha nada',curto.status===404);
  }

  // ═══ 4) freio da cota + medidor do dia no caminho público ════════════════
  console.log('-- 4) o caminho público conta na cota e obedece o freio --');
  {
    const banco=abrirBanco();
    semearOrcamento(banco,'orc_4','otoken444444');
    await chamar(worker,banco,'https://api.test/orcamento',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({acao:'aprovar',c:'otoken444444'})});
    const uso=banco.db.prepare('SELECT escritas FROM uso_diario WHERE dia=?').get(dia());
    ok('as gravações do caminho público entram no medidor do dia ('+(uso?uso.escritas:0)+')',!!uso&&Number(uso.escritas)>=3);
  }
  {
    const banco=abrirBanco();
    semearOrcamento(banco,'orc_5','otoken555555');
    banco.db.prepare("INSERT INTO uso_diario(dia,escritas,leituras) VALUES(?,95000,0)").run(dia());
    const cheio=await chamar(worker,banco,'https://api.test/orcamento',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({acao:'aprovar',c:'otoken555555'})});
    ok('perto do teto do dia, a nuvem pausa o caminho público ('+cheio.status+')',
      cheio.status===429&&cheio.corpo&&cheio.corpo.quota===true&&/daily row write limit/.test(cheio.corpo.error));
    ok('e não grava nada (nenhuma venda criada)',conta(banco,"SELECT COUNT(*) n FROM records WHERE entity='vendas'")===0);
  }

  // ═══ 5) criação "sem cadastro": funciona, fica marcada e tem teto ════════
  console.log('-- 5) link antes do cadastro: teto por dia e marca na venda --');
  {
    const banco=abrirBanco();
    const d=payloadLink({t:'olinknovo'});
    const sem=await chamar(worker,banco,'https://api.test/orcamento',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({acao:'aprovar',c:'olinknovo',numero:'777',clienteNome:'Cliente Novo',d:d})});
    ok('o caminho "sem cadastro" continua criando a venda ('+sem.corpo.vendaId+')',sem.status===200&&!!sem.corpo.vendaId);
    const venda=JSON.parse(banco.db.prepare("SELECT data_json d FROM records WHERE entity='vendas'").get().d);
    ok('a venda fica MARCADA para o dono saber de onde veio',venda.semCadastroNoSistema===true);
    ok('e o orçamento também',
      JSON.parse(banco.db.prepare("SELECT data_json d FROM records WHERE entity='orcamentos' LIMIT 1").get().d).semCadastroNoSistema===true);
    ok('contou no teto do dia',
      Number(banco.db.prepare("SELECT value v FROM system_meta WHERE key=?").get('orc_pub_sem_cadastro_'+dia()).v)===1);
  }
  {
    const banco=abrirBanco();
    // simula o teto já batido hoje (uso normal é raro; 40 é folga)
    banco.db.prepare("INSERT INTO system_meta(key,value,updated_at) VALUES(?,?,?)").run('orc_pub_sem_cadastro_'+dia(),'40',Date.now());
    const estourou=await chamar(worker,banco,'https://api.test/orcamento',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({acao:'aprovar',c:'olinkforjado',numero:'999',clienteNome:'Forjado',d:payloadLink()})});
    ok('passando do teto, a criação sem cadastro é recusada ('+estourou.status+')',estourou.status===429);
    ok('e NADA é criado (nenhuma venda falsa entra na base)',
      conta(banco,"SELECT COUNT(*) n FROM records WHERE entity='vendas'")===0&&
      conta(banco,"SELECT COUNT(*) n FROM records WHERE entity='orcamentos'")===0);
  }

  console.log('\nRESULTADO: '+passou+' verificações passaram — o motor da nuvem no banco de prova (fluxo do cliente, aparelho público, busca do token, cota e teto).');
  process.exit(0);
})().catch(e=>{console.error('  \u2718 erro no teste: '+(e&&e.stack||e));process.exit(1);});
