export interface Theme {
    id: string;
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

    // Optional / Extra
    buttonTextColor: string;
    secondaryTextColor: string;
    borderColor: string;

    createdAt?: string;
    updatedAt?: string;
}

export interface CreateThemePayload {
    name: string;
    isDark: boolean;
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    cardColor: string;
    buttonColor: string;
    navColor: string;
    buttonTextColor: string;
    secondaryTextColor: string;
    borderColor: string;
}