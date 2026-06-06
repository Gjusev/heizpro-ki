import type { SalesScript, NicheConfig, ScriptSection, Objection } from '@/types';

// ============================================
// Verkaufsskripte - Deutsche Heizungsbranche
// ============================================

export const nicheConfigs: NicheConfig[] = [
  {
    id: 'waermepumpe',
    name: 'Wärmepumpe',
    beschreibung: 'Luft-Wasser, Sole-Wasser und Luft-Luft Wärmepumpen für energieeffizientes Heizen',
    zielgruppe: 'Hausbesitzer mit Gas-/Ölheizung, Gebäudeenergiegesetz (GEG) Betroffene',
    saisonaleRelevanz: [4, 3, 4, 7, 8, 9, 10, 9, 8, 7, 5, 4],
    durchschnittlicherAuftragswert: 18000,
    conversionRate: 0.12,
    farbcode: '#10b981',
  },
  {
    id: 'gasheizung',
    name: 'Gasheizung / Brennwerttechnik',
    beschreibung: 'Moderne Brennwertheizungen und Gasbrennwertkessel',
    zielgruppe: 'Bestandsbau mit Gasanschluss, Austausch alter Anlagen',
    saisonaleRelevanz: [5, 4, 3, 3, 4, 5, 6, 7, 9, 10, 10, 8],
    durchschnittlicherAuftragswert: 7500,
    conversionRate: 0.15,
    farbcode: '#f59e0b',
  },
  {
    id: 'klimaanlage',
    name: 'Klimaanlage / Klimatisierung',
    beschreibung: 'Split-Klimaanlagen, Multi-Split-Systeme und Klimaanlagen mit Heizfunktion',
    zielgruppe: 'Büros, Praxen, Wohnungen, Einfamilienhäuser',
    saisonaleRelevanz: [2, 2, 3, 5, 7, 10, 10, 10, 7, 4, 2, 2],
    durchschnittlicherAuftragswert: 4500,
    conversionRate: 0.18,
    farbcode: '#3b82f6',
  },
  {
    id: 'solarthermie',
    name: 'Solarthermie',
    beschreibung: 'Solaranlagen zur Trinkwassererwärmung und Heizungsunterstützung',
    zielgruppe: 'Südausgerichtete Dächer, ökologisch bewusste Hausbesitzer',
    saisonaleRelevanz: [3, 3, 5, 7, 9, 10, 10, 9, 7, 5, 3, 2],
    durchschnittlicherAuftragswert: 8500,
    conversionRate: 0.10,
    farbcode: '#eab308',
  },
  {
    id: 'pelletsheizung',
    name: 'Pelletheizung',
    beschreibung: 'Automatische PelletZentralheizungen und Pelletofen',
    zielgruppe: 'Einfamilienhäuser ohne Gasanschluss, ökologisch orientierte Bauherren',
    saisonaleRelevanz: [4, 3, 3, 4, 5, 6, 7, 8, 9, 10, 9, 6],
    durchschnittlicherAuftragswert: 16000,
    conversionRate: 0.09,
    farbcode: '#8b5cf6',
  },
  {
    id: 'fussbodenheizung',
    name: 'Fußbodenheizung',
    beschreibung: 'Flächenheizungssysteme für Neubau und Renovierung',
    zielgruppe: 'Renovierer, Neubauer, Sanierungsbedürftige',
    saisonaleRelevanz: [3, 3, 4, 5, 6, 7, 8, 8, 7, 6, 4, 3],
    durchschnittlicherAuftragswert: 12000,
    conversionRate: 0.11,
    farbcode: '#ec4899',
  },
  {
    id: 'sanitaer',
    name: 'Sanitär / Badrenovierung',
    beschreibung: 'Komplette Badsanierung, Badmodernisierung und Barrierefrei-Umbau',
    zielgruppe: 'Hausbesitzer mit veraltetem Bad, altersgerechte Umbauten',
    saisonaleRelevanz: [5, 4, 5, 6, 7, 8, 8, 7, 6, 5, 4, 4],
    durchschnittlicherAuftragswert: 14000,
    conversionRate: 0.13,
    farbcode: '#06b6d4',
  },
  {
    id: 'hybridheizung',
    name: 'Hybridheizung',
    beschreibung: 'Kombination aus Gas-/Ölbrennwert und Wärmepumpe',
    zielgruppe: 'Hausbesitzer in der Übergangsphase, unsichere Energiepreisentwicklung',
    saisonaleRelevanz: [4, 3, 4, 6, 7, 8, 9, 9, 8, 7, 5, 4],
    durchschnittlicherAuftragswert: 15000,
    conversionRate: 0.10,
    farbcode: '#f97316',
  },
];

