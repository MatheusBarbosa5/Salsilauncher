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

# Como rodar o contador

1. **Entrar na pasta do backend**
```bash
cd backend
```

2. **Abrir o ambiente virtual**
```bash
. .venv\Scripts\activate
```

3. **Rodar o arquivo python**
```bash
python -m services.monitor_service
```
