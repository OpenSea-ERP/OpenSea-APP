'use client';

import { useState, useCallback, useMemo } from 'react';
import type {
  ZoneLayout,
  AislePosition,
  LayoutAnnotation,
  EditorState,
  EditorTool,
  AnnotationType,
} from '@/types/stock';
import { defaultEditorState, ANNOTATION_DEFAULTS } from '@/types/stock';

interface UseLayoutEditorOptions {
  initialLayout: ZoneLayout;
  gridSize?: number;
  onSave?: (layout: ZoneLayout) => void;
}

interface HistoryEntry {
  layout: ZoneLayout;
  description: string;
}

export function useLayoutEditor({
  initialLayout,
  gridSize = 10,
  onSave,
}: UseLayoutEditorOptions) {
  // Layout state
  const [layout, setLayout] = useState<ZoneLayout>(initialLayout);
  const [editorState, setEditorState] =
    useState<EditorState>(defaultEditorState);

  // History for undo/redo
  const [history, setHistory] = useState<HistoryEntry[]>([
    { layout: initialLayout, description: 'Estado inicial' },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Dirty state
  const [isDirty, setIsDirty] = useState(false);

  // Helper to add to history
  const addToHistory = useCallback(
    (newLayout: ZoneLayout, description: string) => {
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        return [...newHistory, { layout: newLayout, description }];
      });
      setHistoryIndex(prev => prev + 1);
      setIsDirty(true);
    },
    [historyIndex]
  );

  // Snap position to grid
  const snapToGrid = useCallback(
    (value: number): number => {
      if (!editorState.snapToGrid) return value;
      return Math.round(value / gridSize) * gridSize;
    },
    [editorState.snapToGrid, gridSize]
  );

  // Tool actions
  const setTool = useCallback((tool: EditorTool) => {
    setEditorState(prev => ({
      ...prev,
      tool,
      annotationToAdd: null,
    }));
  }, []);

  const setAnnotationToAdd = useCallback((type: AnnotationType | null) => {
    setEditorState(prev => ({
      ...prev,
      tool: type ? 'add-annotation' : 'select',
      annotationToAdd: type,
    }));
  }, []);

  // Selection actions
  const selectAisle = useCallback((aisleNumber: number | null) => {
    setEditorState(prev => ({
      ...prev,
      selectedAisle: aisleNumber,
      selectedAnnotation: null,
    }));
  }, []);

  const selectAnnotation = useCallback((annotationId: string | null) => {
    setEditorState(prev => ({
      ...prev,
      selectedAisle: null,
      selectedAnnotation: annotationId,
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      selectedAisle: null,
      selectedAnnotation: null,
    }));
  }, []);

  // Aisle actions
  const moveAisle = useCallback(
    (aisleNumber: number, deltaX: number, deltaY: number) => {
      setLayout(prev => {
        const newPositions = prev.aislePositions.map(pos => {
          if (pos.aisleNumber === aisleNumber) {
            return {
              ...pos,
              x: snapToGrid(pos.x + deltaX),
              y: snapToGrid(pos.y + deltaY),
            };
          }
          return pos;
        });
        return { ...prev, aislePositions: newPositions, isCustom: true };
      });
    },
    [snapToGrid]
  );

  const setAislePosition = useCallback(
    (aisleNumber: number, x: number, y: number) => {
      const newLayout: ZoneLayout = {
        ...layout,
        aislePositions: layout.aislePositions.map(pos =>
          pos.aisleNumber === aisleNumber
            ? { ...pos, x: snapToGrid(x), y: snapToGrid(y) }
            : pos
        ),
        isCustom: true,
        lastModified: new Date().toISOString(),
      };
      setLayout(newLayout);
      addToHistory(newLayout, `Mover corredor ${aisleNumber}`);
    },
    [layout, snapToGrid, addToHistory]
  );

  const rotateAisle = useCallback(
    (aisleNumber: number) => {
      const rotations: (0 | 90 | 180 | 270)[] = [0, 90, 180, 270];
      const newLayout: ZoneLayout = {
        ...layout,
        aislePositions: layout.aislePositions.map(pos => {
          if (pos.aisleNumber === aisleNumber) {
            const currentIndex = rotations.indexOf(pos.rotation);
            const nextRotation = rotations[(currentIndex + 1) % 4];
            return { ...pos, rotation: nextRotation };
          }
          return pos;
        }),
        isCustom: true,
        lastModified: new Date().toISOString(),
      };
      setLayout(newLayout);
      addToHistory(newLayout, `Rotacionar corredor ${aisleNumber}`);
    },
    [layout, addToHistory]
  );

  // Annotation actions
  const addAnnotation = useCallback(
    (type: AnnotationType, x: number, y: number) => {
      const defaults = ANNOTATION_DEFAULTS[type];
      const newAnnotation: LayoutAnnotation = {
        id: `ann-${Date.now()}`,
        type,
        x: snapToGrid(x),
        y: snapToGrid(y),
        width: defaults.width,
        height: defaults.height,
        color: defaults.color,
        label: defaults.label,
      };

      const newLayout: ZoneLayout = {
        ...layout,
        annotations: [...layout.annotations, newAnnotation],
        isCustom: true,
        lastModified: new Date().toISOString(),
      };
      setLayout(newLayout);
      addToHistory(newLayout, `Adicionar ${defaults.label}`);
      selectAnnotation(newAnnotation.id);
      setAnnotationToAdd(null);
    },
    [layout, snapToGrid, addToHistory, selectAnnotation, setAnnotationToAdd]
  );

  const updateAnnotation = useCallback(
    (id: string, updates: Partial<LayoutAnnotation>) => {
      const newLayout: ZoneLayout = {
        ...layout,
        annotations: layout.annotations.map(ann =>
          ann.id === id
            ? {
                ...ann,
                ...updates,
                x: updates.x !== undefined ? snapToGrid(updates.x) : ann.x,
                y: updates.y !== undefined ? snapToGrid(updates.y) : ann.y,
              }
            : ann
        ),
        isCustom: true,
        lastModified: new Date().toISOString(),
      };
      setLayout(newLayout);
    },
    [layout, snapToGrid]
  );

  const deleteAnnotation = useCallback(
    (id: string) => {
      const annotation = layout.annotations.find(a => a.id === id);
      const newLayout: ZoneLayout = {
        ...layout,
        annotations: layout.annotations.filter(ann => ann.id !== id),
        isCustom: true,
        lastModified: new Date().toISOString(),
      };
      setLayout(newLayout);
      addToHistory(newLayout, `Remover ${annotation?.label || 'anotação'}`);
      clearSelection();
    },
    [layout, addToHistory, clearSelection]
  );

  const moveAnnotation = useCallback(
    (id: string, deltaX: number, deltaY: number) => {
      setLayout(prev => ({
        ...prev,
        annotations: prev.annotations.map(ann =>
          ann.id === id
            ? {
                ...ann,
                x: snapToGrid(ann.x + deltaX),
                y: snapToGrid(ann.y + deltaY),
              }
            : ann
        ),
        isCustom: true,
      }));
    },
    [snapToGrid]
  );

  const finalizeAnnotationMove = useCallback(
    (id: string) => {
      addToHistory(layout, 'Mover anotação');
    },
    [layout, addToHistory]
  );

  // Zoom and pan
  const setZoom = useCallback((zoom: number) => {
    setEditorState(prev => ({
      ...prev,
      zoom: Math.max(0.25, Math.min(2, zoom)),
    }));
  }, []);

  const zoomIn = useCallback(() => {
    setZoom(editorState.zoom + 0.1);
  }, [editorState.zoom, setZoom]);

  const zoomOut = useCallback(() => {
    setZoom(editorState.zoom - 0.1);
  }, [editorState.zoom, setZoom]);

  const resetZoom = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      zoom: 1,
      panX: 0,
      panY: 0,
    }));
  }, []);

  const setPan = useCallback((panX: number, panY: number) => {
    setEditorState(prev => ({ ...prev, panX, panY }));
  }, []);

  // Settings toggles
  const toggleGrid = useCallback(() => {
    setEditorState(prev => ({ ...prev, gridEnabled: !prev.gridEnabled }));
  }, []);

  const toggleSnapToGrid = useCallback(() => {
    setEditorState(prev => ({ ...prev, snapToGrid: !prev.snapToGrid }));
  }, []);

  const toggleOccupancy = useCallback(() => {
    setEditorState(prev => ({ ...prev, showOccupancy: !prev.showOccupancy }));
  }, []);

  // Undo/Redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const undo = useCallback(() => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setLayout(history[newIndex].layout);
    }
  }, [canUndo, historyIndex, history]);

  const redo = useCallback(() => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setLayout(history[newIndex].layout);
    }
  }, [canRedo, historyIndex, history]);

  // Reset to auto layout
  const resetLayout = useCallback(() => {
    setLayout(initialLayout);
    addToHistory(initialLayout, 'Resetar para automático');
  }, [initialLayout, addToHistory]);

  // Save
  const save = useCallback(() => {
    const layoutToSave = {
      ...layout,
      lastModified: new Date().toISOString(),
    };
    onSave?.(layoutToSave);
    setIsDirty(false);
  }, [layout, onSave]);

  // Selected items
  const selectedAisleData = useMemo(() => {
    if (editorState.selectedAisle === null) return null;
    return layout.aislePositions.find(
      pos => pos.aisleNumber === editorState.selectedAisle
    );
  }, [layout.aislePositions, editorState.selectedAisle]);

  const selectedAnnotationData = useMemo(() => {
    if (!editorState.selectedAnnotation) return null;
    return layout.annotations.find(
      ann => ann.id === editorState.selectedAnnotation
    );
  }, [layout.annotations, editorState.selectedAnnotation]);

  return {
    // State
    layout,
    editorState,
    isDirty,
    canUndo,
    canRedo,
    selectedAisleData,
    selectedAnnotationData,

    // Tool actions
    setTool,
    setAnnotationToAdd,

    // Selection
    selectAisle,
    selectAnnotation,
    clearSelection,

    // Aisle actions
    moveAisle,
    setAislePosition,
    rotateAisle,

    // Annotation actions
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    moveAnnotation,
    finalizeAnnotationMove,

    // Zoom/Pan
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    setPan,

    // Toggles
    toggleGrid,
    toggleSnapToGrid,
    toggleOccupancy,

    // History
    undo,
    redo,

    // Actions
    resetLayout,
    save,
  };
}