// ============================================
// SKRIPT: Wärmepumpe
// ============================================
const waermepumpeAbschnitte: ScriptSection[] = [
  {
    phase: 'begruessung',
    headline: 'Begrüßung & Einstieg',
    haupttext:
      'Guten Tag, mein Name ist [Agent-Name] von [Firma]. Ich rufe Sie heute an, weil wir gerade in Ihrer Region ein spezielles Beratungsangebot für energieeffizientes Heizen durchführen. Stören ich Sie gerade?',
    varianten: [
      'Guten Tag Herr/Frau [Name], mein Name ist [Agent-Name] von [Firma]. Wir helfen Hausbesitzern in [Ort] dabei, bis zu 60% ihrer Heizkosten zu sparen. Haben Sie vielleicht 2-3 Minuten Zeit?',
      'Hallo Herr/Frau [Name], [Agent-Name] hier von [Firma]. Wir sind Ihr regionaler Experte für Wärmepumpen und erneuerbare Energien. Ich habe eine wichtige Information zum Gebäudeenergiegesetz für Sie – darf ich kurz etwas dazu sagen?',
    ],
    triggers: ['hallo', 'guten tag', 'ja', 'gerne', 'zuhoeren'],
  },
  {
    phase: 'bedarfsanalyse',
    headline: 'Bedarfsanalyse',
    haupttext:
      'Darf ich kurz fragen: Wann wurde Ihre aktuelle Heizung zuletzt gewartet oder ausgetauscht? Und welche Art von Heizung haben Sie aktuell im Einsatz?',
    varianten: [
      'Wissen Sie eigentlich, wie alt Ihre Heizungsanlage ist? Heizungen, die älter als 15 Jahre sind, verbrauchen bis zu 40% mehr Energie als moderne Systeme.',
      'Nutzen Sie aktuell noch eine Gas- oder Ölheizung? Haben Sie sich schon einmal mit dem Thema Wärmepumpe beschäftigt?',
      'Wie hoch sind ungefähr Ihre jährlichen Heizkosten? Bei vielen Hausbesitzern in Ihrer Region konnten wir die Kosten um mehr als die Hälfte senken.',
    ],
    triggers: ['heizung', 'gas', 'oel', 'alt', 'kosten', 'energie'],
  },
  {
    phase: 'praesentation',
    headline: 'Präsentation Wärmepumpe',
    haupttext:
      'Das ist genau der richtige Moment! Eine Wärmepumpe nutzt die kostenlose Umweltenergie aus Luft, Erdreich oder Wasser. Das bedeutet: Sie können bis zu 60% Ihrer Heizkosten einsparen. Und das Beste: Mit den aktuellen Förderprogrammen der KfW bekommen Sie bis zu 40% der Kosten erstattet. Bei einem durchschnittlichen Einfamilienhaus sprechen wir von einer Förderung von bis zu 7.200€.',
    varianten: [
      'Die moderne Luft-Wasser-Wärmepumpe ist die perfekte Lösung für Ihr Haus. Sie arbeitet extrem leise, ist wartungsarm und heizt Ihr Zuhause zu einem Bruchteil Ihrer aktuellen Kosten. Im Sommer kann sie sogar kühlen!',
      'Stellen Sie sich vor: Ihre Heizung produziert 4 kW Wärme aus nur 1 kW Strom. Das ist die Effizienz einer Wärmepumpe. Und mit der aktuellen KfW-Förderung amortisiert sich die Anlage in nur 5-7 Jahren.',
    ],
    triggers: ['interessant', 'waermepumpe', 'foerderung', 'kosten', 'ersparnis', 'effizienz'],
  },
  {
    phase: 'einwandbehandlung',
    headline: 'Einwandbehandlung',
    haupttext:
      'Das verstehe ich vollkommen. Viele unserer Kunden hatten anfangs ähnliche Bedenken. Lassen Sie mich dazu folgendes sagen...',
    varianten: [],
    triggers: ['aber', 'teuer', 'nicht', 'zweifel', 'unbedingt', 'bedenken'],
  },
  {
    phase: 'abschluss',
    headline: 'Abschluss & Terminvereinbarung',
    haupttext:
      'Wie wäre es, wenn wir Ihnen einen unverbindlichen Beratungstermin anbieten? Unser Energieberater kommt zu Ihnen nach Hause, prüft Ihre Situation vor Ort und erstellt Ihnen ein individuelles Angebot inklusive aller Fördermöglichkeiten. Dieser Termin ist für Sie komplett kostenlos und unverbindlich. Wann würde es Ihnen am besten passen – diese Woche oder lieber nächste Woche?',
    varianten: [
      'Ich würde Ihnen empfehlen, sich das einmal unverbindlich vor Ort zeigen zu lassen. Unser Berater berechnet Ihnen genau, wie viel Sie sparen können und welche Förderungen Ihnen zustehen. Passt es Ihnen vielleicht am [Tag] um [Uhrzeit]?',
      'Der nächste Schritt ist einfach: Wir vereinbaren einen kostenlosen Vor-Ort-Termin. Innerhalb von 30 Minuten wissen Sie genau, ob eine Wärmepumpe für Ihr Haus geeignet ist und wie viel Sie sparen. Sollen wir direkt einen Termin festlegen?',
    ],
    triggers: ['termin', 'beratung', 'vorbeikommen', 'angebot'],
  },
  {
    phase: 'verabschiedung',
    headline: 'Verabschiedung',
    haupttext:
      'Vielen Dank für Ihre Zeit, Herr/Frau [Name]. Ich freue mich auf unseren Termin am [Datum] um [Uhrzeit]. Unser Berater wird Sie pünktlich besuchen. Sollten Sie in der Zwischenzeit Fragen haben, erreichen Sie uns unter [Telefonnummer]. Ich wünsche Ihnen noch einen schönen Tag!',
    varianten: [
      'Herzlichen Dank für das Gespräch! Wir melden uns am [Datum] zur Bestätigung noch einmal bei Ihnen. Bis dahin wünsche ich Ihnen alles Gute!',
    ],
    triggers: ['danke', 'auf wiedersehen', 'bis', 'tag'],
  },
];

