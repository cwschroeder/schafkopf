// Wissen-Artikel Content

import { WissenArticle, WissenCategory } from './types';

export const WISSEN_ARTICLES: WissenArticle[] = [
  // ========== GESCHICHTE ==========
  {
    id: 'geschichte-ursprung',
    title: 'Die Urspruenge des Schafkopf',
    titleBavarian: 'Wia ois ogfanga hod',
    description: 'Wie das beliebte Kartenspiel entstand und seinen Namen bekam.',
    category: 'geschichte',
    order: 1,
    estimatedMinutes: 5,
    tags: ['ursprung', 'historie', '19. jahrhundert', 'name'],
    content: [
      {
        type: 'text',
        content: `# Die Geburt eines Volksspiels

Das Schafkopfspiel, wie wir es heute kennen, entstand vermutlich im **fruehen 19. Jahrhundert** in Bayern. Die aeltesten schriftlichen Erwahnungen stammen aus den 1780er Jahren, wobei das Spiel damals noch anders gespielt wurde als heute.`,
      },
      {
        type: 'fun-fact',
        content:
          'Der Name "Schafkopf" hat nichts mit Schafen zu tun! Er stammt vermutlich vom Wort "Schaff" (eine Holzwanne), auf deren Deckel die Punkte notiert wurden - dem "Schaff-Kopf".',
      },
      {
        type: 'timeline',
        timelineEvents: [
          {
            year: '~1780',
            event: 'Erste schriftliche Erwaehnung',
            description: 'Das Spiel wird in sueddeutschen Quellen erwaehnt',
          },
          {
            year: '1811',
            event: 'Aelteste Spielanleitung',
            description: 'Erste bekannte gedruckte Regeln erscheinen',
          },
          {
            year: '~1850',
            event: 'Modernes Regelwerk',
            description:
              'Die heute ueblichen Spielarten (Sauspiel, Wenz, Solo) bilden sich heraus',
          },
          {
            year: '1989',
            event: 'Schafkopfschule e.V.',
            description: 'Gruendung des ersten offiziellen Schafkopf-Vereins',
          },
        ],
      },
      {
        type: 'text',
        content: `## Warum "Schafkopf"?

Es gibt mehrere Theorien zur Namensherkunft:

1. **Schaff-Kopf-Theorie**: Punkte wurden auf dem Deckel (Kopf) einer Holzwanne (Schaff) notiert
2. **Schaf-Kopf-Theorie**: Das Bild eines Schafkopfes war auf alten Spielkarten zu sehen
3. **Kopf-Theorie**: "Kopf" bezieht sich auf das Zusammenzaehlen (Koepfen) der Punkte

Die erste Theorie gilt heute als wahrscheinlichste Erklaerung.`,
      },
      {
        type: 'quote',
        quoteText: 'Beim Schafkopf lernt man fuers Leben - Geduld, Strategie und dass man nicht immer gewinnen kann.',
        quoteBavarian: "Beim Schafkopf lernt ma fia's Lebm - Geduld, Strategie und dass ma ned oiwei gwinna ko.",
        quoteSource: 'Bayerisches Sprichwort',
      },
    ],
    quiz: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Wann entstand das moderne Schafkopfspiel vermutlich?',
        options: [
          '17. Jahrhundert',
          'Fruehes 19. Jahrhundert',
          'Mitte 20. Jahrhundert',
        ],
        correctAnswer: 'Fruehes 19. Jahrhundert',
        explanation:
          'Das Schafkopfspiel in seiner heutigen Form entwickelte sich im fruehen 19. Jahrhundert in Bayern.',
      },
      {
        id: 'q2',
        type: 'true-false',
        question:
          'Der Name "Schafkopf" kommt vermutlich von einer Holzwanne, auf deren Deckel Punkte notiert wurden.',
        options: ['Richtig', 'Falsch'],
        correctAnswer: 'Richtig',
        explanation:
          'Die "Schaff-Kopf-Theorie" gilt als wahrscheinlichste Erklaerung. Ein "Schaff" war eine Holzwanne, und auf deren "Kopf" (Deckel) wurden die Punkte aufgeschrieben.',
      },
    ],
  },
  {
    id: 'geschichte-entwicklung',
    title: 'Vom Wirtshaus zur App',
    titleBavarian: 'Vom Wirtshaus zur App',
    description: 'Die Entwicklung des Schafkopf durch die Jahrzehnte.',
    category: 'geschichte',
    order: 2,
    estimatedMinutes: 4,
    tags: ['entwicklung', 'moderne', 'digital', 'turniere'],
    content: [
      {
        type: 'text',
        content: `# Die Evolution des Schafkopf

Was als einfaches Wirtshausspiel begann, hat sich zu einem organisierten Sport mit Turnieren, Vereinen und sogar digitalen Versionen entwickelt.`,
      },
      {
        type: 'timeline',
        timelineEvents: [
          {
            year: '1950er',
            event: 'Nachkriegszeit',
            description: 'Schafkopf erlebt eine Renaissance in bayerischen Wirtshaeusern',
          },
          {
            year: '1989',
            event: 'Erste Vereine',
            description: 'Gruendung organisierter Schafkopf-Vereine',
          },
          {
            year: '2000er',
            event: 'Erste Online-Spiele',
            description: 'Schafkopf wird digital spielbar',
          },
          {
            year: '2010er',
            event: 'Mobile Apps',
            description: 'Schafkopf-Apps fuer Smartphones erscheinen',
          },
        ],
      },
      {
        type: 'text',
        content: `## Schafkopf heute

Heute wird Schafkopf nicht nur traditionell im Wirtshaus gespielt, sondern auch:

- In organisierten **Turnieren** mit hunderten Teilnehmern
- **Online** gegen Spieler aus aller Welt
- In **Schafkopfschulen**, die das Spiel an Junge weitergeben
- In **Apps** auf dem Smartphone

Trotz aller Modernisierung bleibt der Kern des Spiels erhalten: Vier Spieler, 24 Karten, und viel Strategie.`,
      },
      {
        type: 'fun-fact',
        content:
          'Das groesste Schafkopf-Turnier der Welt findet jaehrlich in Muenchen statt - mit ueber 1.000 Teilnehmern!',
      },
    ],
    quiz: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Wann wurden die ersten Schafkopf-Vereine gegruendet?',
        options: ['1950er Jahre', '1989', '2005'],
        correctAnswer: '1989',
        explanation:
          'Die ersten offiziellen Schafkopf-Vereine wurden 1989 gegruendet, was dem Spiel eine organisierte Struktur gab.',
      },
      {
        id: 'q2',
        type: 'true-false',
        question: 'Es gibt heute organisierte Schafkopf-Turniere mit ueber 1.000 Teilnehmern.',
        options: ['Richtig', 'Falsch'],
        correctAnswer: 'Richtig',
        explanation:
          'In Muenchen findet jaehrlich eines der groessten Schafkopf-Turniere der Welt statt.',
      },
    ],
  },

  // ========== WIRTSHAUSKULTUR ==========
  {
    id: 'wirtshauskultur-stammtisch',
    title: 'Der Schafkopf-Stammtisch',
    titleBavarian: 'Da Schafkopf-Stammtisch',
    description: 'Tradition und ungeschriebene Regeln am Kartentisch.',
    category: 'wirtshauskultur',
    order: 1,
    estimatedMinutes: 5,
    tags: ['stammtisch', 'tradition', 'wirtshaus', 'regeln'],
    content: [
      {
        type: 'text',
        content: `# Der heilige Stammtisch

In Bayern ist der Stammtisch mehr als nur ein Tisch im Wirtshaus - er ist eine Institution. Und beim Schafkopf-Stammtisch gelten besondere Regeln, die nirgends aufgeschrieben sind, aber jeder kennt.`,
      },
      {
        type: 'quote',
        quoteText: 'Am Stammtisch sind alle gleich - ausser der, der grad verliert.',
        quoteBavarian: 'Am Stammtisch san olle gleich - ausser der, der grad verliert.',
        quoteSource: 'Wirtshausweisheit',
      },
      {
        type: 'text',
        content: `## Ungeschriebene Stammtisch-Regeln

1. **Puenktlichkeit**: Wer zu spaet kommt, zahlt eine Runde
2. **Ruhe beim Spiel**: Waehrend des Spiels wird nicht ueber Politik geredet
3. **Kartengeheimnis**: Niemand schaut in fremde Karten
4. **Respekt**: Auch bei schlechten Karten wird nicht gejammert
5. **Tradition**: Neue Spieler werden langsam eingefuehrt`,
      },
      {
        type: 'fun-fact',
        content:
          'In manchen Wirtshaeusern gibt es einen "Schafkopf-Stammtisch" mit festem Termin - oft jeden Dienstag oder Donnerstag. Der Tisch ist dann fuer Kartenspieler reserviert!',
      },
      {
        type: 'text',
        content: `## Der typische Ablauf

Ein Stammtisch-Abend folgt oft einem festen Ritual:

- **Ankunft**: Begruessung, erstes Bier bestellen
- **Warm spielen**: Ein paar lockere Runden zum Einstieg
- **Ernstes Spiel**: Die "richtigen" Runden mit hoeheren Einsaetzen
- **Abrechnung**: Am Ende wird zusammengerechnet
- **Nachbesprechung**: Die besten (und schlechtesten) Spielzuege werden diskutiert`,
      },
    ],
    quiz: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Was passiert traditionell, wenn jemand zu spaet zum Stammtisch kommt?',
        options: [
          'Er darf nicht mehr mitspielen',
          'Er zahlt eine Runde',
          'Er muss eine Strafkarte ziehen',
        ],
        correctAnswer: 'Er zahlt eine Runde',
        explanation:
          'Puenktlichkeit wird am Stammtisch gross geschrieben - Zusp\u00e4tkommer zahlen traditionell eine Runde fuer alle.',
      },
      {
        id: 'q2',
        type: 'true-false',
        question: 'Am Stammtisch darf waehrend des Spiels ueber Politik diskutiert werden.',
        options: ['Richtig', 'Falsch'],
        correctAnswer: 'Falsch',
        explanation:
          'Eine ungeschriebene Regel besagt: Waehrend des Spiels wird nicht ueber Politik geredet - das stoert die Konzentration und kann zu Streit fuehren.',
      },
    ],
  },
  {
    id: 'wirtshauskultur-rituale',
    title: 'Schafkopf-Rituale und Braeuche',
    titleBavarian: 'Schafkopf-Rituale',
    description: 'Von Kartenmischen bis zum Abklopfen - die kleinen Traditionen.',
    category: 'wirtshauskultur',
    order: 2,
    estimatedMinutes: 4,
    tags: ['rituale', 'braeuche', 'mischen', 'abklopfen'],
    content: [
      {
        type: 'text',
        content: `# Die kleinen Rituale

Schafkopf ist voll von kleinen Ritualen und Braeuchen, die das Spiel erst richtig "bayerisch" machen.`,
      },
      {
        type: 'text',
        content: `## Das Kartenmischen

Das Mischen hat seine eigenen Regeln:
- **Dreimal mischen**: Traditionell wird dreimal gemischt
- **Abheben lassen**: Der rechte Nachbar hebt ab
- **Mindestens fuenf Karten** beim Abheben
- **Nie eine einzelne Karte** abheben - das bringt Unglueck!`,
      },
      {
        type: 'quote',
        quoteText: 'Wer schlecht mischt, mischt sein eigenes Unglueck.',
        quoteBavarian: 'Wer schlecht mischt, mischt sei oagns Pech.',
        quoteSource: 'Kartenspielweisheit',
      },
      {
        type: 'text',
        content: `## Das Abklopfen

Wenn ein Spieler seine Karten gesehen hat und "weiter" sagen moechte (also kein Spiel ansagen will), klopft er auf den Tisch. Das ist schneller als jedes Mal "weiter" zu sagen.

**Die Klopf-Etikette:**
- Einmal kurz klopfen = "Ich spiele nichts"
- Mit Verzoegerung klopfen = "Ich habe ueberlegt..."
- Garnicht klopfen = Du hast was vor!`,
      },
      {
        type: 'fun-fact',
        content:
          'In manchen Regionen gilt: Wer vor dem Mischen auf den Kartenstapel klopft, bekommt gute Karten. Wissenschaftlich bewiesen ist das allerdings nicht!',
      },
      {
        type: 'text',
        content: `## Weitere beliebte Rituale

- **"Habe die Ehre"** - Hoeflicher Gruss beim Setzen an den Tisch
- **Glas zur Seite** - Getraenke gehoeren nicht auf den Kartentisch
- **Nie Karten zaehlen** waehrend andere noch spielen
- **Gewinner zahlt** - Der Sieger des Abends gibt einen aus`,
      },
    ],
    quiz: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Wie viele Karten sollte man mindestens abheben?',
        options: ['Eine', 'Drei', 'Fuenf'],
        correctAnswer: 'Fuenf',
        explanation:
          'Beim Abheben sollten mindestens fuenf Karten genommen werden - eine einzelne Karte gilt als Unglueck.',
      },
      {
        id: 'q2',
        type: 'true-false',
        question: 'Auf den Tisch klopfen bedeutet, dass man ein Spiel ansagen moechte.',
        options: ['Richtig', 'Falsch'],
        correctAnswer: 'Falsch',
        explanation:
          'Das Gegenteil ist der Fall: Klopfen bedeutet "weiter" - also dass man kein Spiel ansagen moechte.',
      },
    ],
  },

  // ========== BERUEHMTE SPIELER ==========
  {
    id: 'spieler-prominente',
    title: 'Prominente Schafkopf-Liebhaber',
    titleBavarian: 'Prominente Schafkopf-Fans',
    description: 'Beruehmte Persoenlichkeiten und ihre Liebe zum Spiel.',
    category: 'spieler',
    order: 1,
    estimatedMinutes: 5,
    tags: ['prominente', 'politiker', 'kuenstler', 'anekdoten'],
    content: [
      {
        type: 'text',
        content: `# Prominente am Kartentisch

Schafkopf war und ist bei vielen beruehmten Persoenlichkeiten beliebt - von Politikern bis zu Kuenstlern.`,
      },
      {
        type: 'text',
        content: `## Franz Josef Strauss (1915-1988)

Der langjahrige bayerische Ministerpraesident war bekannt als leidenschaftlicher Schafkopfspieler.

**Anekdote:** Es heisst, dass wichtige politische Entscheidungen manchmal am Kartentisch besprochen wurden. Strauss soll gesagt haben: "Beim Schafkopf sieht man den wahren Charakter eines Menschen."`,
      },
      {
        type: 'quote',
        quoteText: 'Beim Schafkopf sieht man den wahren Charakter eines Menschen.',
        quoteSource: 'Franz Josef Strauss (zugeschrieben)',
      },
      {
        type: 'text',
        content: `## Edmund Stoiber (*1941)

Auch der ehemalige Ministerpraesident Edmund Stoiber ist als Schafkopf-Spieler bekannt. Er spielte regelmaessig mit Parteifreunden und nutzte das Spiel, um Kontakte zu pflegen.`,
      },
      {
        type: 'text',
        content: `## Weitere prominente Spieler

- **Karl Valentin** (1882-1948) - Der beruehmte Muenchner Komiker war begeisterter Kartenspieler
- **Ludwig Thoma** (1867-1921) - Der bayerische Schriftsteller verewigte das Schafkopf in seinen Werken
- **Gustl Bayrhammer** (1922-1993) - Der "Meister Eder"-Schauspieler spielte auch privat leidenschaftlich`,
      },
      {
        type: 'fun-fact',
        content:
          'In Ludwig Thomas Erzaehlungen kommt Schafkopf immer wieder vor - er beschrieb die Wirtshausatmosphaere so treffend, dass man das Bier fast riechen kann!',
      },
    ],
    quiz: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Welcher bayerische Politiker war als leidenschaftlicher Schafkopfspieler bekannt?',
        options: ['Helmut Kohl', 'Franz Josef Strauss', 'Willy Brandt'],
        correctAnswer: 'Franz Josef Strauss',
        explanation:
          'Franz Josef Strauss, langjahrige bayerischer Ministerpraesident, war bekannt fuer seine Liebe zum Schafkopf.',
      },
      {
        id: 'q2',
        type: 'true-false',
        question: 'Der Schriftsteller Ludwig Thoma hat Schafkopf in seinen Werken beschrieben.',
        options: ['Richtig', 'Falsch'],
        correctAnswer: 'Richtig',
        explanation:
          'Ludwig Thoma, beruehmter bayerischer Schriftsteller, hat in vielen seiner Erzaehlungen die Wirtshauskultur und das Schafkopfspiel beschrieben.',
      },
    ],
  },
  {
    id: 'spieler-legenden',
    title: 'Legenden des Spiels',
    titleBavarian: 'Legendn vom Spui',
    description: 'Geschichten von legendaeren Spielzuegen und unvergesslichen Partien.',
    category: 'spieler',
    order: 2,
    estimatedMinutes: 4,
    tags: ['legenden', 'anekdoten', 'spielzuege', 'geschichten'],
    content: [
      {
        type: 'text',
        content: `# Unvergessliche Momente

Jeder erfahrene Schafkopfspieler kennt Geschichten von legendaeren Spielen - Momente, die noch Jahre spaeter am Stammtisch erzaehlt werden.`,
      },
      {
        type: 'text',
        content: `## Der "unmögliche" Solo

Eine der bekanntesten Legenden: Ein Spieler hatte nur vier Ober und vier Unter - keine einzige Farbe komplett. Trotzdem kuendigte er ein Solo an... und gewann! Wie? Er bluffte so ueberzeugend, dass seine Gegner dachten, er haette die Asse versteckt, und spielten viel zu vorsichtig.`,
      },
      {
        type: 'quote',
        quoteText: 'Beim Schafkopf gewinnt nicht immer der mit den besten Karten, sondern der, der am besten spielt.',
        quoteBavarian: 'Beim Schafkopf gwinna ned oiwei der mit de bestn Kartn, sondern der, der am bestn spuit.',
        quoteSource: 'Alte Spielerweisheit',
      },
      {
        type: 'text',
        content: `## Das "Wunder von Miesbach"

Bei einem Turnier in Miesbach soll einmal ein Spieler acht Spiele in Folge gewonnen haben - statistisch fast unmoeglich. Die Legende besagt, dass er danach nie wieder gespielt hat: "Besser aufhoeren, wenn's am schoensten ist!"`,
      },
      {
        type: 'fun-fact',
        content:
          'Die Wahrscheinlichkeit, beim Schafkopf alle vier Ober und alle vier Unter zu bekommen, liegt bei etwa 1 zu 10.000!',
      },
      {
        type: 'text',
        content: `## Was macht einen Legendaeren Spieler aus?

Die besten Schafkopfspieler zeichnen sich aus durch:

- **Gedaechtnis**: Sie merken sich jede gespielte Karte
- **Psychologie**: Sie lesen ihre Gegner wie ein Buch
- **Mut**: Sie wagen auch riskante Spiele
- **Gelassenheit**: Sie bleiben ruhig, auch bei schlechten Karten
- **Erfahrung**: Tausende von gespielten Partien`,
      },
    ],
    quiz: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Was zeichnet laut dem Artikel legendaere Schafkopfspieler besonders aus?',
        options: [
          'Sie haben immer gute Karten',
          'Sie merken sich jede gespielte Karte',
          'Sie spielen nur am Wochenende',
        ],
        correctAnswer: 'Sie merken sich jede gespielte Karte',
        explanation:
          'Ein gutes Gedaechtnis ist essenziell - die besten Spieler wissen immer, welche Karten schon gefallen sind.',
      },
      {
        id: 'q2',
        type: 'true-false',
        question: 'Beim Schafkopf gewinnt immer der Spieler mit den besten Karten.',
        options: ['Richtig', 'Falsch'],
        correctAnswer: 'Falsch',
        explanation:
          'Nicht die Karten allein entscheiden - Strategie, Psychologie und Erfahrung sind mindestens genauso wichtig!',
      },
    ],
  },

  // ========== SPRACHE & BEGRIFFE ==========
  {
    id: 'sprache-grundbegriffe',
    title: 'Schafkopf-Vokabular',
    titleBavarian: 'Schafkopf-Woerter',
    description: 'Die wichtigsten Begriffe erklaert.',
    category: 'sprache',
    order: 1,
    estimatedMinutes: 6,
    tags: ['begriffe', 'vokabular', 'glossar', 'woerter'],
    content: [
      {
        type: 'text',
        content: `# Das Schafkopf-Woerterbuch

Beim Schafkopf gibt es viele spezielle Begriffe, die Anfaenger verwirren koennen. Hier sind die wichtigsten erklaert.`,
      },
      {
        type: 'glossary-term',
        term: 'Schmieren',
        definition: 'Hohe Augen (Punkte) auf den Stich des Partners legen, um ihm moeglichst viele Punkte zu geben.',
        example: 'Wenn dein Partner sticht, schmier ihm die Sau (das Ass) rein!',
      },
      {
        type: 'glossary-term',
        term: 'Stechen',
        definition: 'Mit einem Trumpf einen hoeherwertigen Stich gewinnen.',
        example: 'Er hat meine Zehn mit dem Ober gestochen.',
      },
      {
        type: 'glossary-term',
        term: 'Davonlaufen',
        definition: 'Beim Sauspiel die Suchfarbe ausspielen, obwohl man selbst 4 oder mehr davon hat (statt das Ass zu suchen).',
        example: 'Er ist mit Gras davongelaufen, weil er 5 Graene hatte.',
      },
      {
        type: 'glossary-term',
        term: 'Schneider',
        definition: 'Weniger als 31 Punkte erreichen. Bringt dem Gegner extra Punkte.',
        example: 'Wir haben sie Schneider gespielt - sie hatten nur 28 Augen!',
      },
      {
        type: 'glossary-term',
        term: 'Schwarz',
        definition: 'Keinen einzigen Stich machen. Die hoechste Niederlage beim Schafkopf.',
        example: 'Schwarz gespielt werden ist die groesste Schande am Stammtisch.',
      },
      {
        type: 'glossary-term',
        term: 'Laufende',
        definition: 'Aufeinanderfolgende hoechste Truempfe (ab Eichel-Ober abwaerts). Bringen Extrapunkte.',
        example: 'Mit 4 Laufenden bekommt man ordentlich Aufschlag.',
      },
      {
        type: 'fun-fact',
        content:
          'Der Begriff "Schneider" kommt daher, dass man mit unter 31 Punkten so "duenn" dasteht wie ein Schneider, der damals als arm galt!',
      },
    ],
    quiz: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Was bedeutet "Schmieren" beim Schafkopf?',
        options: [
          'Schummeln',
          'Hohe Punkte auf den Stich des Partners legen',
          'Die Karten fettig machen',
        ],
        correctAnswer: 'Hohe Punkte auf den Stich des Partners legen',
        explanation:
          'Schmieren bedeutet, dem Partner moeglichst viele Augen (Punkte) in seinen Stich zu geben.',
      },
      {
        id: 'q2',
        type: 'true-false',
        question: '"Schneider" bedeutet, weniger als 31 Punkte zu haben.',
        options: ['Richtig', 'Falsch'],
        correctAnswer: 'Richtig',
        explanation:
          'Genau! Wer unter 31 Punkten bleibt, wird "Schneider" - das gibt Extrapunkte fuer die Gegner.',
      },
      {
        id: 'q3',
        type: 'multiple-choice',
        question: 'Was sind "Laufende"?',
        options: [
          'Spieler, die weglaufen',
          'Aufeinanderfolgende hoechste Truempfe',
          'Schnelle Spiele',
        ],
        correctAnswer: 'Aufeinanderfolgende hoechste Truempfe',
        explanation:
          'Laufende sind die hoechsten Truempfe in ununterbrochener Reihenfolge (ab Eichel-Ober). Sie bringen Extrapunkte.',
      },
    ],
  },
  {
    id: 'sprache-sprichwoerter',
    title: 'Bayerische Schafkopf-Sprueche',
    titleBavarian: 'Boarische Schafkopf-Sprüch',
    description: 'Die schoensten Redensarten rund ums Spiel.',
    category: 'sprache',
    order: 2,
    estimatedMinutes: 4,
    tags: ['sprichwoerter', 'sprueche', 'bayerisch', 'redensarten'],
    content: [
      {
        type: 'text',
        content: `# Sprueche am Kartentisch

Ein echter Schafkopf-Stammtisch ist voller markiger Sprueche. Hier die schoensten - mit Uebersetzung!`,
      },
      {
        type: 'quote',
        quoteText: 'Wer kann, der kann.',
        quoteBavarian: 'Wer ko, der ko.',
        quoteSource: 'Klassiker nach einem gewonnenen Solo',
      },
      {
        type: 'quote',
        quoteText: 'Lieber ein kleines Spiel gewonnen als ein grosses verloren.',
        quoteBavarian: 'Liaba a kloas Spui gwonna als a groass verlorn.',
        quoteSource: 'Taktische Weisheit',
      },
      {
        type: 'quote',
        quoteText: 'Mit Spatzen faengt man keine Tauben.',
        quoteBavarian: 'Mit Spatzn fangt ma koane Taubn.',
        quoteSource: 'Wenn kleine Karten nicht reichen',
      },
      {
        type: 'quote',
        quoteText: 'Jetzt hab ich Karten wie Hueftgold.',
        quoteBavarian: 'Iatz hab i Kartn wia Hüftgoid.',
        quoteSource: 'Bei schlechten Karten',
      },
      {
        type: 'text',
        content: `## Sprueche fuer jede Situation

**Bei gutem Blatt:**
- "Da schau her!" (Triumphierend)
- "Des woar a Pflichtsolo" (Das war Pflicht)

**Bei schlechtem Blatt:**
- "Vom Glueck verfolgt... aber es hat mich nie eingeholt"
- "I hab Kartn wia a Hendl" (Karten wie ein Huehnchen - wertlos)

**Nach dem Spiel:**
- "Schee war's!" (Nach gutem Spiel)
- "Des naechste Spui wird wieder besser" (Trost nach Niederlage)`,
      },
      {
        type: 'fun-fact',
        content:
          'Der Spruch "Wer ko, der ko" ist so typisch bayerisch, dass er sogar auf T-Shirts und Bierkruegen zu finden ist!',
      },
    ],
    quiz: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Was bedeutet "Wer ko, der ko"?',
        options: [
          'Wer kocht, der kocht',
          'Wer kann, der kann',
          'Wer kommt, der kommt',
        ],
        correctAnswer: 'Wer kann, der kann',
        explanation:
          '"Ko" ist bayerisch fuer "kann" - der Spruch drueckt Selbstbewusstsein nach einem gelungenen Spiel aus.',
      },
      {
        id: 'q2',
        type: 'true-false',
        question: '"Kartn wia a Hendl" bedeutet, dass man sehr gute Karten hat.',
        options: ['Richtig', 'Falsch'],
        correctAnswer: 'Falsch',
        explanation:
          'Das Gegenteil ist der Fall! "Kartn wia a Hendl" (Karten wie ein Huehnchen) bedeutet, dass die Karten wertlos sind.',
      },
    ],
  },
];

