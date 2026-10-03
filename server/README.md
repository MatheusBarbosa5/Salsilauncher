# Salsilauncher Server

API FastAPI responsável por persistir e fornecer **metadados dos jogos**.

## Responsabilidade do servidor

O servidor trabalha com dados como:

- título;
- descrição;
- Steam App ID;
- capa e background;
- imagens adicionais;
- gêneros;
- estado ativo/inativo do registro.

O servidor **não** acessa o sistema de arquivos do usuário e **não** executa jogos.

As responsabilidades abaixo ficam no launcher/Electron:

- selecionar executáveis (`browse`);
- descobrir jogos em pastas (`scan`);
- armazenar caminho de `.exe` ou pasta local;
- iniciar processos do jogo (`launch`/`abrir`);
- monitorar processos locais (`status`);
- calcular a execução local do jogo.

O cliente pode enviar posteriormente os dados de uma sessão de jogo para uma API própria de telemetria/histórico, caso esse módulo seja implementado.

## Rotas

### Sistema

- `GET /` — informa que a API está online e aponta para a documentação.
- `GET /health` — health check simples.

### Jogos

- `GET /games/` — lista jogos ativos. Aceita `q`, `limit` e `offset`.
- `GET /games/{game_id}` — retorna um jogo pelo ID.
- `POST /games/` — cria um registro de jogo; se houver `steam_appid`, tenta completar os metadados pela Steam.
- `PUT /games/{game_id}` — atualiza os metadados de um jogo.
- `DELETE /games/{game_id}` — desativa o registro sem apagar arquivos locais, porque o servidor não conhece esses arquivos.
- `GET /games/steam/{appid}/metadata` — consulta os metadados públicos de um jogo na Steam.

## O que foi removido desta pasta

Foram removidas as rotas e dependências relacionadas ao launcher local:

- `GET /games/browse`;
- `POST /games/scan`;
- `POST /games/abrir/{game_id}`;
- `POST /games/launch/{game_id}`;
- `GET /games/status/{game_id}`;
- `POST /games/upload-cover` e o armazenamento local de uploads;
- `exe_path` e `folder_path` dos modelos do servidor;
- dependência de `psutil` e uso de `subprocess`.

## Rodar

No diretório `server`:

```powershell
uv sync
uv run fastapi dev main.py
```

API: `http://127.0.0.1:8000`

Documentação: `http://127.0.0.1:8000/docs`

> O uso de `127.0.0.1` é apenas a forma atual de executar a API localmente durante o desenvolvimento. A aplicação já é um servidor HTTP FastAPI; isso não significa que ela seja um servidor remoto/de produção.
