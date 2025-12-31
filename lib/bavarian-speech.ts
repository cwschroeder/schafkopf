// Bayerische Sprachausgabe für Schafkopf

export interface BavarianPhrase {
  text: string;      // Anzeigetext
  speech: string;    // Phonetische Version für TTS
}

// Ansagen auf Bayerisch
export const BAVARIAN_ANSAGEN: Record<string, BavarianPhrase[]> = {
  // Sauspiel
  'sauspiel-eichel': [
    { text: 'Mit da Oichl!', speech: 'Mit da Oichl!' },
    { text: 'Oichl-Sau!', speech: 'Oichl Sau!' },
    { text: 'I spui auf d\'Oichl!', speech: 'I spui auf d Oichl!' },
    { text: 'D\'Oidn muas her!', speech: 'D Oidn muas her!' },
    { text: 'I such d\'Oidn!', speech: 'I such d Oidn!' },
    { text: 'Wer hod d\'Alte?', speech: 'Wer hod d Alte?' },
  ],
  'sauspiel-gras': [
    { text: 'Mit da Grosn!', speech: 'Mit da Grosn!' },
    { text: 'Gras-Sau!', speech: 'Gras Sau!' },
    { text: 'I geh auf Gras!', speech: 'I geh auf Gras!' },
    { text: 'D\'Blaue muas her!', speech: 'D Blaue muas her!' },
    { text: 'I such d\'Blau Sau!', speech: 'I such d Blau Sau!' },
    { text: 'Wo is d\'Blaue?', speech: 'Wo is d Blaue?' },
  ],
  'sauspiel-schellen': [
    { text: 'Mit da Hund hockt ohm!', speech: 'Mit da Hund hockt ohm!' },
    { text: 'Schelln-Sau!', speech: 'Schelln Sau!' },
    { text: 'Da Hund muas her!', speech: 'Da Hund muas her!' },
    { text: 'Schlass!', speech: 'Schlass!' },
    { text: 'I geh auf Schelln!', speech: 'I geh auf Schelln!' },
    { text: 'Wo hockt da Hund?', speech: 'Wo hockt da Hund?' },
  ],

  // Solo
  'solo-eichel': [
    { text: 'Oichlsola!', speech: 'Oichl Solar!' },
    { text: 'I spui Oichl alloa!', speech: 'I spui Oichl alloa!' },
    { text: 'Oichl is Trumpf!', speech: 'Oichl is Trumpf!' },
    { text: 'Oichl ganz alloa!', speech: 'Oichl ganz alloa!' },
  ],
  'solo-gras': [
    { text: 'Grassola!', speech: 'Gras Solar!' },
    { text: 'Gras alloa!', speech: 'Gras alloa!' },
    { text: 'I spui Gras!', speech: 'I spui Gras!' },
    { text: 'Grün is Trumpf!', speech: 'Grün is Trumpf!' },
  ],
  'solo-herz': [
    { text: 'Herzsola!', speech: 'Herz Solar!' },
    { text: 'I mach a Herzl!', speech: 'I mach a Herzl!' },
    { text: 'Herz alloa!', speech: 'Herz alloa!' },
    { text: 'Herz, Schmerz!', speech: 'Herz, Schmerz!' },
  ],
  'solo-schellen': [
    { text: 'Schellnsola!', speech: 'Schelln Solar!' },
    { text: 'Schelln alloa!', speech: 'Schelln alloa!' },
    { text: 'I spui Schelln!', speech: 'I spui Schelln!' },
    { text: 'Schelln is Trumpf!', speech: 'Schelln is Trumpf!' },
  ],

  // Wenz
  'wenz': [
    { text: 'Wenz!', speech: 'Wennz!' },
    { text: 'An Wenz!', speech: 'An Wennz!' },
    { text: 'I wenz!', speech: 'I wennz!' },
    { text: 'Wenz hab i!', speech: 'Wennz hab i!' },
    { text: 'Des is a Wenz!', speech: 'Des is a Wennz!' },
    { text: 'Wenz, bittschön!', speech: 'Wennz, bittschön!' },
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
    { text: 'I dad weidda!', speech: 'I daad weidda!' },
    { text: 'Nix g\'scheits!', speech: 'Nix gscheits!' },
    { text: 'I hob nix!', speech: 'I hob nix!' },
    { text: 'Passt scho!', speech: 'Passt scho!' },
    { text: 'Na!', speech: 'Na!' },
    { text: 'Des ko i ned!', speech: 'Des ko i ned!' },
    { text: 'Wos soi i do macha?', speech: 'Wos soi i do macha?' },
    { text: 'Nix dabei!', speech: 'Nix dabei!' },
    { text: 'Lauter Bledsinn!', speech: 'Lauter Bledsinn!' },
    { text: 'A Dreck!', speech: 'A Dreck!' },
    { text: 'Mog ned!', speech: 'Mog ned!' },
    { text: 'I loss aus!', speech: 'I loss aus!' },
    { text: 'Des san lauter Kracher!', speech: 'Des san lauter Kracher!' },
    { text: 'Nix wia Ramsch!', speech: 'Nix wia Ramsch!' },
    { text: 'Hod sa da Geber heid wieda d\'Hend niad gwaschn?', speech: 'Hod sa da Geber heid wieda d Hend niad gwaschn?' },
    { text: 'Latta Siema heid wieda!', speech: 'Latta Siema heid wieda!' },
    { text: 'Mit dem heads eitz niad grachat, göll?', speech: 'Mit dem heads eitz niad grachat, göll?' },
    { text: 'Göll dou schaust niad schlecht?', speech: 'Göll dou schaust niad schlecht?' },
    { text: 'Wos is des für a Schas?', speech: 'Wos is des für a Schas?' },
    { text: 'Des is ja zum Scheissn!', speech: 'Des is ja zum Scheissn!' },
    { text: 'Des hoast woascheinlich guat mischn!', speech: 'Des hoast woascheinlich guat mischn!' },
  ],
};

