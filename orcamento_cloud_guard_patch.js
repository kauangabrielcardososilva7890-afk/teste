// v5.22.94 — barreira de autorização e deduplicação do polling de orçamentos.
// Várias camadas legadas iniciavam verificações simultâneas de /orcamento?c=.
// Em modo local/desconectado a consulta responde como pendente sem sair do aparelho;
// quando a Nuvem está autorizada e ativa, chamadas idênticas são deduplicadas.
(function(root){
  'use strict';
  if(!root || typeof root.fetch !== 'function') return;
  if(root.fetch.__digicopyOrcamentoCloudGuard) return;

  var originalFetch = root.fetch;
  var inflight = new Map();
  var DEDUPE_MS = 1500;

  function autorizado(){
    try{
      var sync = root.DIGICOPY_CLOUD_SYNC;
      if(sync && typeof sync.info === 'function'){
        var info = sync.info() || {};
        return !!info.authorized && !info.paused;
      }
    }catch(e){ return false; }
    try{
      var cloud = root.DIGICOPY_CLOUD;
      return !!(cloud && typeof cloud.token === 'function' && cloud.token());
    }catch(e){ return false; }
  }

  function requestMeta(input, init){
    var rawUrl = '';
    var method = '';
    try{ rawUrl = typeof input === 'string' ? input : (input && input.url) || String(input || ''); }catch(e){}
    try{ method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase(); }catch(e){ method = 'GET'; }
    try{
      var url = new URL(rawUrl, root.location && root.location.href || 'http://localhost/');
      if(method === 'GET' && /(?:^|\/)orcamento$/.test(url.pathname) && url.searchParams.has('c')) return { key:url.href };
    }catch(e){}
    return null;
  }

  function response(body){
    var json = JSON.stringify(body);
    var Ctor = root.Response || (typeof Response === 'function' ? Response : null);
    if(Ctor){
      try{ return new Ctor(json, {status:200, headers:{'Content-Type':'application/json'}}); }catch(e){}
    }
    return {ok:true,status:200,json:function(){return Promise.resolve(body);},text:function(){return Promise.resolve(json);}};
  }

  function snapshot(res){
    if(!res || typeof res.clone !== 'function') return Promise.resolve({original:res});
    return res.clone().text().then(function(body){
      var headers=[];
      try{ if(res.headers && typeof res.headers.forEach === 'function') res.headers.forEach(function(v,k){headers.push([k,v]);}); }catch(e){}
      return {body:body,status:res.status||200,statusText:res.statusText||'',headers:headers};
    });
  }

  function replay(item){
    if(item && Object.prototype.hasOwnProperty.call(item,'original')) return item.original;
    var Ctor = root.Response || (typeof Response === 'function' ? Response : null);
    if(Ctor){
      try{
        var noBody = item.status === 204 || item.status === 205 || item.status === 304;
        return new Ctor(noBody ? null : item.body, {status:item.status||200,statusText:item.statusText||'',headers:item.headers||[]});
      }catch(e){}
    }
    return {ok:(item.status||200) >= 200 && (item.status||200) < 300,status:item.status||200,json:function(){try{return Promise.resolve(JSON.parse(item.body||'{}'));}catch(e){return Promise.resolve({});}},text:function(){return Promise.resolve(item.body||'');}};
  }

  function guardedFetch(input, init){
    var context = this;
    var args = arguments;
    var meta = requestMeta(input, init);
    if(!meta) return originalFetch.apply(context, args);
    if(!autorizado()) return Promise.resolve(response({ok:true,status:'aberto',localOnly:true}));

    var now = Date.now();
    var current = inflight.get(meta.key);
    if(current && current.expiresAt >= now) return current.promise.then(replay);

    var entry = {expiresAt:now + DEDUPE_MS, promise:null};
    entry.promise = Promise.resolve().then(function(){ return originalFetch.apply(context, args); }).then(snapshot).catch(function(err){
      if(inflight.get(meta.key) === entry) inflight.delete(meta.key);
      throw err;
    });
    inflight.set(meta.key, entry);
    var timer = setTimeout(function(){ if(inflight.get(meta.key) === entry) inflight.delete(meta.key); }, DEDUPE_MS);
    if(timer && typeof timer.unref === 'function') timer.unref();
    return entry.promise.then(replay);
  }
  guardedFetch.__digicopyOrcamentoCloudGuard = true;
  guardedFetch.__originalFetch = originalFetch;
  root.fetch = guardedFetch;
  root.DIGICOPY_ORCAMENTO_CLOUD_GUARD = {authorized:autorizado,isQuotePoll:function(input,init){return !!requestMeta(input,init);}};
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
