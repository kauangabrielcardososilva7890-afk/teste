// Assinatura XML da NF-e (modelo 55) com A1.
// A senha do .pfx entra só nesta função e não é gravada.
const crypto = require('crypto');

function getForge(){
  try{ return require('node-forge'); }
  catch(e){ throw new Error('Biblioteca de certificado não instalada neste .exe.'); }
}

function loadPfx(pfxBuf, password){
  const forge = getForge();
  let p12;
  try{
    const asn1 = forge.asn1.fromDer(Buffer.isBuffer(pfxBuf)?pfxBuf.toString('binary'):String(pfxBuf));
    p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password||'');
  }catch(e){
    throw new Error('Senha do certificado incorreta ou arquivo A1 inválido.');
  }
  const keyBags = [].concat(
    p12.getBags({bagType: forge.pki.oids.pkcs8ShroudedKeyBag})[forge.pki.oids.pkcs8ShroudedKeyBag]||[],
    p12.getBags({bagType: forge.pki.oids.keyBag})[forge.pki.oids.keyBag]||[]
  );
  const certBags = p12.getBags({bagType: forge.pki.oids.certBag})[forge.pki.oids.certBag]||[];
  const keyBag = keyBags.find(b=>b&&b.key);
  if(!keyBag||!certBags.length) throw new Error('Certificado A1 incompleto.');
  const key = keyBag.key;
  let cert = certBags[0].cert;
  for(const bag of certBags){
    if(!bag.cert||!key) continue;
    try{
      if(bag.cert.publicKey.n && key.n && bag.cert.publicKey.n.compareTo(key.n)===0){ cert=bag.cert; break; }
    }catch(_e){}
  }
  return {key, cert};
}

function extractInfNfe(xml){
  const m = String(xml||'').match(/<infNFe\b[^>]*>[\s\S]*<\/infNFe>/);
  if(!m) throw new Error('XML sem infNFe.');
  return m[0];
}

function canonicalInfNfe(inf){
  return String(inf).replace(/^<infNFe\b([^>]*)>/, function(_full, attrs){
    const id=/Id="([^"]+)"/.exec(attrs);
    const ver=/versao="([^"]+)"/.exec(attrs);
    if(!id||!ver) return '<infNFe xmlns="http://www.portalfiscal.inf.br/nfe"'+attrs+'>';
    return '<infNFe xmlns="http://www.portalfiscal.inf.br/nfe" Id="'+id[1]+'" versao="'+ver[1]+'">';
  });
}

function sha1b64(text){
  return crypto.createHash('sha1').update(String(text), 'utf8').digest('base64');
}

function buildSignedInfo(uri, digest){
  return '<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">'+
    '<CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod>'+
    '<SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></SignatureMethod>'+
    '<Reference URI="#'+uri+'">'+
    '<Transforms>'+
    '<Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform>'+
    '<Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></Transform>'+
    '</Transforms>'+
    '<DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></DigestMethod>'+
    '<DigestValue>'+digest+'</DigestValue>'+
    '</Reference></SignedInfo>';
}

function rsaSha1B64(key, data){
  const forge = getForge();
  const md = forge.md.sha1.create();
  md.update(data, 'utf8');
  return forge.util.encode64(key.sign(md));
}

function certDerB64(cert){
  const forge = getForge();
  const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
  return forge.util.encode64(der);
}

function montarAssinatura(signedInfo, signatureValue, x509){
  return '<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">'+
    signedInfo.replace(' xmlns="http://www.w3.org/2000/09/xmldsig#"','')+
    '<SignatureValue>'+signatureValue+'</SignatureValue>'+
    '<KeyInfo><X509Data><X509Certificate>'+x509+'</X509Certificate></X509Data></KeyInfo>'+
    '</Signature>';
}

function inserirAssinatura(xml, signature){
  const src=String(xml||'');
  if(!src.includes('</NFe>')) throw new Error('XML sem NFe.');
  return src.replace('</NFe>', signature+'</NFe>');
}

function assinarNfeXml(xml, pfxBuf, password){
  const {key, cert} = loadPfx(pfxBuf, password);
  const inf = extractInfNfe(xml);
  const idMatch = /Id="(NFe[0-9]{44})"/.exec(inf);
  if(!idMatch) throw new Error('infNFe sem chave.');
  const digest = sha1b64(canonicalInfNfe(inf));
  const signedInfo = buildSignedInfo(idMatch[1], digest);
  const signatureValue = rsaSha1B64(key, signedInfo);
  const signature = montarAssinatura(signedInfo, signatureValue, certDerB64(cert));
  const xmlAssinado = inserirAssinatura(xml, signature);
  return {
    ok:true,
    xmlAssinado,
    digest,
    chave:idMatch[1].slice(3),
    certificado: (cert.subject.getField('CN')&&cert.subject.getField('CN').value)||''
  };
}

module.exports = {
  extractInfNfe, canonicalInfNfe, sha1b64, buildSignedInfo,
  montarAssinatura, inserirAssinatura, assinarNfeXml, loadPfx
};
