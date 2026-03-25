import { describe, expect, it } from 'vitest'

import { parsePix } from '@lib/pix-parser'

describe('pix-parser', () => {
  describe('empty / invalid input', () => {
    it('returns success: false for empty string', () => {
      const result = parsePix('')
      expect(result.success).toBe(false)
    })

    it('returns success: false for whitespace-only input', () => {
      const result = parsePix('   ')
      expect(result.success).toBe(false)
    })
  })

  describe('Copia e Cola (EMV TLV)', () => {
    // Build a minimal EMV Copia e Cola payload
    function tlv(tag: string, value: string): string {
      const len = String(value.length).padStart(2, '0')
      return `${tag}${len}${value}`
    }

    function buildPayload({
      pixKey = 'test@example.com',
      amount,
      merchantName,
      merchantCity,
    }: {
      pixKey?: string
      amount?: string
      merchantName?: string
      merchantCity?: string
    } = {}): string {
      // Tag 00: Payload Format Indicator
      let payload = tlv('00', '01')
      // Tag 01: Point of Initiation
      payload += tlv('01', '12')
      // Tag 26: Merchant Account Information (contains sub-tag 00 + 01)
      const sub26 = tlv('00', 'br.gov.bcb.pix') + tlv('01', pixKey)
      payload += tlv('26', sub26)
      // Tag 52: Merchant Category Code
      payload += tlv('52', '0000')
      // Tag 53: Transaction Currency
      payload += tlv('53', '986')
      // Tag 54: Transaction Amount (optional)
      if (amount) {
        payload += tlv('54', amount)
      }
      // Tag 59: Merchant Name
      if (merchantName) {
        payload += tlv('59', merchantName)
      }
      // Tag 60: Merchant City
      if (merchantCity) {
        payload += tlv('60', merchantCity)
      }
      return payload
    }

    it('detects Copia e Cola type when input starts with 000201', () => {
      const payload = buildPayload()
      expect(payload.startsWith('000201')).toBe(true)

      const result = parsePix(payload)
      expect(result.success).toBe(true)
      expect(result.type).toBe('COPIA_COLA')
    })

    it('extracts pix key from tag 26 sub-tag 01', () => {
      const result = parsePix(buildPayload({ pixKey: 'user@email.com' }))
      expect(result.pixKey).toBe('user@email.com')
      expect(result.pixKeyType).toBe('EMAIL')
    })

    it('extracts merchant name from tag 59', () => {
      const result = parsePix(
        buildPayload({ merchantName: 'JOAO DA SILVA' })
      )
      expect(result.merchantName).toBe('JOAO DA SILVA')
    })

    it('extracts merchant city from tag 60', () => {
      const result = parsePix(buildPayload({ merchantCity: 'SAO PAULO' }))
      expect(result.merchantCity).toBe('SAO PAULO')
    })

    it('extracts amount from tag 54', () => {
      const result = parsePix(buildPayload({ amount: '150.00' }))
      expect(result.amount).toBe(150.0)
    })

    it('extracts all fields together', () => {
      const result = parsePix(
        buildPayload({
          pixKey: '12345678901',
          amount: '99.50',
          merchantName: 'LOJA TESTE',
          merchantCity: 'CURITIBA',
        })
      )
      expect(result.success).toBe(true)
      expect(result.type).toBe('COPIA_COLA')
      expect(result.pixKey).toBe('12345678901')
      expect(result.pixKeyType).toBe('CPF')
      expect(result.amount).toBe(99.5)
      expect(result.merchantName).toBe('LOJA TESTE')
      expect(result.merchantCity).toBe('CURITIBA')
    })
  })

  describe('key type detection (CHAVE)', () => {
    it('detects CPF (11 digits)', () => {
      const result = parsePix('12345678901')
      expect(result.success).toBe(true)
      expect(result.type).toBe('CHAVE')
      expect(result.pixKeyType).toBe('CPF')
    })

    it('detects CPF with formatting', () => {
      const result = parsePix('123.456.789-01')
      expect(result.pixKeyType).toBe('CPF')
    })

    it('detects CNPJ (14 digits)', () => {
      const result = parsePix('12345678000190')
      expect(result.success).toBe(true)
      expect(result.pixKeyType).toBe('CNPJ')
    })

    it('detects CNPJ with formatting', () => {
      const result = parsePix('12.345.678/0001-90')
      expect(result.pixKeyType).toBe('CNPJ')
    })

    it('detects EMAIL', () => {
      const result = parsePix('user@example.com')
      expect(result.success).toBe(true)
      expect(result.pixKeyType).toBe('EMAIL')
    })

    it('detects PHONE with +55 prefix', () => {
      const result = parsePix('+5541999998888')
      expect(result.success).toBe(true)
      expect(result.pixKeyType).toBe('PHONE')
    })

    it('detects PHONE with 10 digits (landline)', () => {
      const result = parsePix('4133334444')
      expect(result.pixKeyType).toBe('PHONE')
    })

    it('detects EVP (UUID)', () => {
      const result = parsePix('123e4567-e89b-12d3-a456-426614174000')
      expect(result.success).toBe(true)
      expect(result.pixKeyType).toBe('EVP')
    })

    it('falls back to EVP for unknown format', () => {
      const result = parsePix('some-random-key')
      expect(result.success).toBe(true)
      expect(result.pixKeyType).toBe('EVP')
    })
  })
})
