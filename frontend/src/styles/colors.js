/**
 * Цветовая палитра проекта UGC Market
 * Основана на цветах логотипа и дизайн-системе
 */

// Основной цвет из логотипа
export const PRIMARY_COLOR = {
  base: '#282D4E', // Темно-синий
  light: '#3A4169', // Светлее основного
  dark: '#1C2038', // Темнее основного
  contrast: '#FFFFFF', // Контрастный цвет для текста
};

// Акцентные цвета
export const ACCENT_COLORS = {
  primary: '#E95C4B', // Новый акцентный цвет
  secondary: '#3D8BFF', // Синий
  tertiary: '#FF6B6B', // Красный
};

// Нейтральные цвета
export const NEUTRAL_COLORS = {
  white: '#FFFFFF',
  lightest: '#F7F9FC',
  lighter: '#EEF1F8',
  light: '#DDE3F0',
  medium: '#A0AEC0',
  dark: '#718096',
  darker: '#4A5568',
  darkest: '#2D3748',
  black: '#1A202C',
};

// Семантические цвета
export const SEMANTIC_COLORS = {
  success: '#10B981', // Зеленый
  warning: '#F59E0B', // Оранжевый
  error: '#EF4444', // Красный
  info: '#3D8BFF', // Синий
};

// Градиенты
export const GRADIENTS = {
  primary: 'linear-gradient(90deg, #E95C4B 0%, #3D8BFF 100%)',
  secondary: 'linear-gradient(90deg, #3D8BFF 0%, #10B981 100%)',
  tertiary: 'linear-gradient(90deg, #E95C4B 0%, #FF6B6B 100%)',
};

// HSL цвета для Tailwind CSS
export const HSL_COLORS = {
  // Светлая тема
  light: {
    background: '220 33% 98%',
    foreground: '222 47% 11%',
    primary: '6 75% 60%',
    'primary-foreground': '0 0% 100%',
    secondary: '214 100% 62%',
    'secondary-foreground': '0 0% 100%',
    muted: '220 14% 96%',
    'muted-foreground': '220 9% 46%',
    accent: '6 75% 60%',
    'accent-foreground': '222 47% 11%',
    border: '214.3 31.8% 91.4%',
    ring: '6 75% 60%',
  },
  // Темная тема
  dark: {
    background: '222 47% 11%',
    foreground: '210 40% 98%',
    primary: '6 75% 60%',
    'primary-foreground': '0 0% 100%',
    secondary: '214 100% 62%',
    'secondary-foreground': '0 0% 100%',
    muted: '217 33% 17%',
    'muted-foreground': '215 20.2% 65.1%',
    accent: '6 75% 60%',
    'accent-foreground': '0 0% 100%',
    border: '217 33% 17%',
    ring: '6 75% 60%',
  },
};
