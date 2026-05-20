import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { role } = await request.json()
  const rolesValidos = ['ADMIN', 'COMERCIAL']
  if (!rolesValidos.includes(role)) {
    return NextResponse.json({ error: 'Perfil inválido' }, { status: 400 })
  }

  if (params.id === session.user.id) {
    return NextResponse.json({ error: 'Você não pode alterar seu próprio perfil' }, { status: 400 })
  }

  const usuario = await prisma.user.update({
    where: { id: params.id },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      acao: 'UPDATE_ROLE',
      entidade: 'User',
      entidadeId: params.id,
      detalhes: { role },
    },
  })

  return NextResponse.json(usuario)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  if (params.id === session.user.id) {
    return NextResponse.json({ error: 'Você não pode excluir sua própria conta' }, { status: 400 })
  }

  const usuario = await prisma.user.findUnique({ where: { id: params.id } })
  if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  await prisma.user.delete({ where: { id: params.id } })

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      acao: 'DELETE_USER',
      entidade: 'User',
      entidadeId: params.id,
      detalhes: { name: usuario.name, email: usuario.email },
    },
  })

  return NextResponse.json({ ok: true })
}
