import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'メンテナンス中 | TokuSearch',
  description: '現在メンテナンスを行っています。しばらくしてから再度お試しください。',
  robots: {
    index: false,
    follow: false,
  },
}

export default function MaintenanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100;300;400;500;700;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <div className="font-['Noto_Sans_JP']">{children}</div>
    </>
  )
}

