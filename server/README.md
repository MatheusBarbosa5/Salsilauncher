# API remota do Salsilauncher

Consulte [GUIA_SERVIDOR.md](../GUIA_SERVIDOR.md) na raiz do projeto.

Execute a partir desta pasta:

```bash
uv sync --locked
# Copie .env.example para .env e configure SECRET_KEY.
uv run alembic upgrade head
uv run uvicorn app.main:create_app --factory --host 127.0.0.1 --port 8001 --reload
```

Documentação: http://127.0.0.1:8001/docs

Testes: `uv run pytest -q`.
