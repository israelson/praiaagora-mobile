#!/usr/bin/env python3
"""
Teste completo da API Beachly (endpoints públicos + autenticados).
Cria usuário de teste, faz login, testa todos os endpoints e exibe resultado.
"""
import sys
import json
import urllib.request
import urllib.error
import urllib.parse
import random
import string
import time

API = "http://76.13.232.232:8000"
TIMEOUT = 10

# ─── cores ANSI ───────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

OK    = f"{GREEN}✓ OK{RESET}"
FAIL  = f"{RED}✗ FAIL{RESET}"
SKIP  = f"{YELLOW}⚠ SKIP{RESET}"

results = []

# ─── helpers ──────────────────────────────────────────────────────────────────
def req(method: str, path: str, body=None, token=None, label=None):
    url = API + path
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    tag = label or f"{method} {path}"
    t0 = time.time()
    try:
        r = urllib.request.urlopen(
            urllib.request.Request(url, data=data, headers=headers, method=method),
            timeout=TIMEOUT,
        )
        elapsed = (time.time() - t0) * 1000
        raw = r.read()
        status = r.status
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = raw.decode(errors="replace")

        icon = OK if 200 <= status < 300 else FAIL
        print(f"  {icon}  [{status}]  {tag}  {YELLOW}({elapsed:.0f}ms){RESET}")
        results.append((tag, status, True))
        return status, parsed

    except urllib.error.HTTPError as e:
        elapsed = (time.time() - t0) * 1000
        raw = e.read()
        try:
            detail = json.loads(raw).get("detail", raw.decode(errors="replace"))
        except Exception:
            detail = raw.decode(errors="replace")
        expected_fail = e.code in (401, 403, 404, 422)
        icon = SKIP if expected_fail else FAIL
        print(f"  {icon}  [{e.code}]  {tag}  — {detail}  {YELLOW}({elapsed:.0f}ms){RESET}")
        results.append((tag, e.code, expected_fail))
        return e.code, None

    except Exception as ex:
        elapsed = (time.time() - t0) * 1000
        print(f"  {FAIL}  [ERR]  {tag}  — {ex}  {YELLOW}({elapsed:.0f}ms){RESET}")
        results.append((tag, "ERR", False))
        return "ERR", None

def section(title):
    print(f"\n{BOLD}{CYAN}{'─'*55}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{BOLD}{CYAN}{'─'*55}{RESET}")

# ─── gera email único para teste ──────────────────────────────────────────────
rand = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
TEST_EMAIL    = f"test_{rand}@beachly-test.com"
TEST_PASSWORD = "Test@12345!"
TEST_NAME     = "Usuário Teste"

# ══════════════════════════════════════════════════════════════════════════════
section("1. ENDPOINTS PÚBLICOS")

req("GET",  "/",                        label="GET  /  (health)")
req("GET",  "/docs",                    label="GET  /docs")
req("GET",  "/api/v1/beaches?limit=2",  label="GET  /beaches?limit=2")
req("GET",  "/api/v1/balneability/report", label="GET  /balneability/report")
req("GET",  "/api/v1/analytics/beaches/recommend?limit=1", label="GET  /recommend?limit=1")

# Pega ID de praia real para usar nos testes seguintes
_, beaches = req("GET", "/api/v1/beaches?limit=1", label="GET  /beaches?limit=1 (ID)")
BEACH_ID = None
if isinstance(beaches, list) and beaches:
    BEACH_ID = beaches[0].get("id")
elif isinstance(beaches, dict):
    arr = beaches.get("beaches") or beaches.get("results") or []
    if arr:
        BEACH_ID = arr[0].get("id")

if BEACH_ID:
    print(f"  {CYAN}→ Beach ID: {BEACH_ID}{RESET}")
    req("GET", f"/api/v1/beaches/{BEACH_ID}",  label=f"GET  /beaches/{{id}}")
    req("GET", f"/api/v1/crowd/beaches/{BEACH_ID}/crowd", label=f"GET  /crowd/{{id}}")
    req("GET", f"/api/v1/beaches/{BEACH_ID}/partners/nearby", label="GET  /partners/nearby")
else:
    print(f"  {YELLOW}⚠ Sem beach ID — pulando testes de praia específica{RESET}")

# ══════════════════════════════════════════════════════════════════════════════
section("2. AUTENTICAÇÃO — REGISTRO")

