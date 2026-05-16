'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, TrendingUp } from 'lucide-react'

interface Cotacoes {
  ptax: number | null
  comercial: number | null
  atualizadoEm: string
}

interface Props {
  onSelecionar?: (valor: number) => void
}

export default function DolarWidget({ onSelecionar }: Props) {
  const [cotacoes, setCotacoes] = useState<Cotacoes | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [selecionado, setSelecionado] = useState<'ptax' | 'comercial' | null>(null)

  async function buscar() {
    setCarregando(true)
    try {
      const res = await fetch('/api/dolar')
      const data = await res.json()
      setCotacoes(data)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { buscar() }, [])

  function usar(tipo: 'ptax' | 'comercial') {
    if (!cotacoes) return
    const valor = tipo === 'ptax' ? cotacoes.ptax : cotacoes.comercial
    if (!valor) return
    setSelecionado(tipo)
    onSelecionar?.(valor)
  }

  const horaAtualiz = cotacoes?.atualizadoEm
    ? new Date(cotacoes.atualizadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="bg-surface-2 border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Cotações do Dólar</span>
          {horaAtualiz && <span className="text-muted">· {horaAtualiz}</span>}
        </div>
        <button
          onClick={buscar}
          disabled={carregando}
          className="text-muted hover:text-white transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {carregando ? (
        <div className="text-xs text-muted text-center py-1">Buscando cotações...</div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => usar('ptax')}
            className={`text-left p-2 rounded-md border transition-all text-xs ${
              selecionado === 'ptax'
                ? 'bg-neon/10 border-neon/30 text-neon'
                : 'bg-surface border-border text-text-secondary hover:border-neon/20 hover:text-white'
            }`}
          >
            <div className="font-medium text-white text-sm mb-0.5">
              {cotacoes?.ptax ? `R$ ${cotacoes.ptax.toFixed(4).replace('.', ',')}` : '—'}
            </div>
            <div className="opacity-70">Dólar PTAX</div>
            <div className="opacity-50 mt-0.5">Banco Central</div>
          </button>

          <button
            onClick={() => usar('comercial')}
            className={`text-left p-2 rounded-md border transition-all text-xs ${
              selecionado === 'comercial'
                ? 'bg-blue-500/10 border-blue-400/30 text-blue-400'
                : 'bg-surface border-border text-text-secondary hover:border-blue-400/20 hover:text-white'
            }`}
          >
            <div className="font-medium text-white text-sm mb-0.5">
              {cotacoes?.comercial ? `R$ ${cotacoes.comercial.toFixed(4).replace('.', ',')}` : '—'}
            </div>
            <div className="opacity-70">Dólar Comercial</div>
            <div className="opacity-50 mt-0.5">Mercado (Inter)</div>
          </button>
        </div>
      )}

      {selecionado && (
        <p className="text-xs text-neon">
          ✓ Cotação aplicada ao campo câmbio
        </p>
      )}
    </div>
  )
}
