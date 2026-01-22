// Schafkopf Regelwerk - Durchsuchbare Referenz

import { RulebookSection } from './types';

export const RULEBOOK_SECTIONS: RulebookSection[] = [
  {
    id: 'kartenspiel',
    title: 'Das Kartenspiel',
    icon: '🎴',
    keywords: ['karten', 'blatt', 'deck', 'farben', 'werte', 'bayerisch'],
    content: `Das **Bayerische Blatt** besteht aus 24 Karten (Kurzes Blatt).

**Die 4 Farben** (von hoch nach niedrig):
- Eichel (höchste)
- Gras (auch: Laub)
- Herz
- Schellen (niedrigste)

**Die 6 Werte je Farbe**:
- Sau (Ass) - höchste Farbkarte
- König
- Ober (entspricht Dame)
- Unter (entspricht Bube)
- Zehner
- Neuner - niedrigste Karte`,
    relatedSections: ['augen', 'trumpf'],
    examples: [
      {
        type: 'card-grid',
        cards: ['eichel-ass', 'gras-ass', 'herz-ass', 'schellen-ass'],
        caption: 'Die vier Farben',
      },
    ],
  },

  {
    id: 'augen',
    title: 'Augen & Punkte',
    icon: '💰',
    keywords: ['augen', 'punkte', 'wert', 'zählen', '120', '61'],
    content: `Jede Karte hat einen **Augenwert**:

| Karte | Augen |
|-------|-------|
| Sau (Ass) | 11 |
| Zehner | 10 |
| König | 4 |
| Ober | 3 |
| Unter | 2 |
| Neuner | 0 |

**Wichtig:** Der Zehner ist mehr wert als König, Ober und Unter!

**Gesamtaugen:** 120 (4 Farben × 30 Augen)

**Zum Gewinnen** braucht die Spielerpartei mindestens **61 Augen**.`,
    relatedSections: ['kartenspiel', 'schneider'],
  },

  {
    id: 'trumpf',
    title: 'Trumpf-Ordnung',
    icon: '👑',
    keywords: ['trumpf', 'ober', 'unter', 'herz', 'reihenfolge', 'stechen'],
    content: `**Trumpf** sind besonders starke Karten, die alle Farbkarten schlagen.

**Beim Normalspiel (Sauspiel)** sind Trumpf:
1. Alle 4 Ober (Eichel → Gras → Herz → Schellen)
2. Alle 4 Unter (Eichel → Gras → Herz → Schellen)
3. Restliche 4 Herz-Karten (Sau, 10, König, 9)

= **12 Trümpfe** insgesamt (Herz-Ober und -Unter sind schon oben gezählt)

**Trumpf-Reihenfolge** (höchster zuerst):
Eichel-Ober > Gras-Ober > Herz-Ober > Schellen-Ober >
Eichel-Unter > Gras-Unter > Herz-Unter > Schellen-Unter >
Herz-Sau > Herz-10 > Herz-König > Herz-9`,
    relatedSections: ['wenz', 'geier', 'solo'],
    examples: [
      {
        type: 'trump-order',
        spielart: 'sauspiel',
        caption: 'Trumpf beim Sauspiel',
      },
    ],
  },

  {
    id: 'spielablauf',
    title: 'Spielablauf',
    icon: '🔄',
    keywords: ['ablauf', 'runde', 'phase', 'reihenfolge', 'geben'],
    content: `Eine Schafkopf-Runde läuft so ab:

**1. Geben** - Jeder Spieler bekommt 6 Karten

**2. Legen** (optional) - Spieler können "legen" (Einsatz verdoppeln)

**3. Ansagen** - Reihum wird gefragt, ob jemand spielen will:
- "Weiter" = kein Spiel
- Ansage eines Spiels (Sauspiel, Wenz, Solo...)

**4. Spielen** - 6 Stiche werden gespielt

**5. Abrechnung** - Augen zählen, Gewinner ermitteln

Der **Geber** wechselt jede Runde im Uhrzeigersinn.`,
    relatedSections: ['stich', 'legen', 'ansagen'],
  },

  {
    id: 'stich',
    title: 'Der Stich',
    icon: '🃏',
    keywords: ['stich', 'bedienen', 'farbe', 'gewinnen', 'trick'],
    content: `Ein **Stich** besteht aus 4 Karten - jeder Spieler legt eine.

**Bedienpflicht:** Du musst die angespielte Farbe bedienen!
- Wird Gras angespielt → Gras spielen (wenn vorhanden)
- Wird Trumpf angespielt → Trumpf spielen (wenn vorhanden)
- Nur wenn du nicht bedienen kannst, bist du frei

**Wer gewinnt den Stich?**
1. Wurde Trumpf gespielt? → Höchster Trumpf gewinnt
2. Kein Trumpf? → Höchste Karte der angespielten Farbe gewinnt

Der Stich-Gewinner spielt den nächsten Stich an.`,
    relatedSections: ['spielablauf', 'trumpf'],
  },

  {
    id: 'legen',
    title: 'Legen (Verdoppeln)',
    icon: '💵',
    keywords: ['legen', 'verdoppeln', 'einsatz', 'doppelt'],
    content: `**Legen** bedeutet: Vor dem Ansagen den Einsatz verdoppeln.

Du legst deine Karten verdeckt auf den Tisch - das signalisiert:
"Ich habe gute Karten und verdopple!"

**Wichtig:**
- Du weißt noch nicht, welches Spiel kommt!
- Der Spielwert wird für alle Parteien verdoppelt
- Mehrere Spieler können legen → mehrfache Verdopplung

**Tipp:** Leg nur bei sehr starken Händen (viele hohe Trümpfe).`,
    relatedSections: ['spielablauf', 'du-re'],
  },

  {
    id: 'sauspiel',
    title: 'Das Sauspiel',
    icon: '🐷',
    keywords: ['sauspiel', 'partner', 'sau', 'ass', 'rufen', 'suchen'],
    content: `Das **Sauspiel** ist die häufigste Spielart - ein Partnerspiel.

**Du rufst eine Sau** (Ass) einer Farbe:
- "Ich spiele auf die Eichel" (Eichel-Sau gesucht)
- "Ich spiele auf die Gras"
- "Ich spiele auf die Schellen"

**Regeln:**
- Du darfst nicht die Sau rufen, die du selbst hast
- Du musst mindestens eine Karte dieser Farbe haben
- Herz-Sau kann nicht gerufen werden (ist Trumpf)

**Der Partner:** Wer die gesuchte Sau hat, ist dein Partner!
Er verrät sich durch:
- Spielen der Sau
- Davonlaufen (andere Karte der Suchfarbe bei 4+ Karten)`,
    relatedSections: ['trumpf', 'davonlaufen'],
  },

  {
    id: 'wenz',
    title: 'Der Wenz',
    icon: '🎭',
    keywords: ['wenz', 'unter', 'solo', 'allein'],
    content: `Der **Wenz** ist ein Solo-Spiel - du spielst allein gegen drei.

**Besonderheit:** Nur die **4 Unter** sind Trumpf!
- Ober sind normale Farbkarten
- Herz ist keine Trumpf-Farbe

**Trumpf-Reihenfolge:**
Eichel-Unter > Gras-Unter > Herz-Unter > Schellen-Unter

**Farbrangfolge:** Sau > 10 > König > Ober > 9

**Wann Wenz spielen?**
- Mindestens 3 Unter (besser 4)
- Davon 2+ starke (Eichel, Gras)
- Mehrere Asse`,
    relatedSections: ['trumpf', 'geier', 'solo'],
    examples: [
      {
        type: 'trump-order',
        spielart: 'wenz',
        caption: 'Nur 4 Trümpfe beim Wenz',
      },
    ],
  },

  {
    id: 'geier',
    title: 'Der Geier',
    icon: '🦅',
    keywords: ['geier', 'ober', 'solo', 'allein'],
    content: `Der **Geier** ist das Gegenstück zum Wenz.

**Besonderheit:** Nur die **4 Ober** sind Trumpf!
- Unter sind normale Farbkarten
- Herz ist keine Trumpf-Farbe

**Trumpf-Reihenfolge:**
Eichel-Ober > Gras-Ober > Herz-Ober > Schellen-Ober

**Farbrangfolge:** Sau > 10 > König > Unter > 9

**Wann Geier spielen?**
- Mindestens 3 Ober (besser 4)
- Davon 2+ starke (Eichel, Gras)
- Mehrere Asse und lange Farben`,
    relatedSections: ['trumpf', 'wenz', 'solo'],
    examples: [
      {
        type: 'trump-order',
        spielart: 'geier',
        caption: 'Nur 4 Trümpfe beim Geier',
      },
    ],
  },

  {
    id: 'solo',
    title: 'Das Solo',
    icon: '🎯',
    keywords: ['solo', 'farbsolo', 'allein', 'tout'],
    content: `Beim **Farbsolo** wählst du eine Trumpf-Farbe.

**Trumpf:** Ober + Unter + gewählte Farbe

Beispiel **Eichel-Solo**:
Alle Ober + alle Unter + restliche Eichel = 12 Trümpfe

**Solo-Arten:**
- Eichel-Solo
- Gras-Solo
- Herz-Solo (Standard-Trumpf)
- Schellen-Solo

**Tout:** Sagst du "Tout" an, musst du alle Stiche machen!
- Gelingt es: Doppelter Gewinn
- Verlierst du einen Stich: Doppelter Verlust`,
    relatedSections: ['trumpf', 'wenz', 'geier'],
  },

  {
    id: 'schneider',
    title: 'Schneider & Schwarz',
    icon: '🏆',
    keywords: ['schneider', 'schwarz', 'bonus', '30', '31'],
    content: `Besonders hohe oder niedrige Punktzahlen geben Boni:

**Schneider** (Gegner unter 31 Augen)
→ Doppelter Spielwert

**Schwarz** (Gegner macht keinen Stich / 0 Augen)
→ Dreifacher Spielwert

**Schneider frei:**
Gewinnst du mit 90+ Augen, bist du "Schneider frei" -
der Gegner kann keinen Schneider ansagen.`,
    relatedSections: ['augen', 'laufende'],
  },

  {
    id: 'laufende',
    title: 'Die Laufenden',
    icon: '🏃',
    keywords: ['laufende', 'reihe', 'folge', 'ober', 'bonus'],
    content: `**Laufende** sind aufeinanderfolgende höchste Trümpfe.

Hast du Eichel-Ober, Gras-Ober, Herz-Ober = **3 Laufende**

**Punktwert:**
- 3 Laufende = +1 Punkt
- 4 Laufende = +2 Punkte
- 5+ Laufende = je +1 weiterer Punkt

**Auch negativ:** Fehlen dir die höchsten Trümpfe, zählt das auch!
Hat dein Gegner den Eichel-Ober und die nächsten 2 = er hat 3 Laufende gegen dich.`,
    relatedSections: ['trumpf', 'schneider'],
  },

  {
    id: 'du-re',
    title: 'Du & Re (Kontra)',
    icon: '⚔️',
    keywords: ['du', 're', 'kontra', 'verdoppeln', 'ansage'],
    content: `**Du** (Kontra) und **Re** sind Verdopplungen während des Spiels.

**Du sagen:** Ein Gegner sagt "Du!" - er glaubt, er gewinnt.
→ Spielwert verdoppelt sich

**Re sagen:** Der Spielmacher antwortet "Re!"
→ Spielwert verdoppelt sich nochmal

**Regeln:**
- Du muss vor dem 2. Stich gesagt werden
- Re nur als Antwort auf Du
- Beide Verdopplungen können sich stapeln mit Legen!

**Beispiel:** Sauspiel + 1× Legen + Du + Re = 8-facher Grundwert`,
    relatedSections: ['legen', 'schneider'],
  },

  {
    id: 'davonlaufen',
    title: 'Davonlaufen',
    icon: '🏃‍♂️',
    keywords: ['davonlaufen', 'partner', 'sau', 'suchen', 'signal'],
    content: `**Davonlaufen** ist eine Sonderregel beim Sauspiel.

Wenn du die **gesuchte Sau** hast und **4+ Karten** dieser Farbe:
Du darfst "davonlaufen" - eine andere Karte dieser Farbe zuerst spielen.

**Beispiel:** Schellen-Sau gesucht. Du hast:
Schellen-Sau, Schellen-König, Schellen-10, Schellen-9

→ Du spielst Schellen-König aus
→ Die Sau muss nicht bedient werden
→ Alle wissen jetzt: Du bist der Partner!

**Wichtig:** Davonlaufen ist optional - du kannst auch normal spielen.`,
    relatedSections: ['sauspiel'],
  },

  {
    id: 'schmieren',
    title: 'Schmieren',
    icon: '🍯',
    keywords: ['schmieren', 'punkte', 'partner', 'taktik'],
    content: `**Schmieren** bedeutet: Hohe Augen auf den Stich deines Partners legen.

**Beispiel:**
- Dein Partner sticht mit Trumpf
- Du legst deine Zehn oder Sau dazu
- = 10-11 Extra-Augen für eure Partei!

**Wichtig:** Schmier nur, wenn du sicher bist, dass dein Partner gewinnt!

Sonst machst du ein "Geschenk" an den Gegner.`,
    relatedSections: ['stich', 'tactics'],
  },

  {
    id: 'tactics',
    title: 'Taktik-Tipps',
    icon: '🧠',
    keywords: ['taktik', 'strategie', 'tipps', 'gewinnen'],
    content: `**Grundlegende Taktiken:**

**1. Asse früh einholen**
Hast du eine Sau mit nur 1-2 Beikarten? Spiel sie früh!
Sonst sticht jemand rein.

**2. Trumpf ziehen**
Als Spielmacher früh Trumpf spielen - zieht Gegner-Trümpfe.

**3. Schmieren**
Hohe Karten zum Partner, niedrige zum Gegner.

**4. Farbe stechen**
Kannst du nicht bedienen? Überlege: Reinstechen (Trumpf) oder Abwerfen?

**5. Partner erkennen**
Beobachte: Wer schmiert? Wer sticht aggressiv? Wer bedient nicht?`,
    relatedSections: ['schmieren', 'stich'],
  },
];

