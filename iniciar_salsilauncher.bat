@echo off
setlocal
title Salsilauncher - Iniciar tudo
cd /d "%~dp0"

where uv >nul 2>&1 || (echo [ERRO] uv nao encontrado. Instale em https://docs.astral.sh/uv/ & pause & exit /b 1)
where npm >nul 2>&1 || (echo [ERRO] Node.js/npm nao encontrado. & pause & exit /b 1)

:: Gera server\.env com SECRET_KEY aleatoria na primeira execucao
if not exist "server\.env" (
    echo [INFO] Criando server\.env ...
    powershell -NoProfile -Command "$k = -join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) }); (Get-Content -LiteralPath 'server\.env.example') -replace '^SECRET_KEY=.*', ('SECRET_KEY=' + $k) | Set-Content -LiteralPath 'server\.env' -Encoding UTF8"
)

if not exist "frontend\node_modules" (
    echo [INFO] Instalando dependencias do frontend...
    pushd frontend & call npm install & popd
)

echo [INFO] Iniciando Backend local (8000)...
start "Salsilauncher - Backend :8000" cmd /k "cd /d %~dp0backend && uv run fastapi dev --port 8000"

echo [INFO] Iniciando Server (8001)...
start "Salsilauncher - Server :8001" cmd /k "cd /d %~dp0server && uv run python -m alembic upgrade head && uv run python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload"

echo [INFO] Iniciando Frontend (5173)...
start "Salsilauncher - Frontend :5173" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 6 >nul
start "" http://localhost:5173
endlocal
