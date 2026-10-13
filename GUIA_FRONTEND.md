# Usar as funções online no Salsilauncher

A interface foi conectada ao servidor desta versão. Você pode criar conta, entrar/sair, editar o perfil, enviar pedidos de amizade, conversar, criar coleções online, avaliar jogos e sincronizar partidas concluídas.

## Antes de executar

Atualize as pastas `frontend/`, `server/` e `backend/` do projeto a partir deste pacote. Preserve seu `.env` e seus próprios bancos. O backend recebeu uma rota para ler sessões; sem atualizar essa pasta, o envio de partidas pela interface retorna erro.

Não sobrescreva seu banco com o banco incluído no ZIP. Faça backup do seu banco com os serviços parados e aplique as migrações nele, usando sua `DATABASE_URL`. A nova migração é `0004` (identificação de sessões para evitar duplicidade).

Copie `frontend/.env.example` para `frontend/.env`, ou acrescente as variáveis abaixo ao arquivo existente:

```env
VITE_LOCAL_API_URL=http://localhost:8000
VITE_REMOTE_API_URL=http://127.0.0.1:8001
```

As configurações são lidas pelo Vite. Reinicie `npm run dev` depois de alterá-las; para distribuição, refaça o build. Nenhuma senha do banco ou chave administrativa do catálogo deve entrar nesse arquivo do frontend.

No `server/.env`, configure `SECRET_KEY` e `DATABASE_URL`, conforme `server/README.md`. Configure `CORS_ORIGINS` com a origem real do frontend. O padrão já permite `http://localhost:5173` e `http://127.0.0.1:5173`.

## Rodar em quatro terminais

Na pasta `server/`:

