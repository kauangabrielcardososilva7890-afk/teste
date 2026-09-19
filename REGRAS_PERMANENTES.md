# REGRAS PERMANENTES DO DONO (anotadas a pedido dele — reler em TODA tarefa)

Ficheiro criado 18/09/2026 juntando as ordens dele desta sessão e das anteriores. Vale como checklist antes de responder/codar.

## Do jeito de trabalhar
1. **NUNCA concordar sempre.** Ele pode falar coisa que ele mesmo não sabe direito. **Conferir primeiro (no código, nos fatos) se o que ele falou é verdade.** Se estiver errado ou incompleto: dizer, com prova, antes de agir. (Ordem dele, 18/09.)
2. **Um pedido pode puxar outros.** Ele dá o exemplo: modo escuro não é numa parte só — pode ser vários locais e vários arquivos. **Antes de entregar, varrer o efeito nas telas/arquivos relacionados** (foi assim com "estorno pode dar em outros lugares": leitura já voltava editável e já marcava extornado; chamados/orçamentos não têm estorno).
3. **Muitas perguntas (10+).** Quando houver ambiguidade real, perguntar antes em vez de chutar.
4. **Tom direto** nos textos pra ele e pra terceiros (sem condescendência: "a pessoa não é burra, só não acompanha pra onde o projeto anda").
5. **Popup sempre do próprio sistema** (com X). Nunca prompt/confirm nativo do navegador.
6. **Relatórios com DOIS blocos: CORREÇÕES e ADIÇÕES.** Entregas de teste = colar na conversa (nada de .md pra preencher: guia em HTML, relatório em TXT).
7. **Depois de TODA atualização, enviar sempre os links:** o de testar o site + o .zip. (Com o repositório PRIVADO desde 18/09: raw.githubusercontent/githack mortos; os documentos clicáveis moram no site público pages.dev; o .zip do GitHub só abre pra quem está logado na conta.)

## Do produto
8. **Versões:** app sobe só na 3ª casa (6.0.x na linha fiscal; antes 5.26.x). Worker/gerente na régua própria (5.26.x). Ao subir versão: re-ancorar os murais SEM mexer nos carimbos de nascimento; suíte tem que fechar 100% antes do push.
9. **Fiscal:** nada emite nota sozinho (proibido temporizador pra emitir); senha do certificado só na hora, nunca salva; produção só com a palavra PRODUCAO digitada + permissão; tudo auditado em db.logs; homologação primeiro, sempre; selo "NOTA DE TESTE, SEM VALOR FISCAL" em modo teste.
10. **Permissões:** caixas de permissão só Admin/Dono mexem; padrões nunca travam usuário existente (NF padrão desmarcada; apagar/estornar padrão marcado); bloqueio é real nos executores, não só esconder botão; tentativa negada vai pra Auditoria.
11. **Cura de dados:** automática, mas NUNCA chuta — só carimba quando existe EXATAMENTE 1 empresa no banco; 2+ empresas = orientar relogar.
12. **Buscador Escola:** nunca deletar (robô só trabalha com a aba aberta).
13. **Nada de token/senha/segredo em commit** (CSC da NFC-e do dump antigo foi descartado a pedido dele; na ativação ele cola direto na Central).
14. **Mobile APK: PAUSADO.** Não tocar até ele confirmar que pode voltar (ordem de 18/09).
15. **Migração do sistema antigo:** só quando ele mandar; mapa de campos + prévia antes de gravar; arquivos ficam no PC dele (nunca no repositório); inventário das tabelas está em MAPEAMENTO_SISTEMA_ANTIGO.md.
16. **Menu fiscal:** menu de verdade (não flutuante), modais com X; seguir o padrão visual do próprio sistema (claro e escuro).

## Fila dele (não esquecer — só mexer quando ele mandar "faz")
- **Permissões por usuário, o restante:** funcionário sem fiscal e sem Buscador Escola; links de cobrança com cota total/dia configurável no gerente.exe.
- **Migração do outro sistema** (inventário pronto, item 15).
- **NFC-e 65 quando vier o CSC real** (gerado por ele na SEFAZ-MG) → alinhar QR pra v2 (verificação aberta).
- **NCM por tipo de item** (cartucho/tinta/locação — do dump) e **texto do Simples (art. 23 LC 123)** no infCpl das notas reais.
- **Etiquetas folha A4** na grade 7×18 do sistema antigo.
- **Sistemas 3 e 4** do roadmap (gerente já foi; restantes quando ele puxar).

## 17. O que ele PASSA é pra IMPLEMENTAR — a não ser que ele diga "só anotar" (18/09)

Regra dele, textual: "vc ja implementa as coisas que eu vou te passando a não ser que eu falo pra vc so anotar".
Então: chegou pedido/material → implementa na mesma versão. Se ele disser "só anota/
anotar/guarda isso", NÃO implementa — registra por escrito em arquivo do repositório
(foi o caso das fotos do velho: o que chegou está anotado no MAPEAMENTO_SISTEMA_ANTIGO.md).
E na dúvida se chegou ou não chegou, CONFERIR a evidência antes de responder — nunca
chutar de memória.

## 18. Antes de dizer "não tenho / não chegou", VARRER o RELATORIO_SESSAO.md e o histórico (18/09)

CASO REAL: disse a ele que as fotos das telas internas do sistema antigo "nunca chegaram".

ERROU. O catálogo COMPLETO (dezenas de fotos, campo a campo, dias 14-15/09) sempre

esteve escrito no RELATORIO_SESSAO.md — a fase de design foi declarada FECHADA em 15/09.

A memória resumida entre turnos estava com uma linha falsa; a verdade mora nos ARQUIVOS.

Regra: afirmação sobre "o que chegou/não chegou" só depois de grep no RELATORIO_SESSAO.md,

MAPEAMENTO_SISTEMA_ANTIGO.md e git log. Ameaça de "pedir de novo" sem essa varredura = falta grave.
