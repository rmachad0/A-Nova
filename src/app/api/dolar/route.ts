import { NextResponse } from 'next/server'

function dataHoje() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${mm}-${dd}-${yyyy}`
}

// Tenta dias anteriores se PTAX não estiver disponível (fins de semana/feriados)
async function buscarPTAX(): Promise<number | null> {
  for (let diasAtras = 0; diasAtras <= 4; diasAtras++) {
    const d = new Date()
    d.setDate(d.getDate() - diasAtras)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const yyyy = d.getFullYear()
    const data = `${mm}-${dd}-${yyyy}`

    try {
      const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${data}'&$top=1&$format=json&$select=cotacaoVenda`
      const res = await fetch(url, { next: { revalidate: 3600 } })
      const json = await res.json()
      if (json?.value?.[0]?.cotacaoVenda) {
        return json.value[0].cotacaoVenda as number
      }
    } catch {
      continue
    }
  }
  return null
}

async function buscarDolarComercial(): Promise<number | null> {
  try {
    const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL', {
      next: { revalidate: 300 },
    })
    const json = await res.json()
    const ask = parseFloat(json?.USDBRL?.ask)
    return isNaN(ask) ? null : ask
  } catch {
    return null
  }
}

export async function GET() {
  const [ptax, comercial] = await Promise.all([buscarPTAX(), buscarDolarComercial()])

  return NextResponse.json({
    ptax: ptax ? parseFloat(ptax.toFixed(4)) : null,
    comercial: comercial ? parseFloat(comercial.toFixed(4)) : null,
    atualizadoEm: new Date().toISOString(),
  })
}
