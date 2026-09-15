@echo off
chcp 65001 >nul
cd /d "%~dp0cloudflare-worker"
title DIGICOPY - Troca o endereco da nuvem (gratis, sem nome)
echo ==========================================================
echo  DIGICOPY - Trocar o endereco da nuvem
echo  Novo endereco alvo: digicopyonline.workers.dev
echo  (tira o nome pessoal da URL; NAO perde banco nem arquivos)
echo ==========================================================
echo.
echo Passo 1/2 - Pedindo a troca pra Cloudflare:
call npx wrangler subdomain digicopyonline
echo.
echo Passo 2/2 - Conferindo se o endereco novo responde:
curl -s "https://digicopy-sync-api.digicopyonline.workers.dev/health"
echo.
echo ==========================================================
echo  Se apareceu "ok":true na linha de cima = DEU CERTO.
echo  Se apareceu erro de nome ocupado, tira uma foto e me manda
echo  (eu troco o nome no codigo pra outra opcao em 1 minuto).
echo ==========================================================
echo.
echo  [a janela fica ABERTA pra voce ler - feche no X quando quiser]
cmd /k
