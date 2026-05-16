// ============================================================
// LÓGICA FINANCEIRA — Planilha de Cálculo A Nova
// Fórmulas extraídas célula a célula da planilha original
// ============================================================

export type TipoNF = 'Produto' | 'Serviço'
export type ModalidadePagamento = 'Cartão de crédito' | 'Paypal' | 'Transferência bancária' | 'PIX'
export type StatusVenda = 'Ganho' | 'Perdido' | 'Em andamento'

// Alíquotas fixas
export const ALIQUOTAS = {
  IMPOSTO_PRODUTO: 0.10,   // 10%
  IMPOSTO_SERVICO: 0.20,   // 20%
  SPREAD_CARTAO: 0.04,     // 4%
  IOF: 0.0438,             // 4,38% (label diz 3,5% mas fórmula real usa 4,38%)
} as const

// Markups históricos observados — Faturamento Direto
export const MARKUPS_DIRETO = [30, 35, 40, 43, 54, 60, 64, 65, 70, 88]

// Markups históricos observados — Fabricante Estrangeiro
export const MARKUPS_ESTRANGEIRO = [60, 70, 73.5, 80, 99.2, 100, 105, 114, 115]

// Distribuidores e fabricantes cadastrados
export const DISTRIBUIDORES = ['Adistec', 'Invgate', 'Macrium', 'Boxware']
export const FABRICANTES = ['Invgate', 'Solarwinds', 'Macrium', 'TeamViewer']

// ============================================================
// MÓDULO 1 — FATURAMENTO DIRETO
// ============================================================

export interface InputFaturamentoDireto {
  tipo: TipoNF
  custoUSD?: number
  dolar?: number
  custoBRL?: number
  markupPct: number
}

export interface ResultadoFaturamentoDireto {
  custoBRL: number
  precoVenda: number
  imposto: number
  diferencaVendaCusto: number
  lucroLiquido: number
  lucroPct: number
  alertaMargen: 'verde' | 'amarelo' | 'vermelho'
  lucraNegativo: boolean
}

export function calcularFaturamentoDireto(input: InputFaturamentoDireto): ResultadoFaturamentoDireto {
  // Custo BRL = Custo USD × Dólar (quando em moeda estrangeira)
  const custoBRL =
    input.custoBRL != null
      ? input.custoBRL
      : (input.custoUSD ?? 0) * (input.dolar ?? 0)

  // Preço de Venda = Custo BRL + (Custo BRL × Markup% / 100)
  const precoVenda = custoBRL + (custoBRL * input.markupPct) / 100

  // Imposto = SE(Tipo="Produto"; Venda × 9%; SE(Tipo="Serviço"; Venda × 19%; 0))
  const imposto =
    input.tipo === 'Produto'
      ? precoVenda * ALIQUOTAS.IMPOSTO_PRODUTO
      : input.tipo === 'Serviço'
      ? precoVenda * ALIQUOTAS.IMPOSTO_SERVICO
      : 0

  // Diferença Venda - Custo
  const diferencaVendaCusto = precoVenda - custoBRL

  // Lucro Líquido = Diferença Venda-Custo − Imposto
  const lucroLiquido = diferencaVendaCusto - imposto

  // Lucro % = Lucro ÷ Preço de Venda
  const lucroPct = precoVenda > 0 ? (lucroLiquido / precoVenda) * 100 : 0

  return {
    custoBRL,
    precoVenda,
    imposto,
    diferencaVendaCusto,
    lucroLiquido,
    lucroPct,
    alertaMargen: classificarMargem(lucroPct),
    lucraNegativo: lucroLiquido < 0,
  }
}

// ============================================================
// MÓDULO 2 — FABRICANTE ESTRANGEIRO
// ============================================================

export interface InputFabricanteEstrangeiro {
  nf: TipoNF
  modalidade: ModalidadePagamento
  custoUSD: number
  dolar: number
  markupPct: number
}

export interface ResultadoFabricanteEstrangeiro {
  custoBRL: number
  venda: number
  spread4pct: number
  imposto: number
  iof438pct: number
  margemBruta: number
  margemLiquida: number
  lucroPct: number
  cotacaoEfetiva: number
  alertaMargen: 'verde' | 'amarelo' | 'vermelho'
  lucraNegativo: boolean
}

