# DIGICOPY Cloud API

Worker isolado do aplicativo Electron/web.

## Implantação via GitHub (Cloudflare Builds)

- Build command: deixe vazio
- Deploy command: `npx wrangler deploy --config cloudflare-worker/wrangler.jsonc`
- Production branch: `main` após o PR ser aprovado

O primeiro deploy publica apenas `/` e `/health`. Nenhuma rota altera dados.
O binding D1 `DB`, o esquema, a autenticação e o sync serão adicionados em etapas testadas.

Nunca grave tokens, senhas ou credenciais neste repositório.
