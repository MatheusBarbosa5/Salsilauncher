#!/bin/bash

# Cores para o terminal
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # Sem cor

echo "======================================================"
echo "          SALSILAUNCHER - SETUP (LINUX/MAC)"
echo "======================================================"

# 1. Verificar se o Node.js está instalado
if ! command -v node &> /dev/null
then
    echo -e "${RED}[ERRO] Node.js não encontrado!${NC}"
    echo "Por favor, instale o Node.js em: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}[OK] Node.js detectado.${NC}"

# 2. Verificar a pasta frontend
if [ ! -d "frontend" ]; then
    echo -e "${RED}[ERRO] Pasta 'frontend' não encontrada!${NC}"
    exit 1
fi

echo -e "${GREEN}[OK] Pasta 'frontend' encontrada.${NC}"
echo -e "[INFO] Iniciando instalação (npm install)..."
echo ""

# 3. Entrar e instalar
cd frontend && npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================================"
    echo -e "${GREEN}   SUCESSO! TUDO PRONTO PARA DESENVOLVER.${NC}"
    echo "   Para rodar o projeto: npm run dev"
    echo "======================================================"
else
    echo -e "${RED}[ERRO] Houve um problema na instalação.${NC}"
fi