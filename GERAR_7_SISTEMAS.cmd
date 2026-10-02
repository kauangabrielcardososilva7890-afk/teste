@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
if /i "%~1"=="interno" goto menu
if not "%~1"=="" goto executar_arg
start "DIGICOPY - Gerar 7 sistemas" cmd /k "%~f0" interno
exit /b

:menu
cls
title DIGICOPY - Gerar os 7 sistemas
 echo ================================================================
 echo  DIGICOPY v8.0.0 - CENTRAL DE EMPACOTAMENTO
 echo ================================================================
 echo  1 - Sistema principal e particular .exe
 echo  2 - Sistema principal e particular .apk
 echo  3 - Sistema comercial .exe
 echo  4 - Sistema comercial .apk
 echo  5 - Sistema comercial sem nuvem / local .exe
 echo  6 - Sistema comercial sem nuvem / local .apk
 echo  7 - Gerente .exe
 echo  0 - Sair
 echo ================================================================
 choice /c 12345670 /n /m "Escolha o produto: "
 if errorlevel 8 goto fim
 if errorlevel 7 set "ALVO=managerExe" & goto executar
 if errorlevel 6 set "ALVO=commercialLocalApk" & goto executar
 if errorlevel 5 set "ALVO=commercialLocalExe" & goto executar
 if errorlevel 4 set "ALVO=commercialApk" & goto executar
 if errorlevel 3 set "ALVO=commercialExe" & goto executar
 if errorlevel 2 set "ALVO=particularApk" & goto executar
 if errorlevel 1 set "ALVO=particularExe" & goto executar
 goto menu

:executar_arg
set "ARG=%~1"
if "%ARG%"=="1" set "ALVO=particularExe"
if "%ARG%"=="2" set "ALVO=particularApk"
if "%ARG%"=="3" set "ALVO=commercialExe"
if "%ARG%"=="4" set "ALVO=commercialApk"
if "%ARG%"=="5" set "ALVO=commercialLocalExe"
if "%ARG%"=="6" set "ALVO=commercialLocalApk"
if "%ARG%"=="7" set "ALVO=managerExe"
if not defined ALVO echo Opcao invalida: %ARG% & goto fim

:executar
echo.
echo Produto selecionado: %ALVO%
echo Os relatórios gerados de teste serão limpos antes do empacotamento.
echo.
node build_profiles.js %ALVO%
if errorlevel 1 (
  echo.
  echo ================================================================
  echo FALHA: o produto nao foi gerado.
  echo Leia a mensagem acima, corrija o requisito indicado e execute de novo.
  echo ================================================================
  goto fim
)
echo.
echo ================================================================
echo PRODUTO GERADO COM SUCESSO: %ALVO%
echo Veja a pasta dist correspondente ao tipo escolhido.
echo ================================================================

:fim
echo.
echo Esta janela ficará aberta para você ler o resultado.
pause
endlocal
