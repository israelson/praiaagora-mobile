import { lightTheme, darkTheme, commonTheme } from './themes';

// Para compatibilidade com código existente que usa import { theme }
export const theme = {
  ...lightTheme,
  ...commonTheme,
};

export type Theme = typeof theme;

// Export dos temas individuais
export { lightTheme, darkTheme, commonTheme };

// Export do hook e provider
export { useTheme, ThemeProvider } from '../contexts/ThemeContext';

