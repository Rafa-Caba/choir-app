import 'styled-components/native';

declare module 'styled-components/native' {
    export interface DefaultTheme {
        id: string;
        name: string;
        isDark: boolean;
        colors: {
            // Core
            primary: string;
            accent: string;
            background: string;
            text: string;
            card: string;
            button: string;
            
            // Text
            buttonText: string;
            textSecondary: string;
            mainTitle: string;
            mainSubtitle: string;
            creatorName: string;
            
            // Structural
            border: string;
            navBg: string; // Note: Mapper outputs 'navBg', not 'navColor'
            sidebarBg: string;
            
            // Visuals
            buttonHover: string;
            waveTop: string;
            waveBottom: string;
            pageBg: string;
            cardBackground: string;
            
            // Legacy
            cardShadow: string;      
            cardHoverShadow: string; 
        };
        shadows: {
            card: {
                shadowColor: string;
                shadowOffset: { width: number; height: number };
                shadowOpacity: number;
                shadowRadius: number;
                elevation: number;
            };
        };
        fonts: {
            main: string;
            handwritten: string;
            boldHandwritten: string;
        };
        hover: {
            cardHover: string;
        };
    }
}