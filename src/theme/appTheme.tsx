import { StyleSheet } from 'react-native';

export const colores = {
    primary: '#5856D6',
}

// This 'theme' object now matches your DefaultTheme interface perfectly
export const theme = {
    isDark: false,
    colors: {
        // Core Colors (Renamed to match styled.d.ts)
        primary: "#a88ff7", 
        accent: "#673ab7",
        background: "#fefefe",
        text: "#2a2a2a",
        card: "#ffffff",
        button: "#6a0dad",
        
        // Text Colors
        buttonText: '#ffffff',
        textSecondary: '#6b6b6b',
        mainTitle: '#2B2B2B',
        mainSubtitle: '#7A2CC4',
        creatorName: '#8045C4',

        // Structural
        border: '#e0d7fa',
        navBg: 'rgba(255, 255, 255, 0.85)',
        sidebarBg: 'rgba(245, 240, 255, 0.75)',
        
        // Visuals
        buttonHover: '#8642b7ff',
        waveTop: '#ffffff',
        waveBottom: '#c3abf5',
        pageBg: 'linear-gradient(180deg, #FEFEFE 0%, #F4EEFF 100%)',
        
        // Legacy/Web Shadows (Optional, kept for compatibility)
        cardBackground: 'rgba(238, 226, 255, 0.15)',
        cardShadow: '0 4px 12px rgba(162, 142, 227, 0.4)',
        cardHoverShadow: '0 6px 20px rgba(168, 143, 247, 0.25)',
    },
    // Native Shadows
    shadows: {
        card: {
            shadowColor: "#673ab7",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 6
        }
    },
    fonts: {
        main: "System", // Changed to System for React Native compatibility
        handwritten: "System",
        boldHandwritten: "System",
    },
    hover: {
        cardHover: 'rgba(168, 143, 247, 0.05)',
    },
};

// Keep your StyleSheet as is, it is fine
export const styles = StyleSheet.create({
    globalMargin: {
        marginHorizontal: 10
    },
    title: {
        fontSize: 28,
        marginBottom: 5,
        fontWeight: 'bold'
    },
    texto: {
        fontSize: 20,
        marginBottom: 10
    },
    // ... rest of your styles ...
    switchContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start',
        flexDirection: 'row',
    },
});