```bash
uv sync --locked
uv run python -m alembic upgrade head
uv run python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

Na pasta `backend/`:

```bash
uv sync
uv run python -m fastapi dev main.py
```

Em outro terminal dentro de `backend/`, deixe o monitor ligado:

```bash
uv run python -m services.monitor_service
```

Na pasta `frontend/`:

```bash
npm ci
npm run dev
```

Abra a URL exibida pelo Vite. O modo de cópia já está configurado no backend e no servidor. O comando `uv` precisa estar disponível no seu terminal; se o instalou em um ambiente isolado, use o caminho completo do executável ou configure o PATH.

## Onde encontrar as funções

| Local na interface | Funções |
|---|---|
| Login e cadastro | Cadastro real e autenticação pelo servidor |
| Nome/avatar no topo ou “Minha conta” | Perfil, email, username, avatar, senha, preferências, sair e desativar |
| “Comunidade” | Buscar pessoas, pedir/aceitar/rejeitar amizade, bloquear/desbloquear e conversar |
| “Coleções online” | Criar/editar/excluir coleções da conta e selecionar jogos do catálogo |
| Detalhes de um jogo local | Conectar ao catálogo, avaliar, adicionar a uma coleção e enviar sessões concluídas |
| “Histórico online” | Consultar as partidas sincronizadas, excluir registros e encerrar sessões online abertas |

A biblioteca local continua acessível sem login. As páginas online pedem login. O token fica no `sessionStorage`, permanece ao recarregar a aba e é removido no logout ou ao receber 401. Fechar a sessão do navegador exige login novamente. O servidor usa expiração de 60 minutos por padrão, sem renovação automática.

O frontend mostra mensagens de conexão, validação e permissão. Preferências de idioma/tema são salvas na conta; tradução da interface e troca visual de tema ainda não foram implementadas. O avatar usa uma URL de imagem; não foi criado um serviço de upload remoto.

## Coleções locais e online

A aba original “Coleções” continua administrando o SQLite local, com seu layout e seus recursos anteriores. “Coleções online” administra o banco da conta no servidor. Elas são apresentadas separadamente para evitar misturar IDs e sobrescrever sua organização local. Coleções locais antigas não são importadas automaticamente.

Na coleção online, pode buscar jogos do catálogo, selecionar em diferentes páginas e remover da seleção. Se um jogo local ainda não estiver no catálogo, conecte-o primeiro pela página de detalhes.

## Conectar um jogo local

Abra o jogo na biblioteca. No painel “Minha conta”, clique em **Conectar jogo Steam** quando existir AppID. O servidor resolve o AppID e usa a entidade canônica do catálogo.

Para jogos sem AppID, pode buscar e selecionar uma entrada existente, ou clicar em **Criar metadados no catálogo**. Nessa criação manual, são enviados título e descrição; caminhos, PID e imagens locais não são enviados. Se já existir um jogo equivalente, prefira selecioná-lo para evitar cadastros duplicados.

A associação entre jogo local e remoto é salva por URL dos serviços, conta e instalação local. IDs locais nunca são usados como IDs remotos. Desconectar remove apenas a associação local, sem excluir avaliações, coleções ou histórico no servidor. Em outro computador, conecte novamente a instalação ao mesmo jogo do catálogo.

## Avaliar e adicionar a uma coleção

Depois de conectar o jogo, informe a nota inteira de 0 a 10 e um comentário opcional. Pode salvar alterações ou excluir sua avaliação. A nota pertence à conta conectada.

No mesmo painel, escolha uma coleção online para incluir o jogo. Para remover vínculos, abra “Coleções online”, edite a coleção e remova o jogo da seleção.

## Sincronizar partidas

Jogue usando o fluxo local já existente e mantenha o monitor ligado. Quando ele registrar o encerramento, clique em **Sincronizar sessões concluídas** nos detalhes do jogo. Sessões ainda ativas são ignoradas.

Cada sessão recebe um UUID salvo no navegador ANTES do envio. A nova restrição no servidor evita duplicar a mesma partida ao reenviar ou repetir o clique. O envio não copia o total agregado antigo: ele importa os registros concluídos que ainda existem na tabela local de sessões.

A sincronização é manual, não ocorre automaticamente ao abrir/fechar o jogo. Não há fila offline em segundo plano. Se o servidor estiver indisponível, clique novamente quando a conexão voltar. O UUID guardado permite repetir a requisição.

A identificação de envio e os vínculos de instalação ficam no `localStorage`. Limpar os dados do navegador ou importar as mesmas sessões por outro navegador pode gerar novos UUIDs e duplicar o histórico. Não importe os mesmos registros em navegadores diferentes. Excluir uma sessão online não apaga sua origem local; sincronizar depois pode importá-la novamente.

O tempo local mostrado na barra do jogo continua sendo o tempo do backend. O total mostrado no painel da conta considera as sessões sincronizadas daquele jogo.

## Comunidade e mensagens

Busque pelo username ou nome de exibição. O destinatário vê opções de aceitar ou rejeitar. Só amizades aceitas e sem bloqueio permitem envio de mensagens.

“Conversa” abre o histórico. O remetente pode editar mensagens ainda não lidas e excluí-las para os dois participantes. O destinatário pode clicar em “Marcar como lida”. O histórico da conversa aberta é consultado a cada 10 segundos; “Atualizar” consulta imediatamente. Não há WebSocket ou notificações de desktop.

Bloquear impede novas mensagens. Só quem bloqueou pode desbloquear. A tela também permite abrir conversas antigas que permaneceram após remover a amizade. Listagens de mensagens, catálogo e sessões têm paginação.

## Verificações realizadas

- `npm run build`: TypeScript e build Vite passaram.
- `uv run python -m pytest -q` em `server/`: 13 testes passaram, incluindo reenvio de sessões sem duplicar.
- `uv run python tests/check_sessions.py` em `backend/`: leitura/paginação de sessões verificadas em banco temporário, sem abrir jogos.
- Interface exercitada em Chromium com duas contas e servidor real em banco temporário: cadastro, login, perfil, associação, avaliação, coleções, amizade, envio/leitura de mensagens, isolamento entre contas e logout.
- No teste da interface, jogos e sessões locais foram simulados. O endpoint local foi verificado separadamente. Não foi iniciado um executável Windows, nem testada a Steam ao vivo ou uma conexão PostgreSQL real.

A documentação detalhada dos endpoints e das regras permanece em `server/README.md`.
