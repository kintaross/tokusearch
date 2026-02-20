import type { ReactNode } from 'react'
import type { Viewport } from 'next'
import { Quicksand, Noto_Sans_JP } from 'next/font/google'
import { ViewModeProvider } from '@/contexts/ViewModeContext'
import Providers from '@/components/Providers'
import SiteChrome from '@/components/SiteChrome'
import { WebsiteStructuredData, OrganizationStructuredData } from '@/components/StructuredData'
import { metadata } from './metadata'
import './globals.css'

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-quicksand',
})

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
})

export { metadata }

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#D48166',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="ja" className={`${quicksand.variable} ${notoSansJP.variable}`}>
      <head>
        <link href="https://fonts.googleapis.com" rel="dns-prefetch"/>
        <link href="https://fonts.gstatic.com" rel="dns-prefetch"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
        <WebsiteStructuredData />
        <OrganizationStructuredData />
      </head>
      <body className="antialiased font-sans text-accent-brown bg-background-light">
        <Providers>
        <ViewModeProvider>
          <SiteChrome>{children}</SiteChrome>
        </ViewModeProvider>
        </Providers>
      </body>
    </html>
  )
}
