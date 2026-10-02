@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0.."
title DIGICOPY v8.0.0 - Gerar TODOS os 7 sistemas

echo ================================================================
echo  DIGICOPY v8.0.0 - GERAR OS 7 SISTEMAS
echo ================================================================
echo  Este processo gera, em sequencia, os 7 produtos:
echo  01 Particular Nuvem EXE
echo  02 Particular Nuvem APK
echo  03 Comercial Nuvem EXE
echo  04 Comercial Nuvem APK
echo  05 Comercial Local sem Nuvem EXE
echo  06 Comercial Local sem Nuvem APK
echo  07 Gerente EXE
echo ================================================================
echo.
node build_profiles.js all
if errorlevel 1 (
  echo.
  echo FALHA: um dos sete produtos nao foi gerado.
  echo Leia a etapa indicada acima e corrija o requisito informado.
  goto fim
)
echo.
echo ================================================================
echo SUCESSO: OS 7 PRODUTOS FORAM GERADOS.
echo As saidas ficam separadas nas pastas dist correspondentes.
echo ================================================================
:fim
echo.
pause
endlocal
