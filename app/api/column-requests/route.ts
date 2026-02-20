import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestText } = body;

    // バリデーション
    if (!requestText || typeof requestText !== 'string') {
      return NextResponse.json(
        { error: 'リクエスト内容を入力してください' },
        { status: 400 }
      );
    }

    const trimmedText = requestText.trim();
    if (trimmedText.length === 0) {
      return NextResponse.json(
        { error: 'リクエスト内容を入力してください' },
        { status: 400 }
      );
    }

    if (trimmedText.length > 2000) {
      return NextResponse.json(
        { error: 'リクエスト内容は2000文字以内で入力してください' },
        { status: 400 }
      );
    }

    // n8n Webhookにリクエストを送信
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    
    if (!webhookUrl) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'サーバー設定エラー（Webhook未設定）' },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, message: 'リクエストを受け付けました（開発モード）' });
    }

    // n8n Webhookを呼び出し
    const webhookPayload = {
      requestText: trimmedText,
      source: 'web',
      timestamp: new Date().toISOString(),
    };
    
    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      const responseText = await webhookResponse.text();
      
      if (!webhookResponse.ok) {
        console.error('Webhook呼び出し失敗:', {
          status: webhookResponse.status,
          statusText: webhookResponse.statusText,
        });
        // Webhookが失敗しても成功レスポンスを返す（ユーザー体験のため）
        return NextResponse.json({
          success: true,
          message: 'リクエストを受け付けました',
        });
      }

      // 成功時ログは最小限（入力内容はログに残さない）
      console.log('Webhook呼び出し成功:', { status: webhookResponse.status, len: responseText.length });
    } catch (fetchError: any) {
      console.error('Webhook呼び出しエラー:', { error: fetchError.message });
      // エラーが発生しても成功レスポンスを返す（ユーザー体験のため）
      return NextResponse.json({
        success: true,
        message: 'リクエストを受け付けました',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'リクエストを受け付けました',
    });
  } catch (error) {
    console.error('Column request error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。しばらくしてからお試しください。' },
      { status: 500 }
    );
  }
}

