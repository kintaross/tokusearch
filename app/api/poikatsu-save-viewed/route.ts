import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { PoikatsuSearchResult } from '@/types/poikatsu';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// 案件の一意IDを生成（サーバー側でも同じロジックを使用）
function generateItemId(result: PoikatsuSearchResult): string {
  const combined = `${result.site}-${result.title}-${result.originalUrl}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `item_${Math.abs(hash).toString(36)}`;
}

// スプレッドシートに案件を保存
async function saveToSheet(results: PoikatsuSearchResult[]): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!spreadsheetId || !serviceAccountKey) {
    console.warn('⚠️ スプレッドシートの環境変数が設定されていません。保存をスキップします。');
    return;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(serviceAccountKey),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // シート名（既存のシートを使用するか、新規作成）
    const sheetName = process.env.GOOGLE_SHEETS_VIEWED_ITEMS_SHEET_NAME || 'viewed_items';

    // シートの存在確認と作成
    try {
      await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:Z1`,
      });
    } catch (error: any) {
      // シートが存在しない場合は作成
      if (error.code === 400) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            }],
          },
        });

        // ヘッダー行を追加
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[
              'item_id',
              'site',
              'title',
              'original_url',
              'reward_rate',
              'reward_amount',
              'reward',
              'first_viewed_at',
              'last_viewed_at',
              'view_count',
              'max_reward_rate',
              'max_reward_amount',
            ]],
          },
        });
      }
    }

    // 既存データを取得して重複チェック
    let existingData: any[] = [];
    try {
      const existingResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A2:Z`,
      });
      existingData = existingResponse.data.values || [];
    } catch (error) {
      // データが存在しない場合は空配列
      existingData = [];
    }

    // 既存のitem_idをマップ
    const existingItemIds = new Set(
      existingData.map(row => row[0]).filter(Boolean)
    );

    // 新しいデータを準備
    const now = new Date().toISOString();
    const rowsToAdd: any[] = [];
    const rowsToUpdate: Array<{ rowIndex: number; values: any[] }> = [];

    for (const result of results) {
      const itemId = generateItemId(result);
      const existingRowIndex = existingData.findIndex(row => row[0] === itemId);

      if (existingRowIndex >= 0) {
        // 既存の行を更新
        const existingRow = existingData[existingRowIndex];
        const viewCount = parseInt(existingRow[9] || '0', 10) + 1;
        const maxRewardRate = result.rewardRate !== undefined
          ? Math.max(parseFloat(existingRow[10] || '0'), result.rewardRate)
          : parseFloat(existingRow[10] || '0');
        const maxRewardAmount = result.rewardAmount !== undefined
          ? Math.max(parseFloat(existingRow[11] || '0'), result.rewardAmount)
          : parseFloat(existingRow[11] || '0');

        rowsToUpdate.push({
          rowIndex: existingRowIndex + 2, // +2はヘッダー行と0ベースのため
          values: [[
            itemId,
            result.site,
            result.title,
            result.originalUrl,
            result.rewardRate?.toString() || '',
            result.rewardAmount?.toString() || '',
            result.reward,
            existingRow[7] || now, // first_viewed_atは変更しない
            now, // last_viewed_atを更新
            viewCount.toString(),
            maxRewardRate.toString(),
            maxRewardAmount.toString(),
          ]],
        });
      } else {
        // 新しい行を追加
        rowsToAdd.push([
          itemId,
          result.site,
          result.title,
          result.originalUrl,
          result.rewardRate?.toString() || '',
          result.rewardAmount?.toString() || '',
          result.reward,
          now, // first_viewed_at
          now, // last_viewed_at
          '1', // view_count
          result.rewardRate?.toString() || '',
          result.rewardAmount?.toString() || '',
        ]);
      }
    }

    // 更新を実行
    if (rowsToUpdate.length > 0) {
      for (const update of rowsToUpdate) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A${update.rowIndex}:L${update.rowIndex}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: update.values,
          },
        });
      }
    }

    // 新規追加を実行
    if (rowsToAdd.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:L`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: rowsToAdd,
        },
      });
    }

    console.log(`✅ ${rowsToAdd.length}件の新規案件、${rowsToUpdate.length}件の更新案件を保存しました`);
  } catch (error) {
    console.error('❌ スプレッドシートへの保存に失敗しました:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { results } = body;

    if (!Array.isArray(results)) {
      return NextResponse.json(
        { error: 'resultsは配列である必要があります' },
        { status: 400 }
      );
    }

    // スプレッドシートに保存
    await saveToSheet(results);

    return NextResponse.json({
      success: true,
      message: `${results.length}件の案件を保存しました`,
    });
  } catch (error) {
    console.error('保存エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '保存に失敗しました',
      },
      { status: 500 }
    );
  }
}


