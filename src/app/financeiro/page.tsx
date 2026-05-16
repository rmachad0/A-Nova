'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import CustomTooltip from '@/components/dashboard/CustomTooltip'
import { formatBRL, formatPct } from '@/lib/utils'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { Loader2, TrendingDown, DollarSign, Receipt, Banknote, ArrowUpRight } from 'lucide-react'

const NEON = '#39FF14'

interface MesData {
  mes: string
  mesNum: number
  imposto: number
  custoUSD: number
  custoBRL: number
  valorLiquido: number
  faturamento: number
  qtd: number
}

interface FinanceiroData {
  porMes: MesData[]
  acumuladoAno: { imposto: number; custoUSD: number; custoBRL: number; valorLiquido: number; faturamento: number; qtd: number }
  iofTotal: number
  spreadTotal: number
  iofPorMes: { mes: string; iof: number; spread: number }[]
  impostosProduto: number
  impostosServico: number
  anoAtual: number
  mesAtual: number
}

function CardAcumulado({ label, valor, sub, cor, icon: Icon }: {
  label: string; valor: string; sub?: string; cor: string; icon: React.ElementType
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
        border: `1px solid ${cor}18`,
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: '#444' }}
        >
          {label}
        </span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${cor}12`, border: `1px solid ${cor}25` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: cor }} />
        </div>
      </div>
      <div className="text-2xl font-bold" style={{ color: cor, textShadow: `0 0 20px ${cor}30` }}>{valor}</div>
      {sub && <div className="text-xs" style={{ color: '#444' }}>{sub}</div>}
    </div>
  )
}

function TooltipUSD({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
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

export default function FinanceiroPage() {
  const [data, setData] = useState<FinanceiroData | null>(null)
  const [loading, setLoading] = useState(true)

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

  const { porMes, acumuladoAno, iofTotal, spreadTotal, impostosProduto, impostosServico, anoAtual } = data

  return (
    <AppShell>
      <div className="p-6 lg:p-8 space-y-6 lg:space-y-8 animate-in">
        {/* Header */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: '#444' }}>Análise</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Relatório Financeiro</h1>
          <p className="text-sm mt-1" style={{ color: '#555' }}>
            Impostos, custos e valor líquido — mês a mês em {anoAtual}
          </p>
        </div>

        {/* Cards acumulado no ano */}
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
            />
            <CardAcumulado
              label="Custo Total em USD"
              valor={`US$ ${acumuladoAno.custoUSD.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              sub="Apenas cotações com moeda estrangeira"
              cor="#00D4FF"
              icon={DollarSign}
            />
            <CardAcumulado
              label="Custo Total em BRL"
              valor={formatBRL(acumuladoAno.custoBRL)}
              sub={`${acumuladoAno.qtd} cotações registradas`}
              cor="#FFB800"
              icon={Banknote}
            />
            <CardAcumulado
              label="Valor Líquido"
              valor={formatBRL(acumuladoAno.valorLiquido)}
              sub={`Sobre ${formatBRL(acumuladoAno.faturamento)} faturados`}
              cor="#39FF14"
              icon={ArrowUpRight}
            />
          </div>

          {/* Encargos extras */}
          {(iofTotal > 0 || spreadTotal > 0) && (
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <p className="text-xs text-text-secondary uppercase tracking-wider">IOF 4,38% acumulado</p>
                  <p className="text-lg font-bold text-danger mt-0.5">{formatBRL(iofTotal)}</p>
                </div>
                <TrendingDown className="w-5 h-5 text-danger opacity-50" />
              </div>
              <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <p className="text-xs text-text-secondary uppercase tracking-wider">Spread Cartão 4% acumulado</p>
                  <p className="text-lg font-bold text-warning mt-0.5">{formatBRL(spreadTotal)}</p>
                </div>
                <TrendingDown className="w-5 h-5 text-warning opacity-50" />
              </div>
            </div>
          )}
        </div>

        {/* Gráfico: Imposto por mês */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-white mb-1">Total de Imposto por Mês</h2>
          <p className="text-xs mb-6" style={{ color: '#555' }}>
            Imposto sobre NF Produto (10%) e Serviço (20%) — todos os status
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={porMes} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" tick={{ fill: '#444', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
              <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#444', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="imposto" name="Imposto" radius={[4, 4, 0, 0]}>
                {porMes.map((_, i) => <Cell key={i} fill="#FF3B3B" fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráficos: Custo USD + Custo BRL lado a lado */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Custo em USD por mês */}
          <div className="card p-6">
            <h2 className="text-base font-semibold text-white mb-1">Custo em USD por Mês</h2>
            <p className="text-xs mb-6" style={{ color: '#555' }}>Cotações com pagamento em moeda estrangeira</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porMes} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="mes" tick={{ fill: '#444', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#444', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
                <Tooltip content={<TooltipUSD />} />
                <Bar dataKey="custoUSD" name="Custo USD" radius={[4, 4, 0, 0]} fill="#00D4FF" fillOpacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 pt-3 flex items-center justify-between text-sm pt-4 mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-text-secondary">Total no ano</span>
              <span className="font-bold text-[#00D4FF]">
                US$ {acumuladoAno.custoUSD.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Custo em BRL por mês */}
          <div className="card p-6">
            <h2 className="text-base font-semibold text-white mb-1">Custo em BRL por Mês</h2>
            <p className="text-xs mb-6" style={{ color: '#555' }}>Custo base de todas as cotações</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porMes} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="mes" tick={{ fill: '#444', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
                <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#444', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="custoBRL" name="Custo BRL" radius={[4, 4, 0, 0]} fill="#FFB800" fillOpacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 pt-3 flex items-center justify-between text-sm pt-4 mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-text-secondary">Total no ano</span>
              <span className="font-bold text-warning">{formatBRL(acumuladoAno.custoBRL)}</span>
            </div>
          </div>
        </div>

        {/* Gráfico: Valor Líquido por mês (linha) */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-white mb-1">Valor Líquido por Mês</h2>
          <p className="text-xs mb-6" style={{ color: '#555' }}>Lucro líquido / margem líquida após todos os descontos</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={porMes} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" tick={{ fill: '#444', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
              <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#444', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#AAAAAA' }} />
              <Line type="monotone" dataKey="faturamento" name="Faturamento" stroke="#555" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              <Line type="monotone" dataKey="valorLiquido" name="Valor Líquido" stroke={NEON} strokeWidth={2.5} dot={{ fill: NEON, r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: NEON }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 pt-3 flex items-center justify-between text-sm pt-4 mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-text-secondary">Total líquido no ano</span>
            <span className={`font-bold text-lg ${acumuladoAno.valorLiquido >= 0 ? 'text-neon' : 'text-danger'}`}>
              {formatBRL(acumuladoAno.valorLiquido)}
            </span>
          </div>
        </div>

        {/* Tabela consolidada por mês */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-white mb-1">Resumo Mensal Consolidado</h2>
          <p className="text-xs mb-6" style={{ color: '#555' }}>Todos os valores mês a mês em {anoAtual}</p>
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
                      <td className="table-cell text-right text-text-secondary">{m.qtd}</td>
                      <td className="table-cell text-right text-[#00D4FF]">
                        {m.custoUSD > 0 ? `US$ ${m.custoUSD.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="table-cell text-right text-warning">
                        {m.custoBRL > 0 ? formatBRL(m.custoBRL) : '—'}
                      </td>
                      <td className="table-cell text-right">{temDados ? formatBRL(m.faturamento) : '—'}</td>
                      <td className="table-cell text-right text-danger">
                        {m.imposto > 0 ? formatBRL(m.imposto) : '—'}
                      </td>
                      <td className={`table-cell text-right font-semibold ${m.valorLiquido > 0 ? 'text-neon' : m.valorLiquido < 0 ? 'text-danger' : 'text-text-secondary'}`}>
                        {temDados ? formatBRL(m.valorLiquido) : '—'}
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
              {/* Linha de totais */}
              <tfoot>
                <tr className="border-t-2 border-border bg-surface-2">
                  <td className="table-cell font-bold text-white">TOTAL {anoAtual}</td>
                  <td className="table-cell text-right font-bold text-white">{acumuladoAno.qtd}</td>
                  <td className="table-cell text-right font-bold text-[#00D4FF]">
                    US$ {acumuladoAno.custoUSD.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="table-cell text-right font-bold text-warning">{formatBRL(acumuladoAno.custoBRL)}</td>
                  <td className="table-cell text-right font-bold text-white">{formatBRL(acumuladoAno.faturamento)}</td>
                  <td className="table-cell text-right font-bold text-danger">{formatBRL(acumuladoAno.imposto)}</td>
                  <td className="table-cell text-right font-bold text-neon">{formatBRL(acumuladoAno.valorLiquido)}</td>
                  <td className="table-cell text-right font-bold">
                    <span className={`${acumuladoAno.faturamento > 0 && (acumuladoAno.valorLiquido / acumuladoAno.faturamento) * 100 >= 20 ? 'text-neon' : 'text-warning'}`}>
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
