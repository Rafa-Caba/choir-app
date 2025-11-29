// utils/textUtils.ts

export const getPreviewFromRichText = (content: any, limit = 5000): string => {
    if (!content) return '';

    let jsonContent = content;

    // 1. Handle Stringified JSON
    if (typeof content === 'string') {
        try {
            jsonContent = JSON.parse(content);
        } catch (e) {
            return content.substring(0, limit);
        }
    }

    // 2. Handle TipTap JSON Structure
    try {
        if (jsonContent.type === 'doc' && Array.isArray(jsonContent.content)) {
            let text = '';

            jsonContent.content.forEach((block: any) => {
                // Handle Paragraphs
                if (block.type === 'paragraph') {
                    if (block.content && Array.isArray(block.content)) {
                        block.content.forEach((inline: any) => {
                            // A. Standard Text
                            if (inline.type === 'text' && inline.text) {
                                text += inline.text;
                            }
                            // B. Hard Breaks (<br>)
                            else if (inline.type === 'hardBreak') {
                                text += '\n';
                            }
                        });
                    }
                    // End of paragraph = New Line
                    text += '\n';
                }
            });

            return text.trim().substring(0, limit);
        }

        // Fallback
        if (jsonContent.text) return jsonContent.text;

    } catch (error) {
        console.warn("Rich Text Parse Error", error);
    }

    return '';
};