# MAPEAMENTO — configuração exportada do sistema antigo (v15.4)

Recebido em **2026-09-18**, colado em texto pelo dono (ele mesmo avisou: "não sei se são as corretas").
Este arquivo é o **mapa de decisões** — o dump bruto **NÃO** fica no repositório.

## 1. Higiene de segredos (nunca entram em código/commit)

O dump contém valores sensíveis de verdade. Ficam **só com o dono**, fora do repositório:

- `NFCE_CSC_TOKEN` / `NFCE_ID_CSC_TOKEN` (=000001) — **CSC de produção** da NFC-e. **A pedido dele (18/09/2026): DESCARTADO — não usar, não copiar, não guardar** ("não sabia que tinha tipo uma senha envolvida; esqueça isso"). Quando formos ativar NFC-e de verdade, ele mesmo gera/confere o CSC no portal da SEFAZ-MG e cola nos campos **NFC-e — Código CSC** da Central de Notas (já existem desde a 6.0.2), no PC emissor, nunca em commit.
- `NFE_CERT_NUMEROSERIE` — nº de série do certificado A1 dele. Serve só para ele conferir se o .pfx é o certo na hora de subir na Central.
- E-mails do escritório de contabilidade (`NFE_EMAIL_ESCRITORIO`, `EMAIL_INFO_CAIXA_EMAIL`) — dados pessoais de terceiro; usar só quando ele confirmar.

## 2. Útil AGORA — linha fiscal 6.x (bate com o que já existe)

| Campo antigo | Valor | Destino no nosso sistema |
|---|---|---|
| `NFE_AMBIENTE` 1=prod/2=homolog | 1 | Portão fiscal: nasce em homologação, produção só com `PRODUCAO` + permissão (nosso padrão é MAIS seguro; valor antigo não liga produção sozinho) |
| `NFE_MODELO` | 55 | Prioridade correta: 55 primeiro, 65 pelo código |
| `NFE_SERIE_NOTA` | 1 | Série padrão das notas — conferir na hora da 1ª emissão real |
| `NFE_CRT` | 1 (Simples Nacional) | Regime tributário da empresa — itens saem com CSOSN; já alinhado às nossas config fiscais (v5220/v52229) |
| `NFE_INDFINAL` 1 / `NFE_INDPRES` | 1 / 0 | Consumidor final; presença conforme a venda — manter como default da emissão |
| `NFE_TPIMP` | 1 (retrato A4) | DANFE A4 retrato — é o nosso padrão decidido |
| `NFE_MOD_FRETE` | 9 (sem frete) | Default de frete na emissão |
| `NFE_BSINCRONO` | 1 | Emissão síncrona — nosso motor já transmite síncrono |
| `NFE_VERSAO` | 4.00 | Layout 4.00 — é o que usamos |
| `NFE_GERAR_NF_VENDA_FIN` | "N" | **Confirma a lei dele: nada emite sozinho ao finalizar venda** — só clique + senha |
| `NFCE_VERSAOQRCODE` | 2 | **Verificação aberta:** alinhar nosso QR NFC-e ao formato v2 se hoje estiver v1 (motor 6.0.1, checar antes do 1º teste 65) |
| `NFE_NCM_CARTUCHO` / `_TINTA` / `_LOCACAO` | 37079021 / 32151100 / 37079021 | **ENTREGUE v6.0.6:** campos na Central (NCM padrão/tinta/locação + descrição locação). Prioridade no XML: produto.ncm → Recarga sem NCM→tinta · leitura/locação→ncm locação → padrão |
| `NFE_ENQ_IPI_*` | 325 | Enquadramento IPI 325 — aplicar nos itens se IPI for cobrado |
| `NFE_COND_USO_CCE` | texto art. 23 LC 123/2006 | **ENTREGUE v6.0.6 com ressalva:** o texto do dump trazia valores prontos (R$ 34,47 · 2,75%...) que mudam por nota — julgado provável lixo do velho (regra: conferir antes de concordar). Na Central existe o campo **Texto do Simples** que nasce VAZIO (nada entra na nota sem ele preencher) com os 2 modelos legais de sugestão; vale só em produção (homologação já tem o selo) |
| `NFE_ENVIAR_EMAIL_ESCRITORIO` "S" + e-mail | — | Semente p/ "enviar XML ao contador" (hoje já existe **Baixar XML** na Central) |

