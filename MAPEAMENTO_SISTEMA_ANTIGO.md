# MAPEAMENTO — configuração exportada do sistema antigo (v15.4)

Recebido em **2026-09-18**, colado em texto pelo dono (ele mesmo avisou: "não sei se são as corretas").
Este arquivo é o **mapa de decisões** — o dump bruto **NÃO** fica no repositório.

## 1. Higiene de segredos (nunca entram em código/commit)

O dump contém valores sensíveis de verdade. Ficam **só com o dono**, fora do repositório:

- `NFCE_CSC_TOKEN` / `NFCE_ID_CSC_TOKEN` (=000001) — **CSC de produção** da NFC-e. É a peça que falta para a NFC-e valer de verdade. Quando for ativar: colar nos campos **NFC-e — Código CSC** da Central de Notas (já existem desde a 6.0.2), no PC emissor, nunca em commit.
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
| `NFE_NCM_CARTUCHO` / `_TINTA` / `_LOCACAO` | 37079021 / 32151100 / 37079021 | **Melhoria anotada p/ 6.x:** NCM por tipo de item (cartucho ≠ tinta ≠ locação). Hoje temos NCM padrão; evoluir para NCM por categoria + descrição de locação (`NFE_DESCRICAO_LOCACAO` = "CARTUCHO TONER") |
| `NFE_ENQ_IPI_*` | 325 | Enquadramento IPI 325 — aplicar nos itens se IPI for cobrado |
| `NFE_COND_USO_CCE` | texto art. 23 LC 123/2006 | **Candidato a `infCpl`/`infAdFisco` das notas REAIS** (crédito de ICMS do Simples). Reescrever sem o `&amp;quot;` lixo do dump. Entra junto com a fase de produção |
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

1. QR NFC-e: formato v1 vs v2 (do dump: v2) — alinhar antes do 1º teste do modelo 65.
2. CSOSN padrão por operação (Simples) — confirmar com a contabilidade dele qual CSOSN usa em venda dentro/fora do estado (`NFE_TRIB_VENDA_DENTRO` 1 / `_FORA` 2 eram apontadores de tributação no velho).
3. NCM por tipo de item — decidir tela (categoria de produto vs produto individual).
