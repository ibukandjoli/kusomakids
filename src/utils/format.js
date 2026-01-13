/**
 * Format a string for display, handling placeholders.
 * Replaces {childName} with [Son prénom].
 * 
 * @param {string} text - The input text (title, description, etc.)
 * @returns {string} - The formatted text for display
 */
export function formatTitle(text) {
    if (!text) return "";
    // Regex to optionally match curly braces around childName or just childName if users forgot braces (robustness)
    // But requirement is specifically {childName} -> [Son prénom]
    return text.replace(/\{childName\}/gi, '[Son prénom]');
}
