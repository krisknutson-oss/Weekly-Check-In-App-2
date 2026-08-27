import { ColorSchemeId } from '../types';

export interface ColorSchemeConfig {
  id: ColorSchemeId;
  name: string;
  subtitle: string;
  preview: {
    bg: string;
    card: string;
    accent: string;
    border: string;
  };
  isLight?: boolean;
  vars: {
    bgDark: string;
    cardDark: string;
    cardSurface: string;
    cardElevated: string;
    borderDark: string;
    borderSubtle: string;
    borderHighlight: string;
    gold: string;
    goldLight: string;
    goldMuted: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textFaint: string;
    success: string;
    successBg: string;
    alert: string;
    alertBg: string;
    scrollbarTrack: string;
    scrollbarThumb: string;
  };
}

export const COLOR_SCHEMES: ColorSchemeConfig[] = [
  // ================= NIGHT / DARK THEMES =================
  {
    id: 'sophisticated-dark',
    name: 'Obsidian & Gold (Night)',
    subtitle: 'Classic luxury dark mode with warm metallic gold accents',
    isLight: false,
    preview: {
      bg: '#0A0A0A',
      card: '#121212',
      accent: '#D4AF37',
      border: '#1F1F1F',
    },
    vars: {
      bgDark: '#0A0A0A',
      cardDark: '#121212',
      cardSurface: '#161616',
      cardElevated: '#1C1C1C',
      borderDark: '#1F1F1F',
      borderSubtle: '#2A2A2A',
      borderHighlight: '#333333',
      gold: '#D4AF37',
      goldLight: '#E5C158',
      goldMuted: 'rgba(212, 175, 55, 0.15)',
      textPrimary: '#FFFFFF',
      textSecondary: '#E0E0E0',
      textMuted: '#888888',
      textFaint: '#555555',
      success: '#22C55E',
      successBg: 'rgba(34, 197, 94, 0.12)',
      alert: '#EF4444',
      alertBg: 'rgba(239, 68, 68, 0.12)',
      scrollbarTrack: '#0A0A0A',
      scrollbarThumb: '#262626',
    },
  },
  {
    id: 'pitch-black',
    name: 'Pitch Black OLED (Night)',
    subtitle: 'Absolute true black background with vivid contrast highlights',
    isLight: false,
    preview: {
      bg: '#000000',
      card: '#0D0D0D',
      accent: '#F59E0B',
      border: '#1E1E1E',
    },
    vars: {
      bgDark: '#000000',
      cardDark: '#0D0D0D',
      cardSurface: '#141414',
      cardElevated: '#1C1C1C',
      borderDark: '#1E1E1E',
      borderSubtle: '#282828',
      borderHighlight: '#383838',
      gold: '#F59E0B',
      goldLight: '#FBBF24',
      goldMuted: 'rgba(245, 158, 11, 0.15)',
      textPrimary: '#FFFFFF',
      textSecondary: '#E5E5E5',
      textMuted: '#8A8A8A',
      textFaint: '#525252',
      success: '#10B981',
      successBg: 'rgba(16, 185, 129, 0.12)',
      alert: '#F43F5E',
      alertBg: 'rgba(244, 63, 94, 0.12)',
      scrollbarTrack: '#000000',
      scrollbarThumb: '#222222',
    },
  },
  {
    id: 'midnight-sapphire',
    name: 'Midnight Sapphire (Night)',
    subtitle: 'Deep oceanic navy with electric azure & cobalt highlights',
    isLight: false,
    preview: {
      bg: '#070D18',
      card: '#0F172A',
      accent: '#38BDF8',
      border: '#1E293B',
    },
    vars: {
      bgDark: '#070D18',
      cardDark: '#0F172A',
      cardSurface: '#1E293B',
      cardElevated: '#24344D',
      borderDark: '#1E293B',
      borderSubtle: '#334155',
      borderHighlight: '#475569',
      gold: '#38BDF8',
      goldLight: '#7DD3FC',
      goldMuted: 'rgba(56, 189, 248, 0.15)',
      textPrimary: '#FFFFFF',
      textSecondary: '#E2E8F0',
      textMuted: '#94A3B8',
      textFaint: '#64748B',
      success: '#34D399',
      successBg: 'rgba(52, 211, 153, 0.12)',
      alert: '#F87171',
      alertBg: 'rgba(248, 113, 113, 0.12)',
      scrollbarTrack: '#070D18',
      scrollbarThumb: '#1E293B',
    },
  },
  {
    id: 'academic-emerald',
    name: 'Academic Forest (Night)',
    subtitle: 'Scholarly dark pine with luminous jade & emerald glow',
    isLight: false,
    preview: {
      bg: '#06110A',
      card: '#0D1D13',
      accent: '#10B981',
      border: '#1A3323',
    },
    vars: {
      bgDark: '#06110A',
      cardDark: '#0D1D13',
      cardSurface: '#14291B',
      cardElevated: '#1A3624',
      borderDark: '#1A3323',
      borderSubtle: '#264D34',
      borderHighlight: '#346645',
      gold: '#10B981',
      goldLight: '#34D399',
      goldMuted: 'rgba(16, 185, 129, 0.15)',
      textPrimary: '#FFFFFF',
      textSecondary: '#ECFDF5',
      textMuted: '#86A792',
      textFaint: '#587562',
      success: '#34D399',
      successBg: 'rgba(52, 211, 153, 0.12)',
      alert: '#F87171',
      alertBg: 'rgba(248, 113, 113, 0.12)',
      scrollbarTrack: '#06110A',
      scrollbarThumb: '#1A3323',
    },
  },
  {
    id: 'crimson-noir',
    name: 'Crimson Velvet (Night)',
    subtitle: 'Dramatic rich burgundy with warm rose & ruby elegance',
    isLight: false,
    preview: {
      bg: '#10070A',
      card: '#1A0D12',
      accent: '#F43F5E',
      border: '#2E1520',
    },
    vars: {
      bgDark: '#10070A',
      cardDark: '#1A0D12',
      cardSurface: '#26141D',
      cardElevated: '#331B27',
      borderDark: '#2E1520',
      borderSubtle: '#451E2F',
      borderHighlight: '#5C273E',
      gold: '#F43F5E',
      goldLight: '#FB7185',
      goldMuted: 'rgba(244, 63, 94, 0.15)',
      textPrimary: '#FFFFFF',
      textSecondary: '#FFF1F2',
      textMuted: '#A88B97',
      textFaint: '#755A67',
      success: '#34D399',
      successBg: 'rgba(52, 211, 153, 0.12)',
      alert: '#FB7185',
      alertBg: 'rgba(251, 113, 133, 0.12)',
      scrollbarTrack: '#10070A',
      scrollbarThumb: '#2E1520',
    },
  },
  {
    id: 'deep-amethyst',
    name: 'Imperial Amethyst (Night)',
    subtitle: 'Regal dark violet with shimmering lavender & royal gold',
    isLight: false,
    preview: {
      bg: '#0D0814',
      card: '#160F22',
      accent: '#C084FC',
      border: '#281B3D',
    },
    vars: {
      bgDark: '#0D0814',
      cardDark: '#160F22',
      cardSurface: '#211733',
      cardElevated: '#2D1F45',
      borderDark: '#281B3D',
      borderSubtle: '#3E2A5E',
      borderHighlight: '#53387E',
      gold: '#C084FC',
      goldLight: '#D8B4FE',
      goldMuted: 'rgba(192, 132, 252, 0.15)',
      textPrimary: '#FFFFFF',
      textSecondary: '#FAF5FF',
      textMuted: '#A795B8',
      textFaint: '#77668A',
      success: '#34D399',
      successBg: 'rgba(52, 211, 153, 0.12)',
      alert: '#F87171',
      alertBg: 'rgba(248, 113, 113, 0.12)',
      scrollbarTrack: '#0D0814',
      scrollbarThumb: '#281B3D',
    },
  },

  // ================= DAY / WHITE / LIGHT THEMES =================
  {
    id: 'pure-white',
    name: 'Pure White (Day)',
    subtitle: 'Crisp snow white background with high-contrast reverse deep ink text',
    isLight: true,
    preview: {
      bg: '#FFFFFF',
      card: '#F8FAFC',
      accent: '#B45309',
      border: '#E2E8F0',
    },
    vars: {
      bgDark: '#FFFFFF',
      cardDark: '#F8FAFC',
      cardSurface: '#F1F5F9',
      cardElevated: '#E2E8F0',
      borderDark: '#E2E8F0',
      borderSubtle: '#CBD5E1',
      borderHighlight: '#94A3B8',
      gold: '#B45309',
      goldLight: '#D97706',
      goldMuted: 'rgba(180, 83, 9, 0.12)',
      textPrimary: '#0F172A',
      textSecondary: '#1E293B',
      textMuted: '#64748B',
      textFaint: '#94A3B8',
      success: '#16A34A',
      successBg: 'rgba(22, 163, 74, 0.12)',
      alert: '#DC2626',
      alertBg: 'rgba(220, 38, 38, 0.12)',
      scrollbarTrack: '#FFFFFF',
      scrollbarThumb: '#CBD5E1',
    },
  },
  {
    id: 'vintage-ledger',
    name: 'Vintage Parchment (Day)',
    subtitle: 'Classic warm ivory archival ledger with antique bronze & dark walnut text',
    isLight: true,
    preview: {
      bg: '#FAF7F0',
      card: '#EFE9DC',
      accent: '#B8860B',
      border: '#D8CEBE',
    },
    vars: {
      bgDark: '#FAF7F0',
      cardDark: '#EFE9DC',
      cardSurface: '#E6DEC9',
      cardElevated: '#DCD3BC',
      borderDark: '#D8CEBE',
      borderSubtle: '#C4B79F',
      borderHighlight: '#B0A288',
      gold: '#B8860B',
      goldLight: '#996F07',
      goldMuted: 'rgba(184, 134, 11, 0.15)',
      textPrimary: '#1F1D1A',
      textSecondary: '#332F2A',
      textMuted: '#6E665B',
      textFaint: '#968C7D',
      success: '#15803D',
      successBg: 'rgba(21, 128, 61, 0.12)',
      alert: '#DC2626',
      alertBg: 'rgba(220, 38, 38, 0.12)',
      scrollbarTrack: '#FAF7F0',
      scrollbarThumb: '#D8CEBE',
    },
  },
  {
    id: 'clean-slate',
    name: 'Scholarly Slate (Day)',
    subtitle: 'Contemporary light mist background with deep navy text and cobalt accents',
    isLight: true,
    preview: {
      bg: '#F1F5F9',
      card: '#FFFFFF',
      accent: '#2563EB',
      border: '#CBD5E1',
    },
    vars: {
      bgDark: '#F1F5F9',
      cardDark: '#FFFFFF',
      cardSurface: '#F8FAFC',
      cardElevated: '#E2E8F0',
      borderDark: '#CBD5E1',
      borderSubtle: '#94A3B8',
      borderHighlight: '#64748B',
      gold: '#2563EB',
      goldLight: '#3B82F6',
      goldMuted: 'rgba(37, 99, 235, 0.12)',
      textPrimary: '#0F172A',
      textSecondary: '#1E293B',
      textMuted: '#475569',
      textFaint: '#64748B',
      success: '#16A34A',
      successBg: 'rgba(22, 163, 74, 0.12)',
      alert: '#EF4444',
      alertBg: 'rgba(239, 68, 68, 0.12)',
      scrollbarTrack: '#F1F5F9',
      scrollbarThumb: '#CBD5E1',
    },
  },
  {
    id: 'warm-sand',
    name: 'Nordic Sand (Day)',
    subtitle: 'Warm cozy linen background with espresso charcoal typography',
    isLight: true,
    preview: {
      bg: '#FFFBEB',
      card: '#FEF3C7',
      accent: '#D97706',
      border: '#FDE68A',
    },
    vars: {
      bgDark: '#FFFBEB',
      cardDark: '#FEF3C7',
      cardSurface: '#FDE68A',
      cardElevated: '#FCD34D',
      borderDark: '#FDE68A',
      borderSubtle: '#FBBF24',
      borderHighlight: '#F59E0B',
      gold: '#D97706',
      goldLight: '#B45309',
      goldMuted: 'rgba(217, 119, 6, 0.15)',
      textPrimary: '#292524',
      textSecondary: '#44403C',
      textMuted: '#78716C',
      textFaint: '#A8A29E',
      success: '#15803D',
      successBg: 'rgba(21, 128, 61, 0.12)',
      alert: '#DC2626',
      alertBg: 'rgba(220, 38, 38, 0.12)',
      scrollbarTrack: '#FFFBEB',
      scrollbarThumb: '#FDE68A',
    },
  },
  {
    id: 'alabaster-light',
    name: 'Crisp Alabaster (Day)',
    subtitle: 'Ultra clean white stone background with emerald green accents',
    isLight: true,
    preview: {
      bg: '#F8FAFC',
      card: '#FFFFFF',
      accent: '#059669',
      border: '#E2E8F0',
    },
    vars: {
      bgDark: '#F8FAFC',
      cardDark: '#FFFFFF',
      cardSurface: '#F1F5F9',
      cardElevated: '#E2E8F0',
      borderDark: '#E2E8F0',
      borderSubtle: '#CBD5E1',
      borderHighlight: '#94A3B8',
      gold: '#059669',
      goldLight: '#10B981',
      goldMuted: 'rgba(5, 150, 105, 0.12)',
      textPrimary: '#020617',
      textSecondary: '#0F172A',
      textMuted: '#475569',
      textFaint: '#64748B',
      success: '#059669',
      successBg: 'rgba(5, 150, 105, 0.12)',
      alert: '#E11D48',
      alertBg: 'rgba(225, 29, 72, 0.12)',
      scrollbarTrack: '#F8FAFC',
      scrollbarThumb: '#CBD5E1',
    },
  },
];

