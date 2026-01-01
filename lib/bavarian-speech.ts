// Bayerische Sprachausgabe für Schafkopf

import { playBavarianAudio, initAudio, setDefaultVoice, getDefaultVoice, stopAudio } from './tts-client';

export interface BavarianPhrase {
  text: string;      // Anzeigetext
  speech: string;    // Phonetische Version für TTS
}

// Ansagen auf Oberpfälzisch
export const BAVARIAN_ANSAGEN: Record<string, BavarianPhrase[]> = {
  // Sauspiel
  'sauspiel-eichel': [
    { text: 'Mit da Oichl!', speech: 'Mit da Oichl!' },
    { text: 'Oichl-Sau!', speech: 'Oichl Sau!' },
    { text: 'I spüll aaf d\'Oichl!', speech: 'I spüll aaf d Oichl!' },
    { text: 'D\'Oidn mou her!', speech: 'D Oidn mou her!' },
    { text: 'I dadad d\'Oidn souchn!', speech: 'I dadad d Oidn souchn!' },
    { text: 'Wer hod d\'Alte?', speech: 'Wer hod d Alte?' },
  ],
  'sauspiel-gras': [
    { text: 'Mit da Grosn!', speech: 'Mit da Grosn!' },
    { text: 'Gras-Sau!', speech: 'Groos Sau!' },
    { text: 'I gäih aaf Gras!', speech: 'I gäih aaf Groos!' },
    { text: 'D\'Blaue mou her!', speech: 'D Blaue mou her!' },
    { text: 'I dadad d\'Blau Sau souchn!', speech: 'I dadad d Blau Sau souchn!' },
    { text: 'Wo is d\'Blaue?', speech: 'Wo is d Blaue?' },
  ],
  'sauspiel-schellen': [
    { text: 'Da Hund hockt ohm!', speech: 'Da Hund hockt ohm!' },
    { text: 'Schelln-Sau!', speech: 'Schelln Sau!' },
    { text: 'Da Hund mou her!', speech: 'Da Hund mou her!' },
    { text: 'Schlass!', speech: 'Schlass!' },
    { text: 'I gäih aaf Schelln!', speech: 'I gäih aaf Schelln!' },
    { text: 'Wo hockt da Hund?', speech: 'Wo hockt da Hund?' },
  ],

  // Solo
  'solo-eichel': [
    { text: 'Oichlsola!', speech: 'Oichl Soola!' },
    { text: 'I spüll Oichl alloa!', speech: 'I spüll Oichl alloa!' },
    { text: 'Oichl is Trumpf!', speech: 'Oichl is Trumpf!' },
    { text: 'Oichl ganz alloa!', speech: 'Oichl ganz alloa!' },
  ],
  'solo-gras': [
    { text: 'Grassola!', speech: 'Groos Soola!' },
    { text: 'Gras alloa!', speech: 'Groos alloa!' },
    { text: 'I spüll Gras!', speech: 'I spüll Groos!' },
    { text: 'Grün is Trumpf!', speech: 'Grün is Trumpf!' },
  ],
  'solo-herz': [
    { text: 'Herzsola!', speech: 'Herz Soola!' },
    { text: 'I mach a Herzl!', speech: 'I mach a Herzl!' },
    { text: 'Herz alloa!', speech: 'Herz alloa!' },
    { text: 'Herz, Schmerz!', speech: 'Herz, Schmerz!' },
  ],
  'solo-schellen': [
    { text: 'Schellnsola!', speech: 'Schelln Soola!' },
    { text: 'Schelln alloa!', speech: 'Schelln alloa!' },
    { text: 'I spüll Schelln!', speech: 'I spüll Schelln!' },
    { text: 'Schelln is Trumpf!', speech: 'Schelln is Trumpf!' },
  ],

  // Wenz
  'wenz': [
    { text: 'Wenz!', speech: 'Wennz!' },
    { text: 'An Wenz!', speech: 'An Wennz!' },
    { text: 'I wenz!', speech: 'I wennz!' },
    { text: 'Wenz hob i!', speech: 'Wennz hob i!' },
    { text: 'Des is a Wenz!', speech: 'Des is a Wennz!' },
    { text: 'Wenz, bittschee!', speech: 'Wennz, bittschee!' },
  ],

  // Geier
  'geier': [
    { text: 'Geier!', speech: 'Geier!' },
    { text: 'An Geier!', speech: 'An Geier!' },
    { text: 'I geier!', speech: 'I geier!' },
    { text: 'Geier is ogsogt!', speech: 'Geier is ogsogt!' },
  ],

  // Passen
  'weiter': [
    { text: 'Weidda!', speech: 'Weidda!' },
    { text: 'I dad weidda!', speech: 'I dad weidda!' },
    { text: 'Nix g\'scheits!', speech: 'Nix gscheits!' },
    { text: 'I hob nix!', speech: 'I hob nix!' },
    { text: 'Basst scho!', speech: 'Basst scho!' },
    { text: 'Na!', speech: 'Na!' },
    { text: 'Des ko i ned!', speech: 'Des ko i ned!' },
    { text: 'Wos soi i dou macha?', speech: 'Wos soi i dou macha?' },
    { text: 'Nix dabei!', speech: 'Nix dabei!' },
    { text: 'Lauta Bledsinn!', speech: 'Lauta Bledsinn!' },
    { text: 'A Dreck!', speech: 'A Dreck!' },
    { text: 'Mog ned!', speech: 'Mog ned!' },
    { text: 'I loss aus!', speech: 'I loss aus!' },
    { text: 'Des san lauta Kracha!', speech: 'Des san lauta Kracha!' },
    { text: 'Nix wia Ramsch!', speech: 'Nix wia Ramsch!' },
    { text: 'Hod sa da Geber heid wieda d\'Hend niad gwaschn?', speech: 'Hod sa da Geber heid wieda d Hend niad gwaschn?' },
    { text: 'Lauta Siema heid wieda!', speech: 'Lauta Siema heid wieda!' },
    { text: 'Mit dem heads eitz niad grachat, göll?', speech: 'Mit dem heads eitz niad grachat, göll?' },
    { text: 'Göll dou schaust niad schlecht?', speech: 'Göll dou schaust niad schlecht?' },
    { text: 'Wos is des für a Schas?', speech: 'Wos is des für a Schas?' },
    { text: 'Des is ja zum Scheissn!', speech: 'Des is ja zum Scheissn!' },
    { text: 'Dou hod owa oina wiedda guad gmischt heid!', speech: 'Dou hod owa oina wiedda guad gmischt heid!' },
  ],
};

