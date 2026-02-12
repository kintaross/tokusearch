import React from 'react';

export default function DesignPreviewPage() {
  return (
    <>
      <link href="https://fonts.googleapis.com" rel="preconnect"/>
      <link crossOrigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
      <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Noto+Sans+JP:wght@300;400;500;700&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      
      <div className="font-sans text-accent-brown bg-background-light min-h-screen">
        {/* Header */}
        <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-soft-greige">
          <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-2xl">magic_button</span>
              </div>
              <span className="text-2xl font-bold tracking-tight text-accent-brown">TokuSearch</span>
            </div>
            <nav className="hidden lg:flex items-center gap-10">
              <a className="text-[15px] font-medium hover:text-primary transition-colors" href="#">ホーム</a>
              <a className="text-[15px] font-medium hover:text-primary transition-colors" href="#">ショップ比較</a>
              <a className="text-[15px] font-medium hover:text-primary transition-colors" href="#">還元率ランキング</a>
              <a className="text-[15px] font-medium hover:text-primary transition-colors" href="#">特集コラム</a>
            </nav>
            <div className="flex items-center gap-5">
              <button className="p-2.5 hover:bg-soft-greige rounded-full transition-colors text-accent-brown">
                <span className="material-symbols-outlined">favorite</span>
              </button>
              <button className="px-6 py-2.5 bg-accent-brown text-white text-sm font-bold rounded-full hover:bg-accent-brown/90 transition-all">
                ログイン
              </button>
            </div>
          </div>
        </header>

        <main className="pt-20">
          <section className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-soft-greige via-background-light to-transparent">
            <div className="max-w-4xl w-full">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-soft-greige rounded-full mb-8 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="text-xs font-bold tracking-wider text-accent-brown/60 uppercase">Elegance & Economy</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 tracking-tight text-accent-brown leading-[1.3]">
                暮らしを彩る、<br className="md:hidden"/><span className="text-primary">賢い選択</span>を。
              </h1>
              <div className="relative max-w-3xl mx-auto group mb-16">
                <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-accent-brown/30 group-focus-within:text-primary transition-colors text-3xl">search</span>
                </div>
                <input 
                  className="w-full h-24 pl-20 pr-10 bg-white border-2 border-soft-greige rounded-[2.5rem] text-xl shadow-[0_20px_50px_-12px_rgba(92,82,72,0.08)] focus:ring-8 focus:ring-primary/5 focus:border-primary/20 transition-all placeholder:text-accent-brown/30" 
                  placeholder="今日の献立や買い物にお得なショップを探す" 
                  type="text"
                />
                <button className="absolute right-4 top-4 bottom-4 px-10 bg-primary text-white font-bold rounded-full hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95">
                  検索
                </button>
              </div>
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="h-px w-8 bg-soft-greige"></div>
                  <span className="text-sm font-bold text-accent-brown/40 tracking-widest uppercase">カテゴリーから探す</span>
                  <div className="h-px w-8 bg-soft-greige"></div>
                </div>
                <div className="flex flex-wrap justify-center gap-6 md:gap-10">
                  {/* Category Buttons */}
                  {[
                    { icon: 'local_mall', label: '日用品' },
                    { icon: 'restaurant_menu', label: '食品' },
                    { icon: 'medication', label: 'ドラッグストア' },
                    { icon: 'child_care', label: '子育て' }
                  ].map((cat, i) => (
                    <button key={i} className="flex flex-col items-center gap-4 group">
                      <div className="w-20 h-20 rounded-3xl bg-white border border-soft-greige flex items-center justify-center shadow-sm group-hover:border-primary/30 group-hover:bg-warm-cream transition-all duration-300">
                        <span className="material-symbols-outlined text-3xl text-primary">{cat.icon}</span>
                      </div>
                      <span className="text-sm font-bold text-accent-brown/70 group-hover:text-primary">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-8 py-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <h2 className="text-3xl font-bold text-accent-brown mb-2 tracking-tight">本日の高還元ショップ</h2>
                <p className="text-accent-brown/50">毎日更新。今日一番おトクな場所を見つけましょう。</p>
              </div>
              <div className="flex items-center gap-2 text-primary font-bold">
                <span className="text-xs tracking-widest uppercase">Live Updates</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Cards */}
              {[
                { icon: 'shopping_basket', tag: '家計の味方', sub: '総合モール', title: '大手総合ECモール', desc: '食料品から家電まで、すべて揃います', rate: '10.0' },
                { icon: 'health_and_beauty', tag: '節約お助け', sub: 'ドラッグストア', title: '人気ドラッグチェーン', desc: '日用品のまとめ買いに最適です', rate: '8.5' },
                { icon: 'kitchen', tag: '家計の味方', sub: '産直・食品', title: '全国こだわり産直便', desc: '新鮮な旬の食材をご自宅にお届け', rate: '12.0' },
                { icon: 'apparel', tag: '節約お助け', sub: 'ファッション', title: 'ライフスタイルウェア', desc: '家族みんなのデイリーウェアがお得', rate: '5.0' }
              ].map((item, i) => (
                <div key={i} className="bg-white border border-soft-greige transition-all duration-300 hover:shadow-xl hover:shadow-accent-brown/5 hover:-translate-y-1 rounded-3xl p-8 flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-8">
                    <div className="w-20 h-20 rounded-2xl bg-warm-cream flex items-center justify-center border border-soft-greige">
                      <span className="material-symbols-outlined text-4xl text-primary">{item.icon}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-tag-saving/10 text-tag-saving text-[10px] font-bold rounded-full tracking-wider uppercase">{item.tag}</span>
                        <span className="text-xs text-accent-brown/40 font-medium">{item.sub}</span>
                      </div>
                      <h3 className="font-bold text-2xl text-accent-brown group-hover:text-primary transition-colors">{item.title}</h3>
                      <p className="text-sm text-accent-brown/60 mt-1">{item.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-accent-brown/40 font-bold tracking-widest mb-1">MAX RETURN</div>
                    <div className="text-4xl font-bold text-primary">{item.rate}<span className="text-xl ml-1">%</span></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <button className="inline-flex items-center gap-2 text-accent-brown font-bold px-10 py-4 rounded-full border border-soft-greige hover:bg-white hover:shadow-lg transition-all">
                提携ショップをすべて見る <span className="material-symbols-outlined">arrow_right_alt</span>
              </button>
            </div>
          </section>

          <section className="bg-warm-cream py-24">
            <div className="max-w-7xl mx-auto px-8">
              <div className="flex items-end justify-between mb-16">
                <div>
                  <h2 className="text-3xl font-bold mb-3 text-accent-brown tracking-tight">注目のコラム</h2>
                  <p className="text-accent-brown/60 text-lg">ポイ活のプロが教える、丁寧な暮らしとおトク術</p>
                </div>
                <a className="text-primary font-bold flex items-center gap-2 hover:gap-3 transition-all pb-1 border-b-2 border-primary/20 hover:border-primary" href="#">
                  すべて見る <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {/* Column Cards */}
                 {[
                    { img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAbf1Nt8J2jfh6x5UacdHv2sAE3LsipFX7AvDLtKNCfoeAsBG7bOvOfo-Ar8qyXcyYmPL80y9g_T8am8ODmIo-P3sFxvdgqUNeLV8HDUI-zzNk5_wcVP6JHsozbkdEIxuF0xojU2OInLBN4zVk-18DCyEg7FgJENE4_P20QdTcPM1b48n_s3e4o3uOIidDeTiArIKHjbFgoVzW96KR9BgJXiD9lCSkaEITHtuf8AeGS6dX5SZ27C3iSy8MCT5JFMo3DEyZFjUMPbtQ", cat: "Lifestyle", date: "2024.05.20", title: "食卓を彩る「おトク」な旬の食材選びと、賢い保存術", desc: "毎日の献立を少し贅沢に、でも予算は守りたい。プロが教えるスーパーの回り方。" },
                    { img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBo6E8YBVCU0SxI3A_WFxnsnNTW1URIz4Mtb865LZnOuA3S7Q3sTEED7X3erzUwu7TxErk21gg7aM3jBwokmj6AknNtui8l8criRBxh9xfWDcgPwM8BpMAuF9a1eD5WUiwpmCFo4Vl5dzY6aAZxsnwkTVNzuNfAVOkagwdLCLGxpXwosOpz_XriizBao5w4Je-CUI1rlrxij9Dwbb9bFDUrFTy9vp9qQYF7OgJuT1rZwLu486KvUw-iDPnDs25-Z1N7FPTaCTrY7qA", cat: "Interior", date: "2024.05.18", title: "心地よい暮らしを作る。大型家具を買うならこのキャンペーン", desc: "住まいのアップデート。ポイント還元率が最大になる買い替え時期を徹底解説。" },
                    { img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB28jxO0zaOIHPbfWubzJEl2ShNTiUQMIL8Jwc5IL00Lwabzvg55lDC3tvTUpfAmotuUBpzRLtJfE4Vuuh7h4HBiZgT9J4gkWhbgS27FeaS9iOczNpSdc86yiBdGPzfCxeuoWOftJovTyV7tcCaJiYQyLdzXnqfqHkgMgWLYxp0NyKu1mLhWNueImiJ_hGLLUH2_2p3RpwD1gGKJU0TrbpoN_X1DydbYOiy_c7pzowb8w9a7X9nq2s5yNqrFh1Qt1yW-hy04Lmzs2g", cat: "Beauty", date: "2024.05.15", title: "自分へのご褒美も賢く。美容品をお得に揃える3つの習慣", desc: "日々頑張る自分へ。高還元なセレクトショップで見つける、最新コスメ特集。" }
                  ].map((item, i) => (
                    <div key={i} className="group cursor-pointer">
                      <div className="aspect-[4/3] rounded-[2rem] mb-6 overflow-hidden bg-white shadow-sm">
                        <img alt={item.cat} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" src={item.img}/>
                      </div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 bg-white text-accent-brown/60 text-[10px] font-bold rounded-full border border-soft-greige uppercase tracking-wider">{item.cat}</span>
                        <span className="text-xs text-accent-brown/40 font-medium">{item.date}</span>
                      </div>
                      <h3 className="text-xl font-bold group-hover:text-primary transition-colors leading-relaxed mb-3">
                        {item.title}
                      </h3>
                      <p className="text-sm text-accent-brown/60 line-clamp-2 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </section>

          <section className="bg-accent-brown text-white py-24 px-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center relative z-10">
              <div className="space-y-3">
                <div className="text-4xl lg:text-5xl font-bold tracking-tight">1,200<span className="text-primary">+</span></div>
                <div className="text-xs text-white/50 font-bold tracking-[0.2em] uppercase">Partner Shops</div>
              </div>
              <div className="space-y-3">
                <div className="text-4xl lg:text-5xl font-bold tracking-tight">50<span className="text-primary">万</span>+</div>
                <div className="text-xs text-white/50 font-bold tracking-[0.2em] uppercase">Active Users</div>
              </div>
              <div className="space-y-3">
                <div className="text-4xl lg:text-5xl font-bold tracking-tight">0<span className="text-primary">円</span></div>
                <div className="text-xs text-white/50 font-bold tracking-[0.2em] uppercase">Free to Use</div>
              </div>
              <div className="space-y-3">
                <div className="text-4xl lg:text-5xl font-bold tracking-tight">Real</div>
                <div className="text-xs text-white/50 font-bold tracking-[0.2em] uppercase">Time Updates</div>
              </div>
            </div>
          </section>
        </main>

        <footer className="bg-white border-t border-soft-greige py-20">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-16 mb-20">
              <div className="max-w-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-xl">magic_button</span>
                  </div>
                  <span className="text-2xl font-bold tracking-tight text-accent-brown">TokuSearch</span>
                </div>
                <p className="text-accent-brown/60 text-[15px] leading-relaxed">
                  TokuSearchは、日々の暮らしにちょっとした「おトク」と「ときめき」をプラスする、ライフスタイル検索サービスです。あなたの毎日を、もっと豊かに。
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
                <div>
                  <h4 className="font-bold mb-6 text-sm tracking-widest text-accent-brown uppercase">サービス</h4>
                  <ul className="space-y-4 text-sm text-accent-brown/60 font-medium">
                    <li><a className="hover:text-primary transition-colors" href="#">ショップ一覧</a></li>
                    <li><a className="hover:text-primary transition-colors" href="#">キャンペーン検索</a></li>
                    <li><a className="hover:text-primary transition-colors" href="#">ポイント比較</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold mb-6 text-sm tracking-widest text-accent-brown uppercase">マガジン</h4>
                  <ul className="space-y-4 text-sm text-accent-brown/60 font-medium">
                    <li><a className="hover:text-primary transition-colors" href="#">最新コラム</a></li>
                    <li><a className="hover:text-primary transition-colors" href="#">ポイ活入門</a></li>
                    <li><a className="hover:text-primary transition-colors" href="#">インタビュー</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold mb-6 text-sm tracking-widest text-accent-brown uppercase">サポート</h4>
                  <ul className="space-y-4 text-sm text-accent-brown/60 font-medium">
                    <li><a className="hover:text-primary transition-colors" href="#">お問い合わせ</a></li>
                    <li><a className="hover:text-primary transition-colors" href="#">利用規約</a></li>
                    <li><a className="hover:text-primary transition-colors" href="#">プライバシー</a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="pt-10 border-t border-soft-greige flex flex-col sm:flex-row justify-between items-center gap-6 text-[11px] text-accent-brown/40 font-bold tracking-widest uppercase">
              <p>© 2024 TokuSearch. Crafted for a Better Life.</p>
              <div className="flex gap-10">
                <a className="hover:text-primary transition-colors" href="#">Instagram</a>
                <a className="hover:text-primary transition-colors" href="#">Twitter</a>
                <a className="hover:text-primary transition-colors" href="#">Pinterest</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
