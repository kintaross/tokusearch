require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

async function createThemesSheet() {
  try {
    console.log('🔧 column_themesシートを作成します...\n');

    // 認証情報の設定
    const credentials = JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
        process.env.GOOGLE_SHEETS_CREDENTIALS ||
        '{}'
    );
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 既存のシート情報を取得
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const existingSheets =
      spreadsheet.data.sheets?.map((s) => s.properties?.title) || [];
    console.log('既存のシート:', existingSheets.join(', '));

    // column_themesシートを作成
    if (!existingSheets.includes('column_themes')) {
      console.log('\n📝 column_themesシートを作成中...');
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'column_themes',
                },
              },
            },
          ],
        },
      });

      // ヘッダー行を追加
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'column_themes!A1:E1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [['no', 'level', 'theme', 'used', 'used_at']],
        },
      });
      console.log('✅ column_themesシートを作成しました');
    } else {
      console.log('\n⏭️  column_themesシートは既に存在します');
    }

    console.log('\n🎉 シート作成が完了しました！');
    console.log('\n次のステップ:');
    console.log('  1. column_themesシートに200件のテーマデータを手動でインポート');
    console.log('  2. D列（used）を全て FALSE に設定');
    console.log('  3. n8nワークフローを設定');
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

createThemesSheet();



