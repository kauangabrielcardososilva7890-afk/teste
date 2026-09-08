# 📊 digicopy-contador-uso — o medidor oficial da nuvem (configura UMA vez)

Este é o "index separado" que você pediu: um segundo worker minúsculo. Ele lê o
medidor **oficial** da Cloudflare (o mesmo número que aparece no painel dela) e
grava no próprio D1 (tabela `uso_real`). A partir daí, **todos os PCs** do
sistema leem esse número junto com os dados normais — sem token no sistema,
sem senha espalhada, e sem precisar abrir o painel da Cloudflare.

Se você **não** fizer esses passos, o sistema continua funcionando normal com a
contagem estimada. Este worker só deixa a medida exata/oficial.

---

## Passo a passo (uma vez só, ~5 min)

### 1) Criar o token só de leitura (2 cliques, grátis)

1. Abra: <https://dash.cloudflare.com/profile/api-tokens>
2. **Create Token** → lá embaixo "**Custom token**" → **Get started**
3. Preencha:
   - **Token name:** `digicopy-contador-uso`
   - **Permissions:** 1.ª linha: `Account` → `Account Analytics` → `Read`
   - **Permissions:** 2.ª linha (+ Add more): `Account` → `D1` → `Read`
4. **Continue to summary** → **Create Token** → **copie** o token (só aparece uma vez).

### 2) Achar o ID da conta e o UUID do banco

Ainda logado na Cloudflare, rode dentro desta pasta:

```
npx wrangler login        (se ainda não estiver logado)
npx wrangler d1 list
```

- O wrangler mostra o **uuid** do banco `digicopy-erp` → cole em `wrangler.jsonc`
  no lugar de `COLE_AQUI_O_UUID_DO_D1`.
- O **ID da conta** aparece na barra lateral direita do painel da Cloudflare
  (página inicial de Workers & Pages, "Account ID") → cole no lugar de
  `COLE_AQUI_O_ID_DA_SUA_CONTA`.

### 3) Guardar o token como segredo e subir

```
npx wrangler secret put CF_API_TOKEN      (cola o token e dá Enter)
npx wrangler deploy
```

### 4) Testar na hora (opcional mas gostoso)

Abra no navegador:

```
https://digicopy-contador-uso.<SEU-SUBDOMINIO>.workers.dev/v1/medir
```

Tem que aparecer `{"ok":true,"uso":{"leituras":...,"escritas":...}}`.
Pronto: de 15 em 15 minutos ele mede sozinho, e o painel "Uso da nuvem hoje"
do sistema passa a exibir **"medidor oficial da sua conta Cloudflare"**.

---

## O que ele pode ver/fazer? (transparência)

- O token é **só de leitura**: medidor e lista de bancos. Não grava, não apaga,
  não edita nada da conta.
- Ele fica guardado como **segredo deste worker** (nem o sistema, nem os PCs,
  nem o GitHub enxergam).
- O worker grava na tabela `uso_real` (que ele mesmo cria) e não toca em mais
  nenhuma tabela.
