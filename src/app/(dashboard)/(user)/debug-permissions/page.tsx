'use client';

import { useAuth } from '@/contexts/auth-context';
import { usePermissions } from '@/hooks/use-permissions';
import { logger } from '@/lib/logger';
import {
  createPermissionMap,
  listMyPermissions,
  listUserGroups,
} from '@/services/rbac/rbac.service';
import {
  STOCK_PERMISSIONS,
  ADMIN_PERMISSIONS,
  HR_PERMISSIONS,
  TOOLS_PERMISSIONS,
  SYSTEM_PERMISSIONS,
  WILDCARD_PERMISSIONS,
} from '@/config/rbac/permission-codes';
import type { EffectivePermission } from '@/types/rbac';
import { useEffect, useState } from 'react';

interface DiagnosticData {
  userId: string | null;
  userEmail: string | null;
  rawPermissions: EffectivePermission[];
  parsedPermissions: [string, 'allow' | 'deny'][];
  groups: unknown;
  hookState: {
    isLoading: boolean;
    error: string | null;
    effectivePermissions: EffectivePermission[];
    permissionMapSize: number;
    permissionMapEntries: [string, 'allow' | 'deny'][];
  };
  testChecks: Record<string, boolean>;
}

export default function DebugPermissionsPage() {
  const { user } = useAuth();
  const permissionsHook = usePermissions();
  const [diagnostic, setDiagnostic] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDiagnostics() {
      if (!user?.id) {
        setError('Usuário não autenticado');
        setLoading(false);
        return;
      }

      // Wait for hook to finish loading
      if (permissionsHook.isLoading) {
        return;
      }

      try {
        // Fetch raw permissions from API using /v1/me/permissions
        const rawPermissions = await listMyPermissions();
        let groups: unknown = [];
        try {
          groups = await listUserGroups(user.id);
        } catch (e) {
          logger.error(
            'Error fetching groups',
            e instanceof Error ? e : undefined
          );
        }

        // Create permission map from raw API response
        const parsedMap = createPermissionMap(rawPermissions);

        // Test specific permission checks
        const testPermissions = [
          WILDCARD_PERMISSIONS.FULL_ACCESS,
          STOCK_PERMISSIONS.PRODUCTS.ACCESS,
          STOCK_PERMISSIONS.PRODUCTS.REGISTER,
          STOCK_PERMISSIONS.TEMPLATES.ACCESS,
          STOCK_PERMISSIONS.CATEGORIES.ACCESS,
          ADMIN_PERMISSIONS.USERS.ACCESS,
          ADMIN_PERMISSIONS.PERMISSION_GROUPS.ACCESS,
          ADMIN_PERMISSIONS.AUDIT.ACCESS,
          HR_PERMISSIONS.EMPLOYEES.ACCESS,
          HR_PERMISSIONS.DEPARTMENTS.ACCESS,
          TOOLS_PERMISSIONS.STORAGE_FOLDERS.ACCESS,
          TOOLS_PERMISSIONS.TASK_BOARDS.ACCESS,
          TOOLS_PERMISSIONS.CALENDAR.ACCESS,
          TOOLS_PERMISSIONS.EMAIL_ACCOUNTS.ACCESS,
          SYSTEM_PERMISSIONS.SELF.ACCESS,
        ];

        const testChecks: Record<string, boolean> = {};
        for (const perm of testPermissions) {
          testChecks[perm] = permissionsHook.hasPermission(perm);
        }

        setDiagnostic({
          userId: user.id,
          userEmail: user.email,
          rawPermissions,
          parsedPermissions: Array.from(parsedMap.entries()),
          groups,
          hookState: {
            isLoading: permissionsHook.isLoading,
            error: permissionsHook.error?.message || null,
            effectivePermissions: permissionsHook.effectivePermissions,
            permissionMapSize: permissionsHook.permissions.size,
            permissionMapEntries: Array.from(
              permissionsHook.permissions.entries()
            ),
          },
          testChecks,
        });
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setLoading(false);
      }
    }

    fetchDiagnostics();
  }, [user, permissionsHook.isLoading, permissionsHook]);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Carregando diagnóstico...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-500">Erro</h1>
        <pre className="bg-red-100 p-4 rounded">{error}</pre>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Diagnóstico de Permissões</h1>

      {/* User Info */}
      <section className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Informações do Usuário</h2>
        <p>
          <strong>ID:</strong> {diagnostic?.userId}
        </p>
        <p>
          <strong>Email:</strong> {diagnostic?.userEmail}
        </p>
      </section>

      {/* Hook State */}
      <section className="bg-blue-100 dark:bg-blue-900 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">
          Estado do Hook usePermissions
        </h2>
        <p>
          <strong>isLoading:</strong> {String(diagnostic?.hookState.isLoading)}
        </p>
        <p>
          <strong>error:</strong> {diagnostic?.hookState.error || 'null'}
        </p>
        <p>
          <strong>Total de permissões efetivas:</strong>{' '}
          {diagnostic?.hookState.effectivePermissions.length}
        </p>
        <p>
          <strong>Tamanho do mapa de permissões:</strong>{' '}
          {diagnostic?.hookState.permissionMapSize}
        </p>
      </section>

      {/* Groups */}
      <section className="bg-green-100 dark:bg-green-900 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Grupos do Usuário</h2>
        <pre className="overflow-auto max-h-64 text-sm">
          {JSON.stringify(diagnostic?.groups, null, 2)}
        </pre>
      </section>

      {/* Permission Checks */}
      <section className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">
          Verificação de Permissões (hasPermission)
        </h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="border-b p-2">Permissão</th>
              <th className="border-b p-2">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(diagnostic?.testChecks || {}).map(
              ([perm, result]) => (
                <tr
                  key={perm}
                  className={
                    result
                      ? 'bg-green-200 dark:bg-green-800'
                      : 'bg-red-200 dark:bg-red-800'
                  }
                >
                  <td className="border-b p-2 font-mono text-sm">{perm}</td>
                  <td className="border-b p-2">
                    {result ? '✅ PERMITIDO' : '❌ NEGADO'}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </section>

      {/* Raw Permissions */}
      <section className="bg-purple-100 dark:bg-purple-900 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Permissões Brutas da API</h2>
        <pre className="overflow-auto max-h-96 text-sm">
          {JSON.stringify(diagnostic?.rawPermissions, null, 2)}
        </pre>
      </section>

      {/* Permission Map */}
      <section className="bg-orange-100 dark:bg-orange-900 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">
          Mapa de Permissões Parseado
        </h2>
        <pre className="overflow-auto max-h-96 text-sm">
          {JSON.stringify(
            Array.from(diagnostic?.parsedPermissions?.entries() || []),
            null,
            2
          )}
        </pre>
      </section>
    </div>
  );
}
