import 'styled-components/native';

declare module 'styled-components/native' {
    export interface DefaultTheme {
        id: number;
        name: string;
        isDark: boolean;
        colors: {
            primary: string;
            accent: string;
            background: string;
            text: string;
            button: string;
            buttonHover: string;
            waveTop: string;
            waveBottom: string;
            mainTitle: string;
            mainSubtitle: string;
            creatorName: string;
            buttonText: string;
            card: string;
            border: string;
            navBg: string;
            sidebarBg: string;
            pageBg: string;
            cardBackground: string;
            cardShadow: string;      // Kept for legacy references
            cardHoverShadow: string; // Kept for legacy references
            textSecondary: string;
        };
        shadows: {
        // We updated this to be an Object for React Native styles
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