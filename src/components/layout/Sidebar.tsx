'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Calculator,
  History,
  LogOut,
  BarChart3,
  FileText,
  X,
  ChevronRight,
  Zap,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard, description: 'Visão geral',       adminOnly: false },
  { href: '/financeiro', label: 'Financeiro',   icon: BarChart3,       description: 'Análise financeira', adminOnly: false },
  { href: '/simulador',  label: 'Simulador',    icon: Calculator,      description: 'Calcular cotações',  adminOnly: false },
  { href: '/historico',  label: 'Histórico',    icon: History,         description: 'Cotações salvas',    adminOnly: false },
  { href: '/relatorios', label: 'Relatórios',   icon: FileText,        description: 'Exportar PDF',       adminOnly: false },
  { href: '/admin/usuarios', label: 'Usuários', icon: Users,           description: 'Gerenciar usuários', adminOnly: true  },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export default function Sidebar({ open = true, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const initials = (session?.user?.name ?? 'U')
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'w-64 min-h-screen flex flex-col',
          'fixed top-0 left-0 h-full z-50 transition-transform duration-300',
          'lg:static lg:translate-x-0 lg:z-auto lg:transition-none',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{
          background: 'linear-gradient(180deg, #0a0a0a 0%, #080808 100%)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* ── Logo ───────────────────────────────────── */}
        <div
          className="px-5 py-5 flex items-start justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex-1">
            <div
              className="bg-white rounded-xl px-4 py-2.5 flex items-center justify-center mb-3"
              style={{ boxShadow: '0 0 20px rgba(57,255,20,0.12), 0 4px 12px rgba(0,0,0,0.4)' }}
            >
              <Image
                src="/logo.png"
                alt="A Nova Soluções Tecnológicas"
                width={180}
                height={60}
                className="object-contain h-10 w-auto"
                priority
              />
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Zap className="w-3 h-3 text-neon opacity-70" />
              <p className="text-[10px] font-medium text-center leading-tight" style={{ color: '#444' }}>
                Inteligência comercial
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden ml-2 mt-0.5 p-1.5 rounded-lg transition-colors flex-shrink-0"
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
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Navigation ─────────────────────────────── */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] px-3 pb-3" style={{ color: '#333' }}>
            Menu
          </p>
          {navItems.filter(item => !item.adminOnly || session?.user?.role === 'ADMIN').map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  active
                    ? 'text-neon'
                    : 'hover:text-white'
                )}
                style={active ? {
                  background: 'rgba(57,255,20,0.07)',
                  border: '1px solid rgba(57,255,20,0.14)',
                  textShadow: '0 0 8px rgba(57,255,20,0.4)',
                } : {
                  color: '#555',
                  border: '1px solid transparent',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.03)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                  }
                }}
              >
                <Icon className={cn('w-4 h-4 flex-shrink-0 transition-colors', active ? 'text-neon' : 'text-text-tertiary group-hover:text-white')} />
                <span className="flex-1">{label}</span>
                {active && (
                  <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* ── User section ───────────────────────────── */}
        <div
          className="p-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          {/* User info */}
          <div
            className="flex items-center gap-3 p-3 rounded-xl mb-1"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #39FF14, #2ACC0F)' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-white truncate">{session?.user?.name}</p>
                {session?.user?.role === 'ADMIN' && (
                  <span className="text-[9px] font-bold px-1 py-0.5 rounded flex-shrink-0"
                    style={{ background: 'rgba(57,255,20,0.15)', color: '#39FF14', border: '1px solid rgba(57,255,20,0.2)' }}>
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-[10px] truncate" style={{ color: '#444' }}>{session?.user?.email}</p>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group"
            style={{ color: '#444' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = '#FF3B3B'
              ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,59,59,0.06)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = '#444'
              ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            }}
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>
    </>
  )
}
