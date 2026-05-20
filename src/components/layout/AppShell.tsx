'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import { Menu, Zap } from 'lucide-react'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':       'Dashboard',
  '/financeiro':      'Financeiro',
  '/simulador':       'Simulador',
  '/historico':       'Histórico',
  '/relatorios':      'Relatórios',
  '/admin/usuarios':  'Usuários',
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-neon/20" />
          <div
            className="absolute inset-0 w-10 h-10 rounded-full border-2 border-transparent border-t-neon"
            style={{ animation: 'spin 0.8s linear infinite' }}
          />
        </div>
        <p className="text-xs font-medium tracking-widest uppercase" style={{ color: '#444' }}>
          Carregando
        </p>
      </div>
    </div>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const pageTitle = Object.entries(PAGE_TITLES).find(([key]) =>
    pathname.startsWith(key)
  )?.[1] ?? ''

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login')
  }, [status, router])

  if (status === 'loading' || status === 'unauthenticated') {
    return <LoadingScreen />
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-auto min-w-0">

        {/* ── Mobile top bar ─────────────────────────── */}
        <header
          className="lg:hidden flex items-center gap-3 px-4 py-3 sticky top-0 z-30"
          style={{
            background: 'rgba(8,8,8,0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#555' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = '#fff'
              ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = '#555'
              ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            }}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-neon" />
            <span className="text-white font-semibold text-sm">
              {pageTitle || 'AnovaNet'}
            </span>
          </div>
        </header>

        {/* ── Main content ───────────────────────────── */}
        <main className="flex-1">
          {children}
        </main>

        {/* ── Footer ─────────────────────────────────── */}
        <footer
          className="px-8 py-4 text-center"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          <p className="text-xs" style={{ color: '#2a2a2a' }}>
            Este é um software criado por{' '}
            <span style={{ color: '#3a3a3a' }}>Nova Solução Serviços de Tecnologia Ltda</span>
          </p>
        </footer>
      </div>
    </div>
  )
}