// Karten-spezifische Kommentare beim Ausspielen
export const KARTEN_KOMMENTARE: Record<string, BavarianPhrase[]> = {
  // Asse (Säue)
  'eichel-ass': [
    { text: 'D\'Alte!', speech: 'D Alte!' },
    { text: 'Dou kummt d\'Alte!', speech: 'Dou kummt d Alte!' },
    { text: 'Eichalia, die oide Waldschnepfe!', speech: 'Eichalia, die oide Waldschnepfe!' },
    { text: 'D\'Oichlsau!', speech: 'D Oichlsau!' },
  ],
  'gras-ass': [
    { text: 'D\'Blaue!', speech: 'D Blaue!' },
    { text: 'D\'Blau Sau!', speech: 'D Blau Sau!' },
    { text: 'Grassau!', speech: 'Groossau!' },
    { text: 'Dou is d\'Blaue!', speech: 'Dou is d Blaue!' },
    { text: 'Die Blaue griagst!', speech: 'Die Blaue griagst!' },
  ],
  'herz-ass': [
    { text: 'Herzsau!', speech: 'Herzsau!' },
    { text: 'Herz, Schmerz und sonst no wos!', speech: 'Herz, Schmerz und sonst no wos!' },
    { text: 'Des Herzl!', speech: 'Des Herzl!' },
  ],
  'schellen-ass': [
    { text: 'Schlass!', speech: 'Schlass!' },
    { text: 'Da Hund hockt ohm!', speech: 'Da Hund hockt ohm!' },
    { text: 'D\'Schellnsau!', speech: 'D Schellnsau!' },
    { text: 'Dou, da Hund!', speech: 'Dou, da Hund!' },
  ],

  // Könige
  'herz-koenig': [
    { text: 'Dou hau an Mox ei!', speech: 'Dou hau an Mox ei!' },
    { text: 'Da Mox!', speech: 'Da Mox!' },
    { text: 'Herzkini!', speech: 'Herzkini!' },
    { text: 'Da Herzkönig!', speech: 'Da Herzkönig!' },
  ],
  'eichel-koenig': [
    { text: 'Oichlkini!', speech: 'Oichlkini!' },
  ],
  'gras-koenig': [
    { text: 'Graskini!', speech: 'Grooskini!' },
    { text: 'Da Grüne!', speech: 'Da Grüne!' },
  ],
  'schellen-koenig': [
    { text: 'Schellnkini!', speech: 'Schellnkini!' },
  ],

  // Ober (Trumpf)
  'eichel-ober': [
    { text: 'Da Oide!', speech: 'Da Oide!' },
    { text: 'Da Alte!', speech: 'Da Alte!' },
    { text: 'Oichlober!', speech: 'Oichlober!' },
    { text: 'Da höchste Trumpf!', speech: 'Da höchste Trumpf!' },
    { text: 'Des is da Chef!', speech: 'Des is da Chef!' },
  ],
  'gras-ober': [
    { text: 'Da Blaue!', speech: 'Da Blaue!' },
    { text: 'Grasober!', speech: 'Groosober!' },
    { text: 'Da Zweithöchste!', speech: 'Da Zweithöchste!' },
    { text: 'Da Blaue kummt!', speech: 'Da Blaue kummt!' },
  ],
  'herz-ober': [
    { text: 'Herzober!', speech: 'Herzober!' },
  ],
  'schellen-ober': [
    { text: 'Schellnober!', speech: 'Schellnober!' },
  ],

  // Unter (Trumpf)
  'eichel-unter': [
    { text: 'Da Oide Wenz!', speech: 'Da Oide Wennz!' },
    { text: 'Da Alte Wenz!', speech: 'Da Alte Wennz!' },
    { text: 'Oichlunter!', speech: 'Oichlunter!' },
  ],
  'gras-unter': [
    { text: 'Grasunter!', speech: 'Groosunter!' },
    { text: 'Da Grüne Wenz!', speech: 'Da Grüne Wennz!' },
  ],
  'herz-unter': [
    { text: 'Herzunter!', speech: 'Herzunter!' },
    { text: 'Mit an Unta gäihst niad unta!', speech: 'Mit an Unta gäihst niad unta!' },
  ],
  'schellen-unter': [
    { text: 'Schellnunter!', speech: 'Schellnunter!' },
    { text: 'Da kloane Wenz!', speech: 'Da kloane Wennz!' },
  ],

  // Zehner (Eisenbahner)
  'eichel-10': [
    { text: 'An Eisenbahna!', speech: 'An Eisenbahna!' },
    { text: 'Oichl-Zehna!', speech: 'Oichl-Zehna!' },
    { text: 'Zehn Aung!', speech: 'Zehn Aung!' },
  ],
  'gras-10': [
    { text: 'An Eisenbahna!', speech: 'An Eisenbahna!' },
    { text: 'Gras-Zehna!', speech: 'Groos-Zehna!' },
  ],
  'herz-10': [
    { text: 'An Eisenbahna!', speech: 'An Eisenbahna!' },
    { text: 'Herz-Zehna!', speech: 'Herz-Zehna!' },
  ],
  'schellen-10': [
    { text: 'An Eisenbahna!', speech: 'An Eisenbahna!' },
    { text: 'Schelln-Zehna!', speech: 'Schelln-Zehna!' },
  ],

  // Farben angespielt
  'eichel': [
    { text: 'Euchalia, die oide Waldschnepfe!', speech: 'Euchalia, die oide Waldschnepfe!' },
    { text: 'Oichl kummt!', speech: 'Oichl kummt!' },
    { text: 'A Oichl!', speech: 'A Oichl!' },
  ],
  'gras': [
    { text: 'Grün is dro!', speech: 'Grün is dro!' },
    { text: 'A Gras!', speech: 'A Groos!' },
    { text: 'Laub!', speech: 'Laub!' },
  ],
  'herz': [
    { text: 'Herz, Schmerz und sonst no wos!', speech: 'Herz, Schmerz und sonst no wos!' },
    { text: 'A Herzl!', speech: 'A Herzl!' },
    { text: 'Rot is dro!', speech: 'Rot is dro!' },
  ],
  'schellen': [
    { text: 'Dou griagst a Schelln!', speech: 'Dou griagst a Schelln!' },
    { text: 'A Schelln!', speech: 'A Schelln!' },
    { text: 'Schelln san ogsogt!', speech: 'Schelln san ogsogt!' },
  ],

  // Trumpf spielen
  'trumpf': [
    { text: 'Trumpf is Trumpf!', speech: 'Trumpf is Trumpf!' },
    { text: 'Dou vastehst an Spaß!', speech: 'Dou vastehst an Spaß!' },
    { text: 'I stich!', speech: 'I stich!' },
    { text: 'Trumpf draaf!', speech: 'Trumpf draaf!' },
    { text: 'Des hob i no!', speech: 'Des hob i no!' },
  ],

  // Spatzen (7er, 8er, 9er - wenig Augen)
  'spatz': [
    { text: 'An Spatzn!', speech: 'An Spatzn!' },
    { text: 'A Lusche!', speech: 'A Lusche!' },
    { text: 'A Kracha!', speech: 'A Kracha!' },
    { text: 'Nix wert!', speech: 'Nix wert!' },
    { text: 'An Ramsch!', speech: 'An Ramsch!' },
  ],
};