const THEME_STORAGE_KEY = 'weekly_ledger_color_scheme';
const CUSTOM_BG_KEY = 'weekly_ledger_custom_bg';

// Helper to determine if a theme ID is a day/light theme
export function isDayMode(themeId: ColorSchemeId): boolean {
  if (themeId === 'custom-bg') {
    const customHex = getSavedCustomBg();
    return getLuminance(customHex) > 0.45;
  }
  const scheme = COLOR_SCHEMES.find((s) => s.id === themeId);
  return !!scheme?.isLight;
}

// Compute luminance of hex color
export function getLuminance(hex: string): number {
  try {
    let clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map((c) => c + c).join('');
    }
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    return 0.2126 * (r || 0) + 0.7152 * (g || 0) + 0.0722 * (b || 0);
  } catch {
    return 0.1;
  }
}

// Dynamically generate color scheme config for a custom hex background
export function createCustomColorScheme(bgHex: string): ColorSchemeConfig {
  const lum = getLuminance(bgHex);
  const isLight = lum > 0.45;

  if (isLight) {
    return {
      id: 'custom-bg',
      name: 'Custom Day Canvas',
      subtitle: `Custom background (${bgHex}) with reverse high-contrast text`,
      isLight: true,
      preview: {
        bg: bgHex,
        card: '#FFFFFF',
        accent: '#B45309',
        border: '#CBD5E1',
      },
      vars: {
        bgDark: bgHex,
        cardDark: '#FFFFFF',
        cardSurface: '#F8FAFC',
        cardElevated: '#F1F5F9',
        borderDark: '#E2E8F0',
        borderSubtle: '#CBD5E1',
        borderHighlight: '#94A3B8',
        gold: '#B45309',
        goldLight: '#D97706',
        goldMuted: 'rgba(180, 83, 9, 0.15)',
        textPrimary: '#0F172A',
        textSecondary: '#1E293B',
        textMuted: '#64748B',
        textFaint: '#94A3B8',
        success: '#16A34A',
        successBg: 'rgba(22, 163, 74, 0.12)',
        alert: '#DC2626',
        alertBg: 'rgba(220, 38, 38, 0.12)',
        scrollbarTrack: bgHex,
        scrollbarThumb: '#CBD5E1',
      },
    };
  }

  // Dark custom theme
  return {
    id: 'custom-bg',
    name: 'Custom Night Canvas',
    subtitle: `Custom background (${bgHex}) with crisp white text`,
    isLight: false,
    preview: {
      bg: bgHex,
      card: '#121212',
      accent: '#D4AF37',
      border: '#262626',
    },
    vars: {
      bgDark: bgHex,
      cardDark: '#121212',
      cardSurface: '#181818',
      cardElevated: '#202020',
      borderDark: '#262626',
      borderSubtle: '#333333',
      borderHighlight: '#444444',
      gold: '#D4AF37',
      goldLight: '#E5C158',
      goldMuted: 'rgba(212, 175, 55, 0.15)',
      textPrimary: '#FFFFFF',
      textSecondary: '#E0E0E0',
      textMuted: '#888888',
      textFaint: '#555555',
      success: '#22C55E',
      successBg: 'rgba(34, 197, 94, 0.12)',
      alert: '#EF4444',
      alertBg: 'rgba(239, 68, 68, 0.12)',
      scrollbarTrack: bgHex,
      scrollbarThumb: '#2A2A2A',
    },
  };
}

