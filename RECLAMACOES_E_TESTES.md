# RECLAMAÇÕES DO DONO → TESTE QUE TRAVA (a lista viva)

**O que é este arquivo:** a ideia **A** ("transformar cada reclamação dele em teste"). Toda vez que o
dono reclamou de alguma coisa e a gente consertou, aquele conserto ganhou uma **trava automática**: se o
defeito voltar, a suíte fica vermelha antes de qualquer um usar o sistema.

**Quem cobra esta lista:** `test_reclamacoes_do_dono.js`. Ele lê a tabela abaixo e **reprova** se:

1. algum teste citado não existir mais no repositório;
2. algum teste citado não estiver registrado no `test_runner.js` (teste que existe mas ninguém roda não
   trava nada);
3. algum arquivo citado na coluna do conserto não existir; ou
4. uma das travas que moram aqui dentro (as linhas marcadas **aqui**) parar de valer.

**Como acrescentar uma reclamação nova:** conserto feito → escreva uma linha com as **palavras dele** (ou
o efeito, se ele só descreveu o sintoma), o que foi corrigido, onde vive a correção e o teste que trava.
Se ainda não existir teste, escreva a trava aqui dentro do `test_reclamacoes_do_dono.js` e marque
**aqui**.

| # | O que ele reclamou | Quando | O que foi corrigido | Onde vive a correção | Teste que trava |
|---|---|---|---|---|---|
| 1 | "o duplo clique nas telas não fazia nada" (5 telas copiaram a linha da tabela de produtos, e a variável da linha não existia) | 23/09 (r5) | cada tabela abre o seu próprio modal | `index.html` | `test_linhas_tabela_clique.js` |
| 2 | "MUDE A VERSÃO PARA V7.0.0 e CONFIRA TODOS OS ARQUIVOS para não dar problema" — e todo link do sistema levava para **código velho** (branch antiga) | 23/09 (r4) | versão igual em todos os arquivos + branch da sessão nos links | `package.json`, `index.html`, `mobile/www/index.html`, `importar.html`, `GUIA_DE_TESTE_NF.html`, `PASSO_A_PASSO_NUVEM_E_SITE.html`, `RELATORIO_DE_TESTE_NF.html` | `test_versao_visual.js`, `test_build_sync.js` + **aqui** |
| 3 | "NADA APARECEU NOS CONTRATOS NOVAMENTE, AS IMPRESSORAS, NADA" | 23/09 (r6/r9) | contrato/impressora não somem; recuperação varre **todos** os excluídos, em levas | `contratos_leituras_definitivo_patch.js`, `cloudflare_data_sync_patch.js` | `test_contrato_impressora_nao_some.js`, `test_recuperar_excluidos.js`, `test_recuperacao_completa.js`, `test_recuperacao_nao_ressuscita.js` |
| 4 | "não sabe o que é instantâneo já aparecer os dados? EU QUERO QUE MOSTRA INSTANTÂNEO SEM NENHUM ERRO" | 23/09 (r8/r9) | canal aberto com a nuvem (`/v1/changes/watch`) avisa o PC no mesmo instante; recuo sozinho para o ritmo de 3 s | `cloudflare_data_sync_patch.js` | `test_nuvem_rapida.js`, `test_cloudflare_data_sync.js` |
| 5 | "a tela ia secando / ficava na frente" | 23/09 (r10) | o defeito era no PC (foco/repintura), não na nuvem | `ajustes_v6108_lembrar_tela_patch.js` | `test_tela_nao_seca.js` |
| 6 | "pq fica voltando, tem como resolver? ... sobe rapidinho e o que foi feito depois demora ... vai subindo aos poucos" | 23/09 (r11) | fila elástica, gravação agrupada do estado, passe rápido na abertura | `cloudflare_data_sync_patch.js` | `test_persist.js`, `test_nuvem_rapida.js` |
| 7 | "os menus não estão ficando lá em cima no NF-e/NFC-e, lá que tem que ficar, e muda esse nome pra ser oficialmente o menu fiscal" | 19/09 (v6.1.0) | faixa viva re-injetada, nome oficial **Menu Fiscal**, os 6 itens sempre em cima | `menu_fiscal_oficial_patch.js`, `submenu_fiscal_oficial_patch.js`, `navegacao_fiscal_barra_escuro_patch.js` | **aqui** |
| 8 | "confira tudo… não está mudando nada, somente o rodapé da versão; o modo escuro é todo bugado" | 19/09 (v6.1.2) | acha o módulo fiscal pelo `onclick` (sobrevive a qualquer repintura) + CSS escuro próprio | `navegacao_fiscal_barra_escuro_patch.js` | **aqui** |
| 9 | "em usuários tem uma caixa que é 'o que são as 3 permissões?', retira isso" | 23/09 (v7.0.1) | o botão não é mais injetado (a explicação continua pronta, sem aparecer) | `permissoes_estorno_venda_patch.js` | **aqui** |
| 10 | "o `erro.txt` do rodapé **não pode voltar**" | 23/09 | o rodapé não tem mais esse botão (dentro do `.exe` o arquivo de erro continua existindo, mas não na cara do dono) | `index.html`, `mobile/www/index.html` | **aqui** |
| 11 | "senha: deixa a mesma, pois eu nunca nem compartilhei esse site direito" + "senha invisível" e a tela que listava usuários não mostrar nada | 23/09 (r7/r9) | senha não é mostrada nem trocada sozinha; a lista de exemplo não revela nada | `login_otimizacao_patch.js`, `ajustes_v5262_login_nuvem_primeiro_patch.js` | `test_login_sem_backdoor.js`, `test_senha_do_dono_manda.js` |
| 12 | "nada salvo no PC/navegador — só nuvem" (e a cópia local só quando a nuvem tem tudo) | 22/09 (v6.1.5, regra 44) | SÓ NUVEM: `saveDB` não grava no PC; cópia local só com `nuvemTemTudo()` confirmando | `cloudflare_data_sync_patch.js` | `test_exe_so_nuvem.js` + **aqui** |
| 13 | "dado que some/volta" (a dor nº 1 dele) | 24/09 (r23/r24) | a gravação entra na fila **no fim do clique**, a fila é gravada na hora, fechar não perde (varredura forçada + `keepalive`) e a fila ficou visível | `cloudflare_data_sync_patch.js` | `test_nuvem_nao_perde.js`, `bench_clique_nuvem.js` |
| 14 | "cada funçãozinha que tinha o sistema é útil, eu vou querer" (paridade) | 24/09 (r17/r18) | mapa de todas as camadas + teste que impede trocar função protegida sem levar a proteção | `mapa_camadas.js`, `MAPA_CAMADAS.md` | `test_camadas_protegidas.js` |
| 15 | senha do certificado A1 não pode ser pedida por `prompt` (regra 16: no `.exe` o `prompt` nativo **lança erro**) | 23/09 | modal do sistema em vez de `alert`/`confirm`/`prompt` | `nf_transmissao_patch.js`, `popup_sistema_patch.js` | `test_confirm_compat.js`, `test_ajustes_v6002.js` + **aqui** |
| 15b | (achada pela trava desta rodada, não por ele) o caminho fiscal ainda caía no `window.confirm` **nativo** quando o modal do sistema não estava disponível — em 2 pontos (nota duplicada e cancelamento em produção) | 24/09 (r25) | trocado por `confirmSistema` (modal do sistema) e, sem ele, **aviso na tela sem diálogo nativo**; no cancelamento em produção o padrão é **não cancelar** | `nf_transmissao_patch.js` | **aqui** |
| 16 | "a numeração estava ancorada em código morto" (a venda/notinha usava função de arquivo antigo) | 24/09 (r19) | a venda/OS/notinha passaram a usar o sistema vivo | `vendas_os_patch.js`, `notinha_patch.js` | **aqui** |
| 17 | venda faturada/estorno: só com permissão, e não pode sumir | 24/09 (r20) | portão de permissões em 11 funções + estorno que não perde a venda | `permissoes_estorno_venda_patch.js`, `ajustes_v5240_relatorio_grande_patch.js` | `test_camadas_protegidas.js`, `test_vos.js` |
| 18 | PIX da venda (valor/QR) tem que sair certo | 24/09 (r20) | PIX EMV com CRC16 (vetor do Banco Central) | `pix_patch.js`, `ajustes_v52219_pix_link_publico_patch.js` | `test_pix.js` |

## Linhas marcadas **aqui**

Estas reclamações **não tinham** teste próprio até a rodada 25 (a 15b foi um defeito **achado** por esta trava, não uma reclamação dele) — a trava delas mora dentro do
`test_reclamacoes_do_dono.js` (que também confere a tabela acima). São as que o dono mais repete quando
voltam: versão/branch errada, menu fiscal, modo escuro, a caixa retirada, o `erro.txt` do rodapé, o
SÓ NUVEM, o "dado que some" e o `prompt` que quebra no `.exe`.

## Reclamações que ainda NÃO têm conserto (ficam registradas, sem promessa)

Nenhuma nesta rodada. O que segue **em aberto** na auditoria (não são reclamações dele, são achados
nossos) está na `AUDITORIA_TECNICA.md` §35.7 e §38.4.
