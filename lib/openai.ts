// OpenAI Integration für KI-Bots

import OpenAI from 'openai';
import { SpielState, Karte, Ansage, Farbe } from './schafkopf/types';
import { spielbareKarten, sortiereHand } from './schafkopf/rules';
import { karteZuString, zaehleAugen, AUGEN } from './schafkopf/cards';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Bot entscheidet über Spielansage
 */
export async function botAnsage(
  hand: Karte[],
  position: number,
  bisherigeAnsagen: { position: number; ansage: Ansage }[]
): Promise<{ ansage: Ansage; gesuchteAss?: Farbe }> {
  const handString = hand.map(karteZuString).join(', ');

  const bisherigeString = bisherigeAnsagen
    .map(a => `Position ${a.position}: ${a.ansage}`)
    .join('\n');

  const prompt = `Du bist ein erfahrener Schafkopf-Spieler. Analysiere die Hand und entscheide über die Ansage.

Deine Hand: ${handString}
Deine Position: ${position} (0-3, 0 kommt zuerst raus)

Bisherige Ansagen:
${bisherigeString || 'Noch keine'}

Regeln:
- Sauspiel: Du brauchst mind. 4 Trümpfe (Ober, Unter, Herz) und eine Sau einer Farbe die du NICHT hast
- Wenz: Nur Unter sind Trumpf, du brauchst mind. 3 starke Unter
- Geier: Nur Ober sind Trumpf, du brauchst mind. 3 starke Ober
- Farbsolo: Du brauchst sehr viele Trümpfe (6+)
- "weiter" = passen

Antworte NUR mit einem JSON-Objekt:
{"ansage": "weiter" | "sauspiel" | "wenz" | "geier" | "farbsolo-eichel" | "farbsolo-gras" | "farbsolo-herz" | "farbsolo-schellen", "gesuchteAss": "eichel" | "gras" | "schellen" (nur bei sauspiel)}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 100,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return { ansage: 'weiter' };
    }

    const result = JSON.parse(content);
    return {
      ansage: result.ansage || 'weiter',
      gesuchteAss: result.gesuchteAss,
    };
  } catch (error) {
    console.error('Bot Ansage Fehler:', error);
    return { ansage: 'weiter' };
  }
}

/**
 * Bot wählt eine Karte zum Spielen
 */
export async function botSpielzug(
  state: SpielState,
  spielerId: string
): Promise<string> {
  const spieler = state.spieler.find(s => s.id === spielerId);
  if (!spieler) {
    throw new Error('Spieler nicht gefunden');
  }

  const erlaubteKarten = spielbareKarten(
    spieler.hand,
    state.aktuellerStich,
    state.gespielteAnsage!,
    state.gesuchteAss || undefined
  );

  // Wenn nur eine Karte möglich, direkt spielen
  if (erlaubteKarten.length === 1) {
    return erlaubteKarten[0].id;
  }

  const handString = spieler.hand.map(karteZuString).join(', ');
  const erlaubteString = erlaubteKarten.map(karteZuString).join(', ');

  const stichString = state.aktuellerStich.karten
    .map(k => {
      const s = state.spieler.find(sp => sp.id === k.spielerId);
      return `${s?.name}: ${karteZuString(k.karte)}`;
    })
    .join(', ');

  const prompt = `Du bist ein erfahrener Schafkopf-Spieler. Wähle die beste Karte.

Spielart: ${state.gespielteAnsage}
Deine Hand: ${handString}
Erlaubte Karten: ${erlaubteString}
Aktueller Stich: ${stichString || '(Du spielst aus)'}
Stich Nr: ${state.stichNummer + 1}/6

${state.spielmacher === spielerId ? 'Du bist Spielmacher!' : 'Du spielst gegen den Spielmacher.'}
${state.partner === spielerId ? 'Du bist Partner des Spielmachers!' : ''}

Strategie-Tipps:
- Als Spielmacher: Trümpfe ziehen, Augen sammeln
- Als Gegner: Trümpfe des Spielmachers ausstechen, wenig Augen geben
- Im Stich: Wenn du gewinnen kannst, hohe Augen spielen
- Wenn du verlierst: Niedrige Augen abwerfen

Antworte NUR mit der ID der Karte (z.B. "herz-ober"):`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 50,
    });

    const content = response.choices[0].message.content?.trim();

    // Validieren dass die Karte erlaubt ist
    const gewaehlteKarte = erlaubteKarten.find(k =>
      k.id === content ||
      content?.includes(k.id) ||
      karteZuString(k).toLowerCase().includes(content?.toLowerCase() || '')
    );

    if (gewaehlteKarte) {
      return gewaehlteKarte.id;
    }

    // Fallback: Erste erlaubte Karte
    return erlaubteKarten[0].id;
  } catch (error) {
    console.error('Bot Spielzug Fehler:', error);
    return erlaubteKarten[0].id;
  }
}

/**
 * Bot entscheidet ob "Du" gesagt wird
 */
export async function botDuEntscheidung(
  hand: Karte[],
  state: SpielState
): Promise<boolean> {
  // Einfache Heuristik: "Du" sagen wenn man sehr stark ist
  const trumpfAnzahl = hand.filter(k => {
    const isOber = k.wert === 'ober';
    const isUnter = k.wert === 'unter';
    return isOber || isUnter;
  }).length;

  // "Du" sagen wenn man mindestens 3 Ober/Unter hat
  return trumpfAnzahl >= 3;
}
