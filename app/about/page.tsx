import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'アバウト | TokuSearch',
  description: 'TokuSearchは、Xを徘徊しなくても、その日のお得情報を効率的に確認できる「閲覧専用」の一般公開サイトです。フリーワード検索・カテゴリ検索で、自分に関係する案件だけを素早く探すことができます。',
  openGraph: {
    title: 'アバウト | TokuSearch',
    description: 'TokuSearchについて - お得情報を効率的に確認できる閲覧専用サイト',
    url: 'https://tokusearch.vercel.app/about',
  },
  alternates: {
    canonical: 'https://tokusearch.vercel.app/about',
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">アバウト</h1>
        <p className="text-lg text-gray-600">TokuSearchについて</p>
      </div>
      
      <div className="space-y-8">
        <section className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">サイトの目的</h2>
          <p className="text-gray-700 leading-relaxed">
            Xを徘徊しなくても、その日のお得情報を効率的に確認できる「閲覧専用」の一般公開サイトです。
            フリーワード検索・カテゴリ検索で、自分に関係する案件だけを素早く探すことができます。
          </p>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">情報源について</h2>
          <p className="text-gray-700 leading-relaxed">
            本サイトに掲載されているお得情報は、個人が収集・編集したものです。
            情報の収集・整形・分類は自動化されたシステム（n8n + LLM）を使用して実施していますが、
            最終的な情報の正確性や最新性については保証できません。
          </p>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ご利用について</h2>
          <p className="text-gray-700 leading-relaxed">
            本サイトは閲覧専用のサービスです。ユーザー登録やログイン機能はありません。
            お気に入り機能はローカルストレージを使用して実装されており、ブラウザに保存されます。
          </p>
        </section>
      </div>
    </div>
  );
}
