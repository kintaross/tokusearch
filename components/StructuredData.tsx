import { Deal } from '@/types/deal';
import { Column } from '@/types/column';

export function WebsiteStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TokuSearch',
    url: 'https://tokusearch.vercel.app',
    description: '今日のお得情報を効率的にチェック',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://tokusearch.vercel.app/?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function OrganizationStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TokuSearch',
    url: 'https://tokusearch.vercel.app',
    logo: 'https://tokusearch.vercel.app/favicon.svg',
    description: '今日のお得情報を効率的にチェック',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function DealStructuredData({ deal }: { deal: Deal }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: deal.title,
    description: deal.summary,
    datePublished: deal.created_at || deal.date,
    dateModified: deal.updated_at || deal.created_at || deal.date,
    author: {
      '@type': 'Organization',
      name: 'TokuSearch',
    },
    publisher: {
      '@type': 'Organization',
      name: 'TokuSearch',
      logo: {
        '@type': 'ImageObject',
        url: 'https://tokusearch.vercel.app/favicon.svg',
      },
    },
    articleSection: deal.category_main,
    keywords: [deal.category_main, deal.category_sub, deal.service].filter(Boolean).join(', '),
  };

  // 期限がある場合は、Offerタイプも追加
  const offerData = deal.expiration
    ? {
        '@context': 'https://schema.org',
        '@type': 'Offer',
        name: deal.title,
        description: deal.summary,
        category: deal.category_main,
        validFrom: deal.date,
        validThrough: deal.expiration,
        ...(deal.discount_amount && {
          priceSpecification: {
            '@type': 'PriceSpecification',
            price: deal.discount_amount,
            priceCurrency: 'JPY',
          },
        }),
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {offerData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(offerData) }}
        />
      )}
    </>
  );
}

export function BreadcrumbStructuredData({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function ColumnStructuredData({ column }: { column: Column }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: column.title,
    description: column.description,
    image: column.thumbnail_url ? [column.thumbnail_url] : [],
    datePublished: column.published_at || column.created_at,
    dateModified: column.updated_at || column.published_at || column.created_at,
    author: {
      '@type': 'Person',
      name: column.author || 'TokuSearch',
    },
    publisher: {
      '@type': 'Organization',
      name: 'TokuSearch',
      logo: {
        '@type': 'ImageObject',
        url: 'https://tokusearch.vercel.app/favicon.svg',
      },
    },
    articleSection: column.category,
    keywords: column.tags ? column.tags : undefined,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://tokusearch.vercel.app/columns/${column.slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

