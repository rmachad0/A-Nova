import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

const META_ANUAL = 2_000_000 // R$ 2 milhões

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const calculos = await prisma.calculo.findMany({
    include: { fabricante: true, distribuidor: true },
    orderBy: { data: 'asc' },
  })

  const ganhos = calculos.filter(c => c.status === 'Ganho')
  const emAndamento = calculos.filter(c => c.status === 'EmAndamento')
  const perdidos = calculos.filter(c => c.status === 'Perdido')

  // KPIs
  const faturamentoTotal = ganhos.reduce((acc, c) => acc + c.precoVenda, 0)
  const lucroTotal = ganhos.reduce((acc, c) => acc + (c.lucroLiquido ?? c.margemLiquida ?? 0), 0)
  const lucroMedioPct = ganhos.length > 0
    ? ganhos.reduce((acc, c) => acc + c.lucroPct, 0) / ganhos.length : 0
  const ticketMedio = ganhos.length > 0 ? faturamentoTotal / ganhos.length : 0

  // Meta anual
  const metaAnual = {
    meta: META_ANUAL,
    realizado: faturamentoTotal,
    percentual: Math.min((faturamentoTotal / META_ANUAL) * 100, 100),
    falta: Math.max(META_ANUAL - faturamentoTotal, 0),
    superado: faturamentoTotal > META_ANUAL,
  }

  // Pipeline de cotações
  const totalCotacoes = calculos.length
  const cotacoesGanhas = ganhos.length
  const cotacoesEmAndamento = emAndamento.length
  const cotacoesPerdidas = perdidos.length
  const taxaConversao = totalCotacoes > 0 ? (cotacoesGanhas / totalCotacoes) * 100 : 0
  const valorPipeline = emAndamento.reduce((acc, c) => acc + c.precoVenda, 0)
  const valorPerdido = perdidos.reduce((acc, c) => acc + c.precoVenda, 0)

  // Sugestões de fechamento baseadas nos dados reais
  const sugestoes: { tipo: string; titulo: string; descricao: string; valor?: number; cliente?: string }[] = []

  // Cotações em andamento há mais de 30 dias
  const hoje = new Date()
  const emAndamentoAntigos = emAndamento
    .filter(c => {
      const dias = Math.floor((hoje.getTime() - new Date(c.data).getTime()) / (1000 * 60 * 60 * 24))
      return dias > 30
    })
    .sort((a, b) => b.precoVenda - a.precoVenda)

  if (emAndamentoAntigos.length > 0) {
    const top = emAndamentoAntigos[0]
    const dias = Math.floor((hoje.getTime() - new Date(top.data).getTime()) / (1000 * 60 * 60 * 24))
    sugestoes.push({
      tipo: 'urgente',
      titulo: `${emAndamentoAntigos.length} cotação(ões) parada(s) há mais de 30 dias`,
      descricao: `"${top.cliente ?? 'Cliente'}" está em negociação há ${dias} dias (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(top.precoVenda)}). Retome o contato agora.`,
      valor: emAndamentoAntigos.reduce((a, c) => a + c.precoVenda, 0),
      cliente: top.cliente ?? undefined,
    })
  }

  // Se falta menos de 20% para bater a meta
  const faltaPct = ((META_ANUAL - faturamentoTotal) / META_ANUAL) * 100
  if (faltaPct > 0 && faltaPct <= 20) {
    sugestoes.push({
      tipo: 'meta',
      titulo: `Faltam apenas ${faltaPct.toFixed(1)}% para bater a meta anual!`,
      descricao: `Você precisa de mais ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(META_ANUAL - faturamentoTotal)} em vendas fechadas. Priorize as cotações em andamento de maior valor.`,
      valor: META_ANUAL - faturamentoTotal,
    })
  }

  // Cotações em andamento de alto valor (top 3)
  const topAndamento = [...emAndamento]
    .sort((a, b) => b.precoVenda - a.precoVenda)
    .slice(0, 3)

  if (topAndamento.length > 0) {
    sugestoes.push({
      tipo: 'oportunidade',
      titulo: `${topAndamento.length} grande(s) oportunidade(s) em aberto`,
      descricao: topAndamento
        .map(c => `• ${c.cliente ?? 'Cliente'}: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.precoVenda)}`)
        .join('\n'),
      valor: topAndamento.reduce((a, c) => a + c.precoVenda, 0),
    })
  }

  // Taxa de conversão baixa
  if (taxaConversao < 40 && totalCotacoes >= 3) {
    sugestoes.push({
      tipo: 'alerta',
      titulo: `Taxa de conversão em ${taxaConversao.toFixed(0)}% — abaixo do ideal`,
      descricao: `De ${totalCotacoes} cotações geradas, apenas ${cotacoesGanhas} foram fechadas. Revise a abordagem nas etapas finais da negociação e faça follow-up com os clientes perdidos.`,
    })
  }

  // Sugestão genérica se não houver cotações em andamento
  if (emAndamento.length === 0 && totalCotacoes === 0) {
    sugestoes.push({
      tipo: 'inicio',
      titulo: 'Comece gerando suas primeiras cotações',
      descricao: 'Use o Simulador para criar cotações e acompanhe o progresso em direção à meta de R$ 2.000.000,00.',
    })
  }

  // Evolução mensal
  const porMes: Record<string, { mes: string; faturamento: number; lucro: number; vendas: number }> = {}
  for (const c of ganhos) {
    const d = new Date(c.data)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    if (!porMes[key]) porMes[key] = { mes: label, faturamento: 0, lucro: 0, vendas: 0 }
    porMes[key].faturamento += c.precoVenda
    porMes[key].lucro += c.lucroLiquido ?? c.margemLiquida ?? 0
    porMes[key].vendas += 1
  }
  const evolucaoMensal = Object.entries(porMes).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v)

  // Por fabricante
  const porFabricante: Record<string, number> = {}
  for (const c of ganhos) {
    const nome = c.fabricante?.nome ?? 'Outros'
    porFabricante[nome] = (porFabricante[nome] ?? 0) + c.precoVenda
  }
  const vendasPorFabricante = Object.entries(porFabricante).sort(([, a], [, b]) => b - a).map(([nome, valor]) => ({ nome, valor }))

  // Por módulo
  const porModulo: Record<string, number> = {}
  for (const c of ganhos) porModulo[c.modulo] = (porModulo[c.modulo] ?? 0) + c.precoVenda
  const vendasPorModulo = Object.entries(porModulo).map(([nome, valor]) => ({ nome, valor }))

  // Por tipo NF
  const porTipo: Record<string, { faturamento: number; lucro: number; qtd: number }> = {}
  for (const c of ganhos) {
    const tipo = c.tipo === 'Produto' ? 'Produto / Solução' : c.tipo === 'Servico' ? 'Serviço' : 'N/A'
    if (!porTipo[tipo]) porTipo[tipo] = { faturamento: 0, lucro: 0, qtd: 0 }
    porTipo[tipo].faturamento += c.precoVenda
    porTipo[tipo].lucro += c.lucroLiquido ?? c.margemLiquida ?? 0
    porTipo[tipo].qtd += 1
  }
  const vendasPorTipo = Object.entries(porTipo).map(([tipo, dados]) => ({ tipo, ...dados }))

  // Por modalidade
  const porModalidade: Record<string, number> = {}
  for (const c of calculos.filter(c => c.modalidade)) {
    const m = c.modalidade!.replace('CartaoCredito', 'Cartão de Crédito').replace('TransferenciaBancaria', 'Transferência Bancária')
    porModalidade[m] = (porModalidade[m] ?? 0) + c.precoVenda
  }
  const vendasPorModalidade = Object.entries(porModalidade).map(([nome, valor]) => ({ nome, valor }))

  // Top lucros
  const topLucros = ganhos
    .sort((a, b) => (b.lucroLiquido ?? b.margemLiquida ?? 0) - (a.lucroLiquido ?? a.margemLiquida ?? 0))
    .slice(0, 10)
    .map(c => ({
      id: c.id,
      cliente: c.cliente ?? '—',
      fabricante: c.fabricante?.nome ?? '—',
      modulo: c.modulo,
      tipo: c.tipo,
      precoVenda: c.precoVenda,
      lucro: c.lucroLiquido ?? c.margemLiquida ?? 0,
      lucroPct: c.lucroPct,
      data: c.data,
    }))

  const statusBreakdown = {
    ganho: ganhos.length,
    perdido: perdidos.length,
    emAndamento: emAndamento.length,
  }

  return NextResponse.json({
    kpis: { faturamentoTotal, lucroTotal, lucroMedioPct, ticketMedio },
    metaAnual,
    pipeline: { totalCotacoes, cotacoesGanhas, cotacoesEmAndamento, cotacoesPerdidas, taxaConversao, valorPipeline, valorPerdido },
    sugestoes,
    evolucaoMensal,
    vendasPorFabricante,
    vendasPorModulo,
    vendasPorTipo,
    vendasPorModalidade,
    topLucros,
    statusBreakdown,
    totalCalculos: calculos.length,
  })
}
