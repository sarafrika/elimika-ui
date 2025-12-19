type Shade = '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '950';

type ColorScale = Record<Shade, string>;

const brand: ColorScale = {
  50: '#eef4ff',
  100: '#dbe8ff',
  200: '#b8d1ff',
  300: '#8db5ff',
  400: '#5a92ff',
  500: '#1f74ff',
  600: '#0a63f5',
  700: '#0050d6',
  800: '#0f3da3',
  900: '#0f2b6b',
  950: '#07163b',
};

const highlight: ColorScale = {
  50: '#effdfb',
  100: '#d0f7f0',
  200: '#a4ede2',
  300: '#71dfd3',
  400: '#45c7c1',
  500: '#1dafb0',
  600: '#118d92',
  700: '#136f73',
  800: '#145659',
  900: '#123f41',
  950: '#072223',
};

const neutrals: ColorScale = {
  50: '#f7f9fc',
  100: '#eff2f8',
  200: '#dde3ee',
  300: '#c7cfe0',
  400: '#a3aec4',
  500: '#7b859f',
  600: '#5c6276',
  700: '#45495c',
  800: '#2f3243',
  900: '#1c1f2b',
  950: '#0d1019',
};

const accent = {
  azure: '#5ad1ff',
  iris: '#816bff',
  blush: '#ff7dc4',
  amber: '#f5b649',
  jade: '#26d7a0',
};

// Chart colors optimized for data visualization in both light and dark modes
// Based on WCAG 3:1 contrast requirements for chart elements
const charts = {
  light: {
    primary: '#0a63f5', // Brand blue - strong and clear
    secondary: '#118d92', // Teal - good contrast with blue
    tertiary: '#f97316', // Orange - warm accent
    quaternary: '#10c180', // Green - positive association
    quinary: '#816bff', // Purple - distinct hue
    senary: '#ff5c5c', // Rose - attention grabbing
    septenary: '#f5b649', // Amber - warm complement
    octonary: '#45c7c1', // Light teal - softer option
  },
  dark: {
    primary: '#5a92ff', // Muted blue - easier on eyes
    secondary: '#45c7c1', // Lighter teal - better visibility
    tertiary: '#ff9837', // Lighter orange - maintains warmth
    quaternary: '#27d896', // Lighter green - pops in dark
    quinary: '#9d8aff', // Lighter purple - softer
    senary: '#ff8a8a', // Lighter rose - less harsh
    septenary: '#ffd298', // Lighter amber - warm glow
    octonary: '#71dfd3', // Brighter teal - clear distinction
  },
} as const;

const semantic = {
  info: {
    50: '#ecf3ff',
    100: '#d9e7ff',
    200: '#b3ceff',
    300: '#8cb6ff',
    400: '#6098ff',
    500: '#3b82f6',
    600: '#2364d7',
    700: '#154ab0',
    800: '#103890',
    900: '#112a66',
    950: '#0a1a40',
  } satisfies ColorScale,
  success: {
    50: '#ebfff7',
    100: '#c8fde7',
    200: '#93f7cf',
    300: '#56eab1',
    400: '#27d896',
    500: '#10c180',
    600: '#06a068',
    700: '#047c52',
    800: '#035f40',
    900: '#024435',
    950: '#01261f',
  } satisfies ColorScale,
  warning: {
    50: '#fff7ec',
    100: '#ffeacc',
    200: '#ffd298',
    300: '#ffb462',
    400: '#ff9837',
    500: '#f97316',
    600: '#dd510d',
    700: '#b13c0e',
    800: '#862e13',
    900: '#692511',
    950: '#3a1206',
  } satisfies ColorScale,
  danger: {
    50: '#fff1f1',
    100: '#ffe0e0',
    200: '#ffbaba',
    300: '#ff8a8a',
    400: '#ff5c5c',
    500: '#ef2f4b',
    600: '#cc1b3d',
    700: '#a21236',
    800: '#7f1131',
    900: '#60122c',
    950: '#360614',
  } satisfies ColorScale,
};

export const elimikaPalette = {
  brand,
  neutrals,
  highlight,
  accent,
  semantic,
  charts,
  gradients: {
    heroLight: 'none',
    heroDark: 'none',
    cardLight: 'none',
    cardDark: 'none',
  },
} as const;

export const elimikaThemeRoles = {
  light: {
    background: '#ffffff',
    surface: '#ffffff',
    surfaceMuted: neutrals[50],
    text: neutrals[900],
    textMuted: neutrals[500],
    primary: brand[600],
    primarySoft: brand[100],
    accent: brand[600],
    border: neutrals[200],
    ring: brand[500],
    success: semantic.success[500],
    warning: semantic.warning[500],
    danger: semantic.danger[500],
    info: semantic.info[500],
    sidebar: '#ffffff',
    sidebarBorder: neutrals[200],
    chart1: charts.light.primary,
    chart2: charts.light.secondary,
    chart3: charts.light.tertiary,
    chart4: charts.light.quaternary,
    chart5: charts.light.quinary,
    chart6: charts.light.senary,
    chart7: charts.light.septenary,
    chart8: charts.light.octonary,
  },
  dark: {
    background: neutrals[950],
    surface: neutrals[900],
    surfaceMuted: neutrals[800],
    text: '#f4f7ff',
    textMuted: neutrals[400],
    primary: brand[400],
    primarySoft: 'rgba(31, 116, 255, 0.15)',
    accent: accent.iris,
    border: 'rgba(255, 255, 255, 0.08)',
    ring: brand[400],
    success: semantic.success[400],
    warning: semantic.warning[400],
    danger: semantic.danger[400],
    info: semantic.info[400],
    sidebar: '#111527',
    sidebarBorder: 'rgba(255,255,255,0.08)',
    chart1: charts.dark.primary,
    chart2: charts.dark.secondary,
    chart3: charts.dark.tertiary,
    chart4: charts.dark.quaternary,
    chart5: charts.dark.quinary,
    chart6: charts.dark.senary,
    chart7: charts.dark.septenary,
    chart8: charts.dark.octonary,
  },
} as const;

export type ElimikaThemeMode = keyof typeof elimikaThemeRoles;

export const getBrandShade = (shade: Shade) => brand[shade];
export const getNeutralShade = (shade: Shade) => neutrals[shade];

// Helper to get chart colors array for the current theme mode
export const getChartColors = (mode: ElimikaThemeMode = 'light') => [
  charts[mode].primary,
  charts[mode].secondary,
  charts[mode].tertiary,
  charts[mode].quaternary,
  charts[mode].quinary,
  charts[mode].senary,
  charts[mode].septenary,
  charts[mode].octonary,
];
