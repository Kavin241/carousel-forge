import { DesignSpec } from './types';

export const CANVA_FREE_FONTS = [
  // Sans-serif
  'Montserrat', 'Raleway', 'Oswald', 'Nunito', 'Poppins',
  'Work Sans', 'DM Sans', 'Plus Jakarta Sans', 'Outfit',
  'Barlow', 'Urbanist', 'Jost', 'Manrope',
  // Serif
  'Playfair Display', 'Cormorant Garamond', 'DM Serif Display',
  'Libre Baskerville', 'Lora', 'Abril Fatface',
  // Display / Decorative
  'Bebas Neue', 'Anton', 'Black Han Sans',
  'Righteous', 'Bungee', 'Titan One',
  // Mono / Technical
  'Space Mono', 'JetBrains Mono', 'Fira Code',
  // Handwriting (use sparingly)
  'Caveat', 'Pacifico'
];

export const BASE_VIBES: Partial<DesignSpec>[] = [
  {
    vibeName: 'Bold Minimal',
    palette: { background: '#FFFFFF', primary: '#0A0A0A', accent: '#FF3B30', secondary: '#666666' },
    typography: {
      heading: { fontFamily: 'Bebas Neue', fontWeight: '400', letterSpacing: 0.02 },
      body: { fontFamily: 'Work Sans', fontWeight: '400', letterSpacing: 0 },
      accent: { fontFamily: 'Work Sans', fontWeight: '700', letterSpacing: 0.1 }
    },
    backgroundStyle: 'solid',
    layoutStyle: 'left_heavy',
    graphicElements: [
      { type: 'side_bar', position: { x: 0, y: 0, width: 1.5 }, color: 'accent', opacity: 1, size: 1 },
      { type: 'horizontal_rule', position: { x: 8, y: 78, width: 84 }, color: 'accent', opacity: 0.3, size: 1 }
    ]
  },
  {
    vibeName: 'Dark Editorial',
    palette: { background: '#0D0D0D', primary: '#F5F5F5', accent: '#7B2FFF', secondary: '#A3A3A3' },
    typography: {
      heading: { fontFamily: 'Playfair Display', fontWeight: '700', letterSpacing: -0.02 },
      body: { fontFamily: 'DM Sans', fontWeight: '400', letterSpacing: 0 },
      accent: { fontFamily: 'Space Mono', fontWeight: '400', letterSpacing: 0.05 }
    },
    backgroundStyle: 'solid',
    layoutStyle: 'centered',
    graphicElements: [
      { type: 'corner_tag', position: { x: 82, y: 82, width: 15 }, color: 'accent', opacity: 0.8, size: 1 },
      { type: 'circle_accent', position: { x: -5, y: -5, width: 30 }, color: 'accent', opacity: 0.06, size: 1 }
    ]
  },
  {
    vibeName: 'Neon Maximalist',
    palette: { background: '#050505', primary: '#FFFFFF', accent: '#00FF88', secondary: '#FF006E' },
    typography: {
      heading: { fontFamily: 'Anton', fontWeight: '400', letterSpacing: 0.01 },
      body: { fontFamily: 'Barlow', fontWeight: '400', letterSpacing: 0 },
      accent: { fontFamily: 'Space Mono', fontWeight: '400', letterSpacing: 0.08 }
    },
    backgroundStyle: 'solid',
    layoutStyle: 'asymmetric',
    graphicElements: [
      { type: 'background_shape', position: { x: 60, y: 0, width: 50 }, color: 'accent', opacity: 0.05, size: 1 },
      { type: 'slash_divider', position: { x: 8, y: 50, width: 84 }, color: 'secondary', opacity: 0.5, size: 1 }
    ]
  },
  {
    vibeName: 'Scrapbook',
    palette: { background: '#F5EDD6', primary: '#1A1008', accent: '#C4622D', secondary: '#5C4A2A' },
    typography: {
      heading: { fontFamily: 'Abril Fatface', fontWeight: '400', letterSpacing: -0.01 },
      body: { fontFamily: 'Lora', fontWeight: '400', letterSpacing: 0 },
      accent: { fontFamily: 'Caveat', fontWeight: '700', letterSpacing: 0 }
    },
    backgroundStyle: 'noise',
    layoutStyle: 'top_anchored',
    graphicElements: [
      { type: 'horizontal_rule', position: { x: 8, y: 35, width: 84 }, color: 'accent', opacity: 0.4, size: 1 },
      { type: 'dot_grid', position: { x: 70, y: 65, width: 25 }, color: 'secondary', opacity: 0.15, size: 1 }
    ]
  },
  {
    vibeName: 'Notes App',
    palette: { background: '#FAFAFA', primary: '#1C1C1E', accent: '#007AFF', secondary: '#8E8E93' },
    typography: {
      heading: { fontFamily: 'Plus Jakarta Sans', fontWeight: '700', letterSpacing: -0.01 },
      body: { fontFamily: 'Plus Jakarta Sans', fontWeight: '400', letterSpacing: 0 },
      accent: { fontFamily: 'Plus Jakarta Sans', fontWeight: '500', letterSpacing: 0 }
    },
    backgroundStyle: 'solid',
    layoutStyle: 'left_heavy',
    graphicElements: [
      { type: 'side_bar', position: { x: 8, y: 15, width: 0.8 }, color: 'accent', opacity: 1, size: 1 }
    ]
  },
  {
    vibeName: 'Retro Academic',
    palette: { background: '#2B1810', primary: '#F0E6D3', accent: '#D4A853', secondary: '#C4956A' },
    typography: {
      heading: { fontFamily: 'Cormorant Garamond', fontWeight: '700', letterSpacing: 0.02 },
      body: { fontFamily: 'Libre Baskerville', fontWeight: '400', letterSpacing: 0 },
      accent: { fontFamily: 'Raleway', fontWeight: '700', letterSpacing: 0.15 }
    },
    backgroundStyle: 'solid',
    layoutStyle: 'centered',
    graphicElements: [
      { type: 'corner_tag', position: { x: 5, y: 5, width: 12 }, color: 'accent', opacity: 0.6, size: 1 },
      { type: 'corner_tag', position: { x: 83, y: 83, width: 12 }, color: 'accent', opacity: 0.6, size: 1 }
    ]
  },
  {
    vibeName: 'Gradient Glass',
    palette: { background: '#0F0C29', primary: '#FFFFFF', accent: '#F64F59', secondary: 'rgba(255,255,255,0.6)' },
    typography: {
      heading: { fontFamily: 'Urbanist', fontWeight: '900', letterSpacing: -0.03 },
      body: { fontFamily: 'Manrope', fontWeight: '400', letterSpacing: 0 },
      accent: { fontFamily: 'Manrope', fontWeight: '500', letterSpacing: 0.05 }
    },
    backgroundStyle: 'gradient',
    gradientConfig: { angle: 135, colorStop1: '#0F0C29', colorStop2: '#302B63' },
    layoutStyle: 'centered',
    graphicElements: [
      { type: 'circle_accent', position: { x: 30, y: 10, width: 40 }, color: 'accent', opacity: 0.08, size: 1 }
    ]
  },
  {
    vibeName: 'Blueprint',
    palette: { background: '#0A1628', primary: '#E8F4FD', accent: '#00D4FF', secondary: '#7BA7C7' },
    typography: {
      heading: { fontFamily: 'Oswald', fontWeight: '700', letterSpacing: 0.05 },
      body: { fontFamily: 'JetBrains Mono', fontWeight: '400', letterSpacing: -0.01 },
      accent: { fontFamily: 'JetBrains Mono', fontWeight: '400', letterSpacing: 0.1 }
    },
    backgroundStyle: 'solid',
    layoutStyle: 'left_heavy',
    graphicElements: [
      { type: 'dot_grid', position: { x: 0, y: 0, width: 100 }, color: 'accent', opacity: 0.04, size: 1 },
      { type: 'side_bar', position: { x: 0, y: 0, width: 0.5 }, color: 'accent', opacity: 1, size: 1 }
    ]
  }
];
