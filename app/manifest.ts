import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Toku Search',
    short_name: 'TokuSearch',
    description: 'お得な商品が見つかる検索アプリ',
    start_url: '/',
    display: 'standalone',
    background_color: '#D48166',
    theme_color: '#D48166',
    icons: [
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
