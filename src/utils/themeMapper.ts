import type { ThemeDefinition } from '../types/theme';
import { theme as baseTheme } from '../theme/appTheme'; // Import your default static theme as a fallback/base

export const mapDbThemeToStyled = (dbTheme: ThemeDefinition) => {
    const isDark = dbTheme.isDark;

    return {
        ...baseTheme, // Keep fonts and structure
        isDark: isDark,
        colors: {
            ...baseTheme.colors,
            // Overwrite with DB values
            primary: dbTheme.primaryColor,
            accent: dbTheme.accentColor,
            background: dbTheme.backgroundColor,
            text: dbTheme.textColor,
            card: dbTheme.cardColor,
            button: dbTheme.buttonColor,
            
            // Derived Values (Logic to make it look good based on isDark)
            buttonText: isDark ? '#000' : '#fff',
            border: isDark ? '#444' : '#e0d7fa',
            
            // Complex Gradients/Colors logic
            // If DB doesn't send navColor, calculate it
            navBg: dbTheme.navColor || (isDark ? 'rgba(30,30,30,0.9)' : 'rgba(255, 255, 255, 0.85)'),
            
            // Determine shadows based on mode
            cardShadow: isDark ? 'none' : '0 4px 12px rgba(162, 142, 227, 0.4)',
            textSecondary: isDark ? '#ccc' : '#6b6b6b',
        },
        // You can map other properties here if needed
    };
};