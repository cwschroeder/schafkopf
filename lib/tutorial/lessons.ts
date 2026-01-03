// Schafkopf Lektionen-Inhalte

import { Lesson } from './types';

export const LESSONS: Lesson[] = [
  // ========== BASICS ==========
  {
    id: 'basics-kartenspiel',
    title: 'Das Kartenspiel',
    titleBavarian: 'D\'Kartn',
    description: 'Lerne die 24 Karten des bayerischen Blatts kennen.',
    category: 'basics',
    order: 1,
    estimatedMinutes: 5,
    requiredLessons: [],
    content: [
      {
        type: 'text',
        content: `# Das Bayerische Blatt

Schafkopf wird mit dem **Kurzen Blatt** gespielt – das sind **24 Karten**.

Im Gegensatz zum deutschen Blatt (Kreuz, Pik, Herz, Karo) hat das bayerische Blatt eigene Farben und Figuren.`,
      },
      {
        type: 'text',
        content: `## Die 4 Farben

Von der höchsten zur niedrigsten:`,
      },
      {
        type: 'card-grid',
        cards: ['eichel-ass', 'gras-ass', 'herz-ass', 'schellen-ass'],
        caption: 'Eichel (höchste) • Gras • Herz • Schellen (niedrigste)',
      },
      {
        type: 'text',
        content: `## Die 6 Werte je Farbe

Jede Farbe hat 6 Karten:
- **Sau** (Ass) – die höchste Farbkarte
- **König**
- **Ober** – entspricht der Dame
- **Unter** – entspricht dem Buben
- **Zehner**
- **Neuner** – die niedrigste Karte`,
      },
      {
        type: 'card-grid',
        cards: ['herz-ass', 'herz-koenig', 'herz-ober', 'herz-unter', 'herz-10', 'herz-9'],
        caption: 'Die 6 Herz-Karten von hoch nach niedrig',
      },
    ],
    quiz: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Wie viele Karten hat das Schafkopf-Blatt?',
        options: ['32 Karten', '24 Karten', '52 Karten', '36 Karten'],
        correctAnswer: '24 Karten',
        explanation: 'Das "Kurze Blatt" hat 24 Karten: 4 Farben × 6 Werte.',
      },
      {
        id: 'q2',
        type: 'multiple-choice',
        question: 'Welche Farbe ist die höchste?',
        options: ['Herz', 'Eichel', 'Gras', 'Schellen'],
        correctAnswer: 'Eichel',
        explanation: 'Die Reihenfolge ist: Eichel > Gras > Herz > Schellen.',
      },
      {
        id: 'q3',
        type: 'true-false',
        question: 'Der Ober entspricht der Dame im deutschen Blatt.',
        correctAnswer: 'true',
        explanation: 'Richtig! Ober = Dame, Unter = Bube.',
      },
    ],
  },

  {
    id: 'basics-augen',
    title: 'Augen & Punkte',
    titleBavarian: 'D\'Augn',
    description: 'Verstehe das Punktesystem und lerne die Kartenwerte.',
    category: 'basics',
    order: 2,
    estimatedMinutes: 5,
    requiredLessons: ['basics-kartenspiel'],
    content: [
      {
        type: 'text',
        content: `# Das Punktesystem

Beim Schafkopf geht es darum, **Augen** (Punkte) zu sammeln. Jede Karte hat einen festen Augenwert.`,
      },
      {
        type: 'text',
        content: `## Kartenwerte

| Karte | Augen |
|-------|-------|
| Sau (Ass) | **11** |
| Zehner | **10** |
| König | **4** |
| Ober | **3** |
| Unter | **2** |
| Neuner | **0** |

**Merke:** Die Zehn ist mehr wert als König, Ober und Unter!`,
      },
      {
        type: 'card-grid',
        cards: ['herz-ass', 'herz-10', 'herz-koenig', 'herz-ober', 'herz-unter', 'herz-9'],
        caption: '11 + 10 + 4 + 3 + 2 + 0 = 30 Augen pro Farbe',
      },
      {
        type: 'text',
        content: `## Gesamtaugen

Das gesamte Spiel hat **120 Augen** (4 Farben × 30 Augen).

Um ein Spiel zu gewinnen, braucht die Spielerpartei **mindestens 61 Augen**.`,
      },
    ],
    quiz: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Wie viele Augen hat eine Sau (Ass)?',
        options: ['10', '11', '4', '14'],
        correctAnswer: '11',
        explanation: 'Die Sau ist mit 11 Augen die wertvollste Karte.',
      },
      {
        id: 'q2',
        type: 'multiple-choice',
        question: 'Wie viele Augen braucht man zum Gewinnen?',
        options: ['60', '61', '50', '31'],
        correctAnswer: '61',
        explanation: 'Die Spielerpartei braucht mindestens 61 der 120 Augen.',
      },
      {
        id: 'q3',
        type: 'card-select',
        question: 'Welche Karte ist mehr wert: Zehner oder König?',
        cards: ['herz-10', 'herz-koenig'],
        correctAnswer: 'herz-10',
        explanation: 'Der Zehner hat 10 Augen, der König nur 4.',
      },
    ],
  },

  // ========== TRUMPF ==========
  {
    id: 'trump-grundlagen',
    title: 'Trumpf verstehen',
    titleBavarian: 'Trumpf',
    description: 'Lerne was Trumpf ist und warum er so wichtig ist.',
    category: 'trump',
    order: 1,
    estimatedMinutes: 6,
    requiredLessons: ['basics-augen'],
    content: [
      {
        type: 'text',
        content: `# Was ist Trumpf?

**Trumpf** sind besonders starke Karten, die alle anderen Karten schlagen können.

Wenn du Trumpf spielst, gewinnst du den Stich – egal wie hoch die anderen Karten sind!`,
      },
      {
        type: 'text',
        content: `## Trumpf beim Normalspiel (Sauspiel)

Im normalen Schafkopf sind folgende Karten Trumpf:

1. **Alle Ober** (4 Stück)
2. **Alle Unter** (4 Stück)
3. **Alle Herz-Karten** (6 Stück)

Das sind zusammen **14 Trümpfe**.`,
      },
      {
        type: 'trump-order',
        spielart: 'sauspiel',
        caption: 'Trumpf-Reihenfolge beim Sauspiel',
      },
      {
        type: 'text',
        content: `## Die Trumpf-Hierarchie

Die Ober sind die stärksten, dann die Unter, dann Herz:

**Ober:** Eichel > Gras > Herz > Schellen
**Unter:** Eichel > Gras > Herz > Schellen
**Herz:** Sau > 10 > König > 9`,
      },
    ],
    quiz: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Wie viele Trümpfe gibt es beim Sauspiel?',
        options: ['10', '14', '8', '6'],
        correctAnswer: '14',
        explanation: '4 Ober + 4 Unter + 6 Herz = 14 Trümpfe.',
      },
      {
        id: 'q2',
        type: 'multiple-choice',
        question: 'Welcher ist der höchste Trumpf?',
        options: ['Herz-Sau', 'Eichel-Ober', 'Gras-Ober', 'Eichel-Unter'],
        correctAnswer: 'Eichel-Ober',
        explanation: 'Der Eichel-Ober ist der höchste aller Trümpfe.',
      },
      {
        id: 'q3',
        type: 'true-false',
        question: 'Ein Trumpf schlägt immer eine Nicht-Trumpf-Karte.',
        correctAnswer: 'true',
        explanation: 'Richtig! Auch der kleinste Trumpf (Herz-9) schlägt die höchste Farbe.',
      },
    ],
  },

  {
    id: 'trump-wenz',
    title: 'Der Wenz',
    titleBavarian: 'Wenz',
    description: 'Ein Solo-Spiel bei dem nur die Unter Trumpf sind.',
    category: 'trump',
    order: 2,
    estimatedMinutes: 4,
    requiredLessons: ['trump-grundlagen'],
    content: [
      {
        type: 'text',
        content: `# Der Wenz

Der **Wenz** ist ein Solo-Spiel, bei dem du alleine gegen die anderen drei spielst.

Die Besonderheit: **Nur die 4 Unter sind Trumpf!**

Alle anderen Karten (auch Ober und Herz) sind normale Farbkarten.`,
      },
      {
        type: 'trump-order',
        spielart: 'wenz',
        caption: 'Beim Wenz: Nur 4 Trümpfe!',
      },
      {
        type: 'text',
        content: `## Farbrangfolge beim Wenz

Da Ober keine Trümpfe sind, ist die Reihenfolge in jeder Farbe:

**Sau > 10 > König > Ober > 9**

Der Ober ist jetzt eine normale Farbkarte – niedriger als König!`,
      },
      {
        type: 'text',
        content: `## Wann Wenz spielen?

Ein Wenz lohnt sich, wenn du:
- Mindestens **3 Unter** hast (besser 4)
- Starke **hohe Unter** (Eichel, Gras)
- Mehrere **Asse** in verschiedenen Farben`,
      },
    ],
    quiz: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Wie viele Trümpfe gibt es beim Wenz?',
        options: ['14', '4', '8', '6'],
        correctAnswer: '4',
        explanation: 'Nur die 4 Unter sind Trumpf.',
      },
      {
        id: 'q2',
        type: 'true-false',
        question: 'Beim Wenz ist der Ober höher als der König.',
        correctAnswer: 'false',
        explanation: 'Falsch! Beim Wenz ist die Reihenfolge: Sau > 10 > König > Ober > 9.',
      },
    ],
  },

  // ========== SPIELABLAUF ==========
  {
    id: 'gameflow-ueberblick',
    title: 'Spielablauf',
    titleBavarian: 'Wia ma spuit',
    description: 'Verstehe den Ablauf einer Schafkopf-Runde.',
    category: 'gameflow',
    order: 1,
    estimatedMinutes: 5,
    requiredLessons: ['trump-grundlagen'],
    content: [
      {
        type: 'text',
        content: `# Der Spielablauf

Eine Schafkopf-Runde läuft immer gleich ab:

1. **Karten geben** – Jeder bekommt 6 Karten
2. **Legen** – Wer will, kann verdoppeln (optional)
3. **Ansagen** – Wer spielt welches Spiel?
4. **Spielen** – 6 Stiche werden gespielt
5. **Abrechnung** – Wer hat gewonnen?`,
      },
      {
        type: 'text',
        content: `## 1. Legen (Verdoppeln)

Bevor jemand ansagt, können die Spieler **"Legen"**:
- Du legst deine Karten verdeckt auf den Tisch
- Das verdoppelt den Spieleinsatz für diese Runde
- Du weißt noch nicht, welches Spiel kommt!

**Tipp:** Leg nur, wenn du sehr gute Karten hast.`,
      },
      {
        type: 'text',
        content: `## 2. Ansagen

Reihum wird gefragt: "Spielst du was?"

- **"Weiter"** – Du spielst nichts
- **Sauspiel** – Partnerspiel, du suchst eine Sau
- **Wenz/Geier** – Solo mit speziellen Trümpfen
- **Solo** – Alleine gegen alle mit Farbtrumpf

Höhere Spiele (Wenz, Solo) übertreffen niedrigere (Sauspiel).`,
      },
    ],
    quiz: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Was passiert beim "Legen"?',
        options: [
          'Man gibt seine Karten ab',
          'Man verdoppelt den Einsatz',
          'Man zeigt seine Karten',
          'Man tauscht Karten',
        ],
        correctAnswer: 'Man verdoppelt den Einsatz',
        explanation: 'Legen bedeutet, dass der Spielwert verdoppelt wird.',
      },
      {
        id: 'q2',
        type: 'multiple-choice',
        question: 'Was sagt man, wenn man nicht spielen will?',
        options: ['Pass', 'Weiter', 'Nein', 'Schluss'],
        correctAnswer: 'Weiter',
        explanation: '"Weiter" bedeutet, dass man kein Spiel ansagen möchte.',
      },
    ],
  },

  {
    id: 'gameflow-stich',
    title: 'Der Stich',
    titleBavarian: 'Da Stich',
    description: 'Lerne wie ein Stich funktioniert und wer gewinnt.',
    category: 'gameflow',
    order: 2,
    estimatedMinutes: 5,
    requiredLessons: ['gameflow-ueberblick'],
    content: [
      {
        type: 'text',
        content: `# Der Stich

Ein **Stich** besteht aus 4 Karten – jeder Spieler legt eine.

Der Spieler mit der höchsten Karte gewinnt den Stich und sammelt alle 4 Karten ein.`,
      },
      {
        type: 'text',
        content: `## Die Bedien-Pflicht

**Wichtig:** Du musst die angespielte Farbe bedienen!

- Wird Gras angespielt, musst du Gras spielen (wenn du hast)
- Wird Trumpf angespielt, musst du Trumpf spielen
- Nur wenn du nicht bedienen kannst, darfst du frei wählen`,
      },
      {
        type: 'text',
        content: `## Wer gewinnt den Stich?

1. Wurde **Trumpf** gespielt? → Höchster Trumpf gewinnt
2. Kein Trumpf? → Höchste Karte der **angespielten Farbe** gewinnt

Beispiel: Gras wird angespielt
- Spieler A: Gras-König
- Spieler B: Gras-Sau
- Spieler C: Schellen-Sau (kann nicht bedienen)
- Spieler D: Herz-9 (Trumpf)

→ Spieler D gewinnt (Trumpf schlägt alles)`,
      },
    ],
    quiz: [
      {
        id: 'q1',
        type: 'true-false',
        question: 'Man muss immer die angespielte Farbe bedienen.',
        correctAnswer: 'true',
        explanation: 'Richtig! Die Bedienpflicht ist eine Grundregel.',
      },
      {
        id: 'q2',
        type: 'multiple-choice',
        question: 'Gras wird angespielt. Du hast kein Gras. Was darfst du?',
        options: [
          'Nur eine niedrige Karte',
          'Nur Trumpf',
          'Jede beliebige Karte',
          'Gar nichts',
        ],
        correctAnswer: 'Jede beliebige Karte',
        explanation: 'Wenn du nicht bedienen kannst, bist du frei in der Wahl.',
      },
    ],
  },

  // ========== SPIELARTEN ==========
  {
    id: 'gametypes-sauspiel',
    title: 'Das Sauspiel',
    titleBavarian: 'D\'Sau',
    description: 'Das Partnerspiel – finde deinen Mitspieler!',
    category: 'gametypes',
    order: 1,
    estimatedMinutes: 6,
    requiredLessons: ['gameflow-stich'],
    content: [
      {
        type: 'text',
        content: `# Das Sauspiel

Das **Sauspiel** ist die häufigste Spielart. Du spielst mit einem Partner gegen die anderen zwei.

Der Trick: Du weißt am Anfang nicht, wer dein Partner ist!`,
      },
      {
        type: 'text',
        content: `## Die gesuchte Sau

Beim Ansagen rufst du eine Farbe:
- "Ich spiele auf die **Eichel**" (Eichel-Sau gesucht)
- "Ich spiele auf die **Gras**"
- "Ich spiele auf die **Schellen**"

⚠️ Du darfst **nicht** die Sau rufen, die du selbst hast!
⚠️ Du musst mindestens eine Karte dieser Farbe haben.`,
      },
      {
        type: 'text',
        content: `## Der versteckte Partner

Wer die gesuchte Sau hat, ist dein Partner – aber verrät sich nicht sofort!

Der Partner wird erkannt, sobald:
- Er die Sau spielt
- Oder "Davonläuft" (4+ Karten der Farbe hat)

**Tipp:** Beobachte genau, wer wie spielt!`,
      },
      {
        type: 'text',
        content: `## Davonlaufen

Wenn der Inhaber der gesuchten Sau **4 oder mehr Karten** dieser Farbe hat, darf er "davonlaufen":
- Er spielt eine andere Karte dieser Farbe zuerst
- Die Sau muss dann nicht mehr bedient werden

Das ist ein Zeichen an den Spielmacher!`,
      },
    ],
    quiz: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Warum heißt es "Sauspiel"?',
        options: [
          'Weil man eine Sau ruft',
          'Weil es wild zugeht',
          'Weil die Sau Trumpf ist',
          'Wegen des bayerischen Dialekts',
        ],
        correctAnswer: 'Weil man eine Sau ruft',
        explanation: 'Du rufst eine Sau (Ass) einer Farbe – ihr Besitzer ist dein Partner.',
      },
      {
        id: 'q2',
        type: 'true-false',
        question: 'Man darf die Sau rufen, die man selbst hat.',
        correctAnswer: 'false',
        explanation: 'Nein! Du kannst nur eine Sau rufen, die ein anderer hat.',
      },
    ],
  },

  // ========== WERTUNG ==========
  {
    id: 'scoring-grundlagen',
    title: 'Punkte & Wertung',
    titleBavarian: 'D\'Abrechnung',
    description: 'Lerne wie Gewinn und Verlust berechnet werden.',
    category: 'scoring',
    order: 1,
    estimatedMinutes: 5,
    requiredLessons: ['gametypes-sauspiel'],
    content: [
      {
        type: 'text',
        content: `# Die Wertung

Am Ende zählt jede Partei ihre gesammelten Augen:

- **61+ Augen**: Gewonnen!
- **60 Augen**: Unentschieden (selten, Gegner gewinnt)
- **< 60 Augen**: Verloren`,
      },
      {
        type: 'text',
        content: `## Schneider & Schwarz

Besonders hohe/niedrige Punktzahlen geben Boni:

- **Schneider**: Gegner hat weniger als 31 Augen
  → Doppelter Gewinn!

- **Schwarz**: Gegner hat 0 Augen (keinen Stich!)
  → Dreifacher Gewinn!`,
      },
      {
        type: 'text',
        content: `## Die Laufenden

Hast du die höchsten Trümpfe in Folge, gibt es Extra-Punkte:

**3 Laufende** = +1 Punkt (Eichel-Ober, Gras-Ober, Herz-Ober)
**4 Laufende** = +2 Punkte (+ Schellen-Ober)
**5+ Laufende** = jeweils +1 weiterer Punkt

Das gilt auch umgekehrt: Fehlen dir die höchsten, zählt das!`,
      },
      {
        type: 'text',
        content: `## Multiplikatoren

Der Grundwert wird multipliziert:

| Aktion | Multiplikator |
|--------|---------------|
| Legen | ×2 |
| Schneider | ×2 |
| Schwarz | ×3 |
| Du (Kontra) | ×2 |
| Re | ×2 |`,
      },
    ],
    quiz: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Ab wie vielen Augen gewinnt man?',
        options: ['60', '61', '50', '30'],
        correctAnswer: '61',
        explanation: 'Die Spielerpartei braucht mindestens 61 von 120 Augen.',
      },
      {
        id: 'q2',
        type: 'multiple-choice',
        question: 'Was bedeutet "Schneider"?',
        options: [
          'Exakt 60:60',
          'Gegner unter 31 Augen',
          'Alle Stiche gewonnen',
          'Mit Trumpf gewonnen',
        ],
        correctAnswer: 'Gegner unter 31 Augen',
        explanation: 'Schneider heißt, der Gegner hat weniger als 31 Augen gesammelt.',
      },
    ],
  },

  // ========== TAKTIK ==========
  {
    id: 'tactics-basics',
    title: 'Grundtaktiken',
    titleBavarian: 'Wia ma gwinnt',
    description: 'Die wichtigsten Taktiken für Anfänger.',
    category: 'tactics',
    order: 1,
    estimatedMinutes: 7,
    requiredLessons: ['scoring-grundlagen'],
    content: [
      {
        type: 'text',
        content: `# Grundtaktiken

Mit diesen Tipps spielst du sofort besser!`,
      },
      {
        type: 'text',
        content: `## 1. Schmieren

**Schmieren** bedeutet: Hohe Augen auf einen Stich legen, den dein Partner gewinnt.

- Dein Partner sticht mit Trumpf
- Du legst deine Zehn oder Sau dazu
- → 10-11 Extra-Augen für eure Partei!

**Merke:** Schmier nur, wenn du sicher bist, dass dein Partner gewinnt!`,
      },
      {
        type: 'text',
        content: `## 2. Abschmeißen

Das Gegenteil: Leg möglichst **wenig Augen** auf Stiche der Gegner.

- Neuner sind ideal (0 Augen)
- Vermeide es, dem Gegner deine Zehn zu schenken!`,
      },
      {
        type: 'text',
        content: `## 3. Reinstechen

Wenn du nicht bedienen kannst, hast du die Wahl:
- **Reinstechen**: Trumpf spielen und den Stich holen
- **Abwerfen**: Eine schwache Farbkarte loswerden

**Wann reinstechen?**
- Wenn viele Augen im Stich liegen
- Wenn du den Stich unbedingt brauchst
- Um dem Gegner die Sau zu klauen!`,
      },
      {
        type: 'text',
        content: `## 4. Asse (Säue) früh einholen

Hast du eine Sau in einer Farbe mit wenig Karten?
→ Spiel sie früh aus, bevor jemand reinstechen kann!

**Gefährlich:** Eine Sau mit nur 1-2 weiteren Farbkarten
**Sicher:** Eine Sau mit 3+ Karten der Farbe`,
      },
      {
        type: 'text',
        content: `## 5. Trumpf ziehen

Als Spielmacher solltest du **früh Trumpf spielen**:
- Du weißt, wer dein Partner ist (oder spielst allein)
- Ziehst den Gegnern die Trümpfe
- Danach kannst du deine Asse sicher einholen`,
      },
    ],
    quiz: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Was bedeutet "Schmieren"?',
        options: [
          'Dem Gegner Punkte geben',
          'Dem Partner Punkte zuspielen',
          'Trumpf spielen',
          'Bluff spielen',
        ],
        correctAnswer: 'Dem Partner Punkte zuspielen',
        explanation: 'Schmieren = Hohe Augen auf den Stich deines Partners legen.',
      },
      {
        id: 'q2',
        type: 'true-false',
        question: 'Man sollte Asse immer bis zum Schluss aufheben.',
        correctAnswer: 'false',
        explanation: 'Gefährliche Asse (mit wenig Beikarten) sollten früh gespielt werden!',
      },
    ],
  },

  {
    id: 'tactics-partner',
    title: 'Partner erkennen',
    titleBavarian: 'Wer ghört zu mir?',
    description: 'Wie du deinen Partner im Sauspiel erkennst.',
    category: 'tactics',
    order: 2,
    estimatedMinutes: 5,
    requiredLessons: ['tactics-basics'],
    content: [
      {
        type: 'text',
        content: `# Den Partner erkennen

Im Sauspiel ist der Partner anfangs unbekannt. Beobachte genau!`,
      },
      {
        type: 'text',
        content: `## Eindeutige Zeichen

Der Partner ist definitiv bekannt, wenn:
- Er die **gesuchte Sau** spielt
- Er **davonläuft** (andere Karte der Suchfarbe bei 4+ Karten)

Dann wissen alle Bescheid!`,
      },
      {
        type: 'text',
        content: `## Verdächtige Aktionen

Diese Zeichen deuten auf den Partner:
- Schmiert stark auf deine Stiche
- Spielt keine Trümpfe gegen dich
- Bedient die Suchfarbe auffällig lange nicht

Diese Zeichen deuten auf den Gegner:
- Spielt aggressiv Trumpf
- Sticht rein, wenn du fast gewinnst
- Schmiert nicht oder gibt wenig Augen`,
      },
      {
        type: 'text',
        content: `## Als Partner agieren

Wenn du die gesuchte Sau hast:
- **Nicht** sofort verraten (außer bei Davonlaufen)
- Schmier auf die Stiche des Spielmachers
- Hilf mit Trumpf, wenn nötig
- Bring die Sau, wenn es passt (nicht zu früh verlieren!)`,
      },
    ],
    quiz: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Wann ist der Partner definitiv bekannt?',
        options: [
          'Wenn er Trumpf spielt',
          'Wenn er die gesuchte Sau spielt',
          'Nach dem ersten Stich',
          'Wenn er eine Zehn legt',
        ],
        correctAnswer: 'Wenn er die gesuchte Sau spielt',
        explanation: 'Mit dem Spielen der gesuchten Sau offenbart sich der Partner.',
      },
    ],
  },
];

