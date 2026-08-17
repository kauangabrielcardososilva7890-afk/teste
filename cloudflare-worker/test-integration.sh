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
DEVICE_ID=$(json_value "$TMP/enroll.json" "['device']['id']")
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

cat >"$TMP/delete.json" <<'JSON'
{"mutations":[{"mutationId":"mut_test_delete","entity":"clientes","recordId":"cli_1","operation":"delete","baseVersion":1}]}
JSON
curl -fsS -X POST "$API/v1/changes" -H 'content-type: application/json' \
  -H "authorization: Bearer $ADMIN" --data @"$TMP/delete.json" >"$TMP/delete-result.json"
curl -fsS "$API/v1/deleted" -H "authorization: Bearer $ADMIN" >"$TMP/deleted.json"
python3 - "$TMP/delete-result.json" "$TMP/deleted.json" <<'PY'
import json,sys
delres=json.load(open(sys.argv[1])); deleted=json.load(open(sys.argv[2]))
assert delres['results'][0]['version']==2
assert deleted['records'][0]['data']['nome']=='Cliente Teste'
PY
cat >"$TMP/restore.json" <<'JSON'
{"mutationId":"mut_test_restore","entity":"clientes","recordId":"cli_1"}
JSON
curl -fsS -X POST "$API/v1/restore" -H 'content-type: application/json' \
  -H "authorization: Bearer $ADMIN" --data @"$TMP/restore.json" >"$TMP/restore-result.json"
python3 - "$TMP/restore-result.json" <<'PY'
import json,sys
j=json.load(open(sys.argv[1])); assert j['restored'] is True and j['version']==3
PY
printf '  ✔ exclusão preserva conteúdo e administrador consegue restaurar\n'

curl -fsS "$API/v1/status" -H "authorization: Bearer $ADMIN" >"$TMP/status.json"
python3 - "$TMP/status.json" <<'PY'
import json,sys
j=json.load(open(sys.argv[1])); t=j['totals']
assert (t['devices'],t['records'],t['deleted'],t['cursor'])==(2,1,0,3)
assert t['byEntity']['clientes']=={'active':1,'deleted':0}
PY
printf '  ✔ diagnóstico contabiliza aparelhos e registros\n'

curl -fsS "$API/v1/devices" -H "authorization: Bearer $ADMIN" >"$TMP/devices.json"
python3 - "$TMP/devices.json" <<'PY'
import json,sys
j=json.load(open(sys.argv[1])); assert len(j['devices'])==2
assert {d['role'] for d in j['devices']}=={'admin','device'}
assert all('activeRecords' in d and 'totalChanges' in d and 'lastSeenAt' in d for d in j['devices'])
PY
cat >"$TMP/device-extra.json" <<'JSON'
{"mutations":[{"mutationId":"mut_device_extra","entity":"clientes","recordId":"cli_from_test_device","operation":"upsert","baseVersion":0,"data":{"id":"cli_from_test_device","nome":"Cliente só do aparelho de teste"}}]}
JSON
curl -fsS -X POST "$API/v1/changes" -H 'content-type: application/json' \
  -H "authorization: Bearer $DEVICE" --data @"$TMP/device-extra.json" >"$TMP/device-extra-result.json"
cat >"$TMP/admin-touches-extra.json" <<'JSON'
{"mutations":[{"mutationId":"mut_admin_touches_extra","entity":"clientes","recordId":"cli_from_test_device","operation":"upsert","baseVersion":1,"data":{"id":"cli_from_test_device","nome":"Cliente do teste atualizado pelo admin"}}]}
JSON
curl -fsS -X POST "$API/v1/changes" -H 'content-type: application/json' \
  -H "authorization: Bearer $ADMIN" --data @"$TMP/admin-touches-extra.json" >"$TMP/admin-touches-result.json"
cat >"$TMP/protected-pair.json" <<'JSON'
{"mutations":[{"mutationId":"mut_original_777","entity":"clientes","recordId":"cli_original_777","operation":"upsert","baseVersion":0,"data":{"id":"cli_original_777","codigo":"777","nome":"Original depois unido"}}]}
JSON
curl -fsS -X POST "$API/v1/changes" -H 'content-type: application/json' -H "authorization: Bearer $ADMIN" --data @"$TMP/protected-pair.json" >/dev/null
cat >"$TMP/blocked-duplicate.json" <<'JSON'
{"mutations":[{"mutationId":"mut_duplicate_777","entity":"clientes","recordId":"cli_duplicate_777","operation":"upsert","baseVersion":0,"data":{"id":"cli_duplicate_777","codigo":"777","nome":"Cadastro mantido do aparelho bloqueado"}}]}
JSON
curl -fsS -X POST "$API/v1/changes" -H 'content-type: application/json' -H "authorization: Bearer $DEVICE" --data @"$TMP/blocked-duplicate.json" >/dev/null
cat >"$TMP/delete-original.json" <<'JSON'
{"mutations":[{"mutationId":"mut_delete_original_777","entity":"clientes","recordId":"cli_original_777","operation":"delete","baseVersion":1}]}
JSON
curl -fsS -X POST "$API/v1/changes" -H 'content-type: application/json' -H "authorization: Bearer $ADMIN" --data @"$TMP/delete-original.json" >/dev/null
python3 - "$DEVICE_ID" >"$TMP/revoke.json" <<'PY'
import json,sys
print(json.dumps({'deviceId':sys.argv[1]}))
PY
curl -fsS -X POST "$API/v1/devices/revoke" -H 'content-type: application/json' \
  -H "authorization: Bearer $ADMIN" --data @"$TMP/revoke.json" >"$TMP/revoke-result.json"
