// ポイ活サイトのアフィリエイトリンク置き換えロジック

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// 主要ポイ活サイトの紹介ID設定
// 環境変数から取得、未設定の場合は空文字（置き換えなし）
const AFFILIATE_IDS: Record<string, string> = {
  'モッピー': process.env.POIKATSU_MOPPY_ID || '',
  'ポイントインカム': process.env.POIKATSU_POINTINCOME_ID || '',
  'ハピタス': process.env.POIKATSU_HAPITAS_ID || '',
  'ECナビ': process.env.POIKATSU_ECNAVI_ID || '',
  'ちょびリッチ': process.env.POIKATSU_CHOBIRICH_ID || '',
  'げん玉': process.env.POIKATSU_GENDAMA_ID || '',
  'ワラウ': process.env.POIKATSU_WARAU_ID || '',
  'フルーツメール': process.env.POIKATSU_FRUITMAIL_ID || '',
};

// サイト名の正規化（表記ゆれに対応）
function normalizeSiteName(siteName: string): string {
  const normalized = siteName.trim();
  
  // 表記ゆれのマッピング
  const mappings: Record<string, string> = {
    'moppy': 'モッピー',
    'ポイントインカム': 'ポイントインカム',
    'hapitas': 'ハピタス',
    'ecnavi': 'ECナビ',
    'chobirich': 'ちょびリッチ',
    'gendama': 'げん玉',
    'warau': 'ワラウ',
    'fruitmail': 'フルーツメール',
  };
  
  // 小文字に変換してマッピングを確認
  const lower = normalized.toLowerCase();
  for (const [key, value] of Object.entries(mappings)) {
    if (lower.includes(key) || normalized.includes(value)) {
      return value;
    }
  }
  
  return normalized;
}

