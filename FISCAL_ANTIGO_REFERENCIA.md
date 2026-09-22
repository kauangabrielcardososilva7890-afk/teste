# REFERÊNCIA — FISCAL DO SISTEMA ANTIGO (fotos do dono, 21/09/2026)

> **Para que serve:** as fotos que o dono mandou mostram o fiscal do sistema antigo
> (SisPrinter / DIGICOPY) e são a referência para o nosso fiscal ficar igual no que
> ele pediu. Cada item abaixo diz **o que a foto mostra** e **o que já temos / o que falta**.
>
> **Onde estão as fotos:** na pasta `uploads/` do ambiente (`/home/user/uploads/`), com os
> nomes originais citados aqui. **Não foram copiadas para o repositório** (peso desnecessário:
> são dezenas de MB) — este documento é o registro que sobrevive entre sessões.
>
> ⚠ **Regra 31 de `REGRAS_PERMANENTES.md`:** a foto é **referência para conferência**, não
> autorização para copiar visual, marca, identidade ou regra de tributação. Cada campo fiscal
> que for implementado passa por conferência antes.

---

## 1. A barra fiscal (6 telas)

| Foto | O que mostra |
|---|---|
| `MENUS NF.png` | A faixa de ícones do fiscal com **6 telas**: Nota Fiscal · Perfil Tributário · Manifestação · NCM · Enviar XML · Configurações |
| `SUBMENU CONFIGURAÇÕES.png` | Configurações NFe com as abas: Gerais · Outras · Tributação · Mensagens · **Certificados** · FCP · Inutilizar · NFCe · Autorizações · Reforma Tributária |
| `SUBMENU NCM.png` | Catálogo NCM (colunas: NCM, Imposto % Nacional Fed, Imposto Imp %, Descrição) |
| `SUBMENU ENVIAR XML.png` | "Preparar Arquivos Fiscais": mês/ano, incluir PDFs, contadores **Geradas/Canceladas/Corrigidas/XML Não Encontrados**, botão Enviar para Escritório |
| `SUBMENU MANIFESTAÇÃO.png` | "Manifestação Destinatário": filtros (Tipo de Filtro, Status NF, Modelo, Status Manifestação, datas), grade com Código/NSN/Nome/IE/CNPJ/Chave/Valor/Número DF-e/Dh. Emissão/Status Nota/Status Manifestação/Protocolo Nota/Protocolo Evento/Dh. Evento, botões **Obter Notas / Manifestar / Baixar XML** |
| `SUBMENU PERFIL TRIBUTARIO.png` | "Configuração de Perfil Tributário" — lista de **Tributações** (Código, Descrição, CFOP): `00001 VENDA DENTRO DO ESTADO 5102`, `00003 DEVREMESSA… 5915`, `00005 RETORNO… 5916`, `00002 VENDA FORA DO ESTADO 6102`, `00004 TROCA DE MERCADORIA 6949` |

**Nosso sistema hoje:** tem as mesmas 6 telas (Nota Fiscal, Perfil Tributário, Manifestação, NCM,
Enviar XML, Configurações) e as 10 abas de Configurações fiscais.
**Feito nesta rodada (v6.1.4):** dentro de toda tela fiscal agora existe a **faixa de ABAS com as 6 telas**
(marcando onde você está, um clique para trocar) — é o "formato aba, não formato menu" que ele pediu,
no mesmo lugar onde o sistema antigo tinha essa faixa.

---

## 2. A tela da Nota Fiscal Eletrônica (a "nova venda de NF")