curl -fsS "$API/v1/review/revoked-records?entity=clientes" -H "authorization: Bearer $ADMIN" >"$TMP/review.json"
python3 - "$TMP/review.json" >"$TMP/remove-review.json" <<'PY'
import json,sys
j=json.load(open(sys.argv[1])); assert len(j['records'])==1 and len(j['kept'])==1
assert j['kept'][0]['recordId']=='cli_duplicate_777'
print(json.dumps({'entity':'clientes','recordIds':[j['records'][0]['recordId'],j['kept'][0]['recordId']]}))
PY
curl -fsS -X POST "$API/v1/review/remove-revoked" -H 'content-type: application/json' \
  -H "authorization: Bearer $ADMIN" --data @"$TMP/remove-review.json" >"$TMP/remove-review-result.json"
python3 - "$TMP/remove-review-result.json" <<'PY'
import json,sys
j=json.load(open(sys.argv[1])); assert j['removed']==1
PY
code=$(request_code "$TMP/revoked-status.json" "$API/v1/status" -H "authorization: Bearer $DEVICE")
test "$code" = 401
printf '  ✔ admin bloqueia aparelho e remove só registros de origem bloqueada\n'

code=$(request_code "$TMP/recover.json" -X POST "$API/v1/recover" \
  -H 'content-type: application/json' -H "x-setup-secret: $SETUP_SECRET" \
  --data '{"deviceName":"PC Recuperação"}')
test "$code" = 201
python3 - "$TMP/recover.json" <<'PY'
import json,sys
j=json.load(open(sys.argv[1])); assert j['recovered'] is True and j['device']['role']=='admin' and j['activation']=='recovery'
PY
RECOVERY_ID=$(json_value "$TMP/recover.json" "['device']['id']")
code=$(request_code "$TMP/recover2.json" -X POST "$API/v1/recover" \
  -H 'content-type: application/json' -H "x-setup-secret: $SETUP_SECRET" \
  --data '{"deviceName":"Recuperação repetida"}')
test "$code" = 429
printf '  ✔ recuperação cria admin sem apagar dados e possui intervalo de segurança\n'

code=$(request_code "$TMP/reset-many.json" -X POST "$API/v1/admin/reset-cloud" \
  -H 'content-type: application/json' -H "authorization: Bearer $ADMIN" \
  --data '{"confirmation":"APAGAR NUVEM"}')
test "$code" = 409
python3 - "$RECOVERY_ID" >"$TMP/revoke-recovery.json" <<'PY'
import json,sys
print(json.dumps({'deviceId':sys.argv[1]}))
PY
curl -fsS -X POST "$API/v1/devices/revoke" -H 'content-type: application/json' \
  -H "authorization: Bearer $ADMIN" --data @"$TMP/revoke-recovery.json" >/dev/null
code=$(request_code "$TMP/reset-wrong.json" -X POST "$API/v1/admin/reset-cloud" \
  -H 'content-type: application/json' -H "authorization: Bearer $ADMIN" \
  --data '{"confirmation":"errado"}')
test "$code" = 400
curl -fsS -X POST "$API/v1/admin/reset-cloud" -H 'content-type: application/json' \
  -H "authorization: Bearer $ADMIN" --data '{"confirmation":"APAGAR NUVEM"}' >"$TMP/reset-ok.json"
curl -fsS "$API/v1/status" -H "authorization: Bearer $ADMIN" >"$TMP/status-reset.json"
python3 - "$TMP/reset-ok.json" "$TMP/status-reset.json" <<'PY'
import json,sys
r=json.load(open(sys.argv[1])); s=json.load(open(sys.argv[2]))
assert r['reset'] is True and r['kept']['devices']==1
assert s['totals']['records']==0 and s['totals']['deleted']==0 and s['totals']['cursor']==0
PY
printf '  ✔ reset exige frase/admin único, zera negócio e mantém segurança\n'
printf '\nRESULTADO: integração completa da API passou!\n'
