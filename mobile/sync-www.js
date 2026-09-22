// ═══════════════════════════════════════════════════════════════════════════
// SYNC-WWW — prepara a pasta www do app de celular (versão 1.0).
//
// A lista de arquivos NÃO é mais escrita à mão: ela é derivada do próprio
// index.html do sistema. Antes, a lista fixa esquecia os patches carregados
// soltos e o APK saía com 14 scripts dando 404 — ou seja, sem as
// atualizações novas. Agora tudo que o index.html carrega é copiado, e o
// script FALHA se sobrar qualquer referência quebrada.
//
// Não altera a versão do PC.
// ═══════════════════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dest = path.join(__dirname, 'www');
const MOBILE_VER = '1.0';

// Arquivos que o app precisa mesmo sem aparecer como tag no index.html.
const EXTRAS = ['logo.png', 'manifest.webmanifest'];

function rm(p){ if(fs.existsSync(p)) fs.rmSync(p,{recursive:true,force:true}); }
function mkdir(p){ fs.mkdirSync(p,{recursive:true}); }
function copyFile(from, to){
  mkdir(path.dirname(to));
  fs.copyFileSync(from, to);
}
function copyDir(from, to){
  mkdir(to);
  for(const name of fs.readdirSync(from)){
    const a=path.join(from,name), b=path.join(to,name);
    if(fs.statSync(a).isDirectory()) copyDir(a,b);
    else copyFile(a,b);
  }
}
function refsLocais(html){
  const out=[];
  const re=/(?:src|href)="\.\/([A-Za-z0-9_.\-/]+?)(?:\?[^"]*)?"/g;
  let m;
  while((m=re.exec(html))!==null) if(out.indexOf(m[1])<0) out.push(m[1]);
  return out;
}

const htmlOrigem = fs.readFileSync(path.join(root,'index.html'),'utf8');

// ── O que copiar: tudo que o index.html do sistema realmente carrega ────────
const necessarios = refsLocais(htmlOrigem).concat(EXTRAS)
  .filter((f,i,a)=>a.indexOf(f)===i);

const inexistentes = necessarios.filter(f => !fs.existsSync(path.join(root,f)));
if(inexistentes.length){
  console.error('✘ index.html aponta para arquivos que não existem:\n  '+inexistentes.join('\n  '));
  process.exit(1);
}

rm(dest);
mkdir(dest);

let copiados = 0;
for(const f of necessarios){
  if(f.startsWith('assets/')) continue; // tratado em bloco abaixo
  copyFile(path.join(root,f), path.join(dest,f));
  copiados++;
}
copyDir(path.join(root,'assets','vendor'), path.join(dest,'assets','vendor'));

// ── index.html do celular ───────────────────────────────────────────────────
let html = htmlOrigem.replace(
  /<script src="\.\/app\.bundle\.js\?v=[^"]+"><\/script>/,
  '<script>window.DIGICOPY_APP_CANAL="celular";window.DIGICOPY_APP_VER="'+MOBILE_VER+'";</script>\n<script src="./app.bundle.js?v='+MOBILE_VER+'"></script>'
);
html = html.replace('Sistema Digicopy</span>','Sistema Digicopy '+MOBILE_VER+'</span>');
html = html.replace('Sistema Digicopy</div>','Sistema Digicopy '+MOBILE_VER+'</div>');
fs.writeFileSync(path.join(dest,'index.html'), html);

const man = JSON.parse(fs.readFileSync(path.join(dest,'manifest.webmanifest'),'utf8'));
man.start_url = './index.html?v='+MOBILE_VER;
man.short_name = 'Digicopy';
fs.writeFileSync(path.join(dest,'manifest.webmanifest'), JSON.stringify(man,null,2));

// ── Conferência final: nenhuma referência pode ficar quebrada no APK ────────
const quebradas = refsLocais(html).filter(f => !fs.existsSync(path.join(dest,f)));
if(quebradas.length){
  console.error('✘ o APK sairia com arquivos faltando:\n  '+quebradas.join('\n  '));
  process.exit(1);
}

console.log('www do celular '+MOBILE_VER+' pronto: '+copiados+' arquivos + assets/vendor, 0 referências quebradas');
