// Teste unitário do núcleo puro do pix_patch.js (seção PIX_PURE) — padrão BR Code/EMV do Banco Central
// Uso: node test_pix.js
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/pix_patch.js', 'utf8');
const m = src.match(/\/\* PIX_PURE_START \*\/([\s\S]*?)\/\* PIX_PURE_END \*\//);
if(!m){ console.error('FALHOU: seção PIX_PURE não encontrada'); process.exit(1); }
const PIX_PURE = eval(m[1] + '\n; PIX_PURE;');

let pass = 0, fail = 0;
function eq(nome, got, want){
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if(ok){ pass++; console.log('  ✔', nome); }
  else { fail++; console.error('  ✘', nome, '\n     obtido:', JSON.stringify(got), '\n     esperado:', JSON.stringify(want)); }
}
function ok(nome, cond){ if(cond){ pass++; console.log('  ✔', nome); } else { fail++; console.error('  ✘', nome); } }

console.log('== Vetor oficial do Manual do Banco Central (v2.2.1, pág. 25) ==');
// Exemplo literal do manual do BCB: payload conhecido com CRC 1D3D
{
  const esperado = '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D';
  eq('CRC16 do exemplo do manual = 1D3D', PIX_PURE.crc16(esperado.slice(0, -4)), '1D3D');
  const montado = PIX_PURE.montar({ chave:'123e4567-e12b-12d1-a456-426655440000', nome:'Fulano de Tal', cidade:'BRASILIA' });
  eq('payload montado idêntico ao manual', montado, esperado);
}

console.log('== CRC16 — duas implementações independentes devem concordar ==');
{
  // implementação de referência com tabela (código diferente, mesmo resultado)
  function crc16Ref(str){
    const tab = [];
    for(let n=0;n<256;n++){ let c=n<<8; for(let k=0;k<8;k++){ c = (c & 0x8000) ? ((c<<1)^0x1021) : (c<<1); c &= 0xFFFF; } tab[n]=c; }
    let crc = 0xFFFF;
    for(let i=0;i<str.length;i++) crc = ((crc<<8) ^ tab[((crc>>8) ^ str.charCodeAt(i)) & 0xFF]) & 0xFFFF;
    return crc.toString(16).toUpperCase().padStart(4,'0');
  }
  let iguais = true;
  const casos = ['', 'a', '6304', '00020126360014br.gov.bcb.pix0114+55619888877775204000053039865802BR5910DIGICOPY6007JANAUBA62070503***6304'];
  for(let i=0;i<120;i++){
    let s = ''; const n = 1 + Math.floor(Math.random()*160);
    for(let j=0;j<n;j++) s += String.fromCharCode(32 + Math.floor(Math.random()*95));
    casos.push(s);
  }
  for(const s of casos) if(PIX_PURE.crc16(s) !== crc16Ref(s)) iguais = false;
  ok('150 textos: polinomialbit-a-bit == tabela', iguais);
  eq('CRC sempre 4 hex maiúsculo', /^[0-9A-F]{4}$/.test(PIX_PURE.crc16('qualquer coisa')), true);
}

console.log('== emv (Tag-Length-Value) ==');
{
  eq('tag 00', PIX_PURE.emv('00','01'), '000201');
  eq('comprimento com 2 dígitos', PIX_PURE.emv('54','150.00'), '5406150.00');
  eq('valor vazio', PIX_PURE.emv('02',''), '0200');
}

console.log('== limpar (nome/cidade sem acento, sem símbolo, com teto) ==');
{
  eq('remove acentos', PIX_PURE.limpar('DIGICOPY SOLUÇÕES ÇÃÁÉ', 25), 'DIGICOPY SOLUCOES CAAE');
  eq('teto de 25', PIX_PURE.limpar('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 25).length, 25);
  eq('símbolos viram espaço e colapsam', PIX_PURE.limpar('Loja #1 @Centro!!', 25), 'Loja 1 Centro');
  eq('null vira vazio', PIX_PURE.limpar(null, 25), '');
}

console.log('== txid ==');
{
  eq('vazio vira ***', PIX_PURE.txidLimpo(''), '***');
  eq('mantém letras e números', PIX_PURE.txidLimpo('VD-000123'), 'VD000123');
  eq('corta em 25', PIX_PURE.txidLimpo('X'.repeat(40)).length, 25);
  eq('minúsculas aceitas', PIX_PURE.txidLimpo('abc123'), 'abc123');
}

console.log('== montar — valor exato no QR ==');
{
  const p = PIX_PURE.montar({ chave:'08385589000103', nome:'DIGICOPY', cidade:'JANAUBA', valor:150.00, txid:'VD000123' });
  ok('contém campo 54 com valor', p.includes('5406150.00'));
  ok('contém txid', p.includes('0508VD000123'));
  ok('termina com CRC válido', PIX_PURE.crc16(p.slice(0,-4)) === p.slice(-4));
  const f = PIX_PURE.montar({ chave:'08385589000103', nome:'DIGICOPY', cidade:'JANAUBA', valor:0.5, txid:'T1' });
  ok('valor 0.50 formatado', f.includes('54040.50'));
  const semValor = PIX_PURE.montar({ chave:'08385589000103', nome:'DIGICOPY', cidade:'JANAUBA' });
  ok('valor 0/ausente não gera campo 54', !semValor.includes('540'));
  ok('txid padrão ***', semValor.includes('0503***'));
}

console.log('== montar — validações e fallbacks ==');
{
  let jogou = false;
  try{ PIX_PURE.montar({ chave:'  ' }); }catch(e){ jogou = /Chave/i.test(e.message); }
  ok('chave vazia lança erro claro', jogou);
  const p = PIX_PURE.montar({ chave:'12345678901' });
  ok('sem nome usa RECEBEDOR', p.includes('5909RECEBEDOR'));
  ok('sem cidade usa BRASIL', p.includes('6006BRASIL'));
}

console.log('== montar — ordem dos campos (parser TLV independente) ==');
{
  const p = PIX_PURE.montar({ chave:'email@loja.com.br', nome:'DIGICOPY MG', cidade:'JANAUBA', valor:99.90, txid:'VD999' });
  const tags = [];
  let i = 0, mapa = {};
  while(i + 4 <= p.length){
    const id = p.slice(i, i+2), tam = parseInt(p.slice(i+2, i+4), 10);
    const val = p.slice(i+4, i+4+tam); tags.push(id); mapa[id] = val; i += 4 + tam;
  }
  eq('ordem 00,26,52,53,54,58,59,60,62,63', tags, ['00','26','52','53','54','58','59','60','62','63']);
  eq('tag 00 = 01', mapa['00'], '01');
  eq('tag 52 = 0000', mapa['52'], '0000');
  eq('tag 53 = 986', mapa['53'], '986');
  eq('tag 54 = 99.90', mapa['54'], '99.90');
  eq('tag 58 = BR', mapa['58'], 'BR');
  ok('tag 26 contém GUI e chave', mapa['26'].startsWith('0014br.gov.bcb.pix') && mapa['26'].includes('01' + String('email@loja.com.br'.length) + 'email@loja.com.br'));
  eq('tag 62 = template com txid', mapa['62'], '0505VD999');
  eq('tag 63 é o CRC correto', mapa['63'], PIX_PURE.crc16(p.slice(0, -4)));
  eq('parser consumiu tudo (payload íntegro)', i, p.length);
}

console.log('== tipoChave (rótulo da tela de config) ==');
{
  eq('CPF', PIX_PURE.tipoChave('12345678901'), 'CPF');
  eq('CNPJ', PIX_PURE.tipoChave('08385589000103'), 'CNPJ');
  eq('Telefone', PIX_PURE.tipoChave('+5538999112233'), 'Telefone (+55 DDD número)');
  eq('E-mail', PIX_PURE.tipoChave('contato@digicopy.com.br'), 'E-mail');
  eq('Aleatória', PIX_PURE.tipoChave('123e4567-e12b-12d1-a456-426655440000'), 'Chave aleatória');
  eq('vazia', PIX_PURE.tipoChave(''), '—');
}

console.log('== qrUrl (imagem pela internet) ==');
{
  const u = PIX_PURE.qrUrl('000201ABC D', 220);
  ok('serviço correto', u.startsWith('https://api.qrserver.com/v1/create-qr-code/'));
  ok('payload url-encodado (sem espaço cru)', u.includes('data=000201ABC%20D'));
  ok('tamanho respeitado', u.includes('size=220x220'));
  ok('tamanho limitado', PIX_PURE.qrUrl('X', 10000).includes('size=540x540') && PIX_PURE.qrUrl('X', 10).includes('size=120x120'));
}

console.log('\n══════════════════════════════════');
console.log(`RESULTADO: ${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