export function calcularFabricanteEstrangeiro(input: InputFabricanteEstrangeiro): ResultadoFabricanteEstrangeiro {
  // Custo BRL = Custo USD × Dólar
  const custoBRL = input.custoUSD * input.dolar

  // Venda = Custo BRL + (Custo BRL × Markup% / 100)
  const venda = custoBRL + (custoBRL * input.markupPct) / 100

  // Spread 4% = SE(Modalidade="Cartão de crédito"; Custo BRL × 4%; 0)
  const spread4pct =
    input.modalidade === 'Cartão de crédito' ? custoBRL * ALIQUOTAS.SPREAD_CARTAO : 0

  // Imposto = SE(NF="Produto"; Venda × 9%; SE(NF="Serviço"; Venda × 19%; 0))
  const imposto =
    input.nf === 'Produto'
      ? venda * ALIQUOTAS.IMPOSTO_PRODUTO
      : input.nf === 'Serviço'
      ? venda * ALIQUOTAS.IMPOSTO_SERVICO
      : 0

  // IOF 4,38% = Custo BRL × 4,38% (sempre aplicado, fixo)
  const iof438pct = custoBRL * ALIQUOTAS.IOF

  // Margem Bruta = Venda − Custo BRL
  const margemBruta = venda - custoBRL

  // Margem Líquida = Margem Bruta − Spread − Imposto − IOF
  const margemLiquida = margemBruta - spread4pct - imposto - iof438pct

  // Lucro % = Margem Líquida ÷ Venda
  const lucroPct = venda > 0 ? (margemLiquida / venda) * 100 : 0

  // Cotação efetiva = Venda / Custo USD (quanto efetivamente recebemos por dólar)
  const cotacaoEfetiva = input.custoUSD > 0 ? venda / input.custoUSD : 0

  return {
    custoBRL,
    venda,
    spread4pct,
    imposto,
    iof438pct,
    margemBruta,
    margemLiquida,
    lucroPct,
    cotacaoEfetiva,
    alertaMargen: classificarMargem(lucroPct),
    lucraNegativo: margemLiquida < 0,
  }
}

// ============================================================
// MÓDULO 3 — FATURAMENTO DISTRIBUIDOR
// ============================================================

export interface InputFaturamentoDistribuidor {
  tipo: TipoNF
  custoBRL: number
  markupPct: number
  repassePct: number  // % de comissão/repasse ao distribuidor
}

export interface ResultadoFaturamentoDistribuidor {
  precoVenda: number
  imposto: number
  repasseDistribuidor: number
  margemBruta: number
  margemLiquida: number
  lucroPct: number
  alertaMargen: 'verde' | 'amarelo' | 'vermelho'
  lucraNegativo: boolean
}

export function calcularFaturamentoDistribuidor(input: InputFaturamentoDistribuidor): ResultadoFaturamentoDistribuidor {
  // Preço de Venda = Custo BRL + (Custo BRL × Markup% / 100)
  const precoVenda = input.custoBRL + (input.custoBRL * input.markupPct) / 100

  // Imposto = mesma lógica dos outros módulos
  const imposto =
    input.tipo === 'Produto'
      ? precoVenda * ALIQUOTAS.IMPOSTO_PRODUTO
      : precoVenda * ALIQUOTAS.IMPOSTO_SERVICO

  // Repasse ao distribuidor = Preço de Venda × Repasse%
  const repasseDistribuidor = precoVenda * (input.repassePct / 100)

  // Margem Bruta = Venda − Custo
  const margemBruta = precoVenda - input.custoBRL

  // Margem Líquida = Margem Bruta − Imposto − Repasse
  const margemLiquida = margemBruta - imposto - repasseDistribuidor

  // Lucro %
  const lucroPct = precoVenda > 0 ? (margemLiquida / precoVenda) * 100 : 0

  return {
    precoVenda,
    imposto,
    repasseDistribuidor,
    margemBruta,
    margemLiquida,
    lucroPct,
    alertaMargen: classificarMargem(lucroPct),
    lucraNegativo: margemLiquida < 0,
  }
}

// ============================================================
// UTILITÁRIOS
// ============================================================

function classificarMargem(lucroPct: number): 'verde' | 'amarelo' | 'vermelho' {
  if (lucroPct >= 20) return 'verde'
  if (lucroPct >= 10) return 'amarelo'
  return 'vermelho'
}

/** Sugestão de markup mínimo para atingir uma margem-alvo */
export function calcularMarkupMinimo(params: {
  tipo: TipoNF
  custoBRL: number
  margemAlvoPct: number
}): number {
  const { tipo, custoBRL, margemAlvoPct } = params
  const aliquota = tipo === 'Produto' ? ALIQUOTAS.IMPOSTO_PRODUTO : ALIQUOTAS.IMPOSTO_SERVICO
  const alvo = margemAlvoPct / 100

  // margemLiquida/venda = alvo
  // margemLiquida = venda - custo - venda*aliquota = venda*(1-aliquota) - custo
  // venda*(1-aliquota) - custo = alvo * venda
  // venda*(1-aliquota-alvo) = custo
  // venda = custo / (1 - aliquota - alvo)
  const venda = custoBRL / (1 - aliquota - alvo)
  const markup = ((venda - custoBRL) / custoBRL) * 100
  return Math.max(0, markup)
}

/** Formata valor como moeda BRL */
export function formatBRL(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

/** Formata valor como moeda USD */
export function formatUSD(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' }).format(valor)
}

/** Formata percentual */
export function formatPct(valor: number): string {
  return `${valor.toFixed(2)}%`
}
