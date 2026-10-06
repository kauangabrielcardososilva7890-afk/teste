@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0.."
title DIGICOPY - 06 Comercial Local sem Nuvem APK

where node >nul 2>nul
if errorlevel 1 goto :node_ausente
if not exist build_profiles.js goto :script_ausente

node build_profiles.js commercialLocalApk
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" goto :falha

echo.
echo OK: Comercial Local sem Nuvem APK gerado.
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
echo FALHA ao gerar Comercial Local sem Nuvem APK. Codigo: %RC%

:fim
echo.
pause
endlocal & exit /b %RC%
