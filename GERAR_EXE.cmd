@echo off
chcp 65001 >nul
cd /d "%~dp0"
title DIGICOPY - Gerar o .exe (instala tudo + monta)
echo ==========================================================
echo  DIGICOPY - Gerar o instalador (.exe)
echo  Passo 1: instala as pecas (npm install)
echo  Passo 2: monta o instalador (npm run build:win)
echo  No fim, voce mesmo abre a pasta DIST (o .exe fica la).
echo  Pode fechar esta janela no X quando quiser.
echo ==========================================================
echo.
echo Passo 1/2 - Instalando as pecas (demora na 1a vez):
call npm install
echo.
echo Passo 2/2 - Montando o instalador:
call npm run build:win
echo.
if exist dist\*.exe (
  echo ==========================================================
  echo  PRONTO! O instalador esta na pasta DIST ao lado.
  echo  Abre a pasta dist no Explorador de Arquivos e instala.
  echo ==========================================================
) else (
  echo ==========================================================
  echo  ATENCAO: nao achei .exe na pasta dist.
  echo  Tira uma foto desta tela e me manda (o erro esta acima).
  echo ==========================================================
)
cmd /k
