'use client'

import { useState } from 'react'
import {
  calcularFabricanteEstrangeiro,
  calcularMarkupMinimo,
  MARKUPS_ESTRANGEIRO,
  FABRICANTES,
  ALIQUOTAS,
  type TipoNF,
  type ModalidadePagamento,
  type StatusVenda,
} from '@/lib/financeiro'
import { formatBRL } from '@/lib/utils'
import MarkupSlider from './MarkupSlider'
import ResultadoCard from './ResultadoCard'
import AlertaMargem from './AlertaMargem'
import DolarWidget from './DolarWidget'
import { Save, RefreshCw, AlertCircle, Info } from 'lucide-react'

const MODALIDADES: ModalidadePagamento[] = ['Cartão de crédito', 'Paypal', 'Transferência bancária', 'PIX']

export default function TabEstrangeiro() {
  const [nf, setNf] = useState<TipoNF>('Produto')
  const [modalidade, setModalidade] = useState<ModalidadePagamento>('PIX')
  const [cliente, setCliente] = useState('')
  const [fabricante, setFabricante] = useState('')
  const [custoUSD, setCustoUSD] = useState('')
  const [dolar, setDolar] = useState('')
  const [markupPct, setMarkupPct] = useState(100)
  const [status, setStatus] = useState<StatusVenda>('Em andamento')
  const [salvando, setSalvando] = useState(false)
  const [confirmBloquear, setConfirmBloquear] = useState(false)
  const [mensagem, setMensagem] = useState('')

  const custoUSDNum = parseFloat(custoUSD) || 0
  const dolarNum = parseFloat(dolar) || 0
  const pronto = custoUSDNum > 0 && dolarNum > 0

  const resultado = calcularFabricanteEstrangeiro({
    nf,
    modalidade,
    custoUSD: custoUSDNum,
    dolar: dolarNum,
    markupPct,
  })

  const sugestaoMarkup = pronto
    ? calcularMarkupMinimo({ tipo: nf, custoBRL: resultado.custoBRL, margemAlvoPct: 20 })
    : undefined

  function limpar() {
    setCustoUSD(''); setDolar(''); setMarkupPct(100)
    setCliente(''); setFabricante(''); setStatus('Em andamento')
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
          modulo: 'Estrangeiro',
          tipo: nf === 'Serviço' ? 'Servico' : 'Produto',
          modalidade: modalidade.replace(' ', '').replace('ã', 'a').replace('ê', 'e'),
          status: status === 'Em andamento' ? 'EmAndamento' : status,
          cliente,
          custoUSD: custoUSDNum,
          dolar: dolarNum,
          markupPct,
          precoVenda: resultado.venda,
          imposto: resultado.imposto,
          spread4pct: resultado.spread4pct,
          iof438pct: resultado.iof438pct,
          margemBruta: resultado.margemBruta,
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
        {/* Banner IOF */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg px-4 py-2.5 flex items-start gap-2 text-xs text-blue-400">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>
            IOF aplicado: <strong>4,38%</strong> (fórmula real da planilha — cabeçalho original diz 3,5% mas a fórmula usa 4,38%)
          </span>
        </div>

        <div>
          <label className="label">Tipo NF</label>
          <div className="flex gap-2">
            {(['Produto', 'Serviço'] as TipoNF[]).map(t => (
              <button key={t} onClick={() => setNf(t)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border ${nf === t ? 'bg-neon/10 border-neon/30 text-neon shadow-neon-sm' : 'bg-surface-2 border-border text-text-secondary hover:text-white'}`}>
                {t} <span className="ml-1 text-xs opacity-60">({t === 'Produto' ? '10%' : '20%'})</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Modalidade de Pagamento</label>
          <div className="grid grid-cols-2 gap-2">
            {MODALIDADES.map(m => (
              <button key={m} onClick={() => setModalidade(m)} className={`py-2 px-3 rounded-lg text-sm font-medium transition-all border text-left ${modalidade === m ? 'bg-neon/10 border-neon/30 text-neon' : 'bg-surface-2 border-border text-text-secondary hover:text-white'}`}>
                {m}
                {m === 'Cartão de crédito' && <span className="ml-1 text-xs opacity-60">(+4% spread)</span>}
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
            <label className="label">Fabricante</label>
            <select value={fabricante} onChange={e => setFabricante(e.target.value)} className="input-field">
              <option value="">Selecionar...</option>
              {FABRICANTES.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <DolarWidget onSelecionar={v => setDolar(String(v))} />

        {pronto && (
          <div className="bg-surface-3 border border-border rounded-md px-3 py-2 text-sm text-text-secondary">
            Custo BRL: <span className="text-white font-medium">{formatBRL(resultado.custoBRL)}</span>
            {modalidade === 'Cartão de crédito' && (
              <> · Spread: <span className="text-warning font-medium">{formatBRL(resultado.spread4pct)}</span></>
            )}
          </div>
        )}

        <div>
          <label className="label">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value as StatusVenda)} className="input-field">
            <option>Em andamento</option><option>Ganho</option><option>Perdido</option>
          </select>
        </div>

        <MarkupSlider value={markupPct} onChange={setMarkupPct} presets={MARKUPS_ESTRANGEIRO} />

        {confirmBloquear && (
          <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-danger font-semibold text-sm">
              <AlertCircle className="w-4 h-4" />Atenção: operação com PREJUÍZO
            </div>
            <p className="text-xs text-danger/80">Esta venda resulta em margem negativa. Confirma mesmo assim?</p>
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
            <AlertaMargem alerta={resultado.alertaMargen} lucroPct={resultado.lucroPct} sugestaoMarkup={sugestaoMarkup} />
            <ResultadoCard
              titulo="Detalhamento — Fabricante Estrangeiro"
              linhas={[
                { label: 'Custo USD', valor: custoUSDNum, tipo: 'usd', tooltip: 'Valor do produto em dólar americano' },
                { label: 'Câmbio', valor: dolarNum, tipo: 'usd', tooltip: 'Cotação do dólar utilizada' },
                { label: 'Custo BRL', valor: resultado.custoBRL, tooltip: 'Custo USD × Câmbio' },
                { label: 'Markup', valor: markupPct, tipo: 'pct' },
                { label: 'Preço de Venda', valor: resultado.venda, tooltip: 'Custo BRL + (Custo BRL × Markup% / 100)' },
                { label: 'Spread 4%', valor: resultado.spread4pct, tooltip: 'Aplicado apenas no Cartão de crédito: Custo BRL × 4%' },
                { label: `Imposto (${nf === 'Produto' ? '10%' : '20%'})`, valor: resultado.imposto, tooltip: nf === 'Produto' ? 'Venda × 10%' : 'Venda × 20%' },
                { label: 'IOF 4,38%', valor: resultado.iof438pct, tooltip: 'Custo BRL × 4,38% — sempre aplicado, valor fixo' },
                { label: 'Margem Bruta', valor: resultado.margemBruta, tooltip: 'Venda − Custo BRL' },
                { label: 'Margem Líquida', valor: resultado.margemLiquida, destaque: true, negativo: resultado.margemLiquida < 0, tooltip: 'Margem Bruta − Spread − Imposto − IOF' },
                { label: 'Lucro %', valor: resultado.lucroPct, tipo: 'pct', destaque: true, negativo: resultado.lucroPct < 0, tooltip: 'Margem Líquida ÷ Venda' },
                { label: 'Cotação Efetiva', valor: resultado.cotacaoEfetiva, tooltip: 'Quanto efetivamente recebemos por dólar (Venda / Custo USD)' },
              ]}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center text-text-secondary border border-dashed border-border rounded-xl">
            <span className="text-4xl mb-3">🌎</span>
            <p className="font-medium text-white">Fabricante Estrangeiro</p>
            <p className="text-sm mt-1">Preencha Custo USD e Câmbio para calcular</p>
          </div>
        )}
      </div>
    </div>
  )
}
