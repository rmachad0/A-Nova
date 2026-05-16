'use client'

import Link from 'next/link'
import { formatBRL } from '@/lib/utils'
import { FileText, CheckCircle2, Clock, XCircle, ArrowRight } from 'lucide-react'

interface PipelineProps {
  totalCotacoes: number
  cotacoesGanhas: number
  cotacoesEmAndamento: number
  cotacoesPerdidas: number
  taxaConversao: number
  valorPipeline: number
  valorPerdido: number
}

export default function PipelineCotacoes({
  totalCotacoes, cotacoesGanhas, cotacoesEmAndamento, cotacoesPerdidas,
  taxaConversao, valorPipeline, valorPerdido,
}: PipelineProps) {
  const etapas = [
    { label: 'Geradas', valor: totalCotacoes, icon: FileText, color: '#555', glow: 'rgba(85,85,85,0.2)', href: '/historico' },
    { label: 'Em andamento', valor: cotacoesEmAndamento, icon: Clock, color: '#FFB800', glow: 'rgba(255,184,0,0.15)', href: '/historico?status=EmAndamento' },
    { label: 'Fechadas', valor: cotacoesGanhas, icon: CheckCircle2, color: '#39FF14', glow: 'rgba(57,255,20,0.15)', href: '/historico?status=Ganho' },
    { label: 'Perdidas', valor: cotacoesPerdidas, icon: XCircle, color: '#FF3B3B', glow: 'rgba(255,59,59,0.15)', href: '/historico?status=Perdido' },
  ]

  const convColor = taxaConversao >= 50 ? '#39FF14' : taxaConversao >= 30 ? '#FFB800' : '#FF3B3B'

  return (
    <div className="card p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-semibold text-white">Pipeline de Cotações</h2>
        <p className="text-xs mt-0.5" style={{ color: '#444' }}>Geradas × Fechadas × Em andamento</p>
      </div>

      {/* Funnel steps */}
      <div className="flex items-center gap-1.5">
        {etapas.map((e, i) => {
          const Icon = e.icon
          return (
            <div key={i} className="flex items-center gap-1.5 flex-1">
              <Link
                href={e.href}
                className="flex-1 rounded-xl p-3 text-center transition-all hover:scale-[1.02] block"
                style={{
                  background: e.glow,
                  border: `1px solid ${e.color}22`,
                }}
              >
                <Icon className="w-3.5 h-3.5 mx-auto mb-1.5" style={{ color: e.color }} />
                <div className="text-xl font-bold leading-none" style={{ color: e.color }}>{e.valor}</div>
                <div className="text-[9px] font-medium mt-1 uppercase tracking-wide" style={{ color: e.color + '99' }}>{e.label}</div>
              </Link>
              {i < etapas.length - 1 && (
                <ArrowRight className="w-3 h-3 flex-shrink-0" style={{ color: '#333' }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Conversion rate */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span style={{ color: '#555' }}>Taxa de conversão</span>
          <span className="font-bold" style={{ color: convColor }}>{taxaConversao.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${taxaConversao}%`,
              background: `linear-gradient(90deg, ${convColor}99, ${convColor})`,
              boxShadow: `0 0 8px ${convColor}40`,
            }}
          />
        </div>
      </div>

      {/* Values */}
      <div
        className="grid grid-cols-2 gap-4 pt-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#333' }}>Em negociação</p>
          <p className="text-base font-bold text-warning">{formatBRL(valorPipeline)}</p>
          <p className="text-[10px] mt-0.5" style={{ color: '#444' }}>{cotacoesEmAndamento} cotações abertas</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#333' }}>Valor perdido</p>
          <p className="text-base font-bold text-danger">{formatBRL(valorPerdido)}</p>
          <p className="text-[10px] mt-0.5" style={{ color: '#444' }}>{cotacoesPerdidas} oportunidades</p>
        </div>
      </div>
    </div>
  )
}