export function getSavedCustomBg(): string {
  try {
    return localStorage.getItem(CUSTOM_BG_KEY) || '#0A0A0A';
  } catch {
    return '#0A0A0A';
  }
}

export function saveCustomBg(hex: string): void {
  try {
    localStorage.setItem(CUSTOM_BG_KEY, hex);
  } catch (err) {
    console.error('Failed to save custom background:', err);
  }
}

export function getSavedColorScheme(): ColorSchemeId {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && (COLOR_SCHEMES.some((s) => s.id === saved) || saved === 'custom-bg')) {
      return saved as ColorSchemeId;
    }
  } catch {
    // fallback
  }
  return 'sophisticated-dark';
}

export function saveColorScheme(themeId: ColorSchemeId): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
    applyColorSchemeToDOM(themeId);
  } catch (err) {
    console.error('Failed to save color scheme:', err);
  }
}

// 1-Click Toggle between Night (Black) and Day (White) Mode
export function toggleNightDay(currentTheme: ColorSchemeId): ColorSchemeId {
  if (isDayMode(currentTheme)) {
    // Switch from Day to Night (Black)
    return 'sophisticated-dark';
  } else {
    // Switch from Night to Day (White)
    return 'pure-white';
  }
}

export function applyColorSchemeToDOM(themeId: ColorSchemeId, customHex?: string): void {
  let scheme: ColorSchemeConfig;

  if (themeId === 'custom-bg') {
    const hex = customHex || getSavedCustomBg();
    scheme = createCustomColorScheme(hex);
  } else {
    scheme = COLOR_SCHEMES.find((s) => s.id === themeId) || COLOR_SCHEMES[0];
  }

  const root = document.documentElement;

  root.setAttribute('data-theme', scheme.id);
  if (scheme.isLight) {
    root.classList.add('theme-light');
    root.classList.remove('theme-dark');
  } else {
    root.classList.add('theme-dark');
    root.classList.remove('theme-light');
  }

  // Update CSS variables directly on root
  Object.entries(scheme.vars).forEach(([key, val]) => {
    const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVarName, val);
  });
}
