export type RecommendedHand = 'left' | 'right' | 'both' | 'unknown';
export type RecommendedFinger = 'pinky' | 'ring' | 'middle' | 'index' | 'thumb' | 'unknown';

export type LayoutKeyRecommendation = { hand: RecommendedHand; finger: RecommendedFinger };

// Los dedos pertenecen a la posición física; el carácter cambia por distribución.
const PHYSICAL_KEY_RECOMMENDATIONS: Record<string, LayoutKeyRecommendation> = {
  KeyQ:{hand:'left',finger:'pinky'}, KeyA:{hand:'left',finger:'pinky'}, KeyZ:{hand:'left',finger:'pinky'},
  KeyW:{hand:'left',finger:'ring'}, KeyS:{hand:'left',finger:'ring'}, KeyX:{hand:'left',finger:'ring'},
  KeyE:{hand:'left',finger:'middle'}, KeyD:{hand:'left',finger:'middle'}, KeyC:{hand:'left',finger:'middle'},
  KeyR:{hand:'left',finger:'index'}, KeyT:{hand:'left',finger:'index'}, KeyF:{hand:'left',finger:'index'}, KeyG:{hand:'left',finger:'index'}, KeyV:{hand:'left',finger:'index'}, KeyB:{hand:'left',finger:'index'},
  KeyY:{hand:'right',finger:'index'}, KeyU:{hand:'right',finger:'index'}, KeyH:{hand:'right',finger:'index'}, KeyJ:{hand:'right',finger:'index'}, KeyN:{hand:'right',finger:'index'}, KeyM:{hand:'right',finger:'index'},
  KeyI:{hand:'right',finger:'middle'}, KeyK:{hand:'right',finger:'middle'}, KeyO:{hand:'right',finger:'ring'}, KeyL:{hand:'right',finger:'ring'}, KeyP:{hand:'right',finger:'pinky'}, Space:{hand:'both',finger:'thumb'},
  Digit1:{hand:'left',finger:'pinky'}, Digit2:{hand:'left',finger:'ring'}, Digit3:{hand:'left',finger:'middle'}, Digit4:{hand:'left',finger:'index'}, Digit5:{hand:'left',finger:'index'}, Digit6:{hand:'right',finger:'index'}, Digit7:{hand:'right',finger:'index'}, Digit8:{hand:'right',finger:'middle'}, Digit9:{hand:'right',finger:'ring'}, Digit0:{hand:'right',finger:'pinky'}, Minus:{hand:'right',finger:'pinky'}, Equal:{hand:'right',finger:'pinky'}, BracketLeft:{hand:'right',finger:'pinky'}, BracketRight:{hand:'right',finger:'pinky'}, Backslash:{hand:'right',finger:'pinky'}, Semicolon:{hand:'right',finger:'pinky'}, Quote:{hand:'right',finger:'pinky'}, Comma:{hand:'right',finger:'middle'}, Period:{hand:'right',finger:'ring'}, Slash:{hand:'right',finger:'pinky'}, Backquote:{hand:'left',finger:'pinky'},
};

export const SUPPORTED_LAYOUT_IDS = new Set(['qwerty-es','qwerty-latam','qwerty-en','qwerty-us-intl','qwerty-uk','qwerty-ca-multilingual','qwerty-br','qwerty-pt','qwerty-it','azerty','qwertz','qwertz-cs','qwerty-da','qwertz-hr','qwertz-hu','qwerty-nl','qwerty-no','qwerty-pl','qwerty-ro','qwerty-sv','qwerty-tr','dvorak','colemak']);

export function getLayoutKeyRecommendation(_layoutId: string, code: string): LayoutKeyRecommendation {
  return PHYSICAL_KEY_RECOMMENDATIONS[code] ?? { hand: 'unknown', finger: 'unknown' };
}