const waermepumpeEinwaende: Objection[] = [
  {
    id: 'wp-1',
    kategorie: 'Kosten',
    einwand: 'Eine Wärmepumpe ist viel zu teuer.',
    antworten: [
      'Das ist ein berechtigter Punkt. Aber rechnen wir einmal: Die Anschaffungskosten liegen bei ca. 15.000-20.000€, abzüglich KfW-Förderung von bis zu 40% bleiben ca. 9.000-12.000€. Bei einer jährlichen Ersparnis von 1.500-2.500€ amortisiert sich die Anlage in nur 5-7 Jahren. Danach sparen Sie jedes Jahr bares Geld.',
      'Auf den ersten Blick wirkt das so. Aber bedenken Sie: Die KfW fördert mit bis zu 40%, viele Kommunen geben zusätzliche Zuschüsse. Und die laufenden Kosten sinken drastisch. In der Summe ist die Wärmepumpe langfristig die günstigste Lösung.',
    ],
  },
  {
    id: 'wp-2',
    kategorie: 'Leistung',
    einwand: 'Eine Wärmepumpe heizt nicht genug, besonders im Winter nicht.',
    antworten: [
      'Das war früher bei alten Modellen tatsächlich ein Thema. Moderne Wärmepumpen arbeiten jedoch selbst bei -20°C noch effizient. Die Technologie hat sich enorm weiterentwickelt. In unserem individuellen Check berechnen wir genau die Leistung, die Ihr Haus braucht.',
      'Moderne Inverter-Wärmepumpen erreichen Arbeitszahlen von über 4,0 – auch bei tiefen Temperaturen. In Kombination mit einem Puffer ist die Heizleistung auch an den kältesten Tagen ausreichend.',
    ],
  },
  {
    id: 'wp-3',
    kategorie: 'Gebäude',
    einwand: 'Mein Haus ist zu schlecht isoliert für eine Wärmepumpe.',
    antworten: [
      'Das müssen wir erst einmal prüfen! Tatsächlich funktionieren Wärmepumpen auch in Altbauten hervorragend, wenn die Anlage richtig dimensioniert wird. In vielen Fällen reicht es aus, die Heizkörper durch größere zu ersetzen oder mit einer Fußbodenheizung zu kombinieren. Unser Energieberater prüft das kostenlos bei Ihnen vor Ort.',
    ],
  },
  {
    id: 'wp-4',
    kategorie: 'Zeitpunkt',
    einwand: 'Ich möchte noch warten / Brauche nicht sofort.',
    antworten: [
      'Verständlich! Aber zwei Gründe sprechen für jetzt: Erstens – die KfW-Förderung ist befristet und kann jederzeit gekürzt werden. Zweitens – ab 2024 greift das Gebäudeenergiegesetz. Wenn Ihre Heizung ausfällt, müssen Sie ohnehin auf 65% erneuerbare Energien umsteigen. Mit einem Beratungstermin jetzt sind Sie bestens vorbereitet.',
      'Natürlich müssen Sie nicht sofort eine Entscheidung treffen. Aber die Fördergelder sind begrenzt. Lassen Sie uns einen unverbindlichen Beratungstermin vereinbaren – so wissen Sie genau, woran Sie sind.',
    ],
  },
  {
    id: 'wp-5',
    kategorie: 'Lärm',
    einwand: 'Wärmepumpen sind zu laut.',
    antworten: [
      'Moderne Wärmepumpen arbeiten extrem leise – mit Schallpegeln von nur 35-45 dB(A). Das entspricht einer leisen Unterhaltung. Zudem gibt es klare Vorschriften zum Lärmschutz, die wir bei der Installation selbstverständlich einhalten. Bei der Vor-Ort-Beratung zeigen wir Ihnen gerne, wo die Anlage optimal platziert wird.',
    ],
  },
];