// Karten-spezifische Kommentare beim Ausspielen
export const KARTEN_KOMMENTARE: Record<string, BavarianPhrase[]> = {
  // Asse (Säue)
  'eichel-ass': [
    { text: 'D\'Alte!', speech: 'D Alte!' },
    { text: 'Do kummt d\'Alte!', speech: 'Do kummt d Alte!' },
    { text: 'Eichalia, die oide Waldschnepfe!', speech: 'Eichalia, die oide Waldschnepfe!' },
    { text: 'D\'Oichlsau!', speech: 'D Oichlsau!' },
  ],
  'gras-ass': [
    { text: 'D\'Blaue!', speech: 'D Blaue!' },
    { text: 'D\'Blau Sau!', speech: 'D Blau Sau!' },
    { text: 'Grassau!', speech: 'Grassau!' },
    { text: 'Do is d\'Blaue!', speech: 'Do is d Blaue!' },
    { text: 'Die Blaue griagst!', speech: 'Die Blaue griagst!' },
  ],
  'herz-ass': [
    { text: 'Herzsau!', speech: 'Herzsau!' },
    { text: 'Herz, Schmerz und sonst noch was!', speech: 'Herz, Schmerz und sonst noch was!' },
    { text: 'Des Herzl!', speech: 'Des Herzl!' },
  ],
  'schellen-ass': [
    { text: 'Schlass!', speech: 'Schlass!' },
    { text: 'Da Hund hockt ohm!', speech: 'Da Hund hockt ohm!' },
    { text: 'D\'Schellnsau!', speech: 'D Schellnsau!' },
    { text: 'Do, da Hund!', speech: 'Do, da Hund!' },
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
    { text: 'Da Oide!', speech: 'Da Oide!' },
  ],
  'gras-koenig': [
    { text: 'Graskini!', speech: 'Graskini!' },
    { text: 'Da Grüne!', speech: 'Da Grüne!' },
  ],
  'schellen-koenig': [
    { text: 'Schellnkini!', speech: 'Schellnkini!' },
  ],

  // Ober (Trumpf)
  'eichel-ober': [
    { text: 'Da Oide!', speech: 'Da Oide!' },
    { text: 'Der Alte!', speech: 'Der Alte!' },
    { text: 'Oichlober!', speech: 'Oichlober!' },
    { text: 'Da höchste Trumpf!', speech: 'Da höchste Trumpf!' },
    { text: 'Des is da Chef!', speech: 'Des is da Chef!' },
  ],
  'gras-ober': [
    { text: 'Da Blaue!', speech: 'Da Blaue!' },
    { text: 'Grasober!', speech: 'Grasober!' },
    { text: 'Da Zweithöchste!', speech: 'Da Zweithöchste!' },
    { text: 'Der Blaue kummt!', speech: 'Der Blaue kummt!' },
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
    { text: 'Der Alte Wenz!', speech: 'Der Alte Wennz!' },
    { text: 'Oichlunter!', speech: 'Oichlunter!' },
  ],
  'gras-unter': [
    { text: 'Grasunter!', speech: 'Grasunter!' },
    { text: 'Da Grüne Wenz!', speech: 'Da Grüne Wennz!' },
  ],
  'herz-unter': [
    { text: 'Herzunter!', speech: 'Herzunter!' },
    { text: 'Mit an Unter gäihst niad unta!', speech: 'Mit an Unter gäihst niad unta!' },
  ],
  'schellen-unter': [
    { text: 'Schellnunter!', speech: 'Schellnunter!' },
    { text: 'Da kloane Wenz!', speech: 'Da kloane Wennz!' },
  ],

  // Zehner (Eisenbahner)
  'eichel-10': [
    { text: 'An Eisenbahner!', speech: 'An Eisenbahner!' },
    { text: 'Oichl-Zehner!', speech: 'Oichl-Zehner!' },
    { text: 'Zehn Augen!', speech: 'Zehn Augen!' },
  ],
  'gras-10': [
    { text: 'An Eisenbahner!', speech: 'An Eisenbahner!' },
    { text: 'Gras-Zehner!', speech: 'Gras-Zehner!' },
  ],
  'herz-10': [
    { text: 'An Eisenbahner!', speech: 'An Eisenbahner!' },
    { text: 'Herz-Zehner!', speech: 'Herz-Zehner!' },
  ],
  'schellen-10': [
    { text: 'An Eisenbahner!', speech: 'An Eisenbahner!' },
    { text: 'Schelln-Zehner!', speech: 'Schelln-Zehner!' },
  ],

  // Farben angespielt
  'eichel': [
    { text: 'Euchalia, die oide Waldschnepfe!', speech: 'Euchalia, die oide Waldschnepfe!' },
    { text: 'Oichl kummt!', speech: 'Oichl kummt!' },
    { text: 'A Oichl!', speech: 'A Oichl!' },
  ],
  'gras': [
    { text: 'Grün is dro!', speech: 'Grün is dro!' },
    { text: 'A Gras!', speech: 'A Gras!' },
    { text: 'Laub!', speech: 'Laub!' },
  ],
  'herz': [
    { text: 'Herz, Schmerz und sonst noch was!', speech: 'Herz, Schmerz und sonst noch was!' },
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
    { text: 'Do vastehst an Spaß!', speech: 'Do vastehst an Spaß!' },
    { text: 'I stich!', speech: 'I stich!' },
    { text: 'Trumpf drauf!', speech: 'Trumpf drauf!' },
    { text: 'Des hob i no!', speech: 'Des hob i no!' },
  ],

  // Spatzen (7er, 8er, 9er - wenig Augen)
  'spatz': [
    { text: 'An Spatzn!', speech: 'An Spatzn!' },
    { text: 'A Lusche!', speech: 'A Lusche!' },
    { text: 'A Kracher!', speech: 'A Kracher!' },
    { text: 'Nix wert!', speech: 'Nix wert!' },
    { text: 'An Ramsch!', speech: 'An Ramsch!' },
  ],
};

