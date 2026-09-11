@echo off
chcp 65001 >nul
title DIGICOPY - Raio-X das gravacoes da nuvem (so consulta, nao muda nada)
echo ==========================================================
echo  DIGICOPY - Raio-X da nuvem
echo  So CONSULTA. Nao apaga, nao muda, nao gasta nada de verdade.
echo ==========================================================
echo.
cd /d "%~dp0cloudflare-worker"
if errorlevel 1 (
  echo NAO ACHEI a pasta cloudflare-worker aqui do lado.
  echo Rode este arquivo dentro da pasta do sistema, por favor.
  pause
  exit /b 1
)
echo [1/3] Escritas e leituras por dia (ultimos 7 dias):
echo.
call npx.cmd wrangler d1 execute digicopy-erp --remote --command "SELECT dia, escritas, leituras FROM uso_diario ORDER BY dia DESC LIMIT 7"
echo.
echo [2/3] Quem mais gravou HOJE na nuvem, por tipo de registro:
echo.
call npx.cmd wrangler d1 execute digicopy-erp --remote --command "SELECT entity, COUNT(*) AS gravacoes_hoje FROM changes WHERE created_at >= (CAST(strftime('%%s','now','start of day') AS INTEGER)*1000) GROUP BY entity ORDER BY gravacoes_hoje DESC LIMIT 12"
echo.
echo [3/3] Quais aparelhos estao falando com a nuvem (e o ultimo sinal de cada um):
echo.
call npx.cmd wrangler d1 execute digicopy-erp --remote --command "SELECT name, role, datetime(last_seen_at/1000,'unixepoch') AS ultimo_sinal_utc FROM devices WHERE revoked_at IS NULL ORDER BY last_seen_at DESC"
echo.
echo [extra] Qual versao do motor esta no ar agora (tem que ser 5.24.8 ou mais novo):
echo.
curl -s "https://digicopy-sync-api.kauangabrielcardososilva7890.workers.dev/health"
echo.
echo.
echo ==========================================================
echo  Pronto! Tira uma foto desta tela INTEIRA e me manda.
echo ==========================================================
pause
