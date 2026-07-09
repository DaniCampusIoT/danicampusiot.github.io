#!/usr/bin/env python3
"""
update_projects.py

Consulta la API de GitHub para obtener los repos marcados con el topic 'portfolio',
los combina con las descripciones/badges manuales de projects-override.json,
y actualiza la sección 'projects.items' en languages/es.json y languages/en.json.

Lógica híbrida:
  - Si el repo tiene entrada en projects-override.json  → usa desc/badges/label manual
  - Si no tiene override                                → usa descripción del repo en GitHub
    y mapea los topics a badges automáticamente.

Cómo marcar un repo para que aparezca:
  1. Ve al repo en GitHub
  2. Edita los topics (engranaje junto a "About")
  3. Añade el topic: portfolio
  4. (Opcional) Añade un topic de orden: portfolio-1, portfolio-2... para fijar el orden
"""

import json
import os
import re
import sys
from pathlib import Path

import requests

# ---------------------------------------------------------------------------
# Configuración
# ---------------------------------------------------------------------------
USERNAME     = os.environ.get("GITHUB_USERNAME", "DaniCampusIoT")
TOKEN        = os.environ.get("GITHUB_TOKEN", "")
PORTFOLIO_T  = "portfolio"          # topic obligatorio para aparecer
ORDER_PREFIX = "portfolio-"         # topic opcional: portfolio-1, portfolio-2...
MAX_REPOS    = 8                    # máximo de tarjetas a mostrar

ROOT         = Path(__file__).parent.parent
OVERRIDE_F   = ROOT / "projects-override.json"
LANG_ES      = ROOT / "languages" / "es.json"
LANG_EN      = ROOT / "languages" / "en.json"

# Mapeo topic → badge id (debe coincidir con techBadges en app.js)
TOPIC_TO_BADGE = {
    "python":       "python",
    "javascript":   "js",
    "typescript":   "js",
    "docker":       "docker",
    "cloudflare":   "cloudflare",
    "go":           "go",
    "golang":       "go",
    "esp32":        "esp32",
    "esp8266":      "esp32",
    "esp-now":      "espnow",
    "espnow":       "espnow",
    "iot":          "iot",
    "mqtt":         "iot",
    "embedded":     "embedded",
    "firmware":     "embedded",
    "edge":         "edge",
    "data":         "data",
    "ml":           "ml",
    "machine-learning": "ml",
    "computer-vision":  "vision",
    "face-recognition": "face",
    "catia":        "catia",
    "cad":          "cad",
    "3d-printing":  "printing",
    "3d-scanning":  "scan",
    "scanner":      "scanner",
    "diff":         "diff",
    "tooling":      "tooling",
    "paper":        "paper",
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def gh_headers():
    h = {"Accept": "application/vnd.github+json",
         "X-GitHub-Api-Version": "2022-11-28"}
    if TOKEN:
        h["Authorization"] = f"Bearer {TOKEN}"
    return h


def fetch_portfolio_repos():
    """Devuelve lista de repos con el topic 'portfolio', ordenados."""
    repos = []
    page = 1
    while True:
        r = requests.get(
            f"https://api.github.com/users/{USERNAME}/repos",
            headers=gh_headers(),
            params={"per_page": 100, "page": page, "type": "public"},
            timeout=15,
        )
        r.raise_for_status()
        batch = r.json()
        if not batch:
            break
        repos.extend(batch)
        page += 1

    portfolio = [r for r in repos if PORTFOLIO_T in (r.get("topics") or [])]

    # Orden: primero los que tienen topic portfolio-N, luego por stars desc
    def sort_key(repo):
        topics = repo.get("topics") or []
        for t in topics:
            m = re.match(rf"^{re.escape(ORDER_PREFIX)}(\d+)$", t)
            if m:
                return (0, int(m.group(1)))
        return (1, -(repo.get("stargazers_count") or 0))

    return sorted(portfolio, key=sort_key)[:MAX_REPOS]


def topics_to_badges(topics):
    """Convierte lista de topics GitHub en lista de badge ids."""
    seen, result = set(), []
    for t in topics:
        badge = TOPIC_TO_BADGE.get(t.lower())
        if badge and badge not in seen:
            result.append(badge)
            seen.add(badge)
    return result[:4]  # máximo 4 badges por tarjeta


def load_override():
    if OVERRIDE_F.exists():
        with open(OVERRIDE_F, encoding="utf-8") as f:
            return json.load(f)
    return {}


def load_lang(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_lang(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f"  ✓ {path.name} actualizado")


# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------

def build_item(repo, override_es, override_en):
    """Construye el objeto de proyecto para ES y EN."""
    slug    = repo["name"]
    html_url = repo["html_url"]
    topics  = repo.get("topics") or []

    # --- ES ---
    es_over = override_es.get(slug, {})
    es_item = {
        "name":  es_over.get("name")  or repo.get("name", slug),
        "desc":  es_over.get("desc")  or repo.get("description") or "",
        "repo":  es_over.get("repo")  or html_url,
        "demo":  es_over.get("demo")  or repo.get("homepage") or "",
        "tags":  es_over.get("tags")  or topics_to_badges(topics),
    }
    if es_over.get("repoLabel"):
        es_item["repoLabel"] = es_over["repoLabel"]

    # --- EN ---
    en_over = override_en.get(slug, {})
    en_item = {
        "name":  en_over.get("name")  or es_item["name"],
        "desc":  en_over.get("desc")  or repo.get("description") or "",
        "repo":  en_over.get("repo")  or html_url,
        "demo":  en_over.get("demo")  or repo.get("homepage") or "",
        "tags":  en_over.get("tags")  or es_item["tags"],
    }
    if en_over.get("repoLabel"):
        en_item["repoLabel"] = en_over["repoLabel"]

    return es_item, en_item


def main():
    print(f"Buscando repos con topic '{PORTFOLIO_T}' de {USERNAME}...")
    repos = fetch_portfolio_repos()
    print(f"  {len(repos)} repos encontrados: {[r['name'] for r in repos]}")

    override = load_override()
    override_es = override.get("es", {})
    override_en = override.get("en", {})

    items_es, items_en = [], []
    for repo in repos:
        es, en = build_item(repo, override_es, override_en)
        items_es.append(es)
        items_en.append(en)
        print(f"  + {repo['name']} {'[override]' if repo['name'] in override_es else '[auto]'}")

    # Actualizar ES
    lang_es = load_lang(LANG_ES)
    lang_es.setdefault("projects", {})["items"] = items_es
    save_lang(LANG_ES, lang_es)

    # Actualizar EN
    lang_en = load_lang(LANG_EN)
    lang_en.setdefault("projects", {})["items"] = items_en
    save_lang(LANG_EN, lang_en)

    print("\n✅ Proyectos actualizados correctamente.")


if __name__ == "__main__":
    main()
