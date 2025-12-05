// Convert TipTap-style JSON -> plain text (each paragraph becomes a line)
export const tiptapToPlainText = (jsonContent: any): string => {
    if (!jsonContent || jsonContent.type !== 'doc' || !Array.isArray(jsonContent.content)) {
        return '';
    }

    const lines: string[] = [];

    jsonContent.content.forEach((block: any) => {
        if (block.type !== 'paragraph') return;

        if (!block.content || !Array.isArray(block.content) || block.content.length === 0) {
            lines.push('');
            return;
        }

        let line = '';
        block.content.forEach((inline: any) => {
            if (inline.type === 'text' && inline.text) {
                line += inline.text;
            } else if (inline.type === 'hardBreak') {
                line += '\n';
            }
        });

        lines.push(line);
    });

    return lines.join('\n');
};

export const plainTextToTiptap = (text: string) => {
    const paragraphs = text.split('\n').map((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
            return {
                type: 'paragraph',
                attrs: { textAlign: 'left' },
                content: [],
            };
        }

        return {
            type: 'paragraph',
            attrs: { textAlign: 'left' },
            content: [
                {
                    type: 'text',
                    text: line,
                },
            ],
        };
    });

    return {
        type: 'doc',
        content: paragraphs,
    };
};