// Kommentare beim Unter ausspielen (allgemein)
export const UNTER_KOMMENTARE: BavarianPhrase[] = [
  { text: 'Mit an Unter gäihst niad unta!', speech: 'Mit an Unter gäihst niad unta!' },
  { text: 'An Wenz!', speech: 'An Wennz!' },
  { text: 'Der sticht!', speech: 'Der sticht!' },
];

// Reaktionen beim Stich gewinnen
export const STICH_GEWONNEN: BavarianPhrase[] = [
  { text: 'Den back i zsamm!', speech: 'Den back i zsamm!' },
  { text: 'Samma dabei!', speech: 'Samma dabei!' },
  { text: 'Passt scho!', speech: 'Passt scho!' },
  { text: 'Her damit!', speech: 'Her damit!' },
  { text: 'So ghört si des!', speech: 'So ghört si des!' },
  { text: 'Den hob i!', speech: 'Den hob i!' },
  { text: 'Meiner!', speech: 'Meiner!' },
  { text: 'Gehört mir!', speech: 'Gehört mir!' },
  { text: 'Jo mei!', speech: 'Jo mei!' },
  { text: 'Basst!', speech: 'Basst!' },
  { text: 'So is recht!', speech: 'So is recht!' },
  { text: 'Guat gmacht!', speech: 'Guat gmacht!' },
  { text: 'Wunderbar!', speech: 'Wunderbar!' },
  { text: 'Na also!', speech: 'Na also!' },
  { text: 'Sauber!', speech: 'Sauber!' },
  { text: 'Des war klar!', speech: 'Des war klar!' },
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
  { text: 'Des deaf ned wohr sei!', speech: 'Des deaf ned wohr sei!' },
  { text: 'A Wahnsinn!', speech: 'A Wahnsinn!' },
  { text: 'Sakrament!', speech: 'Sakrament!' },
  { text: 'Himmihergottnochemoal!', speech: 'Himmihergottnochemoal!' },
  { text: 'So a Sau!', speech: 'So a Sau!' },
  { text: 'Wos soi des?', speech: 'Wos soi des?' },
  { text: 'Na servas!', speech: 'Na servas!' },
  { text: 'Himmelherrschaftszeitn!', speech: 'Himmelherrschaftszeitn!' },
  { text: 'Kreizdividomine!', speech: 'Kreizdividomine!' },
  { text: 'Krumme Nuckel!', speech: 'Krumme Nuckel!' },
  { text: 'A leck mi doch kreizweis am Oarsch!', speech: 'A leck mi doch kreizweis am Oarsch!' },
  { text: 'I bin doch niad af da Brennsuppn daheagschwumma!', speech: 'I bin doch niad af da Brennsuppn daheagschwumma!' },
];