| Foto | O que mostra |
|---|---|
| `SUBMENU NOTA FISCAL.png`, `FILTRO SUBMENU NOTA FISCAL.png`, `Captura de tela 2026-09-19 015418.png` | **Lista** da NFe: título "Nota Fiscal Eletrônica", botões **Novo / Alterar / Excluir / Clonar**, filtro de período com calendário, "Hoje/Abertas", grade (Data, Modelo, Tipo, Email, Num. Nota, Natureza Op., Cliente, Valor, **Situação** = "Não Gerada"), rodapé `Banco Servidor Google · Usuário KAUAN · 28 Código SisPrinter: 1421 · DIGICOPY · 08.385.589/0001-03` |
| `VENDA NF.png`, `venda não faturada NF - gerais.png`, `pre-visualização nota fiscal.png`, `Captura de tela 2026-09-15 202821.png`, `203838.png`, `224855.png` | **A tela da NFe** aberta para edição, com as abas: **Gerais · Destinatário · Itens da Nota · Informações Adicionais · Transporte · Correções · Reforma Tributária · Referenciar · Links Úteis · Log**, e sub-abas (Itens \| Tributação; Tributação \| Importação \| Outros \| Reforma Tributária; CSOSN ICMS \| Icms ST \| Fcp \| Efetivo \| Outros; XML Resposta \| Log \| NFe \| Retorno Completo WS \| Dados \| RetornoConsulta NFe 2.01; Respostas), rodapé **Gerar Nfe / Pré Visualizar** |
| `geral - dados principais - filtro natureza.png` / `tipo.png` / `finalidade.png` | Listas dos campos: **Natureza** (VENDA, COMPRA, TRANSFERENCIA, DEVOLUCAO, COMPLEMENTAR, IMPORTACAO, CONSIGNACAO, REMESSA, REMESSA PARA CONSERTO, REMESSA EM GARANTIA, REMESSA DE BEM PARA LOCACAO, DEMONSTRACAO, SIMPLES REMESSA, LOCACAO DE EQUIPAMENTOS, RETORNO PARA CONSERTO, LOCACAO DE BENS MOVEIS…); **Tipo**: `1 - Saída` (e 0 - Entrada); **Finalidade**: `1 - Normal`, 2 - Complementar, 3 - Ajuste, 4 - Devolução/Retorno, 5 - Nota de Crédito, 6 - Nota de Débito |
| `geral - pagamentos - filtro parte 1/2.png` | Formas de pagamento: 01-Dinheiro, 02-Cheque, 03/04/05-Cartões, 10-Vale Alimentação, 11-Vale Refeição, 12-Vale Presente, 13-Vale Combustível, 14-Duplicata Mercantil, 15-Boleto, 16-Depósito, 17-PIX Dinâmico, 18-Transferência, 19-Programa de Fidelidade, 90-Sem Pagamento, 99-Outro, 20-PIX Estático, 21-Crédito em loja, etc. |
| `geral - duplicatas(o filtro vencimento escolho uma data, abre um calendario).png` | Aba **Duplicatas** (valor + vencimento com calendário) |
| `opção quando eu clico no numero da chave de acesso.png` | Menu da chave: **Copiar Chave de Acesso**, Consultar NF Sefaz Nacional/Estadual, Acessar Diretório XML |
| `NOTA FISCAL IMPRESSA.png`, `NOTA FISCAL IMPRESSA PRE-VISUALIZAÇÃO.png`, `Captura de tela 2026-09-15 203838/224855.png` | **DANFE** (SisPrinter): "NF-E EM PRÉ-VISUALIZAÇÃO — SEM VALOR FISCAL"; Dados Adicionais com **Valor Aproximado dos Tributos (Fonte IBPT)** e **"NF-e Vinculado a(s) venda(s)…"** |

**Nosso sistema hoje:** a venda/notinha e a Central de NF existem; a **tela da NFe com as 10 abas** e o
fluxo "Novo → tela em aba" do sistema antigo **ainda não** existem no nosso formato.
**Ideia confirmada com o dono nesta rodada (a construir na próxima leva), em ordem:**
1. **"Nova venda de NF" abrindo em ABA** (faixa de abas da própria nota: Gerais, Destinatário, Itens, Informações Adicionais, Transporte, Correções, Reforma Tributária, Referenciar, Log) — como a tela da foto, com rodapé Gerar NFe / Pré-visualizar.
2. **Lista da NFe** no formato do sistema antigo (Novo/Alterar/Excluir/Clonar + coluna Situação).
3. **DANFE** com o bloco "Valor Aproximado dos Tributos (IBPT)" e o vínculo com a(s) venda(s).

---

## 3. Itens da nota — tributação completa

| Fotos | O que mostram |
|---|---|
| `itens da nota - igual o de vendas, porem aqui é so produtos.png` | Grade de itens (Nº Item, Código, Descrição, NCM, CFOP, CSOSN, CST, Qtd, UN, Vlr Unit, Vlr Total, Desconto, BC…) + bloco "Tipo / Descrição do produto / Quat / Valor Unitário / **Perfil Tributário** (VENDA DENTRO DO ESTADO, DEVREMESSA…, RETORNO…, VENDA FORA DO ESTADO, TROCA DE MERCADORIA) / **Novo Perfil**" |
| `Itens da nota - tributação.png`, `- reforma tributaria - padrão.png`, `- padrão - filtro codigo CST.png`, `- padrão - filtro classificação.png`, `- reforma tributaria - devolução de tributos.png` | Aba **Reforma Tributária**: Código CST (`000 - Tributação integral`, 200 - Alíquota reduzida, 410 - Imunidade e não incidência, 510 - Diferimento, 515 - Diferimento com redução de alíquota, 550 - Suspensão, 800 - Transferência de crédito, 811 - Ajustes, 830 - Exclusão da Base de Cálculo), **Classificação** (`000001 - Situações tributadas integralmente pelo IBS e CBS`, 000003/000004 - Regime automotivo…), Base de Cálculo, **IBS Estadual / IBS Municipal / CBS** (alíquota % e valor), **Devolução de Tributos** por esfera |
| `- tributação.png`, `- tributação - Filtro ICMS parte 1/2.png`, `- ICSM` | Aba **Tributação**: ICMS (`101/102/103/201/202/203/300/400/500/900…`, ex.: `102 - Tributada pelo Simples Nacional sem permissão de crédito`), IPI (50-Saída Tributada, 51, 52, 53, 54, 55, 99), PIS (01…07, 08, 09, 49 - Operação Isenta/Sem Incidência/Suspensão), COFINS (01…07, 08, 09, 49), base de cálculo e valores |
| `- outros.png`, `- outros - CSOSN ICMS.png`, `- outros - Icms ST.png`, `- outros - Fcp.png`, `- outros - efetivo.png` | Aba **Outros**: CSOSN ICMS (102…), ICMS ST (Valor ST Ret/Dest, % FCP + % ST, Vlr. Substituído), **FCP** (V.B.C FCP, V. FCP, FCP UF Dest, FCP ST), **Efetivo** (Base Cálculo Efetivo %, Valor Efetivo, % Redução Efetivo) |
| `- importação(o que for data é o calendario escolha dia, os outros tem nada de escolha).png` | Aba **Importação**: dados para declaração (Núm DI/DSI/DA/DR-E, data registro com calendário, código do exportador, via de transporte, AFRMM, forma de importação, desembaraço, adições, valores, país) |

