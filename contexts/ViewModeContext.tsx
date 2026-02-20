'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';

type ViewMode = 'grid' | 'list';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>('grid');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('tokuSearch_viewMode');
        if (saved === 'grid' || saved === 'list') {
          setViewModeState(saved);
        }
      }
    } catch (error) {
      console.error('ViewModeの読み込みエラー:', error);
    }
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('tokuSearch_viewMode', mode);
      }
    } catch (error) {
      console.error('ViewModeの保存エラー:', error);
    }
  }, []);

  const value = useMemo(() => ({ viewMode, setViewMode }), [viewMode, setViewMode]);

  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}

