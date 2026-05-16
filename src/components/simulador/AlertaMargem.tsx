'use client'

import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AlertaMargemProps {
  alerta: 'verde' | 'amarelo' | 'vermelho'
  lucroPct: number
  sugestaoMarkup?: number
}

export default function AlertaMargem({ alerta, lucroPct, sugestaoMarkup }: AlertaMargemProps) {
  const config = {
    verde: {
      icon: CheckCircle,
      className: 'bg-neon/5 border-neon/20 text-neon',
      label: 'Margem saudável',
      desc: 'Lucro acima de 20% — ótimo negócio!',
    },
    amarelo: {
      icon: AlertTriangle,
      className: 'bg-warning/5 border-warning/20 text-warning',
      label: 'Margem atenção',
      desc: 'Lucro entre 10% e 20% — avalie com cuidado.',
    },
    vermelho: {
      icon: XCircle,
      className: 'bg-danger/5 border-danger/20 text-danger',
      label: lucroPct < 0 ? 'PREJUÍZO' : 'Margem crítica',
      desc: lucroPct < 0
        ? 'Esta operação resulta em prejuízo líquido!'
        : 'Margem abaixo de 10% — risco alto.',
    },
  }[alerta]

  const Icon = config.icon

  return (
    <div className={cn('border rounded-lg p-4 flex flex-col gap-2', config.className)}>
      <div className="flex items-center gap-2 font-semibold">
        <Icon className="w-4 h-4" />
        {config.label}: {lucroPct.toFixed(2)}%
      </div>
      <p className="text-sm opacity-80">{config.desc}</p>
      {sugestaoMarkup !== undefined && alerta !== 'verde' && (
        <p className="text-xs opacity-70 mt-1">
          💡 Markup mínimo sugerido para 20% de margem:{' '}
          <strong>{sugestaoMarkup.toFixed(1)}%</strong>
        </p>
      )}
    </div>
  )
}
