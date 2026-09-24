// ═══════════════════════════════════════════════════════════════════════════
// novo/listas.js — v1.0.0 (rodada 21: TODOS OS MENUS no núcleo novo)
//
// O que é: a ficha de cada tela do sistema de hoje — o que ela mostra, quais
// campos ela usa e a qual menu ela pertence. Nada aqui inventa nome de campo:
// cada lista foi copiada do sistema que está rodando, e a origem está anotada
// em cada bloco (arquivo:linha), para quem for conferir depois.
//
// Por que um arquivo separado: as telas de cadastro são todas a MESMA ideia
// (buscar, listar, criar, editar, excluir com motivo, lixeira e restaurar). Em
// vez de escrever 15 telas iguais, escreve-se UMA (novo/telas.js) e aqui só
// entra a FICHA de cada uma — o mesmo caminho que o sistema de hoje já usa
// (`renderClientes`, `renderProdutos`… todos com a mesma casca).
//
// REGRAS QUE ESTE ARQUIVO RESPEITA:
//   • campo que existe hoje continua com o MESMO nome (`parqueId`, `contadorPB`,
//     `franquiaPB`…) — é o que faz a importação da base casar com o coração novo;
//   • lista que é registro de histórico (auditoria) ou catálogo de apoio
//     (NCM) entra como SOMENTE LEITURA: aparece, busca e mostra, mas não deixa
//     inventar registro por ali;
//   • o que depende de motor que ainda não foi migrado (emissão de NF, navegador
//     embutido, etiquetas…) está na lista TELAS como `depende`, com o motivo
//     escrito — a tela abre e explica, não finge.
// ═══════════════════════════════════════════════════════════════════════════
(function (raiz) {
  'use strict';

  var VERSAO = '1.0.0';

  function texto(v) { return v == null ? '' : String(v); }
  function baixo(v) { return texto(v).trim().toLowerCase(); }

  // ── OS MENUS (iguais aos do sistema de hoje) ──────────────────────────────
  // Cada grupo é um botão do menu de cima; cada lista abaixo diz a que grupo
  // pertence, e é assim que a tela sabe quais abas mostrar.
  var GRUPOS = [
    { id: 'inicio', rotulo: 'Início' },
    { id: 'cadastros', rotulo: 'Cadastros' },
    { id: 'atendimento', rotulo: 'Atendimento' },
    { id: 'locacao', rotulo: 'Locação' },
    { id: 'fiscal', rotulo: 'Fiscal' },
    { id: 'financeiro', rotulo: 'Financeiro' },
    { id: 'escola', rotulo: 'Buscador Escola' },
    { id: 'config', rotulo: 'Configurações' }
  ];

  // ── AS LISTAS DE CADASTRO (campo por campo, da fonte de hoje) ─────────────
  var LISTAS = {

    // Cadastros → Clientes
    // Fonte: clientes_patch.js (obrigatórios: nome, telefone, rua, número, bairro)
    //        + app.js:renderModalCliente (tipo, documento, cidade, estado, cep, status)
    clientes: {
      grupo: 'cadastros', rotulo: 'Clientes', singular: 'cliente',
      dica: 'Digite nome, código, CPF/CNPJ ou telefone',
      codigoSerie: 'cliente',   // o código do cliente sai da série (clientes_patch.js:300)
      colunas: [
        { campo: 'codigo', titulo: 'Código' }, { campo: 'nome', titulo: 'Nome' },
        { campo: 'documento', titulo: 'CPF/CNPJ' }, { campo: 'telefone', titulo: 'Telefone' },
        { campo: 'cidade', titulo: 'Cidade' }
      ],
      campos: [
        { campo: 'codigo', rotulo: 'Código (automático)', somenteLeitura: true },
        { campo: 'nome', rotulo: 'Nome / Razão social', obrigatorio: true, largo: true },
        { campo: 'fantasia', rotulo: 'Nome fantasia' },
        { campo: 'tipo', rotulo: 'Tipo', opcoes: ['PF', 'PJ'] },
        { campo: 'documento', rotulo: 'CPF / CNPJ' },
        { campo: 'rgIE', rotulo: 'RG / IE' },
        { campo: 'indIE', rotulo: 'Indicador da IE', opcoes: ['1', '2', '9'] },
        { campo: 'telefone', rotulo: 'Telefone' },
        { campo: 'whatsapp', rotulo: 'WhatsApp' },
        { campo: 'contato', rotulo: 'Pessoa de contato' },
        { campo: 'site', rotulo: 'Site' },
        { campo: 'email', rotulo: 'E-mail' },
        { campo: 'rua', rotulo: 'Rua / logradouro', largo: true },
        { campo: 'numero', rotulo: 'Número' },
        { campo: 'complemento', rotulo: 'Complemento' },
        { campo: 'bairro', rotulo: 'Bairro' },
        { campo: 'referencia', rotulo: 'Ponto de referência' },
        { campo: 'cidade', rotulo: 'Cidade' },
        { campo: 'estado', rotulo: 'UF', largo: false },
        { campo: 'cep', rotulo: 'CEP' },
        { campo: 'consumidorFinal', rotulo: 'Consumidor final', opcoes: ['1', '0'] },
        { campo: 'governamental', rotulo: 'Governamental', opcoes: ['0', '1', '2', '3', '4'] },
        { campo: 'status', rotulo: 'Status', opcoes: ['ativo', 'inativo'] },
        { campo: 'observacao', rotulo: 'Observação', largo: true }
      ],
      schema: {
        codigo: { tipo: 'texto' }, nome: { obrigatorio: true, tipo: 'texto' }, fantasia: { tipo: 'texto' },
        tipo: { tipo: 'texto' }, documento: { tipo: 'texto' }, rgIE: { tipo: 'texto' },
        telefone: { tipo: 'texto' }, whatsapp: { tipo: 'texto' }, email: { tipo: 'texto' },
        rua: { tipo: 'texto' }, numero: { tipo: 'texto' }, bairro: { tipo: 'texto' },
        cidade: { tipo: 'texto' }, estado: { tipo: 'texto' }, cep: { tipo: 'texto' },
        complemento: { tipo: 'texto' }, referencia: { tipo: 'texto' }, contato: { tipo: 'texto' },
        site: { tipo: 'texto' }, indIE: { tipo: 'texto' },
        consumidorFinal: { tipo: 'texto' }, governamental: { tipo: 'texto' },
        endereco: { tipo: 'texto' },
        status: { tipo: 'texto' }, observacao: { tipo: 'texto' }
      },
      calculados: ['endereco'],
      // Aviso honesto: o cadastro de hoje cobra telefone, rua, número e bairro
      // (clientes_patch.js). Aqui só o NOME é obrigatório — quem decide o resto é o dono
      // na virada; a base antiga entra inteira de qualquer jeito (a importação não recusa).
      nota: 'No sistema de hoje o cadastro cobra telefone, rua, número e bairro. Aqui só o nome é obrigatório — me diga na virada se quer os outros também.'
    },

    // Cadastros → Produtos e serviços
    // Fonte: app.js:renderModalProduto (codigo, categoria, nome, fabricante,
    //        estoque, mínimo, custo, preço) + sku + estoqueInfinito (venda)
    produtos: {
      grupo: 'cadastros', rotulo: 'Produtos e serviços', singular: 'produto',
      dica: 'Digite a descrição, o código de barras ou a categoria',
      colunas: [
        { campo: 'nome', titulo: 'Nome' }, { campo: 'categoria', titulo: 'Categoria' },
        { campo: 'preco', titulo: 'Preço', moeda: true }, { campo: 'estoque', titulo: 'Estoque' }
      ],
      campos: [
        { campo: 'nome', rotulo: 'Nome', obrigatorio: true, largo: true },
        // as categorias são as MESMAS do sistema de hoje (novo/selecao.js: CATS_PRODUTO,
        // copiadas da caixa de seleção viva) — categoria nova entra lá e aqui
        { campo: 'categoria', rotulo: 'Categoria', opcoes: ['Produto', 'Serviço', 'Cartucho', 'Cartucho Vazio',
          'Insumo', 'Equipamento', 'Impressoras', 'Chip', 'Compatível', 'Informática', 'Original', 'Outros'] },
        { campo: 'fabricante', rotulo: 'Fabricante' },
        { campo: 'sku', rotulo: 'Código / código de barras' },
        { campo: 'custo', rotulo: 'Custo R$', tipo: 'numero' },
        { campo: 'preco', rotulo: 'Preço de venda R$', tipo: 'numero' },
        { campo: 'estoque', rotulo: 'Estoque', tipo: 'numero' },
        { campo: 'estoqueMin', rotulo: 'Estoque mínimo', tipo: 'numero' },
        { campo: 'estoqueInfinito', rotulo: 'Estoque infinito (serviço)', tipo: 'boleano' },
        { campo: 'ncm', rotulo: 'NCM (fiscal)' }
      ],
      nota: 'Estoque infinito é para serviço: não baixa nem avisa estoque baixo. A NCM daqui é a que sai na nota.',
      schema: {
        nome: { obrigatorio: true, tipo: 'texto' }, categoria: { tipo: 'texto' },
        fabricante: { tipo: 'texto' }, sku: { tipo: 'texto' },
        custo: { tipo: 'numero' }, preco: { tipo: 'numero' }, estoque: { tipo: 'numero' },
        estoqueMin: { tipo: 'numero' }, estoqueInfinito: { tipo: 'boleano' }, ncm: { tipo: 'texto' }
      }
    },

    // Cadastros → Recargas
    // Fonte: ajustes_v52214_recargas_patch.js:138 (Código, Descrição *, Marca,
    //        Valor venda) — "sem estoque, sempre disponível na venda Recarga"
    recargas: {
      grupo: 'cadastros', rotulo: 'Recargas de toner', singular: 'recarga',
      dica: 'Digite a descrição ou a marca',
      colunas: [
        { campo: 'codigo', titulo: 'Código' }, { campo: 'nome', titulo: 'Descrição' },
        { campo: 'marca', titulo: 'Marca' }, { campo: 'preco', titulo: 'Valor venda', moeda: true }
      ],
      campos: [
        { campo: 'codigo', rotulo: 'Código' },
        { campo: 'nome', rotulo: 'Descrição', obrigatorio: true, largo: true },
        { campo: 'marca', rotulo: 'Marca' },
        { campo: 'preco', rotulo: 'Valor venda R$', tipo: 'numero' }
      ],
      schema: {
        codigo: { tipo: 'texto' }, nome: { obrigatorio: true, tipo: 'texto' },
        marca: { tipo: 'texto' }, preco: { tipo: 'numero' }
      }
    },

    // Locação → Impressoras / Máquinas
    // Fonte: app.js:renderModalEquipamento (fabricante, modelo, tipo, status,
    //        patrimônio, série, contador PB, contador Cor)
    equipamentos: {
      grupo: 'locacao', rotulo: 'Impressoras / Máquinas', singular: 'máquina',
      dica: 'Digite modelo, patrimônio, série ou fabricante',
      colunas: [
        { campo: 'modelo', titulo: 'Modelo' }, { campo: 'fabricante', titulo: 'Fabricante' },
        { campo: 'patrimonio', titulo: 'Patrimônio' }, { campo: 'serie', titulo: 'Série' },
        { campo: 'contadorPB', titulo: 'Contador PB' }, { campo: 'status', titulo: 'Status' }
      ],
      campos: [
        { campo: 'modelo', rotulo: 'Modelo', obrigatorio: true },
        { campo: 'fabricante', rotulo: 'Fabricante' },
        { campo: 'tipo', rotulo: 'Tipo', opcoes: ['Laser Mono A4', 'Laser Color A4', 'Laser Mono A3', 'Laser Color A3', 'Jato Color'] },
        { campo: 'status', rotulo: 'Status', opcoes: ['disponivel', 'locado', 'manutencao', 'inativo'] },
        { campo: 'patrimonio', rotulo: 'Patrimônio' },
        { campo: 'serie', rotulo: 'Número de série' },
        { campo: 'contadorPB', rotulo: 'Contador PB', tipo: 'numero' },
        { campo: 'contadorCor', rotulo: 'Contador Cor', tipo: 'numero' },
        { campo: 'valorCompra', rotulo: 'Valor de compra R$', tipo: 'numero' },
        { campo: 'dataAquisicao', rotulo: 'Data de aquisição', tipo: 'data' }
      ],
      schema: {
        modelo: { obrigatorio: true, tipo: 'texto' }, fabricante: { tipo: 'texto' },
        tipo: { tipo: 'texto' }, status: { tipo: 'texto' }, patrimonio: { tipo: 'texto' },
        serie: { tipo: 'texto' }, contadorPB: { tipo: 'numero' }, contadorCor: { tipo: 'numero' },
        valorCompra: { tipo: 'numero' }, dataAquisicao: { tipo: 'texto' }
      }
    },

    // Locação → Contratos
    // Fonte: app.js:renderModalContrato (número, cliente, início, fim, dia venc,
    //        franquia PB, franquia Cor, valor mensal, equipamentos)
    //        + valores de excedente usados na leitura (app.js:saveLeituraRapida)
    contratos: {
      grupo: 'locacao', rotulo: 'Contratos', singular: 'contrato',
      dica: 'Digite o número do contrato ou o nome do cliente',
      // o que o SISTEMA preenche (a tela não pergunta): nome do cliente, valor da franquia
      // e a lista de máquinas do contrato (o valor mensal sai da soma das máquinas)
      calculados: ['clienteNome', 'valorFranquia', 'equipamentos'],
      colunas: [
        { campo: 'numero', titulo: 'Número' },
        { campo: 'clienteId', titulo: 'Cliente', composto: 'cliente' },
        { campo: 'valorMensalFixo', titulo: 'Valor mensal', moeda: true },
        { campo: 'diaVencimento', titulo: 'Dia venc.' }, { campo: 'status', titulo: 'Status' }
      ],
      campos: [
        { campo: 'numero', rotulo: 'Número', obrigatorio: true },
        { campo: 'clienteId', rotulo: 'Cliente', opcoesDe: 'clientes', obrigatorio: true },
        { campo: 'dataInicio', rotulo: 'Início', tipo: 'data' },
        { campo: 'dataFim', rotulo: 'Fim', tipo: 'data' },
        { campo: 'diaVencimento', rotulo: 'Dia do vencimento', tipo: 'numero' },
        { campo: 'franquiaPB', rotulo: 'Franquia PB (páginas)', tipo: 'numero' },
        { campo: 'franquiaCor', rotulo: 'Franquia Cor (páginas)', tipo: 'numero' },
        { campo: 'valorExcedentePB', rotulo: 'Excedente PB R$ (por página)', tipo: 'numero' },
        { campo: 'valorExcedenteCor', rotulo: 'Excedente Cor R$ (por página)', tipo: 'numero' },
        { campo: 'valorMensalFixo', rotulo: 'Valor mensal R$', tipo: 'numero' },
        { campo: 'status', rotulo: 'Status', opcoes: ['ativo', 'pendente', 'vencido', 'encerrado'] },
        { campo: 'observacoes', rotulo: 'Observações', largo: true }
      ],
      schema: {
        numero: { obrigatorio: true, tipo: 'texto' }, clienteId: { obrigatorio: true, tipo: 'texto' },
        clienteNome: { tipo: 'texto' }, dataInicio: { tipo: 'texto' }, dataFim: { tipo: 'texto' },
        diaVencimento: { tipo: 'numero' }, franquiaPB: { tipo: 'numero' }, franquiaCor: { tipo: 'numero' },
        valorExcedentePB: { tipo: 'numero' }, valorExcedenteCor: { tipo: 'numero' },
        valorMensalFixo: { tipo: 'numero' }, valorFranquia: { tipo: 'numero' },
        status: { tipo: 'texto' }, observacoes: { tipo: 'texto' }, equipamentos: { tipo: 'lista' }
      },
      // o nome do cliente e o número padrão do contrato saem aqui (é o CT-ano-0001 de hoje)
      preparar: function (dados, ctx) {
        if (dados.clienteId) {
          var cli = ctx.achar('clientes', dados.clienteId);
          if (cli) dados.clienteNome = cli.nome || '';
        }
        if (!texto(dados.numero).trim()) {
          dados.numero = 'CT-' + new Date().getFullYear() + '-' +
            ctx.proximoNumero('contrato', 'numero');
        }
        return dados;
      }
    },

    // Locação → Máquinas nos clientes (o "parque")
    // Fonte: app.js:renderParque e app.js:saveLeituraRapida (parqueId, setor,
    //        contadorInicial PB/Cor ligam a máquina ao contrato do cliente)
    parque: {
      grupo: 'locacao', rotulo: 'Máquinas nos clientes', singular: 'máquina alocada',
      dica: 'Digite o cliente, o setor ou o modelo da máquina',
      // o SISTEMA preenche: nome do cliente, modelo/patrimônio da máquina, a data de
      // instalação e a configuração de medidores (as modalidades de cobrança por medidor)
      calculados: ['clienteNome', 'equipamentoModelo', 'patrimonio', 'dataInstalacao', 'medidoresConfig'],
      colunas: [
        { campo: 'clienteId', titulo: 'Cliente', composto: 'cliente' },
        { campo: 'equipamentoId', titulo: 'Máquina', composto: 'equipamento' },
        { campo: 'setor', titulo: 'Setor' }, { campo: 'contadorInicialPB', titulo: 'PB inicial' },
        { campo: 'status', titulo: 'Status' }
      ],
      campos: [
        { campo: 'clienteId', rotulo: 'Cliente', opcoesDe: 'clientes', obrigatorio: true },
        { campo: 'contratoId', rotulo: 'Contrato', opcoesDe: 'contratos' },
        { campo: 'equipamentoId', rotulo: 'Máquina', opcoesDe: 'equipamentos', obrigatorio: true },
        { campo: 'setor', rotulo: 'Setor onde está' },
        { campo: 'localInstalacao', rotulo: 'Local de instalação', largo: true },
        { campo: 'status', rotulo: 'Status', opcoes: ['ativo', 'inativo'] },
        { campo: 'contadorInicialPB', rotulo: 'Contador inicial PB', tipo: 'numero' },
        { campo: 'contadorInicialCor', rotulo: 'Contador inicial Cor', tipo: 'numero' }
      ],
      schema: {
        clienteId: { obrigatorio: true, tipo: 'texto' }, clienteNome: { tipo: 'texto' },
        contratoId: { tipo: 'texto' }, equipamentoId: { obrigatorio: true, tipo: 'texto' },
        equipamentoModelo: { tipo: 'texto' }, setor: { tipo: 'texto' },
        localInstalacao: { tipo: 'texto' }, dataInstalacao: { tipo: 'texto' },
        patrimonio: { tipo: 'texto' }, status: { tipo: 'texto' },
        contadorInicialPB: { tipo: 'numero' }, contadorInicialCor: { tipo: 'numero' },
        medidoresConfig: { tipo: 'objeto' }
      },
      // preenche o nome do cliente e o modelo da máquina (a tela de hoje mostra os dois)
      preparar: function (dados, ctx) {
        var cli = dados.clienteId ? ctx.achar('clientes', dados.clienteId) : null;
        var eq = dados.equipamentoId ? ctx.achar('equipamentos', dados.equipamentoId) : null;
        if (cli) dados.clienteNome = cli.nome || '';
        if (eq) { dados.equipamentoModelo = eq.modelo || ''; dados.patrimonio = eq.patrimonio || ''; }
        if (!texto(dados.dataInstalacao).trim()) dados.dataInstalacao = new Date().toISOString();
        return dados;
      }
    },

    // Locação → Leituras — os números do contador são digitados aqui; consumo e
    // excedente saem da regra de hoje (`novo/leituras.js`, cópia de saveLeituraRapida)
    leituras: {
      grupo: 'locacao', rotulo: 'Leituras', singular: 'leitura',
      dica: 'Digite o cliente, o setor ou a data',
      // o SISTEMA calcula: consumo, excedente, o "anterior", se fatura, o número da
      // leitura e os vínculos (máquina/contrato/cliente) que vêm do parque escolhido
      calculados: ['numero', 'equipamentoId', 'contratoId', 'clienteId', 'clienteNome',
        'contadorPBAnterior', 'contadorCorAnterior', 'consumoPB', 'consumoCor', 'valorExcedente', 'faturar'],
      colunas: [
        { campo: 'clienteId', titulo: 'Cliente', composto: 'cliente' },
        { campo: 'dataLeitura', titulo: 'Data', dataCurta: true },
        { campo: 'contadorPB', titulo: 'PB' }, { campo: 'contadorCor', titulo: 'Cor' },
        { campo: 'consumoPB', titulo: 'Consumo PB' }, { campo: 'valorExcedente', titulo: 'Excedente', moeda: true },
        { campo: 'status', titulo: 'Status' }
      ],
      campos: [
        { campo: 'parqueId', rotulo: 'Máquina do cliente (parque)', opcoesDe: 'parque', obrigatorio: true, largo: true },
        { campo: 'dataLeitura', rotulo: 'Data da leitura', tipo: 'datahora' },
        { campo: 'contadorPB', rotulo: 'Contador PB (agora)', tipo: 'numero' },
        { campo: 'contadorCor', rotulo: 'Contador Cor (agora)', tipo: 'numero' },
        { campo: 'status', rotulo: 'Status', opcoes: ['pendente', 'divergencia', 'faturada'] }
      ],
      schema: {
        parqueId: { obrigatorio: true, tipo: 'texto' }, equipamentoId: { tipo: 'texto' },
        contratoId: { tipo: 'texto' }, clienteId: { tipo: 'texto' }, clienteNome: { tipo: 'texto' },
        numero: { tipo: 'texto' },
        dataLeitura: { tipo: 'texto' }, contadorPB: { tipo: 'numero' }, contadorCor: { tipo: 'numero' },
        contadorPBAnterior: { tipo: 'numero' }, contadorCorAnterior: { tipo: 'numero' },
        consumoPB: { tipo: 'numero' }, consumoCor: { tipo: 'numero' },
        valorExcedente: { tipo: 'numero' }, faturar: { tipo: 'boleano' }, status: { tipo: 'texto' }
      },
      // A CONTA da leitura (consumo, excedente e divergência) mora em `novo/leituras.js`,
      // copiada do `saveLeituraRapida` de hoje. O contador da máquina também sobe
      // (é o `Math.max` de hoje: uma leitura nunca faz o contador andar para trás).
      preparar: function (dados, ctx) {
        var L = raiz.DIGICOPY_LEITURAS && raiz.DIGICOPY_LEITURAS.regras;
        var parque = dados.parqueId ? ctx.achar('parque', dados.parqueId) : null;
        if (!parque) return dados;
        var contrato = parque.contratoId ? ctx.achar('contratos', parque.contratoId) : null;
        var cliente = parque.clienteId ? ctx.achar('clientes', parque.clienteId) : null;
        if (!texto(dados.numero).trim()) dados.numero = ctx.proximoNumero('leitura', 'numero');
        if (!L) return dados;
        var conta = L.leituraDaColeta({
          parque: parque,
          contrato: contrato,
          ultima: L.ultimaLeitura(ctx.listar('leituras'), parque.id),
          contadorPB: dados.contadorPB,
          contadorCor: dados.contadorCor,
          dataLeitura: dados.dataLeitura,
          clienteNome: cliente ? cliente.nome : ''
        });
        Object.keys(conta).forEach(function (k) { dados[k] = conta[k]; });
        var eq = parque.equipamentoId ? ctx.achar('equipamentos', parque.equipamentoId) : null;
        if (eq) {
          var novoContador = L.contadorDaMaquina(eq, dados);
          ctx.salvar('equipamentos', Object.assign({}, eq, novoContador));
        }
        return dados;
      }
    },

    // Atendimento → Chamados (a OS do balcão)
    // Fonte: app.js:renderModalOS (cliente, parque/equipamento, tipo, prioridade,
    //        técnico, status, descrição) + dataFechamento em saveOS
    os: {
      grupo: 'atendimento', rotulo: 'Chamados / OS', singular: 'chamado',
      dica: 'Digite o número, o cliente ou a descrição',
      // o SISTEMA preenche: número do chamado, nome do cliente/técnico, a máquina
      // (modelo/série/patrimônio vêm do parque escolhido) e as datas de abertura/fecho
      calculados: ['numero', 'clienteNome', 'tecnicoNome', 'equipamentoId', 'modelo', 'serie',
        'patrimonio', 'problema', 'dataAbertura', 'dataFechamento',
        // preenchidos pelo ESPELHO da venda (novo/venda.js), não pela tela de Chamados
        'vendaId', 'numeroSerie', 'equipamentoModelo', 'contador', 'tipoOS', 'responsavelEntrega',
        'garantia', 'pecasTexto', 'situacaoOS', 'acessorios', 'abertura', 'criadoEm'],
      colunas: [
        { campo: 'numero', titulo: 'Número' },
        { campo: 'clienteId', titulo: 'Cliente', composto: 'cliente' },
        { campo: 'tipo', titulo: 'Tipo' }, { campo: 'prioridade', titulo: 'Prioridade' },
        { campo: 'tecnico', titulo: 'Técnico', composto: 'tecnico' }, { campo: 'status', titulo: 'Status' }
      ],
      campos: [
        { campo: 'clienteId', rotulo: 'Cliente', opcoesDe: 'clientes', obrigatorio: true, largo: true },
        { campo: 'parqueId', rotulo: 'Máquina do cliente (opcional)', opcoesDe: 'parque', largo: true },
        { campo: 'tipo', rotulo: 'Tipo', opcoes: ['corretiva', 'preventiva', 'instalacao', 'remocao', 'suprimento'] },
        { campo: 'prioridade', rotulo: 'Prioridade', opcoes: ['baixa', 'media', 'alta', 'critica'] },
        { campo: 'tecnico', rotulo: 'Técnico', opcoesDe: 'tecnicos' },
        { campo: 'status', rotulo: 'Status', opcoes: ['aberto', 'em_atendimento', 'aguardando_peca', 'concluido'] },
        { campo: 'descricao', rotulo: 'Descrição do problema', obrigatorio: true, largo: true }
      ],
      // O schema é a UNIÃO de dois caminhos que escrevem na MESMA lista: a tela de
      // Chamados (aqui) e o espelho da venda (novo/venda.js/osParaChamados) — antes havia
      // duas declarações e o último a montar ganhava. Agora a verdade é só esta.
      schema: {
        numero: { tipo: 'texto' }, vendaId: { tipo: 'texto' },
        clienteId: { obrigatorio: true, tipo: 'texto' }, clienteNome: { tipo: 'texto' },
        parqueId: { tipo: 'texto' }, equipamentoId: { tipo: 'texto' },
        tipo: { tipo: 'texto' }, prioridade: { tipo: 'texto' }, tecnico: { tipo: 'texto' },
        tecnicoNome: { tipo: 'texto' }, status: { tipo: 'texto' },
        descricao: { obrigatorio: true, tipo: 'texto' }, dataFechamento: { tipo: 'texto' },
        dataAbertura: { tipo: 'texto' }, problema: { tipo: 'texto' },
        serie: { tipo: 'texto' }, numeroSerie: { tipo: 'texto' },
        modelo: { tipo: 'texto' }, equipamentoModelo: { tipo: 'texto' },
        patrimonio: { tipo: 'texto' }, contador: { tipo: 'texto' }, tipoOS: { tipo: 'texto' },
        responsavelEntrega: { tipo: 'texto' }, garantia: { tipo: 'texto' },
        pecasTexto: { tipo: 'texto' }, situacaoOS: { tipo: 'texto' }, acessorios: { tipo: 'texto' },
        abertura: { tipo: 'texto' }, criadoEm: { tipo: 'texto' }
      },
      // o chamado nasce numerado pela série de OS (é o `proximoNumeroSimples('os', …)` de hoje)
      preparar: function (dados, ctx) {
        if (!texto(dados.numero).trim()) dados.numero = ctx.proximoNumero('os', 'numero');
        if (!texto(dados.dataAbertura).trim()) dados.dataAbertura = new Date().toISOString();
        var cli = dados.clienteId ? ctx.achar('clientes', dados.clienteId) : null;
        if (cli) dados.clienteNome = cli.nome || '';
        var tec = dados.tecnico ? ctx.achar('tecnicos', dados.tecnico) : null;
        if (tec) dados.tecnicoNome = tec.nome || '';
        var p = dados.parqueId ? ctx.achar('parque', dados.parqueId) : null;
        if (p) {
          dados.equipamentoId = p.equipamentoId || dados.equipamentoId || '';
          var eq = p.equipamentoId ? ctx.achar('equipamentos', p.equipamentoId) : null;
          if (eq) { dados.modelo = eq.modelo || ''; dados.serie = eq.serie || ''; dados.patrimonio = eq.patrimonio || ''; }
        }
        // fechado ganha data de fechamento (é o `saveOS` de hoje)
        if (baixo(dados.status) === 'concluido' && !texto(dados.dataFechamento).trim()) {
          dados.dataFechamento = new Date().toISOString();
        }
        return dados;
      }
    },

    // Atendimento → Orçamentos
    // Fonte: ajustes_v52237_orcamentos_aprovacao_patch.js (numero, clienteId,
    //        data, itens, desconto, total, status, observacao)
    orcamentos: {
      grupo: 'atendimento', rotulo: 'Orçamentos', singular: 'orçamento',
      dica: 'Digite o número, o cliente ou a observação',
      // o SISTEMA preenche: nome do cliente e o conteúdo do orçamento (itens/desconto
      // vêm da tela de venda quando se manda um orçamento para a notinha)
      calculados: ['clienteNome', 'itens', 'desconto'],
      colunas: [
        { campo: 'numero', titulo: 'Número' },
        { campo: 'clienteId', titulo: 'Cliente', composto: 'cliente' },
        { campo: 'total', titulo: 'Total', moeda: true }, { campo: 'status', titulo: 'Status' }
      ],
      campos: [
        { campo: 'numero', rotulo: 'Número', obrigatorio: true },
        { campo: 'clienteId', rotulo: 'Cliente', opcoesDe: 'clientes' },
        { campo: 'data', rotulo: 'Data', tipo: 'data' },
        { campo: 'total', rotulo: 'Total R$', tipo: 'numero' },
        { campo: 'status', rotulo: 'Status', opcoes: ['pendente', 'aprovado', 'autorizado', 'recusado', 'faturado'] },
        { campo: 'observacao', rotulo: 'Observação', largo: true }
      ],
      schema: {
        numero: { obrigatorio: true, tipo: 'texto' }, clienteId: { tipo: 'texto' }, clienteNome: { tipo: 'texto' },
        data: { tipo: 'texto' }, itens: { tipo: 'lista' }, desconto: { tipo: 'numero' },
        total: { tipo: 'numero' }, status: { tipo: 'texto' }, observacao: { tipo: 'texto' }
      },
      preparar: function (dados, ctx) {
        if (dados.clienteId) {
          var cli = ctx.achar('clientes', dados.clienteId);
          if (cli) dados.clienteNome = cli.nome || '';
        }
        if (!texto(dados.data).trim()) dados.data = new Date().toISOString().slice(0, 10);
        return dados;
      }
    },

    // Configurações → Usuários e permissões
    // Fonte: app.js:renderModalUsuario (nome, login, perfil, status).
    // ATENÇÃO DE SEGURANÇA: a SENHA não entra aqui de propósito — senha não é
    // dado de cadastro no coração novo (o sistema de hoje guarda o hash; na
    // virada da chave o login é refeito, com o dono decidindo como).
    usuarios: {
      grupo: 'config', rotulo: 'Usuários e permissões', singular: 'usuário',
      dica: 'Digite o nome, o login ou o perfil',
      colunas: [
        { campo: 'nome', titulo: 'Nome' }, { campo: 'login', titulo: 'Login' },
        { campo: 'perfil', titulo: 'Perfil' }, { campo: 'status', titulo: 'Status' }
      ],
      campos: [
        { campo: 'nome', rotulo: 'Nome completo', obrigatorio: true, largo: true },
        { campo: 'login', rotulo: 'Login', obrigatorio: true },
        { campo: 'perfil', rotulo: 'Perfil', opcoes: ['admin', 'gerente', 'vendedor', 'tecnico', 'financeiro'] },
        { campo: 'status', rotulo: 'Status', opcoes: ['ativo', 'inativo'] }
      ],
      schema: {
        nome: { obrigatorio: true, tipo: 'texto' }, login: { obrigatorio: true, tipo: 'texto' },
        perfil: { tipo: 'texto' }, status: { tipo: 'texto' }
      },
      nota: 'Aqui fica quem é quem (nome, login, perfil, status). A TRAVA por permissão (quem pode estornar, cancelar, dar desconto) entra junto com o login, na virada — hoje ela ainda é do sistema antigo. Senha não fica nesta lista de propósito.'
    },

    // Configurações / Atendimento → Técnicos (usados no chamado e na OS)
    tecnicos: {
      grupo: 'config', rotulo: 'Técnicos', singular: 'técnico',
      dica: 'Digite o nome ou o telefone',
      colunas: [{ campo: 'nome', titulo: 'Nome' }, { campo: 'telefone', titulo: 'Telefone' }, { campo: 'ativo', titulo: 'Ativo' }],
      campos: [
        { campo: 'nome', rotulo: 'Nome', obrigatorio: true, largo: true },
        { campo: 'telefone', rotulo: 'Telefone' },
        { campo: 'ativo', rotulo: 'Ativo (aparece na lista do chamado)', tipo: 'boleano' }
      ],
      schema: { nome: { obrigatorio: true, tipo: 'texto' }, telefone: { tipo: 'texto' }, ativo: { tipo: 'boleano' } }
    },

    // Configurações → Empresas (é a empresa que sai no papel: nome, CNPJ, endereço)
    empresas: {
      grupo: 'config', rotulo: 'Empresas', singular: 'empresa',
      dica: 'Digite o nome, o CNPJ ou a cidade',
      colunas: [
        { campo: 'nome', titulo: 'Nome' }, { campo: 'cnpj', titulo: 'CNPJ' },
        { campo: 'cidade', titulo: 'Cidade' }, { campo: 'uf', titulo: 'UF' }
      ],
      campos: [
        { campo: 'nome', rotulo: 'Razão social', obrigatorio: true, largo: true },
        { campo: 'fantasia', rotulo: 'Nome fantasia' },
        { campo: 'cnpj', rotulo: 'CNPJ' },
        { campo: 'ie', rotulo: 'Inscrição estadual' },
        { campo: 'telefone', rotulo: 'Telefone' },
        { campo: 'email', rotulo: 'E-mail' },
        { campo: 'logradouro', rotulo: 'Logradouro', largo: true },
        { campo: 'numero', rotulo: 'Número' },
        { campo: 'bairro', rotulo: 'Bairro' },
        { campo: 'municipio', rotulo: 'Município' },
        { campo: 'uf', rotulo: 'UF' },
        { campo: 'cep', rotulo: 'CEP' }
      ],
      schema: {
        nome: { obrigatorio: true, tipo: 'texto' }, fantasia: { tipo: 'texto' }, cnpj: { tipo: 'texto' },
        ie: { tipo: 'texto' }, telefone: { tipo: 'texto' }, email: { tipo: 'texto' },
        logradouro: { tipo: 'texto' }, numero: { tipo: 'texto' }, bairro: { tipo: 'texto' },
        municipio: { tipo: 'texto' }, uf: { tipo: 'texto' }, cep: { tipo: 'texto' }
      }
    },

    // Configurações → Auditoria (o que aconteceu, quem fez e quando).
    // É registro de HISTÓRICO: entra como somente leitura (não se inventa log).
    logs: {
      grupo: 'config', rotulo: 'Auditoria', singular: 'registro', somenteLeitura: true,
      dica: 'Digite o usuário, o módulo, a ação ou o detalhe',
      // o SISTEMA preenche a data (o registro nasce com o instante do que aconteceu)
      calculados: ['data'],
      colunas: [
        { campo: 'data', titulo: 'Quando', dataCurta: true }, { campo: 'usuarioNome', titulo: 'Quem' },
        { campo: 'modulo', titulo: 'Módulo' }, { campo: 'acao', titulo: 'Ação' }, { campo: 'detalhe', titulo: 'Detalhe' }
      ],
      campos: [
        { campo: 'usuarioNome', rotulo: 'Quem' }, { campo: 'modulo', rotulo: 'Módulo' },
        { campo: 'acao', rotulo: 'Ação' }, { campo: 'alvo', rotulo: 'Alvo' }, { campo: 'detalhe', rotulo: 'Detalhe', largo: true }
      ],
      schema: {
        data: { tipo: 'texto' }, usuarioNome: { tipo: 'texto' }, modulo: { tipo: 'texto' },
        acao: { tipo: 'texto' }, alvo: { tipo: 'texto' }, detalhe: { tipo: 'texto' }
      }
    },

    // Fiscal → Catálogo (NCM/CEST/CFOP). É tabela de APOIO da nota: somente leitura
    // na tela (o dono não fica cadastrando NCM à mão; quem alimenta é a base fiscal).
    catalogoFiscal: {
      grupo: 'fiscal', rotulo: 'Catálogo fiscal (NCM/CEST/CFOP)', singular: 'item do catálogo', somenteLeitura: true,
      dica: 'Digite o NCM, a descrição ou o CFOP',
      colunas: [
        { campo: 'ncm', titulo: 'NCM' }, { campo: 'descricao', titulo: 'Descrição' },
        { campo: 'cest', titulo: 'CEST' }, { campo: 'cfop', titulo: 'CFOP' }, { campo: 'unidade', titulo: 'Unidade' }
      ],
      campos: [
        { campo: 'ncm', rotulo: 'NCM' }, { campo: 'descricao', rotulo: 'Descrição', largo: true },
        { campo: 'cest', rotulo: 'CEST' }, { campo: 'cfop', rotulo: 'CFOP' }, { campo: 'unidade', rotulo: 'Unidade' }
      ],
      schema: {
        ncm: { tipo: 'texto' }, descricao: { tipo: 'texto' }, cest: { tipo: 'texto' },
        cfop: { tipo: 'texto' }, unidade: { tipo: 'texto' }
      }
    }
  };

  // ── OS ESQUEMAS DAS LISTAS QUE NÃO TÊM ABA ────────────────────────────────
  // Venda, financeiro, espelho da OS e a configuração do Pix não são tela de cadastro —
  // são listas que as peças do núcleo novo usam por dentro. Até a rodada 20 cada peça
  // declarava o SEU schema da MESMA lista (`contasReceber` existia em duas versões, uma
  // com `clienteNome`/`baixaForma` e outra sem) e o último a montar ganhava: o mesmo dado
  // entrava num formato e voltava noutro conforme a tela que abriu primeiro. A partir da
  // rodada 21 a verdade é UMA, aqui — e as peças pedem esta ficha (com a cópia local de
  // reserva, para o teste isolado de cada peça continuar rodando sem carregar tudo).
  var ESQUEMAS = {
    vendas: {
      numero: { obrigatorio: true, tipo: 'texto' }, clienteId: { tipo: 'texto' }, clienteNome: { tipo: 'texto' },
      itens: { tipo: 'lista' }, desconto: { tipo: 'numero' }, total: { tipo: 'numero' },
      status: { tipo: 'texto' }, formaPagamento: { tipo: 'texto' }, data: { tipo: 'texto' },
      destino: { tipo: 'texto' }, dataSaida: { tipo: 'texto' }, prazoEntrega: { tipo: 'texto' },
      observacao: { tipo: 'texto' }, atendenteNome: { tipo: 'texto' }, os: { tipo: 'objeto' },
      parcelas: { tipo: 'lista' }, faturadoEm: { tipo: 'texto' },
      estornoDe: { tipo: 'texto' }, estornadoEm: { tipo: 'texto' }, estornadoPor: { tipo: 'texto' }
    },
    contasReceber: {
      origem: { tipo: 'texto' }, clienteId: { tipo: 'texto' }, clienteNome: { tipo: 'texto' },
      vendaId: { tipo: 'texto' }, descricao: { tipo: 'texto' }, valor: { tipo: 'numero' },
      vencimento: { tipo: 'texto' }, pagamentoData: { tipo: 'texto' }, status: { tipo: 'texto' },
      autoBaixa: { tipo: 'boleano' }, formaPagamento: { tipo: 'texto' }, baixaForma: { tipo: 'texto' },
      parcela: { tipo: 'numero' }, totalParcelas: { tipo: 'numero' }, jurosMes: { tipo: 'numero' },
      estornoDe: { tipo: 'texto' }, estornadoEm: { tipo: 'texto' }, estornadoPor: { tipo: 'texto' }
    },
    contasPagar: {
      origem: { tipo: 'texto' }, fornecedor: { tipo: 'texto' }, descricao: { tipo: 'texto' },
      categoria: { tipo: 'texto' }, valor: { tipo: 'numero' }, vencimento: { tipo: 'texto' },
      pagamentoData: { tipo: 'texto' }, status: { tipo: 'texto' }, formaPagamento: { tipo: 'texto' },
      baixaForma: { tipo: 'texto' },
      parcela: { tipo: 'numero' }, totalParcelas: { tipo: 'numero' }, jurosMes: { tipo: 'numero' }
    },
    // o `os` compartilha a ficha da tela de Chamados (é a mesma lista)
    config: { chave: { tipo: 'texto' }, nome: { tipo: 'texto' }, cidade: { tipo: 'texto' } }
  };
  ESQUEMAS.os = LISTAS.os.schema;

  // ── TODAS AS TELAS DO SISTEMA DE HOJE ─────────────────────────────────────
  // `tipo`: lista (cadastro pelo motor), feita (tela própria do núcleo novo),
  //         depende (precisa de motor que ainda não foi migrado — abre e explica).
  // O `depende` NÃO é desculpa: cada um diz EXATAMENTE o que falta.
  var TELAS = [
    { id: 'inicio', rotulo: 'Painel do dia', grupo: 'inicio', viewAntiga: 'view-dashboard', tipo: 'feita', marca: 'pronta' },
    { id: 'clientes', rotulo: 'Clientes', grupo: 'cadastros', viewAntiga: 'view-clientes', tipo: 'lista', lista: 'clientes' },
    { id: 'produtos', rotulo: 'Produtos e serviços', grupo: 'cadastros', viewAntiga: 'view-produtos', tipo: 'lista', lista: 'produtos' },
    { id: 'recargas', rotulo: 'Recargas de toner', grupo: 'cadastros', viewAntiga: 'view-produtos', tipo: 'lista', lista: 'recargas' },
    { id: 'vendas', rotulo: 'Nova venda / Notinha', grupo: 'atendimento', viewAntiga: 'view-vendas', tipo: 'feita',
      marca: 'pronta (impressão, Pix e OS)' },
    { id: 'orcamentos', rotulo: 'Orçamentos', grupo: 'atendimento', viewAntiga: 'view-orcamentos', tipo: 'lista', lista: 'orcamentos' },
    { id: 'os', rotulo: 'Chamados / OS', grupo: 'atendimento', viewAntiga: 'view-manutencao', tipo: 'lista', lista: 'os' },
    { id: 'impressoras', rotulo: 'Impressoras / Máquinas', grupo: 'locacao', viewAntiga: 'view-impressoras', tipo: 'lista', lista: 'equipamentos' },
    { id: 'contratos', rotulo: 'Contratos', grupo: 'locacao', viewAntiga: 'view-contratos', tipo: 'lista', lista: 'contratos' },
    { id: 'parque', rotulo: 'Máquinas nos clientes', grupo: 'locacao', viewAntiga: 'view-parque', tipo: 'lista', lista: 'parque' },
    { id: 'leituras', rotulo: 'Leituras', grupo: 'locacao', viewAntiga: 'view-leituras', tipo: 'lista', lista: 'leituras' },
    { id: 'contasReceber', rotulo: 'Contas a receber', grupo: 'financeiro', viewAntiga: 'view-financeiro', tipo: 'feita', marca: 'pronta' },
    { id: 'contasPagar', rotulo: 'Contas a pagar', grupo: 'financeiro', viewAntiga: 'view-financeiro', tipo: 'feita', marca: 'pronta' },
    { id: 'fiscal-nfe', rotulo: 'Nota Fiscal (emissão)', grupo: 'fiscal', viewAntiga: 'view-central-nf', tipo: 'depende',
      motivo: 'a emissão da nota é o motor fiscal de hoje (assinatura A1, SEFAZ, contingência). Migrar isso sem homologação é o que a regra 22 proíbe: primeiro homologa, depois troca. A tela de hoje continua emitindo.' },
    { id: 'fiscal-catalogo', rotulo: 'Catálogo (NCM/CEST/CFOP)', grupo: 'fiscal', viewAntiga: 'view-config-fiscal', tipo: 'lista', lista: 'catalogoFiscal' },
    { id: 'fiscal-cert', rotulo: 'Certificado A1', grupo: 'fiscal', viewAntiga: 'view-config-fiscal', tipo: 'depende',
      motivo: 'guardar certificado e senha é dado sensível: no coração novo isso entra depois, com o cofre decidido (nada de senha em código, bundle ou HTML público).' },
    { id: 'fiscal-historico', rotulo: 'Histórico fiscal', grupo: 'fiscal', viewAntiga: 'view-fiscal-historico', tipo: 'depende',
      motivo: 'o histórico é a lista das notas emitidas: ele vem junto com a emissão (é a mesma peça).' },
    { id: 'fiscal-regras', rotulo: 'Perfil tributário (CST/CFOP/alíquotas)', grupo: 'fiscal', viewAntiga: 'view-config-fiscal', tipo: 'depende',
      motivo: 'as regras de imposto (CST/CSOSN, CFOP por operação, alíquotas) andam JUNTO com a emissão: migrar uma sem a outra muda o imposto da nota — e imposto errado é o único erro que não dá para desfazer.' },
    { id: 'escola', rotulo: 'Buscador Escola', grupo: 'escola', viewAntiga: 'view-buscador-escola', tipo: 'depende',
      motivo: 'o Buscador Escola conversa com o sistema da escola (login e tela próprios). Entra quando o dono disser qual endereço de escola vale no núcleo novo.' },
    { id: 'usuarios', rotulo: 'Usuários e permissões', grupo: 'config', viewAntiga: 'view-usuarios', tipo: 'lista', lista: 'usuarios' },
    { id: 'tecnicos', rotulo: 'Técnicos', grupo: 'config', viewAntiga: 'view-usuarios', tipo: 'lista', lista: 'tecnicos' },
    { id: 'empresas', rotulo: 'Empresas', grupo: 'config', viewAntiga: 'view-config', tipo: 'lista', lista: 'empresas' },
    { id: 'auditoria', rotulo: 'Auditoria', grupo: 'config', viewAntiga: 'view-auditoria', tipo: 'lista', lista: 'logs' },
    { id: 'pix', rotulo: 'Pix (chave e QR)', grupo: 'config', viewAntiga: 'view-config', tipo: 'feita', marca: 'pronta' },
    { id: 'nuvem', rotulo: 'Nuvem e backups', grupo: 'config', viewAntiga: 'view-banco', tipo: 'depende',
      motivo: 'a sincronização da nuvem do sistema de hoje é o único caminho que existe hoje para os dados dele; o coração novo já enfileira as mudanças, mas trocar o transporte é a VIRADA DA CHAVE (não se faz por acidente).' },
    { id: 'relatorios', rotulo: 'Relatórios', grupo: 'financeiro', viewAntiga: 'view-relatorios', tipo: 'depende',
      motivo: 'os relatórios de hoje leem as listas inteiras do banco antigo; eles entram depois que todas as listas estiverem no coração novo (é conta em cima de dado, não cadastro).' },
    { id: 'painel-gerente', rotulo: 'Painel do gerente', grupo: 'inicio', viewAntiga: 'view-painel-gerente', tipo: 'depende',
      motivo: 'o painel do gerente soma tudo (vendas, financeiro, contratos) — depende dos relatórios, que dependem das listas.' },
    { id: 'preferencias', rotulo: 'Preferências do sistema', grupo: 'config', viewAntiga: 'view-config', tipo: 'depende',
      motivo: 'as preferências (aparência, comportamento das telas, integrações) são lidas por quase todo o sistema de hoje. Entram depois das telas, para não mudar dois lugares ao mesmo tempo.' },
    { id: 'modulos', rotulo: 'Módulos dinâmicos', grupo: 'config', viewAntiga: 'view-mod', tipo: 'depende',
      motivo: 'os módulos dinâmicos são telas que o próprio dono cria (tabela + campos na hora). No coração novo isso pede a regra de "tabela criada em tempo de uso" — é a peça que ainda não existe aqui.' },
    { id: 'automacoes', rotulo: 'Automações (as 13)', grupo: 'config', viewAntiga: '(regras do sistema)', tipo: 'depende',
      motivo: 'as automações (contadores, recomposição de estoque, visitas, avisos do caixa) não são tela: são regras que rodam por dentro. As que tocam venda, estoque, financeiro e leitura já vieram junto com essas telas; o resto entra com as telas que faltam.' },
    { id: 'navegador', rotulo: 'Navegador embutido', grupo: 'config', viewAntiga: 'view-navegador', tipo: 'depende',
      motivo: 'é a janela de navegação embutida (páginas externas dentro do sistema). Precisa de decisão de segurança: o que pode abrir, com qual sessão.' },
    { id: 'migrados', rotulo: 'Registros migrados', grupo: 'config', viewAntiga: 'view-migrados', tipo: 'depende',
      motivo: 'tela de conferência da base antiga — faz sentido no dia da virada, junto com a importação (a ponte já relata o que entrou).' }
  ];

  TELAS.forEach(function (t) {
    if (!t.marca) t.marca = t.tipo === 'depende' ? 'no sistema de hoje' : (t.tipo === 'lista' ? 'pronta' : '');
  });

  function telaPorId(id) {
    for (var i = 0; i < TELAS.length; i++) if (TELAS[i].id === id) return TELAS[i];
    return null;
  }
  function listasDoGrupo(grupo) {
    return Object.keys(LISTAS).filter(function (n) { return LISTAS[n].grupo === grupo; });
  }

  raiz.DIGICOPY_LISTAS = {
    VERSAO_LISTAS: VERSAO, GRUPOS: GRUPOS, LISTAS: LISTAS, TELAS: TELAS, ESQUEMAS: ESQUEMAS,
    telaPorId: telaPorId, listasDoGrupo: listasDoGrupo
  };
})(typeof window !== 'undefined' ? window : globalThis);
