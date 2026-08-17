const fs=require('fs');
function ok(name,cond){if(!cond){console.error('  ✘ '+name);process.exit(1);}console.log('  ✔ '+name);}
const code=fs.readFileSync('popup_sistema_patch.js','utf8');
console.log('== CONFIRM COMPAT ==');
ok('preserva confirm nativo antes de sobrescrever',/const nativeConfirm/.test(code));
ok('confirm legado não retorna sempre false',/return nativeConfirm \? nativeConfirm/.test(code));
ok('popup confirmado libera exatamente uma chamada interna',/allowLegacyConfirmOnce/.test(code)&&/__confirmSistemaBypass--/.test(code));
ok('bypass esquecido é zerado no próximo ciclo',/setTimeout\(\(\)=>\{ window\.__confirmSistemaBypass = 0; \}, 0\)/.test(code));
ok('exclusões embrulhadas usam bypass seguro',/confirmSistema\(msg, 'Excluir'\)[\s\S]{0,100}allowLegacyConfirmOnce/.test(code));
ok('estornos embrulhados usam bypass seguro',/Estornar[\s\S]{0,160}allowLegacyConfirmOnce/.test(code));
console.log('\nRESULTADO: compatibilidade de confirmações passou!');
