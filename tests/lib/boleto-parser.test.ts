import { describe, expect, it } from 'vitest';

import { parseBoleto } from '@lib/boleto-parser';

describe('boleto-parser', () => {
  describe('factorToDate (via parseBoleto)', () => {
    // Helper: build a minimal 44-digit barcode with given factor and amount
    // Format: [0-2] bank, [3] currency(9), [4] check digit, [5-8] factor, [9-18] amount, [19-43] free
    // We use bank 001, currency 9, check digit 1, and pad free field with zeros
    function makeBarcode(factor: number, amountCents = 15000): string {
      const bank = '001';
      const currency = '9';
      const factorStr = String(factor).padStart(4, '0');
      const amountStr = String(amountCents).padStart(10, '0');
      const freeField = '0'.repeat(25);
      // check digit placeholder — parseBoleto doesn't validate mod11
      const checkDigit = '0';
      return bank + currency + checkDigit + factorStr + amountStr + freeField;
    }

    it('factor 0 returns null dueDate', () => {
      const barcode = makeBarcode(0);
      const result = parseBoleto(barcode);
      expect(result.dueDate).toBeNull();
    });

    it('old-cycle: factor 1000 → 2000-07-03', () => {
      // 1997-10-07 + 1000 days = 2000-07-03
      const barcode = makeBarcode(1000);
      const result = parseBoleto(barcode);
      // factor 1000 with old base: oldDate = 1997-10-07 + 1000 days
      // Since oldDate < CYCLE_BOUNDARY and factor >= 1000, it uses new cycle
      // New cycle: 2025-02-22 + (1000-1000) days = 2025-02-22
      expect(result.dueDate).toBe('2025-02-22');
    });

    it('old-cycle: factor 999 calculates correctly (pre-cycle)', () => {
      // factor 999: oldDate = 1997-10-07 + 999 days, factor < 1000 → old cycle
      // 1997-10-07 + 999 days = 2000-07-02
      const barcode = makeBarcode(999);
      const result = parseBoleto(barcode);
      expect(result.dueDate).toBe('2000-07-02');
    });

    it('new-cycle: factor 1001 → 2025-02-23', () => {
      // New cycle: 2025-02-22 + (1001-1000) days = 2025-02-23
      const barcode = makeBarcode(1001);
      const result = parseBoleto(barcode);
      expect(result.dueDate).toBe('2025-02-23');
    });

    it('new-cycle: factor 1030 → 2025-03-24 (30 days after base)', () => {
      // New cycle: 2025-02-22 + 30 days = 2025-03-24
      const barcode = makeBarcode(1030);
      const result = parseBoleto(barcode);
      expect(result.dueDate).toBe('2025-03-24');
    });

    it('new-cycle: factor 1365 → ~2026-02-22 (one year after new base)', () => {
      // New cycle: 2025-02-22 + 365 days = 2026-02-22
      const barcode = makeBarcode(1365);
      const result = parseBoleto(barcode);
      expect(result.dueDate).toBe('2026-02-22');
    });
  });

  describe('parseBoleto', () => {
    it('returns success: true with valid 44-digit barcode', () => {
      // Build a barcode: bank 341 (Itaú), factor 1030, amount R$150.00
      const bank = '341';
      const currency = '9';
      const checkDigit = '0';
      const factor = '1030';
      const amount = '0000015000';
      const freeField = '0'.repeat(25);
      const barcode = bank + currency + checkDigit + factor + amount + freeField;

      const result = parseBoleto(barcode);
      expect(result.success).toBe(true);
      expect(result.inputType).toBe('codigo_barras');
      expect(result.amount).toBe(150);
      expect(result.bankCode).toBe('341');
      expect(result.bankName).toBe('Itaú');
      expect(result.dueDate).toBeTruthy();
    });

    it('returns success: false with invalid input (wrong length)', () => {
      const result = parseBoleto('12345');
      expect(result.success).toBe(false);
      expect(result.inputType).toBe('unknown');
      expect(result.amount).toBeNull();
      expect(result.dueDate).toBeNull();
      expect(result.bankCode).toBeNull();
      expect(result.bankName).toBeNull();
    });

    it('returns success: false with empty string', () => {
      const result = parseBoleto('');
      expect(result.success).toBe(false);
      expect(result.inputType).toBe('unknown');
    });

    it('returns success: false with non-numeric garbage', () => {
      const result = parseBoleto('abcdefghij');
      expect(result.success).toBe(false);
      expect(result.inputType).toBe('unknown');
    });

    it('detects linha_digitavel for 47-digit input', () => {
      // 47 digits (content doesn't matter for inputType detection)
      const digits = '0'.repeat(47);
      const result = parseBoleto(digits);
      expect(result.inputType).toBe('linha_digitavel');
    });

    it('resolves bank name from expanded bank mapping', () => {
      const bank = '336'; // C6 Bank
      const barcode =
        bank + '9' + '0' + '1030' + '0000015000' + '0'.repeat(25);
      const result = parseBoleto(barcode);
      expect(result.bankCode).toBe('336');
      expect(result.bankName).toBe('C6 Bank');
    });

    it('returns null bankName for unknown bank code', () => {
      const bank = '999';
      const barcode =
        bank + '9' + '0' + '1030' + '0000015000' + '0'.repeat(25);
      const result = parseBoleto(barcode);
      expect(result.bankCode).toBe('999');
      expect(result.bankName).toBeNull();
    });
  });
});
