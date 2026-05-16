'use client'

import Link from 'next/link'
import { formatBRL } from '@/lib/utils'
import { Target, TrendingUp, CheckCircle } from 'lucide-react'

interface MetaVendasProps {
  meta: number
  realizado: number
  percentual: number
  falta: number
  superado: boolean
}

export default function MetaVendas({ meta, realizado, percentual, falta, superado }: MetaVendasProps) {
  const barColor = superado ? '#39FF14' : percentual >= 75 ? '#39FF14' : percentual >= 50 ? '#FFB800' : percentual >= 25 ? '#FF8C00' : '#FF3B3B'

  return (
    <div className="card p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.15)' }}
          >
            <Target className="w-4 h-4 text-neon" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Meta Anual de Vendas</h2>
            <p className="text-xs mt-0.5" style={{ color: '#444' }}>Objetivo: {formatBRL(meta)}</p>
          </div>
        </div>
        {superado && (
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1"
            style={{ background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.2)' }}
          >
            <CheckCircle className="w-3 h-3 text-neon" />
            <span className="text-neon text-[10px] font-bold tracking-wider">META BATIDA!</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <Link href="/historico?status=Ganho" className="space-y-2.5 hover:opacity-90 transition-opacity block">
        <div className="flex justify-between text-xs">
          <span style={{ color: '#555' }}>Progresso</span>
          <span className="font-bold" style={{ color: barColor }}>{percentual.toFixed(1)}%</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div
            className="h-full rounded-full transition-all duration-1000 relative"
            style={{
              width: `${Math.min(percentual, 100)}%`,
              background: `linear-gradient(90deg, ${barColor}CC, ${barColor})`,
              boxShadow: `0 0 12px ${barColor}50`,
            }}
          >
            <div className="absolute inset-0 bg-white/10 rounded-full" />
          </div>
        </div>
        <div className="flex justify-between text-[10px]" style={{ color: '#333' }}>
          <span>R$ 0</span>
          <span>{formatBRL(meta / 2)}</span>
          <span>{formatBRL(meta)}</span>
        </div>
      </Link>

      {/* Numbers */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/historico?status=Ganho"
          className="rounded-xl p-4 transition-all hover:opacity-90 block"
          style={{ background: 'rgba(57,255,20,0.05)', border: '1px solid rgba(57,255,20,0.1)' }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-neon" />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#444' }}>Realizado</span>
          </div>
          <p className="text-xl font-bold text-neon">{formatBRL(realizado)}</p>
        </Link>
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Target className="w-3.5 h-3.5 text-warning" />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#444' }}>
              {superado ? 'Superado em' : 'Falta'}
            </span>
          </div>
          <p className={`text-xl font-bold ${superado ? 'text-neon' : 'text-warning'}`}>
            {superado ? `+${formatBRL(realizado - meta)}` : formatBRL(falta)}
          </p>
        </div>
      </div>
    </div>
  )
}
