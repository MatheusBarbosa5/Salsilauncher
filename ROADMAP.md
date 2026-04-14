# Roadmap do Salsilauncher (Versão Atual)

## Fase 0 — Setup Inicial (Em andamento)

* [ ] Criar repositório no GitHub
* [ ] Definir estrutura de pastas (frontend, backend, docs)
* [ ] Configurar ambiente de desenvolvimento
* [ ] Setup inicial do backend com FastAPI
* [ ] Setup inicial do frontend com React + TypeScript + Vite
* [ ] Configurar comunicação básica frontend → backend
* [ ] Criar endpoint inicial de teste (`GET /`)
* [ ] Criar README inicial do projeto
* [ ] Definir padrão de branches e commits

---

## Fase 1 — Biblioteca Base (Entrega do mês que vem)

### Backend — Estrutura e Persistência

* [ ] Definir modelo de dados Game
* [ ] Configurar PostgreSQL
* [ ] Configurar ORM (SQLAlchemy ou SQLModel)
* [ ] Criar tabela de jogos

### Backend — API (CRUD)

* [ ] Criar endpoint `GET /games`
* [ ] Criar endpoint `GET /games/{id}`
* [ ] Criar endpoint `POST /games`
* [ ] Criar endpoint `PUT /games/{id}`
* [ ] Criar endpoint `DELETE /games/{id}`

### Backend — Busca

* [ ] Implementar busca por nome via query param
* [ ] Normalizar strings para busca (lowercase, trim)

---

### Frontend — Estrutura

* [ ] Criar estrutura base do projeto
* [ ] Criar layout principal da aplicação
* [ ] Criar sistema de rotas

---

### Frontend — Biblioteca

* [ ] Criar componente GameCard
* [ ] Criar tela de listagem de jogos
* [ ] Integrar listagem com backend

---

### Frontend — Cadastro e Edição

* [ ] Criar formulário de cadastro de jogo
* [ ] Criar funcionalidade de edição de jogo
* [ ] Validar campos obrigatórios

---

### Frontend — Página de Jogo

* [ ] Criar página individual de jogo
* [ ] Exibir informações detalhadas

---

### Frontend — Busca

* [ ] Criar input de busca
* [ ] Integrar busca com backend
* [ ] Atualizar lista dinamicamente

---

### Integração

* [ ] Criar camada de serviços para API
* [ ] Conectar frontend com endpoints do backend
* [ ] Implementar tratamento de erros

---

### Qualidade mínima

* [ ] Validar inputs no frontend
* [ ] Criar tratamento global de erros no backend
* [ ] Implementar logs básicos

---

## Critério de Conclusão da Fase 1

* [ ] Usuário consegue cadastrar jogos
* [ ] Usuário consegue editar jogos
* [ ] Usuário consegue deletar jogos
* [ ] Usuário consegue buscar jogos
* [ ] Interface funcional e utilizável
* [ ] Integração frontend/backend estável

---

## Observações

* Não implementar funcionalidades além da biblioteca nesta fase
* Priorizar estabilidade sobre complexidade