'use client';

import React, { useMemo, useEffect, useCallback } from 'react';
import { EditorToolbar } from './editor-toolbar';
import { LayoutCanvas } from './layout-canvas';
import { PropertiesPanel } from './properties-panel';
import { AnnotationsPanel } from './annotations-panel';
import { useLayoutEditor } from './use-layout-editor';
import type { ZoneLayout, ZoneStructure, AnnotationType } from '@/types/stock';

export interface LayoutEditorProps {
  initialLayout: ZoneLayout;
  structure: ZoneStructure;
  warehouseCode: string;
  zoneCode: string;
  onSave: (layout: ZoneLayout) => void;
  onCancel?: () => void;
}

export function LayoutEditor({
  initialLayout,
  structure,
  warehouseCode,
  zoneCode,
  onSave,
  onCancel,
}: LayoutEditorProps) {
  const editor = useLayoutEditor({
    initialLayout,
    gridSize: initialLayout.gridSize,
    onSave,
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Tool shortcuts
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        editor.setTool('select');
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        editor.setTool('move');
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        editor.setTool('rotate');
      }

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          editor.redo();
        } else {
          editor.undo();
        }
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (editor.editorState.selectedAnnotation) {
          e.preventDefault();
          editor.deleteAnnotation(editor.editorState.selectedAnnotation);
        }
      }

      // Escape
      if (e.key === 'Escape') {
        editor.clearSelection();
        editor.setAnnotationToAdd(null);
      }

      // Zoom
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        editor.zoomIn();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        editor.zoomOut();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        editor.resetZoom();
      }

      // Rotate selected aisle
      if (e.key === 'r' && editor.editorState.selectedAisle !== null) {
        e.preventDefault();
        editor.rotateAisle(editor.editorState.selectedAisle);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  const handleAddAnnotationFromPanel = useCallback(
    (type: AnnotationType) => {
      // Adicionar no centro do canvas visível
      const centerX = editor.layout.canvasWidth / 2;
      const centerY = editor.layout.canvasHeight / 2;
      editor.addAnnotation(type, centerX, centerY);
    },
    [editor]
  );

  const handleAislePositionChange = useCallback(
    (
      aisleNumber: number,
      updates: { x?: number; y?: number; rotation?: 0 | 90 | 180 | 270 }
    ) => {
      if (updates.x !== undefined || updates.y !== undefined) {
        editor.setAislePosition(
          aisleNumber,
          updates.x ??
            editor.layout.aislePositions.find(
              p => p.aisleNumber === aisleNumber
            )?.x ??
            0,
          updates.y ??
            editor.layout.aislePositions.find(
              p => p.aisleNumber === aisleNumber
            )?.y ??
            0
        );
      }
    },
    [editor]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <EditorToolbar
        currentTool={editor.editorState.tool}
        zoom={editor.editorState.zoom}
        gridEnabled={editor.editorState.gridEnabled}
        snapToGrid={editor.editorState.snapToGrid}
        showOccupancy={editor.editorState.showOccupancy}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        isDirty={editor.isDirty}
        onToolChange={editor.setTool}
        onAddAnnotation={type => editor.setAnnotationToAdd(type)}
        onZoomIn={editor.zoomIn}
        onZoomOut={editor.zoomOut}
        onResetZoom={editor.resetZoom}
        onToggleGrid={editor.toggleGrid}
        onToggleSnap={editor.toggleSnapToGrid}
        onToggleOccupancy={editor.toggleOccupancy}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onReset={editor.resetLayout}
        onSave={editor.save}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 p-4 overflow-hidden">
          <LayoutCanvas
            layout={editor.layout}
            structure={structure}
            editorState={editor.editorState}
            onSelectAisle={editor.selectAisle}
            onSelectAnnotation={editor.selectAnnotation}
            onMoveAisle={editor.moveAisle}
            onMoveAisleEnd={aisleNumber => {
              const pos = editor.layout.aislePositions.find(
                p => p.aisleNumber === aisleNumber
              );
              if (pos) {
                editor.setAislePosition(aisleNumber, pos.x, pos.y);
              }
            }}
            onRotateAisle={editor.rotateAisle}
            onAddAnnotation={editor.addAnnotation}
            onMoveAnnotation={editor.moveAnnotation}
            onMoveAnnotationEnd={editor.finalizeAnnotationMove}
            onClearSelection={editor.clearSelection}
          />
        </div>

        {/* Side panels */}
        <div className="w-64 flex-shrink-0 border-l flex flex-col overflow-hidden">
          {/* Properties */}
          <div className="flex-1 overflow-auto border-b">
            <PropertiesPanel
              selectedAisle={editor.selectedAisleData ?? null}
              selectedAnnotation={editor.selectedAnnotationData ?? null}
              structure={structure}
              onUpdateAisle={handleAislePositionChange}
              onRotateAisle={editor.rotateAisle}
              onUpdateAnnotation={editor.updateAnnotation}
              onDeleteAnnotation={editor.deleteAnnotation}
              onClearSelection={editor.clearSelection}
            />
          </div>

          {/* Annotations list */}
          <div className="h-64 flex-shrink-0 overflow-hidden">
            <AnnotationsPanel
              annotations={editor.layout.annotations}
              selectedAnnotationId={editor.editorState.selectedAnnotation}
              onSelect={editor.selectAnnotation}
              onAdd={handleAddAnnotationFromPanel}
              onDelete={editor.deleteAnnotation}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
