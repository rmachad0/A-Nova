import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const anoAtual = new Date().getFullYear()

  // Todos os cálculos do ano atual (todos os status para ter visão completa)
  const calculos = await prisma.calculo.findMany({
    where: {
      data: {
        gte: new Date(`${anoAtual}-01-01`),
        lte: new Date(`${anoAtual}-12-31T23:59:59`),
      },
    },
    orderBy: { data: 'asc' },
  })

  // Agrupa por mês
  const meses: Record<string, {
    mesLabel: string
    mesNum: number
    imposto: number
    custoUSD: number
    custoBRL: number
    valorLiquido: number
    faturamento: number
    qtd: number
  }> = {}

  for (const c of calculos) {
    const d = new Date(c.data)
    const mesNum = d.getMonth() + 1
    const key = `${String(mesNum).padStart(2, '0')}`
    const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
      .replace(/^\w/, l => l.toUpperCase())

    if (!meses[key]) {
      meses[key] = { mesLabel: label, mesNum, imposto: 0, custoUSD: 0, custoBRL: 0, valorLiquido: 0, faturamento: 0, qtd: 0 }
    }

    meses[key].imposto       += c.imposto
    meses[key].custoUSD      += c.custoUSD ?? 0
    meses[key].custoBRL      += c.custoBRL ?? 0
    meses[key].valorLiquido  += c.lucroLiquido ?? c.margemLiquida ?? 0
    meses[key].faturamento   += c.precoVenda
    meses[key].qtd           += 1
  }

  // Preenche todos os meses do ano (mesmo os sem dados)
  const MESES_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const mesAtual = new Date().getMonth() + 1

  const porMes = MESES_LABELS.slice(0, mesAtual).map((label, i) => {
    const key = `${String(i + 1).padStart(2, '0')}`
    return {
      mes: label,
      mesNum: i + 1,
      imposto: meses[key]?.imposto ?? 0,
      custoUSD: meses[key]?.custoUSD ?? 0,
      custoBRL: meses[key]?.custoBRL ?? 0,
      valorLiquido: meses[key]?.valorLiquido ?? 0,
      faturamento: meses[key]?.faturamento ?? 0,
      qtd: meses[key]?.qtd ?? 0,
    }
  })

  // Acumulados no ano
  const acumuladoAno = {
    imposto:      calculos.reduce((a, c) => a + c.imposto, 0),
    custoUSD:     calculos.reduce((a, c) => a + (c.custoUSD ?? 0), 0),
    custoBRL:     calculos.reduce((a, c) => a + (c.custoBRL ?? 0), 0),
    valorLiquido: calculos.reduce((a, c) => a + (c.lucroLiquido ?? c.margemLiquida ?? 0), 0),
    faturamento:  calculos.reduce((a, c) => a + c.precoVenda, 0),
    qtd:          calculos.length,
  }

  // IOF e spread (módulo estrangeiro)
  const iofTotal     = calculos.reduce((a, c) => a + (c.iof438pct ?? 0), 0)
  const spreadTotal  = calculos.reduce((a, c) => a + (c.spread4pct ?? 0), 0)
  const iofPorMes    = porMes.map(m => {
    const key = `${String(m.mesNum).padStart(2, '0')}`
    return {
      mes: m.mes,
      iof: meses[key]
        ? calculos
            .filter(c => {
              const mn = new Date(c.data).getMonth() + 1
              return mn === m.mesNum
            })
            .reduce((a, c) => a + (c.iof438pct ?? 0), 0)
        : 0,
      spread: meses[key]
        ? calculos
            .filter(c => new Date(c.data).getMonth() + 1 === m.mesNum)
            .reduce((a, c) => a + (c.spread4pct ?? 0), 0)
        : 0,
    }
  })

  // Breakdown por tipo de imposto
  const impostosProduto = calculos.filter(c => c.tipo === 'Produto').reduce((a, c) => a + c.imposto, 0)
  const impostosServico = calculos.filter(c => c.tipo === 'Servico').reduce((a, c) => a + c.imposto, 0)

  return NextResponse.json({
    porMes,
    acumuladoAno,
    iofTotal,
    spreadTotal,
    iofPorMes,
    impostosProduto,
    impostosServico,
    anoAtual,
    mesAtual,
  })
}
