export type Finger =
  | 'left-pinky' | 'left-ring' | 'left-middle' | 'left-index'
  | 'right-index' | 'right-middle' | 'right-ring' | 'right-pinky'
  | 'thumb'

export type Hand = 'left' | 'right'

export type Row = 'number' | 'top' | 'home' | 'bottom' | 'space'

export interface KeyDef {
  key: string
  display: string
  finger: Finger
  hand: Hand
  row: Row
  col: number
}

export const FINGER_COLORS: Record<Finger, string> = {
  'left-pinky':   'var(--finger-left-pinky)',
  'left-ring':    'var(--finger-left-ring)',
  'left-middle':  'var(--finger-left-middle)',
  'left-index':   'var(--finger-left-index)',
  'right-index':  'var(--finger-right-index)',
  'right-middle': 'var(--finger-right-middle)',
  'right-ring':   'var(--finger-right-ring)',
  'right-pinky':  'var(--finger-right-pinky)',
  'thumb':        'var(--finger-thumb)',
}

export const FINGER_CSS: Record<Finger, string> = {
  'left-pinky':   'bg-finger-left-pinky',
  'left-ring':    'bg-finger-left-ring',
  'left-middle':  'bg-finger-left-middle',
  'left-index':   'bg-finger-left-index',
  'right-index':  'bg-finger-right-index',
  'right-middle': 'bg-finger-right-middle',
  'right-ring':   'bg-finger-right-ring',
  'right-pinky':  'bg-finger-right-pinky',
  'thumb':        '',
}

const k = (key: string, display: string, finger: Finger, hand: Hand, row: Row, col: number): KeyDef =>
  ({ key, display, finger, hand, row, col })

export const QWERTY_LAYOUT: KeyDef[] = [
  // Top row
  k('q','Q','left-pinky','left','top',0),
  k('w','W','left-ring','left','top',1),
  k('e','E','left-middle','left','top',2),
  k('r','R','left-index','left','top',3),
  k('t','T','left-index','left','top',4),
  k('y','Y','right-index','right','top',5),
  k('u','U','right-index','right','top',6),
  k('i','I','right-middle','right','top',7),
  k('o','O','right-ring','right','top',8),
  k('p','P','right-pinky','right','top',9),

  // Home row
  k('a','A','left-pinky','left','home',0),
  k('s','S','left-ring','left','home',1),
  k('d','D','left-middle','left','home',2),
  k('f','F','left-index','left','home',3),
  k('g','G','left-index','left','home',4),
  k('h','H','right-index','right','home',5),
  k('j','J','right-index','right','home',6),
  k('k','K','right-middle','right','home',7),
  k('l','L','right-ring','right','home',8),
  k(';',';','right-pinky','right','home',9),

  // Bottom row
  k('z','Z','left-pinky','left','bottom',0),
  k('x','X','left-ring','left','bottom',1),
  k('c','C','left-middle','left','bottom',2),
  k('v','V','left-index','left','bottom',3),
  k('b','B','left-index','left','bottom',4),
  k('n','N','right-index','right','bottom',5),
  k('m','M','right-index','right','bottom',6),
  k(',',',','right-middle','right','bottom',7),
  k('.','.','right-ring','right','bottom',8),
  k('/','?','right-pinky','right','bottom',9),

  // Space
  k(' ','SPACE','thumb','left','space',0),
]

/** Primary home-row key each finger rests on when idle */
export const FINGER_HOME_KEY: Record<Finger, string> = {
  'left-pinky':   'a',
  'left-ring':    's',
  'left-middle':  'd',
  'left-index':   'f',
  'right-index':  'j',
  'right-middle': 'k',
  'right-ring':   'l',
  'right-pinky':  ';',
  'thumb':        ' ',
}

/** All home-row anchor keys (the 8 finger resting positions) */
export const HOME_ANCHOR_KEYS = new Set(['a','s','d','f','j','k','l',';'])

/**
 * Given the active finger, returns the home-row keys that ALL OTHER
 * fingers should be resting on (i.e. the anchor keys to show).
 */
export function getAnchorKeys(activeFinger: Finger | null): string[] {
  return Object.entries(FINGER_HOME_KEY)
    .filter(([finger]) => finger !== activeFinger && finger !== 'thumb')
    .map(([, key]) => key)
}

export const KEY_MAP = new Map<string, KeyDef>(
  QWERTY_LAYOUT.map(k => [k.key, k])
)

export function getKeyDef(key: string): KeyDef | undefined {
  return KEY_MAP.get(key.toLowerCase())
}

export const KEYBOARD_ROWS: Record<Row, KeyDef[]> = {
  number: [],
  top:    QWERTY_LAYOUT.filter(k => k.row === 'top'),
  home:   QWERTY_LAYOUT.filter(k => k.row === 'home'),
  bottom: QWERTY_LAYOUT.filter(k => k.row === 'bottom'),
  space:  QWERTY_LAYOUT.filter(k => k.row === 'space'),
}
