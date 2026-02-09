import { generateTestData, dealsToCSV } from '../scripts/generateTestData';
import * as fs from 'fs';
import * as path from 'path';

const count = parseInt(process.argv[2]) || 100;
const deals = generateTestData(count);
const csv = dealsToCSV(deals);

const outputPath = path.join(process.cwd(), 'test-data.csv');
fs.writeFileSync(outputPath, csv, 'utf-8');

console.log(`✅ ${count}件のテストデータを生成しました: ${outputPath}`);
console.log(`\nGoogleスプレッドシートにインポートする手順:`);
console.log(`1. ${outputPath} を開く`);
console.log(`2. すべてのデータをコピー`);
console.log(`3. Googleスプレッドシートを開く`);
console.log(`4. 1行目にヘッダーを貼り付け`);
console.log(`5. 2行目以降にデータを貼り付け`);
