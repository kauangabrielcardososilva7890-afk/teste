@echo off
chcp 65001 >nul
if /i "%~1"=="interno" goto :dentro
start "DIGICOPY - Gerar o .exe" cmd /k "%~f0" interno
exit /b
:dentro
cd /d "%~dp0"
title DIGICOPY - Gerar o .exe (esta janela NAO fecha sozinha)
echo ==========================================================
echo  DIGICOPY - Gerar o instalador .exe
echo  Passo 1: instala as pecas. Passo 2: monta o instalador.
echo  No fim, voce mesmo abre a pasta DIST ao lado.
echo  ESTA JANELA NUNCA FECHA SOZINHA - fecha so no X.
echo ==========================================================
echo.
echo Passo 1/2 - Instalando as pecas:
call npm install
echo.
echo Passo 2/2 - Montando o instalador:
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
echo  PRONTO! O instalador esta na pasta DIST ao lado.
echo  Abre a pasta dist e instala por cima em cada PC.
echo ==========================================================
goto :fim
:fim
echo.
echo  [a janela fica ABERTA ate voce fechar no X]
cmd /k
