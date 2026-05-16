'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { formatBRL, formatPct, cn } from '@/lib/utils'
import { Search, RefreshCw, Loader2, Calendar, ChevronDown, Trash2 } from 'lucide-react'

interface Calculo {
  id: string
  modulo: string
  tipo: string | null
  status: string
  cliente: string | null
  data: string
  custoBRL: number | null
  markupPct: number
  precoVenda: number
  imposto: number
  lucroLiquido: number | null
  margemLiquida: number | null
  lucroPct: number
  user: { name: string }
  fabricante: { nome: string } | null
  distribuidor: { nome: string } | null
  dataStatusGanho: string | null
  dataRecebimento: string | null
  dataPagamentoImposto: string | null
}

const STATUS_LABEL: Record<string, { label: string; class: string }> = {
  Ganho: { label: 'Ganho', class: 'badge-verde' },
  Perdido: { label: 'Perdido', class: 'badge-vermelho' },
  EmAndamento: { label: 'Em andamento', class: 'badge-amarelo' },
}

const MODULO_COLORS: Record<string, string> = {
  Direto: 'bg-neon/10 text-neon border-neon/20',
  Estrangeiro: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Distribuidor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

const STATUS_OPTIONS = [
  { value: 'EmAndamento', label: 'Em andamento' },
  { value: 'Ganho', label: 'Ganho' },
  { value: 'Perdido', label: 'Perdido' },
]

function formatarData(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function StatusDropdown({
  calculoId,
  statusAtual,
  onChange,
}: {
  calculoId: string
  statusAtual: string
  onChange: (novoStatus: string, dados: Partial<Calculo>) => void
}) {
  const [aberto, setAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)

  async function alterarStatus(novoStatus: string) {
    if (novoStatus === statusAtual) { setAberto(false); return }
    setSalvando(true)
    setAberto(false)
    try {
      const res = await fetch(`/api/calculos/${calculoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      })
      if (res.ok) {
        const dados = await res.json()
        onChange(novoStatus, dados)
      }
    } finally {
      setSalvando(false)
    }
  }

  const info = STATUS_LABEL[statusAtual] ?? { label: statusAtual, class: 'badge-amarelo' }

  return (
    <div className="relative">
      <button
        onClick={() => setAberto(!aberto)}
        disabled={salvando}
        className={cn(
          info.class,
          'flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity',
          salvando && 'opacity-50'
        )}
      >
        {salvando ? <Loader2 className="w-3 h-3 animate-spin" /> : info.label}
        <ChevronDown className="w-3 h-3" />
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAberto(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 rounded-xl py-1 overflow-hidden min-w-36" style={{ background: 'rgba(15,15,15,0.97)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}>
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => alterarStatus(opt.value)}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm transition-colors',
                  opt.value === statusAtual
                    ? 'text-neon'
                    : 'hover:text-white'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function LinhaCalculo({ c, onStatusChange, onDelete }: { c: Calculo; onStatusChange: (id: string, dados: Partial<Calculo>) => void; onDelete: (id: string) => void }) {
  const [expandido, setExpandido] = useState(false)
  const [deleteState, setDeleteState] = useState<'idle' | 'confirm' | 'loading'>('idle')
  const lucro = c.lucroLiquido ?? c.margemLiquida ?? 0

  async function confirmarExclusao() {
    setDeleteState('loading')
    try {
      const res = await fetch(`/api/calculos/${c.id}`, { method: 'DELETE' })
      if (res.ok) {
        onDelete(c.id)
      } else {
        setDeleteState('idle')
      }
    } catch {
      setDeleteState('idle')
    }
  }

  return (
    <>
      <tr
        className="table-row-hover cursor-pointer"
        onClick={() => c.status === 'Ganho' && setExpandido(!expandido)}
      >
        <td className="table-cell text-text-secondary text-xs">
          {new Date(c.data).toLocaleDateString('pt-BR')}
        </td>
        <td className="table-cell font-medium">{c.cliente ?? '—'}</td>
        <td className="table-cell text-text-secondary">
          {c.fabricante?.nome ?? c.distribuidor?.nome ?? '—'}
        </td>
        <td className="table-cell">
          <span className={cn('inline-flex px-2 py-0.5 rounded text-xs font-medium border', MODULO_COLORS[c.modulo] ?? '')}>
            {c.modulo}
          </span>
        </td>
        <td className="table-cell text-text-secondary">
          {c.tipo === 'Servico' ? 'Serviço' : c.tipo ?? '—'}
        </td>
        <td className="table-cell text-right text-text-secondary">{c.markupPct}%</td>
        <td className="table-cell text-right font-medium">{formatBRL(c.precoVenda)}</td>
        <td className={cn('table-cell text-right font-semibold', lucro < 0 ? 'text-danger' : 'text-neon')}>
          {formatBRL(lucro)}
        </td>
        <td className="table-cell text-right">
          <span className={cn('font-medium', c.lucroPct >= 20 ? 'text-neon' : c.lucroPct >= 10 ? 'text-warning' : 'text-danger')}>
            {formatPct(c.lucroPct)}
          </span>
        </td>
        <td className="table-cell" onClick={e => e.stopPropagation()}>
          <StatusDropdown
            calculoId={c.id}
            statusAtual={c.status}
            onChange={(_, dados) => onStatusChange(c.id, dados)}
          />
        </td>
        <td className="table-cell text-text-secondary text-xs">{c.user?.name}</td>
        <td className="table-cell" onClick={e => e.stopPropagation()}>
          {deleteState === 'idle' && (
            <button
              onClick={() => setDeleteState('confirm')}
              className="p-1.5 rounded-lg transition-all opacity-30 hover:opacity-100 hover:text-danger"
              title="Excluir"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {deleteState === 'confirm' && (
            <div className="flex items-center gap-1">
              <button
                onClick={confirmarExclusao}
                className="px-2 py-1 rounded text-xs font-semibold text-white transition-colors"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                Sim
              </button>
              <button
                onClick={() => setDeleteState('idle')}
                className="px-2 py-1 rounded text-xs text-text-secondary transition-colors hover:text-white"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Não
              </button>
            </div>
          )}
          {deleteState === 'loading' && (
            <Loader2 className="w-3.5 h-3.5 text-danger animate-spin" />
          )}
        </td>
      </tr>

      {expandido && c.status === 'Ganho' && (
        <tr className="bg-neon/3">
          <td colSpan={12} className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-3.5 h-3.5 text-neon" />
              <span className="text-xs font-semibold text-neon uppercase tracking-wider">Cronograma financeiro</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="rounded-xl p-3" style={{ background: 'rgba(57,255,20,0.04)', border: '1px solid rgba(57,255,20,0.1)' }}>
                <p className="text-xs mb-1" style={{ color: '#444' }}>Venda fechada</p>
                <p className="font-semibold text-white text-sm">{formatarData(c.dataStatusGanho)}</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)' }}>
                <p className="text-xs mb-1" style={{ color: '#444' }}>Recebimento (D+30)</p>
                <p className="font-semibold text-white text-sm">{formatarData(c.dataRecebimento)}</p>
                <p className="text-xs mt-1 text-info">{formatBRL(c.precoVenda)}</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,184,0,0.04)', border: '1px solid rgba(255,184,0,0.15)' }}>
                <p className="text-xs mb-1" style={{ color: '#444' }}>Pagamento de imposto</p>
                <p className="font-semibold text-warning text-sm">{formatarData(c.dataPagamentoImposto)}</p>
                <p className="text-xs mt-1 text-warning opacity-60">{formatBRL(c.imposto)}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function HistoricoContent() {
  const searchParams = useSearchParams()

  const [calculos, setCalculos] = useState<Calculo[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [busca, setBusca] = useState(searchParams.get('busca') ?? '')
  const [filtroModulo, setFiltroModulo] = useState(searchParams.get('modulo') ?? '')
  const [filtroStatus, setFiltroStatus] = useState(searchParams.get('status') ?? '')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' })
      if (filtroModulo) params.set('modulo', filtroModulo)
      if (filtroStatus) params.set('status', filtroStatus)

      const res = await fetch(`/api/calculos?${params}`)
      const data = await res.json()
      setCalculos(data.calculos ?? [])
      setTotal(data.total ?? 0)
      setPages(data.pages ?? 1)
    } finally {
      setLoading(false)
    }
  }, [page, filtroModulo, filtroStatus])

  useEffect(() => { carregar() }, [carregar])

  function atualizarStatus(id: string, dados: Partial<Calculo>) {
    setCalculos(prev => prev.map(c => c.id === id ? { ...c, ...dados } : c))
  }

  function excluirCalculo(id: string) {
    setCalculos(prev => prev.filter(c => c.id !== id))
    setTotal(prev => prev - 1)
  }

  const calculosFiltrados = busca
    ? calculos.filter(c =>
        c.cliente?.toLowerCase().includes(busca.toLowerCase()) ||
        c.fabricante?.nome.toLowerCase().includes(busca.toLowerCase())
      )
    : calculos

  const lucroCalc = (c: Calculo) => c.lucroLiquido ?? c.margemLiquida ?? 0

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: '#444' }}>Cotações</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Histórico de Cálculos</h1>
          <p className="text-sm mt-1" style={{ color: '#555' }}>
            {total} registro{total !== 1 ? 's' : ''} · Clique em <span className="text-neon">Ganho</span> para ver o cronograma
          </p>
        </div>
        <button onClick={carregar} className="btn-secondary flex items-center gap-2">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Atualizar
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar cliente ou fabricante..."
            className="input-field pl-9"
          />
        </div>
        <select
          value={filtroModulo}
          onChange={e => { setFiltroModulo(e.target.value); setPage(1) }}
          className="input-field w-auto"
        >
          <option value="">Todos os módulos</option>
          <option value="Direto">Faturamento Direto</option>
          <option value="Estrangeiro">Fabricante Estrangeiro</option>
          <option value="Distribuidor">Via Distribuidor</option>
        </select>
        <select
          value={filtroStatus}
          onChange={e => { setFiltroStatus(e.target.value); setPage(1) }}
          className="input-field w-auto"
        >
          <option value="">Todos os status</option>
          <option value="Ganho">Ganho</option>
          <option value="Perdido">Perdido</option>
          <option value="EmAndamento">Em andamento</option>
        </select>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-neon animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                <tr>
                  <th className="table-header">Data</th>
                  <th className="table-header">Cliente</th>
                  <th className="table-header">Fabricante</th>
                  <th className="table-header">Módulo</th>
                  <th className="table-header">Tipo</th>
                  <th className="table-header text-right">Markup</th>
                  <th className="table-header text-right">Venda</th>
                  <th className="table-header text-right">Lucro</th>
                  <th className="table-header text-right">Margem</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Usuário</th>
                  <th className="table-header w-10"></th>
                </tr>
              </thead>
              <tbody>
                {calculosFiltrados.map(c => (
                  <LinhaCalculo key={c.id} c={c} onStatusChange={atualizarStatus} onDelete={excluirCalculo} />
                ))}
              </tbody>
            </table>

            {calculosFiltrados.length === 0 && (
              <div className="text-center py-16 text-text-secondary">
                <p className="text-base font-medium text-white mb-1">Nenhum cálculo encontrado</p>
                <p className="text-sm">Use o Simulador para registrar seu primeiro cálculo</p>
              </div>
            )}
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">Página {page} de {pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn-secondary px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed">Anterior</button>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="btn-secondary px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed">Próxima</button>
          </div>
        </div>
      )}

      {calculosFiltrados.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Faturamento listado', valor: formatBRL(calculosFiltrados.reduce((a, c) => a + c.precoVenda, 0)) },
            { label: 'Lucro listado', valor: formatBRL(calculosFiltrados.reduce((a, c) => a + lucroCalc(c), 0)) },
            { label: 'Margem média', valor: formatPct(calculosFiltrados.reduce((a, c) => a + c.lucroPct, 0) / calculosFiltrados.length) },
            { label: 'Taxa de ganho', valor: formatPct((calculosFiltrados.filter(c => c.status === 'Ganho').length / calculosFiltrados.length) * 100) },
          ].map((s, i) => (
            <div key={i} className="rounded-xl p-4" style={{ background: 'rgba(57,255,20,0.04)', border: '1px solid rgba(57,255,20,0.08)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#444' }}>{s.label}</p>
              <p className="text-lg font-bold text-neon">{s.valor}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function HistoricoPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 text-neon animate-spin" />
        </div>
      }>
        <HistoricoContent />
      </Suspense>
    </AppShell>
  )
}
