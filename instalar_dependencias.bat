@echo off
title Setup Salsilauncher - Frontend
color 0A
echo ======================================================
echo           SALSILAUNCHER - SETUP AUTOMATICO
echo ======================================================
echo.

:: 1. Verificar se o Node.js esta instalado
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERRO] Node.js nao encontrado! 
    echo Por favor, instale o Node.js em: https://nodejs.org/
    echo.
    pause
    exit
)

echo [OK] Node.js detectado.
echo.

:: 2. Entrar na pasta frontend
if not exist "frontend" (
    color 0C
    echo [ERRO] Pasta 'frontend' nao encontrada!
    echo Certifique-se de que este arquivo esta na raiz do projeto.
    pause
    exit
)

echo [OK] Pasta 'frontend' encontrada.
echo [INFO] Iniciando instalacao das dependencias (npm install)...
echo Isso pode demorar alguns minutos...
echo.

cd frontend
call npm install

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERRO] Houve um problema na instalacao. Verifique sua conexao.
) else (
    echo.
    echo ======================================================
    echo    SUCESSO! TUDO PRONTO PARA DESENVOLVER.
    echo    Para rodar o projeto, use: npm run dev
    echo ======================================================
)

pause