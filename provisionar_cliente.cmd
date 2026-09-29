@echo off
chcp 65001 >nul
title DIGICOPY - Criar a nuvem de um cliente novo
echo ==========================================================
echo  DIGICOPY - Nuvem nova para CLIENTE (r59 comercial)
echo.
echo  Cria um banco + um motor PROPRIOS do cliente, isolados.
echo  A SUA nuvem (loja DIGICOPY) nao e mexida em nada.
echo ==========================================================
echo.
cd /d "%~dp0cloudflare-worker"
if errorlevel 1 (
  echo NAO ACHEI a pasta cloudflare-worker aqui do lado.
  echo Rode este arquivo dentro da pasta do sistema, por favor.
  echo  [a janela fica ABERTA pra voce ler e copiar a vontade - feche no X quando quiser]
  cmd /k
  exit /b 1
)
if not exist "wrangler.cliente.modelo.jsonc" (
  echo FALTA o arquivo wrangler.cliente.modelo.jsonc nesta pasta.
  echo Baixe o zip novo do sistema e tente de novo.
  cmd /k
  exit /b 1
)
echo Digite um apelido curto para o cliente, so letra minuscula e numero,
echo sem espaco nem acento. Exemplo: padaria-central vira padariacentral
echo.
set /p SLUG=Apelido:
if "%SLUG%"=="" (
  echo Sem apelido nao tem como continuar. Feche no X e comece de novo.
  cmd /k
  exit /b 1
)
set NOME=digicopy-%SLUG%
set CFG=wrangler.cliente-%SLUG%.jsonc
if exist "%CFG%" (
  echo.
  echo Esse cliente JA TEM nuvem criada nesta pasta (%CFG%).
  echo Se quer recriar do zero, apague esse arquivo e rode de novo.
  cmd /k
  exit /b 1
)
echo.
echo Vai criar: banco %NOME% + motor %NOME%
echo.
pause
echo.
echo Passo 1/6 - Criando o banco do cliente:
echo.
call npx.cmd wrangler d1 create %NOME%
if errorlevel 1 (
  echo.
  echo Algo travou criando o banco. Tira uma foto e me manda.
  cmd /k
  exit /b 1
)
echo.
echo COPIE o database_id que apareceu la em cima (o codigo entre aspas)
echo e COLE aqui embaixo:
echo.
set /p DBID=database_id:
if "%DBID%"=="" (
  echo Sem o database_id nao tem como continuar. Rode de novo.
  cmd /k
  exit /b 1
)
powershell -NoProfile -Command "(Get-Content 'wrangler.cliente.modelo.jsonc' -Raw) -replace '__NOME__','%NOME%' -replace '__DBID__','%DBID%' | Set-Content '%CFG%' -Encoding UTF8"
echo Configuracao salva em %CFG%
echo.
echo Passo 2/6 - Segredo de ativacao (SETUP_SECRET) do cliente:
echo Invente uma senha FORTE e DIFERENTE por cliente (ex: 3 palavras + numeros).
echo GUARDE num caderno: sem ela ninguem ativa PC novo nessa nuvem.
echo Vai abrir a pergunta do wrangler. Cole a senha la e de Enter.
echo.
pause
call npx.cmd wrangler secret put SETUP_SECRET --config %CFG%
if errorlevel 1 (
  echo.
  echo Algo travou no segredo. Pode rodar de novo o passo 2 sozinho depois.
  cmd /k
  exit /b 1
)
echo.
echo Passo 3/6 - O que falta aplicar no banco (so olhando):
echo.
call npx.cmd wrangler d1 migrations list DB --remote --config %CFG%
echo.
echo Passo 4/6 - Aplicando as migracoes no banco do cliente:
echo (se perguntar "Proceed? (y/n)", responde y)
echo.
call npx.cmd wrangler d1 migrations apply DB --remote --config %CFG%
if errorlevel 1 (
  echo.
  echo Algo travou nas migracoes. Tira uma foto e me manda.
  cmd /k
  exit /b 1
)
echo.
echo Passo 5/6 - Publicando o motor do cliente:
echo.
call npx.cmd wrangler deploy --config %CFG%
if errorlevel 1 (
  echo.
  echo Algo travou na publicacao. Tira uma foto e me manda.
  cmd /k
  exit /b 1
)
echo.
echo Passo 6/6 - Conferindo se a nuvem do cliente responde:
echo.
curl -s "https://%NOME%.digicopyonline.workers.dev/health"
echo.
echo.
echo (Tem que aparecer "ok":true e "ready":true na linha de cima.)
echo.
echo ==========================================================
echo  PRONTO! Anote e guarde com o cliente:
echo.
echo  Endereco da nuvem (vai no SETUP do sistema):
echo    https://%NOME%.digicopyonline.workers.dev
echo.
echo  Segredo de ativacao: o que voce inventou no passo 2.
echo.
echo  Proximo passo: GUIA_COMERCIAL.md, capitulo 2 (instalar no cliente).
echo ==========================================================
echo.
echo  [a janela fica ABERTA pra voce ler e copiar a vontade - feche no X quando quiser]
cmd /k
