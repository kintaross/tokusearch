export type ColumnStatus = 'published' | 'draft' | 'archived';

export type ColumnCategory = 
  | 'ポイント活用術'
  | '決済サービス'
  | 'お得活用事例'
  | '基礎知識'
  | 'その他';

export interface Column {
  id: string;
  slug: string;
  title: string;
  description: string;
  content_markdown: string;
  content_html: string;
  category: ColumnCategory;
  tags: string; // カンマ区切り
  thumbnail_url: string;
  author: string;
  status: ColumnStatus;
  is_featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at: string;
}

export interface AdminUser {
  id: string;
  username: string;
  password_hash: string;
  display_name: string;
  email: string;
  role: 'admin' | 'editor';
  created_at: string;
  last_login: string;
}

