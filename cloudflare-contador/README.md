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

### 2) Nada para preencher (v5.23.5+)

O `wrangler.jsonc` já chega preenchido de fábrica com o ID da conta e o UUID do
banco `digicopy-erp` do sistema — são identificadores, não segredos. A armadilha
de "esquecer o COLE_AQUI" foi eliminada pela raiz.

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
Pronto: **sem cronômetro** (pedido seu, v5.23.4) — o sistema chama o medidor
sozinho toda vez que você abre a tela de Backup e Nuvem, e o painel "Uso da
nuvem hoje" passa a exibir **"medidor oficial da sua conta Cloudflare — medido
agora"**. Quiser medir fora do sistema, é só abrir esse /v1/medir.

---

## O que ele pode ver/fazer? (transparência)

- O token é **só de leitura**: medidor e lista de bancos. Não grava, não apaga,
  não edita nada da conta.
- Ele fica guardado como **segredo deste worker** (nem o sistema, nem os PCs,
  nem o GitHub enxergam).
- O worker grava na tabela `uso_real` (que ele mesmo cria) e não toca em mais
  nenhuma tabela.
