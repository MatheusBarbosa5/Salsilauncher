# Salsilauncher Server — catálogo e dados de usuários

Implementação das tabelas do diagrama: `users`, `games`, `friendships`, `messages`, `collections`, `ratings` e `play_sessions`. A tabela adicional `collection_games` relaciona coleções a jogos. O servidor não abre executáveis nem acessa pastas do computador do jogador.

O catálogo global e a pesquisa Steam do projeto foram preservados: pesquisar apenas retorna candidatos, enquanto selecionar um AppID em `/games/resolve` persiste/reativa somente aquele jogo.

## Instalação e execução

Execute dentro da pasta `server/` (Python 3.12 ou superior):

```bash
uv sync --locked
```

Copie `.env.example` para `.env`:

```bash
# Linux
cp .env.example .env
```

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

Se `.env` já existir, preserve-o e adicione apenas as variáveis ausentes. Gere uma chave:

```bash
uv run python -c "import secrets; print(secrets.token_hex(32))"
```

Coloque o resultado em `SECRET_KEY` no `.env`. Mantenha o mesmo valor entre reinícios; mudá-lo invalida os tokens existentes. O servidor usa a porta 8000; o backend local usa a porta 8001.

Antes de atualizar um banco existente, faça uma cópia de `salsilauncher-server.db` com os serviços parados. Depois:

```bash
uv run python -m alembic upgrade head
uv run python main.py
```

Documentação interativa: <http://127.0.0.1:8000/docs>.

O `link-mode = "copy"` já está no `pyproject.toml` para evitar os problemas de hardlink. Se o `uv` estiver instalado em um ambiente separado, use o caminho desse executável ou adicione-o ao PATH. `uv run` usa a `.venv` do projeto sem exigir ativação. Não reutilize uma `.venv` do Windows no Linux.

Para PostgreSQL, substitua `DATABASE_URL` no `.env` pela connection string real, por exemplo:

```env
DATABASE_URL=postgresql+psycopg://USUARIO:SENHA@HOST:5432/postgres?sslmode=require
```

As migrações precisam de uma conexão ao banco. O servidor não aplica migrações automaticamente ao iniciar. A conexão real a PostgreSQL e consultas Steam ao vivo não foram verificadas neste ambiente.

## Modelos e compatibilidade

| Tabela | Dados e comportamento |
|---|---|
| `users` | Campos do diagrama; senha Argon2id, preferências, perfil, atividade/login e desativação |
| `games` | Nome, descrição, imagens, desenvolvedor, publicadora, data de lançamento e timestamps |
| `friendships` | Pedido, aceite, rejeição ou bloqueio; remetente e destinatário |
| `messages` | Remetente, destinatário, conteúdo e horários de envio/leitura |
| `collections` | Nome, descrição e dono da coleção |
| `collection_games` | Associação entre coleção e jogos do catálogo |
| `ratings` | Nota inteira de 0 a 10 e comentário; uma avaliação por usuário/jogo |
| `play_sessions` | Início, fim e duração calculada em segundos, sem PID/caminhos locais |

`games` conserva `steam_appid`, `extra_images`, `genres` e `is_active`, que já eram usados pelo projeto. `friendships` acrescenta `pair_key` para evitar duplicatas invertidas e `blocked_by_id` para identificar quem pode remover o bloqueio.

O nome antigo da tabela `game` passa a ser `games`. Na API, os nomes antigos continuam disponíveis para compatibilidade:

| Coluna SQL do diagrama | Campo anterior na API | Campo adicional na resposta |
|---|---|---|
| `name` | `title` | `name` |
| `cover_url` | `cover` | `cover_url` |
| `header_url` | `background` | `header_url` |

Ao criar/atualizar um jogo, pode usar os nomes antigos OU os nomes do diagrama. Evite enviar os dois aliases do mesmo campo no corpo. `release_date` usa `YYYY-MM-DD`; pode ser informada manualmente. A consulta Steam preenche desenvolvedor e publicadora quando presentes.

## Contas e autenticação

| Método | Endpoint | Função |
|---|---|---|
| POST | `/auth/register` ou `/users/` | Cadastrar conta |
| POST | `/auth/login` | Obter JWT |
| GET | `/auth/me` ou `/users/me` | Consultar dados da própria conta |
| GET | `/users/` | Listar perfis públicos, sem email/hash |
| GET | `/users/{id}` | Consultar perfil público |
| PUT/PATCH | `/users/{id}` | Editar somente a própria conta, inclusive senha |
| DELETE | `/users/{id}` | Desativar somente a própria conta |

Cadastro:

```json
{
  "username": "renan",
  "email": "renan@example.com",
  "password": "uma-senha-forte",
  "display_name": "Renan",
  "language": "pt-BR",
  "theme": "dark"
}
```

