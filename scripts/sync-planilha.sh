#!/bin/bash
# Sincroniza cotações da planilha Excel com o banco de dados
# Executado automaticamente de segunda a sexta às 15h

PROJETO="/Users/regianemachado/Library/CloudStorage/OneDrive-anovasolucao.net/anovanet-calc"
LOG="$PROJETO/scripts/sync.log"

echo "========================================" >> "$LOG"
echo "Início: $(date '+%d/%m/%Y %H:%M:%S')" >> "$LOG"

cd "$PROJETO" && \
  /usr/local/bin/node node_modules/.bin/tsx prisma/importar-planilha.ts >> "$LOG" 2>&1

echo "Fim: $(date '+%d/%m/%Y %H:%M:%S')" >> "$LOG"
