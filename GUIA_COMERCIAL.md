# GUIA COMERCIAL — vender o DIGICOPY (r59)

Um pacote só serve para todos os clientes. Cada cliente tem a **nuvem própria**
(banco + motor isolados) e recebe **suas atualizações** automaticamente.

```
VENDA = provisionar (cap. 1) → instalar (cap. 2) → setup (cap. 3)
      → conectar (cap. 4) → senha de conexão (cap. 5) → pronto (cap. 6)
```

Tempo por cliente novo: ~20 minutos (a maior parte esperando a nuvem subir).

---

## 0. Requisitos (uma vez só, no seu PC)

- Node instalado + `npx wrangler login` feito (é o mesmo login da sua nuvem).
- Zip novo do sistema (branch da sessão) ou `git pull` com a v7.2.0+.

## 1. Provisionar a nuvem do cliente (no seu PC)

1. Dê dois cliques em **`provisionar_cliente.cmd`**.
2. Digite o apelido (ex.: `padariacentral`) — sem espaço nem acento.
3. Ele cria o banco. **Copie o `database_id`** e cole quando pedir.
4. **Invente o segredo de ativação** do cliente (forte, diferente por cliente)
   e cole quando pedir. **Guarde num caderno** — sem ele, ninguém ativa PC
   novo nessa nuvem, nem você.
5. No final ele mostra o **endereço da nuvem**:
   `https://digicopy-<apelido>.digicopyonline.workers.dev` — anote, vai no setup.

Sua nuvem não é mexida. Cada cliente fica isolado: um nunca vê dado do outro.

## 2. Instalar o sistema no cliente

Vale qualquer formato — **é o mesmo programa para todo mundo**, a diferença
é só o endereço da nuvem digitado no setup:

- **Site:** passe o link oficial para o cliente abrir no navegador.
- **Windows (.exe):** gere no seu PC com `GERAR_EXE.cmd` e instale no dele.
- **Celular (APK):** gere pelo projeto `mobile/` e instale no dele.

> NUNCA mande para o cliente: o zip do código-fonte, este guia, os `.cmd`,
> o segredo de ativação de OUTRO cliente, nem a senha da sua nuvem.

## 3. Setup assistido (você + o cliente, primeira abertura)

Na primeira abertura (base vazia), em vez do login abre o **setup**:

1. **A loja do cliente:** nome, fantasia, CNPJ.
2. **O dono:** nome, login e senha (criados com ele, sem padrão de fábrica).
3. **A nuvem:** cole o endereço do capítulo 1. (Vazio = nuvem oficial.)

Concluir → o sistema recarrega e abre o login normal. O setup nunca mais
aparece (só se apagarem os dados do PC — aí é só refazer com a assistência).

**r59b — aparelho já conectado:** se o navegador já foi conectado na nuvem,
a base vazia abre o **login**, não o setup (o modo SÓ NUVEM recarrega os
dados da nuvem). Canto raro: se o token do aparelho foi revogado na nuvem
E a base local foi apagada, o login abre sem usuários — nesse caso limpe
os dados do site no navegador (apaga o token) e refaça o setup. Corrida
curta: com a base vazia, os usuários chegam da nuvem em ~2–4 s — se o
primeiro login disser "inválido", espere um pouco e tente de novo.

## 4. Conectar o primeiro PC

No painel **Nuvem** → **Primeiro computador**: nome do PC + o **segredo de
ativação** do capítulo 1. Pronto: este vira o PC administrador. PCs seguintes:
**Entrar com CNPJ** (CNPJ + senha de conexão, capítulo 5).

## 5. Senha de conexão (CNPJ) e senha do gerente

No painel **Nuvem** (admin), cartão **"Senhas de conexão (CNPJ) e do Gerente"**:

- **Senha de conexão:** PCs novos entram com CNPJ + ela.
- **Senha do gerente:** abre o Gerente de Atualizações (só com seu CNPJ).

Trocar qualquer uma **desconecta todos os PCs na hora** (efeito de segurança).

## 6. Pronto — o dia a dia do cliente

- **Atualizações:** vêm da SUA nuvem sozinhas (sininho avisa). Para publicar
  uma versão: portal de atualizações no SEU PC principal → publica uma vez →
  todos os clientes recebem (dá até para mandar só para CNPJs escolhidos).
- **Backup:** tela Backups (PC + nuvem do cliente). Antes de qualquer
  manutenção: backup.
- **Suporte:** "Mandar o que quebrou" (no aviso de erro) — o cliente cola
  o pacote no chat e você recebe a prova sem senha nenhuma.
- **Custo da nuvem por cliente:** plano gratuito da Cloudflare aguenta loja
  pequena/média (o medidor do painel mostra o uso). Se um cliente estourar,
  a conta é uma só (a sua) — embuta no preço da mensalidade.

## 7. Perguntas que você vai ouvir

- *"Meus dados ficam onde?"* — No PC dele + na nuvem dele (conta Cloudflare
  do fornecedor). Nem você lê o conteúdo sem o acesso dele.
- *"Troquei de PC, e agora?"* — Instala, abre, conecta com CNPJ + senha de
  conexão: os dados descem da nuvem dele.
- *"Esqueci a senha do usuário"* — Outro admin troca em Configurações →
  Usuários. Se esqueceu a ÚNICA senha de dono: você refaz o acesso com o
  segredo de ativação (cap. 4 num PC novo).
- *"Posso usar sem internet?"* — Sim, o PC trabalha local; sincroniza quando
  a internet voltar.

## 8. Sua loja (a matriz)

Nada muda: seus PCs e navegadores já têm empresa e usuários, então o setup
nunca abre para você. Sua nuvem continua a oficial (endereço vazio = oficial).
Se um dia abrir um navegador zerado na sua loja: preencha o setup com os
dados DIGICOPY, conecte com seu CNPJ + senha de conexão e os dados descem.
