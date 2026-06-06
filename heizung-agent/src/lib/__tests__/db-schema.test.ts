import { describe, it, expect } from 'vitest';
import { agents, scripts, agentScripts, calls, speechEngines } from '@/lib/db/schema';

describe('db-schema', () => {
  it('agents table has correct column definitions', () => {
    const columns = Object.keys(agents);
    expect(columns).toContain('id');
    expect(columns).toContain('name');
    expect(columns).toContain('personality');
    expect(columns).toContain('speed');
    expect(columns).toContain('temperature');
    expect(columns).toContain('active');
    expect(columns).toContain('niches');
    expect(columns).toContain('workStart');
    expect(columns).toContain('workEnd');
    expect(columns).toContain('workDays');
  });

  it('scripts table has correct column definitions', () => {
    const columns = Object.keys(scripts);
    expect(columns).toContain('id');
    expect(columns).toContain('name');
    expect(columns).toContain('niche');
    expect(columns).toContain('sections');
    expect(columns).toContain('objections');
    expect(columns).toContain('active');
    expect(columns).toContain('version');
  });

  it('calls table has correct column definitions', () => {
    const columns = Object.keys(calls);
    expect(columns).toContain('id');
    expect(columns).toContain('agentId');
    expect(columns).toContain('scriptId');
    expect(columns).toContain('duration');
    expect(columns).toContain('transcript');
    expect(columns).toContain('status');
    expect(columns).toContain('outcome');
  });

  it('agentScripts junction table has correct columns', () => {
    const columns = Object.keys(agentScripts);
    expect(columns).toContain('agentId');
    expect(columns).toContain('scriptId');
  });

  it('speechEngines table has correct columns', () => {
    const columns = Object.keys(speechEngines);
    expect(columns).toContain('engineId');
    expect(columns).toContain('wsUrl');
    expect(columns).toContain('voiceId');
  });
});
