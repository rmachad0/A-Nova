# Planilha de Cálculo A Nova — Guia do Projeto

## Links principais

| Recurso | URL |
|---|---|
| **App em produção** | https://anovanet-calc.vercel.app |
| **Repositório GitHub** | https://github.com/rmachad0/A-Nova |
| **Painel Vercel** | https://vercel.com/a-nova/anovanet-calc |

---

## O que é este projeto

SaaS interno de cálculo de cotações para a A Nova. Permite criar simulações de preço de venda com três módulos (Faturamento Direto, Fabricante Estrangeiro, Via Distribuidor), acompanhar o histórico de cotações, gerenciar status (Em andamento / Ganho / Perdido) e visualizar indicadores financeiros.

---

## Tecnologias

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Banco de dados**: PostgreSQL via Neon + Prisma v5
- **Autenticação**: NextAuth v4
- **UI**: TailwindCSS — tema dark com glassmorphism e neon verde (#39FF14)
- **Deploy**: Vercel (automático ao fazer push na branch principal)

---

## Estrutura de pastas

```
anovanet-calc/
├── prisma/
│   └── schema.prisma          # Modelos: User, Calculo, Fabricante, Distribuidor, AuditLog
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── calculos/      # GET (lista) · POST (cria)
│   │   │   │   └── [id]/      # PATCH (status) · DELETE (exclui)
│   │   │   ├── dashboard/     # KPIs e dados do dashboard
│   │   │   └── financeiro/    # Dados financeiros acumulados
│   │   ├── dashboard/         # Página principal com KPIs e gráficos
│   │   ├── simulador/         # Formulário de cálculo (3 módulos)
│   │   ├── historico/         # Tabela de cotações com edição de status e exclusão
│   │   ├── financeiro/        # Gráficos financeiros
│   │   ├── relatorios/        # Geração de PDF (4 tipos de relatório)
│   │   └── login/             # Autenticação
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx   # Layout principal com sidebar
│   │   │   └── Sidebar.tsx    # Menu lateral
│   │   └── dashboard/         # KpiCard, MetaVendas, PipelineCotacoes, etc.
│   └── lib/
│       ├── auth.ts            # Configuração NextAuth
│       ├── db.ts              # Cliente Prisma singleton
│       └── utils.ts           # formatBRL, formatPct, cn
```

---

## Funcionalidades por página

### Dashboard `/dashboard`
- KPIs: faturamento, lucro, margem média, cotações ativas
- Meta de vendas com barra de progresso
- Pipeline de cotações (funil por status)
- Gráfico de faturamento mensal
- Sugestões de fechamento

### Simulador `/simulador`
- **Faturamento Direto**: custo BRL + markup → preço de venda
- **Fabricante Estrangeiro**: custo USD com câmbio + impostos de importação
- **Via Distribuidor**: busca distribuidores cadastrados, aplica margem

### Histórico `/historico`
- Lista paginada de cotações (15 por página)
- Filtros por módulo e status
- Busca por cliente/fabricante
- Alteração de status inline (dropdown)
- **Exclusão de linha** — ícone lixeira aparece ao passar o mouse, pede confirmação
- Cronograma financeiro ao clicar em cotações "Ganho" (data venda → D+30 recebimento → imposto)

### Financeiro `/financeiro`
- Valor acumulado a receber
- Gráfico de recebimentos por mês
- Gráfico de impostos a pagar

### Relatórios `/relatorios`
- 4 tipos: Resumo Executivo, Análise de Margens, Projeção Financeira, Relatório Completo
- Filtro por período
- Exportação PDF com jsPDF

---

## Como fazer deploy

```bash
cd anovanet-calc
npx vercel --prod --yes
```

O Vercel executa automaticamente `prisma generate && next build`.

---

## Como rodar localmente

```bash
cd anovanet-calc
npm run dev          # Inicia em http://localhost:3000
npm run db:studio    # Abre o Prisma Studio (visualizar dados)
npm run db:push      # Aplica mudanças no schema ao banco
```

---

## Variáveis de ambiente necessárias (`.env`)

```
DATABASE_URL=        # String de conexão Neon PostgreSQL
NEXTAUTH_SECRET=     # Segredo para JWT
NEXTAUTH_URL=        # URL da aplicação (ex: https://anovanet-calc.vercel.app)
```

---

## Histórico de mudanças principais

| Data | Mudança |
|---|---|
| Mai 2026 | UI modernizada — glassmorphism, gradient orbs, design system dark |
| Mai 2026 | Função de excluir linha no histórico (API DELETE + confirmação inline) |
| Antes | Importação de 98 cotações da planilha 2026 |
| Antes | Layout responsivo + números do dashboard clicáveis |
| Antes | Página de relatórios com exportação PDF |

---

## PR aberto

- **#2 — feat: add delete row function** → https://github.com/rmachad0/A-Nova/pull/2
