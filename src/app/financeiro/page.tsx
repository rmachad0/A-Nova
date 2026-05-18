'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import CustomTooltip from '@/components/dashboard/CustomTooltip'
import { formatBRL, formatPct, cn } from '@/lib/utils'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { Loader2, TrendingDown, DollarSign, Receipt, Banknote, ArrowUpRight, X, ChevronRight, Filter } from 'lucide-react'

const NEON = '#39FF14'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface MesData {
  mes: string; mesNum: number; imposto: number; custoUSD: number
  custoBRL: number; valorLiquido: number; faturamento: number; qtd: number
}

interface CalculoItem {
  id: string; cliente: string | null; data: string; tipo: string | null
  modulo: string; status: string; precoVenda: number; imposto: number
  custoUSD: number | null; custoBRL: number | null; lucroLiquido: number
  iof438pct: number; spread4pct: number; mesNum: number; fabricante: string | null
}

interface FinanceiroData {
  porMes: MesData[]
  acumuladoAno: { imposto: number; custoUSD: number; custoBRL: number; valorLiquido: number; faturamento: number; qtd: number }
  iofTotal: number; spreadTotal: number
  iofPorMes: { mes: string; iof: number; spread: number }[]
  impostosProduto: number; impostosServico: number
  anoAtual: number; mesAtual: number
  calculos: CalculoItem[]
}

type Campo = 'imposto' | 'custoUSD' | 'custoBRL' | 'faturamento' | 'valorLiquido' | 'iof438pct' | 'spread4pct' | 'qtd'

interface DrillDown {
  titulo: string
  subtitulo: string
  campo: Campo
  mes?: number   // undefined = ano inteiro
  cor: string
}

const CAMPOS_LABEL: Record<Campo, string> = {
  imposto:      'Imposto',
  custoUSD:     'Custo USD',
  custoBRL:     'Custo BRL',
  faturamento:  'Faturamento',
  valorLiquido: 'Valor Líquido',
  iof438pct:    'IOF 4,38%',
  spread4pct:   'Spread 4%',
  qtd:          'Cotações',
}

