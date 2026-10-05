# Servidor do Salsilauncher

Esta versão completa `server/` como uma API remota independente. `backend/` continua sendo o serviço local do launcher. As telas React de cadastro e login agora fazem requisições reais ao servidor. A biblioteca mostrada nas outras telas ainda é a biblioteca LOCAL: este pacote não implementa sincronização automática entre os dois bancos.

## O que foi encontrado no projeto enviado

- `backend/`: FastAPI local com jogos, executáveis, monitor de processos, coleções, usuários e recursos sociais.
- `frontend/`: React; todas as requisições de jogos/coleções usam `localhost:8000`. Login e cadastro antes apenas redirecionavam a página.
- `server/app/`: rascunho que importava `services`, `core` e `utils` inexistentes nessa pasta, montava `uploads` sem garantir a pasta e ainda continha scan/browse de arquivos do computador.
- `frontend/` não incluía `tsconfig.json` nem a configuração do plugin React do Vite. Foram adicionados para compilar o projeto.
- Não há código Electron no ZIP. Por isso a solução mantém seu serviço Python local.

## Divisão das responsabilidades

| Parte | Porta em desenvolvimento | Responsabilidade |
|---|---:|---|
| React | 5173 | Interface, requisições e exibição |
| `backend/` local | 8000 | Scan, seleção e abertura de executáveis, monitor, biblioteca local |
| `server/` remoto | 8001 | Contas, biblioteca online, favoritos, tags, coleções, avaliações e sessões concluídas |
| SQLite ou PostgreSQL remoto | — | Dados persistentes de cada conta |

O servidor remoto não tem `exe_path`, `folder_path`, `pid`, `browse`, `scan`, `abrir` ou upload de imagens. Ele recebe URLs de imagens; arquivos em `backend/uploads/` continuam locais. Antes de hospedar, imagens próprias precisam de uma solução de armazenamento persistente. Uma URL `localhost` não funciona em outro computador.

## Executar o servidor novo

Abra um terminal dentro de `server/`:

```bash
uv sync --locked
```

Copie `.env.example` para `.env` (PowerShell: `Copy-Item .env.example .env`; Linux: `cp .env.example .env`). Gere uma chave:

```bash
uv run python -c "import secrets; print(secrets.token_hex(32))"
```

Coloque o valor em `SECRET_KEY` do `.env`. Depois:

```bash
uv run alembic upgrade head
uv run uvicorn app.main:create_app --factory --host 127.0.0.1 --port 8001 --reload
```

Abra <http://127.0.0.1:8001/docs>. `GET /health` verifica a conexão com o banco. As migrações devem ser executadas antes de usar as rotas de dados; a API não altera tabelas automaticamente ao iniciar.

Este comando parte da pasta `server/`, e não `server/app/`. O banco novo é `salsilauncher-remote.db`; não use o banco antigo do launcher como banco remoto.

## Executar o frontend e o backend local

Mantenha o backend e o monitor com os comandos que já usava. Em outro terminal, dentro de `backend/`:

```bash
uv sync
uv run fastapi dev main.py
```

O monitor permanece separado:

```bash
uv run python -m services.monitor_service
```

Dentro de `frontend/`, copie `.env.example` para `.env` e execute:

```bash
npm ci
npm run dev
```

A variável nova é `VITE_REMOTE_API_URL=http://127.0.0.1:8001`. Abra `/register`, crie uma conta e depois entre em `/login`. Usuário deve ter 3–80 caracteres (letras sem acentos, números, ponto, hífen ou sublinhado); senha deve ter 8–128 caracteres. O formulário exibe os erros da API.

O login é necessário para os dados online, mas não bloqueia o uso da biblioteca local. O token fica em `sessionStorage`, expira em 60 minutos por padrão e é removido quando a API responde 401. Fechar a sessão do navegador requer novo login. `logout()` está disponível no serviço, sem um botão novo na interface. Em Electron, a persistência do token deve ser implementada com armazenamento apropriado do processo principal. Renovação de token e recuperação de senha não fazem parte desta versão.

## Testar pela documentação da API

1. `POST /auth/register`: `{ "username": "renan", "email": "renan@example.com", "password": "uma-senha-forte" }`.
2. `POST /auth/login`: envie email e senha; copie `access_token`.
3. Clique em **Authorize** no Swagger e cole apenas o token.
4. Execute `GET /auth/me`.
5. Execute `POST /games/`: `{ "title": "Celeste", "steam_appid": 504230, "favorite": true }`.
6. Execute `GET /games/`.

O usuário vem da assinatura do JWT. Você não envia `owner_id`, `user_id` ou `password_hash` para cadastrar esses dados. Senhas são transformadas em Argon2id no servidor. O JWT contém identidade e expiração, não a senha. IDs de outras contas retornam 404.

## Endpoints implementados

| Recurso | Operações |
|---|---|
| Contas | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Biblioteca | `GET/POST /games/`, `GET/PUT/PATCH/DELETE /games/{id}` |
| Tags | `GET /tags/`, `POST /tags/?name=RPG` |
| Coleções | `GET/POST /collections/`, `GET/PUT/PATCH/DELETE /collections/{id}` |
| Jogos de coleção | `POST/DELETE /collections/{id}/games/{game_id}` |
| Sessões | `GET/POST /sessions/` |
| Avaliações | `GET /ratings/`, `PUT/DELETE /ratings/{game_id}` |
| Steam Store | `GET /steam/games/search?query=Celeste`, `GET /steam/games/{appid}` |

