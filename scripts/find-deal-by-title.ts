/**
 * タイトルで記事を検索するスクリプト
 * 使用方法: npx ts-node scripts/find-deal-by-title.ts "記事タイトル"
 */

import { fetchDealsForAdmin } from '../lib/deals-data';

const searchTitle = process.argv[2];

if (!searchTitle) {
  console.error('❌ エラー: 検索タイトルを指定してください');
  console.log('使用方法: npx ts-node scripts/find-deal-by-title.ts "記事タイトル"');
  process.exit(1);
}

async function findDealByTitle() {
  try {
    console.log(`🔍 検索中: "${searchTitle}"`);
    const deals = await fetchDealsForAdmin();
    
    // 部分一致で検索
    const matches = deals.filter(deal => 
      deal.title.includes(searchTitle) || 
      searchTitle.includes(deal.title)
    );
    
    if (matches.length === 0) {
      console.log('❌ 該当記事が見つかりませんでした');
      return;
    }
    
    console.log(`\n✅ ${matches.length}件の記事が見つかりました:\n`);
    
    matches.forEach((deal, index) => {
      console.log(`--- 記事 ${index + 1} ---`);
      console.log(`ID: ${deal.id}`);
      console.log(`タイトル: ${deal.title}`);
      console.log(`カテゴリ: ${deal.category_main}`);
      console.log(`公開状態: ${deal.is_public ? '公開' : '非公開'}`);
      console.log(`作成日: ${deal.created_at}`);
      console.log(`更新日: ${deal.updated_at}`);
      console.log(`URL: https://tokusearch.vercel.app/deals/${deal.id}`);
      console.log('');
    });
    
    if (matches.length === 1) {
      const deal = matches[0];
      console.log('📝 この記事を更新するには、管理画面の該当記事編集または API を使用してください。');
      console.log(`   記事ID: ${deal.id}`);
    }
    
  } catch (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }
}

findDealByTitle();



