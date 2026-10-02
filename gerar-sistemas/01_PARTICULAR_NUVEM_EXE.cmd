@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0.."
title DIGICOPY - 01 Particular Nuvem EXE
node build_profiles.js particularExe
if errorlevel 1 echo FALHA ao gerar o Particular Nuvem EXE.
if not errorlevel 1 echo OK: Particular Nuvem EXE gerado.
pause
endlocal
