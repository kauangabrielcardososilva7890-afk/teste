@echo off
chcp 65001 >nul
cd /d "%~dp0"
title DIGICOPY - Gerar o .exe (instala tudo + monta + abre a pasta)
echo ==========================================================
echo  DIGICOPY - Gerar o instalador (.exe)
echo  Passo 1: instala as pecas (npm install)
echo  Passo 2: monta o instalador (npm run build:win)
echo  Passo 3: aperte qualquer tecla - abre a pasta DIST
echo           onde o .exe fica pronto.
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
  echo  PRONTO! Aperte qualquer tecla para ABRIR A PASTA DIST
  echo  (o instalador .exe esta la dentro).
  echo  Depois e so subir ele pelo card Publicar Atualizacao.
  echo ==========================================================
  pause >nul
  explorer "%~dp0dist"
) else (
  echo ==========================================================
  echo  ATENCAO: nao achei .exe na pasta dist.
  echo  Tira uma foto desta tela e me manda (o erro esta acima).
  echo ==========================================================
)
cmd /k
