// Shared color tokens for Gym Management (React)
// Usage:
// import colors from 'src/shared/theme/colors';
// const { primary, background } = colors;

const colors = {
  // Brand / primary
  primary: '#0D47A1',        // deep blue (brand)
  primaryVariant: '#08316A', // darker

  // Secondary / accents
  secondary: '#00897B',      // teal
  secondaryVariant: '#00695C',
  accent: '#FFB300',         // warm amber for CTAs

  // Surfaces & backgrounds
  background: '#F5F7FA',     // very light
  surface: '#FFFFFF',

  // Text
  textPrimary: '#0B2545',    // near-black blue for main text
  textSecondary: '#546E7A',  // muted
  muted: '#9E9E9E',

  // Borders, dividers
  border: '#E0E0E0',

  // System colors
  success: '#2E7D32',
  warning: '#F57C00',
  error: '#D32F2F',

  // QR / scan-specific
  qrScan: '#1976D2',         // bright blue for scan indicator
  overlay: 'rgba(11,37,69,0.6)', // overlay used during scanning
};

export const cssVars = () => {
  return Object.entries(colors).map(([k, v]) => `--color-${k}:${v};`).join('\n');
};

export default colors;
