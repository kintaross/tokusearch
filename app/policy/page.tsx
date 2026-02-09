import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ポリシー | TokuSearch',
  description: 'TokuSearchの利用規約とポリシー。情報の正確性、ご利用にあたっての注意事項、広告・アフィリエイトについてなど。',
  openGraph: {
    title: 'ポリシー | TokuSearch',
    description: 'TokuSearchの利用規約とポリシー',
    url: 'https://tokusearch.vercel.app/policy',
  },
  alternates: {
    canonical: 'https://tokusearch.vercel.app/policy',
  },
};

export default function PolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">ポリシー</h1>
        <p className="text-lg text-gray-600">利用規約とポリシー</p>
      </div>
      
      <div className="space-y-8">
        <section className="bg-yellow-50 rounded-lg border-2 border-yellow-200 p-8">
          <h2 className="text-2xl font-bold text-yellow-900 mb-4">情報の正確性について</h2>
          <p className="text-yellow-800 leading-relaxed">
            本サイトに掲載されているお得情報の内容について、正確性を保証するものではありません。
            情報は自動収集・自動編集されたものであり、誤りや古い情報が含まれる可能性があります。
            実際にご利用になる際は、各サービス・店舗の公式サイトや最新情報をご確認ください。
          </p>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ご利用にあたって</h2>
          <p className="text-gray-700 leading-relaxed">
            本サイトの情報を利用して生じた損害やトラブルについて、当サイトは一切の責任を負いません。
            すべての情報は利用者自身の判断でご利用ください。
          </p>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">広告・アフィリエイトについて</h2>
          <p className="text-gray-700 leading-relaxed">
            現在、本サイトには広告やアフィリエイトリンクは掲載されていません。
            将来的に一定のPVや審査基準を満たしたタイミングで、広告・アフィリエイトの導入を検討する可能性があります。
            その際は、本ポリシーページに利用規約を追記いたします。
          </p>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">お問い合わせ</h2>
          <p className="text-gray-700 leading-relaxed">
            本サイトに関するお問い合わせは、現在受け付けておりません。
            ご不便をおかけして申し訳ございませんが、ご了承ください。
          </p>
        </section>
      </div>
    </div>
  );
}