// Reaktionen beim Spielstart
export const SPIEL_START: BavarianPhrase[] = [
  { text: 'Na dann schaugma moi!', speech: 'Na dann schaugma moi!' },
  { text: 'Auf geht\'s!', speech: 'Auf gehts!' },
  { text: 'Pack ma\'s!', speech: 'Pack mas!' },
  { text: 'Los geht\'s!', speech: 'Los gehts!' },
  { text: 'Na, dann woi ma moi!', speech: 'Na, dann woi ma moi!' },
  { text: 'Schaugma moi, dann seng ma scho!', speech: 'Schaugma moi, dann seng ma scho!' },
  { text: 'Auf d\'Plätze!', speech: 'Auf d Plätze!' },
  { text: 'I bin bereit!', speech: 'I bin bereit!' },
];

// Reaktionen beim Spielende (gewonnen)
export const SPIEL_GEWONNEN: BavarianPhrase[] = [
  { text: 'Ha! Gwunna!', speech: 'Ha! Gwunna!' },
  { text: 'Des war\'s!', speech: 'Des wars!' },
  { text: 'So schaut\'s aus!', speech: 'So schauts aus!' },
  { text: 'Ja mei, des war leicht!', speech: 'Ja mei, des war leicht!' },
  { text: 'Hob i\'s doch gwusst!', speech: 'Hob is doch gwusst!' },
  { text: 'So ghört si des!', speech: 'So ghört si des!' },
  { text: 'Her mit da Kohle!', speech: 'Her mit da Kohle!' },
  { text: 'Zahltag!', speech: 'Zahltag!' },
  { text: 'Danke für\'s Geld!', speech: 'Danke fürs Geld!' },
  { text: 'Sauber gmacht!', speech: 'Sauber gmacht!' },
  { text: 'A so a Gaudi!', speech: 'A so a Gaudi!' },
];

// Reaktionen beim Spielende (verloren)
export const SPIEL_VERLOREN: BavarianPhrase[] = [
  { text: 'Kruzifix noamoi!', speech: 'Kruzifix noamal!' },
  { text: 'Des nächste Mal!', speech: 'Des nächste Mal!' },
  { text: 'Mei, so geht\'s halt!', speech: 'Mei, so gehts halt!' },
  { text: 'Woaschd wos? Wurscht!', speech: 'Woaschd wos? Wurscht!' },
  { text: 'Des war Pech!', speech: 'Des war Pech!' },
  { text: 'Nächstes Moi!', speech: 'Nächstes Moi!' },
  { text: 'A so a Schmarrn!', speech: 'A so a Schmarrn!' },
  { text: 'Des zoi i ned!', speech: 'Des zoi i ned!' },
  { text: 'I glaub\'s ned!', speech: 'I glaubs ned!' },
  { text: 'Wos für a Bledsinn!', speech: 'Wos für a Bledsinn!' },
];

