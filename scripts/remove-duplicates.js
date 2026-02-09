// 重複データチェック・削除スクリプト
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SHEET_ID = '1iz1ApPwoLMMyqeQW_GA0XYM1qU74tzULNVq6vav3g14';

// Twitter IDを抽出
function getTwitterId(id) {
  if (!id) return null;
  if (id.startsWith('x-')) {
    return id;
  }
  return null;
}

// URLからTwitter IDを抽出
function extractTwitterIdFromUrl(url) {
  if (!url) return null;
  const match = url.match(/status\/(\d+)/);
  return match ? `x-${match[1]}` : null;
}

// テキスト正規化
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[！!？?　\s\n]/g, '')
    .replace(/【.*?】/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/（.*?）/g, '')
    .trim();
}

// 重複判定用のキーを生成
function generateDuplicateKey(row) {
  const service = normalizeText(row.service || '');
  const title = normalizeText(row.title || '');
  const expiration = row.expiration || 'none';
  return `${service}|${title.substring(0, 50)}|${expiration}`;
}

async function main() {
  console.log('🔍 重複データチェック開始...\n');

  // Google Sheets認証
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  const rows = await sheet.getRows();

  console.log(`📊 総データ件数: ${rows.length}件\n`);

  // Twitter ID（URL由来）による重複チェック
  const twitterIdMap = new Map();
  const contentKeyMap = new Map();
  const duplicates = [];
  const toKeep = new Set();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowData = {
      index: i,
      rowNumber: row.rowNumber,
      id: row.get('id'),
      title: row.get('title'),
      service: row.get('service'),
      expiration: row.get('expiration'),
      created_at: row.get('created_at'),
      url: row.get('notes') || '',
    };

    // Twitter IDチェック（最優先）
    const twitterId = getTwitterId(rowData.id) || extractTwitterIdFromUrl(rowData.url);
    
    if (twitterId) {
      if (twitterIdMap.has(twitterId)) {
        const existing = twitterIdMap.get(twitterId);
        const existingDate = new Date(existing.created_at);
        const currentDate = new Date(rowData.created_at);
        
        // 古い方を残す
        if (currentDate < existingDate) {
          duplicates.push(existing);
          twitterIdMap.set(twitterId, rowData);
          toKeep.add(i);
          console.log(`🔄 Twitter ID重複（新しい方を削除）: ${twitterId}`);
          console.log(`   残す: Row ${rowData.rowNumber} (${rowData.created_at})`);
          console.log(`   削除: Row ${existing.rowNumber} (${existing.created_at}) - "${existing.title}"`);
        } else {
          duplicates.push(rowData);
          console.log(`🔄 Twitter ID重複（新しい方を削除）: ${twitterId}`);
          console.log(`   残す: Row ${existing.rowNumber} (${existing.created_at})`);
          console.log(`   削除: Row ${rowData.rowNumber} (${rowData.created_at}) - "${rowData.title}"`);
        }
      } else {
        twitterIdMap.set(twitterId, rowData);
        toKeep.add(i);
      }
    } else {
      // 内容ベースの重複チェック（Twitter IDがない場合）
      const contentKey = generateDuplicateKey(rowData);
      
      if (contentKeyMap.has(contentKey)) {
        const existing = contentKeyMap.get(contentKey);
        const existingDate = new Date(existing.created_at);
        const currentDate = new Date(rowData.created_at);
        
        // 古い方を残す
        if (currentDate < existingDate) {
          duplicates.push(existing);
          contentKeyMap.set(contentKey, rowData);
          toKeep.add(i);
          console.log(`📝 内容重複（新しい方を削除）: ${contentKey.substring(0, 50)}...`);
          console.log(`   残す: Row ${rowData.rowNumber} (${rowData.created_at})`);
          console.log(`   削除: Row ${existing.rowNumber} (${existing.created_at}) - "${existing.title}"`);
        } else {
          duplicates.push(rowData);
          console.log(`📝 内容重複（新しい方を削除）: ${contentKey.substring(0, 50)}...`);
          console.log(`   残す: Row ${existing.rowNumber} (${existing.created_at})`);
          console.log(`   削除: Row ${rowData.rowNumber} (${rowData.created_at}) - "${rowData.title}"`);
        }
      } else {
        contentKeyMap.set(contentKey, rowData);
        toKeep.add(i);
      }
    }
  }

  console.log(`\n📊 重複チェック完了`);
  console.log(`   ユニークなTwitter ID: ${twitterIdMap.size}件`);
  console.log(`   ユニークな内容キー: ${contentKeyMap.size}件`);
  console.log(`   重複データ: ${duplicates.length}件`);
  console.log(`   残すデータ: ${toKeep.size}件\n`);

  if (duplicates.length === 0) {
    console.log('✅ 重複データはありません。');
    return;
  }

  // 削除確認
  console.log(`⚠️  ${duplicates.length}件の重複データを削除します。`);
  console.log('削除対象:');
  duplicates.forEach(dup => {
    console.log(`  - Row ${dup.rowNumber}: ${dup.id} - "${dup.title}"`);
  });

  // 行番号の大きい順に削除（削除により行番号がずれないようにする）
  const sortedDuplicates = duplicates.sort((a, b) => b.rowNumber - a.rowNumber);
  
  console.log('\n🗑️  削除実行中...');
  for (const dup of sortedDuplicates) {
    const rowToDelete = rows.find(r => r.rowNumber === dup.rowNumber);
    if (rowToDelete) {
      await rowToDelete.delete();
      console.log(`✅ 削除完了: Row ${dup.rowNumber} - "${dup.title}"`);
    }
  }

  console.log(`\n✅ 重複削除完了！ ${duplicates.length}件のデータを削除しました。`);
  console.log(`📊 残りのデータ件数: ${rows.length - duplicates.length}件`);
}

main().catch(console.error);

