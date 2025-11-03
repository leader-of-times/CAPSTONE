const tokens = {
  colors: {
    // Uber-exact black/white/red palette
    black: '#000000',
    white: '#FFFFFF',
    gray900: '#1A1A1A',
    gray800: '#333333',
    gray700: '#545454',
    gray600: '#6B6B6B',
    gray500: '#8E8E8E',
    gray400: '#B3B3B3',
    gray300: '#CCCCCC',
    gray200: '#E2E2E2',
    gray100: '#F5F5F5',
    
    // Accent colors (Uber red as primary)
    primary: '#EF4444',
    primaryDark: '#DC2626',
    primaryLight: '#F87171',
    
    // Status colors
    success: '#2ECC71',
    info: '#276EF1',
    warning: '#F59E0B',
    danger: '#EF4444',
    
    // Semantic aliases
    background: '#FFFFFF',
    backgroundDark: '#000000',
    surface: '#FFFFFF',
    surfaceDark: '#1A1A1A',
    text: '#000000',
    textInverse: '#FFFFFF',
    textMuted: '#6B6B6B',
    border: '#E2E2E2',
    borderDark: '#333333',
  },
  spacing: [4, 8, 12, 16, 20, 24, 32, 40, 48],
  radius: { 
    none: 0,
    sm: 4, 
    md: 8, 
    lg: 12,
    xl: 16,
    pill: 999 
  },
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    }
  },
  typography: {
    h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
    h2: { fontSize: 22, fontWeight: '600', letterSpacing: -0.3 },
    h3: { fontSize: 18, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: '400' },
    bodyMedium: { fontSize: 16, fontWeight: '500' },
    caption: { fontSize: 14, fontWeight: '400' },
    small: { fontSize: 12, fontWeight: '400' }
  }
};

export default tokens;
