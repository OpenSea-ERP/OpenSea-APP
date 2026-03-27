'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { useMyEmployee } from '@/hooks/use-me';
import { cn } from '@/lib/utils';

import { Activity, Briefcase, ChevronRight, Link, Shield, User } from 'lucide-react';
import { useState } from 'react';

import { ActivityTab } from './_components/activity-tab';
import { ConnectedAccountsTab } from './_components/connected-accounts-tab';
import { EmployeeTab } from './_components/employee-tab';
import { ProfileTab } from './_components/profile-tab';
import { SecurityTab } from './_components/security-tab';

type TabId = 'profile' | 'security' | 'connected-accounts' | 'employee' | 'activity';

interface TabItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  description: string;
  requiresEmployee?: boolean;
}

const tabs: TabItem[] = [
  {
    id: 'profile',
    label: 'Perfil',
    icon: <User className="w-5 h-5" />,
    description: 'Informações pessoais',
  },
  {
    id: 'security',
    label: 'Segurança',
    icon: <Shield className="w-5 h-5" />,
    description: 'Senha e sessões',
  },
  {
    id: 'connected-accounts',
    label: 'Contas Conectadas',
    icon: <Link className="w-5 h-5" />,
    description: 'Métodos de login',
  },
  {
    id: 'employee',
    label: 'Funcionário',
    icon: <Briefcase className="w-5 h-5" />,
    description: 'Dados profissionais',
    requiresEmployee: true,
  },
  {
    id: 'activity',
    label: 'Atividade',
    icon: <Activity className="w-5 h-5" />,
    description: 'Histórico de ações',
  },
];

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  // Verifica se o usuário tem um funcionário vinculado
  const { data: employeeData, isLoading: employeeLoading } = useMyEmployee();
  const hasEmployee = !!employeeData?.employee;

  // Filtra as tabs disponíveis
  const availableTabs = tabs.filter(
    tab => !tab.requiresEmployee || hasEmployee
  );

  if (authLoading) {
    return <ProfilePageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageActionBar
        breadcrumbItems={[{ label: 'Minha Conta', href: '/profile' }]}
      />

      {/* Main Content - Sidebar + Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <Card className="p-2 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <nav className="space-y-1">
              {availableTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200',
                    'text-left group',
                    activeTab === tab.id
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5'
                  )}
                >
                  <div
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      activeTab === tab.id
                        ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/50 group-hover:bg-gray-200 dark:group-hover:bg-white/15'
                    )}
                  >
                    {tab.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'font-medium text-sm',
                        activeTab === tab.id
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-900 dark:text-white'
                      )}
                    >
                      {tab.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-white/40 truncate">
                      {tab.description}
                    </p>
                  </div>
                  <ChevronRight
                    className={cn(
                      'w-4 h-4 transition-transform',
                      activeTab === tab.id
                        ? 'text-blue-500 translate-x-0'
                        : 'text-gray-400 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                    )}
                  />
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && <ProfileTab user={user} />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'connected-accounts' && <ConnectedAccountsTab />}
          {activeTab === 'employee' && hasEmployee && (
            <EmployeeTab
              employee={employeeData.employee}
              isLoading={employeeLoading}
            />
          )}
          {activeTab === 'activity' && <ActivityTab />}
        </div>
      </div>
    </div>
  );
}

function ProfilePageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64">
          <Card className="p-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 px-3 py-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            ))}
          </Card>
        </div>
        <div className="flex-1">
          <Card className="p-6">
            <Skeleton className="h-6 w-40 mb-6" />
            <div className="space-y-4">
              <Skeleton className="h-24 w-24 rounded-full mx-auto" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
