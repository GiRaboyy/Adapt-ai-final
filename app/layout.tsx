import './globals.css'
import type { Metadata } from 'next'
import { Inter, Manrope } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

const manrope = Manrope({ 
  subsets: ['latin', 'cyrillic'],
  variable: '--font-manrope',
  weight: ['500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Adapt — ИИ-платформа обучения',
  description: 'Автоматическая генерация курсов на основе вашей базы знаний',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className={`${inter.variable} ${manrope.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
