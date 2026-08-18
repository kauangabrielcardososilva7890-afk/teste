const fs=require('fs');
const forge=require('node-forge');
const S=require('./nfe_assinatura.js');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}

function fazerPfxTeste(senha){
  const keys=forge.pki.rsa.generateKeyPair(1024);
  const cert=forge.pki.createCertificate();
  cert.publicKey=keys.publicKey;
  cert.serialNumber='01';
  cert.validity.notBefore=new Date();
  cert.validity.notAfter=new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear()+1);
  const attrs=[{name:'commonName',value:'DIGICOPY TESTE'}];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  const p12=forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], senha, {algorithm:'3des'});
  return Buffer.from(forge.asn1.toDer(p12).getBytes(), 'binary');
}

const xml=fs.readFileSync('ajustes_v5228_nfe_assinatura_patch.js','utf8');
const main=fs.readFileSync('main.js','utf8');
const preload=fs.readFileSync('preload.js','utf8');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
console.log('== NF-E ASSINATURA A1 ==');
ok('não grava senha',!/localStorage|saveDB|escolaAuth/.test(xml)&&!/writeFileSync\([^)]*senha/.test(main));
ok('IPC assina sem persistir senha',/nfe:sign-xml/.test(main)&&!/nfe-a1-senha/.test(main));
ok('preload expõe assinar',/assinar:\s*\(xml,\s*senha\)/.test(preload));
ok('não envia SEFAZ',!/NFeAutorizacao4|hnfe\.fazenda/.test(xml)&&!/NFeAutorizacao4/.test(main));
ok('botão só depois da conferência ok',/Assinar com A1/.test(xml)&&/__nfeUltimoDoc/.test(xml));
ok('patch no bundle',manifest.includes('ajustes_v5228_nfe_assinatura_patch.js'));

const inf='<infNFe versao="4.00" Id="NFe'+('1'.repeat(44))+'"><ide></ide></infNFe>';
ok('C14N coloca xmlns e Id antes de versao',S.canonicalInfNfe(inf).startsWith('<infNFe xmlns="http://www.portalfiscal.inf.br/nfe" Id="NFe'));

const senha='teste-local';
const pfx=fazerPfxTeste(senha);
const nfe='<?xml version="1.0" encoding="UTF-8"?><NFe xmlns="http://www.portalfiscal.inf.br/nfe">'+inf+'</NFe>';
let falhou=false;
try{ S.assinarNfeXml(nfe, pfx, 'errada'); }catch(e){ falhou=/Senha|inválido|invalido/i.test(e.message); }
ok('senha errada não assina',falhou);
const r=S.assinarNfeXml(nfe, pfx, senha);
ok('assina XML de teste',r.ok&&r.xmlAssinado.includes('<Signature')&&r.xmlAssinado.includes('</NFe>'));
ok('não devolve a senha',!JSON.stringify(r).includes(senha));
console.log('\nRESULTADO: assinatura A1 passou!');
