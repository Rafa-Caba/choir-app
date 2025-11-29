export interface SocialLinks {
    facebook: string;
    instagram: string;
    youtube: string;
    whatsapp: string;
    email: string;
}

export interface HomeLegends {
    principal: string;
    secondary: string;
}

export interface AppSettings {
    id: string;
    webTitle: string;
    contactPhone: string;

    logoUrl?: string;

    socials: SocialLinks;
    homeLegends: HomeLegends;

    // Rich Text JSON
    history: {
        type: string;
        content?: any[];
    };

    updatedAt: string;
}

// Payload for updating
export interface UpdateSettingsPayload {
    webTitle?: string;
    contactPhone?: string;
    socials?: SocialLinks;
    homeLegends?: HomeLegends;
    history?: {
        type: string;
        content: any[];
    };
}