// Kommentare beim Unter ausspielen (allgemein)
export const UNTER_KOMMENTARE: BavarianPhrase[] = [
  { text: 'Mit an Unta gäihst niad unta!', speech: 'Mit an Unta gäihst niad unta!' },
  { text: 'An Wenz!', speech: 'An Wennz!' },
  { text: 'Dea sticht!', speech: 'Dea sticht!' },
];

// Reaktionen beim Stich gewinnen
export const STICH_GEWONNEN: BavarianPhrase[] = [
  { text: 'Den back i zsamm!', speech: 'Den back i zsamm!' },
  { text: 'Samma dabei!', speech: 'Samma dabei!' },
  { text: 'Basst scho!', speech: 'Basst scho!' },
  { text: 'Her damit!', speech: 'Her damit!' },
  { text: 'So ghört si des!', speech: 'So ghört si des!' },
  { text: 'Den hob i!', speech: 'Den hob i!' },
  { text: 'Meina!', speech: 'Meina!' },
  { text: 'Ghört mia!', speech: 'Ghört mia!' },
  { text: 'Jo mei!', speech: 'Jo mei!' },
  { text: 'Basst!', speech: 'Basst!' },
  { text: 'So is recht!', speech: 'So is recht!' },
  { text: 'Guat gmacht!', speech: 'Guat gmacht!' },
  { text: 'Wundabaa!', speech: 'Wundabaa!' },
  { text: 'Na also!', speech: 'Na also!' },
  { text: 'Sauwa!', speech: 'Sauwa!' },
  { text: 'Des war kloa!', speech: 'Des war kloa!' },
  { text: 'Hehe!', speech: 'Hehe!' },
  { text: 'I nimm!', speech: 'I nimm!' },
];

