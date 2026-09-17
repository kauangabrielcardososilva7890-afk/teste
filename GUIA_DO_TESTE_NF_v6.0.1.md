# Guia rápido — Teste do módulo de Nota Fiscal (v6.0.1)

**Contexto:** o sistema ganhou o módulo fiscal. Ele nasce travado em **ambiente de homologação** da SEFAZ-MG — tudo que você emitir sai marcado como teste e não vale fiscalmente. Daí: teste à vontade, sem nenhuma precaução com os dados. O que você precisa cobrir está abaixo, já com os caminhos.

**O que registrar no relatório:** resultado (OK / falhou / não testei), o que apareceu na tela e o número do print (`Win + Shift + S` no Windows). No fim, blocos separados de **correções** e **adições**.

---

## 1. Parte A — navegador (sem certificado)

| # | Teste | Esperado |
|---|---|---|
| A1 | Abrir a tela de login | Rodapé mostrando **v6.0.2** |
| A2 | Menu → **Nota Fiscal** (Geral/Gestão) | Tela em **menu** (não janela flutuante), com placa vermelha no topo: "HOMOLOGAÇÃO — MODO TESTE, SEM VALOR FISCAL" |
| A3 | Clicar **⬆ Habilitar PRODUÇÃO** | Sem permissão: recusa. Com permissão: pede digitar "PRODUCAO" — **cancele** |
| A4 | Revisar **Auditoria** com o dono | Seus acessos e tentativas registrados com data/hora |
| A5 | Menu → **Painel Gerente** | Só números de leitura; nenhum botão de emissão ali |
| A6 | (se houver) ficar **fora** da aba Buscador Escola alguns minutos | Nenhuma atualização escolar automática fora da aba |

## 2. Parte B — app do computador (.exe) + certificado A1

Requisito: abrir o sistema **pelo atalho do computador** (emissão fiscal só existe nele — a SEFAZ exige o A1 no PC) e ter o `.pfx` com a senha.

| # | Teste | Esperado |
|---|---|---|
| B1 | Central NF → importar certificado A1 | Certificado reconhecido + validade visível |
| B2 | Abrir uma venda → **Conferir NF-e** | Tela de conferência; se faltar dado, ele lista o que falta |
| B3 | Na conferência → **Emitir** | Pede a senha do cert → assina → envia → resposta **"Autorizada"** com protocolo; nota aparece no histórico com status verde |
| B4 | Histórico → **DANFE**, depois **XML** | DANFE em A4 com chave, protocolo, itens e marca "SEM VALOR FISCAL"; download do `.xml` na pasta de Downloads |
| B5 | Emitir **a mesma venda de novo** | Recusa e oferece abrir o DANFE da nota já existente |
| B6 | Conferir/emitir venda com **dado fiscal em falta** (o dono prepara) | Bloqueio antes, ou rejeição da SEFAZ com código + motivo — anote os dois por extenso |
| B7 | Histórico → **Cancelar** na nota do B3 (justificativa 15+ letras, senha do cert) | "Cancelamento registrado"; status vira **cancelada**; tentar de novo deve bloquear |
| B8 | Central NF → **Inutilizar faixa** com um número que pulou | Justificativa 15+ letras → resposta "Inutilizada" com protocolo |
| B9 | Botão de ambiente: ver a tela de produção **sem salvar** e voltar | Modo teste retorna com um clique; placa muda de cor; tudo auditado |

## 3. Rejeições e erros — o que anotar

- **Rejeição da SEFAZ:** código (ex.: 275) + motivo completo + horário + qual nota era.
- **Falha de certificado:** print + nome do arquivo `.pfx` usado.
- **Tela congelada:** o que clicou antes, foto e se voltou ao recarregar.
- **Transmissão travada:** tempo de espera e a mensagem final que apareceu.

## 4. Devolução

Entregar ao dono: relatório preenchido + prints. Ele consolida e repassa.
