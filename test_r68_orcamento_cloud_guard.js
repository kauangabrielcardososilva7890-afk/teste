const assert = require('node:assert/strict');
const ResponseCtor = globalThis.Response;
if (typeof ResponseCtor !== 'function') throw new Error('Node 22 Response global ausente');

(async function(){
  const requests = [];
  let syncState = { authorized:false, paused:false };
  const fakeWindow = {
    location:{ href:'https://qa.local/index.html' },
    Response:ResponseCtor,
    setTimeout,
    DIGICOPY_CLOUD_SYNC:{ info:function(){ return Object.assign({}, syncState); } },
    fetch:async function(input, init){
      requests.push({input, init});
      return new ResponseCtor(JSON.stringify({ok:true,status:'aberto',source:'qa-network-mock'}), {status:200,headers:{'Content-Type':'application/json'}});
    }
  };
  global.window = fakeWindow;
  require('./orcamento_cloud_guard_patch.js');

  const urlOffline = 'https://api.invalid/orcamento?c=fixture-offline';
  assert.equal(fakeWindow.DIGICOPY_ORCAMENTO_CLOUD_GUARD.authorized(), false);
  assert.equal(fakeWindow.DIGICOPY_ORCAMENTO_CLOUD_GUARD.isQuotePoll(urlOffline), true);
  const offline = await fakeWindow.fetch(urlOffline);
  assert.deepEqual(await offline.json(), {ok:true,status:'aberto',localOnly:true});
  assert.equal(requests.length, 0, 'sem autorização, o endpoint não pode chegar ao fetch de rede');

  syncState = { authorized:true, paused:true };
  const paused = await fakeWindow.fetch('https://api.invalid/orcamento?c=fixture-paused');
  assert.deepEqual(await paused.json(), {ok:true,status:'aberto',localOnly:true});
  assert.equal(requests.length, 0, 'com sincronização pausada, polling remoto continua bloqueado');

  syncState = { authorized:true, paused:false };
  const authorizedUrl = 'https://api.invalid/orcamento?c=fixture-authorized';
  const pair = await Promise.all([fakeWindow.fetch(authorizedUrl), fakeWindow.fetch(authorizedUrl)]);
  assert.equal(requests.length, 1, 'chamadas simultâneas para o mesmo orçamento fazem uma única consulta');
  for (const response of pair) assert.deepEqual(await response.json(), {ok:true,status:'aberto',source:'qa-network-mock'});

  const nonQuote = await fakeWindow.fetch('https://api.invalid/health');
  assert.deepEqual(await nonQuote.json(), {ok:true,status:'aberto',source:'qa-network-mock'});
  const write = await fakeWindow.fetch('https://api.invalid/orcamento?c=fixture-write', {method:'POST'});
  assert.equal(write.status, 200, 'a barreira é específica do GET de consulta de aprovação');
  assert.equal(requests.length, 3, 'rotas fora do escopo da barreira continuam no fetch original');

  console.log('OK — orçamento local/pausado não sai do aparelho, consulta autorizada é deduplicada e o restante do fetch permanece intacto.');
})().catch(function(err){ console.error(err); process.exit(1); });
