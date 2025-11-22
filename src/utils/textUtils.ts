export const getPreviewFromRichText = (json: any, maxLength = 100): string => {
    try {
        if (!json) return '';
        
        // If it's just a string (legacy data), return it
        if (typeof json === 'string') return json;

        // If it's the JSON object
        if (!json.content || !Array.isArray(json.content)) return '';
        
        let text = '';

        // Traverse the JSON to find text nodes
        // This relies on the standard Tiptap/ProseMirror structure
        for (const node of json.content) {
            if (node.content && Array.isArray(node.content)) {
                for (const innerNode of node.content) {
                    if (innerNode.type === 'text' && innerNode.text) {
                        text += innerNode.text + ' ';
                    }
                }
            }
            // Add a newline for paragraphs
            if (node.type === 'paragraph') text += '\n';
        }

        text = text.trim();

        return text.length > maxLength 
            ? text.substring(0, maxLength) + '...' 
            : text;
    } catch (e) {
        return 'Ver contenido...';
    }
};