// Reaktionen beim Stich verlieren
export const STICH_VERLOREN: BavarianPhrase[] = [
  { text: 'Zefix!', speech: 'Zeffix!' },
  { text: 'Kruzifix!', speech: 'Kruzifix!' },
  { text: 'Himmi Herrgott!', speech: 'Himmi Herrgott!' },
  { text: 'So a Schmarrn!', speech: 'So a Schmarrn!' },
  { text: 'Sakradi!', speech: 'Sakradi!' },
  { text: 'Himmisakra!', speech: 'Himmisakra!' },
  { text: 'Kreizbirnbam!', speech: 'Kreizbirnbam!' },
  { text: 'Mei oh mei!', speech: 'Mei oh mei!' },
  { text: 'So a Mist!', speech: 'So a Mist!' },
  { text: 'Des derf ned woar sei!', speech: 'Des derf ned woar sei!' },
  { text: 'A Wahnsinn!', speech: 'A Wahnsinn!' },
  { text: 'Sakrament!', speech: 'Sakrament!' },
  { text: 'Himmihergottnoamoi!', speech: 'Himmihergottnoamoi!' },
  { text: 'So a Sau!', speech: 'So a Sau!' },
  { text: 'Wos soi des?', speech: 'Wos soi des?' },
  { text: 'Na servas!', speech: 'Na servas!' },
  { text: 'Himmelherrschaftszeitn!', speech: 'Himmelherrschaftszeitn!' },
  { text: 'Kreizdividomine!', speech: 'Kreizdividomine!' },
  { text: 'Krumme Nuckel!', speech: 'Krumme Nuckel!' },
  { text: 'A leck mi doch kreizweis am Oarsch!', speech: 'A leck mi doch kreizweis am Oarsch!' },
  { text: 'I bin doch niad aaf da Brennsuppn daheagschwumma!', speech: 'I bin doch niad aaf da Brennsuppn daheagschwumma!' },
];

