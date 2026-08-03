// src/types/settings.ts

import type { JsonValue } from './json';

export interface SocialLinks {
    readonly facebook: string;
    readonly instagram: string;
    readonly youtube: string;
    readonly whatsapp: string;
    readonly email: string;
}

export interface HomeLegends {
    readonly principal: string;
    readonly secondary: string;
}

export interface RichTextDocument {
    readonly type: string;
    readonly content?: readonly JsonValue[];
}

export interface AppSettings {
    readonly id: string;
    readonly webTitle: string;
    readonly contactPhone: string;
    readonly logoUrl?: string;
    readonly cachedLogoUrl?: string | null;
    readonly socials: SocialLinks;
    readonly homeLegends: HomeLegends;
    readonly history: RichTextDocument;
    readonly updatedAt: string;
}

export interface UpdateSettingsPayload {
    readonly webTitle?: string;
    readonly contactPhone?: string;
    readonly socials?: SocialLinks;
    readonly homeLegends?: HomeLegends;
    readonly history?: RichTextDocument;
}
