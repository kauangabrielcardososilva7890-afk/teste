@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0.."
title DIGICOPY - 01 Particular Nuvem EXE

where node >nul 2>nul
if errorlevel 1 goto :node_ausente
if not exist build_profiles.js goto :script_ausente

node build_profiles.js particularExe
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" goto :falha

echo.
echo OK: Particular Nuvem EXE gerado.
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
echo FALHA ao gerar Particular Nuvem EXE. Codigo: %RC%

:fim
echo.
pause
endlocal & exit /b %RC%