// ============================================
// SKRIPT: Klimaanlage
// ============================================
const klimaanlageAbschnitte: ScriptSection[] = [
  {
    phase: 'begruessung',
    headline: 'Begrüßung',
    haupttext:
      'Guten Tag, [Agent-Name] hier von [Firma]. Wir sind Ihr Spezialist für Raumklima und Klimatisierung in [Region]. Mit sommerlichen Temperaturen bis 40°C denken viele an eine Klimaanlage – dürfen ich Ihnen kurz zeigen, wie günstig und effektiv das heute ist?',
    varianten: [
      'Guten Tag Herr/Frau [Name], hier spricht [Agent-Name] von [Firma]. Angesicht der steigenden Temperaturen möchten wir Ihnen ein attraktives Angebot für eine moderne Klimaanlage vorstellen. Haben Sie 2 Minuten?',
    ],
    triggers: ['ja', 'gerne', 'hallo', 'guten tag'],
  },
  {
    phase: 'bedarfsanalyse',
    headline: 'Bedarfsanalyse',
    haupttext:
      'Darf ich fragen: Wie hoch sind die Temperaturen in Ihren Räumen im Sommer? Haben Sie bereits über eine Klimatisierung nachgedacht?',
    varianten: [
      'Wie schaffen Sie es aktuell durch die heißen Sommermonate? Ventilatoren helfen ja leider nur begrenzt...',
      'Sind Ihre Räume im Sommer gut nutzbar, oder wird es unerträglich heiß? Gerade in Dachgeschossen kennen wir das Problem.',
    ],
    triggers: ['heiss', 'sommer', 'temperatur', 'ventilator', 'dach'],
  },
  {
    phase: 'praesentation',
    headline: 'Präsentation Klimaanlage',
    haupttext:
      'Moderne Klimaanlagen sind leise, energieeffizient und sogar zum Heizen geeignet! Eine Split-Klimaanlage für einen Raum kostet ab 1.500€ inklusive Installation. Und das Beste: Sie verbessert auch die Luftqualität durch integrierte Filter. Im Winter kann sie sogar als Zusatzheizung dienen.',
    varianten: [
      'Die neuen Inverter-Klimaanlagen verbrauchen bis zu 50% weniger Strom als ältere Modelle. Mit der Klimaanlage von [Marke] bekommen Sie leises, effizientes Kühlen UND Heizen in einem Gerät. Ab 1.500€ installiert.',
    ],
    triggers: ['interessant', 'preis', 'klimaanlage', 'kuehlen'],
  },
  {
    phase: 'einwandbehandlung',
    headline: 'Einwandbehandlung',
    haupttext: 'Das verstehe ich. Lassen Sie mich darauf eingehen...',
    varianten: [],
    triggers: ['teuer', 'laut', 'strom', 'gesundheit'],
  },
  {
    phase: 'abschluss',
    headline: 'Abschluss',
    haupttext:
      'Sollen wir Ihnen ein unverbindliches Angebot erstellen? Unser Fachberater kommt kostenlos bei Ihnen vorbei, misst die Räume und zeigt Ihnen die beste Lösung. Passt es Ihnen vielleicht am [Tag]?',
    varianten: [
      'Wie wäre es mit einem kostenlosen Beratungstermin? Innerhalb von 20 Minuten wissen Sie genau, welche Lösung für Ihre Räume optimal ist.',
    ],
    triggers: ['angebot', 'beratung', 'termin'],
  },
  {
    phase: 'verabschiedung',
    headline: 'Verabschiedung',
    haupttext:
      'Vielen Dank für Ihre Zeit! Unser Fachberater meldet sich bei Ihnen zum vereinbarten Termin. Ich wünsche Ihnen noch einen angenehmen Tag!',
    varianten: [],
    triggers: ['danke', 'wiedersehen'],
  },
];

