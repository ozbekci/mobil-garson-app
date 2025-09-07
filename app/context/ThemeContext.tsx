import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark';

interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  error: string;
  success: string;
  warning: string;
}

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
  isDark: boolean;
}

const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F9FAFB',
  primary: '#FF7F00',
  secondary: '#6B7280',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  accent: '#3B82F6',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
};

const darkColors: ThemeColors = {
  background: '#111827',
  surface: '#1F2937',
  primary: '#FF7F00',
  secondary: '#9CA3AF',
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  border: '#374151',
  accent: '#60A5FA',
  error: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('light');

  // AsyncStorage'dan tema tercihini yükle
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          setTheme(savedTheme);
        }
      } catch (error) {
        console.error('Tema yükleme hatası:', error);
      }
    };
    
    loadTheme();
  }, []);

  // Tema değiştiğinde AsyncStorage'a kaydet
  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    try {
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Tema kaydetme hatası:', error);
    }
  };

  const colors = theme === 'light' ? lightColors : darkColors;
  const isDark = theme === 'dark';

  const value: ThemeContextType = {
    theme,
    colors,
    toggleTheme,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeProvider;
