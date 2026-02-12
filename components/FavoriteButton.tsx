'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Heart } from 'lucide-react';
import { isFavorite, addFavorite, removeFavorite, getFavorites } from '@/lib/storage';

interface FavoriteButtonProps {
  dealId: string;
  className?: string;
  compact?: boolean;
}

function isEndUser(session: { user?: { role?: string } } | null): boolean {
  if (!session?.user) return false;
  const role = (session.user as { role?: string }).role;
  return role !== 'admin' && role !== 'editor';
}

export default function FavoriteButton({ dealId, className = '', compact }: FavoriteButtonProps) {
  const { data: session, status } = useSession();
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const useApi = status === 'authenticated' && isEndUser(session);

  const fetchServerFavorites = useCallback(async () => {
    const res = await fetch('/api/me/favorites');
    if (!res.ok) return [];
    const data = await res.json();
    return (data.dealIds ?? []) as string[];
  }, []);

  useEffect(() => {
    if (useApi) {
      fetchServerFavorites().then((ids) => {
        setFavorited(ids.includes(dealId));
      });
      return;
    }
    setFavorited(isFavorite(dealId));
  }, [dealId, useApi, fetchServerFavorites]);

  useEffect(() => {
    if (!useApi) return;
    if (typeof window === 'undefined') return;
    const localIds = getFavorites();
    if (localIds.length === 0) return;
    if (sessionStorage.getItem('tokuSearch_migrated') === '1') return;
    setLoading(true);
    fetch('/api/me/migrate-local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favoriteDealIds: localIds }),
    })
      .then((r) => {
        if (r.ok) sessionStorage.setItem('tokuSearch_migrated', '1');
      })
      .finally(() => setLoading(false));
  }, [useApi]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    if (useApi) {
      setLoading(true);
      try {
        const ids = await fetchServerFavorites();
        const next = favorited ? ids.filter((id) => id !== dealId) : [...ids, dealId];
        const res = await fetch('/api/me/favorites', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dealIds: next }),
        });
        if (res.ok) setFavorited(!favorited);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (favorited) {
      removeFavorite(dealId);
      setFavorited(false);
    } else {
      addFavorite(dealId);
      setFavorited(true);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`p-1.5 rounded-full transition-colors ${
        favorited
          ? 'text-[#c0463e]'
          : 'text-[#bab6ad] hover:text-[#0f1419]'
      } ${className}`}
      aria-label={favorited ? 'お気に入りから削除' : 'お気に入りに追加'}
    >
      <Heart size={18} fill={favorited ? 'currentColor' : 'none'} />
    </button>
  );
}
