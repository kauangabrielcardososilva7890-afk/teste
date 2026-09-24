// test_recuperacao_completa.js — v7.0.8
// Trava o defeito PROVADO do paginador da lista de excluídos: registros excluídos
// no MESMO milissegundo (o PC manda as exclusões de 10 em 10, e o lote inteiro
// leva o mesmo carimbo) ficavam fora para sempre quando a página terminava no meio
// do grupo. Era isso que fazia a recuperação "trazer só parte" do que foi apagado.
// Aqui a consulta do motor é reproduzida em memória, do jeito que ela é escrita.
const fs=require('fs');
let passou=0;
function ok(nome,cond){if(!cond){console.error('  \u2718 '+nome);process.exit(1);}console.log('  \u2714 '+nome);passou++;}
const worker=fs.readFileSync('cloudflare-worker/src/index.js','utf8');
const motor=fs.readFileSync('cloudflare_data_sync_patch.js','utf8');

console.log('== RECUPERAÇÃO COMPLETA (v7.0.8) ==');

// ── banco de mentira: exclusões em grupos do mesmo milissegundo (é como nasce) ─
function banco(quantos){
  const registros=[];let t=1700000000000,i=0,lote=0;
  while(registros.length<quantos){
    const n=1+((lote*7)%10);                       // grupo de 1 a 10, variado
    for(let k=0;k<n&&registros.length<quantos;k++)registros.push({entity:'leituras',recordId:'L'+(i++),deletedAt:t});
    if(lote%9===0)t+=1;                            // às vezes o grupo cai no ms seguinte
    lote++;
  }
  return registros;
}
// tradução linha por linha de `WHERE deleted_at < ? ORDER BY deleted_at DESC LIMIT ?`
function paginarComoAntes(registros,limit){
  const vistos=new Set();let before=0,paginas=0;
  while(paginas++<60){
    const linhas=registros.filter(r=>r.deletedAt!==null&&(before?r.deletedAt<before:true))
      .sort((a,b)=>b.deletedAt-a.deletedAt).slice(0,limit);
    linhas.forEach(r=>vistos.add(r.entity+'|'+r.recordId));
    const ultimo=linhas.length?linhas[linhas.length-1].deletedAt:0;
    if(linhas.length<limit||!ultimo)break;
    before=ultimo;
  }
  return vistos;
}
// cursor COMPOSTO (deleted_at, entity, record_id) — o que passou a valer
function paginarComoAgora(registros,limit){
  const vistos=new Set();let before=0,ent='',id='',paginas=0;
  while(paginas++<60){
    const linhas=registros.filter(r=>{
      if(r.deletedAt===null)return false;
      if(!before)return true;
      if(r.deletedAt<before)return true;
      if(r.deletedAt>before)return false;
      if(r.entity<ent)return true;
      if(r.entity>ent)return false;
      return r.recordId<id;
    }).sort((a,b)=>b.deletedAt-a.deletedAt||(a.entity===b.entity?0:(a.entity<b.entity?1:-1))||(a.recordId<b.recordId?1:-1))
      .slice(0,limit);
    linhas.forEach(r=>vistos.add(r.entity+'|'+r.recordId));
    const ultimo=linhas.length?linhas[linhas.length-1]:null;
    if(linhas.length<limit||!ultimo)break;
    before=ultimo.deletedAt;ent=ultimo.entity;id=ultimo.recordId;
  }
  return vistos;
}

console.log('-- a prova (o defeito e o conserto) --');
const registros=banco(3000);
const antes=paginarComoAntes(registros,1000);
const antes200=paginarComoAntes(registros,200);
const agora=paginarComoAgora(registros,1000);
ok('a paginação antiga PERDIA registro (documentado: '+antes.size+' de 3000 com página 1000)',antes.size<registros.length);
ok('com página de 200 a perda era maior ainda ('+antes200.size+' de 3000)',antes200.size<antes.size);
ok('a paginação nova alcança TODOS ('+agora.size+' de '+registros.length+')',agora.size===registros.length);
ok('e nenhum registro é repetido',agora.size===new Set([...agora]).size);

console.log('-- o motor da nuvem (a consulta de verdade) --');
ok('a consulta usa o cursor composto (deleted_at, entity, record_id)',
  /deleted_at = \? AND \(entity < \? OR \(entity = \? AND record_id < \?\)\)/.test(worker));
ok('a ordenação é a mesma do cursor (sem "terra de ninguém")',
  /ORDER BY deleted_at DESC, entity DESC, record_id DESC LIMIT \?/.test(worker));
ok('continua aceitando o pedido antigo (só `before`) para não quebrar PC velho',
  /else if \(beforeBruto\) \{/.test(worker) && /AND deleted_at < \?\s*\n\s*\$\{ORDEM\}/.test(worker));
ok('devolve o par que fecha o cursor',
  /proximoEntity: ultimoReg \? ultimoReg\.entity : undefined/.test(worker) &&
  /proximoId: ultimoReg \? ultimoReg\.recordId : undefined/.test(worker));
ok('motor carimbado 5.26.8 (a versão nova tem de ser publicada para valer)',
  /WORKER_VERSION = '5\.26\.8'/.test(worker));

console.log('-- o PC que varre a lista --');
ok('o PC manda o cursor composto quando o motor devolve o par',
  /beforeEnt=String\(r\.proximoEntity\|\|''\);beforeId=String\(r\.proximoId\|\|''\)/.test(motor) &&
  /url\+='&beforeEntity='\+encodeURIComponent\(beforeEnt\)\+'&beforeId='\+encodeURIComponent\(beforeId\)/.test(motor));
ok('o PC SÓ considera a varredura completa quando o motor devolve o par do cursor (motor que pula não é "completo")',
  /if\(r&&r\.proximoEntity&&r\.proximoId\)varreduraCompleta=true;/.test(motor) &&
  /if\(volta===0&&!lote\.length\)\{varreduraCompleta=true;varreduraTerminou=true;\}/.test(motor) &&
  /const MOTOR_MINIMO='5\.26\.7';/.test(motor));
ok('o aviso ao dono reaparece quando a exigência de motor muda',
  /enfileirarRecado\('motor-antigo:'\+MOTOR_MINIMO/.test(motor));
ok('o PC não repete registro entre páginas (conjunto do que já viu)',
  /const vistos=new Set\(\)/.test(motor) && /if\(vistos\.has\(chave\)\)continue;/.test(motor));

console.log('-- a memória do que já foi recuperado --');
ok('a chave é entidade+id (duas listas com o mesmo id não se confundem)',
  /function marcarRecuperado\(entity,recordId\)/.test(motor) &&
  /m\[String\(entity\)\+'\|'\+String\(recordId\)\]=Date\.now\(\)/.test(motor));
ok('a leitura continua aceitando as chaves antigas (nada recuperado de novo)',
  /function jaRecuperado\(memoria,entity,recordId\)/.test(motor) &&
  /m\[String\(entity\)\+'\|'\+String\(recordId\)\]\|\|m\[String\(recordId\)\]/.test(motor));
ok('os dois usos (nuvem e fotos locais) passam a entidade',
  /!jaRecuperado\(jaVieram,r\.entity,r\.recordId\)/.test(motor) &&
  /jaRecuperado\(ja,entidade,k\)/.test(motor));

console.log('-- e o que a exclusão (v7.0.7) continua garantindo --');
ok('a marca do que ele apagou continua no lugar e barata',
  /excluidosDeProposito/.test(motor) && /function resumoDaBase\(\)/.test(motor));

console.log('\nRESULTADO: '+passou+' verificações — a recuperação alcança tudo o que foi apagado!');
