import type { ThemeDefinition } from '../types/theme';
import { theme as baseTheme } from '../theme/appTheme'; // Import your default static theme as a fallback/base

export const mapDbThemeToStyled = (dbTheme: ThemeDefinition) => {
    // 1. Handle Hardcoded Themes (Clásico/Noche) - Keep this if you want strict matching
    // ... (keep your existing check for 'Noche'/'Clásico' here) ...

    const isDark = dbTheme.isDark;

    return {
        ...baseTheme,
        isDark: isDark,
        colors: {
            ...baseTheme.colors,
            // Direct Mappings
            primary: dbTheme.primaryColor,
            accent: dbTheme.accentColor,
            background: dbTheme.backgroundColor,
            text: dbTheme.textColor,
            card: dbTheme.cardColor,
            button: dbTheme.buttonColor,
            navBg: dbTheme.navColor || (isDark ? 'rgba(30,30,30,0.9)' : 'rgba(255, 255, 255, 0.85)'),

            // --- NEW MAPPINGS (With Fallbacks) ---
            buttonText: dbTheme.buttonTextColor || (isDark ? '#1e1e1e' : '#ffffff'),
            textSecondary: dbTheme.secondaryTextColor || (isDark ? '#cccccc' : '#6b6b6b'),
            border: dbTheme.borderColor || (isDark ? '#4c3e64' : '#e0d7fa'),

            // Derived Complex Values (Gradients/Shadows) - Keep these calculated
            pageBg: isDark 
                ? `linear-gradient(180deg, ${dbTheme.backgroundColor} 0%, #241B33 100%)` 
                : `linear-gradient(180deg, ${dbTheme.backgroundColor} 0%, #F4EEFF 100%)`,
            
            // Determine shadows based on mode
            cardShadow: isDark ? 'none' : '0 4px 12px rgba(162, 142, 227, 0.4)',
        }
    };
};