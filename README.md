# DIGICOPY ERP

ERP em desenvolvimento para **vendas, locação e outsourcing de impressoras**.

## Como testar agora

### Pelo navegador / Githack
Abra `index.html` no navegador ou use o link do Githack da branch de trabalho.

Credenciais demo:

- CNPJ: `12.345.678/0001-90`
- Senha CNPJ: `123456`
- Usuário admin: `admin`
- Senha usuário: `admin123`

### Local com Electron

```bash
npm install
npm start
```

### Build futuro do .EXE

```bash
npm run build:win
```

> O build .EXE será finalizado depois que o app estiver validado no Githack e a arquitetura de nuvem/API estiver definida.

## Situação atual

- Login em 2 etapas: CNPJ da empresa + usuário.
- Módulos demo: clientes, produtos, impressoras, contratos, parque instalado, leituras, manutenção/OS, vendas e financeiro.
- Página **Banco antigo (.FDB)** para organizar a migração do Firebird antigo.
- `BANCO.FDB` preservado no repositório como referência do banco antigo.
- Uso atual de `localStorage` para testes rápidos no navegador.

## Próximo objetivo técnico

Para rodar em múltiplos computadores, o app não deve depender de `localStorage`. A próxima fase será:

1. Extrair dados do `BANCO.FDB` em backend/servidor.
2. Normalizar para o novo modelo do ERP.
3. Subir banco central em nuvem (PostgreSQL/Supabase/VPS ou similar).
4. Criar API segura por empresa/CNPJ.
5. Empacotar Electron como `.exe` apontando para a API em nuvem.