const klimaanlageEinwaende: Objection[] = [
  {
    id: 'kl-1',
    kategorie: 'Gesundheit',
    einwand: 'Klimaanlagen machen krank / Zugluft ist ungesund.',
    antworten: [
      'Das ist ein weit verbreiteter Mythos! Moderne Klimaanlagen verbessern sogar die Luftqualität durch integrierte Filter, die Allergene und Feinstaub herausfiltern. Zugluft entsteht nur bei falscher Einstellung. Wir beraten Sie gerne zur optimalen Luftverteilung.',
    ],
  },
  {
    id: 'kl-2',
    kategorie: 'Kosten',
    einwand: 'Klimaanlagen verbrauchen zu viel Strom.',
    antworten: [
      'Moderne Inverter-Klimaanlagen der Energieeffizienzklasse A+++ verbrauchen erstaunlich wenig. Ein durchschnittlicher Raum kostet nur ca. 15-25€ pro Monat im Sommerbetrieb. Das ist weniger als viele Heizlüfter im Winter verbrauchen!',
    ],
  },
  {
    id: 'kl-3',
    kategorie: 'Lärm',
    einwand: 'Klimaanlagen sind zu laut.',
    antworten: [
      'Die Innengeräte moderner Klimaanlagen arbeiten mit nur 19-25 dB – das ist flüsterleise! Sie werden im Normalbetrieb kaum bemerken, dass die Anlage läuft. Auch die Außengeräte sind deutlich leiser geworden.',
    ],
  },
];