// Hilfsfunktion: Alle Lektionen einer Kategorie
export function getLessonsByCategory(category: string): Lesson[] {
  return LESSONS.filter(l => l.category === category).sort((a, b) => a.order - b.order);
}

// Hilfsfunktion: Lektion nach ID finden
export function getLessonById(id: string): Lesson | undefined {
  return LESSONS.find(l => l.id === id);
}

// Hilfsfunktion: Kann eine Lektion freigeschaltet werden?
export function canUnlockLesson(lessonId: string, completedLessons: string[]): boolean {
  const lesson = getLessonById(lessonId);
  if (!lesson) return false;
  return lesson.requiredLessons.every(req => completedLessons.includes(req));
}

// Hilfsfunktion: Nächste freischaltbare Lektionen
export function getNextUnlockableLessons(completedLessons: string[]): Lesson[] {
  return LESSONS.filter(
    l => !completedLessons.includes(l.id) && canUnlockLesson(l.id, completedLessons)
  );
}

// Kategorien mit Metadaten
export const LESSON_CATEGORIES = [
  { id: 'basics', title: 'Grundlagen', icon: '🎴', description: 'Das Kartenspiel verstehen' },
  { id: 'trump', title: 'Trumpf', icon: '👑', description: 'Die wichtigsten Karten' },
  { id: 'gameflow', title: 'Spielablauf', icon: '🔄', description: 'Wie gespielt wird' },
  { id: 'gametypes', title: 'Spielarten', icon: '🎯', description: 'Sauspiel, Wenz & mehr' },
  { id: 'scoring', title: 'Wertung', icon: '🏆', description: 'Punkte & Gewinnen' },
  { id: 'tactics', title: 'Taktik', icon: '🧠', description: 'Clever spielen' },
];
