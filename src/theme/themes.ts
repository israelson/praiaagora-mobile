// Light theme (current)
export const lightTheme = {
  colors: {
    primary: '#0ea5e9',
    primaryDark: '#0284c7',
    primaryLight: '#38bdf8',
    secondary: '#06b6d4',
    accent: '#f59e0b',
    
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    background: '#f8fafc',
    surface: '#ffffff',
    card: '#ffffff',
    
    text: '#1e293b',
    textSecondary: '#64748b',
    textLight: '#94a3b8',
    textInverse: '#ffffff',
    
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    
    crowdLow: '#10b981',
    crowdModerate: '#f59e0b',
    crowdHigh: '#f97316',
    crowdVeryHigh: '#ef4444',
    
    waterExcellent: '#10b981',
    waterGood: '#3b82f6',
    waterRegular: '#f59e0b',
    waterBad: '#ef4444',
  },
};

// Dark theme
export const darkTheme = {
  colors: {
    primary: '#38bdf8',
    primaryDark: '#0ea5e9',
    primaryLight: '#7dd3fc',
    secondary: '#22d3ee',
    accent: '#fbbf24',
    
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
    
    background: '#0f172a', // slate-900
    surface: '#1e293b', // slate-800
    card: '#1e293b',
    
    text: '#f1f5f9', // slate-100
    textSecondary: '#cbd5e1', // slate-300
    textLight: '#94a3b8', // slate-400
    textInverse: '#0f172a',
    
    border: '#334155', // slate-700
    borderLight: '#475569', // slate-600
    
    crowdLow: '#34d399',
    crowdModerate: '#fbbf24',
    crowdHigh: '#fb923c',
    crowdVeryHigh: '#f87171',
    
    waterExcellent: '#34d399',
    waterGood: '#60a5fa',
    waterRegular: '#fbbf24',
    waterBad: '#f87171',
  },
};

export const commonTheme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};

export type Theme = typeof lightTheme & typeof commonTheme;
