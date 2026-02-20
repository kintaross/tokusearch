import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import * as cheerio from 'cheerio';
import { PoikatsuSearchResponse, PoikatsuSearchResult } from '@/types/poikatsu';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Vercel Pro/Enterprise用（デフォルトは10秒）

async function searchDokotoku(keyword: string): Promise<PoikatsuSearchResponse> {
  let browser;
  
  try {
    // Vercel環境でのPuppeteer設定
    // Vercel環境の判定: VERCEL環境変数が存在するか、VERCEL_ENVが設定されているか
    const isVercel = !!process.env.VERCEL || !!process.env.VERCEL_ENV;
    const debug = process.env.DEBUG_POIKATSU === '1';
    
    if (debug) {
      console.log('🔧 Environment check:', {
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV,
        isVercel: isVercel,
      });
    }
    
    let launchOptions: any = {
      headless: true,
    };
    
    if (isVercel) {
      // Vercel環境用の設定
      if (debug) console.log('🔧 Initializing Chromium for Vercel environment...');
      
      let executablePath: string | undefined;
      
      try {
        // @sparticuz/chromiumはバイナリが含まれているため、引数なしで呼び出す
        if (debug) console.log('🔧 Calling chromium.executablePath()...');
        executablePath = await chromium.executablePath();
        if (debug) {
          console.log('🔧 chromium.executablePath() returned:', {
            type: typeof executablePath,
            isString: typeof executablePath === 'string',
            length: typeof executablePath === 'string' ? executablePath.length : 'N/A',
          });
        }
        
        if (!executablePath) {
          console.error('❌ chromium.executablePath() returned undefined or null');
          throw new Error('chromium.executablePath() returned undefined or null');
        }
        
        if (typeof executablePath !== 'string') {
          console.error('❌ chromium.executablePath() returned non-string value:', typeof executablePath);
          throw new Error(`chromium.executablePath() returned non-string value: ${typeof executablePath}`);
        }
        
        if (executablePath.trim() === '') {
          console.error('❌ Chromium executable path is empty string');
          throw new Error('Chromium executable path is empty string');
        }
        
        if (debug) console.log('✅ Chromium executable path obtained successfully, length:', executablePath.length);
      } catch (error) {
        console.error('❌ Failed to get Chromium executable path:', error);
        console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
        console.error('❌ Error stack:', error instanceof Error ? error.stack : 'N/A');
        throw new Error(`Failed to initialize Chromium for Vercel environment: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      // executablePathが確実に設定されていることを確認
      if (!executablePath) {
        throw new Error('executablePath is required for puppeteer-core in Vercel environment');
      }
      
      launchOptions = {
        args: chromium.args,
        defaultViewport: { width: 1920, height: 1080 },
        executablePath: executablePath, // 確実に文字列が設定されている
        headless: true,
      };
      
      if (debug) console.log('✅ Launch options configured for Vercel');
    } else {
      // ローカル環境用の設定（検証環境で動作していた設定）
      // ローカル環境でもpuppeteer-coreを使用している場合、executablePathが必要
      // 通常のpuppeteerを使用する場合は不要だが、puppeteer-coreの場合は必須
      if (debug) console.log('🔧 Using local environment configuration');
      
      // ローカル環境では通常のPuppeteerのパスを使用
      // 環境変数PUPPETEER_EXECUTABLE_PATHが設定されている場合はそれを使用
      const localExecutablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      
      if (localExecutablePath) {
        launchOptions = {
          headless: true,
          executablePath: localExecutablePath,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        };
      } else {
        // ローカル環境でexecutablePathが設定されていない場合
        // 通常のpuppeteerを使用するか、エラーを投げる
        throw new Error('PUPPETEER_EXECUTABLE_PATH environment variable is required for local development with puppeteer-core');
      }
    }
    
    // executablePathが確実に設定されていることを最終確認
    if (!launchOptions.executablePath) {
      throw new Error('executablePath must be specified for puppeteer-core');
    }
    
    if (debug) {
      console.log('🚀 Launching browser with options:', JSON.stringify({
        ...launchOptions,
        executablePath: launchOptions.executablePath ? String(launchOptions.executablePath).substring(0, 20) + '...' : 'NOT SET'
      }, null, 2));
    }
    
    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();
    
    // User-Agentを設定してボット検出を回避
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    // 検索URL（実際のURL構造を確認）
    // 「どこ得？」の検索URL: https://dokotoku.jp/?q=キーワード
    const searchUrl = `https://dokotoku.jp/?q=${encodeURIComponent(keyword)}`;
    
    if (debug) {
      console.log(`🔍 Searching dokotoku.jp for: ${keyword}`);
      console.log(`📍 URL: ${searchUrl}`);
    }
    
    await page.goto(searchUrl, { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    
    // ページタイトルを確認（デバッグ用）
    const pageTitle = await page.title();
    if (debug) console.log(`📄 ページタイトル: ${pageTitle}`);
    
    // 検索結果が表示されるまで待機
    await new Promise((r) => setTimeout(r, 2500));
    
    // 検索結果テーブルが表示されているか確認
    const tableExists = await page.$('table').then(el => el !== null).catch(() => false);
    if (!tableExists) {
      if (debug) console.log('⚠️ テーブルが見つかりません。検索フォームで検索を実行します...');
      
      // 検索フォームに入力して検索
      const searchInput = await page.$('input[name="q"], input.keyword');
      if (searchInput) {
        await searchInput.click({ clickCount: 3 }); // 既存のテキストを選択
        await searchInput.type(keyword);
        await new Promise((r) => setTimeout(r, 500));
        
        // 検索ボタンをクリック
        const searchButton = await page.$('input[type="submit"], input.submit');
        if (searchButton) {
          await searchButton.click();
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
          await new Promise((r) => setTimeout(r, 2500));
        }
      }
    }
    
    // HTMLを取得
    const html = await page.content();
    const $ = cheerio.load(html);
    
    // デバッグ用（本番では抑制）
    if (debug && !isVercel) {
      try {
        const fs = require('fs');
        const path = require('path');
        const debugDir = path.join(process.cwd(), 'debug');
        if (!fs.existsSync(debugDir)) {
          fs.mkdirSync(debugDir, { recursive: true });
        }
        const debugFile = path.join(debugDir, `dokotoku-${Date.now()}.html`);
        fs.writeFileSync(debugFile, html, 'utf-8');
        console.log(`💾 HTMLを保存しました: ${debugFile}`);
      } catch (e) {
        console.log('⚠️ HTML保存に失敗:', e);
      }

      console.log('🔍 ページ構造の詳細分析:');
      console.log(`  - テーブル数: ${$('table').length}`);
      console.log(`  - tr数: ${$('tr').length}`);
      console.log(`  - td数: ${$('td').length}`);
      console.log(`  - リンク数: ${$('a').length}`);

      $('table').each((tableIndex, table) => {
        if (tableIndex === 0) {
          console.log(`\n📊 最初のテーブルの構造:`);
          $(table).find('tr').slice(0, 5).each((rowIndex, row) => {
            const cells = $(row).find('td, th').map((_, cell) => {
              const text = $(cell).text().trim();
              const html = $(cell).html()?.substring(0, 100) || '';
              return { text, html };
            }).get();
            console.log(`  行${rowIndex + 1}: ${cells.length}列`);
            cells.forEach((cell, i) => {
              console.log(`    列${i + 1}: "${cell.text.substring(0, 50)}"`);
            });
          });
        }
      });
    }
    
    const results: PoikatsuSearchResult[] = [];
    
    // テーブル形式の検索結果をパース
    // 「どこ得？」の実際の構造:
    // <tr>
    //   <td class="cashback">還元率(%) または 還元額(円)</td>
    //   <td class="site-name"><a>サイト名</a></td>
    //   <td class="device">デバイス情報（空の場合もある）</td>
    //   <td class="article"><a href="アフィリエイトリンク">案件詳細</a></td>
    // </tr>
    
    $('table tbody tr, table tr').each((rowIndex, row) => {
      const $row = $(row);
      
      // クラス名でセルを取得
      const $cashbackCell = $row.find('td.cashback');
      const $siteNameCell = $row.find('td.site-name');
      const $articleCell = $row.find('td.article');
      
      // 必要なセルがすべて存在する場合のみ処理
      if ($cashbackCell.length === 0 || $siteNameCell.length === 0 || $articleCell.length === 0) {
        return;
      }
      
      // 還元情報を取得
      const cashbackText = $cashbackCell.text().trim();
      let rewardAmount: number | undefined;
      let rewardRate: number | undefined;
      let reward = '';
      
      // 還元率（%形式）をチェック
      const rateMatch = cashbackText.match(/(\d+(?:\.\d+)?)\s*%/);
      if (rateMatch) {
        rewardRate = parseFloat(rateMatch[1]);
        reward = `${rewardRate}%`;
      } else {
        // 還元額（円形式）をチェック
        const amountMatch = cashbackText.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*円/);
        if (amountMatch) {
          rewardAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
          reward = `${rewardAmount.toLocaleString()}円`;
        } else {
          // 数値のみの場合（円が省略されている可能性）
          const numMatch = cashbackText.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/);
          if (numMatch) {
            const num = parseFloat(numMatch[1].replace(/,/g, ''));
            // 1000以上の場合は円、それ以下は%と判断
            if (num >= 100) {
              rewardAmount = num;
              reward = `${rewardAmount.toLocaleString()}円`;
            } else {
              rewardRate = num;
              reward = `${rewardRate}%`;
            }
          }
        }
      }
      
      // サイト名を取得
      const site = $siteNameCell.find('a').first().text().trim() || $siteNameCell.text().trim();
      
      // 案件詳細とリンクを取得
      const $articleLink = $articleCell.find('a').first();
      if ($articleLink.length > 0) {
        const title = $articleLink.text().trim();
        let href = $articleLink.attr('href') || '';
        
        // 相対URLの場合は絶対URLに変換
        if (href && !href.startsWith('http')) {
          href = href.startsWith('/') ? `https://dokotoku.jp${href}` : `https://dokotoku.jp/${href}`;
        }
        
        // タイトルとURLがあれば結果に追加
        if (title && href && title.length > 3) {
          results.push({
            site: site || '不明',
            title,
            reward: reward || '',
            rewardRate,
            rewardAmount,
            originalUrl: href,
          });
        }
      }
    });
    
    if (debug) console.log(`\n✅ ${results.length}件の検索結果を取得しました`);
    
    // テーブル形式で見つからない場合、別の構造を試す
    if (results.length === 0) {
      if (debug) console.log('⚠️ テーブル形式で結果が見つかりません。別の構造を試します...');
      
      // リスト形式やdiv形式を試す
      $('li, div[class*="item"], div[class*="result"], [class*="card"]').each((i, elem) => {
        const $elem = $(elem);
        
        // タイトルを取得
        const title = $elem.find('a, .title, h2, h3, h4, [class*="title"]').first().text().trim() ||
                      $elem.find('a').first().text().trim() ||
                      '';
        
        // URLを取得
        const $link = $elem.find('a').first();
        const href = $link.attr('href') || '';
        const originalUrl = href.startsWith('http') ? href : `https://dokotoku.jp${href}`;
        
        // 還元情報を取得
        const reward = $elem.find('[class*="reward"], [class*="point"], [class*="amount"]').text().trim() ||
                       $elem.text().match(/(\d{1,3}(?:,\d{3})*)\s*円/)?.[0] ||
                       '';
        
        // サイト名を取得
        const site = $elem.find('[class*="site"], img[alt]').first().attr('alt')?.trim() ||
                     $elem.find('[class*="site"]').text().trim() ||
                     '';
        
        if (title && originalUrl) {
          const rewardAmountMatch = reward.match(/(\d{1,3}(?:,\d{3})*)/);
          const rewardAmount = rewardAmountMatch ? parseInt(rewardAmountMatch[1].replace(/,/g, '')) : undefined;
          
          results.push({
            site: site || '不明',
            title,
            reward,
            rewardAmount,
            originalUrl,
          });
        }
      });
    }
    
    // デバッグ用: HTMLの一部をログ出力
    if (results.length === 0) {
      if (debug) console.log('⚠️ 検索結果が見つかりませんでした。');
      
      // テーブル要素の存在確認
      const tableCount = $('table').length;
      const trCount = $('tr').length;
      const tdCount = $('td').length;
      const linkCount = $('a').length;
      const divCount = $('div').length;
      if (debug) console.log(`📊 HTML構造: table=${tableCount}, tr=${trCount}, td=${tdCount}, a=${linkCount}, div=${divCount}`);
      
      // テーブルの最初の数行を確認
      if (tableCount > 0) {
        const $firstTable = $('table').first();
        const firstRows = $firstTable.find('tr').slice(0, 3);
        if (debug) console.log('📋 テーブルの最初の3行:');
        firstRows.each((i, row) => {
          const cells = $(row).find('td, th').map((_, cell) => $(cell).text().trim()).get();
          if (debug) console.log(`  行${i + 1}:`, cells);
        });
      }
      
      // 主要なクラス名を確認
      const classNames: string[] = [];
      $('[class]').each((i, elem) => {
        if (i < 30) {
          const className = $(elem).attr('class');
          if (className && !classNames.includes(className)) {
            classNames.push(className);
          }
        }
      });
      if (debug) console.log('📋 主要なクラス名（最初の15個）:', classNames.slice(0, 15));
      
      // 検索結果らしき要素を探す
      const possibleResults = $('div, tr, li').filter((i, elem) => {
        const text = $(elem).text();
        return text.includes('円') && text.length > 10 && text.length < 500;
      });
      if (debug) console.log(`🔍 検索結果らしき要素: ${possibleResults.length}件`);
      if (possibleResults.length > 0) {
        if (debug) console.log('📄 最初の要素のHTML:', $(possibleResults[0]).html()?.substring(0, 500));
      }
    } else {
      if (debug) console.log(`✅ ${results.length}件の検索結果を取得しました`);
      // 最初の3件をログ出力
      results.slice(0, 3).forEach((r, i) => {
        if (debug) console.log(`  結果${i + 1}: ${r.site} - ${r.reward} - ${r.title.substring(0, 50)}...`);
      });
    }
    
    // アフィリエイトリンクの置き換え処理はリダイレクトAPIで行うため、
    // 検索APIではスキップして検索結果を素早く返す
    // （パフォーマンス向上のため）
    
    return {
      keyword,
      source: 'dokotoku',
      results,
      success: true,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Dokotoku scraping error:', error);
    return {
      keyword,
      source: 'dokotoku',
      results: [],
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get('q');
  
  if (!keyword || keyword.trim() === '') {
    return NextResponse.json(
      { error: 'キーワードが必要です' },
      { status: 400 }
    );
  }
  
  const trimmedKeyword = keyword.trim();
  
  // タイムアウト処理（25秒に延長）
  const searchPromise = searchDokotoku(trimmedKeyword);
  const timeoutPromise = new Promise<PoikatsuSearchResponse>((resolve) => {
    setTimeout(() => {
      resolve({
        keyword: trimmedKeyword,
        source: 'dokotoku',
        results: [],
        success: false,
        error: 'タイムアウト: 検索に時間がかかりすぎました',
        timestamp: new Date().toISOString()
      });
    }, 25000);
  });
  
  const result = await Promise.race([searchPromise, timeoutPromise]);
  
  return NextResponse.json(result);
}