## 3. Útil DEPOIS — fila (migração / novos módulos)

- **ETIQUETAS** (ele confirmou: "essa sim é útil") — grade **7 colunas × 18 linhas** com posições exatas de cada etiqueta (colunas 0/107/214/323/429/535/643, linhas 32→895 passo ~50-62) e margens 20/20. Formato de folha A4 completa. Nosso módulo de etiquetas já existe (v52218); evolução anotada: suportar folha A4 nessa grade.
- **MENS_SERVICO / MENS_SERVICO_ENTRADA** — regra dos **30 dias + 90 dias de descarte** de equipamento não retirado. Regra de negócio real dele → candidata ao termo de OS/contrato. Reescrever corrigindo os erros de digitação do original ("CONCLASAO", "EQUIPAMNETO").
- **DIAS_GARANTIA_SERVICO** 30, **CLI_LIMITE_CREDITO** 1000, **JUROS_CONTAS_RECEBER_VENCIDAS** 1%, **MENS_CARNE** (multa pós-vencimento), **DIAS_ORCAMENTO** 60 — defaults financeiros para quando essas telas forem tratadas.
- **SMS templates** (assinados "digicopy": parcela vencida, cliente inativo, aniversário, cartucho reciclado pronto) — sementes de texto p/ **links de cobrança** (fila do gerente.exe, cotas configuráveis).
- **NFSE_\*** (CNAE + enquadramento municipal por serviço: locação 7733100, recarga 4751202, OS 9511800) — semente se um dia entrar NFS-e. **Não está no escopo** hoje.
- **AGE_\*** (agenda seg-sex, 30 min) — só se um dia houver módulo de agenda.

## 4. NÃO útil — ignorar sem peso

- Parâmetros do driver fiscal antigo (`NFE_SSLLIB/CRYPTLIB/HTTPLIB/SSLTYPE/XMLSIGNLIB`) — nosso motor fala TLS 1.2 direto (main.js), não usa driver externo.
- Toggles de e-mail/SMS do velho (`SMS_ENVIAR_*`, `EMAIL_*`) — nosso sistema não dispara SMS/e-mail automático hoje.
- `WEB_*` (loja online do velho), `BOL_*` (boletos), `PIXEL` (vazio), `LINK_PESQUISA_SATISFACAO` (encurtador goo.gl — serviço extinto), tokens Printwayy/Doc360 (integrações do velho).
- Lixo operacional: `QTDE_ABRIU` 2708, `ULTIMO_BACKUP` null, `ANO_EXERCICIO`, `VERSAO` 15.4.

## 5. Mensagens que ele disse que NÃO quer trazer

Ele avisou que tem mensagens aí que não quer. Candidatas óbvias a pular: **MENS_ORCAMENTO** ("cobrimos qualquer oferta — agradecemos a preferência") e genéricas de marketing. As de cobrança assinadas "digicopy" ficam como semente (item 3) **até ele confirmar** se alguma também morre. Confirmação pendente dele.

## 6. Verificações abertas (quando a linha 6.x andar)

1. ~~QR NFC-e: formato v1 vs v2~~ — **FECHADO na v6.0.6**: nosso QR já estava no layout 2 (`chave|2|tpAmb|idCSC|SHA1`, hash maiúsculo), com teste de vetor contra o crypto do Node.
2. CSOSN padrão por operação (Simples) — confirmar com a contabilidade dele qual CSOSN usa em venda dentro/fora do estado (`NFE_TRIB_VENDA_DENTRO` 1 / `_FORA` 2 eram apontadores de tributação no velho).
3. NCM por tipo de item — decidir tela (categoria de produto vs produto individual).

## 7. INVENTÁRIO do banco antigo (7 fotos recebidas 18/09/2026 — "as fotos anexadas são tudo o que tem")

Ele tem o banco inteiro do sistema velho exportado como **arquivos JSON (um por tabela)**, datados de 21/08/2026. É o material da futura **migração com mapa de campos + prévia** (decisão permanente). Inventário transcrito das fotos (tamanhos em KB):

