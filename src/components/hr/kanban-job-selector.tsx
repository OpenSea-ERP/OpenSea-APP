/**
 * Kanban Job Selector
 *
 * Popover trigger usado no hub de Recrutamento para abrir o pipeline
 * Kanban de uma vaga em aberto. Lista vagas com status OPEN e navega
 * para `/hr/recruitment/[id]/kanban` ao selecionar.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, ChevronDown, GitBranch, Search } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useOpenJobPostings } from '@/hooks/hr/use-recruitment-kanban';

interface KanbanJobSelectorProps {
  /** Variante visual do botão */
  variant?: 'default' | 'outline';
  /** Label customizado (default: "Pipeline Kanban") */
  label?: string;
}

export function KanbanJobSelector({
  variant = 'outline',
  label = 'Pipeline Kanban',
}: KanbanJobSelectorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const { data: openJobPostings, isLoading } = useOpenJobPostings();

  const filteredJobs = (openJobPostings ?? []).filter(jobPosting => {
    if (!searchInput.trim()) return true;
    return jobPosting.title
      .toLowerCase()
      .includes(searchInput.toLowerCase());
  });

  const handleSelectJob = (jobPostingId: string) => {
    setIsOpen(false);
    router.push(`/hr/recruitment/${jobPostingId}/kanban`);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          className="gap-2"
          data-testid="kanban-job-selector-trigger"
        >
          <GitBranch className="h-4 w-4" />
          {label}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b border-slate-200 p-2 dark:border-white/10">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Buscar vaga..."
              value={searchInput}
              onChange={changeEvent => setSearchInput(changeEvent.target.value)}
              className="h-8 border-slate-200 pl-8 text-sm dark:border-white/10"
              data-testid="kanban-job-selector-search"
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto p-1">
          {isLoading ? (
            <div className="space-y-1 p-2">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <div className="mx-auto mb-2 inline-flex rounded-full bg-slate-100 p-2 dark:bg-white/5">
                <Briefcase className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-xs text-muted-foreground">
                {openJobPostings && openJobPostings.length === 0
                  ? 'Nenhuma vaga em aberto. Publique uma vaga para visualizar o Kanban.'
                  : 'Nenhuma vaga encontrada com esse termo.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {filteredJobs.map(jobPosting => (
                <li key={jobPosting.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectJob(jobPosting.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors',
                      'hover:bg-slate-100 dark:hover:bg-white/5'
                    )}
                    data-testid={`kanban-job-selector-item-${jobPosting.id}`}
                  >
                    <div className="rounded-md bg-violet-100 p-1.5 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                      <Briefcase className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {jobPosting.title}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {jobPosting.location ?? 'Remoto'}
                        {jobPosting._count?.applications !== undefined && (
                          <span className="ml-2 inline-flex items-center gap-0.5">
                            • {jobPosting._count.applications} candidato
                            {jobPosting._count.applications === 1 ? '' : 's'}
                          </span>
                        )}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
