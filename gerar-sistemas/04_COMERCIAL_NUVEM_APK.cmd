@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0.."
title DIGICOPY - 04 Comercial Nuvem APK
node build_profiles.js commercialApk
if errorlevel 1 echo FALHA ao gerar o Comercial Nuvem APK.
if not errorlevel 1 echo OK: Comercial Nuvem APK gerado.
pause
endlocal
