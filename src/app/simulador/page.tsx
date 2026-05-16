'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import TabDireto from '@/components/simulador/TabDireto'
import TabEstrangeiro from '@/components/simulador/TabEstrangeiro'
import TabDistribuidor from '@/components/simulador/TabDistribuidor'
import { cn } from '@/lib/utils'

const ABAS = [
  { id: 'direto', label: 'Faturamento Direto', emoji: '🏠', desc: 'Venda direta ao cliente final' },
  { id: 'estrangeiro', label: 'Fabricante Estrangeiro', emoji: '🌎', desc: 'Pagamento em USD ao fornecedor' },
  { id: 'distribuidor', label: 'Via Distribuidor', emoji: '🏢', desc: 'Operação com repasse ao parceiro' },
]

export default function SimuladorPage() {
  const [aba, setAba] = useState('direto')

  return (
    <AppShell>
      <div className="p-6 lg:p-8 space-y-6 animate-in">
        {/* Header */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: '#444' }}>Calculadora</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Simulador de Cálculo</h1>
          <p className="text-sm mt-1" style={{ color: '#555' }}>
            Recálculo em tempo real · Fórmulas validadas
          </p>
        </div>

        {/* Abas */}
        <div
          className="flex flex-col sm:flex-row gap-1.5 p-1.5 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          {ABAS.map(a => (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={cn(
                'flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left',
                aba === a.id
                  ? 'text-neon'
                  : 'hover:text-white'
              )}
              style={aba === a.id ? {
                background: 'rgba(57,255,20,0.07)',
                border: '1px solid rgba(57,255,20,0.15)',
              } : {
                color: '#555',
                border: '1px solid transparent',
              }}
            >
              <span className="text-base leading-none">{a.emoji}</span>
              <div>
                <div className="font-semibold">{a.label}</div>
                <div className="text-[11px] mt-0.5 font-normal" style={{ color: aba === a.id ? 'rgba(57,255,20,0.5)' : '#333' }}>{a.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="card p-6">
          {aba === 'direto' && <TabDireto />}
          {aba === 'estrangeiro' && <TabEstrangeiro />}
          {aba === 'distribuidor' && <TabDistribuidor />}
        </div>
      </div>
    </AppShell>
  )
}
