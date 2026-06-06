import { db } from '../src/lib/db/index';
import { agents, scripts, agentScripts } from '../src/lib/db/schema';
import { mockAgents } from '../src/lib/mock-data';
import { salesScripts } from '../src/lib/sales-scripts';

async function seed() {
  console.log('Checking existing data...');

  const existing = await db.select({ id: agents.id }).from(agents).limit(1);
  if (existing.length > 0) {
    console.log('Already seeded. Agents found:', existing.length);
    return;
  }

  // 1. Seed scripts FIRST (referenced by FK)
  console.log('Seeding scripts...');
  for (const s of salesScripts) {
    await db.insert(scripts).values({
      id: s.id,
      name: s.name,
      niche: s.niche,
      description: s.beschreibung,
      version: s.version,
      active: s.aktiv,
      sections: s.abschnitte as any,
      objections: s.einwaende as any,
    });
    console.log('  Script:', s.name);
  }

  // 2. Seed agents
  console.log('Seeding agents...');
  for (const a of mockAgents) {
    await db.insert(agents).values({
      id: a.id,
      name: a.name,
      description: a.beschreibung,
      personality: a.persoenlichkeit,
      language: a.sprache,
      voiceId: a.stimme,
      speed: a.geschwindigkeit,
      temperature: Math.round(a.temperatur * 100),
      active: a.aktiv,
      maxCallsPerDay: a.maxAnrufeProTag,
      workStart: a.arbeitszeiten.start,
      workEnd: a.arbeitszeiten.ende,
      workDays: a.arbeitszeiten.wochentage.join(','),
      niches: a.niches.join(','),
    });
    console.log('  Agent:', a.name);

    // 3. Assign scripts
    for (const sid of a.skriptIds) {
      await db.insert(agentScripts).values({ agentId: a.id, scriptId: sid });
    }
  }

  // Verify
  const agentCount = (await db.select({ id: agents.id }).from(agents)).length;
  const scriptCount = (await db.select({ id: scripts.id }).from(scripts)).length;
  console.log(`Seed complete! ${agentCount} agents, ${scriptCount} scripts`);
}

seed().catch((e) => {
  console.error('Seed error:', e.message);
  process.exit(1);
});
