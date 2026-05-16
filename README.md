# Planilha de Cálculo A Nova

> Inteligência comercial aplicada aos seus cálculos

Sistema SaaS que substitui integralmente a planilha Excel de precificação da A Nova. Fórmulas validadas célula a célula contra a planilha original.

---

## Módulos

| Módulo | Fórmulas |
|--------|----------|
| **Faturamento Direto** | Produto 9% / Serviço 19%, Markup livre |
| **Fabricante Estrangeiro** | IOF 4,38% fixo, Spread 4% (cartão), USD → BRL |
| **Via Distribuidor** | Repasse % parametrizável por parceiro |

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+ (local ou Neon/Supabase)
- npm ou pnpm

## Instalação

```bash
cd anovanet-calc
npm install
```

### Banco de dados

1. Crie o banco:
```sql
CREATE DATABASE anovanet_calc;
```

2. Configure o `.env`:
```
DATABASE_URL="postgresql://SEU_USER:SUA_SENHA@localhost:5432/anovanet_calc"
NEXTAUTH_SECRET="uma-chave-secreta-longa"
NEXTAUTH_URL="http://localhost:3000"
```

3. Aplique o schema e rode o seed:
```bash
npm run db:push
npm run db:seed
```

### Rodar em desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

### Credenciais padrão

| Email | Senha | Role |
|-------|-------|------|
| admin@anova.com.br | anova@2024 | Admin |
| comercial@anova.com.br | comercial@2024 | Comercial |

---

## Alíquotas (fixas, conforme planilha original)

| Campo | Valor |
|-------|-------|
| Imposto Produto | 10% |
| Imposto Serviço | 20% |
| Spread Cartão | 4% |
| IOF | **4,38%** ⚠️ (cabeçalho diz 3,5% mas fórmula real usa 4,38%) |

## Build para produção

```bash
npm run build
npm start
```
