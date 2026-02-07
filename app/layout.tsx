import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'

const inter = Inter({ 
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

const renco = localFont({
  src: '../public/fonts/renco/Renco-Black.ttf',
  variable: '--font-display',
  display: 'swap',
  weight: '900',
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
    <html lang="ru" className={`${inter.variable} ${renco.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
