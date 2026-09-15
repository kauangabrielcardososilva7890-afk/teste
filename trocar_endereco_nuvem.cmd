@echo off
chcp 65001 >nul
cd /d "%~dp0"
title DIGICOPY - Trocar o endereco da nuvem (guia clique a clique)
echo ==========================================================
echo  DIGICOPY - Trocar o endereco da nuvem (sem nome pessoal)
echo  O wrangler novo tirou o comando, entao agora e no painel.
echo  Vou abrir a pagina certa no seu navegador em 5 segundos.
echo ==========================================================
echo.
echo  PASSO A PASSO (leia antes de clicar):
echo.
echo  1) Na pagina que abrir (Workers e Pages), olha a COLUNA DA
echo     DIREITA (a mesma do "Usage"/faturamento).
echo  2) Procura a parte "Your subdomain" (seu subdominio).
echo     Se a coluna estiver cortada, aperta Ctrl e a tecla -
echo     juntos pra dar zoom out ate aparecer.
echo  3) Clica em CHANGE (trocar) ao lado do nome atual.
echo  4) Digita:  digicopyonline
echo  5) Salva/Confirma.
echo  6) Volta aqui: se deu certo, me avisa que o proximo passo
echo     e rodar o atualizar_motor_nuvem.cmd e o GERAR_EXE.cmd.
echo.
echo  Se disser que o nome esta ocupado: tira foto e me manda.
echo ==========================================================
echo.
timeout /t 5 >nul
start "" "https://dash.cloudflare.com/?to=/:account/workers-and-pages"
echo  Pagina aberta no navegador. Boa troca!
cmd /k
