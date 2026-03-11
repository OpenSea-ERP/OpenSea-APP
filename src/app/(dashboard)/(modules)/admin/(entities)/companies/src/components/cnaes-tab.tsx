/**
 * CNAEs Tab Component - Company CNAEs List
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { formatCNAE } from '@/helpers';
import type { CompanyCnae } from '@/types/hr';
import { FileCheck, FileText } from 'lucide-react';

interface CnaesTabProps {
  cnaes: CompanyCnae[] | undefined;
  isLoadingCnaes: boolean;
}

export function CnaesTab({ cnaes, isLoadingCnaes }: CnaesTabProps) {
  const primaryCnae = cnaes?.find(cnae => cnae.isPrimary);
  const secondaryCnaes = cnaes
    ?.filter(cnae => !cnae.isPrimary)
    .sort((a, b) => a.code.localeCompare(b.code));

  return (
    <TabsContent value="cnaes" className="flex flex-col gap-2 space-y-4">
      {isLoadingCnaes ? (
        <Card className="w-full p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <p className="text-muted-foreground">Carregando CNAEs...</p>
        </Card>
      ) : (
        <>
          {/* CNAE Principal */}
          {primaryCnae && (
            <Card className="w-full p-4 sm:p-6 space-y-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4 text-white/60">
                <FileCheck className="h-6 w-6" />
                CNAE Principal
              </h3>
              <div
                key={primaryCnae.id}
                className="rounded-lg border border-gray-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-800 p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <p className="text-sm sm:text-base">
                      <span className="font-semibold">
                        {formatCNAE(primaryCnae.code)}
                      </span>{' '}
                      - {primaryCnae.description || '—'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="default" className="text-xs">
                      Principal
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* CNAEs Secundários */}
          {secondaryCnaes && secondaryCnaes.length > 0 && (
            <Card className="w-full p-4 sm:p-6 space-y-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4 text-white/60">
                <FileText className="h-6 w-6" />
                CNAEs Secundários
              </h3>
              <div className="space-y-3">
                {secondaryCnaes.map(cnae => (
                  <div
                    key={cnae.id}
                    className="rounded-lg border border-gray-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-800 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <p className="text-sm sm:text-base">
                          <span className="font-semibold">
                            {formatCNAE(cnae.code)}
                          </span>{' '}
                          - {cnae.description || '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Mensagem quando não há CNAEs */}
          {!primaryCnae && (!secondaryCnaes || secondaryCnaes.length === 0) && (
            <Card className="w-full p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <p className="text-sm text-muted-foreground">
                Nenhum CNAE cadastrado.
              </p>
            </Card>
          )}
        </>
      )}
    </TabsContent>
  );
}
