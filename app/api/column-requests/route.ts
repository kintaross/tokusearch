import { NextRequest, NextResponse } from 'next/server';

// reCAPTCHA v3 検証（オプション）
async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!secretKey) {
    // reCAPTCHAが設定されていない場合はスキップ
    console.log('reCAPTCHA secret key not configured, skipping verification');
    return true;
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();
    return data.success && data.score >= 0.5;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestText, recaptchaToken } = body;

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

    // reCAPTCHA検証（設定されている場合のみ）
    if (process.env.RECAPTCHA_SECRET_KEY && recaptchaToken) {
      const isHuman = await verifyRecaptcha(recaptchaToken);
      if (!isHuman) {
        return NextResponse.json(
          { error: 'reCAPTCHA検証に失敗しました。もう一度お試しください。' },
          { status: 400 }
        );
      }
    }

    // n8n Webhookにリクエストを送信
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.error('N8N_WEBHOOK_URL is not configured');
      // Webhookが設定されていない場合でも成功レスポンスを返す（開発用）
      console.log('Column request received (webhook not configured):', trimmedText);
      return NextResponse.json({
        success: true,
        message: 'リクエストを受け付けました（開発モード）',
      });
    }

    // n8n Webhookを呼び出し
    const webhookPayload = {
      requestText: trimmedText,
      source: 'web',
      timestamp: new Date().toISOString(),
    };
    
    console.log('🔗 n8n Webhook呼び出し開始:', {
      url: webhookUrl,
      payload: webhookPayload,
    });

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
        console.error('❌ Webhook呼び出し失敗:', {
          status: webhookResponse.status,
          statusText: webhookResponse.statusText,
          response: responseText,
          url: webhookUrl,
        });
        // Webhookが失敗しても成功レスポンスを返す（ユーザー体験のため）
        return NextResponse.json({
          success: true,
          message: 'リクエストを受け付けました',
        });
      }

      console.log('✅ Webhook呼び出し成功:', {
        status: webhookResponse.status,
        response: responseText.substring(0, 200),
      });
    } catch (fetchError: any) {
      console.error('❌ Webhook呼び出しエラー:', {
        error: fetchError.message,
        stack: fetchError.stack,
        url: webhookUrl,
      });
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

