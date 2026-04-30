/**
 * Exporta todos os componentes genéricos compartilhados
 * Facilita importação em páginas de entidades
 */

// Forms
export { AttributeManager } from './forms/attribute-manager';
export { DynamicFormField } from './forms/dynamic-form-field';
export { EntityForm } from './forms/entity-form';

// Viewers
export { EntityViewer } from './viewers/entity-viewer';

// Modals
export { HelpModal } from './modals/help-modal';
export type { FAQItem } from './modals/help-modal';
export { ImportModal } from './modals/import-modal';
export { MultiViewModal } from './modals/multi-view-modal';
export { QuickCreateModal } from './modals/quick-create-modal';

// Grid Components
export { EntityGrid } from './grid/entity-grid';
export type { ViewMode } from './grid/entity-grid';

// Context Menu
export { EntityContextMenu } from './context-menu/entity-context-menu';

// Search Components
export { SearchSection } from './search/search-section';

// Stats Components
export { StatsSection } from './stats/stats-section';

// Progress Components
export { BatchProgressDialog } from './progress/batch-progress-dialog';

// User Components
export { UserAvatar } from './user-avatar';

// Types
export type {
  AttributeConfig,
  EntityCardConfig,
  EntityFormConfig,
  EntityFormRef,
  EntityGridConfig,
  EntityViewerConfig,
  FormFieldConfig,
  MultiViewModalConfig,
  SearchSectionConfig,
  PageHeaderConfig as SharedPageHeaderConfig,
  ViewFieldConfig,
} from '@/types/entity-config';
