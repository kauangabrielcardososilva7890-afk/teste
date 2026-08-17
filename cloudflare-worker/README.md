# DIGICOPY Cloud API

API local-first isolada do aplicativo Electron/web.

## Implantação via GitHub (Cloudflare Builds)

- Root directory: `cloudflare-worker`
- Build command: deixe vazio
- Deploy command: `npm run deploy` (aplica migrações pendentes e só depois publica)
- Production branch durante o desenvolvimento: `arena/01a00cfb-teste`
- Production branch após aprovação do PR: `main`

## Banco D1

Binding: `DB`

Banco: `digicopy-erp`

Migrações versionadas ficam em `migrations/`. Para aplicar remotamente:

```bash
npx wrangler d1 migrations apply DB --remote
```

## Segurança

- `SETUP_SECRET` deve ser criado como **Secret** no painel da Cloudflare.
- Nunca grave tokens, senhas ou credenciais neste repositório.
- O token de cada aparelho é armazenado no D1 somente como SHA-256.
- Códigos para novos aparelhos têm uso único e expiram.

## Rotas

- `GET /health` — integridade da API e versão do esquema
- `POST /v1/setup` — cadastra o primeiro aparelho admin
- `POST /v1/recover` — recupera acesso admin sem alterar dados de negócio
- `POST /v1/invites` — admin gera convite temporário para aparelho ou outro admin
- `POST /v1/enroll` — autoriza outro aparelho
- `POST /v1/changes` — envia lote incremental idempotente
- `GET /v1/changes?cursor=N` — recebe somente novidades
- `GET /v1/deleted` — admin lista exclusões recuperáveis
- `POST /v1/restore` — admin restaura sem recriar manualmente
- `GET /v1/devices` — admin lista aparelhos e último acesso
- `POST /v1/devices/revoke` — admin bloqueia um aparelho sem apagar dados
- `GET /v1/status` — diagnóstico autenticado

Nenhuma rota substitui a base inteira.
