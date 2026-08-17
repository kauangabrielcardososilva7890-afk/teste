const fs=require('fs');
const crypto=require('crypto');
const manifest=JSON.parse(fs.readFileSync('bundle-manifest.json','utf8'));
const missing=manifest.filter(file=>!fs.existsSync(file));
if(missing.length)throw new Error('Arquivos ausentes no bundle: '+missing.join(', '));
const body=manifest.map(file=>`\n/* ===== ${file} ===== */\n${fs.readFileSync(file,'utf8')}\n;\n`).join('');
const hash=crypto.createHash('sha256').update(body).digest('hex').slice(0,16);
const output=`/* DIGICOPY APP BUNDLE — gerado; não editar diretamente\n * scripts: ${manifest.length} | sha256: ${hash}\n */\n${body}`;
if(process.argv.includes('--check')){
  if(!fs.existsSync('app.bundle.js')||fs.readFileSync('app.bundle.js','utf8')!==output){
    console.error('app.bundle.js está desatualizado. Execute: npm run bundle');process.exit(1);
  }
  console.log(`Bundle OK: ${manifest.length} scripts, sha256 ${hash}`);
}else{
  fs.writeFileSync('app.bundle.js',output);
  console.log(`Bundle gerado: ${manifest.length} scripts, sha256 ${hash}`);
}