// Reaktionen beim Spielstart
export const SPIEL_START: BavarianPhrase[] = [
  { text: 'Na dann schaugma moi!', speech: 'Na dann schaugma moi!' },
  { text: 'Aaf gehts!', speech: 'Aaf gehts!' },
  { text: 'Pack mas!', speech: 'Pack mas!' },
  { text: 'Los gehts!', speech: 'Los gehts!' },
  { text: 'Na, dann woi ma moi!', speech: 'Na, dann woi ma moi!' },
  { text: 'Schaugma moi, dann seng ma scho!', speech: 'Schaugma moi, dann seng ma scho!' },
  { text: 'Aaf d\'Plätze!', speech: 'Aaf d Plätze!' },
  { text: 'I bin bereit!', speech: 'I bin bereit!' },
];

// Reaktionen beim Spielende (gewonnen)
export const SPIEL_GEWONNEN: BavarianPhrase[] = [
  { text: 'Ha! Gwunna!', speech: 'Ha! Gwunna!' },
  { text: 'Des wars!', speech: 'Des wars!' },
  { text: 'So schauts aus!', speech: 'So schauts aus!' },
  { text: 'Ja mei, des war leicht!', speech: 'Ja mei, des war leicht!' },
  { text: 'Hob is doch gwusst!', speech: 'Hob is doch gwusst!' },
  { text: 'So ghört si des!', speech: 'So ghört si des!' },
  { text: 'Her mit da Kohle!', speech: 'Her mit da Kohle!' },
  { text: 'Zohltog!', speech: 'Zohltog!' },
  { text: 'Danke fürs Göld!', speech: 'Danke fürs Göld!' },
  { text: 'Sauwa gmacht!', speech: 'Sauwa gmacht!' },
  { text: 'A so a Gaudi!', speech: 'A so a Gaudi!' },
];

