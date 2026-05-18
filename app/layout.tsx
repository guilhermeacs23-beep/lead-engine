import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lead Engine — CRM para Transportadoras',
  description: 'Plataforma de prospecção e CRM inteligente para transportadoras',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
