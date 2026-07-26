# TODO ACUMULADO - IMPLEMENTADO v3.2

> Usuário disse "Agora faça as alterações que pedi pra você anotar" - Implementado em v3.2

## 1. Logo
- [x] Original exata 12KB com ARTUCHOS E IMPRESSORAS - substituída via upload GitHub (commits 05bf025, df9d5a4)

## 2. Login
- [x] Login CNPJ + senha CNPJ > Usuário + senha usuário
- [x] Criar usuário exige senha CNPJ
- [x] Auditoria quem criou cada coisa
- [x] Azul escuro #0a1e8a, sem foto perfil
- [x] CNPJ só na primeira vez (memoriza last CNPJ)
- [x] Removida área Login em 2 etapas / Rastreabilidade

## 3. Clientes - Loom 1
- [x] Campo CNPJ com busca automática BrasilAPI preenchendo razão social, endereço, cidade, UF, CEP, telefone, email
- [x] Código sequencial cliente (1844, 2589 etc)

## 4. Produtos / Empresas
- [x] Filtros categoria e referência
- [x] Empresas para PDF notinha - nova tela Empresas (PDF) - cadastro completo CNPJ, razão, fantasia, logradouro, número, bairro, município, UF, CEP, telefone - botão Usar na Notinha

## 5. Vendas / Vendas Patch
- [x] Cliente caixa aberta busca por código, nome, CPF/CNPJ, endereço, telefone
- [x] Produto caixa fechada Produtos/Itens vs Recarga + caixa aberta busca
- [x] Pagamento só ao faturar: Dinheiro, PIX à vista, Cartão crédito, Cartão débito, Boleto, A prazo (com data), Conta transferencia
- [x] Notinha impressão formato Venda 15625
- [x] Lista vendas detalhada: código, data, cliente, valor, tipo pagamento, serviço ou venda, usuário, situação aberta/estornada/aprovado/baixa

## 5b/5c. Vendas e Orçamentos / Chamados Loom 2 e 3 FINAL
- [x] Vendas: busca automatica clientes não finalizados, recarga tons, serviços pendentes/realizados, prazo vencimento
- [x] Orçamentos: fluxo semelhante vendas, PDF para envio cliente e autorização (gerarOrcamentoPDF, aprovar)
- [x] Chamados: branco não resolvido verde resolvido, criar com cliente/atribuído/motivo/equipamento buscando impressoras do cliente, filtros nome fantasia/celular/cidade/endereço/código ordem criação
- [x] Contratos leituras franquia exemplo 3000 cópias R$120 + excedente ou mensal por quantidade
- [x] Parcelas baixa notas locação mensal (parcial via vencimento A prazo)
- [x] Financeiro conta simplificado ao dashboard (mantido)

## Próximos passos
- Aguardar teste do usuário em https://raw.githack.com/kauangabrielcardososilva7890-afk/teste/arena/019f9aff-teste/index.html
- CNPJ: 12.345.678/0001-90 / 123456 > admin / admin123

