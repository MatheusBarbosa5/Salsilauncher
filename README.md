# Salsilauncher
Launcher Social de Jogos para as matérias de SPOINT e SPODES do 4º Ano do Curso Técnico de Desenvolvimento de Sistemas Integrado ao Ensino Médio do IFSP.


## Servidor atualizado

As tabelas de usuários, jogos, amizades, mensagens, coleções, avaliações e sessões estão implementadas em `server/`. Consulte [server/README.md](server/README.md) para instalação, migrações e exemplos da API. As funções online estão integradas ao frontend; consulte [GUIA_FRONTEND.md](GUIA_FRONTEND.md).

## Aplicativo Electron (Windows)

Na pasta `frontend`, instale as dependências com `npm install` e crie o instalador com `npm run dist`. O instalador fica em `frontend/release/`. Para desenvolvimento, use `npm run electron:dev`.

O aplicativo empacota a interface. As APIs Python locais continuam precisando estar instaladas e em execução nas portas `8000` e `8001`; use `iniciar_salsilauncher.bat` na raiz para iniciar os serviços.
