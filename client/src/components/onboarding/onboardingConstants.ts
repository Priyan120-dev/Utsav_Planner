import { OccasionType } from '@utsav/shared';

export const OCCASIONS: { value: OccasionType; label: string; icon: string }[] = [
  { value: 'wedding', label: 'Wedding (Vivah / Shaadi)', icon: '💍' },
  { value: 'birthday', label: 'Milestone Birthday (Janamdin)', icon: '🎂' },
  { value: 'community', label: 'Community Festival (Utsav)', icon: '🪔' },
  { value: 'anniversary', label: 'Anniversary (Varshikotsav)', icon: '🥂' },
  { value: 'cultural_festival', label: 'Cultural & Religious Function', icon: '🌸' }
];

export const POPULAR_PRIORITIES: string[] = [
  'Catering & Dining',
  'Decor, Mandap & Lighting',
  'Photography & Cinematic Video',
  'Music, DJ & Entertainment',
  'Venue & Grounds',
  'Attire & Styling',
  'Guest Transport & Logistics',
  'Invitations & Digital RSVP'
];

export const DEFAULT_PRIORITIES: [string, string, string] = [
  'Catering & Dining',
  'Photography & Cinematic Video',
  'Decor, Mandap & Lighting'
];

export const MIN_FREE_TEXT_LENGTH = 10;
export const MAX_FREE_TEXT_LENGTH = 5000;
