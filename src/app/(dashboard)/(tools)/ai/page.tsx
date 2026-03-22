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

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <PageActionBar
        breadcrumbItems={[
          { label: 'Ferramentas' },
          { label: 'Assistente IA' },
        ]}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 pt-5">
          <AiHeroBanner
            activeView={activeView}
            onViewChange={setActiveView}
            onOpenConversations={() => setDrawerOpen(true)}
          />
        </div>

        <div className="flex-1 flex flex-col min-h-0 mt-4">
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
      </div>

      <AiConversationsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        selectedConversationId={selectedConversationId}
        onSelectConversation={handleSelectConversation}
      />
    </div>
  );
}
