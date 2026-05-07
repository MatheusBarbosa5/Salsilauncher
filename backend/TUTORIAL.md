# Como rodar o backend

1. **Instalação do uv (somente na primeira vez):**
```bash
pip install uv
```

2. **Instalação das dependências:**
```bash
cd backend
uv sync
```

3. **Rodar o servidor:**
```bash
.venv\Scripts\Activate.ps1
fastapi dev
```