// src/constants/chatStickers.ts

export interface ChatSticker {
    readonly id: string;
    readonly value: string;
    readonly label: string;
}

export interface ChatStickerPack {
    readonly id: string;
    readonly label: string;
    readonly icon: string;
    readonly stickers: readonly ChatSticker[];
}

export const CHAT_STICKER_PACKS: readonly ChatStickerPack[] = [
    {
        id: 'expressions',
        label: 'Expresiones',
        icon: '😀',
        stickers: [
            { id: 'smile', value: '😀', label: 'Sonrisa' },
            { id: 'laugh', value: '😂', label: 'Risa' },
            { id: 'love', value: '😍', label: 'Me encanta' },
            { id: 'angel', value: '😇', label: 'Ángel' },
            { id: 'hug', value: '🤗', label: 'Abrazo' },
            { id: 'wink', value: '😉', label: 'Guiño' },
            { id: 'thinking', value: '🤔', label: 'Pensando' },
            { id: 'wow', value: '🤩', label: 'Asombro' },
            { id: 'happy-tears', value: '🥹', label: 'Emoción' },
            { id: 'cool', value: '😎', label: 'Genial' },
            { id: 'sleepy', value: '😴', label: 'Sueño' },
            { id: 'oops', value: '😅', label: 'Ups' }
        ]
    },
    {
        id: 'faith',
        label: 'Fe',
        icon: '🙏',
        stickers: [
            { id: 'pray', value: '🙏', label: 'Oración' },
            { id: 'cross', value: '✝️', label: 'Cruz' },
            { id: 'church', value: '⛪', label: 'Iglesia' },
            { id: 'peace', value: '🕊️', label: 'Paz' },
            { id: 'heart-white', value: '🤍', label: 'Corazón blanco' },
            { id: 'heart-purple', value: '💜', label: 'Corazón morado' },
            { id: 'candle', value: '🕯️', label: 'Vela' },
            { id: 'blessing', value: '🙌', label: 'Bendición' },
            { id: 'sparkles', value: '✨', label: 'Destellos' },
            { id: 'star', value: '⭐', label: 'Estrella' },
            { id: 'rainbow', value: '🌈', label: 'Arcoíris' },
            { id: 'sunrise', value: '🌅', label: 'Amanecer' }
        ]
    },
    {
        id: 'music',
        label: 'Música',
        icon: '🎶',
        stickers: [
            { id: 'music', value: '🎶', label: 'Música' },
            { id: 'microphone', value: '🎤', label: 'Micrófono' },
            { id: 'notes', value: '🎵', label: 'Notas' },
            { id: 'headphones', value: '🎧', label: 'Audífonos' },
            { id: 'piano', value: '🎹', label: 'Piano' },
            { id: 'guitar', value: '🎸', label: 'Guitarra' },
            { id: 'drum', value: '🥁', label: 'Tambor' },
            { id: 'violin', value: '🎻', label: 'Violín' },
            { id: 'trumpet', value: '🎺', label: 'Trompeta' },
            { id: 'saxophone', value: '🎷', label: 'Saxofón' },
            { id: 'choir', value: '👥', label: 'Coro' },
            { id: 'music-score', value: '🎼', label: 'Partitura' }
        ]
    },
    {
        id: 'community',
        label: 'Comunidad',
        icon: '🎉',
        stickers: [
            { id: 'heart', value: '❤️', label: 'Corazón' },
            { id: 'clap', value: '👏', label: 'Aplausos' },
            { id: 'party', value: '🎉', label: 'Celebración' },
            { id: 'confetti', value: '🥳', label: 'Fiesta' },
            { id: 'thumbs-up', value: '👍', label: 'Me gusta' },
            { id: 'high-five', value: '🫶', label: 'Con cariño' },
            { id: 'strong', value: '💪', label: 'Ánimo' },
            { id: 'fire', value: '🔥', label: 'Excelente' },
            { id: 'coffee', value: '☕', label: 'Café' },
            { id: 'cake', value: '🎂', label: 'Cumpleaños' },
            { id: 'gift', value: '🎁', label: 'Regalo' },
            { id: 'flowers', value: '💐', label: 'Flores' }
        ]
    }
];
