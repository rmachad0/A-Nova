import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const fabricantes = ['Invgate', 'Solarwinds', 'Macrium', 'TeamViewer']
  for (const nome of fabricantes) {
    await prisma.fabricante.upsert({
      where: { nome },
      update: {},
      create: { nome },
    })
  }

  const distribuidores = [
    { nome: 'Adistec', markupPadrao: 40, repassePct: 5 },
    { nome: 'Invgate', markupPadrao: 35, repassePct: 0 },
    { nome: 'Macrium', markupPadrao: 40, repassePct: 0 },
    { nome: 'Boxware', markupPadrao: 30, repassePct: 5 },
  ]
  for (const d of distribuidores) {
    await prisma.distribuidor.upsert({
      where: { nome: d.nome },
      update: {},
      create: d,
    })
  }

  const senhaAdmin = await bcrypt.hash('Tudovaidarcerto2026', 10)
  await prisma.user.upsert({
    where: { email: 'vendas@anovasolucao.net' },
    update: {},
    create: { email: 'vendas@anovasolucao.net', name: 'Vendas A Nova', password: senhaAdmin, role: 'ADMIN' },
  })

  const senhaComercial = await bcrypt.hash('comercial@2024', 10)
  await prisma.user.upsert({
    where: { email: 'comercial@anova.com.br' },
    update: {},
    create: { email: 'comercial@anova.com.br', name: 'Equipe Comercial', password: senhaComercial, role: 'COMERCIAL' },
  })

  const admin = await prisma.user.findUnique({ where: { email: 'admin@anova.com.br' } })
  const invgate = await prisma.fabricante.findUnique({ where: { nome: 'Invgate' } })
  const solarwinds = await prisma.fabricante.findUnique({ where: { nome: 'Solarwinds' } })
  const macrium = await prisma.fabricante.findUnique({ where: { nome: 'Macrium' } })
  const teamviewer = await prisma.fabricante.findUnique({ where: { nome: 'TeamViewer' } })

  if (!admin || !invgate || !solarwinds || !macrium || !teamviewer) return

  const exemplos = [
    { cliente: 'Rochalog', fabricanteId: invgate.id, custoBRL: 27500, markupPct: 40, precoVenda: 38500, imposto: 3850, lucroLiquido: 7150, lucroPct: 18.57, tipo: 'Produto', status: 'Ganho', data: new Date('2025-01-15') },
    { cliente: 'Prefeitura SP', fabricanteId: solarwinds.id, custoBRL: 16200, markupPct: 65, precoVenda: 26730, imposto: 5346, lucroLiquido: 5184, lucroPct: 19.39, tipo: 'Servico', status: 'Ganho', data: new Date('2025-02-20') },
    { cliente: 'TechCorp', fabricanteId: macrium.id, custoBRL: 6360, markupPct: 43, precoVenda: 9094.8, imposto: 909.48, lucroLiquido: 1825.32, lucroPct: 20.07, tipo: 'Produto', status: 'EmAndamento', data: new Date('2025-03-10') },
    { cliente: 'Governo Federal', fabricanteId: teamviewer.id, custoBRL: 44800, markupPct: 70, precoVenda: 76160, imposto: 15232, lucroLiquido: 16128, lucroPct: 21.18, tipo: 'Servico', status: 'Ganho', data: new Date('2025-04-05') },
    { cliente: 'Hospital Central', fabricanteId: invgate.id, custoBRL: 13625, markupPct: 54, precoVenda: 20982.5, imposto: 2098.25, lucroLiquido: 5259.25, lucroPct: 25.07, tipo: 'Produto', status: 'Perdido', data: new Date('2025-05-18') },
    { cliente: 'Banco Digital', fabricanteId: solarwinds.id, custoBRL: 33000, markupPct: 88, precoVenda: 62040, imposto: 12408, lucroLiquido: 16632, lucroPct: 26.81, tipo: 'Servico', status: 'Ganho', data: new Date('2025-06-22') },
    { cliente: 'Multiplan', fabricanteId: invgate.id, custoBRL: 24750, markupPct: 100, precoVenda: 49500, imposto: 4950, lucroLiquido: 19800, lucroPct: 40.0, tipo: 'Produto', status: 'Ganho', data: new Date('2025-07-10') },
    { cliente: 'Unimed', fabricanteId: solarwinds.id, custoBRL: 18900, markupPct: 115, precoVenda: 40635, imposto: 8127, lucroLiquido: 13608, lucroPct: 33.49, tipo: 'Servico', status: 'Ganho', data: new Date('2025-08-25') },
  ]

  for (const e of exemplos) {
    const existe = await prisma.calculo.findFirst({ where: { cliente: e.cliente, fabricanteId: e.fabricanteId } })
    if (!existe) {
      await prisma.calculo.create({
        data: {
          modulo: 'Direto',
          tipo: e.tipo,
          status: e.status,
          cliente: e.cliente,
          data: e.data,
          custoBRL: e.custoBRL,
          markupPct: e.markupPct,
          precoVenda: e.precoVenda,
          imposto: e.imposto,
          lucroLiquido: e.lucroLiquido,
          lucroPct: e.lucroPct,
          userId: admin.id,
          fabricanteId: e.fabricanteId,
        },
      })
    }
  }

  console.log('✅ Seed concluído!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
