import { PrismaClient } from '@prisma/client'
import * as xlsx from 'xlsx'

const prisma = new PrismaClient()

const PLANILHA = '/Users/regianemachado/Downloads/Planilha de cálculo 2026.xlsx'

function parseData(val: unknown): Date | null {
  if (!val) return null
  if (val instanceof Date) return val
  if (typeof val === 'string') {
    const s = val.replace('`', '').trim()
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (m) {
      const d = new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]))
      if (!isNaN(d.getTime())) return d
    }
  }
  return null
}

function parseStatus(val: unknown): string {
  if (!val) return 'EmAndamento'
  const s = String(val).trim().toLowerCase()
  if (s.startsWith('ganho')) return 'Ganho'
  if (s.startsWith('perdido')) return 'Perdido'
  return 'EmAndamento'
}

function parseModalidade(val: unknown): string {
  const s = String(val ?? '').toLowerCase()
  if (s.includes('cart')) return 'CartaoCredito'
  if (s.includes('paypal')) return 'Paypal'
  if (s.includes('transfer')) return 'TransferenciaBancaria'
  if (s.includes('pix')) return 'PIX'
  return 'Paypal'
}

// Chave única para identificar cada cotação (evita duplicatas)
function chave(modulo: string, cliente: string | null, venda: number, data: Date): string {
  const d = data.toISOString().slice(0, 10)
  return `${modulo}|${(cliente ?? '').trim().toLowerCase()}|${venda.toFixed(2)}|${d}`
}

async function upsertFabricante(nome: string | null): Promise<string | null> {
  if (!nome) return null
  const fab = await prisma.fabricante.upsert({
    where: { nome: nome.trim() },
    create: { nome: nome.trim() },
    update: {},
  })
  return fab.id
}

async function upsertDistribuidor(nome: string | null): Promise<string | null> {
  if (!nome) return null
  const dist = await prisma.distribuidor.upsert({
    where: { nome: nome.trim() },
    create: { nome: nome.trim(), markupPadrao: 30, repassePct: 0 },
    update: {},
  })
  return dist.id
}

