# Salsilauncher Server — pesquisa sem persistência + seleção explícita

Servidor FastAPI responsável pelo catálogo global/canônico de jogos e pela integração com a Steam.

## Regra principal

**Pesquisar não cria jogos. Selecionar cria/resove um único jogo.**

Fluxo:

```text
Frontend
   |
   | GET /games/search?q=Undertale
   v
Server
   |
   +--> catálogo local tem candidatos? --> retorna candidatos
   |
   +--> não tem? --> pesquisa Steam --> retorna candidatos
   |
   |  NENHUM candidato é salvo aqui
   v
Frontend exibe 3 resultados
   |
   | usuário escolhe UM resultado, por exemplo steam_appid=391540
   v
POST /games/resolve
{"steam_appid": 391540}
   |
   v
Server consulta App Details
   |
   v
persiste/reativa SOMENTE esse jogo
   |
   v
retorna Game canônico
```

Isso evita que uma pesquisa por um nome ambíguo, como `Undertale`, polua o catálogo com todos os resultados encontrados.

## API

### Pesquisa

`GET /games/search?q=<termo>&limit=20`

Exemplo de resposta:

```json
{
  "source": "steam",
  "results": [
    {
      "id": null,
      "title": "Undertale",
      "steam_appid": 391540,
      "cover": "..."
    },
    {
      "id": null,
      "title": "Undertale Soundtrack",
      "steam_appid": 358270,
      "cover": "..."
    }
  ]
}
```

A resposta é apenas uma lista de **candidatos**. Ela não altera o banco.

### Seleção explícita

`POST /games/resolve`

```json
{
  "steam_appid": 391540
}
```

Esse endpoint consulta os detalhes da Steam e persiste/reativa somente o AppID informado.

### Compatibilidade

`POST /games/` continua aceitando `steam_appid`. Quando o AppID é enviado, ele é tratado como uma seleção explícita e usa a mesma resolução idempotente de `/games/resolve`.

## Responsabilidades

Este servidor mantém metadados globais/canônicos:

- título;
- Steam AppID;
- descrição;
- capa/background;
- imagens adicionais;
- gêneros.

Ele não executa jogos nem armazena `exe_path`, `folder_path` ou preferências particulares de usuário.

## Execução

```powershell
uv sync
uv run fastapi dev main.py
```

API: `http://127.0.0.1:8000`

Docs: `http://127.0.0.1:8000/docs`

## Testes

```powershell
uv run pytest
```
