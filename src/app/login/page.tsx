'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, ArrowRight, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const res = await signIn('credentials', {
      email,
      password: senha,
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      setErro('E-mail ou senha incorretos')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">

      {/* ── Ambient orbs ─────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Top-left green orb */}
        <div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(57,255,20,0.12) 0%, transparent 70%)',
            animation: 'orb-float 8s ease-in-out infinite',
          }}
        />
        {/* Bottom-right blue orb */}
        <div
          className="absolute -bottom-60 -right-40 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)',
            animation: 'orb-float 10s ease-in-out infinite reverse',
          }}
        />
        {/* Center soft glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(57,255,20,0.03) 0%, transparent 60%)',
          }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'linear-gradient(#39FF14 1px, transparent 1px), linear-gradient(90deg, #39FF14 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* ── Login card ───────────────────────────────── */}
      <div className="w-full max-w-[420px] animate-in relative z-10">

        {/* Logo block */}
        <div className="text-center mb-8">
          <div
            className="inline-block bg-white rounded-2xl px-7 py-3.5 mb-5"
            style={{ boxShadow: '0 0 40px rgba(57,255,20,0.18), 0 8px 32px rgba(0,0,0,0.4)' }}
          >
            <Image
              src="/logo.png"
              alt="A Nova Soluções Tecnológicas"
              width={200}
              height={68}
              className="object-contain h-12 w-auto"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Bem-vindo de volta</h1>
          <p className="text-text-secondary text-sm mt-1.5 leading-relaxed">
            Inteligência comercial aplicada aos seus cálculos
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <p className="text-sm font-semibold text-white mb-6">Acessar sistema</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Email field */}
            <div>
              <label className="label">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="input-field pl-10"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-white transition-colors"
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {erro && (
              <div
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-danger text-sm"
                style={{ background: 'rgba(255,59,59,0.08)', border: '1px solid rgba(255,59,59,0.15)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
                {erro}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center justify-center gap-2.5 w-full mt-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div
            className="mt-6 pt-5 text-center space-y-2.5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <p className="text-sm text-text-secondary">
              Ainda não tem conta?{' '}
              <Link
                href="/registro"
                className="text-neon font-semibold hover:underline transition-all"
                style={{ textShadow: '0 0 8px rgba(57,255,20,0.4)' }}
              >
                Criar conta
              </Link>
            </p>
            <p className="text-xs" style={{ color: '#333' }}>
              Acesso: <span style={{ color: '#555' }}>vendas@anovasolucao.net</span>
            </p>
          </div>
        </div>

        {/* Bottom hint */}
        <p className="text-center text-xs mt-6" style={{ color: '#333' }}>
          Nova Solução Serviços de Tecnologia Ltda
        </p>
      </div>
    </div>
  )
}
