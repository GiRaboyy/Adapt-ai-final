import './globals.css'
import type { Metadata } from 'next'
import { Inter, Manrope } from 'next/font/google'
import localFont from 'next/font/local'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-manrope',
  weight: ['600', '700', '800'],
  display: 'swap',
})

const ttGertika = localFont({
  src: [
    {
      path: './fonts/tt_gertika/TT_Gertika_Trial_Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/tt_gertika/TT_Gertika_Trial_Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: './fonts/tt_gertika/TT_Gertika_Trial_Black.ttf',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-tt-gertika',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ADAPT — обучение по базе знаний за минуты',
  description: 'Загрузите регламенты и документы — ADAPT автоматически создаст курсы и квизы для ваших сотрудников.',
  keywords: ['онбординг', 'обучение сотрудников', 'AI', 'корпоративное обучение', 'база знаний'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className={`${inter.variable} ${manrope.variable} ${ttGertika.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
