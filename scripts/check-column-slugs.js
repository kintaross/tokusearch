require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

async function checkColumnSlugs() {
  const credentials = JSON.parse(
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'
  );

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'columns!A2:P10',
    });

    const rows = response.data.values || [];
    
    console.log('📊 コラムデータ確認:\n');
    rows.forEach((row, index) => {
      console.log(`--- Row ${index + 2} ---`);
      console.log(`ID: ${row[0]}`);
      console.log(`Slug: ${row[1]}`);
      console.log(`Title: ${row[2]}`);
      console.log(`Status: ${row[10]}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

checkColumnSlugs();

