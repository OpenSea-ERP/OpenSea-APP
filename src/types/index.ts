// Module barrel re-exports
export * from './admin';
export * from './auth';
export * from './calendar';
export * from './cashier';
export * from './common';
export * from './core';
export * from './email';
// Finance has naming collisions with other module barrels.
// Import finance types directly from '@/types/finance'.
export * from './messaging';
export * from './fiscal';
// HR has naming collisions with finance (e.g., BankAccountType).
// Import HR types directly from '@/types/hr'.
export * from './esocial';
export * from './sales';
export * from './stock';
export * from './storage';
export * from './system';
// Tasks has naming conflicts with sales (Comment, CreateCommentRequest, UpdateCommentRequest).
// Import from '@/types/tasks' directly for task-specific types.
export {
  type CardActivity,
  type CardActivityType,
  type ActivitiesQuery,
  type CardAttachment,
  type AttachmentFile,
  type AddAttachmentRequest,
  type BoardAutomation,
  type AutomationTrigger,
  type AutomationAction,
  type CreateAutomationRequest,
  type Board,
  type BoardType,
  type BoardVisibility,
  type CreateBoardRequest,
  type UpdateBoardRequest,
  type BoardsQuery,
  type Card,
  type CardStatus,
  type CardPriority,
  type CreateCardRequest,
  type UpdateCardRequest,
  type MoveCardRequest,
  type CardsQuery,
  type Checklist,
  type ChecklistItem,
  type CreateChecklistRequest,
  type CreateChecklistItemRequest,
  type Column,
  type CreateColumnRequest,
  type UpdateColumnRequest,
  type ReorderColumnsRequest,
  type CustomField,
  type CustomFieldType,
  type CardCustomFieldValue,
  type SetCustomFieldValueRequest,
  type Label,
  type CreateLabelRequest,
  type UpdateLabelRequest,
  type BoardMember,
  type BoardMemberRole,
  type AddBoardMemberRequest,
  type UpdateBoardMemberRequest,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
} from './tasks';

// RBAC has naming conflicts with auth (Permission, PermissionGroup)
// and common (PaginatedResponse). Import from '@/types/rbac' directly
// for the RBAC-specific versions.
export {
  type AddPermissionToGroupDTO,
  type AllPermissionsResponse,
  type ApiResponse,
  type AssignGroupToUserDTO,
  type CreatePermissionDTO,
  type CreatePermissionGroupDTO,
  type EffectivePermission,
  type GroupWithExpiration,
  type ListPermissionGroupsQuery,
  type ListPermissionsQuery,
  type PermissionAction,
  type PermissionEffect,
  type PermissionGroupDetailResponse,
  type PermissionGroupResponse,
  type PermissionGroupWithChildren,
  type PermissionGroupWithDetails,
  type PermissionItemSimple,
  type PermissionModule,
  type PermissionModuleGroup,
  type PermissionResourceGroup,
  type PermissionResponse,
  type PermissionWithEffect,
  type PermissionsByModule,
  type SuccessResponse,
  type UpdatePermissionDTO,
  type UpdatePermissionGroupDTO,
  type UserInGroup,
} from './rbac';