async function main() {
  console.log(`\n📊 Iniciando importação — ${new Date().toLocaleString('pt-BR')}`)

  const wb = xlsx.readFile(PLANILHA)

  const user = await prisma.user.findFirst({ where: { email: 'vendas@anovasolucao.net' } })
  if (!user) throw new Error('Usuário vendas@anovasolucao.net não encontrado')

  // Carregar todas as chaves já existentes no banco
  const existentes = await prisma.calculo.findMany({
    select: { modulo: true, cliente: true, precoVenda: true, data: true },
  })
  const chavesExistentes = new Set(
    existentes.map(e => chave(e.modulo, e.cliente, e.precoVenda, e.data))
  )

  let novos = 0
  let ignorados = 0
  let erros = 0

  // ── Faturamento Direto ──────────────────────────────────────────
  const wsDireto = wb.Sheets['Faturamento direto']
  const direto = xlsx.utils.sheet_to_json<unknown[]>(wsDireto, { header: 1, defval: null }) as unknown[][]

  for (let i = 1; i < direto.length; i++) {
    const r = direto[i] as unknown[]
    const custoBRL = r[9] ? Number(r[9]) : null
    const venda = r[10] ? Number(r[10]) : null
    if (!custoBRL || !venda) continue

    const data = parseData(r[1]) ?? new Date('2026-01-01')
    const cliente = r[2] ? String(r[2]).trim() : null
    const k = chave('Direto', cliente, venda, data)

    if (chavesExistentes.has(k)) { ignorados++; continue }

    const tipo = String(r[0] ?? '').trim()
    const distNome = r[3] ? String(r[3]).trim() : null
    const fabNome = r[4] ? String(r[4]).trim() : null
    const dolar = r[6] ? Number(r[6]) : null
    const custoUSD = r[8] ? Number(r[8]) : null
    const imposto = Number(r[11] ?? 0)
    const margemBruta = r[12] ? Number(r[12]) : null
    const lucroLiquido = r[13] ? Number(r[13]) : null
    const lucroPctRaw = r[14] ? Number(r[14]) : 0
    const status = parseStatus(r[15])
    const markup = Math.round((venda / custoBRL - 1) * 100 * 100) / 100

    try {
      const [fabricanteId, distribuidorId] = await Promise.all([
        upsertFabricante(fabNome),
        upsertDistribuidor(distNome),
      ])
      await prisma.calculo.create({
        data: {
          modulo: 'Direto',
          tipo: tipo.startsWith('Serv') ? 'Servico' : 'Produto',
          status,
          cliente,
          data,
          custoUSD,
          dolar,
          custoBRL,
          markupPct: markup,
          precoVenda: venda,
          imposto,
          margemBruta,
          lucroLiquido,
          margemLiquida: lucroLiquido,
          lucroPct: lucroPctRaw > 1 ? lucroPctRaw : lucroPctRaw * 100,
          userId: user.id,
          fabricanteId,
          distribuidorId,
        },
      })
      novos++
      chavesExistentes.add(k)
    } catch (e) {
      console.error(`  ✗ Linha ${i + 1} (Direto):`, e)
      erros++
    }
  }

  // ── Fabricante Estrangeiro ──────────────────────────────────────
  const wsEst = wb.Sheets['Fabricante estrangeiro']
  const estrangeiro = xlsx.utils.sheet_to_json<unknown[]>(wsEst, { header: 1, defval: null }) as unknown[][]

  for (let i = 1; i < estrangeiro.length; i++) {
    const r = estrangeiro[i] as unknown[]
    const custoBRL = r[8] ? Number(r[8]) : null
    const venda = r[9] ? Number(r[9]) : null
    if (!custoBRL || !venda) continue

    const data = parseData(r[2]) ?? new Date('2026-01-01')
    const cliente = r[3] ? String(r[3]).trim() : null
    const k = chave('Estrangeiro', cliente, venda, data)

    if (chavesExistentes.has(k)) { ignorados++; continue }

    const nf = String(r[1] ?? '').trim()
    const fabNome = r[4] ? String(r[4]).trim() : null
    const dolar = r[6] ? Number(r[6]) : null
    const custoUSD = r[7] ? Number(r[7]) : null
    const spread4pct = r[10] ? Number(r[10]) : null
    const imposto = Number(r[11] ?? 0)
    const iof438pct = r[12] ? Number(r[12]) : null
    const margemBruta = r[13] ? Number(r[13]) : null
    const margemLiquida = r[14] ? Number(r[14]) : null
    const lucroPctRaw = r[15] ? Number(r[15]) : 0
    const status = parseStatus(r[17])
    const markup = Math.round((venda / custoBRL - 1) * 100 * 100) / 100

    try {
      const fabricanteId = await upsertFabricante(fabNome)
      await prisma.calculo.create({
        data: {
          modulo: 'Estrangeiro',
          tipo: nf.startsWith('Serv') ? 'Servico' : 'Produto',
          modalidade: parseModalidade(r[0]),
          status,
          cliente,
          data,
          custoUSD,
          dolar,
          custoBRL,
          markupPct: markup,
          precoVenda: venda,
          imposto,
          spread4pct,
          iof438pct,
          margemBruta,
          margemLiquida,
          lucroLiquido: margemLiquida,
          lucroPct: lucroPctRaw > 1 ? lucroPctRaw : lucroPctRaw * 100,
          userId: user.id,
          fabricanteId,
        },
      })
      novos++
      chavesExistentes.add(k)
    } catch (e) {
      console.error(`  ✗ Linha ${i + 1} (Estrangeiro):`, e)
      erros++
    }
  }

  console.log(`✅ Concluído: ${novos} novos | ${ignorados} já existiam | ${erros} erros`)
  await prisma.$disconnect()
}

main().catch(async e => {
  console.error('❌ Falha na importação:', e)
  await prisma.$disconnect()
  process.exit(1)
})
