'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string
  sub?: string
  trend?: number
  glowColor?: 'neon' | 'warning' | 'danger' | 'info'
  icon?: React.ReactNode
  href?: string
}

const colorMap = {
  neon: {
    value: '#39FF14',
    glow: 'rgba(57,255,20,0.12)',
    border: 'rgba(57,255,20,0.12)',
    iconBg: 'rgba(57,255,20,0.08)',
    iconColor: '#39FF14',
  },
  warning: {
    value: '#FFB800',
    glow: 'rgba(255,184,0,0.10)',
    border: 'rgba(255,184,0,0.12)',
    iconBg: 'rgba(255,184,0,0.08)',
    iconColor: '#FFB800',
  },
  danger: {
    value: '#FF3B3B',
    glow: 'rgba(255,59,59,0.10)',
    border: 'rgba(255,59,59,0.12)',
    iconBg: 'rgba(255,59,59,0.08)',
    iconColor: '#FF3B3B',
  },
  info: {
    value: '#00D4FF',
    glow: 'rgba(0,212,255,0.10)',
    border: 'rgba(0,212,255,0.12)',
    iconBg: 'rgba(0,212,255,0.08)',
    iconColor: '#00D4FF',
  },
}

export default function KpiCard({
  label, value, sub, trend, glowColor = 'neon', icon, href
}: KpiCardProps) {
  const c = colorMap[glowColor]

  const cardContent = (
    <div
      className={cn(
        'relative rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 overflow-hidden group',
        href && 'cursor-pointer'
      )}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
        border: `1px solid ${c.border}`,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.03) inset`,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.background =
          'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow =
          `0 8px 30px rgba(0,0,0,0.4), 0 0 0 1px ${c.border} inset`
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.background =
          'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 0 0 1px rgba(255,255,255,0.03) inset'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
      }}
    >
      {/* Ambient glow blob */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-40 pointer-events-none transition-opacity duration-300"
        style={{ background: `radial-gradient(circle, ${c.glow} 0%, transparent 70%)` }}
      />

      {/* Top row */}
      <div className="flex items-center justify-between relative">
        <span
          className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: '#444' }}
        >
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {icon && (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: c.iconBg, color: c.iconColor }}
            >
              <span className="[&_svg]:w-3.5 [&_svg]:h-3.5">{icon}</span>
            </div>
          )}
          {href && (
            <ArrowUpRight
              className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity"
              style={{ color: c.value }}
            />
          )}
        </div>
      </div>

      {/* Value */}
      <div className="relative">
        <div
          className="text-2xl font-bold tracking-tight leading-none"
          style={{ color: c.value, textShadow: `0 0 20px ${c.glow}` }}
        >
          {value}
        </div>
        {sub && (
          <div className="text-xs mt-1.5" style={{ color: '#444' }}>
            {sub}
          </div>
        )}
      </div>

      {/* Trend */}
      {trend !== undefined && (
        <div
          className="flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: trend >= 0 ? '#39FF14' : '#FF3B3B' }}
        >
          {trend >= 0
            ? <TrendingUp className="w-3 h-3" />
            : <TrendingDown className="w-3 h-3" />}
          {trend >= 0 ? '+' : ''}{trend.toFixed(1)}% vs mês anterior
        </div>
      )}
    </div>
  )

  if (href) {
    return <Link href={href}>{cardContent}</Link>
  }

  return cardContent
}
