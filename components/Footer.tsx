'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-soft-greige py-16">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-14 mb-14">
          <div className="max-w-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-xl">magic_button</span>
              </div>
              <span className="text-2xl font-bold tracking-tight text-accent-brown">TokuSearch</span>
            </div>
            <p className="text-accent-brown/60 text-[15px] leading-relaxed">
              TokuSearchは、日々の暮らしにちょっとした「おトク」をプラスする検索サービスです。
              情報は自動収集・自動編集のため、詳細は公式情報をご確認ください。
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 sm:gap-16">
            <div>
              <h4 className="font-bold mb-5 text-sm tracking-widest text-accent-brown uppercase">サービス</h4>
              <ul className="space-y-4 text-sm text-accent-brown/60 font-medium">
                <li>
                  <Link className="hover:text-primary transition-colors" href="/shinchaku">
                    新着お得
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-primary transition-colors" href="/welkatsu">
                    ウエル活
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-primary transition-colors" href="/kotsukotsu">
                    コツコツポイ活
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-primary transition-colors" href="/poikatsu-search">
                    ポイント比較
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-5 text-sm tracking-widest text-accent-brown uppercase">マガジン</h4>
              <ul className="space-y-4 text-sm text-accent-brown/60 font-medium">
                <li>
                  <Link className="hover:text-primary transition-colors" href="/columns">
                    コラム
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-primary transition-colors" href="/columns?category=beginner">
                    ポイ活入門
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-5 text-sm tracking-widest text-accent-brown uppercase">サポート</h4>
              <ul className="space-y-4 text-sm text-accent-brown/60 font-medium">
                <li>
                  <Link className="hover:text-primary transition-colors" href="/policy">
                    利用規約
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-primary transition-colors" href="/policy">
                    プライバシーポリシー
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-soft-greige flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-accent-brown/40 font-bold tracking-widest uppercase">
          <p>© {new Date().getFullYear()} TokuSearch.</p>
          <div className="flex gap-8">
            <a
              className="hover:text-primary transition-colors"
              href="https://x.com/"
              target="_blank"
              rel="noreferrer"
            >
              X
            </a>
            <a
              className="hover:text-primary transition-colors"
              href="https://www.instagram.com/"
              target="_blank"
              rel="noreferrer"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

