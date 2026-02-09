import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'TokuSearch | お得情報まとめ';
export const size = {
  width: 2400,
  height: 1260,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          backgroundImage: 'linear-gradient(to bottom right, #fef6e8 0%, #ffffff 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '160px',
          }}
        >
          <div
            style={{
              fontSize: 240,
              fontWeight: 'bold',
              color: '#0f1419',
              marginBottom: 80,
              letterSpacing: '-0.02em',
            }}
          >
            TokuSearch
          </div>
          <div
            style={{
              fontSize: 96,
              color: '#4c4f55',
              textAlign: 'center',
              lineHeight: 1.4,
            }}
          >
            今日の「お得」を、気軽に読む。
          </div>
          <div
            style={{
              fontSize: 64,
              color: '#6b6f76',
              textAlign: 'center',
              marginTop: 60,
            }}
          >
            気になるジャンルのお得情報をまとめてチェック
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