// Reaktionen beim Spielende (verloren)
export const SPIEL_VERLOREN: BavarianPhrase[] = [
  { text: 'Kruzifix noamoi!', speech: 'Kruzifix noamoi!' },
  { text: 'Des nächste Moi!', speech: 'Des nächste Moi!' },
  { text: 'Mei, so gehts hoid!', speech: 'Mei, so gehts hoid!' },
  { text: 'Woaßt wos? Wurscht!', speech: 'Woaßt wos? Wurscht!' },
  { text: 'Des war Pech!', speech: 'Des war Pech!' },
  { text: 'Nächstes Moi!', speech: 'Nächstes Moi!' },
  { text: 'A so a Schmarrn!', speech: 'A so a Schmarrn!' },
  { text: 'Des zoi i ned!', speech: 'Des zoi i ned!' },
  { text: 'I glaabs ned!', speech: 'I glaabs ned!' },
  { text: 'Wos für a Bledsinn!', speech: 'Wos für a Bledsinn!' },
];

// Du/Re Ansagen
export const DU_GESAGT: BavarianPhrase[] = [
  { text: 'Du!', speech: 'Du!' },
  { text: 'Du! Des packst ned!', speech: 'Du! Des packst ned!' },
  { text: 'Du! I glaabs ned!', speech: 'Du! I glaabs ned!' },
  { text: 'Kontra! Du!', speech: 'Kontra! Du!' },
];

export const RE_GESAGT: BavarianPhrase[] = [
  { text: 'Re!', speech: 'Reh!' },
  { text: 'Re! Des pack i locka!', speech: 'Reh! Des pack i locka!' },
  { text: 'Re! Schaugma moi!', speech: 'Reh! Schaugma moi!' },
];

// Legen/Klopfen Kommentare
export const LEGEN_JA: BavarianPhrase[] = [
  { text: 'I leg!', speech: 'I leg!' },
  { text: 'Des verdoppel ma!', speech: 'Des verdoppel ma!' },
  { text: 'Dou bin i dabei!', speech: 'Dou bin i dabei!' },
  { text: 'Des schaut guat aus!', speech: 'Des schaut guat aus!' },
];

export const LEGEN_NEIN: BavarianPhrase[] = [
  { text: 'Na, des lass i!', speech: 'Na, des lass i!' },
  { text: 'I leg ned!', speech: 'I leg ned!' },
  { text: 'Ohne mi!', speech: 'Ohne mi!' },
  { text: 'Des is ma z\'riskant!', speech: 'Des is ma z riskant!' },
];

// Allgemeine Kommentare während des Spiels
export const ALLGEMEINE_KOMMENTARE: BavarianPhrase[] = [
  { text: 'Schaugma moi!', speech: 'Schaugma moi!' },
  { text: 'Hmm...', speech: 'Hmm...' },
  { text: 'Interessant!', speech: 'Interessant!' },
  { text: 'Aha!', speech: 'Aha!' },
  { text: 'So so!', speech: 'So so!' },
  { text: 'Na servas!', speech: 'Na servas!' },
  { text: 'Oha!', speech: 'Oha!' },
  { text: 'Mei oh mei!', speech: 'Mei oh mei!' },
];

// ============================================
// MITSPIELER-REAKTIONEN
// Kommentare von anderen Spielern (nur Bots)
// ============================================

// Aufforderung zum Stechen (wenn hoher Stich und letzter Spieler dran)
export const MITSPIELER_AUFFORDERN_STECHEN: BavarianPhrase[] = [
  { text: 'Back nan owa vom Moped!', speech: 'Back nan owa vom Moped!' },
  { text: 'Stich eam!', speech: 'Stich eam!' },
  { text: 'Na moch scho!', speech: 'Na moch scho!' },
  { text: 'Do mou wos her!', speech: 'Do mou wos her!' },
  { text: 'Hau eam weg!', speech: 'Hau eam weg!' },
  { text: 'Nimm eam mit!', speech: 'Nimm eam mit!' },
  { text: 'Des is deina!', speech: 'Des is deina!' },
  { text: 'Na pack scho zua!', speech: 'Na pack scho zua!' },
];

