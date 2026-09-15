// ═══════════════════════════════════════════════════════════════
// v5.24.27 — Fase 1 do "programa de monitorar impressoras" (pedido
// do dono: 'faz'). SNMPv2c mínimo escrito na veia via UDP (dgram),
// SEM dependência de npm: dá pra ler contador, toner e ERROS reais
// (papel atolado, sem papel, tampa aberta, toner...) das impressoras
// locadas que estão na MESMA rede do PC que roda o .exe.
// Navegador/celular não falam SNMP (UDP não existe lá) — por isso
// este módulo mora no processo principal do Electron. Pure/testável.
// ═══════════════════════════════════════════════════════════════
'use strict';

// ── BER minimal ────────────────────────────────────────────────
function tlv(tag, valueBuf){
  const len = valueBuf.length;
  let lenEnc;
  if(len < 128) lenEnc = Buffer.from([len]);
  else {
    const b=[]; let v=len;
    while(v>0){ b.unshift(v&0xff); v>>=8; }
    lenEnc = Buffer.from([0x80|b.length, ...b]);
  }
  return Buffer.concat([Buffer.from([tag]), lenEnc, valueBuf]);
}
function encInt(v){
  v = Number(v)||0;
  let b=[]; let x=v;
  if(x===0) b=[0];
  while(x>0){ b.unshift(x&0xff); x>>=8; }
  if(b[0]&0x80) b.unshift(0);
  return tlv(0x02, Buffer.from(b));
}
function encOctetStr(str){ return tlv(0x04, Buffer.from(str, 'ascii')); }
function encOid(dotted){
  const p = String(dotted).split('.').map(n=>parseInt(n,10)||0);
  const bytes=[40*p[0]+p[1]];
  for(let i=2;i<p.length;i++){
    let v=p[i]; if(v<0) v=0;
    const stack=[v&0x7f]; v>>=7;
    while(v>0){ stack.unshift(0x80|(v&0x7f)); v>>=7; }
    bytes.push(...stack);
  }
  return tlv(0x06, Buffer.from(bytes));
}
const encNull = tl => tl; // util interno
function encVarbind(oid){ return tlv(0x30, Buffer.concat([encOid(oid), Buffer.from([0x05,0x00])])); }

function montarGetV2c(comunidade, reqId, oids){
  const vbList = tlv(0x30, Buffer.concat(oids.map(encVarbind)));
  const pdu = tlv(0xa0, Buffer.concat([encInt(reqId), encInt(0), encInt(0), vbList]));
  return tlv(0x30, Buffer.concat([encInt(1), encOctetStr(comunidade||'public'), pdu]));
}

// ── Parser TLV genérico ────────────────────────────────────────
function readTlv(buf, off){
  const tag = buf[off];
  let len = buf[off+1]; let hLen = 2;
  if(len & 0x80){
    const nb = len & 0x7f;
    len = 0;
    for(let i=0;i<nb;i++) len = (len<<8) | buf[off+2+i];
    hLen = 2+nb;
  }
  return { tag, len, start: off+hLen, end: off+hLen+len };
}
function oidFromBuf(b){
  const p=[Math.floor(b[0]/40), b[0]%40];
  for(let i=1;i<b.length;i++){
    let v=b[i]&0x7f;
    while(b[i]&0x80){ i++; v=(v<<7)|(b[i]&0x7f); }
    p.push(v);
  }
  return p.join('.');
}
function intFromBuf(b){
  let v=0;
  for(let i=0;i<b.length;i++){ v=(v<<8)|b[i]; if(i===0&&(b[i]&0x80)) v=v-(1<<(8*b.length)); }
  return v;
}

// Extrai { oidCodigo: {tag, int?, octets?} } da resposta GetResponse
function extrairVarbinds(buf){
  const saida={};
  try{
    const topo = readTlv(buf,0);
    // pula version + community, acha a PDU A1 (GetResponse)
    let c = readTlv(buf, topo.start);            // INTEGER version
    c = readTlv(buf, c.end);                     // OCTET community
    c = readTlv(buf, c.end);                     // A1
    let inner = readTlv(buf, c.start);           // reqId
    inner = readTlv(buf, inner.end);             // error-status
    inner = readTlv(buf, inner.end);             // error-index
    inner = readTlv(buf, inner.end);             // varbindList SEQ
    let pos = inner.start;
    while(pos < inner.end){
      const vb = readTlv(buf, pos);
      const o = readTlv(buf, vb.start);
      const oid = oidFromBuf(buf.slice(o.start, o.end));
      const val = readTlv(buf, o.end);
      const raw = buf.slice(val.start, val.end);
      const item = { tag: val.tag };
      if(val.tag===0x02 || val.tag===0x41 || val.tag===0x42) item.int = intFromBuf(raw);
      if(val.tag===0x04) item.octets = raw;
      saida['base:'+oid.replace(/^1\.3\.6\.1\.2\.1\./,'')] = item;
      pos = vb.end;
    }
  }catch(e){ /* resposta torta = resposta vazia honesta */ }
  return saida;
}

