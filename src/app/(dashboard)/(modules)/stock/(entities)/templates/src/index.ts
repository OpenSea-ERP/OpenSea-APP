/**
 * Templates Module Index
 * Exportações centralizadas de todo o módulo de templates
 */

// Components
export * from './components';
export { TemplateForm, type TemplateFormRef } from './components/template-form';
export { TemplateViewer } from './components/template-viewer';

// Constants
export * from './constants';
export { getUnitLabel, UNIT_LABELS } from './constants/unit-labels';

// Config
export { templatesConfig } from './config/templates.config';

// Modals
export * from './modals';
export { CreateModal } from './modals/create-modal';
export { DeleteConfirmModal } from './modals/delete-confirm-modal';
export { DuplicateConfirmModal } from './modals/duplicate-confirm-modal';
export { EditModal } from './modals/edit-modal';
export { RenameTemplateModal } from './modals/rename-template-modal';
export { ViewModal } from './modals/view-modal';

// Types
export {
  type MultiViewModalProps,
  type TemplateFormData,
  type TemplateSelectionContext,
} from './types/templates.types';

// Utils
export * from './utils';
export {
  cleanTemplateData,
  countTemplateAttributes,
  formatTemplateInfo,
  hasCareInstructions,
  isValidTemplate,
} from './utils/template.utils';
export {
  createTemplate,
  deleteTemplate,
  duplicateTemplate,
  updateTemplate,
} from './utils/templates.crud';
