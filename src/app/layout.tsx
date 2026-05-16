import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/layout/Providers'

export const metadata: Metadata = {
  title: 'Planilha de Cálculo A Nova',
  description: 'Inteligência comercial aplicada aos seus cálculos',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-background text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
