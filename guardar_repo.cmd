@echo off
chcp 65001 >nul
title DIGICOPY - Guardar o trabalho no GitHub (nada se perde)
echo ==========================================================
echo  GUARDAR O TRABALHO NO GITHUB
echo  Salva tudo o que mudou e envia para a branch da sessao.
echo  Se a pasta do projeto voltar para tras algum dia, o que
echo  ja foi guardado aqui continua no GitHub.
echo ==========================================================
echo.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo NAO ACHEI o Node.js neste PC.
  echo Instale em https://nodejs.org ^(LTS^) e rode este arquivo de novo.
  echo  [a janela fica ABERTA pra voce ler - feche no X quando quiser]
  cmd /k
  exit /b 1
)
call node guardar_repo.js
echo.
echo  [a janela fica ABERTA pra voce ler e copiar a vontade - feche no X quando quiser]
cmd /k
