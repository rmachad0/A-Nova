'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'

export default function RegistroPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  const forcaSenha = () => {
    if (senha.length === 0) return null
    if (senha.length < 6) return { nivel: 1, label: 'Fraca', cor: 'bg-danger' }
    if (senha.length < 10 || !/[A-Z]/.test(senha) || !/[0-9]/.test(senha))
      return { nivel: 2, label: 'Média', cor: 'bg-warning' }
    return { nivel: 3, label: 'Forte', cor: 'bg-neon' }
  }
  const forca = forcaSenha()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (senha !== confirmar) { setErro('As senhas não coincidem.'); return }

    setLoading(true)
    const res = await fetch('/api/auth/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setErro(data.error); return }

    setSucesso(true)
    setTimeout(() => router.push('/login'), 2500)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#39FF14 1px, transparent 1px), linear-gradient(90deg, #39FF14 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="w-full max-w-md animate-in relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-2xl px-8 py-4 mb-5 shadow-[0_0_24px_rgba(57,255,20,0.2)]">
            <Image src="/logo.png" alt="A Nova" width={240} height={80} className="object-contain h-14 w-auto" priority />
          </div>
          <h1 className="text-xl font-bold text-white mb-1">Criar sua conta</h1>
          <p className="text-text-secondary text-xs">Acesse o sistema de cálculo comercial da A Nova</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-8">
          {sucesso ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-14 h-14 bg-neon/10 border border-neon/20 rounded-full flex items-center justify-center shadow-neon">
                <CheckCircle className="w-7 h-7 text-neon" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Conta criada com sucesso!</h2>
                <p className="text-text-secondary text-sm mt-1">Redirecionando para o login...</p>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white mb-6">Dados de acesso</h2>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="label">Nome completo</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    placeholder="Seu nome"
                    className="input-field"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="label">E-mail corporativo</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">Senha</label>
                  <div className="relative">
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={senha}
                      onChange={e => setSenha(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="input-field pr-10"
                      required
                      minLength={6}
                    />
                    <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors">
                      {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {forca && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3].map(n => (
                          <div key={n} className={`h-1 flex-1 rounded-full transition-all duration-300 ${n <= forca.nivel ? forca.cor : 'bg-surface-3'}`} />
                        ))}
                      </div>
                      <p className={`text-xs ${forca.nivel === 3 ? 'text-neon' : forca.nivel === 2 ? 'text-warning' : 'text-danger'}`}>
                        Senha {forca.label}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">Confirmar senha</label>
                  <input
                    type="password"
                    value={confirmar}
                    onChange={e => setConfirmar(e.target.value)}
                    placeholder="Repita a senha"
                    className={`input-field ${confirmar && confirmar !== senha ? 'border-danger/50' : ''}`}
                    required
                  />
                  {confirmar && confirmar !== senha && (
                    <p className="text-xs text-danger mt-1">As senhas não coincidem</p>
                  )}
                </div>

                {erro && (
                  <div className="bg-danger/10 border border-danger/20 rounded-md px-3 py-2 text-danger text-sm">
                    {erro}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2 mt-2">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Criando conta...' : 'Criar conta'}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-border text-center">
                <p className="text-sm text-text-secondary">
                  Já tem conta?{' '}
                  <Link href="/login" className="text-neon hover:text-neon-dim font-medium transition-colors">
                    Fazer login
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted mt-4">
          Ao se registrar, você terá acesso como <span className="text-text-secondary">Equipe Comercial</span>
        </p>
      </div>
    </div>
  )
}
