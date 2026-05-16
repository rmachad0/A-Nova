'use client'

import { useState } from 'react'
import { calcularFaturamentoDistribuidor, DISTRIBUIDORES, type TipoNF, type StatusVenda } from '@/lib/financeiro'
import { formatBRL } from '@/lib/utils'
import MarkupSlider from './MarkupSlider'
import ResultadoCard from './ResultadoCard'
import AlertaMargem from './AlertaMargem'
import { Save, RefreshCw, AlertCircle } from 'lucide-react'

const MARKUPS_DIST = [25, 30, 35, 40, 45, 50, 55, 60]

export default function TabDistribuidor() {
  const [tipo, setTipo] = useState<TipoNF>('Produto')
  const [cliente, setCliente] = useState('')
  const [distribuidor, setDistribuidor] = useState('')
  const [custoBRL, setCustoBRL] = useState('')
  const [markupPct, setMarkupPct] = useState(35)
  const [repassePct, setRepassePct] = useState(5)
  const [status, setStatus] = useState<StatusVenda>('Em andamento')
  const [salvando, setSalvando] = useState(false)
  const [confirmBloquear, setConfirmBloquear] = useState(false)
  const [mensagem, setMensagem] = useState('')

  const custoBRLNum = parseFloat(custoBRL) || 0
  const pronto = custoBRLNum > 0

  const resultado = calcularFaturamentoDistribuidor({
    tipo, custoBRL: custoBRLNum, markupPct, repassePct,
  })

  function limpar() {
    setCustoBRL(''); setMarkupPct(35); setRepassePct(5)
    setCliente(''); setDistribuidor(''); setStatus('Em andamento')
    setConfirmBloquear(false); setMensagem('')
  }

  async function salvar() {
    if (!pronto) return
    if (resultado.lucraNegativo && !confirmBloquear) { setConfirmBloquear(true); return }

    setSalvando(true)
    try {
      const res = await fetch('/api/calculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modulo: 'Distribuidor',
          tipo: tipo === 'Serviço' ? 'Servico' : 'Produto',
          status: status === 'Em andamento' ? 'EmAndamento' : status,
          cliente,
          custoBRL: custoBRLNum,
          markupPct,
          repassePct,
          precoVenda: resultado.precoVenda,
          imposto: resultado.imposto,
          margemLiquida: resultado.margemLiquida,
          lucroPct: resultado.lucroPct,
        }),
      })
      if (res.ok) {
        setMensagem('Cálculo salvo com sucesso!')
        setTimeout(() => setMensagem(''), 3000)
        setConfirmBloquear(false)
      }
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Inputs */}
      <div className="space-y-5">
        <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg px-4 py-2.5 text-xs text-purple-400">
          Módulo estruturalmente preparado para operações via distribuidor com regras de repasse parametrizáveis.
        </div>

        <div>
          <label className="label">Tipo NF</label>
          <div className="flex gap-2">
            {(['Produto', 'Serviço'] as TipoNF[]).map(t => (
              <button key={t} onClick={() => setTipo(t)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border ${tipo === t ? 'bg-neon/10 border-neon/30 text-neon shadow-neon-sm' : 'bg-surface-2 border-border text-text-secondary hover:text-white'}`}>
                {t} <span className="ml-1 text-xs opacity-60">({t === 'Produto' ? '10%' : '20%'})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Cliente</label>
            <input value={cliente} onChange={e => setCliente(e.target.value)} className="input-field" placeholder="Nome do cliente" />
          </div>
          <div>
            <label className="label">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as StatusVenda)} className="input-field">
              <option>Em andamento</option><option>Ganho</option><option>Perdido</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Distribuidor</label>
          <select value={distribuidor} onChange={e => setDistribuidor(e.target.value)} className="input-field">
            <option value="">Selecionar...</option>
            {DISTRIBUIDORES.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Custo BRL</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">R$</span>
            <input type="number" value={custoBRL} onChange={e => setCustoBRL(e.target.value)} className="input-field pl-9" placeholder="0,00" min="0" step="0.01" />
          </div>
        </div>

        <MarkupSlider value={markupPct} onChange={setMarkupPct} presets={MARKUPS_DIST} />

        {/* Repasse */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="label mb-0">Repasse ao Distribuidor %</label>
            <span className="text-warning font-bold">{repassePct}%</span>
          </div>
          <input
            type="range" min={0} max={30} step={0.5} value={repassePct}
            onChange={e => setRepassePct(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-surface-3 rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-warning [&::-webkit-slider-thumb]:cursor-pointer"
            style={{ background: `linear-gradient(to right, #FFB800 0%, #FFB800 ${(repassePct / 30) * 100}%, #222 ${(repassePct / 30) * 100}%, #222 100%)` }}
          />
          {pronto && (
            <div className="text-xs text-text-secondary">
              Repasse: <span className="text-warning font-medium">{formatBRL(resultado.repasseDistribuidor)}</span>
            </div>
          )}
        </div>

        {confirmBloquear && (
          <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-danger font-semibold text-sm">
              <AlertCircle className="w-4 h-4" />Atenção: operação com PREJUÍZO
            </div>
            <div className="flex gap-2 mt-1">
              <button onClick={salvar} className="px-3 py-1.5 rounded bg-danger text-white text-xs font-medium">Confirmar mesmo assim</button>
              <button onClick={() => setConfirmBloquear(false)} className="px-3 py-1.5 rounded bg-surface-2 text-text-secondary text-xs border border-border">Cancelar</button>
            </div>
          </div>
        )}

        {mensagem && <div className="bg-neon/10 border border-neon/20 rounded-lg p-3 text-neon text-sm">{mensagem}</div>}

        <div className="flex gap-3">
          <button onClick={salvar} disabled={!pronto || salvando} className="btn-primary flex items-center gap-2 flex-1 justify-center">
            <Save className="w-4 h-4" />
            {salvando ? 'Salvando...' : 'Salvar Cálculo'}
          </button>
          <button onClick={limpar} className="btn-secondary flex items-center gap-2 px-4">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Resultado */}
      <div className="space-y-4">
        {pronto ? (
          <>
            <AlertaMargem alerta={resultado.alertaMargen} lucroPct={resultado.lucroPct} />
            <ResultadoCard
              titulo="Detalhamento — Via Distribuidor"
              linhas={[
                { label: 'Custo BRL', valor: resultado.precoVenda / (1 + markupPct / 100) },
                { label: 'Markup', valor: markupPct, tipo: 'pct' },
                { label: 'Preço de Venda', valor: resultado.precoVenda, tooltip: 'Custo BRL + (Custo BRL × Markup% / 100)' },
                { label: `Imposto (${tipo === 'Produto' ? '10%' : '20%'})`, valor: resultado.imposto },
                { label: `Repasse Distribuidor (${repassePct}%)`, valor: resultado.repasseDistribuidor, tooltip: 'Preço de Venda × Repasse%' },
                { label: 'Margem Bruta', valor: resultado.margemBruta, tooltip: 'Venda − Custo' },
                { label: 'Margem Líquida', valor: resultado.margemLiquida, destaque: true, negativo: resultado.margemLiquida < 0, tooltip: 'Margem Bruta − Imposto − Repasse' },
                { label: 'Lucro %', valor: resultado.lucroPct, tipo: 'pct', destaque: true, negativo: resultado.lucroPct < 0 },
              ]}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center text-text-secondary border border-dashed border-border rounded-xl">
            <span className="text-4xl mb-3">🏢</span>
            <p className="font-medium text-white">Faturamento Distribuidor</p>
            <p className="text-sm mt-1">Preencha o custo para calcular</p>
          </div>
        )}
      </div>
    </div>
  )
}