Usuário: 3–80 caracteres (letras sem acentos, números, ponto, hífen ou sublinhado). Senha nova: 8–128 caracteres. Email e username são normalizados para minúsculas e têm restrições de unicidade.

Login:

```json
{"email": "renan@example.com", "password": "uma-senha-forte"}
```

Copie `access_token`, clique em **Authorize** no Swagger e cole somente o token. Em requisições do launcher, envie:

```http
Authorization: Bearer SEU_TOKEN
```

O servidor determina `user_id` pelo JWT. Você não envia `user_id`, `sender_id`, `duration_seconds`, `password_hash`, `is_active` ou `is_banned` para controlar os dados pessoais. Campos extras são rejeitados. Tokens expiram em 60 minutos por padrão, configuráveis em `ACCESS_TOKEN_MINUTES`. Desativação/banimento impedem imediatamente o uso de tokens; alteração de senha não revoga tokens já emitidos nesta versão.

A versão enviada armazenava a senha diretamente no campo `password_hash` e tinha a condição de banimento invertida. Ambas foram corrigidas. A migração `0003` transforma os valores legados em texto puro em Argon2id, sem imprimir senhas nem exigir recadastro; hashes bcrypt/Argon2 já existentes são preservados. Datas históricas são mantidas.

## Amizades

| Método | Endpoint | Função |
|---|---|---|
| GET | `/friendships/` | Listar relações da própria conta |
| POST | `/friendships/` | Criar pedido: `{"friend_id": 2}` |
| GET | `/friendships/{id}` | Consultar relação em que participa |
| PATCH | `/friendships/{id}` | Alterar status |
| DELETE | `/friendships/{id}` | Cancelar pedido/remover amizade/desbloquear |

Status: `pending`, `accepted`, `rejected`, `blocked`. Apenas o destinatário aceita ou rejeita um pedido pendente:

```json
{"status": "accepted"}
```

Qualquer participante pode bloquear. Somente quem bloqueou pode remover o bloqueio. Pedidos invertidos, duplicados ou para si mesmo são rejeitados. Para reenviar um pedido rejeitado, remova primeiro a relação existente.

## Mensagens

| Método | Endpoint | Função |
|---|---|---|
| GET | `/messages/` | Listar mensagens enviadas/recebidas; filtro `with_user_id` |
| POST | `/messages/` | Enviar entre amigos aceitos e sem bloqueio |
| GET | `/messages/{id}` | Consultar mensagem como participante |
| PATCH | `/messages/{id}` | Remetente edita conteúdo antes da leitura |
| PATCH | `/messages/{id}/read` | Destinatário marca como lida, sem corpo |
| DELETE | `/messages/{id}` | Remetente exclui a mensagem para ambos |

Corpo de envio:

```json
{"receiver_id": 2, "content": "Vamos jogar?"}
```

O histórico permanece acessível aos dois participantes após desfazer/bloquear a amizade, mas novas mensagens e edições são proibidas. O endpoint de leitura não muda o horário se a mensagem já estiver lida. Não há WebSocket/notificações nesta etapa; o frontend pode consultar a listagem.

## Coleções

| Método | Endpoint | Função |
|---|---|---|
| GET/POST | `/collections/` | Listar/criar coleções da conta |
| GET | `/collections/{id}` | Dados da coleção e `game_ids` |
| GET | `/collections/{id}/games` | Jogos ativos vinculados |
| PUT/PATCH | `/collections/{id}` | Atualizar nome/descrição/jogos |
| POST | `/collections/{id}/games/{game_id}` | Adicionar jogo sem duplicar |
| DELETE | `/collections/{id}/games/{game_id}` | Remover vínculo |
| DELETE | `/collections/{id}` | Excluir coleção e vínculos |

```json
{"name": "Favoritos", "description": "Jogos para revisitar", "game_ids": [1, 2]}
```

Omitir `game_ids` ao atualizar mantém os vínculos; enviar `[]` remove todos. `description: null` apaga a descrição. Jogos referenciados precisam existir e estar ativos. Todas as operações verificam o proprietário.

## Avaliações

| Método | Endpoint | Função |
|---|---|---|
| GET/POST | `/ratings/` | Listar/criar avaliações da conta; filtro `game_id` |
| GET | `/ratings/{id}` | Consultar avaliação própria |
| PUT/PATCH | `/ratings/{id}` | Atualizar nota/comentário próprios |
| DELETE | `/ratings/{id}` | Excluir avaliação própria |

```json
{"game_id": 1, "score": 9, "review": "Muito bom!"}
```

Nota definida nesta implementação: inteiro de 0 a 10. Uma segunda avaliação da mesma conta para o mesmo jogo retorna 409; atualize a existente. Avaliações ficam privadas nesta etapa.

