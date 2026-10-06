# Fontes oficiais consultadas — Fiscal/IBS-CBS

**Consulta:** 2 de outubro de 2026. Este arquivo registra apenas fatos externos necessários à auditoria. Não é orientação tributária, nem autorização para emitir em produção.

## 1. Receita Federal — Entenda a Reforma Tributária do Consumo

URL: https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/reforma-tributaria-do-consumo/entenda

A página informa que 2026 é ano de teste e apresenta alíquotas-teste de **0,9% para CBS** e **0,1% para IBS**, compensáveis com PIS/COFINS no período de liquidação, observadas as obrigações acessórias. A página foi atualizada em 03/07/2026. Isso não permite aplicar automaticamente esses percentuais a qualquer item, regime, operação ou documento do Digicopy.

## 2. CGIBS — marco de preenchimento dos campos IBS/CBS

URL: https://www.cgibs.gov.br/novo-marco-da-reforma-tributaria-inicia-em-03-de-agosto-com-preenchimento-obrigatorio-dos-campos-relativos-ao-ibs-e-a-cbs

Publicação de 15/06/2026. A notícia diz que, a partir de 03/08/2026, documentos de empresas do **regime regular** devem conter os campos IBS/CBS e as alíquotas-teste. Também informa que, no período, a apuração é informativa/sem efeitos tributários se as obrigações acessórias forem cumpridas, e menciona flexibilização das regras de validação pelo Ato Conjunto nº 1/2025. A notícia aponta a NT ENCAT 2025.002 v1.40.

## 3. Receita Federal/CGIBS — cronograma por documento e regime

URL: https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/julho/receita-federal-e-comite-gestor-do-ibs-publicam-o-cronograma-de-implementacao-dos-documentos-fiscais-eletronicos-da-reforma-tributaria-do-consumo

Publicação de 31/07/2026 sobre o Ato Conjunto RFB/CGIBS nº 4, de 30/07/2026. O cronograma lista NF-e e NFC-e a partir de 03/08/2026; em linha separada, lista documentos fiscais para contribuintes do **Simples Nacional** a partir de 01/01/2027. As datas de layout são expectativas de publicação, sujeitas a ajustes. Para a configuração concreta da empresa e o fluxo pretendido, confirmar a regra aplicável com contador/legislação vigente — não inferir a partir de uma linha isolada.

## 4. Portal Nacional da NF-e — versões vigentes consultadas em 01/10/2026

Lista oficial de Notas Técnicas: https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=04BIflQt1aY=

Na lista oficial consultada, a atualização mais recente encontrada para o leiaute NF-e/NFC-e da RTC foi **NT 2025.002 v1.52, publicada em 01/10/2026**: https://www.nfe.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=HXPO8VLbh4o=. A v1.52 corrige a RV VC02-50 e posterga, em produção, a RV VC02-14 para 03/11/2026. A mesma NT diferencia CRT=3 (regime normal) dos CRT=1/2/4: na v1.52, as orientações específicas para Simples Nacional, excesso de sublimite e MEI continuam atribuídas a NT futura; a implementação de produção da validação UB12-10 para esses CRT aparece a partir de 04/01/2027. Não extrapolar esse cronograma para emissão real sem confirmar os atos e o regime atual.

O **Informe Técnico 2025.002 v1.70**, publicado em setembro de 2026, substitui as versões anteriores de tabelas de CST-IBS/CBS, cClassTrib e crédito presumido: https://www.nfe.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=h9o7idH%20OcI=. A versão registra atualizações nas tabelas e datas planejadas de implantação em homologação e produção até 16/10/2026; o arquivo consultado não autoriza tratar essas tabelas como permanentes ou como validação contábil automática.

## Consequência para o desenvolvimento desta rodada

- Pode-se auditar telas, estrutura de dados e preenchimento local com valores sintéticos.
- Não hardcodear percentuais/classificações como regra universal, nem marcar configuração fiscal pronta para produção com base apenas nas imagens ou nas fontes acima.
- A auditoria deve comparar implementação/tabelas com NT 2025.002 v1.52 e IT 2025.002 v1.70, e tratar sincronização de tabelas oficiais como requisito versionado, não como certeza sobre o regime da empresa.
- Nenhum teste desta auditoria autoriza transmissão, assinatura, chamada à SEFAZ, acesso à nuvem real ou alteração de dados de produção.


## 5. Verificação adicional do Informe Técnico v1.70 (02/10/2026)

- PDF oficial consultado diretamente: https://www.nfe.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=h9o7idH%20OcI=. O documento extraído é **Informe Técnico 2025.002 — versão 1.70, setembro de 2026** e identifica as tabelas de cClassTrib, CST e crédito presumido; prevê atualização de tabelas em homologação/produção até **16/10/2026**.
- O PDF descreve que cada par CST-IBS/CBS + cClassTrib se associa a dispositivo legal específico da LC 214/2025; a coluna cClassTrib tem seis dígitos e os três primeiros correspondem ao CST. As tabelas são tabelas de domínio mutáveis, não defaults fiscais universais.
- O PDF lista as alíquotas padrão em percentual por ano: 2026 = IBS UF 0,1%, IBS Município 0%, CBS 0,9%; 2027 = IBS UF 0,05%, IBS Município 0,05%, CBS aguarda legislação; 2028 = IBS UF 0,05%, IBS Município 0,05%, CBS aguarda legislação; 2029+ depende de legislação/alíquota de referência. Isto não autoriza autoatribuir 2026 a qualquer CRT/operação/item.
- O índice atual do Portal Nacional consultado (https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=hXzemuyNHW4=) ainda lista v1.60 de 23/06/2026 como vigente, apesar do PDF direto v1.70; a página SVRS (https://dfe-portal.svrs.rs.gov.br/NFe/Documentos) também apresentou material indexado até v1.60 na extração. A página do PDF direto confirma o próprio documento, mas o descompasso do índice foi registrado para revisão/monitoramento.
- O PDF aponta as tabelas online https://dfe-portal.svrs.rs.gov.br/DFE/TabelaClassificacaoTributaria e a Calculadora oficial do consumo. Para este trabalho, as tabelas embutidas no app devem ser versionadas e explicitamente marcadas como pendentes de sincronização v1.70; não declarar conformidade integral, não inventar taxa nem habilitar transmissão real por causa dos campos.
