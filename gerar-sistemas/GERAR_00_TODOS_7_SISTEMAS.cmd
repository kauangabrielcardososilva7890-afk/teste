@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0.."
title DIGICOPY - Gerar os 7 sistemas

echo ================================================================
echo  DIGICOPY - GERAR OS 7 SISTEMAS
echo ================================================================
echo  01 Particular Nuvem EXE
echo  02 Particular Nuvem APK de teste
echo  03 Comercial Nuvem EXE
echo  04 Comercial Nuvem APK de teste
echo  05 Comercial Local sem Nuvem EXE
echo  06 Comercial Local sem Nuvem APK de teste
echo  07 Gerente EXE
echo ================================================================
echo.

where node >nul 2>nul
if errorlevel 1 goto :node_ausente
if not exist build_profiles.js goto :script_ausente

node build_profiles.js all
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" goto :falha

echo.
echo ================================================================
echo SUCESSO: OS 7 PRODUTOS FORAM GERADOS.
echo Confira as pastas de saida descritas em gerar-sistemas\README.md.
echo ================================================================
goto :fim

:node_ausente
set "RC=2"
echo FALHA: Node.js nao foi encontrado no PATH.
goto :fim

:script_ausente
set "RC=2"
echo FALHA: build_profiles.js nao foi encontrado na pasta do sistema.
goto :fim

:falha
echo.
echo FALHA: um dos sete produtos nao foi gerado. Codigo: %RC%
echo Leia a etapa indicada acima e corrija o requisito informado.

:fim
echo.
pause
endlocal & exit /b %RC%
