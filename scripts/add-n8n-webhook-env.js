const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(process.cwd(), '.env.local');
const n8nWebhookUrl = 'https://k-n8n.xvps.jp/webhook/column-request-webhook';

console.log('🔧 n8n Webhook URL環境変数を追加します...\n');

// .env.localファイルが存在するか確認
if (!fs.existsSync(envLocalPath)) {
  console.log('⚠️  .env.localファイルが見つかりません。');
  console.log('   新規作成します...\n');
  
  // 新規作成
  const content = `# n8n Webhook URL (コラムリクエスト用)
N8N_WEBHOOK_URL=${n8nWebhookUrl}
`;
  
  fs.writeFileSync(envLocalPath, content, 'utf-8');
  console.log('✅ .env.localファイルを作成し、N8N_WEBHOOK_URLを追加しました！\n');
  console.log(`   追加内容: N8N_WEBHOOK_URL=${n8nWebhookUrl}\n`);
} else {
  // 既存の.env.localファイルを読み取り
  const existingContent = fs.readFileSync(envLocalPath, 'utf-8');
  
  // 既にN8N_WEBHOOK_URLが設定されているか確認
  if (existingContent.includes('N8N_WEBHOOK_URL=')) {
    console.log('⚠️  N8N_WEBHOOK_URLは既に設定されています。');
    console.log('   既存の設定を更新します...\n');
    
    // 既存のN8N_WEBHOOK_URLを更新
    const updatedContent = existingContent.replace(
      /N8N_WEBHOOK_URL=.*/g,
      `N8N_WEBHOOK_URL=${n8nWebhookUrl}`
    );
    
    fs.writeFileSync(envLocalPath, updatedContent, 'utf-8');
    console.log('✅ N8N_WEBHOOK_URLを更新しました！\n');
    console.log(`   更新内容: N8N_WEBHOOK_URL=${n8nWebhookUrl}\n`);
  } else {
    // 既存の.env.localに追加
    const separator = existingContent.endsWith('\n') ? '' : '\n';
    const newContent = `${existingContent}${separator}# n8n Webhook URL (コラムリクエスト用)
N8N_WEBHOOK_URL=${n8nWebhookUrl}
`;
    
    fs.writeFileSync(envLocalPath, newContent, 'utf-8');
    console.log('✅ .env.localファイルにN8N_WEBHOOK_URLを追加しました！\n');
    console.log(`   追加内容: N8N_WEBHOOK_URL=${n8nWebhookUrl}\n`);
  }
}

console.log('📝 次のステップ:');
console.log('   1. .env.localファイルを確認してください');
console.log('   2. 開発サーバーを再起動してください (npm run dev)\n');


