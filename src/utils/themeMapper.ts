import type { ThemeDefinition } from '../types/theme';
import { theme as baseTheme } from '../theme/appTheme';

export const mapDbThemeToStyled = (dbTheme: ThemeDefinition) => {
    const isDark = dbTheme.isDark;

    // 1. Define the shadow object based on mode
    const cardShadowObject = isDark 
        ? { // Dark Mode Shadow
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
            elevation: 3
          }
        : { // Light Mode Shadow
            shadowColor: dbTheme.accentColor || baseTheme.colors.accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 6 
          };

    return {
        ...baseTheme, // Now safely spreads fonts, hover, etc.
        id: dbTheme.id,
        name: dbTheme.name,
        isDark: isDark,
        
        colors: {
            ...baseTheme.colors, // Fallback defaults

            // --- MAPPINGS ---
            // DB (primaryColor) -> Styled (primary)
            primary: dbTheme.primaryColor,
            accent: dbTheme.accentColor,
            background: dbTheme.backgroundColor,
            text: dbTheme.textColor,
            card: dbTheme.cardColor,
            button: dbTheme.buttonColor,

            // Optional fields with fallbacks
            buttonText: dbTheme.buttonTextColor || (isDark ? '#1e1e1e' : '#ffffff'),
            textSecondary: dbTheme.secondaryTextColor || (isDark ? '#cccccc' : '#6b6b6b'),
            border: dbTheme.borderColor || (isDark ? '#444444' : '#e0d7fa'),
            
            // Logic-based fields
            navBg: dbTheme.navColor || (isDark ? 'rgba(30,30,30,0.9)' : 'rgba(255, 255, 255, 0.85)'),
            buttonHover: isDark ? '#d3a9ff' : '#8642b7ff',
            
            // Gradients
            pageBg: isDark 
                ? `linear-gradient(180deg, ${dbTheme.backgroundColor} 0%, #241B33 100%)` 
                : `linear-gradient(180deg, ${dbTheme.backgroundColor} 0%, #F4EEFF 100%)`,

            // Text variations
            mainTitle: dbTheme.textColor, 
            mainSubtitle: isDark ? '#cfa5ff' : '#7A2CC4',
            creatorName: isDark ? '#ddafff' : '#8045C4',
        },

        shadows: {
            card: cardShadowObject 
        }
    };
};