// Du/Re Ansagen
export const DU_GESAGT: BavarianPhrase[] = [
  { text: 'Du!', speech: 'Du!' },
  { text: 'Du! Des packst ned!', speech: 'Du! Des packst ned!' },
  { text: 'Du! I glaub\'s ned!', speech: 'Du! I glaubs ned!' },
  { text: 'Kontra! Du!', speech: 'Kontra! Du!' },
];

export const RE_GESAGT: BavarianPhrase[] = [
  { text: 'Re!', speech: 'Reh!' },
  { text: 'Re! Des pack i locker!', speech: 'Reh! Des pack i locker!' },
  { text: 'Re! Schaugma moi!', speech: 'Reh! Schaugma moi!' },
];

// Legen/Klopfen Kommentare
export const LEGEN_JA: BavarianPhrase[] = [
  { text: 'I leg!', speech: 'I leg!' },
  { text: 'Des verdoppel ma!', speech: 'Des verdoppel ma!' },
  { text: 'Do bin i dabei!', speech: 'Do bin i dabei!' },
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

// Speech synthesis mit deutscher Stimme
let speechQueue: string[] = [];
let isSpeaking = false;
let isAudioUnlocked = false;
let cachedVoice: SpeechSynthesisVoice | null = null;

// Findet die beste deutsche Stimme
function findGermanVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  // Präferenz: männliche deutsche Stimme > deutsche Stimme > erste Stimme
  return voices.find(v =>
    v.lang.startsWith('de') && v.name.toLowerCase().includes('male')
  ) || voices.find(v => v.lang.startsWith('de')) || voices[0] || null;
}

export function speak(text: string, rate: number = 0.9): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  // Auf Mobile: Audio muss erst "entsperrt" werden
  if (!isAudioUnlocked) {
    // Versuche, Audio bei nächster Gelegenheit zu entsperren
    unlockAudio();
  }

  speechQueue.push(text);
  processQueue(rate);
}

function processQueue(rate: number): void {
  if (isSpeaking || speechQueue.length === 0) {
    return;
  }

  isSpeaking = true;
  const text = speechQueue.shift()!;

  // Cancel any pending speech (wichtig für Mobile)
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // Gecachte Stimme verwenden oder neu suchen
  if (!cachedVoice) {
    cachedVoice = findGermanVoice();
  }

  if (cachedVoice) {
    utterance.voice = cachedVoice;
  }

  utterance.lang = 'de-DE';
  utterance.rate = rate;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  utterance.onend = () => {
    isSpeaking = false;
    // Kleine Verzögerung vor nächster Sprache (bessere Verständlichkeit)
    setTimeout(() => processQueue(rate), 100);
  };

  utterance.onerror = (e) => {
    console.warn('Speech error:', e);
    isSpeaking = false;
    processQueue(rate);
  };

  // iOS Safari fix: Speak muss in einem User-Event-Context aufgerufen werden
  try {
    window.speechSynthesis.speak(utterance);

    // Chrome Mobile fix: speechSynthesis kann manchmal "hängen"
    // Timeout zum Zurücksetzen nach 10 Sekunden
    setTimeout(() => {
      if (isSpeaking && speechQueue.length > 0) {
        isSpeaking = false;
        processQueue(rate);
      }
    }, 10000);
  } catch (e) {
    console.warn('Speech synthesis failed:', e);
    isSpeaking = false;
  }
}

// Audio für Mobile entsperren - muss bei User-Interaktion aufgerufen werden
export function unlockAudio(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || isAudioUnlocked) {
    return;
  }

  try {
    // Leere Utterance spricht nichts, entsperrt aber Audio
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
    isAudioUnlocked = true;

    // Stimme cachen
    cachedVoice = findGermanVoice();
  } catch (e) {
    console.warn('Audio unlock failed:', e);
  }
}

// Prüft ob Audio bereit ist
export function isAudioReady(): boolean {
  return isAudioUnlocked;
}

// Voices laden (muss einmal aufgerufen werden)
export function initSpeech(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  // Voices sind oft nicht sofort verfügbar
  const loadVoices = () => {
    cachedVoice = findGermanVoice();
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  } else {
    loadVoices();
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
