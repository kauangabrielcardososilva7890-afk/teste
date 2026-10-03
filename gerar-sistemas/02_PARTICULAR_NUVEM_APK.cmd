@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0.."
title DIGICOPY - 02 Particular Nuvem APK
node build_profiles.js particularApk
if errorlevel 1 echo FALHA ao gerar o Particular Nuvem APK.
if not errorlevel 1 echo OK: Particular Nuvem APK gerado.
pause
endlocal
