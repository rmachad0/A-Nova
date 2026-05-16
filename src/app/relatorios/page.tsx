'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { formatBRL, formatPct } from '@/lib/utils'
import {
  FileText, Download, Loader2, Filter,
  BarChart2, Users, DollarSign, TrendingUp,
  CheckCircle, XCircle, Clock, Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── tipos ────────────────────────────────────────────────────────
type TipoRelatorio = 'executivo' | 'vendas' | 'financeiro' | 'clientes'

interface FiltrosRelatorio {
  tipo: TipoRelatorio
  status: string
  modulo: string
  dataInicio: string
  dataFim: string
  cliente: string
}

interface Calculo {
  id: string; modulo: string; tipo: string | null; status: string
  cliente: string | null; data: string; custoBRL: number | null
  custoUSD: number | null; dolar: number | null; markupPct: number
  precoVenda: number; imposto: number; lucroLiquido: number | null
  margemLiquida: number | null; lucroPct: number
  user: { name: string }; fabricante: { nome: string } | null
  distribuidor: { nome: string } | null
}

// ─── config dos tipos de relatório ────────────────────────────────
const TIPOS: { id: TipoRelatorio; label: string; desc: string; icon: React.ReactNode; cor: string }[] = [
  { id: 'executivo',   label: 'Executivo',          desc: 'Visão geral com KPIs, meta anual e pipeline',   icon: <BarChart2 className="w-5 h-5" />,  cor: 'neon' },
  { id: 'vendas',      label: 'Relatório de Vendas', desc: 'Lista completa de cotações com todos os dados',  icon: <TrendingUp className="w-5 h-5" />, cor: 'blue' },
  { id: 'financeiro',  label: 'Financeiro Mensal',   desc: 'Faturamento, custos e impostos mês a mês',       icon: <DollarSign className="w-5 h-5" />, cor: 'amber' },
  { id: 'clientes',    label: 'Por Cliente',          desc: 'Consolidado de vendas agrupado por cliente',    icon: <Users className="w-5 h-5" />,      cor: 'purple' },
]

const COR_CLASS: Record<string, string> = {
  neon:   'border-neon/30 bg-neon/5 text-neon',
  blue:   'border-blue-400/30 bg-blue-500/5 text-blue-400',
  amber:  'border-amber-400/30 bg-amber-500/5 text-amber-400',
  purple: 'border-purple-400/30 bg-purple-500/5 text-purple-400',
}

// ─── geração do PDF ───────────────────────────────────────────────
async function gerarPDF(filtros: FiltrosRelatorio, calculos: Calculo[], dashData: Record<string, unknown> | null, finData: Record<string, unknown> | null) {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const hoje = new Date().toLocaleDateString('pt-BR')
  const tipoLabel = TIPOS.find(t => t.id === filtros.tipo)?.label ?? ''

  // ── cabeçalho ──
  doc.setFillColor(10, 10, 10)
  doc.rect(0, 0, W, 22, 'F')
  doc.setFontSize(14)
  doc.setTextColor(57, 255, 20)
  doc.setFont('helvetica', 'bold')
  doc.text('Nova Solução Serviços de Tecnologia Ltda', 14, 10)
  doc.setFontSize(9)
  doc.setTextColor(170, 170, 170)
  doc.setFont('helvetica', 'normal')
  doc.text(`Relatório ${tipoLabel}  ·  Gerado em ${hoje}`, 14, 16)
  doc.setTextColor(57, 255, 20)
  doc.text('anovanet-calc.vercel.app', W - 14, 16, { align: 'right' })

  let y = 30

  // ── filtros aplicados ──
  const filtroTexto: string[] = []
  if (filtros.status) filtroTexto.push(`Status: ${filtros.status === 'EmAndamento' ? 'Em andamento' : filtros.status}`)
  if (filtros.modulo) filtroTexto.push(`Módulo: ${filtros.modulo}`)
  if (filtros.cliente) filtroTexto.push(`Cliente: ${filtros.cliente}`)
  if (filtros.dataInicio) filtroTexto.push(`De: ${new Date(filtros.dataInicio + 'T00:00').toLocaleDateString('pt-BR')}`)
  if (filtros.dataFim) filtroTexto.push(`Até: ${new Date(filtros.dataFim + 'T00:00').toLocaleDateString('pt-BR')}`)
  if (filtroTexto.length) {
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text('Filtros: ' + filtroTexto.join('  |  '), 14, y)
    y += 8
  }

  // ─── EXECUTIVO ────────────────────────────────────────────────
  if (filtros.tipo === 'executivo' && dashData) {
    const kpis = dashData.kpis as Record<string, number>
    const meta = dashData.metaAnual as Record<string, number | boolean>
    const pipeline = dashData.pipeline as Record<string, number>
    const top = dashData.topLucros as Calculo[]

    // KPI boxes
    const kpiData = [
      { label: 'Faturamento Total', valor: formatBRL(kpis?.faturamentoTotal ?? 0) },
      { label: 'Lucro Total', valor: formatBRL(kpis?.lucroTotal ?? 0) },
      { label: 'Lucro Médio', valor: formatPct(kpis?.lucroMedioPct ?? 0) },
      { label: 'Ticket Médio', valor: formatBRL(kpis?.ticketMedio ?? 0) },
    ]
    const bw = (W - 28 - 9) / 4
    kpiData.forEach((k, i) => {
      const x = 14 + i * (bw + 3)
      doc.setFillColor(20, 20, 20)
      doc.setDrawColor(57, 255, 20)
      doc.roundedRect(x, y, bw, 18, 2, 2, 'FD')
      doc.setFontSize(7); doc.setTextColor(130, 130, 130); doc.setFont('helvetica', 'normal')
      doc.text(k.label, x + 4, y + 6)
      doc.setFontSize(11); doc.setTextColor(57, 255, 20); doc.setFont('helvetica', 'bold')
      doc.text(k.valor, x + 4, y + 14)
    })
    y += 24

    // Meta Anual
    doc.setFontSize(10); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
    doc.text('Meta Anual de Vendas', 14, y)
    y += 5
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(170, 170, 170)
    const pct = Math.min(Number(meta?.percentual ?? 0), 100)
    doc.text(`Meta: ${formatBRL(Number(meta?.meta ?? 0))}  |  Realizado: ${formatBRL(Number(meta?.realizado ?? 0))}  |  ${pct.toFixed(1)}% atingido`, 14, y)
    y += 4
    doc.setFillColor(40, 40, 40); doc.rect(14, y, W - 28, 4, 'F')
    doc.setFillColor(57, 255, 20); doc.rect(14, y, (W - 28) * pct / 100, 4, 'F')
    y += 10

    // Pipeline
    const pipeData = [
      ['Total de cotações', String(pipeline?.totalCotacoes ?? 0)],
      ['Cotações ganhas', String(pipeline?.cotacoesGanhas ?? 0)],
      ['Em andamento', String(pipeline?.cotacoesEmAndamento ?? 0)],
      ['Perdidas', String(pipeline?.cotacoesPerdidas ?? 0)],
      ['Taxa de conversão', formatPct(pipeline?.taxaConversao ?? 0)],
      ['Valor em pipeline', formatBRL(pipeline?.valorPipeline ?? 0)],
    ]
    doc.setFontSize(10); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
    doc.text('Pipeline de Oportunidades', 14, y); y += 4
    autoTable(doc, {
      startY: y,
      head: [['Métrica', 'Valor']],
      body: pipeData,
      theme: 'grid',
      headStyles: { fillColor: [20, 20, 20], textColor: [57, 255, 20], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fillColor: [15, 15, 15], textColor: [200, 200, 200], fontSize: 8 },
      alternateRowStyles: { fillColor: [22, 22, 22] },
      tableWidth: 80,
      margin: { left: 14 },
    })
    const afterPipeline = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

    // Top 10 lucros
    if (top?.length) {
      doc.setFontSize(10); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
      doc.text('Top Lucros do Período', 14, afterPipeline)
      autoTable(doc, {
        startY: afterPipeline + 4,
        head: [['#', 'Cliente', 'Fabricante', 'Módulo', 'Venda', 'Lucro', 'Margem', 'Data']],
        body: top.slice(0, 10).map((t, i) => [
          String(i + 1), t.cliente ?? '—',
          (t as unknown as { fabricante: string }).fabricante ?? '—',
          t.modulo,
          formatBRL(t.precoVenda),
          formatBRL((t as unknown as { lucro: number }).lucro ?? t.lucroLiquido ?? 0),
          formatPct(t.lucroPct ?? 0),
          new Date(t.data).toLocaleDateString('pt-BR'),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [20, 20, 20], textColor: [57, 255, 20], fontStyle: 'bold', fontSize: 7 },
        bodyStyles: { fillColor: [15, 15, 15], textColor: [200, 200, 200], fontSize: 7 },
        alternateRowStyles: { fillColor: [22, 22, 22] },
        margin: { left: 14 },
      })
    }
  }

  // ─── VENDAS ───────────────────────────────────────────────────
  if (filtros.tipo === 'vendas') {
    const total = calculos.reduce((a, c) => a + c.precoVenda, 0)
    const lucro = calculos.reduce((a, c) => a + (c.lucroLiquido ?? c.margemLiquida ?? 0), 0)
    const imposto = calculos.reduce((a, c) => a + c.imposto, 0)

    // Resumo
    const resumo = [
      ['Total de cotações', String(calculos.length), 'Faturamento', formatBRL(total)],
      ['Ganhas', String(calculos.filter(c => c.status === 'Ganho').length), 'Lucro total', formatBRL(lucro)],
      ['Em andamento', String(calculos.filter(c => c.status === 'EmAndamento').length), 'Impostos', formatBRL(imposto)],
      ['Perdidas', String(calculos.filter(c => c.status === 'Perdido').length), 'Margem média', formatPct(calculos.length > 0 ? calculos.reduce((a, c) => a + c.lucroPct, 0) / calculos.length : 0)],
    ]
    doc.setFontSize(10); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
    doc.text('Resumo do Período', 14, y); y += 4
    autoTable(doc, {
      startY: y,
      head: [['Qtd', 'Valor', 'Financeiro', 'Valor']],
      body: resumo,
      theme: 'grid',
      headStyles: { fillColor: [20, 20, 20], textColor: [57, 255, 20], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fillColor: [15, 15, 15], textColor: [200, 200, 200], fontSize: 8 },
      alternateRowStyles: { fillColor: [22, 22, 22] },
      tableWidth: 140,
      margin: { left: 14 },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

    // Listagem completa
    doc.setFontSize(10); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
    doc.text(`Listagem de Cotações (${calculos.length})`, 14, y); y += 4
    autoTable(doc, {
      startY: y,
      head: [['Data', 'Cliente', 'Fabricante', 'Módulo', 'Tipo', 'Markup', 'Venda (R$)', 'Imposto (R$)', 'Lucro (R$)', 'Margem', 'Status', 'Usuário']],
      body: calculos.map(c => [
        new Date(c.data).toLocaleDateString('pt-BR'),
        c.cliente ?? '—',
        c.fabricante?.nome ?? c.distribuidor?.nome ?? '—',
        c.modulo,
        c.tipo === 'Servico' ? 'Serviço' : (c.tipo ?? '—'),
        `${c.markupPct}%`,
        formatBRL(c.precoVenda),
        formatBRL(c.imposto),
        formatBRL(c.lucroLiquido ?? c.margemLiquida ?? 0),
        formatPct(c.lucroPct),
        c.status === 'EmAndamento' ? 'Em andamento' : c.status,
        c.user?.name ?? '—',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [20, 20, 20], textColor: [57, 255, 20], fontStyle: 'bold', fontSize: 6.5 },
      bodyStyles: { fillColor: [15, 15, 15], textColor: [200, 200, 200], fontSize: 6.5 },
      alternateRowStyles: { fillColor: [22, 22, 22] },
      margin: { left: 14 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 10) {
          const val = String(data.cell.raw)
          if (val === 'Ganho') data.cell.styles.textColor = [57, 255, 20]
          else if (val === 'Perdido') data.cell.styles.textColor = [255, 59, 59]
          else data.cell.styles.textColor = [255, 184, 0]
        }
      },
    })
  }

  // ─── FINANCEIRO ───────────────────────────────────────────────
  if (filtros.tipo === 'financeiro' && finData) {
    const porMes = finData.porMes as Record<string, number>[]
    const acum = finData.acumuladoAno as Record<string, number>

    doc.setFontSize(10); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
    doc.text('Demonstrativo Financeiro Mensal', 14, y); y += 4
    autoTable(doc, {
      startY: y,
      head: [['Mês', 'Qtd', 'Faturamento', 'Custo BRL', 'Custo USD', 'Imposto', 'Lucro Líquido', 'Margem']],
      body: [
        ...porMes.map((m) => [
          m.mes, String(m.qtd),
          formatBRL(m.faturamento), formatBRL(m.custoBRL), `US$ ${(m.custoUSD ?? 0).toFixed(2)}`,
          formatBRL(m.imposto), formatBRL(m.valorLiquido),
          m.faturamento > 0 ? formatPct((m.valorLiquido / m.faturamento) * 100) : '—',
        ]),
        ['TOTAL', String(acum?.qtd ?? 0),
          formatBRL(acum?.faturamento ?? 0), formatBRL(acum?.custoBRL ?? 0), `US$ ${(acum?.custoUSD ?? 0).toFixed(2)}`,
          formatBRL(acum?.imposto ?? 0), formatBRL(acum?.valorLiquido ?? 0),
          (acum?.faturamento ?? 0) > 0 ? formatPct(((acum?.valorLiquido ?? 0) / (acum?.faturamento ?? 1)) * 100) : '—',
        ],
      ],
      theme: 'grid',
      headStyles: { fillColor: [20, 20, 20], textColor: [57, 255, 20], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fillColor: [15, 15, 15], textColor: [200, 200, 200], fontSize: 8 },
      alternateRowStyles: { fillColor: [22, 22, 22] },
      margin: { left: 14 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index === porMes.length) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.textColor = [57, 255, 20]
          data.cell.styles.fillColor = [20, 20, 20]
        }
      },
    })
  }

  // ─── CLIENTES ─────────────────────────────────────────────────
  if (filtros.tipo === 'clientes') {
    const porCliente: Record<string, { faturamento: number; lucro: number; imposto: number; qtd: number; ganhas: number }> = {}
    calculos.forEach(c => {
      const nome = c.cliente ?? '(sem nome)'
      if (!porCliente[nome]) porCliente[nome] = { faturamento: 0, lucro: 0, imposto: 0, qtd: 0, ganhas: 0 }
      porCliente[nome].faturamento += c.precoVenda
      porCliente[nome].lucro += c.lucroLiquido ?? c.margemLiquida ?? 0
      porCliente[nome].imposto += c.imposto
      porCliente[nome].qtd += 1
      if (c.status === 'Ganho') porCliente[nome].ganhas += 1
    })
    const linhas = Object.entries(porCliente)
      .sort((a, b) => b[1].faturamento - a[1].faturamento)

    doc.setFontSize(10); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold')
    doc.text(`Vendas por Cliente (${linhas.length} clientes)`, 14, y); y += 4
    autoTable(doc, {
      startY: y,
      head: [['Cliente', 'Cotações', 'Ganhas', 'Conv.', 'Faturamento', 'Imposto', 'Lucro', 'Margem']],
      body: linhas.map(([nome, v]) => [
        nome, String(v.qtd), String(v.ganhas),
        formatPct(v.qtd > 0 ? (v.ganhas / v.qtd) * 100 : 0),
        formatBRL(v.faturamento), formatBRL(v.imposto), formatBRL(v.lucro),
        v.faturamento > 0 ? formatPct((v.lucro / v.faturamento) * 100) : '—',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [20, 20, 20], textColor: [57, 255, 20], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fillColor: [15, 15, 15], textColor: [200, 200, 200], fontSize: 7.5 },
      alternateRowStyles: { fillColor: [22, 22, 22] },
      margin: { left: 14 },
    })
  }

  // ── rodapé em todas as páginas ──
  const totalPags = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages()
  for (let i = 1; i <= totalPags; i++) {
    doc.setPage(i)
    const h = doc.internal.pageSize.getHeight()
    doc.setFillColor(10, 10, 10)
    doc.rect(0, h - 10, W, 10, 'F')
    doc.setFontSize(7); doc.setTextColor(80, 80, 80)
    doc.text('Nova Solução Serviços de Tecnologia Ltda  ·  Confidencial', 14, h - 4)
    doc.text(`Página ${i} de ${totalPags}`, W - 14, h - 4, { align: 'right' })
  }

  const nome = `relatorio-${filtros.tipo}-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(nome)
}

// ─── componente principal ─────────────────────────────────────────
export default function RelatoriosPage() {
  const [filtros, setFiltros] = useState<FiltrosRelatorio>({
    tipo: 'executivo',
    status: '',
    modulo: '',
    dataInicio: '',
    dataFim: '',
    cliente: '',
  })
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState('')

  function set<K extends keyof FiltrosRelatorio>(k: K, v: FiltrosRelatorio[K]) {
    setFiltros(prev => ({ ...prev, [k]: v }))
  }

  async function exportar() {
    setGerando(true)
    setErro('')
    try {
      // Buscar calculos com os filtros
      const params = new URLSearchParams({ limit: '500' })
      if (filtros.status) params.set('status', filtros.status)
      if (filtros.modulo) params.set('modulo', filtros.modulo)

      const [calculosRes, dashRes, finRes] = await Promise.all([
        fetch(`/api/calculos?${params}`).then(r => r.json()),
        filtros.tipo === 'executivo' ? fetch('/api/dashboard').then(r => r.json()) : Promise.resolve(null),
        filtros.tipo === 'financeiro' ? fetch('/api/financeiro').then(r => r.json()) : Promise.resolve(null),
      ])

      let calculos: Calculo[] = calculosRes.calculos ?? []

      // Filtros adicionais no cliente
      if (filtros.cliente) {
        const busca = filtros.cliente.toLowerCase()
        calculos = calculos.filter(c => c.cliente?.toLowerCase().includes(busca) || c.fabricante?.nome.toLowerCase().includes(busca))
      }
      if (filtros.dataInicio) {
        const inicio = new Date(filtros.dataInicio + 'T00:00')
        calculos = calculos.filter(c => new Date(c.data) >= inicio)
      }
      if (filtros.dataFim) {
        const fim = new Date(filtros.dataFim + 'T23:59')
        calculos = calculos.filter(c => new Date(c.data) <= fim)
      }

      await gerarPDF(filtros, calculos, dashRes, finRes)
    } catch (e) {
      setErro('Erro ao gerar PDF. Tente novamente.')
      console.error(e)
    } finally {
      setGerando(false)
    }
  }

  const tipoSelecionado = TIPOS.find(t => t.id === filtros.tipo)!

  return (
    <AppShell>
      <div className="p-6 lg:p-8 space-y-6 animate-in max-w-5xl">
        {/* Header */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: '#444' }}>Exportação</p>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Relatórios
            <FileText className="w-5 h-5 text-neon opacity-70" />
          </h1>
          <p className="text-sm mt-1" style={{ color: '#555' }}>
            Gere relatórios personalizados e exporte em PDF
          </p>
        </div>

        {/* Seletor de tipo */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: '#333' }}>
            Tipo de relatório
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {TIPOS.map(t => (
              <button
                key={t.id}
                onClick={() => set('tipo', t.id)}
                className={cn(
                  'text-left p-4 rounded-xl transition-all duration-150',
                  filtros.tipo === t.id
                    ? COR_CLASS[t.cor]
                    : 'hover:text-white'
                )}
                style={filtros.tipo === t.id ? {} : {
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  color: '#555',
                }}
              >
                <div className={cn('mb-2.5', filtros.tipo === t.id ? '' : 'opacity-30')}>
                  {t.icon}
                </div>
                <p className="font-semibold text-sm">{t.label}</p>
                <p className="text-xs mt-1 leading-tight opacity-60">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Filtros */}
        <div className="card p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-4 flex items-center gap-1.5" style={{ color: '#444' }}>
            <Filter className="w-3 h-3" />Filtros opcionais
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Período — início</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="date" value={filtros.dataInicio} onChange={e => set('dataInicio', e.target.value)} className="input-field pl-9" />
              </div>
            </div>
            <div>
              <label className="label">Período — fim</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="date" value={filtros.dataFim} onChange={e => set('dataFim', e.target.value)} className="input-field pl-9" />
              </div>
            </div>
            <div>
              <label className="label">Status</label>
              <select value={filtros.status} onChange={e => set('status', e.target.value)} className="input-field">
                <option value="">Todos</option>
                <option value="Ganho">Ganho</option>
                <option value="Perdido">Perdido</option>
                <option value="EmAndamento">Em andamento</option>
              </select>
            </div>
            <div>
              <label className="label">Módulo</label>
              <select value={filtros.modulo} onChange={e => set('modulo', e.target.value)} className="input-field">
                <option value="">Todos</option>
                <option value="Direto">Faturamento Direto</option>
                <option value="Estrangeiro">Fabricante Estrangeiro</option>
                <option value="Distribuidor">Via Distribuidor</option>
              </select>
            </div>
            <div>
              <label className="label">Cliente / Fabricante</label>
              <input
                type="text"
                value={filtros.cliente}
                onChange={e => set('cliente', e.target.value)}
                placeholder="Buscar por nome..."
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Preview do que será gerado */}
        <div className="card p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-4" style={{ color: '#444' }}>O relatório irá conter</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtros.tipo === 'executivo' && (
              <>
                <Item icon={<BarChart2 className="w-4 h-4 text-neon" />} label="KPIs — Faturamento, Lucro, Ticket Médio" />
                <Item icon={<CheckCircle className="w-4 h-4 text-neon" />} label="Barra de progresso da Meta Anual (R$ 2M)" />
                <Item icon={<TrendingUp className="w-4 h-4 text-neon" />} label="Pipeline — cotações geradas, ganhas, perdidas" />
                <Item icon={<DollarSign className="w-4 h-4 text-neon" />} label="Top 10 vendas com maior lucro" />
              </>
            )}
            {filtros.tipo === 'vendas' && (
              <>
                <Item icon={<CheckCircle className="w-4 h-4 text-blue-400" />} label="Resumo: total, ganhas, em andamento, perdidas" />
                <Item icon={<DollarSign className="w-4 h-4 text-blue-400" />} label="Faturamento, lucro e impostos totais" />
                <Item icon={<FileText className="w-4 h-4 text-blue-400" />} label="Lista completa de cotações com todos os dados" />
                <Item icon={<TrendingUp className="w-4 h-4 text-blue-400" />} label="Markup, margem e status de cada cotação" />
              </>
            )}
            {filtros.tipo === 'financeiro' && (
              <>
                <Item icon={<Calendar className="w-4 h-4 text-amber-400" />} label="Faturamento e custo mês a mês" />
                <Item icon={<DollarSign className="w-4 h-4 text-amber-400" />} label="Imposto mensal e acumulado no ano" />
                <Item icon={<TrendingUp className="w-4 h-4 text-amber-400" />} label="Lucro líquido e margem por mês" />
                <Item icon={<BarChart2 className="w-4 h-4 text-amber-400" />} label="Linha de totais anuais acumulados" />
              </>
            )}
            {filtros.tipo === 'clientes' && (
              <>
                <Item icon={<Users className="w-4 h-4 text-purple-400" />} label="Todos os clientes ordenados por faturamento" />
                <Item icon={<CheckCircle className="w-4 h-4 text-purple-400" />} label="Cotações geradas e ganhas por cliente" />
                <Item icon={<DollarSign className="w-4 h-4 text-purple-400" />} label="Faturamento, lucro e imposto por cliente" />
                <Item icon={<TrendingUp className="w-4 h-4 text-purple-400" />} label="Taxa de conversão e margem de cada cliente" />
              </>
            )}
          </div>
        </div>

        {/* Botão */}
        {erro && (
          <div className="bg-danger/10 border border-danger/20 rounded-lg px-4 py-3 text-danger text-sm flex items-center gap-2">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            {erro}
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            onClick={exportar}
            disabled={gerando}
            className="btn-primary flex items-center gap-2 px-6 py-3 text-base"
          >
            {gerando
              ? <><Loader2 className="w-5 h-5 animate-spin" />Gerando PDF...</>
              : <><Download className="w-5 h-5" />Exportar PDF — {tipoSelecionado.label}</>
            }
          </button>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#333' }}>
            <Clock className="w-3.5 h-3.5" />
            <span>O arquivo será baixado automaticamente</span>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function Item({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div
      className="flex items-center gap-2.5 text-sm rounded-xl px-3 py-2.5"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', color: '#666' }}
    >
      {icon}
      <span>{label}</span>
    </div>
  )
}