## Sessões

| Método | Endpoint | Função |
|---|---|---|
| GET/POST | `/play-sessions/` | Listar/criar sessões da conta; filtro `game_id` |
| GET | `/play-sessions/{id}` | Consultar sessão própria |
| PATCH | `/play-sessions/{id}/end` | Encerrar sessão e calcular duração |
| DELETE | `/play-sessions/{id}` | Excluir sessão própria |

Início:

```json
{"game_id": 1, "started_at": "2026-10-12T18:00:00Z"}
```

Encerramento:

```json
{"ended_at": "2026-10-12T18:30:00Z"}
```

Resultado: `duration_seconds = 1800`. Também pode enviar início e fim juntos no POST para importar uma sessão concluída. Datas precisam ter fuso; são normalizadas para UTC. Encerrar novamente com o mesmo horário não altera a sessão. Outro horário de encerramento retorna 409.

POST de sessão aceita `client_session_id` opcional (UUID). Reenviar a mesma identificação, usuário, jogo e horários retorna a sessão existente, sem duplicar. Sem essa identificação, repetir POST cria outra sessão. Identificações reutilizadas com outros dados retornam 409. Os horários são informados pelo launcher, sem validação antitrapaça. A interface lê o histórico do monitor pelo backend local e envia sessões concluídas ao clicar em “Sincronizar sessões concluídas” nos detalhes do jogo.

## Jogos e Steam

Consultas continuam disponíveis:

- `GET /games/`, `GET /games/{id}`;
- `GET /games/search?q=Celeste&limit=20`;
- `GET /games/steam/{appid}/metadata`.

Criação/seleção agora exige Bearer:

- `POST /games/`;
- `POST /games/resolve` com `{"steam_appid": 504230}`.

Editar/desativar um jogo global exige Bearer e também `X-Catalog-Key`, cujo valor é definido em `CATALOG_WRITE_KEY` no servidor. Se essa variável estiver vazia, edição/desativação ficam indisponíveis. Ela impede que qualquer conta altere os metadados de todos os usuários; não coloque essa chave no frontend. Gere uma chave separada da `SECRET_KEY` para essas operações administrativas.

`DELETE /games/{id}` é desativação, preservando referências e históricos. Pesquisar não salva candidatos; resolução do mesmo AppID mantém o ID canônico. Jogos sem AppID podem ser criados manualmente com seus metadados.

## Migrações e validação

- `0001`: cria as tabelas antigas em banco novo ou adota as tabelas existentes.
- `0002`: renomeia `game`/colunas, acrescenta metadados e cria as tabelas sociais com chaves estrangeiras.
- `0004`: adiciona o identificador opcional de sincronização das sessões.
- `0003`: corrige senhas legadas e normaliza email/username. Caso existam identidades que colidam após conversão para minúsculas, a migração exige resolver a duplicidade.

O banco SQLite incluído no ZIP foi atualizado preservando o cadastro existente. Se utilizar seu próprio banco, execute as migrações nele; não substitua seu banco por outro arquivo para atualizá-lo. Downgrade das tabelas sociais não é automático: restaure um backup para voltar à versão antiga sem perder dados.

Testes:

```bash
uv run python -m pytest -q
uv run python -m alembic check
```

Cobertura: autenticação, senha, tokens, contas bloqueadas, acesso indevido, transições de amizade, mensagens, coleções, avaliações, sessões, seleção Steam simulada, migração de banco novo e preservação de registros de banco antigo.

Listagens usam `limit` e `offset`, no máximo 100 itens por página; pesquisa Steam tem no máximo 20. Respostas esperadas: 401 para falta/token inválido, 403 para ação não permitida, 404 para registro ausente/inacessível, 409 para duplicidade/estado conflitante, 422 para dados inválidos.

## Integração com o restante do projeto

O frontend agora conecta cadastro/login, conta, amizades, mensagens, coleções online, avaliações e histórico. O backend local acrescenta apenas `GET /games/{id}/sessions` para ler os registros do monitor. Consulte [GUIA_FRONTEND.md](../GUIA_FRONTEND.md) para usar as telas. O mapeamento de IDs é separado por conta e salvo no navegador; abrir jogos permanece no serviço local.

Não publique o backend local que abre executáveis na internet. Para hospedar esta API, configure banco PostgreSQL, HTTPS, origens CORS e limite de tentativas de login/cadastro. Esta implementação básica não inclui recuperação de senha, confirmação de email, refresh token, notificações ou implantação.

Referências de implementação: [FastAPI JWT](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/) e [Alembic para SQLite](https://alembic.sqlalchemy.org/en/latest/batch.html).
