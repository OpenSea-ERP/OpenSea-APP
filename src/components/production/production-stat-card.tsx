import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ProductionStatCardProps {
  icon: LucideIcon;
  iconGradient: string;
  label: string;
  value: string | number;
}

export function ProductionStatCard({
  icon: Icon,
  iconGradient,
  label,
  value,
}: ProductionStatCardProps) {
  return (
    <Card className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl bg-linear-to-br ${iconGradient} flex items-center justify-center`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-white/60">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}
