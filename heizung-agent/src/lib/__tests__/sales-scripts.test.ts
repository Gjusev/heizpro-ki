import { describe, it, expect } from 'vitest';
import {
  salesScripts,
  nicheConfigs,
  getScriptByNiche,
  getObjectionResponse,
  getNicheConfig,
} from '@/lib/sales-scripts';

describe('sales-scripts', () => {
  describe('salesScripts', () => {
    it('has 3 scripts', () => {
      expect(salesScripts).toHaveLength(3);
    });

    it('each script has required fields', () => {
      for (const script of salesScripts) {
        expect(script.id).toBeTruthy();
        expect(script.name).toBeTruthy();
        expect(script.niche).toBeTruthy();
        expect(script.abschnitte).toBeInstanceOf(Array);
        expect(script.einwaende).toBeInstanceOf(Array);
        expect(script.aktiv).toBe(true);
      }
    });

    it('each script has 6 phases', () => {
      for (const script of salesScripts) {
        expect(script.abschnitte).toHaveLength(6);
        const phases = script.abschnitte.map((s) => s.phase);
        expect(phases).toContain('begruessung');
        expect(phases).toContain('bedarfsanalyse');
        expect(phases).toContain('praesentation');
        expect(phases).toContain('einwandbehandlung');
        expect(phases).toContain('abschluss');
        expect(phases).toContain('verabschiedung');
      }
    });

    it('each section has triggers array', () => {
      for (const script of salesScripts) {
        for (const section of script.abschnitte) {
          expect(section.triggers).toBeInstanceOf(Array);
          expect(section.haupttext).toBeTruthy();
        }
      }
    });

    it('each objection has array of antworten', () => {
      for (const script of salesScripts) {
        for (const obj of script.einwaende) {
          expect(obj.antworten).toBeInstanceOf(Array);
          expect(obj.antworten.length).toBeGreaterThan(0);
          for (const a of obj.antworten) {
            expect(typeof a).toBe('string');
          }
        }
      }
    });
  });

  describe('nicheConfigs', () => {
    it('has 8 niches', () => {
      expect(nicheConfigs).toHaveLength(8);
    });

    it('each niche has required fields', () => {
      for (const niche of nicheConfigs) {
        expect(niche.id).toBeTruthy();
        expect(niche.name).toBeTruthy();
        expect(niche.farbcode).toMatch(/^#/);
        expect(niche.durchschnittlicherAuftragswert).toBeGreaterThan(0);
        expect(niche.conversionRate).toBeGreaterThan(0);
        expect(niche.conversionRate).toBeLessThanOrEqual(1);
        expect(niche.saisonaleRelevanz).toHaveLength(12);
      }
    });

    it('has expected niche IDs', () => {
      const ids = nicheConfigs.map((n) => n.id);
      expect(ids).toContain('waermepumpe');
      expect(ids).toContain('gasheizung');
      expect(ids).toContain('klimaanlage');
      expect(ids).toContain('solarthermie');
    });
  });

  describe('getScriptByNiche()', () => {
    it('finds active script by niche', () => {
      const wp = getScriptByNiche('waermepumpe');
      expect(wp).toBeTruthy();
      expect(wp!.niche).toBe('waermepumpe');
    });

    it('finds klimaanlage script', () => {
      const kl = getScriptByNiche('klimaanlage');
      expect(kl).toBeTruthy();
      expect(kl!.niche).toBe('klimaanlage');
    });

    it('returns undefined for unknown niche', () => {
      expect(getScriptByNiche('unknown')).toBeUndefined();
    });
  });

  describe('getObjectionResponse()', () => {
    it('finds objection responses by category', () => {
      const responses = getObjectionResponse('Kosten', 'waermepumpe');
      expect(responses.length).toBeGreaterThan(0);
    });

    it('is case-insensitive', () => {
      const r1 = getObjectionResponse('kosten', 'waermepumpe');
      const r2 = getObjectionResponse('KOSTEN', 'waermepumpe');
      expect(r1).toEqual(r2);
    });

    it('returns empty for unknown category', () => {
      expect(getObjectionResponse('nonexistent', 'waermepumpe')).toEqual([]);
    });
  });

  describe('getNicheConfig()', () => {
    it('finds niche by ID', () => {
      const wp = getNicheConfig('waermepumpe');
      expect(wp).toBeTruthy();
      expect(wp!.name).toBe('Wärmepumpe');
    });

    it('returns undefined for unknown niche', () => {
      expect(getNicheConfig('nonexistent')).toBeUndefined();
    });
  });
});
