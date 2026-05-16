'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import KpiCard from '@/components/dashboard/KpiCard'
import CustomTooltip from '@/components/dashboard/CustomTooltip'
import MetaVendas from '@/components/dashboard/MetaVendas'
import PipelineCotacoes from '@/components/dashboard/PipelineCotacoes'
import SugestoesFechamento from '@/components/dashboard/SugestoesFechamento'
import { formatBRL, formatPct } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { DollarSign, TrendingUp, BarChart2, Award, Trophy, Package, Wrench, Loader2 } from 'lucide-react'

const NEON = '#39FF14'
const CORES = ['#39FF14', '#00D4FF', '#FF6B35', '#A855F7', '#FFB800', '#FF3B3B']

interface Sugestao { tipo: string; titulo: string; descricao: string; valor?: number; cliente?: string }

interface DashboardData {
  kpis: { faturamentoTotal: number; lucroTotal: number; lucroMedioPct: number; ticketMedio: number }
  metaAnual: { meta: number; realizado: number; percentual: number; falta: number; superado: boolean }
  pipeline: { totalCotacoes: number; cotacoesGanhas: number; cotacoesEmAndamento: number; cotacoesPerdidas: number; taxaConversao: number; valorPipeline: number; valorPerdido: number }
  sugestoes: Sugestao[]
  evolucaoMensal: { mes: string; faturamento: number; lucro: number; vendas: number }[]
  vendasPorFabricante: { nome: string; valor: number }[]
  vendasPorModulo: { nome: string; valor: number }[]
  vendasPorTipo: { tipo: string; faturamento: number; lucro: number; qtd: number }[]
  vendasPorModalidade: { nome: string; valor: number }[]
  topLucros: { id: string; cliente: string; fabricante: string; modulo: string; tipo: string | null; precoVenda: number; lucro: number; lucroPct: number; data: string }[]
  statusBreakdown: { ganho: number; perdido: number; emAndamento: number }
  totalCalculos: number
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setLoading(false); return }
        setData({
          kpis: d.kpis ?? { faturamentoTotal: 0, lucroTotal: 0, lucroMedioPct: 0, ticketMedio: 0 },
          metaAnual: d.metaAnual ?? { meta: 2000000, realizado: 0, percentual: 0, falta: 2000000, superado: false },
          pipeline: d.pipeline ?? { totalCotacoes: 0, cotacoesGanhas: 0, cotacoesEmAndamento: 0, cotacoesPerdidas: 0, taxaConversao: 0, valorPipeline: 0, valorPerdido: 0 },
          sugestoes: d.sugestoes ?? [],
          evolucaoMensal: d.evolucaoMensal ?? [],
          vendasPorFabricante: d.vendasPorFabricante ?? [],
          vendasPorModulo: d.vendasPorModulo ?? [],
          vendasPorTipo: d.vendasPorTipo ?? [],
          vendasPorModalidade: d.vendasPorModalidade ?? [],
          topLucros: d.topLucros ?? [],
          statusBreakdown: d.statusBreakdown ?? { ganho: 0, perdido: 0, emAndamento: 0 },
          totalCalculos: d.totalCalculos ?? 0,
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-neon animate-spin" />
            <p className="text-text-secondary text-sm">Carregando dashboard...</p>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!data) return null

  const statusPie = [
    { name: 'Ganho', value: data.statusBreakdown.ganho },
    { name: 'Perdido', value: data.statusBreakdown.perdido },
    { name: 'Em Andamento', value: data.statusBreakdown.emAndamento },
  ]
  const statusCores = [NEON, '#FF3B3B', '#FFB800']
  const statusHrefs = ['/historico?status=Ganho', '/historico?status=Perdido', '/historico?status=EmAndamento']

  return (
    <AppShell>
      <div className="p-6 lg:p-8 space-y-6 lg:space-y-8 animate-in">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: '#444' }}>Visão Geral</p>
            <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
            <p className="text-sm mt-1" style={{ color: '#555' }}>Operação comercial consolidada</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(57,255,20,0.06)', border: '1px solid rgba(57,255,20,0.12)' }}>
            <div className="dot-neon" />
            <span className="text-xs font-medium text-neon">Ao vivo</span>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard label="Faturamento Total" value={formatBRL(data.kpis.faturamentoTotal)} sub={`${data.statusBreakdown.ganho} vendas fechadas`} glowColor="neon" icon={<DollarSign className="w-4 h-4" />} href="/historico?status=Ganho" />
          <KpiCard label="Lucro Total" value={formatBRL(data.kpis.lucroTotal)} sub="Líquido após impostos" glowColor="neon" icon={<TrendingUp className="w-4 h-4" />} href="/historico?status=Ganho" />
          <KpiCard label="Lucro Médio" value={formatPct(data.kpis.lucroMedioPct)} sub="Margem líquida média" glowColor={data.kpis.lucroMedioPct >= 20 ? 'neon' : data.kpis.lucroMedioPct >= 10 ? 'warning' : 'danger'} icon={<BarChart2 className="w-4 h-4" />} href="/historico" />
          <KpiCard label="Ticket Médio" value={formatBRL(data.kpis.ticketMedio)} sub={`${data.totalCalculos} cotações registradas`} glowColor="neon" icon={<Award className="w-4 h-4" />} href="/historico" />
        </div>

        {/* META + PIPELINE */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <MetaVendas {...data.metaAnual} />
          <PipelineCotacoes {...data.pipeline} />
        </div>

        {/* SUGESTÕES DE FECHAMENTO */}
        <SugestoesFechamento sugestoes={data.sugestoes} />

        {/* Evolução Mensal */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-white mb-1">Evolução Mensal</h2>
          <p className="text-xs mb-6" style={{ color: '#555' }}>Faturamento e Lucro por mês</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.evolucaoMensal} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gradFat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={NEON} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={NEON} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradLucro" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" tick={{ fill: '#444', fontSize: 11 }} axisLine={{ stroke: '#2A2A2A' }} />
              <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#444', fontSize: 11 }} axisLine={{ stroke: '#2A2A2A' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#555' }} />
              <Area type="monotone" dataKey="faturamento" name="Faturamento" stroke={NEON} strokeWidth={2} fill="url(#gradFat)" dot={{ fill: NEON, r: 3 }} />
              <Area type="monotone" dataKey="lucro" name="Lucro" stroke="#00D4FF" strokeWidth={2} fill="url(#gradLucro)" dot={{ fill: '#00D4FF', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Fabricante + Produto vs Serviço */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-base font-semibold text-white mb-1">Vendas por Fabricante</h2>
            <p className="text-xs mb-6" style={{ color: '#555' }}>Faturamento acumulado por vendor</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.vendasPorFabricante} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#444', fontSize: 11 }} axisLine={{ stroke: '#2A2A2A' }} />
                <YAxis type="category" dataKey="nome" tick={{ fill: '#444', fontSize: 12 }} width={80} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="valor"
                  name="Faturamento"
                  radius={[0, 4, 4, 0]}
                  onClick={(entry: { nome: string }) => {
                    router.push(`/historico?busca=${encodeURIComponent(entry.nome)}`)
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {data.vendasPorFabricante.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-6">
            <h2 className="text-base font-semibold text-white mb-1">Produto vs Serviço</h2>
            <p className="text-xs mb-4" style={{ color: '#555' }}>Quanto vendemos por solução e por serviço</p>
            <div className="space-y-4">
              {data.vendasPorTipo.map((t, i) => {
                const total = data.vendasPorTipo.reduce((a, x) => a + x.faturamento, 0)
                const pct = total > 0 ? (t.faturamento / total) * 100 : 0
                const icon = t.tipo.includes('Produto') ? <Package className="w-4 h-4" /> : <Wrench className="w-4 h-4" />
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-white font-medium">
                        <span style={{ color: CORES[i] }}>{icon}</span>{t.tipo}
                      </div>
                      <div className="text-right">
                        <span className="text-white font-semibold">{formatBRL(t.faturamento)}</span>
                        <span className="text-text-secondary ml-2 text-xs">({t.qtd} vendas)</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: CORES[i] }} />
                    </div>
                    <div className="flex justify-between text-xs text-text-secondary">
                      <span>Lucro: {formatBRL(t.lucro)}</span>
                      <span>{pct.toFixed(1)}% do total</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={data.vendasPorTipo} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="tipo" tick={{ fill: '#444', fontSize: 11 }} axisLine={{ stroke: '#2A2A2A' }} />
                  <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#444', fontSize: 11 }} axisLine={{ stroke: '#2A2A2A' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="faturamento" name="Faturamento" radius={[4, 4, 0, 0]}>
                    {data.vendasPorTipo.map((_, i) => <Cell key={i} fill={CORES[i]} />)}
                  </Bar>
                  <Bar dataKey="lucro" name="Lucro" radius={[4, 4, 0, 0]} fill="#333" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Status + Modalidade + Módulo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <h2 className="text-base font-semibold text-white mb-1">Status das Oportunidades</h2>
            <p className="text-xs mb-4" style={{ color: '#555' }}>Ganho / Perdido / Em andamento</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={statusPie} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" nameKey="name" paddingAngle={3}>
                  {statusPie.map((_, i) => <Cell key={i} fill={statusCores[i]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip formatValue={v => String(v)} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 mt-2">
              {statusPie.map((s, i) => (
                <Link key={i} href={statusHrefs[i]} className="flex items-center justify-between text-sm hover:text-white cursor-pointer transition-colors group">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusCores[i] }} />
                    <span className="text-text-secondary group-hover:text-white transition-colors">{s.name}</span>
                  </div>
                  <span className="text-white font-medium">{s.value}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-base font-semibold text-white mb-1">Por Modalidade</h2>
            <p className="text-xs mb-4" style={{ color: '#555' }}>Faturamento por forma de pagamento</p>
            {data.vendasPorModalidade.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.vendasPorModalidade} cx="50%" cy="50%" outerRadius={80} dataKey="valor" nameKey="nome" paddingAngle={3}>
                    {data.vendasPorModalidade.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#555' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-text-secondary text-sm">Sem dados de modalidade</div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-base font-semibold text-white mb-1">Por Módulo</h2>
            <p className="text-xs mb-4" style={{ color: '#555' }}>Direto / Estrangeiro / Distribuidor</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.vendasPorModulo} cx="50%" cy="50%" outerRadius={75} dataKey="valor" nameKey="nome" paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#555' }}>
                  {data.vendasPorModulo.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Lucros */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-neon" />
            <h2 className="text-base font-semibold text-white">Maiores Lucros do Ano</h2>
          </div>
          <p className="text-xs mb-6" style={{ color: '#555' }}>Top 10 vendas que mais geraram lucro líquido</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header">#</th>
                  <th className="table-header text-left">Cliente</th>
                  <th className="table-header text-left">Fabricante</th>
                  <th className="table-header text-left">Módulo</th>
                  <th className="table-header text-right">Venda</th>
                  <th className="table-header text-right">Lucro</th>
                  <th className="table-header text-right">Margem</th>
                  <th className="table-header text-left">Data</th>
                </tr>
              </thead>
              <tbody>
                {data.topLucros.map((t, i) => (
                  <tr
                    key={t.id}
                    className="table-row-hover cursor-pointer"
                    onClick={() => router.push(`/historico?busca=${encodeURIComponent(t.cliente)}`)}
                  >
                    <td className="table-cell">
                      <span className={`font-bold ${i === 0 ? 'text-neon text-base' : i <= 2 ? 'text-warning' : 'text-text-secondary'}`}>{i + 1}</span>
                    </td>
                    <td className="table-cell font-medium">{t.cliente}</td>
                    <td className="table-cell text-text-secondary">{t.fabricante}</td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${t.modulo === 'Direto' ? 'bg-neon/10 text-neon' : t.modulo === 'Estrangeiro' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                        {t.modulo}
                      </span>
                    </td>
                    <td className="table-cell text-right">{formatBRL(t.precoVenda)}</td>
                    <td className="table-cell text-right text-neon font-semibold">{formatBRL(t.lucro)}</td>
                    <td className="table-cell text-right">
                      <span className={`font-medium ${t.lucroPct >= 20 ? 'text-neon' : t.lucroPct >= 10 ? 'text-warning' : 'text-danger'}`}>
                        {formatPct(t.lucroPct)}
                      </span>
                    </td>
                    <td className="table-cell text-text-secondary">{new Date(t.data).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.topLucros.length === 0 && (
              <div className="text-center py-8 text-text-secondary text-sm">Nenhuma venda registrada ainda</div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
