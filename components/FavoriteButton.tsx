'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { isFavorite, addFavorite, removeFavorite } from '@/lib/storage';

interface FavoriteButtonProps {
  dealId: string;
  className?: string;
  compact?: boolean;
}

export default function FavoriteButton({ dealId, className = '', compact }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    setFavorited(isFavorite(dealId));
  }, [dealId]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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
