# Notifications (Frontend)

Sistema de notificações consumido em três pontos da UI.

> Atualizado no Sprint 3 (2026-04-18).

## Pontos de consumo

| Lugar                        | Componente          | Observação                                                                              |
| ---------------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| Navbar (sino)                | `NotificationsBell` | Dropdown com últimas 30, `aria-live="polite"` no badge, link "Ver todas"                |
| `/notifications` (tool)      | `NotificationsPage` | Lista completa com infinite scroll (IntersectionObserver), filtros read/kind            |
| `/profile?tab=notifications` | `NotificationsTab`  | Preferências granulares: DND, canais master, grid por módulo × categoria × canal × freq |

## Estrutura

```
src/features/notifications/
├── components/
│   ├── notifications-bell.tsx
│   ├── notification-socket-listener.tsx     (escuta socket.io global)
│   ├── preferences/
│   │   ├── module-preferences-grid.tsx
│   │   ├── category-channel-row.tsx
│   │   └── frequency-picker.tsx
│   └── renderers/
│       └── notification-item.tsx            (render por kind, sanitização)
├── hooks/
│   ├── use-notifications-v2.ts              (list + infinite + mark-read)
│   ├── use-notification-preferences.ts      (settings + preferences + resolve)
│   ├── use-notification-socket.ts           (invalidação por socket event)
│   └── use-push-subscription.ts             (Web Push VAPID opt-in)
├── services/
│   └── notifications-v2.service.ts
├── types/
│   └── index.ts
└── utils/
    └── sanitize.ts                           (dompurify + URL allow-list)
```

## Kinds renderizados

`NotificationItem` lida com todos os tipos via `KindRenderer`:

- `INFORMATIONAL` — apenas title + message
- `LINK` — botão "Abrir" com `actionUrl`
- `ACTIONABLE` / `APPROVAL` — botões de ação inline; APPROVAL exige motivo em destructive
- `FORM` — formulário inline (compact → botão que abre expand, não-compact → form inline)
- `PROGRESS` — barra de progresso + link "Ver detalhes"
- `SYSTEM_BANNER` — apenas title + message (destaque visual)
- `IMAGE_BANNER` — imagem + CTA
- `REPORT` — card com nome, formato, tamanho, período + botão de download
- `EMAIL_PREVIEW` — card com remetente, assunto, preview + "Abrir no e-mail"

## Segurança

- `sanitizeText()` — `dompurify` strip HTML, aplicado a title, message, action labels, field labels, email subject/preview, report name/period, resolved action
- `sanitizeUrl()` — allow-list de protocolos: `https?://`, `mailto:`, `tel:` + caminhos relativos (`/` ou `#`). URLs `javascript:` / `data:` são descartadas
- React já escapa texto em JSX, mas a sanitização extra é defense in depth

## Acessibilidade

- `notifications-bell.tsx`:
  - `aria-label` dinâmico reflete contagem de não-lidas
  - badge com `role="status"`, `aria-live="polite"`, `aria-atomic="true"` — leitores de tela anunciam quando chega nova notificação
- `notification-item.tsx`:
  - cliques só navegam via handler (não usa `window.location`); ignora cliques em children interativos
  - formulários têm `<label>` ligado visualmente
  - botões de ação têm texto visível (não são apenas ícones)

## RBAC

Preferências e dispositivos são gated via `useMultiplePermissions`:

```tsx
const perms = useMultiplePermissions({
  canRead: 'tools.notifications.preferences.access',
  canModify: 'tools.notifications.preferences.modify',
  canManageDevices: 'tools.notifications.devices.admin',
});
```

- `canRead === false` → empty state "sem permissão"
- `canModify === false` → Switches ficam `disabled`
- `canManageDevices === false` → seção de dispositivos + push opt-in escondidos

## Hooks principais

### Listagem

```tsx
// Single page (dropdown do sino)
const { data, isLoading } = useNotificationsListV2({ limit: 30 });

// Infinite scroll (página)
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
  useNotificationsInfiniteV2({ limit: 30, isRead: false });
```

### Mutations

```tsx
const markRead = useMarkNotificationReadV2();
const markAllRead = useMarkAllReadV2();
const del = useDeleteNotificationV2();
const resolve = useResolveNotification();
```

### Preferências

```tsx
const settings = useNotificationSettings(); // global user
const prefs = useNotificationPreferencesBundle(); // module × category × channel
const manifest = useNotificationModulesManifest(); // catálogo de módulos+categorias
const update = useUpdateNotificationPreferences(); // bulk upsert
const devices = usePushDevices();
const push = usePushSubscription(); // subscribe + unsubscribe web-push
```

## Patterns

- **Infinite scroll** obrigatório na página (`useInfiniteQuery` + `IntersectionObserver`). Segue o padrão global (nunca page numbers).
- **Skeleton loading** em lugar de spinner único.
- **Empty state** com `<Bell>` + texto contextual (diferente para filter "unread" vs "all").
- **Error state** ainda usa retry automatico do React Query — não foi explicitado um GridError visual nessa página ainda (TODO futuro).

## Integração socket.io

`NotificationSocketListener` é montado uma única vez no layout do dashboard. Ao receber `notification.created|updated|resolved|progress`, ele invalida a query key `['notifications']`, forçando refetch automático.

## Testes (S3.2 planejado)

- `notification-item.test.tsx` — cada kind renderiza + sanitização XSS
- `page.test.tsx` — filtros, empty, error, infinite scroll
- `notifications-tab.test.tsx` — persistência de prefs

Estratégia: MSW mock (decisão upfront do Sprint 3).

## Referências

- Backend: `OpenSea-API/docs/modules/notifications.md`
- Status Sprint 3: `memory/project_notifications_refactor_status.md`
- Protocolo: `src/features/notifications/types/index.ts`
