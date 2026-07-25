# DIGICOPY ERP v3.0 — Sistema Completo com Login 2 Etapas

> **Login CNPJ + Senha CNPJ > Login Usuário + Senha Usuário** — com auditoria completa de quem criou cada registro.
> Cor oficial: Azul escuro da logo **#0a1e8a** — Interface totalmente diferente do SisPrinter (exemplo enviado).
> Sem foto de perfil, sem Loja Virtual.

![Logo DIGICOPY](./logo.png)

### Novidades v3.0 (pedido do usuário)

#### 1. Login em 2 etapas
- **Etapa 1 - CNPJ:** Valida empresa (CNPJ + Senha CNPJ)
  - Demo: CNPJ `12.345.678/0001-90` Senha CNPJ `123456`
  - Permite cadastrar nova empresa (CNPJ + senha CNPJ) direto na tela de login
- **Etapa 2 - Usuário:** Login pessoal vinculado àquele CNPJ
  - Demo usuários (todos do CNPJ demo):
    - `admin / admin123` - Admin
    - `carlos / 123456` - Técnico
    - `ana / 123456` - Comercial
    - `financeiro / 123456` - Financeiro

#### 2. Criar login com autorização CNPJ
Ao criar novo usuário em **Usuários & Acessos**, o sistema exige:
```
Senha CNPJ obrigatória - campo "Senha CNPJ para autorizar criação"
```
Só cria se a senha CNPJ informada bater com a senha cadastrada da empresa. Isso garante que só quem tem a senha mestra da empresa pode criar logins.

#### 3. Auditoria — Quem fez cada coisa
- Todo registro salva: `criadoPor`, `criadoPorNome`, `criadoEm`, `atualizadoPor`
- Logs em tabela `logs`:
  - `dataHora, empresaId, usuarioId, usuarioNome, usuarioLogin, entidade, ação, entidadeId, detalhes`
- **Onde aparece:**
  - Tabelas: linha "Criado por X em DD/MM"
  - Dashboard: "Auditoria recente" lista quem fez o quê
  - Nova página **Usuários** e **Auditoria** dedicadas
  - Vendas detail mostra "por Ana"
  - Leituras mostra "por Carlos"
  - Contratos, Parque, Produtos, Equipamentos — tudo com "por Nome"
  - Relatórios com coluna "Criado por"
  - Financeiro mostra "por Financeiro"
  - Logs filtráveis por entidade (cliente, produto, contrato, leitura, OS, venda, financeiro, auth, usuário)

#### 4. Cor azul escuro da logo
- Fundo da logo: `#0a1e8a` (azul marinho escuro)
- Todo tema migrado de `indigo-600` para `#0a1e8a` via CSS override
- Sidebar: `#060e2f` quase preto azulado, header logo com fundo `#0a1e8a`
- Login: background radial `radial-gradient(#1a2bbf, #0a1e8a, #070f4d)` — NADA parecido com SisPrinter (que é azul claro #2196F3)
- Layout próprio: sidebar escura + cards arredondados 20px + sem foto perfil (apenas iniciais em círculo azul escuro)

#### 5. Sem foto de perfil
- Removido todos `pravatar`, imagens externas
- Avatar = círculo com iniciais do nome em `#0a1e8a` com borda

#### 6. Logo oficial
- `logo.png` incluso no repo e usado no login e sidebar

### Módulos (mantidos e melhorados)

- **Dashboard:** KPIs filtrados por empresa logada, auditoria hoje
- **Clientes, Produtos, Impressoras, Contratos, Parque, Leituras, Manutenção/OS, Vendas, Financeiro** — todos filtrados por `empresaId` (multi-empresa pronto)
- **Usuários & Acessos:** lista usuários do CNPJ, criação com senha CNPJ, contagem por perfil
- **Auditoria:** tabela 100 últimos logs filtrável por entidade e busca por usuário/ação

### Como testar v3.0

1. Abra `index.html` (ou link raw.githack)
2. **Tela 1 CNPJ:** Digite `12.345.678/0001-90` + `123456` > Validar empresa
3. **Tela 2 Usuário:** Digite `admin` + `admin123` > Entrar
4. Veja topo: mostra `DIGICOPY • Kauan Gabriel (Admin)` e `12.345.678/0001-90`
5. Crie um cliente novo > verifique que na lista aparece "Criado por Admin"
6. Vá em Usuários > Novo usuário > preencha e no campo "Senha CNPJ" digite `123456` (senha CNPJ) para autorizar
7. Crie uma venda como `ana` (logoff > login ana/123456) > veja que venda mostra "por Ana Souza" e log em Auditoria registra `ana criou venda`
8. Auditoria > filtre por "venda" para ver quem criou o quê

### Estrutura
```
index.html — login 2 etapas + shell ERP v3 azul escuro + logo
app.js — 178KB: DB empresas/usuarios/logs + auth + templates + CRUD auditado + filtro empresaId
logo.png — logo oficial DIGICOPY CARTUCHOS E IMPRESSORAS
```

### Stack
- Vanilla JS + Tailwind CDN + Phosphor Icons + Chart.js
- localStorage chaves: `digicopy_erp_v30` (DB) e `digicopy_session_v30` (sessão)
- Multi-empresa: `empresaId` em todos os registros

### Próximos passos sugeridos
- Hash bcrypt para senhas
- JWT backend
- Permissões por perfil (Admin vê tudo, Técnico só OS, etc.)
- Expiração sessão 8h

---
© 2026 DIGICOPY - Azul escuro oficial #0a1e8a - Sem Loja Virtual
