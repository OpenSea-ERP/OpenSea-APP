'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { PageActionBar } from '@/components/layout/page-action-bar';
import type { FileManagerRef } from '@/components/storage';
import { FileManager, QuotaWarningBanner } from '@/components/storage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { usePermissions } from '@/hooks/use-permissions';
import { TOOLS_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  Eye,
  EyeOff,
  FolderOpen,
  FolderPlus,
  Trash2,
  Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';

export default function FileManagerPage() {
  const fileManagerRef = useRef<FileManagerRef>(null);
  const { hasPermission } = usePermissions();
  const { isSuperAdmin } = useAuth();
  const canCreate = hasPermission(TOOLS_PERMISSIONS.STORAGE_FOLDERS.REGISTER);
  const canUpload = hasPermission(TOOLS_PERMISSIONS.STORAGE_FILES.REGISTER);
  const [viewAll, setViewAll] = useState(false);
  const [showTrash, setShowTrash] = useState(false);

  const buttons = [
    {
      id: 'trash',
      title: showTrash ? 'Pastas' : 'Lixeira',
      icon: showTrash ? FolderOpen : Trash2,
      variant: 'outline' as const,
      onClick: () => setShowTrash(prev => !prev),
    },
    ...(canUpload
      ? [
          {
            id: 'upload',
            title: 'Carregar',
            icon: Upload,
            variant: 'outline' as const,
            onClick: () => fileManagerRef.current?.openUpload(),
          },
        ]
      : []),
    ...(canCreate
      ? [
          {
            id: 'new-folder',
            title: 'Nova Pasta',
            icon: FolderPlus,
            variant: 'default' as const,
            onClick: () => fileManagerRef.current?.openNewFolder(),
          },
        ]
      : []),
  ];

  return (
    <ProtectedRoute requiredPermission={TOOLS_PERMISSIONS.STORAGE_FOLDERS.ACCESS}>
      <div className="flex flex-col gap-6 h-[calc(100vh-10rem)]">
        {/* Quota Warning */}
        <QuotaWarningBanner />

        {/* Action Bar */}
        <PageActionBar
          breadcrumbItems={[
            { label: 'Gerenciador de Arquivos', href: '/file-manager' },
          ]}
          buttons={buttons}
        />

        {/* Hero Card */}
        <Card className="relative overflow-hidden p-6 md:p-8 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10 shrink-0">
          <div className="absolute top-0 right-0 w-56 h-56 bg-emerald-500/10 rounded-full opacity-80 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-500/10 rounded-full opacity-80 translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600">
                  <FolderOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    Gerenciador de Arquivos
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-white/60">
                    Organize, envie e compartilhe documentos e arquivos da
                    empresa
                  </p>
                </div>
              </div>

              {isSuperAdmin && (
                <Button
                  variant={viewAll ? 'default' : 'outline'}
                  size="sm"
                  className="gap-2 shrink-0"
                  onClick={() => setViewAll(v => !v)}
                >
                  {viewAll ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                  {viewAll ? 'Todos os arquivos' : 'Meus arquivos'}
                </Button>
              )}
            </div>

            {/* Toolbar slot — FileManager portals its toolbar here */}
            <div
              id="fm-toolbar-slot"
              className="mt-4 bg-muted/30 dark:bg-white/5 rounded-lg px-3 py-2"
            />
          </div>
        </Card>

        {/* Content Card — fills remaining space */}
        <Card className="bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10 p-0 overflow-hidden flex-1 min-h-0 flex flex-col">
          <FileManager
            ref={fileManagerRef}
            hideToolbarActions
            toolbarPortalId="fm-toolbar-slot"
            viewAll={isSuperAdmin && viewAll}
            showTrash={showTrash}
            onShowTrashChange={setShowTrash}
            className="flex-1 min-h-0"
          />
        </Card>
      </div>
    </ProtectedRoute>
  );
}
