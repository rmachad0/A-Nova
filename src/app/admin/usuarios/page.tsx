'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { Loader2, Trash2, ShieldCheck, User, Users, Crown, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Usuario {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  _count: { calculos: number }
}

function iniciais(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'ADMIN') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold"
        style={{ background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.25)', color: '#39FF14' }}>
        <Crown className="w-3 h-3" /> Admin
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#888' }}>
      <User className="w-3 h-3" /> Comercial
    </span>
  )
}

function LinhaUsuario({
  u,
  sessionId,
  onRoleChange,
  onDelete,
}: {
  u: Usuario
  sessionId: string
  onRoleChange: (id: string, role: string) => void
  onDelete: (id: string) => void
}) {
  const [deleteState, setDeleteState] = useState<'idle' | 'confirm' | 'loading'>('idle')
  const [alterandoRole, setAlterandoRole] = useState(false)
  const ehVoce = u.id === sessionId

  async function alterarRole(novoRole: string) {
    if (novoRole === u.role || ehVoce) return
    setAlterandoRole(true)
    try {
      const res = await fetch(`/api/usuarios/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: novoRole }),
      })
      if (res.ok) onRoleChange(u.id, novoRole)
    } finally {
      setAlterandoRole(false)
    }
  }

  async function confirmarExclusao() {
    setDeleteState('loading')
    try {
      const res = await fetch(`/api/usuarios/${u.id}`, { method: 'DELETE' })
      if (res.ok) onDelete(u.id)
      else setDeleteState('idle')
    } catch {
      setDeleteState('idle')
    }
  }

  return (
    <tr className="table-row-hover group">
      {/* Avatar + nome */}
      <td className="table-cell">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={u.role === 'ADMIN'
              ? { background: 'linear-gradient(135deg, #39FF14, #2ACC0F)', color: '#000' }
              : { background: 'rgba(255,255,255,0.07)', color: '#888' }}
          >
            {iniciais(u.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {u.name}
              {ehVoce && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-neon">(você)</span>}
            </p>
            <p className="text-xs truncate" style={{ color: '#555' }}>{u.email}</p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="table-cell">
        {ehVoce ? (
          <RoleBadge role={u.role} />
        ) : (
          <div className="flex items-center gap-2">
            {alterandoRole
              ? <Loader2 className="w-4 h-4 animate-spin text-neon" />
              : <RoleBadge role={u.role} />
            }
            {!alterandoRole && (
              <select
                value={u.role}
                onChange={e => alterarRole(e.target.value)}
                className="text-xs rounded-lg px-2 py-1 transition-colors cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#666' }}
              >
                <option value="COMERCIAL">Comercial</option>
                <option value="ADMIN">Admin</option>
              </select>
            )}
          </div>
        )}
      </td>

      {/* Cotações */}
      <td className="table-cell text-center">
        <span className="text-sm font-semibold text-white">{u._count.calculos}</span>
      </td>

      {/* Desde */}
      <td className="table-cell text-sm" style={{ color: '#555' }}>
        {new Date(u.createdAt).toLocaleDateString('pt-BR')}
      </td>

      {/* Ações */}
      <td className="table-cell">
        {!ehVoce && (
          <>
            {deleteState === 'idle' && (
              <button
                onClick={() => setDeleteState('confirm')}
                className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:text-danger text-text-secondary"
                title="Excluir usuário"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            {deleteState === 'confirm' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={confirmarExclusao}
                  className="px-2 py-1 rounded text-xs font-semibold text-white transition-colors"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  Sim
                </button>
                <button
                  onClick={() => setDeleteState('idle')}
                  className="px-2 py-1 rounded text-xs text-text-secondary transition-colors hover:text-white"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  Não
                </button>
              </div>
            )}
            {deleteState === 'loading' && (
              <Loader2 className="w-3.5 h-3.5 text-danger animate-spin" />
            )}
          </>
        )}
      </td>
    </tr>
  )
}

export default function AdminUsuariosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'ADMIN') {
      router.replace('/dashboard')
      return
    }
    carregar()
  }, [session, status])

  async function carregar() {
    setLoading(true)
    try {
      const res = await fetch('/api/usuarios')
      if (res.ok) setUsuarios(await res.json())
    } finally {
      setLoading(false)
    }
  }

  function atualizarRole(id: string, role: string) {
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, role } : u))
  }

  function removerUsuario(id: string) {
    setUsuarios(prev => prev.filter(u => u.id !== id))
  }

  const totalAdmins = usuarios.filter(u => u.role === 'ADMIN').length
  const totalComercial = usuarios.filter(u => u.role === 'COMERCIAL').length

  if (status === 'loading' || loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 text-neon animate-spin" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-8 space-y-6 animate-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: '#444' }}>Administração</p>
            <h1 className="text-2xl font-bold text-white tracking-tight">Usuários do Sistema</h1>
            <p className="text-sm mt-1" style={{ color: '#555' }}>
              {usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''} · Somente <span className="text-neon">@anovasolucao.net</span>
            </p>
          </div>
          <button onClick={carregar} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total de usuários', valor: usuarios.length, icon: Users, color: 'rgba(57,255,20,0.1)', border: 'rgba(57,255,20,0.15)', textColor: '#39FF14' },
            { label: 'Administradores', valor: totalAdmins, icon: Crown, color: 'rgba(57,255,20,0.06)', border: 'rgba(57,255,20,0.1)', textColor: '#39FF14' },
            { label: 'Equipe comercial', valor: totalComercial, icon: ShieldCheck, color: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)', textColor: '#888' },
          ].map((s, i) => (
            <div key={i} className="rounded-xl p-4 flex items-center gap-4"
              style={{ background: s.color, border: `1px solid ${s.border}` }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: s.color, border: `1px solid ${s.border}` }}>
                <s.icon className="w-4 h-4" style={{ color: s.textColor }} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#444' }}>{s.label}</p>
                <p className="text-2xl font-bold" style={{ color: s.textColor }}>{s.valor}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabela */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                <tr>
                  <th className="table-header">Usuário</th>
                  <th className="table-header">Perfil</th>
                  <th className="table-header text-center">Cotações</th>
                  <th className="table-header">Membro desde</th>
                  <th className="table-header w-10"></th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <LinhaUsuario
                    key={u.id}
                    u={u}
                    sessionId={session!.user.id}
                    onRoleChange={atualizarRole}
                    onDelete={removerUsuario}
                  />
                ))}
              </tbody>
            </table>

            {usuarios.length === 0 && (
              <div className="text-center py-16 text-text-secondary">
                <p className="text-base font-medium text-white mb-1">Nenhum usuário encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Nota de domínio */}
        <div className="rounded-xl px-4 py-3 flex items-center gap-3 text-sm"
          style={{ background: 'rgba(57,255,20,0.04)', border: '1px solid rgba(57,255,20,0.08)' }}>
          <ShieldCheck className="w-4 h-4 text-neon flex-shrink-0" />
          <p style={{ color: '#555' }}>
            Novos cadastros são restritos ao domínio{' '}
            <span className="text-neon font-medium">@anovasolucao.net</span>.
            Para convidar um novo usuário, compartilhe o link{' '}
            <span className="text-white font-medium">/registro</span>.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