// Verpasstes Stechen (wenn Spieler nicht gestochen hat obwohl er konnte)
export const MITSPIELER_VERPASST_STECHEN: BavarianPhrase[] = [
  { text: 'Wos spüllst na du heid wiedda für an Schmarrn zsamm!', speech: 'Wos spüllst na du heid wiedda für an Schmarrn zsamm!' },
  { text: 'Host du an Vogel?', speech: 'Host du an Vogel?' },
  { text: 'Des waar doch deina gwesn!', speech: 'Des waar doch deina gwesn!' },
  { text: 'Bist du deppad?', speech: 'Bist du deppad?' },
  { text: 'Wos soi na des?', speech: 'Wos soi na des?' },
  { text: 'Warum stichst na ned?', speech: 'Warum stichst na ned?' },
  { text: 'I glaabs ned!', speech: 'I glaabs ned!' },
  { text: 'Du hättst doch an Trumpf ghod!', speech: 'Du hättst doch an Trumpf ghod!' },
];

// Stich-Serie (wenn ein Spieler 3+ Stiche hintereinander macht)
export const MITSPIELER_STICH_SERIE: BavarianPhrase[] = [
  { text: 'Do schau eam o, is a heid wiedda guad drauf da Burschi!', speech: 'Do schau eam o, is a heid wiedda guad drauf da Burschi!' },
  { text: 'Der is heid ned zum Holdna!', speech: 'Der is heid ned zum Holdna!' },
  { text: 'Wos geht na do ob?', speech: 'Wos geht na do ob?' },
  { text: 'Da brennt heid da Huat!', speech: 'Da brennt heid da Huat!' },
  { text: 'Der hod heid an Lauf!', speech: 'Der hod heid an Lauf!' },
  { text: 'Oida, der räumt ab!', speech: 'Oida, der räumt ab!' },
  { text: 'Na heast, ned schon wieder!', speech: 'Na heast, ned schon wieder!' },
  { text: 'Der is ja unaufhaltsam!', speech: 'Der is ja unaufhaltsam!' },
];

// Hoher Stich verschenkt (wenn Gegner hohen Stich gewinnt)
export const MITSPIELER_STICH_VERSCHENKT: BavarianPhrase[] = [
  { text: 'Au weh!', speech: 'Au weh!' },
  { text: 'Des duad weh!', speech: 'Des duad weh!' },
  { text: 'So a Mist!', speech: 'So a Mist!' },
  { text: 'Wos macha ma na jetzt?', speech: 'Wos macha ma na jetzt?' },
  { text: 'Na Servas!', speech: 'Na Servas!' },
  { text: 'Des is bitter!', speech: 'Des is bitter!' },
  { text: 'Himmi!', speech: 'Himmi!' },
  { text: 'Oje oje!', speech: 'Oje oje!' },
];

// Partner gefunden (wenn gesuchte Sau gespielt wird)
export const MITSPIELER_PARTNER_GEFUNDEN: BavarianPhrase[] = [
  { text: 'Ah, dou sans zsamm!', speech: 'Ah, dou sans zsamm!' },
  { text: 'Jetzt wissma Bescheid!', speech: 'Jetzt wissma Bescheid!' },
  { text: 'Aso, aso...', speech: 'Aso, aso...' },
  { text: 'Na schaug o!', speech: 'Na schaug o!' },
  { text: 'Des hob i ma denkt!', speech: 'Des hob i ma denkt!' },
  { text: 'Wär i ned drauf kumma!', speech: 'Wär i ned drauf kumma!' },
];

// "Aus is!" - Wenn man alle restlichen Stiche gewinnt
export const AUS_IS: BavarianPhrase[] = [
  { text: 'Und aus is und gor is, weils wohr is!', speech: 'Und aus is und gor is, weils wohr is!' },
  { text: 'Aus is!', speech: 'Aus is!' },
  { text: 'Des wars!', speech: 'Des wars!' },
  { text: 'De restlichn ghörn mia!', speech: 'De restlichn ghörn mia!' },
  { text: "Legt's zamm, i hob alles!", speech: "Legts zamm, i hob alles!" },
];