// ========== HELPER FUNCTIONS ==========

// Alle Artikel einer Kategorie abrufen
export function getArticlesByCategory(
  category: WissenCategory
): WissenArticle[] {
  return WISSEN_ARTICLES.filter((a) => a.category === category).sort(
    (a, b) => a.order - b.order
  );
}

// Artikel nach ID finden
export function getArticleById(id: string): WissenArticle | undefined {
  return WISSEN_ARTICLES.find((a) => a.id === id);
}

// Alle Artikel-IDs einer Kategorie
export function getArticleIdsByCategory(category: WissenCategory): string[] {
  return getArticlesByCategory(category).map((a) => a.id);
}

// Artikel durchsuchen
export function searchArticles(query: string): WissenArticle[] {
  const q = query.toLowerCase();
  return WISSEN_ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.tags.some((t) => t.includes(q))
  );
}

// Naechster Artikel in einer Kategorie
export function getNextArticle(articleId: string): WissenArticle | undefined {
  const article = getArticleById(articleId);
  if (!article) return undefined;

  const categoryArticles = getArticlesByCategory(article.category);
  const currentIndex = categoryArticles.findIndex((a) => a.id === articleId);

  if (currentIndex < categoryArticles.length - 1) {
    return categoryArticles[currentIndex + 1];
  }

  return undefined;
}

// Gesamtanzahl der Artikel
export function getTotalArticleCount(): number {
  return WISSEN_ARTICLES.length;
}
