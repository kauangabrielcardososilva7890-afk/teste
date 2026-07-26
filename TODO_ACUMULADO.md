# TODO ACUMULADO - Aguardando sinal "pode fazer"

> Usuário pediu para NÃO implementar ainda, só acumular até ele disser "pode fazer".

## 1. Logo (pendente original)
- [x] Gerada temporária com IA
- [ ] Substituir por arquivo original exato `image.png` sem IA - usuário reenviou mas plataforma não entregou arquivo raw. Aguardando upload via GitHub web (Add file > Upload logo.png)

## 2. Login
- [x] Login CNPJ + senha CNPJ > Usuário + senha usuário implementado
- [x] Criar usuário exige senha CNPJ
- [x] Auditoria quem criou cada coisa
- [x] Azul escuro #0a1e8a, sem foto perfil, logo no login/sidebar
- [x] CNPJ só na primeira vez (memoriza last CNPJ) - v3.1 patch
- [x] Removida área "Login em 2 etapas / Rastreabilidade" conforme imagem remover.png

## 3. Clientes (do Loom 2 min - com áudio)
- [ ] Campo CNPJ com busca automática: ao digitar CNPJ, fazer busca e preencher dados automaticamente (razão social, endereço, etc)
- [ ] Usar BrasilAPI https://brasilapi.com.br/api/cnpj/v1/{cnpj} ou similar + ViaCEP
- [ ] Manter opção cadastro manual quando não achar
- [ ] Código sequencial do cliente já implementado (1844, 2589 etc) - OK

## 4. Produtos (do Loom)
- [x] Filtros por categoria e referência já existem
- [x] Botão criar novo produto
- [ ] NÃO usar Loja Virtual (já removido) - usuário esclareceu: esquece parte de valores que eu inventei
- [ ] Controle de estoque sempre ativo, não precisa chave (já é sempre ativo, remover qualquer toggle)
- [ ] Seção "Outros" NÃO é para NF, é para dados de EMPRESAS, que vai buscar dali pra fazer PDF da notinha de vendas ou serviços
  - Criar aba/cadastro "Empresas" (dados da empresa emitente da notinha) - CNPJ, razão social, endereço, etc - que será usado no cabeçalho do PDF
  - Hoje PDF usa dados da empresa logada, mas precisa puxar de cadastro dedicado "Empresas"

## 5. Vendas (v3.1 já entregue, mas aguardando validação)
- [x] Cliente: caixa aberta busca por código, nome, CPF/CNPJ, endereço, telefone (implementado em vendas_patch.js)
- [x] Produto: caixa fechada auxiliar Produtos/Itens vs Recarga + caixa aberta busca (implementado)
- [x] Pagamento só aparece ao faturar: opções Dinheiro, PIX à vista, Cartão crédito, Cartão débito, Boleto, A prazo (com data), Conta (transferência) - removido Faturado 14d e Boleto 30d
- [x] A prazo abre campo data vencimento
- [x] Notinha impressão formato Venda 15625 com atendente KAUAN, código cliente, auditoria (implementado imprimirNotinha)
- [ ] Aguardando feedback se vendas está OK ou precisa mais ajustes

## 5b. Vendas e Orçamentos - Loom 2 (https://www.loom.com/share/eeffaff8a19f4920a7c2d205ff5b392b) - 3min - SÓ ANOTADO, NÃO PROGRAMADO
- [ ] Lista vendas: código da venda, data, cliente, valor + detalhes: tipo pagamento, serviço ou venda, usuário (quem criou), situação (aberta, estornada, aprovado e baixa)
- [ ] Botão criar nova venda com busca automática de clientes NÃO finalizados e NÃO com caixa fechada (caixa aberta) - reforça requisito já implementado em v3.1 mas validar
- [ ] Inclusão itens: opções como recarga de tons e vendas de serviços, com divisão entre serviços pendentes e realizados
- [ ] Possibilidade de definir prazo e vencimento (já implementado A prazo com data, mas validar se precisa em serviços também)
- [ ] ORÇAMENTOS: fluxo semelhante a vendas, mas voltado à criação de PDF para envio ao cliente e autorização
  - Orçamento gera PDF para enviar ao cliente
  - Cliente autoriza orçamento -> vira venda?
  - Situações: aberta, aprovado, baixa?

## 5c. Chamados, Contratos e Filtros - Loom 3 FINAL (https://www.loom.com/share/89701555215948df8337d03d92ca9ad1) - 4min - SÓ ANOTADO, NÃO PROGRAMADO - ÚLTIMO
- [ ] **Chamados (menu):** exibir todos chamados já abertos, ficando em **branco quando ainda não resolvidos e em verde quando resolvidos**
- [ ] Botão criar chamado com seleção de: cliente, atribuído (técnico), motivo e equipamento (já buscando as impressoras cadastradas no cliente)
- [ ] Busca chamados com filtros por: nome do cliente (nome e nome fantasia), celular, cidade, endereço e código do cliente, com ordenação por ordem de criação (código)
- [ ] **Contratos e Leituras no Outsourcing:** criação e gestão de leituras por franquia (exemplo 3.000 cópias a R$120,00 e valor adicional por cópia) OU mensal por quantidade
  - Exemplo citado: franquia 3000 cópias a R$120,00 e valor adicional por cópia excedente
  - Ou mensal por quantidade (sem franquia, só valor fixo?)
- [ ] Locação: opções de parcelas para baixa e novas notas de locação mensal
- [ ] Financeiro e Conta: simplificados ao dashboard (usuário disse financeiro e conta são simplificados ao dashboard - não precisa tela complexa?)

## 6. Próximos Loom/videos que usuário vai mandar
- [x] Loom 1 - Clientes e Produtos (2min) - ANOTADO
- [x] Loom 2 - Vendas e Orçamentos PDF (3min) - ANOTADO
- [x] Loom 3 FINAL - Chamados, contratos e filtros (4min) - ANOTADO - ÚLTIMO SEGUNDO USUÁRIO
- [ ] Nenhum mais - usuário disse que esse seria o último

## 7. Dúvidas / Itens para confirmar
- [ ] Confirmar se "Empresas" para PDF notinha é cadastro separado ou usar dados da empresa logada (CNPJ logado)?
- [ ] Confirmar se busca CNPJ cliente deve usar BrasilAPI gratuita ou apenas ViaCEP por CEP?

## 8. Como usuário quer trabalhar para poupar tempo
- [x] Pode gravar Loom mudo só mostrando funções
- [x] Pode gravar Loom com voz
- [x] Vai acumulando requisitos aqui até dizer "pode fazer"
- [ ] Aguardando sinal verde para implementar itens 3 e 4

---
Última atualização: v3.1 - vendas redesign entregue, login primeira vez, logo pendente original
Próxima ação: aguardar usuário dizer "pode fazer"