// Zufällige Phrase aus Array wählen
export function randomPhrase(phrases: BavarianPhrase[]): BavarianPhrase {
  return phrases[Math.floor(Math.random() * phrases.length)];
}

// Karten-Key generieren für Kommentare
export function getKartenKey(farbe: string, wert: string): string {
  // Spezialkarten
  if (wert === 'ass') return `${farbe}-ass`;
  if (wert === 'koenig') return `${farbe}-koenig`;
  if (wert === 'ober') return `${farbe}-ober`;
  if (wert === 'unter') return `${farbe}-unter`;
  if (wert === '10') return `${farbe}-10`;
  // Spatzen (7, 8, 9)
  if (['7', '8', '9'].includes(wert)) return 'spatz';
  return farbe;
}

// Kommentar für gespielte Karte
export function getKartenKommentar(farbe: string, wert: string): BavarianPhrase | null {
  // Nur manchmal kommentieren (40% Wahrscheinlichkeit)
  if (Math.random() > 0.4) return null;

  const key = getKartenKey(farbe, wert);
  const kommentare = KARTEN_KOMMENTARE[key];

  if (kommentare && kommentare.length > 0) {
    return randomPhrase(kommentare);
  }

  return null;
}

// Ansage-Text generieren
export function getAnsageText(ansage: string, gesuchteAss?: string): BavarianPhrase {
  let phrases: BavarianPhrase[] | undefined;

  if (ansage === 'weiter' || ansage === 'passen') {
    phrases = BAVARIAN_ANSAGEN['weiter'];
  } else if (ansage === 'sauspiel' && gesuchteAss) {
    phrases = BAVARIAN_ANSAGEN[`sauspiel-${gesuchteAss}`];
  } else if (ansage.startsWith('farbsolo-')) {
    const farbe = ansage.replace('farbsolo-', '');
    phrases = BAVARIAN_ANSAGEN[`solo-${farbe}`];
  } else if (ansage === 'wenz') {
    phrases = BAVARIAN_ANSAGEN['wenz'];
  } else if (ansage === 'geier') {
    phrases = BAVARIAN_ANSAGEN['geier'];
  }

  if (phrases && phrases.length > 0) {
    return randomPhrase(phrases);
  }

  return { text: ansage, speech: ansage };
}

// Audio-System: Verwendet statisch gehostete MP3-Dateien
let isAudioUnlocked = false;

/**
 * Spielt einen bayerischen Spruch ab
 * @param text Der TTS-Text (z.B. "Wennz!")
 * @param _rate Wird ignoriert (für Rückwärtskompatibilität)
 */
export function speak(text: string, _rate: number = 0.9): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Audio abspielen
  playBavarianAudio(text).catch(e => {
    console.warn('Failed to play audio:', e);
  });
}

// Setzt die Standard-Stimme für einen Spieler
export function setPlayerVoice(voice: 'm' | 'f'): void {
  setDefaultVoice(voice);
}

export function getPlayerVoice(): 'm' | 'f' {
  return getDefaultVoice();
}

// Audio für Mobile entsperren - muss bei User-Interaktion aufgerufen werden
export function unlockAudio(): void {
  if (typeof window === 'undefined' || isAudioUnlocked) {
    return;
  }

  try {
    initAudio();
    isAudioUnlocked = true;
  } catch (e) {
    console.warn('Audio unlock failed:', e);
  }
}

// Prüft ob Audio bereit ist
export function isAudioReady(): boolean {
  return isAudioUnlocked;
}

// Stoppt aktuelles Audio
export function stopSpeech(): void {
  stopAudio();
}

// Voices laden (muss einmal aufgerufen werden)
export function initSpeech(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Mobile Audio-Unlock bei erstem Touch/Click
  const handleFirstInteraction = () => {
    unlockAudio();
    document.removeEventListener('touchstart', handleFirstInteraction);
    document.removeEventListener('click', handleFirstInteraction);
  };

  document.addEventListener('touchstart', handleFirstInteraction, { once: true, passive: true });
  document.addEventListener('click', handleFirstInteraction, { once: true });
}
