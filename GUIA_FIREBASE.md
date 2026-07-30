# Guia: como criar a nuvem no Google Firebase (grátis) para o DIGICOPY ERP

A nuvem do sistema já está PRONTA para funcionar com o Firebase (o "Google Cloud"
para aplicativos). Só falta criar o projeto na sua conta Google e colar a
configuração. São ±10 minutos, só cliques, sem instalar nada.

---

## Passo 1 — Criar o projeto

1. Acesse **https://console.firebase.google.com** com a conta Google da empresa.
2. Clique em **"Adicionar projeto"** (ou "Create a project").
3. Nome do projeto: **`digicopy-erp`** (pode ser outro nome).
4. Na etapa do **Google Analytics**: pode **DESATIVAR** (não precisamos) → **Criar projeto**.
5. Aguarde ~30 segundos → **Continuar**.

## Passo 2 — Ativar o banco de dados (Firestore)

1. No menu lateral esquerdo, clique em **Criar ▸ Firestore Database**
   (em inglês: *Build ▸ Firestore Database*).
2. Clique em **"Criar banco de dados"**.
3. **Localização**: escolha **`southamerica-east1` (São Paulo)** → Avançar.
4. ⚠️ **IMPORTANTE:** escolha **"Iniciar no modo de teste"** (*Start in test mode*) → **Ativar**.

## Passo 3 — Registrar o app e copiar a configuração

1. Clique na **engrenagem ⚙️** (canto superior esquerdo) → **"Configurações do projeto"**.
2. Na aba **"Geral"**, role até **"Seus aplicativos"** e clique no ícone **`</>`** (Web).
3. Apelido do app: **`digicopy-erp`** → **NÃO** marque "Firebase Hosting" → **Registrar app**.
4. O Google mostra um código parecido com este:

```js
const firebaseConfig = {
  apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "digicopy-erp.firebaseapp.com",
  projectId: "digicopy-erp",
  storageBucket: "digicopy-erp.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

5. **Copie esse bloco inteiro.** Só precisamos de `apiKey` e `projectId`.

## Passo 4 — Colocar a configuração no sistema

**Opção A (recomendada):** mande o bloco copiado aqui para mim no chat que eu
instalo e publico a versão nova.

**Opção B (você mesmo):** abra o arquivo **`firebase_config.js`** (na pasta do
sistema) e troque os textos `"COLE_AQUI_..."` pelos seus valores:

```js
window.FIREBASE_CONFIG = {
  apiKey:    "AIzaSyB...(a sua)",       // ← cole a apiKey
  projectId: "digicopy-erp",            // ← cole o projectId
  ...
};
```

## Passo 5 — Primeira sincronização (importante!)

1. Abra o sistema **em UM computador só** (de preferência o que tem os dados
   completos, onde você importou os JSONs do sistema antigo).
2. Vá em **Configurações → Nuvem → Enviar para nuvem**. A **primeira** vez
   envia tudo (pode levar alguns minutos); depois disso só sobem as alterações.
3. Terminou? Aí sim abra nos **outros computadores** e use **Carregar da nuvem**.

## Passo 6 (recomendado) — Segurança definitiva, sem expiração

O "modo de teste" expira em 30 dias. Para nunca precisar se preocupar com isso:

1. No console do Firebase: **Criar ▸ Authentication** → **Começar** → aba
   **"Método de login"** → **"Anônimo"** → **Ativar** → Salvar.
   (O sistema passa a fazer login sozinho, você não vê nenhuma tela extra.)
2. Depois: **Firestore Database ▸ Regras**, apague o que estiver lá e cole:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /app_state/{doc} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Clique em **Publicar**. Pronto: só o seu sistema (com o login automático)
   consegue ler/gravar a nuvem, e a regra **não expira nunca** — diferente do
   modo de teste.

---

## Perguntas frequentes

**É grátis mesmo?** Sim. O plano "Spark" do Firebase não cobra nada e dá
1 GB de dados guardados + 50 mil leituras e 20 mil gravações por dia. Com o
envio incremental (só o que muda), isso é muito mais que suficiente para o uso
da loja.

**O "modo de teste" expira?** O Firebase avisa por e-mail que a regra de teste
expira em 30 dias. Antes de expirar é só voltar em **Firestore Database ▸
Regras** e republicar as regras (me chame que eu ajusto para uma regra definitiva).

**E o Supabase?** Continua funcionando! Se o `firebase_config.js` não estiver
preenchido, o sistema usa o Supabase automaticamente. Dá para mudar de ideia
quando quiser: configure o Firebase, faça 1 envio completo e pronto.

**Meus dados ficam no Google?** Ficam nos servidores do Google em São Paulo,
na sua conta — ninguém mais tem acesso (a chave apiKey só identifica o projeto,
como funciona em todo aplicativo).

---

✅ **Resumo das etapas:** criar projeto → ativar Firestore em modo de teste
(São Paulo) → registrar app web `</>` → copiar o firebaseConfig → me enviar
ou colar no `firebase_config.js` → enviar a base 1x de um PC só → usar nos demais.
