'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  calcularFaturamentoDireto,
  calcularMarkupMinimo,
  MARKUPS_DIRETO,
  FABRICANTES,
  DISTRIBUIDORES,
  type TipoNF,
  type StatusVenda,
} from '@/lib/financeiro'
import { formatBRL } from '@/lib/utils'
import MarkupSlider from './MarkupSlider'
import ResultadoCard from './ResultadoCard'
import AlertaMargem from './AlertaMargem'
import { Save, RefreshCw, AlertCircle } from 'lucide-react'

export default function TabDireto() {
  const [tipo, setTipo] = useState<TipoNF>('Produto')
  const [cliente, setCliente] = useState('')
  const [fabricante, setFabricante] = useState('')
  const [distribuidor, setDistribuidor] = useState('')
  const [usarUSD, setUsarUSD] = useState(false)
  const [custoUSD, setCustoUSD] = useState('')
  const [dolar, setDolar] = useState('')
  const [custoBRL, setCustoBRL] = useState('')
  const [markupPct, setMarkupPct] = useState(40)
  const [status, setStatus] = useState<StatusVenda>('Em andamento')
  const [salvando, setSalvando] = useState(false)
  const [confirmBloquear, setConfirmBloquear] = useState(false)
  const [mensagem, setMensagem] = useState('')

  const custoUSDNum = parseFloat(custoUSD) || 0
  const dolarNum = parseFloat(dolar) || 0
  const custoBRLNum = usarUSD ? custoUSDNum * dolarNum : parseFloat(custoBRL) || 0

  const resultado = calcularFaturamentoDireto({
    tipo,
    custoBRL: custoBRLNum,
    markupPct,
  })

  const sugestaoMarkup = custoBRLNum > 0
    ? calcularMarkupMinimo({ tipo, custoBRL: custoBRLNum, margemAlvoPct: 20 })
    : undefined

  const podeSalvar = custoBRLNum > 0

  function limpar() {
    setCustoUSD(''); setDolar(''); setCustoBRL('')
    setMarkupPct(40); setCliente(''); setFabricante('')
    setDistribuidor(''); setStatus('Em andamento')
    setConfirmBloquear(false); setMensagem('')
  }

  async function salvar() {
    if (!podeSalvar) return
    if (resultado.lucraNegativo && !confirmBloquear) {
      setConfirmBloquear(true)
      return
    }

    setSalvando(true)
    try {
      const res = await fetch('/api/calculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modulo: 'Direto',
          tipo: tipo === 'Serviço' ? 'Servico' : 'Produto',
          status: status === 'Em andamento' ? 'EmAndamento' : status,
          cliente,
          custoUSD: custoUSDNum || undefined,
          dolar: dolarNum || undefined,
          custoBRL: custoBRLNum,
          markupPct,
          precoVenda: resultado.precoVenda,
          imposto: resultado.imposto,
          lucroLiquido: resultado.lucroLiquido,
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
        <div>
          <label className="label">Tipo</label>
          <div className="flex gap-2">
            {(['Produto', 'Serviço'] as TipoNF[]).map(t => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150 border ${
                  tipo === t
                    ? 'bg-neon/10 border-neon/30 text-neon shadow-neon-sm'
                    : 'bg-surface-2 border-border text-text-secondary hover:text-white'
                }`}
              >
                {t}
                <span className="ml-1 text-xs opacity-60">
                  ({t === 'Produto' ? '10%' : '20%'})
                </span>
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
              <option value="Em andamento">Em andamento</option>
              <option value="Ganho">Ganho</option>
              <option value="Perdido">Perdido</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Fabricante</label>
            <select value={fabricante} onChange={e => setFabricante(e.target.value)} className="input-field">
              <option value="">Selecionar...</option>
              {FABRICANTES.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Distribuidor</label>
            <select value={distribuidor} onChange={e => setDistribuidor(e.target.value)} className="input-field">
              <option value="">Selecionar...</option>
              {DISTRIBUIDORES.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Custo */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="label mb-0">Moeda</label>
            <div className="flex gap-2">
              <button
                onClick={() => setUsarUSD(false)}
                className={`px-3 py-1 rounded text-xs font-medium border transition-all ${
                  !usarUSD ? 'bg-neon/10 border-neon/30 text-neon' : 'bg-surface-2 border-border text-text-secondary'
                }`}
              >
                R$ BRL
              </button>
              <button
                onClick={() => setUsarUSD(true)}
                className={`px-3 py-1 rounded text-xs font-medium border transition-all ${
                  usarUSD ? 'bg-neon/10 border-neon/30 text-neon' : 'bg-surface-2 border-border text-text-secondary'
                }`}
              >
                US$ USD
              </button>
            </div>
          </div>

          {usarUSD ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Custo USD</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">US$</span>
                  <input type="number" value={custoUSD} onChange={e => setCustoUSD(e.target.value)} className="input-field pl-9" placeholder="0,00" min="0" step="0.01" />
                </div>
              </div>
              <div>
                <label className="label">Câmbio (R$/US$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">R$</span>
                  <input type="number" value={dolar} onChange={e => setDolar(e.target.value)} className="input-field pl-9" placeholder="5,50" min="0" step="0.01" />
                </div>
              </div>
              {custoUSDNum > 0 && dolarNum > 0 && (
                <div className="col-span-2 bg-surface-3 border border-border rounded-md px-3 py-2 text-sm text-text-secondary">
                  Custo BRL calculado: <span className="text-white font-medium">{formatBRL(custoBRLNum)}</span>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="label">Custo BRL</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">R$</span>
                <input type="number" value={custoBRL} onChange={e => setCustoBRL(e.target.value)} className="input-field pl-9" placeholder="0,00" min="0" step="0.01" />
              </div>
            </div>
          )}
        </div>

        <MarkupSlider value={markupPct} onChange={setMarkupPct} presets={MARKUPS_DIRETO} />

        {/* Alerta bloqueio */}
        {confirmBloquear && (
          <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-danger font-semibold text-sm">
              <AlertCircle className="w-4 h-4" />
              Atenção: operação com PREJUÍZO
            </div>
            <p className="text-xs text-danger/80">Esta venda resulta em lucro negativo. Confirma o registro mesmo assim?</p>
            <div className="flex gap-2 mt-1">
              <button onClick={salvar} className="px-3 py-1.5 rounded bg-danger text-white text-xs font-medium hover:bg-danger/80 transition-colors">
                Confirmar mesmo assim
              </button>
              <button onClick={() => setConfirmBloquear(false)} className="px-3 py-1.5 rounded bg-surface-2 text-text-secondary text-xs hover:text-white transition-colors border border-border">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {mensagem && (
          <div className="bg-neon/10 border border-neon/20 rounded-lg p-3 text-neon text-sm">{mensagem}</div>
        )}

        <div className="flex gap-3">
          <button onClick={salvar} disabled={!podeSalvar || salvando} className="btn-primary flex items-center gap-2 flex-1 justify-center">
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
        {custoBRLNum > 0 && (
          <>
            <AlertaMargem
              alerta={resultado.alertaMargen}
              lucroPct={resultado.lucroPct}
              sugestaoMarkup={sugestaoMarkup}
            />
            <ResultadoCard
              titulo="Detalhamento do Cálculo"
              linhas={[
                { label: 'Custo BRL', valor: resultado.custoBRL, tooltip: 'Custo USD × Câmbio (quando em moeda estrangeira)' },
                { label: 'Markup aplicado', valor: markupPct, tipo: 'pct', tooltip: 'Percentual de markup sobre o custo' },
                { label: 'Preço de Venda', valor: resultado.precoVenda, tooltip: 'Custo BRL + (Custo BRL × Markup% / 100)' },
                { label: `Imposto (${tipo === 'Produto' ? '10%' : '20%'})`, valor: resultado.imposto, tooltip: tipo === 'Produto' ? 'Produto: Venda × 10%' : 'Serviço: Venda × 20%' },
                { label: 'Diferença Venda − Custo', valor: resultado.diferencaVendaCusto, tooltip: 'Preço de Venda − Custo BRL' },
                { label: 'Lucro Líquido', valor: resultado.lucroLiquido, destaque: true, negativo: resultado.lucroLiquido < 0, tooltip: 'Diferença Venda-Custo − Imposto' },
                { label: 'Margem Líquida %', valor: resultado.lucroPct, tipo: 'pct', destaque: true, negativo: resultado.lucroPct < 0, tooltip: 'Lucro Líquido ÷ Preço de Venda' },
              ]}
            />
          </>
        )}

        {!custoBRLNum && (
          <div className="flex flex-col items-center justify-center h-64 text-center text-text-secondary border border-dashed border-border rounded-xl">
            <span className="text-4xl mb-3">⚡</span>
            <p className="font-medium text-white">Recálculo em tempo real</p>
            <p className="text-sm mt-1">Preencha o custo para ver os resultados</p>
          </div>
        )}
      </div>
    </div>
  )
}
