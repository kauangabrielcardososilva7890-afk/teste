// Copia o sistema pronto para o app do celular (versão 1.0).
// Não altera a versão do PC.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dest = path.join(__dirname, 'www');
const MOBILE_VER = '1.0';

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

rm(dest);
mkdir(dest);

[
  'app.bundle.js',
  'logo.png',
  'logo_2.png',
  'manifest.webmanifest'
].forEach(f=>copyFile(path.join(root,f), path.join(dest,f)));

copyDir(path.join(root,'assets','vendor'), path.join(dest,'assets','vendor'));

let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace(
  /<script src="\.\/app\.bundle\.js\?v=[^"]+"><\/script>/,
  '<script>window.DIGICOPY_APP_CANAL="celular";window.DIGICOPY_APP_VER="'+MOBILE_VER+'";</script>\n<script src="./app.bundle.js?v='+MOBILE_VER+'"></script>'
);
html=html.replace('Sistema Digicopy</span>','Sistema Digicopy '+MOBILE_VER+'</span>');
html=html.replace('Sistema Digicopy</div>','Sistema Digicopy '+MOBILE_VER+'</div>');
fs.writeFileSync(path.join(dest,'index.html'), html);

const man=JSON.parse(fs.readFileSync(path.join(dest,'manifest.webmanifest'),'utf8'));
man.start_url='./index.html?v='+MOBILE_VER;
man.short_name='Digicopy';
fs.writeFileSync(path.join(dest,'manifest.webmanifest'), JSON.stringify(man,null,2));

console.log('www do celular 1.0 pronto');
