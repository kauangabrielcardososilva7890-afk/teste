@echo off
chcp 65001 >nul
cd /d "%~dp0"
title DIGICOPY - Gerar o .exe da versao atual
echo ==========================================================
echo  DIGICOPY - Gerar o instalador (.exe) da versao atual
echo  O que ele faz, na ordem:
echo   1) limpa a pasta antiga
echo   2) confere os guardas do pacote
echo   3) monta o bundle
echo   4) gera o instalador .exe na pasta "dist"
echo ==========================================================
echo.
call npm run build:win
echo.
echo ==========================================================
if exist dist\*.exe (
  echo  PRONTO! O instalador novo esta na pasta DIST.
  echo  Proximo passo: dentro do SISTEMA, em Ajustes, o card
  echo  "Publicar atualizacao" - e so subir o .exe com as notas.
) else (
  echo  ATENCAO: nao achei .exe na pasta dist. Tira uma foto
  echo  desta tela e me manda (o erro esta escrito acima).
)
echo ==========================================================
cmd /k
