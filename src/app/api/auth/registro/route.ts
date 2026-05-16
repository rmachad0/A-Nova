import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { nome, email, senha } = await request.json()

    if (!nome || !email || !senha) {
      return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 })
    }

    if (senha.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter ao menos 6 caracteres.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })
    }

    const existe = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existe) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 409 })
    }

    const senhaHash = await bcrypt.hash(senha, 10)
    const user = await prisma.user.create({
      data: {
        name: nome.trim(),
        email: email.toLowerCase().trim(),
        password: senhaHash,
        role: 'COMERCIAL',
      },
    })

    return NextResponse.json({ ok: true, id: user.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 })
  }
}
