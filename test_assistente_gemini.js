const fs=require('fs');
function ok(name, cond){ if(!cond){ console.error('  ✘ '+name); process.exit(1); } console.log('  ✔ '+name); }
const main=fs.readFileSync('main.js','utf8');
const patch=fs.readFileSync('ajustes_pos_final_patch.js','utf8');
console.log('== ASSISTENTE_GEMINI ==');
ok('main usa endpoint Gemini', main.includes('generativelanguage.googleapis.com') && main.includes('gemini-1.5-flash'));
ok('main não usa OpenAI', !main.includes('api.openai.com') && !main.includes('gpt-4o'));
ok('interface fala Gemini', patch.includes('chave API do Gemini') && patch.includes('geminiApiKey'));
ok('não salva chave Gemini em localStorage', !patch.includes("localStorage.setItem('digicopy_gemini_api_key'") && patch.includes('a chave não fica mais salva localmente'));
ok('interface não fala OpenAI/GPT', !/OpenAI|gpt-4o|ChatGPT/.test(patch));
console.log('\nRESULTADO: Testes do assistente Gemini passaram!');