// ============================================
// SKRIPT: Gasheizung / Brennwerttechnik
// ============================================
const gasheizungAbschnitte: ScriptSection[] = [
  {
    phase: 'begruessung',
    headline: 'Begrüßung',
    haupttext:
      'Guten Tag, [Agent-Name] von [Firma]. Ich rufe Sie an, weil wir aktuell eine kostenlose Überprüfung für Gasheizungen in Ihrer Region anbieten. Eine alte Heizung kostet Sie bares Geld – darf ich Ihnen kurz erklären, warum?',
    varianten: [
      'Guten Tag Herr/Frau [Name], hier ist [Agent-Name] von [Firma]. Wir prüfen gerade, ob Hausbesitzer in [Ort] von einer modernen Brennwertheizung profitieren können. Haben Sie kurz Zeit?',
    ],
    triggers: ['ja', 'gerne', 'hallo', 'natuerlich'],
  },
  {
    phase: 'bedarfsanalyse',
    headline: 'Bedarfsanalyse',
    haupttext:
      'Wann wurde Ihre Heizung zuletzt geprüft? Wissen Sie, wie alt Ihr Kessel ist? Heizungen, die älter als 15 Jahre sind, arbeiten mit einem Wirkungsgrad von oft nur 60-70%. Das bedeutet, 30-40% Ihrer Energiekosten gehen ungenutzt durch den Schornstein.',
    varianten: [
      'Ist Ihre Gasheizung schon älter als 15 Jahre? Dann verbraucht sie wahrscheinlich deutlich mehr als nötig.',
    ],
    triggers: ['heizung', 'alter', 'gas', 'kessel', 'wartung'],
  },
  {
    phase: 'praesentation',
    headline: 'Präsentation Brennwerttechnik',
    haupttext:
      'Eine moderne Brennwertheizung nutzt die Abgaswärme, die bei alten Heizungen ungenutzt verloren geht. Der Wirkungsgrad steigt auf über 98%! Das bedeutet: Sie sparen sofort 20-35% Ihrer Gasrechnung. Bei typischen Jahreskosten von 2.000€ sind das 400-700€ Ersparnis pro Jahr!',
    varianten: [
      'Mit einer neuen Brennwertheizung nutzen Sie die Energie fast zu 100%. Der Austausch ist unkompliziert – meist innerhalb eines Tages erledigt. Und die Ersparnis merken Sie ab dem ersten Monat.',
    ],
    triggers: ['ersparnis', 'brennwert', 'effizienz', 'austausch'],
  },
  {
    phase: 'einwandbehandlung',
    headline: 'Einwandbehandlung',
    haupttext: 'Das verstehe ich. Lassen Sie mich darauf eingehen...',
    varianten: [],
    triggers: ['teuer', 'nicht_notwendig', 'funktioniert_noch'],
  },
  {
    phase: 'abschluss',
    headline: 'Abschluss',
    haupttext:
      'Sollen wir einen kostenlosen Vor-Ort-Termin vereinbaren? Unser Heizungsexperte prüft Ihre Anlage und zeigt Ihnen genau, wie viel Sie sparen können. Der Termin ist kostenlos und unverbindlich. Passt es Ihnen am [Tag]?',
    varianten: [],
    triggers: ['termin', 'beratung', 'angebot'],
  },
  {
    phase: 'verabschiedung',
    headline: 'Verabschiedung',
    haupttext:
      'Vielen Dank für das Gespräch, Herr/Frau [Name]. Wir sehen uns am [Datum] um [Uhrzeit]. Ich wünsche Ihnen noch einen schönen Tag!',
    varianten: [],
    triggers: ['danke', 'wiedersehen'],
  },
];

