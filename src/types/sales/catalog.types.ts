// Catalog Types

export type CatalogType =
  | 'GENERAL'
  | 'SELLER'
  | 'CAMPAIGN'
  | 'CUSTOMER'
  | 'AI_GENERATED';

export type CatalogStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type CatalogLayout = 'GRID' | 'LIST' | 'MAGAZINE';

export interface Catalog {
  id: string;
  tenantId: string;
  name: string;
  slug: string | null;
  description: string | null;
  type: CatalogType;
  status: CatalogStatus;
  coverImageFileId: string | null;
  assignedToUserId: string | null;
  customerId: string | null;
  campaignId: string | null;
  rules: Record<string, unknown> | null;
  aiCurated: boolean;
  layout: CatalogLayout;
  showPrices: boolean;
  showStock: boolean;
  priceTableId: string | null;
  isPublic: boolean;
  publicUrl: string | null;
  qrCodeUrl: string | null;
  itemCount?: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateCatalogRequest {
  name: string;
  description?: string;
  type?: CatalogType;
  slug?: string;
  layout?: CatalogLayout;
  showPrices?: boolean;
  showStock?: boolean;
  isPublic?: boolean;
  customerId?: string;
  campaignId?: string;
  assignedToUserId?: string;
  priceTableId?: string;
}

export interface UpdateCatalogRequest {
  name?: string;
  description?: string;
  slug?: string;
  status?: CatalogStatus;
  layout?: CatalogLayout;
  showPrices?: boolean;
  showStock?: boolean;
  isPublic?: boolean;
  coverImageFileId?: string | null;
}

export interface AddCatalogItemRequest {
  variantId: string;
  position?: number;
  featured?: boolean;
  customNote?: string;
}

export interface CatalogsResponse {
  data: Catalog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CatalogResponse {
  catalog: Catalog;
}

// TenantBrand Types

export interface TenantBrand {
  id: string;
  tenantId: string;
  name: string;
  logoFileId: string | null;
  logoIconFileId: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  fontHeading: string | null;
  tagline: string | null;
  socialLinks: Record<string, string> | null;
  contactInfo: Record<string, unknown> | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface UpdateBrandRequest {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  fontHeading?: string | null;
  tagline?: string | null;
  logoFileId?: string | null;
  logoIconFileId?: string | null;
  socialLinks?: Record<string, string> | null;
  contactInfo?: Record<string, unknown> | null;
}

export interface BrandResponse {
  brand: TenantBrand;
}

// GeneratedContent Types

export type GeneratedContentType =
  | 'SOCIAL_POST'
  | 'SOCIAL_STORY'
  | 'SOCIAL_REEL'
  | 'FOLDER_PAGE'
  | 'EMAIL_CAMPAIGN'
  | 'BANNER'
  | 'PRODUCT_CARD'
  | 'VIDEO'
  | 'MOCKUP';

export type ContentStatus =
  | 'DRAFT'
  | 'READY'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'ARCHIVED';

export type ContentChannel =
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'TIKTOK'
  | 'WHATSAPP'
  | 'EMAIL'
  | 'PRINT'
  | 'WEB';

export interface GeneratedContent {
  id: string;
  tenantId: string;
  type: GeneratedContentType;
  channel: ContentChannel | null;
  status: ContentStatus;
  title: string | null;
  caption: string | null;
  hashtags: string[];
  templateId: string | null;
  brandId: string | null;
  fileId: string | null;
  thumbnailFileId: string | null;
  variantIds: string[];
  campaignId: string | null;
  catalogId: string | null;
  aiGenerated: boolean;
  aiPrompt: string | null;
  aiModel: string | null;
  publishedAt: string | null;
  publishedTo: string | null;
  scheduledAt: string | null;
  approvedByUserId: string | null;
  approvedAt: string | null;
  views: number;
  clicks: number;
  shares: number;
  engagement: number | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateGeneratedContentRequest {
  type: GeneratedContentType;
  channel?: ContentChannel;
  title?: string;
  caption?: string;
  hashtags?: string[];
  templateId?: string;
  brandId?: string;
  variantIds?: string[];
  catalogId?: string;
  campaignId?: string;
  aiGenerated?: boolean;
  aiPrompt?: string;
  aiModel?: string;
}

export interface GeneratedContentsResponse {
  data: GeneratedContent[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface GeneratedContentResponse {
  content: GeneratedContent;
}
