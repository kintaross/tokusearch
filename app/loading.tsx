import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function Loading() {
  return (
    <div className="flex justify-center items-center min-h-[60vh] w-full bg-soft-greige/20">
      <LoadingSpinner />
    </div>
  );
}