const gasheizungEinwaende: Objection[] = [
  {
    id: 'gh-1',
    kategorie: 'Kosten',
    einwand: 'Meine Heizung funktioniert noch, warum soll ich sie austauschen?',
    antworten: [
      'Das verstehe ich! Aber denken Sie an die laufenden Kosten: Eine alte Heizung verbraucht 30-40% mehr Gas als nötig. Bei 2.000€ Jahreskosten werfen Sie jedes Jahr 600-800€ buchstäblich aus dem Fenster. Und wenn die Heizung im Winter ausfällt, wird es notfallmäßig teuer.',
    ],
  },
  {
    id: 'gh-2',
    kategorie: 'Gesetzgebung',
    einwand: 'Muss ich überhaupt etwas tun? Was sagt das Gesetz?',
    antworten: [
      'Gute Frage! Das Gebäudeenergiegesetz (GEG) schreibt vor, dass beim Austausch einer alten Heizung mindestens 65% erneuerbare Energien genutzt werden müssen. Wenn Sie jetzt planen, haben Sie noch alle Optionen. Wir beraten Sie gerne zu den verschiedenen Möglichkeiten.',
    ],
  },
];

// ============================================
// Alle Skripte exportieren
// ============================================
export const salesScripts: SalesScript[] = [
  {
    id: 'script-waermepumpe-01',
    name: 'Wärmepumpe – Kaltakquise',
    niche: 'waermepumpe',
    beschreibung: 'Standard-Kaltakquise-Skript für Wärmepumpenberatung mit Fokus auf KfW-Förderung und Energieersparnis',
    version: '2.1',
    aktiv: true,
    abschnitte: waermepumpeAbschnitte,
    einwaende: waermepumpeEinwaende,
    erstelltAm: '2024-01-15',
    aktualisiertAm: '2024-03-20',
  },
  {
    id: 'script-klimaanlage-01',
    name: 'Klimaanlage – Sommerkampagne',
    niche: 'klimaanlage',
    beschreibung: 'Saisonales Skript für Klimaanlagenverkauf, ideal für Mai bis September',
    version: '1.5',
    aktiv: true,
    abschnitte: klimaanlageAbschnitte,
    einwaende: klimaanlageEinwaende,
    erstelltAm: '2024-04-01',
    aktualisiertAm: '2024-05-15',
  },
  {
    id: 'script-gasheizung-01',
    name: 'Brennwertheizung – Effizienz-Check',
    niche: 'gasheizung',
    beschreibung: 'Kaltakquise-Skript mit Fokus auf veraltete Heizungsanlagen und Energieeinsparung',
    version: '1.3',
    aktiv: true,
    abschnitte: gasheizungAbschnitte,
    einwaende: gasheizungEinwaende,
    erstelltAm: '2024-02-10',
    aktualisiertAm: '2024-04-05',
  },
];

// ============================================
// Hilfsfunktionen
// ============================================
export function getScriptByNiche(niche: string): SalesScript | undefined {
  return salesScripts.find((s) => s.niche === niche && s.aktiv);
}

export function getObjectionResponse(kategorie: string, niche: string): string[] {
  const script = getScriptByNiche(niche);
  if (!script) return [];
  const objection = script.einwaende.find((e) => e.kategorie.toLowerCase() === kategorie.toLowerCase());
  return objection?.antworten || [];
}

export function getNicheConfig(niche: string): NicheConfig | undefined {
  return nicheConfigs.find((n) => n.id === niche);
}
