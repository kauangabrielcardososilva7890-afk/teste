@echo off
chcp 65001 >nul
if /i "%~1"=="interno" goto :dentro
start "DIGICOPY - EXE so da nuvem" cmd /k "%~f0" interno
exit /b
:dentro
cd /d "%~dp0"
title DIGICOPY - EXE so da nuvem (esta janela NAO fecha sozinha)
echo ==========================================================
echo  DIGICOPY NUVEM - o .exe que SO conecta na nuvem
echo  Ele NAO instala o sistema e NAO guarda dados neste PC.
echo  Gera: nuvem\DIGICOPY-NUVEM.exe + atalho DIGICOPY NUVEM
echo  ESTA JANELA NUNCA FECHA SOZINHA - fecha so no X.
echo ==========================================================
echo.
if not exist "%~dp0nuvem\criar_exe_so_nuvem.ps1" (
  echo NAO ACHEI a pasta NUVEM aqui do lado.
  echo Rode este arquivo dentro da pasta do sistema, por favor.
  goto :fim
)
echo Gerando o .exe leve (nada e baixado da internet):
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0nuvem\criar_exe_so_nuvem.ps1"
echo.
echo ==========================================================
echo  Agora e so clicar no atalho DIGICOPY NUVEM (Area de Trabalho):
echo  abre o sistema ja ligado na nuvem.
echo  Outros PCs: leve o arquivo nuvem\DIGICOPY-NUVEM.exe (ele e leve,
echo  nao leva o sistema nem o banco dentro).
echo  Precisa de internet e da senha da nuvem, como sempre.
echo  Se o antivirus reclamar do .exe, use o atalho do mesmo jeito
echo  (ele usa o nuvem\abrir_digicopy.vbs e faz exatamente o mesmo).
echo ==========================================================
:fim
echo.
echo  [a janela fica ABERTA ate voce fechar no X]
cmd /k
