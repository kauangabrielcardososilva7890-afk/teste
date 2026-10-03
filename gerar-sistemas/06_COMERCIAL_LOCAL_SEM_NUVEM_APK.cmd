@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0.."
title DIGICOPY - 06 Comercial Local sem Nuvem APK
node build_profiles.js commercialLocalApk
if errorlevel 1 echo FALHA ao gerar o Comercial Local sem Nuvem APK.
if not errorlevel 1 echo OK: Comercial Local sem Nuvem APK gerado.
pause
endlocal
