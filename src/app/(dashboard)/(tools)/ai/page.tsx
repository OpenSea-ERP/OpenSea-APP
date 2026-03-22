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

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Action Bar with buttons — shrink-0 to keep fixed height */}
      <div className="shrink-0">
        <PageActionBar
          breadcrumbItems={[
            { label: 'Ferramentas' },
            { label: 'Assistente IA' },
          ]}
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
      </div>

      {/* Hero Banner — shrink-0 to keep fixed height */}
      <div className="shrink-0 px-4 pt-3">
        <AiHeroBanner
          activeView={activeView}
          onViewChange={setActiveView}
        />
      </div>

      {/* Dynamic content area — flex-1 min-h-0 to fill remaining space without overflow */}
      <div className="flex-1 min-h-0 flex flex-col mt-3">
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