// リダイレクト先URLを取得
async function getRedirectUrl(originalUrl: string): Promise<string | null> {
  let browser;
  
  try {
    // Vercel環境でのPuppeteer設定
    // Vercel環境の判定: VERCEL環境変数が存在するか、VERCEL_ENVが設定されているか
    const isVercel = !!process.env.VERCEL || !!process.env.VERCEL_ENV;
    
    let launchOptions: any = {
      headless: true,
    };
    
    if (isVercel) {
      // Vercel環境用の設定
      let executablePath: string | undefined;
      
      try {
        // @sparticuz/chromiumはバイナリが含まれているため、引数なしで呼び出す
        executablePath = await chromium.executablePath();
      } catch (error) {
        console.error('❌ Failed to get Chromium executable path:', error);
        throw new Error('Failed to initialize Chromium for Vercel environment');
      }
      
      if (!executablePath) {
        throw new Error('Chromium executable path is not available');
      }
      
      launchOptions = {
        args: chromium.args,
        defaultViewport: { width: 1920, height: 1080 },
        executablePath: executablePath,
        headless: true,
      };
    } else {
      // ローカル環境用の設定
      launchOptions = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ]
      };
    }
    
    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();
    
    // リダイレクトを追跡
    let finalUrl = originalUrl;
    
    page.on('response', (response) => {
      const url = response.url();
      // リダイレクト先のURLを記録
      if (url !== originalUrl && !url.includes('dokotoku.jp')) {
        finalUrl = url;
      }
    });
    
    await page.goto(originalUrl, {
      waitUntil: 'networkidle2',
      timeout: 8000
    });
    
    // 最終的なURLを取得
    finalUrl = page.url();
    
    // 「どこ得？」のURLでない場合のみ返す
    if (!finalUrl.includes('dokotoku.jp')) {
      return finalUrl;
    }
    
    return null;
  } catch (error) {
    console.error(`リダイレクト先取得エラー (${originalUrl}):`, error);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// URLから紹介IDを置き換える
function replaceAffiliateId(url: string, siteName: string, affiliateId: string): string {
  if (!affiliateId || !url) {
    return url;
  }
  
  const normalizedSite = normalizeSiteName(siteName);
  
  try {
    const urlObj = new URL(url);
    
    // サイトごとの置き換えルール
    switch (normalizedSite) {
      case 'モッピー':
        // モッピー: パラメータ名はaf
        urlObj.searchParams.set('af', affiliateId);
        return urlObj.toString();
        
      case 'ポイントインカム':
        // ポイントインカム: パラメータ名はr
        urlObj.searchParams.set('r', affiliateId);
        return urlObj.toString();
        
      case 'ハピタス':
        // ハピタス: afパラメータ + route=pcTextの扱い
        // affiliateIdに"&route=pcText"が含まれている場合は分割して処理
        if (affiliateId.includes('&route=')) {
          const [id, routeParam] = affiliateId.split('&route=');
          urlObj.searchParams.set('af', id);
          urlObj.searchParams.set('route', routeParam);
        } else {
          urlObj.searchParams.set('af', affiliateId);
        }
        return urlObj.toString();
        
      case 'ECナビ':
        // ECナビ: パラメータ名は未確認（次フェーズ対応）
        // 暫定的にafパラメータを使用
        urlObj.searchParams.set('af', affiliateId);
        return urlObj.toString();
        
      case 'ちょびリッチ':
        // ちょびリッチ: パラメータ名は未確認（次フェーズ対応）
        // 暫定的にafパラメータを使用
        urlObj.searchParams.set('af', affiliateId);
        return urlObj.toString();
        
      case 'げん玉':
        // げん玉: パラメータ名は未確認（次フェーズ対応）
        // 暫定的にafパラメータを使用
        urlObj.searchParams.set('af', affiliateId);
        return urlObj.toString();
        
      case 'ワラウ':
        // ワラウの場合
        urlObj.searchParams.set('af', affiliateId);
        return urlObj.toString();
        
      case 'フルーツメール':
        // フルーツメールの場合
        urlObj.searchParams.set('af', affiliateId);
        return urlObj.toString();
        
      default:
        // デフォルト: afパラメータを追加
        urlObj.searchParams.set('af', affiliateId);
        return urlObj.toString();
    }
  } catch (error) {
    console.error(`URL置き換えエラー (${url}):`, error);
    return url;
  }
}

// アフィリエイトリンクを置き換える（メイン関数）
export async function replaceAffiliateLink(
  originalUrl: string,
  siteName: string
): Promise<string | null> {
  // 紹介IDが設定されていない場合は元のURLを返す
  const normalizedSite = normalizeSiteName(siteName);
  const affiliateId = AFFILIATE_IDS[normalizedSite];
  
  if (!affiliateId) {
    console.log(`⚠️ ${normalizedSite}の紹介IDが設定されていません`);
    return null;
  }
  
  // 「どこ得？」のリンクの場合、リダイレクト先を取得
  if (originalUrl.includes('dokotoku.jp/link/')) {
    const redirectUrl = await getRedirectUrl(originalUrl);
    if (!redirectUrl) {
      console.log(`⚠️ リダイレクト先が取得できませんでした: ${originalUrl}`);
      return null;
    }
    
    // リダイレクト先のURLに紹介IDを置き換え
    return replaceAffiliateId(redirectUrl, siteName, affiliateId);
  }
  
  // 既にリダイレクト先のURLの場合、直接置き換え
  return replaceAffiliateId(originalUrl, siteName, affiliateId);
}

// バッチ処理: 複数のリンクを一度に置き換え
export async function replaceAffiliateLinksBatch(
  results: Array<{ site: string; originalUrl: string }>
): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>();
  
  // 並列処理（最大10件ずつに増加、待機時間を短縮）
  const batchSize = 10;
  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize);
    
    const promises = batch.map(async (result) => {
      const affiliateUrl = await replaceAffiliateLink(result.originalUrl, result.site);
      if (affiliateUrl) {
        urlMap.set(result.originalUrl, affiliateUrl);
      }
    });
    
    await Promise.all(promises);
    
    // バッチ間で少し待機（サーバー負荷を考慮、500msに短縮）
    if (i + batchSize < results.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return urlMap;
}

