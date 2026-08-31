# Gerar o .exe — guia definitivo

**Versão atual:** v5.22.63

Este documento existe por causa de um problema recorrente: **gerar o `.exe` e o
sistema abrir sem as atualizações novas**. A causa foi encontrada e corrigida.
Leia a seção 1 para entender e a seção 2 para o uso no dia a dia.

---

## 1. Por que faltavam arquivos no `.exe`

O `.exe` não leva a pasta inteira do projeto. O `electron-builder` copia
**apenas** o que estiver listado em `package.json > build.files`. Tudo que não
estivesse nessa lista simplesmente **não ia para dentro do instalador** — e sem
nenhuma mensagem de erro.

Até a v5.22.62, cada atualização nova exigia **quatro edições manuais**:

| # | Lugar | Se esquecer... |
|---|-------|----------------|
| 1 | `bundle-manifest.json` | o código não entra no `app.bundle.js` |
| 2 | `index.html` (tag `<script>` + `?v=`) | o navegador não carrega / usa cache velho |
| 3 | `package.json > build.files` | **o arquivo não é copiado para o `.exe`** |
| 4 | `package.json > scripts.check` | a sintaxe do arquivo deixa de ser validada |

Esquecer o item 3 era o caso mais comum e o mais silencioso: o rodapé mostrava a
versão nova, mas o comportamento continuava o antigo.

Havia ainda um **segundo problema, de cache**: o Electron só limpava o cache
quando o *número* da versão mudava. Gerando um `.exe` novo com o mesmo número
(ex.: corrigir algo e reempacotar como 5.22.62), o sistema continuava executando
o código antigo guardado em `%APPDATA%\digicopy-erp\Cache`.

E o mesmo padrão afetava o **APK**: o `mobile/sync-www.js` tinha uma lista fixa
que não incluía os patches soltos — o app do celular saía com **14 scripts
dando 404**.

---

## 2. Como gerar o `.exe` agora

```bash
npm run build:win
```

Só isso. O comando executa, em ordem:

```
clean_dist.js  →  sync_build.js  →  build_bundle.js  →  electron-builder  →  verify_pack.js
   limpa dist     sincroniza tudo    gera o bundle       empacota            confere o pacote
```

Se qualquer arquivo faltar, **o build falha** em vez de gerar um instalador
incompleto. O instalador sai em `dist/Sistema-Digicopy-Setup-<versão>.exe`.

No final aparece o raio-X do que foi empacotado:

```
══ RAIO-X DO .EXE ══════════════════════════════════════════
  pasta.......: dist/win-unpacked/resources/app
  versão......: 5.22.63
  arquivos....: 32
  tamanho.....: 4.0 MB
  bundle......: 2.83 MB, digital a9a7b28bf0491a20
════════════════════════════════════════════════════════════

✔ Instalador completo: tudo que o sistema precisa foi empacotado.
```

---

## 3. Como adicionar uma atualização nova

Agora são **2 passos** em vez de 4:

1. Criar o arquivo `ajustes_vXXXXX_algumacoisa_patch.js`.
2. Adicionar o nome dele em `bundle-manifest.json`.

Se o patch também precisar ser carregado solto (fora do bundle), acrescente a
tag no fim do `index.html` — o `?v=` pode ser qualquer coisa, o sync corrige.

Depois:

```bash
npm run sync    # carimba a versão e atualiza build.files + scripts.check
npm run bundle  # regenera o app.bundle.js
npm test        # 116 suítes
```

O `npm run sync` faz sozinho:

- carimba a versão do `package.json` no `index.html` (variável
  `DIGICOPY_APP_VERSION`, `<title>`, rodapé e **todos** os `?v=`);
- reconstrói `build.files` a partir do que o `index.html` realmente carrega;
- reconstrói `scripts.check` a partir do `bundle-manifest.json`;
- **falha** se o `index.html` apontar para um arquivo que não existe.

> Ao subir a versão (ex.: 5.22.63 → 5.22.64), basta alterar `version` no
> `package.json` e rodar `npm run sync`. Não edite versão à mão no `index.html`.

---

## 4. Comandos

| Comando | O que faz |
|---------|-----------|
| `npm run build:win` | gera o `.exe` completo e verificado |
| `npm run sync` | sincroniza versão, `build.files` e `scripts.check` |
| `npm run sync:check` | só verifica; sai com erro se estiver dessincronizado |
| `npm run bundle` | regenera o `app.bundle.js` |
| `npm run check` | valida a sintaxe de todos os arquivos do bundle |
| `npm run verify:exe` | roda o raio-X num `dist/` já gerado |
|  `npm test` | suíte completa |

---

## 5. O que o `verify_pack.js` detecta

Ele abre `dist/win-unpacked/resources/app` (o build usa `asar: false`) e falha se:

- algum arquivo de `build.files` não chegou lá dentro;
- o `app.bundle.js` empacotado tiver **sha256 diferente** do projeto — ou seja,
  o código novo não foi junto;
- o `index.html` empacotado não estiver na versão do `package.json`;
- o `index.html` carregar algum recurso que não foi copiado (tela quebrada).

Também avisa se alguma dependência de produção (`node-firebird`, `node-forge`)
não apareceu em `node_modules` do pacote.

---

## 6. Cache: por que agora atualiza de verdade

O `main.js` calcula uma **impressão digital** do código empacotado, lendo o
`sha256` que o `build_bundle.js` grava no cabeçalho do `app.bundle.js`:

```js
const APP_FINGERPRINT = versao + '|' + sha256DoBundle;
```

Essa digital é guardada em `%APPDATA%\digicopy-erp\app-version.txt`. Quando ela
muda, o app apaga `Cache`, `Code Cache`, `GPUCache` e `Service Worker` antes de
abrir a janela.

Resultado: **qualquer** mudança de código força a limpeza do cache — mesmo
reempacotando com o mesmo número de versão.

---

## 7. Se ainda parecer desatualizado

1. Confirme o rodapé: ele mostra a versão realmente carregada.
2. Compare a digital: a `digital` do raio-X deve bater com o cabeçalho da primeira
   linha de `app.bundle.js`.
3. Desinstale a versão anterior antes de instalar (o NSIS está com
   `oneClick: false` e permite escolher a pasta — instalar em pasta diferente da
   antiga deixa dois sistemas no PC e o atalho velho abre o antigo).
4. Em último caso, apague `%APPDATA%\digicopy-erp\Cache` — mas **nunca** os
   dados: faça Backup antes.

---

## 8. Arquivos desta correção

| Arquivo | Papel |
|---------|-------|
| `sync_build.js` | gera `index.html` versionado, `build.files` e `scripts.check` |
| `verify_pack.js` | raio-X do pacote gerado; falha o build se faltar algo |
| `main.js` | cache invalidado pela digital sha256 do bundle |
| `mobile/sync-www.js` | APK copia tudo que o `index.html` carrega |
| `ajustes_v52263_exe_completo_patch.js` | marcador de versão no runtime |
| `test_build_sync.js` | trava regressões no empacotamento |
| `test_ajustes_v52263.js` | teste da v5.22.63 |
