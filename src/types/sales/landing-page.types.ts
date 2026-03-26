// Landing Page Types (Páginas de Captura)

export type LandingPageStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export const LANDING_PAGE_STATUS_LABELS: Record<LandingPageStatus, string> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicada',
  ARCHIVED: 'Arquivada',
};

export type LandingPageTemplate =
  | 'BLANK'
  | 'LEAD_CAPTURE'
  | 'PRODUCT_LAUNCH'
  | 'WEBINAR'
  | 'THANK_YOU';

export const LANDING_PAGE_TEMPLATE_LABELS: Record<LandingPageTemplate, string> = {
  BLANK: 'Em Branco',
  LEAD_CAPTURE: 'Captura de Leads',
  PRODUCT_LAUNCH: 'Lançamento de Produto',
  WEBINAR: 'Webinar',
  THANK_YOU: 'Página de Agradecimento',
};

export interface LandingPageSection {
  id: string;
  type: 'HERO' | 'FEATURES' | 'CTA' | 'FORM' | 'TESTIMONIALS' | 'CUSTOM';
  title?: string;
  subtitle?: string;
  content?: string;
  ctaText?: string;
  ctaLink?: string;
  imageUrl?: string;
  position: number;
}

export interface LandingPage {
  id: string;
  title: string;
  slug: string;
  description?: string;
  status: LandingPageStatus;
  template: LandingPageTemplate;
  formId?: string;
  formName?: string;
  sections: LandingPageSection[];
  viewCount: number;
  submissionCount: number;
  metaTitle?: string;
  metaDescription?: string;
  customCss?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateLandingPageRequest {
  title: string;
  slug: string;
  description?: string;
  template?: LandingPageTemplate;
  formId?: string;
  sections?: Array<Omit<LandingPageSection, 'id'>>;
}

export interface UpdateLandingPageRequest {
  title?: string;
  slug?: string;
  description?: string;
  status?: LandingPageStatus;
  formId?: string;
  sections?: Array<Omit<LandingPageSection, 'id'>>;
  metaTitle?: string;
  metaDescription?: string;
  customCss?: string;
}

export interface LandingPageResponse {
  landingPage: LandingPage;
}

export interface LandingPagesResponse {
  landingPages: LandingPage[];
}

export interface LandingPagesQuery {
  search?: string;
  status?: LandingPageStatus;
  template?: LandingPageTemplate;
}
