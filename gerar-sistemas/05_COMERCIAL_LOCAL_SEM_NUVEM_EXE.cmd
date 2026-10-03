@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0.."
title DIGICOPY - 05 Comercial Local sem Nuvem EXE
node build_profiles.js commercialLocalExe
if errorlevel 1 echo FALHA ao gerar o Comercial Local sem Nuvem EXE.
if not errorlevel 1 echo OK: Comercial Local sem Nuvem EXE gerado.
pause
endlocal
