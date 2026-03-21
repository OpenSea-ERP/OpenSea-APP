export const apiConfig = {
  // Usa 127.0.0.1 como fallback para evitar problemas com IPv6 no Windows
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3333',
  timeout: 30000, // Aumentado de 10s para 30s
  headers: {
    'Content-Type': 'application/json',
  },
};

export const authConfig = {
  tokenKey: 'auth_token',
  refreshTokenKey: 'refresh_token',
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/v1/auth/login/password',
    LOGIN_PIN: '/v1/auth/login/pin',
    REGISTER: '/v1/auth/register/password',
    SEND_PASSWORD_RESET: '/v1/auth/send/password',
    RESET_PASSWORD: '/v1/auth/reset/password',
  },
  // Auth - Force Password Reset
  FORCE_PASSWORD_RESET: {
    REQUEST: (userId: string) => `/v1/users/${userId}/force-password-reset`,
  },
  // Me (Profile)
  ME: {
    GET: '/v1/me',
    UPDATE: '/v1/me',
    UPDATE_EMAIL: '/v1/me/email',
    UPDATE_USERNAME: '/v1/me/username',
    UPDATE_PASSWORD: '/v1/me/password',
    DELETE: '/v1/me',
    UPLOAD_AVATAR: '/v1/me/avatar',
    // PIN
    SET_ACCESS_PIN: '/v1/me/access-pin',
    SET_ACTION_PIN: '/v1/me/action-pin',
    VERIFY_ACTION_PIN: '/v1/me/verify-action-pin',
    // Employee
    EMPLOYEE: '/v1/me/employee',
    // Audit Logs
    AUDIT_LOGS: '/v1/me/audit-logs',
    // Permissions
    PERMISSIONS: '/v1/me/permissions',
    GROUPS: '/v1/me/groups',
  },
  // Sessions
  SESSIONS: {
    LIST_MY: '/v1/sessions/me',
    LIST_USER: (userId: string) => `/v1/sessions/user/${userId}`,
    LIST_USER_BY_DATE: (userId: string) =>
      `/v1/sessions/user/${userId}/by-date`,
    LIST_ACTIVE: '/v1/sessions/active',
    REFRESH: '/v1/sessions/refresh',
    LOGOUT: '/v1/sessions/logout',
    REVOKE: (sessionId: string) => `/v1/sessions/${sessionId}/revoke`,
    EXPIRE: (sessionId: string) => `/v1/sessions/${sessionId}/expire`,
  },
  // Users
  USERS: {
    LIST: '/v1/users',
    GET: (userId: string) => `/v1/users/${userId}`,
    GET_BY_EMAIL: (email: string) => `/v1/users/email/${email}`,
    GET_BY_USERNAME: (username: string) => `/v1/users/username/${username}`,
    GET_ONLINE: '/v1/users/online',
    CREATE: '/v1/users',
    UPDATE_EMAIL: (userId: string) => `/v1/users/${userId}/email`,
    UPDATE_USERNAME: (userId: string) => `/v1/users/${userId}/username`,
    UPDATE_PASSWORD: (userId: string) => `/v1/users/${userId}/password`,
    UPDATE_PROFILE: (userId: string) => `/v1/users/${userId}`,
    DELETE: (userId: string) => `/v1/users/${userId}`,
    FORCE_ACCESS_PIN_RESET: (userId: string) =>
      `/v1/users/${userId}/force-access-pin-reset`,
    FORCE_ACTION_PIN_RESET: (userId: string) =>
      `/v1/users/${userId}/force-action-pin-reset`,
  },
  // HR - Employees
  EMPLOYEES: {
    LIST: '/v1/hr/employees',
    GET: (id: string) => `/v1/hr/employees/${id}`,
    CREATE: '/v1/hr/employees',
    UPDATE: (id: string) => `/v1/hr/employees/${id}`,
    DELETE: (id: string) => `/v1/hr/employees/${id}`,
    LABEL_DATA: '/v1/hr/employees/label-data',
    UPLOAD_PHOTO: (id: string) => `/v1/hr/employees/${id}/photo`,
    DELETE_PHOTO: (id: string) => `/v1/hr/employees/${id}/photo`,
  },
  // Admin - Companies
  COMPANIES: {
    LIST: '/v1/admin/companies',
    GET: (id: string) => `/v1/admin/companies/${id}`,
    CREATE: '/v1/admin/companies',
    UPDATE: (id: string) => `/v1/admin/companies/${id}`,
    DELETE: (id: string) => `/v1/admin/companies/${id}`,
    CHECK_CNPJ: '/v1/admin/companies/check-cnpj',
  },
  // Stock - Products
  PRODUCTS: {
    LIST: '/v1/products',
    GET: (productId: string) => `/v1/products/${productId}`,
    CREATE: '/v1/products',
    UPDATE: (productId: string) => `/v1/products/${productId}`,
    DELETE: (productId: string) => `/v1/products/${productId}`,
  },
  // Stock - Variants
  VARIANTS: {
    LIST: '/v1/variants',
    GET: (id: string) => `/v1/variants/${id}`,
    CREATE: '/v1/variants',
    UPDATE: (id: string) => `/v1/variants/${id}`,
    DELETE: (id: string) => `/v1/variants/${id}`,
    BY_PRODUCT: (productId: string) => `/v1/products/${productId}/variants`,
  },
  // Stock - Items
  ITEMS: {
    LIST: '/v1/items',
    GET: (itemId: string) => `/v1/items/${itemId}`,
    DELETE: (itemId: string) => `/v1/items/${itemId}`,
    BY_VARIANT: (variantId: string) => `/v1/items/by-variant/${variantId}`,
    BY_PRODUCT: (productId: string) => `/v1/items/by-product/${productId}`,
    ENTRY: '/v1/items/entry',
    EXIT: '/v1/items/exit',
    TRANSFER: '/v1/items/transfer',
    BATCH_TRANSFER: '/v1/items/batch-transfer',
    LOCATION_HISTORY: (itemId: string) =>
      `/v1/items/${itemId}/location-history`,
    LABEL_DATA: '/v1/items/label-data',
  },
  // Stock - Item Movements
  ITEM_MOVEMENTS: {
    LIST: '/v1/item-movements',
  },
  // Stock - Categories
  CATEGORIES: {
    LIST: '/v1/categories',
    GET: (id: string) => `/v1/categories/${id}`,
    CREATE: '/v1/categories',
    UPDATE: (id: string) => `/v1/categories/${id}`,
    DELETE: (id: string) => `/v1/categories/${id}`,
    REORDER: '/v1/categories/reorder',
  },
  // Stock - Manufacturers
  MANUFACTURERS: {
    LIST: '/v1/manufacturers',
    GET: (id: string) => `/v1/manufacturers/${id}`,
    CREATE: '/v1/manufacturers',
    UPDATE: (id: string) => `/v1/manufacturers/${id}`,
    DELETE: (id: string) => `/v1/manufacturers/${id}`,
  },
  // Stock - Suppliers
  SUPPLIERS: {
    LIST: '/v1/suppliers',
    GET: (id: string) => `/v1/suppliers/${id}`,
    CREATE: '/v1/suppliers',
    UPDATE: (id: string) => `/v1/suppliers/${id}`,
    DELETE: (id: string) => `/v1/suppliers/${id}`,
  },
  // Stock - Tags
  TAGS: {
    LIST: '/v1/tags',
    GET: (id: string) => `/v1/tags/${id}`,
    CREATE: '/v1/tags',
    UPDATE: (id: string) => `/v1/tags/${id}`,
    DELETE: (id: string) => `/v1/tags/${id}`,
  },
  // Stock - Templates
  TEMPLATES: {
    LIST: '/v1/templates',
    GET: (id: string) => `/v1/templates/${id}`,
    CREATE: '/v1/templates',
    UPDATE: (id: string) => `/v1/templates/${id}`,
    DELETE: (id: string) => `/v1/templates/${id}`,
  },
  // Stock - Purchase Orders
  PURCHASE_ORDERS: {
    LIST: '/v1/purchase-orders',
    GET: (id: string) => `/v1/purchase-orders/${id}`,
    CREATE: '/v1/purchase-orders',
    UPDATE_STATUS: (id: string) => `/v1/purchase-orders/${id}/status`,
  },
  // Stock - Volumes
  VOLUMES: {
    LIST: '/v1/volumes',
    GET: (id: string) => `/v1/volumes/${id}`,
    CREATE: '/v1/volumes',
    UPDATE: (id: string) => `/v1/volumes/${id}`,
    DELETE: (id: string) => `/v1/volumes/${id}`,
    ADD_ITEM: (id: string) => `/v1/volumes/${id}/items`,
    REMOVE_ITEM: (volumeId: string, itemId: string) =>
      `/v1/volumes/${volumeId}/items/${itemId}`,
    CLOSE: (id: string) => `/v1/volumes/${id}/close`,
    REOPEN: (id: string) => `/v1/volumes/${id}/reopen`,
    DELIVER: (id: string) => `/v1/volumes/${id}/deliver`,
    RETURN: (id: string) => `/v1/volumes/${id}/return`,
    ROMANEIO: (id: string) => `/v1/volumes/${id}/romaneio`,
    SCAN: '/v1/volumes/scan',
  },
  // Stock - Serialized Labels
  SERIALIZED_LABELS: {
    LIST: '/v1/serialized-labels',
    GET: (code: string) => `/v1/serialized-labels/${code}`,
    GENERATE: '/v1/serialized-labels/generate',
    LINK: (code: string) => `/v1/serialized-labels/${code}/link`,
    VOID: (code: string) => `/v1/serialized-labels/${code}/void`,
  },
  // Stock - Labels Generation
  LABELS: {
    GENERATE: '/v1/labels/generate',
  },
  // Stock - Movements (Extended)
  MOVEMENTS: {
    LIST: '/v1/item-movements',
    HISTORY: '/v1/movements/history',
    PRODUCT_HISTORY: (productId: string) =>
      `/v1/products/${productId}/movements`,
    VARIANT_HISTORY: (variantId: string) =>
      `/v1/variants/${variantId}/movements`,
    BIN_HISTORY: (binId: string) => `/v1/bins/${binId}/movements`,
    PENDING_APPROVAL: '/v1/movements/pending-approval',
    APPROVE: (id: string) => `/v1/movements/${id}/approve`,
    REJECT: (id: string) => `/v1/movements/${id}/reject`,
    APPROVE_BATCH: '/v1/movements/approve/batch',
  },
  // Stock - Inventory Cycles
  INVENTORY: {
    CYCLES_LIST: '/v1/inventory-cycles',
    CYCLES_GET: (id: string) => `/v1/inventory-cycles/${id}`,
    CYCLES_CREATE: '/v1/inventory-cycles',
    CYCLES_START: (id: string) => `/v1/inventory-cycles/${id}/start`,
    CYCLES_COMPLETE: (id: string) => `/v1/inventory-cycles/${id}/complete`,
    CYCLES_COUNTS: (id: string) => `/v1/inventory-cycles/${id}/counts`,
    COUNT_SUBMIT: (countId: string) => `/v1/inventory-counts/${countId}/count`,
    COUNT_ADJUST: (countId: string) => `/v1/inventory-counts/${countId}/adjust`,
  },
  // Stock - Import
  IMPORT: {
    VALIDATE: '/v1/import/validate',
    PRODUCTS: '/v1/import/products',
    VARIANTS: '/v1/import/variants',
    ITEMS: '/v1/import/items',
    TEMPLATE: (type: string) => `/v1/import/templates/${type}`,
    VARIANTS_BATCH: '/v1/variants/batch',
    ITEMS_ENTRY_BATCH: '/v1/items/entry/batch',
    ITEMS_TRANSFER_BATCH: '/v1/items/transfer/batch',
    PRODUCTS_BULK_VALIDATE: '/v1/products/bulk/validate',
    PRODUCTS_BULK: '/v1/products/bulk',
    VARIANTS_BULK_VALIDATE: '/v1/variants/bulk/validate',
    VARIANTS_BULK: '/v1/variants/bulk',
  },
  // Stock - Scan
  SCAN: {
    SINGLE: '/v1/scan',
    BATCH: '/v1/scan/batch',
  },
  // Stock - Analytics & Dashboard
  ANALYTICS: {
    STOCK_SUMMARY: '/v1/analytics/stock-summary',
    MOVEMENTS_SUMMARY: '/v1/analytics/movements-summary',
    ABC_CURVE: '/v1/analytics/abc-curve',
    STOCK_TURNOVER: '/v1/analytics/stock-turnover',
    DASHBOARD: '/v1/dashboard/stock',
  },
  // Sales - Customers
  CUSTOMERS: {
    LIST: '/v1/customers',
    GET: (id: string) => `/v1/customers/${id}`,
    CREATE: '/v1/customers',
    UPDATE: (id: string) => `/v1/customers/${id}`,
    DELETE: (id: string) => `/v1/customers/${id}`,
  },
  // Sales - Contacts
  CONTACTS: {
    LIST: '/v1/contacts',
    GET: (id: string) => `/v1/contacts/${id}`,
    CREATE: '/v1/contacts',
    UPDATE: (id: string) => `/v1/contacts/${id}`,
    DELETE: (id: string) => `/v1/contacts/${id}`,
  },
  // Sales - Pipelines
  PIPELINES: {
    LIST: '/v1/pipelines',
    GET: (id: string) => `/v1/pipelines/${id}`,
    CREATE: '/v1/pipelines',
    UPDATE: (id: string) => `/v1/pipelines/${id}`,
    DELETE: (id: string) => `/v1/pipelines/${id}`,
    STAGES: {
      LIST: (pipelineId: string) => `/v1/pipelines/${pipelineId}/stages`,
      CREATE: (pipelineId: string) => `/v1/pipelines/${pipelineId}/stages`,
      UPDATE: (stageId: string) => `/v1/pipeline-stages/${stageId}`,
      DELETE: (stageId: string) => `/v1/pipeline-stages/${stageId}`,
      REORDER: (pipelineId: string) =>
        `/v1/pipelines/${pipelineId}/stages/reorder`,
    },
  },
  // Sales - Price Tables
  PRICE_TABLES: {
    LIST: '/v1/price-tables',
    GET: (id: string) => `/v1/price-tables/${id}`,
    CREATE: '/v1/price-tables',
    UPDATE: (id: string) => `/v1/price-tables/${id}`,
    DELETE: (id: string) => `/v1/price-tables/${id}`,
    ITEMS: (id: string) => `/v1/price-tables/${id}/items`,
    UPSERT_ITEM: (id: string) => `/v1/price-tables/${id}/items`,
    RESOLVE: '/v1/price-resolver',
  },
  // Sales - Customer Prices
  CUSTOMER_PRICES: {
    LIST: '/v1/customer-prices',
    CREATE: '/v1/customer-prices',
    UPDATE: (id: string) => `/v1/customer-prices/${id}`,
    DELETE: (id: string) => `/v1/customer-prices/${id}`,
  },
  // Sales - Campaigns
  CAMPAIGNS: {
    LIST: '/v1/campaigns',
    GET: (id: string) => `/v1/campaigns/${id}`,
    CREATE: '/v1/campaigns',
    UPDATE: (id: string) => `/v1/campaigns/${id}`,
    DELETE: (id: string) => `/v1/campaigns/${id}`,
    ACTIVATE: (id: string) => `/v1/campaigns/${id}/activate`,
  },
  // Sales - Coupons
  COUPONS: {
    LIST: '/v1/coupons',
    CREATE: '/v1/coupons',
    DELETE: (id: string) => `/v1/coupons/${id}`,
    VALIDATE: '/v1/coupons/validate',
  },
  // Sales - Combos
  COMBOS: {
    LIST: '/v1/combos',
    GET: (id: string) => `/v1/combos/${id}`,
    CREATE: '/v1/combos',
    DELETE: (id: string) => `/v1/combos/${id}`,
  },
  // Sales - Sales Orders
  SALES_ORDERS: {
    LIST: '/v1/sales-orders',
    GET: (id: string) => `/v1/sales-orders/${id}`,
    CREATE: '/v1/sales-orders',
    UPDATE_STATUS: (id: string) => `/v1/sales-orders/${id}/status`,
    CANCEL: (id: string) => `/v1/sales-orders/${id}/cancel`,
    DELETE: (id: string) => `/v1/sales-orders/${id}`,
  },
  // Sales - Orders (new pipeline-based)
  ORDERS: {
    LIST: '/v1/orders',
    GET: (id: string) => `/v1/orders/${id}`,
    CREATE: '/v1/orders',
    UPDATE: (id: string) => `/v1/orders/${id}`,
    DELETE: (id: string) => `/v1/orders/${id}`,
    CONFIRM: (id: string) => `/v1/orders/${id}/confirm`,
    CANCEL: (id: string) => `/v1/orders/${id}/cancel`,
    CHANGE_STAGE: (id: string) => `/v1/orders/${id}/stage`,
    CONVERT_QUOTE: (id: string) => `/v1/orders/${id}/convert-quote`,
  },
  // Sales - Payment Conditions
  PAYMENT_CONDITIONS: {
    LIST: '/v1/payment-conditions',
    CREATE: '/v1/payment-conditions',
    UPDATE: (id: string) => `/v1/payment-conditions/${id}`,
    DELETE: (id: string) => `/v1/payment-conditions/${id}`,
  },
  // Sales - Order Returns
  RETURNS: {
    LIST: '/v1/returns',
    CREATE: '/v1/returns',
    APPROVE: (id: string) => `/v1/returns/${id}/approve`,
  },
  // Sales - Store Credits
  STORE_CREDITS: {
    BALANCE: '/v1/store-credits/balance',
    CREATE: '/v1/store-credits',
  },
  // Sales - Comments
  COMMENTS: {
    LIST: (salesOrderId: string) => `/v1/comments/${salesOrderId}`,
    GET: (commentId: string) => `/v1/comments/comment/${commentId}`,
    CREATE: '/v1/comments',
    UPDATE: (commentId: string) => `/v1/comments/${commentId}`,
    DELETE: (commentId: string) => `/v1/comments/${commentId}`,
  },
  // Sales - Variant Promotions
  VARIANT_PROMOTIONS: {
    LIST: '/v1/variant-promotions',
    GET: (id: string) => `/v1/variant-promotions/${id}`,
    CREATE: '/v1/variant-promotions',
    UPDATE: (id: string) => `/v1/variant-promotions/${id}`,
    DELETE: (id: string) => `/v1/variant-promotions/${id}`,
  },
  // Sales - Item Reservations
  ITEM_RESERVATIONS: {
    LIST: '/v1/item-reservations',
    GET: (id: string) => `/v1/item-reservations/${id}`,
    CREATE: '/v1/item-reservations',
    RELEASE: (id: string) => `/v1/item-reservations/${id}/release`,
  },
  // Sales - Notification Preferences
  NOTIFICATION_PREFERENCES: {
    LIST: '/v1/notification-preferences',
    GET: (id: string) => `/v1/notification-preferences/${id}`,
    LIST_USER: (userId: string) =>
      `/v1/notification-preferences/user/${userId}`,
    CREATE: '/v1/notification-preferences',
    UPDATE: (id: string) => `/v1/notification-preferences/${id}`,
    DELETE: (id: string) => `/v1/notification-preferences/${id}`,
  },
  // Sales - Catalogs
  CATALOGS: {
    LIST: '/v1/catalogs',
    GET: (id: string) => `/v1/catalogs/${id}`,
    CREATE: '/v1/catalogs',
    UPDATE: (id: string) => `/v1/catalogs/${id}`,
    DELETE: (id: string) => `/v1/catalogs/${id}`,
    ADD_ITEM: (catalogId: string) => `/v1/catalogs/${catalogId}/items`,
    REMOVE_ITEM: (catalogId: string, itemId: string) =>
      `/v1/catalogs/${catalogId}/items/${itemId}`,
  },
  // Sales - Brand
  BRAND: {
    GET: '/v1/brand',
    UPDATE: '/v1/brand',
  },
  // Sales - Content
  CONTENT: {
    LIST: '/v1/content',
    GET: (id: string) => `/v1/content/${id}`,
    GENERATE: '/v1/content/generate',
    DELETE: (id: string) => `/v1/content/${id}`,
    APPROVE: (id: string) => `/v1/content/${id}/approve`,
  },
  // Email
  EMAIL: {
    ACCOUNTS: {
      LIST: '/v1/email/accounts',
      GET: (id: string) => `/v1/email/accounts/${id}`,
      CREATE: '/v1/email/accounts',
      UPDATE: (id: string) => `/v1/email/accounts/${id}`,
      DELETE: (id: string) => `/v1/email/accounts/${id}`,
      TEST: (id: string) => `/v1/email/accounts/${id}/test`,
      SYNC: (id: string) => `/v1/email/accounts/${id}/sync`,
      HEALTH: (id: string) => `/v1/email/accounts/${id}/health`,
      SHARE: (id: string) => `/v1/email/accounts/${id}/share`,
      UNSHARE: (id: string, userId: string) =>
        `/v1/email/accounts/${id}/share/${userId}`,
    },
    FOLDERS: {
      LIST: '/v1/email/folders',
    },
    MESSAGES: {
      LIST: '/v1/email/messages',
      CENTRAL_INBOX: '/v1/email/messages/central-inbox',
      GET: (id: string) => `/v1/email/messages/${id}`,
      DRAFT: '/v1/email/messages/draft',
      SEND: '/v1/email/messages/send',
      MARK_READ: (id: string) => `/v1/email/messages/${id}/read`,
      MOVE: (id: string) => `/v1/email/messages/${id}/move`,
      DELETE: (id: string) => `/v1/email/messages/${id}`,
      ATTACHMENT_DOWNLOAD: (messageId: string, attachmentId: string) =>
        `/v1/email/messages/${messageId}/attachments/${attachmentId}/download`,
      TOGGLE_FLAG: (id: string) => `/v1/email/messages/${id}/flag`,
      THREAD: (id: string) => `/v1/email/messages/${id}/thread`,
      SUGGEST_CONTACTS: '/v1/email/messages/contacts/suggest',
    },
  },
  // RBAC - Permissions
  RBAC: {
    PERMISSIONS: {
      LIST: '/v1/rbac/permissions',
      LIST_ALL: '/v1/rbac/permissions/all',
      GET: (id: string) => `/v1/rbac/permissions/${id}`,
      GET_BY_CODE: (code: string) => `/v1/rbac/permissions/code/${code}`,
      CREATE: '/v1/rbac/permissions',
      UPDATE: (id: string) => `/v1/rbac/permissions/${id}`,
      DELETE: (id: string) => `/v1/rbac/permissions/${id}`,
    },
    GROUPS: {
      LIST: '/v1/rbac/permission-groups',
      GET: (id: string) => `/v1/rbac/permission-groups/${id}`,
      CREATE: '/v1/rbac/permission-groups',
      UPDATE: (id: string) => `/v1/rbac/permission-groups/${id}`,
      DELETE: (id: string) => `/v1/rbac/permission-groups/${id}`,
      PERMISSIONS: (groupId: string) =>
        `/v1/rbac/permission-groups/${groupId}/permissions`,
      PERMISSIONS_BULK: (groupId: string) =>
        `/v1/rbac/permission-groups/${groupId}/permissions/bulk`,
      REMOVE_PERMISSION: (groupId: string, code: string) =>
        `/v1/rbac/permission-groups/${groupId}/permissions/${code}`,
      USERS: (groupId: string) => `/v1/rbac/permission-groups/${groupId}/users`,
    },
    USERS: {
      GROUPS: (userId: string) => `/v1/rbac/users/${userId}/groups`,
      REMOVE_GROUP: (userId: string, groupId: string) =>
        `/v1/rbac/users/${userId}/groups/${groupId}`,
      PERMISSIONS: (userId: string) => `/v1/rbac/users/${userId}/permissions`,
    },
  },
  // Audit Logs
  AUDIT: {
    LIST: '/v1/audit-logs',
    HISTORY: (entity: string, entityId: string) =>
      `/v1/audit-logs/history/${entity}/${entityId}`,
    ROLLBACK_PREVIEW: (entity: string, entityId: string) =>
      `/v1/audit-logs/rollback/preview/${entity}/${entityId}`,
    COMPARE: (entity: string, entityId: string) =>
      `/v1/audit-logs/compare/${entity}/${entityId}`,
  },
  // Tenants
  TENANTS: {
    LIST_MY: '/v1/auth/tenants',
    SELECT: '/v1/auth/select-tenant',
  },
  // Admin
  ADMIN: {
    DASHBOARD: '/v1/admin/dashboard',
    TENANTS: {
      LIST: '/v1/admin/tenants',
      GET: (id: string) => `/v1/admin/tenants/${id}`,
      CREATE: '/v1/admin/tenants',
      UPDATE: (id: string) => `/v1/admin/tenants/${id}`,
      DELETE: (id: string) => `/v1/admin/tenants/${id}`,
      CHANGE_STATUS: (id: string) => `/v1/admin/tenants/${id}/status`,
      CHANGE_PLAN: (id: string) => `/v1/admin/tenants/${id}/plan`,
      FEATURE_FLAGS: (id: string) => `/v1/admin/tenants/${id}/feature-flags`,
      USERS: (id: string) => `/v1/admin/tenants/${id}/users`,
      CREATE_USER: (id: string) => `/v1/admin/tenants/${id}/users`,
      REMOVE_USER: (id: string, userId: string) =>
        `/v1/admin/tenants/${id}/users/${userId}`,
      SET_SECURITY_KEY: (id: string, userId: string) =>
        `/v1/admin/tenants/${id}/users/${userId}/security-key`,
    },
    PLANS: {
      LIST: '/v1/admin/plans',
      GET: (id: string) => `/v1/admin/plans/${id}`,
      CREATE: '/v1/admin/plans',
      UPDATE: (id: string) => `/v1/admin/plans/${id}`,
      DELETE: (id: string) => `/v1/admin/plans/${id}`,
      SET_MODULES: (id: string) => `/v1/admin/plans/${id}/modules`,
    },
    // Catalog (Skills)
    CATALOG: {
      SKILLS: '/v1/admin/catalog/skills',
      SKILL_TREE: '/v1/admin/catalog/skills/tree',
      PRICING: '/v1/admin/catalog/pricing',
      UPSERT_PRICING: (skillCode: string) =>
        `/v1/admin/catalog/pricing/${skillCode}`,
    },
    // Tenant Subscriptions
    SUBSCRIPTIONS: {
      GET: (tenantId: string) => `/v1/admin/tenants/${tenantId}/subscription`,
      ADD: (tenantId: string) => `/v1/admin/tenants/${tenantId}/subscription`,
      REMOVE: (tenantId: string, skillCode: string) =>
        `/v1/admin/tenants/${tenantId}/subscription/${skillCode}`,
      DISCOUNT: (tenantId: string) => `/v1/admin/tenants/${tenantId}/discount`,
      CONSUMPTION: (tenantId: string) =>
        `/v1/admin/tenants/${tenantId}/consumption`,
      OVERRIDE_LIMIT: (tenantId: string) =>
        `/v1/admin/tenants/${tenantId}/limit-override`,
      OVERVIEW: (tenantId: string) => `/v1/admin/tenants/${tenantId}/overview`,
      INTEGRATIONS: (tenantId: string) =>
        `/v1/admin/tenants/${tenantId}/integrations`,
    },
    // Support
    SUPPORT: {
      LIST: '/v1/admin/support/tickets',
      GET: (ticketId: string) => `/v1/admin/support/tickets/${ticketId}`,
      ASSIGN: (ticketId: string) =>
        `/v1/admin/support/tickets/${ticketId}/assign`,
      REPLY: (ticketId: string) =>
        `/v1/admin/support/tickets/${ticketId}/reply`,
      UPDATE_STATUS: (ticketId: string) =>
        `/v1/admin/support/tickets/${ticketId}/status`,
      METRICS: '/v1/admin/support/metrics',
      SLA_CONFIG: '/v1/admin/support/sla',
      SLA_CONFIG_UPDATE: (priority: string) =>
        `/v1/admin/support/sla/${priority}`,
    },
    // Monitoring
    MONITORING: {
      SYSTEM_HEALTH: '/v1/admin/monitoring/health',
      INTEGRATION_STATUS: '/v1/admin/monitoring/integrations',
      AI_USAGE: '/v1/admin/monitoring/ai-usage',
      REVENUE: '/v1/admin/monitoring/revenue',
    },
    // Central Team
    TEAM: {
      LIST: '/v1/admin/team',
      INVITE: '/v1/admin/team/invite',
      UPDATE_ROLE: (userId: string) => `/v1/admin/team/${userId}/role`,
      REMOVE: (userId: string) => `/v1/admin/team/${userId}`,
    },
    // Billing
    BILLING: {
      LIST: '/v1/admin/billing',
      GET: (tenantId: string) => `/v1/admin/billing/${tenantId}`,
      GENERATE: '/v1/admin/billing/generate',
      MARK_PAID: (id: string) => `/v1/admin/billing/${id}/paid`,
    },
  },
  // Finance - Cost Centers
  COST_CENTERS: {
    LIST: '/v1/finance/cost-centers',
    GET: (id: string) => `/v1/finance/cost-centers/${id}`,
    CREATE: '/v1/finance/cost-centers',
    UPDATE: (id: string) => `/v1/finance/cost-centers/${id}`,
    DELETE: (id: string) => `/v1/finance/cost-centers/${id}`,
  },
  // Finance - Bank Accounts
  BANK_ACCOUNTS: {
    LIST: '/v1/finance/bank-accounts',
    GET: (id: string) => `/v1/finance/bank-accounts/${id}`,
    CREATE: '/v1/finance/bank-accounts',
    UPDATE: (id: string) => `/v1/finance/bank-accounts/${id}`,
    DELETE: (id: string) => `/v1/finance/bank-accounts/${id}`,
  },
  // Finance - Categories
  FINANCE_CATEGORIES: {
    LIST: '/v1/finance/categories',
    GET: (id: string) => `/v1/finance/categories/${id}`,
    CREATE: '/v1/finance/categories',
    UPDATE: (id: string) => `/v1/finance/categories/${id}`,
    DELETE: (id: string) => `/v1/finance/categories/${id}`,
  },
  // Finance - Entries (Payable / Receivable)
  FINANCE_ENTRIES: {
    LIST: '/v1/finance/entries',
    GET: (id: string) => `/v1/finance/entries/${id}`,
    CREATE: '/v1/finance/entries',
    UPDATE: (id: string) => `/v1/finance/entries/${id}`,
    DELETE: (id: string) => `/v1/finance/entries/${id}`,
    CANCEL: (id: string) => `/v1/finance/entries/${id}/cancel`,
    REGISTER_PAYMENT: (id: string) => `/v1/finance/entries/${id}/payments`,
    UPLOAD_ATTACHMENT: (id: string) => `/v1/finance/entries/${id}/attachments`,
    DELETE_ATTACHMENT: (id: string, attachmentId: string) =>
      `/v1/finance/entries/${id}/attachments/${attachmentId}`,
    OCR_TEXT: '/v1/finance/entries/ocr',
    OCR_UPLOAD: '/v1/finance/entries/ocr/upload',
    LAST_SUPPLIER: '/v1/finance/entries/last-supplier',
  },
  // Finance - Dashboard & Reports
  FINANCE_DASHBOARD: {
    OVERVIEW: '/v1/finance/dashboard',
    LANDING_OVERVIEW: '/v1/finance/overview',
    FORECAST: '/v1/finance/forecast',
    CASHFLOW: '/v1/finance/cashflow',
    CHECK_OVERDUE: '/v1/finance/check-overdue',
    PARSE_BOLETO: '/v1/finance/parse-boleto',
    EXPORT_ACCOUNTING: '/v1/finance/export/accounting',
    IMPORT_PAYROLL: (payrollId: string) =>
      `/v1/finance/import/payroll/${payrollId}`,
  },
  // Finance - Loans
  LOANS: {
    LIST: '/v1/finance/loans',
    GET: (id: string) => `/v1/finance/loans/${id}`,
    CREATE: '/v1/finance/loans',
    UPDATE: (id: string) => `/v1/finance/loans/${id}`,
    DELETE: (id: string) => `/v1/finance/loans/${id}`,
    REGISTER_PAYMENT: (id: string) => `/v1/finance/loans/${id}/payments`,
  },
  // Finance - Consortia
  CONSORTIA: {
    LIST: '/v1/finance/consortia',
    GET: (id: string) => `/v1/finance/consortia/${id}`,
    CREATE: '/v1/finance/consortia',
    UPDATE: (id: string) => `/v1/finance/consortia/${id}`,
    DELETE: (id: string) => `/v1/finance/consortia/${id}`,
    REGISTER_PAYMENT: (id: string) => `/v1/finance/consortia/${id}/payments`,
    MARK_CONTEMPLATED: (id: string) =>
      `/v1/finance/consortia/${id}/contemplated`,
  },
  // Finance - Contracts
  CONTRACTS: {
    LIST: '/v1/finance/contracts',
    GET: (id: string) => `/v1/finance/contracts/${id}`,
    CREATE: '/v1/finance/contracts',
    UPDATE: (id: string) => `/v1/finance/contracts/${id}`,
    DELETE: (id: string) => `/v1/finance/contracts/${id}`,
    GENERATE_ENTRIES: (id: string) =>
      `/v1/finance/contracts/${id}/generate-entries`,
    SUPPLIER_HISTORY: '/v1/finance/contracts/supplier-history',
  },
  // Finance - Recurring
  FINANCE_RECURRING: {
    LIST: '/v1/finance/recurring',
    GET: (id: string) => `/v1/finance/recurring/${id}`,
    CREATE: '/v1/finance/recurring',
    UPDATE: (id: string) => `/v1/finance/recurring/${id}`,
    PAUSE: (id: string) => `/v1/finance/recurring/${id}/pause`,
    RESUME: (id: string) => `/v1/finance/recurring/${id}/resume`,
    CANCEL: (id: string) => `/v1/finance/recurring/${id}/cancel`,
  },
  // Storage - Folders
  STORAGE: {
    FOLDERS: {
      CREATE: '/v1/storage/folders',
      GET: (id: string) => `/v1/storage/folders/${id}`,
      CONTENTS: (id: string) => `/v1/storage/folders/${id}/contents`,
      ROOT_CONTENTS: '/v1/storage/folders/root/contents',
      UPDATE: (id: string) => `/v1/storage/folders/${id}`,
      RENAME: (id: string) => `/v1/storage/folders/${id}/rename`,
      MOVE: (id: string) => `/v1/storage/folders/${id}/move`,
      DELETE: (id: string) => `/v1/storage/folders/${id}`,
      BREADCRUMB: (id: string) => `/v1/storage/folders/${id}/breadcrumb`,
      SEARCH: '/v1/storage/folders/search',
      INITIALIZE: '/v1/storage/folders/initialize',
      ENSURE_ENTITY: '/v1/storage/folders/ensure-entity',
      DOWNLOAD: (id: string) => `/v1/storage/folders/${id}/download`,
      ACCESS: {
        LIST: (id: string) => `/v1/storage/folders/${id}/access`,
        SET: (id: string) => `/v1/storage/folders/${id}/access`,
        REMOVE: (id: string, ruleId: string) =>
          `/v1/storage/folders/${id}/access/${ruleId}`,
      },
    },
    FILES: {
      UPLOAD: (folderId: string) => `/v1/storage/folders/${folderId}/files`,
      UPLOAD_ROOT: '/v1/storage/files',
      LIST: '/v1/storage/files',
      GET: (id: string) => `/v1/storage/files/${id}`,
      DOWNLOAD: (id: string) => `/v1/storage/files/${id}/download`,
      PREVIEW: (id: string) => `/v1/storage/files/${id}/preview`,
      RENAME: (id: string) => `/v1/storage/files/${id}/rename`,
      MOVE: (id: string) => `/v1/storage/files/${id}/move`,
      DELETE: (id: string) => `/v1/storage/files/${id}`,
      VERSIONS: {
        LIST: (id: string) => `/v1/storage/files/${id}/versions`,
        UPLOAD: (id: string) => `/v1/storage/files/${id}/versions`,
        RESTORE: (id: string, vId: string) =>
          `/v1/storage/files/${id}/versions/${vId}/restore`,
      },
      SERVE: (id: string) => `/v1/storage/files/${id}/serve`,
      SERVE_TOKEN: '/v1/storage/files/serve-token',
      COMPRESS: '/v1/storage/files/compress',
      DECOMPRESS: (id: string) => `/v1/storage/files/${id}/decompress`,
      MULTIPART: {
        INITIATE: '/v1/storage/files/multipart/initiate',
        COMPLETE: '/v1/storage/files/multipart/complete',
        ABORT: '/v1/storage/files/multipart/abort',
      },
    },
    BULK: {
      DELETE: '/v1/storage/bulk/delete',
      MOVE: '/v1/storage/bulk/move',
    },
    SEARCH: '/v1/storage/search',
    TRASH: {
      LIST: '/v1/storage/trash',
      RESTORE_FILE: (fileId: string) =>
        `/v1/storage/trash/restore-file/${fileId}`,
      RESTORE_FOLDER: (folderId: string) =>
        `/v1/storage/trash/restore-folder/${folderId}`,
      EMPTY: '/v1/storage/trash/empty',
    },
    SHARING: {
      CREATE: (fileId: string) => `/v1/storage/files/${fileId}/share`,
      LIST: (fileId: string) => `/v1/storage/files/${fileId}/shares`,
      REVOKE: (linkId: string) => `/v1/storage/shares/${linkId}`,
    },
    PUBLIC: {
      ACCESS: (token: string) => `/v1/public/shared/${token}`,
      DOWNLOAD: (token: string) => `/v1/public/shared/${token}/download`,
    },
    SECURITY: {
      PROTECT: '/v1/storage/security/protect',
      UNPROTECT: '/v1/storage/security/unprotect',
      VERIFY: '/v1/storage/security/verify',
      HIDE: '/v1/storage/security/hide',
      UNHIDE: '/v1/storage/security/unhide',
      VERIFY_KEY: '/v1/storage/security/verify-key',
    },
    STATS: '/v1/storage/stats',
  },
  // Calendar
  CALENDAR: {
    CALENDARS: {
      LIST: '/v1/calendar/calendars',
      CREATE_TEAM: '/v1/calendar/calendars/team',
      UPDATE: (id: string) => `/v1/calendar/calendars/${id}`,
      DELETE: (id: string) => `/v1/calendar/calendars/${id}`,
      UPDATE_PERMISSIONS: (id: string) =>
        `/v1/calendar/calendars/${id}/team-permissions`,
    },
    EVENTS: {
      LIST: '/v1/calendar/events',
      GET: (id: string) => `/v1/calendar/events/${id}`,
      CREATE: '/v1/calendar/events',
      UPDATE: (id: string) => `/v1/calendar/events/${id}`,
      DELETE: (id: string) => `/v1/calendar/events/${id}`,
      INVITE: (eventId: string) =>
        `/v1/calendar/events/${eventId}/participants`,
      RESPOND: (eventId: string) => `/v1/calendar/events/${eventId}/respond`,
      REMOVE_PARTICIPANT: (eventId: string, userId: string) =>
        `/v1/calendar/events/${eventId}/participants/${userId}`,
      MANAGE_REMINDERS: (eventId: string) =>
        `/v1/calendar/events/${eventId}/reminders`,
      SHARE_USERS: (eventId: string) =>
        `/v1/calendar/events/${eventId}/share-users`,
      SHARE_TEAM: (eventId: string) =>
        `/v1/calendar/events/${eventId}/share-team`,
      UNSHARE_USER: (eventId: string, targetUserId: string) =>
        `/v1/calendar/events/${eventId}/share-users/${targetUserId}`,
      EXPORT: '/v1/calendar/events/export',
    },
  },
  // Tasks
  TASKS: {
    BOARDS: {
      LIST: '/v1/tasks/boards',
      CREATE: '/v1/tasks/boards',
      GET: (boardId: string) => `/v1/tasks/boards/${boardId}`,
      UPDATE: (boardId: string) => `/v1/tasks/boards/${boardId}`,
      DELETE: (boardId: string) => `/v1/tasks/boards/${boardId}`,
      ARCHIVE: (boardId: string) => `/v1/tasks/boards/${boardId}/archive`,
      MEMBERS: {
        INVITE: (boardId: string) => `/v1/tasks/boards/${boardId}/members`,
        UPDATE: (boardId: string, memberId: string) =>
          `/v1/tasks/boards/${boardId}/members/${memberId}`,
        REMOVE: (boardId: string, memberId: string) =>
          `/v1/tasks/boards/${boardId}/members/${memberId}`,
      },
    },
    COLUMNS: {
      CREATE: (boardId: string) => `/v1/tasks/boards/${boardId}/columns`,
      UPDATE: (boardId: string, columnId: string) =>
        `/v1/tasks/boards/${boardId}/columns/${columnId}`,
      DELETE: (boardId: string, columnId: string) =>
        `/v1/tasks/boards/${boardId}/columns/${columnId}`,
      REORDER: (boardId: string) =>
        `/v1/tasks/boards/${boardId}/columns/reorder`,
    },
    CARDS: {
      LIST: (boardId: string) => `/v1/tasks/boards/${boardId}/cards`,
      CREATE: (boardId: string) => `/v1/tasks/boards/${boardId}/cards`,
      GET: (boardId: string, cardId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}`,
      UPDATE: (boardId: string, cardId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}`,
      DELETE: (boardId: string, cardId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}`,
      MOVE: (boardId: string, cardId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/move`,
      ASSIGN: (boardId: string, cardId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/assign`,
      ARCHIVE: (boardId: string, cardId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/archive`,
      LABELS: (boardId: string, cardId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/labels`,
    },
    LABELS: {
      LIST: (boardId: string) => `/v1/tasks/boards/${boardId}/labels`,
      CREATE: (boardId: string) => `/v1/tasks/boards/${boardId}/labels`,
      UPDATE: (boardId: string, labelId: string) =>
        `/v1/tasks/boards/${boardId}/labels/${labelId}`,
      DELETE: (boardId: string, labelId: string) =>
        `/v1/tasks/boards/${boardId}/labels/${labelId}`,
    },
    COMMENTS: {
      LIST: (boardId: string, cardId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/comments`,
      CREATE: (boardId: string, cardId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/comments`,
      UPDATE: (boardId: string, cardId: string, commentId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/comments/${commentId}`,
      DELETE: (boardId: string, cardId: string, commentId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/comments/${commentId}`,
      ADD_REACTION: (boardId: string, cardId: string, commentId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/comments/${commentId}/reactions`,
      REMOVE_REACTION: (
        boardId: string,
        cardId: string,
        commentId: string,
        emoji: string
      ) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/comments/${commentId}/reactions/${emoji}`,
    },
    SUBTASKS: {
      LIST: (boardId: string, cardId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/subtasks`,
      CREATE: (boardId: string, cardId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/subtasks`,
      UPDATE: (boardId: string, cardId: string, subtaskId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/subtasks/${subtaskId}`,
      DELETE: (boardId: string, cardId: string, subtaskId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/subtasks/${subtaskId}`,
      COMPLETE: (boardId: string, cardId: string, subtaskId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/subtasks/${subtaskId}/complete`,
    },
    CHECKLISTS: {
      CREATE: (boardId: string, cardId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/checklists`,
      UPDATE: (boardId: string, cardId: string, checklistId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/checklists/${checklistId}`,
      DELETE: (boardId: string, cardId: string, checklistId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/checklists/${checklistId}`,
      ADD_ITEM: (boardId: string, cardId: string, checklistId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/checklists/${checklistId}/items`,
      TOGGLE_ITEM: (
        boardId: string,
        cardId: string,
        checklistId: string,
        itemId: string
      ) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/checklists/${checklistId}/items/${itemId}/toggle`,
      DELETE_ITEM: (
        boardId: string,
        cardId: string,
        checklistId: string,
        itemId: string
      ) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/checklists/${checklistId}/items/${itemId}`,
    },
    CUSTOM_FIELDS: {
      LIST: (boardId: string) => `/v1/tasks/boards/${boardId}/custom-fields`,
      CREATE: (boardId: string) => `/v1/tasks/boards/${boardId}/custom-fields`,
      UPDATE: (boardId: string, fieldId: string) =>
        `/v1/tasks/boards/${boardId}/custom-fields/${fieldId}`,
      DELETE: (boardId: string, fieldId: string) =>
        `/v1/tasks/boards/${boardId}/custom-fields/${fieldId}`,
      SET_VALUES: (boardId: string, cardId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/custom-fields`,
    },
    ATTACHMENTS: {
      LIST: (boardId: string, cardId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/attachments`,
      UPLOAD: (boardId: string, cardId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/attachments`,
      DELETE: (boardId: string, cardId: string, attachmentId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/attachments/${attachmentId}`,
    },
    AUTOMATIONS: {
      LIST: (boardId: string) => `/v1/tasks/boards/${boardId}/automations`,
      CREATE: (boardId: string) => `/v1/tasks/boards/${boardId}/automations`,
      UPDATE: (boardId: string, automationId: string) =>
        `/v1/tasks/boards/${boardId}/automations/${automationId}`,
      DELETE: (boardId: string, automationId: string) =>
        `/v1/tasks/boards/${boardId}/automations/${automationId}`,
      TOGGLE: (boardId: string, automationId: string) =>
        `/v1/tasks/boards/${boardId}/automations/${automationId}/toggle`,
    },
    ACTIVITY: {
      BOARD: (boardId: string) => `/v1/tasks/boards/${boardId}/activity`,
      CARD: (boardId: string, cardId: string) =>
        `/v1/tasks/boards/${boardId}/cards/${cardId}/activity`,
    },
  },
  // Core - Teams
  TEAMS: {
    LIST: '/v1/teams',
    GET: (id: string) => `/v1/teams/${id}`,
    CREATE: '/v1/teams',
    UPDATE: (id: string) => `/v1/teams/${id}`,
    DELETE: (id: string) => `/v1/teams/${id}`,
    MY: '/v1/teams/my',
    MEMBERS: {
      LIST: (teamId: string) => `/v1/teams/${teamId}/members`,
      ADD: (teamId: string) => `/v1/teams/${teamId}/members`,
      BULK_ADD: (teamId: string) => `/v1/teams/${teamId}/members/bulk`,
      REMOVE: (teamId: string, memberId: string) =>
        `/v1/teams/${teamId}/members/${memberId}`,
      CHANGE_ROLE: (teamId: string, memberId: string) =>
        `/v1/teams/${teamId}/members/${memberId}/role`,
    },
    TRANSFER_OWNERSHIP: (teamId: string) =>
      `/v1/teams/${teamId}/transfer-ownership`,
    EMAILS: {
      LIST: (teamId: string) => `/v1/teams/${teamId}/emails`,
      LINK: (teamId: string) => `/v1/teams/${teamId}/emails`,
      UPDATE_PERMISSIONS: (teamId: string, accountId: string) =>
        `/v1/teams/${teamId}/emails/${accountId}`,
      UNLINK: (teamId: string, accountId: string) =>
        `/v1/teams/${teamId}/emails/${accountId}`,
    },
  },
  // Support (tenant-facing)
  SUPPORT: {
    CREATE: '/v1/support/tickets',
    LIST_MY: '/v1/support/tickets',
    GET_MY: (ticketId: string) => `/v1/support/tickets/${ticketId}`,
    REPLY_MY: (ticketId: string) => `/v1/support/tickets/${ticketId}/reply`,
    RATE: (ticketId: string) => `/v1/support/tickets/${ticketId}/rate`,
  },
  // Notifications
  NOTIFICATIONS: {
    LIST: '/v1/notifications',
    MARK_AS_READ: (id: string) => `/v1/notifications/${id}/read`,
    MARK_ALL_AS_READ: '/v1/notifications/mark-all-read',
    DELETE: (id: string) => `/v1/notifications/${id}`,
  },
  // Digital Signature
  SIGNATURE: {
    CERTIFICATES: {
      LIST: '/v1/signature/certificates',
      CREATE: '/v1/signature/certificates',
      DELETE: (id: string) => `/v1/signature/certificates/${id}`,
    },
    ENVELOPES: {
      LIST: '/v1/signature/envelopes',
      CREATE: '/v1/signature/envelopes',
      GET: (id: string) => `/v1/signature/envelopes/${id}`,
      CANCEL: (id: string) => `/v1/signature/envelopes/${id}`,
      RESEND: (id: string) =>
        `/v1/signature/envelopes/${id}/resend-notifications`,
    },
    SIGNING: {
      GET: (token: string) => `/v1/signature/sign/${token}`,
      SIGN: (token: string) => `/v1/signature/sign/${token}`,
      REJECT: (token: string) => `/v1/signature/sign/${token}/reject`,
    },
    TEMPLATES: {
      LIST: '/v1/signature/templates',
      CREATE: '/v1/signature/templates',
    },
  },
  // Sales - Analytics
  ANALYTICS: {
    GOALS: {
      LIST: '/v1/sales/analytics/goals',
      CREATE: '/v1/sales/analytics/goals',
      UPDATE: (id: string) => `/v1/sales/analytics/goals/${id}`,
      DELETE: (id: string) => `/v1/sales/analytics/goals/${id}`,
      PROGRESS: (id: string) => `/v1/sales/analytics/goals/${id}/progress`,
    },
    DASHBOARDS: {
      LIST: '/v1/sales/analytics/dashboards',
      CREATE: '/v1/sales/analytics/dashboards',
    },
    REPORTS: {
      LIST: '/v1/sales/analytics/reports',
      CREATE: '/v1/sales/analytics/reports',
    },
    RANKINGS: {
      SELLERS: '/v1/sales/analytics/rankings/sellers',
      PRODUCTS: '/v1/sales/analytics/rankings/products',
      CUSTOMERS: '/v1/sales/analytics/rankings/customers',
    },
    CUSTOMER_PORTAL: {
      CREATE: '/v1/sales/analytics/customer-portal',
      GET: (token: string) => `/v1/sales/analytics/customer-portal/${token}`,
    },
  },
  // AI Assistant
  AI: {
    CHAT: {
      SEND: '/v1/ai/chat',
      LIST_CONVERSATIONS: '/v1/ai/chat/conversations',
      GET_CONVERSATION: (id: string) => `/v1/ai/chat/conversations/${id}`,
      ARCHIVE_CONVERSATION: (id: string) =>
        `/v1/ai/chat/conversations/${id}/archive`,
    },
    INSIGHTS: {
      LIST: '/v1/ai/insights',
      VIEW: (id: string) => `/v1/ai/insights/${id}/view`,
      DISMISS: (id: string) => `/v1/ai/insights/${id}/dismiss`,
    },
    CONFIG: {
      GET: '/v1/ai/config',
      UPDATE: '/v1/ai/config',
    },
    FAVORITES: {
      LIST: '/v1/ai/favorites',
      CREATE: '/v1/ai/favorites',
      DELETE: (id: string) => `/v1/ai/favorites/${id}`,
    },
    ACTIONS: {
      LIST: '/v1/ai/actions',
    },
  },
  // Health
  HEALTH: '/health',
} as const;
