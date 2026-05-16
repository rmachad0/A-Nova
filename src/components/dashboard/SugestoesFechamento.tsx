'use client'

import { Lightbulb, AlertTriangle, Target, TrendingUp, Rocket, Info } from 'lucide-react'
import { formatBRL } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Sugestao {
  tipo: string
  titulo: string
  descricao: string
  valor?: number
  cliente?: string
}

const CONFIG: Record<string, { icon: typeof Lightbulb; cor: string; bg: string; border: string; badge: string }> = {
  urgente: {
    icon: AlertTriangle,
    cor: 'text-danger',
    bg: 'bg-danger/5',
    border: 'border-danger/20',
    badge: 'bg-danger/10 text-danger border-danger/20',
  },
  meta: {
    icon: Target,
    cor: 'text-neon',
    bg: 'bg-neon/5',
    border: 'border-neon/20',
    badge: 'bg-neon/10 text-neon border-neon/20',
  },
  oportunidade: {
    icon: TrendingUp,
    cor: 'text-warning',
    bg: 'bg-warning/5',
    border: 'border-warning/20',
    badge: 'bg-warning/10 text-warning border-warning/20',
  },
  alerta: {
    icon: Info,
    cor: 'text-blue-400',
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/20',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  inicio: {
    icon: Rocket,
    cor: 'text-purple-400',
    bg: 'bg-purple-500/5',
    border: 'border-purple-500/20',
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
}

const BADGE_LABEL: Record<string, string> = {
  urgente: 'URGENTE',
  meta: 'META',
  oportunidade: 'OPORTUNIDADE',
  alerta: 'ATENÇÃO',
  inicio: 'INÍCIO',
}

export default function SugestoesFechamento({ sugestoes }: { sugestoes: Sugestao[] }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.15)' }}
        >
          <Lightbulb className="w-4 h-4 text-neon" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Sugestões de Fechamento</h2>
          <p className="text-xs mt-0.5" style={{ color: '#444' }}>Baseadas nos dados reais da sua operação</p>
        </div>
      </div>

      {sugestoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-text-secondary">
          <Lightbulb className="w-10 h-10 mb-3 opacity-30" />
          <p className="font-medium text-white">Nenhuma sugestão no momento</p>
          <p className="text-sm mt-1">As sugestões aparecem automaticamente conforme você registra cotações.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sugestoes.map((s, i) => {
            const cfg = CONFIG[s.tipo] ?? CONFIG.inicio
            const Icon = cfg.icon
            return (
              <div
                key={i}
                className={cn('rounded-xl p-4 border flex flex-col gap-3', cfg.bg, cfg.border)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className={cn('mt-0.5 p-1.5 rounded-lg border', cfg.bg, cfg.border)}>
                      <Icon className={cn('w-3.5 h-3.5', cfg.cor)} />
                    </div>
                    <p className={cn('text-sm font-semibold leading-tight', cfg.cor)}>{s.titulo}</p>
                  </div>
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0', cfg.badge)}>
                    {BADGE_LABEL[s.tipo] ?? s.tipo.toUpperCase()}
                  </span>
                </div>

                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line pl-8">
                  {s.descricao}
                </p>

                {s.valor != null && s.valor > 0 && (
                  <div className={cn('ml-8 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border w-fit', cfg.badge)}>
                    Valor em jogo: {formatBRL(s.valor)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