// ── OIDs que importam pra ele ──────────────────────────────────
const OID_ERRO_BITS   = '1.3.6.1.2.1.25.3.5.1.2';       // hrPrinterDetectedErrorState (OCTET STRING)
const OID_STATUS      = '1.3.6.1.2.1.25.3.5.1.1';       // hrPrinterStatus (1=outro,2=desconhecido,3=ociosa,4=imprimindo,5=aquecendo)
const OID_CONTADOR    = '1.3.6.1.2.1.43.10.2.1.4';      // prtMarkerLifeCount
const OID_TONER_NIVEL = '1.3.6.1.2.1.43.11.1.1.9';      // supplies current
const OID_TONER_MAX   = '1.3.6.1.2.1.43.11.1.1.8';      // supplies max
const OIDS_PADRAO = [OID_ERRO_BITS+'.1', OID_STATUS+'.1', OID_CONTADOR+'.1.1', OID_TONER_NIVEL+'.1.1', OID_TONER_MAX+'.1.1'];

// Bits do primeiro octeto do hrPrinterDetectedErrorState
function traduzirErros(octetos){
  const b = octetos && octetos.length ? octetos[0] : 0;
  const erros=[];
  if(b & 0x80) erros.push('Papel acabando');
  if(b & 0x40) erros.push('SEM PAPEL');
  if(b & 0x20) erros.push('Toner quase no fim');
  if(b & 0x10) erros.push('SEM TONER');
  if(b & 0x08) erros.push('Tampa aberta');
  if(b & 0x04) erros.push('Papel atolado');
  if(b & 0x02) erros.push('Impressora fora de linha (pela própria)');
  if(b & 0x01) erros.push('Pediu assistência');
  return erros;
}

function lerStatusUmaVez(ip, comunidade, timeoutMs){
  return new Promise(resolve=>{
    const dgram = require('dgram');
    const sock = dgram.createSocket('udp4');
    const rid = 1000 + Math.floor(Math.random()*60000);
    const pkt = montarGetV2c(comunidade||'public', rid, OIDS_PADRAO);
    const alvo = { host: ip, port: 161 };
    let feito=false;
    const encerrar=(resp)=>{ if(feito) return; feito=true; try{sock.close();}catch(e){} resolve(resp); };
    const t = setTimeout(()=>encerrar({ ok:false, offline:true, erro:'sem resposta (desligada ou IP diferente)' }), timeoutMs||2500);
    sock.on('message', msg=>{
      clearTimeout(t);
      const vb = extrairVarbinds(msg);
      const by = oid=>vb['base:'+oid]||null;
      const bits = by('25.3.5.1.2.1');    // path sem 1.3.6.1.2.1 = 25.3.5.1.2.1
      const st   = by('25.3.5.1.1.1');
      const cnt  = by('43.10.2.1.4.1.1');
      const tonN = by('43.11.1.1.9.1.1');
      const tonM = by('43.11.1.1.8.1.1');
      const stTxt = st&&st.int!==undefined ? ({1:'outra coisa',2:'desconhecido',3:'ociosa (pronta)',4:'imprimindo',5:'aquecendo'}[st.int]) : '';
      let tonerPct = null;
      if(tonN&&tonM&&tonN.int!==undefined&&tonM.int!==undefined&&tonM.int>0&&tonN.int>=0){
        tonerPct = Math.round((tonN.int/tonM.int)*100);
      }
      encerrar({
        ok:true,
        status: stTxt||'',
        contador: cnt&&cnt.int!==undefined?cnt.int:null,
        tonerPct,
        erros: bits&&bits.octets? traduzirErros(bits.octets):[],
        lidoEm: Date.now()
      });
    });
    sock.on('error', e=>{ clearTimeout(t); encerrar({ ok:false, offline:true, erro:e.message||String(e) }); });
    try{ sock.send(pkt, alvo.port, alvo.host); }catch(e){ clearTimeout(t); encerrar({ ok:false, offline:true, erro:e.message||String(e) }); }
  });
}

module.exports = { montarGetV2c, extrairVarbinds, traduzirErros, lerStatusUmaVez, OIDS_PADRAO, encOid, readTlv, intFromBuf, oidFromBuf };
