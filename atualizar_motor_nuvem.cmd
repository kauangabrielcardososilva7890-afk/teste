@echo off
chcp 65001 >nul
title DIGICOPY - Atualizar o motor da nuvem (migracoes + publicacao)
echo ==========================================================
echo  DIGICOPY - Atualizar o motor da nuvem
echo  Faz os DOIS passos na ordem certa:
echo   1) aplica as migracoes do banco (economia de gravacao)
echo   2) publica o motor novo
echo ==========================================================
echo.
cd /d "%~dp0cloudflare-worker"
if errorlevel 1 (
  echo NAO ACHEI a pasta cloudflare-worker aqui do lado.
  echo Rode este arquivo dentro da pasta do sistema, por favor.
  pause
  exit /b 1
)
echo Passo 1/4 - O que ainda falta aplicar no banco (so olhando):
echo.
call npx.cmd wrangler d1 migrations list DB --remote
echo.
echo Passo 2/4 - Aplicando as migracoes
echo (se perguntar "Proceed? (y/n)", responde y):
echo.
call npx.cmd wrangler d1 migrations apply DB --remote
if errorlevel 1 (
  echo.
  echo Algo travou nas migracoes. Tira uma foto e me manda.
  pause
  exit /b 1
)
echo.
echo Passo 3/4 - Publicando o motor da nuvem:
echo.
call npx.cmd wrangler deploy
if errorlevel 1 (
  echo.
  echo Algo travou na publicacao. Tira uma foto e me manda.
  pause
  exit /b 1
)
echo.
echo Passo 4/4 - Qual versao ficou no ar AGORA:
echo.
curl -s "https://digicopy-sync-api.kauangabrielcardososilva7890.workers.dev/health"
echo.
echo.
echo ^(Tem que aparecer "versao":"5.24.8" ou mais novo na linha de cima.^)
echo ==========================================================
echo  Pronto! Tira uma foto desta tela e me manda.
echo ==========================================================
pause
