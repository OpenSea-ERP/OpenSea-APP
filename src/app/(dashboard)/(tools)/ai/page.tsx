'use client';

import { useState } from 'react';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  AiHeroBanner,
  AiChatView,
  AiInsightsView,
  AiFavoritesView,
  AiActionsView,
  AiSettingsView,
  AiConversationsDrawer,
} from '@/components/ai';
import type { AiView } from '@/components/ai';
import { MessageSquarePlus, History } from 'lucide-react';

export default function AiPage() {
  const [activeView, setActiveView] = useState<AiView>('chat');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);

  const handleConversationCreated = (id: string) => {
    setSelectedConversationId(id);
  };

  const handleSelectConversation = (id: string | null) => {
    setSelectedConversationId(id);
    if (id !== null) setActiveView('chat');
  };

  const handleNewConversation = () => {
    setSelectedConversationId(null);
    setActiveView('chat');
  };

  // Dashboard layout: pt-28 (7rem top) + pb-12 (3rem bottom) = 10rem from viewport
  // -mb-12 reclaims the bottom padding so the chat input reaches the viewport edge
  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-10rem)] overflow-hidden -mb-12">
      {/* Action Bar */}
      <PageActionBar
        breadcrumbItems={[{ label: 'Ferramentas' }, { label: 'Assistente IA' }]}
        buttons={[
          {
            id: 'conversations',
            title: 'Conversas anteriores',
            icon: History,
            variant: 'outline' as const,
            onClick: () => setDrawerOpen(true),
          },
          {
            id: 'new-conversation',
            title: 'Nova Conversa',
            icon: MessageSquarePlus,
            variant: 'default' as const,
            onClick: handleNewConversation,
          },
        ]}
      />

      {/* Hero Banner */}
      <div className="mt-1">
        <AiHeroBanner activeView={activeView} onViewChange={setActiveView} />
      </div>

      {/* Dynamic content area — fills remaining space */}
      <div className="flex-1 min-h-0 flex flex-col">
        {activeView === 'chat' && (
          <AiChatView
            selectedConversationId={selectedConversationId}
            onConversationCreated={handleConversationCreated}
          />
        )}
        {activeView === 'insights' && <AiInsightsView />}
        {activeView === 'favorites' && <AiFavoritesView />}
        {activeView === 'actions' && <AiActionsView />}
        {activeView === 'settings' && <AiSettingsView />}
      </div>

      {/* Conversations Drawer */}
      <AiConversationsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        selectedConversationId={selectedConversationId}
        onSelectConversation={handleSelectConversation}
      />
    </div>
  );
}