**Núcleo (migra primeiro — é o coração do negócio):**
| Tabela antiga | KB | Destino no nosso sistema |
|---|---|---|
| CLIENTES | 3.347 | clientes |
| ENDERECOS 569 · RUAS 109 · BAIRROS 36 · CIDADES 1.031 · ESTADOS 2 | — | endereços dos clientes (normalizar na prévia) |
| PRODUTOS | 2.992 | produtos |
| PRODUTOS_VALORES · PRODUTOS_CATEGORIA · PRODUTOS_VARIACAO 88 · CATEGORIA · FABRICANTE · UNIDADE_MEDIDA | 1–88 | campos auxiliares de produto (preço/categoria/variação) |
| FUNCIONARIOS 17 | 17 | usuários (mapear cargo → perfil nosso) |
| FORNECEDORES 6 | 6 | fornecedores |
| CARTUCHOS 91 · CARTUCHO_VALOR · CARTUCHO_DEFEITO | 91+ | recargas/cartuchos (domínio dele) |
| EQUIPAMENTOS | 111 | equipamentos (impressoras) |

**Operação/histórico (migra depois do núcleo, com prévia de amostra):**
- VENDAS **36.577** + ITENS_VENDA **25.396** + VENDAS_PAGAMENTO + ESTORNOS 798 + CUPONS_ITENS 39 → vendas e itens (maior bloco; importar por lotes)
- CONTAS_RECEBER **18.277** + RECEBIMENTO_CONTAS_RECEBER 5.547 + CONTAS_RECEBER_AVULSA + CONTAS_PAGAR 111 + CONTAS 12 + BANCOS → financeiro
- LOCACAO 276 + ITENS_LOCACAO 4.045 + DESPESAS_LOCACAO 2.239 + LOCACAO_ESTOQUE 24 + LOCACAO_ESTOQUE_HISTORICO 262 → contratos/locação
- LEITURAS 1.847 · VISITAS **9.180** · MOVIMENTACAO 1.328 · ITENS_INSUMOS 19 · ITENS_INSUMOS_GASTOS 1.357 · CAIXA 162 · RETIRADA_CAIXA 38 · RECEBIMENTO(_ITENS) 1.638 · ORCAMENTO 142 + ITENS_ORCAMENTO 145 · ITENS_COMPRA 5
- OBS: não aparece tabela "ordem de serviço" literal. OS do velho pode ser VISITAS, REGISTROS ou CARTUCHO_DEFEITO/MOTIVO_DEFEITO — **decidir na prévia, não chutar**.

**Fiscal (ouro pra linha 6.x):**
- NOTA_FISCAL 2.107 + ITENS_NOTA 5.224 + FATURA_NFE 4 + ITENS_RECEBIMENTO_NFE 64 + MANIFESTACAO_DFE → histórico de notas emitidas no velho (consulta/arquivo morto; também valida numeração para continuar sequência!)
- **NCM 4.439** — tabela NCM completa: serve de **dicionário** no nosso sistema (já temos lupa NCM desde a v5.22.28; importar como referência, não como cadastro)
- TAB_CEST 163 — tabela CEST de referência (idem NCM)
- TRIBUTOS_PRODUTOS 5 · ICMS_INTERNO 1 · NFSE 1 · CONFIG 8 · CONFIGURACAO 11 (o dump já mapeado acima)

**Referência/lixo (não migra):**
- IBE_LOG_* (logs internos do velho), CONTADOR_PAGINAS 7.906 (cache de páginas web), LOG 231, SELECIONADOS 14, EMAIL_* / ENQUETES_* / CHAT / LIGACOES / TELEMARKETING / SHOP_* / PUBLICIDADE / PIX_HISTORICO / BOLETOS* / CARTAO_* / CARTÃO fidelidade / AGENDA_* / ANEXOS / ATUALIZACAO_REDE / AVALIACAO / ENCOMENDAS / EMPRESA 26.588 (provavelmente logo/blob, confirmar na prévia antes de descartar).

**Regras da migração (permanentes):** importar DENTRO do app (arquivos ficam no PC dele; >130 MB não vão pro repositório) · mapa de campos com prévia ANTES de gravar · nada lê senha/segredo do velho · ordem: núcleo → fiscal de referência → histórico por lotes.
