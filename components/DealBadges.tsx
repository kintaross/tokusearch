import { Deal } from '@/types/deal';
import { getAreaTypeLabel, getTargetUserTypeLabel } from '@/lib/home-utils';

/**
 * チャネルバッジ
 */
export function AreaTypeBadge({ areaType }: { areaType?: string }) {
  const label = getAreaTypeLabel(areaType);
  
  let colorClass = '';
  switch (areaType) {
    case 'online':
      colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'store':
      colorClass = 'bg-purple-50 text-purple-700 border-purple-200';
      break;
    case 'online+store':
      colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      break;
    default:
      colorClass = 'bg-gray-50 text-gray-700 border-gray-200';
  }
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}>
      {label}
    </span>
  );
}

/**
 * 対象ユーザーバッジ
 */
export function TargetUserTypeBadge({ targetUserType }: { targetUserType?: string }) {
  const label = getTargetUserTypeLabel(targetUserType);
  
  let colorClass = '';
  switch (targetUserType) {
    case 'all':
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'new_or_inactive':
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'limited':
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    default:
      colorClass = 'bg-gray-50 text-gray-700 border-gray-200';
  }
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}>
      {label}
    </span>
  );
}

/**
 * カテゴリバッジ
 */
export function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
      {category}
    </span>
  );
}

/**
 * 優先度バッジ
 */
export function PriorityBadge({ priority }: { priority: 'A' | 'B' | 'C' }) {
  let label = '';
  let colorClass = '';
  
  switch (priority) {
    case 'A':
      label = '注目';
      colorClass = 'bg-red-50 text-red-700 border-red-200';
      break;
    case 'B':
      label = 'おすすめ';
      colorClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';
      break;
    case 'C':
      label = '通常';
      colorClass = 'bg-gray-50 text-gray-700 border-gray-200';
      break;
  }
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${colorClass}`}>
      {label}
    </span>
  );
}

