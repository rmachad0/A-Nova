import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

function calcularDatasGanho(dataVenda: Date) {
  const dataRecebimento = new Date(dataVenda)
  dataRecebimento.setDate(dataRecebimento.getDate() + 30)

  // Primeiro dia do mês seguinte ao recebimento
  const dataPagamentoImposto = new Date(
    dataRecebimento.getFullYear(),
    dataRecebimento.getMonth() + 1,
    1
  )

  return { dataRecebimento, dataPagamentoImposto }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { status } = await request.json()

  const statusValidos = ['EmAndamento', 'Ganho', 'Perdido']
  if (!statusValidos.includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const dados: Record<string, unknown> = { status }

  if (status === 'Ganho') {
    const agora = new Date()
    const { dataRecebimento, dataPagamentoImposto } = calcularDatasGanho(agora)
    dados.dataStatusGanho = agora
    dados.dataRecebimento = dataRecebimento
    dados.dataPagamentoImposto = dataPagamentoImposto
  } else {
    // Limpa as datas se status for alterado para não-Ganho
    dados.dataStatusGanho = null
    dados.dataRecebimento = null
    dados.dataPagamentoImposto = null
  }

  const calculo = await prisma.calculo.update({
    where: { id: params.id },
    data: dados,
  })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      acao: 'UPDATE_STATUS',
      entidade: 'Calculo',
      entidadeId: params.id,
      detalhes: { status, ...dados },
    },
  })

  return NextResponse.json(calculo)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const calculo = await prisma.calculo.findUnique({ where: { id: params.id } })
  if (!calculo) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  await prisma.calculo.delete({ where: { id: params.id } })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      acao: 'DELETE',
      entidade: 'Calculo',
      entidadeId: params.id,
      detalhes: { cliente: calculo.cliente, precoVenda: calculo.precoVenda },
    },
  })

  return NextResponse.json({ ok: true })
}
