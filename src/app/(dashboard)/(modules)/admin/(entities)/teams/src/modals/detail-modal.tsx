/**
 * Team Detail Modal
 * Modal para visualização de detalhes da equipe
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Calendar, FileText, Hash, User, X } from 'lucide-react';
import { PiUsersThreeDuotone } from 'react-icons/pi';
import type { DetailModalProps } from '../types';
import {
  formatMembersCount,
  getStatusBadgeVariant,
  getStatusLabel,
} from '../utils/teams.utils';

export function DetailModal({ team, open, onOpenChange }: DetailModalProps) {
  if (!team) return null;

  const iconStyle = team.color
    ? {
        background: `linear-gradient(to bottom right, ${team.color}, ${team.color}CC)`,
      }
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            <div className="flex gap-4 items-center">
              <div
                className="flex items-center justify-center text-white shrink-0 p-2 rounded-lg bg-linear-to-br from-blue-500 to-cyan-600"
                style={iconStyle}
              >
                <PiUsersThreeDuotone className="h-5 w-5" />
              </div>
              <div className="flex-col flex">
                <span className="text-xs text-slate-500/50">Equipe</span>
                {team.name}
              </div>
            </div>
          </DialogTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="gap-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Fechar</p>
            </TooltipContent>
          </Tooltip>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações básicas */}
          <div className="grid grid-cols-2 gap-6">
            {/* Slug */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Slug</span>
              </div>
              <p className="text-sm text-muted-foreground">{team.slug}</p>
            </div>

            {/* Status */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <PiUsersThreeDuotone className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Status</span>
              </div>
              <Badge variant={getStatusBadgeVariant(team.isActive)}>
                {getStatusLabel(team.isActive)}
              </Badge>
            </div>

            {/* Membros */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Membros</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatMembersCount(team.membersCount)}
              </p>
            </div>

            {/* Criador */}
            {team.creatorName && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">Criado por</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {team.creatorName}
                </p>
              </div>
            )}
          </div>

          {/* Descrição */}
          {team.description && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-cyan-500" />
                <span className="text-sm font-medium">Descrição</span>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {team.description}
              </p>
            </div>
          )}

          {/* Cor */}
          {team.color && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: team.color }}
                />
                <span className="text-sm font-medium">Cor</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-md border"
                  style={{ backgroundColor: team.color }}
                />
                <span className="text-sm text-muted-foreground">
                  {team.color}
                </span>
              </div>
            </div>
          )}

          {/* Datas */}
          {(team.createdAt || team.updatedAt) && (
            <div className="border-t pt-4 grid grid-cols-2 gap-6">
              {team.createdAt && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Criado em</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(team.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}

              {team.updatedAt && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-cyan-500" />
                    <span className="text-sm font-medium">Atualizado em</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(team.updatedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
