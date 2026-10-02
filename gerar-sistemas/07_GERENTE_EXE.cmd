@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0.."
title DIGICOPY - 07 Gerente EXE
node build_profiles.js managerExe
if errorlevel 1 echo FALHA ao gerar o Gerente EXE.
if not errorlevel 1 echo OK: Gerente EXE gerado.
pause
endlocal
