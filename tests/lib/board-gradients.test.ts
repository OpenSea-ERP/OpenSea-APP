import { describe, expect, it, beforeEach } from 'vitest';
import {
  BOARD_GRADIENTS,
  getGradientForBoard,
  setGradientForBoard,
} from '@/components/tasks/shared/board-gradients';

describe('board-gradients', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('BOARD_GRADIENTS', () => {
    it('should have 12 gradient presets', () => {
      expect(BOARD_GRADIENTS).toHaveLength(12);
    });

    it('each gradient should have required properties', () => {
      for (const g of BOARD_GRADIENTS) {
        expect(g.id).toBeTruthy();
        expect(g.from).toMatch(/^#[0-9a-f]{6}$/i);
        expect(g.to).toMatch(/^#[0-9a-f]{6}$/i);
        expect(g.style.background).toContain('linear-gradient');
      }
    });

    it('all IDs should be unique', () => {
      const ids = BOARD_GRADIENTS.map(g => g.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('getGradientForBoard', () => {
    it('should return server gradient when serverGradientId matches', () => {
      const result = getGradientForBoard('board-123', 'purple-pink');
      expect(result.id).toBe('purple-pink');
    });

    it('should fall back to hash-based gradient when no server/localStorage value', () => {
      const result = getGradientForBoard('some-board-id');
      expect(BOARD_GRADIENTS).toContain(result);
    });

    it('should return localStorage gradient when set', () => {
      setGradientForBoard('board-abc', 'orange-red');
      const result = getGradientForBoard('board-abc');
      expect(result.id).toBe('orange-red');
    });

    it('should prefer server gradient over localStorage', () => {
      setGradientForBoard('board-xyz', 'orange-red');
      const result = getGradientForBoard('board-xyz', 'cyan-blue');
      expect(result.id).toBe('cyan-blue');
    });

    it('should fall back to hash when serverGradientId is invalid', () => {
      const result = getGradientForBoard('board-123', 'nonexistent-gradient');
      expect(BOARD_GRADIENTS).toContain(result);
    });

    it('should return deterministic gradient for same boardId', () => {
      const r1 = getGradientForBoard('deterministic-board');
      const r2 = getGradientForBoard('deterministic-board');
      expect(r1.id).toBe(r2.id);
    });
  });

  describe('setGradientForBoard', () => {
    it('should persist gradient in localStorage', () => {
      setGradientForBoard('board-set', 'lime-green');
      expect(localStorage.getItem('board-gradient-board-set')).toBe(
        'lime-green'
      );
    });
  });
});
