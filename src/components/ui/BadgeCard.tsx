import { Badge } from '@/lib/badges';
import { cn } from '@/lib/utils';
import { Dumbbell, Flame, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Dumbbell,
  Fire: Flame,
  Star,
};

export function BadgeCard({ badge }: { badge: Badge }) {
  const Icon = iconMap[badge.icon] ?? Star;

  return (
    <div className={cn('flex items-center p-4 bg-slate-800 rounded-lg shadow-md')}>
      <div className="p-2 mr-4 bg-slate-700 rounded-full">
        <Icon className="w-6 h-6 text-yellow-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white">{badge.name}</h3>
        <p className="text-sm text-slate-400">{badge.description}</p>
      </div>
    </div>
  );
}