const STATUS_LABEL: Record<string, string> = {
  Ganho: 'Ganho', Perdido: 'Perdido', EmAndamento: 'Em andamento',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function valorCampo(c: CalculoItem, campo: Campo): number {
  switch (campo) {
    case 'imposto':      return c.imposto
    case 'custoUSD':     return c.custoUSD ?? 0
    case 'custoBRL':     return c.custoBRL ?? 0
    case 'faturamento':  return c.precoVenda
    case 'valorLiquido': return c.lucroLiquido
    case 'iof438pct':    return c.iof438pct
    case 'spread4pct':   return c.spread4pct
    case 'qtd':          return 1
  }
}

function formatarValor(v: number, campo: Campo) {
  if (campo === 'custoUSD') return `US$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  if (campo === 'qtd') return String(Math.round(v))
  return formatBRL(v)
}

// ─── Modal drill-down ──────────────────────────────────────────────────────────

const STATUS_COR: Record<string, string> = {
  Ganho: '#39FF14',
  Perdido: '#FF3B3B',
  EmAndamento: '#FFB800',
}

function DrillDownModal({ drill, calculos, anoAtual, onClose }: {
  drill: DrillDown
  calculos: CalculoItem[]
  anoAtual: number
  onClose: () => void
}) {
  const [filtroStatus, setFiltroStatus] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  // Base: filtro por mês do drill-down + campo com valor
  const base = calculos
    .filter(c => drill.mes === undefined || c.mesNum === drill.mes)
    .filter(c => valorCampo(c, drill.campo) !== 0)

  // Aplica filtros do usuário
  const filtrados = base
    .filter(c => !filtroStatus || c.status === filtroStatus)
    .filter(c => {
      if (!dataInicio && !dataFim) return true
      const d = new Date(c.data)
      if (dataInicio && d < new Date(dataInicio)) return false
      if (dataFim && d > new Date(dataFim + 'T23:59:59')) return false
      return true
    })
    .sort((a, b) => valorCampo(b, drill.campo) - valorCampo(a, drill.campo))

  const total = filtrados.reduce((s, c) => s + valorCampo(c, drill.campo), 0)
  const totalBase = base.reduce((s, c) => s + valorCampo(c, drill.campo), 0)
  const colLabel = CAMPOS_LABEL[drill.campo]
  const filtrosAtivos = !!(filtroStatus || dataInicio || dataFim)

  // Conta por status no base (para exibir nos botões)
  const contaStatus = (s: string) => base.filter(c => c.status === s).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(18,18,18,0.98) 0%, rgba(12,12,12,0.98) 100%)',
          border: `1px solid ${drill.cor}25`,
          boxShadow: `0 24px 80px rgba(0,0,0,0.8), 0 0 40px ${drill.cor}08`,
        }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between p-5 flex-shrink-0"
          style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-0.5" style={{ color: '#444' }}>
              {drill.subtitulo}
            </p>
            <h2 className="text-lg font-bold text-white">{drill.titulo}</h2>
            <p className="text-sm mt-0.5" style={{ color: '#555' }}>
              {filtrados.length} oportunidade{filtrados.length !== 1 ? 's' : ''}
              {filtrosAtivos && <span style={{ color: '#444' }}> (de {base.length} no período)</span>}
              {' '}· Total:{' '}
              <span className="font-semibold" style={{ color: drill.cor }}>
                {formatarValor(total, drill.campo)}
              </span>
              {filtrosAtivos && totalBase !== total && (
                <span style={{ color: '#444' }}> de {formatarValor(totalBase, drill.campo)}</span>
              )}
            </p>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-xl transition-colors hover:text-white flex-shrink-0"
            style={{ color: '#555', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Filtros ── */}
        <div className="px-5 py-3 flex-shrink-0 flex flex-wrap items-center gap-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>

          {/* Filtro Status */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3 h-3 flex-shrink-0" style={{ color: '#444' }} />
            <span className="text-[10px] font-bold uppercase tracking-wider mr-1" style={{ color: '#444' }}>Status</span>
            {(['', 'Ganho', 'Perdido', 'EmAndamento'] as const).map(s => {
              const label = s === '' ? 'Todos' : STATUS_LABEL[s]
              const ativo = filtroStatus === s
              const cor = s ? STATUS_COR[s] : '#888'
              const count = s === '' ? base.length : contaStatus(s)
              return (
                <button
                  key={s}
                  onClick={() => setFiltroStatus(s)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: ativo ? `${cor}18` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${ativo ? `${cor}40` : 'rgba(255,255,255,0.06)'}`,
                    color: ativo ? cor : '#555',
                  }}
                >
                  {label}
                  <span className="rounded px-1 text-[10px]"
                    style={{ background: ativo ? `${cor}20` : 'rgba(255,255,255,0.05)', color: ativo ? cor : '#444' }}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Separador */}
          <div className="h-5 w-px flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />

          {/* Filtro Data */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#444' }}>Período</span>
            <input
              type="date"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              className="text-xs rounded-lg px-2.5 py-1.5 transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: dataInicio ? '#fff' : '#555', colorScheme: 'dark' }}
            />
            <span className="text-xs" style={{ color: '#444' }}>até</span>
            <input
              type="date"
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
              className="text-xs rounded-lg px-2.5 py-1.5 transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: dataFim ? '#fff' : '#555', colorScheme: 'dark' }}
            />
            {(dataInicio || dataFim) && (
              <button
                onClick={() => { setDataInicio(''); setDataFim('') }}
                className="text-xs px-2 py-1 rounded-lg transition-colors hover:text-white"
                style={{ color: '#555', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-y-auto flex-1">
          {filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <p className="text-white font-medium">Nenhuma cotação encontrada</p>
              <p className="text-sm" style={{ color: '#555' }}>
                {filtrosAtivos ? 'Tente ajustar os filtros' : 'Sem valores registrados'}
              </p>
              {filtrosAtivos && (
                <button
                  onClick={() => { setFiltroStatus(''); setDataInicio(''); setDataFim('') }}
                  className="mt-2 text-xs px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.15)', color: '#39FF14' }}
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0" style={{ background: 'rgba(12,12,12,0.98)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <tr>
                  <th className="table-header">Data</th>
                  <th className="table-header">Cliente</th>
                  <th className="table-header">Fabricante</th>
                  <th className="table-header">Módulo / Tipo</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right" style={{ color: drill.cor }}>{colLabel}</th>
                  <th className="table-header text-right">Venda</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((c, i) => {
                  const val = valorCampo(c, drill.campo)
                  const pct = total > 0 ? (val / total) * 100 : 0
                  return (
                    <tr key={c.id} className="table-row-hover">
                      <td className="table-cell text-xs text-text-secondary">
                        {new Date(c.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="table-cell font-medium">{c.cliente ?? '—'}</td>
                      <td className="table-cell text-text-secondary text-xs">{c.fabricante ?? '—'}</td>
                      <td className="table-cell">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-white">{c.modulo}</span>
                          <span className="text-[10px]" style={{ color: '#555' }}>
                            {c.tipo === 'Servico' ? 'Serviço' : c.tipo ?? '—'}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded font-medium',
                          c.status === 'Ganho' ? 'text-neon' : c.status === 'Perdido' ? 'text-danger' : 'text-warning'
                        )} style={{ background: c.status === 'Ganho' ? 'rgba(57,255,20,0.08)' : c.status === 'Perdido' ? 'rgba(255,59,59,0.08)' : 'rgba(255,184,0,0.08)' }}>
                          {STATUS_LABEL[c.status] ?? c.status}
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="font-semibold" style={{ color: drill.cor }}>
                            {formatarValor(val, drill.campo)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: drill.cor, opacity: 0.6 }} />
                            </div>
                            <span className="text-[10px]" style={{ color: '#555' }}>{pct.toFixed(0)}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell text-right text-text-secondary text-xs">
                        {formatBRL(c.precoVenda)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: `1px solid ${drill.cor}15`, background: `${drill.cor}04` }}>
                  <td className="table-cell font-bold text-white" colSpan={5}>
                    TOTAL · {filtrados.length} cotaç{filtrados.length !== 1 ? 'ões' : 'ão'}
                  </td>
                  <td className="table-cell text-right font-bold text-lg" style={{ color: drill.cor }}>
                    {formatarValor(total, drill.campo)}
                  </td>
                  <td className="table-cell text-right font-bold text-white text-xs">
                    {formatBRL(filtrados.reduce((s, c) => s + c.precoVenda, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Número clicável ──────────────────────────────────────────────────────────

function NumClicavel({ valor, cor, onClick, className }: {
  valor: string; cor?: string; onClick: () => void; className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 group transition-all duration-150 hover:opacity-80',
        className
      )}
      title="Clique para ver as oportunidades"
    >
      <span>{valor}</span>
      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0"
        style={{ color: cor ?? 'currentColor' }} />
    </button>
  )
}

// ─── Card acumulado clicável ───────────────────────────────────────────────────

function CardAcumulado({ label, valor, sub, cor, icon: Icon, onClick }: {
  label: string; valor: string; sub?: string; cor: string; icon: React.ElementType; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 text-left w-full group hover:scale-[1.01]"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
        border: `1px solid ${cor}18`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: '#444' }}>
          {label}
        </span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${cor}12`, border: `1px solid ${cor}25` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: cor }} />
        </div>
      </div>
      <div className="inline-flex items-center gap-1.5">
        <span className="text-2xl font-bold" style={{ color: cor, textShadow: `0 0 20px ${cor}30` }}>{valor}</span>
        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" style={{ color: cor }} />
      </div>
      {sub && <div className="text-xs" style={{ color: '#444' }}>{sub}</div>}
    </button>
  )
}

// ─── Tooltip USD ──────────────────────────────────────────────────────────────

function TooltipUSD({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-2 border border-border rounded-lg p-3 shadow-card text-sm">
      {label && <p className="text-text-secondary mb-2 text-xs font-medium">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-text-secondary">{p.name}:</span>
          <span className="text-white font-medium">
            {p.name.includes('USD') ? `US$ ${p.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : formatBRL(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function FinanceiroPage() {
  const [data, setData] = useState<FinanceiroData | null>(null)
  const [loading, setLoading] = useState(true)
  const [drill, setDrill] = useState<DrillDown | null>(null)

  useEffect(() => {
    fetch('/api/financeiro')
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <AppShell>
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-neon animate-spin" />
          <p className="text-text-secondary text-sm">Carregando relatório financeiro...</p>
        </div>
      </div>
    </AppShell>
  )

  if (!data) return null

  const { porMes, acumuladoAno, iofTotal, spreadTotal, impostosProduto, impostosServico, anoAtual, calculos } = data

  const MESES_NOMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

  function abrirAnual(campo: Campo, titulo: string, cor: string) {
    setDrill({ titulo, subtitulo: `Acumulado ${anoAtual}`, campo, cor })
  }

  function abrirMes(campo: Campo, mesNum: number, titulo: string, cor: string) {
    setDrill({ titulo, subtitulo: `${MESES_NOMES[mesNum - 1]} ${anoAtual}`, campo, mes: mesNum, cor })
  }

  return (
    <AppShell>
      {drill && (
        <DrillDownModal
          drill={drill}
          calculos={calculos}
          anoAtual={anoAtual}
          onClose={() => setDrill(null)}
        />
      )}

      <div className="p-6 lg:p-8 space-y-6 lg:space-y-8 animate-in">
        {/* Header */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: '#444' }}>Análise</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Relatório Financeiro</h1>
          <p className="text-sm mt-1" style={{ color: '#555' }}>
            Impostos, custos e valor líquido — mês a mês em {anoAtual} ·{' '}
            <span className="text-neon opacity-70">Clique em qualquer número para ver as oportunidades</span>
          </p>
        </div>

        {/* Cards acumulado */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: '#333' }}>
            Acumulado em {anoAtual}
          </p>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <CardAcumulado
              label="Total de Impostos"
              valor={formatBRL(acumuladoAno.imposto)}
              sub={`Produto ${formatBRL(impostosProduto)} · Serviço ${formatBRL(impostosServico)}`}
              cor="#FF3B3B"
              icon={Receipt}
              onClick={() => abrirAnual('imposto', 'Total de Impostos', '#FF3B3B')}
            />
            <CardAcumulado
              label="Custo Total em USD"
              valor={`US$ ${acumuladoAno.custoUSD.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              sub="Apenas cotações com moeda estrangeira"
              cor="#00D4FF"
              icon={DollarSign}
              onClick={() => abrirAnual('custoUSD', 'Custo Total em USD', '#00D4FF')}
            />
            <CardAcumulado
              label="Custo Total em BRL"
              valor={formatBRL(acumuladoAno.custoBRL)}
              sub={`${acumuladoAno.qtd} cotações registradas`}
              cor="#FFB800"
              icon={Banknote}
              onClick={() => abrirAnual('custoBRL', 'Custo Total em BRL', '#FFB800')}
            />
            <CardAcumulado
              label="Valor Líquido"
              valor={formatBRL(acumuladoAno.valorLiquido)}
              sub={`Sobre ${formatBRL(acumuladoAno.faturamento)} faturados`}
              cor="#39FF14"
              icon={ArrowUpRight}
              onClick={() => abrirAnual('valorLiquido', 'Valor Líquido', '#39FF14')}
            />
          </div>

          {/* Encargos extras */}
          {(iofTotal > 0 || spreadTotal > 0) && (
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div className="rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer group transition-all hover:scale-[1.01]"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                onClick={() => abrirAnual('iof438pct', 'IOF 4,38% acumulado', '#FF3B3B')}>
                <div>
                  <p className="text-xs text-text-secondary uppercase tracking-wider">IOF 4,38% acumulado</p>
                  <NumClicavel valor={formatBRL(iofTotal)} cor="#FF3B3B"
                    className="text-lg font-bold text-danger mt-0.5"
                    onClick={() => abrirAnual('iof438pct', 'IOF 4,38% acumulado', '#FF3B3B')} />
                </div>
                <TrendingDown className="w-5 h-5 text-danger opacity-50" />
              </div>
              <div className="rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer group transition-all hover:scale-[1.01]"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                onClick={() => abrirAnual('spread4pct', 'Spread Cartão 4% acumulado', '#FFB800')}>
                <div>
                  <p className="text-xs text-text-secondary uppercase tracking-wider">Spread Cartão 4% acumulado</p>
                  <NumClicavel valor={formatBRL(spreadTotal)} cor="#FFB800"
                    className="text-lg font-bold text-warning mt-0.5"
                    onClick={() => abrirAnual('spread4pct', 'Spread Cartão 4% acumulado', '#FFB800')} />
                </div>
                <TrendingDown className="w-5 h-5 text-warning opacity-50" />
              </div>
            </div>
          )}
        </div>

        {/* Gráfico imposto por mês */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-white mb-1">Total de Imposto por Mês</h2>
          <p className="text-xs mb-1" style={{ color: '#555' }}>
            Imposto sobre NF Produto (10%) e Serviço (20%) — todos os status
          </p>
          <p className="text-xs mb-6" style={{ color: '#444' }}>Clique na barra para ver quais cotações compõem o imposto do mês</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={porMes} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
              onClick={e => {
                const idx = e?.activeTooltipIndex
                if (idx !== undefined && porMes[idx]?.qtd > 0) {
                  const m = porMes[idx]
                  abrirMes('imposto', m.mesNum, `Impostos — ${m.mes}`, '#FF3B3B')
                }
              }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" tick={{ fill: '#444', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
              <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#444', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,59,59,0.06)' }} />
              <Bar dataKey="imposto" name="Imposto" radius={[4, 4, 0, 0]} style={{ cursor: 'pointer' }}>
                {porMes.map((m, i) => <Cell key={i} fill="#FF3B3B" fillOpacity={m.qtd > 0 ? 0.8 : 0.2} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Custo USD + BRL lado a lado */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-base font-semibold text-white mb-1">Custo em USD por Mês</h2>
            <p className="text-xs mb-6" style={{ color: '#555' }}>Cotações com pagamento em moeda estrangeira</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porMes} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
                onClick={e => {
                  const idx = e?.activeTooltipIndex
                  if (idx !== undefined && porMes[idx]?.custoUSD > 0) {
                    const m = porMes[idx]
                    abrirMes('custoUSD', m.mesNum, `Custo USD — ${m.mes}`, '#00D4FF')
                  }
                }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="mes" tick={{ fill: '#444', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#444', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
                <Tooltip content={<TooltipUSD />} cursor={{ fill: 'rgba(0,212,255,0.06)' }} />
                <Bar dataKey="custoUSD" name="Custo USD" radius={[4, 4, 0, 0]} fill="#00D4FF" fillOpacity={0.8} style={{ cursor: 'pointer' }} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center justify-between text-sm pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-text-secondary">Total no ano</span>
              <NumClicavel
                valor={`US$ ${acumuladoAno.custoUSD.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                cor="#00D4FF"
                className="font-bold text-[#00D4FF]"
                onClick={() => abrirAnual('custoUSD', 'Custo Total em USD', '#00D4FF')}
              />
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-base font-semibold text-white mb-1">Custo em BRL por Mês</h2>
            <p className="text-xs mb-6" style={{ color: '#555' }}>Custo base de todas as cotações</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porMes} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
                onClick={e => {
                  const idx = e?.activeTooltipIndex
                  if (idx !== undefined && porMes[idx]?.custoBRL > 0) {
                    const m = porMes[idx]
                    abrirMes('custoBRL', m.mesNum, `Custo BRL — ${m.mes}`, '#FFB800')
                  }
                }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="mes" tick={{ fill: '#444', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
                <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#444', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,184,0,0.06)' }} />
                <Bar dataKey="custoBRL" name="Custo BRL" radius={[4, 4, 0, 0]} fill="#FFB800" fillOpacity={0.8} style={{ cursor: 'pointer' }} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center justify-between text-sm pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-text-secondary">Total no ano</span>
              <NumClicavel
                valor={formatBRL(acumuladoAno.custoBRL)}
                cor="#FFB800"
                className="font-bold text-warning"
                onClick={() => abrirAnual('custoBRL', 'Custo Total em BRL', '#FFB800')}
              />
            </div>
          </div>
        </div>

        {/* Gráfico valor líquido */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-white mb-1">Valor Líquido por Mês</h2>
          <p className="text-xs mb-6" style={{ color: '#555' }}>Lucro líquido / margem líquida após todos os descontos</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={porMes} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
              onClick={e => {
                const idx = e?.activeTooltipIndex
                if (idx !== undefined && porMes[idx]?.qtd > 0) {
                  const m = porMes[idx]
                  abrirMes('valorLiquido', m.mesNum, `Valor Líquido — ${m.mes}`, '#39FF14')
                }
              }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" tick={{ fill: '#444', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
              <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#444', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(57,255,20,0.2)', strokeWidth: 1 }} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#AAAAAA' }} />
              <Line type="monotone" dataKey="faturamento" name="Faturamento" stroke="#555" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              <Line type="monotone" dataKey="valorLiquido" name="Valor Líquido" stroke={NEON} strokeWidth={2.5}
                dot={{ fill: NEON, r: 4, strokeWidth: 0, cursor: 'pointer' }}
                activeDot={{ r: 6, fill: NEON, cursor: 'pointer' }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center justify-between text-sm pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-text-secondary">Total líquido no ano</span>
            <NumClicavel
              valor={formatBRL(acumuladoAno.valorLiquido)}
              cor="#39FF14"
              className={`font-bold text-lg ${acumuladoAno.valorLiquido >= 0 ? 'text-neon' : 'text-danger'}`}
              onClick={() => abrirAnual('valorLiquido', 'Valor Líquido Total', '#39FF14')}
            />
          </div>
        </div>

        {/* Tabela consolidada por mês */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-white mb-1">Resumo Mensal Consolidado</h2>
          <p className="text-xs mb-6" style={{ color: '#555' }}>
            Todos os valores mês a mês em {anoAtual} · Clique em qualquer célula para ver as oportunidades
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                <tr>
                  <th className="table-header text-left">Mês</th>
                  <th className="table-header text-right">Cotações</th>
                  <th className="table-header text-right">Custo USD</th>
                  <th className="table-header text-right">Custo BRL</th>
                  <th className="table-header text-right">Faturamento</th>
                  <th className="table-header text-right">Imposto</th>
                  <th className="table-header text-right">Valor Líquido</th>
                  <th className="table-header text-right">Margem %</th>
                </tr>
              </thead>
              <tbody>
                {porMes.map((m, i) => {
                  const margemPct = m.faturamento > 0 ? (m.valorLiquido / m.faturamento) * 100 : 0
                  const temDados = m.qtd > 0
                  return (
                    <tr key={i} className={`hover:bg-surface-2 transition-colors ${!temDados ? 'opacity-40' : ''}`}>
                      <td className="table-cell font-medium">{m.mes}</td>

                      <td className="table-cell text-right">
                        {temDados
                          ? <NumClicavel valor={String(m.qtd)} className="text-text-secondary"
                              onClick={() => abrirMes('faturamento', m.mesNum, `Cotações — ${m.mes}`, '#39FF14')} />
                          : <span className="text-text-secondary">0</span>}
                      </td>

                      <td className="table-cell text-right">
                        {m.custoUSD > 0
                          ? <NumClicavel valor={`US$ ${m.custoUSD.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                              className="text-[#00D4FF]"
                              onClick={() => abrirMes('custoUSD', m.mesNum, `Custo USD — ${m.mes}`, '#00D4FF')} />
                          : <span className="text-text-secondary">—</span>}
                      </td>

                      <td className="table-cell text-right">
                        {m.custoBRL > 0
                          ? <NumClicavel valor={formatBRL(m.custoBRL)} className="text-warning"
                              onClick={() => abrirMes('custoBRL', m.mesNum, `Custo BRL — ${m.mes}`, '#FFB800')} />
                          : <span className="text-text-secondary">—</span>}
                      </td>

                      <td className="table-cell text-right">
                        {temDados
                          ? <NumClicavel valor={formatBRL(m.faturamento)}
                              onClick={() => abrirMes('faturamento', m.mesNum, `Faturamento — ${m.mes}`, '#FFFFFF')} />
                          : <span className="text-text-secondary">—</span>}
                      </td>

                      <td className="table-cell text-right">
                        {m.imposto > 0
                          ? <NumClicavel valor={formatBRL(m.imposto)} className="text-danger"
                              onClick={() => abrirMes('imposto', m.mesNum, `Impostos — ${m.mes}`, '#FF3B3B')} />
                          : <span className="text-text-secondary">—</span>}
                      </td>

                      <td className="table-cell text-right">
                        {temDados
                          ? <NumClicavel valor={formatBRL(m.valorLiquido)}
                              className={m.valorLiquido > 0 ? 'text-neon font-semibold' : m.valorLiquido < 0 ? 'text-danger font-semibold' : 'text-text-secondary'}
                              onClick={() => abrirMes('valorLiquido', m.mesNum, `Valor Líquido — ${m.mes}`, '#39FF14')} />
                          : <span className="text-text-secondary">—</span>}
                      </td>

                      <td className="table-cell text-right">
                        {temDados ? (
                          <span className={`font-medium ${margemPct >= 20 ? 'text-neon' : margemPct >= 10 ? 'text-warning' : 'text-danger'}`}>
                            {formatPct(margemPct)}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <td className="table-cell font-bold text-white">TOTAL {anoAtual}</td>

                  <td className="table-cell text-right">
                    <NumClicavel valor={String(acumuladoAno.qtd)} className="font-bold text-white"
                      onClick={() => abrirAnual('faturamento', `Todas as Cotações ${anoAtual}`, '#39FF14')} />
                  </td>
                  <td className="table-cell text-right">
                    <NumClicavel valor={`US$ ${acumuladoAno.custoUSD.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      className="font-bold text-[#00D4FF]" cor="#00D4FF"
                      onClick={() => abrirAnual('custoUSD', 'Custo Total em USD', '#00D4FF')} />
                  </td>
                  <td className="table-cell text-right">
                    <NumClicavel valor={formatBRL(acumuladoAno.custoBRL)} className="font-bold text-warning" cor="#FFB800"
                      onClick={() => abrirAnual('custoBRL', 'Custo Total em BRL', '#FFB800')} />
                  </td>
                  <td className="table-cell text-right">
                    <NumClicavel valor={formatBRL(acumuladoAno.faturamento)} className="font-bold text-white"
                      onClick={() => abrirAnual('faturamento', `Faturamento Total ${anoAtual}`, '#FFFFFF')} />
                  </td>
                  <td className="table-cell text-right">
                    <NumClicavel valor={formatBRL(acumuladoAno.imposto)} className="font-bold text-danger" cor="#FF3B3B"
                      onClick={() => abrirAnual('imposto', `Total de Impostos ${anoAtual}`, '#FF3B3B')} />
                  </td>
                  <td className="table-cell text-right">
                    <NumClicavel valor={formatBRL(acumuladoAno.valorLiquido)}
                      className={`font-bold ${acumuladoAno.valorLiquido >= 0 ? 'text-neon' : 'text-danger'}`}
                      cor="#39FF14"
                      onClick={() => abrirAnual('valorLiquido', `Valor Líquido Total ${anoAtual}`, '#39FF14')} />
                  </td>
                  <td className="table-cell text-right font-bold">
                    <span className={acumuladoAno.faturamento > 0 && (acumuladoAno.valorLiquido / acumuladoAno.faturamento) * 100 >= 20 ? 'text-neon' : 'text-warning'}>
                      {acumuladoAno.faturamento > 0 ? formatPct((acumuladoAno.valorLiquido / acumuladoAno.faturamento) * 100) : '—'}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
