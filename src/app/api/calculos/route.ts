import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const modulo = searchParams.get('modulo')
  const status = searchParams.get('status')
  const fabricanteId = searchParams.get('fabricanteId')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')

  const where: Record<string, unknown> = {}
  if (modulo) where.modulo = modulo
  if (status) where.status = status
  if (fabricanteId) where.fabricanteId = fabricanteId

  const [total, calculos] = await Promise.all([
    prisma.calculo.count({ where }),
    prisma.calculo.findMany({
      where,
      include: { user: { select: { name: true } }, fabricante: true, distribuidor: true },
      orderBy: { data: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  return NextResponse.json({ calculos, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()

  const calculo = await prisma.calculo.create({
    data: {
      ...body,
      userId: session.user.id,
      data: body.data ? new Date(body.data) : new Date(),
    },
    include: { fabricante: true, distribuidor: true },
  })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      acao: 'CREATE',
      entidade: 'Calculo',
      entidadeId: calculo.id,
      detalhes: body,
    },
  })

  return NextResponse.json(calculo, { status: 201 })
}