`GET /collections/{id}` retorna uma lista de jogos, seguindo o contrato do frontend existente. Listagens têm `limit` e `offset` (máximo de 100 itens por página). Não suponha que a primeira página contém toda a biblioteca.

`Game` representa uma entrada na biblioteca de UMA conta. A restrição do AppID é `(owner_id, steam_appid)`, permitindo o mesmo jogo em duas contas. Jogos sem AppID são permitidos. Como essa API guarda bibliotecas individuais, os campos pessoais ficam nessa entrada, e o modelo `UserGame` do backend local não foi duplicado no servidor. Se futuramente houver catálogo compartilhado e reviews públicos, separe catálogo global e vínculo de biblioteca.

Coleções e tags também pertencem a uma conta. Avaliações são privadas nesta etapa, com `stars` de 0 a 5 e notas opcionais `gameplay`, `graphics` e `story` de 0 a 10. Amizades, mensagens, vínculo verificado de conta Steam e importação de jogos possuídos ainda estão apenas no código local; não foram publicados como rotas remotas. Uma URL de perfil Steam sozinha não comprova que alguém é dono da conta.

## Enviar dados do launcher para a nuvem

O serviço `frontend/src/services/remoteApi.ts` já fornece `remoteFetch`, `getCurrentUser`, `listRemoteGames`, `createRemoteGame` e `sendCompletedSession`. Cadastro e login estão conectados; os demais helpers estão prontos para a próxima etapa da interface.

Exemplo de biblioteca online:

```typescript
import { createRemoteGame, listRemoteGames } from "./services/remoteApi";

const remoteGame = await createRemoteGame({
  title: "Celeste",
  steam_appid: 504230,
  favorite: true,
});
const games = await listRemoteGames();
```

Não envie o objeto local inteiro: os esquemas remotos rejeitam campos extras, incluindo caminhos de executáveis. Os IDs locais e remotos são independentes. Antes de ligar todos os cards à API remota, implemente um mapeamento local por conta e máquina: `remote_user_id + remote_game_id → local_game_id/exe_path`. Nunca use um ID remoto diretamente em `localhost:8000/games/abrir/{id}`.

Para uma sessão concluída:

```typescript
await sendCompletedSession({
  game_id: remoteGame.id,
  client_session_id: crypto.randomUUID(),
  iniciada_em: "2026-09-30T10:00:00Z",
  encerrada_em: "2026-09-30T10:30:00Z",
});
```

`play_time` é medido em SEGUNDOS. Gere o UUID UMA vez por sessão, guarde-o na fila local e reutilize o mesmo corpo ao reenviar. A mesma sessão não aumenta o tempo duas vezes; o mesmo UUID com outro intervalo retorna 409. Duração válida: 1 segundo a 24 horas; sessões maiores precisam ser divididas. O servidor acumula o tempo com atualização atômica no banco, mas os tempos enviados pelo launcher continuam sendo dados informados pelo cliente, sem mecanismo antitrapaça.

A sincronização futura precisa tratar: login de outra conta na mesma máquina, fila offline, resolução de conflitos, importação dos registros antigos e exclusões. Ela ainda NÃO está automática neste pacote. O total antigo de tempo jogado também não é importado automaticamente.

## PostgreSQL e hospedagem

Use um banco NOVO. Coloque a connection string real no `.env` de `server/`:

```env
DATABASE_URL=postgresql+psycopg://USUARIO:SENHA@HOST:5432/postgres?sslmode=require
```

Copie os valores do provedor; caracteres especiais da senha precisam estar codificados corretamente na URL. Nunca envie a senha do banco ao React. Execute novamente `uv run alembic upgrade head` nesse banco. Isso cria a estrutura, sem copiar os dados do SQLite local.

Para um serviço hospedado, diretório de trabalho `server/`, instalação `uv sync --locked --no-dev`, migração `uv run alembic upgrade head`, comando de execução:

```bash
uv run uvicorn app.main:create_app --factory --host 0.0.0.0 --port "$PORT"
```

Configure `DATABASE_URL`, `SECRET_KEY`, `ACCESS_TOKEN_MINUTES` e `CORS_ORIGINS` no provedor. Configure `VITE_REMOTE_API_URL` com a URL HTTPS pública e faça novo build do frontend; variáveis Vite são incorporadas no build. Aplique migrações em uma etapa separada antes de iniciar os workers. O projeto não foi publicado nem conectado a uma conta de hospedagem.

O backend LOCAL deve permanecer ligado a `127.0.0.1`; não o publique na internet. Suas rotas antigas não ganharam autenticação e incluem operações sobre o computador.

Antes de abrir cadastro público, adicione limite de tentativas/cadastro no serviço ou proxy. Esta entrega não inclui email de verificação, recuperação de senha, revogação imediata de JWT ou implantação em produção.

## Validação

Dentro de `server/`: `uv run pytest -q`. Os testes usam bancos SQLite temporários e duas contas, cobrindo login, hash da senha, duplicidade, tokens, contas bloqueadas, jogos/tags/coleções/avaliações privadas, idempotência das sessões e falhas Steam simuladas.

Dentro de `frontend/`: `npm run build`.

O PostgreSQL foi preparado no código e nas migrações; não houve conexão com um PostgreSQL real. As respostas Steam foram testadas com mocks, sem validar disponibilidade da Steam ao vivo.

Referências: [FastAPI — JWT e hashing](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/) e [SQLModel — estrutura e tabelas](https://sqlmodel.tiangolo.com/tutorial/create-db-and-table/).
