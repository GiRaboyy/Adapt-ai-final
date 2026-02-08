import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'

const inter = Inter({ 
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

const ttGertika = localFont({
  src: [
    {
      path: '../public/fonts/tt_gertika/TT_Gertika_Trial_Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/tt_gertika/TT_Gertika_Trial_Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/tt_gertika/TT_Gertika_Trial_Black.ttf',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-display',
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
    <html lang="ru" className={`${inter.variable} ${ttGertika.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
