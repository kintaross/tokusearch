import { MetadataRoute } from 'next';
import { fetchDealsForPublic } from '@/lib/deals-data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://tokusearch.vercel.app';
  
  // 静的ページ
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/ranking`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/magazine`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/favorites`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/kotsukotsu`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ];

  // お得情報の個別ページ
  try {
    const deals = await fetchDealsForPublic();
    const dealPages: MetadataRoute.Sitemap = deals.map((deal) => ({
      url: `${baseUrl}/deals/${deal.id}`,
      lastModified: deal.created_at ? new Date(deal.created_at) : new Date(deal.date),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    return [...staticPages, ...dealPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // エラーの場合は静的ページのみ返す
    return staticPages;
  }
}