// Suche im Regelwerk
export function searchRulebook(query: string): RulebookSection[] {
  if (!query.trim()) return RULEBOOK_SECTIONS;

  const normalizedQuery = query.toLowerCase().trim();

  return RULEBOOK_SECTIONS
    .filter(section => {
      // Titel-Match
      if (section.title.toLowerCase().includes(normalizedQuery)) return true;
      // Keyword-Match
      if (section.keywords.some(k => k.includes(normalizedQuery))) return true;
      // Content-Match
      if (section.content.toLowerCase().includes(normalizedQuery)) return true;
      return false;
    })
    .sort((a, b) => {
      // Exakter Keyword-Match zuerst
      const aExact = a.keywords.some(k => k === normalizedQuery);
      const bExact = b.keywords.some(k => k === normalizedQuery);
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      // Titel-Match vor Content-Match
      const aTitle = a.title.toLowerCase().includes(normalizedQuery);
      const bTitle = b.title.toLowerCase().includes(normalizedQuery);
      if (aTitle && !bTitle) return -1;
      if (!aTitle && bTitle) return 1;
      return 0;
    });
}

// Section nach ID finden
export function getRulebookSection(id: string): RulebookSection | undefined {
  return RULEBOOK_SECTIONS.find(s => s.id === id);
}
