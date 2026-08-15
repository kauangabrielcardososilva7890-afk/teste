const fs = require('fs');

function ok(name, cond){
  if(!cond){ console.error('  ✘ ' + name); process.exit(1); }
  console.log('  ✔ ' + name);
}

const code = fs.readFileSync('ajustes_v5192_patch.js', 'utf8');

// Mock de DOM que cria elementos sob demanda (getElementById retorna null se não existir)
function makeDom(fields){
  const map = {};
  Object.keys(fields).forEach(id => { map[id] = { value: fields[id], checked: false }; });
  const doc = {
    getElementById: (id) => map[id] || null,
    createElement: () => ({ id: '', type: '', style: {}, value: '', checked: false }),
    body: {
      appendChild: (el) => { map[el.id] = el; }
    }
  };
  return { doc, map };
}

// Caso 1: formulário ko-desc preenchido, salvar lê kr-os-desc (não existe)
{
  const { doc, map } = makeDom({ 'ko-desc': 'Problema na impressora', 'ko-cont-atu': '5200' });
  const win = { salvarChamadoCompleto: function(){ win.__salvou = true; }, salvarChamadoAvulso: function(){} };
  new Function('window', 'document', code)(win, doc);
  win.salvarChamadoCompleto();
  console.log('== AJUSTES_V5192: sincroniza motivo entre os campos ==');
  ok('salvar foi chamado', win.__salvou === true);
  ok('motivo digitado em ko-desc foi copiado para kr-os-desc', map['kr-os-desc'] && map['kr-os-desc'].value === 'Problema na impressora');
  ok('contador copiado para kr-os-cont-atu', map['kr-os-cont-atu'] && map['kr-os-cont-atu'].value === '5200');
}

// Caso 2: avulso com ca-desc
{
  const { doc, map } = makeDom({ 'ca-desc': 'Atendimento avulso' });
  const win = { salvarChamadoAvulso: function(){ win.__salvou = true; } };
  new Function('window', 'document', code)(win, doc);
  win.salvarChamadoAvulso();
  ok('avulso: motivo copiado para kr-os-desc', map['kr-os-desc'] && map['kr-os-desc'].value === 'Atendimento avulso');
}

// Caso 3: nada digitado → não cria campo (salvar deve reclamar corretamente)
{
  const { doc, map } = makeDom({});
  const win = { salvarChamadoCompleto: function(){ win.__salvou = true; } };
  new Function('window', 'document', code)(win, doc);
  win.salvarChamadoCompleto();
  ok('sem digitação, kr-os-desc continua sem existir', map['kr-os-desc'] === undefined);
}

console.log('\nRESULTADO: Testes do ajustes_v5192 passaram!');
