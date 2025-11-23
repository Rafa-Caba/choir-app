export interface ThemeDefinition {
    id: number;
    name: string;
    isDark: boolean;
    
    // Core Colors
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    cardColor: string;
    buttonColor: string;
    navColor: string;

    // --- NEW FIELDS ---
    buttonTextColor?: string;
    secondaryTextColor?: string;
    borderColor?: string;
}