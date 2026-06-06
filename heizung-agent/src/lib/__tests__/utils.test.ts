import { describe, it, expect } from 'vitest';
import {
  cn,
  formatDuration,
  formatCurrency,
  formatPercent,
  formatDate,
  formatTime,
  getStatusColor,
  getStatusLabel,
  getOutcomeLabel,
} from '@/lib/utils';

describe('utils', () => {
  describe('cn()', () => {
    it('merges class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('handles conditional classes', () => {
      expect(cn('base', false && 'hidden', 'active')).toBe('base active');
    });

    it('handles undefined/null gracefully', () => {
      expect(cn('base', undefined, null)).toBe('base');
    });
  });

  describe('formatDuration()', () => {
    it('formats seconds to mm:ss', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(485)).toBe('8:05');
      expect(formatDuration(3600)).toBe('60:00');
    });
  });

  describe('formatCurrency()', () => {
    it('formats EUR in German locale', () => {
      const result = formatCurrency(18000);
      expect(result).toContain('18.000');
      expect(result).toMatch(/€/);
    });

    it('handles zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });
  });

  describe('formatPercent()', () => {
    it('formats decimal as percentage string', () => {
      expect(formatPercent(0.62)).toBe('62.0%');
      expect(formatPercent(0.145)).toBe('14.5%');
      expect(formatPercent(1)).toBe('100.0%');
    });
  });

  describe('formatDate()', () => {
    it('formats ISO date in German format', () => {
      const result = formatDate('2024-06-05T14:30:00');
      expect(result).toMatch(/05\.06\.2024/);
    });
  });

  describe('formatTime()', () => {
    it('formats ISO date to HH:MM', () => {
      const result = formatTime('2024-06-05T14:30:00');
      expect(result).toMatch(/14:30/);
    });
  });

  describe('getStatusColor()', () => {
    it('returns color classes for known statuses', () => {
      expect(getStatusColor('neu')).toContain('blue');
      expect(getStatusColor('gewonnen')).toContain('emerald');
      expect(getStatusColor('termin_gebucht')).toContain('green');
    });

    it('returns default gray for unknown status', () => {
      expect(getStatusColor('unknown')).toContain('gray');
    });
  });

  describe('getStatusLabel()', () => {
    it('returns German labels for statuses', () => {
      expect(getStatusLabel('neu')).toBe('Neu');
      expect(getStatusLabel('termin_gebucht')).toBe('Termin');
      expect(getStatusLabel('gewonnen')).toBe('Gewonnen');
    });

    it('returns raw status for unknown', () => {
      expect(getStatusLabel('foo')).toBe('foo');
    });
  });

  describe('getOutcomeLabel()', () => {
    it('returns German labels for outcomes', () => {
      expect(getOutcomeLabel('termin_gebucht')).toBe('Termin gebucht');
      expect(getOutcomeLabel('rueckruf')).toBe('Rückruf');
      expect(getOutcomeLabel('kein_interesse')).toBe('Kein Interesse');
    });
  });
});
