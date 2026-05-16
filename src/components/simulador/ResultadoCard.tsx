'use client'

import { formatBRL, formatPct, cn } from '@/lib/utils'
import { Info } from 'lucide-react'

interface LinhaResultado {
  label: string
  valor: number
  tipo?: 'brl' | 'pct' | 'usd'
  destaque?: boolean
  tooltip?: string
  negativo?: boolean
}

interface ResultadoCardProps {
  linhas: LinhaResultado[]
  titulo?: string
}

export default function ResultadoCard({ linhas, titulo }: ResultadoCardProps) {
  return (
    <div className="bg-surface-2 border border-border rounded-xl overflow-hidden">
      {titulo && (
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-white">{titulo}</h3>
        </div>
      )}
      <div className="divide-y divide-border/50">
        {linhas.map((l, i) => {
          const valor = l.tipo === 'pct'
            ? formatPct(l.valor)
            : l.tipo === 'usd'
            ? `US$ ${l.valor.toFixed(2)}`
            : formatBRL(l.valor)

          const corValor = l.destaque
            ? l.negativo || l.valor < 0
              ? 'text-danger font-bold text-lg'
              : 'text-neon font-bold text-lg'
            : l.valor < 0
            ? 'text-danger font-medium'
            : 'text-white font-medium'

          return (
            <div key={i} className={cn('flex items-center justify-between px-5 py-3', l.destaque && 'bg-neon/3')}>
              <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                {l.label}
                {l.tooltip && (
                  <div className="group relative">
                    <Info className="w-3 h-3 text-muted cursor-help" />
                    <div className="absolute left-5 bottom-0 z-10 hidden group-hover:block w-56 bg-surface-3 border border-border rounded-md p-2.5 text-xs text-text-secondary shadow-card">
                      {l.tooltip}
                    </div>
                  </div>
                )}
              </div>
              <span className={cn('text-sm', corValor)}>{valor}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
