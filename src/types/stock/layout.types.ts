// ============================================
// ZONE LAYOUT (Layout Visual Customizado)
// ============================================

export interface ZoneLayout {
  // Posicionamento dos corredores no canvas
  aislePositions: AislePosition[];

  // Configurações do canvas
  canvasWidth: number;
  canvasHeight: number;
  gridSize: number; // Snap to grid (em pixels)

  // Elementos adicionais (portas, pilares, etc)
  annotations: LayoutAnnotation[];

  // Metadados
  lastModified: string;
  isCustom: boolean; // true se foi modificado manualmente
}

export interface AislePosition {
  aisleNumber: number;
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270; // Graus
  customWidth?: number; // Override do padrão
  customHeight?: number; // Override do padrão
}

export interface LayoutAnnotation {
  id: string;
  type: AnnotationType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  label?: string;
  color?: string;
}

export type AnnotationType =
  | 'door'
  | 'pillar'
  | 'wall'
  | 'label'
  | 'area'
  | 'stairs'
  | 'elevator';

// ============================================
// Layout Editor State
// ============================================

export type EditorTool = 'select' | 'move' | 'rotate' | 'add-annotation';

export interface EditorState {
  tool: EditorTool;
  selectedAisle: number | null;
  selectedAnnotation: string | null;
  isDragging: boolean;
  zoom: number;
  panX: number;
  panY: number;
  gridEnabled: boolean;
  snapToGrid: boolean;
  showOccupancy: boolean;
  annotationToAdd: AnnotationType | null;
}

export const defaultEditorState: EditorState = {
  tool: 'select',
  selectedAisle: null,
  selectedAnnotation: null,
  isDragging: false,
  zoom: 1,
  panX: 0,
  panY: 0,
  gridEnabled: true,
  snapToGrid: true,
  showOccupancy: true,
  annotationToAdd: null,
};

// ============================================
// Layout API Types
// ============================================

export interface SaveLayoutRequest {
  layout: ZoneLayout;
}

export interface LayoutResponse {
  layout: ZoneLayout;
}

// ============================================
// Default Layout Generation
// ============================================

export interface LayoutGenerationOptions {
  aisleCount: number;
  shelvesPerAisle: number;
  aisleWidth: number;
  aisleSpacing: number;
  shelfWidth: number;
  orientation: 'horizontal' | 'vertical';
  startX: number;
  startY: number;
}

export const defaultLayoutGenerationOptions: LayoutGenerationOptions = {
  aisleCount: 5,
  shelvesPerAisle: 50,
  aisleWidth: 60,
  aisleSpacing: 100,
  shelfWidth: 40,
  orientation: 'vertical',
  startX: 50,
  startY: 50,
};

// ============================================
// Annotation Defaults
// ============================================

export const ANNOTATION_DEFAULTS: Record<
  AnnotationType,
  { width: number; height: number; color: string; label: string }
> = {
  door: { width: 80, height: 20, color: '#3b82f6', label: 'Porta' },
  pillar: { width: 30, height: 30, color: '#6b7280', label: 'Pilar' },
  wall: { width: 200, height: 10, color: '#374151', label: 'Parede' },
  label: { width: 100, height: 30, color: '#f59e0b', label: 'Texto' },
  area: { width: 150, height: 100, color: '#10b98133', label: 'Área' },
  stairs: { width: 60, height: 80, color: '#8b5cf6', label: 'Escada' },
  elevator: { width: 50, height: 50, color: '#ec4899', label: 'Elevador' },
};
