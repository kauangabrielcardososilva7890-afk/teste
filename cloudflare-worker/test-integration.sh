#!/usr/bin/env bash
set -euo pipefail
API="${API_URL:-http://127.0.0.1:8787}"
SETUP_SECRET="${TEST_SETUP_SECRET:-test-secret-123}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

request_code() {
  local output="$1"; shift
  curl -sS -o "$output" -w '%{http_code}' "$@"
}
json_value() {
  python3 -c "import json; print(json.load(open('$1'))$2)"
}

printf '== DIGICOPY CLOUD API: INTEGRAÇÃO D1 ==\n'

curl -fsS "$API/health" >"$TMP/health.json"
python3 - "$TMP/health.json" <<'PY'
import json,sys
j=json.load(open(sys.argv[1])); assert j['ready'] is True and j['schemaVersion']=='2'
PY
printf '  ✔ API, D1 e esquema prontos\n'

code=$(request_code "$TMP/noauth.json" "$API/v1/status")
test "$code" = 401
printf '  ✔ rota privada bloqueia acesso sem token\n'

code=$(request_code "$TMP/badsetup.json" -X POST "$API/v1/setup" \
  -H 'content-type: application/json' -H 'x-setup-secret: incorreto' \
  --data '{"deviceName":"PC Admin"}')
test "$code" = 403
printf '  ✔ segredo incorreto não ativa a nuvem\n'

code=$(request_code "$TMP/setup.json" -X POST "$API/v1/setup" \
  -H 'content-type: application/json' -H "x-setup-secret: $SETUP_SECRET" \
  --data '{"deviceName":"PC Admin"}')
test "$code" = 201
ADMIN=$(json_value "$TMP/setup.json" "['token']")
printf '  ✔ primeiro aparelho vira administrador\n'

code=$(request_code "$TMP/setup2.json" -X POST "$API/v1/setup" \
  -H 'content-type: application/json' -H "x-setup-secret: $SETUP_SECRET" \
  --data '{"deviceName":"Admin indevido"}')
test "$code" = 409
printf '  ✔ segundo administrador inicial é bloqueado\n'

curl -fsS -X POST "$API/v1/invites" -H 'content-type: application/json' \
  -H "authorization: Bearer $ADMIN" --data '{"minutes":15}' >"$TMP/invite.json"
INVITE=$(json_value "$TMP/invite.json" "['code']")
python3 - "$INVITE" >"$TMP/enroll-body.json" <<'PY'
import json,sys
print(json.dumps({'code':sys.argv[1], 'deviceName':'Notebook'}))
PY
code=$(request_code "$TMP/enroll.json" -X POST "$API/v1/enroll" \
  -H 'content-type: application/json' --data @"$TMP/enroll-body.json")
test "$code" = 201
DEVICE=$(json_value "$TMP/enroll.json" "['token']")
code=$(request_code "$TMP/reuse.json" -X POST "$API/v1/enroll" \
  -H 'content-type: application/json' --data @"$TMP/enroll-body.json")
test "$code" = 403
printf '  ✔ convite autoriza um aparelho e não pode ser reutilizado\n'

cat >"$TMP/push.json" <<'JSON'
{"mutations":[{"mutationId":"mut_test_1","entity":"clientes","recordId":"cli_1","operation":"upsert","baseVersion":0,"data":{"id":"cli_1","nome":"Cliente Teste"}}]}
JSON
curl -fsS -X POST "$API/v1/changes" -H 'content-type: application/json' \
  -H "authorization: Bearer $ADMIN" --data @"$TMP/push.json" >"$TMP/push-result.json"
curl -fsS -X POST "$API/v1/changes" -H 'content-type: application/json' \
  -H "authorization: Bearer $ADMIN" --data @"$TMP/push.json" >"$TMP/duplicate.json"
python3 - "$TMP/push-result.json" "$TMP/duplicate.json" <<'PY'
import json,sys
first=json.load(open(sys.argv[1])); dup=json.load(open(sys.argv[2]))
assert first['results'][0]['version']==1
assert dup['results'][0]['duplicate'] is True and dup['results'][0]['seq']==1
PY
printf '  ✔ gravação incremental e repetição idempotente\n'

curl -fsS "$API/v1/changes?cursor=0" -H "authorization: Bearer $DEVICE" >"$TMP/pull.json"
python3 - "$TMP/pull.json" <<'PY'
import json,sys
j=json.load(open(sys.argv[1])); assert len(j['changes'])==1
assert j['changes'][0]['data']['nome']=='Cliente Teste' and j['nextCursor']==1
PY
printf '  ✔ segundo aparelho recebe somente novidades pelo cursor\n'

cat >"$TMP/conflict.json" <<'JSON'
{"mutations":[{"mutationId":"mut_test_conflict","entity":"clientes","recordId":"cli_1","operation":"upsert","baseVersion":0,"data":{"id":"cli_1","nome":"Não sobrescrever"}}]}
JSON
curl -fsS -X POST "$API/v1/changes" -H 'content-type: application/json' \
  -H "authorization: Bearer $DEVICE" --data @"$TMP/conflict.json" >"$TMP/conflict-result.json"
python3 - "$TMP/conflict-result.json" <<'PY'
import json,sys
j=json.load(open(sys.argv[1])); r=j['results'][0]
assert r['conflict'] is True and r['current']['data']['nome']=='Cliente Teste'
PY
printf '  ✔ versão antiga não sobrescreve dado mais novo\n'

curl -fsS "$API/v1/status" -H "authorization: Bearer $ADMIN" >"$TMP/status.json"
python3 - "$TMP/status.json" <<'PY'
import json,sys
j=json.load(open(sys.argv[1])); assert j['totals']=={'devices':2,'records':1,'cursor':1}
PY
printf '  ✔ diagnóstico contabiliza aparelhos e registros\n'

code=$(request_code "$TMP/recover.json" -X POST "$API/v1/recover" \
  -H 'content-type: application/json' -H "x-setup-secret: $SETUP_SECRET" \
  --data '{"deviceName":"PC Recuperação"}')
test "$code" = 201
python3 - "$TMP/recover.json" <<'PY'
import json,sys
j=json.load(open(sys.argv[1])); assert j['recovered'] is True and j['device']['role']=='admin'
PY
code=$(request_code "$TMP/recover2.json" -X POST "$API/v1/recover" \
  -H 'content-type: application/json' -H "x-setup-secret: $SETUP_SECRET" \
  --data '{"deviceName":"Recuperação repetida"}')
test "$code" = 429
printf '  ✔ recuperação cria admin sem apagar dados e possui intervalo de segurança\n'
printf '\nRESULTADO: integração completa da API passou!\n'
