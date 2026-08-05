const EMOJI_NAME_MAP = {
  'Two Glasses Clinking': '🥂',
  'Clinking Glasses': '🥂',
  'Red Heart': '❤️',
  'Heart': '❤️',
  'Rose': '🌹',
  'Tulip': '🌷',
  'Bouquet': '💐',
  'Diamond': '💎',
  'Gem Stone': '💎',
  'Star': '⭐',
  'Glowing Star': '🌟',
  'Sparkles': '✨',
  'Fire': '🔥',
  'Party Popper': '🎉',
  'Confetti Ball': '🎊',
  'Wrapped Gift': '🎁',
  'Gift': '🎁',
  'Trophy': '🏆',
  'Crown': '👑',
  'Kiss Mark': '💋',
  'Hundred Points': '💯',
  'Rainbow': '🌈',
  'Sun': '☀️',
  'Moon': '🌙',
  'Coffee': '☕',
  'Pizza': '🍕',
  'Birthday Cake': '🎂',
  'Champagne': '🍾',
  'Wine Glass': '🍷',
};

const isEmoji = value =>
  typeof value === 'string' &&
  /\p{Extended_Pictographic}/u.test(value.trim());

/**
 * Prefer gift.icon (emoji) over gift.name (often an Apple emoji label).
 */
export const formatGiftLabel = (name, icon) => {
  if (icon && isEmoji(icon)) {
    return icon.trim();
  }
  if (name && isEmoji(name)) {
    return name.trim();
  }
  if (name && EMOJI_NAME_MAP[name]) {
    return EMOJI_NAME_MAP[name];
  }
  return name || '🎁';
};

/**
 * Replace known emoji names inside announcement ticker strings.
 */
export const formatAnnouncementMessage = message => {
  if (!message || typeof message !== 'string') {
    return message;
  }

  let formatted = message;
  Object.entries(EMOJI_NAME_MAP).forEach(([label, emoji]) => {
    formatted = formatted.replace(new RegExp(`\\b${label}\\b`, 'g'), emoji);
  });
  return formatted;
};
