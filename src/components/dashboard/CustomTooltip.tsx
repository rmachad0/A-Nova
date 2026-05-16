'use client'

import { formatBRL } from '@/lib/utils'

interface TooltipProps {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
  formatValue?: (v: number) => string
}

export default function CustomTooltip({ active, payload, label, formatValue = formatBRL }: TooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div
      className="rounded-xl p-3 text-sm min-w-[160px]"
      style={{
        background: 'rgba(15,15,15,0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {label && (
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-2.5 pb-2"
          style={{ color: '#444', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          {label}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
              <span className="text-xs" style={{ color: '#666' }}>{p.name}</span>
            </div>
            <span className="text-xs font-semibold text-white">{formatValue(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
