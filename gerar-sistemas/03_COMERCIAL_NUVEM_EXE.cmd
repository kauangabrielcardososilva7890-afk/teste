@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0.."
title DIGICOPY - 03 Comercial Nuvem EXE
node build_profiles.js commercialExe
if errorlevel 1 echo FALHA ao gerar o Comercial Nuvem EXE.
if not errorlevel 1 echo OK: Comercial Nuvem EXE gerado.
pause
endlocal