**Nosso sistema hoje:** temos Perfil Tributário (CFOP/CSOSN/PIS/COFINS/IPI por perfil) e campos de
reforma tributária em `fiscal_catalogo_completo_patch.js`. **Falta:** CST/classificação IBS/CBS,
grupo "Outros" (FCP/ST/Efetivo) e Importação por item, como nas fotos.

---

## 4. Outras abas da NFe

| Fotos | O que mostram |
|---|---|
| `destinatario.png` | Destinatário: pesquisa por Nome/Razão, Cód., CPF/CNPJ, IE, email, fone, CEP, cidade, UF, bairro, rua, número, complemento, "Endereço de Entrega é Diferente" |
| `transporte.png`, `transporte - filtro modalidade de frete.png` | Transporte: **Modalidade de Frete** (`9 - Sem Ocorrência de Transporte`, 0-CIF, 1-FOB, 2-Terceiros, 3/4-Próprio), transportadora, veículo (Placa/UF/RNTC), volumes (Qtde, Espécie, Marca, Numeração, Peso Bruto/Líquido, Lacre) |
| `informações adicionais.png` | Informações Complementares, Informações Pré-configuradas e **Informações geradas automaticamente** (texto do IBPT), "Usado em Órgãos Públicos" (Nota de Empenho, Pedido, Contrato) |
| `referenciar.png` | "Notas Fiscais Referenciadas" com **Adicionar** (o mecanismo do "NF-e Vinculado a(s) venda(s)") |
| `correções.png` | Correções Realizadas (cartas de correção) com **Imprimir** |
| `log - log.png`, `log - outros menus em geral(é a mesma pagina pra todos exceto um).png` | Log / Respostas / XML Resposta / Retorno Completo WS / RetornoConsulta NFe 2.01 |
| `links uteis(não é necessario colocar).png` | Links Úteis (CAC, Consultar NFe pela Chave, Verificar Disponibilidade, Dúvidas, SINTEGRA) — **ele marcou como NÃO necessário** |
| `outras opções` (dentro de `VENDA NF.png` → "Outras Opções → Alterar NFe → Cidades/Datas") | Alteração rápida de cidade/data em lote |

---

## 5. Configurações da NFe (modelo de referência)

`SUBMENU CONFIGURAÇÕES.png` — aba **Gerais**: Regime Tributário CRT (`1 - Simples Nacional`),
Regime Especial de Tributação (`6 - Microempresa e Empresa de Pequeno Porte`), Série da Nota (`1`),
Ambiente (`1 - Produção`), Modelo Padrão (`55 - NF-e`), Frete Padrão (`9 - Sem Frete`),
Formato de Impressão do DANFE (`1 - DANFE normal, Retrato`), Processamento (`1 - Sincrono`),
**Versão (`4.00`)**, Tipo de Emissão, Tipo de Operação, Processo de Emissão.

**Nosso sistema hoje:** esses campos existem na Configuração fiscal (10 abas) — conferir cada um
contra esta lista antes de mexer. O que interessa para o próximo passo: a aba **Certificados** do
sistema antigo é onde o A1 era instalado (nosso botão **📎 Instalar certificado A1 (neste PC)** já
está na Central; falta colocá-lo também na aba de certificado da Configuração fiscal, se ele quiser).

---

## 6. Fila de trabalho que este material destrava

1. **Faixa de abas fiscais** — ✅ feito nesta rodada (v6.1.4).
2. **"Nova venda de NF" em aba** (tela da NFe com as abas, itens e totais) — próximo passo.
3. **Lista da NFe** com Novo/Alterar/Excluir/Clonar e coluna **Situação**.
4. **CST / Classificação IBS-CBS / Devolução de tributos / grupo Outros (FCP, ST, Efetivo) / Importação** por item.
5. **DANFE** com "Valor Aproximado dos Tributos (IBPT)" e vínculo com a(s) venda(s).
6. **Manifestação** com as colunas e os botões (Obter Notas / Manifestar / Baixar XML).
7. **Preparar Arquivos Fiscais** (Enviar XML) com os contadores e "Enviar para Escritório".

> Nada disso entra sem conferência de tributação e sem o teste da versão (regra 31 e regra 22:
> fiscal começa em homologação, nada emite sozinho).
