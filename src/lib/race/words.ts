export const WORD_POOLS = {
  letters: 'asdfjkl asdfjkl asdf jkl fj dk sl aj'.split(' '),

  short: [
    'the','and','for','are','but','not','you','all','can','her',
    'was','one','our','out','day','get','has','him','his','how',
    'man','new','now','old','see','two','way','who','boy','did',
    'its','let','put','say','she','too','use','dad','ago','air',
    'ask','big','end','far','few','got','had','hand','left','live',
    'may','off','own','run','set','sit','six','ten','yet',
  ],

  medium: [
    'their','there','which','would','about','could','other','after',
    'first','never','these','think','where','being','every','great',
    'place','small','found','still','those','three','under','while',
    'world','years','night','house','again','along','began','below',
    'build','carry','earth','heard','large','learn','light','might',
    'north','often','order','point','power','right','since','sound',
    'south','space','start','state','study','those','until','water',
    'words','wrote','young','clear','close','cross','floor','front',
    'given','group','heart','known','later','money','music','north',
    'paper','plant','ready','river','short','shown','since','small',
  ],

  long: [
    'important','something','question','together','sentence','because',
    'different','following','children','remember','thousand','complete',
    'example','include','another','between','mountain','national',
    'possible','probably','students','surface','usually','without',
    'anything','everyone','language','learning','movement','personal',
    'problem','process','program','quickly','reading','science',
    'several','society','special','subject','support','through',
  ],

  phrases: [
    'the quick','brown fox','jumps over','the lazy dog',
    'type fast','think clear','every key','has its finger',
    'home row','anchor down','eyes on screen','build the map',
  ],
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'chaos'

export function pickWord(difficulty: Difficulty): string {
  const r = Math.random()
  if (difficulty === 'easy') {
    return r < 0.4
      ? WORD_POOLS.letters[Math.floor(Math.random() * WORD_POOLS.letters.length)]
      : WORD_POOLS.short[Math.floor(Math.random() * WORD_POOLS.short.length)]
  }
  if (difficulty === 'medium') {
    return r < 0.3
      ? WORD_POOLS.short[Math.floor(Math.random() * WORD_POOLS.short.length)]
      : WORD_POOLS.medium[Math.floor(Math.random() * WORD_POOLS.medium.length)]
  }
  if (difficulty === 'hard') {
    return r < 0.2
      ? WORD_POOLS.medium[Math.floor(Math.random() * WORD_POOLS.medium.length)]
      : r < 0.7
        ? WORD_POOLS.long[Math.floor(Math.random() * WORD_POOLS.long.length)]
        : WORD_POOLS.phrases[Math.floor(Math.random() * WORD_POOLS.phrases.length)]
  }
  // chaos: mix everything
  const all = [...WORD_POOLS.short, ...WORD_POOLS.medium, ...WORD_POOLS.long, ...WORD_POOLS.phrases]
  return all[Math.floor(Math.random() * all.length)]
}

export const FALL_SPEEDS: Record<Difficulty, number> = {
  easy:   14000,  // ms for word to cross screen
  medium: 10000,
  hard:    7000,
  chaos:   5000,
}

export const SPAWN_RATES: Record<Difficulty, number> = {
  easy:   3500,
  medium: 2500,
  hard:   1800,
  chaos:  1200,
}