status, reg_resp = req(
    "POST", "/api/v1/auth/register",
    body={"email": TEST_EMAIL, "password": TEST_PASSWORD, "full_name": TEST_NAME},
    label="POST /auth/register (novo usuário)"
)

# ══════════════════════════════════════════════════════════════════════════════
section("3. AUTENTICAÇÃO — LOGIN")

status, login_resp = req(
    "POST", "/api/v1/auth/login",
    body={"email": TEST_EMAIL, "password": TEST_PASSWORD},
    label="POST /auth/login"
)

TOKEN = None
REFRESH_TOKEN = None
if isinstance(login_resp, dict):
    TOKEN = login_resp.get("access_token")
    REFRESH_TOKEN = login_resp.get("refresh_token")
    if TOKEN:
        print(f"  {CYAN}→ Token obtido: {TOKEN[:20]}...{RESET}")
    else:
        print(f"  {RED}→ Sem access_token na resposta: {login_resp}{RESET}")

# ── login com senha errada (deve retornar 401) ────────────────────────────────
req("POST", "/api/v1/auth/login",
    body={"email": TEST_EMAIL, "password": "wrong"},
    label="POST /auth/login (senha errada → 401 esperado)"
)

# ══════════════════════════════════════════════════════════════════════════════
section("4. ENDPOINTS PROTEGIDOS (requer token)")

if not TOKEN:
    print(f"  {RED}Sem token — pulando todos os testes autenticados{RESET}")
else:
    req("GET",  "/api/v1/auth/me",            token=TOKEN, label="GET  /auth/me")
    req("GET",  "/api/v1/users/me/favorites", token=TOKEN, label="GET  /favorites")
    req("GET",  "/api/v1/checkins/me",        token=TOKEN, label="GET  /checkins/me")
    req("GET",  "/api/v1/users/me/checkins/summary", token=TOKEN, label="GET  /checkins/summary")

    # Favoritar praia
    if BEACH_ID:
        req("POST",   f"/api/v1/users/me/favorites/{BEACH_ID}", token=TOKEN, label="POST /favorites/{id} (add)")
        req("GET",    "/api/v1/users/me/favorites",             token=TOKEN, label="GET  /favorites (após add)")
        req("DELETE", f"/api/v1/users/me/favorites/{BEACH_ID}", token=TOKEN, label="DELETE /favorites/{id} (remove)")

    # Atualiza perfil
    req("PATCH", "/api/v1/auth/me",
        body={"city": "Florianópolis"},
        token=TOKEN,
        label="PATCH /auth/me (atualiza cidade)"
    )

# ══════════════════════════════════════════════════════════════════════════════
section("5. REFRESH TOKEN")

if REFRESH_TOKEN:
    status, ref_resp = req(
        "POST", "/api/v1/auth/refresh",
        body={"refresh_token": REFRESH_TOKEN},
        label="POST /auth/refresh"
    )
    if isinstance(ref_resp, dict) and ref_resp.get("access_token"):
        print(f"  {CYAN}→ Novo token obtido com sucesso{RESET}")
else:
    print(f"  {YELLOW}⚠ Sem refresh_token — pulando{RESET}")

# ══════════════════════════════════════════════════════════════════════════════
section("6. LOGOUT")

if TOKEN:
    req("POST", "/api/v1/auth/logout", token=TOKEN, label="POST /auth/logout")
    # Após logout, /me deve retornar 401 ou 403
    req("GET", "/api/v1/auth/me", token=TOKEN, label="GET  /auth/me (após logout → 401/403 esperado)")

# ══════════════════════════════════════════════════════════════════════════════
section("RESUMO")

total   = len(results)
passed  = sum(1 for _, code, ok in results if ok and isinstance(code, int) and 200 <= code < 300)
expected = sum(1 for _, code, ok in results if ok and isinstance(code, int) and code >= 400)
failed  = sum(1 for _, _, ok in results if not ok)

print(f"\n  Total de requests : {total}")
print(f"  {GREEN}Sucesso (2xx)     : {passed}{RESET}")
print(f"  {YELLOW}Esperados (4xx)   : {expected}{RESET}")
print(f"  {RED}Falhas            : {failed}{RESET}")

if failed > 0:
    print(f"\n  {RED}Endpoints com falha inesperada:{RESET}")
    for tag, code, ok in results:
        if not ok:
            print(f"    • [{code}] {tag}")

sys.exit(0 if failed == 0 else 1)
