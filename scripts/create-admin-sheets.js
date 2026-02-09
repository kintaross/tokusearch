require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

async function createAdminSheets() {
  try {
    console.log('🔧 管理画面用シートを作成します...\n');

    // 認証情報の設定
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_SHEETS_CREDENTIALS || '{}');
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 既存のシート情報を取得
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const existingSheets = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];
    console.log('既存のシート:', existingSheets.join(', '));

    // columnsシートを作成
    if (!existingSheets.includes('columns')) {
      console.log('\n📝 columnsシートを作成中...');
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'columns',
                },
              },
            },
          ],
        },
      });

      // ヘッダー行を追加
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'columns!A1:P1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'id',
            'slug',
            'title',
            'description',
            'content_markdown',
            'content_html',
            'category',
            'tags',
            'thumbnail_url',
            'author',
            'status',
            'is_featured',
            'view_count',
            'created_at',
            'updated_at',
            'published_at',
          ]],
        },
      });
      console.log('✅ columnsシートを作成しました');
    } else {
      console.log('\n⏭️  columnsシートは既に存在します');
    }

    // admin_usersシートを作成
    if (!existingSheets.includes('admin_users')) {
      console.log('\n👤 admin_usersシートを作成中...');
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'admin_users',
                },
              },
            },
          ],
        },
      });

      // ヘッダー行を追加
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'admin_users!A1:H1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'id',
            'username',
            'password_hash',
            'display_name',
            'email',
            'role',
            'created_at',
            'last_login',
          ]],
        },
      });
      console.log('✅ admin_usersシートを作成しました');
    } else {
      console.log('\n⏭️  admin_usersシートは既に存在します');
    }

    console.log('\n🎉 シート作成が完了しました！');
    console.log('\n次のステップ:');
    console.log('  node scripts/create-initial-admin.js を実行して初期管理者を作成してください');
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

createAdminSheets();

