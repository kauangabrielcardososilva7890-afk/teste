@echo off
chcp 65001 >nul
if /i "%~1"=="interno" goto :dentro
start "DIGICOPY - Gerar o Gerente de Atualizacoes" cmd /k "%~f0" interno
exit /b
:dentro
cd /d "%~dp0"
title DIGICOPY - Gerar o Gerente de Atualizacoes (esta janela NAO fecha sozinha)
echo ==========================================================
echo  DIGICOPY - Gerar o GERENTE DE ATUALIZACOES
echo  v5.26.1 - corrigido o erro do instalador (artworkUrl)
echo  Este e o programa SEPARADO que fica so no SEU PC.
echo  Passo 1: instala as pecas. Passo 2: libera o electron.
echo  Passo 3: monta o instalador.
echo  ESTA JANELA NUNCA FECHA SOZINHA - fecha so no X.
echo ==========================================================
echo.
echo Passo 1/3 - Instalando as pecas (pode demorar na primeira vez):
call npm install
echo.
echo Passo 2/3 - Liberando o electron (o npm do seu PC pode barrar a peca):
call npm install-scripts approve electron >nul 2>nul
call npm rebuild electron >nul 2>nul
call node node_modules\electron\install.js >nul 2>nul
echo.
echo Passo 3/3 - Montando o instalador:
call npm run build:win
echo.
if exist dist\*.exe goto :sucesso
echo ==========================================================
echo  ATENCAO: nao achei .exe na pasta dist.
echo  Tira uma foto desta tela e me manda.
echo ==========================================================
goto :fim
:sucesso
echo ==========================================================
echo  PRONTO! O instalador do GERENTE esta na pasta DIST ao lado.
echo  Instale ele APENAS no seu computador (o do dono).
echo  NAO instale nos PCs das lojas-clientes.
echo ==========================================================
goto :fim
:fim
echo.
echo  [a janela fica ABERTA ate voce fechar no X]
cmd /k
