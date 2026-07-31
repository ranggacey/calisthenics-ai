import { Badge } from '@/lib/badges';
import { cn } from '@/lib/utils';
import { Heart } from 'lucide-react';

export function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <div className={cn('flex items-center p-4 bg-slate-800 rounded-lg shadow-md')}> 
      <div className="p-2 mr-4 bg-slate-700 rounded-full">
        {/* Map badge.icon to component - placeholder */}
        <Heart className="w-6 h-6 text-yellow-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white">{badge.name}</h3>
        <p className="text-sm text-slate-400">{badge.description}</p>
      </div>
    </div>
  );
}
